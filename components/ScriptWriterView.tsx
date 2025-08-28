import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GenerationState, ScriptOutline, ChapterContent, ScriptRecord, AutomationJob, ApiProvider, Style, FavoriteTitle } from '../types';
import { AIManager } from '../services/aiService';
import { getOutlinePrompt, getMultipleHooksPrompt, getChapterPrompt, getStyleAnalysisPrompt, getRegenerateHookWithFeedbackPrompt } from '../services/promptService';
import * as storage from '../services/storageService';
import * as styleService from '../services/styleService';
import ScriptInputForm from './ScriptInputForm';
import OutlineViewer from './OutlineViewer';
import ScriptEditor from './ScriptEditor';
import StatusBar from './StatusBar';
import LibrarySidebar from './LibrarySidebar';
import ManualOutlineInput from './ManualOutlineInput';
import StyleManagerModal from './StyleManagerModal';
import RegenerateHookModal from './RegenerateHookModal';
import { HomeIcon } from './Icons';

// Helper function to parse outline from text
const parseOutline = (text: string): ScriptOutline | null => {
    try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const titleMatch = lines.find(line => line.toLowerCase().startsWith('video title:'));
        const wordCountMatch = lines.find(line => line.toLowerCase().startsWith('total word count:'));
        const twistMatch = lines.find(line => line.toLowerCase().startsWith('primary twist:'));

        if (!titleMatch || !wordCountMatch) return null;

        const title = titleMatch.split(':')[1].trim();
        const totalWordCount = parseInt(wordCountMatch.split(':')[1].trim().replace(/,/g, ''), 10);
        const twist = twistMatch ? twistMatch.split(':')[1].trim() : undefined;

        const chapters: { chapter: number; summary: string; wordCount: number }[] = [];
        let currentChapter = -1;

        lines.forEach(line => {
            const chapterMatch = line.match(/^Chapter (\d+)/i);
            if (chapterMatch) {
                currentChapter = parseInt(chapterMatch[1], 10);
                chapters.push({ chapter: currentChapter, summary: '', wordCount: 0 });
            } else if (currentChapter !== -1) {
                const summaryMatch = line.match(/^Summary:\s*(.*)/i);
                const wcMatch = line.match(/^Word Count:\s*~?([\d,]+)/i);

                if (summaryMatch && chapters[chapters.length - 1]) {
                    chapters[chapters.length - 1].summary += summaryMatch[1].trim() + ' ';
                } else if (wcMatch && chapters[chapters.length - 1]) {
                    chapters[chapters.length - 1].wordCount = parseInt(wcMatch[1].replace(/,/g, ''), 10);
                } else if (chapters.length > 0 && !line.toLowerCase().startsWith('video title:') && !line.toLowerCase().startsWith('total word count:') && !line.toLowerCase().startsWith('primary twist:')) {
                     // Append to summary if it's not a keyword line
                    if(chapters[chapters.length - 1].summary) {
                         chapters[chapters.length - 1].summary += line.trim() + ' ';
                    }
                }
            }
        });
        
        chapters.forEach(ch => ch.summary = ch.summary.trim());

        // Validate that every chapter has a word count. This is a critical check.
        const isAnyChapterMissingWordCount = chapters.some(ch => !ch.wordCount || ch.wordCount <= 0);
        if (isAnyChapterMissingWordCount) {
             console.error("Outline parsing failed: one or more chapters are missing a valid word count.");
             return null;
        }

        if (chapters.length === 0 || !title || isNaN(totalWordCount)) return null;

        return { title, totalWordCount, chapters, twist };
    } catch (error) {
        console.error("Failed to parse outline:", error);
        return null;
    }
};

interface ScriptWriterViewProps {
    initialTitle: string;
    initialPlot: string;
    onNavigateHome: () => void;
    onNavigateToSplitter: (script: string) => void;
    googleGenAI: any; // The loaded SDK constructor
    geminiKeys: string[];
    groqKeys: string[];
}

