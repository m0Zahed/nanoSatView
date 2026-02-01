import { useState } from 'react';
import { Plus, User, Trash2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  initials: string;
}

interface MembersViewProps {
  projectName: string;
  members: Member[];
  availableMembers: Member[];
  onAddMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MembersView({
  projectName,
  members,
  availableMembers,
  onAddMember,
  onRemoveMember,
}: MembersViewProps) {
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
    <div className="flex-1 flex flex-col h-full bg-[#1a1a1a]">
      {/* Film Grain Texture Overlay */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-white/10 px-6 py-4 relative">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-wider">PROJECT MEMBERS</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{projectName} • {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl space-y-8">
          {/* Current Members Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                Current Members
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {members.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 border border-white/10 mb-4">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2 font-mono tracking-wide">NO MEMBERS YET</h3>
                    <p className="text-gray-500 font-mono text-sm">Add members from the organization below</p>
                  </motion.div>
                ) : (
                  members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative flex items-center justify-between p-4 bg-[#222222] border border-white/10 group hover:border-white/20 transition-all"
                    >
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-white/20" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-r border-t border-white/20" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l border-b border-white/20" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-white/20" />
                      
                      <div className="flex items-center gap-3 relative">
                        <div className="h-10 w-10 bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="text-white font-mono text-xs">{member.initials}</span>
                        </div>
                        <div>
                          <p className="text-white font-mono text-sm">{member.name}</p>
                          <p className="text-gray-500 font-mono text-xs">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 relative">
                        {member.role === 'admin' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/20">
                            <Shield className="h-3 w-3 text-gray-300" />
                            <span className="text-xs font-mono text-gray-300">ADMIN</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveMember(member.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-950/20 font-mono"
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                  Add Members
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Search Input */}
              <div className="relative p-4 bg-[#222222] border border-white/10">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-white/20" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r border-t border-white/20" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l border-b border-white/20" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-white/20" />
                
                <div className="space-y-2 relative">
                  <Label htmlFor="search-member" className="text-gray-300 font-mono text-xs tracking-wider uppercase">
                    Search by name or email
                  </Label>
                  <Input
                    id="search-member"
                    placeholder="Search members..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-600 font-mono"
                  />
                </div>
              </div>

              {/* Available Members List */}
              <div className="space-y-2">
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
                      className="relative flex items-center justify-between p-4 bg-[#222222] border border-white/10 hover:border-white/20 transition-all"
                    >
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-white/20" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-r border-t border-white/20" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l border-b border-white/20" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-white/20" />
                      
                      <div className="flex items-center gap-3 relative">
                        <div className="h-10 w-10 bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="text-white font-mono text-xs">{member.initials}</span>
                        </div>
                        <div>
                          <p className="text-white font-mono text-sm">{member.name}</p>
                          <p className="text-gray-500 font-mono text-xs">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(member.id)}
                        className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono relative"
                      >
                        <Plus className="h-3 w-3" />
                        ADD
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
