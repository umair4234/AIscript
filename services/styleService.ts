import { Style } from '../types';

const STYLES_KEY = 'aiScriptWriterPro_styles';

export function getStyles(): Style[] {
    try {
        const stylesJson = localStorage.getItem(STYLES_KEY);
        if (!stylesJson) return [];
        return JSON.parse(stylesJson) as Style[];
    } catch (error) {
        console.error("Failed to load styles from localStorage", error);
        return [];
    }
}

export function saveStyle(styleData: Omit<Style, 'id'>, id: string | null = null): Style {
    const styles = getStyles();
    
    if (id) {
        // Update existing style
        const index = styles.findIndex(s => s.id === id);
        if (index !== -1) {
            styles[index] = { ...styles[index], ...styleData };
            localStorage.setItem(STYLES_KEY, JSON.stringify(styles));
            return styles[index];
        }
    }
    
    // Create new style
    const newStyle: Style = {
        ...styleData,
        id: `style_${Date.now()}`,
    };
    const updatedStyles = [...styles, newStyle];
    localStorage.setItem(STYLES_KEY, JSON.stringify(updatedStyles));
    return newStyle;
}

export function deleteStyle(id: string): void {
    const styles = getStyles();
    const updatedStyles = styles.filter(style => style.id !== id);
    localStorage.setItem(STYLES_KEY, JSON.stringify(updatedStyles));
}
