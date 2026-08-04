import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { api } from '@/lib/api';
import StudentUploadWidget, { ParsedLearner } from '@/components/shared/StudentUploadWidget';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type AttendanceByDate = Record<string, Record<string, string>>;

type LockedAttendanceByDate = Record<string, Record<string, boolean>>;                                          //-Tracks whether a learner's status is locked (saved) for each date.

type Learner = { id: string; name: string; number: string };
type CsvPreviewLearner = ParsedLearner & { isDuplicate: boolean };

const parseCsvRow = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
};

const normalizeFullName = (fullName: string): string =>
  fullName
    .trim()                                                                                                     //-Trim leading/trailing whitespace
    .replace(/\s+/g, ' ')                                                                                       //-Regex to collapse multiple spaces to single
    .toLowerCase();                                                                                             //-Normalize case for consistent duplicate detection

const sortParsedLearners = (items: ParsedLearner[]): ParsedLearner[] =>
  [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }));

const buildCsvPreviewLearners = (items: ParsedLearner[], existingNames: string[]): CsvPreviewLearner[] => {
  const existingSet = new Set(existingNames.map(normalizeFullName));
  const incomingCounts = new Map<string, number>();

  items.forEach((item) => {
    const normalized = normalizeFullName(item.fullName);
    if (!normalized) return;
    incomingCounts.set(normalized, (incomingCounts.get(normalized) || 0) + 1);
  });

  return items.map((item) => {
    const normalized = normalizeFullName(item.fullName);
    const isDuplicate =
      !normalized || existingSet.has(normalized) || (incomingCounts.get(normalized) || 0) > 1;

    return {
      ...item,
      isDuplicate,
    };
  });
};

const splitUniqueAndDuplicates = (items: ParsedLearner[], existingNames: string[]) => {
  const preview = buildCsvPreviewLearners(items, existingNames);
  const unique = preview.filter((item) => !item.isDuplicate).map(({ isDuplicate, ...rest }) => rest);
  const duplicates = preview.filter((item) => item.isDuplicate).map(({ isDuplicate, ...rest }) => rest);

  return { unique, duplicates };
};

const rebuildCsvPreview = (items: ParsedLearner[], existingNames: string[]) =>
  buildCsvPreviewLearners(sortParsedLearners(items), existingNames);

const CLASS_SELECTION_STORAGE_KEY = 'triLearn:selectedClassId';

const normalizeLearnerName = (learner: any) => {
  const firstName = learner.first_name || learner.firstName || '';
  const lastName = learner.last_name || learner.lastName || '';
  const nameFromParts = [firstName, lastName].filter(Boolean).join(' ');
  return nameFromParts || learner.fullName || learner.full_name || learner.name || 'Learner';
};

const normalizeLearnerNumber = (learner: any, index: number) => {
  return learner.student_number || learner.learnerNumber || learner.phone || String(index + 1);
};

const mapLearnersForAttendance = (data: any[]): Learner[] => {
  return (data || []).map((learner: any, index: number) => ({
    id: learner.id || learner.userId || learner.enrollmentId,
    name: normalizeLearnerName(learner),
    number: normalizeLearnerNumber(learner, index),
  }));
};

const resolveGradePrefix = (grade?: string): string => {
  if (!grade) return '00';
  const match = grade.match(/\d{1,2}/);
  if (!match) return '00';
  const number = Math.max(0, Math.min(99, Number.parseInt(match[0], 10)));
  return String(number).padStart(2, '0');
};

const buildUniqueSixDigitNumbers = (count: number, grade?: string): string[] => {
  const prefix = resolveGradePrefix(grade);
  const generated = new Set<string>();
  while (generated.size < count) {
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    generated.add(`${prefix}${suffix}`);
  }
  return Array.from(generated);
};

/**
 * Builds a lock map from saved attendance.
 * Any learner with a non-empty saved status becomes read-only.
 */
const buildLockedMapFromAttendance = (attendanceForDate: Record<string,
  string> = {}): Record<string,
    boolean> => {                                                                        //-Takes the attendance record for a specific date and creates a map indicating which learners have a saved status, thus should be locked from editing in the UI.
  return Object.entries(attendanceForDate).reduce<Record<string,
    boolean>>((acc, [learnerId, status]) => {                                                                   //-Iterate over each learner's attendance status for the date
      if (status) {
        acc[learnerId] = true;                                                                                    //-If status is non-empty, mark this learner as locked (true) in the map, no editing allowed
      }
      return acc;                                                                                               //-Return the accumulated lock map, where keys are learner IDs and values indicate if they are locked (true) or not (undefined/false)
    }, {});
};

