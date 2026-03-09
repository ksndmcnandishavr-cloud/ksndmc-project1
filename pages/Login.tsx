import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { dbService } from '../services/db.ts';
import { Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const employees = await dbService.getEmployees();
      
      // Find employee with matching credentials
      const employee = employees.find(emp => 
        emp.username === username && emp.password === password
      );

      if (employee) {
        // Map EmployeeDetails to User session object
        onLogin({
          id: employee.id,
          name: employee.name,
          role: employee.employeeId === 'EMP001' ? UserRole.ADMIN : UserRole.EMPLOYEE,
          designation: employee.designation,
          section: employee.section,
          email: employee.contact || '',
          employeeId: employee.employeeId
        });
      } else {
        // Check for emergency admin recovery credentials
        if (username === 'admin' && password === 'admin') {
          onLogin({
            id: 'emergency-admin',
            name: 'Emergency Chief Admin',
            role: UserRole.ADMIN,
            designation: 'Section Head',
            section: 'HR & IT',
            email: 'admin@ksndmc.gov.in',
            employeeId: 'EMP001'
          });
        } else {
          setError('Invalid credentials. Access denied.');
        }
      }
    } catch (err) {
      setError('Database connection error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-inter">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="w-full max-w-md p-8 z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-200 mb-6">
            <span className="text-4xl font-black text-white italic">K</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">KSNDMC Portal</h1>
          <p className="text-slate-500 font-medium tracking-tight">Cloud Synchronized Attendance System</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium"
                  placeholder="Official ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            © 2024-2026 Karnataka State Natural Disaster Monitoring Centre
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;