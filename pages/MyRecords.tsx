import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { User, AttendanceRecord } from '../types.ts';
import { dbService } from '../services/db.ts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface MyRecordsProps {
  user: User;
}

// Fixed the component implementation and added return statement to avoid 'void' return type error
const MyRecords: React.FC<MyRecordsProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchMyData();
  }, [currentDate, user.employeeId]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const allRecords = await dbService.getAttendanceByRange(start, end);
      const myRecords = allRecords.filter(r => r.employeeId === user.employeeId);
      setRecords(myRecords.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error("Failed to fetch personal records:", error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    setIsExporting(format);
    const fileName = `Attendance_${user.employeeId}_${currentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).replace(/\s+/g, '_')}`;

    const data = records.map(r => ({
      Date: r.date,
      'Punch In': r.punchIn,
      'Punch Out': r.punchOut || '--:--',
      Status: r.status,
      'CO Credited': r.isCompOffCredited ? 'Yes' : 'No'
    }));

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.text(`Attendance Record: ${user.name} (${user.employeeId})`, 14, 15);
      doc.text(`Period: ${currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, 14, 22);
      
      const headers = [["Date", "Punch In", "Punch Out", "Status", "CO Credited"]];
      const rows = records.map(r => [
        r.date, 
        r.punchIn, 
        r.punchOut || '--:--', 
        r.status, 
        r.isCompOffCredited ? 'Yes' : 'No'
      ]);

      (doc as any).autoTable({
        head: headers,
        body: rows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });
      
      doc.save(`${fileName}.pdf`);
    }
    setIsExporting(null);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Attendance Records</h1>
          <p className="text-slate-500 font-medium">Monthly view of your presence logs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-sm"
            >
              <Download className="w-5 h-5" />
              Download Report
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <button 
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
                </button>
                <button 
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-3"
                >
                  <FileText className="w-4 h-4" /> PDF (.pdf)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800">
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Current
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4 text-center">Punch In</th>
                <th className="px-8 py-4 text-center">Punch Out</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Retrieving logs...</p>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800">{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">KSNDMC OFFICE</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-bold text-slate-700">{record.punchIn}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-bold text-slate-700">{record.punchOut || '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        record.status === 'PRESENT' || record.status === 'HOLIDAY_WORK' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">System Verified</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <CalendarIcon className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No logs for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Added default export to satisfy import in App.tsx
export default MyRecords;
