import React, { useState } from 'react';
import { AutomationJob, Style } from '../types';

interface ScriptInputFormProps {
  onSubmit: (data: { title: string; duration: number; plot: string; }) => void;
  onAddToQueue: (data: Omit<AutomationJob, 'id'>) => void;
  isGenerating: boolean;
  title: string;
  duration: number;
  plot: string;
  onTitleChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onPlotChange: (value: string) => void;
  styles: Style[];
  selectedStyleId: string;
  onStyleChange: (id: string) => void;
  onManageStyles: () => void;
}

const ScriptInputForm: React.FC<ScriptInputFormProps> = ({ 
    onSubmit, 
    onAddToQueue, 
    isGenerating, 
    title,
    duration,
    plot,
    onTitleChange,
    onDurationChange,
    onPlotChange,
    styles,
    selectedStyleId,
    onStyleChange,
    onManageStyles
}) => {
  const [isQueueMode, setIsQueueMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isQueueMode) {
      onAddToQueue({ title, duration, plot });
    } else {
      onSubmit({ title, duration, plot });
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-primary">Video Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-on-surface-secondary mb-1">Video Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
            placeholder="e.g., They Left Their Dog in a Flood..."
            required
            disabled={isGenerating}
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-on-surface-secondary mb-1">Video Duration (minutes)</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => onDurationChange(parseInt(e.target.value, 10))}
            className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
            min="1"
            required
            disabled={isGenerating}
          />
        </div>
        <div>
          <label htmlFor="plot" className="block text-sm font-medium text-on-surface-secondary mb-1">Optional Plot Idea</label>
          <textarea
            id="plot"
            value={plot}
            onChange={(e) => onPlotChange(e.target.value)}
            rows={4}
            className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
            placeholder="Any specific ideas for the story?"
            disabled={isGenerating}
          />
        </div>

        <div>
            <label htmlFor="style" className="block text-sm font-medium text-on-surface-secondary mb-1">Writing Style</label>
            <div className="flex gap-2">
                <select
                    id="style"
                    value={selectedStyleId}
                    onChange={(e) => onStyleChange(e.target.value)}
                    className="flex-grow bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
                    disabled={isGenerating}
                >
                    <option value="default">Default Style</option>
                    {styles.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={onManageStyles}
                    className="px-4 py-2 bg-gray-600 text-on-surface font-semibold rounded-lg hover:bg-gray-500 text-sm"
                    disabled={isGenerating}
                >
                    Manage
                </button>
            </div>
        </div>

        <div className="flex items-center justify-between pt-2">
            <label htmlFor="queue-mode" className="flex items-center text-sm cursor-pointer">
                <input
                    type="checkbox"
                    id="queue-mode"
                    checked={isQueueMode}
                    onChange={(e) => setIsQueueMode(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-on-surface-secondary">Add to Queue</span>
            </label>
        </div>
        <button
          type="submit"
          disabled={isGenerating || !title || duration < 1}
          className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-opacity-90 transition-opacity disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : (isQueueMode ? 'Add to Automation Queue' : 'Generate Outline')}
        </button>
      </form>
    </div>
  );
};

export default ScriptInputForm;