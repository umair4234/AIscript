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
import ScriptSplitter from './ScriptSplitter';
import PostGenerationStudio from './PostGenerationStudio';
import AutomationSetupModal from './AutomationSetupModal';
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
                    if(chapters[chapters.length - 1].summary) {
                         chapters[chapters.length - 1].summary += line.trim() + ' ';
                    }
                }
            }
        });
        
        chapters.forEach(ch => ch.summary = ch.summary.trim());

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

type PostGenTab = 'script' | 'splitter' | 'titles';
type AutomationStatus = 'running' | 'paused' | 'stopped';

const COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

interface ScriptWriterViewProps {
    initialTitle: string;
    initialPlot: string;
    onNavigateHome: () => void;
    onNavigateToSplitter: (script: string) => void;
    googleGenAI: any;
    geminiKeys: string[];
    groqKeys: string[];
    isMobileSidebarOpen: boolean;
    setIsMobileSidebarOpen: (isOpen: boolean) => void;
}

const ScriptWriterView: React.FC<ScriptWriterViewProps> = ({ initialTitle, initialPlot, onNavigateHome, googleGenAI, geminiKeys, groqKeys, isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
    // Form & Script State
    const [title, setTitle] = useState(initialTitle || '');
    const [duration, setDuration] = useState(100);
    const [plot, setPlot] = useState(initialPlot || '');
    const [state, setState] = useState<GenerationState>(GenerationState.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [outline, setOutline] = useState<ScriptOutline | null>(null);
    const [rawOutlineText, setRawOutlineText] = useState('');
    const [hooks, setHooks] = useState<string[]>([]);
    const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
    const [approvedHook, setApprovedHook] = useState('');
    const [finalScript, setFinalScript] = useState<ChapterContent[]>([]);
    const [currentChapter, setCurrentChapter] = useState(0);
    const [regeneratingChapter, setRegeneratingChapter] = useState<number | null>(null);

    // App Infrastructure State
    const [scripts, setScripts] = useState<ScriptRecord[]>([]);
    const [archivedScripts, setArchivedScripts] = useState<ScriptRecord[]>([]);
    const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
    const [apiProvider, setApiProvider] = useState<ApiProvider>(ApiProvider.GEMINI);
    const [apiKeyIndex, setApiKeyIndex] = useState(0);
    const [showArchived, setShowArchived] = useState(false);
    
    // Modals & UI State
    const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(true);
    const [isStyleManagerOpen, setIsStyleManagerOpen] = useState(false);
    const [isRegenHookModalOpen, setIsRegenHookModalOpen] = useState(false);
    const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
    const [postGenTab, setPostGenTab] = useState<PostGenTab>('script');

    // Styles & Favorites
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyleId, setSelectedStyleId] = useState('default');
    const [favoriteTitles, setFavoriteTitles] = useState<FavoriteTitle[]>([]);

    // Automation State
    const [automationQueue, setAutomationQueue] = useState<AutomationJob[]>([]);
    const [currentJobIndex, setCurrentJobIndex] = useState(0);
    const [automationStatus, setAutomationStatus] = useState<AutomationStatus>('stopped');

    // Refs
    const abortControllerRef = useRef(new AbortController());
    const aiManager = useRef(new AIManager(geminiKeys, groqKeys, googleGenAI));
    const automationLoopRef = useRef(false); // Prevents multiple loops

    // Derived State
    const isGenerating = useMemo(() => [
        GenerationState.GENERATING_OUTLINE, 
        GenerationState.GENERATING_HOOK, 
        GenerationState.GENERATING_CHAPTERS
    ].includes(state) || regeneratingChapter !== null, [state, regeneratingChapter]);

    const isAutomationActive = useMemo(() => automationStatus === 'running', [automationStatus]);
    
    // Memos
    const activeStyle = useMemo(() => styles.find(s => s.id === selectedStyleId), [styles, selectedStyleId]);
    const totalApiKeys = useMemo(() => geminiKeys.length + groqKeys.length, [geminiKeys, groqKeys]);

    // Data Loading Effects
    useEffect(() => {
        aiManager.current = new AIManager(geminiKeys, groqKeys, googleGenAI);
    }, [geminiKeys, groqKeys, googleGenAI]);

    const refreshLibrary = useCallback(() => {
        setScripts(storage.getScripts(false));
        setArchivedScripts(storage.getScripts(true).filter(s => s.isArchived));
        setStyles(styleService.getStyles());
        setFavoriteTitles(storage.getFavoriteTitles());
        setAutomationQueue(storage.getQueue());
    }, []);

    useEffect(() => {
        refreshLibrary();
    }, []);
    
    // Main Generation Logic (Refactored to be awaitable)
    const performGeneration = useCallback(async (
        prompt: string, 
        streamHandler: (chunk: string) => void
    ) => {
        abortControllerRef.current = new AbortController();
        setError(null);
        let fullText = '';
        try {
            await aiManager.current.generateStreamWithRotation(
                prompt,
                (chunk) => {
                    fullText += chunk;
                    streamHandler(fullText);
                },
                (update) => {
                    setApiProvider(update.provider);
                    setApiKeyIndex(update.keyIndex);
                },
                abortControllerRef.current.signal
            );
            return fullText;
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setError(error.message);
                setState(GenerationState.ERROR);
                if (activeScriptId) storage.saveScript({ status: GenerationState.ERROR, errorMessage: error.message }, activeScriptId);
            }
            throw error;
        }
    }, [activeScriptId]);

    const performOutlineGeneration = useCallback(async (genTitle: string, genDuration: number, genPlot: string, scriptId: string) => {
        setState(GenerationState.GENERATING_OUTLINE);
        storage.saveScript({ status: GenerationState.GENERATING_OUTLINE }, scriptId);
        const prompt = getOutlinePrompt(genTitle, genDuration, genPlot);
        
        const fullText = await performGeneration(prompt, (text) => setRawOutlineText(text));
        
        const parsed = parseOutline(fullText);
        if (parsed) {
            setOutline(parsed);
            setState(GenerationState.AWAITING_OUTLINE_APPROVAL);
            setIsOutlineCollapsed(false);
            storage.saveScript({ outline: parsed, status: GenerationState.AWAITING_OUTLINE_APPROVAL, rawOutlineText: fullText }, scriptId);
        } else {
            throw new Error("Failed to parse the generated outline. The format might be incorrect.");
        }
    }, [performGeneration]);
    
    const performHookGeneration = useCallback(async (currentOutline: ScriptOutline, scriptId: string): Promise<string[]> => {
        setState(GenerationState.GENERATING_HOOK);
        storage.saveScript({ status: GenerationState.GENERATING_HOOK }, scriptId);
        const prompt = getMultipleHooksPrompt(currentOutline);
        
        const fullText = await performGeneration(prompt, () => {});
        
        try {
            const parsedHooks = JSON.parse(fullText);
            if (Array.isArray(parsedHooks) && parsedHooks.every(h => typeof h === 'string')) {
                setHooks(parsedHooks);
                setState(GenerationState.AWAITING_HOOK_SELECTION);
                storage.saveScript({ status: GenerationState.AWAITING_HOOK_SELECTION }, scriptId);
                return parsedHooks;
            } else {
                throw new Error("AI did not return a valid JSON array of strings for hooks.");
            }
        } catch (e) {
            throw new Error("Failed to parse JSON hooks from the AI response.");
        }
    }, [performGeneration]);

    const performChapterGeneration = useCallback(async (scriptToGen: ScriptRecord, startChapterIndex: number) => {
        if (!scriptToGen.outline) throw new Error("Outline not found for chapter generation.");
        setState(GenerationState.GENERATING_CHAPTERS);
        storage.saveScript({ status: GenerationState.GENERATING_CHAPTERS }, scriptToGen.id);

        let scriptSoFar: ChapterContent[] = [...scriptToGen.finalScript];

        for (let i = startChapterIndex; i < scriptToGen.outline.chapters.length; i++) {
            const chapter = scriptToGen.outline.chapters[i];
            setCurrentChapter(chapter.chapter);
            
            const previousChapterContent = i > 0 && scriptSoFar[i-1] ? scriptSoFar[i-1].content : '';
            const prompt = getChapterPrompt(chapter.chapter, scriptToGen.outline, scriptToGen.hook, previousChapterContent, activeStyle?.styleJson || null);
            
            await performGeneration(prompt, (text) => {
                const existingChapterIndex = scriptSoFar.findIndex(c => c.chapter === chapter.chapter);
                const newChapterData = { ...chapter, content: text };
                if (existingChapterIndex !== -1) {
                    scriptSoFar[existingChapterIndex] = newChapterData;
                } else {
                    scriptSoFar.push(newChapterData);
                }
                setFinalScript([...scriptSoFar]);
            });
            // Final update after stream ends
            storage.saveScript({ finalScript: scriptSoFar }, scriptToGen.id);
        }

        setState(GenerationState.COMPLETED);
        storage.saveScript({ status: GenerationState.COMPLETED }, scriptToGen.id);
    }, [performGeneration, activeStyle]);
    
    // FIX: Moved `handleSelectScript` before `runAutomation` which depends on it to solve a "used before declaration" error.
    const handleSelectScript = useCallback((id: string, fromAutomation = false) => {
        if (isAutomationActive && !fromAutomation) return;
        const script = storage.getScriptById(id);
        if (script) {
            setActiveScriptId(id);
            setTitle(script.title);
            setPlot(script.plot);
            setOutline(script.outline);
            // FIX: Property 'rawOutlineText' did not exist on type 'ScriptRecord'. Also using existing `script` object instead of another lookup.
            setRawOutlineText(script.outline ? script.rawOutlineText || '' : '');
            setHooks(script.hook ? [script.hook] : []); // Simplified for now
            setSelectedHookIndex(script.hook ? 0 : null);
            setApprovedHook(script.hook);
            setFinalScript(script.finalScript);
            setState(script.status || GenerationState.IDLE);
            setDuration(script.outline?.totalWordCount ? Math.round(script.outline.totalWordCount / 150) : 100);
            setError(script.errorMessage || null);
            setPostGenTab('script');
        }
    }, [isAutomationActive]);

    // Automation Control Flow
    const pausableSleep = useCallback((ms: number) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, ms);
            const checkAborted = () => {
                if (abortControllerRef.current.signal.aborted) {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted by user', 'AbortError'));
                } else {
                    requestAnimationFrame(checkAborted);
                }
            };
            requestAnimationFrame(checkAborted);
        });
    }, []);

    const runAutomation = useCallback(async () => {
        if (automationLoopRef.current) return;
        automationLoopRef.current = true;

        for (let i = currentJobIndex; i < automationQueue.length; i++) {
            setCurrentJobIndex(i);
            const job = automationQueue[i];

            if (automationStatus !== 'running') {
                automationLoopRef.current = false;
                return;
            }

            aiManager.current.reset();
            setError(null);
            
            // Create and select a new script for this job
            const newScript = storage.saveScript({
                title: job.title,
                plot: job.plot,
                status: GenerationState.IDLE,
            });
            handleSelectScript(newScript.id, true);

            try {
                // Step 1: Outline
                await performOutlineGeneration(job.title, job.duration, job.plot, newScript.id);
                if (abortControllerRef.current.signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
                
                let currentScript = storage.getScriptById(newScript.id);
                if (!currentScript?.outline) throw new Error("Outline missing after generation step.");

                // Step 2: Hooks
                const generatedHooks = await performHookGeneration(currentScript.outline, newScript.id);
                if (abortControllerRef.current.signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
                
                if (!generatedHooks || generatedHooks.length === 0) throw new Error("Hooks were not generated.");

                // Step 3: Select Hook 1 and Write Chapters
                handleSelectHook(0);
                setApprovedHook(generatedHooks[0]);
                storage.saveScript({ hook: generatedHooks[0] }, newScript.id);
                
                currentScript = storage.getScriptById(newScript.id); // Refresh again
                if (!currentScript) throw new Error("Script disappeared");

                await performChapterGeneration(currentScript, 0);

            } catch (e: any) {
                if (e.name === 'AbortError') {
                    console.log("Automation paused by user.");
                    storage.saveScript({ status: GenerationState.PAUSED }, newScript.id);
                    setAutomationStatus('paused');
                    automationLoopRef.current = false;
                    return;
                }
                console.error(`Automation job for "${job.title}" failed:`, e);
                storage.saveScript({ status: GenerationState.ERROR, errorMessage: e.message }, newScript.id);
                // Cooldown and continue
                try {
                    await pausableSleep(COOLDOWN_PERIOD_MS);
                } catch { /* Paused during cooldown */
                     setAutomationStatus('paused');
                     automationLoopRef.current = false;
                     return;
                }
                continue; // Move to the next job
            }
            
            // Success: Cooldown before next job
            if (i < automationQueue.length - 1) {
                 try {
                    await pausableSleep(COOLDOWN_PERIOD_MS);
                } catch { /* Paused during cooldown */
                     setAutomationStatus('paused');
                     automationLoopRef.current = false;
                     return;
                }
            }
        }
        
        // Loop finished
        setAutomationStatus('stopped');
        setCurrentJobIndex(0); // Reset for next run
        automationLoopRef.current = false;

    }, [automationQueue, currentJobIndex, automationStatus, handleSelectScript, performOutlineGeneration, performHookGeneration, performChapterGeneration, pausableSleep]);

    useEffect(() => {
        if (automationStatus === 'running') {
            runAutomation();
        }
    }, [automationStatus, runAutomation]);


    const handleStartAutomation = (queue: AutomationJob[]) => {
        setAutomationQueue(queue);
        storage.saveQueue(queue);
        setCurrentJobIndex(0);
        setAutomationStatus('running');
        setIsAutomationModalOpen(false);
    };

    const handleStopAutomation = () => {
        abortControllerRef.current.abort(); // This will be caught inside runAutomation
    };

    const handleResumeAutomation = () => {
        setAutomationStatus('running');
    };
    

    // Handlers for User Actions
    const handleNewScript = () => {
        if (isAutomationActive) return;
        const newRecord = storage.saveScript({
            title: 'Untitled Script',
            status: GenerationState.IDLE,
        });
        refreshLibrary();
        handleSelectScript(newRecord.id);
    };

    const handleDeleteScript = (id: string) => {
        storage.deleteScript(id);
        if (activeScriptId === id) {
            handleNewScript();
        } else {
            refreshLibrary();
        }
    };

    const onArchiveScript = (id: string, isArchived: boolean) => {
        storage.onArchiveScript(id, isArchived);
        refreshLibrary();
        if (activeScriptId === id) {
            handleNewScript();
        }
    }
    
    const handleFormSubmit = useCallback(async (data: { title: string, duration: number, plot: string }) => {
        if (isGenerating) return;
        const newRecord = storage.saveScript({ title: data.title, plot: data.plot, status: GenerationState.IDLE }, activeScriptId);
        setActiveScriptId(newRecord.id);
        handleSelectScript(newRecord.id);
        refreshLibrary();
        
        try {
            await performOutlineGeneration(data.title, data.duration, data.plot, newRecord.id);
        } catch (e: any) {
             if (e.name !== 'AbortError') console.error("Outline generation failed:", e);
        } finally {
            refreshLibrary();
        }
    }, [activeScriptId, isGenerating, performOutlineGeneration, handleSelectScript, refreshLibrary]);

    const handleSaveEditedOutline = (newText: string) => {
        const parsed = parseOutline(newText);
        if (parsed) {
            setError(null);
            setOutline(parsed);
            setRawOutlineText(newText);
            if (activeScriptId) {
                storage.saveScript({ outline: parsed, rawOutlineText: newText }, activeScriptId);
                refreshLibrary();
            }
        } else {
            setError("Failed to parse the edited outline. Please check the format.");
        }
    };

    const handleApproveOutline = useCallback(async () => {
        if (!outline || !activeScriptId || isGenerating) return;
        try {
            await performHookGeneration(outline, activeScriptId);
        } catch (e: any) {
            if (e.name !== 'AbortError') console.error("Hook generation failed:", e);
        } finally {
            refreshLibrary();
        }
    }, [outline, activeScriptId, isGenerating, performHookGeneration, refreshLibrary]);

    const handleSelectHook = (index: number) => {
        if (isAutomationActive) return;
        setSelectedHookIndex(index);
    };

    const handleApproveHook = useCallback(async () => {
        if (selectedHookIndex === null || !activeScriptId || !outline || isGenerating) return;
        const hook = hooks[selectedHookIndex];
        setApprovedHook(hook);
        storage.saveScript({ hook, status: GenerationState.GENERATING_CHAPTERS }, activeScriptId);
        refreshLibrary();
        
        const scriptRecord = storage.getScriptById(activeScriptId);
        if (!scriptRecord) return;

        try {
            await performChapterGeneration(scriptRecord, 0);
        } catch(e:any) {
             if (e.name !== 'AbortError') console.error("Chapter generation failed:", e);
        } finally {
            refreshLibrary();
        }
    }, [selectedHookIndex, activeScriptId, outline, hooks, isGenerating, performChapterGeneration, refreshLibrary]);

    const handleRegenerateHooks = async (feedback?: string) => {
        if (!outline || !activeScriptId) return;

        setState(GenerationState.GENERATING_HOOK);
        setIsRegenHookModalOpen(false); // Close modal before starting
        storage.saveScript({ status: GenerationState.GENERATING_HOOK }, activeScriptId);

        let fullText = '';
        try {
            const prompt = feedback 
                ? getRegenerateHookWithFeedbackPrompt(outline, feedback)
                : getMultipleHooksPrompt(outline);
            
            fullText = await performGeneration(prompt, () => {});
            const parsedHooks = JSON.parse(fullText);
            if (Array.isArray(parsedHooks) && parsedHooks.every(h => typeof h === 'string')) {
                setHooks(parsedHooks);
                setSelectedHookIndex(null);
                setState(GenerationState.AWAITING_HOOK_SELECTION);
                storage.saveScript({ status: GenerationState.AWAITING_HOOK_SELECTION }, activeScriptId);
            } else {
                throw new Error("AI did not return a valid JSON array of strings for hooks.");
            }
        } catch (e: any) {
             if (e.name !== 'AbortError') console.error("Hook regeneration failed:", e);
        } finally {
            refreshLibrary();
        }
    };
    
    const handleRegenerateChapter = async (chapterNumber: number) => {
        if (!outline || !activeScriptId || regeneratingChapter) return;
        setRegeneratingChapter(chapterNumber);

        const currentScript = storage.getScriptById(activeScriptId);
        if (!currentScript) {
             setRegeneratingChapter(null);
             return;
        }
        
        const chapterData = outline.chapters.find(c => c.chapter === chapterNumber);
        if (!chapterData) {
            setRegeneratingChapter(null);
            return;
        }

        let fullChapterText = '';
        try {
             const previousChapterContent = chapterNumber > 1 && finalScript.find(c => c.chapter === chapterNumber - 1) ? finalScript.find(c => c.chapter === chapterNumber - 1)!.content : '';
             const prompt = getChapterPrompt(chapterNumber, outline, approvedHook, previousChapterContent, activeStyle?.styleJson || null);
             await performGeneration(prompt, (text) => {
                fullChapterText = text;
                setFinalScript(prev => prev.map(ch => ch.chapter === chapterNumber ? {...ch, content: text} : ch));
             });

             const updatedScript = finalScript.map(ch => ch.chapter === chapterNumber ? {...ch, content: fullChapterText} : ch);
             storage.saveScript({ finalScript: updatedScript }, activeScriptId);

        } catch (e: any) {
            if (e.name !== 'AbortError') console.error("Chapter regeneration failed:", e);
        } finally {
            setRegeneratingChapter(null);
            refreshLibrary();
        }
    };

    const handleStopGeneration = () => {
        abortControllerRef.current.abort();
        setState(GenerationState.PAUSED);
        if (activeScriptId) storage.saveScript({ status: GenerationState.PAUSED }, activeScriptId);
        refreshLibrary();
    };

    const handleResumeGeneration = useCallback(async () => {
        if (!activeScriptId || !outline) return;

        const lastCompletedChapter = finalScript.length;
        const scriptRecord = storage.getScriptById(activeScriptId);
        if(!scriptRecord) return;
        
        try {
            await performChapterGeneration(scriptRecord, lastCompletedChapter);
        } catch(e:any) {
             if (e.name !== 'AbortError') console.error("Resuming chapter generation failed:", e);
        } finally {
             refreshLibrary();
        }
    }, [activeScriptId, outline, finalScript, performChapterGeneration, refreshLibrary]);
    
    const handleUpdateScriptPostGen = (updates: Partial<ScriptRecord>) => {
        if (!activeScriptId) return;
        const updatedScript = storage.saveScript(updates, activeScriptId);
        handleSelectScript(updatedScript.id);
        refreshLibrary();
    };

    const handleAddToQueue = (job: Omit<AutomationJob, 'id'>) => {
        const newQueue = [...automationQueue, { ...job, id: `job_${Date.now()}` }];
        setAutomationQueue(newQueue);
        storage.saveQueue(newQueue);
    };
    
    const sidebar = (isMobile: boolean) => (
        <LibrarySidebar
            scripts={scripts}
            archivedScripts={archivedScripts}
            activeScriptId={activeScriptId}
            onSelectScript={handleSelectScript}
            onDeleteScript={handleDeleteScript}
            onArchiveScript={onArchiveScript}
            favoriteTitles={favoriteTitles}
            onSelectFavoriteTitle={(title, plot) => { setTitle(title); setPlot(plot); }}
            onDeleteFavoriteTitle={(id) => {
                const newFavs = favoriteTitles.filter(f => f.id !== id);
                storage.saveFavoriteTitles(newFavs);
                refreshLibrary();
            }}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            onManageQueue={() => setIsAutomationModalOpen(true)}
            onStopAutomation={handleStopAutomation}
            onResumeAutomation={handleResumeAutomation}
            automationStatus={automationStatus}
            isMobile={isMobile}
            onClose={() => setIsMobileSidebarOpen(false)}
        />
    );


    return (
        <div className="flex h-full w-full">
             {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)}>
                    {sidebar(true)}
                </div>
            )}
            <div className="hidden md:flex flex-shrink-0">
                {sidebar(false)}
            </div>

            <div className="flex-grow flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onNavigateHome} className="flex items-center gap-2 text-on-surface-secondary hover:text-primary">
                        <HomeIcon /> Back to Home
                    </button>
                    <button onClick={handleNewScript} className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-opacity-90 text-sm">
                        + New Script
                    </button>
                </div>
                
                <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
                    <div className="flex flex-col gap-6">
                        <ScriptInputForm
                            onSubmit={handleFormSubmit}
                            onAddToQueue={handleAddToQueue}
                            isGenerating={isGenerating}
                            isAutomationActive={isAutomationActive}
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
                        {state === GenerationState.ERROR && !outline && (
                             <ManualOutlineInput onSubmit={handleSaveEditedOutline} error={error} />
                        )}
                        <OutlineViewer
                            outline={outline}
                            rawOutlineText={rawOutlineText}
                            onApprove={handleApproveOutline}
                            onSaveEditedOutline={handleSaveEditedOutline}
                            isGenerating={isGenerating}
                            isAutomationActive={isAutomationActive}
                            isCollapsed={isOutlineCollapsed}
                            onToggleCollapse={() => setIsOutlineCollapsed(!isOutlineCollapsed)}
                        />
                        <StatusBar
                            state={state}
                            apiProvider={apiProvider}
                            apiKeyIndex={apiKeyIndex}
                            totalApiKeys={totalApiKeys}
                            error={error}
                            currentChapter={currentChapter}
                            totalChapters={outline?.chapters.length || 0}
                            outline={outline}
                            finalScript={finalScript}
                            onRegenerateChapter={handleRegenerateChapter}
                        />
                    </div>
                    <div className="flex flex-col min-h-0">
                        { state === GenerationState.COMPLETED && activeScriptId ? (
                            <div className="flex flex-col flex-grow bg-surface rounded-lg shadow-lg overflow-hidden">
                                 <div className="flex-shrink-0 flex border-b border-gray-700">
                                    <button onClick={() => setPostGenTab('script')} className={`flex-1 py-2 font-semibold ${postGenTab === 'script' ? 'bg-primary-variant text-white' : 'hover:bg-gray-800'}`}>Final Script</button>
                                    <button onClick={() => setPostGenTab('splitter')} className={`flex-1 py-2 font-semibold ${postGenTab === 'splitter' ? 'bg-primary-variant text-white' : 'hover:bg-gray-800'}`}>Splitter</button>
                                    <button onClick={() => setPostGenTab('titles')} className={`flex-1 py-2 font-semibold ${postGenTab === 'titles' ? 'bg-primary-variant text-white' : 'hover:bg-gray-800'}`}>Titles & Desc.</button>
                                </div>
                                {postGenTab === 'script' && <div className="p-4 flex-grow overflow-y-auto"><ScriptEditor {...{ approvedHook, hooks, selectedHookIndex, finalScript, state, onApproveHook: handleApproveHook, onRegenerateHooks: () => setIsRegenHookModalOpen(true), onSelectHook: handleSelectHook, onGoToSplitter: () => {}, regeneratingChapter, onRegenerateChapter: handleRegenerateChapter, onStopGeneration: handleStopGeneration, onResumeGeneration: handleResumeGeneration, outline, isAutomationActive }} /></div>}
                                {postGenTab === 'splitter' && <ScriptSplitter initialScript={finalScript.map(c => c.content).join('\n\n')} />}
                                {postGenTab === 'titles' && <PostGenerationStudio script={storage.getScriptById(activeScriptId)!} fullScriptText={finalScript.map(c => c.content).join('\n\n')} onUpdateScript={handleUpdateScriptPostGen} aiManager={aiManager.current} />}

                            </div>
                        ) : (
                            <ScriptEditor
                                approvedHook={approvedHook}
                                hooks={hooks}
                                selectedHookIndex={selectedHookIndex}
                                finalScript={finalScript}
                                state={state}
                                onApproveHook={handleApproveHook}
                                onRegenerateHooks={() => setIsRegenHookModalOpen(true)}
                                onSelectHook={handleSelectHook}
                                onGoToSplitter={() => {}}
                                regeneratingChapter={regeneratingChapter}
                                onRegenerateChapter={handleRegenerateChapter}
                                onStopGeneration={handleStopGeneration}
                                onResumeGeneration={handleResumeGeneration}
                                outline={outline}
                                isAutomationActive={isAutomationActive}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            <StyleManagerModal
                isOpen={isStyleManagerOpen}
                onClose={() => setIsStyleManagerOpen(false)}
                styles={styles}
                onSave={(style) => { styleService.saveStyle(style); refreshLibrary(); }}
                onDelete={(id) => { styleService.deleteStyle(id); refreshLibrary(); }}
                onAnalyze={async (scripts) => {
                    const prompt = getStyleAnalysisPrompt(scripts);
                    return await performGeneration(prompt, () => {});
                }}
            />
            <RegenerateHookModal 
                isOpen={isRegenHookModalOpen}
                onClose={() => setIsRegenHookModalOpen(false)}
                onSubmit={handleRegenerateHooks}
                isGenerating={state === GenerationState.GENERATING_HOOK}
            />
             <AutomationSetupModal
                isOpen={isAutomationModalOpen}
                onClose={() => setIsAutomationModalOpen(false)}
                currentQueue={automationQueue}
                onSaveQueue={(q) => { setAutomationQueue(q); storage.saveQueue(q); }}
                onStartAutomation={handleStartAutomation}
                favoriteTitles={favoriteTitles}
             />
        </div>
    );
};

export default ScriptWriterView;