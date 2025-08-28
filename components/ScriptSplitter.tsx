import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeftIcon, CheckIcon, CopyIcon } from './Icons';

interface ScriptSplitterProps {
    initialScript: string;
    onBack: () => void;
}

const ScriptStats: React.FC<{ text: string }> = ({ text }) => {
    const stats = useMemo(() => {
        const characters = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const sentences = text.split(/[.!?]+/).filter(Boolean).length;
        const duration = Math.ceil(words / 150); // Using 150 WPM
        const durationFormatted = `${duration} min ${Math.round(((words / 150) - duration) * 60)} sec`;
        const simpleDuration = `${Math.floor(words / 150)}:${String(Math.round((words / 150 * 60) % 60)).padStart(2, '0')}`;

        return { characters, words, sentences, simpleDuration };
    }, [text]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="bg-surface p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{stats.characters.toLocaleString()}</p>
                <p className="text-sm text-on-surface-secondary">Characters</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{stats.words.toLocaleString()}</p>
                <p className="text-sm text-on-surface-secondary">Words</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{stats.sentences.toLocaleString()}</p>
                <p className="text-sm text-on-surface-secondary">Sentences</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{stats.simpleDuration}</p>
                <p className="text-sm text-on-surface-secondary">Est. Duration (150 WPM)</p>
            </div>
        </div>
    );
};

const ScriptSplitter: React.FC<ScriptSplitterProps> = ({ initialScript, onBack }) => {
    const [script, setScript] = useState(initialScript);
    const [maxChars, setMaxChars] = useState(10000);
    const [keyword, setKeyword] = useState('');
    const [sections, setSections] = useState<string[]>([]);
    const [copiedSections, setCopiedSections] = useState<Set<number>>(new Set());

    const handleSplit = () => {
        let textToSplit = script.trim();
        const resultingSections: string[] = [];

        while (textToSplit.length > 0) {
            if (textToSplit.length <= maxChars) {
                resultingSections.push(textToSplit);
                break;
            }

            let chunk = textToSplit.substring(0, maxChars);
            let splitPoint = -1;

            // Find the last sentence or paragraph break
            const lastPeriod = chunk.lastIndexOf('.');
            const lastQuestion = chunk.lastIndexOf('?');
            const lastExclamation = chunk.lastIndexOf('!');
            const lastNewline = chunk.lastIndexOf('\n');

            splitPoint = Math.max(lastPeriod, lastQuestion, lastExclamation, lastNewline);

            // Failsafe: if no punctuation found, or it's too early, just cut at the character limit
            if (splitPoint === -1) {
                splitPoint = maxChars;
            }

            const section = textToSplit.substring(0, splitPoint + 1).trim();
            if (section) {
                resultingSections.push(section);
            }
            textToSplit = textToSplit.substring(splitPoint + 1).trim();
        }

        setSections(resultingSections);
        setCopiedSections(new Set());
    };
    
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedSections(prev => new Set(prev).add(index));
    };

    return (
        <div className="w-full flex-grow flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="p-2 mr-4 bg-surface hover:bg-primary-variant rounded-full">
                    <ArrowLeftIcon />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-primary">Script Splitting Tool</h2>
                    <p className="text-on-surface-secondary">Paste your script, get stats, and split it into manageable sections.</p>
                </div>
            </div>

            <div className="bg-surface p-4 rounded-lg">
                <label htmlFor="script-input" className="text-lg font-semibold text-on-surface mb-2 block">Your Script</label>
                <textarea
                    id="script-input"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="w-full h-64 bg-brand-bg border border-gray-600 rounded-md p-3 text-on-surface focus:ring-primary focus:border-primary font-mono text-sm"
                />
            </div>
            
            <ScriptStats text={script} />

            <div className="bg-surface p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="search-keyword" className="block text-sm font-medium text-on-surface-secondary mb-1">Search Keyword (Optional)</label>
                    <input
                        id="search-keyword"
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="e.g., introduction"
                        className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <label htmlFor="max-chars" className="block text-sm font-medium text-on-surface-secondary mb-1">Max Characters per Section</label>
                    <input
                        id="max-chars"
                        type="number"
                        value={maxChars}
                        onChange={(e) => setMaxChars(parseInt(e.target.value, 10))}
                        min="100"
                        className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
                    />
                </div>
                <button
                    onClick={handleSplit}
                    className="w-full bg-primary text-on-primary font-bold py-2 rounded-lg hover:bg-opacity-90 transition-opacity h-10"
                >
                    Split Script
                </button>
            </div>

            {sections.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-primary mb-4">Split Sections ({sections.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sections.map((section, index) => (
                            <div key={index} className={`bg-surface rounded-lg p-4 border-2 ${copiedSections.has(index) ? 'border-green-500' : 'border-gray-700'} flex flex-col`}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-secondary">Section {index + 1}</h4>
                                    <span className="text-xs text-on-surface-secondary">{section.length.toLocaleString()} chars</span>
                                </div>
                                <div className="flex-grow overflow-y-auto h-48 bg-brand-bg p-2 rounded text-sm mb-3">
                                    <p className="whitespace-pre-wrap">{section}</p>
                                </div>
                                <button onClick={() => handleCopy(section, index)} className="w-full bg-gray-600 hover:bg-gray-500 text-on-surface font-semibold py-2 rounded-md transition-colors flex items-center justify-center gap-2">
                                    {copiedSections.has(index) ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy Section</>}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptSplitter;
