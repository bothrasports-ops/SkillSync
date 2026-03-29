
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { smsService } from '../services/smsService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'identify' | 'password' | 'signup' | 'otp'>('identify');
  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [tempProfile, setTempProfile] = useState<User | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const handleSimulatedSms = (e: any) => {
        setActiveCode(e.detail.code);
        setShowSmsToast(true);
        setTimeout(() => setShowSmsToast(false), 10000);
    };
    window.addEventListener('ts-simulated-sms', handleSimulatedSms);
    return () => window.removeEventListener('ts-simulated-sms', handleSimulatedSms);
  }, []);

  const handleIdentifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    setError(null);

    try {
        const result = await db.checkAccess(identifier.trim());
        if (result.status === 'existing' && result.profile) {
            onLogin(result.profile);
        } else {
            // If not found or invited, allow signup
            if (!identifier.includes('@')) setPhone(identifier);
            setStep('signup');
        }
    } catch (err: any) {
        setError(err.message || "Network failure. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleStartSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !phone) {
          setError("Name and Phone are required.");
          return;
      }

      setLoading(true);
      setError(null);

      try {
          const user = await db.signUp(identifier.includes('@') ? identifier : `${phone}@guest.local`, {
              name,
              phone,
              bio,
              isVerified: true
          });
          onLogin(user);
      } catch (err: any) {
          console.error("SignUp Catch Block:", err);
          setError(err.message || "Profile creation failed.");
          setLoading(false);
      }
  };

  const handleOtpChange = (index: number, value: string) => {
      // No longer used but kept for type safety if needed elsewhere
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // No longer used
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      // No longer used
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50 overflow-hidden">

        {/* SMS Banner */}
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[340px] transition-all duration-700 ease-out ${showSmsToast ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}`}>
            <div className="bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-4 flex gap-4 items-center ring-1 ring-black/5">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                    <i className="fa-solid fa-bolt-lightning text-white text-lg"></i>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Security Hub • Now</span>
                        <button onClick={() => setShowSmsToast(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                            <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>
                    <p className="text-xs text-slate-800 leading-tight">
                        Verification code: <span className="text-indigo-600 font-black text-sm tracking-widest">{activeCode}</span>
                    </p>
                </div>
            </div>
        </div>

        <div className="w-full max-w-md animate-slide-up">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-100 rotate-6">
                    <i className="fa-solid fa-bolt-lightning text-4xl"></i>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">TimeShare</h1>
                <p className="text-slate-500 font-medium px-4">Global Skill-Sharing Community</p>
            </div>

            <div className={`bg-white p-8 sm:p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden transition-all duration-500 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"></div>

                {step === 'identify' && (
                    <form onSubmit={handleIdentifySubmit} className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-slate-800">Welcome Back</h2>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Identify</span>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email or Phone Number</label>
                            <div className="relative group">
                                <i className="fa-solid fa-user-tag absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"></i>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="your@email.com or 555-0000"
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-700 font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-slate-800 active:scale-95">
                            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Continue"}
                        </button>
                    </form>
                )}

                {step === 'signup' && (
                    <form onSubmit={handleStartSignUp} className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-black text-slate-800">Create Account</h2>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Sign-Up</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-500 transition-all font-bold text-slate-700" placeholder="e.g. Jane Smith" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-500 transition-all font-bold text-slate-700" placeholder="+1..." required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700" rows={2} placeholder="I can teach..." />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl transition-all hover:bg-slate-800 active:scale-95">
                            Join Community
                        </button>
                        <button type="button" onClick={() => setStep('identify')} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            Back to Login
                        </button>
                    </form>
                )}

                {error && (
                    <div className="mt-8 bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl text-xs flex gap-4 animate-in fade-in slide-in-from-top-2">
                        <i className="fa-solid fa-circle-exclamation mt-0.5 text-lg"></i>
                        <p className="font-bold leading-relaxed">{error}</p>
                    </div>
                )}
            </div>

            <p className="mt-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <i className="fa-solid fa-shield-halved mr-2 text-indigo-400/50"></i>
                Private Skill-Share Network
            </p>
        </div>

        <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-8px); }
                50% { transform: translateX(8px); }
                75% { transform: translateX(-8px); }
            }
        `}</style>
    </div>
  );
};

export default Login;
