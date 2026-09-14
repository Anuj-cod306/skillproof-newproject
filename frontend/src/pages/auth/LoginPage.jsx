import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Briefcase, GraduationCap, Building2, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(email, password, selectedRole);
      const target = selectedRole === 'academia' || selectedRole === 'academician' ? '/academician/dashboard' : `/${selectedRole}/dashboard`;
      navigate(target);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleKey) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(roleKey);
      const target = roleKey === 'academia' || roleKey === 'academician' ? '/academician/dashboard' : `/${roleKey}/dashboard`;
      navigate(target);
    } catch (err) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const roleConfigs = [
    { key: 'student', title: 'Student', icon: User, desc: 'B.Tech CSE, Passport Owner' },
    { key: 'industry', title: 'Industry Recruiter', icon: Briefcase, desc: 'HR & Tech Lead, NovaTech' },
    { key: 'academia', title: 'Academician', icon: GraduationCap, desc: 'Professor & HOD, CSE' },
    { key: 'institution', title: 'Institution Admin', icon: Building2, desc: 'Dean & Leadership' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="rounded-[28px] sm:rounded-[32px] bg-white border border-[#DCE3EC] shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mx-auto text-white shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif text-slate-950 font-normal tracking-tight">Sign in to SKILLPROOF</h1>
          <p className="text-xs text-slate-500">Select your role to access your dedicated platform</p>
        </div>

        {/* 1-Click Quick Demo Switcher */}
        <div className="p-4 rounded-2xl bg-[#E8EDF3] border border-[#D8DFE7] space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-slate-700" />
            <span>1-Click Fast Role Switcher</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {roleConfigs.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleQuickDemo(r.key)}
                  className="p-2.5 rounded-xl bg-white border border-[#DCE3EC] hover:border-slate-400 text-left transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-700" />
                    <span className="text-xs font-semibold text-slate-900">{r.title.split(' ')[0]}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Stakeholder Role</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-full bg-[#E8EDF3] border border-[#DCE3EC]">
              {roleConfigs.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRole(r.key)}
                  className={`py-1.5 px-1 text-center rounded-full text-xs font-medium transition-all ${
                    selectedRole === r.key
                      ? 'bg-slate-950 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {r.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE3EC] rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE3EC] rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Sign In to {selectedRole.toUpperCase()} Dashboard
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-slate-900 font-semibold hover:underline">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
