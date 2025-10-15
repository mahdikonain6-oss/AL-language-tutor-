
export interface Language {
  code: string;
  name: string;
}

export enum Speaker {
  User = 'user',
  AI = 'ai',
  System = 'system'
}

export interface TranscriptionEntry {
  speaker: Speaker;
  text: string;
  isFinal: boolean;
}
