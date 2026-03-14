import { useMemo, useRef, useState } from 'react';
import { Check, FileText, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import type { ProjectRequirement, RequirementPayload } from '@/app/api/requirements';

interface RequirementDraft {
  reqId: string;
  description: string;
  subsystem: string;
  tags: string[];
}

interface ValidationIssue {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  validRows: RequirementPayload[];
  issues: ValidationIssue[];
}

interface RequirementsViewProps {
  projectName: string;
  projectId?: string;
  requirements: ProjectRequirement[];
  requirementsLoading?: boolean;
  requirementsError?: string | null;
  onAddRequirement: (requirement: RequirementPayload) => Promise<boolean>;
  onRemoveRequirement: (requirementId: string) => Promise<boolean>;
}

function normalizeStringArray(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry, index, items) => items.findIndex((candidate) => candidate.toLowerCase() === entry.toLowerCase()) === index);
}

function validateGeneratedRequirements(payload: string, projectId: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return {
      validRows: [],
      issues: [{ row: 0, field: 'json', message: 'Invalid JSON. Expected an array of requirement objects.' }],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      validRows: [],
      issues: [{ row: 0, field: 'json', message: 'JSON root must be an array.' }],
    };
  }

  const validRows: RequirementPayload[] = [];

  parsed.forEach((entry, index) => {
    const row = index + 1;
    if (!entry || typeof entry !== 'object') {
      issues.push({ row, field: 'row', message: 'Each item must be an object.' });
      return;
    }

    const obj = entry as Record<string, unknown>;
    const reqId = String(obj.ReqId ?? obj.reqId ?? obj.RequirementId ?? obj.requirementId ?? '').trim();
    const description = String(obj.Description ?? obj.description ?? '').trim();
    const subsystem = String(obj.Subsystem ?? obj.subsystem ?? '').trim();
    const tagsSource = obj.Tags ?? obj.tags ?? [];
    const tags = Array.isArray(tagsSource)
      ? tagsSource.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
      : typeof tagsSource === 'string'
        ? normalizeStringArray(tagsSource)
        : [];

    if (!reqId) {
      issues.push({ row, field: 'ReqId', message: 'Required.' });
    } else if (reqId.length > 200) {
      issues.push({ row, field: 'ReqId', message: 'Max length is 200.' });
    }

    if (!description) {
      issues.push({ row, field: 'Description', message: 'Required.' });
    } else if (description.length > 4000) {
      issues.push({ row, field: 'Description', message: 'Max length is 4000.' });
    }

    if (!subsystem) {
      issues.push({ row, field: 'Subsystem', message: 'Required.' });
    } else if (subsystem.length > 200) {
      issues.push({ row, field: 'Subsystem', message: 'Max length is 200.' });
    }

    if (issues.some((issue) => issue.row === row)) {
      return;
    }

    validRows.push({
      reqId,
      description,
      subsystem,
      tags,
      projectId,
    });
  });

  return { validRows, issues };
}

