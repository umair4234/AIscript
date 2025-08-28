import React from 'react';
import { ScriptRecord, AutomationJob, FavoriteTitle } from '../types';
import { TrashIcon, LayoutSidebarLeftCollapseIcon, LayoutSidebarLeftExpandIcon, StarIcon, SparklesIcon } from './Icons';

interface LibrarySidebarProps {
    scripts: ScriptRecord[];
    activeScriptId: string | null;
    onSelectScript: (id: string) => void;
    onDeleteScript: (id: string) => void;
    queue: AutomationJob[];
    onStartQueue: () => void;
    isAutomationRunning: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    favoriteTitles: FavoriteTitle[];
    onSelectFavoriteTitle: (title: string) => void;
    onDeleteFavoriteTitle: (title: string) => void;
}

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ 
    scripts, 
    activeScriptId, 
    onSelectScript, 
    onDeleteScript,
    queue,
    onStartQueue,
    isAutomationRunning,
    isCollapsed,
    onToggleCollapse,
    favoriteTitles,
    onSelectFavoriteTitle,
    onDeleteFavoriteTitle
}) => {
    
    const handleDeleteScript = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this script?")) {
            onDeleteScript(id);
        }
    };
    
    const handleDeleteFavorite = (e: React.MouseEvent, title: string) => {
        e.stopPropagation();
        onDeleteFavoriteTitle(title);
    };
    
    return (
        <aside className={`bg-brand-bg border-r border-gray-700 flex flex-col p-4 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`}>
             <div className="flex-shrink-0 mb-4">
                 <h2 className={`text-lg font-bold text-primary mb-2 transition-opacity ${isCollapsed ? 'opacity-0' : 'duration-300'}`}>Automation</h2>
                 <div className={`bg-surface rounded-lg p-3 text-sm space-y-2 max-h-40 overflow-y-auto ${isCollapsed ? 'hidden' : 'block'}`}>
                     {queue.length > 0 ? (
                         queue.map((job, index) => (
                             <div key={job.id} className={`p-2 rounded ${index === 0 && isAutomationRunning ? 'bg-primary-variant animate-pulse' : 'bg-brand-bg'}`}>
                                 <p className="font-semibold truncate text-on-surface">{job.title}</p>
                                 <p className="text-xs text-on-surface-secondary">{job.duration} mins</p>
                             </div>
                         ))
                     ) : (
                         <p className="text-on-surface-secondary text-center py-2">Queue empty.</p>
                     )}
                 </div>
                 {queue.length > 0 && !isCollapsed && (
                     <button
                         onClick={onStartQueue}
                         disabled={isAutomationRunning}
                         className="w-full mt-3 bg-secondary text-on-primary font-bold py-2 rounded-lg text-sm hover:bg-opacity-90 transition-opacity disabled:bg-gray-600"
                     >
                         {isAutomationRunning ? 'Running...' : `Start Queue (${queue.length})`}
                     </button>
                 )}
             </div>
            
            <h2 className={`text-lg font-bold text-primary mb-2 flex-shrink-0 transition-opacity ${isCollapsed ? 'opacity-0' : 'duration-300'}`}>Library</h2>
            <div className={`flex-grow overflow-y-auto overflow-x-hidden pr-2 min-h-0 ${isCollapsed ? 'space-y-4' : 'space-y-2'}`}>
                {scripts.length > 0 ? (
                    <ul className="space-y-2">
                        {scripts.map(script => (
                            <li key={script.id}>
                                <button
                                    onClick={() => onSelectScript(script.id)}
                                    title={isCollapsed ? script.title : ''}
                                    className={`w-full text-left p-3 rounded-md transition-colors flex justify-between items-center ${activeScriptId === script.id ? 'bg-primary-variant text-white' : 'bg-surface hover:bg-gray-700'}`}
                                >
                                    <div className={`flex-grow overflow-hidden ${isCollapsed ? 'hidden' : 'block'}`}>
                                        <p className="font-semibold truncate">{script.title}</p>
                                        <p className="text-xs text-on-surface-secondary">{new Date(script.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                        <span onClick={(e) => handleDeleteScript(e, script.id)} className={`text-gray-500 hover:text-error ${isCollapsed ? 'mx-auto' : ''}`}>
                                            <TrashIcon />
                                        </span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={`text-center text-on-surface-secondary mt-4 ${isCollapsed ? 'hidden' : 'block'}`}>No scripts saved.</p>
                )}
            </div>

             <div className="flex-shrink-0 pt-4 border-t border-gray-700 mt-4">
                <h2 className={`text-lg font-bold text-yellow-400 mb-2 flex-shrink-0 transition-opacity ${isCollapsed ? 'opacity-0' : 'duration-300'}`}>Favorite Titles</h2>
                <div className={`flex-grow overflow-y-auto overflow-x-hidden pr-2 min-h-0 max-h-48 ${isCollapsed ? 'space-y-4' : 'space-y-2'}`}>
                    {favoriteTitles.length > 0 ? (
                         <ul className="space-y-2">
                            {favoriteTitles.map(fav => (
                                <li key={fav.id}>
                                    <button
                                        onClick={() => onSelectFavoriteTitle(fav.title)}
                                        title={isCollapsed ? fav.title : ''}
                                        className="w-full text-left p-3 rounded-md transition-colors flex justify-between items-center bg-surface hover:bg-gray-700"
                                    >
                                        <div className={`flex items-center flex-grow overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                                             <StarIcon filled className="text-yellow-400 flex-shrink-0 h-5 w-5"/>
                                             <p className={`font-semibold truncate ml-2 ${isCollapsed ? 'hidden' : 'block'}`}>{fav.title}</p>
                                        </div>
                                        <div className={`flex-shrink-0 ml-2 ${isCollapsed ? 'hidden' : 'block'}`}>
                                            <span onClick={(e) => handleDeleteFavorite(e, fav.title)} className="text-gray-500 hover:text-error">
                                                <TrashIcon />
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className={`text-center text-sm text-on-surface-secondary mt-4 ${isCollapsed ? 'hidden' : 'block'}`}>No favorite titles.</p>
                    )}
                </div>
            </div>
            
            <div className="flex-shrink-0 pt-4 border-t border-gray-700 mt-auto">
                 <button onClick={onToggleCollapse} className="w-full p-2 flex items-center justify-center text-on-surface-secondary hover:text-primary rounded-md hover:bg-surface">
                     {isCollapsed ? <LayoutSidebarLeftExpandIcon /> : <LayoutSidebarLeftCollapseIcon />}
                 </button>
            </div>
        </aside>
    );
};

export default LibrarySidebar;