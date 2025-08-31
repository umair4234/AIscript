export const MASTER_STYLE_GUIDE = `
# MANDATORY WRITING STYLE (NON-NEGOTIABLE)

You MUST follow these five rules for ALL creative text you generate. This is not a suggestion; it is a strict command. Your primary goal is to write at a 5th-grade reading level. The language must be invisible, letting the story shine.

## 1. Use Everyday Vocabulary
- ALWAYS choose the simplest word. If a 10-year-old doesn't use it, you don't use it.
- **Instead of:** "melancholy," "somber," "despondent" -> **USE:** "sad"
- **Instead of:** "edifice," "domicile," "residence" -> **USE:** "house," "home," "building"
- **Instead of:** "utilize," "employ," "leverage" -> **USE:** "use"
- **Instead of:** "precipitated," "engendered" -> **USE:** "caused," "made"

## 2. Use Simple, Direct Sentences
- One main idea per sentence.
- Structure: Subject-Verb-Object (e.g., "The girl found the dog.").
- Keep sentences short and clear. Avoid complex clauses.

## 3. Use Active Voice & Strong Verbs
- The subject does the action.
- **CORRECT:** "The boy threw the ball."
- **INCORRECT:** "The ball was thrown by the boy."
- Use verbs that create a picture: "ran," "grabbed," "slammed," "cried."

## 4. Show, Don't Tell Emotion
- This is the most critical rule. NEVER name an emotion. Show it with actions.
- **Telling (INCORRECT):** "She was scared."
- **Showing (CORRECT):** "Her hands trembled. Her heart pounded in her chest."
- **Telling (INCORRECT):** "He was happy."
- **Showing (CORRECT):** "A huge smile spread across his face. He laughed out loud."

## 5. Ground the Story in Actions and Senses
- Focus ONLY on what characters see, hear, do, and physically feel.
- Do not use abstract thoughts or long descriptions of scenery.
- Keep the story moving from one concrete action to the next.

**FAILURE TO FOLLOW THESE RULES WILL RESULT IN AN UNSATISFACTORY OUTPUT.**
`;

