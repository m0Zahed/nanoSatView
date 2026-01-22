import { useState } from 'react';
import { X, Plus, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  initials: string;
}

interface ProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  members: Member[];
  availableMembers: Member[];
  onAddMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function ProjectMembersDialog({
  open,
  onOpenChange,
  projectName,
  members,
  availableMembers,
  onAddMember,
  onRemoveMember,
}: ProjectMembersDialogProps) {
  const [searchEmail, setSearchEmail] = useState('');

  // Filter available members who are not already in the project
  const membersNotInProject = availableMembers.filter(
    (availableMember) => !members.find((m) => m.id === availableMember.id)
  );

  const filteredMembers = searchEmail
    ? membersNotInProject.filter((m) =>
        m.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        m.name.toLowerCase().includes(searchEmail.toLowerCase())
      )
    : membersNotInProject;

  const handleAddMember = (memberId: string) => {
    onAddMember(memberId);
    setSearchEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-[#1a1a1a] border-white/10 rounded-none">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-white" style={{ fontFamily: 'serif' }}>
            Project Members
          </DialogTitle>
          <DialogDescription className="text-gray-400 font-mono">
            {projectName} • {members.length} member{members.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Members Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                Current Members
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              <AnimatePresence mode="popLayout">
                {members.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <User className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 font-mono text-sm">No members yet</p>
                  </motion.div>
                ) : (
                  members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-[#222222] border border-white/10 rounded-none group hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarFallback className="bg-[#1a1a1a] text-white font-mono">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-mono text-sm">{member.name}</p>
                          <p className="text-gray-500 font-mono text-xs">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === 'admin' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-none">
                            <Shield className="h-3 w-3 text-blue-400" />
                            <span className="text-xs font-mono text-blue-400">ADMIN</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveMember(member.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-none"
                          disabled={member.role === 'admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Add Member Section */}
          {membersNotInProject.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                  Add Members
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search-member" className="text-gray-300 font-mono text-sm">
                  Search by name or email
                </Label>
                <Input
                  id="search-member"
                  placeholder="Search members..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="bg-[#222222] border-white/10 text-white placeholder:text-gray-600 font-mono rounded-none"
                />
              </div>

              {/* Available Members List */}
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-mono text-sm">
                      {searchEmail ? 'No members found' : 'All organization members added'}
                    </p>
                  </div>
                ) : (
                  filteredMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-[#222222] border border-white/10 rounded-none hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarFallback className="bg-[#1a1a1a] text-white font-mono">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-mono text-sm">{member.name}</p>
                          <p className="text-gray-500 font-mono text-xs">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(member.id)}
                        className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-mono"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
