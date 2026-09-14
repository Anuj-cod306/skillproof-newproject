import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Award, CheckCircle2, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import apiService from '../../services/api';

export const StudentMentorshipPage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [endorsed, setEndorsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStudentDetail = async (studentId) => {
    if (!studentId) return;
    try {
      const detail = await apiService.getMentorshipStudentDetail(studentId);
      if (detail && (detail.studentId || detail.id)) {
        setStudentDetail(detail);
        if (typeof detail.endorsed === 'boolean') {
          setEndorsed(detail.endorsed);
        }
      }
    } catch (err) {
      console.warn('[Mentorship] Could not fetch student detail:', err.message);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const list = await apiService.getMentorshipStudents();
        if (Array.isArray(list) && list.length > 0) {
          setStudents(list);
          const initial = list[0];
          const initialId = initial.studentId || initial.id;
          setSelectedStudentId(initialId);
          await loadStudentDetail(initialId);
        } else {
          setStudents([]);
          setSelectedStudentId(null);
          setStudentDetail(null);
        }
      } catch (err) {
        console.warn('[Mentorship] Could not fetch mentorship students:', err.message);
        setStudents([]);
        setSelectedStudentId(null);
        setStudentDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    loadStudentDetail(id);
  };

  const handleToggleEndorsement = async () => {
    if (!selectedStudentId || saving) return;
    setSaving(true);
    try {
      const nextEndorsed = !endorsed;
      const res = await apiService.updateStudentEndorsement(selectedStudentId, {
        endorsed: nextEndorsed,
        projectTitle: studentDetail?.projectTitle,
        remarks: studentDetail?.remarks
      });
      const updatedEndorsed = (res && typeof res.endorsed === 'boolean') ? res.endorsed : nextEndorsed;
      setEndorsed(updatedEndorsed);
      setStudents(prev => prev.map(s => {
        const sid = s.studentId || s.id;
        return sid === selectedStudentId ? { ...s, endorsed: updatedEndorsed } : s;
      }));
      setStudentDetail(prev => prev ? { ...prev, endorsed: updatedEndorsed } : prev);
    } catch (err) {
      console.error('Failed to update endorsement:', err);
      alert('Failed to update endorsement: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const displayStudent = studentDetail || (students.find(s => (s.studentId || s.id) === selectedStudentId)) || null;
  const skillsToDisplay = (displayStudent && Array.isArray(displayStudent.skills)) ? displayStudent.skills : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Student Capstone & Project Mentorship"
        description="Review student cohorts on live industry challenges, monitor verified competencies, and attach institutional endorsements"
        badge={<Badge variant="warning" size="sm">Capstone Guidance</Badge>}
        breadcrumbs={[
          { label: 'Academician Portal', href: '#/academician/dashboard' },
          { label: 'Mentorship' }
        ]}
      />

      {/* Mentee Selector Bar */}
      {students.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-700 font-semibold flex items-center gap-1.5 mr-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Mentees:
            </span>
            {students.map((st) => {
              const sid = st.studentId || st.id;
              const isSelected = sid === selectedStudentId;
              return (
                <button
                  key={sid}
                  onClick={() => handleSelectStudent(sid)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{st.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>#{st.passportId || sid}</span>
                  {st.endorsed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-600 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading student mentorship records...</span>
        </div>
      ) : !displayStudent ? (
        <EmptyState
          icon={Users}
          title="No Student Mentees Found"
          description="There are currently no registered student mentees assigned to your mentorship cohort."
        />
      ) : (
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0">
                  {displayStudent.name ? displayStudent.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">{displayStudent.name}</h2>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                      #{displayStudent.passportId || displayStudent.studentId || displayStudent.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {displayStudent.degree || 'Degree not specified'} • Roll: {displayStudent.rollNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-blue-600">{displayStudent.readiness ?? 0}%</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Readiness</div>
                </div>
                {displayStudent.passportId && (
                  <Link
                    to={`/verify/${displayStudent.passportId}`}
                    target="_blank"
                  >
                    <Button variant="secondary" size="sm" icon={ShieldCheck}>
                      Inspect Passport
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Live Project Under Mentorship (Dark Card with High Contrast Content) */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Active Industry Capstone:</span>
                <Badge variant={endorsed ? 'success' : 'warning'} size="sm">
                  {endorsed ? 'Verified by Mentor' : 'Pending Verification'}
                </Badge>
              </div>
              <p className="text-sm text-blue-400 font-bold">
                {displayStudent.projectTitle || 'No active capstone assigned'}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                "{displayStudent.remarks || 'No mentor remarks recorded.'}"
              </p>
            </div>

            {/* Verified Skills */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Audited Technical Skills</span>
              {skillsToDisplay.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {skillsToDisplay.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-xs font-semibold text-white">{s.name}</span>
                      <span className="text-xs font-mono font-bold text-amber-300">{s.score}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
                  No audited skill scores found for this student.
                </div>
              )}
            </div>

            {/* Faculty Endorsement Box */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <div className="text-xs text-slate-700 font-medium flex items-center gap-2">
                <span>Faculty Endorsement:</span>
                {endorsed ? (
                  <Badge variant="success" size="sm" dot>Active on Passport</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Endorsement Pending</Badge>
                )}
              </div>

              <Button
                variant={endorsed ? 'outline' : 'primary'}
                size="sm"
                isLoading={saving}
                icon={CheckCircle2}
                onClick={handleToggleEndorsement}
              >
                {endorsed ? 'Update Endorsement' : 'Endorse Capstone'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentMentorshipPage;