export const OUTLINE_PROMPT_TEMPLATE = `I want you to act as an expert YouTube scriptwriter specializing in long-form, emotionally resonant storytelling for a mature audience. Your task is to generate a complete script outline based on the core niche concept and the specific video details I provide.

## CORE NICHE CONCEPT: "Lily's Law"
You are writing for a channel that follows a consistent set of heroic characters who solve a new "case" in each episode. The core elements are:
- **The Heroes:** Lily (10 years old), a deeply empathetic and brave girl who finds animals in desperate situations. She is the heart and moral compass of the story. David (late 30s/early 40s), Lily's widowed father and a skilled lawyer. He is inspired by his daughter's compassion and uses his legal expertise to fight for the animals, bringing a unique "justice" angle to the stories.
- **The Victim:** The central character of each story is an animal that has been a victim of cruelty, abandonment, or neglect.
- **The Story Formula:** Every story must follow a powerful emotional arc: The Abandonment/Tragedy -> The Discovery/Hope -> The Investigation/Conflict -> Justice & New Beginning. The ending must always be positive.

## VIDEO DETAILS
- **Video Title:** {title}
- **Video Duration:** {duration} minutes
- **Plot Idea & Instructions:** {plot}
- **Primary Twist / Story Deepener:** You must select one of the advanced storytelling twists from the list below. This dictates the type of depth added to the story.

## SCRIPT REQUIREMENTS
- **Word Count & Title:** First, calculate the total script word count: {duration} minutes x 150 words = Total Word Count. Display the final, refined Video Title and the Total Word Count at the very top.
- **Language and Tone:** Write using extremely simple, accessible English. Use clear, short sentence structures in the style of Ernest Hemingway. Focus on emotion and action. The viewer should feel the story. The tone must follow the emotional rollercoaster: tragedy -> mystery -> suspense -> heartwarming justice.
- **Pacing & Structure for Long-Form Content:**
    - **Chapters/Sections:** Divide the entire script into numbered Chapters of 800-1000 words each. For each chapter, you MUST provide a 2-3 line summary.
    - **MANDATORY WORD COUNT:** For every single chapter, you MUST include a line formatted exactly as "Word Count: [number]". This is a non-negotiable requirement for the output to be valid. Do not omit it under any circumstances.
    - **Mid-Story Twist:** For long-form videos (60+ minutes), the initial investigation must uncover a complication or twist around the halfway point. This twist should raise the stakes and shift the story's direction. Refer to the "Advanced Storytelling Twists" section below.
    - **Emotional Peaks and Valleys:** Alternate between tense investigation chapters and quieter "breather" chapters that focus on the emotional stakes (e.g., Lily's bond with the rescued animal) to maintain viewer engagement.
- **Narrative Interjections (For Viewer Engagement):** To keep viewers hooked during long videos, sparingly use direct-to-audience narration (1-3 times per script) at the end of a chapter to create a mini-cliffhanger. Example: "With the main suspect in custody, the case seemed to be over. But they had no idea that the real villain was someone they had already spoken to."

## ADVANCED STORYTELLING ELEMENTS (Menu of Primary Twists)
You must select one of these structures to build the second half of the story:
- **The Personal Connection:** The villain has a hidden past connection to David or his late wife, making the case a personal vendetta.
- **The Custody Battle:** After the rescue, another party with a questionable past comes forward to claim legal ownership of the animal, leading to a tense courtroom battle that runs parallel to the criminal case.
- **The Mistaken Identity:** The obvious suspect is being framed. The investigation shifts into a "whodunnit" mystery to find the real perpetrator before it's too late.
- **The Victim's Secret:** The rescued animal has a secret past (e.g., is a stolen, microchipped prize-winner or a service animal), leading David on a journey to uncover its history and reunite it with its original, loving owners.
- **The Race Against Time (Medical Drama):** The animal has a rare medical condition that can only be cured by finding something from its past (e.g., a blood-relative for a transfusion), turning the investigation into a desperate medical race against the clock.

## FINAL OUTPUT FORMAT
Your output must be the SCRIPT OUTLINE ONLY. Do not write the full script. Structure your entire response EXACTLY as follows. Do not add any other text or explanations.

Video Title: [Your Refined Title]
Total Word Count: [Calculated Word Count]
Primary Twist: [The name of the twist you selected]

Chapter 1
Summary: [2-3 line summary of the chapter.]
Word Count: [e.g., 900]

Chapter 2
Summary: [2-3 line summary of the chapter.]
Word Count: [e.g., 950]

[Continue this format for all subsequent chapters until the story is complete.]
`;

