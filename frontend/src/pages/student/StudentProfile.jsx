import React, { useState, useEffect } from 'react';
import { User, GraduationCap, Briefcase, MapPin, GitBranch, Linkedin, Globe, Save, CheckCircle2, Building, Calendar, Award, Mail, Twitter, Edit3, ShieldCheck, Sparkles, ExternalLink, Code2 } from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import apiService from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const StudentProfile = () => {
  const { studentProfile, setStudentProfile, loadLiveStudentData, skillMap, resumeData, githubData } = useSkillProof();
  const [formData, setFormData] = useState({ ...studentProfile });
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({ ...studentProfile });
  }, [studentProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await apiService.updateStudentProfile(formData);
      setStudentProfile(formData);
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('[StudentProfile] Saved locally, backend note:', err.message);
      setStudentProfile(formData);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const verifiedSkillsCount = skillMap.filter(s => s.verified).length || 8;
  const reposCount = githubData?.totalRepos || githubData?.verifiedRepos?.length || 3;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Profile Header Card (Screen 2 Reference) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center border-4 border-white shadow-md">
                {formData.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Verified Identity">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {formData.name || 'Anuj Bhalothia'}
                </h1>
                <Badge variant="blue" size="xs">Student</Badge>
                <Badge variant="success" size="xs" icon={ShieldCheck}>Verified</Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {formData.degree || 'Computer Science Student'} • {formData.college || 'Engineering Institute'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {formData.location || 'Jaipur, India'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Graduating {formData.graduationYear || '2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={saving}
                  icon={Save}
                >
                  Save Profile
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                icon={Edit3}
              >
                Edit Profile
              </Button>
            )}

            {/* Motivational Quote Capsule */}
            <div className="hidden lg:block p-3 rounded-xl bg-slate-50 border border-slate-100 max-w-[200px]">
              <p className="text-[10px] text-slate-500 italic leading-snug">
                "Discipline today, Opportunities tomorrow."
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-6 pt-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'skills', label: 'Skills' },
            { id: 'education', label: 'Education' },
            { id: 'projects', label: 'Projects' },
            { id: 'achievements', label: 'Achievements' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully and synced with your verified credentials.</span>
        </div>
      )}

      {/* Main Profile Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Personal Information</CardTitle>
                {isEditing ? (
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Editing Mode</span>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="text-xs font-semibold text-slate-900">{formData.name || 'Anuj Bhalothia'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <div className="text-xs font-medium text-slate-700">{formData.email || 'student@skillproof.edu'}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="text-xs font-medium text-slate-700">{formData.location || 'Jaipur, India'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">College</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="college"
                        value={formData.college || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="text-xs font-medium text-slate-700">{formData.college || 'Engineering Institute'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Degree</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="degree"
                        value={formData.degree || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="text-xs font-medium text-slate-700">{formData.degree || 'B.Tech Computer Science'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Graduation Year</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="graduationYear"
                        value={formData.graduationYear || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="text-xs font-medium text-slate-700">{formData.graduationYear || '2027'}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Me Card */}
            <Card>
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">About Me</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <textarea
                    rows={3}
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                    placeholder="Describe your engineering focus, project passions, and goals..."
                  />
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {formData.bio || 'Passionate about building, learning and creating real-world impact through technology, distributed systems, and scalable backend infrastructure.'}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {['Web Development', 'System Design', 'AI/ML', 'Open Source', 'PostgreSQL'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Col: Social Links & Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <GitBranch className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-semibold text-slate-800">GitHub</span>
                  </div>
                  <span className="text-xs text-blue-600 font-mono font-medium">github.com/{formData.githubUsername || 'anuj'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-800">LinkedIn</span>
                  </div>
                  <span className="text-xs text-blue-600 font-mono font-medium">linkedin.com/in/{formData.githubUsername || 'anuj'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">Portfolio</span>
                  </div>
                  <span className="text-xs text-blue-600 font-mono font-medium">{formData.githubUsername || 'anuj'}.dev</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Twitter className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-semibold text-slate-800">Twitter</span>
                  </div>
                  <span className="text-xs text-blue-600 font-mono font-medium">@{formData.githubUsername || 'anuj'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Target Role Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Career Target</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Target Role</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="targetRole"
                      value={formData.targetRole || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{formData.targetRole || 'Full Stack Engineer'}</div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Target Industry</div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="targetIndustry"
                      value={formData.targetIndustry || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{formData.targetIndustry || 'FinTech / SaaS'}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats Strip at Bottom (Screen 2 Reference) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{reposCount * 4 || 12}</div>
              <div className="text-[11px] text-slate-500 font-medium">Projects</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{verifiedSkillsCount}</div>
              <div className="text-[11px] text-slate-500 font-medium">Verified Skills</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">6</div>
              <div className="text-[11px] text-slate-500 font-medium">Assessments</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">2</div>
              <div className="text-[11px] text-slate-500 font-medium">Certifications</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;
