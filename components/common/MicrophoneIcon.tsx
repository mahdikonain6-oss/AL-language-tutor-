
import React from 'react';

type SessionStatus = 'Idle' | 'Connecting' | 'Listening' | 'Waiting' | 'Speaking' | 'Error';

interface MicrophoneIconProps {
  status: SessionStatus;
}

const MicrophoneIcon: React.FC<MicrophoneIconProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Listening':
        return {
          icon: 'fa-microphone',
          color: 'text-green-400',
          animation: 'animate-pulse',
        };
      case 'Speaking':
        return {
          icon: 'fa-volume-high',
          color: 'text-blue-400',
          animation: 'animate-pulse',
        };
      case 'Connecting':
      case 'Waiting':
        return {
          icon: 'fa-spinner',
          color: 'text-yellow-400',
          animation: 'animate-spin',
        };
      case 'Error':
        return {
          icon: 'fa-exclamation-triangle',
          color: 'text-red-400',
          animation: '',
        };
      case 'Idle':
      default:
        return {
          icon: 'fa-microphone-slash',
          color: 'text-slate-500',
          animation: '',
        };
    }
  };

  const { icon, color, animation } = getStatusStyles();

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {(status === 'Listening' || status === 'Speaking') && (
        <>
          <div className="absolute inset-0 rounded-full bg-slate-700 animate-ping opacity-50"></div>
          <div className="absolute inset-0 rounded-full bg-slate-700/50"></div>
        </>
      )}
      <div className={`relative w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center shadow-inner`}>
        <i className={`fas ${icon} ${color} ${animation} text-3xl transition-colors duration-300`}></i>
      </div>
    </div>
  );
};

export default MicrophoneIcon;
