import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ComponentsView } from './ComponentsView';

const baseProps = {
  projectName: 'Mission Alpha',
  components: [
    JSON.stringify({
      id: 'cmp-1',
      name: 'Sensor Pod',
      type: 'Avionics',
      quantity: 1,
      notes: 'primary',
    }),
  ],
  requirements: [
    {
      id: 'req-db-1',
      reqId: 'REQ-1',
      description: 'Maintain thermal survivability.',
      subsystem: 'Thermal',
      tags: ['thermal'],
      assignedComponents: ['Sensor Pod'],
      projectId: 'project-1',
    },
  ],
  onAddComponent: vi.fn(),
  onRemoveComponent: vi.fn(),
};

describe('ComponentsView document builder flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches docs, uploads a doc, and drops document and requirement cards into the builder stack', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.includes('/api/v1/documents') && method === 'GET') {
        return new Response(
          JSON.stringify({
            documents: [
              {
                id: 'doc-1',
                name: 'thermal-spec.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1234,
                uploadedAt: new Date().toISOString(),
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes('/api/v1/documents/upload') && method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'doc-uploaded',
            name: 'uploaded-manual.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 2048,
            uploadedAt: new Date().toISOString(),
          }),
          { status: 200 }
        );
      }

      if (url.includes('/api/v1/markdown/from-stack') && method === 'POST') {
        return new Response(JSON.stringify({ markdown: '# generated' }), { status: 200 });
      }

      return new Response('{}', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ComponentsView {...baseProps} />);

    fireEvent.click(screen.getByLabelText('Expand tools searching section'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(await screen.findByText('thermal-spec.pdf')).toBeInTheDocument();

    const uploadInput = screen.getByTestId('doc-upload-input') as HTMLInputElement;
    const file = new File(['hello'], 'uploaded-manual.pdf', { type: 'application/pdf' });
    fireEvent.change(uploadInput, { target: { files: [file] } });

    expect(await screen.findByText('uploaded-manual.pdf')).toBeInTheDocument();

    const docCard = screen.getByTestId('doc-card-doc-uploaded');
    const dropZone = screen.getByTestId('builder-drop-zone');

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, val: string) {
        this.data[type] = val;
      },
      getData(type: string) {
        return this.data[type];
      },
      effectAllowed: 'copy',
    };

    fireEvent.dragStart(docCard, { dataTransfer });
    fireEvent.dragOver(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    expect(await screen.findByText('Doc doc-uploaded (application/pdf, 2048 bytes)')).toBeInTheDocument();

    const requirementCard = screen.getByTestId('requirement-card-req-db-1');
    const requirementTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, val: string) {
        this.data[type] = val;
      },
      getData(type: string) {
        return this.data[type];
      },
      effectAllowed: 'copy',
    };

    fireEvent.dragStart(requirementCard, { dataTransfer: requirementTransfer });
    fireEvent.dragOver(dropZone, { dataTransfer: requirementTransfer });
    fireEvent.drop(dropZone, { dataTransfer: requirementTransfer });

    await waitFor(() => {
      expect(screen.getAllByText('REQ-1').length).toBeGreaterThan(1);
    });
  });
});
