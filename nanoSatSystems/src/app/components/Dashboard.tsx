import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Settings, LogOut, Check, X, Link2, PanelLeftClose, PanelLeft, Book } from 'lucide-react';
import { OrganizationSidebar } from '@/app/components/OrganizationSidebar';
import { ProjectSidebar } from '@/app/components/ProjectSidebar';
import { OrganizationView } from '@/app/components/OrganizationView';
import { DashboardHome } from '@/app/components/DashboardHome';
import { OrganizationSettings } from '@/app/components/OrganizationSettings';
import { RequirementsView } from '@/app/components/RequirementsView';
import { TimelineView } from '@/app/components/TimelineView';
import { ComponentsView } from '@/app/components/ComponentsView';
import { MembersView } from '@/app/components/MembersView';
import { UserSettings } from '@/app/components/UserSettings';
import { ViewPage } from '@/app/components/ViewPage';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { ProjectMembersDialog } from '@/app/components/ProjectMembersDialog';
import { useAuth } from '@/app/auth/AuthContext';

interface Organization {
  id: string;
  name: string;
  initials: string;
  color: string;
  inviteLink?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  organizationId: string;
  members?: Member[];
  requirements?: string[];
  timeline?: string;
  components?: string[];
}

interface JoinRequest {
  id: string;
  organizationName: string;
  timestamp: Date;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  initials: string;
}

interface OrgJoinRequest {
  id: string;
  name: string;
  email: string;
  timestamp: Date;
  initials: string;
  organizationId: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([
    { id: '2', name: 'Personal Projects', initials: 'PP', color: 'bg-green-500', inviteLink: 'personal-xyz789' },
  ]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [joinOrgName, setJoinOrgName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedProjectForMember, setSelectedProjectForMember] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [currentView, setCurrentView] = useState<'project' | 'requirements' | 'timeline' | 'components' | 'members'>('project');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('overview');
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isProjectSidebarVisible, setIsProjectSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'systems' | 'view'>('dashboard');

  // Mock members and org join requests
  const [members] = useState<Member[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', initials: 'JD' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'member', initials: 'JS' },
  ]);
  const [orgJoinRequests, setOrgJoinRequests] = useState<OrgJoinRequest[]>([]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateOrganization = () => {
    if (!newOrgName.trim()) return;

    const initials = newOrgName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newOrg: Organization = {
      id: Date.now().toString(),
      name: newOrgName,
      initials,
      color: 'bg-indigo-500',
      inviteLink: `${newOrgName.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}`,
    };

    setOrganizations([...organizations, newOrg]);
    setSelectedOrgId(newOrg.id);
    setNewOrgName('');
    setIsOrgDialogOpen(false);
    setAlertMessage(`Organization "${newOrgName}" created successfully!`);
    setShowSuccessAlert(true);
  };

  const handleSendJoinRequest = () => {
    if (!joinOrgName.trim()) return;

    const existingOrg = organizations.find(
      (org) => org.name.toLowerCase() === joinOrgName.toLowerCase()
    );

    if (existingOrg) {
      const newRequest: JoinRequest = {
        id: Date.now().toString(),
        organizationName: existingOrg.name,
        timestamp: new Date(),
      };
      setJoinRequests([...joinRequests, newRequest]);
      setJoinOrgName('');
      setAlertMessage(`Join request sent to "${existingOrg.name}". Waiting for approval...`);
      setShowSuccessAlert(true);
    } else {
      setAlertMessage(`Organization "${joinOrgName}" not found. Please check the name and try again.`);
      setShowSuccessAlert(true);
    }
  };

  const handleJoinViaLink = () => {
    if (!inviteLink.trim()) return;

    const org = organizations.find((org) => org.inviteLink === inviteLink);

    if (org) {
      setSelectedOrgId(org.id);
      setInviteLink('');
      setIsOrgDialogOpen(false);
      setAlertMessage(`Successfully joined "${org.name}"!`);
      setShowSuccessAlert(true);
    } else {
      setAlertMessage('Invalid invite link. Please check and try again.');
      setShowSuccessAlert(true);
    }
  };

  const handleRemoveRequest = (requestId: string) => {
    setJoinRequests(joinRequests.filter((req) => req.id !== requestId));
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !selectedOrgId) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date(),
      organizationId: selectedOrgId,
      members: members,
    };

