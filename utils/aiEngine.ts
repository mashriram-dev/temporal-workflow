
/**
 * Browser-Side AI Executor
 * Connects directly to AI Providers if Keys/URLs are present.
 */
import { SdkParamDefinition } from '../sdkDefinitions';

export class AiEngine {
  
  static async execute(serviceId: string, actionId: string, params: any, secrets: Record<string, string>) {
    
    // --- OPENAI ---
    if (serviceId === 'openai') {
      const apiKey = secrets['OPENAI_API_KEY'];
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY in secrets.");
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: params.model,
          messages: [
            { role: 'system', content: params.system_prompt },
            { role: 'user', content: params.user_prompt }
          ],
          temperature: Number(params.temperature || 0.7)
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI Error: ${err.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return { 
        answer: data.choices[0].message.content,
        usage: data.usage
      };
    }

    // --- ANTHROPIC ---
    if (serviceId === 'anthropic') {
      const apiKey = secrets['ANTHROPIC_API_KEY'];
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in secrets.");

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true' // Only for demo purposes
        },
        body: JSON.stringify({
          model: params.model,
          system: params.system,
          messages: [{ role: 'user', content: params.messages }],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Anthropic Error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return { answer: data.content[0].text };
    }

    // --- OLLAMA (Local) ---
    if (serviceId === 'ollama') {
      // Note: User must enable CORS on Ollama: `OLLAMA_ORIGINS="*" ollama serve`
      const baseUrl = params.baseUrl || 'http://localhost:11434';
      
      try {
        const response = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: params.model,
            prompt: params.prompt,
            stream: false
          })
        });

        if (!response.ok) throw new Error("Failed to connect to Ollama. Ensure CORS is enabled.");
        
        const data = await response.json();
        return { answer: data.response };
      } catch (e: any) {
         throw new Error(`Ollama Connection Error: ${e.message}. Did you run "OLLAMA_ORIGINS='*' ollama serve"?`);
      }
    }

    throw new Error(`AI Service ${serviceId} not implemented in Browser Engine.`);
  }
}