export const MULTIPLE_HOOKS_PROMPT_TEMPLATE = `I want you to act as a master storyteller, specializing in writing powerful, emotionally gripping opening scenes for YouTube videos. Your goal is to create 3 distinct, unforgettable hooks that grab the viewer's attention immediately, make them feel a deep emotional connection to the story's victim, and fill them with curiosity about the deeper mystery you will tease.

## TASK INSTRUCTIONS
Refer to the Video Title, Chapter 1 Summary, and the chosen Primary Twist / Story Deepener I provide. Write 3 distinct, powerful hooks of approximately 100-150 words each that follow the specific formula below for maximum impact.

## CONTEXT
- Video Title: {title}
- Chapter 1 Summary: {chapter1Summary}
- Primary Twist / Story Deepener: {twist}

## THE CURIOSITY FORMULA (Advanced)
Each hook must follow this four-part structure:
1.  **Start with the Hidden Horror:** Begin directly with the victim's tragic situation. Use the first sentence to show them trapped, scared, or in a terrible state. Do not waste any time on scenery.
2.  **Introduce the Innocent Façade:** Immediately contrast the hidden horror with a seemingly normal or innocent exterior. Show how this terrible secret was hidden in plain sight. This creates immediate mystery.
3.  **The Catalyst and the False Assumption:** Introduce the hero who discovers the secret through a small detail. Crucially, state that the hero (and the audience) initially believes the problem is simple or small (e.g., "They thought they were dealing with just one cruel man."). This sets up the twist.
4.  **The Shocking Reveal (Tailored to the Twist):** End the hook by shattering that initial assumption. This is the most important step. You must hint at the specific Primary Twist that the story will follow. Do not use a generic "it was worse than they thought." Be specific in your tease.

## LANGUAGE AND TONE REQUIREMENTS
-   **Use Extremely Simple English:** Write as if explaining the story to a 5th grader. The power comes from the emotion, not complex vocabulary.
-   **Short, Punchy Sentences:** Use short, direct sentences to build an urgent, easy-to-follow rhythm.
-   **Focus on Emotion:** Your primary goal is to make the viewer feel pity for the victim, shock at the secret, and an intense need to understand the deeper mystery you've introduced.

## EXAMPLES OF ADVANCED HOOKS (Tailored to the Twist)
-   Video Title: A Little Girl Heard Cries From a Dark Basement, Uncovering Dozens of Caged Dogs.
-   **Example 1: The "Bigger Crime" Twist:** "Dozens of dogs were trapped in small cages inside a dark, quiet basement. From the outside, the old house looked abandoned. No one knew about the terrible secret hidden beneath the floorboards. But a 10-year-old girl heard a sound no one else did, and when she told her lawyer father, they thought they were dealing with one cruel man. They had no idea they were about to uncover a secret so big, it would expose a criminal operation that shocked the entire town."
-   **Example 2: The "Personal Connection" Twist:** "Dozens of dogs were trapped in small cages inside a dark, quiet basement. From the outside, the old house looked abandoned. No one knew about the terrible secret hidden beneath the floorboards. But a 10-year-old girl heard a sound no one else did, and when she told her lawyer father, they thought they were dealing with a random act of cruelty. They had no idea this discovery was not an accident, and that the man responsible had a hidden, dark connection to their own family's past."
-   **Example 3: The "Custody Battle" Twist:** "Dozens of dogs were trapped in small cages inside a dark, quiet basement. From the outside, the old house looked abandoned. No one knew about the terrible secret hidden beneath the floorboards. But a 10-year-old girl heard a sound no one else did, and when she told her lawyer father, they thought the mission was to bring one man to justice. They believed that once the dogs were rescued, they were finally safe, but they were wrong. The battle to save them was only the beginning."

## FINAL OUTPUT FORMAT
Your output MUST be a valid JSON array of 3 strings. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Your entire response must be ONLY the raw JSON, starting with \`[\` and ending with \`]\`. Each string must be a complete hook, including the standard Call to Action at the end: "But before we go deeper into this story, Please make sure you subscribe to the channel. And do comment your view on this story."
`;

export const REGENERATE_HOOK_WITH_FEEDBACK_PROMPT_TEMPLATE = `
${MASTER_STYLE_GUIDE}

---

You are a master storyteller writing hooks for a YouTube video. Your previous attempt was not right. You must now try again, incorporating the user's specific feedback.

## ORIGINAL CONTEXT
- Video Title: {title}
- Chapter 1 Summary: {chapter1Summary}

## USER FEEDBACK FOR REGENERATION
"""
{feedback}
"""

## TASK
Generate 3 new, distinct hooks. Each hook must be approximately 100-150 words.

## CORE RULES (RECAP)
1.  **Follow the User Feedback Above All Else.** This is your most important instruction.
2.  **Follow the MANDATORY WRITING STYLE.** Simple words, short sentences, show-don't-tell.
3.  **Follow the Curiosity Formula:** Hidden Horror -> Innocent Façade -> False Assumption -> Shocking Reveal.
4.  **Start Directly:** The hook MUST start by directly describing the victim's situation. Do not be vague.

## FINAL OUTPUT FORMAT
Your output MUST be a valid JSON array of 3 strings. Do not include any other text. Do NOT wrap it in markdown. Your response must be ONLY the raw JSON data. Each string must be a complete hook, including the Call to Action: "But before we go deeper into this story, Please make sure you subscribe to the channel. And do comment your view on this story."
`;


