
import React, { useEffect, useRef } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import type { Language, TranscriptionEntry } from '../types';
import { Speaker } from '../types';
import MicrophoneIcon from './common/MicrophoneIcon';
import Button from './common/Button';

interface TutorSessionProps {
  nativeLanguage: Language;
  targetLanguage: Language;
  onEnd: () => void;
}

const TranscriptionLine: React.FC<{ entry: TranscriptionEntry }> = ({ entry }) => {
  const getSpeakerStyles = () => {
    switch (entry.speaker) {
      case Speaker.User:
        return {
          container: 'justify-end',
          bubble: 'bg-blue-600 rounded-br-none',
          icon: 'fa-user text-blue-300',
        };
      case Speaker.AI:
        return {
          container: 'justify-start',
          bubble: 'bg-slate-700 rounded-bl-none',
          icon: 'fa-robot text-slate-300',
        };
      default:
        return {
          container: 'justify-center',
          bubble: 'bg-transparent text-slate-400 text-sm italic',
          icon: 'fa-info-circle text-slate-400',
        };
    }
  };

  const { container, bubble, icon } = getSpeakerStyles();

  return (
    <div className={`flex items-end gap-3 my-3 animate-fade-in ${container}`}>
      {entry.speaker !== Speaker.User && <i className={`fas ${icon} text-2xl mb-2`}></i>}
      <div className={`max-w-xl p-4 rounded-2xl transition-all duration-300 ${bubble} ${!entry.isFinal ? 'opacity-70' : ''}`}>
        <p>{entry.text}</p>
      </div>
      {entry.speaker === Speaker.User && <i className={`fas ${icon} text-2xl mb-2`}></i>}
    </div>
  );
};

const TutorSession: React.FC<TutorSessionProps> = ({ nativeLanguage, targetLanguage, onEnd }) => {
  const { transcript, status, error, startSession, endSession } = useGeminiLive(nativeLanguage, targetLanguage);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSession();
    return () => {
      endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="w-full h-[85vh] flex flex-col bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="flex-grow p-6 overflow-y-auto">
        {transcript.map((entry, index) => (
          <TranscriptionLine key={index} entry={entry} />
        ))}
        <div ref={transcriptEndRef} />
        {error && <div className="text-center text-red-400 p-4">{error}</div>}
      </div>
      <div className="flex-shrink-0 p-6 border-t border-slate-700 flex flex-col items-center justify-center gap-4">
        <MicrophoneIcon status={status} />
        <p className="text-slate-400 h-6 transition-opacity duration-300">{status}</p>
        <Button onClick={onEnd} variant="danger">
          <i className="fas fa-stop mr-2"></i>
          End Session
        </Button>
      </div>
    </div>
  );
};

export default TutorSession;
