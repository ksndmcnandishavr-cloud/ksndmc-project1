import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Filter,
  Trash2,
  Edit,
  X,
  ShieldCheck,
  CalendarDays,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  FileText,
  ChevronDown
} from 'lucide-react';
import { dbService } from '../services/db.ts';
import { EmployeeDetails, EmploymentType } from '../types.ts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const EmployeeList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetails | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    designation: '',
    section: '',
    contact: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    dateOfBirth: '1990-01-01',
    employmentType: EmploymentType.PERMANENT,
    username: '',
    password: '',
    balances: {
      cl: 12,
      ml: 10,
      el: 30,
      rh: 2,
      co: 0
    }
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await dbService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '', employeeId: '', designation: '', section: '', contact: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      dateOfBirth: '1990-01-01',
      employmentType: EmploymentType.PERMANENT,
      username: '', password: '',
      balances: { cl: 12, ml: 10, el: 30, rh: 2, co: 0 }
    });
    setEditingEmployee(null);
  };

  const handleEditClick = (emp: EmployeeDetails) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      employeeId: emp.employeeId,
      designation: emp.designation,
      section: emp.section,
      contact: emp.contact || '',
      dateOfJoining: emp.dateOfJoining,
      dateOfBirth: emp.dateOfBirth,
      employmentType: emp.employmentType,
      username: emp.username || '',
      password: emp.password || '',
      balances: emp.leaveBalances || { cl: 12, ml: 10, el: 30, rh: 2, co: 0 }
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the system? This action cannot be undone.`)) {
      try {
        await dbService.deleteEmployee(id);
        fetchEmployees();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        employeeId: formData.employeeId,
        designation: formData.designation,
        section: formData.section,
        contact: formData.contact,
        dateOfJoining: formData.dateOfJoining,
        dateOfBirth: formData.dateOfBirth,
        employmentType: formData.employmentType,
        username: formData.username,
        password: formData.password,
        leaveBalances: formData.balances,
        location: 'Bengaluru',
        isActive: true
      };

      if (editingEmployee) {
        await dbService.updateEmployee(editingEmployee.id, payload);
      } else {
        await dbService.addEmployee(payload);
      }

      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.section.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Export Logic
  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportToPDF = (data: any[], title: string, fileName: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    
    const headers = [["Name", "ID", "Designation", "Section", "Joining Date", "CL", "ML", "EL"]];
    const rows = data.map(emp => [
      emp.name, 
      emp.employeeId, 
      emp.designation, 
      emp.section, 
      emp.dateOfJoining,
      emp.leaveBalances?.cl || 0,
      emp.leaveBalances?.ml || 0,
      emp.leaveBalances?.el || 0
    ]);

    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 20,
    });
    
    doc.save(`${fileName}.pdf`);
  };

  const handleExportAll = (format: 'excel' | 'pdf') => {
    const data = employees.map(({ id, isActive, password, ...rest }) => rest);
    if (format === 'excel') {
      exportToExcel(data, `KSNDMC_All_Employees_${new Date().toISOString().split('T')[0]}`);
    } else {
      exportToPDF(employees, "KSNDMC Employee Directory", `KSNDMC_All_Employees_${new Date().toISOString().split('T')[0]}`);
    }
    setShowExportMenu(false);
  };

  const handleExportIndividual = (emp: EmployeeDetails, format: 'excel' | 'pdf') => {
    const data = [{
      Name: emp.name,
      ID: emp.employeeId,
      Designation: emp.designation,
      Section: emp.section,
      Contact: emp.contact,
      DOB: emp.dateOfBirth,
      JoiningDate: emp.dateOfJoining,
      CL: emp.leaveBalances.cl,
      ML: emp.leaveBalances.ml,
      EL: emp.leaveBalances.el,
      RH: emp.leaveBalances.rh,
      CO: emp.leaveBalances.co
    }];

    if (format === 'excel') {
      exportToExcel(data, `Employee_${emp.employeeId}_Details`);
    } else {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Employee Information Sheet", 14, 20);
      doc.setFontSize(12);
      doc.text(`Official Document - KSNDMC`, 14, 30);
      
      const details = [
        ["Field", "Value"],
        ["Full Name", emp.name],
        ["Employee ID", emp.employeeId],
        ["Designation", emp.designation],
        ["Section", emp.section],
        ["Contact", emp.contact],
        ["Joining Date", emp.dateOfJoining],
        ["Date of Birth", emp.dateOfBirth],
        ["Employment Type", emp.employmentType],
        ["", ""],
        ["LEAVE BALANCES", ""],
        ["Casual Leave (CL)", String(emp.leaveBalances.cl)],
        ["Medical Leave (ML)", String(emp.leaveBalances.ml)],
        ["Earned Leave (EL)", String(emp.leaveBalances.el)],
        ["Restricted Holiday (RH)", String(emp.leaveBalances.rh)],
        ["Compensatory Off (CO)", String(emp.leaveBalances.co)],
      ];

      (doc as any).autoTable({
        body: details,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      doc.save(`Employee_${emp.employeeId}_Profile.pdf`);
    }
    setActiveDownloadMenu(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Employee Management</h1>
          <p className="text-slate-500 font-medium tracking-tight">Direct oversight of {employees.length} staff records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-sm"
            >
              <Download className="w-5 h-5" />
              Export All
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => handleExportAll('excel')}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
                </button>
                <button 
                  onClick={() => handleExportAll('pdf')}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-3 transition-colors"
                >
                  <FileText className="w-4 h-4" /> PDF (.pdf)
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 font-bold transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or division..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold transition-all">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest text-left">
                <th className="px-6 py-4">Employee Details</th>
                <th className="px-6 py-4 text-center">Leave Balances</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse">
                    Loading records...
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{emp.employeeId} • {emp.section}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span title="Casual Leave" className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-black border border-amber-100">{emp.leaveBalances?.cl ?? 0}</span>
                        <span title="Medical Leave" className="px-2 py-1 bg-rose-50 text-rose-700 rounded text-[10px] font-black border border-rose-100">{emp.leaveBalances?.ml ?? 0}</span>
                        <span title="Earned Leave" className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black border border-blue-100">{emp.leaveBalances?.el ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        emp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDownloadMenu(activeDownloadMenu === emp.id ? null : emp.id)}
                            className={`p-2 rounded-lg transition-all border ${
                              activeDownloadMenu === emp.id 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-100'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {activeDownloadMenu === emp.id && (
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                              <button 
                                onClick={() => handleExportIndividual(emp, 'excel')}
                                className="w-full px-3 py-2 text-left text-[10px] font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-50 flex items-center gap-2"
                              >
                                <FileSpreadsheet className="w-3 h-3" /> EXCEL
                              </button>
                              <button 
                                onClick={() => handleExportIndividual(emp, 'pdf')}
                                className="w-full px-3 py-2 text-left text-[10px] font-black text-slate-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2"
                              >
                                <FileText className="w-3 h-3" /> PDF
                              </button>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleEditClick(emp)}
                          className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(emp.id, emp.name)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingEmployee ? <Edit className="w-6 h-6 text-blue-600" /> : <UserPlus className="w-6 h-6 text-emerald-600" />}
                {editingEmployee ? 'Update Staff Member' : 'Add New Employee'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" required 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Employee ID</label>
                  <input 
                    type="text" required 
                    value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Designation</label>
                  <input 
                    type="text" required 
                    value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section / Division</label>
                  <input 
                    type="text" required 
                    value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CalendarDays className="w-3 h-3" /> Date of Birth
                  </label>
                  <input 
                    type="date" required 
                    value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of Joining</label>
                  <input 
                    type="date" required 
                    value={formData.dateOfJoining} onChange={e => setFormData({...formData, dateOfJoining: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                  />
                </div>
              </div>

              <div className="bg-emerald-50/50 rounded-2xl p-6 mb-8 border border-emerald-100">
                <div className="flex items-center gap-2 mb-6">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-800">Leave Balances</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CL</label>
                    <input type="number" value={formData.balances.cl} onChange={e => setFormData({...formData, balances: {...formData.balances, cl: parseInt(e.target.value) || 0}})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ML</label>
                    <input type="number" value={formData.balances.ml} onChange={e => setFormData({...formData, balances: {...formData.balances, ml: parseInt(e.target.value) || 0}})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">EL</label>
                    <input type="number" value={formData.balances.el} onChange={e => setFormData({...formData, balances: {...formData.balances, el: parseInt(e.target.value) || 0}})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">RH</label>
                    <input type="number" value={formData.balances.rh} onChange={e => setFormData({...formData, balances: {...formData.balances, rh: parseInt(e.target.value) || 0}})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CO</label>
                    <input type="number" value={formData.balances.co} onChange={e => setFormData({...formData, balances: {...formData.balances, co: parseInt(e.target.value) || 0}})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-800">Login Credentials</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
                    <input 
                      type="text" required 
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                    <input 
                      type="password" required 
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" 
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all disabled:opacity-50 ${editingEmployee ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
              >
                {isSubmitting ? 'Syncing...' : (editingEmployee ? 'Update Account Information' : 'Register New Employee')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;