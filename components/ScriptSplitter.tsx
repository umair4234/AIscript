import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeftIcon, CheckIcon, CopyIcon, SparklesIcon } from './Icons';
import { AIManager } from '../services/aiService';
import { getTitlesFromScriptPrompt, getDescriptionPrompt, getTitlesFromExistingTitlePrompt } from '../services/promptService';
import * as storage from '../services/storageService';
import TitleGenerationModal from './TitleGenerationModal';

interface ScriptSplitterProps {
    initialScript: string;
    initialSections?: string[];
    onSplit?: (sections: string[]) => void;
    onBack?: () => void;
    googleGenAI: any;
    geminiKeys: string[];
    groqKeys: string[];
}

const ScriptStats: React.FC<{ text: string }> = ({ text }) => {
    const stats = useMemo(() => {
        if (!text) return { characters: 0, words: 0, sentences: 0, simpleDuration: '0:00' };
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

const ScriptSplitter: React.FC<ScriptSplitterProps> = ({ initialScript, initialSections, onSplit, onBack, googleGenAI, geminiKeys, groqKeys }) => {
    const [script, setScript] = useState(initialScript || storage.getSplitterScript() || '');
    const [maxChars, setMaxChars] = useState(10000);
    const [keyword, setKeyword] = useState('');
    const [sections, setSections] = useState<string[]>(initialSections || []);
    const [copiedSections, setCopiedSections] = useState<Set<number>>(new Set());
    
    // State for Script Cleaner feature
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCount, setSearchCount] = useState<number | null>(null);

    // State for Title & Description Studio
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
    const [finalDescription, setFinalDescription] = useState<string | null>(null);
    const [isLoadingTitles, setIsLoadingTitles] = useState(false);
    const [isLoadingDescription, setIsLoadingDescription] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [copiedContent, setCopiedContent] = useState<boolean>(false);

    const aiManager = useMemo(() => {
        return new AIManager(geminiKeys, groqKeys, googleGenAI);
    }, [geminiKeys, groqKeys, googleGenAI]);


    useEffect(() => {
      // Prioritize script passed from writer, otherwise use component's state
      if (initialScript) {
        setScript(initialScript);
      }
    }, [initialScript]);
    
    useEffect(() => {
      setSections(initialSections || []);
    }, [initialSections]);

    useEffect(() => {
        // Save script to local storage on change with a debounce
        const handler = setTimeout(() => {
            storage.saveSplitterScript(script);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [script]);

    // Memos for Script Cleaner
    const chapterHeadingsCount = useMemo(() => {
        if (!script) return 0;
        const matches = script.match(/^Chapter \d+.*$/gim);
        return matches ? matches.length : 0;
    }, [script]);
    
    const showThinkingCount = useMemo(() => {
        if (!script) return 0;
        return (script.match(/Show thinking/g) || []).length;
    }, [script]);

    // Handlers for Script Cleaner feature
    const handleRemoveChapterHeadings = () => {
        const cleanedScript = script.replace(/^Chapter \d+.*\n?/gim, '');
        setScript(cleanedScript);
    };
    
    const handleRemoveShowThinking = () => {
        const cleanedScript = script.replace(/Show thinking\n?/gi, '');
        setScript(cleanedScript);
    };
    
    const handleCleanSpacing = () => {
        // Replace 3 or more newlines with just two, cleaning up extra empty lines
        const cleanedScript = script.replace(/\n{3,}/g, '\n\n');
        setScript(cleanedScript);
    };


    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setSearchCount(0);
            return;
        }
        const count = (script.match(new RegExp(escapeRegExp(searchTerm), 'g')) || []).length;
        setSearchCount(count);
    };

    const handleRemoveSearchTerm = () => {
        if (!searchTerm.trim() || !searchCount) return;
        const cleanedScript = script.replace(new RegExp(escapeRegExp(searchTerm), 'g'), '');
        setScript(cleanedScript);
        setSearchTerm('');
        setSearchCount(null);
    };


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

            const lastPeriod = chunk.lastIndexOf('.');
            const lastQuestion = chunk.lastIndexOf('?');
            const lastExclamation = chunk.lastIndexOf('!');
            const lastNewline = chunk.lastIndexOf('\n');

            splitPoint = Math.max(lastPeriod, lastQuestion, lastExclamation, lastNewline);

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
        if(onSplit) {
            onSplit(resultingSections);
        }
    };
    
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedSections(prev => new Set(prev).add(index));
    };

    // Handlers for Title & Description Studio
    const handleGenerateTitles = async (optionalTitle?: string) => {
        setIsLoadingTitles(true);
        setAiError(null);
        setGeneratedTitles([]);
        setSelectedTitle(null);
        setFinalDescription(null);
        let fullText = '';
        try {
            const prompt = optionalTitle
                ? getTitlesFromExistingTitlePrompt(optionalTitle)
                : getTitlesFromScriptPrompt(script.trim().split(/\s+/).slice(0, 1000).join(' '));
            
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => { fullText += chunk; },
                () => {},
                new AbortController().signal
            );
            
            let jsonString = fullText.trim();
            const startIndex = jsonString.indexOf('[');
            const endIndex = jsonString.lastIndexOf(']');
            
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                jsonString = jsonString.substring(startIndex, endIndex + 1);
            } else {
                throw new Error("No valid JSON array found in the AI response.");
            }

            const titles = JSON.parse(jsonString);
            setGeneratedTitles(titles);
            setIsTitleModalOpen(false);
        } catch (err: any) {
            setAiError(`Failed to parse titles. Error: ${err.message}. Raw AI Response: "${fullText}"`);
        } finally {
            setIsLoadingTitles(false);
        }
    };
    
    const handleGenerateDescription = async () => {
        if (!selectedTitle) return;
        setIsLoadingDescription(true);
        setAiError(null);
        let fullText = '';
        try {
            const prompt = getDescriptionPrompt(selectedTitle, script);
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => { fullText += chunk; },
                () => {},
                new AbortController().signal
            );
            setFinalDescription(fullText.trim());
        } catch (err: any) {
            setAiError(err.message);
        } finally {
            setIsLoadingDescription(false);
        }
    };

    const handleCopyFinal = () => {
        if (!finalDescription) return;
        navigator.clipboard.writeText(finalDescription);
        setCopiedContent(true);
        setTimeout(() => setCopiedContent(false), 2000);
    };


    return (
        <div className="w-full flex-grow flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="flex items-center mb-4">
                {onBack && (
                    <button onClick={onBack} className="p-2 mr-4 bg-surface hover:bg-primary-variant rounded-full">
                        <ArrowLeftIcon />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-primary">Script Splitting Tool</h2>
                    <p className="text-on-surface-secondary">Paste your script, clean it, generate titles, get stats, and split it.</p>
                </div>
            </div>

            <div className="bg-surface p-4 rounded-lg">
                <label htmlFor="script-input" className="text-lg font-semibold text-on-surface mb-2 block">Your Script</label>
                <textarea
                    id="script-input"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="w-full h-64 bg-brand-bg border border-gray-600 rounded-md p-3 text-on-surface focus:ring-primary focus:border-primary font-mono text-sm"
                    readOnly={!!onSplit} // Make it readonly when used in the studio
                />
            </div>

            {/* Script Cleaner Section */}
            <div className="my-6 bg-surface p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-secondary">Script Cleaner</h3>
                     <button onClick={handleCleanSpacing} className="px-4 py-2 bg-gray-600 text-on-surface font-semibold rounded-lg hover:bg-gray-500 text-sm">
                        Clean Up Spacing
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Default Cleaner */}
                    <div>
                        <h4 className="text-lg font-semibold text-on-surface mb-2">Default Cleaner</h4>
                        <div className="bg-brand-bg p-3 rounded-md space-y-2">
                            {/* Chapter Headings */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">Chapter Headings</p>
                                    <p className="text-sm text-on-surface-secondary">e.g., "Chapter 1: The Discovery"</p>
                                </div>
                                {chapterHeadingsCount > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm bg-primary-variant text-primary font-bold px-2 py-1 rounded-full">{chapterHeadingsCount} found</span>
                                        <button
                                            onClick={handleRemoveChapterHeadings}
                                            className="px-3 py-1 bg-error text-white font-semibold rounded-lg hover:bg-opacity-90 text-sm"
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-sm text-on-surface-secondary">None found</span>
                                )}
                            </div>
                             {/* Show thinking */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">"Show thinking"</p>
                                    <p className="text-sm text-on-surface-secondary">Removes AI instruction text</p>
                                </div>
                                {showThinkingCount > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm bg-primary-variant text-primary font-bold px-2 py-1 rounded-full">{showThinkingCount} found</span>
                                        <button
                                            onClick={handleRemoveShowThinking}
                                            className="px-3 py-1 bg-error text-white font-semibold rounded-lg hover:bg-opacity-90 text-sm"
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-sm text-on-surface-secondary">None found</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Custom Cleaner */}
                    <div>
                        <h4 className="text-lg font-semibold text-on-surface mb-2">Custom Cleaner</h4>
                         <div className="bg-brand-bg p-3 rounded-md space-y-3">
                            <p className="text-sm text-on-surface-secondary">Enter the exact text you want to find and remove from the script.</p>
                            <textarea
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSearchCount(null); // Reset count on new input
                                }}
                                rows={3}
                                className="w-full bg-surface border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary text-sm"
                                placeholder="Paste text to remove here..."
                            />
                            <div className="flex justify-between items-center gap-2">
                                <button
                                    onClick={handleSearch}
                                    disabled={!searchTerm.trim()}
                                    className="flex-1 bg-gray-600 text-on-surface font-semibold py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50"
                                >
                                    Find Occurrences
                                </button>
                                {searchCount !== null && (
                                     <button
                                        onClick={handleRemoveSearchTerm}
                                        disabled={searchCount === 0}
                                        className="flex-1 bg-error text-white font-semibold py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                                    >
                                       Remove All ({searchCount})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <ScriptStats text={script} />

            {/* Title & Description Studio */}
             <div className="my-6 bg-surface p-4 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Title & Description Studio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title Generation */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-semibold text-on-surface">1. Generate Titles</h4>
                             <button
                                onClick={() => setIsTitleModalOpen(true)}
                                disabled={!script}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-opacity-90 text-sm disabled:bg-gray-600"
                            >
                                <SparklesIcon className="h-5 w-5" />
                                {generatedTitles.length > 0 ? 'Regenerate' : 'Generate'}
                            </button>
                        </div>
                        {isLoadingTitles && !isTitleModalOpen && <p className="text-on-surface-secondary animate-pulse text-center">Generating titles...</p>}
                         <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {generatedTitles.map((title, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedTitle(title)}
                                    className={`w-full text-left p-3 rounded-md transition-colors text-on-surface ${selectedTitle === title ? 'bg-primary-variant ring-2 ring-primary' : 'bg-brand-bg hover:bg-gray-800'}`}
                                >
                                    {title}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Description Generation */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-semibold text-on-surface">2. Get Description</h4>
                            <button
                                onClick={handleGenerateDescription}
                                disabled={!selectedTitle || isLoadingDescription}
                                className="px-4 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:bg-opacity-90 text-sm disabled:bg-gray-600"
                            >
                                {isLoadingDescription ? 'Generating...' : 'Generate Description'}
                            </button>
                        </div>
                         {finalDescription ? (
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={finalDescription}
                                    rows={8}
                                    className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface"
                                />
                                <button onClick={handleCopyFinal} className="absolute top-2 right-2 p-2 bg-gray-600 rounded-md hover:bg-gray-500">
                                    {copiedContent ? <CheckIcon/> : <CopyIcon />}
                                </button>
                            </div>
                         ) : (
                             <div className="flex items-center justify-center h-full bg-brand-bg rounded-md">
                                <p className="text-on-surface-secondary text-sm">Select a title to generate a description.</p>
                            </div>
                         )}
                    </div>
                </div>
                {aiError && <p className="text-error text-sm mt-4 text-center">{aiError}</p>}
            </div>


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
            <TitleGenerationModal
                isOpen={isTitleModalOpen}
                onClose={() => setIsTitleModalOpen(false)}
                onGenerate={handleGenerateTitles}
                isLoading={isLoadingTitles}
            />
        </div>
    );
};

export default ScriptSplitter;