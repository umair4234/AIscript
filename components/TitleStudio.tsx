import React, { useState, useMemo, useEffect } from 'react';
import { AIManager } from '../services/aiService';
import { getCompetitorAnalysisTitlePrompt, getDefaultTitlePrompt, getPlotIdeaPrompt } from '../services/promptService';
import * as storage from '../services/storageService';
import { FavoriteTitle } from '../types';
import { ArrowLeftIcon, LightbulbIcon, StarIcon, TrashIcon } from './Icons';

interface TitleStudioProps {
    onBack: () => void;
    onUseTitle: (data: { title: string; plot?: string; }) => void;
    googleGenAI: any; // The loaded SDK constructor
    geminiKeys: string[];
    groqKeys: string[];
}

const TitleStudio: React.FC<TitleStudioProps> = ({ onBack, onUseTitle, googleGenAI, geminiKeys, groqKeys }) => {
    const [competitorTitles, setCompetitorTitles] = useState('');
    const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
    const [favoriteTitles, setFavoriteTitles] = useState<FavoriteTitle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plotIdeas, setPlotIdeas] = useState<Record<string, string>>({});
    const [loadingPlot, setLoadingPlot] = useState<string | null>(null);

    const aiManager = useMemo(() => {
        return new AIManager(geminiKeys, groqKeys, googleGenAI);
    }, [geminiKeys, groqKeys, googleGenAI]);

    useEffect(() => {
        setFavoriteTitles(storage.getFavoriteTitles());
    }, []);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedTitles([]);
        setPlotIdeas({});
        let fullText = '';
        const prompt = competitorTitles.trim()
            ? getCompetitorAnalysisTitlePrompt(competitorTitles)
            : getDefaultTitlePrompt();
        
        try {
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => { fullText += chunk; },
                () => {}, // no-op for provider update
                new AbortController().signal
            );
            const titles = fullText.trim().split('\n').map(t => t.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
            setGeneratedTitles(titles);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePlot = async (title: string) => {
        setLoadingPlot(title);
        try {
            const prompt = getPlotIdeaPrompt(title);
            let plotText = '';
            await aiManager.generateStreamWithRotation(
                prompt,
                (chunk) => { plotText += chunk },
                () => {},
                new AbortController().signal
            );
            setPlotIdeas(prev => ({...prev, [title]: plotText.trim() }));
        } catch (err: any) {
            console.error(`Failed to get plot for "${title}"`, err);
            setPlotIdeas(prev => ({...prev, [title]: "Error generating plot idea."}));
        } finally {
            setLoadingPlot(null);
        }
    };

    const handleToggleFavorite = (title: string) => {
        const isFavorite = favoriteTitles.some(f => f.title === title);
        let newFavorites;
        if (isFavorite) {
            newFavorites = favoriteTitles.filter(f => f.title !== title);
        } else {
            newFavorites = [{ id: `fav_${Date.now()}`, title, createdAt: new Date().toISOString() }, ...favoriteTitles];
        }
        setFavoriteTitles(newFavorites);
        storage.saveFavoriteTitles(newFavorites);
    };

    const handleUseTitle = (title: string) => {
        const plot = plotIdeas[title] || '';
        onUseTitle({ title, plot });
    };

    return (
        <div className="w-full flex-grow flex flex-col p-6 md:p-8 overflow-y-auto">
            <header className="flex items-center mb-6 flex-shrink-0">
                <button onClick={onBack} className="p-2 mr-4 bg-surface hover:bg-primary-variant rounded-full">
                    <ArrowLeftIcon />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Title Studio</h1>
                    <p className="text-on-surface-secondary">Generate and brainstorm viral video titles.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
                {/* Left Side: Input & Favorites */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface p-6 rounded-lg shadow-lg">
                        <label htmlFor="competitor-titles" className="text-lg font-semibold text-on-surface mb-2 block">Analyze Competitor Titles (Optional)</label>
                        <p className="text-sm text-on-surface-secondary mb-3">Paste titles from other channels (one per line) to match their viral style. Leave blank to generate fresh ideas.</p>
                        <textarea
                            id="competitor-titles"
                            value={competitorTitles}
                            onChange={(e) => setCompetitorTitles(e.target.value)}
                            rows={8}
                            className="w-full bg-brand-bg border border-gray-600 rounded-md p-3 text-on-surface focus:ring-primary focus:border-primary font-mono text-sm"
                            placeholder="e.g., They Abandoned Their Dog, But Didn't Know a Lawyer's Daughter Was Watching."
                        />
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4 bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-opacity-90 transition-opacity disabled:bg-gray-600">
                            {isLoading ? 'Generating...' : 'Generate Titles'}
                        </button>
                    </div>

                    <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col min-h-0 flex-grow">
                        <h2 className="text-lg font-semibold text-yellow-400 mb-3 flex-shrink-0">Favorite Titles</h2>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                            {favoriteTitles.length > 0 ? favoriteTitles.map(fav => (
                                <div key={fav.id} className="bg-brand-bg p-3 rounded-md flex justify-between items-center group">
                                    <p className="text-on-surface flex-grow pr-2">{fav.title}</p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleUseTitle(fav.title)} className="opacity-0 group-hover:opacity-100 text-sm bg-secondary text-on-primary px-3 py-1 rounded-md hover:opacity-80 transition-opacity">Use</button>
                                        <button onClick={() => handleToggleFavorite(fav.title)} className="text-gray-500 hover:text-error"><TrashIcon /></button>
                                    </div>
                                </div>
                            )) : <p className="text-on-surface-secondary text-sm text-center py-4">Your favorite titles will appear here.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Side: Results */}
                <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col">
                    <h2 className="text-lg font-semibold text-secondary mb-3 flex-shrink-0">Generated Titles</h2>
                    {error && <p className="text-error text-sm mb-3">{error}</p>}
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {isLoading && <p className="text-on-surface-secondary animate-pulse">Generating brilliant ideas...</p>}
                        {!isLoading && generatedTitles.length === 0 && (
                            <p className="text-on-surface-secondary text-center py-8">Your generated titles will appear here.</p>
                        )}
                        {generatedTitles.map((title, index) => (
                            <div key={index} className="bg-brand-bg p-3 rounded-md group">
                                <div className="flex justify-between items-start">
                                    <p className="text-on-surface flex-grow pr-2">{title}</p>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleToggleFavorite(title)} className="text-gray-500 hover:text-yellow-400">
                                            <StarIcon filled={favoriteTitles.some(f => f.title === title)} />
                                        </button>
                                        <button onClick={() => handleUseTitle(title)} className="opacity-0 group-hover:opacity-100 text-sm bg-secondary text-on-primary px-3 py-1 rounded-md hover:opacity-80 transition-opacity">Use</button>
                                    </div>
                                </div>
                                {plotIdeas[title] && (
                                     <p className="text-sm mt-2 pt-2 border-t border-gray-700 text-on-surface-secondary italic">{plotIdeas[title]}</p>
                                )}
                                {!plotIdeas[title] && (
                                     <button onClick={() => handleGeneratePlot(title)} disabled={loadingPlot === title} className="mt-2 text-xs flex items-center gap-1 text-primary-variant hover:text-primary disabled:opacity-50">
                                        <LightbulbIcon />
                                        {loadingPlot === title ? 'Generating...' : 'Get Plot Idea'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TitleStudio;