const ScriptWriterView: React.FC<ScriptWriterViewProps> = ({ initialTitle, initialPlot, onNavigateHome, onNavigateToSplitter, googleGenAI, geminiKeys, groqKeys }) => {
    const [title, setTitle] = useState(initialTitle || '');
    const [duration, setDuration] = useState(60);
    const [plot, setPlot] = useState(initialPlot || '');
    const [state, setState] = useState<GenerationState>(GenerationState.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [outline, setOutline] = useState<ScriptOutline | null>(null);
    const [rawOutlineText, setRawOutlineText] = useState('');
    const [isOutlineManual, setIsOutlineManual] = useState(false);
    const [hooks, setHooks] = useState<string[]>([]);
    const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
    const [approvedHook, setApprovedHook] = useState('');
    const [finalScript, setFinalScript] = useState<ChapterContent[]>([]);
    const [currentChapter, setCurrentChapter] = useState(0);
    const [isStyleManagerOpen, setIsStyleManagerOpen] = useState(false);
    const [isRegenHookModalOpen, setIsRegenHookModalOpen] = useState(false);
    const [scripts, setScripts] = useState<ScriptRecord[]>([]);
    const [activeScript, setActiveScript] = useState<ScriptRecord | null>(null);
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyleId, setSelectedStyleId] = useState('default');
    const [apiProvider, setApiProvider] = useState<ApiProvider>(ApiProvider.GEMINI);
    const [apiKeyIndex, setApiKeyIndex] = useState(0);
    const [queue, setQueue] = useState<AutomationJob[]>([]);
    const [isAutomationRunning, setIsAutomationRunning] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);
    const [favoriteTitles, setFavoriteTitles] = useState<FavoriteTitle[]>([]);
    const [regeneratingChapter, setRegeneratingChapter] = useState<number | null>(null);

    const abortController = useRef<AbortController | null>(null);

    const aiManager = useMemo(() => {
        return new AIManager(geminiKeys, groqKeys, googleGenAI);
    }, [geminiKeys, groqKeys, googleGenAI]);

    const effectiveTotalApiKeys = useMemo(() => {
        return apiProvider === ApiProvider.GEMINI ? geminiKeys.length : groqKeys.length;
    }, [apiProvider, geminiKeys, groqKeys]);


    // Load data from storage on mount
    useEffect(() => {
        setScripts(storage.getScripts());
        setQueue(storage.getQueue());
        setStyles(styleService.getStyles());
        setFavoriteTitles(storage.getFavoriteTitles());
    }, []);

    // Sync state with props when they change
    useEffect(() => {
        setTitle(initialTitle || '');
    }, [initialTitle]);

    useEffect(() => {
        setPlot(initialPlot || '');
    }, [initialPlot]);


    const resetState = useCallback((clearInputs = true) => {
        if (clearInputs) {
            setTitle('');
            setDuration(60);
            setPlot('');
        }
        setState(GenerationState.IDLE);
        setError(null);
        setOutline(null);
        setRawOutlineText('');
        setIsOutlineManual(false);
        setHooks([]);
        setSelectedHookIndex(null);
        setApprovedHook('');
        setFinalScript([]);
        setCurrentChapter(0);
        aiManager.reset();
        setApiProvider(ApiProvider.GEMINI);
        setApiKeyIndex(0);
        setActiveScript(null);
        if (abortController.current) {
            abortController.current.abort();
        }
    }, [aiManager]);
    
    const saveCurrentScript = useCallback((updates: Partial<Omit<ScriptRecord, 'id' | 'createdAt'>>) => {
        const scriptToSave = {
            title: title || 'Untitled Script',
            plot: updates.plot ?? plot,
            outline: updates.outline ?? outline,
            hook: updates.hook ?? approvedHook,
            finalScript: updates.finalScript ?? finalScript,
        };
        const saved = storage.saveScript(scriptToSave, activeScript?.id ?? null);
        setActiveScript(saved);
        setScripts(storage.getScripts());
        return saved;
    }, [title, plot, outline, approvedHook, finalScript, activeScript]);

    const handleGenerateOutline = useCallback(async (data: { title: string; duration: number; plot: string; }) => {
        resetState(false);
        setState(GenerationState.GENERATING_OUTLINE);
        abortController.current = new AbortController();
        let fullText = '';
        try {
            const prompt = getOutlinePrompt(data.title, data.duration, data.plot);
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => {
                    fullText += chunk;
                    setRawOutlineText(fullText);
                },
                (update) => {
                    setApiProvider(update.provider);
                    setApiKeyIndex(update.keyIndex);
                },
                abortController.current.signal
            );
            const parsedOutline = parseOutline(fullText);
            if (parsedOutline) {
                setOutline(parsedOutline);
                setTitle(parsedOutline.title);
                saveCurrentScript({ outline: parsedOutline, title: parsedOutline.title, plot: data.plot });
                setState(GenerationState.AWAITING_OUTLINE_APPROVAL);
            } else {
                throw new Error("Failed to parse the generated outline. The format might be incorrect or missing required fields like word counts for every chapter.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setState(GenerationState.ERROR);
            setIsOutlineManual(true);
        }
    }, [aiManager, resetState, saveCurrentScript]);

    const handleManualOutlineSubmit = (text: string) => {
        const parsed = parseOutline(text);
        if (parsed) {
            setRawOutlineText(text);
            setOutline(parsed);
            setTitle(parsed.title);
            saveCurrentScript({ outline: parsed, title: parsed.title });
            setState(GenerationState.AWAITING_OUTLINE_APPROVAL);
            setIsOutlineManual(false);
            setError(null);
        } else {
            setError("The provided text could not be parsed into a valid outline. Please check the format and ensure all chapters have a word count.");
        }
    };

    const handleGenerateHooks = useCallback(async (feedback?: string) => {
        if (!outline) return;
        setHooks([]);
        setSelectedHookIndex(null);
        setState(GenerationState.GENERATING_HOOK);
        setIsRegenHookModalOpen(false);
        abortController.current = new AbortController();
        let fullText = '';
        try {
            const prompt = feedback 
                ? getRegenerateHookWithFeedbackPrompt(outline, feedback)
                : getMultipleHooksPrompt(outline);
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => {
                    fullText += chunk;
                },
                (update) => {
                    setApiProvider(update.provider);
                    setApiKeyIndex(update.keyIndex);
                },
                abortController.current.signal
            );
            
            // Robust JSON cleaning: find the first '[' and last ']'
            let cleanedText = fullText.trim();
            const firstBracket = cleanedText.indexOf('[');
            const lastBracket = cleanedText.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
            }

            const parsedHooks = JSON.parse(cleanedText);
            setHooks(parsedHooks);
            setState(GenerationState.AWAITING_HOOK_SELECTION);
        } catch (err: any) {
            console.error("Raw text that failed parsing:", fullText);
            console.error(err);
            const detail = err instanceof SyntaxError ? `Unexpected token in AI response. The AI may have returned malformed JSON.` : err.message;
            setError(`Failed to generate or parse hooks. ${detail}`);
            setState(GenerationState.ERROR);
        }
    }, [aiManager, outline]);

    const handleGenerateChapters = useCallback(async (startChapter: number = 1) => {
        if (!outline || (startChapter === 1 && selectedHookIndex === null)) return;
    
        const hookToUse = startChapter > 1 ? approvedHook : hooks[selectedHookIndex!];
        if (!hookToUse) {
            setError("Cannot start generation without an approved hook.");
            setState(GenerationState.ERROR);
            return;
        }
    
        if (startChapter === 1) {
            setApprovedHook(hookToUse);
            setFinalScript([]); // Clear for a fresh start
            saveCurrentScript({ hook: hookToUse, finalScript: [] });
        }
        
        setState(GenerationState.GENERATING_CHAPTERS);
        setError(null); // Clear previous errors on resume
        abortController.current = new AbortController();
    
        const selectedStyle = styles.find(s => s.id === selectedStyleId);
        
        const currentRunScript = [...finalScript];
    
        for (let i = startChapter; i <= outline.chapters.length; i++) {
            setCurrentChapter(i);
            let fullChapterText = '';
    
            const chapterOutline = outline.chapters.find(c => c.chapter === i)!;
            const existingChapterIndex = currentRunScript.findIndex(c => c.chapter === i);
            if (existingChapterIndex === -1) {
                currentRunScript.push({ ...chapterOutline, content: '' });
            }
            setFinalScript([...currentRunScript]);
    
            try {
                const prevContent = i > 1 ? currentRunScript.find(c => c.chapter === i - 1)!.content : '';
                if (i > 1 && prevContent === undefined) {
                     throw new Error(`Could not find content for the previous chapter (${i - 1}).`);
                }
                
                const prompt = getChapterPrompt(i, outline, hookToUse, prevContent, selectedStyle?.styleJson ?? null);
                
                await aiManager.generateStreamWithRotation(
                    prompt,
                    (chunk) => {
                        fullChapterText += chunk;
                        const chapterToUpdate = currentRunScript.find(c => c.chapter === i)!;
                        chapterToUpdate.content = fullChapterText;
                        setFinalScript([...currentRunScript]);
                    },
                    (update) => {
                        setApiProvider(update.provider);
                        setApiKeyIndex(update.keyIndex);
                    },
                    abortController.current.signal
                );
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    setState(GenerationState.PAUSED);
                    saveCurrentScript({ finalScript: currentRunScript });
                    return;
                }
                console.error(err);
                setError(`Failed on chapter ${i}: ${err.message}`);
                setState(GenerationState.ERROR);
                saveCurrentScript({ finalScript: currentRunScript });
                return;
            }
        }
        
        saveCurrentScript({ finalScript: currentRunScript });
        setState(GenerationState.COMPLETED);
    }, [outline, selectedHookIndex, hooks, approvedHook, finalScript, aiManager, saveCurrentScript, styles, selectedStyleId]);
    
    const handleRegenerateChapter = useCallback(async (chapterNumber: number) => {
        if (!outline || !approvedHook) return;
        
        setRegeneratingChapter(chapterNumber);
        abortController.current = new AbortController();
        const selectedStyle = styles.find(s => s.id === selectedStyleId);
        let fullChapterText = '';

        try {
            const prevContent = chapterNumber > 1 ? finalScript.find(c => c.chapter === chapterNumber - 1)!.content : '';
            if (chapterNumber > 1 && prevContent === undefined) {
                throw new Error(`Could not find content for the previous chapter (${chapterNumber - 1}) to regenerate from.`);
            }

            const prompt = getChapterPrompt(chapterNumber, outline, approvedHook, prevContent, selectedStyle?.styleJson ?? null);
            
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => {
                    fullChapterText += chunk;
                    setFinalScript(prev => {
                        const newScript = [...prev];
                        const chapterIndex = newScript.findIndex(c => c.chapter === chapterNumber);
                        if (chapterIndex > -1) {
                            newScript[chapterIndex].content = fullChapterText;
                        }
                        return newScript;
                    });
                },
                (update) => {
                    setApiProvider(update.provider);
                    setApiKeyIndex(update.keyIndex);
                },
                abortController.current.signal
            );
            saveCurrentScript({ finalScript: [...finalScript] });
        } catch (err: any) {
             setError(`Failed to regenerate chapter ${chapterNumber}: ${err.message}`);
        } finally {
            setRegeneratingChapter(null);
        }

    }, [aiManager, outline, approvedHook, finalScript, saveCurrentScript, selectedStyleId, styles]);

    const handleSelectScript = (id: string) => {
        const script = storage.getScriptById(id);
        if (script) {
            resetState();
            setActiveScript(script);
            setTitle(script.title);
            setPlot(script.plot || '');
            if (script.outline) {
                setOutline(script.outline);
                setRawOutlineText("Outline loaded from library. Raw text editing not available.");
                setState(GenerationState.AWAITING_OUTLINE_APPROVAL);
                 setIsOutlineCollapsed(false);
            }
            if (script.hook) {
                setApprovedHook(script.hook);
                setHooks([script.hook]);
                setSelectedHookIndex(0);
                 setState(GenerationState.GENERATING_CHAPTERS);
            }
            if (script.finalScript && script.finalScript.length > 0) {
                setFinalScript(script.finalScript);
                const isComplete = script.outline && script.finalScript.length === script.outline.chapters.length;
                setState(isComplete ? GenerationState.COMPLETED : GenerationState.PAUSED);
            }
        }
    };
    
    const fullScriptText = useMemo(() => {
        if (!approvedHook && finalScript.length === 0) return '';
        let script = approvedHook;
        finalScript.forEach(chapter => {
          script += `\n\n\nChapter ${chapter.chapter}\n\n`;
          script += chapter.content;
        });
        return script;
      }, [approvedHook, finalScript]);

    const handleAnalyzeStyle = useCallback(async (scripts: string[]): Promise<string> => {
        abortController.current = new AbortController();
        let fullText = '';
        const prompt = getStyleAnalysisPrompt(scripts);
        await aiManager.generateStreamWithRotation(
            prompt,
            (chunk) => { fullText += chunk; },
            (update) => {
                setApiProvider(update.provider);
                setApiKeyIndex(update.keyIndex);
            },
            abortController.current.signal
        );
        return fullText;
    }, [aiManager]);

    const handleStopGeneration = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };
    
    const handleResumeGeneration = () => {
        // If generation stopped due to an error (e.g., all keys failed), reset the manager to try again from the start.
        if (state === GenerationState.ERROR) {
            aiManager.reset();
        }
        const nextChapter = finalScript.length + 1;
        if (outline && nextChapter <= outline.chapters.length) {
            handleGenerateChapters(nextChapter);
        }
    };

    const isGenerating = useMemo(() => [
        GenerationState.GENERATING_OUTLINE, 
        GenerationState.GENERATING_HOOK, 
        GenerationState.GENERATING_CHAPTERS
    ].includes(state) || regeneratingChapter !== null, [state, regeneratingChapter]);
    
    return (
         <div className="flex h-full w-full">
            <LibrarySidebar
                scripts={scripts}
                activeScriptId={activeScript?.id || null}
                onSelectScript={handleSelectScript}
                onDeleteScript={(id) => {
                    storage.deleteScript(id);
                    setScripts(storage.getScripts());
                    if(activeScript?.id === id) resetState();
                }}
                queue={queue}
                onStartQueue={() => alert("Automation queue coming soon!")}
                isAutomationRunning={isAutomationRunning}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                favoriteTitles={favoriteTitles}
                onSelectFavoriteTitle={(favTitle) => {
                    resetState();
                    setTitle(favTitle);
                }}
                onDeleteFavoriteTitle={(titleToDelete) => {
                    const updated = favoriteTitles.filter(f => f.title !== titleToDelete);
                    storage.saveFavoriteTitles(updated);
                    setFavoriteTitles(updated);
                }}
            />
            <div className="flex-grow p-6 flex flex-col overflow-y-auto">
                 <button onClick={onNavigateHome} className="absolute top-4 left-4 z-10 p-2 bg-surface rounded-full hover:bg-primary-variant transition-colors">
                     <HomeIcon />
                 </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Column: Input and Status */}
                    <div className="flex flex-col gap-6 sticky top-6">
                        <ScriptInputForm
                            onSubmit={handleGenerateOutline}
                            onAddToQueue={(job) => {
                                const newJob = { ...job, id: `job_${Date.now()}`};
                                const newQueue = [...queue, newJob];
                                setQueue(newQueue);
                                storage.saveQueue(newQueue);
                            }}
                            isGenerating={isGenerating}
                            title={title}
                            duration={duration}
                            plot={plot}
                            onTitleChange={setTitle}
                            onDurationChange={setDuration}
                            onPlotChange={setPlot}
                            styles={styles}
                            selectedStyleId={selectedStyleId}
                            onStyleChange={setSelectedStyleId}
                            onManageStyles={() => setIsStyleManagerOpen(true)}
                        />
                        {isOutlineManual && (
                            <ManualOutlineInput onSubmit={handleManualOutlineSubmit} error={error} />
                        )}
                        <StatusBar
                            state={state}
                            apiProvider={apiProvider}
                            apiKeyIndex={apiKeyIndex}
                            totalApiKeys={effectiveTotalApiKeys}
                            error={error}
                            currentChapter={currentChapter}
                            totalChapters={outline?.chapters.length || 0}
                        />
                         { outline && !isOutlineManual && (
                              <div className="bg-surface p-4 rounded-lg shadow-lg">
                                 <OutlineViewer
                                    outline={outline}
                                    rawOutlineText={rawOutlineText}
                                    onApprove={() => handleGenerateHooks()}
                                    onSaveEditedOutline={handleManualOutlineSubmit}
                                    isGenerating={isGenerating}
                                    isCollapsed={isOutlineCollapsed}
                                    onToggleCollapse={() => setIsOutlineCollapsed(!isOutlineCollapsed)}
                                />
                              </div>
                          )}
                    </div>

                    {/* Right Column: Editor */}
                    <div className="min-h-[calc(100vh-3rem)]">
                        <ScriptEditor
                            approvedHook={approvedHook}
                            hooks={hooks}
                            selectedHookIndex={selectedHookIndex}
                            finalScript={finalScript}
                            state={state}
                            onApproveHook={() => handleGenerateChapters(1)}
                            onRegenerateHooks={() => setIsRegenHookModalOpen(true)}
                            onSelectHook={setSelectedHookIndex}
                            onGoToSplitter={() => onNavigateToSplitter(fullScriptText)}
                            regeneratingChapter={regeneratingChapter}
                            onRegenerateChapter={handleRegenerateChapter}
                            onStopGeneration={handleStopGeneration}
                            onResumeGeneration={handleResumeGeneration}
                            outline={outline}
                        />
                    </div>
                </div>
            </div>

            <StyleManagerModal
                isOpen={isStyleManagerOpen}
                onClose={() => setIsStyleManagerOpen(false)}
                styles={styles}
                onAnalyze={handleAnalyzeStyle}
                onSave={(styleData) => {
                    styleService.saveStyle(styleData);
                    setStyles(styleService.getStyles());
                }}
                onDelete={(id) => {
                    styleService.deleteStyle(id);
                    setStyles(styleService.getStyles());
                }}
            />
            
            <RegenerateHookModal 
                isOpen={isRegenHookModalOpen}
                onClose={() => setIsRegenHookModalOpen(false)}
                onSubmit={handleGenerateHooks}
                isGenerating={state === GenerationState.GENERATING_HOOK}
            />

        </div>
    );
};

export default ScriptWriterView;