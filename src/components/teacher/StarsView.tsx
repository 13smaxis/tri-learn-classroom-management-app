import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface StudentRecognition {
  learnerId: string;
  learnerNumber: string;
  fullName: string;
  attendanceRate: number;
  passRate: number;
  attendanceStars: number;
  homeworkStars: number;
  assignmentStars: number;
  totalStars: number;
}

interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  subject: string;
}

const CLASS_SELECTION_STORAGE_KEY = 'triLearn:selectedClassId';

const mapLearnersForRecognition = (data: any[]): StudentRecognition[] => {
  return (data || []).map((learner: any, index: number) => ({
    learnerId: learner.id || learner.userId || learner.learnerId || learner.enrollmentId,
    learnerNumber: learner.learnerNumber || String(index + 1),
    fullName: learner.fullName || learner.name || 'Learner',
    attendanceRate: 0,
    passRate: 0,
    attendanceStars: 0,
    homeworkStars: 0,
    assignmentStars: 0,
    totalStars: 0,
  }));
};

const StarsView: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentRecognition, setStudentRecognition] = useState<StudentRecognition[]>([]);
  const [loading, setLoading] = useState(false);
  const [awardingStars, setAwardingStars] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecognition | null>(null);
  const [starCategory, setStarCategory] = useState<'ATTENDANCE' | 'HOMEWORK' | 'ASSIGNMENT'>('ATTENDANCE');
  const [starNoteOpen, setStarNoteOpen] = useState(false);
  const [starNote, setStarNote] = useState('');

  // Load teacher's classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classes = await api.getMyClasses();
        setClasses(classes || []);
        const preferredClassId = localStorage.getItem(CLASS_SELECTION_STORAGE_KEY);
        if (preferredClassId && classes?.some((cls: SchoolClass) => cls.id === preferredClassId)) {
          setSelectedClassId(preferredClassId);
          localStorage.removeItem(CLASS_SELECTION_STORAGE_KEY);
        } else if (classes && classes.length > 0) {
          setSelectedClassId(classes[0].id);
        }
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };
    if (user?.role === 'teacher') {
      loadClasses();
    }
  }, [user?.role]);

  // Load student recognition data when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    
    const loadRecognition = async () => {
      setLoading(true);
      setSelectedStudent(null);
      try {
        const recognition = await api.getClassRecognition(selectedClassId).catch(() => []);

        const learners = await api.getLearners(selectedClassId)
          .catch(async () => {
            const fallback = await api.getClassStudents(selectedClassId);
            return (fallback || []).filter((student: any) => student.role === 'learner');
          });

        const baseLearners = mapLearnersForRecognition(learners || []);
        const recognitionByLearner = new Map(
          (recognition || []).map((item: StudentRecognition) => [item.learnerId, item])
        );

        const mergedLearners = baseLearners.map((learner) => {
          const learnerRecognition = recognitionByLearner.get(learner.learnerId);
          if (!learnerRecognition) return learner;

          return {
            ...learner,
            ...learnerRecognition,
            learnerId: learner.learnerId,
            learnerNumber: learner.learnerNumber || learnerRecognition.learnerNumber,
            fullName: learner.fullName || learnerRecognition.fullName,
          };
        });

        const mergedIds = new Set(mergedLearners.map((learner) => learner.learnerId));
        const recognitionOnly = (recognition || []).filter(
          (item: StudentRecognition) => !mergedIds.has(item.learnerId)
        );

        setStudentRecognition([...mergedLearners, ...recognitionOnly]);
      } catch (error) {
        console.error('Failed to load recognition data:', error);
        setStudentRecognition([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecognition();
  }, [selectedClassId]);

  const handleAwardStar = async () => {
    if (!selectedStudent) return;

    setAwardingStars(true);
    try {
      const payload = {
        learnerId: selectedStudent.learnerId,
        classId: selectedClassId,
        category: starCategory,
        starCount: 1,
        note: starNote,
      };

      await api.awardStar(payload);
      
      // Update the UI with new star count
      setStudentRecognition(prevRecognition =>
        prevRecognition.map(student =>
          student.learnerId === selectedStudent.learnerId
            ? {
                ...student,
                ...(starCategory === 'ATTENDANCE' && { attendanceStars: student.attendanceStars + 1 }),
                ...(starCategory === 'HOMEWORK' && { homeworkStars: student.homeworkStars + 1 }),
                ...(starCategory === 'ASSIGNMENT' && { assignmentStars: student.assignmentStars + 1 }),
                totalStars: student.totalStars + 1,
              }
            : student
        )
      );

      // Reset form
      setStarNote('');
      setStarNoteOpen(false);
      alert(`⭐ Star awarded to ${selectedStudent.fullName}!`);
    } catch (error: any) {
      console.error('Failed to award star:', error);
      alert(`Error: ${error.message || 'Failed to award star'}`);
    } finally {
      setAwardingStars(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return 'text-green-600 bg-green-50';
      case 'HOMEWORK':
        return 'text-blue-600 bg-blue-50';
      case 'ASSIGNMENT':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 75) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-20 select-none" aria-hidden="true">
        <div className="absolute top-8 left-10 text-2xl">📚</div>
        <div className="absolute top-20 right-16 text-xl">✏️</div>
        <div className="absolute top-40 left-1/3 text-2xl">🎓</div>
        <div className="absolute bottom-24 left-14 text-xl">🧠</div>
        <div className="absolute bottom-16 right-20 text-2xl">⭐</div>
      </div>
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 bg-white/90 backdrop-blur-sm rounded-b-lg shadow-sm relative z-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⭐ Recognition Center</h1>
        <p className="text-gray-600">Award stars to your students for outstanding performance</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 relative z-10">
        {/* Class selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select a class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.grade} - {cls.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading student data...</p>
            </div>
          </div>
        )}

        {/* Students grid */}
        {!loading && studentRecognition.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentRecognition.map((student) => (
              <div
                key={student.learnerId}
                onClick={() => setSelectedStudent(student)}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedStudent?.learnerId === student.learnerId
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Student name */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-800">{student.fullName}</h3>
                  <p className="text-sm text-gray-500">{student.learnerNumber}</p>
                </div>

                {/* Stats */}
                <div className="mb-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Attendance Rate:</span>
                    <span className={`font-bold ${getAttendanceColor(student.attendanceRate)}`}>
                      {(student.attendanceRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pass Rate:</span>
                    <span className={`font-bold ${getPassRateColor(student.passRate || 0)}`}>
                      {(student.passRate || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Stars display */}
                <div className="mb-4 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🎓 Attendance Stars:</span>
                    <div className="flex gap-1">
                      {[...Array(student.attendanceStars)].map((_, i) => (
                        <span key={i} className="text-lg">⭐</span>
                      ))}
                      {student.attendanceStars === 0 && <span className="text-gray-300">-</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">📝 Homework Stars:</span>
                    <div className="flex gap-1">
                      {[...Array(student.homeworkStars)].map((_, i) => (
                        <span key={i} className="text-lg">⭐</span>
                      ))}
                      {student.homeworkStars === 0 && <span className="text-gray-300">-</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">📊 Assignment Stars:</span>
                    <div className="flex gap-1">
                      {[...Array(student.assignmentStars)].map((_, i) => (
                        <span key={i} className="text-lg">⭐</span>
                      ))}
                      {student.assignmentStars === 0 && <span className="text-gray-300">-</span>}
                    </div>
                  </div>
                </div>

                {/* Total stars badge */}
                <div className="text-center py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600">Total Recognition</p>
                  <p className="text-2xl font-bold text-yellow-600">{student.totalStars} ⭐</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && studentRecognition.length === 0 && selectedClassId && (
          <div className="text-center py-12">
            <p className="text-gray-600">No students in this class yet.</p>
          </div>
        )}

        {!selectedClassId && (
          <div className="text-center py-12">
            <p className="text-gray-600">Select a class to view student recognition data.</p>
          </div>
        )}
      </div>

      {/* Award Star Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Award Star to {selectedStudent.fullName}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="space-y-2">
                {(['ATTENDANCE', 'HOMEWORK', 'ASSIGNMENT'] as const).map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={starCategory === category}
                      onChange={(e) => setStarCategory(e.target.value as typeof starCategory)}
                      className="mr-2"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                      {category === 'ATTENDANCE' && '🎓 Attendance'}
                      {category === 'HOMEWORK' && '📝 Homework'}
                      {category === 'ASSIGNMENT' && '📊 Assignment'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={starNoteOpen}
                  onChange={(e) => setStarNoteOpen(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Add a note (optional)</span>
              </label>
              {starNoteOpen && (
                <textarea
                  value={starNote}
                  onChange={(e) => setStarNote(e.target.value)}
                  placeholder="e.g., Excellent attendance this week!"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAwardStar}
                disabled={awardingStars}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {awardingStars ? 'Awarding...' : 'Award ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarsView;
