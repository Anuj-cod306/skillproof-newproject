import React, { useState } from 'react';
import { FolderGit2, Users, Building, Plus, CheckCircle2, Award, ArrowRight, Sparkles, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const CollaborationsPage = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'High-Throughput Cloud Telemetry Ingestion Pipeline',
      institution: 'ABES Engineering College',
      facultyMentor: 'Dr. S. K. Verma (HOD CSE)',
      studentCohort: '4 Final Year Students',
      domain: 'Cloud Native & Distributed Systems',
      status: 'In Progress (Milestone 2/4)',
      stipend: '₹40,000 / project grant',
      deliverable: 'Benchmarked Kafka-to-ClickHouse real-time ingestion under 15,000 msgs/sec'
    },
    {
      id: 2,
      title: 'AI Micro-Credit Fraud Detection with Graph Neural Networks',
      institution: 'IIT Delhi & AKTU Partner Nodes',
      facultyMentor: 'Prof. R. Bansal',
      studentCohort: '6 Students',
      domain: 'FinTech & AI/ML',
      status: 'Accepting Student Nominations',
      stipend: '₹60,000 / project grant',
      deliverable: 'Production Neo4j graph model integrated with Spring Boot REST service'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('Distributed Systems');

  const handleCreate = (e) => {
    e.preventDefault();
    setProjects([
      ...projects,
      {
        id: Date.now(),
        title: newTitle,
        institution: 'Open to Partner Engineering Colleges',
        facultyMentor: 'Assigned on Faculty Nomination',
        studentCohort: 'Capacity: 4 Students',
        domain: newDomain,
        status: 'Open for College Nominations',
        stipend: '₹50,000 / grant',
        deliverable: 'Production architecture + Verified Student Achievement Badge'
      }
    ]);
    setShowModal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Industry-Academia R&D Collaborations"
        description="Sponsor real-world engineering challenges to accredited institutions, guided by verified faculty mentors"
        badge={<Badge variant="primary" size="sm">Enterprise Industry Partnership</Badge>}
        breadcrumbs={[
          { label: 'Industry Portal', href: '#/industry/dashboard' },
          { label: 'Collaborations' }
        ]}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
            Launch Live Project
          </Button>
        }
      />

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((proj) => (
          <Card key={proj.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <Badge variant="primary" size="sm" className="mb-1.5 font-mono">
                    {proj.domain}
                  </Badge>
                  <h2 className="text-base font-bold text-slate-900">{proj.title}</h2>
                </div>
                <Badge variant="neutral" size="sm" className="self-start sm:self-center">
                  {proj.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Partner Institution</span>
                  <span className="font-semibold text-slate-800">{proj.institution}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-blue-600/80 block text-[11px] font-medium mb-0.5">Faculty Mentor</span>
                  <span className="font-semibold text-blue-950">{proj.facultyMentor}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-700 block text-[11px] font-medium mb-0.5">Cohort & Sponsorship</span>
                  <span className="font-semibold text-emerald-900">{proj.studentCohort} ({proj.stipend})</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Deliverable: </span>
                  <span className="text-slate-600">{proj.deliverable}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Launch College Collaboration Project</h2>
              <p className="text-xs text-slate-500">Define a problem statement for academic partner institutions</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Problem Statement</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Distributed Database Replication Engine"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Engineering Domain</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Publish to Colleges
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationsPage;
