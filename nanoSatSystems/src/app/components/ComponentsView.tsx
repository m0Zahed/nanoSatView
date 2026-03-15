import { useEffect, useMemo, useRef, useState } from 'react';
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
  Activity,
  Clock3,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import type { ProjectRequirement } from '@/app/api/requirements';
import type {
  ComponentAuditEvent,
  ComponentBuilderBlob,
  ProjectComponent,
  ProjectComponentEditorPayload,
} from '@/app/api/components';

interface DocumentBlob {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const REMOTE_LAN_ENABLED = TRUTHY_VALUES.has(
  String((typeof import.meta !== 'undefined' && (import.meta as any).env?.TESTING_REMOTE_LAN) || '')
    .trim()
    .toLowerCase()
);
const IS_LOCALHOST_HOSTNAME =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const DEFAULT_COMPONENTS_API_BASE = REMOTE_LAN_ENABLED
  ? `http://${window.location.hostname}:8090`
  : IS_LOCALHOST_HOSTNAME
    ? 'http://127.0.0.1:8090'
    : '/api/components';
const COMPONENTS_API_BASE =
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COMPONENTS_API_BASE_URL) as string | undefined)
    ?.replace(/\/+$/, '') || DEFAULT_COMPONENTS_API_BASE;

interface ComponentDraftState {
  name: string;
  type: string;
  quantity: number;
  notes: string;
  requirementIds: string[];
}

interface ComponentsViewProps {
  projectName: string;
  components: ProjectComponent[];
  componentsLoading?: boolean;
  componentsError?: string | null;
  requirements?: ProjectRequirement[];
  requirementsLoading?: boolean;
  requirementsError?: string | null;
  componentEvents?: ComponentAuditEvent[];
  componentEventsLoading?: boolean;
  onAddComponent: (component: ProjectComponentEditorPayload) => Promise<boolean>;
  onUpdateComponent: (componentId: string, component: ProjectComponentEditorPayload) => Promise<boolean>;
  onRemoveComponent: (componentId: string) => Promise<boolean>;
}

function createDefaultBuilderStack(): ComponentBuilderBlob[] {
  return [
    {
      id: 'seed-text-1',
      type: 'text',
      title: 'Mission Context',
      content: 'Summarize mission context and scope before detailed component references.',
    },
    {
      id: 'seed-diagram-1',
      type: 'diagram',
      title: 'System Architecture Diagram',
      content: 'Attach latest system architecture diagram snapshot.',
    },
  ];
}

function buildRequirementBlob(requirement: ProjectRequirement): ComponentBuilderBlob {
  return {
    id: `requirement-${requirement.id}`,
    type: 'requirement',
    title: requirement.reqId,
    content: [
      requirement.description,
      `Subsystem: ${requirement.subsystem}`,
      `Tags: ${requirement.tags.length > 0 ? requirement.tags.join(', ') : 'None'}`,
      `Assigned Components: ${
        requirement.assignedComponents.length > 0 ? requirement.assignedComponents.join(', ') : 'None'
      }`,
    ].join('\n'),
    sourceId: requirement.id,
  };
}

