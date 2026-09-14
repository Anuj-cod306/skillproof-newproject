import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  ArrowRight,
  ShieldAlert,
  Cpu,
  AlertCircle,
  Trash2,
  Check,
  Clock,
  Layers,
  FileCheck,
  Award,
  Eye
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import apiService from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';

export const ResumeUpload = () => {
  const { resumeData, setResumeData, loadLiveStudentData } = useSkillProof();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsingStep, setParsingStep] = useState(0);
  const [imported, setImported] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resumesList, setResumesList] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeEvidenceIdForUpload, setActiveEvidenceIdForUpload] = useState(null);
  const evidenceFileInputRef = useRef(null);

  const INITIAL_EVIDENCE_DOCUMENTS = [
    {
      id: 'smartprep-project',
      name: 'SmartPrep Project',
      type: 'Project',
      date: 'Aug 10, 2026',
      status: 'Verified',
      badgeVariant: 'success',
      icon: FileText,
      iconColor: 'bg-blue-50 text-blue-600',
      documentUrl: '/documents/smartprep-project.pdf',
    },
    {
      id: 'system-design-cert',
      name: 'System Design Certificate',
      type: 'Certificate',
      date: 'Aug 5, 2026',
      status: 'Verified',
      badgeVariant: 'success',
      icon: Award,
      iconColor: 'bg-emerald-50 text-emerald-600',
      documentUrl: '/documents/system-design-certificate.pdf',
    },
    {
      id: 'hackathon-winner',
      name: 'Hackathon Winner',
      type: 'Achievement',
      date: 'Jul 30, 2026',
      status: 'Verified',
      badgeVariant: 'success',
      icon: Sparkles,
      iconColor: 'bg-indigo-50 text-indigo-600',
      documentUrl: '/documents/hackathon-winner.pdf',
    },
    {
      id: 'opensource-contrib',
      name: 'Open Source Contribution',
      type: 'Project',
      date: 'Jul 10, 2026',
      status: 'Pending',
      badgeVariant: 'warning',
      icon: BrainCircuit,
      iconColor: 'bg-amber-50 text-amber-600',
      documentUrl: '/documents/open-source-contribution.pdf',
    },
  ];

  const [evidenceList, setEvidenceList] = useState(() => {
    try {
      const saved = localStorage.getItem('skillproof_evidence_docs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return INITIAL_EVIDENCE_DOCUMENTS.map(initItem => {
            const found = parsed.find(p => p.id === initItem.id || p.name === initItem.name);
            return found ? { ...initItem, ...found, icon: initItem.icon } : initItem;
          });
        }
      }
    } catch (e) {
      console.warn('Could not load evidence from localStorage', e);
    }
    return INITIAL_EVIDENCE_DOCUMENTS;
  });

  const persistEvidence = (updatedList) => {
    setEvidenceList(updatedList);
    try {
      const toSave = updatedList.map(({ icon, ...rest }) => rest);
      localStorage.setItem('skillproof_evidence_docs', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Could not save evidence to localStorage', e);
    }
  };

  const handleTriggerAddDocument = (evidenceId) => {
    setActiveEvidenceIdForUpload(evidenceId);
    if (evidenceFileInputRef.current) {
      evidenceFileInputRef.current.value = '';
      evidenceFileInputRef.current.click();
    }
  };

  const handleEvidenceFileChange = (e) => {
    if (e.target.files && e.target.files[0] && activeEvidenceIdForUpload) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      const updated = evidenceList.map(item => {
        if (item.id === activeEvidenceIdForUpload) {
          return {
            ...item,
            documentUrl: objectUrl,
            documentFileName: file.name
          };
        }
        return item;
      });
      persistEvidence(updated);
      setActiveEvidenceIdForUpload(null);
    }
  };

  const handleViewDocument = (documentUrl) => {
    if (!documentUrl) {
      console.warn("No document available");
      setErrorMessage('No document available for this item.');
      return;
    }

    window.open(
      documentUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleViewCurrentResume = () => {
    if (selectedFile) {
      try {
        const blobUrl = URL.createObjectURL(selectedFile);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        return;
      } catch (e) {
        console.warn('Could not create object URL for selected file:', e);
      }
    }
    const docUrl = (resumeData?.fileUrl && (resumeData.fileUrl.startsWith('http') || resumeData.fileUrl.startsWith('/')))
      ? resumeData.fileUrl
      : '/documents/anuj_bhalothia_resume.pdf';
    handleViewDocument(docUrl);
  };

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const list = await apiService.getStudentResumes();
      if (Array.isArray(list)) {
        setResumesList(list);
        const active = list.find(r => r.isActive);
        if (active && !selectedFile) {
          const skills = Array.isArray(active.extractedSkills) ? active.extractedSkills : [];
          setResumeData(prev => ({
            ...prev,
            fileName: active.fileName,
            uploadedAt: active.uploadedAt ? new Date(active.uploadedAt).toLocaleDateString() : 'Active',
            fileSize: 'Uploaded PDF',
            parsed: true,
            extractedSkills: skills.length > 0 ? skills : prev.extractedSkills,
            extractedProjects: prev.extractedProjects,
            experience: prev.experience
          }));
        }
      }
    } catch (err) {
      console.warn('[ResumeUpload] Failed to fetch resumes list:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleActivateResume = async (resumeId) => {
    setActionLoading(resumeId);
    setErrorMessage('');
    try {
      await apiService.activateResume(resumeId);
      await fetchResumes();
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to activate resume.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateResume = async (resumeId) => {
    setActionLoading(resumeId);
    setErrorMessage('');
    try {
      await apiService.deactivateResume(resumeId);
      await fetchResumes();
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to deactivate resume.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume? Its Tier 1 claims will be removed.')) {
      return;
    }
    setActionLoading(resumeId);
    setErrorMessage('');
    try {
      await apiService.deleteResume(resumeId);
      await fetchResumes();
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete resume.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleAIParsing = async () => {
    setErrorMessage('');
    setUploading(true);
    setParsingStep(1);

    try {
      let fileToUpload = selectedFile;
      if (!fileToUpload) {
        setErrorMessage('Please select a resume file (.pdf, .docx, or .txt) from your computer first.');
        setUploading(false);
        setParsingStep(0);
        return;
      }

      setParsingStep(2);
      const res = await apiService.uploadResume(fileToUpload);
      setParsingStep(3);

      if (res) {
        const skillsList = Array.isArray(res.extractedSkills)
          ? res.extractedSkills.map(s => (typeof s === 'string' ? s : (s.skillName || s.name)))
          : (res.extractedSkills ? [res.extractedSkills] : resumeData.extractedSkills);

        setResumeData({
          fileName: res.fileName || fileToUpload.name,
          uploadedAt: 'Just now',
          fileSize: `${Math.round(fileToUpload.size / 1024) || 380} KB`,
          parsed: true,
          extractedSkills: skillsList.length > 0 ? skillsList : resumeData.extractedSkills,
          extractedProjects: Array.isArray(res.extractedProjects) && res.extractedProjects.length > 0
            ? res.extractedProjects
            : resumeData.extractedProjects,
          experience: Array.isArray(res.extractedExperience) && res.extractedExperience.length > 0
            ? res.extractedExperience
            : resumeData.experience
        });

        if (loadLiveStudentData) {
          await loadLiveStudentData();
        }
        await fetchResumes();
      }

      setParsingStep(4);
    } catch (err) {
      console.error('[ResumeUpload] Backend resume extraction failed:', err);
      setErrorMessage(err.message || 'Resume upload or AI skill extraction failed. Please ensure the file is a valid text-based PDF resume.');
      setParsingStep(0);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmAndImport = async () => {
    try {
      if (!resumeData.parsed && selectedFile && !uploading) {
        await handleAIParsing();
      }
      setImported(true);
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
      setTimeout(() => {
        navigate('/student/skill-map');
      }, 500);
    } catch (err) {
      console.error('[ResumeUpload] Confirm and import error:', err);
      setImported(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header Bar (Screen 3 Reference) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Resume & Evidence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload, manage, and verify your technical credentials and portfolio evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <input
            type="file"
            ref={evidenceFileInputRef}
            onChange={handleEvidenceFileChange}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            className="hidden"
            id="input-evidence-file"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={UploadCloud}
          >
            + Add New
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Resume Card (Screen 3 Reference) */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Current Resume</h3>
                <Badge variant="blue" size="xs">Active Base</Badge>
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                {selectedFile ? selectedFile.name : (resumeData.fileName || 'Anuj_Bhalothia_Resume.pdf')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Uploaded on {resumeData.uploadedAt || 'Aug 15, 2026'} • {resumeData.fileSize || '1.2 MB'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-center">
            <div className="text-right hidden sm:block">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Your resume is verified and visible to recruiters.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleViewCurrentResume}
                icon={Eye}
                id="btn-view-current-resume"
              >
                View
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                id="btn-replace-resume"
              >
                Replace
              </Button>
              {selectedFile && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAIParsing}
                  isLoading={uploading}
                  icon={Sparkles}
                >
                  Parse with AI
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Parsing Progress Indicator */}
        {uploading && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>AI Knowledge Extraction Engine</span>
              </span>
              <span className="font-mono text-blue-700 text-[11px]">
                {parsingStep === 1 ? 'Extracting Text...' : parsingStep === 2 ? 'Calling LLM Classifier...' : 'Validating Structured JSON...'}
              </span>
            </div>
            <ProgressBar value={(parsingStep / 4) * 100} max={100} size="sm" color="blue" />
          </div>
        )}
      </Card>

      {/* Evidence Documents Table (Screen 3 Reference) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Evidence Documents</h2>
            <p className="text-xs text-slate-500 mt-0.5">Audited technical claims, capstone projects, and certifications</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {resumesList.length + evidenceList.length} Documents
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {/* Evidence Document Rows */}
              {evidenceList.map((doc) => {
                const IconComponent = doc.icon;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${doc.iconColor} flex items-center justify-center`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span>{doc.name}</span>
                        {doc.documentFileName && (
                          <span className="text-[10px] text-slate-400 font-normal">{doc.documentFileName}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{doc.type}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{doc.date}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={doc.badgeVariant} size="sm">{doc.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.documentUrl ? (
                          <button
                            onClick={() => handleViewDocument(doc.documentUrl)}
                            id={`btn-view-${doc.id}`}
                            aria-label={`View ${doc.name}`}
                            className="px-3 py-1 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0F172A] rounded-full hover:bg-slate-50 transition-colors shadow-sm inline-flex items-center gap-1"
                          >
                            View
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleTriggerAddDocument(doc.id)}
                          id={`btn-add-doc-${doc.id}`}
                          aria-label={`Add Document for ${doc.name}`}
                          className="px-3 py-1 text-xs font-semibold bg-white border border-[#E2E8F0] text-[#2563EB] rounded-full hover:bg-blue-50/60 transition-colors shadow-sm inline-flex items-center gap-1"
                        >
                          Add Document
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Uploaded Resumes in History */}
              {resumesList.map((res) => {
                const resumeDocUrl = (res.fileUrl && (res.fileUrl.startsWith('http') || res.fileUrl.startsWith('/')))
                  ? res.fileUrl
                  : '/documents/anuj_bhalothia_resume.pdf';
                return (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <FileCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>{res.fileName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">Resume PDF</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {res.uploadedAt ? new Date(res.uploadedAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 px-4">
                      {res.isActive ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Archived</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewDocument(resumeDocUrl)}
                        id={`btn-view-resume-${res.id}`}
                        aria-label={`View ${res.fileName}`}
                        className="px-3 py-1 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0F172A] rounded-full hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        View
                      </button>
                      {!res.isActive ? (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => handleActivateResume(res.id)}
                        >
                          Set Active
                        </Button>
                      ) : null}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDeleteResume(res.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Extracted Skills Tags Preview */}
      {resumeData.extractedSkills?.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Extracted Technical Skills ({resumeData.extractedSkills.length})</h2>
              <p className="text-xs text-slate-500">Normalized against industry technical taxonomy</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAndImport}
              icon={ArrowRight}
              iconPosition="right"
            >
              {imported ? 'Imported' : 'View in Skill Map'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {resumeData.extractedSkills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResumeUpload;
