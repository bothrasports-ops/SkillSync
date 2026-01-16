
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'signup'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
        const result = await db.checkAccess(email.trim());
        if (result.status === 'existing' && result.profile) {
            onLogin(result.profile);
        } else if (result.status === 'invited') {
            await db.sendOTP(email);
            setStep('otp');
            setOtpSentNotice(true);
            setTimeout(() => setOtpSentNotice(false), 5000);
        } else {
            setError("Membership is by invitation only. Please contact an existing member.");
        }
    } catch (err) {
        setError("Network error. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError(null);

    try {
        const isValid = await db.verifyOTP(email, otp);
        if (isValid) {
            setStep('signup');
        } else {
            setError("Invalid verification code. Please try again.");
        }
    } catch (err) {
        setError("Verification failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
        const user = await db.signUp(email.trim(), { name, phone, bio });
        onLogin(user);
    } catch (err) {
        setError("Failed to create profile. Please try again.");
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
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">TimeShare</h1>
                <p className="text-slate-500 font-medium px-4">Community skill-sharing hub.</p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"></div>

                {step === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">01</span>
                            Enter Email
                        </h2>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-slate-800">
                            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Sign In / Register"}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Verify Email</h2>
                            <button onClick={() => setStep('email')} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Change Email</button>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            We've sent a 6-digit verification code to <span className="font-bold text-slate-600">{email}</span>.
                        </p>

                        {otpSentNotice && (
                            <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-bounce">
                                <i className="fa-solid fa-envelope-open-text"></i>
                                Check your console for the OTP code!
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">6-Digit Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none text-center text-3xl font-black tracking-[0.5em] text-slate-800"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-indigo-700">
                            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Verify & Continue"}
                        </button>
                    </form>
                )}

                {step === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
                        <p className="text-xs text-slate-400 mb-6 italic">Welcome! As an invited guest, you start with 40 hours.</p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="John Doe" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="+1..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio (Tell us what you offer)</label>
                                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700" rows={3} placeholder="Photography, Cooking, Web Design..." />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-slate-800">
                            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Start Sharing Time"}
                        </button>
                    </form>
                )}

                {error && (
                    <div className="mt-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs flex gap-3 animate-in fade-in">
                        <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                        <p>{error}</p>
                    </div>
                )}
            </div>

            <p className="mt-8 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
                <i className="fa-solid fa-shield-halved mr-2"></i>
                P2P Trust Network
            </p>
        </div>
    </div>
  );
};

export default Login;
