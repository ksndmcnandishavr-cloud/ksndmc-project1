
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Layout from './components/Layout.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import EmployeeDashboard from './pages/EmployeeDashboard.tsx';
import EmployeeList from './pages/EmployeeList.tsx';
import AttendanceTracking from './pages/AttendanceTracking.tsx';
import LeaveManagement from './pages/LeaveManagement.tsx';
import MyRecords from './pages/MyRecords.tsx';
import Reports from './pages/Reports.tsx';
import { User, UserRole } from './types.ts';
import { dbService } from './services/db.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('ksndmc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Initialize cloud database (seed if empty)
    dbService.initializeCloudDatabase().catch(console.error);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ksndmc_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ksndmc_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {user.role === UserRole.ADMIN ? (
            <>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/attendance" element={<AttendanceTracking />} />
              <Route path="/leaves" element={<LeaveManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<EmployeeDashboard user={user} />} />
              <Route path="/leaves" element={<LeaveManagement employeeId={user.employeeId} />} />
              <Route path="/records" element={<MyRecords user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
