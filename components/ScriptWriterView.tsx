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
    const [title, setTitle] = useState(initialTitle || '');
    const [duration, setDuration] = useState(100);
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
    const [scripts, setScripts] = useState<ScriptRecord[]>([]);
    const [archivedScripts, setArchivedScripts] = useState<ScriptRecord[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [activeScript, setActiveScript] = useState<ScriptRecord | null>(null);
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyleId, setSelectedStyleId] = useState('default');
    const [apiProvider, setApiProvider] = useState<ApiProvider>(ApiProvider.GEMINI);
    const [apiKeyIndex, setApiKeyIndex] = useState(0);
    const [queue, setQueue] = useState<AutomationJob[]>([]);
    const [isAutomationRunning, setIsAutomationRunning] = useState(false);
    const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);
    const [favoriteTitles, setFavoriteTitles] = useState<FavoriteTitle[]>([]);
    const [regeneratingChapter, setRegeneratingChapter] = useState<number | null>(null);
    const [activePostGenTab, setActivePostGenTab] = useState<PostGenTab>('script');
    
    // Modals state
    const [isStyleManagerOpen, setIsStyleManagerOpen] = useState(false);
    const [isRegenHookModalOpen, setIsRegenHookModalOpen] = useState(false);
    const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);

    const abortController = useRef<AbortController | null>(null);
    const isMounted = useRef(true);

    const aiManager = useMemo(() => {
        return new AIManager(geminiKeys, groqKeys, googleGenAI);
    }, [geminiKeys, groqKeys, googleGenAI]);

    const effectiveTotalApiKeys = useMemo(() => {
        return apiProvider === ApiProvider.GEMINI ? geminiKeys.length : groqKeys.length;
    }, [apiProvider, geminiKeys, groqKeys]);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadScripts = useCallback(() => {
        setScripts(storage.getScripts(false));
        setArchivedScripts(storage.getScripts(true).filter(s => s.isArchived));
    }, []);

    useEffect(() => {
        loadScripts();
        setQueue(storage.getQueue());
        setStyles(styleService.getStyles());
        setFavoriteTitles(storage.getFavoriteTitles());
    }, [loadScripts]);

    useEffect(() => {
        if (!activeScript) setTitle(initialTitle || '');
    }, [initialTitle, activeScript]);

    useEffect(() => {
        if (!activeScript) setPlot(initialPlot || '');
    }, [initialPlot, activeScript]);


    const resetState = useCallback((clearInputs = true) => {
        if (clearInputs) {
            setTitle('');
            setDuration(100);
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
        setActivePostGenTab('script');
        if (abortController.current) {
            abortController.current.abort();
        }
    }, [aiManager]);
    
    const handleUpdateActiveScript = useCallback((updates: Partial<ScriptRecord>) => {
        if (!activeScript) return;
        const updatedScript = { ...activeScript, ...updates };
        setActiveScript(updatedScript);
        storage.saveScript(updatedScript, updatedScript.id);
        if (isMounted.current) {
            loadScripts();
        }
        return updatedScript;
    }, [activeScript, loadScripts]);

    const handleGenerateOutline = useCallback(async (data: { title: string; duration: number; plot: string; }, forScriptId?: string) => {
        if (!forScriptId) {
            resetState(false);
        }
        let scriptToUpdate = activeScript;
        if (forScriptId) {
            scriptToUpdate = storage.getScriptById(forScriptId);
        }

        const newScript = scriptToUpdate 
            ? storage.saveScript({ ...scriptToUpdate, title: data.title, plot: data.plot, status: GenerationState.GENERATING_OUTLINE }, scriptToUpdate.id)
            : storage.saveScript({ title: data.title, plot: data.plot, status: GenerationState.GENERATING_OUTLINE });
        
        if (isMounted.current) {
            setActiveScript(newScript);
            setState(GenerationState.GENERATING_OUTLINE);
            loadScripts();
        }
        
        abortController.current = new AbortController();
        let fullText = '';
        try {
            const prompt = getOutlinePrompt(data.title, data.duration, data.plot);
            await aiManager.generateStreamWithRotation(
                prompt, (chunk) => { fullText += chunk; if (!forScriptId) setRawOutlineText(fullText); },
                (update) => { if (!forScriptId) { setApiProvider(update.provider); setApiKeyIndex(update.keyIndex); }},
                abortController.current.signal
            );
            const parsedOutline = parseOutline(fullText);
            if (parsedOutline) {
                storage.saveScript({ outline: parsedOutline, title: parsedOutline.title, status: GenerationState.AWAITING_HOOK_SELECTION }, newScript.id);
                if (isMounted.current) {
                    if (!forScriptId) {
                        setOutline(parsedOutline);
                        setTitle(parsedOutline.title);
                        setState(GenerationState.AWAITING_HOOK_SELECTION);
                    }
                    loadScripts();
                }
                return parsedOutline; // For automation
            } else {
                throw new Error("Failed to parse the generated outline.");
            }
        } catch (err: any) {
            if (isMounted.current) {
                storage.saveScript({ status: GenerationState.ERROR, errorMessage: err.message }, newScript.id);
                if (!forScriptId) {
                    setError(err.message);
                    setState(GenerationState.ERROR);
                    setIsOutlineManual(true);
                }
                loadScripts();
            }
            throw err; // Re-throw for automation
        }
    }, [aiManager, resetState, activeScript, loadScripts]);

    const handleGenerateHooksForAutomation = useCallback(async (outline: ScriptOutline, forScriptId: string): Promise<string> => {
        abortController.current = new AbortController();
        let fullText = '';
        try {
            const prompt = getMultipleHooksPrompt(outline);
            await aiManager.generateStreamWithRotation(prompt, (chunk) => { fullText += chunk; }, () => {}, abortController.current.signal);
            let cleanedText = fullText.trim().replace(/^```json\s*|```\s*$/g, '');
            const parsedHooks = JSON.parse(cleanedText);
            const firstHook = parsedHooks[0] || '';
            storage.saveScript({ hook: firstHook }, forScriptId);
            return firstHook;
        } catch (err: any) {
            storage.saveScript({ status: GenerationState.ERROR, errorMessage: `Failed to generate hook: ${err.message}` }, forScriptId);
            throw err;
        }
    }, [aiManager]);

    const handleGenerateChapters = useCallback(async (config: {startChapter?: number; forScriptId?: string; outline: ScriptOutline; hook: string}) => {
        const { startChapter = 1, forScriptId, outline, hook } = config;

        const isManual = !forScriptId;

        if (isManual) {
            if (selectedHookIndex === null && startChapter === 1) return;
            const hookToUse = startChapter > 1 ? approvedHook : hooks[selectedHookIndex!];
            if (startChapter === 1) {
                setApprovedHook(hookToUse);
                setFinalScript([]);
            }
            setState(GenerationState.GENERATING_CHAPTERS);
            setError(null);
        }
        
        abortController.current = new AbortController();
        const selectedStyle = styles.find(s => s.id === selectedStyleId);
        let scriptRecord = forScriptId ? storage.getScriptById(forScriptId) : activeScript;
        if (!scriptRecord) throw new Error("Script record not found for chapter generation.");
        
        storage.saveScript({ status: GenerationState.GENERATING_CHAPTERS, hook }, scriptRecord.id);
        if (isMounted.current) loadScripts();

        let currentRunScript = [...(scriptRecord.finalScript || [])];

        for (let i = startChapter; i <= outline.chapters.length; i++) {
            if(isManual) setCurrentChapter(i);
            let fullChapterText = '';

            const chapterOutline = outline.chapters.find(c => c.chapter === i)!;
            if (currentRunScript.findIndex(c => c.chapter === i) === -1) {
                currentRunScript.push({ ...chapterOutline, content: '' });
            }
            if(isManual) setFinalScript([...currentRunScript]);

            try {
                const prevContent = i > 1 ? currentRunScript.find(c => c.chapter === i - 1)!.content : '';
                const prompt = getChapterPrompt(i, outline, hook, prevContent, selectedStyle?.styleJson ?? null);
                
                await aiManager.generateStreamWithRotation(
                    prompt,
                    (chunk) => {
                        fullChapterText += chunk;
                        const chapterToUpdate = currentRunScript.find(c => c.chapter === i)!;
                        chapterToUpdate.content = fullChapterText;
                        if(isManual) setFinalScript([...currentRunScript]);
                    },
                    (update) => { if(isManual) { setApiProvider(update.provider); setApiKeyIndex(update.keyIndex); } },
                    abortController.current.signal
                );
                storage.saveScript({ finalScript: [...currentRunScript] }, scriptRecord.id);
                if (isMounted.current) loadScripts();

            } catch (err: any) {
                storage.saveScript({ status: GenerationState.ERROR, errorMessage: `Failed on chapter ${i}: ${err.message}`, finalScript: currentRunScript }, scriptRecord.id);
                if (isMounted.current) {
                    if(isManual) {
                        setError(`Failed on chapter ${i}: ${err.message}`);
                        setState(GenerationState.ERROR);
                    }
                    loadScripts();
                }
                throw err;
            }
        }
        
        storage.saveScript({ status: GenerationState.COMPLETED, finalScript: currentRunScript }, scriptRecord.id);
        if (isMounted.current) {
            if(isManual) {
                setState(GenerationState.COMPLETED);
                alert('Script generation completed successfully!');
            }
            loadScripts();
        }
    }, [selectedHookIndex, approvedHook, hooks, aiManager, styles, selectedStyleId, activeScript, loadScripts]);

    const runAutomationQueue = useCallback(async () => {
        setIsAutomationRunning(true);
        let currentQueue = storage.getQueue();
    
        while (currentQueue.length > 0) {
            const job = currentQueue[0];
            const scriptRecord = storage.saveScript({ title: job.title, plot: job.plot, status: GenerationState.GENERATING_OUTLINE });
            if (isMounted.current) {
                loadScripts();
                setActiveScript(scriptRecord);
            }
    
            try {
                // Step 1: Generate Outline
                const outlineResult = await handleGenerateOutline({ title: job.title, duration: job.duration, plot: job.plot }, scriptRecord.id);
                if (!outlineResult) throw new Error("Outline generation failed or was invalid.");
    
                // Step 2: Generate Hooks and select the first one
                const hookResult = await handleGenerateHooksForAutomation(outlineResult, scriptRecord.id);
                if (!hookResult) throw new Error("Hook generation failed.");
    
                // Step 3: Generate all chapters
                await handleGenerateChapters({ outline: outlineResult, hook: hookResult, forScriptId: scriptRecord.id });
                
                // Remove job from queue after success
                storage.saveFavoriteTitles(storage.getFavoriteTitles().filter(f => f.title !== job.title));

            } catch (error: any) {
                console.error(`Automation failed for job "${job.title}":`, error);
                // The error is already saved in the script record by the individual functions
            }
    
            // Update queue and cooldown
            currentQueue.shift();
            storage.saveQueue(currentQueue);
            if (isMounted.current) {
                setQueue(currentQueue);
                loadScripts();
                setFavoriteTitles(storage.getFavoriteTitles());
            }
    
            if (currentQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5-minute cooldown
            }
        }
    
        if (isMounted.current) {
            setIsAutomationRunning(false);
            alert("Automation queue finished!");
        }
    }, [loadScripts, handleGenerateOutline, handleGenerateHooksForAutomation, handleGenerateChapters]);

    const handleSelectScript = (id: string) => {
        const script = storage.getScriptById(id);
        if (script) {
            resetState(false);
            setActiveScript(script);
            setTitle(script.title);
            setPlot(script.plot || '');
            setState(script.status || GenerationState.IDLE);
            setOutline(script.outline || null);
            setRawOutlineText(script.outline ? "Outline loaded from library." : "");
            setIsOutlineCollapsed(false);
            setApprovedHook(script.hook || '');
            setHooks(script.hook ? [script.hook] : []);
            setSelectedHookIndex(script.hook ? 0 : null);
            setFinalScript(script.finalScript || []);
            if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
            if (script.status === GenerationState.COMPLETED) setActivePostGenTab('script');
        }
    };
    
    // ... (other handlers like manual outline, regen chapter, etc.)
    const handleManualOutlineSubmit = (text: string) => {
        const parsed = parseOutline(text);
        if (parsed) {
            setRawOutlineText(text);
            setOutline(parsed);
            setTitle(parsed.title);
            setState(GenerationState.AWAITING_HOOK_SELECTION);
            handleUpdateActiveScript({ outline: parsed, title: parsed.title, status: GenerationState.AWAITING_HOOK_SELECTION });
            setIsOutlineManual(false);
            setError(null);
        } else {
            setError("The provided text could not be parsed into a valid outline.");
        }
    };

    const handleGenerateHooks = useCallback(async (feedback?: string) => {
        if (!outline) return;
        setHooks([]); setSelectedHookIndex(null); setState(GenerationState.GENERATING_HOOK); setIsRegenHookModalOpen(false);
        abortController.current = new AbortController();
        let fullText = '';
        try {
            const prompt = feedback ? getRegenerateHookWithFeedbackPrompt(outline, feedback) : getMultipleHooksPrompt(outline);
            await aiManager.generateStreamWithRotation(prompt, (chunk) => { fullText += chunk; }, (update) => { setApiProvider(update.provider); setApiKeyIndex(update.keyIndex); }, abortController.current.signal);
            let cleanedText = fullText.trim().replace(/^```json\s*|```\s*$/g, '');
            const parsedHooks = JSON.parse(cleanedText);
            setHooks(parsedHooks); setState(GenerationState.AWAITING_HOOK_SELECTION); handleUpdateActiveScript({ status: GenerationState.AWAITING_HOOK_SELECTION });
        } catch (err: any) {
            setError(`Failed to generate or parse hooks: ${err.message}`); setState(GenerationState.ERROR); handleUpdateActiveScript({ status: GenerationState.ERROR });
        }
    }, [aiManager, outline, handleUpdateActiveScript]);

    const handleRegenerateChapter = useCallback(async (chapterNumber: number) => {
        if (!outline || !approvedHook) return;
        setRegeneratingChapter(chapterNumber); abortController.current = new AbortController();
        const selectedStyle = styles.find(s => s.id === selectedStyleId);
        let fullChapterText = '';
        try {
            const prevContent = chapterNumber > 1 ? finalScript.find(c => c.chapter === chapterNumber - 1)!.content : '';
            const prompt = getChapterPrompt(chapterNumber, outline, approvedHook, prevContent, selectedStyle?.styleJson ?? null);
            await aiManager.generateStreamWithRotation(prompt, (chunk) => {
                fullChapterText += chunk;
                setFinalScript(prev => prev.map(c => c.chapter === chapterNumber ? {...c, content: fullChapterText} : c));
            }, (update) => { setApiProvider(update.provider); setApiKeyIndex(update.keyIndex); }, abortController.current.signal);
            handleUpdateActiveScript({ finalScript });
        } catch (err: any) { setError(`Failed to regenerate chapter ${chapterNumber}: ${err.message}`);
        } finally { setRegeneratingChapter(null); }
    }, [aiManager, outline, approvedHook, finalScript, handleUpdateActiveScript, selectedStyleId, styles]);

    const handleArchiveScript = (id: string, isArchived: boolean) => {
        storage.onArchiveScript(id, isArchived);
        loadScripts();
        if (activeScript?.id === id) {
            resetState();
        }
    };

    const handleAnalyzeStyle = useCallback(async (scripts: string[]): Promise<string> => {
        abortController.current = new AbortController();
        let fullText = '';
        const prompt = getStyleAnalysisPrompt(scripts);
        await aiManager.generateStreamWithRotation(prompt, (chunk) => { fullText += chunk; }, (update) => { setApiProvider(update.provider); setApiKeyIndex(update.keyIndex); }, abortController.current.signal);
        return fullText;
    }, [aiManager]);

    const isGenerating = useMemo(() => [
        GenerationState.GENERATING_OUTLINE, GenerationState.GENERATING_HOOK, GenerationState.GENERATING_CHAPTERS
    ].includes(state) || regeneratingChapter !== null || isAutomationRunning, [state, regeneratingChapter, isAutomationRunning]);

    const fullScriptTextForPostGen = useMemo(() => {
        if (!activeScript?.hook || !activeScript.finalScript) return '';
        return [activeScript.hook, ...[...activeScript.finalScript].sort((a, b) => a.chapter - b.chapter).map(c => c.content)].join('\n\n\n');
    }, [activeScript]);
    
    const TabButton: React.FC<{ tab: PostGenTab; label: string }> = ({ tab, label }) => (
        <button onClick={() => setActivePostGenTab(tab)} className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${activePostGenTab === tab ? 'bg-surface text-primary border-b-2 border-primary' : 'text-on-surface-secondary hover:bg-surface'}`}>{label}</button>
    );
    
    return (
         <div className="flex h-full w-full overflow-hidden">
            <div className="hidden md:flex md:flex-shrink-0">
                <LibrarySidebar scripts={scripts} archivedScripts={archivedScripts} activeScriptId={activeScript?.id || null} onSelectScript={handleSelectScript} onDeleteScript={(id) => { storage.deleteScript(id); loadScripts(); if(activeScript?.id === id) resetState(); }} onArchiveScript={handleArchiveScript} onManageQueue={() => setIsAutomationModalOpen(true)} isAutomationRunning={isAutomationRunning} favoriteTitles={favoriteTitles} onSelectFavoriteTitle={(favTitle) => { resetState(); setTitle(favTitle); }} onDeleteFavoriteTitle={(id) => { storage.saveFavoriteTitles(favoriteTitles.filter(f => f.id !== id)); setFavoriteTitles(storage.getFavoriteTitles()); }} showArchived={showArchived} setShowArchived={setShowArchived} isMobile={false} />
            </div>
            {isMobileSidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsMobileSidebarOpen(false)}>
                    <LibrarySidebar scripts={scripts} archivedScripts={archivedScripts} activeScriptId={activeScript?.id || null} onSelectScript={handleSelectScript} onDeleteScript={(id) => { storage.deleteScript(id); loadScripts(); if(activeScript?.id === id) resetState(); }} onArchiveScript={handleArchiveScript} onManageQueue={() => setIsAutomationModalOpen(true)} isAutomationRunning={isAutomationRunning} favoriteTitles={favoriteTitles} onSelectFavoriteTitle={(favTitle) => { resetState(); setTitle(favTitle); }} onDeleteFavoriteTitle={(id) => { storage.saveFavoriteTitles(favoriteTitles.filter(f => f.id !== id)); setFavoriteTitles(storage.getFavoriteTitles()); }} showArchived={showArchived} setShowArchived={setShowArchived} isMobile={true} onClose={() => setIsMobileSidebarOpen(false)} />
                </div>
            )}

            <div className="flex-grow p-4 md:p-6 flex flex-col overflow-y-auto">
                 <button onClick={onNavigateHome} className="absolute top-4 right-20 z-10 p-2 bg-surface rounded-full hover:bg-primary-variant transition-colors md:hidden">
                     <HomeIcon />
                 </button>
                
                 {activeScript && activeScript.status === GenerationState.COMPLETED ? (
                    <div className="flex flex-col h-full">
                        <div className="flex-shrink-0 border-b border-gray-700">
                            <TabButton tab="script" label="Script" />
                            <TabButton tab="splitter" label="Splitter" />
                            <TabButton tab="titles" label="Titles & Description" />
                        </div>
                        <div className="flex-grow overflow-y-auto pt-4">
                            {activePostGenTab === 'script' && <ScriptEditor {...{ approvedHook: activeScript.hook, hooks: [activeScript.hook], selectedHookIndex: 0, finalScript: activeScript.finalScript, state: GenerationState.COMPLETED, onRegenerateChapter: handleRegenerateChapter, outline: activeScript.outline }} onSelectHook={()=>{}} onApproveHook={()=>{}} onRegenerateHooks={()=>{}} onGoToSplitter={()=>{}} onStopGeneration={()=>{}} onResumeGeneration={()=>{}} regeneratingChapter={regeneratingChapter} />}
                            {activePostGenTab === 'splitter' && <ScriptSplitter initialScript={fullScriptTextForPostGen} initialSections={activeScript.splitScript} onSplit={(sections) => handleUpdateActiveScript({ splitScript: sections })} />}
                            {activePostGenTab === 'titles' && <PostGenerationStudio script={activeScript} fullScriptText={fullScriptTextForPostGen} onUpdateScript={handleUpdateActiveScript} aiManager={aiManager} />}
                        </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col gap-6 sticky top-6">
                            <ScriptInputForm onSubmit={(data) => handleGenerateOutline(data)} onAddToQueue={(job) => { const newJob = { ...job, id: `job_${Date.now()}`}; const newQueue = [...queue, newJob]; setQueue(newQueue); storage.saveQueue(newQueue); }} isGenerating={isGenerating} title={title} duration={duration} plot={plot} onTitleChange={setTitle} onDurationChange={setDuration} onPlotChange={setPlot} styles={styles} selectedStyleId={selectedStyleId} onStyleChange={setSelectedStyleId} onManageStyles={() => setIsStyleManagerOpen(true)} />
                            {isOutlineManual && <ManualOutlineInput onSubmit={handleManualOutlineSubmit} error={error} />}
                            <StatusBar state={state} apiProvider={apiProvider} apiKeyIndex={apiKeyIndex} totalApiKeys={effectiveTotalApiKeys} error={error} currentChapter={currentChapter} totalChapters={outline?.chapters.length || 0} outline={outline} finalScript={finalScript} onRegenerateChapter={handleRegenerateChapter} />
                            { outline && !isOutlineManual && (
                                <div className="bg-surface p-4 rounded-lg shadow-lg">
                                    <OutlineViewer outline={outline} rawOutlineText={rawOutlineText} onApprove={() => handleGenerateHooks()} onSaveEditedOutline={handleManualOutlineSubmit} isGenerating={isGenerating} isCollapsed={isOutlineCollapsed} onToggleCollapse={() => setIsOutlineCollapsed(!isOutlineCollapsed)} />
                                </div>
                            )}
                        </div>
                        <div className="min-h-[calc(100vh-3rem)]">
                            <ScriptEditor approvedHook={approvedHook} hooks={hooks} selectedHookIndex={selectedHookIndex} finalScript={finalScript} state={state} onApproveHook={() => handleGenerateChapters({outline: outline!, hook: hooks[selectedHookIndex!]})} onRegenerateHooks={() => setIsRegenHookModalOpen(true)} onSelectHook={setSelectedHookIndex} onGoToSplitter={() => setActivePostGenTab('splitter')} regeneratingChapter={regeneratingChapter} onRegenerateChapter={handleRegenerateChapter} onStopGeneration={() => abortController.current?.abort()} onResumeGeneration={() => handleGenerateChapters({startChapter: finalScript.length + 1, outline: outline!, hook: approvedHook})} outline={outline} />
                        </div>
                    </div>
                 )}
            </div>

            <AutomationSetupModal isOpen={isAutomationModalOpen} onClose={() => setIsAutomationModalOpen(false)} currentQueue={queue} onSaveQueue={(newQueue) => { setQueue(newQueue); storage.saveQueue(newQueue); }} onStartAutomation={runAutomationQueue} favoriteTitles={favoriteTitles} />
            <StyleManagerModal isOpen={isStyleManagerOpen} onClose={() => setIsStyleManagerOpen(false)} styles={styles} onAnalyze={handleAnalyzeStyle} onSave={(styleData) => { styleService.saveStyle(styleData); setStyles(styleService.getStyles()); }} onDelete={(id) => { styleService.deleteStyle(id); setStyles(styleService.getStyles()); }} />
            <RegenerateHookModal isOpen={isRegenHookModalOpen} onClose={() => setIsRegenHookModalOpen(false)} onSubmit={handleGenerateHooks} isGenerating={state === GenerationState.GENERATING_HOOK} />
        </div>
    );
};

export default ScriptWriterView;