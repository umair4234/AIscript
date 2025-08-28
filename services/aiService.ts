import { ApiProvider } from '../types';

export class AIManager {
  private geminiKeys: string[];
  private groqKeys: string[];
  private currentGeminiKeyIndex: number;
  private currentGroqKeyIndex: number;
  private currentProvider: ApiProvider;
  private geminiAI: any | null = null;
  private GoogleGenAI: any | null;

  constructor(geminiKeys: string[], groqKeys: string[], GoogleGenAI: any | null) {
    this.geminiKeys = geminiKeys;
    this.groqKeys = groqKeys;
    this.currentGeminiKeyIndex = 0;
    this.currentGroqKeyIndex = 0;
    this.currentProvider = ApiProvider.GEMINI;
    this.GoogleGenAI = GoogleGenAI;
  }

  private initializeGeminiAI() {
    this.geminiAI = null; // Reset first
    if (!this.GoogleGenAI) {
        // This case happens if the SDK fails to load at the app level.
        // We shouldn't throw, just skip, so it can fall back to Groq.
        return;
    }
    if (this.currentGeminiKeyIndex >= this.geminiKeys.length) {
        return;
    }
    const apiKey = this.geminiKeys[this.currentGeminiKeyIndex];
    // Directly initialize with the required object structure
    this.geminiAI = new this.GoogleGenAI({ apiKey: apiKey });
  }
  
  public reset() {
    this.currentGeminiKeyIndex = 0;
    this.currentGroqKeyIndex = 0;
    this.currentProvider = ApiProvider.GEMINI;
  }

  private async *streamGroq(prompt: string, signal: AbortSignal) {
    const apiKey = this.groqKeys[this.currentGroqKeyIndex];
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
        }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Groq API request failed: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
        throw new Error('Groq response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data.trim() === '[DONE]') {
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    const chunk = parsed.choices?.[0]?.delta?.content;
                    if (chunk) {
                        yield chunk;
                    }
                } catch (e) {
                    console.error('Error parsing Groq stream data:', data, e);
                }
            }
        }
    }
  }

  public async generateStreamWithRotation(
    prompt: string, 
    onChunk: (chunk: string) => void, 
    onProviderUpdate: (update: { provider: ApiProvider; keyIndex: number }) => void,
    signal: AbortSignal
  ) {
    if (this.geminiKeys.length === 0 && this.groqKeys.length === 0) {
        throw new Error("No API keys configured. Please add at least one Gemini or Groq key in the settings.");
    }
    
    // --- Try Gemini First ---
    this.currentProvider = ApiProvider.GEMINI;
    if (this.GoogleGenAI) { // Only try Gemini if SDK is available
      while (this.currentGeminiKeyIndex < this.geminiKeys.length) {
        if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
        
        onProviderUpdate({ provider: ApiProvider.GEMINI, keyIndex: this.currentGeminiKeyIndex });
        try {
          this.initializeGeminiAI();
          if (!this.geminiAI) {
              // Should not happen if we are in this loop, but as a safeguard.
              throw new Error("Gemini AI client failed to initialize.");
          }

          const response = await this.geminiAI.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          for await (const chunk of response) {
            if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
            onChunk(chunk.text);
          }
          return; // Success, exit the function
        } catch (error: any) {
          if (error.name === 'AbortError') throw error;
          console.error(`Error with Gemini key index ${this.currentGeminiKeyIndex}:`, error);
          this.currentGeminiKeyIndex++;
        }
      }
    }


    // --- Fallback to Groq ---
    this.currentProvider = ApiProvider.GROQ;
    while (this.currentGroqKeyIndex < this.groqKeys.length) {
        if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');

        onProviderUpdate({ provider: ApiProvider.GROQ, keyIndex: this.currentGroqKeyIndex });
        try {
            const stream = this.streamGroq(prompt, signal);
            for await (const chunk of stream) {
                if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
                onChunk(chunk);
            }
            return; // Success, exit function
        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
            console.error(`Error with Groq key index ${this.currentGroqKeyIndex}:`, error);
            this.currentGroqKeyIndex++;
        }
    }

    throw new Error("All available API keys for Gemini and Groq failed or are exhausted.");
  }
}