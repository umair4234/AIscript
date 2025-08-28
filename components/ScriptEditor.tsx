import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChapterContent, GenerationState, ScriptOutline } from '../types';
import { CopyIcon, CheckIcon, RefreshIcon, ChevronDownIcon, ChevronUpIcon, PlayIcon, StopIcon } from './Icons';

interface ScriptEditorProps {
  approvedHook: string;
  hooks: string[];
  selectedHookIndex: number | null;
  finalScript: ChapterContent[];
  state: GenerationState;
  onApproveHook: () => void;
  onRegenerateHooks: () => void;
  onSelectHook: (index: number) => void;
  onGoToSplitter: (script: string) => void;
  regeneratingChapter: number | null;
  onRegenerateChapter: (chapterNumber: number) => void;
  onStopGeneration: () => void;
  onResumeGeneration: () => void;
  outline: ScriptOutline | null;
  isAutomationActive: boolean;
}

const HookSelector: React.FC<Pick<ScriptEditorProps, 'hooks' | 'selectedHookIndex' | 'state' | 'onApproveHook' | 'onRegenerateHooks' | 'onSelectHook' | 'isAutomationActive'>> = ({
    hooks, selectedHookIndex, state, onApproveHook, onRegenerateHooks, onSelectHook, isAutomationActive
}) => {
    const isGenerating = state === GenerationState.GENERATING_HOOK;
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                 <h2 className="text-xl font-bold text-primary">Choose a Hook</h2>
                 {!isAutomationActive && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onRegenerateHooks}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-gray-700 rounded-md text-sm disabled:opacity-50"
                        >
                            <RefreshIcon />
                            Regenerate
                        </button>
                        <button
                            onClick={onApproveHook}
                            disabled={selectedHookIndex === null}
                            className="px-4 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:bg-opacity-90 transition-opacity disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                        >
                            Approve & Write
                        </button>
                    </div>
                 )}
            </div>
            <div className="flex-grow space-y-3 overflow-y-auto p-2 min-h-0">
                {hooks.map((hook, index) => (
                    <label key={index} className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedHookIndex === index ? 'border-primary bg-primary-variant' : 'border-gray-700 bg-brand-bg hover:bg-gray-800'}`}>
                        <div className="flex items-start">
                            <input
                                type="radio"
                                name="hook-selection"
                                checked={selectedHookIndex === index}
                                onChange={() => onSelectHook(index)}
                                className="mt-1 h-4 w-4 border-gray-500 bg-gray-700 text-primary focus:ring-primary"
                                disabled={isAutomationActive}
                            />
                            <p className="ml-3 text-on-surface whitespace-pre-wrap">{hook.split('"But before')[0]}</p>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};

const HookViewer: React.FC<{ hooks: string[] }> = ({ hooks }) => {
    const [hooksVisible, setHooksVisible] = useState(false);
    const [copiedHookIndex, setCopiedHookIndex] = useState<number | null>(null);

    const handleCopyHook = (hookText: string, index: number) => {
        navigator.clipboard.writeText(hookText);
        setCopiedHookIndex(index);
        setTimeout(() => setCopiedHookIndex(null), 2000);
    };

    if (hooks.length <= 1) return null;

    return (
        <div className="mb-4 border-b border-gray-700 pb-4 flex-shrink-0">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setHooksVisible(!hooksVisible)}>
                <h3 className="text-lg font-semibold text-secondary">View Hook Options</h3>
                <button className="text-secondary p-1">
                    {hooksVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
            </div>
            {hooksVisible && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                    {hooks.map((hook, index) => (
                        <div key={index} className="bg-brand-bg p-3 rounded-md border border-gray-600 flex justify-between items-start">
                            <p className="text-on-surface text-sm whitespace-pre-wrap mr-2">{hook}</p>
                            <button onClick={() => handleCopyHook(hook, index)} className="text-on-surface-secondary hover:text-primary transition-colors flex-shrink-0">
                                {copiedHookIndex === index ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const ScriptEditor: React.FC<ScriptEditorProps> = (props) => {
  const { approvedHook, finalScript, state, onGoToSplitter, regeneratingChapter, onRegenerateChapter, onStopGeneration, onResumeGeneration, outline } = props;
  const [hasCopied, setHasCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fullScriptTextWithHeadings = useMemo(() => {
    if (!approvedHook && finalScript.length === 0) return '';
    let script = approvedHook;
    finalScript.sort((a, b) => a.chapter - b.chapter).forEach(chapter => {
      script += `\n\n\nChapter ${chapter.chapter}\n\n`;
      script += chapter.content;
    });
    return script;
  }, [approvedHook, finalScript]);
  
  const scriptTextForCopyAndSplit = useMemo(() => {
    if (!approvedHook && finalScript.length === 0) return '';
    let script = approvedHook;
    finalScript.sort((a, b) => a.chapter - b.chapter).forEach(chapter => {
        script += `\n\n\n${chapter.content}`;
    });
    return script;
  }, [approvedHook, finalScript]);
  
  const wordCount = useMemo(() => fullScriptTextWithHeadings.trim().split(/\s+/).filter(Boolean).length, [fullScriptTextWithHeadings]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTextForCopyAndSplit);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  useEffect(() => {
    if (scrollContainerRef.current && !regeneratingChapter) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [finalScript.length, finalScript[finalScript.length - 1]?.content.length, regeneratingChapter]);

  const renderContent = () => {
    if (state === GenerationState.IDLE) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-on-surface-secondary">Fill out the video details to begin.</p>
            </div>
        )
    }

    if (state === GenerationState.GENERATING_OUTLINE) {
        return (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-xl animate-pulse">Generating script outline...</p>
            </div>
        )
    }

    if (state === GenerationState.AWAITING_OUTLINE_APPROVAL) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-on-surface-secondary">Approve the outline to continue.</p>
            </div>
        )
    }

    if (state === GenerationState.GENERATING_HOOK) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-xl animate-pulse">Generating hook options...</p>
        </div>
      );
    }

    if (state === GenerationState.AWAITING_HOOK_SELECTION) {
        return <HookSelector {...props} />;
    }
    
    if (state === GenerationState.GENERATING_CHAPTERS || state === GenerationState.COMPLETED || state === GenerationState.PAUSED || state === GenerationState.ERROR) {
       if (!approvedHook && finalScript.length === 0) return (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-on-surface-secondary">Waiting for script generation to start...</p>
            </div>
       );

      return (
        <>
            {approvedHook && <HookViewer hooks={props.hooks} />}
            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto pr-2 text-lg leading-relaxed min-h-0">
                <p className="whitespace-pre-wrap font-bold italic text-secondary">{approvedHook.split('"But before')[0]}</p>
                <p className="whitespace-pre-wrap my-4 text-on-surface-secondary text-base">{`"But before${approvedHook.split('"But before')[1] || ''}`}</p>

                {finalScript.sort((a,b) => a.chapter - b.chapter).map((chapter, index) => (
                    <div key={chapter.chapter}>
                        <div className="flex justify-between items-center mt-6 mb-2">
                             <h3 className="text-xl font-bold text-secondary">Chapter {chapter.chapter}</h3>
                             {(state === GenerationState.COMPLETED || state === GenerationState.PAUSED || state === GenerationState.ERROR) && (
                                 <button 
                                    onClick={() => onRegenerateChapter(chapter.chapter)} 
                                    disabled={regeneratingChapter !== null}
                                    className="p-1 text-on-surface-secondary hover:text-primary disabled:opacity-50 disabled:cursor-wait"
                                    title="Regenerate this chapter"
                                 >
                                    <RefreshIcon />
                                 </button>
                            )}
                        </div>
                        
                        {regeneratingChapter === chapter.chapter ? (
                             <p className="animate-pulse text-on-surface-secondary">Regenerating chapter...</p>
                        ) : (
                            <p className="whitespace-pre-wrap">{chapter.content}</p>
                        )}
                        
                        {state === GenerationState.GENERATING_CHAPTERS && index === finalScript.length - 1 && !regeneratingChapter && (
                            <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
                        )}
                    </div>
                ))}
            </div>
        </>
      );
    }

    return null;
  };


  return (
    <div className="flex flex-col flex-grow min-h-0">
     <div className="flex justify-between items-center mb-4 flex-shrink-0">
         <h2 className="text-xl font-bold text-primary">
            {state === GenerationState.AWAITING_HOOK_SELECTION ? '' : 'Final Script'}
         </h2>
         { (approvedHook || finalScript.length > 0) && (
             <div className="flex items-center gap-4">
                {state === GenerationState.GENERATING_CHAPTERS && (
                    <button onClick={onStopGeneration} className="flex items-center gap-2 px-4 py-2 bg-error text-white font-bold rounded-lg hover:bg-opacity-90 text-sm">
                        <StopIcon />
                        Stop
                    </button>
                )}
                {(state === GenerationState.PAUSED || state === GenerationState.ERROR) && outline && finalScript.length < outline.chapters.length && (
                    <button onClick={onResumeGeneration} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-opacity-90 text-sm">
                        <PlayIcon />
                        Resume
                    </button>
                )}
                {state === GenerationState.COMPLETED && (
                    <button
                        onClick={() => onGoToSplitter(scriptTextForCopyAndSplit)}
                        className="px-4 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:bg-opacity-90 text-sm"
                    >
                        Split Script
                    </button>
                )}
                 <span className="text-sm text-on-surface-secondary">{wordCount.toLocaleString()} words</span>
                 <button onClick={handleCopy} title="Copy script text without chapter headings" className="text-on-surface-secondary hover:text-primary transition-colors">
                     {hasCopied ? <CheckIcon /> : <CopyIcon />}
                 </button>
             </div>
         )}
      </div>
      <div className="flex-grow bg-brand-bg p-4 rounded-md border border-gray-700 flex flex-col min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default ScriptEditor;