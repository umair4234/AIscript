import React from 'react';
import { ScriptRecord, AutomationJob, FavoriteTitle, GenerationState } from '../types';
import { TrashIcon, StarIcon, CheckIcon, RefreshIcon, StopIcon, ArchiveIcon, BookUpIcon, XIcon, PlayIcon } from './Icons';

interface LibrarySidebarProps {
    scripts: ScriptRecord[];
    archivedScripts: ScriptRecord[];
    activeScriptId: string | null;
    onSelectScript: (id: string) => void;
    onDeleteScript: (id: string) => void;
    onArchiveScript: (id: string, isArchived: boolean) => void;
    onManageQueue: () => void;
    onStopAutomation: () => void;
    onResumeAutomation: () => void;
    automationStatus: 'running' | 'paused' | 'stopped';
    favoriteTitles: FavoriteTitle[];
    onSelectFavoriteTitle: (title: string, plot: string) => void;
    onDeleteFavoriteTitle: (id: string) => void;
    showArchived: boolean;
    setShowArchived: (show: boolean) => void;
    isMobile: boolean;
    onClose?: () => void;
}

const getStatusIcon = (status: GenerationState) => {
    switch (status) {
        case GenerationState.COMPLETED:
            return <div title="Completed" className="text-green-400"><CheckIcon /></div>;
        case GenerationState.GENERATING_OUTLINE:
        case GenerationState.GENERATING_HOOK:
        case GenerationState.GENERATING_CHAPTERS:
            return <div title="In Progress" className="animate-spin text-yellow-400"><RefreshIcon /></div>;
        case GenerationState.PAUSED:
             return <div title="Paused" className="text-yellow-400"><StopIcon /></div>;
        case GenerationState.ERROR:
             return <div title="Stopped / Error" className="text-error"><StopIcon /></div>;
        case GenerationState.AWAITING_HOOK_SELECTION:
        case GenerationState.AWAITING_OUTLINE_APPROVAL:
             return <div title="Action Required" className="text-blue-400"><RefreshIcon /></div>;
        default:
            return <div className="w-5 h-5"></div>; // Placeholder
    }
};

