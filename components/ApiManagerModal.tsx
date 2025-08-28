import React, { useState, useEffect } from 'react';
import { TrashIcon, XIcon } from './Icons';

interface ApiManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGeminiKeys: string[];
  currentGroqKeys: string[];
  onSave: (newGeminiKeys: string[], newGroqKeys: string[]) => void;
}

const ApiKeySection: React.FC<{
    title: string;
    keys: string[];
    setKeys: React.Dispatch<React.SetStateAction<string[]>>;
    placeholder: string;
    disclaimer: string;
}> = ({ title, keys, setKeys, placeholder, disclaimer }) => {
    const [newKey, setNewKey] = useState('');

    const handleAddKey = () => {
        if (newKey.trim() && !keys.includes(newKey.trim())) {
            setKeys([...keys, newKey.trim()]);
            setNewKey('');
        }
    };

    const handleRemoveKey = (keyToRemove: string) => {
        setKeys(keys.filter(key => key !== keyToRemove));
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto bg-brand-bg p-2 rounded border border-gray-700 mb-2">
                {keys.length > 0 ? keys.map(key => (
                    <div key={key} className="flex items-center justify-between bg-surface p-2 rounded">
                        <span className="font-mono text-xs text-on-surface-secondary truncate pr-2">
                            {key.substring(0, 4)}...{key.slice(-4)}
                        </span>
                        <button onClick={() => handleRemoveKey(key)} className="text-gray-500 hover:text-error">
                            <TrashIcon />
                        </button>
                    </div>
                )) : <p className="text-sm text-center text-on-surface-secondary py-2">No keys added.</p>}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="flex-grow bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
                    placeholder={placeholder}
                />
                <button onClick={handleAddKey} className="px-4 py-2 bg-secondary text-on-primary rounded-md hover:opacity-90">
                    Add
                </button>
            </div>
            <p className="text-xs text-on-surface-secondary mt-2">{disclaimer}</p>
        </div>
    );
};

const ApiManagerModal: React.FC<ApiManagerModalProps> = ({ isOpen, onClose, currentGeminiKeys, currentGroqKeys, onSave }) => {
  const [geminiKeys, setGeminiKeys] = useState(currentGeminiKeys);
  const [groqKeys, setGroqKeys] = useState(currentGroqKeys);

  useEffect(() => {
    setGeminiKeys(currentGeminiKeys);
    setGroqKeys(currentGroqKeys);
  }, [currentGeminiKeys, currentGroqKeys, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(geminiKeys, groqKeys);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-gray-700 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-on-surface">API Key Manager</h2>
          <button onClick={onClose} className="text-on-surface-secondary hover:text-white">
            <XIcon />
          </button>
        </div>
        
        <div className="space-y-6">
            <ApiKeySection 
                title="Gemini API Keys"
                keys={geminiKeys}
                setKeys={setGeminiKeys}
                placeholder="Enter new Gemini API key"
                disclaimer="Quota information for free keys is not available via the API."
            />
            <ApiKeySection 
                title="Groq API Keys"
                keys={groqKeys}
                setKeys={setGroqKeys}
                placeholder="Enter new Groq API key"
                disclaimer="Groq keys are used as a fallback if all Gemini keys fail."
            />
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90">
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiManagerModal;
