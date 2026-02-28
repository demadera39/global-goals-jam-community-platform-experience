import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Trash2, Edit3 } from 'lucide-react';

type Option = {
  id: string;
  label: string;
  description?: string;
};

const initialOptions: Option[] = [
  { id: '1', label: 'Recommended option 1', description: 'Fast ideation for small groups (15-30 min).' },
  { id: '2', label: 'Recommended option 2', description: 'Deeper exploration for medium groups (45-60 min).' },
  { id: '3', label: 'Recommended option 3', description: 'Full session flow for large groups (90+ min).' }
];

export default function MethodSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState({ label: '', description: '' });
  const [editOption, setEditOption] = useState({ label: '', description: '' });

  const handleAddOption = () => {
    if (!newOption.label.trim()) return;
    
    const newId = Date.now().toString();
    const option: Option = {
      id: newId,
      label: newOption.label.trim(),
      description: newOption.description.trim() || undefined
    };
    
    setOptions(prev => [...prev, option]);
    setNewOption({ label: '', description: '' });
    setIsAdding(false);
  };

  const handleDeleteOption = (optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
    if (selected === optionId) {
      setSelected(null);
    }
  };

  const handleStartEdit = (option: Option) => {
    setEditingId(option.id);
    setEditOption({
      label: option.label,
      description: option.description || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editOption.label.trim()) return;
    
    setOptions(prev => prev.map(opt => 
      opt.id === editingId 
        ? { ...opt, label: editOption.label.trim(), description: editOption.description.trim() || undefined }
        : opt
    ));
    setEditingId(null);
    setEditOption({ label: '', description: '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditOption({ label: '', description: '' });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Method selection</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Method
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Choose the method that best fits your challenge, time and group size.</p>

      {/* Add New Option Form */}
      {isAdding && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Add New Method</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Method Name</label>
              <Input
                value={newOption.label}
                onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Enter method name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <Textarea
                value={newOption.description}
                onChange={(e) => setNewOption(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the method, timing, and group size"
                rows={2}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddOption}
                size="sm"
                disabled={!newOption.label.trim()}
              >
                Add Method
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewOption({ label: '', description: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <fieldset className="space-y-3" aria-label="Method selection">
        {options.map((opt) => (
          <div key={opt.id}>
            {editingId === opt.id ? (
              <div className="block rounded-lg p-4 border border-blue-300 bg-blue-50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Method
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Method Name</label>
                    <Input
                      value={editOption.label}
                      onChange={(e) => setEditOption(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={editOption.description}
                      onChange={(e) => setEditOption(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSaveEdit}
                      size="sm"
                      disabled={!editOption.label.trim()}
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                className={`block rounded-lg p-4 border transition-shadow cursor-pointer flex flex-col hover:shadow-md ${selected === opt.id ? 'border-emerald-500 bg-emerald-50 shadow' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="methodSelection"
                      value={opt.id}
                      checked={selected === opt.id}
                      onChange={() => setSelected(opt.id)}
                      className="h-4 w-4 text-emerald-600"
                      aria-checked={selected === opt.id}
                    />
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected === opt.id && <span className="text-xs text-emerald-700">Selected</span>}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleStartEdit(opt);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 rounded"
                      aria-label={`Edit ${opt.label}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete "${opt.label}"?`)) {
                          handleDeleteOption(opt.id);
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 rounded"
                      aria-label={`Delete ${opt.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {opt.description && <p className="mt-2 text-sm text-muted-foreground">{opt.description}</p>}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard?.writeText(opt.label);
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-100 border text-gray-700"
                    aria-label={`Copy ${opt.label}`}
                  >
                    Copy name
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`You chose: ${opt.label}`);
                    }}
                    className="text-xs px-2 py-1 rounded bg-emerald-600 text-white"
                  >
                    Use this method
                  </button>
                </div>
              </label>
            )}
          </div>
        ))}
      </fieldset>

      {options.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No methods available. Click "Add Method" to create one.</p>
        </div>
      )}

      <div className="mt-4 text-sm">
        <strong>Current selection:</strong> {selected ? options.find(o => o.id === selected)?.label : 'None'}
      </div>
    </div>
  );
}
