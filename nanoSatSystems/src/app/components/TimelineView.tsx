import { useState } from 'react';
import { Calendar, Save, Edit2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Textarea } from '@/app/components/ui/textarea';

interface TimelineViewProps {
  projectName: string;
  timeline: string;
  onSaveTimeline: (timeline: string) => void;
}

export function TimelineView({
  projectName,
  timeline,
  onSaveTimeline,
}: TimelineViewProps) {
  const [isEditing, setIsEditing] = useState(!timeline);
  const [timelineText, setTimelineText] = useState(timeline || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [milestones, setMilestones] = useState<{ date: string; description: string }[]>([]);

  const handleSave = () => {
    if (timelineText.trim()) {
      onSaveTimeline(timelineText);
      setIsEditing(false);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-white">Timeline</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{projectName}</p>
          </div>
          {!isEditing && timeline && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              EDIT
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl">
          {isEditing ? (
            <div className="relative p-6 bg-[#222222] border border-white/10">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-white/20" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-r border-t border-white/20" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l border-b border-white/20" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-white/20" />
              
              <div className="space-y-6 relative">
                <div className="space-y-2">
                  <Label htmlFor="timeline-description" className="text-gray-300 font-mono text-xs tracking-wider uppercase">
                    Timeline Description
                  </Label>
                  <Textarea
                    id="timeline-description"
                    placeholder="Describe the project timeline, key dates, and milestones..."
                    value={timelineText}
                    onChange={(e) => setTimelineText(e.target.value)}
                    className="bg-[#1a1a1a] border-white/10 text-gray-300 font-mono min-h-[200px] placeholder:text-gray-600"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-gray-300 font-mono text-xs tracking-wider uppercase">
                      Start Date (Optional)
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-[#1a1a1a] border-white/10 text-gray-300 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-gray-300 font-mono text-xs tracking-wider uppercase">
                      End Date (Optional)
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-[#1a1a1a] border-white/10 text-gray-300 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    SAVE
                  </Button>
                  {timeline && (
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setTimelineText(timeline);
                      }}
                      variant="outline"
                      className="border-white/20 text-gray-400 hover:text-white hover:bg-white/5 font-mono"
                    >
                      <X className="h-4 w-4 mr-2" />
                      CANCEL
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : timeline ? (
            <div className="space-y-6">
              <div className="relative p-6 bg-[#222222] border border-white/10">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-white/20" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-r border-t border-white/20" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l border-b border-white/20" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-white/20" />
                
                <div className="flex items-start gap-4 relative">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/5 border border-white/10">
                    <Calendar className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 font-mono tracking-wide">PROJECT TIMELINE</h3>
                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{timeline}</p>
                  </div>
                </div>
              </div>

              {startDate && endDate && (
                <div className="relative p-6 bg-[#222222] border border-white/10">
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-white/20" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-r border-t border-white/20" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l border-b border-white/20" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-white/20" />
                  
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-white mb-4 font-mono tracking-wide">DURATION</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1 font-mono uppercase tracking-wider">Start Date</p>
                        <p className="text-white font-medium font-mono">{startDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1 font-mono uppercase tracking-wider">End Date</p>
                        <p className="text-white font-medium font-mono">{endDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 border border-white/10 mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2 font-mono tracking-wide">NO TIMELINE SET</h3>
              <p className="text-gray-500 mb-6 font-mono text-sm">
                Add a timeline to track important dates and milestones
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono"
              >
                <Calendar className="h-4 w-4 mr-2" />
                ADD TIMELINE
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