const ScriptList: React.FC<{
    title: string;
    scripts: ScriptRecord[];
    activeScriptId: string | null;
    onSelectScript: (id: string) => void;
    onDeleteScript: (id: string) => void;
    onArchiveScript: (id: string, isArchived: boolean) => void;
}> = ({ title, scripts, activeScriptId, onSelectScript, onDeleteScript, onArchiveScript }) => {
    
    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }

    return (
        <div>
            <h2 className="text-lg font-bold text-primary mb-2 flex-shrink-0">{title}</h2>
            {scripts.length > 0 ? (
                <ul className="space-y-2">
                    {scripts.map(script => (
                        <li key={script.id}>
                            <button
                                onClick={() => onSelectScript(script.id)}
                                title={script.title}
                                className={`w-full text-left p-2 rounded-md transition-colors flex items-center group ${activeScriptId === script.id ? 'bg-primary-variant text-white' : 'bg-surface hover:bg-gray-700'}`}
                            >
                                <div className="flex-shrink-0 w-6 h-6 mr-2 flex items-center justify-center">{getStatusIcon(script.status)}</div>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold truncate">{script.title}</p>
                                    <p className="text-xs text-on-surface-secondary">{new Date(script.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex-shrink-0 ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span onClick={(e) => handleAction(e, () => onArchiveScript(script.id, !script.isArchived))} className="p-1 text-gray-500 hover:text-secondary" title={script.isArchived ? "Unarchive" : "Archive"}>
                                        {script.isArchived ? <BookUpIcon /> : <ArchiveIcon />}
                                    </span>
                                    <span onClick={(e) => handleAction(e, () => { if (window.confirm("Are you sure?")) onDeleteScript(script.id) })} className="p-1 text-gray-500 hover:text-error" title="Delete">
                                        <TrashIcon />
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-on-surface-secondary text-sm mt-4">None found.</p>
            )}
        </div>
    );
};


const LibrarySidebar: React.FC<LibrarySidebarProps> = (props) => {
    const { 
        scripts, archivedScripts, activeScriptId, onSelectScript, onDeleteScript, onArchiveScript,
        onManageQueue, onStopAutomation, onResumeAutomation, automationStatus,
        favoriteTitles, onSelectFavoriteTitle, onDeleteFavoriteTitle, 
        showArchived, setShowArchived, isMobile, onClose
    } = props;
    
    const handleDeleteFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDeleteFavoriteTitle(id);
    };

    const AutomationButton = () => {
        if (automationStatus === 'running') {
            return (
                 <button onClick={onStopAutomation} className="w-full mb-4 bg-error text-white font-bold py-2 rounded-lg text-sm hover:bg-opacity-90 flex items-center justify-center gap-2">
                    <StopIcon /> Stop Automation
                 </button>
            );
        }
        if (automationStatus === 'paused') {
            return (
                <button onClick={onResumeAutomation} className="w-full mb-4 bg-green-500 text-white font-bold py-2 rounded-lg text-sm hover:bg-opacity-90 flex items-center justify-center gap-2">
                   <PlayIcon /> Resume Automation
                </button>
           );
        }
        return (
            <button onClick={onManageQueue} className="w-full mb-4 bg-secondary text-on-primary font-bold py-2 rounded-lg text-sm hover:bg-opacity-90">
                Manage Queue
            </button>
        );
    };
    
    return (
        <aside className={`bg-brand-bg border-r border-gray-700 flex flex-col p-4 h-full w-72 ${isMobile ? 'fixed inset-y-0 left-0 z-40' : ''}`}>
             <div className="flex justify-between items-center flex-shrink-0 mb-4">
                <h2 className="text-xl font-bold text-on-surface">Library</h2>
                {isMobile && <button onClick={onClose}><XIcon/></button>}
             </div>
             
             <AutomationButton />
            
            <div className="flex-grow overflow-y-auto pr-2 min-h-0 space-y-4">
                <ScriptList
                    title="Active Scripts"
                    scripts={scripts}
                    activeScriptId={activeScriptId}
                    onSelectScript={onSelectScript}
                    onDeleteScript={onDeleteScript}
                    onArchiveScript={onArchiveScript}
                />
                
                {showArchived && (
                     <ScriptList
                        title="Archived Scripts"
                        scripts={archivedScripts}
                        activeScriptId={activeScriptId}
                        onSelectScript={onSelectScript}
                        onDeleteScript={onDeleteScript}
                        onArchiveScript={onArchiveScript}
                    />
                )}

                 <div>
                    <h2 className="text-lg font-bold text-yellow-400 mb-2 flex-shrink-0">Favorite Titles</h2>
                    {favoriteTitles.length > 0 ? (
                         <ul className="space-y-2">
                            {favoriteTitles.map(fav => (
                                <li key={fav.id}>
                                    <button
                                        onClick={() => onSelectFavoriteTitle(fav.title, '')}
                                        title={fav.title}
                                        className="w-full text-left p-2 rounded-md transition-colors flex justify-between items-center bg-surface hover:bg-gray-700 group"
                                    >
                                        <div className="flex items-center flex-grow overflow-hidden">
                                             <StarIcon filled className="text-yellow-400 flex-shrink-0 h-5 w-5"/>
                                             <p className="font-semibold truncate ml-2">{fav.title}</p>
                                        </div>
                                        <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span onClick={(e) => handleDeleteFavorite(e, fav.id)} className="p-1 text-gray-500 hover:text-error">
                                                <TrashIcon />
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-center text-sm text-on-surface-secondary mt-4">No favorite titles.</p>
                    )}
                </div>
            </div>
            
            <div className="flex-shrink-0 pt-4 border-t border-gray-700 mt-auto">
                <label className="flex items-center justify-center text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-on-surface-secondary">Show Archived</span>
                </label>
            </div>
        </aside>
    );
};

export default LibrarySidebar;