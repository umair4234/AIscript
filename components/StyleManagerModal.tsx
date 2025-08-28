import React, { useState } from 'react';
import { Style } from '../types';
import { TrashIcon, XIcon } from './Icons';

interface StyleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  styles: Style[];
  onAnalyze: (scripts: string[]) => Promise<string>;
  onSave: (style: Omit<Style, 'id'>) => void;
  onDelete: (id: string) => void;
}

const StyleManagerModal: React.FC<StyleManagerModalProps> = ({ isOpen, onClose, styles, onAnalyze, onSave, onDelete }) => {
    const [sampleScripts, setSampleScripts] = useState<string[]>(['']);
    const [pastedJson, setPastedJson] = useState('');
    const [newStyleName, setNewStyleName] = useState('');
    const [generatedJson, setGeneratedJson] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;
    
    const resetForm = () => {
        setSampleScripts(['']);
        setPastedJson('');
        setNewStyleName('');
        setGeneratedJson(null);
        setIsLoading(false);
        setError(null);
    }

    const handleAddScriptInput = () => {
        if (sampleScripts.length < 3) {
            setSampleScripts([...sampleScripts, '']);
        }
    };
    
    const handleScriptChange = (index: number, value: string) => {
        const updatedScripts = [...sampleScripts];
        updatedScripts[index] = value;
        setSampleScripts(updatedScripts);
    };

    const validateStyleJson = (text: string): string => {
        try {
            const parsed = JSON.parse(text);
            // A style guide should be an object.
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return JSON.stringify(parsed); // Return the stringified version (which also cleans up formatting)
            } else {
                throw new Error("Pasted content must be a valid JSON object.");
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Invalid JSON syntax: ${err.message}`);
            }
            // Re-throw our custom error or any other error
            throw err;
        }
    };


    const handleLoadPastedJson = () => {
        if (!pastedJson.trim()) {
            setError("Please paste JSON content to load.");
            return;
        }
        try {
            const validatedJsonString = validateStyleJson(pastedJson);
            setGeneratedJson(validatedJsonString);
            setError(null);
        } catch (err: any) {
            setError(`Error parsing JSON: ${err.message}`);
            setGeneratedJson(null);
        }
    };


    const handleAnalyze = async () => {
        const validScripts = sampleScripts.filter(s => s.trim().length > 10);
        if (validScripts.length === 0) {
            setError("Please provide at least one script with more than 10 characters.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setGeneratedJson(null);
        
        try {
            const result = await onAnalyze(validScripts);
            // The analysis result should conform to the strict format
            const requiredKeys = ['toneAndMood', 'pacing', 'sentenceStructure', 'vocabularyAndDiction', 'narrativeVoice', 'dialogueStyle'];
            const parsedResult = JSON.parse(result);
            const hasAllKeys = requiredKeys.every(key => key in parsedResult && typeof parsedResult[key] === 'object');
            if (!hasAllKeys) {
                throw new Error("AI analysis did not return the expected JSON structure.");
            }
            setGeneratedJson(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!newStyleName.trim() || !generatedJson) {
            setError("Please provide a name for the style and ensure a style JSON is loaded or generated.");
            return;
        }
        onSave({ name: newStyleName.trim(), styleJson: generatedJson });
        resetForm();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-4xl border border-gray-700 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-on-surface">Style Engine</h2>
                    <button onClick={onClose} className="text-on-surface-secondary hover:text-white">
                        <XIcon />
                    </button>
                </div>

                <div className="flex-grow flex gap-6 min-h-0">
                    {/* Left side: Style Creation */}
                    <div className="w-1/2 flex flex-col space-y-4 overflow-y-auto pr-2">
                        <h3 className="text-lg font-bold text-primary">Create New Style</h3>
                        
                        <div>
                            <p className="text-sm font-semibold text-on-surface-secondary mb-2">Option 1: Analyze from Samples</p>
                            {sampleScripts.map((script, index) => (
                                 <textarea
                                    key={index}
                                    value={script}
                                    onChange={(e) => handleScriptChange(index, e.target.value)}
                                    rows={sampleScripts.length > 1 ? 3 : 5}
                                    placeholder={`Sample Script ${index + 1}... (paste here)`}
                                    className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary text-sm mb-2"
                                />
                            ))}
                            {sampleScripts.length < 3 && (
                                <button onClick={handleAddScriptInput} className="text-sm text-secondary hover:underline mb-2">
                                    + Add another script sample
                                </button>
                            )}
                            <button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-primary text-on-primary font-bold py-2 rounded-lg hover:opacity-90 disabled:bg-gray-600">
                                {isLoading ? 'Analyzing...' : `Analyze Script(s)`}
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <hr className="flex-grow border-gray-600"/>
                            <span className="text-on-surface-secondary text-xs">OR</span>
                            <hr className="flex-grow border-gray-600"/>
                        </div>
                        
                        <div>
                            <p className="text-sm font-semibold text-on-surface-secondary mb-2">Option 2: Paste Style JSON</p>
                            <textarea
                                value={pastedJson}
                                onChange={(e) => setPastedJson(e.target.value)}
                                rows={5}
                                placeholder="Paste a valid style JSON here..."
                                disabled={isLoading}
                                className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary text-sm font-mono"
                            />
                            <button onClick={handleLoadPastedJson} disabled={isLoading} className="w-full mt-2 bg-gray-600 text-on-surface font-semibold py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50">
                                Load Pasted JSON
                            </button>
                        </div>

                        
                        {error && <p className="text-error text-sm mt-2">{error}</p>}

                        {generatedJson && (
                            <div className="space-y-2 pt-4 border-t border-gray-700">
                                <h4 className="font-semibold text-green-400">Style Loaded Successfully</h4>
                                <textarea
                                    readOnly
                                    value={JSON.stringify(JSON.parse(generatedJson), null, 2)}
                                    rows={6}
                                    className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface font-mono text-xs"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newStyleName}
                                        onChange={(e) => setNewStyleName(e.target.value)}
                                        placeholder="Enter a name for this style"
                                        className="flex-grow bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface"
                                    />
                                    <button onClick={handleSave} className="px-4 bg-secondary text-on-primary rounded-md hover:opacity-90">
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side: Existing Styles */}
                    <div className="w-1/2 flex flex-col border-l border-gray-700 pl-6">
                        <h3 className="text-lg font-bold text-primary mb-2 flex-shrink-0">Saved Styles</h3>
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {styles.length > 0 ? styles.map(style => (
                                <div key={style.id} className="bg-brand-bg p-3 rounded-md flex justify-between items-center">
                                    <span className="font-semibold text-on-surface">{style.name}</span>
                                    <button onClick={() => onDelete(style.id)} className="text-gray-500 hover:text-error">
                                        <TrashIcon />
                                    </button>
                                </div>
                            )) : <p className="text-sm text-on-surface-secondary text-center py-4">No custom styles saved.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StyleManagerModal;
