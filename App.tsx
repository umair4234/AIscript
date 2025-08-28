import React, { useState, useEffect } from 'react';
import PasswordProtection from './components/PasswordProtection';
import { ScissorsIcon, SparklesIcon, FileTextIcon, SettingsIcon } from './components/Icons';
import ScriptSplitter from './components/ScriptSplitter';
import ScriptWriterView from './components/ScriptWriterView';
import TitleStudio from './components/TitleStudio';
import ApiManagerModal from './components/ApiManagerModal';
import * as storage from './services/storageService';

type View = 'home' | 'titles' | 'writer' | 'splitter';

// =================================================================================
// Component: ViewSelector
// =================================================================================
const ViewSelector: React.FC<{ onSelectView: (view: View) => void; }> = ({ onSelectView }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 min-h-screen">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2">AI Script Writer Pro</h1>
            <p className="text-lg text-on-surface-secondary">Choose your starting point.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            <button
                onClick={() => onSelectView('titles')}
                className="group bg-surface p-8 rounded-xl shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 border border-transparent hover:border-primary"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-primary-variant p-4 rounded-full mb-4 text-primary">
                        <SparklesIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Title Studio</h2>
                    <p className="text-on-surface-secondary">Generate viral title ideas and brainstorm your next big video before writing a single word.</p>
                </div>
            </button>
            <button
                onClick={() => onSelectView('writer')}
                className="group bg-surface p-8 rounded-xl shadow-lg hover:shadow-secondary/20 hover:scale-105 transition-all duration-300 border border-transparent hover:border-secondary"
            >
                <div className="flex flex-col items-center text-center">
                     <div className="bg-secondary/20 p-4 rounded-full mb-4 text-secondary">
                        <FileTextIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Script Writer</h2>
                    <p className="text-on-surface-secondary">Provide a title and let the AI generate a complete, structured script from outline to final draft.</p>
                </div>
            </button>
             <button
                onClick={() => onSelectView('splitter')}
                className="group bg-surface p-8 rounded-xl shadow-lg hover:shadow-green-400/20 hover:scale-105 transition-all duration-300 border border-transparent hover:border-green-400"
            >
                <div className="flex flex-col items-center text-center">
                     <div className="bg-green-400/20 p-4 rounded-full mb-4 text-green-400">
                        <ScissorsIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Script Splitter</h2>
                    <p className="text-on-surface-secondary">Paste a long script to analyze its stats and split it into smaller, manageable sections.</p>
                </div>
            </button>
        </div>
    </div>
  );
};


// =================================================================================
// Main App Component
// =================================================================================
const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState<View>('home');
    const [scriptForSplitter, setScriptForSplitter] = useState('');
    const [titleForWriter, setTitleForWriter] = useState('');
    const [plotForWriter, setPlotForWriter] = useState('');
    const [googleGenAI, setGoogleGenAI] = useState<any>(null);
    const [isLoadingSdk, setIsLoadingSdk] = useState(true);
    const [sdkError, setSdkError] = useState<string | null>(null);

    // API Key management is now centralized in the main App component
    const [geminiKeys, setGeminiKeys] = useState<string[]>([]);
    const [groqKeys, setGroqKeys] = useState<string[]>([]);
    const [isApiManagerOpen, setIsApiManagerOpen] = useState(false);

    useEffect(() => {
        // Check session storage to persist login across refreshes
        if (sessionStorage.getItem('isAuthenticated') === 'true') {
            setIsAuthenticated(true);
        }

        // Load API keys from local storage on initial load
        setGeminiKeys(storage.getGeminiApiKeys());
        setGroqKeys(storage.getGroqApiKeys());

        // Dynamically load the Google GenAI SDK
        const loadSdk = async () => {
          try {
            // Using a dynamic import() inside an async function
            const genAI = await import('https://esm.run/@google/genai');
            setGoogleGenAI(() => genAI.GoogleGenAI); // Store the constructor function
          } catch (e) {
            console.error('Failed to load Google GenAI SDK', e);
            setSdkError('Failed to load the Google GenAI SDK. Please check your internet connection and ad-blockers, then refresh the page.');
          } finally {
            setIsLoadingSdk(false);
          }
        };

        loadSdk();
    }, []);

    const handleLoginSuccess = () => {
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    };
    
    const handleSaveApiKeys = (newGeminiKeys: string[], newGroqKeys: string[]) => {
        storage.saveGeminiApiKeys(newGeminiKeys);
        storage.saveGroqApiKeys(newGroqKeys);
        setGeminiKeys(newGeminiKeys);
        setGroqKeys(newGroqKeys);
    };

    if (isLoadingSdk) {
      return (
        <div className="h-screen w-screen flex items-center justify-center">
          <p className="text-xl animate-pulse">Loading AI Engine...</p>
        </div>
      );
    }
    
    if (sdkError) {
        return (
          <div className="h-screen w-screen flex items-center justify-center p-4">
            <p className="text-error text-center">{sdkError}</p>
          </div>
        );
    }

    if (!isAuthenticated) {
        return <PasswordProtection onSuccess={handleLoginSuccess} />;
    }
    
    const handleNavigate = (view: View, data?: any) => {
        if (view === 'writer' && data?.title) {
            setTitleForWriter(data.title);
            setPlotForWriter(data.plot || '');
        }
        if (view === 'splitter' && data?.script) {
            setScriptForSplitter(data.script);
        } else if (view !== 'writer') {
            setScriptForSplitter(''); 
        }
        setCurrentView(view);
    };
    
    const handleBackToHome = () => {
        setCurrentView('home');
        setTitleForWriter('');
        setPlotForWriter('');
    };

    const renderView = () => {
        switch (currentView) {
            case 'titles':
                return <TitleStudio 
                            onBack={handleBackToHome} 
                            onUseTitle={(data) => handleNavigate('writer', data)} 
                            googleGenAI={googleGenAI}
                            geminiKeys={geminiKeys}
                            groqKeys={groqKeys}
                        />;
            case 'writer':
                return <ScriptWriterView 
                            initialTitle={titleForWriter} 
                            initialPlot={plotForWriter}
                            onNavigateHome={handleBackToHome}
                            onNavigateToSplitter={(script) => handleNavigate('splitter', { script })}
                            googleGenAI={googleGenAI}
                            geminiKeys={geminiKeys}
                            groqKeys={groqKeys}
                        />;
            case 'splitter':
                return <ScriptSplitter initialScript={scriptForSplitter} onBack={handleBackToHome} />;
            case 'home':
            default:
                return <ViewSelector onSelectView={(view) => handleNavigate(view)} />;
        }
    };

    return (
        <main className="h-screen w-screen flex flex-col bg-brand-bg text-on-surface">
           {renderView()}

           {/* Global Settings Button */}
            <button
                onClick={() => setIsApiManagerOpen(true)}
                className="fixed top-4 right-4 z-50 text-on-surface-secondary hover:text-primary p-3 rounded-full bg-surface hover:bg-primary-variant shadow-lg"
                aria-label="Manage API Keys"
            >
                <SettingsIcon />
            </button>

            <ApiManagerModal
                isOpen={isApiManagerOpen}
                onClose={() => setIsApiManagerOpen(false)}
                currentGeminiKeys={geminiKeys}
                currentGroqKeys={groqKeys}
                onSave={handleSaveApiKeys}
            />
        </main>
    );
}

export default App;