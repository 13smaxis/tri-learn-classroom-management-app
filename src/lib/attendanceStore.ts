export type AttendanceByDate = Record<string, Record<string, string>>;

const ATTENDANCE_STORAGE_KEY = 'eduAttendanceByClass';

function getStorageRoot(): Record<string, AttendanceByDate> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AttendanceByDate>;
  } catch {
    return {};
  }
}

function setStorageRoot(root: Record<string, AttendanceByDate>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(root));
  } catch {
    // ignore storage errors in demo mode
  }
}

export function loadAttendanceForClass(classId: string): AttendanceByDate {
  const root = getStorageRoot();
  return root[classId] || {};
}

export function saveAttendanceForClass(classId: string, data: AttendanceByDate): void {
  const root = getStorageRoot();
  root[classId] = data;
  setStorageRoot(root);
}

export function loadAllAttendance(): Record<string, AttendanceByDate> {
  return getStorageRoot();
}
