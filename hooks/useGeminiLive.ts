import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveSession, LiveServerMessage } from '@google/genai';
import type { Language, TranscriptionEntry } from '../types';
import { Speaker } from '../types';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

type SessionStatus = 'Idle' | 'Connecting' | 'Listening' | 'Waiting' | 'Speaking' | 'Error';

export const useGeminiLive = (nativeLanguage: Language, targetLanguage: Language) => {
  const [transcript, setTranscript] = useState<TranscriptionEntry[]>([]);
  const [status, setStatus] = useState<SessionStatus>('Idle');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const isAiSpeakingRef = useRef(false);

  const addOrUpdateTranscript = useCallback((entry: Omit<TranscriptionEntry, 'isFinal'>) => {
    setTranscript(prev => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === entry.speaker && !last.isFinal) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: last.text + entry.text };
        return updated;
      }
      return [...prev, { ...entry, isFinal: false }];
    });
  }, []);

  const finalizeTranscript = useCallback((speaker: Speaker) => {
    setTranscript(prev => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && !last.isFinal) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, isFinal: true };
        return updated;
      }
      return prev;
    });
  }, []);
  
  const endSession = useCallback(async () => {
    setStatus('Idle');
    if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
        sessionPromiseRef.current = null;
    }
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    
    if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
    if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();

    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    mediaStreamRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    
    for (const source of audioSourcesRef.current.values()) {
        source.stop();
    }
    audioSourcesRef.current.clear();

  }, []);

  const startSession = useCallback(async () => {
    setStatus('Connecting');
    setTranscript([{ speaker: Speaker.System, text: 'Connecting to AI Tutor...', isFinal: true }]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Fix: Add type assertion for webkitAudioContext to support older browsers and resolve TypeScript error.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Fix: Add type assertion for webkitAudioContext to support older browsers and resolve TypeScript error.
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are Kai, a friendly and patient AI language teacher. The user's native language is ${nativeLanguage.name}. You are teaching them ${targetLanguage.name}. Start by greeting them warmly in ${targetLanguage.name} and then briefly explain the greeting's meaning in ${nativeLanguage.name}. Your primary goal is to get the user to speak. Keep your responses short, encouraging, and focused on simple, conversational phrases. Gently correct their pronunciation if needed. Wait for them to speak.`,
        },
        callbacks: {
          onopen: () => {
             setTranscript(prev => [...prev, { speaker: Speaker.System, text: 'Connection established. Start speaking!', isFinal: true }]);
             setStatus('Listening');
             
             const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
             mediaStreamSourceRef.current = source;
             const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
             scriptProcessorRef.current = scriptProcessor;

             scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                 const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                 const l = inputData.length;
                 const int16 = new Int16Array(l);
                 for (let i = 0; i < l; i++) {
                     int16[i] = inputData[i] * 32768;
                 }
                 const pcmBlob = {
                     data: encode(new Uint8Array(int16.buffer)),
                     mimeType: 'audio/pcm;rate=16000',
                 };
                
                 // Fix: Per guidelines, solely rely on sessionPromise to resolve and send input, removing redundant checks.
                 sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 });
             };
             source.connect(scriptProcessor);
             scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscriptionRef.current += text;
                addOrUpdateTranscript({ speaker: Speaker.User, text });
                isAiSpeakingRef.current = false;
                setStatus('Listening');
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
              addOrUpdateTranscript({ speaker: Speaker.AI, text });
              if (!isAiSpeakingRef.current) {
                finalizeTranscript(Speaker.User);
                isAiSpeakingRef.current = true;
              }
              setStatus('Speaking');
            }

            if (message.serverContent?.turnComplete) {
              finalizeTranscript(Speaker.AI);
              finalizeTranscript(Speaker.User);
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
              isAiSpeakingRef.current = false;
              setStatus('Listening');
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
                const audioContext = outputAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);

                const audioBuffer = await decodeAudioData(
                    decode(audioData),
                    audioContext,
                    24000,
                    1,
                );

                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                    if (audioSourcesRef.current.size === 0) {
                        setStatus('Listening');
                    }
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            setError(`An error occurred: ${e.message}`);
            setStatus('Error');
            endSession();
          },
          onclose: (e: CloseEvent) => {
             // Session closed
          },
        },
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
        if(err instanceof Error){
            setError(`Failed to start session: ${err.message}. Please allow microphone access.`);
        } else {
            setError('An unknown error occurred.');
        }
      setStatus('Error');
    }
  }, [nativeLanguage, targetLanguage, addOrUpdateTranscript, finalizeTranscript, endSession]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      endSession();
    };
  }, [endSession]);

  return { transcript, status, error, startSession, endSession };
};
