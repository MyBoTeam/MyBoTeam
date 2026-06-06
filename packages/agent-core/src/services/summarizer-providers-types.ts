export const SUMMARY_PROMPT = `Generate a very short title (3-5 words max) that summarizes this task request.
The title should be in sentence case, no quotes, no punctuation at end.
Output ONLY the title on a single line, nothing else.
Examples: Check calendar, Download invoice, Search flights to Paris

Task: `;

export function cleanSummary(text: string): string {
  const firstLine =
    text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? text.trim();

  return firstLine
    .replace(/^["']|["']$/g, '')
    .replace(/[.!?]+$/, '')
    .trim();
}

export function truncatePrompt(prompt: string, maxLength = 30): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 3)}...`;
}
