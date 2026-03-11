import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type SchoolClass = {
  id?: string;
  classId?: string;
  name?: string;
  grade?: string;
  subject?: string;
};

type Learner = {
  id: string;
  learnerNumber?: string;
  fullName: string;
};

type HomeworkItem = {
  id: string;
  title?: string;
};

type HomeworkDetail = {
  learnerRows: {
    learnerId: string;
    mark: number | null;
  }[];
};

type MarkMatrix = Record<string, Record<string, string>>;

const getClassId = (cls: SchoolClass) => cls.id || cls.classId || '';

const MarksView: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [learners, setLearners] = useState<Learner[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [marks, setMarks] = useState<MarkMatrix>({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setError('');
      try {
        const nextClasses = (await api.getMyClasses()) || [];
        setClasses(nextClasses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load classes');
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setLearners([]);
      setHomeworks([]);
      setMarks({});
      return;
    }

    const loadClassData = async () => {
      setLoadingData(true);
      setError('');

      try {
        const [classLearners, classHomeworks] = await Promise.all([
          api.getLearners(selectedClass),
          api.getHomeworkList(selectedClass),
        ]);

        const nextLearners: Learner[] = (classLearners || []).map((learner: any) => ({
          id: learner.id,
          learnerNumber: learner.learnerNumber,
          fullName: learner.fullName || learner.name || 'Unknown learner',
        }));

        const nextHomeworks: HomeworkItem[] = classHomeworks || [];
        const details = await Promise.all(
          nextHomeworks.map((homework) => api.getHomeworkDetail(homework.id) as Promise<HomeworkDetail>)
        );

        const nextMarks: MarkMatrix = {};
        nextLearners.forEach((learner) => {
          nextMarks[learner.id] = {};
          nextHomeworks.forEach((homework) => {
            nextMarks[learner.id][homework.id] = '';
          });
        });

        details.forEach((detail, index) => {
          const homeworkId = nextHomeworks[index]?.id;
          if (!homeworkId) return;

          detail.learnerRows.forEach((row) => {
            if (!nextMarks[row.learnerId]) {
              nextMarks[row.learnerId] = {};
            }
            nextMarks[row.learnerId][homeworkId] = row.mark != null ? String(row.mark) : '';
          });
        });

        setLearners(nextLearners);
        setHomeworks(nextHomeworks);
        setMarks(nextMarks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load marks data');
      } finally {
        setLoadingData(false);
      }
    };

    loadClassData();
  }, [selectedClass]);

  const perHomeworkWeight = homeworks.length > 0 ? Number((100 / homeworks.length).toFixed(2)) : 0;

  const homeworkColumns = useMemo(
    () => homeworks.map((homework, index) => ({
      ...homework,
      label: `Homework ${index + 1}`,
    })),
    [homeworks]
  );

  const calculateFinalMark = (learnerId: string): number => {
    if (!homeworkColumns.length) return 0;

    const total = homeworkColumns.reduce((sum, homework) => {
      const raw = marks[learnerId]?.[homework.id] || '';
      const mark = raw === '' ? 0 : Number.parseFloat(raw);
      return sum + ((mark || 0) * perHomeworkWeight) / 100;
    }, 0);

    return Math.round(total);
  };

  const getGradeColor = (mark: number): string => {
    if (mark >= 80) return 'text-green-600 bg-green-50';
    if (mark >= 70) return 'text-blue-600 bg-blue-50';
    if (mark >= 60) return 'text-yellow-600 bg-yellow-50';
    if (mark >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSymbol = (mark: number): string => {
    if (mark >= 80) return 'A';
    if (mark >= 70) return 'B';
    if (mark >= 60) return 'C';
    if (mark >= 50) return 'D';
    if (mark >= 40) return 'E';
    if (mark >= 30) return 'F';
    return 'G';
  };

  const passCount = learners.filter((learner) => calculateFinalMark(learner.id) >= 50).length;
  const passRate = learners.length ? Math.round((passCount / learners.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark Capture</h1>
          <p className="text-gray-500">View learner homework grades from the backend</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loadingClasses}
          className="w-full sm:w-80 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
        >
          <option value="">Choose a class</option>
          {classes.map((cls) => {
            const id = getClassId(cls);
            const name = cls.name || `${cls.grade || ''} ${cls.subject || ''}`.trim() || 'Unnamed class';
            return (
              <option key={id} value={id}>{name}</option>
            );
          })}
        </select>
      </div>

      {selectedClass && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Mark Weighting</h3>
            {homeworkColumns.length === 0 ? (
              <p className="text-sm text-blue-800">No homework found for this class yet.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {homeworkColumns.map((homework) => (
                  <div key={homework.id} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-sm text-blue-800">{homework.label}: {perHomeworkWeight}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Class Pass Rate</h3>
              <span className={`text-2xl font-bold ${passRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                {passRate}%
              </span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${passRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${passRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{passCount} passing</span>
              <span>{Math.max(learners.length - passCount, 0)} failing</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Learner</th>
                    {homeworkColumns.map((homework) => (
                      <th key={homework.id} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        {homework.label}
                        <span className="block text-xs font-normal text-gray-500">{homework.title || '-'}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Final</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Symbol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingData ? (
                    <tr>
                      <td colSpan={homeworkColumns.length + 3} className="px-4 py-8 text-center text-sm text-gray-500">
                        Loading learners and homework...
                      </td>
                    </tr>
                  ) : learners.length === 0 ? (
                    <tr>
                      <td colSpan={homeworkColumns.length + 3} className="px-4 py-8 text-center text-sm text-gray-500">
                        No learners found for this class.
                      </td>
                    </tr>
                  ) : (
                    learners.map((learner) => {
                      const finalMark = calculateFinalMark(learner.id);
                      return (
                        <tr key={learner.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                                {learner.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{learner.fullName}</p>
                                <p className="text-xs text-gray-500">{learner.learnerNumber || '-'}</p>
                              </div>
                            </div>
                          </td>
                          {homeworkColumns.map((homework) => (
                            <td key={homework.id} className="px-4 py-3 text-center">
                              <span className="inline-block min-w-16 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 font-medium text-gray-800">
                                {marks[learner.id]?.[homework.id] || '--'}
                              </span>
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-lg font-bold ${getGradeColor(finalMark)}`}>
                              {finalMark}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getGradeColor(finalMark)}`}>
                              {getSymbol(finalMark)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
};

export default MarksView;
