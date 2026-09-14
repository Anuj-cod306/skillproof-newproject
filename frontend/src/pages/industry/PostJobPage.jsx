import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Trash2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import apiService from '../../services/api';

export const PostJobPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Full-time');
  const [location, setLocation] = useState('Bengaluru / Hybrid');
  const [salary, setSalary] = useState('₹10,00,000 - ₹14,00,000 / annum');
  const [minReadiness, setMinReadiness] = useState(75);
  const [description, setDescription] = useState('');
  const [posted, setPosted] = useState(false);

  const [skills, setSkills] = useState([
    { name: 'Java', weight: 'High (1.0)', mandatory: true },
    { name: 'Spring Boot', weight: 'High (1.0)', mandatory: true },
    { name: 'SQL / PostgreSQL', weight: 'Medium (0.8)', mandatory: true },
    { name: 'Docker', weight: 'Bonus (0.5)', mandatory: false }
  ]);

  const [newSkillName, setNewSkillName] = useState('');

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { name: newSkillName.trim(), weight: 'Medium (0.8)', mandatory: true }]);
    setNewSkillName('');
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosted(true);
    try {
      await apiService.createJob({
        title,
        jobType: type,
        location,
        salaryRange: salary,
        minReadinessScore: minReadiness,
        description: description || `Looking for ${title} with verified competencies in ${skills.map(s => s.name).join(', ')}.`,
        requiredSkills: skills.map(s => s.name).join(', ')
      });
    } catch (err) {
      console.warn('[PostJobPage] API note:', err.message);
    }
    setTimeout(() => {
      navigate('/industry/dashboard');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Post Verified Opportunity"
        description="Configure required engineering competencies, skill weights, and minimum passport thresholds for automated candidate matching"
        badge={<Badge variant="primary" size="sm">Smart Match Sourcing</Badge>}
        breadcrumbs={[
          { label: 'Industry Portal', href: '#/industry/dashboard' },
          { label: 'Post Opportunity' }
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <Briefcase className="w-5 h-5" />
              <CardTitle>Opportunity Specifications</CardTitle>
            </div>
            <CardDescription>
              Role definitions and compensation parameters visible to verified candidates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Opportunity Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Distributed Backend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                >
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                  <option>Live Industry Project</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Compensation / CTC Band</label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Minimum Placement Readiness</label>
                  <span className="text-xs font-mono font-bold text-blue-600">{minReadiness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={minReadiness}
                  onChange={(e) => setMinReadiness(e.target.value)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role Overview & Architectural Scope</label>
                <textarea
                  rows={3}
                  placeholder="Key engineering challenges, system architectural expectations, tech stack..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Required Technical Skills & Weights</CardTitle>
            <CardDescription>
              Configures the explainable matching algorithm to compute compatibility against 4-tier candidate passports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {skills.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs transition-colors hover:bg-slate-100/70"
                >
                  <span className="font-semibold text-slate-800">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono font-medium">{s.weight}</span>
                    <Badge variant={s.mandatory ? 'success' : 'neutral'} size="sm">
                      {s.mandatory ? 'Mandatory' : 'Bonus'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add skill row */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Redis, Kafka, Kubernetes, AWS)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <Button
                type="button"
                variant="secondary"
                icon={Plus}
                onClick={addSkill}
              >
                Add Skill
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={posted}
            icon={posted ? CheckCircle2 : ShieldCheck}
          >
            {posted ? 'Publishing Opportunity...' : 'Publish Verified Opportunity'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostJobPage;
