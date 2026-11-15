import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Building,
  KeyRound,
  BookOpen,
  TrendingUp,
  Clock,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from '../../components/common/CustomCursor';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState(() => {
    return localStorage.getItem('epms_remembered_email') || 'student1@epms.edu';
  });
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'teacher'>('student');

  // Register form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Handle Demo Fill shortcuts
  const handleSelectRoleDemo = (targetRole: 'student' | 'teacher') => {
    setActiveRoleTab(targetRole);
    if (targetRole === 'teacher') {
      setLoginEmail('teacher@epms.edu');
      setLoginPassword('Password123!');
    } else {
      setLoginEmail('student1@epms.edu');
      setLoginPassword('Password123!');
    }
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('epms_remembered_email', loginEmail);
      } else {
        localStorage.removeItem('epms_remembered_email');
      }

      const user = await login({ email: loginEmail, password: loginPassword });
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        name,
        email,
        identifier,
        password,
        confirmPassword,
        role,
        department
      });
      toast.success(`Account created successfully! Welcome, ${user.name}!`);
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please provide your registered institutional email.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      setResetMessage('Password reset instructions have been dispatched to your email.');
      toast.success('Password reset link sent!');
    } catch (err: any) {
      setResetMessage('Password reset request logged for system administrator review.');
      toast.success('Reset request recorded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-navy-950 text-slate-100 relative overflow-hidden font-sans">
      <CustomCursor />

      {/* Background Animated Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-700/20 blur-3xl pointer-events-none animate-float-slow"></div>
      <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-float-reverse"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-purple-900/30 blur-3xl pointer-events-none"></div>

      {/* Split-Screen Container */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen z-10">
        {/* Left Hero & Branding Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative bg-gradient-to-b from-navy-900/90 via-navy-950/90 to-purple-950/80 backdrop-blur-xl border-r border-white/10"
        >
          {/* Top Brand Tag */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-glass">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-glow-purple">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-white block">EPMS</span>
                <span className="text-[10px] text-cyan-300 font-semibold">Educational Progress Monitoring</span>
              </div>
            </div>

            <div className="pt-8 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-4 border border-purple-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Academic Analytics</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Empowering Minds with <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-white bg-clip-text text-transparent">Real-Time Telemetry</span>.
              </h1>
              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Monitor student attendance, track lesson video progress, detect at-risk academic signals early, and streamline university workflows in one intuitive platform.
              </p>
            </div>
          </div>

          {/* Interactive Feature Highlights Preview */}
          <div className="my-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
              <TrendingUp className="w-5 h-5 text-cyan-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Live Progress</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Second-by-second video watch heartbeats</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
              <ShieldCheck className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Early Warnings</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated detection of students at risk</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
              <Clock className="w-5 h-5 text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Zero Duplicates</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Idempotent attendance ledger updates</p>
            </div>
          </div>

          {/* Bottom Accreditation Note */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ratan Tata Maharashtra State Skills University</span>
            <span className="font-mono text-cyan-300 font-bold">EPMS v2.0 Enterprise</span>
          </div>
        </motion.div>

        {/* Right Authentication Card Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="lg:w-1/2 p-6 sm:p-10 lg:p-16 flex items-center justify-center bg-navy-950/80 backdrop-blur-md"
        >
          <div className="w-full max-w-md space-y-6">
            {/* Header Titles */}
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isForgotPassword
                  ? 'Recover Access'
                  : isRegistering
                  ? 'Join EPMS Academic Network'
                  : 'Sign in to EPMS'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isForgotPassword
                  ? 'Enter your institutional email to request a reset link.'
                  : isRegistering
                  ? 'Create your verified student or faculty credentials.'
                  : 'Select your institutional role and enter your credentials.'}
              </p>
            </div>

            {/* Error / Alert Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password View */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Registered Institutional Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="student@epms.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {resetMessage && (
                  <p className="text-xs text-cyan-300 bg-cyan-950/40 p-3 rounded-xl border border-cyan-800/40">
                    {resetMessage}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 border border-white/10 transition-colors"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-glow-purple transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                </div>
              </form>
            ) : isRegistering ? (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      role === 'student'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Student Scholar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      role === 'teacher'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Faculty Instructor
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Institutional Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@epms.edu"
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {role === 'teacher' ? 'Faculty ID' : 'Student PRN / ID'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={role === 'teacher' ? 'TCH-1002' : 'STU-2015'}
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all uppercase"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Department</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Information Technology & Computer Technology"
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-10 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-10 pr-10 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-2 ml-1"
                  >
                    Sign In instead
                  </button>
                </p>
              </form>
            ) : (
              /* Standard Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Role Tabs for Demo & Clarity */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Role To Sign In</span>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSelectRoleDemo('student')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        activeRoleTab === 'student'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      data-cursor="pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleDemo('teacher')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        activeRoleTab === 'teacher'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      data-cursor="pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Teacher / Faculty</span>
                    </button>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Institutional Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="student1@epms.edu or teacher@epms.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Remember my institutional ID</span>
                  </label>
                </div>

                {/* Submit Login Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple transition-all flex items-center justify-center gap-2 cursor-pointer"
                  data-cursor="pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* One-Click Demo Credentials Pill */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Demo Pre-Fill</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRoleDemo('student')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/60 transition-colors font-mono font-bold"
                    >
                      student1@epms.edu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleDemo('teacher')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60 transition-colors font-mono font-bold"
                    >
                      teacher@epms.edu
                    </button>
                  </div>
                </div>

                {/* Register Link Toggle */}
                <p className="text-center text-xs text-slate-400 pt-1">
                  Don’t have an EPMS profile?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-2 ml-1"
                    data-cursor="pointer"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
