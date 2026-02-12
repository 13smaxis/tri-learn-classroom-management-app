import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentUploadWidget, { ParsedLearner } from '@/components/shared/StudentUploadWidget';

export type AttendanceByDate = Record<string, Record<string, string>>;

type Learner = { id: string; name: string; number: string };

const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [learners, setLearners] = useState<Learner[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [attendanceByDate, setAttendanceByDate] = useState<AttendanceByDate>({});
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadingStu, setUploadingStu] = useState(false);
  const [stuProgress, setStuProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<'csv' | 'manual'>('csv');
  const [csvParsedLearners, setCsvParsedLearners] = useState<ParsedLearner[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    api.getMyClasses()
      .then(data => setClasses(data || []))
      .catch(err => {
        console.error('Failed to fetch classes:', err);
        setClasses([]);
      });
  }, [user]);

  // When a class is selected, load any saved learners for that class
  useEffect(() => {
    if (!selectedClass) {
      setLearners([]);
      setAttendance({});
      setAttendanceByDate({});
      setUploadStatus(null);
      setUploadedFileName(null);
      setShowUploadPanel(false);
      setCsvParsedLearners([]);
      setCsvFileName(null);
      return;
    }

    // Load learners from backend
    api.getLearners(selectedClass)
      .then(data => {
        const mappedLearners = data.map((l: any) => ({
          id: l.id,
          name: l.fullName,
          number: l.learnerNumber
        }));
        setLearners(mappedLearners);
        setUploadStatus(mappedLearners.length ? 'saved' : null);
      })
      .catch(err => {
        console.error('Failed to load learners:', err);
        setLearners([]);
      });

    // Load attendance for the selected date
    api.getAttendanceForDate(selectedClass, selectedDate)
      .then(data => {
        setAttendanceByDate({ [selectedDate]: data });
        setAttendance(data);
      })
      .catch(err => {
        console.error('Failed to load attendance:', err);
        setAttendanceByDate({});
        setAttendance({});
      });
  }, [selectedClass]);

  // Keep per-date attendance map in sync with the selected date
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    // Check if we already have this date loaded
    if (attendanceByDate[selectedDate]) {
      setAttendance(attendanceByDate[selectedDate]);
      return;
    }

    // Load attendance for the new date from backend
    api.getAttendanceForDate(selectedClass, selectedDate)
      .then(data => {
        setAttendanceByDate(prev => ({ ...prev, [selectedDate]: data }));
        setAttendance(data);
      })
      .catch(err => {
        console.error('Failed to load attendance for date:', err);
        setAttendance({});
      });
  }, [selectedDate, selectedClass]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Legacy handler kept for backward compat – unused now
  };

  // Direct CSV file pick from the file explorer
  const handleDirectCsvPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result?.toString() || '';
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('File is empty or has no data rows.');
        return;
      }
      const dataLines = lines.slice(1);
      const parsed: ParsedLearner[] = dataLines.map((line, idx) => {
        const [idRaw, nameRaw, surnameRaw] = line.split(',');
        const learnerNumber = (idRaw || '').trim() || String(idx + 1);
        const firstName = (nameRaw || '').trim();
        const surname = (surnameRaw || '').trim();
        const fullName = [firstName, surname].filter(Boolean).join(' ') || `Learner ${idx + 1}`;
        return { learnerNumber, fullName };
      });
      setCsvParsedLearners(parsed);
      setUploadMode('csv');
      setShowUploadPanel(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvConfirmUpload = () => {
    if (csvParsedLearners.length === 0) return;
    handleStudentsReady(csvParsedLearners);
  };

  const handleStudentsReady = async (parsedLearners: ParsedLearner[]) => {
    if (!selectedClass) {
      alert('Please select a class before uploading learners.');
      return;
    }
    setUploadingStu(true);
    setStuProgress(0);

    // Simulate progress for large uploads
    const interval = setInterval(() => {
      setStuProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const data = await api.uploadLearners({
        classId: selectedClass,
        learners: parsedLearners,
      });
      clearInterval(interval);
      setStuProgress(100);
      await new Promise(r => setTimeout(r, 400));

      const mappedLearners = data.map((l: any) => ({
        id: l.id,
        name: l.fullName,
        number: l.learnerNumber,
      }));
      setLearners(mappedLearners);
      setAttendance({});
      setUploadStatus('saved');
      setUploadedFileName('upload');
      setShowUploadPanel(false);
      setCsvParsedLearners([]);
      setCsvFileName(null);
    } catch (err: any) {
      clearInterval(interval);
      alert('Failed to upload learners: ' + err.message);
    } finally {
      setUploadingStu(false);
      setStuProgress(0);
    }
  };

  const handleAttendanceChange = (learnerId: string, status: string) => {
    setAttendance(prev => {
      const next = { ...prev, [learnerId]: status };
      setAttendanceByDate(prevByDate => {
        const currentForDate = prevByDate[selectedDate] || {};
        const updatedForDate = { ...currentForDate, [learnerId]: status };
        return { ...prevByDate, [selectedDate]: updatedForDate };
      });
      return next;
    });
  };

  const markAllPresent = () => {
    const allPresent: Record<string, string> = {};
    learners.forEach(l => allPresent[l.id] = 'present');
        const newAttendance: Record<string, string> = {};
        learners.forEach(learner => {
          newAttendance[learner.id] = 'present';
        });
        setAttendance(newAttendance);
        setAttendanceByDate(prevByDate => ({
          ...prevByDate,
          [selectedDate]: newAttendance,
        }));
  };

  const handleSave = () => {
    if (!selectedClass) return;

    const currentForDate = attendanceByDate[selectedDate] || {};
    const updatedForDate = { ...currentForDate, ...attendance };

    // Save attendance to backend
    api.saveAttendance({
      classId: selectedClass,
      date: selectedDate,
      attendance: updatedForDate
    })
      .then(() => {
        setAttendanceByDate(prevByDate => ({
          ...prevByDate,
          [selectedDate]: updatedForDate
        }));
        alert(`Attendance register for ${selectedDate} has been saved to database.`);
      })
      .catch(err => {
        console.error('Failed to save attendance:', err);
        alert('Failed to save attendance: ' + err.message);
      });
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;
  const excusedCount = Object.values(attendance).filter(s => s === 'excused').length;
  const bunkingCount = Object.values(attendance).filter(s => s === 'bunking').length;
  const sickCount = Object.values(attendance).filter(s => s === 'sick').length;

  const getStatusLetter = (status?: string) => {
    switch (status) {
      case 'present':
        return 'P';
      case 'absent':
        return 'A';
      case 'late':
        return 'L';
      case 'excused':
        return 'E';
      case 'bunking':
        return 'B';
      case 'sick':
        return 'S';
      default:
        return '';
    }
  };

  const getWeekDays = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sun, 1 = Mon
    const diffToMonday = (day + 6) % 7; // days since Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);

    const labels = ['M', 'T', 'W', 'T', 'F'];
    const days = [] as { label: string; dateKey: string }[];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      days.push({ label: labels[i], dateKey });
    }
    return days;
  };

  const getMonthWeeks = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of month
    const firstOfMonth = new Date(year, month, 1);
    const firstDay = firstOfMonth.getDay(); // 0=Sun
    const diffToMonday = (firstDay + 6) % 7;
    const firstMonday = new Date(firstOfMonth);
    firstMonday.setDate(firstOfMonth.getDate() - diffToMonday);

    const weeks: { label: string; days: { label: string; dateKey: string }[] }[] = [];
    const labels = ['M', 'T', 'W', 'T', 'F'];

    for (let w = 0; w < 5; w++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + w * 7);
      const days: { label: string; dateKey: string }[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        days.push({ label: labels[i], dateKey });
      }
      weeks.push({ label: `Week ${w + 1}`, days });
    }

    return weeks;
  };

  const activeWeekDays = getWeekDays(selectedDate);
  const monthWeeksForWeekly = getMonthWeeks(selectedDate);
  const activeWeekDateKeys = new Set(activeWeekDays.map(d => d.dateKey));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Register</h1>
          <p className="text-gray-500">Mark daily attendance for your classes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="
                          w-full rounded-lg 
                          border border-gray-300 
                          px-4 py-3 
                          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                        "
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="
                          w-full rounded-lg 
                          border border-gray-300 
                          px-4 py-3 
                          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                        "
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learners {learners.length > 0 && <span className="text-green-600 font-normal">({learners.length} loaded)</span>}
            </label>
            {/* Hidden file input for CSV */}
            <input ref={csvFileRef} type="file" accept=".csv" onChange={handleDirectCsvPick} className="hidden" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectedClass && csvFileRef.current?.click()}
                disabled={!selectedClass}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${
                  selectedClass
                    ? 'border-gray-300 text-blue-700 bg-blue-50 hover:border-blue-400 hover:bg-blue-100/50 cursor-pointer'
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <span>📄</span> Upload CSV
              </button>
              <button
                type="button"
                onClick={() => { if (!selectedClass) return; setUploadMode('manual'); setShowUploadPanel(true); }}
                disabled={!selectedClass}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${
                  selectedClass
                    ? 'border-gray-300 text-blue-700 bg-blue-50 hover:border-blue-400 hover:bg-blue-100/50 cursor-pointer'
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <span>✏️</span> Capture
              </button>
            </div>
            {!selectedClass && (
              <p className="mt-1 text-xs text-gray-400">Select a class first to upload or capture students.</p>
            )}
            {uploadStatus === 'saved' && (
              <p className="mt-1 text-xs text-green-600">
                Learners list loaded for this class.
              </p>
            )}
          </div>
        </div>

        {/* CSV preview after file picked */}
        {showUploadPanel && uploadMode === 'csv' && csvParsedLearners.length > 0 && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-800">📄 {csvFileName} — {csvParsedLearners.length} student(s) found</p>
              <button
                type="button"
                onClick={() => { setShowUploadPanel(false); setCsvParsedLearners([]); setCsvFileName(null); }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">#</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Full Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvParsedLearners.map((l, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-1.5 text-gray-700">{l.learnerNumber}</td>
                      <td className="px-3 py-1.5 text-gray-900 font-medium">{l.fullName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {uploadingStu && (
              <div className="w-full mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-700">Uploading…</span>
                  <span className="text-xs font-medium text-blue-700">{Math.round(stuProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${stuProgress}%` }}
                  />
                </div>
              </div>
            )}

            {!uploadingStu && (
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={handleCsvConfirmUpload}
                  className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
                >
                  Upload Students
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual capture panel */}
        {showUploadPanel && uploadMode === 'manual' && selectedClass && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-800">✏️ Capture Students</p>
              <button
                type="button"
                onClick={() => setShowUploadPanel(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <StudentUploadWidget
              onLearnersReady={handleStudentsReady}
              allowManualCapture={true}
              isSaving={uploadingStu}
              saveProgress={stuProgress}
              uploadLabel="Upload Students"
              initialMode="manual"
              onCancel={() => setShowUploadPanel(false)}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-500">View:</span>
          {['daily', 'weekly', 'monthly'].map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {mode === 'daily' ? 'Daily' : mode === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-400">
            Legend: P=Present, A=Absent, L=Late, E=Excused, B=Bunking, S=Sick
          </span>
        </div>

        {viewMode === 'weekly' && (
          <div className="mt-4 flex items-end gap-0 border-b border-gray-300">
            {monthWeeksForWeekly.map((week, index) => {
              const isActive = week.days.some(day => activeWeekDateKeys.has(day.dateKey));
              const rangeLabel = `${week.days[0]?.dateKey.slice(5)} – ${week.days[4]?.dateKey.slice(5)}`;
              return (
                <button
                  key={week.label}
                  type="button"
                  onClick={() => {
                    const currentMonth = new Date(selectedDate).getMonth();
                    const inMonth = week.days.find(d => new Date(d.dateKey).getMonth() === currentMonth);
                    const targetDate = inMonth?.dateKey || week.days[0]?.dateKey || selectedDate;
                    setSelectedDate(targetDate);
                  }}
                  className={`
                    relative px-4 py-2 text-xs font-semibold transition-all
                    rounded-t-md border border-b-0
                    ${isActive
                      ? 'bg-white text-blue-700 border-gray-300 z-10 -mb-px shadow-[0_-1px_3px_rgba(0,0,0,0.06)]'
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                  title={rangeLabel}
                >
                  <span className="block leading-tight">{`Week ${index + 1}`}</span>
                  <span className={`block text-[10px] font-normal leading-tight mt-0.5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                    {rangeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedClass && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-green-700">Present</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-red-700">Absent</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{lateCount}</p>
              <p className="text-sm text-orange-700">Late</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{excusedCount}</p>
              <p className="text-sm text-blue-700">Excused</p>
            </div>
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{bunkingCount}</p>
              <p className="text-sm text-red-800">Bunking</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{sickCount}</p>
              <p className="text-sm text-purple-700">Sick</p>
            </div>
          </div>
          {learners.length > 0 && (
            <div className="flex justify-start">
              <button
                onClick={markAllPresent}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
              >
                Mark All Present
              </button>
            </div>
          )}

          {viewMode === 'daily' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Learners ({learners.length})</h3>
                <button
                  onClick={markAllPresent}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
                >
                  Mark All Present
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {learners.map((learner) => (
                  <div key={learner.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {learner.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{learner.name}</p>
                        <p className="text-sm text-gray-500">#{learner.number}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {['present', 'absent', 'late', 'excused', 'bunking', 'sick'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleAttendanceChange(learner.id, status)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            attendance[learner.id] === status
                              ? status === 'present' ? 'bg-green-500 text-white' :
                                status === 'absent' ? 'bg-red-500 text-white' :
                                status === 'late' ? 'bg-orange-500 text-white' :
                                status === 'bunking' ? 'bg-red-700 text-white' :
                                status === 'sick' ? 'bg-purple-500 text-white' :
                                'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'weekly' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Weekly View (Mon–Fri)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-800">Learner</th>
                      {activeWeekDays.map(day => (
                        <th
                          key={day.dateKey}
                          className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-800"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {learners.map(learner => (
                      <tr key={learner.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-800">
                          <span className="font-medium">{learner.name}</span>
                          <span className="ml-1 text-[10px] text-gray-400">#{learner.number}</span>
                        </td>
                        {activeWeekDays.map(day => {
                          const status = attendanceByDate[day.dateKey]?.[learner.id];
                          const letter = getStatusLetter(status);
                          return (
                            <td key={day.dateKey} className="px-2 py-2 text-center">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                                {letter}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Monthly View</h3>
                <span className="text-xs text-gray-500">Weeks 1–5 • Mon–Fri</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-800" rowSpan={2}>
                        Learner
                      </th>
                      {getMonthWeeks(selectedDate).map(week => (
                        <th
                          key={week.label}
                          colSpan={week.days.length}
                          className="px-2 py-2 text-center font-semibold text-gray-800 border-l border-gray-200"
                        >
                          {week.label.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {getMonthWeeks(selectedDate).flatMap(week =>
                        week.days.map(day => (
                          <th
                            key={`${week.label}-${day.dateKey}`}
                            className="px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-gray-800"
                          >
                            {day.label}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {learners.map(learner => (
                      <tr key={learner.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-800 whitespace-nowrap">
                          <span className="font-medium">{learner.name}</span>
                          <span className="ml-1 text-[10px] text-gray-400">#{learner.number}</span>
                        </td>
                        {getMonthWeeks(selectedDate).flatMap(week =>
                          week.days.map(day => {
                            const status = attendanceByDate[day.dateKey]?.[learner.id];
                            const letter = getStatusLetter(status);
                            return (
                              <td key={`${week.label}-${day.dateKey}-${learner.id}`} className="px-2 py-2 text-center">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                                  {letter}
                                </span>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
            >
              Save Attendance
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceView;