export const CHAPTER_PROMPT_TEMPLATE = `
${MASTER_STYLE_GUIDE}

---

## YOUR TASK
Perfect. Now, let's continue writing the full script.

You will continue your role as the expert YouTube scriptwriter for the "Lily's Law" channel. Your task is to expand the summary for Chapter {chapterNumber} into a full, detailed, and continuous script segment.

## SCRIPT EXPANSION INSTRUCTIONS
1.  **Locate the Correct Chapter:** You are writing for Chapter {chapterNumber}. The summary is: "{chapterSummary}".
2.  **Strictly Adhere to Word Count:** The final script for this chapter must be very close to {wordCount} words.
3.  **Ensure a Smooth Transition:** {transitionInstruction} This is the most important rule. The entire script must feel like one continuous story.
4.  **Fulfill the Summary's Promise:** The script you write must cover all the key plot points and emotional beats described in that chapter's summary.
5.  **Maintain the "Lily's Law" Style:** Stay true to the characters: showcase Lily's empathy and determination, and David's quiet strength and legal mind. Avoid repetition.

## OUTPUT FORMAT
Please provide only the continuous script text for Chapter {chapterNumber}. Do not add any extra titles, summaries, or notes. Just the script itself.
`;

export const STYLE_ANALYSIS_PROMPT_TEMPLATE = `
You are an expert literary analyst AI. Your task is to perform a deep analysis of the provided sample script(s) and reverse-engineer the author's writing style. You must then synthesize your findings into a detailed JSON object that will serve as a style guide for another AI to replicate this exact style.

The key goal is to capture the *essence* of the writing, not just surface-level statistics. The output MUST be a single, clean JSON object with no other text before or after it.

## SAMPLE SCRIPT(S)
{sample_scripts}

## ANALYSIS INSTRUCTIONS
Analyze the provided text(s) based on the following criteria. Be specific and provide concrete descriptions and examples where appropriate.

1.  **Tone & Mood:** What is the emotional feeling of the text? (e.g., "Urgent and suspenseful, but with an undercurrent of hope," "Somber and reflective," "Fast-paced and action-oriented").
2.  **Pacing:** How does the story flow? (e.g., "Relentlessly fast, using short sentences to build momentum," "Alternates between short, punchy action scenes and longer, descriptive passages," "Slow and deliberate, building atmosphere").
3.  **Sentence Structure:** Describe the sentence patterns.
    *   **Complexity:** Are sentences simple, compound, complex, or a mix? (e.g., "Primarily simple and compound sentences for clarity and impact").
    *   **Length:** What is the average sentence length? Is there variation? (e.g., "Short and direct, averaging 10-12 words, with occasional very short sentences (3-5 words) for emphasis.").
    *   **Rhythm:** Describe the flow and rhythm. (e.g., "A staccato, percussive rhythm during action scenes.").
4.  **Vocabulary & Diction:**
    *   **Grade Level:** What is the approximate reading level? (e.g., "5th Grade," "8th Grade," "Collegiate"). Be specific. The goal is easy to understand, human-like language.
    *   **Word Choice:** Is the language formal, informal, poetic, clinical? (e.g., "Informal and accessible, using common, everyday words. Avoids jargon and complex vocabulary.").
5.  **Narrative Voice & Perspective:**
    *   **Point of View:** (e.g., "Third-person limited, closely following the protagonist's internal thoughts," "Third-person omniscient, providing a broader view").
    *   **Emotionality:** How are emotions conveyed? (e.g., "Emotions are shown through character actions and simple, direct descriptions of feelings, rather than told through complex introspection.").
6.  **Dialogue Style:**
    *   **Realism:** Is it realistic and natural, or stylized? (e.g., "Natural and conversational, with interruptions and colloquialisms.").
    *   **Function:** What is the primary purpose of dialogue? (e.g., "Primarily used to advance the plot and reveal character, rarely for exposition.").

## REQUIRED JSON OUTPUT FORMAT
Your entire output must be a single JSON object matching this structure precisely.

{
  "toneAndMood": {
    "primaryTone": "string",
    "secondaryTone": "string",
    "description": "string"
  },
  "pacing": {
    "speed": "string (e.g., 'Fast', 'Moderate', 'Slow', 'Variable')",
    "description": "string"
  },
  "sentenceStructure": {
    "complexity": "string",
    "averageLengthWords": "number",
    "variation": "string (e.g., 'High', 'Moderate', 'Low')",
    "rhythmDescription": "string"
  },
  "vocabularyAndDiction": {
    "gradeLevel": "string (e.g., '5th Grade')",
    "wordChoice": "string",
    "description": "string"
  },
  "narrativeVoice": {
    "pointOfView": "string",
    "emotionality": "string",
    "description": "string"
  },
  "dialogueStyle": {
    "realism": "string",
    "function": "string",
    "description": "string"
  }
}
`;