export function RequirementsView({
  projectName,
  projectId,
  requirements,
  requirementsLoading = false,
  requirementsError = null,
  onAddRequirement,
  onRemoveRequirement,
}: RequirementsViewProps) {
  const fallbackProjectId = projectId || '00000000-0000-0000-0000-000000000000';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<RequirementDraft>({
    reqId: '',
    description: '',
    subsystem: 'General',
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingRequirement, setIsSavingRequirement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [extractorFiles, setExtractorFiles] = useState<File[]>([]);
  const [extractorReferences, setExtractorReferences] = useState<string[]>([]);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const [isExtractorDialogOpen, setIsExtractorDialogOpen] = useState(false);
  const [generatedJsonInput, setGeneratedJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isImportingRequirements, setIsImportingRequirements] = useState(false);
  const [removingRequirementId, setRemovingRequirementId] = useState<string | null>(null);

  const filteredRequirements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return requirements;
    }
    return requirements.filter((requirement) => {
      return (
        requirement.reqId.toLowerCase().includes(query) ||
        requirement.description.toLowerCase().includes(query) ||
        requirement.subsystem.toLowerCase().includes(query) ||
        requirement.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        requirement.assignedComponents.some((component) => component.toLowerCase().includes(query))
      );
    });
  }, [requirements, searchQuery]);

  const resetDraft = () => {
    setDraft({
      reqId: '',
      description: '',
      subsystem: 'General',
      tags: [],
    });
    setTagsInput('');
  };

  const stageExtractorFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setExtractorFiles(files);
    setExtractorReferences([]);
    setIsExtractorDialogOpen(true);
  };

  const stageExtractorReference = (label: string) => {
    if (!label.trim()) {
      return;
    }
    setExtractorFiles([]);
    setExtractorReferences([label.trim()]);
    setIsExtractorDialogOpen(true);
  };

  const handleManualAdd = async () => {
    const reqId = draft.reqId.trim();
    const description = draft.description.trim();
    const subsystem = draft.subsystem.trim();

    if (!reqId || !description || !subsystem) {
      return;
    }

    setIsSavingRequirement(true);
    const saved = await onAddRequirement({
      reqId,
      description,
      subsystem,
      tags: normalizeStringArray(tagsInput),
      projectId: fallbackProjectId,
    });
    setIsSavingRequirement(false);

    if (!saved) {
      return;
    }

    resetDraft();
    setIsAdding(false);
  };

  const handleRemove = async (requirementId: string) => {
    setRemovingRequirementId(requirementId);
    await onRemoveRequirement(requirementId);
    setRemovingRequirementId(null);
  };

  const handleValidateGeneratedJson = () => {
    setValidationResult(validateGeneratedRequirements(generatedJsonInput, fallbackProjectId));
  };

  const handleImportValidRows = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      return;
    }

    setIsImportingRequirements(true);
    for (const row of validationResult.validRows) {
      const saved = await onAddRequirement(row);
      if (!saved) {
        setIsImportingRequirements(false);
        return;
      }
    }
    setIsImportingRequirements(false);
    setGeneratedJsonInput('');
    setValidationResult(null);
    setExtractorFiles([]);
    setExtractorReferences([]);
    setIsExtractorDialogOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1a1a1a] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="bg-[#1a1a1a] border-b border-white/10 px-6 py-4 relative z-20">
        <div className="flex items-center justify-between gap-4">
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

      <div className="flex-1 flex relative z-20 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {isAdding ? (
              <Card className="p-4 bg-[#222222] border-white/10 rounded-none space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="REQ ID"
                    value={draft.reqId}
                    onChange={(event) => setDraft((previous) => ({ ...previous, reqId: event.target.value }))}
                    className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                    autoFocus
                  />
                  <Input
                    placeholder="Subsystem"
                    value={draft.subsystem}
                    onChange={(event) => setDraft((previous) => ({ ...previous, subsystem: event.target.value }))}
                    className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                  />
                  <Textarea
                    placeholder="REQ Description"
                    value={draft.description}
                    onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))}
                    className="min-h-32 bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono md:col-span-2"
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={tagsInput}
                    onChange={(event) => {
                      setTagsInput(event.target.value);
                      setDraft((previous) => ({ ...previous, tags: normalizeStringArray(event.target.value) }));
                    }}
                    className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleManualAdd}
                    disabled={isSavingRequirement}
                    className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isSavingRequirement ? 'Saving...' : 'Add'}
                  </Button>
                  <Button
                    onClick={() => {
                      resetDraft();
                      setIsAdding(false);
                    }}
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-none font-mono"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </Card>
            ) : null}

            <Card className="p-4 bg-[#222222] border-white/10 rounded-none">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by REQ ID, description, subsystem, tags, assigned components..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9 bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                  />
                </div>
                <div className="text-xs text-gray-400 font-mono flex items-center">
                  {requirementsLoading ? 'Loading requirements...' : `${requirements.length} requirements`}
                </div>
              </div>
              {requirementsError ? (
                <p className="mt-3 text-xs text-red-400 font-mono">{requirementsError}</p>
              ) : null}
            </Card>

            {requirementsLoading && requirements.length === 0 ? (
              <Card className="p-8 bg-[#222222] border-white/10 rounded-none text-center">
                <p className="text-sm text-gray-400 font-mono">Loading requirements...</p>
              </Card>
            ) : filteredRequirements.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-[#222222] border border-white/10 mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-serif text-white mb-2">
                  {requirements.length === 0 ? 'No requirements yet' : 'No matching requirements'}
                </h3>
                <p className="text-gray-400 mb-6 font-mono text-sm">
                  {requirements.length === 0
                    ? 'Add your first requirement or stage a document for extraction.'
                    : 'Adjust the search query to find requirements in this project.'}
                </p>
                <Button
                  onClick={() => setIsAdding(true)}
                  className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            ) : (
              <Card className="bg-[#222222] border-white/10 rounded-none overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-gray-300 font-mono">REQ ID</TableHead>
                      <TableHead className="text-gray-300 font-mono">REQ Description</TableHead>
                      <TableHead className="text-gray-300 font-mono">Subsystem</TableHead>
                      <TableHead className="text-gray-300 font-mono">Tags</TableHead>
                      <TableHead className="text-gray-300 font-mono">Assigned Components</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequirements.map((requirement) => (
                      <TableRow key={requirement.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-xs text-gray-300 font-mono">{requirement.reqId}</TableCell>
                        <TableCell className="text-gray-300 font-mono max-w-[420px]">
                          <div className="whitespace-pre-wrap break-words">{requirement.description}</div>
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono">{requirement.subsystem}</TableCell>
                        <TableCell className="text-gray-300 font-mono">
                          <div className="flex flex-wrap gap-1">
                            {requirement.tags.length > 0 ? (
                              requirement.tags.map((tag) => (
                                <Badge key={`${requirement.id}-${tag}`} variant="secondary" className="rounded-none">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-1">
                              {requirement.assignedComponents.length > 0 ? (
                                requirement.assignedComponents.map((componentName) => (
                                  <Badge
                                    key={`${requirement.id}-${componentName}`}
                                    variant="secondary"
                                    className="rounded-none"
                                  >
                                    {componentName}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500">None</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(requirement.id)}
                              disabled={removingRequirementId === requirement.id}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-none"
                              aria-label={`Remove requirement ${requirement.reqId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </ScrollArea>

        <aside className="w-[360px] min-w-[360px] border-l border-white/10 bg-[#161616]">
          <ScrollArea className="h-full">
            <div className="p-6">
              <Card className="p-5 bg-[#222222] border-white/10 rounded-none space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wide">Extract Requirements</p>
                  <h3 className="text-lg font-serif text-white mt-2">From Documents</h3>
                  <p className="text-xs text-gray-400 font-mono mt-2">
                    Drop a document here to open the importer, validate extracted JSON, and add rows to the table.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDropZoneActive(true);
                  }}
                  onDragLeave={() => setIsDropZoneActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDropZoneActive(false);

                    const droppedFiles = Array.from(event.dataTransfer.files || []);
                    if (droppedFiles.length > 0) {
                      stageExtractorFiles(droppedFiles);
                      return;
                    }

                    const payload = event.dataTransfer.getData('application/json');
                    if (!payload) {
                      return;
                    }

                    try {
                      const parsed = JSON.parse(payload) as { kind?: string; id?: string };
                      if (parsed.kind === 'document-card' && parsed.id) {
                        stageExtractorReference(`Document ${parsed.id}`);
                      }
                    } catch {
                      // Ignore malformed drag payloads.
                    }
                  }}
                  className={`w-full border border-dashed p-6 text-left transition-colors rounded-none ${
                    isDropZoneActive ? 'border-white/50 bg-white/5' : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center border border-white/10 bg-[#1a1a1a]">
                      <Upload className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-mono">Drag and drop documents</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Or click to browse and open the importer popup.
                      </p>
                    </div>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    stageExtractorFiles(files);
                    event.target.value = '';
                  }}
                />

                {extractorFiles.length > 0 || extractorReferences.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-mono">Staged sources</p>
                    <div className="flex flex-wrap gap-2">
                      {extractorFiles.map((file) => (
                        <Badge key={file.name} variant="secondary" className="rounded-none">
                          <FileText className="h-3 w-3 mr-1" />
                          {file.name}
                        </Badge>
                      ))}
                      {extractorReferences.map((reference) => (
                        <Badge key={reference} variant="secondary" className="rounded-none">
                          <FileText className="h-3 w-3 mr-1" />
                          {reference}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsExtractorDialogOpen(true)}
                    className="flex-1 bg-white text-black hover:bg-gray-200 rounded-none font-mono"
                  >
                    Open Importer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExtractorFiles([]);
                      setExtractorReferences([]);
                      setGeneratedJsonInput('');
                      setValidationResult(null);
                    }}
                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-none font-mono"
                  >
                    Clear
                  </Button>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </aside>
      </div>

      <Dialog open={isExtractorDialogOpen} onOpenChange={setIsExtractorDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 rounded-none max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-serif text-2xl">Generate Requirements From Doc</DialogTitle>
            <DialogDescription className="text-gray-400 font-mono text-sm">
              Validate the extracted JSON payload, then import it into the project requirement table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {extractorFiles.length > 0 || extractorReferences.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-300 font-mono">Selected sources</p>
                <div className="flex flex-wrap gap-2">
                  {extractorFiles.map((file) => (
                    <Badge key={file.name} variant="secondary" className="rounded-none">
                      <FileText className="h-3 w-3 mr-1" />
                      {file.name}
                    </Badge>
                  ))}
                  {extractorReferences.map((reference) => (
                    <Badge key={reference} variant="secondary" className="rounded-none">
                      <FileText className="h-3 w-3 mr-1" />
                      {reference}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-mono">Generated Requirements JSON</label>
              <Textarea
                value={generatedJsonInput}
                onChange={(event) => setGeneratedJsonInput(event.target.value)}
                placeholder='[{"ReqId":"REQ-001","Description":"Support deployment sequence telemetry.","Subsystem":"Avionics","Tags":["telemetry"]}]'
                className="min-h-56 bg-[#222222] border-white/10 text-white rounded-none font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleValidateGeneratedJson}
                className="bg-white text-black hover:bg-gray-200 rounded-none font-mono"
              >
                Validate JSON
              </Button>
              <Button
                onClick={handleImportValidRows}
                disabled={!validationResult || validationResult.validRows.length === 0 || isImportingRequirements}
                variant="outline"
                className="border-white/10 text-gray-200 hover:bg-white/5 rounded-none font-mono"
              >
                {isImportingRequirements ? 'Importing...' : 'Import Valid Rows'}
              </Button>
            </div>

            {validationResult ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Badge className="rounded-none">{validationResult.validRows.length} valid</Badge>
                  <Badge variant="destructive" className="rounded-none">
                    {validationResult.issues.length} issues
                  </Badge>
                </div>
                {validationResult.issues.length > 0 ? (
                  <div className="max-h-40 overflow-auto border border-red-400/30 bg-red-500/5 p-2 space-y-1">
                    {validationResult.issues.map((issue, index) => (
                      <p key={`${issue.row}-${issue.field}-${index}`} className="text-xs text-red-300 font-mono">
                        Row {issue.row} / {issue.field}: {issue.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
