import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Send, 
  Clock, 
  ClipboardList,
  Info
} from 'lucide-react';
import { LeaveStatus, LeaveRequest, EmployeeDetails } from '../types.ts';
import { dbService } from '../services/db.ts';

interface LeaveManagementProps {
  employeeId?: string;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ employeeId }) => {
  const isAdminView = !employeeId;
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>(isAdminView ? 'history' : 'apply');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState('Casual Leave (CL)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  const fetchLeaves = async () => {
    try {
      const all = await dbService.getLeaves();
      const filtered = employeeId ? all.filter(l => l.employeeId === employeeId) : all;
      setLeaves(filtered);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    }
  };

  const fetchEmployeeData = async () => {
    if (employeeId) {
      const details = await dbService.getEmployeeById(employeeId);
      setEmployeeDetails(details);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchEmployeeData();
  }, [employeeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate || !reason) return;

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        await dbService.submitLeave({
          employeeId,
          employeeName: employeeDetails?.name || 'Staff member',
          leaveType,
          startDate,
          endDate,
          reason
        });
        setIsSubmitting(false);
        setActiveTab('history');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchLeaves();
      } catch (error) {
        console.error("Failed to submit leave:", error);
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleAction = async (id: string, status: LeaveStatus) => {
    try {
      await dbService.updateLeaveStatus(id, status);
      fetchLeaves();
    } catch (error) {
      console.error("Failed to update leave status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdminView ? 'Leave Approvals' : 'Leave Management'}
          </h1>
          <p className="text-slate-500 tracking-tight">Managing official time-off requests for the department</p>
        </div>
        {!isAdminView && (
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'apply' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Apply Leave
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My History
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Leave Balance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
                <span className="block text-xl font-black text-amber-700">{employeeDetails?.leaveBalances.cl ?? 0}</span>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Casual (CL)</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-center border border-rose-100">
                <span className="block text-xl font-black text-rose-700">{employeeDetails?.leaveBalances.ml ?? 0}</span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Medical (ML)</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-100">
                <span className="block text-xl font-black text-blue-700">{employeeDetails?.leaveBalances.el ?? 0}</span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Earned (EL)</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-center border border-purple-100">
                <span className="block text-xl font-black text-purple-700">{employeeDetails?.leaveBalances.rh ?? 0}</span>
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Restricted (RH)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100 col-span-2">
                <span className="block text-xl font-black text-slate-700">{employeeDetails?.leaveBalances.co ?? 0}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compensatory (CO)</span>
              </div>
            </div>
            {!isAdminView && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Note: Balance updates automatically upon approval of your leave requests.
                </p>
              </div>
            )}
          </div>

          {!isAdminView && activeTab === 'apply' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6">New Application</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Leave Type</label>
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  >
                    <option>Casual Leave (CL)</option>
                    <option>Medical Leave (ML)</option>
                    <option>Earned Leave (EL)</option>
                    <option>Restricted Holiday (RH)</option>
                    <option>Compensatory Off (CO)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">End Date</label>
                    <input 
                      type="date" 
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Reason</label>
                  <textarea 
                    rows={3} 
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                    placeholder="Brief explanation for leave..."
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              {isAdminView ? 'Incoming Requests' : 'Your Leave History'}
            </h3>
            
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-5 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${
                        leave.status === LeaveStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' :
                        leave.status === LeaveStatus.REJECTED ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800">{leave.leaveType}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                            leave.status === LeaveStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === LeaveStatus.REJECTED ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        {isAdminView && <p className="text-xs font-bold text-emerald-600 mb-1">{leave.employeeName}</p>}
                        <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">
                          {leave.startDate} — {leave.endDate}
                        </p>
                        <p className="text-sm text-slate-600 bg-white/60 p-3 rounded-xl border border-slate-100 italic">"{leave.reason}"</p>
                      </div>
                    </div>
                    
                    {isAdminView && leave.status === LeaveStatus.PENDING && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button 
                          onClick={() => handleAction(leave.id, LeaveStatus.APPROVED)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-100"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(leave.id, LeaveStatus.REJECTED)}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {leaves.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="font-bold text-slate-700 tracking-tight">Database is clear</h4>
                <p className="text-sm text-slate-400">No leave history found for this record.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;