const MASTER_TITLE_FORMULA = `
## THE VIRAL TITLE FORMULA (MANDATORY)
You are an expert at creating viral YouTube titles for a specific storytelling niche. Your titles MUST follow a very strict, two-part formula. This is not a suggestion; it is a command.

### Part 1: The Emotional Hook
Start with a powerful, emotional hook. This can be:
- A direct, heart-wrenching quote from a victim (often a child). Use single or double quotes.
  - Examples: "Mom… It Hurts…", "Nobody Wants Me Here…", "Daddy… I Haven’t Eaten", "Please… Don’t Send Me Back,"
- A vivid description of a tragic or mysterious situation.
  - Examples: "A Forgotten Mansion Nobody Wanted", "A Woman Left on the Tracks to Die", "140°F Under the Hot Sun, 3 Little Golden Puppies Lie on the Road"

### Part 2: The Hero & The Twist
Immediately follow the hook with an em-dash (—) and then reveal the hero and the shocking twist or discovery.
- **The Heroes:** The heroes are typically a compassionate figure paired with a K9/dog (e.g., "A Soldier and His K9," "A Veteran and His Dog," "A Cop and His K9") or a single heroic figure ("A Doctor," "A Billionaire").
- **The Twist:** This part should create intense curiosity. Use phrases like: "Found What Nobody Dared to Imagine," "Discovered the Unthinkable," "Changed Everything," "Revealed a Hidden Truth," "Shattered Their Hearts."

### NON-NEGOTIABLE RULES
1.  **Strict Character Limit:** All titles MUST be under 100 characters.
2.  **Follow the Formula:** Hook — Hero & Twist. Do not deviate.
3.  **Use High-Emotion Language:** Words like "Whispered," "Sobbed," "Begged," "Shattered," "Unthinkable" are key.

## EXAMPLES OF PERFECT TITLES (STUDY THESE CAREFULLY)
- "Mom… It Hurts… The Twins Sobbed — Soldier and His K9 Found What Nobody Dared to Imagine"
- "Nobody Wants Me Here…The Little Girl Whispered — Soldier and His K9 Discovered the Unthinkable"
- "Little Girl Whispered, ‘Daddy… I Haven’t Eaten’ — What A Soldier and His K9 Found Changed Everything"
- "Little Girl Whispers, ‘Save My Baby!’ — What a Cop and His Dog Did Will Shock You"
- "Two Little Girls Whispered, ‘It Hurts… We’re Hungry’ — What the Doctor Found Changed Everything"
- "Before His Execution, He Asked for One Last Thing — But the Dog Revealed a Hidden Truth…"
- "A Forgotten Mansion Nobody Wanted — Until a Veteran and His Dog Uncovered a $200M Secret"
- "HOA Tried to Destroy a Blind Veteran’s Dog — But the Truth Shocked the Entire Neighborhood"
- "A Woman Left on the Tracks to Die — Until a Soldier and His K9 Delivered an Unexpected Ending"
- "Too Weak to Hold Her Babies, She Fell in the Snow — Until a K9’s Rescue Changed Everything"
- "Please… Don’t Send Me Back,’ the Little Girl Begged — But the K9 Stood Guard in the Scorching Heat"
- "A PTSD Soldier and His K9 Saw a Girl Raise Her Hand — What They Found Shattered Their Hearts"
- "Twin Girl Whispered, “We Were Bad… So Mom Left Us Here…” — But the K9 Wouldn’t Let That Be the End"
`;

export const DEFAULT_TITLE_PROMPT_TEMPLATE = `I want you to act as an expert YouTube title creator for a viral storytelling channel.
YOUR TASK: Generate a list of 10 compelling, viral-style video titles.

${MASTER_TITLE_FORMULA}

FINAL OUTPUT
Please provide your response as a numbered list of 10 new video titles. Do not add any extra explanations.`;