    setProjects([...projects, newProject]);
    setSelectedProjectId(newProject.id);
    setNewProjectName('');
    setNewProjectDescription('');
    setIsProjectDialogOpen(false);
    setAlertMessage(`Project "${newProjectName}" created successfully!`);
    setShowSuccessAlert(true);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  const handleApproveJoinRequest = (requestId: string) => {
    setOrgJoinRequests(orgJoinRequests.filter((req) => req.id !== requestId));
    setAlertMessage('Join request approved!');
    setShowSuccessAlert(true);
  };

  const handleRejectJoinRequest = (requestId: string) => {
    setOrgJoinRequests(orgJoinRequests.filter((req) => req.id !== requestId));
    setAlertMessage('Join request rejected.');
    setShowSuccessAlert(true);
  };

  const handleRemoveMember = (memberId: string) => {
    setAlertMessage('Member removed from organization.');
    setShowSuccessAlert(true);
  };

  const handleOpenAddMember = (projectId: string) => {
    setSelectedProjectForMember(projectId);
    setIsAddMemberDialogOpen(true);
  };

  const handleViewMembers = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectForMember(projectId);
    setCurrentView('members');
  };

  const handleAddMemberToProject = (memberId: string) => {
    if (!selectedProjectForMember) return;

    const memberToAdd = members.find((m) => m.id === memberId);
    if (!memberToAdd) return;

    setProjects(projects.map((project) => {
      if (project.id === selectedProjectForMember) {
        const currentMembers = project.members || [];
        // Check if member already exists
        if (!currentMembers.find((m) => m.id === memberToAdd.id)) {
          return {
            ...project,
            members: [...currentMembers, memberToAdd],
          };
        }
      }
      return project;
    }));
    setAlertMessage(`${memberToAdd.name} added to project!`);
    setShowSuccessAlert(true);
  };

  const handleRemoveMemberFromProject = (memberId: string) => {
    if (!selectedProjectForMember) return;

    const memberToRemove = members.find((m) => m.id === memberId);
    
    setProjects(projects.map((project) => {
      if (project.id === selectedProjectForMember) {
        const currentMembers = project.members || [];
        return {
          ...project,
          members: currentMembers.filter((m) => m.id !== memberId),
        };
      }
      return project;
    }));
    
    if (memberToRemove) {
      setAlertMessage(`${memberToRemove.name} removed from project!`);
      setShowSuccessAlert(true);
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !selectedProjectForMember) return;

    // Find a member from the organization to add to the project
    const memberToAdd = members.find((m) => m.email.toLowerCase() === newMemberEmail.toLowerCase());

    if (memberToAdd) {
      setProjects(projects.map((project) => {
        if (project.id === selectedProjectForMember) {
          const currentMembers = project.members || [];
          // Check if member already exists
          if (!currentMembers.find((m) => m.id === memberToAdd.id)) {
            return {
              ...project,
              members: [...currentMembers, memberToAdd],
            };
          }
        }
        return project;
      }));
      setAlertMessage(`Member ${memberToAdd.name} added to project!`);
      setShowSuccessAlert(true);
    } else {
      setAlertMessage('Member not found in organization. Please invite them first.');
      setShowSuccessAlert(true);
    }

    setNewMemberEmail('');
    setIsAddMemberDialogOpen(false);
    setSelectedProjectForMember(null);
  };

  const handleOpenAddRequirements = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('requirements');
  };

  const handleAddRequirementInView = (requirement: string) => {
    if (!selectedProjectId) return;

    setProjects(projects.map((project) => {
      if (project.id === selectedProjectId) {
        const currentRequirements = project.requirements || [];
        return {
          ...project,
          requirements: [...currentRequirements, requirement],
        };
      }
      return project;
    }));

    setAlertMessage('Requirement added successfully!');
    setShowSuccessAlert(true);
  };

  const handleRemoveRequirement = (index: number) => {
    if (!selectedProjectId) return;

    setProjects(projects.map((project) => {
      if (project.id === selectedProjectId) {
        const currentRequirements = project.requirements || [];
        return {
          ...project,
          requirements: currentRequirements.filter((_, i) => i !== index),
        };
      }
      return project;
    }));

    setAlertMessage('Requirement removed successfully!');
    setShowSuccessAlert(true);
  };

  const handleOpenAddTimeline = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('timeline');
  };

  const handleOpenOperationalFlow = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project');
    setActiveProjectTab('flow'); // Set the tab to 'flow' (Operational Flow)
  };

  const handleSaveTimelineInView = (timeline: string) => {
    if (!selectedProjectId) return;

    setProjects(projects.map((project) => {
      if (project.id === selectedProjectId) {
        return {
          ...project,
          timeline,
        };
      }
      return project;
    }));

    setAlertMessage('Timeline updated successfully!');
    setShowSuccessAlert(true);
  };

  const handleOpenAddComponents = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('components');
  };

  const handleAddComponentInView = (component: string) => {
    if (!selectedProjectId) return;

    setProjects(projects.map((project) => {
      if (project.id === selectedProjectId) {
        const currentComponents = project.components || [];
        return {
          ...project,
          components: [...currentComponents, component],
        };
      }
      return project;
    }));

    setAlertMessage('Component added successfully!');
    setShowSuccessAlert(true);
  };

  const handleRemoveComponent = (index: number) => {
    if (!selectedProjectId) return;

    setProjects(projects.map((project) => {
      if (project.id === selectedProjectId) {
        const currentComponents = project.components || [];
        return {
          ...project,
          components: currentComponents.filter((_, i) => i !== index),
        };
      }
      return project;
    }));

    setAlertMessage('Component removed successfully!');
    setShowSuccessAlert(true);
  };

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
  const currentProjects = projects.filter((p) => p.organizationId === selectedOrgId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const currentOrgJoinRequests = orgJoinRequests.filter((req) => req.organizationId === selectedOrgId);

  return (
    <div className="h-screen flex overflow-hidden bg-[#1a1a1a]">
      {/* Organization Sidebar */}
      <OrganizationSidebar
        organizations={organizations}
        selectedOrgId={selectedOrgId}
        onSelectOrg={(id) => {
          setSelectedOrgId(id);
          setSelectedProjectId(null);
        }}
        onSelectHome={() => {
          setSelectedOrgId(null);
          setSelectedProjectId(null);
        }}
        onCreateOrg={() => setIsOrgDialogOpen(true)}
      />

      {/* Project Sidebar */}
      {selectedOrg && isProjectSidebarVisible && (
        <ProjectSidebar
          organizationName={selectedOrg.name}
          projects={currentProjects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setCurrentView('project');
            setActiveProjectTab('overview'); // Reset to overview when clicking project name
          }}
          onCreateProject={() => setIsProjectDialogOpen(true)}
          onDeleteProject={handleDeleteProject}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onAddMember={handleOpenAddMember}
          onViewMembers={handleViewMembers}
          onAddRequirements={handleOpenAddRequirements}
          onAddTimeline={handleOpenAddTimeline}
          onOpenOperationalFlow={handleOpenOperationalFlow}
          onAddComponents={handleOpenAddComponents}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-[#1a1a1a] border-b border-white/10 px-4 py-3 flex items-center justify-between relative overflow-hidden">
          {/* Film Grain Texture */}
          <div 
            className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="flex items-center gap-2 relative z-10">
            {selectedOrg && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsProjectSidebarVisible(!isProjectSidebarVisible)}
                      className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 font-mono rounded-none"
                    >
                      {isProjectSidebarVisible ? (
                        <PanelLeftClose className="h-4 w-4" />
                      ) : (
                        <PanelLeft className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1a1a1a] border-white/10 text-white font-mono">
                    <p>{isProjectSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {joinRequests.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span className="text-sm text-amber-400 font-mono">
                  {joinRequests.length} Pending Request{joinRequests.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/documentation')}
              className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 font-mono rounded-none"
            >
              <Book className="h-4 w-4" />
              Docs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUserSettingsOpen(true)}
              className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 font-mono rounded-none"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 font-mono rounded-none"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Organization Content */}
        {selectedOrg ? (
          currentView === 'requirements' && selectedProject ? (
            <RequirementsView
              projectName={selectedProject.name}
              requirements={selectedProject.requirements || []}
              onAddRequirement={handleAddRequirementInView}
              onRemoveRequirement={handleRemoveRequirement}
            />
          ) : currentView === 'timeline' && selectedProject ? (
            <TimelineView
              projectName={selectedProject.name}
              timeline={selectedProject.timeline || ''}
              onSaveTimeline={handleSaveTimelineInView}
            />
          ) : currentView === 'components' && selectedProject ? (
            <ComponentsView
              projectName={selectedProject.name}
              components={selectedProject.components || []}
              onAddComponent={handleAddComponentInView}
              onRemoveComponent={handleRemoveComponent}
            />
          ) : currentView === 'members' && selectedProject ? (
            <MembersView
              projectName={selectedProject.name}
              members={selectedProject.members || []}
              availableMembers={members}
              onAddMember={handleAddMemberToProject}
              onRemoveMember={handleRemoveMemberFromProject}
            />
          ) : (
            <OrganizationView 
              project={selectedProject || null} 
              activeTab={activeProjectTab}
              onTabChange={setActiveProjectTab}
            />
          )
        ) : (
          <DashboardHome />
        )}
      </div>

      {/* Create/Join Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Organization</DialogTitle>
            <DialogDescription>
              Create a new organization or join an existing one
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="join">Join</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Inc."
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateOrganization();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization}>Create Organization</Button>
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-org-name">Request to Join</Label>
                  <div className="flex gap-2">
                    <Input
                      id="join-org-name"
                      placeholder="Organization name"
                      value={joinOrgName}
                      onChange={(e) => setJoinOrgName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendJoinRequest();
                        }
                      }}
                    />
                    <Button onClick={handleSendJoinRequest}>Send Request</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send a join request to an organization admin
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-link">Join via Invite Link</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invite-link"
                        placeholder="paste-invite-link-here"
                        value={inviteLink}
                        onChange={(e) => setInviteLink(e.target.value)}
                        className="pl-9"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleJoinViaLink();
                          }
                        }}
                      />
                    </div>
                    <Button onClick={handleJoinViaLink}>Join</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use an invite link to join instantly
                  </p>
                </div>

                {joinRequests.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label>Pending Requests</Label>
                    <div className="space-y-2">
                      {joinRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{request.organizationName}</p>
                            <p className="text-xs text-muted-foreground">
                              Sent {request.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRequest(request.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Awesome Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                placeholder="A brief description of your project"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Project</DialogTitle>
            <DialogDescription>
              Add a member to {selectedProjectForMember ? projects.find((p) => p.id === selectedProjectForMember)?.name : 'the project'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">Member Email</Label>
              <Input
                id="member-email"
                placeholder="member@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleAddMember();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Organization Settings */}
      {selectedOrg && (
        <OrganizationSettings
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          organizationName={selectedOrg.name}
          inviteLink={selectedOrg.inviteLink || ''}
          members={members}
          joinRequests={currentOrgJoinRequests}
          onApproveRequest={handleApproveJoinRequest}
          onRejectRequest={handleRejectJoinRequest}
          onRemoveMember={handleRemoveMember}
          onOpenAddMember={handleOpenAddMember}
        />
      )}

      {/* User Settings */}
      <UserSettings
        open={isUserSettingsOpen}
        onOpenChange={setIsUserSettingsOpen}
      />

      {/* Project Members Dialog */}
      {selectedProjectForMember && (
        <ProjectMembersDialog
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          projectName={projects.find((p) => p.id === selectedProjectForMember)?.name || ''}
          members={projects.find((p) => p.id === selectedProjectForMember)?.members || []}
          availableMembers={members}
          onAddMember={handleAddMemberToProject}
          onRemoveMember={handleRemoveMemberFromProject}
        />
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Alert className="max-w-md bg-slate-900 border-slate-700 text-white">
            <Check className="h-4 w-4" />
            <AlertDescription>{alertMessage}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setShowSuccessAlert(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        </div>
      )}
    </div>
  );
}
