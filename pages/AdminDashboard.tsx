import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock, 
  ArrowUpRight,
  Calendar,
  Cake,
  PartyPopper,
  ShieldAlert,
  Key,
  ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard.tsx';
import { dbService } from '../services/db.ts';
import { LeaveStatus, LeaveRequest, EmployeeDetails } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingLeaves: 0
  });
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [birthdaysToday, setBirthdaysToday] = useState<EmployeeDetails[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, l, allEmps] = await Promise.all([
          dbService.getDashboardStats(),
          dbService.getLeaves(),
          dbService.getEmployees()
        ]);
        setStats(s);
        setPendingLeaves(l.filter(item => item.status === LeaveStatus.PENDING).slice(0, 5));
        
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const bdays = allEmps.filter(e => {
          if (!e.dateOfBirth) return false;
          const pts = e.dateOfBirth.split('-');
          return parseInt(pts[1], 10) === m && parseInt(pts[2], 10) === d;
        });
        setBirthdaysToday(bdays);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };
    fetchData();
  }, []);

  const attendanceData = useMemo(() => [
    { name: 'Mon', present: 145, absent: 5 },
    { name: 'Tue', present: 142, absent: 8 },
    { name: 'Wed', present: 148, absent: 2 },
    { name: 'Thu', present: 140, absent: 10 },
    { name: 'Fri', present: stats.presentToday, absent: Math.max(0, stats.totalEmployees - stats.presentToday) },
  ], [stats]);

  const leaveDistribution = [
    { name: 'Casual Leave', value: 40, color: '#10b981' },
    { name: 'Sick Leave', value: 15, color: '#ef4444' },
    { name: 'Earned Leave', value: 25, color: '#3b82f6' },
    { name: 'Comp-Off', value: 20, color: '#f59e0b' },
  ];

  const handleLeaveAction = async (id: string, status: LeaveStatus) => {
    await dbService.updateLeaveStatus(id, status);
    const updatedLeaves = await dbService.getLeaves();
    setPendingLeaves(updatedLeaves.filter(item => item.status === LeaveStatus.PENDING).slice(0, 5));
    const updatedStats = await dbService.getDashboardStats();
    setStats(updatedStats);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Admin Control Center</h1>
          <p className="text-slate-500 font-medium">Monitoring departmental efficiency and staff engagement</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span className="font-black text-slate-700 uppercase tracking-widest text-xs">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Personnel" value={stats.totalEmployees} icon={Users} trend="Master Registry" color="blue" />
        <StatCard title="Presence Today" value={stats.presentToday} icon={UserCheck} trend={stats.totalEmployees > 0 ? `${Math.round((stats.presentToday/stats.totalEmployees)*100)}% active` : '0%'} trendUp={true} color="emerald" />
        <StatCard title="Field/Leave" value={stats.onLeave} icon={UserMinus} trend="Authorized absence" color="orange" />
        <StatCard title="Pending Requests" value={stats.pendingLeaves} icon={Clock} trend="Awaiting review" trendUp={false} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Access Control */}
          <div className="bg-emerald-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" />
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-3">
                <Key className="w-7 h-7 text-emerald-400" />
                Access Control & Security
              </h3>
              <p className="text-emerald-100/70 mb-8 max-w-md font-medium leading-relaxed">
                Manage system users, reset lost passwords, and update administrative credentials for secure portal access.
              </p>
              <button 
                onClick={() => navigate('/employees')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 shadow-xl"
              >
                Manage User Credentials
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Weekly Attendance Metrics</h3>
              <button onClick={() => navigate('/reports')} className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-2 group uppercase tracking-widest">
                Comprehensive Audit
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 'bold' }} />
                  <Bar dataKey="present" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                  <Bar dataKey="absent" fill="#f1f5f9" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-xl">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Time-Off Requests</h3>
              <button onClick={() => navigate('/leaves')} className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">Manage Queue</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
                    <th className="px-10 py-6">Personnel</th>
                    <th className="px-10 py-6">Category</th>
                    <th className="px-10 py-6 text-center">Period</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <p className="font-bold text-slate-800">{leave.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">KSNDMC STAFF</p>
                      </td>
                      <td className="px-10 py-6"><span className="text-sm font-bold text-slate-600">{leave.leaveType}</span></td>
                      <td className="px-10 py-6 text-center"><span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">{leave.startDate} — {leave.endDate}</span></td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleLeaveAction(leave.id, LeaveStatus.APPROVED)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100">Approve</button>
                          <button onClick={() => handleLeaveAction(leave.id, LeaveStatus.REJECTED)} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-100">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingLeaves.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-10 h-10 text-slate-200" /></div>
                        <p className="text-slate-400 font-black text-sm uppercase tracking-[0.2em]">Zero pending actions</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-rose-200 relative overflow-hidden group">
            <PartyPopper className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 tracking-tight relative z-10"><Cake className="w-7 h-7" />Birthdays Today</h3>
            <div className="space-y-4 relative z-10">
              {birthdaysToday.length > 0 ? (
                birthdaysToday.map((emp) => (
                  <div key={emp.employeeId} className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-[1.5rem] flex items-center gap-4 hover:bg-white/20 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl">{emp.name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-lg tracking-tight leading-none mb-1">{emp.name}</p>
                      <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">{emp.section} Division</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 px-4 bg-white/5 rounded-[1.5rem] border border-white/10 text-center"><p className="text-sm font-bold opacity-70 italic">No birthdays on record for today.</p></div>
              )}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl">
            <h3 className="text-xl font-black text-slate-800 mb-10 tracking-tight">Leave Utilization</h3>
            <div className="h-64 relative mb-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leaveDistribution} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={10} dataKey="value">
                    {leaveDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">100%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balanced</span>
              </div>
            </div>
            <div className="space-y-5">
              {leaveDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-slate-500 font-black uppercase tracking-widest group-hover:text-slate-800 transition-colors">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};export default AdminDashboard;