/**
 * This block defines the main AttendanceView component for teachers to manage attendance. 
 * It handles class selection, date navigation, attendance marking, and learner uploads. 
 * The component maintains local state for classes, learners, attendance records, and UI states related to uploading and viewing modes. 
 * It interacts with the backend API to fetch and save data, while also providing a responsive and user-friendly interface for teachers to efficiently manage their classroom attendance.
 * @returns 
 */
const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const { forceRefreshKey } = useAppContext();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassMeta, setSelectedClassMeta] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewingMonthDate, setViewingMonthDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [learners, setLearners] = useState<Learner[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [attendanceByDate, setAttendanceByDate] = useState<AttendanceByDate>({});
  const [lockedAttendanceByDate, setLockedAttendanceByDate] = useState<LockedAttendanceByDate>({});             //-Stores per-date learner lock state after attendance is saved.
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadingStu, setUploadingStu] = useState(false);
  const [stuProgress, setStuProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<'csv' | 'manual'>('csv');
  const [csvParsedLearners, setCsvParsedLearners] = useState<CsvPreviewLearner[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [editingCsvIndex, setEditingCsvIndex] = useState<number | null>(null);
  const [editingCsvValue, setEditingCsvValue] = useState('');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [successOverlayMessage, setSuccessOverlayMessage] = useState<string | null>(null);                      //-Holds the temporary success message shown in the centered overlay.
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);                                          //-Controls the saving animation overlay while the save request is in progress.
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);
  const successOverlayTimeoutRef = useRef<number | null>(null);                                                 //-Stores the current auto-dismiss timer id for the success overlay.

  /**
   * Shows a temporary success overlay and resets the dismiss timer if needed.
   * If user performs multiple actions in quick succession, the timer is cleared and restarted to ensure the 
   *  overlay remains visible for the full duration after the last action.
   */
  const showSuccessOverlay = (message: string) => {
    setSuccessOverlayMessage(message);                                                                          //-Render the success overlay with the provided message.
    if (successOverlayTimeoutRef.current) {
      window.clearTimeout(successOverlayTimeoutRef.current);                                                    //-Prevent overlapping timers.
    }
    successOverlayTimeoutRef.current = window.setTimeout(() => {
      setSuccessOverlayMessage(null);                                                                           //-Hide overlay after the timeout.
      successOverlayTimeoutRef.current = null;                                                                  //-Clear stored timer id once completed.
    }, 1800);
  };

  const getWeekDays = (dateString: string) => {                                                                 //-Helper functions to calculate week and month dates (safe local time parsing)

    const [year, month, day] = dateString.split('-').map(Number);                                               //-Parse YYYY-MM-DD safely to avoid timezone issues
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();                                                                            //- 0 = Sun, 1 = Mon
    const diffToMonday = (dayOfWeek + 6) % 7;                                                                   //-Days since Monday

    const monday = new Date(year, month - 1, day - diffToMonday);

    const labels = ['M', 'T', 'W', 'T', 'F'];
    const days = [] as { label: string; dateKey: string }[];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = `
                        ${d.getFullYear()}-
                        ${String(d.getMonth() + 1).padStart(2, '0')}-
                        ${String(d.getDate()).padStart(2, '0')}
                      `;
      days.push({ label: labels[i], dateKey });
    }
    return days;
  };

  const getMonthWeeks = (dateString: string) => {                                                               //-Parse YYYY-MM-DD safely to avoid timezone issues

    const [year, month] = dateString.split('-').map(Number);
    const firstOfMonth = new Date(year, month - 1, 1);                                                          //-First day of month (local time)
    const firstDay = firstOfMonth.getDay();                                                                     //- 0=Sun
    const diffToMonday = (firstDay + 6) % 7;
    const firstMonday = new Date(year, month - 1, 1 - diffToMonday);

    const weeks: { label: string; days: { label: string; dateKey: string }[] }[] = [];
    const labels = ['M', 'T', 'W', 'T', 'F'];

    for (let w = 0; w < 5; w++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + w * 7);
      const days: { label: string; dateKey: string }[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateKey = `
                          ${d.getFullYear()}-
                          ${String(d.getMonth() + 1).padStart(2, '0')}-
                          ${String(d.getDate()).padStart(2, '0')}
                        `;
        days.push({ label: labels[i], dateKey });
      }
      weeks.push({ label: `Week ${w + 1}`, days });
    }

    return weeks;
  };

  useEffect(() => {
    if (!user) return;

    api.getMyClasses()
      .then(data => {
        const classList = data || [];
        setClasses(classList);

        const preferredClassId = localStorage.getItem(CLASS_SELECTION_STORAGE_KEY);
        if (preferredClassId && classList.some((cls: any) => cls.id === preferredClassId)) {
          setSelectedClass(preferredClassId);
          localStorage.removeItem(CLASS_SELECTION_STORAGE_KEY);
        }
      })
      .catch(err => {
        console.error('Failed to fetch classes:', err);
        setClasses([]);
      });

  }, [user, forceRefreshKey]);                                                                                  //-Fetch the list of classes for the logged-in teacher when the component mounts or when user/forceRefreshKey changes.

  useEffect(() => {                                                                                             //-When a class is selected, load any saved learners for that class
    if (!selectedClass) {
      setSelectedClassMeta(null);
      setLearners([]);
      setAttendance({});
      setAttendanceByDate({});
      setLockedAttendanceByDate({});
      setUploadStatus(null);
      setUploadedFileName(null);
      setShowUploadPanel(false);
      setCsvParsedLearners([]);
      setCsvFileName(null);
      setSelectedWeekIndex(null);
      return;
    }

    const fromList = classes.find((cls: any) => cls.id === selectedClass) || null;
    setSelectedClassMeta(fromList);

    api.getClass(selectedClass)
      .then((data) => setSelectedClassMeta(data))
      .catch((err) => {
        console.error('Failed to load selected class metadata:', err);
      });

    /**
     * Load learners for the selected class from backend
     * If you want to use the new /learners endpoint for all learners, replace below with api.getAllLearners()
     */
    api.getLearners(selectedClass)
      .then(data => {
        const mappedLearners = mapLearnersForAttendance(data);                                                  //-Map backend learner data to the format needed for attendance management.
        setLearners(mappedLearners);
        setUploadStatus(mappedLearners.length ? 'saved' : null);                                                //-If learners exist, mark as 'saved' to indicate attendance can be managed; if no learners, reset to null to prompt upload.
      })
      .catch(err => {
        console.warn('Attendance learners endpoint unavailable, falling back to class students:', err);
        api.getClassStudents(selectedClass)
          .then(data => {
            const mappedLearners = mapLearnersForAttendance(
              (data || []).filter((student: any) => student.role === 'learner')
            );
            setLearners(mappedLearners);
            setUploadStatus(mappedLearners.length ? 'saved' : null);
          })
          .catch(fallbackErr => {
            console.error('Failed to load learners from both attendance and class students endpoints:', fallbackErr);
            setLearners([]);
            setUploadStatus(null);
          });
      });


    /**
     * Loads attendance for the selected date
     * Note: This will load the attendance for the selected date every time a new class is selected.
     */
  }, [selectedClass, classes]);

  useEffect(() => {                                                                                             //-Keeps per-date attendance map in sync with the selected date
    if (!selectedClass || !selectedDate)                                                                        //-If no class or date is selected, clear attendance and skip loading.
      return;

    if (attendanceByDate[selectedDate])                                                                         //-Check if we already have this date loaded
    {
      setAttendance(attendanceByDate[selectedDate]);                                                            //-If attendance for the selected date is already cached in state, use it directly without making another API call.
      return;
    }

    // Load attendance for the new date from backend
    api.getAttendanceForDate(selectedClass, selectedDate)
      .then(data => {
        setAttendanceByDate(prev => ({ ...prev, [selectedDate]: data }));
        // Keep lock state in sync when switching to a new date.
        setLockedAttendanceByDate(prev => ({ ...prev, [selectedDate]: buildLockedMapFromAttendance(data) }));
        setAttendance(data);
      })
      .catch(err => {
        console.error('Failed to load attendance for date:', err);
        setAttendance({});
      });
  }, [selectedDate, selectedClass, attendanceByDate]);

  // Preload attendance data for daily/weekly/monthly views
  useEffect(() => {
    if (!selectedClass) return;

    const datesToLoad: string[] = [];

    if (viewMode === 'daily') {
      // For daily view, just load the selected date
      datesToLoad.push(selectedDate);
    } else if (viewMode === 'weekly') {
      const weekDays = getWeekDays(selectedDate);
      datesToLoad.push(...weekDays.map(d => d.dateKey));
    } else if (viewMode === 'monthly') {
      const monthWeeks = getMonthWeeks(viewingMonthDate);
      monthWeeks.forEach(week => {
        datesToLoad.push(...week.days.map(d => d.dateKey));
      });
    }

    if (datesToLoad.length === 0) return;

    // Load attendance for all dates concurrently (will skip if already cached in backend)
    const fetchPromises = datesToLoad.map(dateKey =>
      api.getAttendanceForDate(selectedClass, dateKey)
        .then(data => ({ [dateKey]: data }))
        .catch(() => ({ [dateKey]: {} }))
    );

    Promise.all(fetchPromises)
      .then(results => {
        const merged = Object.assign({}, ...results);
        setAttendanceByDate(prev => ({ ...prev, ...merged }));
        // Build lock maps for all preloaded dates so saved rows are read-only everywhere.
        const mergedLocked = Object.entries(merged).reduce<LockedAttendanceByDate>((acc, [dateKey, attendanceForDate]) => {
          acc[dateKey] = buildLockedMapFromAttendance((attendanceForDate || {}) as Record<string, string>);
          return acc;
        }, {});
        setLockedAttendanceByDate(prev => ({ ...prev, ...mergedLocked }));
        // For daily view, also update the attendance state with the loaded data
        if (viewMode === 'daily') {
          setAttendance(merged[selectedDate] || {});
        }
      })
      .catch(err => {
        console.error('Failed to preload attendance data:', err);
      });
  }, [viewMode, selectedClass, selectedDate, viewingMonthDate]);

  useEffect(() => {
    if (csvParsedLearners.length === 0) return;
    const refreshed = rebuildCsvPreview(
      csvParsedLearners.map(({ isDuplicate, ...rest }) => rest),
      learners.map((learner) => learner.name)
    );

    if (JSON.stringify(refreshed) !== JSON.stringify(csvParsedLearners)) {
      setCsvParsedLearners(refreshed);
    }
  }, [learners, csvParsedLearners]);

  /**
   * Clears the overlay timer on unmount to avoid state updates after component disposal.
   */
  useEffect(() => {
    return () => {
      if (successOverlayTimeoutRef.current) {
        window.clearTimeout(successOverlayTimeoutRef.current); // Cancel pending auto-dismiss timer.
      }
    };
  }, []);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {                                     //-Legacy handler kept for backward compat – unused now

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
      if (lines.length < 1) {
        alert('File is empty or has no data rows.');
        return;
      }
      const parsed: ParsedLearner[] = lines
        .map((line, idx) => {
          const [nameRaw, surnameRaw] = parseCsvRow(line);
          const firstName = (nameRaw || '').trim();
          const surname = (surnameRaw || '').trim();
          const fullName = [firstName, surname].filter(Boolean).join(' ').trim();
          if (!fullName) return null;
          return { learnerNumber: String(idx + 1), fullName };
        })
        .filter((learner): learner is ParsedLearner => Boolean(learner));

      if (parsed.length === 0) {
        alert('No valid learner names found. Expected CSV format: Name,Surname (no header).');
        return;
      }

      const sorted = sortParsedLearners(parsed);
      setCsvParsedLearners(rebuildCsvPreview(sorted, learners.map((learner) => learner.name)));
      setUploadMode('csv');
      setShowUploadPanel(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvConfirmUpload = () => {
    if (csvParsedLearners.length === 0) return;
    const uniqueLearners = csvParsedLearners
      .filter((learner) => !learner.isDuplicate)
      .map(({ isDuplicate, ...rest }) => rest);

    handleStudentsReady(uniqueLearners);
  };

  const handleManualPreview = (parsedLearners: ParsedLearner[]) => {
    if (parsedLearners.length === 0) return;
    const sorted = sortParsedLearners(parsedLearners);
    setCsvParsedLearners(rebuildCsvPreview(sorted, learners.map((learner) => learner.name)));
    setCsvFileName('Manual capture');
    setUploadMode('manual');
    setShowUploadPanel(true);
  };

  const handleCsvEditStart = (index: number) => {
    setEditingCsvIndex(index);
    setEditingCsvValue(csvParsedLearners[index]?.fullName || '');
  };

  const handleCsvEditSave = (index: number) => {
    const cleaned = editingCsvValue.trim().replace(/\s+/g, ' ');
    setEditingCsvIndex(null);
    setEditingCsvValue('');

    const baseItems = csvParsedLearners.map(({ isDuplicate, ...rest }) => rest);
    if (!cleaned) {
      const removed = baseItems.filter((_, i) => i !== index);
      setCsvParsedLearners(rebuildCsvPreview(removed, learners.map((learner) => learner.name)));
      return;
    }

    const updated = baseItems.map((item, i) => (i === index ? { ...item, fullName: cleaned } : item));
    setCsvParsedLearners(rebuildCsvPreview(updated, learners.map((learner) => learner.name)));
  };

  const handleCsvRemove = (index: number) => {
    const remaining = csvParsedLearners
      .filter((_, i) => i !== index)
      .map(({ isDuplicate, ...rest }) => rest);
    setCsvParsedLearners(rebuildCsvPreview(remaining, learners.map((learner) => learner.name)));
  };

  const handleStudentsReady = async (parsedLearners: ParsedLearner[]) => {
    if (!selectedClass) {
      alert('Please select a class before uploading learners.');
      return;
    }
    setUploadingStu(true);
    setStuProgress(0);

    const { unique } = splitUniqueAndDuplicates(parsedLearners, learners.map((learner) => learner.name));
    const finalLearnersToUpload = sortParsedLearners(unique);

    if (finalLearnersToUpload.length === 0) {
      setUploadingStu(false);
      setStuProgress(0);
      alert('No new unique learners to append.');
      return;
    }

    // Simulate progress for large uploads
    const interval = setInterval(() => {
      setStuProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const selectedClassInfo = classes.find((cls) => cls.id === selectedClass);
      const generatedNumbers = buildUniqueSixDigitNumbers(finalLearnersToUpload.length, selectedClassInfo?.grade);
      const payloadLearners = finalLearnersToUpload.map((learner, index) => {
        const parts = learner.fullName.trim().split(/\s+/);
        return {
          learnerNumber: generatedNumbers[index],
          fullName: learner.fullName,
          firstName: parts.shift() || '',
          lastName: parts.join(' '),
        };
      });

      await api.uploadLearners({
        classId: selectedClass,
        learners: payloadLearners,
      });

      const fullLearnerList = await api.getLearners(selectedClass);
      clearInterval(interval);
      setStuProgress(100);
      await new Promise(r => setTimeout(r, 400));

      const mappedLearners = (fullLearnerList || []).map((l: any, idx: number) => ({
        id: l.id,
        name: normalizeLearnerName(l),
        number: normalizeLearnerNumber(l, idx),
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
    // Prevent editing learners that already have a saved status for this date.
    if (lockedAttendanceByDate[selectedDate]?.[learnerId]) return;

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
    const lockedForDate = lockedAttendanceByDate[selectedDate] || {};                                           //-Only update learners that are still open (not yet locked/saved).
    const existingForDate = attendanceByDate[selectedDate] || {};
    const newAttendance: Record<string, string> = { ...existingForDate };

    learners.forEach((learner) => {
      if (lockedForDate[learner.id]) return;
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
    setIsSaveConfirmOpen(false);

    const currentForDate = attendanceByDate[selectedDate] || {};
    const updatedForDate = { ...currentForDate, ...attendance };

    setIsSavingAttendance(true);

    api.saveAttendance({                                                                                        //-Save attendance to backend
      classId: selectedClass,
      date: selectedDate,
      attendance: updatedForDate
    })
      .then(() => {
        setAttendanceByDate(prevByDate => ({                                                                    //-Updates the previous attendanceByDate with the new attendance for the selected date, ensuring the UI reflects the latest saved state without needing to refetch from backend
          ...prevByDate,                                                                                        //-Keep all previously loaded dates intact
          [selectedDate]: updatedForDate                                                                        //-Update the selected date with the new attendance data
        }));
        setLockedAttendanceByDate(prev => ({
          ...prev,
          // After save, lock all learners that now have a status.
          [selectedDate]: buildLockedMapFromAttendance(updatedForDate),
        }));
        setIsSavingAttendance(false);
        showSuccessOverlay('Attendance saved successfully');
      })
      .catch(err => {
        setIsSavingAttendance(false);
        console.error('Failed to save attendance:', err);
        alert('Failed to save attendance: ' + err.message);
      });
  };

  const openSaveConfirmation = () => {
    if (!selectedClass || isSavingAttendance) return;
    setIsSaveConfirmOpen(true);
  };

  const getVisibleDates = () => {                                                                               //-Calculate attendance counts based on current view
    if (viewMode === 'daily') {
      return [selectedDate];
    } else if (viewMode === 'weekly') {
      return getWeekDays(selectedDate).map(d => d.dateKey);
    } else if (viewMode === 'monthly') {
      const weeks = getMonthWeeks(viewingMonthDate);
      return weeks.flatMap(week => week.days.map(d => d.dateKey));
    }
    return [];
  };

  const getCountsForViewMode = () => {
    const visibleDates = getVisibleDates();
    const allStatuses: string[] = [];

    visibleDates.forEach(dateKey => {
      const dayAttendance = attendanceByDate[dateKey] || {};
      Object.values(dayAttendance).forEach(status => {
        if (status) allStatuses.push(status);
      });
    });

    return {
      present: allStatuses.filter(s => s === 'present').length,
      absent: allStatuses.filter(s => s === 'absent').length,
      late: allStatuses.filter(s => s === 'late').length,
      excused: allStatuses.filter(s => s === 'excused').length,
      bunking: allStatuses.filter(s => s === 'bunking').length,
      sick: allStatuses.filter(s => s === 'sick').length,
    };
  };

  const counts = getCountsForViewMode();
  const presentCount = counts.present;
  const absentCount = counts.absent;
  const lateCount = counts.late;
  const excusedCount = counts.excused;
  const bunkingCount = counts.bunking;
  const sickCount = counts.sick;
  const dashboardBgClass = viewMode === 'daily'
    ? 'bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/60'
    : viewMode === 'weekly'
      ? 'bg-gradient-to-br from-emerald-50/70 via-white to-cyan-50/60'
      : 'bg-gradient-to-br from-violet-50/70 via-white to-purple-50/60';

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

  // Update viewing month and select appropriate week when view mode changes
  useEffect(() => {
    if (viewMode === 'daily') return;

    setViewingMonthDate(selectedDate);

    // If switching to weekly view, find and select the week containing selectedDate
    if (viewMode === 'weekly') {
      const weeks = getMonthWeeks(selectedDate);
      const weekIndex = weeks.findIndex(week =>
        week.days.some(day => day.dateKey === selectedDate)
      );
      if (weekIndex !== -1) {
        setSelectedWeekIndex(weekIndex);
      } else {
        // Fallback: select first week
        setSelectedWeekIndex(0);
      }
    }
  }, [viewMode, selectedDate]);

  const activeWeekDays = getWeekDays(selectedDate);
  const monthWeeksForWeekly = getMonthWeeks(viewingMonthDate);
  const activeWeekDateKeys = new Set(activeWeekDays.map(d => d.dateKey));
  // Lock map for the currently selected date in daily view.
  const selectedDateLockedMap = lockedAttendanceByDate[selectedDate] || {};
  const lockedCountForSelectedDate = learners.filter((learner) => selectedDateLockedMap[learner.id]).length;
  const openCountForSelectedDate = Math.max(learners.length - lockedCountForSelectedDate, 0);
  const previewRows = csvParsedLearners.map((learner, index) => ({ ...learner, originalIndex: index }));
  const visiblePreviewRows = showDuplicatesOnly
    ? previewRows.filter((learner) => learner.isDuplicate)
    : previewRows;
  const selectedDateLabel = (() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  return (
    <div className= "space-y-6 rounded-2xl p-4 sm:p-6 transition-colors duration-300">
      <div className="
                        flex flex-col sm:flex-row 
                        sm:items-center sm:justify-between 
                        gap-4 rounded-xl border 
                        border-blue-100 
                        bg-gradient-to-r from-blue-50 via-white to-indigo-50 
                        p-4
                      "
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Register</h1>
          <p className="text-gray-500">Mark daily attendance for your classes</p>
        </div>
        {selectedClassMeta && (
          <div className="
                          text-xs text-slate-100 
                          bg-gradient-to-br from-slate-800 to-slate-900 border 
                          border-slate-700 
                          rounded-xl 
                          p-3 min-w-[240px]
                          "
          >
            <div><span className="font-semibold">Class:</span> {selectedClassMeta.name || 'N/A'}</div>
            <div><span className="font-semibold">Grade:</span> {selectedClassMeta.grade || 'N/A'}</div>
            <div><span className="font-semibold">Subject:</span> {selectedClassMeta.subject || 'N/A'}</div>
            <div><span className="font-semibold">Invite Code:</span> {selectedClassMeta.inviteToken || 'N/A'}</div>
          </div>
        )}
      </div>

      <div className="
                      rounded-xl 
                      border border-blue-100 
                      bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 
                      p-5
                    "
      >                                                                                                         {/* Filters */}
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
              Learners
              {learners.length > 0 &&
                <span className="text-green-600 font-normal">
                  ({learners.length} loaded)
                </span>}
            </label>

            <input ref={csvFileRef} type="file"
              accept=".csv"
              onChange={handleDirectCsvPick} className="hidden"
            />                                                                                                  {/* Hidden file input for CSV */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => selectedClass && csvFileRef.current?.click()}
                disabled={!selectedClass}
                className={`
                              flex items-center 
                              justify-center 
                              gap-2 px-4 py-3 
                              rounded-lg 
                              border text-sm font-semibold 
                              transition-all sm:flex-1 ${selectedClass
                    ? 'border-gray-300 text-blue-700 bg-blue-50 hover:border-blue-400 hover:bg-blue-100/50 cursor-pointer'
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  }
                `}
              >
                <span>📄</span> <span>Upload CSV</span>
              </button>
              <button
                type="button"
                onClick={() => { if (!selectedClass) return; setUploadMode('manual'); setShowUploadPanel(true); }}
                disabled={!selectedClass}
                className={`
                              flex items-center 
                              justify-center gap-2 px-4 py-3 
                              rounded-lg 
                              border text-sm font-semibold 
                              transition-all sm:flex-1 ${selectedClass
                    ? 'border-gray-300 text-blue-700 bg-blue-50 hover:border-blue-400 hover:bg-blue-100/50 cursor-pointer'
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  }
                `}
              >
                <span>✏️</span> <span>Capture</span>
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
        {showUploadPanel && csvParsedLearners.length > 0 && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-amber-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="
                              text-xs sm:text-sm font-medium 
                              text-gray-800">📄
                {csvFileName} — {csvParsedLearners.length}
                student(s) found
              </p>
              <div className="flex items-center gap-2">
                {csvParsedLearners.some((learner) => learner.isDuplicate) && (
                  <button
                    type="button"
                    onClick={() => setShowDuplicatesOnly((prev) => !prev)}
                    className="
                                rounded-full border border-amber-200 
                                px-2.5 py-1 text-[11px] 
                                font-medium 
                                text-amber-700 
                                hover:bg-amber-50
                              "
                  >
                    {showDuplicatesOnly ? 'Show all' : 'Show duplicates'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowUploadPanel(false); setCsvParsedLearners([]); setCsvFileName(null); }}
                  className="
                              w-6 h-6 
                              flex items-center justify-center 
                              text-gray-400 
                              hover:text-gray-600 
                              text-lg 
                              leading-none
                            "
                >
                  ✕
                </button>
              </div>
            </div>
            {csvParsedLearners.some((learner) => learner.isDuplicate) && (
              <div className="
                                mb-2 px-3 py-2 
                                rounded-md bg-amber-100 
                                border border-amber-400 
                                text-amber-900 text-xs font-semibold 
                                flex items-center gap-2
                              "
              >
                <span className="text-amber-500 text-base leading-none">⚠️</span>
                Duplicate names found. Edit or remove them to include; duplicates are skipped on upload.
              </div>
            )}
            <div className="rounded-lg border border-gray-200 overflow-x-auto">                               {/* Keep natural height so preview expands and pushes sections below down */}
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">#</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 whitespace-nowrap">Learner #</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Full Name</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visiblePreviewRows.map((l, i) => (
                    <tr key={l.originalIndex} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap text-[11px] sm:text-xs">Auto (6 digits)</td>
                      <td className="px-3 py-1.5 text-gray-900 font-medium">
                        {editingCsvIndex === l.originalIndex ? (
                          <input
                            type="text"
                            value={editingCsvValue}
                            onChange={(e) => setEditingCsvValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCsvEditSave(l.originalIndex);
                              if (e.key === 'Escape') { setEditingCsvIndex(null); setEditingCsvValue(''); }
                            }}
                            onBlur={() => handleCsvEditSave(l.originalIndex)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs sm:text-sm"
                            autoFocus
                          />
                        ) : (
                          l.fullName
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {l.isDuplicate ? (
                          <span className="text-[11px] font-medium text-amber-700">Duplicate please amend</span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700">OK</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => (editingCsvIndex === l.originalIndex ? handleCsvEditSave(l.originalIndex) : handleCsvEditStart(l.originalIndex))}
                            className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1 text-gray-600 hover:text-blue-600 hover:border-blue-200"
                            aria-label={editingCsvIndex === l.originalIndex ? 'Save edit' : 'Edit name'}
                          >
                            {editingCsvIndex === l.originalIndex ? (
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.778 7.778a1 1 0 01-.707.293H5.5a.5.5 0 01-.5-.5v-2.72a1 1 0 01.293-.707l7.778-7.778a1 1 0 011.414 0l2.919 2.92zM5.5 13.793V13l7.071-7.071.793.793L6.293 13.5H5.5z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.193 9.193a1 1 0 01-.414.26l-3.5 1a1 1 0 01-1.25-1.25l1-3.5a1 1 0 01.26-.414l9.269-9.117z" />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCsvRemove(l.originalIndex)}
                            className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1 text-gray-600 hover:text-red-600 hover:border-red-200"
                            aria-label="Remove row"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 2a1 1 0 00-.894.553L6.382 4H3a1 1 0 000 2h.293l.853 10.237A2 2 0 006.139 18h7.722a2 2 0 001.993-1.763L16.707 6H17a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0012.999 2H8zm2 6a1 1 0 10-2 0v6a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
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
                  disabled={csvParsedLearners.every((learner) => learner.isDuplicate)}
                  className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all whitespace-nowrap"
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
              onLearnersReady={handleManualPreview}
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${viewMode === mode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {mode === 'daily' ? 'Daily' : mode === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        {viewMode === 'weekly' && (
          <div className="mt-4 flex items-end gap-0 border-b border-gray-300 overflow-x-auto">
            {monthWeeksForWeekly.map((week, index) => {
              const isSelected = selectedWeekIndex === index;
              const rangeLabel = `${week.days[0]?.dateKey.slice(5)} – ${week.days[4]?.dateKey.slice(5)}`;
              return (
                <button
                  key={week.label}
                  type="button"
                  onClick={() => {
                    // Set selected week index and date to Monday of the selected week
                    setSelectedWeekIndex(index);
                    setSelectedDate(week.days[0]?.dateKey || selectedDate);
                  }}
                  className={`
                    relative px-4 py-2 text-xs font-semibold transition-all
                    rounded-t-md border border-b-0 whitespace-nowrap
                    ${isSelected
                      ? 'bg-white text-blue-700 border-gray-300 z-10 -mb-px shadow-[0_-1px_3px_rgba(0,0,0,0.06)]'
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                  title={rangeLabel}
                >
                  <span className="block leading-tight">{`Week ${index + 1}`}</span>
                  <span className={`
                                      block text-[10px] 
                                      font-normal 
                                      leading-tight mt-0.5 
                                      ${isSelected ? 'text-blue-500' : 'text-gray-400'}
                                  `}
                  >
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
            <div className={`
                              rounded-xl p-4 
                              text-center 
                              border transition-all 
                              ${presentCount > 0 ? 'bg-gradient-to-br from-green-100 to-green-50 border-green-300' : 'bg-green-50 border-green-200'}
                          `}
            >
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-green-700">Present</p>
            </div>
            <div className={`rounded-xl p-4 text-center border transition-all ${absentCount > 0 ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-300' : 'bg-red-50 border-red-200'}`}>
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-red-700">Absent</p>
            </div>
            <div className={`rounded-xl p-4 text-center border transition-all ${lateCount > 0 ? 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300' : 'bg-orange-50 border-orange-200'}`}>
              <p className="text-3xl font-bold text-orange-600">{lateCount}</p>
              <p className="text-sm text-orange-700">Late</p>
            </div>
            <div className={`rounded-xl p-4 text-center border transition-all ${excusedCount > 0 ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300' : 'bg-blue-50 border-blue-200'}`}>
              <p className="text-3xl font-bold text-blue-600">{excusedCount}</p>
              <p className="text-sm text-blue-700">Excused</p>
            </div>
            <div className={`rounded-xl p-4 text-center border transition-all ${bunkingCount > 0 ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-400' : 'bg-red-50 border-red-300'}`}>
              <p className="text-3xl font-bold text-red-700">{bunkingCount}</p>
              <p className="text-sm text-red-800">Bunking</p>
            </div>
            <div className={`rounded-xl p-4 text-center border transition-all ${sickCount > 0 ? 'bg-gradient-to-br from-purple-100 to-purple-50 border-purple-300' : 'bg-purple-50 border-purple-200'}`}>
              <p className="text-3xl font-bold text-purple-600">{sickCount}</p>
              <p className="text-sm text-purple-700">Sick</p>
            </div>
          </div>

          {viewMode === 'daily' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Learners ({learners.length})</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Locked: {lockedCountForSelectedDate} • Open: {openCountForSelectedDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllPresent}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={openSaveConfirmation}
                    disabled={isSavingAttendance}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${isSavingAttendance
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {isSavingAttendance ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {learners.map((learner) => {
                  // This learner is read-only when true.
                  const isLocked = Boolean(selectedDateLockedMap[learner.id]);
                  return (
                    <div key={learner.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {learner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{learner.name}</p>
                          <p className="text-sm text-gray-500">
                            #{learner.number}
                            {isLocked ? <span className="ml-2 text-[11px] font-medium text-blue-600">Saved</span> : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {['present', 'absent', 'late', 'excused', 'bunking', 'sick'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleAttendanceChange(learner.id, status)}
                            disabled={isLocked}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${attendance[learner.id] === status
                              ? status === 'present' ? 'bg-green-500 text-white' :
                                status === 'absent' ? 'bg-red-500 text-white' :
                                  status === 'late' ? 'bg-orange-500 text-white' :
                                    status === 'bunking' ? 'bg-red-700 text-white' :
                                      status === 'sick' ? 'bg-purple-500 text-white' :
                                        'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              } ${isLocked ? 'cursor-not-allowed opacity-75 hover:bg-inherit' : ''}`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
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
                              <span className="
                                                inline-flex 
                                                h-6 w-6 items-center 
                                                justify-center rounded-full 
                                                text-[11px] font-semibold 
                                                bg-gray-100 text-gray-700
                                              "
                              >
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
                      {getMonthWeeks(viewingMonthDate).map(week => (
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
                      {getMonthWeeks(viewingMonthDate).flatMap(week =>
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
                        {getMonthWeeks(viewingMonthDate).flatMap(week =>
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

        </>
      )}

      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[520px] rounded-2xl border border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm attendance submission</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to finalize attendance for this class. Saved records are locked and can’t be edited afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Class</span>
              <span className="font-medium text-foreground">{selectedClassMeta?.name || 'Selected class'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">{selectedDateLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Learners locked</span>
              <span className="font-medium text-foreground">{lockedCountForSelectedDate}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Learners open</span>
              <span className="font-medium text-foreground">{openCountForSelectedDate}</span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Review entries</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={isSavingAttendance}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isSavingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mx-auto relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full border-4 border-primary/20" />
              <span className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-foreground">Saving attendance...</p>
          </div>
        </div>
      )}

      {/* Show centered success feedback only when a success message exists. */}
      {successOverlayMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mx-auto relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full border-4 border-primary/20" />
              {/* Animated ring to indicate successful completion. */}
              <span className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-foreground">{successOverlayMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
