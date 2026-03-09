
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum EmploymentType {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
  section: string;
  email: string;
  employeeId: string;
}

export interface GovernmentHoliday {
  date: string;
  name: string;
  type: 'NATIONAL' | 'STATE' | 'FESTIVAL';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY_WORK';
  isCompOffCredited?: boolean;
  location?: { lat: number; lng: number };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
}

export interface LeaveBalances {
  cl: number; // Casual Leave
  ml: number; // Medical Leave
  el: number; // Earned Leave
  rh: number; // Restricted Holiday
  co: number; // Compensatory Off
}

export interface EmployeeDetails {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  section: string;
  location: string;
  contact: string;
  dateOfJoining: string;
  dateOfBirth: string;
  employmentType: EmploymentType;
  isActive: boolean;
  username?: string;
  password?: string;
  leaveBalances: LeaveBalances;
}
