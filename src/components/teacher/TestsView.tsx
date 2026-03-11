import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';

/* ═══════════════════════════════════════════════════════════════
   Interfaces
   ═══════════════════════════════════════════════════════════════ */
interface TestItem {
  id: string;
  classId: string;
  title: string;
  description?: string;
  dueDate?: string;
  createdAt?: string;
  attachmentUrls?: string[];
}
interface TopLearner { learnerId: string; fullName: string; learnerNumber: string; mark: number | null; }
interface LearnerRow {
  learnerId: string; learnerNumber: string; fullName: string;
  submitted: boolean; mark: number | null;
  totalStars: number; testStars: number; testStarAwarded?: boolean; submissionId: string;
}
interface TestDetail {
  testId: string; title: string; description?: string;
  dueDate?: string; createdAt?: string; attachmentUrls?: string[];
  totalLearners: number; submittedCount: number;
  submissionRate: number; passRate: number;
  topLearners: TopLearner[]; learnerRows: LearnerRow[];
}

interface DraftLearnerRow {
  submitted: boolean;
  mark: string;
}

/* ═══════════════════════════════════════════════════════════════
   Tiny SVG donut (no dependency)
   ═══════════════════════════════════════════════════════════════ */
const DonutChart: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
  const r = 40, c = 2 * Math.PI * r, pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          className="transition-all duration-700" />
        <text x="50" y="54" textAnchor="middle" className="text-[15px] font-bold" fill="#111827">{pct.toFixed(0)}%</text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Tiny bar‑chart component (trend‑like)
   ═══════════════════════════════════════════════════════════════ */
