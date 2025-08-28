import React, { useState } from 'react';
import { XIcon } from './Icons';

interface RegenerateHookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  isGenerating: boolean;
}

const RegenerateHookModal: React.FC<RegenerateHookModalProps> = ({ isOpen, onClose, onSubmit, isGenerating }) => {
  const [feedback, setFeedback] = useState('');
  
  const suggestions = [
      "Make it simpler.",
      "Start by describing the puppies in the box.",
      "More emotional, less descriptive.",
      "Focus on the main character's discovery.",
  ];

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(feedback);
  };

  const handleClose = () => {
    if (!isGenerating) {
        setFeedback('');
        onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-lg border border-gray-700 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-on-surface">Regenerate Hooks with Feedback</h2>
          <button onClick={handleClose} className="text-on-surface-secondary hover:text-white" disabled={isGenerating}>
            <XIcon />
          </button>
        </div>

        <p className="text-sm text-on-surface-secondary mb-3">Provide specific instructions to guide the AI for a better result. Or, leave it blank to just get new ideas.</p>

        <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="e.g., Use extremely simple words. Start the hook with the puppies trapped in the box."
            className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
            disabled={isGenerating}
        />

        <div className="flex flex-wrap gap-2 my-3">
            {suggestions.map(s => (
                <button 
                    key={s}
                    onClick={() => setFeedback(prev => prev ? `${prev}\n${s}`: s)}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-on-surface px-3 py-1 rounded-full"
                    disabled={isGenerating}
                >
                    {s}
                </button>
            ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button onClick={handleSubmit} disabled={isGenerating} className="px-6 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:opacity-90 disabled:bg-gray-600 disabled:cursor-wait">
            {isGenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegenerateHookModal;
