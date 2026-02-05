import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X, Package, Search, FileText, Calendar, Layers, CheckCircle2 } from 'lucide-react';
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
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'builder' | 'verifier'>('builder');
  const [requirementsQuery, setRequirementsQuery] = useState('');
  const [diagramQuery, setDiagramQuery] = useState('');
  const [docsQuery, setDocsQuery] = useState('');
  const [timelineQuery, setTimelineQuery] = useState('');

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

  useEffect(() => {
    if (parsedComponents.length === 0) {
      setSelectedComponentIndex(null);
      return;
    }
    if (selectedComponentIndex === null || selectedComponentIndex >= parsedComponents.length) {
      setSelectedComponentIndex(0);
    }
  }, [parsedComponents.length, selectedComponentIndex]);

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
    <div className="flex-1 flex h-full bg-[#111113] text-white">
      <div className="w-72 border-r border-white/10 flex flex-col">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-xs text-gray-400 font-mono">Components Panel</p>
          <h2 className="text-lg font-serif">Components</h2>
          <p className="text-xs text-gray-400 font-mono mt-2">{projectName}</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-2">
            {parsedComponents.length === 0 ? (
              <div className="text-sm text-gray-400 font-mono border border-white/10 bg-white/5 p-3">
                No components yet. Add one to start scoping tools.
              </div>
            ) : (
              parsedComponents.map((component, index) => (
                <button
                  key={component.id}
                  onClick={() => setSelectedComponentIndex(index)}
                  className={`w-full text-left px-3 py-2 border font-mono text-sm transition-colors ${
                    selectedComponentIndex === index
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Component {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-gray-400" />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveComponent(index);
                        }}
                        className="text-gray-500 hover:text-red-300 transition-colors"
                        aria-label={`Remove component ${index + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{component.name || 'Untitled'}</div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-white/10 p-4 space-y-3">
          {isAdding && (
            <Card className="p-3 bg-[#151518] border-white/10 rounded-none">
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-400 font-mono mb-1 block">Component Name</Label>
                  <Input
                    placeholder="e.g., Sensor Module"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                    className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-400 font-mono mb-1 block">Type</Label>
                  <Input
                    placeholder="e.g., Electronics"
                    value={newComponent.type}
                    onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                    className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="1"
                    min="1"
                    value={newComponent.quantity}
                    onChange={(e) => setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) || 1 })}
                    className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono w-20"
                  />
                  <Input
                    placeholder="Notes"
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
                    className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
                  />
                </div>
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
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full bg-white text-black hover:bg-gray-200 rounded-none font-mono"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Components
          </Button>
        </div>
      </div>

      <div className="w-[360px] border-r border-white/10 flex flex-col">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-serif">Tools searching section</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Scoped to {selectedComponentIndex === null ? 'no component' : `Component ${selectedComponentIndex + 1}`}
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <Card className="p-4 bg-[#151518] border-white/10 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono">
                <Search className="h-4 w-4 text-gray-400" />
                Requirements searching section
              </div>
              <Input
                placeholder="Search requirements"
                value={requirementsQuery}
                onChange={(e) => setRequirementsQuery(e.target.value)}
                className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
              />
              <div className="text-xs text-gray-400 font-mono">
                Returns requirements linked to the selected component.
              </div>
            </Card>

            <Card className="p-4 bg-[#151518] border-white/10 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono">
                <Layers className="h-4 w-4 text-gray-400" />
                Saved Diagram
              </div>
              <Input
                placeholder="Search diagrams"
                value={diagramQuery}
                onChange={(e) => setDiagramQuery(e.target.value)}
                className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
              />
              <div className="text-xs text-gray-400 font-mono">
                Previously saved system diagrams appear here.
              </div>
            </Card>

            <Card className="p-4 bg-[#151518] border-white/10 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono">
                <FileText className="h-4 w-4 text-gray-400" />
                Docs
              </div>
              <Input
                placeholder="Search documentation"
                value={docsQuery}
                onChange={(e) => setDocsQuery(e.target.value)}
                className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
              />
              <div className="text-xs text-gray-400 font-mono">
                Standards, specs, and notes connected to the component.
              </div>
            </Card>

            <Card className="p-4 bg-[#151518] border-white/10 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono">
                <Calendar className="h-4 w-4 text-gray-400" />
                Timeline
              </div>
              <Input
                placeholder="Search milestones"
                value={timelineQuery}
                onChange={(e) => setTimelineQuery(e.target.value)}
                className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
              />
              <div className="text-xs text-gray-400 font-mono">
                Events, milestones, or requirement evolution over time.
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-white/10">
          <h1 className="text-xl font-serif">Components</h1>
          <p className="text-xs text-gray-400 font-mono mt-2">
            A multi-pane web application for systems engineering documentation, requirements management,
            and AI-assisted document generation and verification.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('verifier')}
              className={`px-3 py-1 border font-mono text-xs transition-colors ${
                activeTab === 'verifier'
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Document Verifier
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1 border font-mono text-xs transition-colors ${
                activeTab === 'builder'
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Document Builder
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {activeTab === 'builder' ? (
            <div className="p-6">
              <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-6">
                <div className="space-y-4">
                  <Card className="p-5 bg-[#151518] border-white/10 rounded-none min-h-[320px]">
                    <div className="text-xs text-gray-400 font-mono mb-3">Document canvas</div>
                    <div className="space-y-3 text-sm font-mono">
                      <div className="border border-white/10 bg-black/20 p-3">R1 requirement</div>
                      <div className="border border-white/10 bg-black/20 p-3">Explain something...</div>
                      <div className="border border-white/10 bg-black/20 p-3">
                        Supporting references: D1, D2, D3
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                    <div className="text-xs text-gray-400 font-mono">Final prompt</div>
                    <div className="text-sm font-mono text-gray-300 mt-2">
                      Prompts synthesize selected content into structured text ready for export.
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs">
                        Export to Google Doc
                      </Button>
                      <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white rounded-none font-mono text-xs">
                        Export to PDF
                      </Button>
                    </div>
                  </Card>
                </div>

                <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                  <div className="text-xs text-gray-400 font-mono mb-4">Controls</div>
                  <div className="space-y-3">
                    <Button className="w-full bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs">
                      Add text
                    </Button>
                    <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white rounded-none font-mono text-xs">
                      Add prompt
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <Card className="p-4 bg-[#151518] border-white/10 rounded-none">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  Integrate Google Chats
                </div>
                <div className="text-xs text-gray-400 font-mono mt-2">
                  Imports discussion context for verification.
                </div>
              </Card>
              <Card className="p-4 bg-[#151518] border-white/10 rounded-none">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  Test Readiness Reviewer
                </div>
                <div className="text-xs text-gray-400 font-mono mt-2">
                  Flags gaps, missing requirements, and inconsistencies.
                </div>
              </Card>
              <Card className="p-4 bg-[#151518] border-white/10 rounded-none">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  Test Readiness Reviewer Configuration
                </div>
                <div className="text-xs text-gray-400 font-mono mt-2">
                  Configure criteria, rules, and thresholds for checks.
                </div>
              </Card>
              <Card className="p-5 bg-[#151518] border-white/10 rounded-none min-h-[260px]">
                <div className="text-xs text-gray-400 font-mono mb-2">Configuration and results</div>
                <div className="text-sm font-mono text-gray-300">
                  Large workspace for configuration and verification output.
                </div>
              </Card>
              <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                <div className="text-xs text-gray-400 font-mono mb-2">Prompt</div>
                <div className="text-sm font-mono text-gray-300">
                  Controls verification logic and AI-based readiness checks.
                </div>
              </Card>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
