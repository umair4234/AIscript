import type { ScriptOutline, ChapterOutline } from '../types';
import { OUTLINE_PROMPT_TEMPLATE, MULTIPLE_HOOKS_PROMPT_TEMPLATE, CHAPTER_PROMPT_TEMPLATE, STYLE_ANALYSIS_PROMPT_TEMPLATE, DEFAULT_TITLE_PROMPT_TEMPLATE, COMPETITOR_ANALYSIS_TITLE_PROMPT_TEMPLATE, PLOT_IDEA_PROMPT_TEMPLATE, REGENERATE_HOOK_WITH_FEEDBACK_PROMPT_TEMPLATE } from './prompts';

export const getOutlinePrompt = (title: string, duration: number, plot: string): string => {
  return OUTLINE_PROMPT_TEMPLATE
    .replace('{title}', title)
    .replace('{plot}', plot || 'None provided.')
    .replace(/{duration}/g, duration.toString());
};


export const getMultipleHooksPrompt = (outline: ScriptOutline): string => {
  return MULTIPLE_HOOKS_PROMPT_TEMPLATE
    .replace('{title}', outline.title)
    .replace('{chapter1Summary}', outline.chapters[0].summary)
    .replace('{twist}', outline.twist || 'A surprising turn of events.');
};

export const getRegenerateHookWithFeedbackPrompt = (outline: ScriptOutline, feedback: string): string => {
  return REGENERATE_HOOK_WITH_FEEDBACK_PROMPT_TEMPLATE
    .replace('{title}', outline.title)
    .replace('{chapter1Summary}', outline.chapters[0].summary)
    .replace('{feedback}', feedback || 'Generate new, different ideas.'); // Failsafe for empty feedback
};

export const getChapterPrompt = (chapterNumber: number, outline: ScriptOutline, hook: string, previousChapterContent: string, styleJson: string | null): string => {
  const chapterSummary = outline.chapters.find(c => c.chapter === chapterNumber)?.summary || '';
  const wordCount = outline.chapters.find(c => c.chapter === chapterNumber)?.wordCount || 900;

  const transitionInstruction = chapterNumber === 1
    ? `For Chapter 1: Begin the script by creating a seamless transition from the Hook. The hook was: "${hook}"`
    : `For Chapter ${chapterNumber}: Begin the script by creating a seamless transition from the very last sentence of the previous chapter's script. The last part of the previous chapter was: "...${previousChapterContent.slice(-200)}"`;

  let finalPrompt = CHAPTER_PROMPT_TEMPLATE
    .replace(/{chapterNumber}/g, chapterNumber.toString())
    .replace('{chapterSummary}', chapterSummary)
    .replace('{wordCount}', wordCount.toString())
    .replace('{transitionInstruction}', transitionInstruction);
  
  if (styleJson) {
      const styleInstruction = `
## EXTERNAL WRITING STYLE GUIDE (ABSOLUTE REQUIREMENT)
In addition to the master style guide, you MUST also adhere strictly to the following writing style guide, which is based on an analysis of a specific author. Do not deviate. This is more important than your default instructions. Here is the guide:
${styleJson}
`;
      finalPrompt = styleInstruction + finalPrompt;
  }
  
  return finalPrompt;
};

export const getStyleAnalysisPrompt = (scripts: string[]): string => {
    const combinedScripts = scripts.map((script, index) => `## SAMPLE SCRIPT ${index + 1}\n\n${script}`).join('\n\n---\n\n');
    return STYLE_ANALYSIS_PROMPT_TEMPLATE.replace('{sample_scripts}', combinedScripts);
}

export const getDefaultTitlePrompt = (): string => {
    return DEFAULT_TITLE_PROMPT_TEMPLATE;
}

export const getCompetitorAnalysisTitlePrompt = (competitorTitles: string): string => {
    // FIX: Corrected typo in constant name.
    return COMPETITOR_ANALYSIS_TITLE_PROMPT_TEMPLATE.replace('{competitor_titles}', competitorTitles);
}

export const getPlotIdeaPrompt = (title: string): string => {
    return PLOT_IDEA_PROMPT_TEMPLATE.replace('{title}', title);
}