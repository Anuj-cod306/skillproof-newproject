import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, ShieldCheck, CheckCircle2, Search, Filter } from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const OpportunitiesPage = () => {
  const { jobs } = useSkillProof();
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = jobs.filter(job => {
    const matchesType = filterType === 'ALL' || (job.type || '').toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch = (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="primary" size="sm">Verified Opportunity Marketplace</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Verified Jobs & Internships
        </h1>
        <p className="text-slate-400 text-sm">
          Opportunities requiring verified skill passports. Zero unverified submissions accepted.
        </p>
      </div>

      {/* Search & Filter bar */}
      <Card>
        <CardContent className="p-3.5 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by role or enterprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'Full-time', 'Internship'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:border-slate-700/80 transition-all">
            <CardContent className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-100 text-base">{job.title}</h3>
                  <Badge variant="neutral" size="sm">{job.type}</Badge>
                  <Badge variant="success" size="sm" icon={ShieldCheck}>Passport Required</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location}</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-mono font-semibold"><DollarSign className="w-3.5 h-3.5" /> {job.salary}</span>
                </div>

                {/* Explainable match */}
                <div className="flex items-center gap-2 text-xs pt-0.5">
                  <span className="text-slate-400">AI Compatibility:</span>
                  <span className="font-bold text-indigo-400 font-mono">{job.matchScore}% Match</span>
                  <span className="text-[11px] text-slate-400 italic">({job.explanation})</span>
                </div>
              </div>

              <Link to="/student/jobs" className="shrink-0">
                <Button variant="primary" size="sm" icon={ShieldCheck}>
                  Apply with Skill Passport
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OpportunitiesPage;
