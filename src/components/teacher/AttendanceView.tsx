import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherClasses, getUserClasses } from '@/lib/demoStore';
import { AttendanceByDate, loadAttendanceForClass, saveAttendanceForClass } from '@/lib/attendanceStore';

const LEARNERS_STORAGE_KEY = 'eduAttendanceLearnersByClass';

type Learner = { id: string; name: string; number: string };

function loadLearnersForClass(classId: string): Learner[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LEARNERS_STORAGE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, Learner[]>;
    return map[classId] || [];
  } catch {
    return [];
  }
}

function saveLearnersForClass(classId: string, learners: Learner[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LEARNERS_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, Learner[]>) : {};
    map[classId] = learners;
    window.localStorage.setItem(LEARNERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors in demo mode
  }
}

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

  useEffect(() => {
    if (!user) return;

    if (user.role === 'teacher') {
      setClasses(getTeacherClasses(user.id));
    } else {
      setClasses(getUserClasses(user.id, user.role));
    }
  }, [user]);

  // When a class is selected, load any saved learners for that class
  useEffect(() => {
    if (!selectedClass) {
      setLearners([]);
      setAttendance({});
      setAttendanceByDate({});
      setUploadStatus(null);
      setUploadedFileName(null);
      return;
    }

    const storedLearners = loadLearnersForClass(selectedClass);
    const storedAttendance = loadAttendanceForClass(selectedClass);
    setLearners(storedLearners);
    setAttendance({});
    setAttendanceByDate(storedAttendance || {});
    setUploadStatus(storedLearners.length ? 'saved' : null);
    setUploadedFileName(null);
  }, [selectedClass]);

  // Keep per-date attendance map in sync with the selected date
  useEffect(() => {
    const current = attendanceByDate[selectedDate] || {};
    setAttendance(current);
  }, [selectedDate, attendanceByDate]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClass) {
      alert('Please select a class before uploading learners.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result?.toString() || '';
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) return;

      // Assume the first row is a header: Student ID, Name, Surname
      const dataLines = lines.slice(1);

      const parsed = dataLines.map((line, index) => {
        const [idRaw, nameRaw, surnameRaw] = line.split(',');
        const id = (idRaw || '').trim() || String(index + 1);
        const firstName = (nameRaw || '').trim();
        const surname = (surnameRaw || '').trim();
        const fullName = [firstName, surname].filter(Boolean).join(' ') || `Learner ${index + 1}`;

        return {
          id,
          name: fullName,
          number: id
        };
      });

      if (parsed.length > 0) {
        setLearners(parsed);
        setAttendance({});
        saveLearnersForClass(selectedClass, parsed);
        setUploadedFileName(file.name);
        setUploadStatus('saved');
      }
    };

    reader.readAsText(file);
    // allow re-uploading the same file if needed
    event.target.value = '';
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

    setAttendanceByDate(prevByDate => {
      const currentForDate = prevByDate[selectedDate] || {};
      const updatedForDate = { ...currentForDate, ...attendance };
      const nextByDate = { ...prevByDate, [selectedDate]: updatedForDate };

      saveAttendanceForClass(selectedClass, nextByDate);
      console.log('Saving attendance register:', {
        selectedClass,
        selectedDate,
        attendanceByDate: nextByDate,
      });
      alert(`Attendance register for ${selectedDate} has been saved.`);

      return nextByDate;
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

    for (let w = 0; w < 4; w++) {
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Learners (CSV)</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Expected columns: Student ID, Student Name, Student Surname
            </p>
            {uploadStatus === 'saved' && (
              <p className="mt-1 text-xs text-green-600">
                {uploadedFileName ? `Saved from ${uploadedFileName}` : 'Learners list loaded for this class.'}
              </p>
            )}
          </div>
        </div>
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{bunkingCount}</p>
              <p className="text-sm text-red-800">Bunking</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{sickCount}</p>
              <p className="text-sm text-purple-700">Sick</p>
            </div>
          </div>

          {/* Attendance List / Summaries */}
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
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Learner</th>
                      {getWeekDays(selectedDate).map(day => (
                        <th key={day.dateKey} className="px-2 py-2 text-center font-medium text-gray-700">
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
                        {getWeekDays(selectedDate).map(day => {
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
            <div className="space-y-4">
              {getMonthWeeks(selectedDate).map(week => (
                <div key={week.label} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{week.label}</h3>
                    <span className="text-xs text-gray-500">Mon – Fri</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Learner</th>
                          {week.days.map(day => (
                            <th key={day.dateKey} className="px-2 py-2 text-center font-medium text-gray-700">
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
                            {week.days.map(day => {
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
              ))}
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
