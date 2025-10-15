
import React from 'react';
import { Language } from '../../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Language[];
}

const Select: React.FC<SelectProps> = ({ options, className, ...props }) => {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none bg-slate-700 border border-slate-600 text-white py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.code} value={option.code}>{option.name}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-300">
        <i className="fas fa-chevron-down text-xs"></i>
      </div>
    </div>
  );
};

export default Select;
