import { useState, useCallback, memo } from 'react';
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
import { Square, Diamond, Circle, Plus, Trash2, FileImage, Download, Maximize2, Box } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

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
  name: string;
  generatedAt: Date;
  nodeCount: number;
  edgeCount: number;
  content: string;
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
                  className="rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
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
                  className="rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
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
                  className="rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
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

export function OperationalFlow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nestedDiagrams, setNestedDiagrams] = useState<Record<string, NestedDiagram>>({});
  const [nodeSettings, setNodeSettings] = useState<Record<string, NodeSettings>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedComponentsOnly, setSelectedComponentsOnly] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [nodeDialogTab, setNodeDialogTab] = useState('settings');
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);
  const [isEdgeLabelDialogOpen, setIsEdgeLabelDialogOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [generatedDiagrams, setGeneratedDiagrams] = useState<GeneratedDiagram[]>([
    {
      id: '1',
      name: 'Initial Workflow Export',
      generatedAt: new Date('2025-01-20'),
      nodeCount: 5,
      edgeCount: 4,
      content: '=== WORKFLOW DIAGRAM ===\n\nNodes (5):\n1. Start\n2. Process Data\n3. Decision Point\n4. Transform\n5. End\n\nConnections (4):\n1. Start → Process Data\n2. Process Data → Decision Point\n3. Decision Point → Transform\n4. Transform → End'
    }
  ]);

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
    setSelectedNodeId(node.id);
    
    // Initialize nested diagram if it doesn't exist
    setNestedDiagrams((prev) => {
      if (!prev[node.id]) {
        return {
          ...prev,
          [node.id]: {
            nodes: [
              {
                id: `${node.id}-1`,
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
  const currentNestedDiagram = selectedNodeId ? nestedDiagrams[selectedNodeId] : null;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Nested diagram handlers
  const onNestedNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!selectedNodeId) return;
      setNestedDiagrams((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...prev[selectedNodeId],
          nodes: applyNodeChanges(changes, prev[selectedNodeId]?.nodes || []),
        },
      }));
    },
    [selectedNodeId]
  );

  const onNestedEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!selectedNodeId) return;
      setNestedDiagrams((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...prev[selectedNodeId],
          edges: applyEdgeChanges(changes, prev[selectedNodeId]?.edges || []),
        },
      }));
    },
    [selectedNodeId]
  );

  const onNestedConnect = useCallback(
    (connection: Connection) => {
      if (!selectedNodeId) return;
      setNestedDiagrams((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...prev[selectedNodeId],
          edges: addEdge(connection, prev[selectedNodeId]?.edges || []),
        },
      }));
    },
    [selectedNodeId]
  );

  const addNestedNode = (type: string) => {
    if (!selectedNodeId || !currentNestedDiagram) return;
    
    const newNode: Node = {
      id: `${selectedNodeId}-${currentNestedDiagram.nodes.length + 1}`,
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
      [selectedNodeId]: {
        ...prev[selectedNodeId],
        nodes: [...prev[selectedNodeId].nodes, newNode],
      },
    }));
  };

  const handleGenerateDiagram = () => {
    // Get nodes to export
    const nodesToExport = selectedComponentsOnly && selectedNodes.length > 0
      ? nodes.filter((n) => selectedNodes.includes(n.id))
      : nodes;

    // Get edges to export (only edges that connect exported nodes)
    const nodeIds = new Set(nodesToExport.map((n) => n.id));
    const edgesToExport = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    // Create a simple text representation
    let diagramText = '=== WORKFLOW DIAGRAM ===\n\n';
    diagramText += `Nodes (${nodesToExport.length}):\n`;
    nodesToExport.forEach((node, idx) => {
      diagramText += `${idx + 1}. ${node.data.label} (ID: ${node.id})\n`;
    });
    diagramText += `\nConnections (${edgesToExport.length}):\n`;
    edgesToExport.forEach((edge, idx) => {
      const sourceNode = nodesToExport.find((n) => n.id === edge.source);
      const targetNode = nodesToExport.find((n) => n.id === edge.target);
      diagramText += `${idx + 1}. ${sourceNode?.data.label} → ${targetNode?.data.label}\n`;
    });

    // Create a downloadable file
    const blob = new Blob([diagramText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-diagram.txt';
    a.click();
    URL.revokeObjectURL(url);

    // Add to generated diagrams
    const newDiagram: GeneratedDiagram = {
      id: `${generatedDiagrams.length + 1}`,
      name: `Workflow Export ${generatedDiagrams.length + 1}`,
      generatedAt: new Date(),
      nodeCount: nodesToExport.length,
      edgeCount: edgesToExport.length,
      content: diagramText,
    };
    setGeneratedDiagrams((prev) => [...prev, newDiagram]);

    setIsGenerateDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Film Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Toolbar */}
      <div className="bg-[#1a1a1a] border-b border-white/10 p-3 flex items-center gap-2 relative z-20">
        <h1 className="text-xl font-serif text-white mr-4">Operational Flow</h1>
        <span className="text-sm text-gray-400 mr-2 font-mono">Add Node:</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addNode('Process')}
          className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
        >
          <Square className="h-4 w-4" />
          Process
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addNode('Decision')}
          className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
        >
          <Diamond className="h-4 w-4" />
          Decision
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addNode('Event')}
          className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
        >
          <Circle className="h-4 w-4" />
          Event
        </Button>

        {/* Add Grouping Zone */}
        <div className="ml-4 border-l border-white/10 pl-4">
          <Button
            size="sm"
            onClick={addGroupingZone}
            className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono"
          >
            <Box className="h-4 w-4" />
            Add Grouping Zone
          </Button>
        </div>

        {/* Generate Diagram Button */}
        <div className="ml-4 border-l border-white/10 pl-4">
          <Button
            size="sm"
            onClick={() => setIsGenerateDialogOpen(true)}
            className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono"
          >
            <FileImage className="h-4 w-4" />
            Generate Diagram
          </Button>
        </div>
        
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
      </div>

      {/* Generated Diagram Manager Section */}
      <div className="bg-[#1a1a1a] border-t border-white/10 p-6 relative z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white font-mono">Generated Diagram Manager</h2>
              <p className="text-sm text-gray-400 font-mono mt-1">View and manage your exported workflow diagrams</p>
            </div>
          </div>

          {/* Diagrams List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedDiagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="bg-[#222222] border border-white/10 rounded-none p-4 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-mono font-bold text-sm">{diagram.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {diagram.generatedAt.toLocaleDateString()} at {diagram.generatedAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <FileImage className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs font-mono">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Square className="h-3 w-3" />
                    <span>{diagram.nodeCount} nodes</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span>→</span>
                    <span>{diagram.edgeCount} edges</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([diagram.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${diagram.name}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setGeneratedDiagrams((prev) => prev.filter((d) => d.id !== diagram.id));
                    }}
                    className="gap-2 rounded-none border-white/10 text-red-400 hover:text-red-300 hover:bg-red-950/20 font-mono"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {generatedDiagrams.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-600">
                <FileImage className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                <p className="font-mono text-sm">No diagrams generated yet</p>
                <p className="font-mono text-xs text-gray-500 mt-1">
                  Use the &quot;Generate Diagram&quot; button above to create your first export
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Diagram Dialog */}
      {isNodeDialogOpen && selectedNode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsNodeDialogOpen(false)}
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
              onClick={() => setIsNodeDialogOpen(false)}
              className="absolute top-4 right-4 z-30 rounded-none opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden text-gray-300 hover:text-white"
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
                  <TabsTrigger value="settings" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="diagram" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
                    Nested Diagram
                  </TabsTrigger>
                  <TabsTrigger value="requirements" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
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
                        <span className="text-sm text-gray-400 mr-2 font-mono">Add Node:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedNode('Process')}
                          className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
                        >
                          <Square className="h-4 w-4" />
                          Process
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedNode('Decision')}
                          className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
                        >
                          <Diamond className="h-4 w-4" />
                          Decision
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedNode('Event')}
                          className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
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

      {/* Generate Diagram Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-xl bg-[#1a1a1a] border-white/10 rounded-none relative overflow-hidden">
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
              Export your workflow diagram as a text file or image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 relative z-20">
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
                className="rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateDiagram}
                className="rounded-none bg-white text-black hover:bg-gray-200 font-mono gap-2"
              >
                <Download className="h-4 w-4" />
                Generate & Download
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
            className="flex items-center gap-2 text-sm font-mono text-gray-300 hover:text-white hover:bg-white/5 rounded-none p-2"
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
              className="absolute top-4 right-4 z-30 rounded-none opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden text-gray-300 hover:text-white"
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
                  className="rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
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
