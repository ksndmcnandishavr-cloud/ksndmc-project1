import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  UserCheck, 
  ShieldAlert, 
  Info,
  Clock3,
  PartyPopper,
  Cake,
  Gift,
  Star,
  Users,
  Sparkles,
  Heart,
  Flag
} from 'lucide-react';
import { User, AttendanceRecord, EmployeeDetails, GovernmentHoliday } from '../types.ts';
import { dbService } from '../services/db.ts';

interface EmployeeDashboardProps {
  user: User;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [todaysRecord, setTodaysRecord] = useState<AttendanceRecord | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [teamBirthdays, setTeamBirthdays] = useState<EmployeeDetails[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const holidays = useMemo(() => dbService.getHolidays(), []);
  
  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter(h => h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [holidays, today]);

  const todaysHoliday = useMemo(() => {
    return holidays.find(h => h.date === today);
  }, [holidays, today]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [records, details, allEmployees] = await Promise.all([
        dbService.getAttendance(today),
        dbService.getEmployeeById(user.employeeId),
        dbService.getEmployees()
      ]);
      
      const record = records.find(a => a.employeeId === user.employeeId) || null;
      setTodaysRecord(record);
      setEmployeeDetails(details);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      const colleaguesWithBirthdays = allEmployees.filter(emp => {
        if (!emp.dateOfBirth || emp.employeeId === user.employeeId) return false;
        const dobParts = emp.dateOfBirth.split('-');
        return parseInt(dobParts[1], 10) === currentMonth && 
               parseInt(dobParts[2], 10) === currentDay;
      });
      
      setTeamBirthdays(colleaguesWithBirthdays);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [today, user.employeeId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const isBirthday = () => {
    if (!employeeDetails?.dateOfBirth) return false;
    const dobParts = employeeDetails.dateOfBirth.split('-');
    if (dobParts.length !== 3) return false;
    const dobMonth = parseInt(dobParts[1], 10);
    const dobDay = parseInt(dobParts[2], 10);
    const now = new Date();
    return dobMonth === (now.getMonth() + 1) && dobDay === now.getDate();
  };

  useEffect(() => {
    if (isBirthday()) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [employeeDetails]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* CSS Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Birthday Banner */}
      {isBirthday() && (
        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-rose-200 flex flex-col lg:flex-row lg:items-center justify-between relative overflow-hidden group transition-all hover:scale-[1.01]">
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/40 shadow-2xl">
              <Cake className="w-14 h-14 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-2">Happy Birthday, {user.name}!</h2>
              <p className="text-rose-100 font-bold text-xl max-w-xl leading-snug">
                "On behalf of KSNDMC, we wish you a year of immense growth. Thank you for your service!"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Greeting & Time */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="absolute top-0 right-0 p-8">
          <Clock className="w-64 h-64 opacity-5 rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/30">
              Station Status: Online
            </span>
            {todaysHoliday && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-500/30 flex items-center gap-2">
                <Flag className="w-3 h-3" />
                Public Holiday: {todaysHoliday.name}
              </span>
            )}
          </div>
          <p className="text-slate-400 font-bold text-xl mb-2">{getGreeting()}, {user.name}</p>
          <div className="flex flex-col md:flex-row md:items-baseline gap-6 mb-6">
            <h1 className="text-6xl font-black tracking-tighter">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-black uppercase tracking-tight">{currentTime.toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Today's Attendance</h3>
              <p className="text-slate-400 font-medium">Verified timestamp records</p>
            </div>
            {todaysRecord ? (
              <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
                {todaysRecord.status === 'HOLIDAY_WORK' ? 'Holiday Work' : 'Present'}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-slate-100">
                <Clock3 className="w-5 h-5" />
                {todaysHoliday ? 'Public Holiday' : 'Pending'}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-slate-50 rounded-[3rem] mb-10 bg-slate-50/30">
            {loading ? (
              <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            ) : todaysRecord ? (
              <div className="text-center">
                <div className="w-28 h-28 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                  <UserCheck className="w-14 h-14 text-emerald-600" />
                </div>
                <h4 className="text-3xl font-black text-slate-800 mb-3">Login Confirmed</h4>
                {todaysRecord.status === 'HOLIDAY_WORK' && (
                  <p className="text-emerald-600 font-bold mb-2">Compensatory Off Credit: {todaysRecord.isCompOffCredited ? 'Applied' : 'Pending'}</p>
                )}
                <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed px-4">
                  Logged at {todaysRecord.punchIn}. Your efforts are appreciated.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-28 h-28 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Flag className={`w-14 h-14 ${todaysHoliday ? 'text-amber-500' : 'text-slate-300'}`} />
                </div>
                <h4 className="text-3xl font-black text-slate-700 mb-3">{todaysHoliday ? todaysHoliday.name : 'Verification Awaiting'}</h4>
                <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed px-4">
                  {todaysHoliday 
                    ? 'Today is an official government holiday. Working today will credit one Comp-Off (CO) day.' 
                    : 'The attendance log for today has not yet been finalized.'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center group transition-all hover:bg-emerald-600 hover:border-emerald-600 hover:scale-[1.02] shadow-sm">
              <span className="block text-[10px] text-slate-400 font-black uppercase mb-3 tracking-[0.3em] group-hover:text-white/80">Arrival Time</span>
              <span className="font-black text-slate-800 text-3xl font-mono group-hover:text-white transition-colors">{todaysRecord?.punchIn || '--:--'}</span>
            </div>
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center group transition-all hover:bg-rose-600 hover:border-rose-600 hover:scale-[1.02] shadow-sm">
              <span className="block text-[10px] text-slate-400 font-black uppercase mb-3 tracking-[0.3em] group-hover:text-white/80">Departure Time</span>
              <span className="font-black text-slate-800 text-3xl font-mono group-hover:text-white transition-colors">{todaysRecord?.punchOut || '--:--'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Government Holidays Widget */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 transition-all hover:shadow-xl">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Flag className="w-6 h-6 text-amber-500" />
              </div>
              Public Holidays
            </h3>
            <div className="space-y-4">
              {upcomingHolidays.map((holiday) => (
                <div key={holiday.date} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-white flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-black text-amber-600 uppercase">
                      {new Date(holiday.date).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black text-slate-800 leading-none">
                      {new Date(holiday.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{holiday.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{holiday.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Birthdays Widget */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 transition-all hover:shadow-xl">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-pink-50 rounded-xl">
                <PartyPopper className="w-6 h-6 text-pink-500" />
              </div>
              Today's Birthdays
            </h3>
            <div className="space-y-4">
              {teamBirthdays.length > 0 ? (
                teamBirthdays.map((colleague) => (
                  <div key={colleague.employeeId} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-pink-50 hover:border-pink-200 transition-all cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 group-hover:text-pink-500 shadow-sm border border-slate-100 transition-colors">
                      <Cake className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">{colleague.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{colleague.section}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 px-4">
                  <p className="text-sm text-slate-400 font-bold italic">No births today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 transition-all hover:shadow-xl">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Info className="w-6 h-6 text-blue-500" />
              </div>
              My Balances
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Comp-Off (CO)</span>
                <span className="text-2xl font-black text-emerald-800">{employeeDetails?.leaveBalances.co ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Other Leaves</span>
                <span className="text-xl font-black text-slate-800">
                  {(employeeDetails?.leaveBalances.cl || 0) + (employeeDetails?.leaveBalances.el || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          top: 100%;
          border-radius: 2px;
          animation-name: float;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;