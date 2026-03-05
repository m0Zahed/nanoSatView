import { useMemo, useState } from 'react';
import { Plus, Trash2, Check, X, Search, FileText, Upload } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

type RequirementLevel = 'Must' | 'Should' | 'Could' | 'Won\'t';

interface RequirementDraft {
  title: string;
  description: string;
  type: string;
  level: RequirementLevel;
  subsystem: string;
  tags: string[];
}

interface RequirementRow extends RequirementDraft {
  id: string;
  projectId: string;
  sourceIndex: number;
}

interface ValidationIssue {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  validRows: RequirementRow[];
  issues: ValidationIssue[];
}

interface RequirementsViewProps {
  projectName: string;
  projectId?: string;
  requirements: string[];
  onAddRequirement: (requirement: string) => void;
  onRemoveRequirement: (index: number) => void;
}

function createRequirementId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRequirement(
  raw: string,
  index: number,
  fallbackProjectId: string
): RequirementRow {
  try {
    const parsed = JSON.parse(raw) as Partial<{
      id: string;
      title: string;
      description: string;
      type: string;
      level: RequirementLevel;
      subsystem: string;
      tags: string[];
      projectId: string;
      Title: string;
      Description: string;
      Type: string;
      Level: RequirementLevel;
      Subsystem: string;
      Tags: string[];
      ProjectId: string;
      Id: string;
    }>;
    if (parsed && typeof parsed === 'object') {
      const title = (parsed.title || parsed.Title || '').toString().trim();
      if (title) {
        return {
          id: (parsed.id || parsed.Id || createRequirementId()).toString(),
          title,
          description: (parsed.description || parsed.Description || '').toString() || title,
          type: (parsed.type || parsed.Type || 'General').toString(),
          level: ((parsed.level || parsed.Level || 'Should').toString() as RequirementLevel),
          subsystem: (parsed.subsystem || parsed.Subsystem || 'General').toString(),
          tags: Array.isArray(parsed.tags || parsed.Tags) ? ((parsed.tags || parsed.Tags) as string[]) : [],
          projectId: (parsed.projectId || parsed.ProjectId || fallbackProjectId).toString(),
          sourceIndex: index,
        };
      }
    }
  } catch {
    // Legacy/plain-text requirements are handled below.
  }

  return {
    id: `legacy-${index + 1}`,
    title: raw,
    description: raw,
    type: 'General',
    level: 'Should',
    subsystem: 'General',
    tags: [],
    projectId: fallbackProjectId,
    sourceIndex: index,
  };
}

function isGuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toRequirementLevel(value: unknown): RequirementLevel | null {
  const text = String(value ?? '').trim();
  if (text === 'Must' || text === 'Should' || text === 'Could' || text === 'Won\'t') {
    return text;
  }
  return null;
}

function validateGeneratedRequirements(
  payload: string,
  fallbackProjectId: string
): ValidationResult {
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

  const validRows: RequirementRow[] = [];

  parsed.forEach((entry, index) => {
    const rowNum = index + 1;
    if (!entry || typeof entry !== 'object') {
      issues.push({ row: rowNum, field: 'row', message: 'Each item must be an object.' });
      return;
    }

    const obj = entry as Record<string, unknown>;
    const id = String(obj.Id ?? obj.id ?? '').trim();
    const title = String(obj.Title ?? obj.title ?? '').trim();
    const description = String(obj.Description ?? obj.description ?? '').trim();
    const type = String(obj.Type ?? obj.type ?? '').trim();
    const levelRaw = obj.Level ?? obj.level;
    const subsystem = String(obj.Subsystem ?? obj.subsystem ?? '').trim();
    const tagsRaw = obj.Tags ?? obj.tags;
    const projectId = String(obj.ProjectId ?? obj.projectId ?? fallbackProjectId).trim();

    if (!id) issues.push({ row: rowNum, field: 'Id', message: 'Required.' });
    else if (!isGuid(id)) issues.push({ row: rowNum, field: 'Id', message: 'Must be a valid GUID.' });

    if (!title) issues.push({ row: rowNum, field: 'Title', message: 'Required.' });
    else if (title.length > 200) issues.push({ row: rowNum, field: 'Title', message: 'Max length is 200.' });

    if (!description) issues.push({ row: rowNum, field: 'Description', message: 'Required.' });
    else if (description.length > 4000)
      issues.push({ row: rowNum, field: 'Description', message: 'Max length is 4000.' });

    if (!type) issues.push({ row: rowNum, field: 'Type', message: 'Required.' });
    else if (type.length > 100) issues.push({ row: rowNum, field: 'Type', message: 'Max length is 100.' });

    const level = toRequirementLevel(levelRaw);
    if (!level) {
      issues.push({
        row: rowNum,
        field: 'Level',
        message: "Required. Must be one of: Must, Should, Could, Won't.",
      });
    }

    if (!subsystem) issues.push({ row: rowNum, field: 'Subsystem', message: 'Required.' });
    else if (subsystem.length > 200)
      issues.push({ row: rowNum, field: 'Subsystem', message: 'Max length is 200.' });

    if (!Array.isArray(tagsRaw)) {
      issues.push({ row: rowNum, field: 'Tags', message: 'Required. Must be an array of strings.' });
    } else if (!(tagsRaw as unknown[]).every((tag) => typeof tag === 'string')) {
      issues.push({ row: rowNum, field: 'Tags', message: 'All tags must be strings.' });
    }

    if (!projectId) issues.push({ row: rowNum, field: 'ProjectId', message: 'Required.' });
    else if (!isGuid(projectId))
      issues.push({ row: rowNum, field: 'ProjectId', message: 'Must be a valid GUID.' });

    const rowIssues = issues.filter((issue) => issue.row === rowNum);
    if (rowIssues.length === 0) {
      validRows.push({
        id,
        title,
        description,
        type,
        level: level as RequirementLevel,
        subsystem,
        tags: tagsRaw as string[],
        projectId,
        sourceIndex: index,
      });
    }
  });

  return { validRows, issues };
}

