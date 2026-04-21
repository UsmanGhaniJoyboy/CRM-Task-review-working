/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  MessageSquare, 
  ChevronRight,
  Filter,
  Download,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Status = 'Not Started' | 'In Progress' | 'Completed' | 'All';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Comment {
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface Task {
  id: string;
  name: string;
  assignees: User[];
  status: Exclude<Status, 'All'>;
  startDate: string;
  dueDate: string;
  followers: string[]; // List of User IDs who are Seniors
  comments: Comment[];
}

// --- Mock Data ---

const SYSTEM_USERS: User[] = [
  { id: 'u1', name: 'Zahid Khan', avatar: 'https://picsum.photos/seed/zahid/100/100' },
  { id: 'u2', name: 'Dr. Bilal', avatar: 'https://picsum.photos/seed/bilal/100/100' },
  { id: 'u3', name: 'Furqan', avatar: 'https://picsum.photos/seed/furqan/100/100' },
  { id: 'u4', name: 'Jamal', avatar: 'https://picsum.photos/seed/jamal/100/100' },
  { id: 'u5', name: 'Ajmal', avatar: 'https://picsum.photos/seed/ajmal/100/100' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    name: 'Annual Performance Review (Unit A)',
    assignees: [SYSTEM_USERS[0]], // Zahid
    status: 'In Progress',
    startDate: '2026-04-05',
    dueDate: '2026-04-20',
    followers: ['u2', 'u3', 'u4', 'u5'], // Jamal, Ajmal, Furqan, Dr. Bilal
    comments: [
      { userId: 'u2', userName: 'Dr. Bilal', text: 'Ensure the KPIs are updated.', timestamp: '2026-04-06 10:00' },
      { userId: 'u2', userName: 'Dr. Bilal', text: 'I need this by Monday.', timestamp: '2026-04-06 11:30' },
      { userId: 'u1', userName: 'Zahid Khan', text: 'Yes sir, working on it.', timestamp: '2026-04-07 09:00' },
      { userId: 'u3', userName: 'Furqan', text: 'Checked the numbers, looking good.', timestamp: '2026-04-08 14:00' },
      { userId: 'u3', userName: 'Furqan', text: 'Draft 2 is approved.', timestamp: '2026-04-08 14:30' },
      { userId: 'u2', userName: 'Dr. Bilal', text: 'Good speed.', timestamp: '2026-04-09 10:00' },
      { userId: 'u2', userName: 'Dr. Bilal', text: 'Final check remaining.', timestamp: '2026-04-09 10:15' },
    ],
  },
  {
    id: 't2',
    name: 'Inventory Audit - North Wing',
    assignees: [SYSTEM_USERS[0]], // Zahid
    status: 'Not Started',
    startDate: '2026-04-10',
    dueDate: '2026-04-25',
    followers: ['u2', 'u3'],
    comments: [
      { userId: 'u3', userName: 'Furqan', text: 'Please start this on time.', timestamp: '2026-04-10 09:00' },
    ],
  },
  {
    id: 't3',
    name: 'Compliance Policy Update',
    assignees: [SYSTEM_USERS[1], SYSTEM_USERS[0]], // Bilal and Zahid
    status: 'Completed',
    startDate: '2026-03-25',
    dueDate: '2026-04-15',
    followers: ['u4', 'u5'],
    comments: [
      { userId: 'u4', userName: 'Jamal', text: 'Verified compliance standard ISO-9001.', timestamp: '2026-04-01 10:00' },
      { userId: 'u5', userName: 'Ajmal', text: 'Maternity leave policies updated.', timestamp: '2026-04-14 11:00' },
    ],
  },
];

// --- Components ---

const StatusBadge = ({ status }: { status: Exclude<Status, 'All'> }) => {
  const styles = {
    'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function App() {
  // Pending filter states (used in the UI inputs)
  const [pendingAssignee, setPendingAssignee] = useState<string>(''); // Empty = All
  const [pendingFromDate, setPendingFromDate] = useState<string>('2026-04-01');
  const [pendingToDate, setPendingToDate] = useState<string>('2026-04-30');

  // Applied filter states (used for the actual table calculation)
  const [appliedFilters, setAppliedFilters] = useState({
    assignee: '',
    fromDate: '2026-04-01',
    toDate: '2026-04-30'
  });

  // Action to apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      assignee: pendingAssignee,
      fromDate: pendingFromDate,
      toDate: pendingToDate
    });
  };

  // Logic to filter tasks: Person must be an assignee + Date Range matches creation
  // Sorted by creation time (startDate) as requested
  const filteredTasks = useMemo(() => {
    const list = [...INITIAL_TASKS]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) // Latest first
      .filter(task => {
        const matchesAssignee = appliedFilters.assignee 
          ? task.assignees.some(a => a.id === appliedFilters.assignee) 
          : true;
        
        const taskDate = new Date(task.startDate);
        const start = appliedFilters.fromDate ? new Date(appliedFilters.fromDate) : null;
        const end = appliedFilters.toDate ? new Date(appliedFilters.toDate) : null;
        const matchesDate = (!start || taskDate >= start) && (!end || taskDate <= end);

        return matchesAssignee && matchesDate;
      });
    return list;
  }, [appliedFilters]);

  // Export Logic: Download as CSV
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,Task,User,Comment,Timestamp\n";
    
    filteredTasks.forEach(task => {
      task.comments.forEach(c => {
        csvContent += `"${task.name}","${c.userName}","${c.text.replace(/"/g, '""')}","${c.timestamp}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `task_oversight_report_${appliedFilters.fromDate}_to_${appliedFilters.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Logic for a Single Task
  const handleExportTask = (task: Task) => {
    let csvContent = "data:text/csv;charset=utf-8,Task,User,Comment,Timestamp\n";
    task.comments.forEach(c => {
      csvContent += `"${task.name}","${c.userName}","${c.text.replace(/"/g, '""')}","${c.timestamp}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `task_${task.id}_chat_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#2c3e50] font-sans selection:bg-blue-100">
      {/* Sidebar-like Header */}
      <header className="bg-[#1e293b] text-white px-8 py-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500 p-2.5 rounded-xl shadow-inner">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Task overview</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Analytical Reporting Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-xs font-bold text-slate-300">ADMINISTRATOR</span>
             <span className="text-[10px] text-slate-500 font-bold">Session ID: 4902-DX</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden">
             <img src="https://picsum.photos/seed/admin/100/100" referrerPolicy="no-referrer" alt="Admin" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Filter Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-400">Filter Parameters</h2>
            </div>
            
            <button 
              onClick={handleExport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Report (Excel)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                <Users className="w-3 h-3" /> Select Person (Assignee)
              </label>
              <select 
                value={pendingAssignee}
                onChange={(e) => setPendingAssignee(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Assignee (Empty for All)</option>
                {SYSTEM_USERS.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                <Calendar className="w-3 h-3" /> From Date
              </label>
              <input 
                type="date"
                value={pendingFromDate}
                onChange={(e) => setPendingFromDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                <Calendar className="w-3 h-3" /> To Date
              </label>
              <div className="flex gap-4">
                <input 
                  type="date"
                  value={pendingToDate}
                  onChange={(e) => setPendingToDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
                <button 
                  onClick={handleApplyFilters}
                  className="bg-slate-900 text-white px-6 rounded-2xl font-black text-xs uppercase hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10"
                >
                  Filter
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Oversight Data Table */}
        <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight">Oversight Report</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cross-sectional task analysis</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200">
               <span className="text-xs font-black text-blue-600">{filteredTasks.length} Result{filteredTasks.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-6 min-w-[250px]">Task Description</th>
                  <th className="px-8 py-6 text-center">Comment Count</th>
                  <th className="px-8 py-6 text-center">Seniors Interactions</th>
                  <th className="px-8 py-6">Interacting Followers</th>
                  <th className="px-8 py-6">Details</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      // LOGIC: Filter comments made ONLY by seniors (followers)
                      const seniorComments = task.comments.filter(c => task.followers.includes(c.userId));
                      const seniorNames = Array.from(new Set(seniorComments.map(c => c.userName)));

                      return (
                        <motion.tr 
                          key={task.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-blue-50/30 transition-colors"
                        >
                          {/* 1. Task Information */}
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-extrabold text-[#1a1a1a] group-hover:text-blue-700 transition-colors">{task.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded leading-none uppercase tracking-tighter">ID: {task.id}</span>
                                <div className="flex -space-x-1.5">
                                  {task.assignees.map(a => (
                                    <img key={a.id} src={a.avatar} alt={a.name} title={a.name} className="w-5 h-5 rounded-full border border-white ring-1 ring-slate-100" referrerPolicy="no-referrer" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Total Comment Count */}
                          <td className="px-8 py-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-blue-200 transition-all">
                              <span className="text-sm font-black text-slate-700 group-hover:text-blue-700 leading-none">{task.comments.length}</span>
                            </div>
                          </td>

                          {/* 3. Seniors Interactions (Count of follower's messages) */}
                          <td className="px-8 py-6 text-center">
                            <div className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                               <ShieldCheck className="w-3.5 h-3.5 mr-2 opacity-50 group-hover:opacity-100" />
                               <span className="text-sm font-black">{seniorComments.length}</span>
                            </div>
                          </td>

                          {/* 4. Interacting Followers (List of names) */}
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1.5">
                              {seniorNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {seniorNames.map((name, i) => (
                                    <span key={i} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 italic">No senior response cataloged</span>
                              )}
                            </div>
                          </td>

                          {/* 5. Status & Context */}
                          <td className="px-8 py-6">
                             <div className="flex flex-col items-start gap-1.5">
                               <StatusBadge status={task.status} />
                               <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Created: {task.startDate}</span>
                             </div>
                          </td>

                          {/* 6. Individual Export Button */}
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => handleExportTask(task)}
                               className="inline-flex items-center gap-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95"
                               title="Export this task chat"
                             >
                                <Download className="w-3 h-3" />
                                Export
                             </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                             <Search className="w-8 h-8 text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-black text-slate-300 uppercase tracking-widest leading-none">Zero Analytics Detected</p>
                            <p className="text-[11px] font-bold text-slate-400">No tasks align with the current oversight parameters.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">
               END OF REPORT // TIMESTAMP: {new Date().toLocaleTimeString()}
             </div>
             <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">Prev Page</button>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">Next Page</button>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}



