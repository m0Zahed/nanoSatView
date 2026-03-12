import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Book, Edit2, Save, X, Plus, Trash2, Lock, Home, LogIn, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Footer } from '@/app/components/Footer';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { AddSectionModal } from '@/app/components/AddSectionModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '@/app/auth/AuthContext';

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface CodeExample {
  language: string;
  code: string;
}

interface DocSection {
  id: string;
  title: string;
  content: string;
  type?: 'api' | 'markdown';
  endpoint?: string;
  parameters?: Parameter[];
  responseFormat?: string;
  codeExamples: CodeExample[];
}

interface DocCategory {
  id: string;
  title: string;
  sections: DocSection[];
}

const initialDocumentation: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: 'Welcome to nanoSat API documentation. This comprehensive guide will help you integrate our systems engineering platform into your workflow.',
        codeExamples: [],
      },
      {
        id: 'authentication',
        title: 'Authentication',
        content: 'The nanoSat API uses API keys for authentication. Include your API key in the Authorization header of all requests.',
        endpoint: '/v1/auth',
        parameters: [
          { name: 'api_key', type: 'string', required: true, description: 'Your API key for authentication' }
        ],
        responseFormat: `{
  "authenticated": true,
  "user_id": "user_abc123",
  "expires_at": "2026-01-25T10:00:00Z"
}`,
        codeExamples: [
          {
            language: 'curl',
            code: `curl https://api.nanosatview.com/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`
          },
          {
            language: 'python',
            code: `import requests

headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(
    "https://api.nanosatview.com/v1/projects",
    headers=headers
)

print(response.json())`
          },
          {
            language: 'javascript',
            code: `const response = await fetch(
  'https://api.nanosatview.com/v1/projects',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const data = await response.json();
console.log(data);`
          }
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    sections: [
      {
        id: 'list-projects',
        title: 'List Projects',
        content: 'Retrieve a list of all projects in your organization.',
        endpoint: '/v1/projects',
        parameters: [
          { name: 'Authorization', type: 'string', required: true, description: 'Bearer token for authentication' },
          { name: 'limit', type: 'integer', required: false, description: 'Number of projects to return (default: 50)' }
        ],
        responseFormat: `{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "Satellite Mission Alpha",
      "status": "active",
      "created_at": "2026-01-24T10:00:00Z"
    }
  ],
  "total": 1
}`,
        codeExamples: [
          {
            language: 'curl',
            code: `curl https://api.nanosatview.com/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`
          },
          {
            language: 'python',
            code: `import requests

response = requests.get(
    "https://api.nanosatview.com/v1/projects",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)

projects = response.json()
print(projects)`
          }
        ],
      },
    ],
  },
];