function buildMarkdownPreview(
  projectName: string,
  component: Pick<ProjectComponentEditorPayload, 'name' | 'type' | 'quantity' | 'notes'> | null,
  linkedRequirements: ProjectRequirement[],
  builderStack: ComponentBuilderBlob[]
) {
  if (!component) {
    return '# Component Documentation\n\nNo component selected.\n';
  }

  return [
    `# ${projectName} Component Draft`,
    '',
    '## Component Summary',
    `- Name: ${component.name || 'Untitled Component'}`,
    `- Type: ${component.type || 'Unknown'}`,
    `- Quantity: ${component.quantity || 1}`,
    `- Notes: ${component.notes?.trim() || 'N/A'}`,
    '',
    '## Builder Stack',
    ...(builderStack.length === 0
      ? ['- No builder content selected.']
      : builderStack.flatMap((blob, index) => [
          `### ${index + 1}. [${blob.type.toUpperCase()}] ${blob.title}`,
          blob.content || '_No content_',
          '',
        ])),
    '## Linked Requirements',
    ...(linkedRequirements.length === 0
      ? ['- No linked requirements.']
      : linkedRequirements.map((requirement) => `- **${requirement.reqId}** ${requirement.description}`)),
    '',
    '## Draft Prompt',
    'Generate a systems-engineering document section from the stack above, preserving traceability.',
    '',
  ].join('\n');
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function ComponentsView({
  projectName,
  components,
  componentsLoading = false,
  componentsError = null,
  requirements = [],
  requirementsLoading = false,
  requirementsError = null,
  componentEvents = [],
  componentEventsLoading = false,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
}: ComponentsViewProps) {
  const [newComponent, setNewComponent] = useState<ComponentDraftState>({
    name: '',
    type: '',
    quantity: 1,
    notes: '',
    requirementIds: [],
  });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
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
  const [documents, setDocuments] = useState<DocumentBlob[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [builderStack, setBuilderStack] = useState<ComponentBuilderBlob[]>(createDefaultBuilderStack());
  const [linkedRequirementIds, setLinkedRequirementIds] = useState<string[]>([]);
  const [isBuilderDropActive, setIsBuilderDropActive] = useState(false);
  const [isGeneratingMarkdown, setIsGeneratingMarkdown] = useState(false);
  const [markdownDraft, setMarkdownDraft] = useState('# Component Documentation\n\nNo component selected.\n');
  const [persistStatus, setPersistStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [removingComponentId, setRemovingComponentId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  const filteredRequirements = useMemo(() => {
    const query = requirementsQuery.trim().toLowerCase();
    if (!query) {
      return requirements.slice(0, 20);
    }
    return requirements
      .filter(
        (req) =>
          req.reqId.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          req.subsystem.toLowerCase().includes(query) ||
          req.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          req.assignedComponents.some((component) => component.toLowerCase().includes(query))
      )
      .slice(0, 20);
  }, [requirements, requirementsQuery]);

  const selectedComponent = useMemo(
    () => components.find((component) => component.id === selectedComponentId) || null,
    [components, selectedComponentId]
  );

  const linkedRequirements = useMemo(() => {
    const linkedRequirementIdSet = new Set(linkedRequirementIds);
    return requirements.filter((requirement) => linkedRequirementIdSet.has(requirement.id));
  }, [linkedRequirementIds, requirements]);

  const requirementsForGeneration = useMemo(() => {
    if (linkedRequirements.length > 0) {
      return linkedRequirements;
    }
    return filteredRequirements.slice(0, 6);
  }, [filteredRequirements, linkedRequirements]);

  const activeRequirementSelection = useMemo(
    () => new Set(isAdding ? newComponent.requirementIds : linkedRequirementIds),
    [isAdding, linkedRequirementIds, newComponent.requirementIds]
  );

  useEffect(() => {
    if (components.length === 0) {
      setSelectedComponentId(null);
      return;
    }
    if (!selectedComponentId || !components.some((component) => component.id === selectedComponentId)) {
      setSelectedComponentId(components[0].id);
    }
  }, [components, selectedComponentId]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!selectedComponent) {
      setLinkedRequirementIds([]);
      setBuilderStack(createDefaultBuilderStack());
      setMarkdownDraft('# Component Documentation\n\nNo component selected.\n');
      setPersistStatus('idle');
      return;
    }

    const nextBuilderStack =
      selectedComponent.builderStack && selectedComponent.builderStack.length > 0
        ? selectedComponent.builderStack
        : createDefaultBuilderStack();
    const syncedRequirements = requirements.filter((requirement) =>
      (selectedComponent.requirementIds || []).includes(requirement.id)
    );
    setLinkedRequirementIds(selectedComponent.requirementIds || []);
    setBuilderStack(nextBuilderStack);
    setMarkdownDraft(
      selectedComponent.markdownDraft?.trim()
        ? selectedComponent.markdownDraft
        : buildMarkdownPreview(projectName, selectedComponent, syncedRequirements, nextBuilderStack)
    );
    setPersistStatus('idle');
  }, [projectName, requirements, selectedComponent]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const filteredDocs = useMemo(() => {
    const query = docsQuery.trim().toLowerCase();
    if (!query) {
      return documents;
    }
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.mimeType.toLowerCase().includes(query) ||
        doc.id.toLowerCase().includes(query)
    );
  }, [docsQuery, documents]);

  const refreshDocuments = async (query: string) => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const url = new URL('/api/v1/documents', COMPONENTS_API_BASE);
      if (query.trim()) {
        url.searchParams.set('query', query.trim());
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch documents (${response.status})`);
      }
      const payload = (await response.json()) as { documents?: DocumentBlob[] };
      setDocuments(payload.documents ?? []);
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Failed to fetch documents.');
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshDocuments(docsQuery);
    }, 250);
    return () => window.clearTimeout(id);
  }, [docsQuery]);

  const queuePersist = (
    nextState?: Partial<Pick<ProjectComponentEditorPayload, 'builderStack' | 'markdownDraft' | 'requirementIds'>>
  ) => {
    if (!selectedComponent) {
      return;
    }

    const payload: ProjectComponentEditorPayload = {
      name: selectedComponent.name,
      type: selectedComponent.type,
      quantity: selectedComponent.quantity,
      notes: selectedComponent.notes,
      requirementIds: nextState?.requirementIds ?? linkedRequirementIds,
      builderStack: nextState?.builderStack ?? builderStack,
      markdownDraft: nextState?.markdownDraft ?? markdownDraft,
    };

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        setPersistStatus('saving');
        const saved = await onUpdateComponent(selectedComponent.id, payload);
        setPersistStatus(saved ? 'saved' : 'error');
        if (saved) {
          window.setTimeout(() => {
            setPersistStatus((previous) => (previous === 'saved' ? 'idle' : previous));
          }, 1200);
        }
      })();
    }, 500);
  };

  const onUploadDocuments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${COMPONENTS_API_BASE}/api/v1/documents/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name} (${response.status})`);
        }
        const uploaded = (await response.json()) as DocumentBlob;
        setDocuments((prev) => [uploaded, ...prev.filter((doc) => doc.id !== uploaded.id)]);
      }
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Document upload failed.');
    } finally {
      setDocumentsLoading(false);
      event.target.value = '';
    }
  };

  const handleAddTextBlob = () => {
    if (!selectedComponent) {
      return;
    }

    const nextBuilderStack = [
      ...builderStack,
      {
        id: `text-${Date.now()}`,
        type: 'text',
        title: 'Free Text Blob',
        content: 'Add your component-specific engineering notes here.',
      },
    ];
    setBuilderStack(nextBuilderStack);
    queuePersist({ builderStack: nextBuilderStack });
  };

  const handleAddDiagramBlob = () => {
    if (!selectedComponent) {
      return;
    }

    const nextBuilderStack = [
      ...builderStack,
      {
        id: `diagram-${Date.now()}`,
        type: 'diagram',
        title: 'Diagram Blob',
        content: 'Reference a saved diagram artifact.',
      },
    ];
    setBuilderStack(nextBuilderStack);
    queuePersist({ builderStack: nextBuilderStack });
  };

  const handleRemoveBlob = (id: string) => {
    if (!selectedComponent) {
      return;
    }

    const nextBuilderStack = builderStack.filter((blob) => blob.id !== id);
    setBuilderStack(nextBuilderStack);
    queuePersist({ builderStack: nextBuilderStack });
  };

  const onDocumentDragStart = (event: React.DragEvent<HTMLDivElement>, doc: DocumentBlob) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        kind: 'document-card',
        id: doc.id,
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  };

  const onRequirementDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    requirement: ProjectRequirement
  ) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        kind: 'requirement-card',
        id: requirement.id,
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  };

  const toggleRequirementForActiveTarget = (requirement: ProjectRequirement) => {
    if (!selectedComponent && !isAdding) {
      setIsAdding(true);
    }

    if (isAdding || !selectedComponent) {
      setNewComponent((previous) => {
        const isSelected = previous.requirementIds.includes(requirement.id);
        return {
          ...previous,
          requirementIds: isSelected
            ? previous.requirementIds.filter((requirementId) => requirementId !== requirement.id)
            : [...previous.requirementIds, requirement.id],
        };
      });
      return;
    }

    const alreadyLinked = linkedRequirementIds.includes(requirement.id);
    const nextRequirementIds = alreadyLinked
      ? linkedRequirementIds.filter((requirementId) => requirementId !== requirement.id)
      : [...linkedRequirementIds, requirement.id];

    const alreadyHasBlob = builderStack.some(
      (blob) => blob.type === 'requirement' && blob.sourceId === requirement.id
    );
    const nextBuilderStack = alreadyLinked
      ? builderStack.filter((blob) => !(blob.type === 'requirement' && blob.sourceId === requirement.id))
      : alreadyHasBlob
        ? builderStack
        : [...builderStack, buildRequirementBlob(requirement)];

    setLinkedRequirementIds(nextRequirementIds);
    setBuilderStack(nextBuilderStack);
    queuePersist({
      requirementIds: nextRequirementIds,
      builderStack: nextBuilderStack,
    });
  };

  const onBuilderDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!selectedComponent) {
      return;
    }

    event.preventDefault();
    setIsBuilderDropActive(false);
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { kind?: string; id?: string };
      if (!parsed.id) {
        return;
      }

      if (parsed.kind === 'document-card') {
        const matchedDoc = documents.find((doc) => doc.id === parsed.id);
        if (!matchedDoc) {
          return;
        }
        const nextBuilderStack = [
          ...builderStack,
          {
            id: `document-${Date.now()}`,
            type: 'document',
            title: matchedDoc.name,
            content: `Doc ${matchedDoc.id} (${matchedDoc.mimeType}, ${matchedDoc.sizeBytes} bytes)`,
            sourceId: matchedDoc.id,
          },
        ];
        setBuilderStack(nextBuilderStack);
        queuePersist({ builderStack: nextBuilderStack });
        return;
      }

      if (parsed.kind === 'requirement-card') {
        const matchedRequirement = requirements.find((requirement) => requirement.id === parsed.id);
        if (!matchedRequirement) {
          return;
        }

        const nextRequirementIds = linkedRequirementIds.includes(matchedRequirement.id)
          ? linkedRequirementIds
          : [...linkedRequirementIds, matchedRequirement.id];
        const nextBuilderStack = [
          ...builderStack,
          {
            id: `requirement-${Date.now()}`,
            ...buildRequirementBlob(matchedRequirement),
          },
        ];
        setLinkedRequirementIds(nextRequirementIds);
        setBuilderStack(nextBuilderStack);
        queuePersist({
          requirementIds: nextRequirementIds,
          builderStack: nextBuilderStack,
        });
      }
    } catch {
      // Ignore malformed drag payload.
    }
  };

  const generateMarkdownFromStack = async () => {
    if (!selectedComponent) {
      return;
    }

    setIsGeneratingMarkdown(true);
    try {
      const response = await fetch(`${COMPONENTS_API_BASE}/api/v1/markdown/from-stack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          component: {
            id: selectedComponent.id,
            name: selectedComponent.name,
            type: selectedComponent.type,
            quantity: selectedComponent.quantity,
            notes: selectedComponent.notes,
          },
          requirements: requirementsForGeneration,
          stack: builderStack,
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { markdown?: string };
        if (payload.markdown && payload.markdown.trim()) {
          setMarkdownDraft(payload.markdown);
          queuePersist({ markdownDraft: payload.markdown });
          setActiveTab('markdown');
          return;
        }
      }
    } catch {
      // Fall through to local fallback.
    } finally {
      setIsGeneratingMarkdown(false);
    }

    const fallback = buildMarkdownPreview(projectName, selectedComponent, requirementsForGeneration, builderStack);
    setMarkdownDraft(fallback);
    queuePersist({ markdownDraft: fallback });
    setActiveTab('markdown');
  };

  const handleCreateComponent = async () => {
    const name = newComponent.name.trim();
    const type = newComponent.type.trim();
    if (!name || !type) {
      return;
    }

    const linkedDraftRequirements = requirements.filter((requirement) =>
      newComponent.requirementIds.includes(requirement.id)
    );
    const initialBuilderStack = [
      ...createDefaultBuilderStack(),
      ...linkedDraftRequirements.map((requirement) => buildRequirementBlob(requirement)),
    ];
    const payload: ProjectComponentEditorPayload = {
      name,
      type,
      quantity: newComponent.quantity || 1,
      notes: newComponent.notes.trim(),
      requirementIds: newComponent.requirementIds,
      builderStack: initialBuilderStack,
      markdownDraft: buildMarkdownPreview(
        projectName,
        {
          name,
          type,
          quantity: newComponent.quantity || 1,
          notes: newComponent.notes.trim(),
          requirementIds: newComponent.requirementIds,
          builderStack: initialBuilderStack,
          markdownDraft: '',
        },
        linkedDraftRequirements,
        initialBuilderStack
      ),
    };

    const saved = await onAddComponent(payload);
    if (!saved) {
      return;
    }

    setNewComponent({
      name: '',
      type: '',
      quantity: 1,
      notes: '',
      requirementIds: [],
    });
    setIsAdding(false);
    setSelectedComponentId(null);
  };

  const handleRemoveComponent = async (componentId: string) => {
    setRemovingComponentId(componentId);
    await onRemoveComponent(componentId);
    setRemovingComponentId(null);
  };

  const statusLabel =
    persistStatus === 'saving'
      ? 'Saving component...'
      : persistStatus === 'saved'
        ? 'Saved'
        : persistStatus === 'error'
          ? 'Save failed'
          : selectedComponent
            ? `Last edited by ${selectedComponent.lastEditedByName || selectedComponent.lastEditedBy}`
            : 'Select a component to edit';

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
                <p className="text-[11px] text-gray-500 font-mono mt-2">{statusLabel}</p>
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
                {componentsLoading ? (
                  <div className="text-sm text-gray-400 font-mono border border-white/10 bg-white/5 p-3">
                    Loading components...
                  </div>
                ) : null}
                {componentsError ? (
                  <div className="text-sm text-red-400 font-mono border border-red-400/20 bg-red-500/5 p-3">
                    {componentsError}
                  </div>
                ) : null}
                {!componentsLoading && components.length === 0 ? (
                  <div className="text-sm text-gray-400 font-mono border border-white/10 bg-white/5 p-3">
                    No components yet. Add one to start linking requirements and saving builder state.
                  </div>
                ) : (
                  components.map((component, index) => (
                    <button
                      key={component.id}
                      onClick={() => {
                        setSelectedComponentId(component.id);
                        setIsAdding(false);
                      }}
                      className={`w-full text-left px-3 py-2 border font-mono text-sm transition-colors ${
                        selectedComponentId === component.id
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
                              void handleRemoveComponent(component.id);
                            }}
                            className="text-gray-500 hover:text-red-300 transition-colors"
                            aria-label={`Remove component ${index + 1}`}
                            disabled={removingComponentId === component.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{component.name || 'Untitled'}</div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        {component.lastEditedByName || component.lastEditedBy} · {formatTimestamp(component.updatedAt)}
                      </div>
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
                        setNewComponent({ ...newComponent, quantity: parseInt(e.target.value, 10) || 1 })
                      }
                      className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono w-20"
                    />
                    <Input
                      placeholder="Notes"
                      value={newComponent.notes}
                      onChange={(e) => setNewComponent({ ...newComponent, notes: e.target.value })}
                      className="bg-[#0f0f12] border-white/10 text-white rounded-none font-mono"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-mono mb-2">Clicked requirements</p>
                    <div className="flex flex-wrap gap-2 min-h-8">
                      {newComponent.requirementIds.length === 0 ? (
                        <span className="text-[11px] text-gray-500 font-mono">
                          Click requirement cards to stage links on creation.
                        </span>
                      ) : (
                        newComponent.requirementIds.map((requirementId) => {
                          const matchedRequirement = requirements.find((requirement) => requirement.id === requirementId);
                          return (
                            <Badge key={requirementId} variant="secondary" className="rounded-none">
                              {matchedRequirement?.reqId || requirementId}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void handleCreateComponent()}
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
                          requirementIds: [],
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
                  Scoped to {selectedComponent ? selectedComponent.name : isAdding ? 'new component draft' : 'no component'}
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
                    Searches the full project requirement set. Click to link requirements, or drag cards into the builder canvas.
                  </div>
                  {requirementsLoading ? (
                    <div className="text-xs text-gray-500 font-mono">Loading requirements...</div>
                  ) : null}
                  {requirementsError ? (
                    <div className="text-xs text-red-400 font-mono">{requirementsError}</div>
                  ) : null}
                  <div className="border border-white/10 bg-black/20 max-h-60 overflow-auto">
                    {!requirementsLoading && filteredRequirements.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 font-mono">No matching requirements</div>
                    ) : (
                      filteredRequirements.map((requirement) => {
                        const isLinked = activeRequirementSelection.has(requirement.id);
                        return (
                          <div
                            key={requirement.id}
                            draggable
                            onDragStart={(event) => onRequirementDragStart(event, requirement)}
                            onClick={() => toggleRequirementForActiveTarget(requirement)}
                            className={`p-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 cursor-pointer ${
                              isLinked ? 'bg-white/10 border-l-2 border-l-white/70' : ''
                            }`}
                            data-testid={`requirement-card-${requirement.id}`}
                          >
                            <p className="text-xs text-gray-400 font-mono">{requirement.reqId}</p>
                            <p className="text-xs text-gray-400 font-mono mt-1 line-clamp-2">
                              {requirement.description}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono mt-1">
                              {requirement.subsystem}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono mt-1">
                              Tags: {requirement.tags.length > 0 ? requirement.tags.join(', ') : 'None'}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono mt-1">
                              Assigned: {requirement.assignedComponents.length > 0 ? requirement.assignedComponents.join(', ') : 'None'}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono mt-1">
                              {isLinked ? 'Linked to active component' : 'Click to link or drag into Document Builder canvas'}
                            </p>
                          </div>
                        );
                      })
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
                  <input
                    type="file"
                    multiple
                    className="text-xs font-mono text-gray-300 file:mr-2 file:border file:border-white/20 file:bg-[#0f0f12] file:text-gray-200 file:px-2 file:py-1 file:rounded-none"
                    onChange={onUploadDocuments}
                    data-testid="doc-upload-input"
                  />
                  {documentsLoading ? (
                    <div className="text-xs text-gray-500 font-mono">Loading documents...</div>
                  ) : null}
                  {documentsError ? (
                    <div className="text-xs text-red-400 font-mono">{documentsError}</div>
                  ) : null}
                  <div className="border border-white/10 bg-black/20 max-h-52 overflow-auto" data-testid="docs-cards">
                    {filteredDocs.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 font-mono">No docs found.</div>
                    ) : (
                      filteredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          draggable
                          onDragStart={(event) => onDocumentDragStart(event, doc)}
                          className="p-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 cursor-grab active:cursor-grabbing"
                          data-testid={`doc-card-${doc.id}`}
                        >
                          <p className="text-sm text-white font-mono">{doc.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono mt-1">{doc.mimeType}</p>
                          <p className="text-[11px] text-gray-500 font-mono mt-1">Drag into Document Builder canvas</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="p-4 bg-[#151518] border-white/10 rounded-none space-y-3">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <Activity className="h-4 w-4 text-gray-400" />
                    Live Component Activity
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Recent edits refresh from the backend and are also forwarded to Kafka monitoring.
                  </div>
                  {componentEventsLoading ? (
                    <p className="text-xs text-gray-500 font-mono">Loading activity...</p>
                  ) : componentEvents.length === 0 ? (
                    <p className="text-xs text-gray-500 font-mono">No component activity yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {componentEvents.slice(0, 8).map((event) => (
                        <div key={event.id} className="border border-white/10 bg-black/20 p-2">
                          <p className="text-xs text-white font-mono">
                            {event.editorName || event.editorId} {event.action} {event.componentName}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono mt-1">{formatTimestamp(event.eventTime)}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
            Persisted component drafts with linked requirements, document-builder state, and live edit activity.
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
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="text-xs text-gray-400 font-mono">Document canvas</div>
                      {selectedComponent ? (
                        <div className="text-[11px] text-gray-500 font-mono">
                          {selectedComponent.name} · {formatTimestamp(selectedComponent.updatedAt)}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={`space-y-3 text-sm font-mono min-h-[220px] border border-dashed p-3 transition-colors ${
                        isBuilderDropActive ? 'border-white/60 bg-white/5' : 'border-white/10 bg-black/20'
                      }`}
                      onDragOver={(event) => {
                        if (!selectedComponent) {
                          return;
                        }
                        event.preventDefault();
                        setIsBuilderDropActive(true);
                      }}
                      onDragLeave={() => setIsBuilderDropActive(false)}
                      onDrop={onBuilderDrop}
                      data-testid="builder-drop-zone"
                    >
                      {!selectedComponent ? (
                        <div className="text-xs text-gray-500">
                          Select or create a component before building its document stack.
                        </div>
                      ) : builderStack.length === 0 ? (
                        <div className="text-xs text-gray-500">
                          Drop document or requirement cards here to build your stack.
                        </div>
                      ) : (
                        builderStack.map((blob, index) => (
                          <div
                            key={blob.id}
                            className="border border-white/10 bg-black/30 p-3"
                            data-testid={`builder-blob-${index}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">{blob.type}</p>
                                <p className="text-sm text-white">{blob.title}</p>
                                <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{blob.content}</p>
                              </div>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-red-300"
                                onClick={() => handleRemoveBlob(blob.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                    <div className="text-xs text-gray-400 font-mono">Final prompt</div>
                    <div className="text-sm font-mono text-gray-300 mt-2">
                      Prompts synthesize selected content into structured text ready for export.
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs"
                        onClick={() => void generateMarkdownFromStack()}
                        disabled={isGeneratingMarkdown || !selectedComponent}
                      >
                        {isGeneratingMarkdown ? 'Generating...' : 'Generate Markdown from Stack'}
                      </Button>
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
                    <Button
                      className="w-full bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs"
                      onClick={handleAddTextBlob}
                      disabled={!selectedComponent}
                    >
                      Add text
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-gray-300 hover:text-white rounded-none font-mono text-xs"
                      onClick={handleAddDiagramBlob}
                      disabled={!selectedComponent}
                    >
                      Add diagram
                    </Button>
                    <div className="border border-white/10 bg-black/20 p-3">
                      <p className="text-[11px] text-gray-500 font-mono">Linked requirements</p>
                      <div className="flex flex-wrap gap-2 mt-2 min-h-6">
                        {linkedRequirements.length === 0 ? (
                          <span className="text-[11px] text-gray-500 font-mono">None linked yet.</span>
                        ) : (
                          linkedRequirements.map((requirement) => (
                            <Badge key={requirement.id} variant="secondary" className="rounded-none">
                              {requirement.reqId}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : activeTab === 'markdown' ? (
            <div className="p-6 space-y-4">
              <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-xs text-gray-400 font-mono">Generated markdown (editable)</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    {selectedComponent ? `Persisted to ${selectedComponent.name}` : 'No component selected'}
                  </div>
                </div>
                <Textarea
                  value={markdownDraft}
                  onChange={(e) => {
                    const nextMarkdown = e.target.value;
                    setMarkdownDraft(nextMarkdown);
                    if (selectedComponent) {
                      queuePersist({ markdownDraft: nextMarkdown });
                    }
                  }}
                  disabled={!selectedComponent}
                  className="min-h-[520px] bg-[#0f0f12] border-white/10 text-white rounded-none font-mono text-xs"
                />
              </Card>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <Card className="p-5 bg-[#151518] border-white/10 rounded-none">
                <div className="text-xs text-gray-400 font-mono mb-2">Selected component</div>
                {selectedComponent ? (
                  <div className="space-y-3 text-sm font-mono">
                    <p className="text-white">{selectedComponent.name || 'Untitled Component'}</p>
                    <p className="text-xs text-gray-400">Type: {selectedComponent.type || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Quantity: {selectedComponent.quantity || 1}</p>
                    <p className="text-xs text-gray-400">Notes: {selectedComponent.notes?.trim() || 'N/A'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock3 className="h-3 w-3" />
                      {selectedComponent.lastEditedByName || selectedComponent.lastEditedBy} ·{' '}
                      {formatTimestamp(selectedComponent.lastEditedAt)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Linked requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {linkedRequirements.length === 0 ? (
                          <span className="text-xs text-gray-500">None</span>
                        ) : (
                          linkedRequirements.map((requirement) => (
                            <Badge key={requirement.id} variant="secondary" className="rounded-none">
                              {requirement.reqId}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-mono">No component selected.</p>
                )}
              </Card>
              <Card className="p-4 bg-[#151518] border-white/10 rounded-none">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Activity className="h-4 w-4 text-gray-400" />
                  Kafka-backed Edit Activity
                </div>
                <div className="text-xs text-gray-400 font-mono mt-2">
                  Component saves publish editor updates through the monitoring pipeline and refresh across users.
                </div>
                <div className="mt-3 space-y-2">
                  {componentEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="border border-white/10 bg-black/20 p-2">
                      <p className="text-xs text-white font-mono">
                        {event.editorName || event.editorId} {event.action} {event.componentName}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-1">{formatTimestamp(event.eventTime)}</p>
                    </div>
                  ))}
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
