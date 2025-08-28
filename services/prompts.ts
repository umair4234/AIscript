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

export const DEFAULT_TITLE_PROMPT_TEMPLATE = `I want you to act as an expert YouTube title creator for a viral storytelling channel. Your specialty is crafting compelling, emotionally resonant titles that create intrigue and promise a satisfying story of justice, specifically about dogs.
CORE NICHE CONCEPT: "Lily's Law"
You are creating titles for a channel that follows a consistent set of heroic characters:
The Heroes:
Lily (10 years old): A deeply empathetic and brave girl who finds and rescues dogs in desperate situations.
David (late 30s/early 40s): Lily's widowed father and a skilled lawyer who uses his legal expertise to fight for the dogs, bringing a unique "justice" angle to every story.
The Core Theme: Each story begins with a heartbreaking case of dog abuse, neglect, or abandonment. The story then transforms into a tale of hope and justice as Lily and David intervene, using both compassion and the law to save the dog and hold the wrongdoers accountable. All stories MUST be about dogs.
YOUR TASK
Generate a list of 10 compelling, viral-style video titles for this YouTube channel. All titles must be about dogs.
THE WINNING TITLE FORMULA
Your titles must follow a specific, powerful formula designed to create an immediate emotional connection and a strong sense of curiosity.
The Two-Part Structure: Every title must have two distinct parts:
Part 1: The Tragic Setup: Start by describing the heartbreaking situation of the dog. This is the hook that generates sympathy.
Part 2: The Unexpected Twist: Follow the setup with a twist that introduces our unique heroes (the "little girl," "lawyer's daughter," or "her dad") and the promise of justice. This is what makes the viewer click.
Use High-Emotion Keywords: The titles should use strong, emotional words.
For the setup: "Abandoned," "Left to Die," "Chained Up," "Thrown Out," "Neglected," "Crying for Help."
For the twist: "But a Little Girl Saw Everything," "Until Her Lawyer Dad Found Proof," "They Didn't Expect a 10-Year-Old to Sue Them," "What She Found Changed Everything."
Create a "Story Gap": The title must create a question in the viewer's mind. They should see the problem and be desperate to see the unique solution.
EXAMPLES OF PERFECT TITLES (ABOUT DOGS ONLY)
Use the following examples as a guide for the tone, structure, and emotional impact of the titles you generate:
"They Left Their Old Dog at a Gas Station to Die, Then a Lawyer's Daughter Found Him."
"Family Fled a Wildfire and Left Their Dog Chained Up, They Didn't Expect a 10-Year-Old to Sue Them."
"He Was Returned to the Shelter for 'Being Sick', But a Little Girl Knew the Real Reason and Her Dad Had Proof."
"Rich Man Threw His Old Dog Out of a Limo, But He Didn't Know a Little Girl's Dad Was the District Attorney."
"Everyone Ignored the Crying Dog in the Hot Car, Until a 10-Year-Old Smashed the Window and Called Her Lawyer Dad."
"His Owner Went to Jail and Left Him to Starve, But a Little Girl Found the Key to His Safe Hidden in His Collar."
"They Sold Their House and Abandoned the Family Dog Inside, But They Didn't Know the Buyer Was a Judge's Daughter."
"Puppy Mill Was Disguised as a Pet Store, Until a 10-Year-Old Girl Found the Hidden Basement."
FINAL OUTPUT
Please provide your response as a numbered list of 10 new video titles. Do not add any extra explanations.`;

export const COMPETITOR_ANALYSIS_TITLE_PROMPT_TEMPLATE = `You are a world-class YouTube title strategist. I will provide you with a list of successful video titles from competitor channels. Your task is to analyze the underlying patterns, emotional hooks, structure, and keywords that make these titles work. Then, generate a list of 10 new, original titles that use the same successful formula but are even more compelling and clickable. Go deeper than just mimicking the words; understand the *psychology* behind them.

Here are the competitor titles you must analyze:
{competitor_titles}

YOUR TASK:
Generate 10 new titles that capture the same viral essence as the examples provided.

FINAL OUTPUT RULES:
- Your output must be a numbered list of 10 new video titles.
- Do not add any extra text, explanations, or analysis in your final response. Just the list.`;

export const PLOT_IDEA_PROMPT_TEMPLATE = `Based on the following viral YouTube video title, generate a short, compelling plot idea (2-3 sentences). The plot should expand on the premise of the title and set up the core conflict and emotional journey. The story is for a channel called 'Lily's Law' featuring a 10-year-old girl, Lily, and her lawyer father, David, who rescue animals and seek justice.

VIDEO TITLE:
"{title}"

FINAL OUTPUT:
Provide ONLY the 2-3 sentence plot idea. Do not add any extra text, titles, or explanations.`;

export const GENERATE_SIMILAR_TITLES_PROMPT_TEMPLATE = `You are a world-class YouTube title strategist. I will provide you with a successful video title. Your task is to generate 5 new, original titles that use the same successful formula but are even more compelling. They must be about dogs and follow the "Lily's Law" theme (a little girl and her lawyer dad seeking justice for dogs).

SUCCESSFUL TITLE TO EMULATE:
"{title}"

YOUR TASK:
Generate 5 new titles that capture the same viral essence.

FINAL OUTPUT RULES:
- Your output must be a numbered list of 5 new video titles.
- Do not add any extra text, explanations, or analysis in your final response. Just the list.`;