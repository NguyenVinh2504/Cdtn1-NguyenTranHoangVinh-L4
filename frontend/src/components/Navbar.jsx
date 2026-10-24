import React from 'react';
import { ShieldCheck, User, LogOut, Wrench, ClipboardList, RefreshCw, Cpu, Activity } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, currentUser, onLogout, onSwitchRole }) {
  const isManager = currentUser?.role === 'CENTER_MANAGER';

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Enterprise Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  MEKONG MOBILE CRM
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  Phân hệ L4
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Điều phối Kỹ thuật viên & Lịch hẹn</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300 font-medium">TT2 Tân Bình</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'unassigned'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Phiếu chờ điều phối</span>
            </button>

            <button
              onClick={() => setActiveTab('technician')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'technician'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Không gian Kỹ thuật viên</span>
            </button>
          </nav>

          {/* User Profile & Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center font-bold text-xs text-indigo-200">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-slate-200 leading-tight">
                  {currentUser?.fullName}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {isManager ? 'Quản lý TT bảo hành' : 'Kỹ thuật viên sửa chữa'}
                </span>
              </div>
            </div>

            <button
              onClick={onSwitchRole}
              title="Chuyển đổi nhanh giữa Quản lý và Kỹ thuật viên để demo luồng"
              className="px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-750 hover:from-slate-700 hover:to-slate-650 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                Đổi vai trò ({isManager ? 'Sang KTV' : 'Sang QL'})
              </span>
            </button>

            <button
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
