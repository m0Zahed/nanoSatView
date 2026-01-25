import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  newSection: {
    categoryId: string;
    title: string;
    content: string;
    endpoint: string;
    type: 'api' | 'markdown';
  };
  setNewSection: (section: any) => void;
  categories: Array<{ id: string; title: string }>;
}

export function AddSectionModal({
  isOpen,
  onClose,
  onAdd,
  newSection,
  setNewSection,
  categories,
}: AddSectionModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#1a1a1a] border border-white/20 rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-mono text-white font-bold">Add New Section</h2>
            <p className="text-sm text-gray-400 mt-1">Create a new API documentation or markdown page</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-gray-300 mb-2 block text-sm">Category</Label>
            <select
              value={newSection.categoryId}
              onChange={(e) => setNewSection({ ...newSection, categoryId: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40 transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#0a0a0a] text-white">
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block text-sm">Type</Label>
            <select
              value={newSection.type}
              onChange={(e) => setNewSection({ ...newSection, type: e.target.value as 'api' | 'markdown' })}
              className="w-full bg-[#0a0a0a] border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40 transition-colors"
            >
              <option value="api" className="bg-[#0a0a0a] text-white">API Documentation</option>
              <option value="markdown" className="bg-[#0a0a0a] text-white">Markdown Page</option>
            </select>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block text-sm">Section Title</Label>
            <Input
              value={newSection.title}
              onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
              placeholder="e.g., Create User"
              className="bg-[#0a0a0a] border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
            />
          </div>

          {newSection.type === 'api' && (
            <div>
              <Label className="text-gray-300 mb-2 block text-sm">Endpoint</Label>
              <Input
                value={newSection.endpoint}
                onChange={(e) => setNewSection({ ...newSection, endpoint: e.target.value })}
                placeholder="/v1/users"
                className="bg-[#0a0a0a] border-white/20 text-white font-mono placeholder:text-gray-500 focus:border-white/40"
              />
            </div>
          )}

          <div>
            <Label className="text-gray-300 mb-2 block text-sm">
              {newSection.type === 'markdown' ? 'Markdown Content' : 'Description'}
            </Label>
            <Textarea
              value={newSection.content}
              onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
              placeholder={newSection.type === 'markdown' ? '# Markdown heading\n\nWrite your markdown content here...' : 'Describe what this endpoint does...'}
              className="bg-[#0a0a0a] border-white/20 text-white min-h-32 placeholder:text-gray-500 focus:border-white/40 resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 text-gray-300 hover:bg-white/5 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newSection.title || !newSection.content}
          >
            Add Section
          </Button>
        </div>
      </div>
    </div>
  );
}