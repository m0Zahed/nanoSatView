import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Settings, LogOut, Check, X, Link2, PanelLeftClose, PanelLeft, Book, Activity } from 'lucide-react';
import { OrganizationSidebar } from '@/app/components/OrganizationSidebar';
import { ProjectSidebar } from '@/app/components/ProjectSidebar';
import { OrganizationView } from '@/app/components/OrganizationView';
import { DashboardHome } from '@/app/components/DashboardHome';
import { OrganizationSettings } from '@/app/components/OrganizationSettings';
import { RequirementsView } from '@/app/components/RequirementsView';
import { TimelineView } from '@/app/components/TimelineView';
import { ComponentsView } from '@/app/components/ComponentsView';
import { MembersView } from '@/app/components/MembersView';
import { DocumentManager } from '@/app/components/DocumentManager';
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
import { canAccessKafkaMonitor } from '@/app/utils/kafkaMonitorAccess';
import { useAuth, type User } from '@/app/auth/AuthContext';
import {
  createRequirement as apiCreateRequirement,
  deleteRequirement as apiDeleteRequirement,
  fetchProjectRequirements,
  type ProjectRequirement,
  type RequirementPayload,
} from '@/app/api/requirements';
import {
  createComponent as apiCreateComponent,
  deleteComponent as apiDeleteComponent,
  fetchProjectComponentEvents,
  fetchProjectComponents,
  updateComponent as apiUpdateComponent,
  type ComponentAuditEvent,
  type ProjectComponent,
  type ProjectComponentEditorPayload,
} from '@/app/api/components';
import {
  createOrganization as apiCreateOrganization,
  createProject as apiCreateProject,
  deleteProject as apiDeleteProject,
  fetchProjects,
  joinOrganization as apiJoinOrganization,
  fetchOrganizationsWithProjects,
  OrganizationMember as ApiOrganizationMember,
  Project as ApiProject,
  OrganizationProjects as ApiOrganizationProjects,
} from '@/app/api/projects';

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
  personalProject?: boolean;
  members?: Member[];
  requirements?: ProjectRequirement[];
  timeline?: string;
  components?: ProjectComponent[];
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

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function normalizeRole(role: unknown): 'admin' | 'member' {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'member';
}

function mapApiMemberToMember(raw: ApiOrganizationMember): Member | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id) {
    return null;
  }
  const displayName =
    (typeof raw.name === 'string' && raw.name.trim()) ||
    (typeof raw.fullName === 'string' && raw.fullName.trim()) ||
    (typeof raw.username === 'string' && raw.username.trim()) ||
    (typeof raw.email === 'string' && raw.email.trim()) ||
    'Unknown Member';
  const email = typeof raw.email === 'string' && raw.email ? raw.email : `${raw.id}@unknown.local`;
  const initials =
    (typeof raw.initials === 'string' && raw.initials.trim()) || getInitials(displayName || email || raw.id);

  return {
    id: raw.id,
    name: displayName,
    email,
    role: normalizeRole(raw.organizationRole ?? raw.role),
    initials,
  };
}

function createCurrentUserMember(user: User | null): Member | null {
  if (!user?.id) {
    return null;
  }
  const name = user.fullName?.trim() || user.username?.trim() || user.email;
  return {
    id: user.id,
    name,
    email: user.email,
    role: user.isAdmin ? 'admin' : 'member',
    initials: getInitials(name),
  };
}

