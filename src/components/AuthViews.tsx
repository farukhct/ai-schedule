import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  Keyboard,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Lock,
  Mail,
  Scale
} from 'lucide-react';
import { User, AppSettings } from '../types';
import { GovtEmblem } from './GovtEmblem';

interface AuthViewsProps {
  settings?: AppSettings;
  onLoginSuccess: (user: User) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'forgot-id';

export const AuthViews: React.FC<AuthViewsProps> = ({ settings, onLoginSuccess, onShowToast }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Captcha state
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecurityQuestion, setRegSecurityQuestion] = useState('What court or judicial station are you assigned to?');
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('');

  // Forgot password form state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [fetchedQuestion, setFetchedQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Forgot User ID lookup state
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveredUsername, setRecoveredUsername] = useState<string | null>(null);

  // Generate new authentic captcha code
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      onShowToast('warning', 'Please enter your Login ID and Password.');
      return;
    }

    if (userCaptcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      onShowToast('error', 'Invalid verification security code. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: loginIdentifier,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Login failed.');
        generateCaptcha();
        return;
      }

      onShowToast('success', `Welcome, ${data.user.fullName}! Logged into Government Portal.`);
      onLoginSuccess(data.user);
    } catch {
      onShowToast('error', 'Unable to connect to local authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // Quick One-Click Demo Access
  const handleQuickLogin = (user: string, pass: string) => {
    setLoginIdentifier(user);
    setLoginPassword(pass);
    setUserCaptcha(captchaCode);
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPassword || !regConfirmPassword || !regSecurityAnswer) {
      onShowToast('warning', 'Please fill in all mandatory registration fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      onShowToast('error', 'Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      onShowToast('warning', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          username: regUsername,
          email: regEmail,
          password: regPassword,
          confirmPassword: regConfirmPassword,
          securityQuestion: regSecurityQuestion,
          securityAnswer: regSecurityAnswer
        })
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Registration failed.');
        return;
      }

      onShowToast('success', 'User registered successfully! Please log in.');
      setMode('login');
      setLoginIdentifier(regUsername);
      setLoginPassword(regPassword);
      generateCaptcha();
    } catch {
      onShowToast('error', 'Server error during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Query security question for password reset
  const handleFetchQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier) {
      onShowToast('warning', 'Please enter your Login ID or registered Email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/security-question?identifier=${encodeURIComponent(forgotIdentifier)}`);
      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'No matching user account found.');
        return;
      }

      setFetchedQuestion(data.securityQuestion);
      setForgotStep(2);
    } catch {
      onShowToast('error', 'Error querying security credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotAnswer || !forgotNewPassword || !forgotConfirmPassword) {
      onShowToast('warning', 'Please provide your answer and new password.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      onShowToast('error', 'New passwords do not match.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      onShowToast('warning', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          securityAnswer: forgotAnswer,
          newPassword: forgotNewPassword,
          confirmNewPassword: forgotConfirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Password reset failed.');
        return;
      }

      onShowToast('success', 'Password reset successfully! Please sign in.');
      setMode('login');
      setLoginIdentifier(forgotIdentifier);
      setLoginPassword(forgotNewPassword);
      setForgotStep(1);
      generateCaptcha();
    } catch {
      onShowToast('error', 'Failed to communicate with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot User ID Lookup
  const handleRecoverUserId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      onShowToast('warning', 'Please enter your registered email address.');
      return;
    }
    // Demo recovery based on typical email or admin
    if (forgotEmail.toLowerCase().includes('admin')) {
      setRecoveredUsername('admin');
    } else {
      setRecoveredUsername('staff_court');
    }
    onShowToast('success', 'User ID retrieved successfully.');
  };

  return (
    <div className="min-h-screen ibas-spectrum-bg flex flex-col justify-between text-white p-3 sm:p-6 lg:p-8 relative">
      {/* Top Urgent Notice Marquee Banners (Authentic iBAS style) */}
      <div className="w-full max-w-6xl mx-auto space-y-2 mb-4">
        {/* Urgent Notice 1 */}
        {settings?.notice1 !== '' && (
          <div className="marquee-container py-1.5 px-3 shadow-md flex items-center">
            <span className="text-xs font-bold text-white bg-rose-700/80 px-2 py-0.5 rounded mr-2 shrink-0 font-serif">
              জরুরি নোটিশঃ
            </span>
            <div className="overflow-hidden w-full whitespace-nowrap">
              <span className="marquee-text">
                {settings?.notice1 || 'মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন সিডিউল সরাসরি প্রস্তুত ও সংরক্ষণ করা যাবে।'}
              </span>
            </div>
          </div>
        )}

        {/* Notice 2 */}
        {settings?.notice2 !== '' && (
          <div className="marquee-container py-1 px-3 shadow-sm hidden sm:flex items-center bg-[#022F62]/80">
            <span className="text-xs font-semibold text-cyan-200 mr-2 shrink-0">
              বিজ্ঞপ্তিঃ
            </span>
            <div className="overflow-hidden w-full whitespace-nowrap">
              <span className="marquee-text text-white" style={{ animationDuration: '48s' }}>
                {settings?.notice2 || 'মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন কার্যযতালিকা প্রস্তুত ও রিমাইন্টডার ব্যবস্থাপনা(Justice Schedule Platform).'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area (Two Columns matching https://ibas.finance.gov.bd/login) */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* LEFT COLUMN: Welcome To & Govt Emblem */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-center lg:text-left py-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-light text-slate-200 tracking-wide mb-3">
                Welcome To
              </h3>

              {/* Brand Logo with Emblem & Official Title */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <GovtEmblem size={74} className="shrink-0 drop-shadow-lg" />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
                      Justice Schedule
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
                    Integrated Cause List & Court Management System
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Law and Justice Division · Government of the People's Republic of Bangladesh
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Sign-in Help */}
            <div className="hidden lg:block bg-[#022F62]/60 border border-[#66A0C7]/40 rounded-lg p-3.5 text-xs text-slate-200 space-y-1.5">
              <div className="font-bold text-cyan-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Quick Access Demo Credentials</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="px-2.5 py-1 bg-[#006FB8] hover:bg-[#005a96] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Admin (admin / admin123)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('judge_user', 'judge123')}
                  className="px-2.5 py-1 bg-[#2C8CBC] hover:bg-[#24759e] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Court Officer / Judge
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Login Card */}
          <div className="lg:col-span-6 max-w-md mx-auto w-full space-y-3">

            {/* LOGIN / AUTH CARD */}
            <div className="ibas-login-card p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              
              {/* LOGIN MODE */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center pb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white font-serif">
                      Login
                    </h2>
                    <p className="text-xs text-cyan-200 mt-0.5">
                      Enter your Government ID & credentials to continue
                    </p>
                  </div>

                  {/* Username / Login ID */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0068B3]">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Username / Login Id"
                        className="w-full pl-10 pr-3 py-2.5 text-xs font-semibold ibas-input"
                        autoFocus
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  {/* Password with Eye Show/Hide Toggle */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0068B3]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold ibas-input"
                        autoComplete="current-password"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#0068B3] hover:text-[#002f62] cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Captcha Input */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0068B3]">
                        <Keyboard className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={userCaptcha}
                        onChange={(e) => setUserCaptcha(e.target.value)}
                        placeholder="Enter the text displayed below"
                        className="w-full pl-10 pr-3 py-2.5 text-xs font-semibold ibas-input uppercase tracking-wider"
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  {/* Captcha Image Container & Refresh Button */}
                  <div className="flex items-center justify-between gap-3 bg-[#D9DAE6] p-2 rounded border border-[#b8bacc]">
                    <div className="flex-1 flex items-center justify-center select-none py-1 px-3 bg-white rounded border border-slate-300 tracking-widest font-mono font-bold text-lg text-slate-800 shadow-inner">
                      <span className="line-through decoration-slate-400 decoration-2 italic transform -skew-x-6 text-[#0e2a47]">
                        {captchaCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="text-xs text-[#006FB8] hover:text-[#0e2a47] font-bold flex items-center gap-1 transition-colors cursor-pointer px-2 py-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try another</span>
                    </button>
                  </div>

                  {/* Primary Login Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 btn-ibas-primary font-bold rounded text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <span>Login</span>
                      )}
                    </button>
                  </div>

                  {/* Account Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-[#66A0C7]/30 text-xs">
                    
                    {/* Self Register Button */}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="w-full py-2 btn-ibas-extension rounded text-center text-xs font-semibold cursor-pointer block"
                    >
                      Don't have an account yet? Register Yourself
                    </button>

                    {/* Forgot Password & Forgot User ID Links */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot-password');
                          setForgotStep(1);
                        }}
                        className="py-1.5 btn-ibas-extension rounded text-center text-[11px] font-medium cursor-pointer"
                      >
                        Forgot Password?
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot-id');
                          setRecoveredUsername(null);
                        }}
                        className="py-1.5 btn-ibas-extension rounded text-center text-[11px] font-medium cursor-pointer"
                      >
                        Forgot User ID
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* REGISTER MODE */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#66A0C7]/30 pb-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-serif">
                      Self Registration
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Md. Tariqul Islam"
                      className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                        Username (Login ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="tariqul_court"
                        className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                        Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="tariqul@court.gov.bd"
                        className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                      Security Question (For Recovery) *
                    </label>
                    <select
                      value={regSecurityQuestion}
                      onChange={(e) => setRegSecurityQuestion(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                    >
                      <option value="What court or judicial station are you assigned to?">What court or judicial station are you assigned to?</option>
                      <option value="What is your Government Employee ID / NID number?">What is your Government Employee ID / NID number?</option>
                      <option value="What was the district of your first civil service posting?">What was the district of your first civil service posting?</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                      Security Answer *
                    </label>
                    <input
                      type="text"
                      required
                      value={regSecurityAnswer}
                      onChange={(e) => setRegSecurityAnswer(e.target.value)}
                      placeholder="Your secret answer"
                      className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 mt-2 btn-ibas-primary font-bold rounded text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {loading ? 'Registering...' : 'Register User Account'}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD MODE */}
              {mode === 'forgot-password' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#66A0C7]/30 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setForgotStep(1);
                        setForgotAnswer('');
                        setForgotNewPassword('');
                        setForgotConfirmPassword('');
                      }}
                      className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-serif">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Security Question Recovery</span>
                    </div>
                  </div>

                  {/* Step indicators */}
                  <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
                    <div className={`py-1 rounded border transition-colors ${
                      forgotStep === 1
                        ? 'bg-[#004B87] text-white border-cyan-400 font-bold shadow-xs'
                        : 'bg-black/20 text-slate-300 border-transparent'
                    }`}>
                      1. Identify Account
                    </div>
                    <div className={`py-1 rounded border transition-colors ${
                      forgotStep === 2
                        ? 'bg-[#004B87] text-white border-cyan-400 font-bold shadow-xs'
                        : 'bg-black/20 text-slate-300 border-transparent'
                    }`}>
                      2. Answer Question & Reset
                    </div>
                  </div>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleFetchQuestion} className="space-y-3">
                      <div className="bg-[#002B49]/80 border border-[#66A0C7]/40 rounded p-2.5 text-xs text-slate-200 flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Enter your <strong>Login ID (Username)</strong> or <strong>Registered Email</strong>. The system will retrieve your confidential security question configured during registration.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                          Username or Registered Official Email *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#0068B3]">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            placeholder="e.g. admin or officer@court.gov.bd"
                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold ibas-input"
                            autoComplete="username"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 btn-ibas-primary font-bold rounded text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Querying Security Question...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Fetch Security Question</span>
                          </>
                        )}
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot-id');
                            setRecoveredUsername(null);
                          }}
                          className="text-[11px] text-cyan-300 hover:text-white underline cursor-pointer"
                        >
                          Don't remember your Username or Login ID? Click here
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-3">
                      {/* Security Question Prompt Box */}
                      <div className="bg-[#0b253f] p-3 rounded border border-cyan-500/50 text-xs shadow-inner space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                            Registered Security Question:
                          </span>
                          <span className="text-[10px] text-slate-300 font-mono">@{forgotIdentifier}</span>
                        </div>
                        <p className="text-sm font-semibold text-white bg-slate-900/60 p-2 rounded border border-slate-700/60">
                          {fetchedQuestion}
                        </p>
                      </div>

                      {/* Security Answer Input */}
                      <div>
                        <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                          Your Security Answer *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#0068B3]">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={forgotAnswer}
                            onChange={(e) => setForgotAnswer(e.target.value)}
                            placeholder="Enter the secret answer you set earlier"
                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold ibas-input"
                            autoComplete="off"
                          />
                        </div>
                        <span className="text-[10px] text-slate-300 italic mt-0.5 block">
                          Verification is case-insensitive.
                        </span>
                      </div>

                      {/* New Password & Confirm */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                            New Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showForgotNewPassword ? 'text' : 'password'}
                              required
                              value={forgotNewPassword}
                              onChange={(e) => setForgotNewPassword(e.target.value)}
                              placeholder="Min 6 characters"
                              className="w-full pl-3 pr-8 py-2 text-xs font-semibold ibas-input"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#0068B3] hover:text-[#002f62] cursor-pointer"
                            >
                              {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showForgotConfirmPassword ? 'text' : 'password'}
                              required
                              value={forgotConfirmPassword}
                              onChange={(e) => setForgotConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full pl-3 pr-8 py-2 text-xs font-semibold ibas-input"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#0068B3] hover:text-[#002f62] cursor-pointer"
                            >
                              {showForgotConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="w-1/3 py-2 bg-slate-700/80 hover:bg-slate-700 text-white font-semibold rounded text-xs cursor-pointer text-center"
                        >
                          Change ID
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-2/3 py-2 btn-ibas-primary font-bold rounded text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Verifying & Resetting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Recover & Save Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* FORGOT USER ID MODE */}
              {mode === 'forgot-id' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#66A0C7]/30 pb-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-serif">
                      Recover User ID
                    </span>
                  </div>

                  <form onSubmit={handleRecoverUserId} className="space-y-3">
                    <p className="text-xs text-slate-200">
                      Enter your registered court or government email address:
                    </p>
                    <div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. officer@court.gov.bd"
                        className="w-full px-3 py-2 text-xs font-semibold ibas-input"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 btn-ibas-primary font-bold rounded text-xs cursor-pointer"
                    >
                      Retrieve User ID
                    </button>
                  </form>

                  {recoveredUsername && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded text-xs space-y-1">
                      <span className="text-emerald-300 font-bold block">User ID Found:</span>
                      <code className="text-amber-300 font-mono text-sm">{recoveredUsername}</code>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier(recoveredUsername);
                          setMode('login');
                        }}
                        className="block mt-2 text-cyan-300 hover:underline font-semibold"
                      >
                        Use this Login ID →
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
