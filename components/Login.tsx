
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    setLoading(true);
    setError(null);
    try {
        const user = await db.verifyAndSignIn(contact.trim());
        onLogin(user);
    } catch (err: any) {
        if (err.message === "NOT_INVITED") {
            setError("Membership is currently by invitation only. Please contact an existing member to join the community.");
        } else {
            setError("Something went wrong. Please check your connection and try again.");
            console.error(err);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md animate-slide-up">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200 rotate-6">
                    <i className="fa-solid fa-bolt-lightning text-4xl"></i>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">TimeShare</h1>
                <p className="text-slate-500 font-medium px-4 leading-relaxed">
                    The peer-to-peer marketplace where your time is the only currency that matters.
                </p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"></div>

                <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">01</span>
                    Access the Hub
                </h2>

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email or Phone</label>
                        <div className="relative">
                            <i className="fa-solid fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="name@example.com"
                                className={`w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 transition-all focus:outline-none focus:bg-white ${error ? 'border-red-100 focus:border-red-400' : 'border-transparent focus:border-indigo-500'}`}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs leading-relaxed flex gap-3 animate-in fade-in slide-in-from-top-2">
                            <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !contact}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <i className="fa-solid fa-circle-notch animate-spin"></i>
                        ) : (
                            <>
                                <span>Continue to Dashboard</span>
                                <i className="fa-solid fa-arrow-right-long text-slate-400"></i>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <i className="fa-solid fa-lock mr-1.5"></i>
                        Secure Invitation-Only Network
                    </p>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4">
                <div className="bg-white/50 backdrop-blur p-6 rounded-[2rem] border border-slate-200/50">
                    <i className="fa-solid fa-clock text-indigo-500 mb-3 block text-xl"></i>
                    <h4 className="text-sm font-bold text-slate-800">40 Free Hours</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Welcome Credit</p>
                </div>
                <div className="bg-white/50 backdrop-blur p-6 rounded-[2rem] border border-slate-200/50">
                    <i className="fa-solid fa-handshake-angle text-indigo-500 mb-3 block text-xl"></i>
                    <h4 className="text-sm font-bold text-slate-800">P2P Sharing</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Verified Community</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;