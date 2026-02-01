import { Users, UserPlus, Check, X, Copy } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  initials: string;
}

interface JoinRequest {
  id: string;
  name: string;
  email: string;
  timestamp: Date;
  initials: string;
}

interface OrganizationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  inviteLink: string;
  members: Member[];
  joinRequests: JoinRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function OrganizationSettings({
  open,
  onOpenChange,
  organizationName,
  inviteLink,
  members,
  joinRequests,
  onApproveRequest,
  onRejectRequest,
  onRemoveMember,
}: OrganizationSettingsProps) {
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{organizationName} Settings</DialogTitle>
          <DialogDescription>Manage members and join requests</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="members" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Join Requests
              {joinRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {joinRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Invite Link Section */}
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to let people join instantly
              </p>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <Label>Members</Label>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-indigo-600 text-white">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {member.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Join Requests Tab */}
          <TabsContent value="requests" className="flex-1 overflow-auto space-y-4 mt-4">
            {joinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserPlus className="h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm text-muted-foreground">No pending join requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback className="bg-slate-600 text-white">
                          {request.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{request.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApproveRequest(request.id)}
                        className="gap-1 text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRejectRequest(request.id)}
                        className="gap-1 text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
