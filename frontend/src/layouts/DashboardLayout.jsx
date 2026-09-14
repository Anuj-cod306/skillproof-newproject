import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar/Navbar';
import { Footer } from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  FileText,
  BrainCircuit,
  Award,
  GitBranch,
  BotMessageSquare,
  Compass,
  Briefcase,
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  FolderGit2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Code2,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = currentUser?.role === 'academician' ? 'academia' : (currentUser?.role || 'student');
  const navigate = useNavigate();

  // Enforce actor-path alignment
  useEffect(() => {
    if (!currentUser) return;
    const userRole = currentUser.role === 'academician' || currentUser.role === 'academia' ? 'academician' : currentUser.role;
    const path = location.pathname;

    if (userRole === 'student' && (path.startsWith('/industry') || path.startsWith('/academician') || path.startsWith('/institution'))) {
      navigate('/student/dashboard', { replace: true });
    } else if (userRole === 'industry' && (path.startsWith('/student') || path.startsWith('/academician') || path.startsWith('/institution'))) {
      navigate('/industry/dashboard', { replace: true });
    } else if (userRole === 'academician' && (path.startsWith('/student') || path.startsWith('/industry') || path.startsWith('/institution'))) {
      navigate('/academician/dashboard', { replace: true });
    } else if (userRole === 'institution' && (path.startsWith('/student') || path.startsWith('/industry') || path.startsWith('/academician'))) {
      navigate('/institution/dashboard', { replace: true });
    }
  }, [currentUser?.role, location.pathname, navigate]);

  const studentSections = [
    {
      title: 'Workspace',
      items: [
        { name: 'Overview', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Profile', path: '/student/profile', icon: User },
      ]
    },
    {
      title: 'Skill Verification',
      items: [
        { name: 'Resume & Evidence', path: '/student/resume-upload', icon: FileText },
        { name: 'Skill Map', path: '/student/skill-map', icon: BrainCircuit },
        { name: 'Assessments', path: '/student/assessments', icon: Award },
        { name: 'GitHub Analysis', path: '/student/github-verify', icon: GitBranch },
        { name: 'Coding Arena', path: '/student/competitive-coding', icon: Code2 },
        { name: 'AI Interview', path: '/student/ai-interview', icon: BotMessageSquare },
        { name: 'Skill Passport', path: '/student/passport', icon: ShieldCheck, highlight: true },
      ]
    },
    {
      title: 'Career & Jobs',
      items: [
        { name: 'Skill Gap & Roadmap', path: '/student/skill-gap-roadmap', icon: Compass },
        { name: 'Jobs & Matching', path: '/student/jobs', icon: Briefcase },
      ]
    }
  ];

  const industrySections = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Overview', path: '/industry/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Talent Acquisition',
      items: [
        { name: 'Candidate Search', path: '/industry/candidates', icon: Users, highlight: true },
        { name: 'Post Opportunity', path: '/industry/post-job', icon: Briefcase },
        { name: 'Academic Projects', path: '/industry/collaborations', icon: FolderGit2 },
      ]
    }
  ];

  const academiaSections = [
    {
      title: 'Faculty Dashboard',
      items: [
        { name: 'Overview', path: '/academician/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Mentorship & Approvals',
      items: [
        { name: 'Student Mentorship', path: '/academician/mentorship', icon: GraduationCap },
        { name: 'Opportunity Approvals', path: '/academician/approvals', icon: ShieldCheck, highlight: true },
        { name: 'FDP & Training', path: '/academician/opportunities', icon: BookOpen },
      ]
    }
  ];

  const institutionSections = [
    {
      title: 'Executive BI',
      items: [
        { name: 'Overview', path: '/institution/dashboard', icon: LayoutDashboard },
        { name: 'Demand vs Availability', path: '/institution/demand-vs-availability', icon: TrendingUp, highlight: true },
      ]
    }
  ];

  const sectionsByRole = {
    student: studentSections,
    industry: industrySections,
    academia: academiaSections,
    academician: academiaSections,
    institution: institutionSections,
  };

  const currentSections = sectionsByRole[role] || studentSections;

  const roleMeta = {
    student: { title: 'Student Portal', badge: 'Verified Candidate', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    industry: { title: 'Industry Portal', badge: 'Corporate Recruiter', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    academia: { title: 'Academia Portal', badge: 'Faculty & Research', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    academician: { title: 'Academia Portal', badge: 'Faculty & Research', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    institution: { title: 'Institution BI', badge: 'University Admin', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  };

  const meta = roleMeta[role] || roleMeta.student;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 antialiased">
      <Navbar />

      <div className="flex-grow flex">
        {/* Collapsible Sidebar */}
        <aside
          className={`border-r border-slate-200/80 bg-white shrink-0 transition-all duration-200 flex flex-col justify-between ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div>
            {/* Actor Banner */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Actor</div>
                  <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">{meta.title}</div>
                </div>
              ) : null}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* User Profile Capsule */}
            {!collapsed && (
              <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-xs text-white shrink-0 shadow-xs">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name || 'Verified User'}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.tagColor}`}>
                    {meta.badge}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Sections */}
            <nav className="p-2.5 space-y-3.5 flex-1 overflow-y-auto">
              {currentSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  {!collapsed && (
                    <div className="px-3 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#EFF6FF] text-blue-600 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                        {!collapsed && item.highlight && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Motivation Card (from reference mockup) */}
          {!collapsed && (
            <div className="p-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-50/70 to-blue-50/30 border border-blue-100/80 space-y-2">
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Consistent skills create bigger opportunities.
                </p>
                <div className="flex items-center justify-end">
                  <div className="w-6 h-6 rounded-full bg-white border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs hover:bg-blue-50 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardLayout;
