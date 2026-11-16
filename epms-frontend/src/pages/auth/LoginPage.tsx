import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { AcademicBackgroundCanvas } from '../../components/common/AcademicBackgroundCanvas';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  KeyRound,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasswordRequestMode, setIsPasswordRequestMode] = useState(false);
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

  // Password Request Workflow state
  const [pwdWorkflowStep, setPwdWorkflowStep] = useState<'request' | 'complete'>('request');
  const [reqEmailOrId, setReqEmailOrId] = useState('');
  const [reqReason, setReqReason] = useState('Routine Security Credential Update');
  const [generatedTicketId, setGeneratedTicketId] = useState<string | null>(null);
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [demoApprovedCode, setDemoApprovedCode] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Role shortcut selection for quick verification
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
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
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

      toast.success(`Account registered! Welcome ${user.name}`);
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

  // Submit Password Change Request to Academic Office
  const handleSubmitPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reqEmailOrId.trim()) {
      setError('Please provide your institutional email address or Student/Teacher ID.');
      return;
    }

    setLoading(true);
    try {
      const payload = reqEmailOrId.includes('@')
        ? { email: reqEmailOrId.trim(), reason: reqReason }
        : { identifier: reqEmailOrId.trim(), reason: reqReason };

      const res = await authApi.submitPasswordRequest(payload);
      if (res.success && res.requestId) {
        setGeneratedTicketId(res.requestId);
        toast.success(`Ticket #${res.requestId} registered! Forwarded to Department Head.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not register password change request.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo shortcut to approve request on behalf of Department Administration
  const handleDemoApproveRequest = async () => {
    if (!generatedTicketId) return;
    setLoading(true);
    try {
      const res = await authApi.approvePasswordRequest(generatedTicketId);
      if (res.success && res.authorizationCode) {
        setDemoApprovedCode(res.authorizationCode);
        setAuthCodeInput(res.authorizationCode);
        toast.success(`Department Head authorized! Code: ${res.authorizationCode}`);
        setPwdWorkflowStep('complete');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval action failed.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Password Change using official authorization code
  const handleCompletePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!generatedTicketId || !authCodeInput || !newPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.completePasswordChange({
        requestId: generatedTicketId,
        authorizationCode: authCodeInput.trim().toUpperCase(),
        newPassword,
        confirmPassword: confirmNewPassword
      });

      if (res.success) {
        toast.success('Password updated successfully! You can now sign in.');
        setIsPasswordRequestMode(false);
        setPwdWorkflowStep('request');
        setGeneratedTicketId(null);
        setAuthCodeInput('');
        setNewPassword('');
        setConfirmNewPassword('');
        setLoginPassword(newPassword);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not finalize password update.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 relative overflow-hidden font-sans select-none">
      {/* Background Animated Video Canvas */}
      <AcademicBackgroundCanvas />

      {/* Main Split-Screen Container */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen z-10 relative">
        {/* Left Side: Institutional Identity & Academic Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md"
        >
          {/* Institutional Emblem & Title */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase block">
                  EPMS Academic Portal
                </span>
                <span className="text-sm font-bold text-white tracking-tight">
                  Educational Progress Monitoring System
                </span>
              </div>
            </div>

            <div className="pt-4 max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory 75% Attendance & Coursework Registry • AY 2026-27</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                Institutional Academic Telemetry & Early Warning Architecture
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Centralized academic governance platform for Department of Computer Science & Engineering. Track real-time attendance compliance, continuous internal evaluations (CIE), and faculty intervention advisories.
              </p>
            </div>
          </div>

          {/* Institutional Compliance Indicators */}
          <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <CalendarCheck className="w-4 h-4 text-sky-400 mb-1.5" />
              <h4 className="text-xs font-semibold text-white">75% Attendance Rule</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated detection of semester exam ineligibility</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <BookOpen className="w-4 h-4 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-semibold text-white">Course Telemetry</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Video lecture watch heartbeats & module completion</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <FileCheck2 className="w-4 h-4 text-amber-400 mb-1.5" />
              <h4 className="text-xs font-semibold text-white">Controlled Access</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Credential changes governed by department authorization</p>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Affiliated with State Technical University Council</span>
            <span className="font-mono text-slate-300">EPMS Academic Portal v2.4</span>
          </div>
        </motion.div>

        {/* Right Side: Authentication & Password Request Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-1/2 p-6 sm:p-10 lg:p-14 flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
        >
          <div className="w-full max-w-md space-y-5">
            {/* Header Titles */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isPasswordRequestMode
                  ? 'Request Password Change'
                  : isRegistering
                  ? 'Register Academic Account'
                  : 'Institutional Portal Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {isPasswordRequestMode
                  ? 'Institutional governance: password changes require department authorization.'
                  : isRegistering
                  ? 'Enroll new faculty or student scholar into the departmental ledger.'
                  : 'Select your institutional role and enter your verified credentials.'}
              </p>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* View 1: Password Change Request Workflow */}
            {isPasswordRequestMode ? (
              <div className="space-y-4">
                {/* 2-Step Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPwdWorkflowStep('request')}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      pwdWorkflowStep === 'request'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwdWorkflowStep('complete')}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      pwdWorkflowStep === 'complete'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Authorize & Finalize
                  </button>
                </div>

                {pwdWorkflowStep === 'request' ? (
                  <form onSubmit={handleSubmitPasswordRequest} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Registered Email or PRN / Teacher ID
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={reqEmailOrId}
                          onChange={(e) => setReqEmailOrId(e.target.value)}
                          placeholder="e.g. student1@epms.edu or STU-2001"
                          className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Reason for Password Modification
                      </label>
                      <select
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                      >
                        <option value="Routine Security Credential Update">Routine Security Credential Update</option>
                        <option value="Device Replacement / Secondary Terminal Access">Device Replacement / Secondary Terminal Access</option>
                        <option value="Suspected Credential Compromise">Suspected Credential Compromise</option>
                        <option value="Forgotten Password / Reset Required">Forgotten Password / Reset Required</option>
                      </select>
                    </div>

                    {generatedTicketId && (
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Request Ticket Logged: {generatedTicketId}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Status: <strong className="text-amber-300 font-semibold">Pending Department Head Authorization</strong>
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleDemoApproveRequest}
                            disabled={loading}
                            className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Faculty Sign-off (Authorize Ticket)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasswordRequestMode(false);
                          setError(null);
                        }}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-900 border border-slate-800 transition-colors"
                      >
                        Back to Sign In
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {loading ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCompletePasswordChange} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Request Ticket ID
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={generatedTicketId || ''}
                          onChange={(e) => setGeneratedTicketId(e.target.value)}
                          placeholder="e.g. REQ-PWD-123456"
                          className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white placeholder-slate-500 uppercase focus:outline-none focus:border-sky-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Department Authorization Code
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={authCodeInput}
                          onChange={(e) => setAuthCodeInput(e.target.value)}
                          placeholder="e.g. AUTH-654321"
                          className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white placeholder-slate-500 uppercase focus:outline-none focus:border-sky-500"
                          required
                        />
                      </div>
                      {demoApprovedCode && (
                        <span className="text-[10px] text-emerald-400 mt-1 block">
                          Code issued: {demoApprovedCode}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPwdWorkflowStep('request')}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-900 border border-slate-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {loading ? 'Finalizing...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : isRegistering ? (
              /* Registration View */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      role === 'student'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Student Scholar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      role === 'teacher'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Faculty Member
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === 'teacher' ? 'e.g. Prof. Rajesh Sharma' : 'e.g. Aarav Patel'}
                      className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Institutional Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@epms.edu"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {role === 'teacher' ? 'Faculty ID' : 'Student ID (PRN)'}
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'teacher' ? 'TCH-1002' : 'STU-2015'}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white uppercase focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science & Engineering"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Account...' : 'Submit Institutional Registration'}
                </button>

                <p className="text-center text-xs text-slate-400 pt-1">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                    }}
                    className="text-sky-400 hover:underline font-semibold ml-1"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            ) : (
              /* Standard Institutional Sign In View */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Role Switcher */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Select Academic Role
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSelectRoleDemo('student')}
                      className={`py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        activeRoleTab === 'student'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Student (Aarav Patel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRoleDemo('teacher')}
                      className={`py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        activeRoleTab === 'teacher'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Faculty (6 Professors)</span>
                    </button>
                  </div>

                  {activeRoleTab === 'teacher' ? (
                    <div className="pt-1">
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Select Faculty Professor Account:</label>
                      <select
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setLoginPassword('Password123!');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="teacher@epms.edu">Prof. Rajesh Sharma (Computer Science & Engineering)</option>
                        <option value="prof.sunita@epms.edu">Prof. Sunita Deshmukh (Data Science & AI)</option>
                        <option value="prof.amit@epms.edu">Prof. Amit Verma (Software Engineering & Cloud)</option>
                        <option value="prof.ananya@epms.edu">Prof. Ananya Kulkarni (Cybersecurity & Cryptography)</option>
                        <option value="prof.vikramaditya@epms.edu">Prof. Vikramaditya Joshi (Embedded Systems & IoT)</option>
                        <option value="prof.meera@epms.edu">Prof. Meera Nambiar (Distributed Systems)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Select Student Scholar:</label>
                      <select
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setLoginPassword('Password123!');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="student1@epms.edu">Aarav Patel (STU-2001 - Computer Science)</option>
                        <option value="student2@epms.edu">Priya Sharma (STU-2002 - Software Engineering)</option>
                        <option value="student3@epms.edu">Rohan Deshmukh (STU-2003 - Data Science)</option>
                        <option value="student4@epms.edu">Ananya Iyer (STU-2004 - Computer Science)</option>
                        <option value="student5@epms.edu">Vikram Singh (STU-2005 - Information Technology)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Institutional Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="user@epms.edu"
                      className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPasswordRequestMode(true);
                        setReqEmailOrId(loginEmail);
                        setError(null);
                      }}
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      Change Password (By Request)
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Remember terminal session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Enter EPMS Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>New scholar or instructor?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-sky-400 hover:underline font-semibold"
                  >
                    Register Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
