import { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  NodeProps,
  NodeResizer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Square,
  Diamond,
  Circle,
  Plus,
  Trash2,
  FileImage,
  Maximize2,
  Box,
  Save,
  FolderOpen,
  ArrowLeft,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useAuth } from '@/app/auth/AuthContext';
import { saveDiagramEvent } from '@/app/api/diagramEvents';

// Interfaces
interface NestedDiagram {
  nodes: Node[];
  edges: Edge[];
}

interface NodeIO {
  id: string;
  label: string;
  direction: 'up' | 'down' | 'left' | 'right';
  type: 'input' | 'output';
}

interface NodeSettings {
  name?: string;
  description?: string;
  inputs: NodeIO[];
  outputs: NodeIO[];
  linkedRequirements: string[];
}

interface GeneratedDiagram {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  generatedAt: Date | string;
  updatedAt?: string;
  updatedBy?: string;
  nodeCount: number;
  edgeCount: number;
  content: string;
  thumbnail?: string;
  metadata?: Record<string, string>;
  editHistory?: Array<{ at: string; by: string; summary: string }>;
  snapshot?: {
    nodes: Node[];
    edges: Edge[];
    nestedDiagrams: Record<string, NestedDiagram>;
    nodeSettings: Record<string, NodeSettings>;
  };
}
type DiagramSnapshot = NonNullable<GeneratedDiagram['snapshot']>;

interface OperationalFlowProps {
  projectId?: string;
  projectName?: string;
}

// Custom Node Component with Dynamic Handles
const CustomNode = memo(({ data }: NodeProps) => {
  const settings: NodeSettings = (data?.settings as NodeSettings) || { inputs: [], outputs: [], linkedRequirements: [] };
  
  const getPositionByDirection = (direction: string): Position => {
    switch (direction) {
      case 'up': return Position.Top;
      case 'down': return Position.Bottom;
      case 'left': return Position.Left;
      case 'right': return Position.Right;
      default: return Position.Left;
    }
  };

  return (
    <div className="px-4 py-2 min-w-[120px]">
      {/* Render input handles */}
      {settings.inputs?.map((input) => (
        <Handle
          key={input.id}
          type="target"
          position={getPositionByDirection(input.direction)}
          id={input.id}
          style={{
            background: '#10b981',
            width: '10px',
            height: '10px',
            border: '2px solid #1a1a1a',
          }}
        />
      ))}
      
      {/* Render output handles */}
      {settings.outputs?.map((output) => (
        <Handle
          key={output.id}
          type="source"
          position={getPositionByDirection(output.direction)}
          id={output.id}
          style={{
            background: '#3b82f6',
            width: '10px',
            height: '10px',
            border: '2px solid #1a1a1a',
          }}
        />
      ))}
      
      {/* Node content */}
      <div className="text-center">
        <div className="font-mono">{settings.name || (data?.label as string) || 'Node'}</div>
        {settings.description && (
          <div className="text-[9px] text-gray-400 font-mono mt-1">{settings.description}</div>
        )}
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

// Custom Group Node Component
const GroupNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div 
      className="w-full h-full border border-white/30 rounded-none relative"
      style={{ minWidth: 200, minHeight: 150 }}
    >
      {selected && (
        <NodeResizer
          color="#ffffff"
          minWidth={200}
          minHeight={150}
          isVisible={selected}
          shouldResize={() => true}
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '0px',
          }}
        />
      )}
      <div className="absolute -top-5 left-0 font-mono text-white/50 text-xs pointer-events-none">
        {(data?.name as string) || (data?.label as string) || 'Group'}
      </div>
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

// Define node types outside component
const nodeTypes = {
  custom: CustomNode,
  group: GroupNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    data: { 
      label: 'Start',
      settings: { inputs: [], outputs: [], linkedRequirements: [] }
    },
    position: { x: 250, y: 50 },
    style: { 
      background: '#222222', 
      color: 'white', 
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '0px',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px 15px',
    },
  },
];

const initialEdges: Edge[] = [];

const DIAGRAM_STORE_KEY = 'operational-flow-diagram-store-v1';
const MAX_NESTED_LEVEL = 4;

function toPathKey(path: string[]) {
  return path.join('::');
}

function toCDataSafe(value: string) {
  return value.replace(/]]>/g, ']]]]><![CDATA[>');
}

