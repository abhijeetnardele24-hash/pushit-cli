import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAiKey } from './config.js';

export async function suggestCommits(diff: string): Promise<string[]> {
  const apiKey = getAiKey();
  if (!apiKey) {
    throw new Error('AI Key not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert developer. I will provide a git diff.
Generate exactly 3 conventional commit messages (e.g. feat: add login, fix: correct typo) that accurately summarize the changes.
Do not output any markdown, explanations, or quotes. Just output 3 lines of text, one commit message per line.

Git diff:
${diff.slice(0, 5000)} // Truncating to avoid massive token limits if diff is huge
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Split by newline and clean up empty lines or list markers like "1. ", "-", etc.
    const suggestions = text.split('\n')
      .map(line => line.replace(/^[0-9\.\-\*\s]+/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);
      
    if (suggestions.length === 0) {
      return ['chore: update files'];
    }
    return suggestions;
  } catch (error: any) {
    throw new Error(`AI Generation failed: ${error.message}`);
  }
}
