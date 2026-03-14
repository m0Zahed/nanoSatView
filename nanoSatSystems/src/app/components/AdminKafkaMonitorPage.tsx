import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchMonitoringSnapshot,
  type ComponentEditedKafkaEvent,
  type MonitoringSnapshot,
  type RequestTrace,
} from '@/app/api/monitoring';
import { useAuth } from '@/app/auth/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { RefreshCcw, Activity, Database, FileText, ShieldAlert } from 'lucide-react';

type ParsedRequestBody = {
  rawText: string;
  json: Record<string, unknown> | null;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatBytes(bytes: number) {
  if (bytes < 0) {
    return '-';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function parseRequestBody(trace: RequestTrace): ParsedRequestBody {
  const rawText = (trace.bodyPreview || '').trim();
  if (!rawText) {
    return { rawText: '', json: null };
  }
  try {
    return { rawText, json: JSON.parse(rawText) as Record<string, unknown> };
  } catch {
    return { rawText, json: null };
  }
}

function readField(json: Record<string, unknown> | null, fieldNames: string[]) {
  if (!json) {
    return '';
  }
  for (const field of fieldNames) {
    const value = json[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function isProjectManagementRequest(trace: RequestTrace, parsed: ParsedRequestBody) {
  const path = (trace.path || '').toLowerCase();
  if (path.includes('/api/diagrams') || path.includes('/api/projects') || path.includes('/api/requirements')) {
    return true;
  }
  const projectId = readField(parsed.json, ['projectId', 'ProjectId']);
  const organizationId = readField(parsed.json, ['organizationId', 'organisationId', 'OrganizationId', 'OrganisationId']);
  return Boolean(projectId || organizationId);
}

function isDocumentUploadRequest(trace: RequestTrace, parsed: ParsedRequestBody) {
  const path = (trace.path || '').toLowerCase();
  if (path.includes('/upload') || path.includes('/documents') || path.includes('/api/diagrams/save')) {
    return true;
  }
  const hasXml = readField(parsed.json, ['xmlContent', 'XmlContent']);
  const hasJson = readField(parsed.json, ['jsonContent', 'JsonContent']);
  return Boolean(hasXml || hasJson);
}

function RequestList({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: ReactNode;
  rows: Array<{ trace: RequestTrace; parsed: ParsedRequestBody }>;
}) {
  return (
    <section className="bg-[#222222] border border-white/10 p-4 rounded-none">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-white font-mono text-base flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <Badge className="rounded-none">{rows.length}</Badge>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 font-mono">No matching requests yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(({ trace, parsed }, index) => {
            const actor = readField(parsed.json, ['memberId', 'MemberId', 'uploadedBy', 'userId', 'UserId']) || '-';
            const projectId = readField(parsed.json, ['projectId', 'ProjectId']) || '-';
            const organizationId =
              readField(parsed.json, ['organizationId', 'organisationId', 'OrganizationId', 'OrganisationId']) || '-';

            return (
              <details key={`${trace.timestamp}-${trace.path}-${index}`} className="border border-white/10 bg-[#1a1a1a]">
                <summary className="list-none cursor-pointer p-3 font-mono text-xs text-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <span className="text-gray-400">{formatDateTime(trace.timestamp)}</span>
                    <span>
                      <span className="text-gray-500">Actor:</span> {actor}
                    </span>
                    <span>
                      <span className="text-gray-500">Project:</span> {projectId}
                    </span>
                    <span>
                      <span className="text-gray-500">Org:</span> {organizationId}
                    </span>
                    <span>
                      <span className="text-gray-500">HTTP:</span> {trace.method} {trace.status}
                    </span>
                    <span>
                      <span className="text-gray-500">Path:</span> {trace.path}
                    </span>
                  </div>
                </summary>
                <div className="border-t border-white/10 p-3 space-y-2">
                  <p className="text-[11px] text-gray-500 font-mono">
                    {trace.durationMs} ms | source: {trace.source || '-'} | ip: {trace.remoteAddr || '-'}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">HTTP Request JSON</p>
                  <pre className="bg-black/30 border border-white/10 p-3 text-xs text-gray-200 font-mono whitespace-pre-wrap break-words max-h-72 overflow-auto">
                    {parsed.json ? JSON.stringify(parsed.json, null, 2) : parsed.rawText || '(empty request body)'}
                  </pre>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ComponentEventList({ rows }: { rows: ComponentEditedKafkaEvent[] }) {
  return (
    <section className="bg-[#222222] border border-white/10 p-4 rounded-none">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-white font-mono text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Component Edit Kafka Log
        </h2>
        <Badge className="rounded-none">{rows.length}</Badge>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 font-mono">No component edit events yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((event, index) => (
            <div key={`${event.componentId}-${event.eventTime}-${index}`} className="border border-white/10 bg-[#1a1a1a] p-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs font-mono text-gray-300">
                <span className="text-gray-400">{formatDateTime(event.eventTime)}</span>
                <span>
                  <span className="text-gray-500">Editor:</span> {event.editorName || event.editorId}
                </span>
                <span>
                  <span className="text-gray-500">Action:</span> {event.action}
                </span>
                <span>
                  <span className="text-gray-500">Component:</span> {event.componentName}
                </span>
                <span>
                  <span className="text-gray-500">Project:</span> {event.projectId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminKafkaMonitorPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSnapshot = async () => {
    setError('');
    const { status, data } = await fetchMonitoringSnapshot();
    if (status >= 200 && status < 300 && data) {
      setSnapshot(data);
      setIsLoading(false);
      return;
    }
    setError(`Unable to fetch monitoring snapshot (HTTP ${status}).`);
    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) {
        return;
      }
      await loadSnapshot();
    };
    run();
    const timer = window.setInterval(() => {
      run();
    }, 8000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const parsedRequests = useMemo(
    () =>
      (snapshot?.recentRequests || []).map((trace) => ({
        trace,
        parsed: parseRequestBody(trace),
      })),
    [snapshot]
  );

  const projectManagementRequests = useMemo(
    () => parsedRequests.filter(({ trace, parsed }) => isProjectManagementRequest(trace, parsed)),
    [parsedRequests]
  );

  const documentUploadRequests = useMemo(
    () => parsedRequests.filter(({ trace, parsed }) => isDocumentUploadRequest(trace, parsed)),
    [parsedRequests]
  );

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
        <div className="max-w-3xl mx-auto border border-red-400/30 bg-red-500/10 p-6 rounded-none">
          <h1 className="font-mono text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-300" />
            Admin Access Required
          </h1>
          <p className="mt-2 text-sm text-red-200 font-mono">
            You must be an admin user to access Kafka pub-sub monitoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="border border-white/10 bg-[#222222] p-4 rounded-none">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="font-mono text-xl">Kafka Pub/Sub Admin Monitor</h1>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Tracks Project Management integration requests, document uploads, and request JSON payloads.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="rounded-none">
                {snapshot?.kafkaEnabled ? 'Kafka: enabled' : 'Kafka: disabled'}
              </Badge>
              <Button
                variant="outline"
                onClick={loadSnapshot}
                className="rounded-none border-white/10 text-black hover:text-white hover:bg-white/5 font-mono gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-2">
            Last snapshot: {formatDateTime(snapshot?.generatedAt)}
          </p>
        </div>

        {isLoading && <p className="text-sm text-gray-400 font-mono">Loading monitoring data...</p>}
        {error && <p className="text-sm text-red-300 font-mono">{error}</p>}

        {snapshot && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="border border-white/10 bg-[#222222] p-3 rounded-none">
                <p className="text-xs text-gray-400 font-mono">Uptime</p>
                <p className="font-mono text-lg">{snapshot.uptimeSeconds}s</p>
              </div>
              <div className="border border-white/10 bg-[#222222] p-3 rounded-none">
                <p className="text-xs text-gray-400 font-mono">Kafka Topics</p>
                <p className="font-mono text-lg">{snapshot.kafkaFlows.length}</p>
              </div>
              <div className="border border-white/10 bg-[#222222] p-3 rounded-none">
                <p className="text-xs text-gray-400 font-mono">Request Traces</p>
                <p className="font-mono text-lg">{snapshot.recentRequests.length}</p>
              </div>
              <div className="border border-white/10 bg-[#222222] p-3 rounded-none">
                <p className="text-xs text-gray-400 font-mono">Stored Files</p>
                <p className="font-mono text-lg">{snapshot.diagramStorage.totalFiles}</p>
              </div>
            </section>

            <ComponentEventList rows={snapshot.recentComponentEvents || []} />

            <section className="bg-[#222222] border border-white/10 p-4 rounded-none">
              <h2 className="text-white font-mono text-base flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4" />
                Kafka Topic Flow
              </h2>
              <div className="overflow-auto border border-white/10">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-black/20 text-gray-300">
                    <tr>
                      <th className="text-left p-2">Topic</th>
                      <th className="text-left p-2">Produced</th>
                      <th className="text-left p-2">Consumed</th>
                      <th className="text-left p-2">Last Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.kafkaFlows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-gray-500">
                          No topic activity yet.
                        </td>
                      </tr>
                    ) : (
                      snapshot.kafkaFlows.map((flow) => (
                        <tr key={flow.topic} className="border-t border-white/10">
                          <td className="p-2 text-gray-200">{flow.topic}</td>
                          <td className="p-2 text-gray-300">{flow.produced}</td>
                          <td className="p-2 text-gray-300">{flow.consumed}</td>
                          <td className="p-2 text-gray-500">{formatDateTime(flow.lastEventAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <RequestList
              title="Project Management API Requests"
              icon={<Database className="h-4 w-4" />}
              rows={projectManagementRequests}
            />

            <RequestList
              title="Document Upload Requests"
              icon={<FileText className="h-4 w-4" />}
              rows={documentUploadRequests}
            />

            <section className="bg-[#222222] border border-white/10 p-4 rounded-none">
              <h2 className="text-white font-mono text-base mb-3">Recent Uploaded Files</h2>
              <div className="overflow-auto border border-white/10">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-black/20 text-gray-300">
                    <tr>
                      <th className="text-left p-2">File</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.diagramStorage.recentFiles.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-gray-500">
                          No stored files detected.
                        </td>
                      </tr>
                    ) : (
                      snapshot.diagramStorage.recentFiles.map((file) => (
                        <tr key={`${file.relativePath}-${file.lastModifiedAt || ''}`} className="border-t border-white/10">
                          <td className="p-2 text-gray-200">{file.relativePath}</td>
                          <td className="p-2 text-gray-300">{formatBytes(file.sizeBytes)}</td>
                          <td className="p-2 text-gray-500">{formatDateTime(file.lastModifiedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
