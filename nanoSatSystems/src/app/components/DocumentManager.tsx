import { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, File, Link2, X, Download, ExternalLink, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface Document {
  id: string;
  name: string;
  type: 'upload' | 'google-docs' | 'google-sheets' | 'google-chat';
  fileType?: string;
  size?: string;
  url?: string;
  uploadedAt: Date;
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Project Requirements.pdf',
      type: 'upload',
      fileType: 'pdf',
      size: '2.4 MB',
      uploadedAt: new Date('2025-01-20'),
    },
    {
      id: '2',
      name: 'Budget Spreadsheet',
      type: 'google-sheets',
      url: 'https://docs.google.com/spreadsheets/d/example',
      uploadedAt: new Date('2025-01-19'),
    },
    {
      id: '3',
      name: 'Technical Specifications.xlsx',
      type: 'upload',
      fileType: 'xlsx',
      size: '1.8 MB',
      uploadedAt: new Date('2025-01-18'),
    },
  ]);

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'google-docs' | 'google-sheets' | 'google-chat'>('google-docs');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const newDoc: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: 'upload',
        fileType: fileExtension,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date(),
      };
      setDocuments((prev) => [...prev, newDoc]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    if (!linkName.trim() || !linkUrl.trim()) return;

    const newDoc: Document = {
      id: Date.now().toString(),
      name: linkName,
      type: linkType,
      url: linkUrl,
      uploadedAt: new Date(),
    };

    setDocuments((prev) => [...prev, newDoc]);
    setLinkName('');
    setLinkUrl('');
    setIsLinkDialogOpen(false);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const getFileIcon = (doc: Document) => {
    if (doc.type === 'google-docs') {
      return <FileText className="h-8 w-8 text-blue-400" />;
    }
    if (doc.type === 'google-sheets') {
      return <FileSpreadsheet className="h-8 w-8 text-green-400" />;
    }
    if (doc.type === 'google-chat') {
      return <Link2 className="h-8 w-8 text-yellow-400" />;
    }

    // File uploads
    switch (doc.fileType) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-400" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-400" />;
      case 'xml':
        return <File className="h-8 w-8 text-orange-400" />;
      default:
        return <File className="h-8 w-8 text-gray-400" />;
    }
  };

  const getDocumentTypeLabel = (doc: Document) => {
    if (doc.type === 'google-docs') return 'Google Docs';
    if (doc.type === 'google-sheets') return 'Google Sheets';
    if (doc.type === 'google-chat') return 'Google Chat';
    return doc.fileType?.toUpperCase() || 'FILE';
  };

  return (
    <div className="flex-1 bg-[#1a1a1a] overflow-auto relative">
      {/* Film Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="text-6xl font-bold text-white tracking-tight" style={{ fontFamily: 'serif' }}>
            Documents
          </h1>
          <p className="text-lg text-gray-400 font-mono">
            {documents.length} items
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap gap-4"
        >
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.xml,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            onClick={() => {
              setLinkType('google-docs');
              setIsLinkDialogOpen(true);
            }}
            variant="outline"
            className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
          >
            <FileText className="h-4 w-4" />
            Link Google Docs
          </Button>

          <Button
            onClick={() => {
              setLinkType('google-sheets');
              setIsLinkDialogOpen(true);
            }}
            variant="outline"
            className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Link Google Sheets
          </Button>

          <Button
            onClick={() => {
              setLinkType('google-chat');
              setIsLinkDialogOpen(true);
            }}
            variant="outline"
            className="gap-2 rounded-none border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-mono"
          >
            <Link2 className="h-4 w-4" />
            Link Google Chat
          </Button>
        </motion.div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-[#222222] border-white/10 rounded-none overflow-hidden group hover:border-white/20 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getFileIcon(doc)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-white text-sm font-mono truncate">
                              {doc.name}
                            </CardTitle>
                            <CardDescription className="text-gray-500 text-xs font-mono mt-1">
                              {getDocumentTypeLabel(doc)}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Document Info */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-500">
                          {doc.uploadedAt.toLocaleDateString()}
                        </span>
                        {doc.size && (
                          <span className="text-gray-500">{doc.size}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {doc.url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-mono text-xs"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-mono text-xs"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 rounded-none border-white/10 text-red-400 hover:text-red-300 hover:bg-red-950/20 font-mono text-xs"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {documents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2 font-mono">
              No documents
            </h3>
            <p className="text-gray-500 font-mono text-sm">
              Upload files or link external documents
            </p>
          </motion.div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 rounded-none max-w-md">
          {/* Film Grain Texture */}
          <div 
            className="absolute inset-0 opacity-[0.15] pointer-events-none z-10 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          <DialogHeader className="relative z-20">
            <DialogTitle className="text-2xl font-bold text-white font-mono">
              Link {linkType === 'google-docs' ? 'Google Docs' : linkType === 'google-sheets' ? 'Google Sheets' : 'Google Chat'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-mono text-sm">
              Add a link to external document
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 relative z-20">
            <div className="space-y-2">
              <Label htmlFor="link-name" className="text-gray-300 font-mono text-sm">
                Document Name
              </Label>
              <Input
                id="link-name"
                placeholder="e.g., Project Budget"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                className="bg-[#222222] border-white/10 text-white placeholder:text-gray-600 font-mono rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-url" className="text-gray-300 font-mono text-sm">
                URL
              </Label>
              <Input
                id="link-url"
                placeholder="https://docs.google.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-[#222222] border-white/10 text-white placeholder:text-gray-600 font-mono rounded-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 relative z-20">
            <Button
              variant="outline"
              onClick={() => setIsLinkDialogOpen(false)}
              className="rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-mono"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddLink}
              className="rounded-none bg-white text-black hover:bg-gray-200 font-mono"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}