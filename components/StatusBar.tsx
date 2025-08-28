import React from 'react';
import { GenerationState, ApiProvider } from '../types';

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


interface StatusBarProps {
  state: GenerationState;
  apiProvider: ApiProvider;
  apiKeyIndex: number;
  totalApiKeys: number;
  error: string | null;
  currentChapter: number;
  totalChapters: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ state, apiProvider, apiKeyIndex, totalApiKeys, error, currentChapter, totalChapters }) => {
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
          <div className="pt-2 border-t border-gray-700">
              <ProgressBar current={currentChapter} total={totalChapters} label="Chapter Progress" />
          </div>
      )}
      {error && (
        <div className="pt-2 border-t border-gray-700">
          <p className="text-error font-semibold">Error Details:</p>
          <p className="text-error text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default StatusBar;