import type { KnowledgeNoteType } from '../../common/types/workspace.js';
import { listKnowledgeNotes } from './knowledge-note-crud.js';

const NOTE_TYPE_LABELS: Record<KnowledgeNoteType, string> = {
  context: 'Context',
  instruction: 'Instruction',
  reference: 'Reference',
};

export interface FormattedKnowledgeNotes {
  instructions: string;
  context: string;
}

export function getFormattedKnowledgeNotes(workspaceId: string): FormattedKnowledgeNotes {
  const notes = listKnowledgeNotes(workspaceId);
  if (notes.length === 0) {
    return { instructions: '', context: '' };
  }

  const grouped: Record<KnowledgeNoteType, string[]> = {
    context: [],
    instruction: [],
    reference: [],
  };

  for (const note of notes) {
    if (!grouped[note.type]) {
      continue;
    }
    grouped[note.type].push(note.content);
  }

  const instructions =
    grouped.instruction.length > 0 ? grouped.instruction.map((c) => `- ${c}`).join('\n') : '';

  const contextSections: string[] = [];
  for (const type of ['context', 'reference'] as const) {
    if (grouped[type].length > 0) {
      const label = NOTE_TYPE_LABELS[type];
      const items = grouped[type].map((c) => `- ${c}`).join('\n');
      contextSections.push(`### ${label}\n${items}`);
    }
  }

  return {
    instructions,
    context: contextSections.join('\n\n'),
  };
}

/**
 * Legacy single-string formatter kept for backward compatibility with any
 * caller that still injects all types into one soft `<workspace-knowledge>`
 * block. New callers should prefer `getFormattedKnowledgeNotes` so
 * instruction-type notes can be rendered under a binding wrapper per the
 * PR #847 review (Codex P2).
 */
export function getKnowledgeNotesForPrompt(workspaceId: string): string {
  const { instructions, context } = getFormattedKnowledgeNotes(workspaceId);
  const sections: string[] = [];
  if (instructions) {
    sections.push(`### ${NOTE_TYPE_LABELS.instruction}\n${instructions}`);
  }
  if (context) {
    sections.push(context);
  }
  return sections.join('\n\n');
}
