import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TicketListPage } from './pages/TicketListPage';
import { AssignTechnicianModal } from './pages/AssignTechnicianModal';
import { TechnicianTicketsPage } from './pages/TechnicianTicketsPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mekong_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Mặc định tài khoản Quản lý TT2
    return {
      id: 1,
      fullName: 'Trần Văn Quản Lý (TT2)',
      role: 'CENTER_MANAGER',
      centerId: 2
    };
  });

  const [activeTab, setActiveTab] = useState('unassigned');
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mekong_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mekong_token');
    localStorage.removeItem('mekong_user');
    setCurrentUser(null);
  };

  const handleSwitchRole = () => {
    if (currentUser?.role === 'CENTER_MANAGER') {
      const ktvUser = {
        id: 5,
        fullName: 'Nguyễn Văn A (KTV)',
        role: 'TECHNICIAN',
        centerId: 2
      };
      setCurrentUser(ktvUser);
      localStorage.setItem('mekong_user', JSON.stringify(ktvUser));
      setActiveTab('technician');
    } else {
      const managerUser = {
        id: 1,
        fullName: 'Trần Văn Quản Lý (TT2)',
        role: 'CENTER_MANAGER',
        centerId: 2
      };
      setCurrentUser(managerUser);
      localStorage.setItem('mekong_user', JSON.stringify(managerUser));
      setActiveTab('unassigned');
    }
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'unassigned' && (
          <TicketListPage
            key={refreshTrigger}
            onSelectTicketForAssign={setSelectedTicketForAssign}
          />
        )}

        {activeTab === 'technician' && (
          <TechnicianTicketsPage
            key={refreshTrigger}
            currentUserId={currentUser.id}
          />
        )}
      </main>

      {/* Modal Phân công kỹ thuật viên (M2) */}
      {selectedTicketForAssign && (
        <AssignTechnicianModal
          ticket={selectedTicketForAssign}
          onClose={() => setSelectedTicketForAssign(null)}
          onSuccess={() => {
            setSelectedTicketForAssign(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* Footer chuẩn đồ án tốt nghiệp */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Chuyên đề tốt nghiệp 1 (HK261) — Khoa Công nghệ Thông tin, Đại học Văn Lang
        </p>
        <p className="mt-1">
          Hệ thống Smart CRM Mekong Mobile • Phân hệ Luồng L4: Phân công KTV và lịch hẹn • Sinh viên: Nguyễn Trần Hoàng Vinh (MSSV: 2374802010562)
        </p>
      </footer>
    </div>
  );
}

