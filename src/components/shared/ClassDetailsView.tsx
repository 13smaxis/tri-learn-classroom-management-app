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
  const [attendanceTrend, setAttendanceTrend] = useState<{ date: string; presentPct: number; total: number }[]>([]);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState<{ present: number; absent: number; late: number; excused: number; bunking: number; sick: number }>({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    bunking: 0,
    sick: 0,
  });
  const [loadingData, setLoadingData] = useState(false);

  const selectedClassId = useMemo(() => selectedClass?.id || selectedClass?.classId || '', [selectedClass]);

  useEffect(() => {
    if (!selectedClassId) {
      setClassDetails(null);
      setLearners([]);
      setAttendanceTrend([]);
      setAttendanceBreakdown({ present: 0, absent: 0, late: 0, excused: 0, bunking: 0, sick: 0 });
      return;
    }

    const toDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const buildSchoolDates = (startDate: Date, endDate: Date) => {
      const dates: string[] = [];
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const dayOfWeek = cursor.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          dates.push(toDateKey(cursor));
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      return dates;
    };

    setLoadingData(true);
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    Promise.all([
      api.getClass(selectedClassId),
      api.getLearners(selectedClassId),
      api.getAttendanceForDateRange(
        selectedClassId,
        toDateKey(startDate),
        toDateKey(endDate),
      ),
    ])
      .then(([cls, learnerList, attendanceRecords]) => {
        setClassDetails(cls);
        const mappedLearners = (learnerList || []).map((learner: any) => ({
          id: learner.id,
          name: learner.fullName,
          number: learner.learnerNumber,
        }));
        setLearners(mappedLearners);

        const byDate = new Map<string, { present: number; total: number }>();
        const breakdown = { present: 0, absent: 0, late: 0, excused: 0, bunking: 0, sick: 0 };
        (attendanceRecords || []).forEach((record: any) => {
          const dateKey = record.attendanceDate;
          const current = byDate.get(dateKey) || { present: 0, total: 0 };
          current.total += 1;
          if (record.status === 'present') {
            current.present += 1;
          }
          byDate.set(dateKey, current);

          if (record.status in breakdown) {
            breakdown[record.status as keyof typeof breakdown] += 1;
          }
        });

        const schoolDates = buildSchoolDates(startDate, endDate);
        const trend = schoolDates.map((dateKey) => {
          const stat = byDate.get(dateKey) || { present: 0, total: 0 };
          const presentPct = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
          return {
            date: dateKey,
            presentPct,
            total: stat.total,
          };
        });
        setAttendanceTrend(trend);
        setAttendanceBreakdown(breakdown);
      })
      .catch((err) => {
        console.error('Failed to fetch class details:', err);
        setClassDetails(selectedClass);
        setLearners([]);
        setAttendanceTrend([]);
        setAttendanceBreakdown({ present: 0, absent: 0, late: 0, excused: 0, bunking: 0, sick: 0 });
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

  const stats = [
    { label: 'Learners', value: learners.length },
    { label: 'Academic Year', value: detailClass.academicYear || 'N/A' },
    { label: 'Invite Code', value: detailClass.inviteToken || 'N/A' },
  ];

  const hasTrendData = attendanceTrend.some((point) => point.total > 0);
  const trendSvgWidth = 220;
  const trendSvgHeight = 90;
  const trendPaddingX = 10;
  const trendPaddingY = 10;
  const trendUsableWidth = trendSvgWidth - trendPaddingX * 2;
  const trendUsableHeight = trendSvgHeight - trendPaddingY * 2;
  const trendPoints = attendanceTrend.map((point, index) => {
    const x = attendanceTrend.length > 1
      ? trendPaddingX + (index / (attendanceTrend.length - 1)) * trendUsableWidth
      : trendPaddingX + trendUsableWidth / 2;
    const y = trendPaddingY + ((100 - point.presentPct) / 100) * trendUsableHeight;
    return { ...point, x, y };
  });
  const trendPath = trendPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const trendLabelIndexes = Array.from(new Set([
    0,
    Math.floor((trendPoints.length - 1) / 2),
    Math.max(0, trendPoints.length - 1),
  ])).filter((index) => index >= 0 && index < trendPoints.length);
  const formatDayLabel = (dateKey: string) => {
    const parts = dateKey.split('-');
    return parts.length === 3 ? parts[2] : dateKey;
  };

  const statusBars = [
    { key: 'present', label: 'P', value: attendanceBreakdown.present, color: '#16a34a' },
    { key: 'absent', label: 'A', value: attendanceBreakdown.absent, color: '#dc2626' },
    { key: 'late', label: 'L', value: attendanceBreakdown.late, color: '#ea580c' },
    { key: 'excused', label: 'E', value: attendanceBreakdown.excused, color: '#2563eb' },
    { key: 'bunking', label: 'B', value: attendanceBreakdown.bunking, color: '#991b1b' },
    { key: 'sick', label: 'S', value: attendanceBreakdown.sick, color: '#7e22ce' },
  ];
  const hasBreakdownData = statusBars.some((bar) => bar.value > 0);
  const maxStatusValue = Math.max(...statusBars.map((bar) => bar.value), 1);

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
              {hasTrendData ? (
                <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="10" y1="10" x2="210" y2="10" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="10" y1="45" x2="210" y2="45" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="10" y1="80" x2="210" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="10" y1="10" x2="10" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="6" y="13" textAnchor="end" fontSize="8" fill="#64748b">100%</text>
                  <text x="6" y="48" textAnchor="end" fontSize="8" fill="#64748b">50%</text>
                  <text x="6" y="83" textAnchor="end" fontSize="8" fill="#64748b">0%</text>
                  <path d={trendPath} stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {trendPoints.map((point) => (
                    <circle key={point.date} cx={point.x} cy={point.y} r="3.5" fill="#0f172a" />
                  ))}
                  {trendLabelIndexes.map((index) => {
                    const point = trendPoints[index];
                    if (!point) return null;
                    return (
                      <text
                        key={`label-${point.date}`}
                        x={point.x}
                        y="88"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#475569"
                      >
                        {formatDayLabel(point.date)}
                      </text>
                    );
                  })}
                </svg>
              ) : (
                <p className="text-sm text-gray-500">No attendance records yet.</p>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {hasTrendData
                ? 'Present % for the current month (Mon–Fri).' 
                : 'Add daily attendance to populate this trend.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Monthly Attendance Mix</h3>
            <div className="h-36 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              {hasBreakdownData ? (
                <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="12" y1="80" x2="208" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                  {statusBars.map((bar, index) => {
                    const barWidth = 24;
                    const gap = 8;
                    const x = 18 + index * (barWidth + gap);
                    const height = (bar.value / maxStatusValue) * 58;
                    const y = 80 - height;
                    return (
                      <g key={bar.key}>
                        <rect x={x} y={y} width={barWidth} height={height} fill={bar.color} rx="3" />
                        <text x={x + barWidth / 2} y="88" textAnchor="middle" fontSize="9" fill="#475569">{bar.label}</text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <p className="text-sm text-gray-500">No attendance records yet.</p>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500">Status distribution for the current month.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsView;
