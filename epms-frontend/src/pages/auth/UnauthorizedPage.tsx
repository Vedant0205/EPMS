import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (isTeacher) {
      navigate('/teacher/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            403 • Role Access Denied
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-3">
            Access Restricted by RBAC Policy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Your current account role is <strong className="text-slate-800 dark:text-slate-200 uppercase">{user?.role}</strong>. You do not possess the required security permissions to view this destination.
          </p>
        </div>

        {/* RBAC Info Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Logged in as:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Assigned Role:</span>
            <span className="font-bold uppercase text-blue-600 dark:text-blue-400">{user?.role}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">ID Number:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{user?.identifier}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleReturn}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {isTeacher ? 'Faculty Portal' : 'Student Portal'}</span>
          </button>
          <button
            onClick={logout}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
