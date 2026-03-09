
import { 
  LeaveStatus, 
  EmploymentType, 
  EmployeeDetails, 
  AttendanceRecord, 
  LeaveRequest,
  LeaveBalances,
  GovernmentHoliday
} from '../types.ts';
import { db, IS_FIREBASE_CONNECTED } from '../lib/firebase.ts';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  addDoc,
  getDoc
} from 'firebase/firestore';

const DB_KEY = 'ksndmc_database';

const GOVERNMENT_HOLIDAYS: GovernmentHoliday[] = [
  { date: '2026-01-14', name: 'Makara Sankranti', type: 'FESTIVAL' },
  { date: '2026-01-26', name: 'Republic Day', type: 'NATIONAL' },
  { date: '2026-02-15', name: 'Mahashivratri', type: 'FESTIVAL' },
  { date: '2026-03-19', name: 'Ugadi', type: 'FESTIVAL' },
  { date: '2026-03-20', name: 'Eid-ul-Fitr', type: 'FESTIVAL' },
  { date: '2026-04-14', name: 'Dr. B.R. Ambedkar Jayanti', type: 'STATE' },
  { date: '2026-05-01', name: 'May Day', type: 'STATE' },
  { date: '2026-08-15', name: 'Independence Day', type: 'NATIONAL' },
  { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'FESTIVAL' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'NATIONAL' },
  { date: '2026-10-19', name: 'Ayudha Puja', type: 'FESTIVAL' },
  { date: '2026-10-20', name: 'Vijayadashami', type: 'FESTIVAL' },
  { date: '2026-11-01', name: 'Kannada Rajyotsava', type: 'STATE' },
  { date: '2026-11-08', name: 'Naraka Chaturdashi', type: 'FESTIVAL' },
  { date: '2026-11-09', name: 'Balipadyami Deepavali', type: 'FESTIVAL' },
  { date: '2026-12-25', name: 'Christmas', type: 'FESTIVAL' },
];

interface DatabaseSchema {
  employees: EmployeeDetails[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
}

const DEFAULT_BALANCES: LeaveBalances = {
  cl: 12,
  ml: 10,
  el: 30,
  rh: 2,
  co: 0
};

const INITIAL_DATA: DatabaseSchema = {
  employees: [
    { 
      id: '1', 
      name: 'Chief Admin', 
      employeeId: 'EMP001', 
      designation: 'Section Head', 
      section: 'HR & IT', 
      location: 'Bengaluru', 
      contact: 'admin@ksndmc.gov.in', 
      dateOfJoining: '2020-01-01', 
      dateOfBirth: '1985-05-20', 
      employmentType: EmploymentType.PERMANENT, 
      isActive: true, 
      username: 'admin', 
      password: 'admin',
      leaveBalances: { ...DEFAULT_BALANCES }
    },
    { 
      id: '2', 
      name: 'Naveen Kumar', 
      employeeId: 'EMP042', 
      designation: 'Technical Assistant', 
      section: 'Seismology', 
      location: 'Bengaluru', 
      contact: 'naveen.k@ksndmc.gov.in', 
      dateOfJoining: '2022-03-15', 
      dateOfBirth: '1992-08-10', 
      employmentType: EmploymentType.PERMANENT, 
      isActive: true, 
      username: 'user', 
      password: 'user',
      leaveBalances: { ...DEFAULT_BALANCES, cl: 8, el: 22 }
    },
  ],
  attendance: [],
  leaves: []
};

const LEAVE_TYPE_KEY_MAP: Record<string, keyof LeaveBalances> = {
  'Casual Leave (CL)': 'cl',
  'Medical Leave (ML)': 'ml',
  'Earned Leave (EL)': 'el',
  'Restricted Holiday (RH)': 'rh',
  'Compensatory Off (CO)': 'co'
};

class DatabaseService {
  private localData: DatabaseSchema;

  constructor() {
    const saved = localStorage.getItem(DB_KEY);
    this.localData = saved ? JSON.parse(saved) : INITIAL_DATA;
    if (!saved) {
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.localData));
  }

  async initializeCloudDatabase() {
    // Optional: Seed initial data if empty
    if (IS_FIREBASE_CONNECTED) {
      const employeesRef = collection(db, 'employees');
      const snapshot = await getDocs(employeesRef);
      if (snapshot.empty) {
        console.log('Seeding initial data to Firebase...');
        for (const emp of INITIAL_DATA.employees) {
          await setDoc(doc(db, 'employees', emp.id), emp);
        }
      }
    }
  }

