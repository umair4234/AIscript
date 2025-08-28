import React, { useState, useCallback } from 'react';
import { ScriptRecord } from '../types';
import { AIManager } from '../services/aiService';
import { getTitlesFromScriptPrompt, getDescriptionPrompt } from '../services/promptService';
import { CopyIcon, CheckIcon, SparklesIcon } from './Icons';

interface PostGenerationStudioProps {
    script: ScriptRecord;
    fullScriptText: string;
    onUpdateScript: (updates: Partial<ScriptRecord>) => void;
    aiManager: AIManager;
}

const PostGenerationStudio: React.FC<PostGenerationStudioProps> = ({ script, fullScriptText, onUpdateScript, aiManager }) => {
    const [isLoadingTitles, setIsLoadingTitles] = useState(false);
    const [isLoadingDescription, setIsLoadingDescription] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<'title' | 'description' | null>(null);

    const handleGenerateTitles = useCallback(async () => {
        setIsLoadingTitles(true);
        setError(null);
        let fullText = '';
        try {
            const prompt = getTitlesFromScriptPrompt(fullScriptText);
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => { fullText += chunk; },
                () => {},
                new AbortController().signal
            );
            const titles = JSON.parse(fullText.trim());
            onUpdateScript({ suggestedTitles: titles, finalTitle: '', finalDescription: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoadingTitles(false);
        }
    }, [fullScriptText, aiManager, onUpdateScript]);

    const handleSelectTitle = useCallback(async (title: string) => {
        setIsLoadingDescription(true);
        onUpdateScript({ finalTitle: title });
        let fullText = '';
        try {
            const prompt = getDescriptionPrompt(title, fullScriptText);
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => { fullText += chunk; },
                () => {},
                new AbortController().signal
            );
            onUpdateScript({ finalTitle: title, finalDescription: fullText.trim() });
        } catch (err: any) {
             onUpdateScript({ finalTitle: title, finalDescription: 'Error generating description.' });
        } finally {
            setIsLoadingDescription(false);
        }
    }, [fullScriptText, aiManager, onUpdateScript]);
    
    const handleCopy = (type: 'title' | 'description', text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="flex-grow p-6 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-primary">Titles & Description</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Titles Section */}
                <div className="bg-surface p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-secondary">Suggested Titles</h3>
                        <button
                            onClick={handleGenerateTitles}
                            disabled={isLoadingTitles}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-opacity-90 text-sm disabled:bg-gray-600"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            {script.suggestedTitles && script.suggestedTitles.length > 0 ? 'Regenerate' : 'Generate'}
                        </button>
                    </div>
                    {isLoadingTitles && <p className="text-on-surface-secondary animate-pulse text-center">Generating titles...</p>}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {script.suggestedTitles?.map((title, index) => (
                             <button
                                key={index}
                                onClick={() => handleSelectTitle(title)}
                                className={`w-full text-left p-3 rounded-md transition-colors text-on-surface ${script.finalTitle === title ? 'bg-primary-variant' : 'bg-brand-bg hover:bg-gray-800'}`}
                             >
                                {title}
                             </button>
                        ))}
                    </div>
                </div>

                {/* Description Section */}
                <div className="bg-surface p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-secondary mb-3">Final Title & Description</h3>
                     {isLoadingDescription && <p className="text-on-surface-secondary animate-pulse text-center mb-2">Generating description...</p>}
                     
                     {script.finalTitle && (
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-on-surface-secondary mb-1">Selected Title</label>
                                <div className="flex items-center gap-2">
                                     <input type="text" readOnly value={script.finalTitle} className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface font-semibold" />
                                     <button onClick={() => handleCopy('title', script.finalTitle!)} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500">
                                        {copied === 'title' ? <CheckIcon/> : <CopyIcon />}
                                     </button>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-on-surface-secondary mb-1">Generated Description</label>
                                <div className="flex items-center gap-2">
                                    <textarea
                                        readOnly
                                        value={script.finalDescription || ''}
                                        rows={8}
                                        className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface"
                                    />
                                    <button onClick={() => handleCopy('description', script.finalDescription!)} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500">
                                        {copied === 'description' ? <CheckIcon/> : <CopyIcon />}
                                     </button>
                                </div>
                            </div>
                         </div>
                     )}
                </div>
            </div>
             {error && <p className="text-error text-sm mt-4">{error}</p>}
        </div>
    );
};

export default PostGenerationStudio;
