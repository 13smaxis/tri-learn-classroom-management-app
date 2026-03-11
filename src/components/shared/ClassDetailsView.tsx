import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

interface ClassDetailsViewProps {
  selectedClass: any;
}

const ClassDetailsView: React.FC<ClassDetailsViewProps> = ({ selectedClass }) => {
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
  const [filterMode, setFilterMode] = useState<'daily' | 'quarter' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [perfSummary, setPerfSummary] = useState<{ topPerformers: any[]; atRisk: any[]; passingCount: number; atRiskCount: number; totalCount: number } | null>(null);

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

    const getDateRange = () => {
      const selected = new Date(selectedDate);
      let startDate: Date, endDate: Date;

      if (filterMode === 'daily') {
        startDate = new Date(selected);
        endDate = new Date(selected);
      } else if (filterMode === 'quarter') {
        startDate = new Date(selectedYear, selectedQuarter * 3, 1);
        endDate = new Date(selectedYear, selectedQuarter * 3 + 3, 0);
      } else {
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
      }
      return { startDate, endDate };
    };

    setLoadingData(true);
    const { startDate, endDate } = getDateRange();

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
      })
      .finally(() => setLoadingData(false));
  }, [selectedClassId, filterMode, selectedDate, selectedYear, selectedQuarter]);

  useEffect(() => {
    if (!selectedClassId) {
      setPerfSummary(null);
      return;
    }
    api.getClassPerformanceSummary(selectedClassId)
      .then((data: any) => setPerfSummary(data))
      .catch(() => setPerfSummary(null));
  }, [selectedClassId]);

  if (!selectedClass) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>Select a class to view details.</p>
      </div>
    );
  }

  const detailClass = classDetails || selectedClass;

  // Calculate attendance rate and pass rate
  const totalAttendanceRecords = Object.values(attendanceBreakdown).reduce((a, b) => a + b, 0);
  const attendanceRate = totalAttendanceRecords > 0 ? Math.round((attendanceBreakdown.present / totalAttendanceRecords) * 100) : 0;
  const trendAverage = attendanceTrend.length > 0 ? Math.round(attendanceTrend.reduce((sum, d) => sum + d.presentPct, 0) / attendanceTrend.length) : 0;

  const stats = [
    { label: 'Learners', value: learners.length },
    { label: 'Attendance Rate', value: `${attendanceRate}%` },
    { label: 'Pass Rate', value: `${trendAverage}%` },
  ];

  const hasTrendData = attendanceTrend.some((point) => point.total > 0);
  const trendSvgWidth = 520;
  const trendSvgHeight = 300;
  const trendPaddingX = 50;
  const trendPaddingY = 30;
  const trendPaddingBottom = 40;
  const trendUsableWidth = trendSvgWidth - trendPaddingX - 20;
  const trendUsableHeight = trendSvgHeight - trendPaddingY - trendPaddingBottom;
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
    <div className="p-6 space-y-6">
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

      {/* Performance Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top 5 Performers */}
        <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🏆</span> Top 5 Performers
          </h3>
          {perfSummary && perfSummary.topPerformers.length > 0 ? (
            <div className="space-y-2">
              {perfSummary.topPerformers.map((s: any, i: number) => (
                <div key={s.learnerId} className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-700 w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{s.fullName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">#{s.learnerNumber}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-700">{s.avgMark}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No marks captured yet.</p>
          )}
        </div>

        {/* At-Risk Students */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>⚠️</span> At-Risk Students
            {perfSummary && (
              <span className="ml-auto text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                {perfSummary.atRiskCount}/{perfSummary.totalCount}
              </span>
            )}
          </h3>
          {perfSummary && perfSummary.atRisk.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {perfSummary.atRisk.map((s: any) => (
                <div key={s.learnerId} className="flex items-center justify-between rounded-lg bg-white border border-red-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 leading-tight">{s.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-mono">#{s.learnerNumber}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {s.avgMark != null ? `${s.avgMark}%` : 'No data'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{perfSummary ? 'No at-risk students.' : 'No marks captured yet.'}</p>
          )}
        </div>

        {/* Passing vs At-Risk Pie Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col items-center">
          <h3 className="text-base font-semibold text-gray-900 mb-3 self-start">Pass / At-Risk Split</h3>
          {perfSummary && perfSummary.totalCount > 0 ? (() => {
            const passing = perfSummary.passingCount;
            const atRisk = perfSummary.atRiskCount;
            const total = perfSummary.totalCount;
            const passPct = total > 0 ? (passing / total) : 0;
            const cx = 80; const cy = 80; const r = 60;
            const passAngle = passPct * 2 * Math.PI;
            const x1 = cx + r * Math.sin(0);
            const y1 = cy - r * Math.cos(0);
            const x2 = cx + r * Math.sin(passAngle);
            const y2 = cy - r * Math.cos(passAngle);
            const largeArc = passPct > 0.5 ? 1 : 0;
            const riskLargeArc = (1 - passPct) > 0.5 ? 1 : 0;
            return (
              <div className="flex flex-col items-center gap-3 w-full">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {passPct === 0 ? (
                    <circle cx={cx} cy={cy} r={r} fill="#dc2626" />
                  ) : passPct === 1 ? (
                    <circle cx={cx} cy={cy} r={r} fill="#16a34a" />
                  ) : (
                    <>
                      <path
                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill="#16a34a"
                      />
                      <path
                        d={`M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${riskLargeArc} 1 ${x1} ${y1} Z`}
                        fill="#dc2626"
                      />
                    </>
                  )}
                  <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="white">
                    {Math.round(passPct * 100)}%
                  </text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="white">passing</text>
                </svg>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
                    <span className="text-gray-700">Passing: <b>{passing}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
                    <span className="text-gray-700">At-Risk: <b>{atRisk}</b></span>
                  </div>
                </div>
              </div>
            );
          })() : (
            <p className="text-sm text-gray-400 mt-4">No data yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
        <div className="lg:col-span-2 space-y-4 flex flex-col overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className={`${stat.label === 'Attendance Rate' ? 'text-[10px] whitespace-nowrap tracking-wide' : 'text-xs tracking-widest'} uppercase text-gray-400`}>
                  {stat.label}
                </p>
                <p className="font-semibold text-gray-900 mt-2 text-2xl">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Learners</h3>
              <div className="flex items-center gap-3">
                {loadingData && <span className="text-xs text-gray-400">Updating…</span>}
                <span className="text-xs text-gray-400">#{learners.length} total</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
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
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Date Filter */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Filter Mode Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterMode('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterMode === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setFilterMode('quarter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterMode === 'quarter'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Quarter
                </button>
                <button
                  onClick={() => setFilterMode('yearly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterMode === 'yearly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yearly
                </button>
              </div>

              {/* Dynamic picker based on filter mode */}
              {filterMode === 'daily' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-600">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}

              {filterMode === 'quarter' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-600">Year</label>
                    <input
                      type="number"
                      min="2020"
                      max="2099"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-600">Quarter</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((q) => (
                        <button
                          key={q}
                          onClick={() => setSelectedQuarter(q)}
                          className={`py-2 rounded-lg text-xs font-medium transition ${
                            selectedQuarter === q
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Q{q + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {filterMode === 'yearly' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-600">Select Year</label>
                  <input
                    type="number"
                    min="2020"
                    max="2099"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Pass Rate Trend
            </h3>
            <div className="h-96 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center p-4 overflow-x-auto">
              {hasTrendData ? (
                <svg width={trendSvgWidth} height={trendSvgHeight} viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`} fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Y-axis gridlines with labels */}
                  {[100, 80, 60, 40, 20, 0].map((pct) => {
                    const y = trendPaddingY + ((100 - pct) / 100) * trendUsableHeight;
                    return (
                      <g key={`gridline-${pct}`}>
                        <line x1={trendPaddingX} y1={y} x2={trendSvgWidth - 10} y2={y} stroke={pct === 0 ? '#cbd5e1' : '#e2e8f0'} strokeWidth="1" strokeDasharray={pct === 0 ? '0' : '2 2'} />
                        <text x={trendPaddingX - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b" fontWeight="500">{pct}%</text>
                      </g>
                    );
                  })}
                  {/* X-axis */}
                  <line x1={trendPaddingX} y1={trendSvgHeight - trendPaddingBottom} x2={trendSvgWidth - 10} y2={trendSvgHeight - trendPaddingBottom} stroke="#cbd5e1" strokeWidth="2" />
                  {/* Y-axis */}
                  <line x1={trendPaddingX} y1={trendPaddingY} x2={trendPaddingX} y2={trendSvgHeight - trendPaddingBottom} stroke="#cbd5e1" strokeWidth="2" />
                  {/* Line chart */}
                  <path d={trendPath} stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Data points */}
                  {trendPoints.map((point) => (
                    <circle key={point.date} cx={point.x} cy={point.y} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  ))}
                  {/* X-axis date labels */}
                  {trendLabelIndexes.map((index) => {
                    const point = trendPoints[index];
                    if (!point) return null;
                    return (
                      <text
                        key={`label-${point.date}`}
                        x={point.x}
                        y={trendSvgHeight - trendPaddingBottom + 20}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#475569"
                        fontWeight="500"
                      >
                        {formatDayLabel(point.date)}
                      </text>
                    );
                  })}

                </svg>
              ) : (
                <p className="text-sm text-gray-500">No attendance records yet. Add daily attendance to populate this trend.</p>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              <span className="font-semibold">Pass Rate:</span> {hasTrendData ? 'Percentage of learners present each day (Mon–Fri)' : 'Add daily attendance to populate this trend.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Monthly Attendance Mix
            </h3>
            <div className="h-96 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center p-4">
              {hasBreakdownData ? (
                <svg width="520" height="300" viewBox="0 0 520 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Y-axis gridlines */}
                  {[100, 75, 50, 25, 0].map((pct) => {
                    const y = 30 + ((100 - pct) / 100) * 230;
                    return (
                      <g key={`gridline-${pct}`}>
                        <line x1="50" y1={y} x2="500" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="42" y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{pct}%</text>
                      </g>
                    );
                  })}
                  {/* X and Y axes */}
                  <line x1="50" y1="30" x2="50" y2="260" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="50" y1="260" x2="500" y2="260" stroke="#cbd5e1" strokeWidth="2" />

                  {/* Bars */}
                  {statusBars.map((bar, index) => {
                    const barWidth = 50;
                    const gap = 12;
                    const x = 60 + index * (barWidth + gap);
                    const height = (bar.value / maxStatusValue) * 230;
                    const y = 260 - height;
                    return (
                      <g key={bar.key}>
                        <rect x={x} y={y} width={barWidth} height={height} fill={bar.color} rx="3" />
                        <text x={x + barWidth / 2} y="280" textAnchor="middle" fontSize="12" fill="#475569" fontWeight="600">{bar.label}</text>
                        <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="700">{bar.value}</text>
                      </g>
                    );
                  })}

                </svg>
              ) : (
                <p className="text-sm text-gray-500">No attendance records yet. Add daily attendance to populate this chart.</p>
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