  private calculateDays(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  getHolidays(): GovernmentHoliday[] {
    return GOVERNMENT_HOLIDAYS;
  }

  async getEmployees(): Promise<EmployeeDetails[]> {
    if (IS_FIREBASE_CONNECTED) {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeDetails));
    }
    return this.localData.employees;
  }

  async getEmployeeById(employeeId: string): Promise<EmployeeDetails | null> {
    if (IS_FIREBASE_CONNECTED) {
      const q = query(collection(db, 'employees'), where('employeeId', '==', employeeId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as EmployeeDetails;
      }
      return null;
    }
    const emps = await this.getEmployees();
    return emps.find(e => e.employeeId === employeeId) || null;
  }

  async addEmployee(employee: Omit<EmployeeDetails, 'id'>) {
    if (IS_FIREBASE_CONNECTED) {
      const docRef = await addDoc(collection(db, 'employees'), employee);
      return { id: docRef.id, ...employee };
    }
    const newEmp = { ...employee, id: `EMP-${Date.now()}` } as EmployeeDetails;
    this.localData.employees.push(newEmp);
    this.save();
    return newEmp;
  }

  async updateEmployee(id: string, employee: Partial<EmployeeDetails>) {
    if (IS_FIREBASE_CONNECTED) {
      const empRef = doc(db, 'employees', id);
      await updateDoc(empRef, employee);
      return;
    }
    this.localData.employees = this.localData.employees.map(e => e.id === id ? { ...e, ...employee } : e);
    this.save();
  }

  async deleteEmployee(id: string) {
    if (IS_FIREBASE_CONNECTED) {
      await deleteDoc(doc(db, 'employees', id));
      return;
    }
    this.localData.employees = this.localData.employees.filter(e => e.id !== id);
    this.save();
  }

  async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    if (IS_FIREBASE_CONNECTED) {
      let q = query(collection(db, 'attendance'));
      if (date) {
        q = query(collection(db, 'attendance'), where('date', '==', date));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
    }
    if (!date) return this.localData.attendance;
    return this.localData.attendance.filter(a => a.date === date);
  }

  async getAttendanceByRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    if (IS_FIREBASE_CONNECTED) {
      const q = query(
        collection(db, 'attendance'), 
        where('date', '>=', startDate), 
        where('date', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
    }
    return this.localData.attendance.filter(a => a.date >= startDate && a.date <= endDate);
  }

  async addManualAttendance(record: Omit<AttendanceRecord, 'id'>) {
    const isHoliday = GOVERNMENT_HOLIDAYS.some(h => h.date === record.date);
    
    if (IS_FIREBASE_CONNECTED) {
      // Check if record exists
      const q = query(
        collection(db, 'attendance'), 
        where('employeeId', '==', record.employeeId), 
        where('date', '==', record.date)
      );
      const querySnapshot = await getDocs(q);
      
      let finalRecord: AttendanceRecord;

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'attendance', existingDoc.id), record);
        finalRecord = { id: existingDoc.id, ...existingDoc.data(), ...record } as AttendanceRecord;
      } else {
        const docRef = await addDoc(collection(db, 'attendance'), record);
        finalRecord = { id: docRef.id, ...record } as AttendanceRecord;
      }

      // Handle Comp-Off Credit
      if (isHoliday && record.status === 'HOLIDAY_WORK' && record.isCompOffCredited) {
        const empQ = query(collection(db, 'employees'), where('employeeId', '==', record.employeeId));
        const empSnapshot = await getDocs(empQ);
        if (!empSnapshot.empty) {
          const empDoc = empSnapshot.docs[0];
          const empData = empDoc.data() as EmployeeDetails;
          const newCoBalance = (empData.leaveBalances?.co || 0) + 1;
          await updateDoc(doc(db, 'employees', empDoc.id), {
            'leaveBalances.co': newCoBalance
          });
        }
      }
      return finalRecord;
    }

    // Local Storage Logic
    const existing = this.localData.attendance.find(a => a.employeeId === record.employeeId && a.date === record.date);
    let finalRecord: AttendanceRecord;

    if (existing) {
      this.localData.attendance = this.localData.attendance.map(a => a.id === existing.id ? { ...a, ...record } : a);
      finalRecord = { ...existing, ...record };
    } else {
      finalRecord = { ...record, id: `ATT-${Date.now()}` } as AttendanceRecord;
      this.localData.attendance.push(finalRecord);
    }

    if (isHoliday && record.status === 'HOLIDAY_WORK' && record.isCompOffCredited) {
      const emp = this.localData.employees.find(e => e.employeeId === record.employeeId);
      if (emp) {
        emp.leaveBalances.co = (emp.leaveBalances.co || 0) + 1;
      }
    }
    this.save();
    return finalRecord;
  }

  async punchIn(employeeId: string, location?: { lat: number; lng: number }) {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const isHoliday = GOVERNMENT_HOLIDAYS.some(h => h.date === today);
    
    const record = {
      employeeId: employeeId,
      date: today,
      punchIn: time,
      punchOut: null,
      status: isHoliday ? 'HOLIDAY_WORK' : 'PRESENT',
      location: location || { lat: 0, lng: 0 }
    };

    if (IS_FIREBASE_CONNECTED) {
      const q = query(
        collection(db, 'attendance'), 
        where('employeeId', '==', employeeId), 
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'attendance'), record);
      }
      return record;
    }

    const existing = this.localData.attendance.find(a => a.employeeId === employeeId && a.date === today);
    if (!existing) {
      this.localData.attendance.push({ ...record, id: `ATT-${Date.now()}` } as any);
      this.save();
    }
    return record;
  }

  async punchOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (IS_FIREBASE_CONNECTED) {
      const q = query(
        collection(db, 'attendance'), 
        where('employeeId', '==', employeeId), 
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { punchOut: time });
      }
      return;
    }

    this.localData.attendance = this.localData.attendance.map(a => 
      (a.employeeId === employeeId && a.date === today) ? { ...a, punchOut: time } : a
    );
    this.save();
  }

  async getLeaves(): Promise<LeaveRequest[]> {
    if (IS_FIREBASE_CONNECTED) {
      const querySnapshot = await getDocs(collection(db, 'leaves'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
    }
    return this.localData.leaves;
  }
  
  async submitLeave(leave: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) {
    const newLeaveData = {
      ...leave,
      status: LeaveStatus.PENDING,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    
    if (IS_FIREBASE_CONNECTED) {
      const docRef = await addDoc(collection(db, 'leaves'), newLeaveData);
      return { id: docRef.id, ...newLeaveData } as LeaveRequest;
    }

    const res = { ...newLeaveData, id: `LV-${Date.now()}` } as LeaveRequest;
    this.localData.leaves.push(res);
    this.save();
    return res;
  }

  async updateLeaveStatus(id: string, status: LeaveStatus) {
    if (IS_FIREBASE_CONNECTED) {
      const leaveRef = doc(db, 'leaves', id);
      const leaveSnap = await getDoc(leaveRef);
      
      if (!leaveSnap.exists()) return;
      
      const leaveData = leaveSnap.data() as LeaveRequest;
      const previousStatus = leaveData.status;

      await updateDoc(leaveRef, { status });

      if (status === LeaveStatus.APPROVED && previousStatus === LeaveStatus.PENDING) {
        const empQ = query(collection(db, 'employees'), where('employeeId', '==', leaveData.employeeId));
        const empSnapshot = await getDocs(empQ);
        
        if (!empSnapshot.empty) {
          const empDoc = empSnapshot.docs[0];
          const empData = empDoc.data() as EmployeeDetails;
          
          const days = this.calculateDays(leaveData.startDate, leaveData.endDate);
          const balanceKey = LEAVE_TYPE_KEY_MAP[leaveData.leaveType];
          
          if (balanceKey && empData.leaveBalances) {
            const currentBalance = empData.leaveBalances[balanceKey] || 0;
            const newBalance = Math.max(0, currentBalance - days);
            
            await updateDoc(doc(db, 'employees', empDoc.id), {
              [`leaveBalances.${balanceKey}`]: newBalance
            });
          }
        }
      }
      return;
    }

    // Local Storage Logic
    const leave = this.localData.leaves.find(l => l.id === id);
    if (!leave) return;

    const previousStatus = leave.status;
    this.localData.leaves = this.localData.leaves.map(l => l.id === id ? { ...l, status } : l);

    if (status === LeaveStatus.APPROVED && previousStatus === LeaveStatus.PENDING) {
      const emp = this.localData.employees.find(e => e.employeeId === leave.employeeId);
      if (emp) {
        const days = this.calculateDays(leave.startDate, leave.endDate);
        const balanceKey = LEAVE_TYPE_KEY_MAP[leave.leaveType];
        if (balanceKey && emp.leaveBalances) {
          emp.leaveBalances[balanceKey] = Math.max(0, emp.leaveBalances[balanceKey] - days);
        }
      }
    }
    this.save();
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const employees = await this.getEmployees();
    const attendance = await this.getAttendance(today);
    const leaves = await this.getLeaves();

    return {
      totalEmployees: employees.length,
      presentToday: attendance.length,
      onLeave: leaves.filter(l => {
        return l.status === LeaveStatus.APPROVED && today >= l.startDate && today <= l.endDate;
      }).length,
      pendingLeaves: leaves.filter(l => l.status === LeaveStatus.PENDING).length
    };
  }
}

export const dbService = new DatabaseService();
