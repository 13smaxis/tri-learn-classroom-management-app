export type DemoRole = 'teacher' | 'parent' | 'learner';

export interface DemoUser {
  id: string;
  title?: string;
  // For teachers, their primary grade (e.g. "10")
  teacherGrade?: string;
  email?: string;
  fullName: string;
  role: DemoRole;
  password: string;
  // For teachers, this is the single invite code
  // that parents and learners will use across all classes
  teacherInviteCode?: string;
}

export interface DemoEnrollment {
  userId: string;
  role: DemoRole | 'parent' | 'learner';
  linkedLearnerId?: string;
}

export interface DemoClass {
  id: string;
  name: string;
  grade: string;
  subject: string;
  academicYear: string;
  teacherId: string;
  teacherName: string;
  enabledTools: string[];
  enrollments: DemoEnrollment[];
}

const USERS_KEY = 'eduDemoUsers';
const CLASSES_KEY = 'eduDemoClasses';
const TASKS_KEY = 'eduDemoTasks';

export interface DemoTask {
  id: string;
  teacherId: string;
  title: string;
  dueDate: string; // ISO date string
}

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadDemoUsers(): DemoUser[] {
  return loadFromStorage<DemoUser>(USERS_KEY);
}

export function saveDemoUsers(users: DemoUser[]): void {
  saveToStorage<DemoUser>(USERS_KEY, users);
}

export function addDemoUser(user: DemoUser): void {
  const users = loadDemoUsers();
  users.push(user);
  saveDemoUsers(users);
}

export function updateDemoUser(id: string, updates: Partial<DemoUser>): DemoUser | null {
  const users = loadDemoUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  saveDemoUsers(users);
  return users[index];
}

export function findUserByEmail(email: string): DemoUser | undefined {
  return loadDemoUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
}

export function loadDemoClasses(): DemoClass[] {
  return loadFromStorage<DemoClass>(CLASSES_KEY);
}

export function saveDemoClasses(classes: DemoClass[]): void {
  saveToStorage<DemoClass>(CLASSES_KEY, classes);
}

export function createDemoClass(input: Omit<DemoClass, 'id' | 'enrollments'>): DemoClass {
  const classes = loadDemoClasses();
  const newClass: DemoClass = {
    ...input,
    id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    enrollments: []
  };
  classes.push(newClass);
  saveDemoClasses(classes);
  return newClass;
}

export function getTeacherClasses(teacherId: string): DemoClass[] {
  return loadDemoClasses().filter(c => c.teacherId === teacherId);
}

export function getUserClasses(userId: string, role: DemoRole | 'parent' | 'learner'): DemoClass[] {
  const classes = loadDemoClasses();
  return classes.filter(c =>
    c.enrollments?.some(e => e.userId === userId && e.role === role)
  );
}
export function joinDemoClass(classId: string, enrollment: DemoEnrollment): boolean {
  const classes = loadDemoClasses();
  const idx = classes.findIndex(c => c.id === classId);
  if (idx === -1) return false;
  classes[idx].enrollments.push(enrollment);
  saveDemoClasses(classes);
  return true;
}

export function loadDemoTasks(): DemoTask[] {
  return loadFromStorage<DemoTask>(TASKS_KEY);
}

export function saveDemoTasks(tasks: DemoTask[]): void {
  saveToStorage<DemoTask>(TASKS_KEY, tasks);
}

export function addDemoTask(task: Omit<DemoTask, 'id'>): DemoTask {
  const tasks = loadDemoTasks();
  const newTask: DemoTask = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  };
  tasks.push(newTask);
  saveDemoTasks(tasks);
  return newTask;
}

export function getTeacherTasks(teacherId: string): DemoTask[] {
  return loadDemoTasks().filter(t => t.teacherId === teacherId);
}
