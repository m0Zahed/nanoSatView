import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  MiniMap,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Square, Circle, Diamond, Maximize2, Download, FileImage } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Start' },
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
];

const initialEdges: Edge[] = [];

// Store nested diagrams for each node
interface NestedDiagram {
  nodes: Node[];
  edges: Edge[];
}

export function OperationalFlow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nestedDiagrams, setNestedDiagrams] = useState<Record<string, NestedDiagram>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isNestedDialogOpen, setIsNestedDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedComponentsOnly, setSelectedComponentsOnly] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
    },
    []
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'default',
      data: { 
        label: `${type} ${nodes.length + 1}`,
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
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Handle double click on a node to open nested diagram
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    
    // Initialize nested diagram if it doesn't exist
    if (!nestedDiagrams[node.id]) {
      setNestedDiagrams((prev) => ({
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
      }));
    }
    
    setIsNestedDialogOpen(true);
  }, [nestedDiagrams]);

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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          fitView
          onNodeDoubleClick={onNodeDoubleClick}
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

      {/* Nested Diagram Dialog */}
      {isNestedDialogOpen && selectedNode && currentNestedDiagram && (
        <Dialog open={isNestedDialogOpen} onOpenChange={setIsNestedDialogOpen}>
          <DialogContent className="max-w-6xl h-[80vh] flex flex-col bg-[#1a1a1a] border-white/10 rounded-none relative overflow-hidden">
            {/* Film Grain Texture */}
            <div 
              className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            <DialogHeader className="relative z-20">
              <DialogTitle className="flex items-center gap-2 text-white font-mono text-xl">
                <Maximize2 className="h-5 w-5 text-gray-400" />
                Nested Diagram: {selectedNode.data.label}
              </DialogTitle>
              <DialogDescription className="text-gray-400 font-mono">
                Add nodes and edges to the nested diagram.
              </DialogDescription>
            </DialogHeader>
            
            {/* Nested Toolbar */}
            <div className="bg-[#222222] border border-white/10 rounded-none p-3 flex items-center gap-2 relative z-20">
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

            {/* Nested Flow Canvas */}
            <div className="flex-1 bg-[#1a1a1a] rounded-none border border-white/10 overflow-hidden relative z-20">
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
          </DialogContent>
        </Dialog>
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
            <DialogTitle className="flex items-center gap-2 text-white font-serif text-xl">
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
                    {selectedNodes.length > 0 
                      ? `${selectedNodes.length} node(s) selected`
                      : 'No nodes selected - will export all nodes'}
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
    </div>
  );
}
