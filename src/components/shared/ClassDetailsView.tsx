import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

interface ClassDetailsViewProps {
  selectedClass: any;
  onCreateClass?: () => void;
  canCreateClass?: boolean;
}

const ClassDetailsView: React.FC<ClassDetailsViewProps> = ({ selectedClass, onCreateClass, canCreateClass }) => {
  const [classDetails, setClassDetails] = useState<any>(null);
  const [learners, setLearners] = useState<{ id: string; name: string; number: string }[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const selectedClassId = useMemo(() => selectedClass?.id || selectedClass?.classId || '', [selectedClass]);

  useEffect(() => {
    if (!selectedClassId) {
      setClassDetails(null);
      setLearners([]);
      return;
    }

    setLoadingData(true);
    Promise.all([
      api.getClass(selectedClassId),
      api.getLearners(selectedClassId),
    ])
      .then(([cls, learnerList]) => {
        setClassDetails(cls);
        const mappedLearners = (learnerList || []).map((learner: any) => ({
          id: learner.id,
          name: learner.fullName,
          number: learner.learnerNumber,
        }));
        setLearners(mappedLearners);
      })
      .catch((err) => {
        console.error('Failed to fetch class details:', err);
        setClassDetails(selectedClass);
        setLearners([]);
      })
      .finally(() => setLoadingData(false));
  }, [selectedClassId]);

  if (!selectedClass) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>Select a class to view details.</p>
        {canCreateClass && onCreateClass && (
          <button
            onClick={onCreateClass}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Class
          </button>
        )}
      </div>
    );
  }

  const detailClass = classDetails || selectedClass;

  const copyInviteCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
  };

  const stats = [
    { label: 'Learners', value: learners.length },
    { label: 'Academic Year', value: detailClass.academicYear || 'N/A' },
    { label: 'Invite Code', value: detailClass.inviteToken || 'N/A' },
  ];

  return (
    <div className="p-6 space-y-8">
      {canCreateClass && onCreateClass && (
        <div className="flex justify-end">
          <button
            onClick={onCreateClass}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Class
          </button>
        </div>
      )}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Class Overview</p>
            <h2 className="text-3xl font-semibold mt-2">{detailClass.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/10">{detailClass.grade || 'N/A'}</span>
              <span className="px-3 py-1 rounded-full bg-white/10">{detailClass.subject || 'N/A'}</span>
              <span className="px-3 py-1 rounded-full bg-white/10">{detailClass.academicYear || 'N/A'}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">Teacher: {detailClass.teacherName || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-300">Invite Code</p>
              <p className="text-lg font-mono tracking-widest">{detailClass.inviteToken || 'N/A'}</p>
            </div>
            <button
              onClick={() => copyInviteCode(detailClass.inviteToken)}
              className="px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-all"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Learners</h3>
              <span className="text-xs text-gray-400">#{learners.length} total</span>
            </div>
            {loadingData ? (
              <p className="text-sm text-gray-500">Loading class details...</p>
            ) : (
              <div className="max-h-72 overflow-y-auto pr-1">
                {learners.length > 0 ? (
                  <div className="space-y-2">
                    {learners.map((learner) => (
                      <div key={learner.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{learner.name}</p>
                            <p className="text-xs font-mono text-gray-500">#{learner.number}</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                            <div className="rounded-md bg-white px-2 py-1 border border-gray-200">
                              <span className="font-semibold">Stars</span>: --
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 border border-gray-200">
                              <span className="font-semibold">Test 1</span>: --
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 border border-gray-200">
                              <span className="font-semibold">Test 2</span>: --
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 border border-gray-200">
                              <span className="font-semibold">Assignment</span>: --
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No learners found for this class.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attendance Trend</h3>
            <div className="h-36 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 70 C40 20, 80 30, 110 50 C140 70, 170 60, 210 20" stroke="#0f172a" strokeWidth="3" fill="none" />
                <circle cx="10" cy="70" r="4" fill="#0f172a" />
                <circle cx="110" cy="50" r="4" fill="#0f172a" />
                <circle cx="210" cy="20" r="4" fill="#0f172a" />
              </svg>
            </div>
            <p className="mt-3 text-xs text-gray-500">Placeholder for attendance trends.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Snapshot</h3>
            <div className="h-36 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="30" width="18" height="40" fill="#94a3b8" />
                <rect x="60" y="20" width="18" height="50" fill="#64748b" />
                <rect x="100" y="45" width="18" height="25" fill="#94a3b8" />
                <rect x="140" y="15" width="18" height="55" fill="#0f172a" />
                <rect x="180" y="35" width="18" height="35" fill="#94a3b8" />
              </svg>
            </div>
            <p className="mt-3 text-xs text-gray-500">Placeholder for marks/engagement stats.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsView;
