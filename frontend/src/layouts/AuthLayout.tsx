import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-200 bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">CollabSuite</h1>
          <p className="text-sm mt-1 text-slate-500">
            Unified SaaS Workspace for Teams
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};