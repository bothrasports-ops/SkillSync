import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole } from '../types';

export const Auth: React.FC = () => {
  const { login, register, users } = useApp();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginEmail);
    if (user) {
        login(loginEmail);
    } else {
        setError('User not found');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const success = register(regName, regEmail, inviteCode);
    if (!success) {
        setError('Invalid invite code or code already used.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to SkillSync</h1>
            <p className="text-gray-500 mt-2">Time-banking community.</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
                {error}
            </div>
        )}

        {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    Sign In
                </button>
                <div className="text-center mt-4">
                     <p className="text-sm text-gray-500">
                        Don't have an account?
                        <button type="button" onClick={() => { setMode('REGISTER'); setError(''); }} className="ml-1 text-indigo-600 font-semibold hover:underline">
                            Join with Code
                        </button>
                     </p>
                </div>

                {/* Demo Helper */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-400 mb-2">Demo Accounts</p>
                    <div className="flex gap-2 justify-center">
                        <button type="button" onClick={() => setLoginEmail('alice@skillsync.com')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                            Admin Alice
                        </button>
                         <button type="button" onClick={() => setLoginEmail('bob@example.com')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                            User Bob
                        </button>
                    </div>
                </div>
            </form>
        ) : (
            <form onSubmit={handleRegister} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Code</label>
                    <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="XXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono tracking-widest uppercase"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    Create Account
                </button>
                 <div className="text-center mt-4">
                     <button type="button" onClick={() => { setMode('LOGIN'); setError(''); }} className="text-sm text-indigo-600 font-semibold hover:underline">
                        Back to Login
                    </button>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">Try code: <span className="font-mono">WELCOME2024</span></p>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};
