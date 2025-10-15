
import React from 'react';
import type { Language } from '../types';
import { LANGUAGES } from '../constants';
import Button from './common/Button';
import Select from './common/Select';

interface LanguageSelectorProps {
  nativeLanguage: Language | null;
  setNativeLanguage: (language: Language | null) => void;
  targetLanguage: Language | null;
  setTargetLanguage: (language: Language | null) => void;
  onStart: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  nativeLanguage,
  setNativeLanguage,
  targetLanguage,
  setTargetLanguage,
  onStart,
}) => {
  const handleSelectChange = (setter: (lang: Language | null) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.code === e.target.value) || null;
    setter(lang);
  };
  
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300 ease-in-out transform hover:scale-105">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-slate-100">Welcome!</h2>
        <p className="text-slate-400 mt-2 text-lg">Choose your languages to begin your learning journey.</p>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
        <div className="w-full md:w-1/2">
          <label htmlFor="native-lang" className="block text-sm font-medium text-slate-300 mb-2">I speak...</label>
          <Select
            id="native-lang"
            value={nativeLanguage?.code || ''}
            onChange={handleSelectChange(setNativeLanguage)}
            options={LANGUAGES}
          />
        </div>
        <div className="text-slate-500 text-2xl hidden md:block mt-8">
          <i className="fas fa-arrow-right-long"></i>
        </div>
        <div className="w-full md:w-1/2">
          <label htmlFor="target-lang" className="block text-sm font-medium text-slate-300 mb-2">I want to learn...</label>
          <Select
            id="target-lang"
            value={targetLanguage?.code || ''}
            onChange={handleSelectChange(setTargetLanguage)}
            options={LANGUAGES}
          />
        </div>
      </div>
      <div className="text-center mt-10">
        <Button onClick={onStart} disabled={!nativeLanguage || !targetLanguage}>
          <i className="fas fa-play mr-2"></i>
          Start Learning
        </Button>
      </div>
    </div>
  );
};

export default LanguageSelector;
