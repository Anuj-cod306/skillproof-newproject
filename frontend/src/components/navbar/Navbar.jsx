import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X, ChevronDown, User, Briefcase, GraduationCap, Building2, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = () => {
  const { currentUser, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Features', path: '/features' },
    { name: 'Opportunities', path: '/opportunities' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const studentDesc = currentUser?.role === 'student' && currentUser?.name
    ? currentUser.name
    : (() => {
        try {
          const saved = localStorage.getItem('skillproof_student_user');
          return saved ? JSON.parse(saved).name : 'Student Portal';
        } catch {
          return 'Student Portal';
        }
      })();

  const roles = [
    { key: 'student', label: 'Student Portal', icon: User, desc: studentDesc },
    { key: 'industry', label: 'Industry Recruiter', icon: Briefcase, desc: 'NovaTech HR' },
    { key: 'academia', label: 'Academician', icon: GraduationCap, desc: 'Dr. Verma (Professor)' },
    { key: 'institution', label: 'Institution Admin', icon: Building2, desc: 'Dean (ABES Engg)' },
  ];

  const handleRoleChange = async (roleKey) => {
    setRoleDropdownOpen(false);
    const normalizedCurrent = currentUser?.role === 'academia' || currentUser?.role === 'academician' ? 'academia' : currentUser?.role;
    if (normalizedCurrent !== roleKey) {
      await switchRole(roleKey);
    }
    const targetPath = roleKey === 'academia' || roleKey === 'academician' ? '/academician/dashboard' : `/${roleKey}/dashboard`;
    navigate(targetPath);
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/login';
    const role = currentUser.role === 'academia' || currentUser.role === 'academician' ? 'academician' : currentUser.role;
    return `/${role}/dashboard`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-[68px] flex items-center">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">SKILLPROOF</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Verified Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {publicLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'text-blue-600 font-semibold bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Switch Actor Role"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Actor: <strong className="text-slate-900 capitalize">{currentUser?.role || 'Guest'}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 z-[100]">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Role Switcher
                  </div>
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const normalizedRole = currentUser?.role === 'academician' ? 'academia' : currentUser?.role;
                    const isCurrent = normalizedRole === r.key;
                    return (
                      <button
                        key={r.key}
                        onClick={() => handleRoleChange(r.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-xs transition-colors ${
                          isCurrent ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-blue-600'}`} />
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold truncate ${isCurrent ? 'text-white' : 'text-slate-900'}`}>{r.label}</div>
                          <div className={`text-[10px] truncate ${isCurrent ? 'text-blue-100 font-medium' : 'text-slate-500 font-normal'}`}>{r.desc}</div>
                        </div>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-white shrink-0 shadow-2xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <NotificationDropdown />

                <Link
                  to={getDashboardPath()}
                  className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                <Link
                  to="/student/profile"
                  className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 flex items-center justify-center transition-colors overflow-hidden"
                  title="Profile"
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <div className="space-y-1">
            {publicLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-xs font-medium ${
                  location.pathname === link.path
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Go to Portal
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 rounded-lg text-rose-600 text-xs font-medium hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
