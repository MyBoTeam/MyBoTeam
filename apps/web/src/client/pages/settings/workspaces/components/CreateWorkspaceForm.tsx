import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '../../general/components/ColorPicker';

interface CreateWorkspaceFormProps {
  name: string;
  description: string;
  color: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateWorkspaceForm({
  name,
  description,
  color,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onSubmit,
  onCancel,
}: CreateWorkspaceFormProps) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4 space-y-3">
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
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={!name.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create
        </Button>
      </div>
    </div>
  );
}
