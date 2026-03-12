import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface Requirement {
  id: string;
  text: string;
  completed: boolean;
}

interface RequirementsViewProps {
  projectName: string;
  requirements: string[];
  onAddRequirement: (requirement: string) => void;
  onRemoveRequirement: (index: number) => void;
}

export function RequirementsView({
  projectName,
  requirements,
  onAddRequirement,
  onRemoveRequirement,
}: RequirementsViewProps) {
  const [newRequirement, setNewRequirement] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newRequirement.trim()) {
      onAddRequirement(newRequirement);
      setNewRequirement('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1a1a1a] relative overflow-hidden">
      {/* Film Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-white/10 px-6 py-4 relative z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-white">Requirements</h1>
            <p className="text-sm text-gray-400 mt-1 font-mono">{projectName}</p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 relative z-20">
        <div className="p-6 space-y-4 max-w-4xl">
          {/* Add New Requirement Card */}
          {isAdding && (
            <Card className="p-4 bg-[#222222] border-white/10 rounded-none">
              <div className="space-y-3">
                <Input
                  placeholder="Enter requirement description..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd();
                    } else if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewRequirement('');
                    }
                  }}
                  className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAdd} 
                    size="sm" 
                    className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAdding(false);
                      setNewRequirement('');
                    }}
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-none font-mono"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Requirements List */}
          {requirements.length === 0 && !isAdding ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-[#222222] border border-white/10 mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-serif text-white mb-2">No requirements yet</h3>
              <p className="text-gray-400 mb-6 font-mono text-sm">
                Start by adding your first requirement to this project
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Requirement
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requirements.map((requirement, index) => (
                <Card
                  key={index}
                  className="p-4 bg-[#222222] border-white/10 rounded-none hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-none bg-white/10 text-white text-xs font-mono flex-shrink-0 mt-0.5 border border-white/20">
                          {index + 1}
                        </div>
                        <p className="text-white flex-1 font-mono text-sm">{requirement}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveRequirement(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
