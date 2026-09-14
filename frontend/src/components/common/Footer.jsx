import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#E5EBF2] border-t border-[#DCE3EC] text-slate-600 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-950 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-950 tracking-tight">SKILLPROOF</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verified skill credentials that move beyond unverified resume claims. Uniting students, industry recruiters, academicians, and institutions on one objective standard.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#DCE3EC] text-slate-700 text-[11px] font-medium shadow-2xs">
              <span>Verified Skill Ecosystem</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3.5">Verification Framework</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-500 hover:text-slate-900 transition-colors">Tier 1: Structured Evidence Parsing</li>
              <li className="text-slate-500 hover:text-slate-900 transition-colors">Tier 2: GitHub Repository Proof</li>
              <li className="text-slate-500 hover:text-slate-900 transition-colors">Tier 3: Standardized Assessments</li>
              <li className="text-slate-500 hover:text-slate-900 transition-colors">Tier 4: Adaptive AI Tech Interview</li>
            </ul>
          </div>

          {/* Stakeholder Portals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3.5">Stakeholder Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/student/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">Student Skill Passport</Link></li>
              <li><Link to="/industry/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">Industry & Recruiter Portal</Link></li>
              <li><Link to="/academician/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">Academia & Mentorship</Link></li>
              <li><Link to="/institution/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">Institutional Analytics</Link></li>
            </ul>
          </div>

          {/* Core Mission */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3.5">Core Mission</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Closing curriculum disconnects, faculty upskilling, and candidate employability through verifiable and explainable metrics.
            </p>
            <div className="text-[11px] text-slate-800 font-semibold flex items-center gap-1.5">
              <span>Claim</span>
              <span>→</span>
              <span>Prove</span>
              <span>→</span>
              <span>Verify</span>
              <span>→</span>
              <span>Connect</span>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[#DCE3EC] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 SKILLPROOF — Verified Skill Ecosystem. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Enterprise Grade • Objective Proof Standards
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
