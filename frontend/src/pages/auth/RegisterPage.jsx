import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Briefcase, GraduationCap, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgOrCollege, setOrgOrCollege] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedRole = role === 'academia' ? 'academician' : role;
      await register({
        fullName,
        email,
        password: password || 'password123',
        role: normalizedRole,
        college: orgOrCollege,
        companyName: orgOrCollege,
        institutionName: orgOrCollege,
        designation: targetGoal || 'Member'
      });
      const target = normalizedRole === 'academician' ? '/academician/dashboard' : `/${normalizedRole}/dashboard`;
      navigate(target);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <Card className="border-indigo-500/30">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-11 h-11 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Join the SKILLPROOF Ecosystem</h1>
            <p className="text-xs text-slate-400">Select your stakeholder profile to get verified</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Stakeholder Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'student', label: 'Student', icon: User },
                  { key: 'industry', label: 'Industry Recruiter', icon: Briefcase },
                  { key: 'academia', label: 'Academician', icon: GraduationCap },
                  { key: 'institution', label: 'Institution Admin', icon: Building2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRole(item.key)}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                        role === item.key
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Legal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {role === 'student' || role === 'institution' ? 'College / University Name' : 'Company / Firm Name'}
              </label>
              <input
                type="text"
                required
                placeholder={role === 'student' ? 'e.g. ABES Engineering College' : 'e.g. NovaTech Solutions'}
                value={orgOrCollege}
                onChange={(e) => setOrgOrCollege(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Engineering Role</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Backend Developer"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
              icon={ArrowRight}
            >
              Complete Registration & Open Portal
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="text-indigo-400 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
