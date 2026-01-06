
import React, { useState } from 'react';
import { useApp } from '../store';
import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, register, isLoading, dbStatus, dbErrorMessage } = useApp();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(loginEmail);
    if (!success) setError('User not found. Please register with an invite code.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await register(regName, regEmail, inviteCode);
    if (!result.success) {
        setError(result.message || 'Registration failed.');
    }
  };

  const StatusIndicator = () => {
    if (dbStatus === 'connecting') return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
            CONNECTING DB...
        </div>
    );
    if (dbStatus === 'error') return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 group relative cursor-help">
            <AlertCircle size={10} />
            DB CONNECTION ERROR
            <div className="absolute bottom-full mb-2 left-0 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {dbErrorMessage}
            </div>
        </div>
    );
    return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <CheckCircle2 size={10} />
            DB CONNECTED
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-4">
            <StatusIndicator />
        </div>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl p-3">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/10613/10613725.png"
                  alt="SkillSync"
                  className="w-full h-full object-contain brightness-0 invert"
                />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to SkillSync</h1>
            <p className="text-gray-500 mt-2">Connecting Communities</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 animate-fade-in">
                {error}
            </div>
        )}

        {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        disabled={isLoading}
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
                    />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || dbStatus === 'error'}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center disabled:bg-gray-400 disabled:shadow-none"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Sign In'}
                </button>
                <div className="text-center mt-4">
                     <p className="text-sm text-gray-500">
                        Don't have an account?
                        <button type="button" onClick={() => { setMode('REGISTER'); setError(''); }} className="ml-1 text-indigo-600 font-semibold hover:underline">
                            Join with Code
                        </button>
                     </p>
                </div>
            </form>
        ) : (
            <form onSubmit={handleRegister} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Code</label>
                    <input
                        type="text"
                        required
                        disabled={isLoading}
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="XXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono tracking-widest uppercase disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        disabled={isLoading}
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        disabled={isLoading}
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || dbStatus === 'error'}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center disabled:bg-gray-400 disabled:shadow-none"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Account'}
                </button>
                 <div className="text-center mt-4">
                     <button type="button" onClick={() => { setMode('LOGIN'); setError(''); }} className="text-sm text-indigo-600 font-semibold hover:underline">
                        Back to Login
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};