function buildDiagramThumbnail(title: string, nodeCount: number, edgeCount: number) {
  const safeTitle = title.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='160' viewBox='0 0 320 160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#1f2937'/><stop offset='100%' stop-color='#111827'/></linearGradient></defs><rect width='320' height='160' fill='url(#g)'/><rect x='12' y='12' width='296' height='136' fill='none' stroke='rgba(255,255,255,0.2)'/><text x='20' y='36' fill='white' font-size='12' font-family='monospace'>${safeTitle.slice(0, 34)}</text><text x='20' y='58' fill='#9ca3af' font-size='11' font-family='monospace'>${nodeCount} nodes</text><text x='20' y='76' fill='#9ca3af' font-size='11' font-family='monospace'>${edgeCount} edges</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function cloneDiagramSnapshot(snapshot: DiagramSnapshot): DiagramSnapshot {
  if (typeof structuredClone === 'function') {
    return structuredClone(snapshot);
  }
  return JSON.parse(JSON.stringify(snapshot)) as DiagramSnapshot;
}

// Node Settings Tab Component
function NodeSettingsTab({
  nodeId,
  settings,
  onUpdate,
}: {
  nodeId: string;
  settings: NodeSettings;
  onUpdate: (settings: NodeSettings) => void;
}) {
  const addInput = () => {
    const newInput: NodeIO = {
      id: `input-${Date.now()}`,
      label: 'New Input',
      direction: 'left',
      type: 'input',
    };
    onUpdate({ ...settings, inputs: [...settings.inputs, newInput] });
  };

  const addOutput = () => {
    const newOutput: NodeIO = {
      id: `output-${Date.now()}`,
      label: 'New Output',
      direction: 'right',
      type: 'output',
    };
    onUpdate({ ...settings, outputs: [...settings.outputs, newOutput] });
  };

  const updateIO = (id: string, field: keyof NodeIO, value: string) => {
    const updateList = (list: NodeIO[]) =>
      list.map((io) => (io.id === id ? { ...io, [field]: value } : io));

    onUpdate({
      ...settings,
      inputs: updateList(settings.inputs),
      outputs: updateList(settings.outputs),
    });
  };

  const removeIO = (id: string) => {
    onUpdate({
      ...settings,
      inputs: settings.inputs.filter((io) => io.id !== id),
      outputs: settings.outputs.filter((io) => io.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Name and Description Section */}
      <div className="bg-[#222222] border border-white/10 rounded-none p-4">
        <h3 className="text-white font-mono font-bold mb-4">Node Information</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-gray-400 font-mono mb-1 block">Name</Label>
            <Input
              value={settings.name || ''}
              onChange={(e) => onUpdate({ ...settings, name: e.target.value })}
              placeholder="Enter node name..."
              className="rounded-none bg-[#1a1a1a] border-white/10 text-white font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 font-mono mb-1 block">Description</Label>
            <Input
              value={settings.description || ''}
              onChange={(e) => onUpdate({ ...settings, description: e.target.value })}
              placeholder="Enter node description..."
              className="rounded-none bg-[#1a1a1a] border-white/10 text-white font-mono"
            />
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              This will appear below the node name in very small text
            </p>
          </div>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="bg-[#222222] border border-white/10 rounded-none p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-mono font-bold">Node Inputs</h3>
          <Button
            size="sm"
            onClick={addInput}
            className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono"
          >
            <Plus className="h-4 w-4" />
            Add Input
          </Button>
        </div>
        
        <div className="space-y-3">
          {settings.inputs.length === 0 ? (
            <p className="text-sm text-gray-400 font-mono text-center py-4">
              No inputs defined. Click &quot;Add Input&quot; to create one.
            </p>
          ) : (
            settings.inputs.map((input) => (
              <div key={input.id} className="flex items-center gap-3 bg-[#1a1a1a] p-3 border border-white/10 rounded-none">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-1 block">Label</Label>
                    <Input
                      value={input.label}
                      onChange={(e) => updateIO(input.id, 'label', e.target.value)}
                      className="rounded-none bg-[#222222] border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-1 block">Direction</Label>
                    <Select value={input.direction} onValueChange={(value) => updateIO(input.id, 'direction', value)}>
                      <SelectTrigger className="rounded-none bg-[#222222] border-white/10 text-white font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#222222] border-white/10">
                        <SelectItem value="up" className="font-mono">Up</SelectItem>
                        <SelectItem value="down" className="font-mono">Down</SelectItem>
                        <SelectItem value="left" className="font-mono">Left</SelectItem>
                        <SelectItem value="right" className="font-mono">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeIO(input.id)}
                  className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Outputs Section */}
      <div className="bg-[#222222] border border-white/10 rounded-none p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-mono font-bold">Node Outputs</h3>
          <Button
            size="sm"
            onClick={addOutput}
            className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono"
          >
            <Plus className="h-4 w-4" />
            Add Output
          </Button>
        </div>
        
        <div className="space-y-3">
          {settings.outputs.length === 0 ? (
            <p className="text-sm text-gray-400 font-mono text-center py-4">
              No outputs defined. Click &quot;Add Output&quot; to create one.
            </p>
          ) : (
            settings.outputs.map((output) => (
              <div key={output.id} className="flex items-center gap-3 bg-[#1a1a1a] p-3 border border-white/10 rounded-none">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-1 block">Label</Label>
                    <Input
                      value={output.label}
                      onChange={(e) => updateIO(output.id, 'label', e.target.value)}
                      className="rounded-none bg-[#222222] border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-1 block">Direction</Label>
                    <Select value={output.direction} onValueChange={(value) => updateIO(output.id, 'direction', value)}>
                      <SelectTrigger className="rounded-none bg-[#222222] border-white/10 text-white font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#222222] border-white/10">
                        <SelectItem value="up" className="font-mono">Up</SelectItem>
                        <SelectItem value="down" className="font-mono">Down</SelectItem>
                        <SelectItem value="left" className="font-mono">Left</SelectItem>
                        <SelectItem value="right" className="font-mono">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeIO(output.id)}
                  className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Linked Requirements Tab Component
function LinkedRequirementsTab({
  nodeId,
  linkedRequirements,
  onUpdate,
}: {
  nodeId: string;
  linkedRequirements: string[];
  onUpdate: (requirements: string[]) => void;
}) {
  const [newRequirement, setNewRequirement] = useState('');

  const addRequirement = () => {
    if (newRequirement.trim()) {
      onUpdate([...linkedRequirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    onUpdate(linkedRequirements.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#222222] border border-white/10 rounded-none p-4">
        <h3 className="text-white font-mono font-bold mb-4">Linked Requirements</h3>
        
        {/* Add Requirement */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addRequirement();
              }
            }}
            placeholder="Enter requirement ID or name..."
            className="rounded-none bg-[#1a1a1a] border-white/10 text-white font-mono"
          />
          <Button
            onClick={addRequirement}
            className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Requirements List */}
        <div className="space-y-2">
          {linkedRequirements.length === 0 ? (
            <p className="text-sm text-gray-400 font-mono text-center py-4">
              No requirements linked. Add a requirement to get started.
            </p>
          ) : (
            linkedRequirements.map((req, index) => (
              <div key={index} className="flex items-center justify-between bg-[#1a1a1a] p-3 border border-white/10 rounded-none">
                <span className="text-white font-mono text-sm">{req}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeRequirement(index)}
                  className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-[#222222] border border-white/10 rounded-none p-4">
        <p className="text-xs text-gray-400 font-mono">
          <span className="text-gray-300">Info:</span> Link requirements to this node to track dependencies and relationships between workflow nodes and project requirements.
        </p>
      </div>
    </div>
  );
}

export function OperationalFlow({ projectId, projectName }: OperationalFlowProps) {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nestedDiagrams, setNestedDiagrams] = useState<Record<string, NestedDiagram>>({});
  const [nodeSettings, setNodeSettings] = useState<Record<string, NodeSettings>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDiagramPath, setSelectedDiagramPath] = useState<string[]>([]);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isEditDiagramDialogOpen, setIsEditDiagramDialogOpen] = useState(false);
  const [editingDiagramId, setEditingDiagramId] = useState<string | null>(null);
  const [diagramSearchQuery, setDiagramSearchQuery] = useState('');
  const [selectedComponentsOnly, setSelectedComponentsOnly] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [nodeDialogTab, setNodeDialogTab] = useState('settings');
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);
  const [isEdgeLabelDialogOpen, setIsEdgeLabelDialogOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [generatedDiagrams, setGeneratedDiagrams] = useState<GeneratedDiagram[]>([]);
  const [draftDiagramTitle, setDraftDiagramTitle] = useState('Workflow Export');
  const [draftDiagramDescription, setDraftDiagramDescription] = useState('');
  const [isSavingToServer, setIsSavingToServer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDiagramManagerOpen, setIsDiagramManagerOpen] = useState(false);
  const [selectedDiagramCardId, setSelectedDiagramCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeMember = user?.id || user?.email || 'Current Member';
  const currentNestedLevel = selectedDiagramPath.length + 1;
  const currentNestedPathKey = toPathKey(selectedDiagramPath);
  const projectDiagramStoreKey = useMemo(
    () => `${DIAGRAM_STORE_KEY}:${projectId || 'unassigned-project'}`,
    [projectId]
  );

  const serializeDiagramContent = useCallback((snapshotNodes: Node[], snapshotEdges: Edge[]) => {
    let diagramText = '=== WORKFLOW DIAGRAM ===\n\n';
    diagramText += `Nodes (${snapshotNodes.length}):\n`;
    snapshotNodes.forEach((node, idx) => {
      const label = typeof node.data?.label === 'string' ? node.data.label : 'Node';
      diagramText += `${idx + 1}. ${label} (ID: ${node.id})\n`;
    });
    diagramText += `\nConnections (${snapshotEdges.length}):\n`;
    snapshotEdges.forEach((edge, idx) => {
      const sourceNode = snapshotNodes.find((n) => n.id === edge.source);
      const targetNode = snapshotNodes.find((n) => n.id === edge.target);
      const sourceLabel = typeof sourceNode?.data?.label === 'string' ? sourceNode.data.label : edge.source;
      const targetLabel = typeof targetNode?.data?.label === 'string' ? targetNode.data.label : edge.target;
      diagramText += `${idx + 1}. ${sourceLabel} -> ${targetLabel}\n`;
    });
    return diagramText;
  }, []);

  const saveCurrentDiagram = useCallback(
    (options?: { title?: string; description?: string; auto?: boolean }) => {
      const now = new Date().toISOString();
      const title = (options?.title || draftDiagramTitle || 'Workflow Export').trim();
      const description = (options?.description || draftDiagramDescription || '').trim();
      const content = serializeDiagramContent(nodes, edges);
      const newDiagram: GeneratedDiagram = {
        id: `diagram-${Date.now()}`,
        title,
        description,
        generatedAt: now,
        updatedAt: now,
        updatedBy: activeMember,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        content,
        thumbnail: buildDiagramThumbnail(title, nodes.length, edges.length),
        metadata: {},
        editHistory: [
          {
            at: now,
            by: activeMember,
            summary: options?.auto ? 'Auto-saved before loading another diagram' : 'Saved diagram',
          },
        ],
        snapshot: {
          nodes,
          edges,
          nestedDiagrams,
          nodeSettings,
        },
      };
      setGeneratedDiagrams((prev) => [newDiagram, ...prev]);
      return newDiagram;
    },
    [draftDiagramDescription, draftDiagramTitle, edges, nestedDiagrams, nodeSettings, nodes, serializeDiagramContent]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      style: { stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: 2 },
      animated: false,
    }, eds)),
    []
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
      setSelectedEdges(selectedEdges.map((e) => e.id));
    },
    []
  );

  // Update node data with settings whenever settings change
  const updateNodeDataWithSettings = useCallback((nodeId: string, settings: NodeSettings) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, settings } }
          : node
      )
    );
  }, []);

  const addNode = (type: string) => {
    const newNodeId = `${nodes.length + 1}`;
    
    // Create default inputs and outputs for immediate connectivity
    const defaultSettings: NodeSettings = {
      inputs: [
        {
          id: `input-left-${Date.now()}`,
          label: 'Input',
          direction: 'left',
          type: 'input',
        }
      ],
      outputs: [
        {
          id: `output-right-${Date.now()}`,
          label: 'Output',
          direction: 'right',
          type: 'output',
        }
      ],
      linkedRequirements: [],
    };
    
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      data: { 
        label: `${type} ${nodes.length + 1}`,
        settings: defaultSettings,
      },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      style: {
        background: type === 'Process' ? '#222222' : type === 'Decision' ? '#2a2a2a' : '#1f1f1f',
        color: 'white',
        border: type === 'Process' ? '1px solid rgba(255, 255, 255, 0.2)' : type === 'Decision' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '0px',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10px 15px',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeSettings((prev) => ({ ...prev, [newNodeId]: defaultSettings }));
  };

  const addGroupingZone = () => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup: Node = {
      id: newGroupId,
      type: 'group',
      data: {
        label: 'Grouping Zone',
      },
      position: { x: 100, y: 100 },
      style: {
        width: 300,
        height: 200,
        zIndex: -1,
      },
      draggable: true,
      selectable: true,
    };
    
    setNodes((nds) => [...nds, newGroup]);
  };

  // Handle double click on a node to open nested diagram
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const newPath = [node.id];
    const pathKey = toPathKey(newPath);
    setSelectedNodeId(node.id);
    setSelectedDiagramPath(newPath);

    // Initialize nested diagram if it doesn't exist
    setNestedDiagrams((prev) => {
      if (!prev[pathKey]) {
        return {
          ...prev,
          [pathKey]: {
            nodes: [
              {
                id: `${pathKey}-1`,
                type: 'default',
                data: { label: 'Nested Start' },
                position: { x: 250, y: 50 },
                style: { 
                  background: '#222222', 
                  color: 'white', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                },
              },
            ],
            edges: [],
          },
        };
      }
      return prev;
    });

    // Initialize node settings if they don't exist
    setNodeSettings((prev) => {
      if (!prev[node.id]) {
        return {
          ...prev,
          [node.id]: {
            inputs: [],
            outputs: [],
            linkedRequirements: [],
          },
        };
      }
      return prev;
    });
    
    setNodeDialogTab('settings');
    setIsNodeDialogOpen(true);
  }, []);

  // Handle edge context menu (right-click)
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    });
  }, []);

  // Handle edge double-click to edit label
  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setEdgeLabel(typeof edge.label === 'string' ? edge.label : '');
    setIsEdgeLabelDialogOpen(true);
  }, []);

  // Delete edge from context menu
  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setEdgeContextMenu(null);
  }, []);

  // Update edge label
  const updateEdgeLabel = useCallback(() => {
    if (!selectedEdgeId) return;
    
    setEdges((eds) =>
      eds.map((e) =>
        e.id === selectedEdgeId
          ? { 
              ...e, 
              label: edgeLabel,
              labelStyle: { fill: 'white', fontFamily: 'monospace', fontSize: '11px' },
              labelBgStyle: { fill: '#222222', fillOpacity: 0.9 },
              labelBgPadding: [8, 4] as [number, number],
              labelBgBorderRadius: 0,
            }
          : e
      )
    );
    
    setIsEdgeLabelDialogOpen(false);
    setSelectedEdgeId(null);
    setEdgeLabel('');
  }, [selectedEdgeId, edgeLabel]);

  // Close context menu when clicking outside
  const handlePaneClick = useCallback(() => {
    setEdgeContextMenu(null);
  }, []);

  // Get the current nested diagram
  const currentNestedDiagram = currentNestedPathKey ? nestedDiagrams[currentNestedPathKey] : null;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Nested diagram handlers
  const onNestedNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!currentNestedPathKey) return;
      setNestedDiagrams((prev) => ({
        ...prev,
        [currentNestedPathKey]: {
          ...prev[currentNestedPathKey],
          nodes: applyNodeChanges(changes, prev[currentNestedPathKey]?.nodes || []),
        },
      }));
    },
    [currentNestedPathKey]
  );

  const onNestedEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!currentNestedPathKey) return;
      setNestedDiagrams((prev) => ({
        ...prev,
        [currentNestedPathKey]: {
          ...prev[currentNestedPathKey],
          edges: applyEdgeChanges(changes, prev[currentNestedPathKey]?.edges || []),
        },
      }));
    },
    [currentNestedPathKey]
  );

  const onNestedConnect = useCallback(
    (connection: Connection) => {
      if (!currentNestedPathKey) return;
      setNestedDiagrams((prev) => ({
        ...prev,
        [currentNestedPathKey]: {
          ...prev[currentNestedPathKey],
          edges: addEdge(connection, prev[currentNestedPathKey]?.edges || []),
        },
      }));
    },
    [currentNestedPathKey]
  );

  const addNestedNode = (type: string) => {
    if (!currentNestedPathKey || !currentNestedDiagram) return;
    
    const newNode: Node = {
      id: `${currentNestedPathKey}-${currentNestedDiagram.nodes.length + 1}`,
      type: 'default',
      data: { label: `${type} ${currentNestedDiagram.nodes.length + 1}` },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      style: {
        background: type === 'Process' ? '#222222' : type === 'Decision' ? '#2a2a2a' : '#1f1f1f',
        color: 'white',
        border: type === 'Process' ? '1px solid rgba(255, 255, 255, 0.2)' : type === 'Decision' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '0px',
        fontFamily: 'monospace',
        fontSize: '12px',
      },
    };
    
    setNestedDiagrams((prev) => ({
      ...prev,
      [currentNestedPathKey]: {
        ...prev[currentNestedPathKey],
        nodes: [...(prev[currentNestedPathKey]?.nodes || []), newNode],
      },
    }));
  };

  const onNestedNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (currentNestedLevel >= MAX_NESTED_LEVEL) {
        return;
      }
      const newPath = [...selectedDiagramPath, node.id];
      const newPathKey = toPathKey(newPath);
      setSelectedDiagramPath(newPath);
      setNestedDiagrams((prev) => {
        if (prev[newPathKey]) {
          return prev;
        }
        return {
          ...prev,
          [newPathKey]: {
            nodes: [
              {
                id: `${newPathKey}-1`,
                type: 'default',
                data: { label: 'Nested Start' },
                position: { x: 250, y: 50 },
                style: {
                  background: '#222222',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                },
              },
            ],
            edges: [],
          },
        };
      });
    },
    [currentNestedLevel, selectedDiagramPath]
  );

  const goBackNestedLevel = () => {
    if (selectedDiagramPath.length <= 1) {
      setIsNodeDialogOpen(false);
      setSelectedDiagramPath([]);
      return;
    }
    setSelectedDiagramPath((prev) => prev.slice(0, -1));
  };

  const handleSaveDiagram = async () => {
    await saveSnapshotDiagram('Manual save from generate dialog');
    setIsGenerateDialogOpen(false);
  };

  const importDiagramPackage = useCallback((rawText: string) => {
    const text = rawText.trim();
    if (!text) {
      return;
    }
    try {
      if (text.startsWith('<')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) {
          return;
        }
        const payload = doc.querySelector('payload')?.textContent || '';
        const parsed = JSON.parse(payload) as { generatedDiagrams?: GeneratedDiagram[] };
        if (Array.isArray(parsed.generatedDiagrams)) {
          setGeneratedDiagrams(parsed.generatedDiagrams);
        }
        return;
      }
      const parsed = JSON.parse(text) as { generatedDiagrams?: GeneratedDiagram[] };
      if (Array.isArray(parsed.generatedDiagrams)) {
        setGeneratedDiagrams(parsed.generatedDiagrams);
      }
    } catch {
      // ignore malformed imports
    }
  }, []);

  const buildSaveEventPackage = useCallback(
    (entry: GeneratedDiagram, allDiagrams: GeneratedDiagram[]) => {
      const payloadObject = {
        version: 1,
        projectId: projectId || '',
        projectName: projectName || '',
        latestDiagram: entry,
        generatedDiagrams: allDiagrams,
      };
      const jsonContent = JSON.stringify(payloadObject, null, 2);
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<operationalFlowDiagramSave version="1">\n  <payload><![CDATA[${toCDataSafe(JSON.stringify(payloadObject))}]]></payload>\n</operationalFlowDiagramSave>\n`;
      return { jsonContent, xmlContent };
    },
    [projectId, projectName]
  );

  const syncDiagramSaveToBackend = useCallback(
    async (entry: GeneratedDiagram, packagePayload: { jsonContent: string; xmlContent: string }) => {
      if (!projectId) {
        setSaveStatus({
          type: 'error',
          message: 'Project ID is missing. Select a project before saving.',
        });
        return;
      }

      setIsSavingToServer(true);
      try {
        const { status, data } = await saveDiagramEvent({
          projectId,
          memberId: activeMember,
          diagramName: entry.title || entry.name || 'Untitled Diagram',
          diagramDescription: entry.description || '',
          xmlContent: packagePayload.xmlContent,
          jsonContent: packagePayload.jsonContent,
        });

        if (status >= 200 && status < 300 && data?.success) {
          const serverDiagramId = data.diagramId ? ` ID: ${data.diagramId}` : '';
          setSaveStatus({
            type: 'success',
            message: `Diagram saved successfully.${serverDiagramId}`,
          });
          return;
        }

        const message = data?.message || `Failed to save diagram (HTTP ${status}).`;
        setSaveStatus({ type: 'error', message });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reach diagram service.';
        setSaveStatus({ type: 'error', message });
      } finally {
        setIsSavingToServer(false);
      }
    },
    [activeMember, projectId]
  );

  const saveSnapshotDiagram = async (summary = 'Manual save', options?: { syncRemote?: boolean }) => {
    const now = new Date().toISOString();
    const name = draftDiagramTitle.trim() || `Workflow Export ${generatedDiagrams.length + 1}`;
    const snapshot = cloneDiagramSnapshot({
      nodes,
      edges,
      nestedDiagrams,
      nodeSettings,
    });
    const entry: GeneratedDiagram = {
      id: `diagram-${Date.now()}`,
      name,
      title: name,
      description: draftDiagramDescription.trim(),
      generatedAt: now,
      updatedAt: now,
      updatedBy: activeMember,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      content: serializeDiagramContent(nodes, edges),
      thumbnail: buildDiagramThumbnail(name, nodes.length, edges.length),
      metadata: {},
      editHistory: [{ at: now, by: activeMember, summary }],
      snapshot,
    };
    const nextDiagrams = [entry, ...generatedDiagrams];
    const packagePayload = buildSaveEventPackage(entry, nextDiagrams);
    setGeneratedDiagrams(nextDiagrams);
    setSelectedDiagramCardId(entry.id);
    if (options?.syncRemote !== false) {
      await syncDiagramSaveToBackend(entry, packagePayload);
    }
    return entry;
  };

  const loadDiagram = (diagram: GeneratedDiagram) => {
    setSelectedDiagramCardId(diagram.id);
    if (!diagram.snapshot) {
      return;
    }
    const snapshot = cloneDiagramSnapshot(diagram.snapshot);
    setNodes(snapshot.nodes || []);
    setEdges(snapshot.edges || []);
    setNestedDiagrams(snapshot.nestedDiagrams || {});
    setNodeSettings(snapshot.nodeSettings || {});
  };

  const filteredGeneratedDiagrams = useMemo(() => {
    const query = diagramSearchQuery.trim().toLowerCase();
    if (!query) {
      return generatedDiagrams;
    }
    return generatedDiagrams.filter((diagram) => {
      const name = (diagram.title || diagram.name || '').toLowerCase();
      const description = (diagram.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [diagramSearchQuery, generatedDiagrams]);

  const selectedEditingDiagram = editingDiagramId
    ? generatedDiagrams.find((d) => d.id === editingDiagramId) || null
    : null;

  useEffect(() => {
    if (!isDiagramManagerOpen) {
      return;
    }
    if (!selectedDiagramCardId && filteredGeneratedDiagrams.length > 0) {
      setSelectedDiagramCardId(filteredGeneratedDiagrams[0].id);
      return;
    }
    if (selectedDiagramCardId && !filteredGeneratedDiagrams.some((diagram) => diagram.id === selectedDiagramCardId)) {
      setSelectedDiagramCardId(filteredGeneratedDiagrams[0]?.id || null);
    }
  }, [filteredGeneratedDiagrams, isDiagramManagerOpen, selectedDiagramCardId]);

  useEffect(() => {
    setGeneratedDiagrams([]);
    setDiagramSearchQuery('');
    const raw = localStorage.getItem(projectDiagramStoreKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { generatedDiagrams?: GeneratedDiagram[] };
      if (Array.isArray(parsed.generatedDiagrams)) {
        setGeneratedDiagrams(parsed.generatedDiagrams);
      }
    } catch {
      // ignore malformed cache
    }
  }, [projectDiagramStoreKey]);

  useEffect(() => {
    localStorage.setItem(projectDiagramStoreKey, JSON.stringify({ version: 1, generatedDiagrams }));
  }, [generatedDiagrams, projectDiagramStoreKey]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Film Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-white/10 p-3 flex items-center gap-2 relative z-20">
        <h1 className="text-xl font-serif text-white mr-4">Operational Flow</h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400 bg-[#222222] px-3 py-1.5 rounded-none border border-white/10 font-mono">
          <Maximize2 className="h-3 w-3" />
          <span>Double-click any block to open nested diagram</span>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 bg-[#1a1a1a] relative z-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          fitView
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onPaneClick={handlePaneClick}
          multiSelectionKeyCode="Control"
          selectionKeyCode="Control"
          panOnDrag={[1, 2]}
          selectionOnDrag
          selectNodesOnDrag={false}
        >
          <Background color="rgba(255, 255, 255, 0.05)" gap={16} />
          <Controls className="bg-[#222222] border-white/10 rounded-none" />
          <MiniMap
            nodeColor={(node) => {
              if (node.style?.background) {
                return node.style.background as string;
              }
              return '#222222';
            }}
            maskColor="rgba(26, 26, 26, 0.8)"
            className="bg-[#222222] border border-white/10 rounded-none"
          />
        </ReactFlow>

        {/* Right Toolbox */}
        <div className="absolute right-4 top-4 z-30 w-14 bg-[#222222]/95 border border-white/10 rounded-none p-2 flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            title="Add Process"
            onClick={() => addNode('Process')}
            className="h-9 w-9 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="Add Decision"
            onClick={() => addNode('Decision')}
            className="h-9 w-9 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5"
          >
            <Diamond className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="Add Event"
            onClick={() => addNode('Event')}
            className="h-9 w-9 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            title="Add Grouping Zone"
            onClick={addGroupingZone}
            className="h-9 w-9 rounded-none bg-white text-black hover:bg-gray-200"
          >
            <Box className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            title="Generate Diagram"
            onClick={() => setIsGenerateDialogOpen(true)}
            className="h-9 w-9 rounded-none bg-white text-black hover:bg-gray-200"
          >
            <FileImage className="h-4 w-4" />
          </Button>
          {isSavingToServer && (
            <p className="text-[10px] text-gray-400 font-mono text-center leading-tight">Saving...</p>
          )}
          {saveStatus && !isSavingToServer && (
            <p
              className={`text-[10px] font-mono text-center leading-tight ${
                saveStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
              title={saveStatus.message}
            >
              {saveStatus.type === 'success' ? 'Saved' : 'Error'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Diagram Manager Toggle */}
      <div className="bg-[#1a1a1a] border-t border-white/10 relative z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto p-3">
          <Button
            variant="outline"
            onClick={() => setIsDiagramManagerOpen((prev) => !prev)}
            className="w-full justify-between rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
          >
            <span>
              Generated Diagram Manager
              {projectName ? ` - ${projectName}` : ''} ({generatedDiagrams.length})
            </span>
            {isDiagramManagerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {!isDiagramManagerOpen && generatedDiagrams.length === 0 && (
            <p className="text-xs text-gray-500 font-mono mt-2 px-1">
              No saved diagrams for this project yet. Save a diagram to see it here.
            </p>
          )}
        </div>
      </div>

      <div
        className={`relative z-20 flex-shrink-0 overflow-hidden border-t border-white/10 transition-all duration-300 ease-out ${
          isDiagramManagerOpen ? 'max-h-[70vh] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-5 pointer-events-none'
        }`}
      >
        <div className="bg-[#1a1a1a] p-6 pt-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white font-mono">Generated Diagram Manager</h2>
                <p className="text-sm text-gray-400 font-mono mt-1">View and manage your exported workflow diagrams</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={diagramSearchQuery}
                  onChange={(e) => setDiagramSearchQuery(e.target.value)}
                  placeholder="Search diagrams..."
                  className="w-64 rounded-none bg-[#222222] border-white/10 text-white font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                >
                  <FolderOpen className="h-3 w-3" />
                  Load
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.xml,application/json,application/xml,text/xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      importDiagramPackage(String(reader.result || ''));
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="max-h-[42vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGeneratedDiagrams.map((diagram) => (
                  <div
                    key={diagram.id}
                    className={`rounded-none p-4 transition-all group cursor-pointer ${
                      selectedDiagramCardId === diagram.id
                        ? 'bg-[#2f2a1a] border border-amber-300/45 shadow-[0_0_0_1px_rgba(252,211,77,0.18)]'
                        : 'bg-[#222222] border border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedDiagramCardId(diagram.id)}
                  >
                    <div className="mb-3 border border-white/10 bg-black/20 overflow-hidden">
                      {diagram.thumbnail ? (
                        <img src={diagram.thumbnail} alt={diagram.title || diagram.name || 'Diagram thumbnail'} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="h-28 flex items-center justify-center text-xs text-gray-500 font-mono">
                          No thumbnail
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-mono font-bold text-sm">{diagram.title || diagram.name || 'Untitled diagram'}</h3>
                        {diagram.description && (
                          <p className="text-xs text-gray-400 font-mono mt-1 line-clamp-2">{diagram.description}</p>
                        )}
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {new Date(diagram.generatedAt).toLocaleDateString()} at {new Date(diagram.generatedAt).toLocaleTimeString()}
                        </p>
                        {(diagram.updatedAt || diagram.updatedBy) && (
                          <p className="text-[11px] text-gray-500 font-mono mt-1">
                            Latest edit: {diagram.updatedAt ? new Date(diagram.updatedAt).toLocaleString() : '-'} by {diagram.updatedBy || '-'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDiagramId(diagram.id);
                            setIsEditDiagramDialogOpen(true);
                          }}
                          className="text-black hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <FileImage className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-xs font-mono">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Square className="h-3 w-3" />
                        <span>{diagram.nodeCount} nodes</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>-&gt;</span>
                        <span>{diagram.edgeCount} edges</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadDiagram(diagram)}
                        className="flex-1 gap-2 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setGeneratedDiagrams((prev) => prev.filter((d) => d.id !== diagram.id));
                          if (selectedDiagramCardId === diagram.id) {
                            setSelectedDiagramCardId(null);
                          }
                        }}
                        className="gap-2 rounded-none border-white/10 text-black hover:text-red-300 hover:bg-red-950/20 font-mono"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {generatedDiagrams.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-600">
                    <FileImage className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                    <p className="font-mono text-sm">No saved diagrams for this project</p>
                    <p className="font-mono text-xs text-gray-500 mt-1">
                      Save a diagram to start building your project-specific history.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Nested Diagram Dialog */}
      {isNodeDialogOpen && selectedNode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsNodeDialogOpen(false);
              setSelectedDiagramPath([]);
            }}
          />
          
          {/* Dialog Content */}
          <div 
            className="relative z-10 max-w-6xl w-full h-[85vh] flex flex-col bg-[#1a1a1a] border border-white/10 rounded-none overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Film Grain Texture */}
            <div 
              className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Close Button */}
            <button
              onClick={() => {
                setIsNodeDialogOpen(false);
                setSelectedDiagramPath([]);
              }}
              className="absolute top-4 right-4 z-30 rounded-none opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden text-black hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="relative z-20 p-6 pb-4">
              <h2 className="flex items-center gap-2 text-white font-mono text-xl">
                <Maximize2 className="h-5 w-5 text-gray-400" />
                {selectedNode?.type === 'group' ? 'Group Settings: ' : 'Node Editor: '}{(selectedNode?.data?.name as string) || (selectedNode?.data?.label as string) || 'Untitled'}
              </h2>
              <p className="text-gray-400 font-mono text-sm mt-2">
                {selectedNode?.type === 'group' 
                  ? 'Configure grouping zone name.'
                  : 'Configure node settings, nested diagrams, and linked requirements.'}
              </p>
            </div>
            
            {/* Content for group nodes - simplified settings */}
            {selectedNode?.type === 'group' ? (
              <div className="relative z-20 p-6">
                <div className="bg-[#222222] border border-white/10 rounded-none p-4">
                  <h3 className="text-white font-mono font-bold mb-4">Group Information</h3>
                  <div>
                    <Label className="text-xs text-gray-400 font-mono mb-2 block">Name</Label>
                    <Input
                      value={(selectedNode.data?.name as string) || (selectedNode.data?.label as string) || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNodeId
                              ? { ...n, data: { ...n.data, name: e.target.value } }
                              : n
                          )
                        );
                      }}
                      placeholder="Enter group name..."
                      className="rounded-none bg-[#1a1a1a] border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Tabbed Content for regular nodes */
              <Tabs value={nodeDialogTab} onValueChange={setNodeDialogTab} className="flex-1 flex flex-col relative z-20 overflow-hidden">
                <TabsList className="w-full justify-start border-b border-white/10 rounded-none bg-[#222222] h-12">
                  <TabsTrigger value="settings" className="gap-2 font-mono data-[state=inactive]:text-black">
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="diagram" className="gap-2 font-mono data-[state=inactive]:text-black">
                    Nested Diagram [{currentNestedLevel}]
                    {currentNestedLevel >= MAX_NESTED_LEVEL ? ' (max)' : ''}
                  </TabsTrigger>
                  <TabsTrigger value="requirements" className="gap-2 font-mono data-[state=inactive]:text-black">
                    Linked Requirements
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Node Settings */}
                <TabsContent value="settings" className="flex-1 overflow-auto m-0 p-6">
                  <NodeSettingsTab 
                    nodeId={selectedNodeId!}
                    settings={nodeSettings[selectedNodeId!] || { inputs: [], outputs: [], linkedRequirements: [] }}
                    onUpdate={(settings) => {
                      setNodeSettings((prev) => ({ ...prev, [selectedNodeId!]: settings }));
                      updateNodeDataWithSettings(selectedNodeId!, settings);
                    }}
                  />
                </TabsContent>

                {/* Tab 2: Nested Diagram */}
                <TabsContent value="diagram" className="flex-1 overflow-hidden m-0 flex flex-col">
                  {currentNestedDiagram && (
                    <>
                      <div className="bg-[#222222] border-b border-white/10 p-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={goBackNestedLevel}
                          className="gap-2 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-300 mr-2 font-mono">
                          Nested Diagram [{currentNestedLevel}]{currentNestedLevel >= MAX_NESTED_LEVEL ? ' (max)' : ''}
                        </span>
                        <span className="text-sm text-gray-400 mr-2 font-mono">Add Node:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedNode('Process')}
                          className="gap-2 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                        >
                          <Square className="h-4 w-4" />
                          Process
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedNode('Decision')}
                          className="gap-2 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                        >
                          <Diamond className="h-4 w-4" />
                          Decision
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedNode('Event')}
                          className="gap-2 rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                        >
                          <Circle className="h-4 w-4" />
                          Event
                        </Button>
                      </div>

                      <div className="flex-1 bg-[#1a1a1a]">
                        <ReactFlow
                          nodes={currentNestedDiagram.nodes}
                          edges={currentNestedDiagram.edges}
                          onNodesChange={onNestedNodesChange}
                          onEdgesChange={onNestedEdgesChange}
                          onConnect={onNestedConnect}
                          onNodeDoubleClick={onNestedNodeDoubleClick}
                          fitView
                        >
                          <Background color="rgba(255, 255, 255, 0.05)" gap={16} />
                          <Controls className="bg-[#222222] border-white/10 rounded-none" />
                          <MiniMap
                            nodeColor={(node) => {
                              if (node.style?.background) {
                                return node.style.background as string;
                              }
              return '#222222';
                            }}
                            maskColor="rgba(26, 26, 26, 0.8)"
                            className="bg-[#222222] border border-white/10 rounded-none"
                          />
                        </ReactFlow>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Tab 3: Linked Requirements */}
                <TabsContent value="requirements" className="flex-1 overflow-auto m-0 p-6">
                  <LinkedRequirementsTab 
                    nodeId={selectedNodeId!}
                    linkedRequirements={nodeSettings[selectedNodeId!]?.linkedRequirements || []}
                    onUpdate={(requirements) => {
                      setNodeSettings((prev) => ({
                        ...prev,
                        [selectedNodeId!]: {
                          ...prev[selectedNodeId!],
                          linkedRequirements: requirements,
                        },
                      }));
                    }}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {/* Diagram Edit Dialog */}
      <Dialog open={isEditDiagramDialogOpen} onOpenChange={setIsEditDiagramDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#1a1a1a] border-white/10 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-white font-mono">Diagram Details</DialogTitle>
            <DialogDescription className="text-gray-400 font-mono">
              Edit title/description and review latest edits.
            </DialogDescription>
          </DialogHeader>
          {selectedEditingDiagram && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-400 font-mono">Title</Label>
                <Input
                  value={selectedEditingDiagram.title || selectedEditingDiagram.name || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGeneratedDiagrams((prev) =>
                      prev.map((d) =>
                        d.id === selectedEditingDiagram.id
                          ? {
                              ...d,
                              title: value,
                              name: value,
                              updatedAt: new Date().toISOString(),
                              updatedBy: activeMember,
                            }
                          : d
                      )
                    );
                  }}
                  className="rounded-none bg-[#222222] border-white/10 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-400 font-mono">Description</Label>
                <Input
                  value={selectedEditingDiagram.description || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGeneratedDiagrams((prev) =>
                      prev.map((d) =>
                        d.id === selectedEditingDiagram.id
                          ? {
                              ...d,
                              description: value,
                              updatedAt: new Date().toISOString(),
                              updatedBy: activeMember,
                            }
                          : d
                      )
                    );
                  }}
                  className="rounded-none bg-[#222222] border-white/10 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-400 font-mono">Edit History</Label>
                <div className="max-h-44 overflow-auto border border-white/10 bg-[#222222] p-3 space-y-2">
                  {(selectedEditingDiagram.editHistory || []).length === 0 ? (
                    <p className="text-xs text-gray-500 font-mono">No history yet.</p>
                  ) : (
                    (selectedEditingDiagram.editHistory || []).map((item, index) => (
                      <p key={`${item.at}-${index}`} className="text-xs text-gray-300 font-mono">
                        {new Date(item.at).toLocaleString()} • {item.by} • {item.summary}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Diagram Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="!fixed !left-1/2 !top-[45vh] !z-[10000] w-[min(96vw,1100px)] max-w-none max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-[#1a1a1a] border-white/10 rounded-none relative">
          {/* Film Grain Texture */}
          <div 
            className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          <DialogHeader className="relative z-20">
            <DialogTitle className="flex items-center gap-2 text-white font-mono text-xl">
              <FileImage className="h-5 w-5 text-gray-400" />
              Generate Diagram from Workflow
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-mono text-sm">
              Save diagram metadata and automatically sync JSON/XML payloads to backend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 relative z-20">
            <div className="bg-[#222222] border border-white/10 rounded-none p-4 space-y-3">
              <div>
                <Label className="text-xs text-gray-400 font-mono mb-1 block">Title</Label>
                <Input
                  value={draftDiagramTitle}
                  onChange={(e) => setDraftDiagramTitle(e.target.value)}
                  className="rounded-none bg-[#1a1a1a] border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 font-mono mb-1 block">Description</Label>
                <Input
                  value={draftDiagramDescription}
                  onChange={(e) => setDraftDiagramDescription(e.target.value)}
                  className="rounded-none bg-[#1a1a1a] border-white/10 text-white font-mono"
                />
              </div>
            </div>

            {/* Options */}
            <div className="bg-[#222222] border border-white/10 rounded-none p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="selected-only"
                  checked={selectedComponentsOnly}
                  onCheckedChange={(checked) => setSelectedComponentsOnly(checked as boolean)}
                  className="rounded-none border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label
                  htmlFor="selected-only"
                  className="text-sm font-mono text-gray-300 cursor-pointer"
                >
                  Selected components only
                  <span className="block text-xs text-gray-500 mt-1">
                    {selectedNodes.length > 0 || selectedEdges.length > 0
                      ? `${selectedNodes.length} node(s) and ${selectedEdges.length} edge(s) selected`
                      : 'No items selected - will export all nodes and edges'
                    }
                  </span>
                </Label>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-400 font-mono">
                  <span className="text-gray-300">Info:</span> The diagram will be exported as a text file containing all nodes and their connections.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsGenerateDialogOpen(false)}
                className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDiagram}
                className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono gap-2"
                variant="outline"
              >
                <Save className="h-4 w-4" />
                Save Diagram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edge Context Menu */}
      {edgeContextMenu && (
        <div
          className="absolute bg-[#222222] border border-white/10 rounded-none p-2 z-[9998]"
          style={{ left: edgeContextMenu.x, top: edgeContextMenu.y }}
        >
          <button
            className="flex items-center gap-2 text-sm font-mono text-black hover:text-white hover:bg-white/5 rounded-none p-2"
            onClick={() => deleteEdge(edgeContextMenu.edgeId)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Edge
          </button>
        </div>
      )}

      {/* Edge Label Dialog */}
      {isEdgeLabelDialogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsEdgeLabelDialogOpen(false)}
          />
          
          {/* Dialog Content */}
          <div 
            className="relative z-10 max-w-md w-full flex flex-col bg-[#1a1a1a] border border-white/10 rounded-none overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Film Grain Texture */}
            <div 
              className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Close Button */}
            <button
              onClick={() => setIsEdgeLabelDialogOpen(false)}
              className="absolute top-4 right-4 z-30 rounded-none opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden text-black hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="relative z-20 p-6 pb-4">
              <h2 className="flex items-center gap-2 text-white font-mono text-lg">
                Edit Edge Label
              </h2>
              <p className="text-gray-400 font-mono text-sm mt-2">
                Enter a label for this connection.
              </p>
            </div>
            
            {/* Content */}
            <div className="relative z-20 px-6 pb-6 space-y-4">
              <div>
                <Label className="text-xs text-gray-400 font-mono mb-2 block">Label Text</Label>
                <Input
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateEdgeLabel();
                    }
                  }}
                  placeholder="Enter edge label..."
                  className="rounded-none bg-[#222222] border-white/10 text-white font-mono"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEdgeLabelDialogOpen(false)}
                  className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateEdgeLabel}
                  className="rounded-none bg-white text-black hover:bg-gray-200 font-mono"
                >
                  Save Label
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



