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
    <div className="flex-1 flex flex-col h-full bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Timeline</h1>
            <p className="text-sm text-slate-400 mt-1">{projectName}</p>
          </div>
          {!isEditing && timeline && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Timeline
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl">
          {isEditing ? (
            <Card className="p-6 bg-slate-900 border-slate-700">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="timeline-description" className="text-white">
                    Timeline Description
                  </Label>
                  <Textarea
                    id="timeline-description"
                    placeholder="Describe the project timeline, key dates, and milestones..."
                    value={timelineText}
                    onChange={(e) => setTimelineText(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white min-h-[200px]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-white">
                      Start Date (Optional)
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-white">
                      End Date (Optional)
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Timeline
                  </Button>
                  {timeline && (
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setTimelineText(timeline);
                      }}
                      variant="outline"
                      className="border-slate-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : timeline ? (
            <div className="space-y-6">
              <Card className="p-6 bg-slate-900 border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Project Timeline</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{timeline}</p>
                  </div>
                </div>
              </Card>

              {startDate && endDate && (
                <Card className="p-6 bg-slate-900 border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Duration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Start Date</p>
                      <p className="text-white font-medium">{startDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">End Date</p>
                      <p className="text-white font-medium">{endDate}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No timeline set</h3>
              <p className="text-slate-400 mb-6">
                Add a timeline to track important dates and milestones
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add Timeline
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
