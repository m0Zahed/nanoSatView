import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  X,
  Package,
  Search,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

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
  requirements?: string[];
  onAddComponent: (component: string) => void;
  onRemoveComponent: (index: number) => void;
}

export function ComponentsView({
  projectName,
  components,
  requirements = [],
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
  const [activeTab, setActiveTab] = useState<'builder' | 'markdown' | 'component'>('builder');
  const [isComponentListOpen, setIsComponentListOpen] = useState(true);
  const [isSearchSectionOpen, setIsSearchSectionOpen] = useState(true);
  const [isComponentsPanelCollapsed, setIsComponentsPanelCollapsed] = useState(true);
  const [isToolsPanelCollapsed, setIsToolsPanelCollapsed] = useState(true);
  const [componentsCursor, setComponentsCursor] = useState({ x: 0, y: 0, visible: false });
  const [toolsCursor, setToolsCursor] = useState({ x: 0, y: 0, visible: false });
  const [requirementsQuery, setRequirementsQuery] = useState('');
  const [diagramQuery, setDiagramQuery] = useState('');
  const [docsQuery, setDocsQuery] = useState('');
  const [timelineQuery, setTimelineQuery] = useState('');

  const parsedRequirements = useMemo(
    () =>
      requirements.map((raw, index) => {
        try {
          const parsed = JSON.parse(raw) as Partial<{
            Id: string;
            id: string;
            Title: string;
            title: string;
            Description: string;
            description: string;
            Type: string;
            type: string;
            Subsystem: string;
            subsystem: string;
            Tags: string[];
            tags: string[];
          }>;
          const title = (parsed.Title || parsed.title || '').toString().trim();
          const description = (parsed.Description || parsed.description || '').toString().trim();
          const type = (parsed.Type || parsed.type || '').toString().trim();
          const subsystem = (parsed.Subsystem || parsed.subsystem || '').toString().trim();
          const tags = Array.isArray(parsed.Tags || parsed.tags)
            ? ((parsed.Tags || parsed.tags) as string[])
            : [];
          return {
            id: (parsed.Id || parsed.id || `req-${index + 1}`).toString(),
            title: title || raw,
            description: description || raw,
            type: type || 'General',
            subsystem: subsystem || 'General',
            tags,
          };
        } catch {
          return {
            id: `req-${index + 1}`,
            title: raw,
            description: raw,
            type: 'General',
            subsystem: 'General',
            tags: [] as string[],
          };
        }
      }),
    [requirements]
  );

  const filteredRequirements = useMemo(() => {
    const query = requirementsQuery.trim().toLowerCase();
    if (!query) {
      return parsedRequirements.slice(0, 6);
    }
    return parsedRequirements
      .filter(
        (req) =>
          req.id.toLowerCase().includes(query) ||
          req.title.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          req.type.toLowerCase().includes(query) ||
          req.subsystem.toLowerCase().includes(query) ||
          req.tags.some((tag) => tag.toLowerCase().includes(query))
      )
      .slice(0, 20);
  }, [parsedRequirements, requirementsQuery]);

  const parsedComponents: Component[] = components.map((comp, index) => {
    try {
      return JSON.parse(comp);
    } catch {
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

  const selectedComponent =
    selectedComponentIndex === null ? null : parsedComponents[selectedComponentIndex] || null;

  const generatedMarkdown = useMemo(() => {
    if (!selectedComponent) {
      return '# Component Documentation\n\nNo component selected.\n';
    }

    const relatedRequirements = filteredRequirements.slice(0, 6);
    const requirementsBlock =
      relatedRequirements.length === 0
        ? '- No matching requirements found.'
        : relatedRequirements
            .map((req) => `- **${req.id}** ${req.title} (${req.type}/${req.subsystem})`)
            .join('\n');

    return [
      '# Component Documentation',
      '',
      `## ${selectedComponent.name || 'Untitled Component'}`,
      '',
      `- ID: ${selectedComponent.id}`,
      `- Type: ${selectedComponent.type || 'Unknown'}`,
      `- Quantity: ${selectedComponent.quantity || 1}`,
      `- Notes: ${selectedComponent.notes?.trim() || 'N/A'}`,
      '',
      '## Linked Requirements',
      requirementsBlock,
      '',
      '## Prompt',
      'Draft a concise test-readiness summary for this component using the linked requirements.',
      '',
    ].join('\n');
  }, [selectedComponent, filteredRequirements]);

  const [markdownDraft, setMarkdownDraft] = useState(generatedMarkdown);

  useEffect(() => {
    setMarkdownDraft(generatedMarkdown);
  }, [generatedMarkdown]);

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
    <div className="flex-1 flex h-full bg-[#111113] text-white overflow-x-auto">
      <style>{`
        @keyframes cursorSpin {
          from { transform: rotate(0deg) scale(0.9); }
          to { transform: rotate(360deg) scale(1.15); }
        }
        @keyframes cursorPulse {
          0%, 100% { transform: scale(0.75); opacity: 0.7; }
          50% { transform: scale(1.35); opacity: 1; }
        }
        @keyframes blink {
          50% { border-color: transparent; }
        }
      `}</style>

      {isComponentsPanelCollapsed ? (
        <button
          type="button"
          onClick={() => setIsComponentsPanelCollapsed(false)}
          onMouseEnter={() => setComponentsCursor((prev) => ({ ...prev, visible: true }))}
          onMouseLeave={() => setComponentsCursor((prev) => ({ ...prev, visible: false }))}
          onMouseMove={(event) => {
            setComponentsCursor({
              x: event.clientX,
              y: event.clientY,
              visible: true,
            });
          }}
          className="group relative z-50 overflow-visible w-10 min-w-10 shrink-0 border-r border-white/10 bg-[#0f0f12] hover:bg-[#151518] transition-colors flex items-center justify-center cursor-none"
          aria-label="Expand components panel"
        >
          <span className="text-xs font-mono text-gray-400 group-hover:text-white">C</span>
          {componentsCursor.visible && (
            <div
              className="pointer-events-none fixed z-[10001]"
              style={{
                left: componentsCursor.x,
                top: componentsCursor.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex items-center gap-2 px-2 py-1 border border-white/20 bg-[#0f0f12] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                <div className="relative h-4 w-4 animate-[cursorSpin_1.2s_linear_infinite]">
                  <span className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite]" />
                  <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite] [animation-delay:0.1s]" />
                  <span className="absolute left-0 bottom-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite] [animation-delay:0.2s]" />
                  <span className="absolute right-0 bottom-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite] [animation-delay:0.3s]" />
                </div>
                <span className="whitespace-nowrap text-xs font-mono text-gray-200 border-r border-white/60 pr-1 animate-[blink_1s_step-end_infinite]">
                  Components Panel
                </span>
              </div>
            </div>
          )}
        </button>
      ) : (
        <div className="w-72 min-w-72 shrink-0 border-r border-white/10 flex flex-col">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-400 font-mono">Components Panel</p>
                <h2 className="text-lg font-serif">Components</h2>
                <p className="text-xs text-gray-400 font-mono mt-2">{projectName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsComponentsPanelCollapsed(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Collapse components panel"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => setIsComponentListOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs text-gray-300 font-mono hover:text-white transition-colors"
            >
              <span>Component List</span>
              {isComponentListOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          {isComponentListOpen && (
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
          )}
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
                      onChange={(e) =>
                        setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) || 1 })
                      }
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
      )}

      {isToolsPanelCollapsed ? (
        <button
          type="button"
          onClick={() => setIsToolsPanelCollapsed(false)}
          onMouseEnter={() => setToolsCursor((prev) => ({ ...prev, visible: true }))}
          onMouseLeave={() => setToolsCursor((prev) => ({ ...prev, visible: false }))}
          onMouseMove={(event) => {
            setToolsCursor({
              x: event.clientX,
              y: event.clientY,
              visible: true,
            });
          }}
          className="group relative z-50 overflow-visible w-10 min-w-10 shrink-0 border-r border-white/10 bg-[#0f0f12] hover:bg-[#151518] transition-colors flex items-center justify-center cursor-none"
          aria-label="Expand tools searching section"
        >
          <Search className="h-4 w-4 text-gray-400 group-hover:text-white" />
          {toolsCursor.visible && (
            <div
              className="pointer-events-none fixed z-[10000]"
              style={{
                left: toolsCursor.x,
                top: toolsCursor.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex items-center gap-2 px-2 py-1 border border-white/20 bg-[#0f0f12] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                <div className="relative h-4 w-4 animate-[cursorSpin_1.2s_linear_infinite]">
                  <span className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite]" />
                  <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite] [animation-delay:0.1s]" />
                  <span className="absolute left-0 bottom-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite] [animation-delay:0.2s]" />
                  <span className="absolute right-0 bottom-0 h-1.5 w-1.5 rounded-full bg-white animate-[cursorPulse_0.8s_ease-in-out_infinite] [animation-delay:0.3s]" />
                </div>
                <span className="whitespace-nowrap text-xs font-mono text-gray-200 border-r border-white/60 pr-1 animate-[blink_1s_step-end_infinite]">
                  Tools Searching Section
                </span>
              </div>
            </div>
          )}
        </button>
      ) : (
        <div className="w-[360px] min-w-[360px] shrink-0 border-r border-white/10 flex flex-col">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-serif">Tools searching section</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Scoped to {selectedComponentIndex === null ? 'no component' : `Component ${selectedComponentIndex + 1}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsToolsPanelCollapsed(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Collapse tools searching section"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => setIsSearchSectionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs text-gray-300 font-mono hover:text-white transition-colors"
            >
              <span>Search Section</span>
              {isSearchSectionOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          {isSearchSectionOpen && (
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
                  <div className="border border-white/10 bg-black/20 max-h-48 overflow-auto">
                    {filteredRequirements.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 font-mono">No matching requirements</div>
                    ) : (
                      filteredRequirements.map((requirement) => (
                        <div
                          key={requirement.id}
                          className="p-3 border-b border-white/10 last:border-b-0 hover:bg-white/5"
                        >
                          <p className="text-xs text-gray-400 font-mono">{requirement.id}</p>
                          <p className="text-sm text-white font-mono mt-1">{requirement.title}</p>
                          <p className="text-xs text-gray-400 font-mono mt-1 line-clamp-2">
                            {requirement.description}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono mt-1">
                            {requirement.type} - {requirement.subsystem}
                          </p>
                        </div>
                      ))
                    )}
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
          )}
        </div>
      )}

      <div className="flex-1 min-w-[520px] flex flex-col">
        <div className="px-6 py-4 border-b border-white/10">
          <h1 className="text-xl font-serif">Components</h1>
          <p className="text-xs text-gray-400 font-mono mt-2">
            A multi-pane web application for systems engineering documentation, requirements management,
            and AI-assisted document generation and verification.
          </p>
          <div className="mt-4 flex gap-2">
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
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 border font-mono text-xs transition-colors ${
                activeTab === 'markdown'
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Generated Markdown
            </button>
            <button
              onClick={() => setActiveTab('component')}
              className={`px-3 py-1 border font-mono text-xs transition-colors ${
                activeTab === 'component'
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Component Display
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
                      <Button
                        variant="outline"
                        className="border-white/10 text-gray-300 hover:text-white rounded-none font-mono text-xs"
                      >
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
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-gray-300 hover:text-white rounded-none font-mono text-xs"
                    >
                      Add prompt
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          ) : activeTab === 'markdown' ? (
            <div className="p-6 space-y-4">
              <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                <div className="text-xs text-gray-400 font-mono mb-3">Generated markdown (editable)</div>
                <Textarea
                  value={markdownDraft}
                  onChange={(e) => setMarkdownDraft(e.target.value)}
                  className="min-h-[520px] bg-[#0f0f12] border-white/10 text-white rounded-none font-mono text-xs"
                />
              </Card>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                <div className="text-xs text-gray-400 font-mono mb-2">Selected component</div>
                {selectedComponent ? (
                  <div className="space-y-2 text-sm font-mono">
                    <p className="text-white">{selectedComponent.name || 'Untitled Component'}</p>
                    <p className="text-xs text-gray-400">Type: {selectedComponent.type || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Quantity: {selectedComponent.quantity || 1}</p>
                    <p className="text-xs text-gray-400">Notes: {selectedComponent.notes?.trim() || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-mono">No component selected.</p>
                )}
              </Card>
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
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
