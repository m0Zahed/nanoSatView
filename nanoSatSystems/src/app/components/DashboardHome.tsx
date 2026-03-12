import { useState } from 'react';
import { Check, Plus, Trash2, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color: string;
}

const LetterPullup = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const letters = text.split('');
  
  return (
    <div className="flex">
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + i * 0.05,
            duration: 0.5,
            ease: [0.6, 0.05, 0.01, 0.9],
          }}
          className="inline-block"
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </div>
  );
};

export function DashboardHome() {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Review project proposals', completed: false, createdAt: new Date() },
    { id: '2', text: 'Team standup meeting', completed: true, createdAt: new Date() },
    { id: '3', text: 'Update documentation', completed: false, createdAt: new Date() },
  ]);
  const [newTodo, setNewTodo] = useState('');

  // Mock calendar events
  const upcomingEvents: CalendarEvent[] = [
    { id: '1', title: 'Team Sync', time: '10:00 AM', color: 'bg-blue-500' },
    { id: '2', title: 'Client Call', time: '2:00 PM', color: 'bg-purple-500' },
    { id: '3', title: 'Design Review', time: '4:30 PM', color: 'bg-green-500' },
  ];

  // Mock contribution data for the month
  const contributionData = [
    { day: 'Week 1', completed: 12, total: 15 },
    { day: 'Week 2', completed: 18, total: 20 },
    { day: 'Week 3', completed: 15, total: 18 },
    { day: 'Week 4', completed: 22, total: 25 },
  ];

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: new Date(),
    };

    setTodos([...todos, todo]);
    setNewTodo('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map((todo) => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const completionRate = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="flex-1 bg-[#1a1a1a] overflow-auto relative">
      <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="space-y-2"
        >
          <h1 className="text-6xl font-bold text-white tracking-tight" style={{ fontFamily: 'serif' }}>
            Dashboard
          </h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-lg text-gray-400 font-mono"
          >
            Overview
          </motion.p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="bg-[#222222] border-white/10 text-white overflow-hidden relative rounded-none">
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }} />
              <CardHeader className="relative">
                <CardDescription className="text-gray-500 text-xs font-mono uppercase tracking-widest">Tasks</CardDescription>
                <CardTitle className="text-6xl font-bold tracking-tight" style={{ fontFamily: 'monospace' }}>{todos.length}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="bg-[#222222] border-white/10 text-white overflow-hidden relative rounded-none">
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }} />
              <CardHeader className="relative">
                <CardDescription className="text-gray-500 text-xs font-mono uppercase tracking-widest">Complete</CardDescription>
                <CardTitle className="text-6xl font-bold tracking-tight" style={{ fontFamily: 'monospace' }}>{completedCount}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="bg-[#222222] border-white/10 text-white overflow-hidden relative rounded-none">
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }} />
              <CardHeader className="relative">
                <CardDescription className="text-gray-500 text-xs font-mono uppercase tracking-widest">Rate</CardDescription>
                <CardTitle className="text-6xl font-bold tracking-tight" style={{ fontFamily: 'monospace' }}>{completionRate}%</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Todo List */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="bg-[#222222] border-white/10 backdrop-blur-sm rounded-none">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: 'serif' }}>
                  Tasks
                </CardTitle>
                <CardDescription className="text-sm font-mono text-gray-500">Daily Tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Todo */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add task..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTodo();
                      }
                    }}
                    className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-600 font-mono rounded-none"
                  />
                  <Button onClick={handleAddTodo} className="gap-2 rounded-none bg-white text-black hover:bg-gray-200 font-mono">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* Todo Items */}
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {todos.map((todo) => (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, height: 0, scale: 0.8 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-none border border-white/10 group hover:border-white/20 transition-all">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleTodo(todo.id)}
                            className="border-white/20"
                          />
                          <span
                            className={`flex-1 text-sm font-mono ${
                              todo.completed
                                ? 'line-through text-gray-600'
                                : 'text-gray-200'
                            }`}
                          >
                            {todo.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {todos.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <p className="font-mono text-sm">No tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Calendar Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="bg-[#222222] border-white/10 backdrop-blur-sm rounded-none">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: 'serif' }}>
                  Schedule
                </CardTitle>
                <CardDescription className="text-sm font-mono text-gray-500">Today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-none border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className={`w-1 h-12 ${event.color} rounded-none`} />
                    <div className="flex-1">
                      <p className="text-white text-sm font-mono">{event.title}</p>
                      <p className="text-gray-500 text-xs font-mono">{event.time}</p>
                    </div>
                  </motion.div>
                ))}

                <Button variant="outline" className="w-full mt-4 border-white/10 text-gray-400 hover:text-white rounded-none font-mono hover:bg-white/5">
                  Sync Calendar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card className="bg-[#222222] border-white/10 backdrop-blur-sm rounded-none">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: 'serif' }}>
                Progress
              </CardTitle>
              <CardDescription className="text-sm font-mono text-gray-500">Monthly Trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={contributionData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#666666" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#666666" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis dataKey="day" stroke="#666666" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#666666" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#666666"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#ffffff"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}