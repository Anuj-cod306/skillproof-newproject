import React, { useState, useEffect } from 'react';
import { Briefcase, BookOpen, Building, CheckCircle2, Clock, MapPin, Award, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import apiService from '../../services/api';

export const FacultyOpportunitiesPage = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [appliedMap, setAppliedMap] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [livePrograms, setLivePrograms] = useState([]);

  useEffect(() => {
    // 1. Fetch available faculty programs
    apiService.getFacultyPrograms()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setLivePrograms(res.map(p => ({
            id: p.id,
            title: p.title,
            sponsor: p.sponsorCompany || 'Industry Consortium',
            type: p.type || p.programType || 'FACULTY_INTERNSHIP',
            domain: p.domain || 'Software Engineering',
            duration: p.duration || '4 Weeks',
            location: p.location || 'Hybrid',
            stipend: p.stipend || 'Sponsored',
            desc: p.description || 'Hands-on architectural and industry immersion.',
            deadline: p.deadline || 'Open'
          })));
        }
      })
      .catch(err => console.warn('[FacultyOpportunities] Using default programs:', err.message));

    // 2. Fetch authenticated academician's persisted nominations
    apiService.getMyNominations()
      .then(noms => {
        if (Array.isArray(noms)) {
          const map = {};
          noms.forEach(n => {
            const pid = n.programId;
            if (pid) {
              map[pid] = {
                nominated: true,
                status: n.status || 'NOMINATED',
                nominatedAt: n.nominatedAt
              };
            }
          });
          setAppliedMap(map);
        }
      })
      .catch(err => console.warn('[FacultyOpportunities] Could not fetch nominations:', err.message));
  }, []);

  const opportunities = [
    {
      id: 1,
      title: 'Enterprise Cloud Systems Faculty Immersion Program',
      sponsor: 'NovaTech Solutions',
      type: 'FACULTY_INTERNSHIP',
      domain: 'Cloud Architecture & Kubernetes',
      duration: '4 Weeks (July 2026)',
      location: 'Bengaluru R&D Lab',
      stipend: '₹60,000 / month + Travel Allowance',
      desc: 'Hands-on architectural rotation across production microservices, resilience testing, and DevOps deployment pipelines.',
      deadline: '15 April 2026'
    },
    {
      id: 2,
      title: 'National FDP on AI-Assisted Software Engineering & Spring AI',
      sponsor: 'Ministry of Education & CloudSphere',
      type: 'FDP',
      domain: 'AI & Full Stack Java',
      duration: '2 Weeks (Hybrid)',
      location: 'Online + Regional IIT Nodes',
      stipend: 'Full AICTE Sponsorship + Teaching Toolkit',
      desc: 'Training engineering faculty on modern Spring AI integrations, LLM prompt engineering, and automated testing tools.',
      deadline: '30 May 2026'
    },
    {
      id: 3,
      title: 'Industrial Architecture Consultancy: Real-Time Payment Ledgers',
      sponsor: 'FinTech Alliance Corp',
      type: 'CONSULTANCY',
      domain: 'FinTech & Concurrency',
      duration: '6 Months (Part-Time / Advisory)',
      location: 'Hybrid / Remote',
      stipend: '₹2,50,000 Advisory Grant',
      desc: 'Seeking senior faculty in distributed systems to review fault-tolerant database replication and ACID guarantees.',
      deadline: 'Rolling Nominations'
    }
  ];

  const handleApply = async (id) => {
    try {
      setSubmittingId(id);
      const res = await apiService.nominateFacultyProgram(id);
      setAppliedMap(prev => ({
        ...prev,
        [id]: {
          nominated: true,
          status: res?.status || 'NOMINATED',
          nominatedAt: res?.nominatedAt
        }
      }));
    } catch (err) {
      console.error('[FacultyOpportunities] Nomination error:', err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const combined = livePrograms.length > 0
    ? [...livePrograms, ...opportunities.filter(o => !livePrograms.some(lp => lp.id === o.id))]
    : opportunities;

  const filtered = combined.filter(o => {
    return activeTab === 'ALL' || o.type === activeTab;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Faculty Internships, FDPs & Corporate Training"
        description="Bridging curriculum and industry gaps by placing engineering professors into direct enterprise R&D immersion"
        badge={<Badge variant="warning" size="sm">Faculty Opportunity Framework</Badge>}
        breadcrumbs={[
          { label: 'Academician Portal', href: '#/academician/dashboard' },
          { label: 'Faculty Opportunities' }
        ]}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs w-fit flex-wrap">
        {[
          { key: 'ALL', label: 'All Opportunities' },
          { key: 'FACULTY_INTERNSHIP', label: 'Faculty Internships' },
          { key: 'FDP', label: 'FDP Programs' },
          { key: 'CONSULTANCY', label: 'Industrial Consultancy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Opportunity Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                    <Badge variant="primary" size="sm" className="font-mono">
                      {item.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5">
                    <span className="font-semibold text-slate-900">{item.sponsor}</span>
                    <span className="flex items-center gap-1 text-slate-600"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {item.location}</span>
                    <span className="flex items-center gap-1 text-slate-600"><Clock className="w-3.5 h-3.5 text-blue-600" /> {item.duration}</span>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-center shadow-2xs">
                  {item.stipend}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.desc}</p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-[11px] font-medium text-slate-600">Nomination Deadline: <strong className="text-slate-900">{item.deadline}</strong></span>

                {appliedMap[item.id] ? (
                  <Badge variant="success" size="sm" dot>
                    Faculty Nomination Submitted
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={submittingId === item.id}
                    icon={ArrowRight}
                    onClick={() => handleApply(item.id)}
                  >
                    Nominate for Program
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacultyOpportunitiesPage;
