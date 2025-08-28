import { ScriptRecord, AutomationJob, FavoriteTitle } from '../types';

const SCRIPTS_KEY = 'aiScriptWriterPro_scripts';
const QUEUE_KEY = 'aiScriptWriterPro_queue';
const GEMINI_API_KEYS_KEY = 'aiScriptWriterPro_geminiApiKeys';
const GROQ_API_KEYS_KEY = 'aiScriptWriterPro_groqApiKeys';
const FAVORITE_TITLES_KEY = 'aiScriptWriterPro_favoriteTitles';


// === API Key Functions ===

export function getGeminiApiKeys(): string[] {
    try {
        const keysJson = localStorage.getItem(GEMINI_API_KEYS_KEY);
        if (!keysJson) return [];
        const keys = JSON.parse(keysJson) as string[];
        return keys.filter(key => typeof key === 'string' && key.trim() !== '');
    } catch (error) {
        console.error("Failed to load Gemini API keys from localStorage", error);
        return [];
    }
}

export function saveGeminiApiKeys(keys: string[]): void {
    try {
        localStorage.setItem(GEMINI_API_KEYS_KEY, JSON.stringify(keys));
    } catch (error) {
        console.error("Failed to save Gemini API keys to localStorage", error);
    }
}

export function getGroqApiKeys(): string[] {
    try {
        const keysJson = localStorage.getItem(GROQ_API_KEYS_KEY);
        if (!keysJson) return [];
        const keys = JSON.parse(keysJson) as string[];
        return keys.filter(key => typeof key === 'string' && key.trim() !== '');
    } catch (error) {
        console.error("Failed to load Groq API keys from localStorage", error);
        return [];
    }
}

export function saveGroqApiKeys(keys: string[]): void {
    try {
        localStorage.setItem(GROQ_API_KEYS_KEY, JSON.stringify(keys));
    } catch (error) {
        console.error("Failed to save Groq API keys to localStorage", error);
    }
}


// === Script Library Functions ===

export function getScripts(includeArchived = false): ScriptRecord[] {
    try {
        const scriptsJson = localStorage.getItem(SCRIPTS_KEY);
        if (!scriptsJson) return [];
        let scripts = JSON.parse(scriptsJson) as ScriptRecord[];
        
        if (!includeArchived) {
            scripts = scripts.filter(script => !script.isArchived);
        }
        
        // Sort by most recently created
        return scripts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Failed to load scripts from localStorage", error);
        return [];
    }
}


export function getScriptById(id: string): ScriptRecord | null {
    const scripts = getScripts(true); // Search all scripts including archived
    return scripts.find(script => script.id === id) || null;
}

export function saveScript(scriptData: Partial<Omit<ScriptRecord, 'id' | 'createdAt'>>, id: string | null = null): ScriptRecord {
    const scripts = getScripts(true);
    const now = new Date().toISOString();
    
    if (id) {
        // Update existing script
        const index = scripts.findIndex(s => s.id === id);
        if (index !== -1) {
            scripts[index] = { ...scripts[index], ...scriptData, title: scriptData.title || scripts[index].title };
            localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
            return scripts[index];
        }
    }
    
    // Create new script. Ensure required fields have defaults.
    const newScript: ScriptRecord = {
        id: `script_${Date.now()}`,
        createdAt: now,
        title: scriptData.title || 'Untitled Script',
        plot: scriptData.plot || '',
        outline: scriptData.outline || null,
        hook: scriptData.hook || '',
        finalScript: scriptData.finalScript || [],
        status: scriptData.status || null,
        ...scriptData,
    };
    
    const updatedScripts = [newScript, ...scripts.filter(s => s.id !== newScript.id)];
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(updatedScripts));
    return newScript;
}


export function deleteScript(id: string): void {
    const scripts = getScripts(true);
    const updatedScripts = scripts.filter(script => script.id !== id);
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(updatedScripts));
}

export function onArchiveScript(id: string, isArchived: boolean): void {
    const scripts = getScripts(true);
    const index = scripts.findIndex(s => s.id === id);
    if (index !== -1) {
        scripts[index].isArchived = isArchived;
        localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
    }
}


// === Automation Queue Functions ===

export function getQueue(): AutomationJob[] {
    try {
        const queueJson = localStorage.getItem(QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
        console.error("Failed to load queue from localStorage", error);
        return [];
    }
}

export function saveQueue(queue: AutomationJob[]): void {
    try {
        // Ensure all required fields are present when saving
        const validQueue = queue.map(job => ({
            id: job.id,
            title: job.title,
            duration: job.duration || 100, // Default duration if missing
            plot: job.plot || '' // Default plot if missing
        }));
        localStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
    } catch (error) {
        console.error("Failed to save queue to localStorage", error);
    }
}

// === Favorite Titles Functions ===

export function getFavoriteTitles(): FavoriteTitle[] {
    try {
        const titlesJson = localStorage.getItem(FAVORITE_TITLES_KEY);
        if (!titlesJson) return [];
        const titles = JSON.parse(titlesJson) as FavoriteTitle[];
        return titles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Failed to load favorite titles from localStorage", error);
        return [];
    }
}

export function saveFavoriteTitles(titles: FavoriteTitle[]): void {
    try {
        localStorage.setItem(FAVORITE_TITLES_KEY, JSON.stringify(titles));
    } catch (error) {
        console.error("Failed to save favorite titles to localStorage", error);
    }
}