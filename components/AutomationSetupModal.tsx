import React, { useState, useEffect } from 'react';
import { AutomationJob, FavoriteTitle } from '../types';
import { XIcon, TrashIcon, StarIcon } from './Icons';

interface AutomationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQueue: AutomationJob[];
  onSaveQueue: (queue: AutomationJob[]) => void;
  onStartAutomation: (queue: AutomationJob[]) => void;
  favoriteTitles: FavoriteTitle[];
}

const AutomationSetupModal: React.FC<AutomationSetupModalProps> = ({
  isOpen,
  onClose,
  currentQueue,
  onSaveQueue,
  onStartAutomation,
  favoriteTitles,
}) => {
  const [queue, setQueue] = useState<AutomationJob[]>(currentQueue);
  const [newTitle, setNewTitle] = useState('');
  const [newPlot, setNewPlot] = useState('');
  const [globalDuration, setGlobalDuration] = useState(100);

  useEffect(() => {
    setQueue(currentQueue);
  }, [currentQueue, isOpen]);

  if (!isOpen) return null;

  const handleAddJob = (title: string, plot: string, duration: number) => {
    if (title.trim()) {
      const newJob: AutomationJob = {
        id: `job_${Date.now()}_${Math.random()}`,
        title: title.trim(),
        plot: plot.trim(),
        duration: duration,
      };
      setQueue([...queue, newJob]);
      setNewTitle('');
      setNewPlot('');
    }
  };
  
  const handleAddFromFavorites = () => {
    const newJobs = favoriteTitles.map(fav => ({
        id: `job_${Date.now()}_${fav.id}`,
        title: fav.title,
        plot: '',
        duration: globalDuration
    }));
    setQueue([...queue, ...newJobs]);
  }

  const handleRemoveJob = (id: string) => {
    setQueue(queue.filter(job => job.id !== id));
  };

  const handleUpdateDuration = (id: string, newDuration: number) => {
    setQueue(queue.map(job => job.id === id ? { ...job, duration: newDuration } : job));
  };
  
  const handleApplyGlobalDuration = () => {
    setQueue(queue.map(job => ({ ...job, duration: globalDuration })));
  }

  const handleSave = () => {
    onSaveQueue(queue);
    onClose();
  };
  
  const handleStart = () => {
    onSaveQueue(queue);
    onStartAutomation(queue);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-4xl border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-on-surface">Automation Setup</h2>
          <button onClick={onClose} className="text-on-surface-secondary hover:text-white">
            <XIcon />
          </button>
        </div>

        <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
          {/* Left: Queue Management */}
          <div className="w-full md:w-2/3 flex flex-col">
            <h3 className="text-lg font-bold text-primary mb-2 flex-shrink-0">Automation Queue ({queue.length})</h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-2 bg-brand-bg p-2 rounded border border-gray-700">
              {queue.length > 0 ? queue.map(job => (
                <div key={job.id} className="bg-surface p-3 rounded-md flex items-center gap-4">
                  <div className="flex-grow">
                    <p className="font-semibold text-on-surface">{job.title}</p>
                    <p className="text-xs text-on-surface-secondary truncate">{job.plot || 'No plot specified'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="number"
                      value={job.duration}
                      onChange={(e) => handleUpdateDuration(job.id, parseInt(e.target.value, 10))}
                      className="w-20 bg-brand-bg border border-gray-600 rounded-md p-1 text-on-surface text-center"
                      min="1"
                    />
                    <span className="text-xs text-on-surface-secondary ml-1">min</span>
                  </div>
                  <button onClick={() => handleRemoveJob(job.id)} className="text-gray-500 hover:text-error">
                    <TrashIcon />
                  </button>
                </div>
              )) : <p className="text-center text-sm text-on-surface-secondary py-8">Queue is empty. Add jobs to start.</p>}
            </div>
          </div>

          {/* Right: Add to Queue */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
             <div>
                <h3 className="text-lg font-bold text-primary mb-2">Global Settings</h3>
                <div className="bg-brand-bg p-3 rounded border border-gray-700 space-y-3">
                     <div>
                        <label htmlFor="global-duration" className="block text-sm font-medium text-on-surface-secondary mb-1">Default Duration (minutes)</label>
                        <input
                            type="number"
                            id="global-duration"
                            value={globalDuration}
                            onChange={(e) => setGlobalDuration(parseInt(e.target.value, 10))}
                            className="w-full bg-surface border border-gray-600 rounded-md p-2 text-on-surface"
                            min="1"
                        />
                     </div>
                     <button onClick={handleApplyGlobalDuration} className="w-full text-sm py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Apply to All in Queue</button>
                </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">Add to Queue</h3>
               <div className="bg-brand-bg p-3 rounded border border-gray-700 space-y-3">
                  <button
                    onClick={handleAddFromFavorites}
                    disabled={favoriteTitles.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <StarIcon filled className="h-5 w-5"/> Add All Favorites ({favoriteTitles.length})
                  </button>
                  <div className="space-y-2">
                     <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New Video Title" className="w-full bg-surface border border-gray-600 rounded-md p-2 text-on-surface" />
                     <textarea value={newPlot} onChange={(e) => setNewPlot(e.target.value)} placeholder="Optional Plot Idea" rows={2} className="w-full bg-surface border border-gray-600 rounded-md p-2 text-on-surface" />
                     <button onClick={() => handleAddJob(newTitle, newPlot, globalDuration)} className="w-full py-2 bg-primary text-on-primary font-semibold rounded-md">Add Manually</button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex-shrink-0 flex justify-between items-center">
            <button onClick={handleSave} className="px-6 py-2 bg-gray-600 text-on-surface font-bold rounded-lg hover:bg-gray-500">
                Save & Close
            </button>
            <button onClick={handleStart} className="px-6 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:opacity-90 disabled:bg-gray-600" disabled={queue.length === 0}>
                Start Automation
            </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationSetupModal;