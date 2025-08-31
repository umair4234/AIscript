import React, { useState } from 'react';
import { XIcon, SparklesIcon } from './Icons';

interface TitleGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (optionalTitle?: string) => void;
  isLoading: boolean;
}

const TitleGenerationModal: React.FC<TitleGenerationModalProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleGenerateClick = () => {
    onGenerate(title.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-on-surface">Generate Titles</h2>
          <button onClick={onClose} className="text-on-surface-secondary hover:text-white" disabled={isLoading}>
            <XIcon />
          </button>
        </div>
        
        <p className="text-sm text-on-surface-secondary mb-3">
          Optionally provide your current title to get improved, clickbait versions.
          Leave it blank to generate titles by analyzing the script's content.
        </p>

        <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={3}
            placeholder="Enter your current title here (optional)..."
            className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
            disabled={isLoading}
        />

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleGenerateClick} 
            disabled={isLoading} 
            className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 disabled:bg-gray-600 disabled:cursor-wait"
          >
            <SparklesIcon className="h-5 w-5" />
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleGenerationModal;