export function RequirementsView({
  projectName,
  projectId,
  requirements,
  onAddRequirement,
  onRemoveRequirement,
}: RequirementsViewProps) {
  const [draft, setDraft] = useState<RequirementDraft>({
    title: '',
    description: '',
    type: 'Functional',
    level: 'Should',
    subsystem: 'General',
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subsystemFilter, setSubsystemFilter] = useState<string>('all');
  const [generatorFiles, setGeneratorFiles] = useState<File[]>([]);
  const [generatedJsonInput, setGeneratedJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const normalizedRequirements = useMemo(
    () =>
      requirements.map((raw, index) =>
        normalizeRequirement(raw, index, projectId || '00000000-0000-0000-0000-000000000000')
      ),
    [requirements, projectId]
  );

  const availableTypes = useMemo(
    () => Array.from(new Set(normalizedRequirements.map((row) => row.type))).sort((a, b) => a.localeCompare(b)),
    [normalizedRequirements]
  );
  const availableSubsystems = useMemo(
    () =>
      Array.from(new Set(normalizedRequirements.map((row) => row.subsystem))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [normalizedRequirements]
  );
  const availableLevels = ['Must', 'Should', 'Could', 'Won\'t'] as const;

  const filteredRequirements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return normalizedRequirements.filter((row) => {
      const searchMatch =
        !query ||
        row.id.toLowerCase().includes(query) ||
        row.title.toLowerCase().includes(query) ||
        row.description.toLowerCase().includes(query) ||
        row.type.toLowerCase().includes(query) ||
        row.subsystem.toLowerCase().includes(query) ||
        row.tags.some((tag) => tag.toLowerCase().includes(query));

      const levelMatch = levelFilter === 'all' || row.level === levelFilter;
      const typeMatch = typeFilter === 'all' || row.type === typeFilter;
      const subsystemMatch = subsystemFilter === 'all' || row.subsystem === subsystemFilter;
      return searchMatch && levelMatch && typeMatch && subsystemMatch;
    });
  }, [levelFilter, normalizedRequirements, searchQuery, subsystemFilter, typeFilter]);

  const handleAdd = () => {
    const title = draft.title.trim();
    const description = draft.description.trim();
    const subsystem = draft.subsystem.trim();
    const type = draft.type.trim();
    if (title && description && subsystem && type) {
      const payload = {
        Id: createRequirementId(),
        Title: title,
        Description: description,
        Type: type,
        Level: draft.level,
        Subsystem: subsystem,
        Tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        ProjectId: projectId || '00000000-0000-0000-0000-000000000000',
      };
      onAddRequirement(JSON.stringify(payload));
      setDraft({
        title: '',
        description: '',
        type: 'Functional',
        level: 'Should',
        subsystem: 'General',
        tags: [],
      });
      setTagsInput('');
      setIsAdding(false);
    }
  };

  const handleValidateGeneratedJson = () => {
    const result = validateGeneratedRequirements(
      generatedJsonInput,
      projectId || '00000000-0000-0000-0000-000000000000'
    );
    setValidationResult(result);
  };

  const handleImportValidRows = () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      return;
    }
    for (const row of validationResult.validRows) {
      const payload = {
        Id: row.id,
        Title: row.title,
        Description: row.description,
        Type: row.type,
        Level: row.level,
        Subsystem: row.subsystem,
        Tags: row.tags,
        ProjectId: row.projectId,
      };
      onAddRequirement(JSON.stringify(payload));
    }
    setGeneratedJsonInput('');
    setValidationResult(null);
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
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Title"
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                  autoFocus
                />
                <Input
                  placeholder="Type (e.g. Functional)"
                  value={draft.type}
                  onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
                  className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                />
                <Input
                  placeholder="Subsystem"
                  value={draft.subsystem}
                  onChange={(e) => setDraft((prev) => ({ ...prev, subsystem: e.target.value }))}
                  className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value);
                    setDraft((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    }));
                  }}
                  className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                />
                <Select
                  value={draft.level}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, level: value as RequirementLevel }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Description"
                  value={draft.description}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd();
                    } else if (e.key === 'Escape') {
                      setIsAdding(false);
                      setDraft({
                        title: '',
                        description: '',
                        type: 'Functional',
                        level: 'Should',
                        subsystem: 'General',
                        tags: [],
                      });
                      setTagsInput('');
                    }
                  }}
                  className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                />
                <div className="flex gap-2 md:col-span-2">
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
                      setDraft({
                        title: '',
                        description: '',
                        type: 'Functional',
                        level: 'Should',
                        subsystem: 'General',
                        tags: [],
                      });
                      setTagsInput('');
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

          <Card className="p-4 bg-[#222222] border-white/10 rounded-none space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base text-white font-mono">Generate Requirements From Doc</h3>
                <p className="text-xs text-gray-400 font-mono">
                  Upload source docs, paste AI-generated JSON array, then validate against table fields.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-none">Draft</Badge>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-mono flex items-center gap-2">
                <Upload className="h-3.5 w-3.5" />
                Documents
              </label>
              <Input
                type="file"
                multiple
                onChange={(e) => setGeneratorFiles(Array.from(e.target.files || []))}
                className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono file:mr-3 file:border-0 file:bg-white file:text-black file:px-2 file:py-1"
              />
              {generatorFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generatorFiles.map((file) => (
                    <Badge key={file.name} variant="secondary" className="rounded-none">
                      <FileText className="h-3 w-3 mr-1" />
                      {file.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-mono">Generated Requirements JSON</label>
              <Textarea
                value={generatedJsonInput}
                onChange={(e) => setGeneratedJsonInput(e.target.value)}
                placeholder='[{"Id":"...","Title":"...","Description":"...","Type":"...","Level":"Should","Subsystem":"...","Tags":["..."],"ProjectId":"..."}]'
                className="min-h-40 bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
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
                variant="outline"
                className="border-white/10 text-gray-200 hover:bg-white/5 rounded-none font-mono"
                disabled={!validationResult || validationResult.validRows.length === 0}
              >
                Import Valid Rows
              </Button>
            </div>

            {validationResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Badge className="rounded-none">{validationResult.validRows.length} valid</Badge>
                  <Badge variant="destructive" className="rounded-none">
                    {validationResult.issues.length} issues
                  </Badge>
                </div>
                {validationResult.issues.length > 0 && (
                  <div className="max-h-36 overflow-auto border border-red-400/30 bg-red-500/5 p-2 space-y-1">
                    {validationResult.issues.map((issue, idx) => (
                      <p key={`${issue.row}-${issue.field}-${idx}`} className="text-xs text-red-300 font-mono">
                        Row {issue.row} / {issue.field}: {issue.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4 bg-[#222222] border-white/10 rounded-none">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by id, title, description, subsystem, type, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
                <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white rounded-none font-mono">
                  <SelectValue placeholder="Filter by subsystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subsystems</SelectItem>
                  {availableSubsystems.map((subsystem) => (
                    <SelectItem key={subsystem} value={subsystem}>
                      {subsystem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {normalizedRequirements.length === 0 && !isAdding ? (
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
            <Card className="bg-[#222222] border-white/10 rounded-none overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-gray-300 font-mono">Id</TableHead>
                    <TableHead className="text-gray-300 font-mono">Title</TableHead>
                    <TableHead className="text-gray-300 font-mono">Description</TableHead>
                    <TableHead className="text-gray-300 font-mono">Type</TableHead>
                    <TableHead className="text-gray-300 font-mono">Level</TableHead>
                    <TableHead className="text-gray-300 font-mono">Subsystem</TableHead>
                    <TableHead className="text-gray-300 font-mono">Tags</TableHead>
                    <TableHead className="text-gray-300 font-mono">ProjectId</TableHead>
                    <TableHead className="text-gray-300 font-mono text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={9} className="py-8 text-center text-gray-400 font-mono">
                        No matching requirements
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequirements.map((row) => (
                      <TableRow key={`${row.id}-${row.sourceIndex}`} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-xs text-gray-300 font-mono">{row.id}</TableCell>
                        <TableCell className="text-white font-mono">{row.title}</TableCell>
                        <TableCell className="text-gray-300 font-mono max-w-[320px]">
                          <div className="truncate" title={row.description}>
                            {row.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono">{row.type}</TableCell>
                        <TableCell className="text-gray-300 font-mono">{row.level}</TableCell>
                        <TableCell className="text-gray-300 font-mono">{row.subsystem}</TableCell>
                        <TableCell className="text-gray-300 font-mono">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {row.tags.length > 0 ? (
                              row.tags.map((tag) => (
                                <Badge key={`${row.id}-${tag}`} variant="secondary" className="rounded-none">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-300 font-mono">{row.projectId}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveRequirement(row.sourceIndex)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
