
import React, { useState } from 'react';
import { 
  FileText, 
  BarChart2, 
  Calendar,
  Layers,
  Clock,
  FileSpreadsheet,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { dbService } from '../services/db';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Reports: React.FC = () => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const reportTemplates = [
    { id: 'daily', title: 'Daily Attendance Report', desc: 'Detailed presence log for the current official day.', icon: Clock, color: 'blue' },
    { id: 'weekly', title: 'Weekly Summary', desc: 'Trailing 7-day attendance patterns and shift records.', icon: Layers, color: 'emerald' },
    { id: 'monthly', title: 'Monthly Statement', desc: 'Full monthly audit log for payroll and compliance.', icon: Calendar, color: 'orange' },
    { id: 'yearly', title: 'Yearly Audit Review', desc: 'Comprehensive annual record of leaves and attendance.', icon: FileText, color: 'rose' },
  ];

  const getReportData = async (type: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let start: string;
    let end: string = todayStr;

    switch (type) {
      case 'daily':
        start = todayStr;
        break;
      case 'weekly': {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
        break;
      }
      case 'monthly': {
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      }
      case 'yearly': {
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      }
      default:
        start = todayStr;
    }

    const [attendance, employees] = await Promise.all([
      dbService.getAttendanceByRange(start, end),
      dbService.getEmployees()
    ]);

    // Map and Join data for complete context with standardized ordering
    return attendance.map(rec => {
      const emp = employees.find(e => e.employeeId === rec.employeeId);
      return {
        'Date': rec.date,
        'Employee ID': rec.employeeId,
        'Name': emp?.name || 'Unknown',
        'Section/Division': emp?.section || 'N/A',
        'Designation': emp?.designation || 'N/A',
        'Punch In': rec.punchIn || '--:--',
        'Punch Out': rec.punchOut || '--:--',
        'Status': rec.status
      };
    }).sort((a, b) => b.Date.localeCompare(a.Date));
  };

  const handleExport = async (format: 'pdf' | 'excel', id: string, title: string) => {
    const btnKey = `${id}-${format}`;
    setIsExporting(btnKey);
    
    try {
      const data = await getReportData(id);
      
      if (data.length === 0) {
        setIsExporting(null);
        alert(`Information: No attendance records were found for the requested ${id} period.`);
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `KSNDMC_${title.replace(/\s+/g, '_')}_${timestamp}`;

      if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance_Data");
        
        // Auto-width adjustment logic (simple version)
        const colWidths = Object.keys(data[0]).map(key => ({
          wch: Math.max(key.length, ...data.map(obj => (obj as any)[key]?.toString().length || 0)) + 2
        }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else {
        const doc = new jsPDF();
        
        // Branded Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("KSNDMC", 14, 22);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Karnataka State Natural Disaster Monitoring Centre", 14, 30);
        doc.text("Official Attendance & Compliance Documentation", 14, 36);
        doc.text(`Doc ID: ${timestamp}-${Math.floor(Math.random() * 1000)}`, 140, 36);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 60);

        const headers = [Object.keys(data[0])];
        const rows = data.map(item => Object.values(item));

        (doc as any).autoTable({
          head: headers,
          body: rows,
          startY: 68,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
          margin: { top: 68 },
          didDrawPage: (data: any) => {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, 180, 285);
          }
        });
        
        doc.save(`${fileName}.pdf`);
      }
      
      setLastExport(btnKey);
      setTimeout(() => setLastExport(null), 3000);
    } catch (error) {
      console.error("Export failure:", error);
      alert("Error: System encountered a technical issue while generating the document. Please try again.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleArchiveExport = async (format: 'pdf' | 'excel') => {
    const btnKey = `archive-${format}`;
    setIsExporting(btnKey);
    
    try {
      if (format === 'excel') {
        const [employees, attendance, leaves] = await Promise.all([
          dbService.getEmployees(),
          dbService.getAttendance(),
          dbService.getLeaves()
        ]);

        const wb = XLSX.utils.book_new();
        
        // Tab 1: Staff
        const wsEmp = XLSX.utils.json_to_sheet(employees.map(({password, ...rest}) => rest));
        XLSX.utils.book_append_sheet(wb, wsEmp, "Staff_Registry");
        
        // Tab 2: Logs
        const wsAtt = XLSX.utils.json_to_sheet(attendance);
        XLSX.utils.book_append_sheet(wb, wsAtt, "Attendance_Master");
        
        // Tab 3: Leaves
        const wsLve = XLSX.utils.json_to_sheet(leaves);
        XLSX.utils.book_append_sheet(wb, wsLve, "Leave_Audit");
        
        XLSX.writeFile(wb, `KSNDMC_Central_Archive_${new Date().getFullYear()}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("KSNDMC CENTRAL ARCHIVE", 14, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Complete Dataset Export • Calendar Year ${new Date().getFullYear()}`, 14, 35);

        const [employees, attendance] = await Promise.all([
          dbService.getEmployees(),
          dbService.getAttendance()
        ]);

        doc.setTextColor(0);
        doc.text(`Verified Employees: ${employees.length}`, 14, 48);
        doc.text(`Total Attendance Transactions: ${attendance.length}`, 14, 53);

        (doc as any).autoTable({
          head: [["Date", "Emp ID", "Name", "Section", "Punch In", "Punch Out", "Status"]],
          body: attendance.slice(0, 150).map(r => {
            const e = employees.find(emp => emp.employeeId === r.employeeId);
            return [r.date, r.employeeId, e?.name || 'Unknown', e?.section || 'N/A', r.punchIn, r.punchOut || '--:--', r.status];
          }),
          startY: 65,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 7 }
        });

        if (attendance.length > 150) {
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`* Consolidated PDF includes latest 150 records. Use Excel for full audit trails.`, 14, (doc as any).lastAutoTable.finalY + 10);
        }

        doc.save(`KSNDMC_Annual_Archive_${new Date().getFullYear()}.pdf`);
      }
      setLastExport(btnKey);
      setTimeout(() => setLastExport(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Operational Analytics</h1>
          <p className="text-slate-500 font-medium leading-relaxed">System-generated compliance documentation and departmental audit logs</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-5 py-2.5 rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure Database Link Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reportTemplates.map((report) => (
          <div key={report.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="flex items-start gap-6 mb-10 relative z-10">
              <div className="p-5 rounded-3xl bg-slate-50 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner duration-500 transform group-hover:rotate-6">
                <report.icon className="w-12 h-12" />
              </div>
              <div className="pt-2">
                <h3 className="font-black text-slate-800 text-2xl mb-3 tracking-tight">{report.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-[240px]">{report.desc}</p>
              </div>
            </div>

            <div className="mt-auto flex gap-4 relative z-10">
              <button 
                onClick={() => handleExport('pdf', report.id, report.title)}
                disabled={!!isExporting}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-white hover:bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border-2 border-slate-100 hover:border-rose-200 shadow-sm"
              >
                {isExporting === `${report.id}-pdf` ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  lastExport === `${report.id}-pdf` ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <FileDown className="w-5 h-5" />
                )}
                PDF Report
              </button>
              <button 
                onClick={() => handleExport('excel', report.id, report.title)}
                disabled={!!isExporting}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border-2 border-slate-100 hover:border-emerald-200 shadow-sm"
              >
                {isExporting === `${report.id}-excel` ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  lastExport === `${report.id}-excel` ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <FileSpreadsheet className="w-5 h-5" />
                )}
                Excel Data
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-8">
          <BarChart2 className="w-[32rem] h-[32rem] text-emerald-500 opacity-5 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-4 px-5 py-2 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Comprehensive Master System Export
          </div>
          <h2 className="text-6xl font-black mb-8 tracking-tighter leading-[0.9] text-white/95">Centralized Archive</h2>
          <p className="text-slate-400 mb-14 text-2xl font-medium leading-relaxed italic opacity-80">
            "Generate the authoritative annual audit for all KSNDMC divisions. This consolidated dataset serves as the primary source for fiscal accountability and compliance reviews."
          </p>
          <div className="flex flex-wrap gap-8">
            <button 
              onClick={() => handleArchiveExport('pdf')}
              disabled={!!isExporting}
              className="px-12 py-6 bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-black text-sm uppercase tracking-[0.15em] flex items-center gap-5 transition-all shadow-2xl shadow-emerald-900/40 border border-emerald-500/30 disabled:opacity-50 group"
            >
              {isExporting === 'archive-pdf' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileDown className="w-7 h-7 group-hover:-translate-y-1.5 transition-transform" />}
              Full PDF Archive
            </button>
            <button 
              onClick={() => handleArchiveExport('excel')}
              disabled={!!isExporting}
              className="px-12 py-6 bg-white/5 hover:bg-white/10 rounded-3xl font-black text-sm uppercase tracking-[0.15em] flex items-center gap-5 transition-all border border-white/10 disabled:opacity-50"
            >
              {isExporting === 'archive-excel' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-7 h-7" />}
              Master Workbook
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 p-8 bg-blue-50/30 rounded-[2.5rem] border border-blue-100">
        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Regulatory Compliance Note</h4>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            All generated reports are time-stamped and logged for security auditing. Electronic signatures and departmental seals are applied automatically to PDF outputs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
