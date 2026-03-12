import { useState } from 'react';
import { Plus, Trash2, Check, X, Package } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Label } from '@/app/components/ui/label';

interface Component {
  id: string;
  name: string;
  type: string;
  quantity: number;
  notes?: string;
}

interface ComponentsViewProps {
  projectName: string;
  components: string[];
  onAddComponent: (component: string) => void;
  onRemoveComponent: (index: number) => void;
}

export function ComponentsView({
  projectName,
  components,
  onAddComponent,
  onRemoveComponent,
}: ComponentsViewProps) {
  const [newComponent, setNewComponent] = useState<Partial<Component>>({
    name: '',
    type: '',
    quantity: 1,
    notes: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  // Parse components from strings
  const parsedComponents: Component[] = components.map((comp, index) => {
    try {
      return JSON.parse(comp);
    } catch {
      // Fallback for invalid JSON
      return {
        id: `${index}`,
        name: comp,
        type: 'Unknown',
        quantity: 1,
      };
    }
  });

  const handleAdd = () => {
    if (newComponent.name && newComponent.type) {
      const component: Component = {
        id: Date.now().toString(),
        name: newComponent.name,
        type: newComponent.type,
        quantity: newComponent.quantity || 1,
        notes: newComponent.notes,
      };
      onAddComponent(JSON.stringify(component));
      setNewComponent({
        name: '',
        type: '',
        quantity: 1,
        notes: '',
      });
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
            <h1 className="text-2xl font-serif text-white">Components</h1>
            <p className="text-sm text-gray-400 mt-1 font-mono">{projectName}</p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 relative z-20">
        <div className="p-6 space-y-4 max-w-4xl">
          {/* Add New Component Card */}
          {isAdding && (
            <Card className="p-4 bg-[#222222] border-white/10 rounded-none">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-1.5 block">Component Name</Label>
                    <Input
                      placeholder="e.g., Sensor Module"
                      value={newComponent.name}
                      onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                      className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-1.5 block">Type</Label>
                    <Input
                      placeholder="e.g., Electronics"
                      value={newComponent.type}
                      onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                      className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 font-mono mb-1.5 block">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    min="1"
                    value={newComponent.quantity}
                    onChange={(e) => setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) || 1 })}
                    className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono w-32"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 font-mono mb-1.5 block">Notes (Optional)</Label>
                  <Input
                    placeholder="Additional information..."
                    value={newComponent.notes}
                    onChange={(e) => setNewComponent({ ...newComponent, notes: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAdd();
                      } else if (e.key === 'Escape') {
                        setIsAdding(false);
                        setNewComponent({
                          name: '',
                          type: '',
                          quantity: 1,
                          notes: '',
                        });
                      }
                    }}
                    className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                  />
                </div>
                <div className="flex gap-2 pt-2">
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
                      setNewComponent({
                        name: '',
                        type: '',
                        quantity: 1,
                        notes: '',
                      });
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

          {/* Components List */}
          {parsedComponents.length === 0 && !isAdding ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-[#222222] border border-white/10 mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-serif text-white mb-2">No components yet</h3>
              <p className="text-gray-400 mb-6 font-mono text-sm">
                Start by adding your first component to this project
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Component
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {parsedComponents.map((component, index) => (
                <Card
                  key={component.id}
                  className="p-4 bg-[#222222] border-white/10 rounded-none hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-none bg-white/10 border border-white/20 flex-shrink-0">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-white font-mono font-semibold">{component.name}</h4>
                            <span className="text-xs px-2 py-0.5 bg-white/10 border border-white/20 rounded-none text-gray-300 font-mono">
                              {component.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400 font-mono">Qty: {component.quantity}</span>
                            {component.notes && (
                              <span className="text-gray-500 font-mono text-xs">{component.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveComponent(index)}
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