export function Dashboard() {
  const isKafkaMonitorAvailable = canAccessKafkaMonitor();
  const navigate = useNavigate();


  const { signOut, user } = useAuth();

  // Organizations 
  const [organizations, setOrganizations] = useState<Organization[]>([
    { id: 'personal', name: 'Personal Projects', initials: 'PP', color: 'bg-green-500', inviteLink: 'personal-xyz789' },
  ]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>('personal');
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);

  // Projects  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Project 
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Create Organisation or Project
  const [newOrgName, setNewOrgName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  // Join organisation
  const [joinOrgName, setJoinOrgName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Member cobfigurations
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedProjectForMember, setSelectedProjectForMember] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  // Nabigation states
  const [currentView, setCurrentView] = useState<'project' | 'requirements' | 'timeline' | 'components' | 'members' | 'documents'>('project');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('overview');
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isProjectSidebarVisible, setIsProjectSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'systems' | 'view'>('dashboard');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [requirementsLoadedByProject, setRequirementsLoadedByProject] = useState<Record<string, boolean>>({});
  const [requirementsLoadingByProject, setRequirementsLoadingByProject] = useState<Record<string, boolean>>({});
  const [requirementsErrorByProject, setRequirementsErrorByProject] = useState<Record<string, string | null>>({});
  const [componentsLoadedByProject, setComponentsLoadedByProject] = useState<Record<string, boolean>>({});
  const [componentsLoadingByProject, setComponentsLoadingByProject] = useState<Record<string, boolean>>({});
  const [componentsErrorByProject, setComponentsErrorByProject] = useState<Record<string, string | null>>({});
  const [componentEventsByProject, setComponentEventsByProject] = useState<Record<string, ComponentAuditEvent[]>>({});
  const [componentEventsLoadingByProject, setComponentEventsLoadingByProject] = useState<Record<string, boolean>>({});

  // Organization member directory
  const [members, setMembers] = useState<Member[]>([]);
  const [orgJoinRequests, setOrgJoinRequests] = useState<OrgJoinRequest[]>([]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const currentUserMember = createCurrentUserMember(user);
    if (currentUserMember) {
      setMembers([currentUserMember]);
    } else {
      setMembers([]);
    }
  }, [user]);

  // Load projects from API
  useEffect(() => {
    const load = async () => {
      setIsLoadingProjects(true);
      try {
        const userId = currentUserId;
        if (!userId) {
          return;
        }

        // Fetch organizations for a particular member
        const { status, data } = await fetchOrganizationsWithProjects(userId);
        if (status === 200 && Array.isArray(data)) {
          const orgProjects = data as ApiOrganizationProjects[];

          const memberMap = new Map<string, Member>();
          const upsertMember = (candidate: Member | null) => {
            if (!candidate?.id) {
              return;
            }
            if (!memberMap.has(candidate.id)) {
              memberMap.set(candidate.id, candidate);
              return;
            }
            const existing = memberMap.get(candidate.id)!;
            memberMap.set(candidate.id, {
              ...existing,
              ...candidate,
              role: existing.role === 'admin' || candidate.role === 'admin' ? 'admin' : 'member',
            });
          };

          upsertMember(createCurrentUserMember(user));

          for (const op of orgProjects) {
            const orgCandidates = [...(op.members || []), ...(op.organizationMembers || [])];
            for (const candidate of orgCandidates) {
              upsertMember(mapApiMemberToMember(candidate));
            }
            for (const project of op.projects) {
              for (const candidate of project.members || []) {
                upsertMember(mapApiMemberToMember(candidate));
              }
            }
          }

          for (const op of orgProjects) {
            for (const project of op.projects) {
              for (const memberId of project.memberIds || []) {
                if (!memberMap.has(memberId)) {
                  const isCurrentUser =
                    memberId === user?.id || memberId === user?.email || memberId === currentUserId;
                  const currentUserMember = isCurrentUser ? createCurrentUserMember(user) : null;
                  upsertMember(
                    currentUserMember || {
                      id: memberId,
                      name: memberId,
                      email: `${memberId}@unknown.local`,
                      role: 'member',
                      initials: getInitials(memberId),
                    }
                  );
                }
              }
            }
          }

          const refreshedMembers = Array.from(memberMap.values());
          setMembers(refreshedMembers);

          const mappedProjects: Project[] = orgProjects.flatMap((op) =>
            op.projects.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              createdAt: new Date(p.createdAt),
              organizationId: p.organizationId || op.organizationId || 'personal',
              personalProject: p.personalProject || (p.organizationId || op.organizationId) === 'personal',
              members: (p.memberIds || [])
                .map((memberId) => memberMap.get(memberId))
                .filter((member): member is Member => Boolean(member)),
              requirements: [],
              timeline: p.timelineId || '',
              components: [],
            }))
          );

          const getOrganizationName = (op: ApiOrganizationProjects, orgId: string) => {
            if (orgId === 'personal') {
              return 'Personal Projects';
            }

            const opWithVariants = op as ApiOrganizationProjects & {
              name?: string;
              title?: string;
              organization_name?: string;
              organizationTitle?: string;
              organisationName?: string;
            };

            const projectLevelName = op.projects
              .map((project) => {
                const projectWithVariants = project as ApiProject & {
                  organizationName?: string;
                  orgName?: string;
                  organisationName?: string;
                  organization_name?: string;
                  organizationTitle?: string;
                  organization?: { name?: string };
                };
                return (
                  (typeof projectWithVariants.organizationName === 'string' &&
                    projectWithVariants.organizationName.trim()) ||
                  (typeof projectWithVariants.orgName === 'string' && projectWithVariants.orgName.trim()) ||
                  (typeof projectWithVariants.organisationName === 'string' &&
                    projectWithVariants.organisationName.trim()) ||
                  (typeof projectWithVariants.organization_name === 'string' &&
                    projectWithVariants.organization_name.trim()) ||
                  (typeof projectWithVariants.organizationTitle === 'string' &&
                    projectWithVariants.organizationTitle.trim()) ||
                  (typeof projectWithVariants.organization?.name === 'string' &&
                    projectWithVariants.organization.name.trim()) ||
                  ''
                );
              })
              .find(Boolean);

            const fromPayload =
              (typeof opWithVariants.name === 'string' && opWithVariants.name.trim()) ||
              (typeof opWithVariants.title === 'string' && opWithVariants.title.trim()) ||
              (typeof op.organizationName === 'string' && op.organizationName.trim()) ||
              (typeof op.orgName === 'string' && op.orgName.trim()) ||
              (typeof opWithVariants.organization_name === 'string' && opWithVariants.organization_name.trim()) ||
              (typeof opWithVariants.organizationTitle === 'string' && opWithVariants.organizationTitle.trim()) ||
              (typeof opWithVariants.organisationName === 'string' && opWithVariants.organisationName.trim()) ||
              (typeof op.organization?.name === 'string' && op.organization.name.trim()) ||
              projectLevelName ||
              organizations.find((org) => org.id === orgId)?.name ||
              '';

            return fromPayload || 'Unnamed Organization';
          };

          const mappedOrganizations: Organization[] = orgProjects.map((op) => {
            const orgId = op.organizationId || 'personal';
            const name = getOrganizationName(op, orgId);
            const initials = name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return {
              id: orgId,
              name,
              initials,
              color: 'bg-indigo-500',
            };
          });

          // ================ set the Organisation state and  Projects states ==========
          setOrganizations(mappedOrganizations.length > 0 ? mappedOrganizations : organizations);
          setProjects(mappedProjects);

          if (!selectedOrgId && mappedOrganizations.length > 0) {
            setSelectedOrgId(mappedOrganizations[0].id);
          }
          return;
        }

        // fallback to existing fetch if new endpoint fails
        const { status: fallbackStatus, data: fallbackData } = await fetchProjects();
        if (fallbackStatus === 200 && Array.isArray(fallbackData)) {
          const currentUserMember = createCurrentUserMember(user);
          if (currentUserMember) {
            setMembers([currentUserMember]);
          }
          const mapped: Project[] = (fallbackData as ApiProject[]).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            createdAt: new Date(p.createdAt),
            organizationId: p.organizationId || 'personal',
            personalProject: p.personalProject || p.organizationId === 'personal',
            members: currentUserMember ? [currentUserMember] : [],
            requirements: [],
            timeline: p.timelineId || '',
            components: [],
          }));
          setProjects(mapped);
        }
      } finally {
        setIsLoadingProjects(false);
      }
    };
    if (user) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const currentUserId = useMemo(() => user?.id ?? user?.email ?? 'me', [user]);
  const currentUserName = useMemo(
    () => user?.fullName?.trim() || user?.username?.trim() || user?.email || 'Unknown User',
    [user]
  );

  const loadRequirementsForProject = async (projectId: string) => {
    setRequirementsLoadingByProject((previous) => ({ ...previous, [projectId]: true }));
    setRequirementsErrorByProject((previous) => ({ ...previous, [projectId]: null }));

    const { status, data } = await fetchProjectRequirements(projectId);
    if (status === 200 && Array.isArray(data)) {
      const projectRequirements = data as ProjectRequirement[];
      setProjects((previous) =>
        previous.map((project) =>
          project.id === projectId
            ? {
                ...project,
                requirements: projectRequirements,
              }
            : project
        )
      );
      setRequirementsLoadedByProject((previous) => ({ ...previous, [projectId]: true }));
      setRequirementsLoadingByProject((previous) => ({ ...previous, [projectId]: false }));
      return;
    }

    const errorMessage =
      data && typeof data === 'object' && 'error' in data && data.error && typeof data.error === 'object' && 'message' in data.error
        ? String(data.error.message)
        : 'Failed to load requirements.';

    setRequirementsErrorByProject((previous) => ({ ...previous, [projectId]: errorMessage }));
    setRequirementsLoadingByProject((previous) => ({ ...previous, [projectId]: false }));
  };

  const loadComponentsForProject = async (projectId: string) => {
    setComponentsLoadingByProject((previous) => ({ ...previous, [projectId]: true }));
    setComponentsErrorByProject((previous) => ({ ...previous, [projectId]: null }));

    const { status, data } = await fetchProjectComponents(projectId);
    if (status === 200 && Array.isArray(data)) {
      const projectComponents = data as ProjectComponent[];
      setProjects((previous) =>
        previous.map((project) =>
          project.id === projectId
            ? {
                ...project,
                components: projectComponents,
              }
            : project
        )
      );
      setComponentsLoadedByProject((previous) => ({ ...previous, [projectId]: true }));
      setComponentsLoadingByProject((previous) => ({ ...previous, [projectId]: false }));
      return;
    }

    const errorMessage =
      data && typeof data === 'object' && 'error' in data && data.error && typeof data.error === 'object' && 'message' in data.error
        ? String(data.error.message)
        : 'Failed to load components.';

    setComponentsErrorByProject((previous) => ({ ...previous, [projectId]: errorMessage }));
    setComponentsLoadingByProject((previous) => ({ ...previous, [projectId]: false }));
  };

  const loadComponentEventsForProject = async (projectId: string) => {
    setComponentEventsLoadingByProject((previous) => ({ ...previous, [projectId]: true }));

    const { status, data } = await fetchProjectComponentEvents(projectId);
    if (status === 200 && Array.isArray(data)) {
      setComponentEventsByProject((previous) => ({ ...previous, [projectId]: data as ComponentAuditEvent[] }));
      setComponentEventsLoadingByProject((previous) => ({ ...previous, [projectId]: false }));
      return;
    }

    setComponentEventsLoadingByProject((previous) => ({ ...previous, [projectId]: false }));
  };

  useEffect(() => {
    if (
      !selectedProjectId ||
      requirementsLoadedByProject[selectedProjectId] ||
      requirementsLoadingByProject[selectedProjectId] ||
      requirementsErrorByProject[selectedProjectId]
    ) {
      return;
    }

    const selectedProjectExists = projects.some((project) => project.id === selectedProjectId);
    if (!selectedProjectExists) {
      return;
    }

    void loadRequirementsForProject(selectedProjectId);
  }, [projects, requirementsErrorByProject, requirementsLoadedByProject, requirementsLoadingByProject, selectedProjectId]);

  useEffect(() => {
    if (
      currentView !== 'components' ||
      !selectedProjectId ||
      componentsLoadedByProject[selectedProjectId] ||
      componentsLoadingByProject[selectedProjectId] ||
      componentsErrorByProject[selectedProjectId]
    ) {
      return;
    }

    const selectedProjectExists = projects.some((project) => project.id === selectedProjectId);
    if (!selectedProjectExists) {
      return;
    }

    void loadComponentsForProject(selectedProjectId);
    void loadComponentEventsForProject(selectedProjectId);
  }, [
    componentsErrorByProject,
    componentsLoadedByProject,
    componentsLoadingByProject,
    currentView,
    projects,
    selectedProjectId,
  ]);

  useEffect(() => {
    if (!selectedProjectId || currentView !== 'components') {
      return;
    }

    void loadComponentsForProject(selectedProjectId);
    void loadComponentEventsForProject(selectedProjectId);
    void loadRequirementsForProject(selectedProjectId);

    const intervalId = window.setInterval(() => {
      void loadComponentsForProject(selectedProjectId);
      void loadComponentEventsForProject(selectedProjectId);
      void loadRequirementsForProject(selectedProjectId);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [currentView, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || currentView !== 'requirements') {
      return;
    }

    void loadRequirementsForProject(selectedProjectId);

    const intervalId = window.setInterval(() => {
      void loadRequirementsForProject(selectedProjectId);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [currentView, selectedProjectId]);
  
  // Create a new organisation 
  const handleCreateOrganization = async () => {
    const orgName = newOrgName.trim();
    if (!orgName) return;

    const { status, data } = await apiCreateOrganization({ name: orgName, color: 'bg-indigo-500' });
    if (status !== 201 || !data || Array.isArray(data)) {
      setAlertMessage('Failed to create organization. Please try again.');
      setShowSuccessAlert(true);
      return;
    }

    const created = data as {
      id: string;
      name: string;
      initials?: string;
      color?: string;
      inviteLink?: string;
    };

    const newOrg: Organization = {
      id: created.id,
      name: created.name,
      initials: created.initials || orgName.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2),
      color: created.color || 'bg-indigo-500',
      inviteLink: created.inviteLink,
    };

    setOrganizations((prev) => [...prev, newOrg]);
    setSelectedOrgId(newOrg.id);
    setNewOrgName('');
    setIsOrgDialogOpen(false);
    setAlertMessage(`Organization "${newOrg.name}" created successfully!`);
    setShowSuccessAlert(true);
  };
  
  // =========================== CREATE JOIN REQUESTS ====================================================
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

  const handleJoinViaLink = async () => {
    const token = inviteLink.trim();
    if (!token) return;

    const { status, data } = await apiJoinOrganization(token, currentUserId);
    if (status === 200 && data && typeof data === 'object' && 'joinedProjectIds' in data) {
      setInviteLink('');
      setIsOrgDialogOpen(false);
      setAlertMessage('Joined organization successfully.');
      setShowSuccessAlert(true);
      // Reload projects from backend to reflect all projects joined in the organization.
      const refreshed = await fetchOrganizationsWithProjects(currentUserId);
      if (refreshed.status === 200 && Array.isArray(refreshed.data)) {
        const orgProjects = refreshed.data as ApiOrganizationProjects[];
        const mappedProjects: Project[] = orgProjects.flatMap((op) =>
          op.projects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            createdAt: new Date(p.createdAt),
            organizationId: p.organizationId || op.organizationId || 'personal',
            personalProject: p.personalProject || (p.organizationId || op.organizationId) === 'personal',
            members: members,
            requirements: [],
            timeline: p.timelineId || '',
            components: [],
          }))
        );
        setProjects(mappedProjects);
      }
    } else {
      setAlertMessage('Invalid or expired invite link.');
      setShowSuccessAlert(true);
    }
  };

  const handleRemoveRequest = (requestId: string) => {
    setJoinRequests(joinRequests.filter((req) => req.id !== requestId));
  };
  
  /**
   * handleCreateProject: 
   * 
   * 
   * 
   * 
   * 
   */
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const payload = {
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      owner: currentUserId,
      isPublic: false,
      organizationId: selectedOrgId ?? 'personal',
      personalProject: (selectedOrgId ?? 'personal') === 'personal',
      componentsListId: '',
      timelineId: '',
      integrationsId: '',
      documentIds: [],
      memberIds: [currentUserId],
    };

    const { status, data } = await apiCreateProject(payload);
    if (status === 201 && data && typeof data === 'object' && 'id' in data) {
      const projData = data as ApiProject;
      const newProject: Project = {
        id: projData.id,
        name: projData.name,
        description: projData.description,
        createdAt: new Date(projData.createdAt),
        organizationId: projData.organizationId || selectedOrgId || 'personal',
        personalProject: projData.personalProject || projData.organizationId === 'personal',
        members: members,
        requirements: [],
        timeline: projData.timelineId || '',
        components: [],
      };
      
      // Set the projects list
      setProjects([...projects, newProject]);
      setSelectedProjectId(newProject.id);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsProjectDialogOpen(false);
      setAlertMessage(`Project "${newProjectName}" created successfully!`);
      setShowSuccessAlert(true);
    } else {
      setAlertMessage('Failed to create project.');
      setShowSuccessAlert(true);
    }
  };
  
  /**
   * Delete Project
   *
   */
  const handleDeleteProject = async (projectId: string) => {
    const prev = projects;
    setProjects(projects.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    const { status } = await apiDeleteProject(projectId);
    if (status !== 204) {
      setProjects(prev);
      setAlertMessage('Failed to delete project.');
      setShowSuccessAlert(true);
    }
  };
  
  /**
   *  Approve join request  
   *
   */
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
    setRequirementsLoadedByProject((previous) => ({ ...previous, [projectId]: false }));
    setRequirementsErrorByProject((previous) => ({ ...previous, [projectId]: null }));
    setSelectedProjectId(projectId);
    setCurrentView('requirements');
  };
  
  const handleAddRequirementInView = async (requirement: RequirementPayload) => {
    if (!selectedProjectId) {
      return false;
    }

    const { status, data } = await apiCreateRequirement({
      ...requirement,
      projectId: selectedProjectId,
    });

    if (status === 201 && data && typeof data === 'object' && 'id' in data) {
      const createdRequirement = data as ProjectRequirement;
      setProjects((previous) =>
        previous.map((project) => {
          if (project.id !== selectedProjectId) {
            return project;
          }
          const currentRequirements = project.requirements || [];
          return {
            ...project,
            requirements: [...currentRequirements, createdRequirement],
          };
        })
      );
      setRequirementsLoadedByProject((previous) => ({ ...previous, [selectedProjectId]: true }));
      setAlertMessage('Requirement added successfully!');
      setShowSuccessAlert(true);
      return true;
    }

    setAlertMessage('Failed to add requirement.');
    setShowSuccessAlert(true);
    return false;
  };

  const handleRemoveRequirement = async (requirementId: string) => {
    if (!selectedProjectId) {
      return false;
    }

    const { status } = await apiDeleteRequirement(requirementId);
    if (status === 204) {
      setProjects((previous) =>
        previous.map((project) => {
          if (project.id !== selectedProjectId) {
            return project;
          }
          return {
            ...project,
            requirements: (project.requirements || []).filter((requirement) => requirement.id !== requirementId),
          };
        })
      );
      void loadComponentsForProject(selectedProjectId);
      setAlertMessage('Requirement removed successfully!');
      setShowSuccessAlert(true);
      return true;
    }

    setAlertMessage('Failed to remove requirement.');
    setShowSuccessAlert(true);
    return false;
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

  const handleOpenDocumentManager = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('documents');
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
    setRequirementsLoadedByProject((previous) => ({ ...previous, [projectId]: false }));
    setRequirementsErrorByProject((previous) => ({ ...previous, [projectId]: null }));
    setComponentsLoadedByProject((previous) => ({ ...previous, [projectId]: false }));
    setComponentsErrorByProject((previous) => ({ ...previous, [projectId]: null }));
    setSelectedProjectId(projectId);
    setCurrentView('components');
  };

  const handleAddComponentInView = async (component: ProjectComponentEditorPayload) => {
    if (!selectedProjectId) {
      return false;
    }

    const { status, data } = await apiCreateComponent({
      ...component,
      projectId: selectedProjectId,
      editorId: currentUserId,
      editorName: currentUserName,
    });

    if (status === 201 && data && typeof data === 'object' && 'id' in data) {
      const createdComponent = data as ProjectComponent;
      setProjects((previous) =>
        previous.map((project) => {
          if (project.id !== selectedProjectId) {
            return project;
          }
          const currentComponents = project.components || [];
          return {
            ...project,
            components: [createdComponent, ...currentComponents],
          };
        })
      );
      setComponentsLoadedByProject((previous) => ({ ...previous, [selectedProjectId]: true }));
      void loadRequirementsForProject(selectedProjectId);
      void loadComponentEventsForProject(selectedProjectId);
      setAlertMessage('Component added successfully!');
      setShowSuccessAlert(true);
      return true;
    }

    setAlertMessage('Failed to add component.');
    setShowSuccessAlert(true);
    return false;
  };

  const handleUpdateComponentInView = async (componentId: string, component: ProjectComponentEditorPayload) => {
    if (!selectedProjectId) {
      return false;
    }

    const { status, data } = await apiUpdateComponent(componentId, {
      ...component,
      projectId: selectedProjectId,
      editorId: currentUserId,
      editorName: currentUserName,
    });

    if (status === 200 && data && typeof data === 'object' && 'id' in data) {
      const updatedComponent = data as ProjectComponent;
      setProjects((previous) =>
        previous.map((project) => {
          if (project.id !== selectedProjectId) {
            return project;
          }
          return {
            ...project,
            components: (project.components || []).map((existingComponent) =>
              existingComponent.id === updatedComponent.id ? updatedComponent : existingComponent
            ),
          };
        })
      );
      setComponentsLoadedByProject((previous) => ({ ...previous, [selectedProjectId]: true }));
      void loadRequirementsForProject(selectedProjectId);
      void loadComponentEventsForProject(selectedProjectId);
      return true;
    }

    setAlertMessage('Failed to save component changes.');
    setShowSuccessAlert(true);
    return false;
  };

  const handleRemoveComponent = async (componentId: string) => {
    if (!selectedProjectId) {
      return false;
    }

    const { status } = await apiDeleteComponent(componentId, currentUserId, currentUserName);
    if (status === 204) {
      setProjects((previous) =>
        previous.map((project) => {
          if (project.id !== selectedProjectId) {
            return project;
          }
          return {
            ...project,
            components: (project.components || []).filter((component) => component.id !== componentId),
          };
        })
      );
      void loadRequirementsForProject(selectedProjectId);
      void loadComponentEventsForProject(selectedProjectId);
      setAlertMessage('Component removed successfully!');
      setShowSuccessAlert(true);
      return true;
    }

    setAlertMessage('Failed to remove component.');
    setShowSuccessAlert(true);
    return false;
  };

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
  const currentProjects = projects.filter((p) => p.organizationId === selectedOrgId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedProjectRequirementsLoading = selectedProjectId
    ? Boolean(requirementsLoadingByProject[selectedProjectId])
    : false;
  const selectedProjectRequirementsError = selectedProjectId
    ? requirementsErrorByProject[selectedProjectId] || null
    : null;
  const selectedProjectComponentsLoading = selectedProjectId
    ? Boolean(componentsLoadingByProject[selectedProjectId])
    : false;
  const selectedProjectComponentsError = selectedProjectId
    ? componentsErrorByProject[selectedProjectId] || null
    : null;
  const selectedProjectComponentEvents = selectedProjectId ? componentEventsByProject[selectedProjectId] || [] : [];
  const selectedProjectComponentEventsLoading = selectedProjectId
    ? Boolean(componentEventsLoadingByProject[selectedProjectId])
    : false;
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
          onOpenDocumentManager={handleOpenDocumentManager}
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
            {user?.isAdmin && isKafkaMonitorAvailable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/kafka-monitor')}
                className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 font-mono rounded-none"
              >
                <Activity className="h-4 w-4" />
                Monitor
              </Button>
            )}
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
              projectId={selectedProject.id}
              requirements={selectedProject.requirements || []}
              requirementsLoading={selectedProjectRequirementsLoading}
              requirementsError={selectedProjectRequirementsError}
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
              requirements={selectedProject.requirements || []}
              componentsLoading={selectedProjectComponentsLoading}
              componentsError={selectedProjectComponentsError}
              requirementsLoading={selectedProjectRequirementsLoading}
              requirementsError={selectedProjectRequirementsError}
              componentEvents={selectedProjectComponentEvents}
              componentEventsLoading={selectedProjectComponentEventsLoading}
              onAddComponent={handleAddComponentInView}
              onUpdateComponent={handleUpdateComponentInView}
              onRemoveComponent={handleRemoveComponent}
            />
          ) : currentView === 'documents' && selectedProject ? (
            <DocumentManager />
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
