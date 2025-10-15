
import React, { useState, useCallback } from 'react';
import LanguageSelector from './components/LanguageSelector';
import TutorSession from './components/TutorSession';
import { Language } from './types';
import { LANGUAGES } from './constants';

const App: React.FC = () => {
  const [nativeLanguage, setNativeLanguage] = useState<Language | null>(LANGUAGES[0]);
  const [targetLanguage, setTargetLanguage] = useState<Language | null>(LANGUAGES[1]);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);

  const handleStartSession = useCallback(() => {
    if (nativeLanguage && targetLanguage && nativeLanguage.code !== targetLanguage.code) {
      setSessionStarted(true);
    } else {
      alert("Please select two different languages.");
    }
  }, [nativeLanguage, targetLanguage]);

  const handleEndSession = useCallback(() => {
    setSessionStarted(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col items-center justify-center p-4 font-sans">
      <header className="absolute top-0 left-0 p-6 flex items-center gap-3">
         <i className="fas fa-graduation-cap text-3xl text-blue-400"></i>
         <h1 className="text-2xl font-bold tracking-wider text-slate-200">AI Language Tutor</h1>
      </header>

      <main className="w-full max-w-4xl mx-auto">
        {!sessionStarted ? (
          <LanguageSelector
            nativeLanguage={nativeLanguage}
            setNativeLanguage={setNativeLanguage}
            targetLanguage={targetLanguage}
            setTargetLanguage={setTargetLanguage}
            onStart={handleStartSession}
          />
        ) : nativeLanguage && targetLanguage ? (
          <TutorSession
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            onEnd={handleEndSession}
          />
        ) : null}
      </main>
    </div>
  );
};

export default App;
