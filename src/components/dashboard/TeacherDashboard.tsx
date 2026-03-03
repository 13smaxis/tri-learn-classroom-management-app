import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { api } from '@/lib/api';
import StatsCard from '@/components/ui/StatsCard';
import CreateClassModal from '@/components/teacher/CreateClassModal';
// Drag-and-drop support
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import DndFix from '@/components/ui/DndFix';

interface TeacherDashboardProps {
  onViewChange: (view: string) => void;
  classesVersion?: number;
}

const CLASS_SELECTION_STORAGE_KEY = 'triLearn:selectedClassId';

const quickActions = [
  { label: 'Take Attendance', icon: '📋', view: 'attendance', color: 'bg-blue-500' },
  { label: 'Add Homework', icon: '📚', view: 'homework', color: 'bg-green-500' },
  { label: 'Create Assignment', icon: '📝', view: 'assignments', color: 'bg-purple-500' },
  { label: 'Capture Marks', icon: '📊', view: 'marks', color: 'bg-orange-500' },
  { label: 'Recognition', icon: '⭐', view: 'stars', color: 'bg-amber-500' },
  { label: 'Send Message', icon: '💬', view: 'messages', color: 'bg-pink-500' },
  { label: 'View Reports', icon: '📈', view: 'reports', color: 'bg-indigo-500' }
];

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onViewChange, classesVersion }) => {
  const { user } = useAuth();
  const { forceRefreshKey, forceGlobalRefresh } = useAppContext();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tasks, setTasks] = useState<{ id: string; title: string; dueDate: string }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState(0);
  // Homework counts fetched from backend
  const [totalHomeworkCount, setTotalHomeworkCount] = useState(0);
  const [homeworkCounts, setHomeworkCounts] = useState<Record<string, number>>({});
  const [totalLearners, setTotalLearners] = useState(0);
  const [classCounts, setClassCounts] = useState<Record<string, { learners: number; parents: number }>>({});
  const [openClassMenuId, setOpenClassMenuId] = useState<string | null>(null);

  // State for quick actions to allow reordering
  const [quickActionsState, setQuickActionsState] = useState(quickActions);

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchTasks();
      fetchHomeworkCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, classesVersion, forceRefreshKey]);

  const fetchHomeworkCount = async () => {
    try {
      const count = await api.getHomeworkCount();
      setTotalHomeworkCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.warn('Failed to fetch homework count:', err);
    }
  };

  const fetchClasses = async () => {
    if (!user) return;
    try {
      const data = await api.getMyClasses();
      const classList = data || [];
      setClasses(classList);

      const countsEntries = await Promise.all(
        classList.map(async (cls: any) => {
          const learners = await api.getLearners(cls.id)
            .then((rows) => rows?.length || 0)
            .catch(() => 0);

          const parents = await api.getClassStudents(cls.id)
            .then((rows) => (rows || []).filter((row: any) => row.role === 'parent').length)
            .catch(() => cls.enrollments?.filter((e: any) => e.role === 'parent').length || 0);

          const hwCount = await api.getHomeworkCountForClass(cls.id).catch(() => 0);

          return [cls.id, { learners, parents, homework: hwCount }] as const;
        })
      );

      const nextClassCounts: Record<string, { learners: number; parents: number }> = {};
      const nextHomeworkCounts: Record<string, number> = {};
      for (const [id, counts] of countsEntries) {
        nextClassCounts[id] = { learners: counts.learners, parents: counts.parents };
        nextHomeworkCounts[id] = typeof counts.homework === 'number' ? counts.homework : 0;
      }
      setClassCounts(nextClassCounts);
      setHomeworkCounts(nextHomeworkCounts);
      setTotalLearners(Object.values(nextClassCounts).reduce((sum, item) => sum + item.learners, 0));
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setClasses([]);
      setTotalLearners(0);
      setClassCounts({});
    }
    setAttendanceRecords(0); // TODO: fetch from backend
    setLoading(false);
  };

  const fetchTasks = () => {
    if (!user) return;
    // TODO: fetch tasks from backend
    setTasks([]);
  };

  const totalParents = Object.values(classCounts).reduce((acc, item) => acc + item.parents, 0);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle || !newTaskDueDate) return;

    // TODO: save task to backend
    const newTask = { id: `task-${Date.now()}`, title: newTaskTitle, dueDate: newTaskDueDate };
    setTasks(prev => [...prev, newTask]);

    setNewTaskTitle('');
    setNewTaskDueDate('');
    fetchTasks();
  };

  const handleClassAction = (classId: string, view: string) => {
    try {
      localStorage.setItem(CLASS_SELECTION_STORAGE_KEY, classId);
    } catch {
      // ignore storage failures and continue navigation
    }
    setOpenClassMenuId(null);
    onViewChange(view);
  };

  /**
   * Handler for drag end event
   * @param result 
   * @returns 
   */
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.type === 'quick-actions') {
      const reordered = Array.from(quickActionsState);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setQuickActionsState(reordered);
      return;
    }
    // Default: classes
    const reordered = Array.from(classes);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setClasses(reordered);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-blue-100 mt-2">Here's what's happening in your classes today</p>
          </div>
        </div>
      </div>

      <div className="grid grid-flow-col auto-cols-fr gap-4">                                                   {/* Stats Grid */}
        <StatsCard
          title="Total Classes"
          value={classes.length}
          subtitle="Active classes"
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 
                       4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
        <StatsCard
          title="Total Learners"
          value={totalLearners}
          subtitle="Across all classes"
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 
                        7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Connected Parents"
          value={totalParents}
          subtitle="Engaged families"
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 
                    20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 
                    0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Attendance Records"
          value={attendanceRecords}
          subtitle="Saved register entries (demo)"
          color="orange"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18M8 5v2m4-2v2m4-2v2M8 10v2m4-2v2m4-2v2M8 15v2m4-2v2m4-2v2"
              />
            </svg>
          }
        />
        <StatsCard
          title="Homework Assigned"
          value={totalHomeworkCount}
          subtitle="Total assigned across classes"
          color="red"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div
          className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {quickActionsState.map((action) => (
            <button
              key={action.view}
              onClick={() => onViewChange(action.view)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all min-w-0"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-2xl`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 text-center break-words">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
          <button
            onClick={() => onViewChange('classes')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        {/* Draggable class cards grid */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="class-cards" direction="horizontal">
            {(provided) => (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {classes.map((cls, idx) => {
                  // Use backend/state counts for all counters
                  const learnerCount = classCounts[cls.id]?.learners ?? cls.enrollments?.filter((e: any) => e.role === 'learner').length ?? 0;
                  const parentCount = classCounts[cls.id]?.parents ?? cls.enrollments?.filter((e: any) => e.role === 'parent').length ?? 0;
                  // Hook homeworkAssigned to state
                  const homeworkCount = homeworkCounts[cls.id] || 0;
                  // Hook assignmentsAssigned and starsAwarded to backend or demo
                  const assignmentsAssigned = cls.assignmentsAssigned ?? 0;
                  const starsAwarded = cls.starsAwarded ?? 0;

                  // Gradient color palette
                  const gradients = [
                    'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500',
                    'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
                    'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600',
                    'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
                    'bg-gradient-to-r from-teal-400 via-green-500 to-lime-500',
                    'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500',
                    'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500',
                    'bg-gradient-to-r from-orange-400 via-red-500 to-pink-500',
                    'bg-gradient-to-r from-lime-400 via-green-500 to-teal-500',
                  ];

                  return (
                    <Draggable key={cls.id} draggableId={cls.id} index={idx}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`relative rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer ${gradients[idx % gradients.length]} text-white ${dragSnapshot.isDragging ? 'ring-2 ring-blue-400' : ''}`}
                          onClick={() => onViewChange('classes')}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{cls.name}</h3>
                              <p className="text-sm opacity-80">{cls.grade} • {cls.subject}</p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Active
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            {/* Learners */}
                            <div className="flex items-center gap-1">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {learnerCount} Learners
                            </div>
                            {/* Parents */}
                            <div className="flex items-center gap-1">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {parentCount} Parents
                            </div>
                            {/* Homework Assigned */}
                            <div className="flex items-center gap-1">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {homeworkCount} Homework
                            </div>
                            {/* Assignments Assigned */}
                            <div className="flex items-center gap-1">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              {assignmentsAssigned} Assignments
                            </div>
                            {/* Stars Awarded */}
                            <div className="flex items-center gap-1">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.75L18.19 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.45 4.73L5.81 21z" />
                              </svg>
                              {starsAwarded} Stars
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            {/* View Class button navigates to My Classes and opens selected class in main viewport */}
                            <button
                              className="
                                  flex-1 py-2 text-sm font-medium 
                                  bg-white bg-opacity-20 
                                  rounded-lg hover:bg-opacity-30 
                                  transition-all 
                                  text-white
                                "
                              onClick={() => {
                                // Save selected class to AppLayout state via localStorage
                                localStorage.setItem(CLASS_SELECTION_STORAGE_KEY, cls.id);
                                // Switch to 'classes' view
                                onViewChange('classes');
                                // Note: AppLayout should read CLASS_SELECTION_STORAGE_KEY and set selectedClass
                              }}
                            >
                              View Class
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenClassMenuId((prev) => (prev === cls.id ? null : cls.id));
                              }}
                              className="
                                  px-3 py-2 
                                text-white 
                                hover:text-gray-200 hover:bg-white hover:bg-opacity-20 
                                  rounded-lg 
                                  transition-all
                               "
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 
                                      110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" 
                                />
                              </svg>
                            </button>
                          </div>

                          {openClassMenuId === cls.id && (
                            <div
                              className="
                                          absolute right-5 bottom-16 z-20 w-52 
                                          rounded-lg 
                                          border border-gray-200 
                                          bg-white 
                                          shadow-lg py-1
                                        "
                              onClick={(event) => event.stopPropagation()}
                            >
                              {quickActions.map((action) => (
                                <button
                                  key={`${cls.id}-${action.view}`}
                                  onClick={() => handleClassAction(cls.id, action.view)}
                                  className="
                                              w-full flex 
                                              items-center 
                                              gap-2 px-3 py-2
                                              text-sm text-gray-700 
                                              hover:bg-gray-50 
                                              text-left
                                            "
                                >
                                  <span>{action.icon}</span>
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">                                                   {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">                                    {/* Upcoming Tasks */}
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
          <form onSubmit={handleAddTask} className="space-y-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="
                            flex-1 rounded-lg 
                            border border-gray-300 
                            px-3 py-2 
                            text-sm 
                            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40
                          "
                placeholder="e.g. Mark Grade 10A homework"
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="
                            w-full sm:w-40 rounded-lg 
                            border border-gray-300 
                            px-3 py-2 
                            text-sm 
                            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40
                          "
              />
              <button
                type="submit"
                className="
                            w-full sm:w-auto 
                            px-4 py-2 
                            rounded-lg 
                            bg-blue-600 
                            text-white text-sm font-medium 
                            hover:bg-blue-700 
                            transition-all 
                            disabled:opacity-50
                          "
                disabled={!newTaskTitle || !newTaskDueDate}
              >
                Add Task
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                No upcoming tasks yet. Add your first task above.
              </p>
            ) : (
              tasks
                .slice()
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{task.title}</span>
                    <span className="text-xs text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* At-Risk Learners */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">                                    {/* At-Risk Learners */}
          <h3 className="font-semibold text-gray-900 mb-4">At-Risk Learners</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center py-4">
              No performance data yet. Once marks are captured, learners who
              need support will be highlighted here.
            </p>
          </div>
        </div>
      </div>

      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onClassCreated={() => {
          fetchClasses();
          forceGlobalRefresh();
        }}
      />
    </div>
  );
};

export default TeacherDashboard;