export const COMPETITOR_ANALYSIS_TITLE_PROMPT_TEMPLATE = `You are a world-class YouTube title strategist. I will provide you with a list of successful video titles from competitor channels. Your task is to analyze their underlying patterns and then generate 10 new, original titles that follow our channel's specific, mandatory formula.

## COMPETITOR TITLES FOR ANALYSIS
"""
{competitor_titles}
"""

## YOUR STRATEGIC PROCESS
1.  **Identify Patterns:** Analyze the competitor titles. What words, emotions, and structures do they use to create curiosity?
2.  **Synthesize for Our Channel:** Take your findings and generate 10 new titles that strictly adhere to our channel's formula, detailed below.

${MASTER_TITLE_FORMULA}

## FINAL OUTPUT
Please provide your response as a numbered list of 10 new video titles. Do not add any other explanations or your analysis. Just the titles.`;

export const PLOT_IDEA_PROMPT_TEMPLATE = `You are a creative storyteller. Based on the following YouTube video title, generate a brief, one-paragraph plot idea (3-4 sentences).

**Video Title:** "{title}"

Remember the core elements of the stories: A heroic figure (like a soldier, veteran, or doctor, often with a K9) discovers someone in a tragic situation and uncovers a deeper truth, leading to a just and heartwarming resolution.

**Output:** Provide only the one-paragraph plot idea.`;

export const GENERATE_SIMILAR_TITLES_PROMPT_TEMPLATE = `You are a YouTube title expert. I will give you one successful title. Your task is to generate 5 new titles that are very similar in structure, tone, and emotional hook, but with different specific details. All new titles must follow our channel's mandatory formula.

## Original Title:
"{title}"

${MASTER_TITLE_FORMULA}

## FINAL OUTPUT
Provide a numbered list of 5 new, similar titles.`;

export const GENERATE_TITLES_FROM_SCRIPT_PROMPT_TEMPLATE = `You are a YouTube title expert. Your task is to read a script excerpt and generate 5 compelling, viral-style titles that strictly adhere to the mandatory formula below.

## Script Excerpt:
"""
{script_text}
"""

${MASTER_TITLE_FORMULA}

## FINAL OUTPUT
Provide your response as a valid JSON array of 5 strings. Do not add any other text. Your response must be ONLY the raw JSON, starting with \`[\` and ending with \`]\`.`;

export const GENERATE_TITLES_FROM_EXISTING_TITLE_PROMPT_TEMPLATE = `You are a YouTube title expert. Your task is to take an existing video title and generate 5 new, improved versions that strictly adhere to the mandatory viral formula below. The goal is to make them more clickbait, engaging, and curiosity-driven.

## Existing Title:
"""
{existing_title}
"""

${MASTER_TITLE_FORMULA}

## FINAL OUTPUT
Provide your response as a valid JSON array of 5 strings. Do not add any other text. Your response must be ONLY the raw JSON, starting with \`[\` and ending with \`]\`.`;


export const GENERATE_DESCRIPTION_PROMPT_TEMPLATE = `You are an expert YouTube SEO and copywriter for a channel called "Lily's Law". I will provide you with a video title and the full script. Your task is to write a compelling, SEO-friendly YouTube video description.

**Video Title:** {title}
**Script Text:**
"""
{script_text}
"""

**Instructions:**
1.  **Hook:** Start with a 1-2 sentence hook that rephrases the title and grabs the reader's attention.
2.  **Summary:** Write a 2-3 sentence paragraph that summarizes the main story arc of the video without giving away the final resolution. Create intrigue.
3.  **Call to Action:** Include a call to subscribe to the channel and comment on the story.
4.  **Hashtags:** End with a new line followed by 3 relevant, popular hashtags (e.g., #dogrescue #animalrescue #story).
5.  **Keywords:** Do not include a separate list of keywords.

**Output:** Provide only the description text, formatted exactly as requested.`;

export const GENERATE_TITLES_FROM_IDEA_PROMPT_TEMPLATE = `You are a world-class YouTube title strategist, renowned for your ability to transform a simple story idea into a list of 10 irresistible, viral-style video titles. You are working for a channel with a very specific and successful formula.

## THE STORY IDEA
"""
{story_idea}
"""

## YOUR TASK
Deeply analyze this idea and generate 10 video titles that strictly follow the channel's mandatory formula.

${MASTER_TITLE_FORMULA}

## FINAL OUTPUT
Please provide your response as a numbered list of 10 new video titles based on the provided story idea. Do not add any other explanations or introductory text.
`;