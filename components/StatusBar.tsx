import React, { useState, useMemo } from 'react';
import { GenerationState, ApiProvider, ScriptOutline, ChapterContent } from '../types';
import { ChevronDownIcon, ChevronUpIcon, RefreshIcon } from './Icons';

interface ProgressBarProps {
    current: number;
    total: number;
    label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
    if (total === 0) return null;
    const percentage = Math.round((current / total) * 100);
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-on-surface">{label}</span>
                <span className="text-sm font-medium text-on-surface-secondary">{current} / {total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-secondary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

interface ChapterProgressDetailsProps {
    outline: ScriptOutline;
    finalScript: ChapterContent[];
    state: GenerationState;
    currentChapter: number;
    onRegenerateChapter: (chapterNumber: number) => void;
}

const ChapterProgressDetails: React.FC<ChapterProgressDetailsProps> = ({ outline, finalScript, state, currentChapter, onRegenerateChapter }) => {
    const chapterDetails = useMemo(() => {
        return outline.chapters.map(chap => {
            const finalChapter = finalScript.find(fc => fc.chapter === chap.chapter);
            const wordsWritten = finalChapter ? finalChapter.content.trim().split(/\s+/).filter(Boolean).length : 0;
            
            let status: 'Completed' | 'Writing...' | 'Pending' | 'Failed' = 'Pending';
            if (finalChapter && wordsWritten > 0) {
                status = 'Completed';
            }
            if (state === GenerationState.GENERATING_CHAPTERS && currentChapter === chap.chapter) {
                status = 'Writing...';
            }
            if ((state === GenerationState.ERROR || state === GenerationState.PAUSED) && !finalChapter) {
                status = 'Failed';
            }

            return {
                ...chap,
                wordsWritten,
                status
            };
        });
    }, [outline, finalScript, state, currentChapter]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Completed': return 'text-green-400';
            case 'Writing...': return 'text-yellow-400 animate-pulse';
            case 'Failed': return 'text-error';
            default: return 'text-on-surface-secondary';
        }
    };
    
    return (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {chapterDetails.map(chap => (
                <div key={chap.chapter} className="grid grid-cols-12 gap-2 items-center text-xs bg-brand-bg p-2 rounded">
                    <span className="font-bold col-span-2">Ch. {chap.chapter}</span>
                    <span className="col-span-4">Assigned: {chap.wordCount} words</span>
                    <span className="col-span-3">Written: {chap.wordsWritten}</span>
                    <span className={`font-semibold col-span-2 ${getStatusColor(chap.status)}`}>{chap.status}</span>
                    <div className="col-span-1 text-right">
                         {(chap.status === 'Completed' || chap.status === 'Failed') && (
                            <button
                                onClick={() => onRegenerateChapter(chap.chapter)}
                                title={`Regenerate Chapter ${chap.chapter}`}
                                className="text-on-surface-secondary hover:text-primary"
                            >
                                <RefreshIcon />
                            </button>
                         )}
                    </div>
                </div>
            ))}
        </div>
    );
};


interface StatusBarProps {
  state: GenerationState;
  apiProvider: ApiProvider;
  apiKeyIndex: number;
  totalApiKeys: number;
  error: string | null;
  currentChapter: number;
  totalChapters: number;
  outline: ScriptOutline | null;
  finalScript: ChapterContent[];
  onRegenerateChapter: (chapterNumber: number) => void;
}

const StatusBar: React.FC<StatusBarProps> = (props) => {
  const { state, apiProvider, apiKeyIndex, totalApiKeys, error, currentChapter, totalChapters, outline } = props;
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);

  const getStatusMessage = () => {
    switch (state) {
      case GenerationState.IDLE:
        return 'Ready to start.';
      case GenerationState.GENERATING_OUTLINE:
        return 'Generating outline...';
      case GenerationState.AWAITING_OUTLINE_APPROVAL:
        return 'Waiting for outline approval.';
      case GenerationState.GENERATING_HOOK:
        return 'Generating hook...';
      case GenerationState.AWAITING_HOOK_SELECTION:
        return 'Waiting for hook selection.';
      case GenerationState.GENERATING_CHAPTERS:
        return 'Writing script chapters...';
      case GenerationState.PAUSED:
        return 'Generation paused.';
      case GenerationState.COMPLETED:
        return 'Script completed!';
      case GenerationState.ERROR:
        return 'An error occurred.';
      default:
        return 'Unknown state.';
    }
  };

  const statusColor = 
    state === GenerationState.COMPLETED ? 'text-green-400' :
    state === GenerationState.ERROR || state === GenerationState.PAUSED ? 'text-error' :
    'text-yellow-400';

  return (
    <div className="bg-surface p-4 rounded-lg shadow-lg text-sm space-y-3 mt-6">
      <div className="flex justify-between items-center">
        <span className="font-bold text-on-surface">Status</span>
        <span className={`font-semibold ${statusColor}`}>{getStatusMessage()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-bold text-on-surface">{apiProvider} API Key</span>
        <span className="text-on-surface-secondary">
          {apiKeyIndex >= totalApiKeys ? 'All keys used' : `Using key ${apiKeyIndex + 1} of ${totalApiKeys}`}
        </span>
      </div>
      
      {state === GenerationState.GENERATING_CHAPTERS && totalChapters > 0 && (
          <div className="pt-2">
              <ProgressBar current={currentChapter} total={totalChapters} label="Chapter Progress" />
          </div>
      )}
      
      {error && (
        <div className="pt-2 border-t border-gray-700">
          <p className="text-error font-semibold">Error Details:</p>
          <p className="text-error text-xs">{error}</p>
        </div>
      )}
      
      {outline && (
        <div className="pt-2 border-t border-gray-700">
            <button onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} className="flex justify-between items-center w-full py-1">
                <span className="font-semibold text-on-surface">Chapter Details</span>
                {isDetailsCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            </button>
            {!isDetailsCollapsed && <div className="mt-2"><ChapterProgressDetails {...props} /></div>}
        </div>
      )}
    </div>
  );
};

export default StatusBar;