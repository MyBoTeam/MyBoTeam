import type { KnowledgeNote, KnowledgeNoteType } from '@myboteam/agent-core';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { getMyBoTeam } from '@/config/myboteam';

type MyBoTeamInstance = ReturnType<typeof getMyBoTeam>;

export interface UseKnowledgeNotesReturn {
  notes: KnowledgeNote[];
  error: string | null;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  newType: KnowledgeNoteType;
  setNewType: (type: KnowledgeNoteType) => void;
  newContent: string;
  setNewContent: (content: string) => void;
  editType: KnowledgeNoteType;
  setEditType: (type: KnowledgeNoteType) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  handleAdd: () => Promise<void>;
  handleEdit: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  startEdit: (note: KnowledgeNote) => void;
}

export function useKnowledgeNotes(
  myboteam: MyBoTeamInstance,
  workspaceId: string,
): UseKnowledgeNotesReturn {
  const { t } = useTranslation('settings');
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState<KnowledgeNoteType>('context');
  const [newContent, setNewContent] = useState('');
  const [editType, setEditType] = useState<KnowledgeNoteType>('context');
  const [editContent, setEditContent] = useState('');

  const activeRequestRef = useRef(0);

  const workspaceIdRef = useRef(workspaceId);
  useLayoutEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const loadNotes = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    try {
      const loaded = await myboteam.listKnowledgeNotes(workspaceId);
      if (requestId === activeRequestRef.current && workspaceIdRef.current === workspaceId) {
        setError(null);
        setNotes(loaded);
      }
    } catch (err) {
      if (requestId === activeRequestRef.current && workspaceIdRef.current === workspaceId) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [myboteam, workspaceId]);

  useEffect(() => {
    const requestId = ++activeRequestRef.current;
    myboteam
      .listKnowledgeNotes(workspaceId)
      .then((loaded) => {
        if (requestId === activeRequestRef.current && workspaceIdRef.current === workspaceId) {
          setError(null);
          setNotes(loaded);
        }
      })
      .catch((err: unknown) => {
        if (requestId === activeRequestRef.current && workspaceIdRef.current === workspaceId) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      activeRequestRef.current++;
    };
  }, [myboteam, workspaceId]);

  const handleAdd = useCallback(async () => {
    if (!newContent.trim()) {
      return;
    }
    try {
      await myboteam.createKnowledgeNote({
        workspaceId,
        type: newType,
        content: newContent.trim(),
      });
      if (workspaceIdRef.current !== workspaceId) {
        return;
      }
      setError(null);
      setNewContent('');
      setNewType('context');
      setShowAddForm(false);
      await loadNotes();
    } catch (err) {
      if (workspaceIdRef.current === workspaceId) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [myboteam, workspaceId, newType, newContent, loadNotes]);

  const handleEdit = useCallback(
    async (id: string) => {
      if (!editContent.trim()) {
        return;
      }
      try {
        const updated = await myboteam.updateKnowledgeNote(id, workspaceId, {
          type: editType,
          content: editContent.trim(),
        });
        if (workspaceIdRef.current !== workspaceId) {
          return;
        }
        if (updated === null) {
          setError(t('knowledgeNotes.errors.updateFailed'));
          return;
        }
        setError(null);
        setEditingId(null);
        await loadNotes();
      } catch (err) {
        if (workspaceIdRef.current === workspaceId) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    },
    [myboteam, workspaceId, editType, editContent, loadNotes, t],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const deleted = await myboteam.deleteKnowledgeNote(id, workspaceId);
        if (workspaceIdRef.current !== workspaceId) {
          return;
        }
        if (!deleted) {
          setError(t('knowledgeNotes.errors.deleteFailed'));
          return;
        }
        setError(null);
        await loadNotes();
      } catch (err) {
        if (workspaceIdRef.current === workspaceId) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    },
    [myboteam, workspaceId, loadNotes, t],
  );

  const startEdit = useCallback((note: KnowledgeNote) => {
    setEditingId(note.id);
    setEditType(note.type);
    setEditContent(note.content);
  }, []);

  return {
    notes,
    error,
    showAddForm,
    setShowAddForm,
    editingId,
    setEditingId,
    newType,
    setNewType,
    newContent,
    setNewContent,
    editType,
    setEditType,
    editContent,
    setEditContent,
    handleAdd,
    handleEdit,
    handleDelete,
    startEdit,
  };
}