const MiniBarChart: React.FC<{ data: number[]; labels: string[]; title: string; color: string }> = ({ data, labels, title, color }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="bg-blue-50/90 rounded-xl border border-blue-200 shadow-sm p-4 flex flex-col">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">{title}</h4>
      <div className="flex items-end gap-2 flex-1 min-h-[80px]">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-gray-700">{v}</span>
            <div className="w-full rounded-t" style={{ height: `${Math.max((v / max) * 70, 4)}px`, backgroundColor: color, transition: 'height 0.5s' }} />
            <span className="text-[9px] text-gray-400 truncate max-w-full">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
const TestView: React.FC = () => {
  /* ── core state ── */
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');

  const [testList, setTestList] = useState<TestItem[]>([]);
  const [loadingTest, setLoadingTest] = useState(false);
  const [refreshingTest, setRefreshingTest] = useState(false);

  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [detail, setDetail] = useState<TestDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshingDetail, setRefreshingDetail] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);

  /* ── create form state ── */
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({ title: '', description: '', dueDate: '', attachments: [] as File[], attachmentUrls: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState('');

  /* ── inline editing ── */
  const [draftRows, setDraftRows] = useState<Record<string, DraftLearnerRow>>({});
  const [isSubmittingRows, setIsSubmittingRows] = useState(false);
  const [awardingStarFor, setAwardingStarFor] = useState<string | null>(null);

  /* ── messages ── */
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState('');

  /* ── helpers ── */
  const getClassId = (cls: any) => cls?.id || cls?.classId || '';
  const normalizeDueDate = (v: string) => (!v ? v : v.length === 16 ? `${v}:00` : v);
  const fmtDate = (d?: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const canCreate = !!newTest.title.trim() && !!newTest.dueDate && !!selectedClass;

  /* ── load classes on mount ── */
  useEffect(() => {
    (async () => {
      try { setClasses((await api.getMyClasses()) || []); } catch { setClasses([]); }
      setLoadingClasses(false);
    })();
  }, []);

  /* ── file upload ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const fileArr = Array.from(files);
    setNewTest(p => ({ ...p, attachments: fileArr }));
    const urls: string[] = [];
    const token = localStorage.getItem('authToken');
    for (const file of fileArr) {
      const fd = new FormData(); fd.append('attachment', file);
      try {
        const res = await fetch('/api/test/upload-attachment', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd });
        const data = await res.json();
        if (data.success && data.url) urls.push(data.url);
      } catch { /* ignore */ }
    }
    setNewTest(p => ({ ...p, attachmentUrls: urls }));
  };

  /* ── Fetch test list for a class ── */
  const fetchTest = useCallback(async (classId: string, options?: { silent?: boolean }) => {
    const silent = !!options?.silent;
    setTestError('');
    setShowCreateForm(false);
    if (silent) {
      setRefreshingTest(true);
    } else {
      setLoadingTest(true);
    }

    try {
      const nextList = (await api.getTestList(classId)) || [];
      setTestList(nextList);

      if (selectedTest) {
        const nextSelected = nextList.find((item) => item.id === selectedTest.id) || null;
        if (nextSelected) {
          setSelectedTest(nextSelected);
        } else {
          setSelectedTest(null);
          setDetail(null);
        }
      }
    }
    catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to load test');
    }
    finally {
      setLoadingTest(false);
      setRefreshingTest(false);
    }
  }, [selectedTest]);

  /* ── Fetch detail for a single test ── */
  const fetchDetail = useCallback(async (cw: TestItem, options?: { silent?: boolean }) => {
    const silent = !!options?.silent;
    const preservedScrollTop = silent ? rightPanelRef.current?.scrollTop ?? null : null;

    setSelectedTest(cw);
    setShowCreateForm(false);
    if (silent) {
      setRefreshingDetail(true);
    } else {
      setLoadingDetail(true);
    }

    try {
      const nextDetail = await api.getTestDetail(cw.id);
      setDetail(nextDetail);
      const nextDrafts: Record<string, DraftLearnerRow> = {};
      nextDetail.learnerRows.forEach((row: LearnerRow) => {
        nextDrafts[row.learnerId] = {
          submitted: row.submitted,
          mark: row.mark != null ? String(row.mark) : '',
        };
      });
      setDraftRows(nextDrafts);
    }
    catch (err) {
      if (!silent) {
        setDetail(null);
      }
      setTestError(err instanceof Error ? err.message : 'Failed to load detail');
    }
    finally {
      setLoadingDetail(false);
      setRefreshingDetail(false);
      if (silent && preservedScrollTop != null) {
        requestAnimationFrame(() => {
          if (rightPanelRef.current) {
            rightPanelRef.current.scrollTop = preservedScrollTop;
          }
        });
      }
    }
  }, []);

  /* ── Delete ── */
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteTest(id);
      setTestList(l => l.filter(h => h.id !== id));
      if (selectedTest?.id === id) { setSelectedTest(null); setDetail(null); }
      setTestSuccess('Deleted.'); setTimeout(() => setTestSuccess(''), 2500);
    } catch (err) { setTestError(err instanceof Error ? err.message : 'Delete failed'); }
  };

  /* ── Create test (called after confirm) ── */
  const handleCreate = async () => {
    setShowConfirmDialog(false);
    setIsSaving(true);
    try {
      await api.createTest({
        classId: selectedClass, title: newTest.title, description: newTest.description,
        dueDate: normalizeDueDate(newTest.dueDate), attachmentUrls: newTest.attachmentUrls,
      });
      setIsSaving(false);
      setSuccessOverlay('Test assigned successfully!');
      setTimeout(() => {
        setSuccessOverlay('');
        setShowCreateForm(false);
        setNewTest({ title: '', description: '', dueDate: '', attachments: [], attachmentUrls: [] });
        fetchTest(selectedClass);
      }, 1800);
    } catch (err) {
      setIsSaving(false);
      setTestError(err instanceof Error ? err.message : 'Failed to create test');
    }
  };

  const onDraftSubmissionChange = (learnerId: string, submitted: boolean) => {
    setDraftRows((prev) => ({
      ...prev,
      [learnerId]: {
        ...(prev[learnerId] || { submitted: false, mark: '' }),
        submitted,
      },
    }));
  };

  const onDraftMarkChange = (learnerId: string, mark: string) => {
    setDraftRows((prev) => ({
      ...prev,
      [learnerId]: {
        ...(prev[learnerId] || { submitted: false, mark: '' }),
        mark,
      },
    }));
  };

  const hasDraftChanges = useMemo(() => {
    if (!detail) return false;
    return detail.learnerRows.some((row) => {
      const draft = draftRows[row.learnerId];
      if (!draft) return false;
      const submittedChanged = draft.submitted !== row.submitted;
      const originalMark = row.mark != null ? String(row.mark) : '';
      const markChanged = draft.mark.trim() !== originalMark;
      return submittedChanged || markChanged;
    });
  }, [detail, draftRows]);

  const handleSubmitLearnerRows = async () => {
    if (!selectedTest || !detail) return;

    const entries: { learnerId: string; submitted: boolean; mark: number | null }[] = [];
    for (const row of detail.learnerRows) {
      const draft = draftRows[row.learnerId];
      if (!draft) continue;

      const submittedChanged = draft.submitted !== row.submitted;
      const originalMark = row.mark != null ? String(row.mark) : '';
      const markChanged = draft.mark.trim() !== originalMark;
      if (!submittedChanged && !markChanged) {
        continue;
      }

      const markRaw = draft.mark.trim();
      const mark = markRaw === '' ? null : parseFloat(markRaw);
      if (mark !== null && (isNaN(mark) || mark < 0 || mark > 100)) {
        setTestError(`Mark must be 0-100 for ${row.fullName}`);
        return;
      }
      if (!draft.submitted && mark !== null) {
        setTestError(`Cannot capture mark before marking ${row.fullName} as submitted`);
        return;
      }

      entries.push({
        learnerId: row.learnerId,
        submitted: draft.submitted,
        mark,
      });
    }

    if (entries.length === 0) {
      return;
    }

    setTestError('');
    setIsSubmittingRows(true);
    try {
      await api.submitTestEntries(selectedTest.id, entries);
      setTestSuccess('Test entries submitted successfully.');
      setTimeout(() => setTestSuccess(''), 2500);
      await fetchDetail(selectedTest, { silent: true });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to submit test entries');
    } finally {
      setIsSubmittingRows(false);
    }
  };

  /* ── Award star ── */
  const handleAwardStar = async (learnerId: string) => {
    if (!selectedTest) return;
    setAwardingStarFor(learnerId);
    try {
      await api.toggleTestStar(selectedTest.id, learnerId, selectedTest.classId);
      fetchDetail(selectedTest, { silent: true });
    }
    catch (err) { setTestError(err instanceof Error ? err.message : 'Star toggle failed'); }
    setAwardingStarFor(null);
  };

  /* ── Derived chart data ── */
  const chartData = useMemo(() => {
    if (!detail) return null;
    const rows = detail.learnerRows;
    const marksDistro = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    rows.forEach(r => { if (r.mark != null) { const i = Math.min(Math.floor(r.mark / 20), 4); marksDistro[i]++; } });
    const starsData = detail.topLearners.map(t => {
      const row = rows.find(r => r.learnerId === t.learnerId);
      return row ? row.totalStars : 0;
    });
    const starsLabels = detail.topLearners.map(t => t.fullName.split(' ')[0]);
    return { marksDistro, starsData, starsLabels };
  }, [detail]);

  // placeholder values shown on landing
  const placeholderMode = !showCreateForm && !selectedTest;

  /* ═══════════════════════════════════════════ RENDER ═══════════════════════════════════════════ */
  return (
    <div className="w-full h-full min-h-screen bg-transparent relative">
      <div className="flex flex-row h-full min-h-screen">

        {/* ████████████████████████████████████
           LEFT PANEL – 30 %
           ████████████████████████████████████ */}
        <div className="w-full md:w-[30%] bg-blue-100/80 border-r border-blue-200 flex flex-col backdrop-blur-sm" style={{ maxHeight: '100vh' }}>
          {/* Fixed header area */}
          <div className="p-5 pb-3 space-y-3 border-b border-blue-200/70">
            <h1 className="text-xl font-bold text-gray-900">Test</h1>

            {/* Class dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Select Class</label>
              <select
                value={selectedClass}
                onChange={e => {
                  const nextClassId = e.target.value;
                  setSelectedClass(nextClassId);
                  if (nextClassId) {
                    fetchTest(nextClassId);
                  }
                }}
                className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-blue-50"
              >
                <option value="">— Choose a class —</option>
                {classes.map(cls => (
                  <option key={getClassId(cls)} value={getClassId(cls)}>{cls.name || cls.grade + ' - ' + cls.subject}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                disabled={!selectedClass}
                onClick={() => { setShowCreateForm(true); setSelectedTest(null); setDetail(null); setTestError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedClass ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Create
              </button>
            </div>

            {testError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">{testError}</p>}
            {testSuccess && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">{testSuccess}</p>}
            {refreshingTest && <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-1.5">Refreshing…</p>}
          </div>

          {/* Scrollable test list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!selectedClass ? (
              <div className="text-center py-12 text-gray-300">
                <svg className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M7 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-xs">Select a class to view items</p>
              </div>
            ) : loadingTest ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Loading…
              </div>
            ) : testList.length === 0 ? (
              <div className="text-center py-12 text-gray-300 text-xs">No test assigned yet.</div>
            ) : (
              testList.map(cw => {
                const sel = selectedTest?.id === cw.id;
                const past = cw.dueDate ? new Date(cw.dueDate) < new Date() : false;
                return (
                  <div key={cw.id} onClick={() => fetchDetail(cw)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all hover:shadow ${sel ? 'border-blue-500 bg-blue-100 shadow' : 'border-blue-200 bg-blue-50 hover:border-blue-300'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{cw.title}</p>
                        {cw.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{cw.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[11px] flex items-center gap-0.5 ${past ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {fmtDate(cw.dueDate)}
                          </span>
                          {cw.attachmentUrls && cw.attachmentUrls.length > 0 && (
                            <span className="text-[11px] text-gray-300">{cw.attachmentUrls.length} file{cw.attachmentUrls.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={e => handleDelete(cw.id, e)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition" title="Delete">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ████████████████████████████████████
           RIGHT PANEL – 70 %
           ████████████████████████████████████ */}
        <div ref={rightPanelRef} className="w-full md:w-[70%] overflow-y-auto" style={{ maxHeight: '100vh' }}>

          {/* ─────────────── PLACEHOLDER (landing) ─────────────── */}
          {placeholderMode && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              {/* placeholder stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Submission Rate', value: '—', icon: '📊', bg: 'bg-green-50' },
                  { label: 'Test Submitted', value: '—', icon: '📝', bg: 'bg-blue-50' },
                  { label: 'Number of Learners', value: '—', icon: '👥', bg: 'bg-purple-50' },
                  { label: 'Stars Awarded', value: '—', icon: '⭐', bg: 'bg-amber-50' },
                ].map(c => (
                  <div key={c.label} className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-5 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${c.bg}`}>{c.icon}</div>
                    <div><div className="text-xl font-bold text-gray-300">{c.value}</div><div className="text-xs text-gray-400">{c.label}</div></div>
                  </div>
                ))}
              </div>

              {/* placeholder description */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Test Description</h3>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>

              {/* placeholder top 5 */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Top 5 Learners</h3>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-2 bg-blue-100/80 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1"><div className="h-3 bg-gray-200 rounded w-full mb-1" /><div className="h-2 bg-gray-100 rounded w-2/3" /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* placeholder charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-5 flex flex-col items-center justify-center min-h-[160px]">
                  <DonutChart value={0} label="Submission Rate" color="#d1d5db" />
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 min-h-[160px]">
                  <h4 className="text-xs font-semibold text-gray-300 mb-3">Marks Distribution</h4>
                  <div className="flex items-end gap-2 h-20">
                    {['0-20', '21-40', '41-60', '61-80', '81-100'].map(l => (
                      <div key={l} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-4 bg-gray-100 rounded-t" /><span className="text-[9px] text-gray-300">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 min-h-[160px]">
                  <h4 className="text-xs font-semibold text-gray-300 mb-3">Stars – Top Learners</h4>
                  <div className="flex items-end gap-2 h-20">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-4 bg-gray-100 rounded-t" /><span className="text-[9px] text-gray-300">—</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* placeholder learner table */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-400">Learner Results &amp; Stars</h3></div>
                <div className="p-6 text-center text-gray-300 text-sm">Select a class and click <b>View</b>, then choose a test to see results.</div>
              </div>
            </div>
          )}

          {/* ─────────────── CREATE TEST FORM ─────────────── */}
          {showCreateForm && (
            <div className="p-6 animate-in fade-in duration-200">
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Create New Test
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Title <span className="text-red-400">*</span></label>
                    <input type="text" value={newTest.title}
                      onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                      className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., Exercise 5.2 – Functions" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
                    <textarea value={newTest.description}
                      onChange={e => setNewTest({ ...newTest, description: e.target.value })}
                      rows={4} className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter test instructions…" />
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date <span className="text-red-400">*</span></label>
                      <input type="datetime-local" value={newTest.dueDate}
                        onChange={e => setNewTest({ ...newTest, dueDate: e.target.value })}
                        className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments <span className="text-gray-400 font-normal">(optional)</span></label>
                      <label className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                        <svg className="h-8 w-8 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-xs text-gray-400">Click to browse</p>
                        <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" />
                      </label>
                      {newTest.attachments.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-500">{newTest.attachments.map((f, i) => <li key={i} className="flex items-center gap-1"><svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg>{f.name}</li>)}</ul>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-4 border-t border-blue-200/70">
                    <button type="button" onClick={() => { setShowCreateForm(false); setNewTest({ title: '', description: '', dueDate: '', attachments: [], attachmentUrls: [] }); }}
                      className="flex-1 px-4 py-3 border border-blue-200 text-gray-700 font-medium rounded-xl hover:bg-blue-100 transition-all">Cancel</button>
                    <button type="button" disabled={!canCreate}
                      onClick={() => setShowConfirmDialog(true)}
                      className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${canCreate ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      Assign Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────── TEST DETAIL DASHBOARD ─────────────── */}
          {!showCreateForm && selectedTest && (
            <div className="p-6 animate-in fade-in duration-200">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Loading dashboard…
                </div>
              ) : detail ? (
                <div className="space-y-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{detail.title}</h2>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        <span>Due: {fmtDate(detail.dueDate)}</span>
                        <span>Created: {fmtDate(detail.createdAt)}</span>
                        {refreshingDetail && <span>Updating…</span>}
                      </div>
                    </div>
                    <button onClick={() => { setSelectedTest(null); setDetail(null); }}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { v: `${detail.submissionRate}%`, l: 'Submission Rate', icon: '📊', bg: 'bg-green-50' },
                      { v: `${detail.submittedCount} / ${detail.totalLearners}`, l: 'Test Submitted', icon: '📝', bg: 'bg-blue-50' },
                      { v: detail.totalLearners, l: 'Number of Learners', icon: '👥', bg: 'bg-purple-50' },
                      { v: detail.learnerRows.reduce((s, r) => s + r.totalStars, 0), l: 'Stars Awarded', icon: '⭐', bg: 'bg-amber-50' },
                    ].map(c => (
                      <div key={c.l} className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 flex items-center gap-3">
                        <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-xl ${c.bg}`}>{c.icon}</div>
                        <div><div className="text-lg font-bold text-gray-900">{c.v}</div><div className="text-[11px] text-gray-500">{c.l}</div></div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {detail.description && (
                    <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
                      <h3 className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Description</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{detail.description}</p>
                    </div>
                  )}

                  {/* Top 5 Learners – marks & stars */}
                  {detail.topLearners.length > 0 && (
                    <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
                      <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        Top 5 Learners – Marks &amp; Stars
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {detail.topLearners.map((tl, idx) => {
                          const row = detail.learnerRows.find(r => r.learnerId === tl.learnerId);
                          return (
                            <div key={tl.learnerId} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                              <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>{idx + 1}</div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{tl.fullName}</p>
                                <p className="text-[10px] text-gray-500">{tl.mark != null ? `${tl.mark}%` : '—'} · ⭐{row?.totalStars ?? 0}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Charts row: 2 trend + 1 donut */}
                  {chartData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 flex flex-col items-center justify-center">
                        <DonutChart value={detail.submissionRate} label="Submission Rate" color="#22c55e" />
                      </div>
                      <MiniBarChart
                        data={chartData.marksDistro}
                        labels={['0-20', '21-40', '41-60', '61-80', '81-100']}
                        title="Marks Distribution"
                        color="#6366f1"
                      />
                      <MiniBarChart
                        data={chartData.starsData.length > 0 ? chartData.starsData : [0]}
                        labels={chartData.starsLabels.length > 0 ? chartData.starsLabels : ['—']}
                        title="Stars – Top Learners"
                        color="#f59e0b"
                      />
                    </div>
                  )}

                  {/* Learner Table */}
                  <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner Results &amp; Stars</h3>
                      <span className="text-[11px] text-gray-400">{detail.learnerRows.length} learners</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-blue-100/70 text-left text-[11px] text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-2.5 w-8">#</th>
                            <th className="px-4 py-2.5">Learner</th>
                            <th className="px-4 py-2.5 text-center">Submitted</th>
                            <th className="px-4 py-2.5 text-center">Mark</th>
                            <th className="px-4 py-2.5 text-center">Test Stars</th>
                            <th className="px-4 py-2.5 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {detail.learnerRows.map((row, idx) => (
                            <tr key={row.learnerId} className="hover:bg-blue-100/60 transition-colors">
                              <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                              <td className="px-4 py-2.5">
                                <span className="font-medium text-gray-900 text-sm">{row.fullName}</span>
                                <span className="text-[11px] text-gray-400 ml-2">{row.learnerNumber}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  onClick={() => onDraftSubmissionChange(row.learnerId, !(draftRows[row.learnerId]?.submitted ?? row.submitted))}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition ${(draftRows[row.learnerId]?.submitted ?? row.submitted) ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                  {(draftRows[row.learnerId]?.submitted ?? row.submitted) ? '✓ Yes' : '✗ No'}
                                </button>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {(draftRows[row.learnerId]?.submitted ?? row.submitted) ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={draftRows[row.learnerId]?.mark ?? (row.mark != null ? String(row.mark) : '')}
                                    onChange={(e) => onDraftMarkChange(row.learnerId, e.target.value)}
                                    className="w-20 px-2 py-1 text-center border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    placeholder="0-100"
                                  />
                                ) : (
                                  <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed" title="Marking unlocks when submission is Yes">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center text-amber-500 font-semibold text-xs">⭐ {row.testStarAwarded ? 1 : 0}</td>
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => handleAwardStar(row.learnerId)} disabled={awardingStarFor === row.learnerId}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition disabled:opacity-50 ${row.testStarAwarded ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                                  {row.testStarAwarded ? '⭐ Remove' : '⭐ Award'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-gray-500">Captured changes are saved only when you submit the full payload.</p>
                      <button
                        onClick={handleSubmitLearnerRows}
                        disabled={!hasDraftChanges || isSubmittingRows}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${!hasDraftChanges || isSubmittingRows ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {isSubmittingRows ? 'Submitting...' : 'Submit All Entries'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-20">Failed to load test details.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ████████████████████████████████████
         CONFIRM DIALOG
         ████████████████████████████████████ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-[min(92vw,420px)] rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Confirm Assignment</h3>
                <p className="text-sm text-gray-500">You are about to assign this test to the selected class.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-gray-500">Title:</span> <span className="font-medium text-gray-900">{newTest.title}</span></p>
              <p><span className="text-gray-500">Due:</span> <span className="font-medium text-gray-900">{newTest.dueDate ? fmtDate(newTest.dueDate) : '—'}</span></p>
              <p><span className="text-gray-500">Class:</span> <span className="font-medium text-gray-900">{classes.find(c => getClassId(c) === selectedClass)?.name || selectedClass}</span></p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ████████████████████████████████████
         SAVING ANIMATION OVERLAY
         ████████████████████████████████████ */}
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mx-auto relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full border-4 border-primary/20" />
              <span className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-foreground">Assigning test…</p>
          </div>
        </div>
      )}

      {/* ████████████████████████████████████
         SUCCESS OVERLAY
         ████████████████████████████████████ */}
      {successOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="mt-4 text-center text-sm font-medium text-foreground">{successOverlay}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestView;

