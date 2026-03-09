import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Download,
  AlertCircle,
  Plus,
  X,
  UserPlus,
  CheckCircle2,
  Calendar,
  Flag,
  Info
} from 'lucide-react';
import { dbService } from '../services/db.ts';
import { AttendanceRecord, EmployeeDetails, GovernmentHoliday } from '../types.ts';

const AttendanceTracking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Manual Entry State
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualIn, setManualIn] = useState('09:00');
  const [manualOut, setManualOut] = useState('17:30');
  const [isEditMode, setIsEditMode] = useState(false);
  const [creditCompOff, setCreditCompOff] = useState(false);

  const holidays = useMemo(() => dbService.getHolidays(), []);
  const selectedHoliday = useMemo(() => holidays.find(h => h.date === selectedDate), [holidays, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const [empData, attData] = await Promise.all([
      dbService.getEmployees(),
      dbService.getAttendance(selectedDate)
    ]);
    setEmployees(empData);
    setRecords(attData);
    setLoading(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.addManualAttendance({
      employeeId: manualEmpId,
      date: selectedDate,
      punchIn: manualIn,
      punchOut: manualOut,
      status: selectedHoliday ? 'HOLIDAY_WORK' : 'PRESENT',
      isCompOffCredited: selectedHoliday ? creditCompOff : false,
      location: { lat: 0, lng: 0 }
    });
    setShowModal(false);
    setIsEditMode(false);
    setCreditCompOff(false);
    fetchData();
  };

  const openEdit = (record: AttendanceRecord) => {
    setManualEmpId(record.employeeId);
    setManualIn(record.punchIn);
    setManualOut(record.punchOut || '17:30');
    setCreditCompOff(record.isCompOffCredited || false);
    setIsEditMode(true);
    setShowModal(true);
  };

  const filteredData = useMemo(() => {
    return employees.map(emp => {
      const record = records.find(r => r.employeeId === emp.employeeId);
      return { emp, record };
    }).filter(({ emp }) => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, records, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Log Entry</h1>
          <p className="text-slate-500">Manual administrative control for employee presence</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </div>

          <button 
            onClick={() => {
              setManualEmpId('');
              setManualIn('09:00');
              setManualOut('17:30');
              setIsEditMode(false);
              setCreditCompOff(false);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {selectedHoliday && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Flag className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight">Government Holiday: {selectedHoliday.name}</h4>
            <p className="text-xs text-amber-700 font-medium">Any attendance marked for today will be eligible for Compensatory Off (CO) credit.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest text-left">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-center">In Time</th>
                <th className="px-6 py-4 text-center">Out Time</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse">Syncing logbook...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map(({ emp, record }) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{emp.name}</p>
                      <p className="text-xs text-slate-400 font-medium">ID: {emp.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">
                      {record?.punchIn || '--:--'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">
                      {record?.punchOut || '--:--'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                          record ? (record.status === 'HOLIDAY_WORK' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') : 'bg-slate-100 text-slate-400'
                        }`}>
                          {record ? record.status.replace('_', ' ') : 'NO RECORD'}
                        </span>
                        {record?.isCompOffCredited && (
                          <span className="text-[8px] font-black text-emerald-600 mt-1">CO CREDITED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record ? (
                        <button 
                          onClick={() => openEdit(record)}
                          className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Edit
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setManualEmpId(emp.employeeId);
                            setManualIn('09:00');
                            setManualOut('17:30');
                            setIsEditMode(false);
                            setCreditCompOff(!!selectedHoliday);
                            setShowModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Mark Present
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">No staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                {isEditMode ? 'Update Record' : 'Create Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Staff Member</label>
                <select 
                  required disabled={isEditMode}
                  value={manualEmpId} onChange={e => setManualEmpId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  <option value="">Select...</option>
                  {employees.map(e => <option key={e.id} value={e.employeeId}>{e.name} ({e.employeeId})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">In Time</label>
                  <input type="time" required value={manualIn} onChange={e => setManualIn(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Out Time</label>
                  <input type="time" required value={manualOut} onChange={e => setManualOut(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
              </div>

              {selectedHoliday && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">Comp-Off Credit Eligible</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={creditCompOff}
                        onChange={e => setCreditCompOff(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-medium">If enabled, 1 day will be added to the employee's Compensatory Off (CO) balance.</p>
                </div>
              )}

              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl transition-all">
                {isEditMode ? 'Apply Changes' : 'Confirm Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;