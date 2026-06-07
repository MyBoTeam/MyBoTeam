'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '../../general/components/ColorPicker';

export { WORKSPACE_COLORS } from '../../general/components/ColorPicker';
export { CreateWorkspaceForm } from './CreateWorkspaceForm';

interface EditWorkspaceFormProps {
  name: string;
  description: string;
  color: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditWorkspaceForm({
  name,
  description,
  color,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onSave,
  onCancel,
}: EditWorkspaceFormProps) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        placeholder="Workspace name"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        placeholder="Description (optional)"
      />
      <ColorPicker selectedColor={color} onColorChange={onColorChange} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={!name.trim()}>
          <Check className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}