export function Documentation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documentation, setDocumentation] = useState<DocCategory[]>(initialDocumentation);
  const [selectedSection, setSelectedSection] = useState<string>('introduction');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<{ [key: string]: string }>({});
  
  // New section form state
  const [newSection, setNewSection] = useState({
    categoryId: 'getting-started',
    title: '',
    content: '',
    endpoint: '',
    type: 'api' as 'api' | 'markdown',
  });

  // Editing state for all fields
  const [editData, setEditData] = useState<{
    title: string;
    content: string;
    endpoint: string;
    parameters: Parameter[];
    responseFormat: string;
  }>({
    title: '',
    content: '',
    endpoint: '',
    parameters: [],
    responseFormat: '',
  });
  
  // Check authentication and role
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user?.isAdmin);

  const getCurrentSection = (): DocSection | undefined => {
    for (const category of documentation) {
      const section = category.sections.find(s => s.id === selectedSection);
      if (section) return section;
    }
    return undefined;
  };

  const getCurrentCategory = (): DocCategory | undefined => {
    for (const category of documentation) {
      if (category.sections.find(s => s.id === selectedSection)) {
        return category;
      }
    }
    return undefined;
  };

  // Filter sections based on search
  const getFilteredDocumentation = () => {
    if (!searchQuery.trim()) return documentation;
    
    const query = searchQuery.toLowerCase();
    return documentation.map(category => ({
      ...category,
      sections: category.sections.filter(section => 
        section.title.toLowerCase().includes(query) ||
        section.content.toLowerCase().includes(query) ||
        (section.endpoint && section.endpoint.toLowerCase().includes(query))
      )
    })).filter(category => category.sections.length > 0);
  };

  const handleEditStart = () => {
    const section = getCurrentSection();
    if (section) {
      setEditData({
        title: section.title,
        content: section.content,
        endpoint: section.endpoint || '',
        parameters: section.parameters || [],
        responseFormat: section.responseFormat || '',
      });
      setIsEditing(true);
    }
  };

  const handleEditSave = () => {
    setDocumentation(prev => prev.map(category => ({
      ...category,
      sections: category.sections.map(section =>
        section.id === selectedSection
          ? {
              ...section,
              title: editData.title,
              content: editData.content,
              endpoint: editData.endpoint,
              parameters: editData.parameters,
              responseFormat: editData.responseFormat,
            }
          : section
      ),
    })));
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleAddSection = () => {
    const id = newSection.title.toLowerCase().replace(/\s+/g, '-');
    const newDocSection: DocSection = {
      id,
      title: newSection.title,
      content: newSection.content,
      endpoint: newSection.endpoint,
      parameters: [],
      responseFormat: '',
      codeExamples: [],
      type: newSection.type,
    };

    setDocumentation(prev => prev.map(category =>
      category.id === newSection.categoryId
        ? { ...category, sections: [...category.sections, newDocSection] }
        : category
    ));

    setShowAddSectionDialog(false);
    setNewSection({ categoryId: 'getting-started', title: '', content: '', endpoint: '', type: 'api' });
    setSelectedSection(id);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setDocumentation(prev => prev.map(category => ({
        ...category,
        sections: category.sections.filter(s => s.id !== sectionId)
      })));
      
      // Select the first available section
      const firstSection = documentation[0]?.sections[0];
      if (firstSection) {
        setSelectedSection(firstSection.id);
      }
    }
  };

  const handleAddParameter = () => {
    setEditData(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { name: 'new_param', type: 'string', required: false, description: '' }
      ]
    }));
  };

  const handleUpdateParameter = (index: number, field: keyof Parameter, value: any) => {
    setEditData(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) =>
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const handleDeleteParameter = (index: number) => {
    setEditData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleAddCodeExample = () => {
    setDocumentation(prev => prev.map(category => ({
      ...category,
      sections: category.sections.map(section => {
        if (section.id === selectedSection) {
          return {
            ...section,
            codeExamples: [
              ...section.codeExamples,
              { language: 'curl', code: '# Add your code example here' }
            ]
          };
        }
        return section;
      })
    })));
  };

  const handleUpdateCodeExample = (language: string, newCode: string) => {
    setDocumentation(prev => prev.map(category => ({
      ...category,
      sections: category.sections.map(section => {
        if (section.id === selectedSection) {
          return {
            ...section,
            codeExamples: section.codeExamples.map(ex =>
              ex.language === language ? { ...ex, code: newCode } : ex
            )
          };
        }
        return section;
      })
    })));
  };

  const handleUpdateCodeLanguage = (oldLanguage: string, newLanguage: string) => {
    setDocumentation(prev => prev.map(category => ({
      ...category,
      sections: category.sections.map(section => {
        if (section.id === selectedSection) {
          return {
            ...section,
            codeExamples: section.codeExamples.map(ex =>
              ex.language === oldLanguage ? { ...ex, language: newLanguage } : ex
            )
          };
        }
        return section;
      })
    })));
  };

  const handleDeleteCodeExample = (language: string) => {
    setDocumentation(prev => prev.map(category => ({
      ...category,
      sections: category.sections.map(section => {
        if (section.id === selectedSection) {
          return {
            ...section,
            codeExamples: section.codeExamples.filter(ex => ex.language !== language)
          };
        }
        return section;
      })
    })));
  };

  const currentSection = getCurrentSection();
  const currentCategory = getCurrentCategory();
  const defaultLanguage = currentSection?.codeExamples[0]?.language || 'curl';
  const currentLanguage = selectedLanguage[selectedSection] || defaultLanguage;
  const filteredDocs = getFilteredDocumentation();

  return (
    <div className="bg-[#0a0a0a]">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-gray-300" />
            <span className="text-xl font-bold text-white font-mono">nanoSat</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white hover:bg-white/5 border border-white/20"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            {!isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="border-white/20 text-gray-300 hover:bg-white/5"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Documentation Layout */}
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-white/10 overflow-y-auto">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Book className="h-6 w-6 text-gray-300" />
              <h2 className="text-lg font-bold font-mono">API Reference</h2>
            </div>
            <p className="text-xs text-gray-500 font-mono">v1.0.0</p>
          </div>

          {/* Search Bar */}
          {isAdmin && (
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search sections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0a0a0a] border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                />
              </div>
              
              {/* Add Section Button */}
              <Button
                onClick={() => setShowAddSectionDialog(true)}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          )}

          <nav className="p-4">
            {filteredDocs.map(category => (
              <div key={category.id} className="mb-6">
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3 px-2">
                  {category.title}
                </h3>
                <ul className="space-y-1">
                  {category.sections.map(section => (
                    <li key={section.id} className="group relative">
                      <button
                        onClick={() => setSelectedSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                          selectedSection === section.id
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <ChevronRight className="h-3 w-3" />
                        {section.title}
                      </button>
                      {isAdmin && selectedSection === section.id && (
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="text-3xl font-bold font-mono mb-2 bg-[#1a1a1a] border-white/20 text-white"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold font-mono mb-2">
                      {currentSection?.title}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-mono">ENDPOINT</span>
                    <div className="h-px w-8 bg-white/10" />
                    {isEditing ? (
                      <Input
                        value={editData.endpoint}
                        onChange={(e) => setEditData({ ...editData, endpoint: e.target.value })}
                        placeholder="/v1/endpoint"
                        className="text-xs bg-[#1a1a1a] border-white/20 text-gray-400 h-6 w-64"
                      />
                    ) : (
                      <span className="text-gray-400">{currentSection?.endpoint || '/v1/' + selectedSection}</span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditStart}
                        className="border-white/20 text-gray-300 hover:bg-white/5"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Section
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditCancel}
                          className="border-white/20 text-gray-300 hover:bg-white/5"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleEditSave}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            {currentSection?.type === 'markdown' ? (
              // Markdown Blog-Style Layout
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  {isEditing ? (
                    <Textarea
                      value={editData.content}
                      onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                      className="w-full min-h-[500px] bg-[#1a1a1a] border border-white/20 rounded p-6 text-gray-300 text-sm focus:outline-none focus:border-white/40 font-mono"
                      placeholder="# Your Markdown Here\n\nWrite your content..."
                    />
                  ) : (
                    <article className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h1: ({ ...props }) => <h1 className="text-4xl font-bold text-white mb-6 mt-8 font-mono" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-3xl font-bold text-white mb-4 mt-6 font-mono" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-2xl font-bold text-white mb-3 mt-5 font-mono" {...props} />,
                          h4: ({ ...props }) => <h4 className="text-xl font-bold text-white mb-2 mt-4 font-mono" {...props} />,
                          p: ({ ...props }) => <p className="text-gray-300 mb-4 leading-7" {...props} />,
                          a: ({ ...props }) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300" {...props} />,
                          li: ({ ...props }) => <li className="text-gray-300" {...props} />,
                          code: ({ inline, ...props }: any) => 
                            inline ? (
                              <code className="bg-[#1a1a1a] text-blue-400 px-2 py-1 rounded text-sm font-mono" {...props} />
                            ) : (
                              <code className="block bg-[#1a1a1a] border border-white/10 text-gray-300 p-4 rounded my-4 overflow-x-auto font-mono text-sm" {...props} />
                            ),
                          pre: ({ ...props }) => <pre className="bg-[#1a1a1a] border border-white/10 rounded p-4 overflow-x-auto my-4" {...props} />,
                          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4" {...props} />,
                          table: ({ ...props }) => <table className="w-full border-collapse border border-white/10 my-4" {...props} />,
                          th: ({ ...props }) => <th className="border border-white/10 bg-[#1a1a1a] px-4 py-2 text-left font-mono text-white" {...props} />,
                          td: ({ ...props }) => <td className="border border-white/10 px-4 py-2 text-gray-300" {...props} />,
                          hr: ({ ...props }) => <hr className="border-white/10 my-8" {...props} />,
                          img: ({ ...props }) => <img className="rounded my-4 max-w-full" {...props} />,
                        }}
                      >
                        {currentSection.content}
                      </ReactMarkdown>
                    </article>
                  )}
                  
                  {/* Admin Badge for Markdown Pages */}
                  {isAdmin && !isEditing && (
                    <div className="mt-12 bg-[#1a1a1a] border border-blue-500/30 p-4 rounded-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-mono text-blue-400">Admin Mode</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        This is a markdown page. Click "Edit Section" to modify the content.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // API Documentation Layout (existing)
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Documentation Content */}
                <div className="space-y-6">
                  {/* Description Section */}
                  <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px w-8 bg-white/20" />
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        Description
                      </span>
                    </div>
                    
                    {isEditing ? (
                      <Textarea
                        value={editData.content}
                        onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                        className="w-full min-h-32 bg-[#0a0a0a] border border-white/20 rounded p-3 text-gray-300 text-sm focus:outline-none focus:border-white/40"
                      />
                    ) : (
                      <p className="text-gray-300 leading-relaxed">
                        {currentSection?.content}
                      </p>
                    )}
                  </div>

                  {/* Parameters Section */}
                  <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-px w-8 bg-white/20" />
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                          Parameters
                        </span>
                      </div>
                      {isAdmin && isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddParameter}
                          className="border-white/20 text-gray-300 hover:bg-white/5 h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {isEditing ? (
                        editData.parameters.map((param, index) => (
                          <div key={index} className="pb-3 border-b border-white/10 space-y-2">
                            <div className="flex items-start gap-2">
                              <Input
                                value={param.name}
                                onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                                placeholder="parameter_name"
                                className="flex-1 bg-[#0a0a0a] border-white/20 text-blue-400 font-mono text-sm"
                              />
                              <select
                                value={param.type}
                                onChange={(e) => handleUpdateParameter(index, 'type', e.target.value)}
                                className="bg-[#0a0a0a] border border-white/20 rounded px-2 py-1 text-gray-400 text-sm"
                              >
                                <option value="string">string</option>
                                <option value="integer">integer</option>
                                <option value="boolean">boolean</option>
                                <option value="object">object</option>
                                <option value="array">array</option>
                              </select>
                              <select
                                value={param.required ? 'required' : 'optional'}
                                onChange={(e) => handleUpdateParameter(index, 'required', e.target.value === 'required')}
                                className="bg-[#0a0a0a] border border-white/20 rounded px-2 py-1 text-gray-400 text-sm"
                              >
                                <option value="required">required</option>
                                <option value="optional">optional</option>
                              </select>
                              <button
                                onClick={() => handleDeleteParameter(index)}
                                className="p-1 hover:bg-red-500/20 rounded"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </button>
                            </div>
                            <Input
                              value={param.description}
                              onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                              placeholder="Parameter description"
                              className="bg-[#0a0a0a] border-white/20 text-gray-400 text-xs"
                            />
                          </div>
                        ))
                      ) : (
                        currentSection?.parameters?.map((param, index) => (
                          <div key={index} className="pb-3 border-b border-white/10 last:border-0">
                            <div className="flex items-start justify-between mb-2">
                              <code className="text-blue-400 font-mono text-sm">{param.name}</code>
                              <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                                param.required
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                {param.required ? 'required' : 'optional'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">{param.type}</p>
                            <p className="text-xs text-gray-500">{param.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Response Format */}
                  <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px w-8 bg-white/20" />
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        Response
                      </span>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={editData.responseFormat}
                        onChange={(e) => setEditData({ ...editData, responseFormat: e.target.value })}
                        placeholder='{\n  "key": "value"\n}'
                        className="w-full min-h-32 bg-[#0a0a0a] border border-white/20 rounded p-4 text-gray-300 font-mono text-xs"
                      />
                    ) : (
                      <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded">
                        <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                          {currentSection?.responseFormat || `{
  "id": "example_id",
  "status": "success"
}`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Examples */}
                <div className="space-y-6">
                  {currentSection && currentSection.codeExamples.length > 0 ? (
                    <div className="bg-[#0d1117] border border-white/10 rounded-sm overflow-hidden sticky top-24">
                      {/* Language Tabs */}
                      <div className="flex items-center gap-1 border-b border-white/10 p-2 bg-[#161b22]">
                        {currentSection.codeExamples.map(example => (
                          <div key={example.language} className="relative group">
                            {isEditing ? (
                              <input
                                value={example.language}
                                onChange={(e) => handleUpdateCodeLanguage(example.language, e.target.value)}
                                className={`px-4 py-2 text-xs font-mono rounded transition-colors bg-transparent ${
                                  currentLanguage === example.language
                                    ? 'bg-[#0d1117] text-white'
                                    : 'text-gray-400'
                                }`}
                              />
                            ) : (
                              <button
                                onClick={() => setSelectedLanguage({
                                  ...selectedLanguage,
                                  [selectedSection]: example.language
                                })}
                                className={`px-4 py-2 text-xs font-mono rounded transition-colors ${
                                  currentLanguage === example.language
                                    ? 'bg-[#0d1117] text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {example.language}
                              </button>
                            )}
                            {isAdmin && isEditing && (
                              <button
                                onClick={() => handleDeleteCodeExample(example.language)}
                                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500/20 rounded"
                              >
                                <X className="h-3 w-3 text-red-400" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isAdmin && (
                          <button
                            onClick={handleAddCodeExample}
                            className="px-4 py-2 text-xs font-mono rounded transition-colors text-gray-400 hover:text-white hover:bg-white/5"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Code Display/Editor */}
                      <div className="p-6">
                        {isEditing ? (
                          <Textarea
                            value={currentSection.codeExamples.find(e => e.language === currentLanguage)?.code || ''}
                            onChange={(e) => handleUpdateCodeExample(currentLanguage, e.target.value)}
                            className="w-full min-h-64 bg-[#0a0a0a] border border-white/20 rounded p-3 text-gray-300 font-mono text-sm"
                          />
                        ) : (
                          <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                            <code>
                              {currentSection.codeExamples.find(e => e.language === currentLanguage)?.code}
                            </code>
                          </pre>
                        )}
                      </div>

                      {/* Copy Button */}
                      {!isEditing && (
                        <div className="border-t border-white/10 p-3 bg-[#161b22]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-white/20 text-gray-300 hover:bg-white/5 font-mono text-xs"
                            onClick={() => {
                              const code = currentSection.codeExamples.find(e => e.language === currentLanguage)?.code;
                              if (code) {
                                navigator.clipboard.writeText(code);
                              }
                            }}
                          >
                            Copy Code
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    isAdmin && (
                      <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-sm text-center">
                        <p className="text-gray-400 mb-4">No code examples yet</p>
                        <Button
                          onClick={handleAddCodeExample}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-gray-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Code Example
                        </Button>
                      </div>
                    )
                  )}

                  {/* API Status Badge */}
                  <div className="bg-[#1a1a1a] border border-green-500/30 p-4 rounded-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-mono text-green-400">API Status: Operational</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      All systems nominal • Response time: 45ms
                    </p>
                  </div>

                  {/* Admin Badge */}
                  {isAdmin && (
                    <div className="bg-[#1a1a1a] border border-blue-500/30 p-4 rounded-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-mono text-blue-400">Admin Mode</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        You can edit all documentation fields
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Section Dialog */}
      <AddSectionModal
        isOpen={showAddSectionDialog}
        onClose={() => setShowAddSectionDialog(false)}
        onAdd={handleAddSection}
        newSection={newSection}
        setNewSection={setNewSection}
        categories={documentation}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
