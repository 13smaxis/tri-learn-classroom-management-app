import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const GradesView: React.FC = () => {
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState('term1');

  const subjects = [
    {
      name: 'Mathematics',
      teacher: 'Mr. Smith',
      assessments: [
        { type: 'Classwork', weight: 10, mark: 75, maxMark: 100 },
        { type: 'Assignment 1', weight: 25, mark: 68, maxMark: 100 },
        { type: 'Assignment 2', weight: 25, mark: 72, maxMark: 100 },
        { type: 'Exam', weight: 40, mark: 65, maxMark: 100 }
      ]
    },
    {
      name: 'English',
      teacher: 'Mrs. Davis',
      assessments: [
        { type: 'Classwork', weight: 10, mark: 82, maxMark: 100 },
        { type: 'Assignment 1', weight: 25, mark: 78, maxMark: 100 },
        { type: 'Assignment 2', weight: 25, mark: 75, maxMark: 100 },
        { type: 'Exam', weight: 40, mark: 70, maxMark: 100 }
      ]
    },
    {
      name: 'Physical Sciences',
      teacher: 'Dr. Brown',
      assessments: [
        { type: 'Classwork', weight: 10, mark: 70, maxMark: 100 },
        { type: 'Assignment 1', weight: 25, mark: 58, maxMark: 100 },
        { type: 'Assignment 2', weight: 25, mark: 62, maxMark: 100 },
        { type: 'Exam', weight: 40, mark: 60, maxMark: 100 }
      ]
    },
    {
      name: 'Life Sciences',
      teacher: 'Ms. Wilson',
      assessments: [
        { type: 'Classwork', weight: 10, mark: 88, maxMark: 100 },
        { type: 'Assignment 1', weight: 25, mark: 80, maxMark: 100 },
        { type: 'Assignment 2', weight: 25, mark: 76, maxMark: 100 },
        { type: 'Exam', weight: 40, mark: 74, maxMark: 100 }
      ]
    },
    {
      name: 'Geography',
      teacher: 'Mr. Taylor',
      assessments: [
        { type: 'Classwork', weight: 10, mark: 90, maxMark: 100 },
        { type: 'Assignment 1', weight: 25, mark: 85, maxMark: 100 },
        { type: 'Assignment 2', weight: 25, mark: 82, maxMark: 100 },
        { type: 'Exam', weight: 40, mark: 78, maxMark: 100 }
      ]
    }
  ];

  const calculateFinalMark = (assessments: any[]) => {
    return Math.round(
      assessments.reduce((acc, a) => acc + (a.mark / a.maxMark) * a.weight, 0)
    );
  };

  const getGradeColor = (mark: number) => {
    if (mark >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (mark >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (mark >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (mark >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSymbol = (mark: number) => {
    if (mark >= 80) return 'A';
    if (mark >= 70) return 'B';
    if (mark >= 60) return 'C';
    if (mark >= 50) return 'D';
    if (mark >= 40) return 'E';
    if (mark >= 30) return 'F';
    return 'G';
  };

  const overallAverage = Math.round(
    subjects.reduce((acc, s) => acc + calculateFinalMark(s.assessments), 0) / subjects.length
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
          <p className="text-gray-500">View your academic performance</p>
        </div>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="w-full sm:w-48 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="term1">Term 1 - 2026</option>
          <option value="term2">Term 2 - 2026</option>
          <option value="term3">Term 3 - 2026</option>
          <option value="term4">Term 4 - 2026</option>
        </select>
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-blue-100">Overall Average</p>
            <p className="text-5xl font-bold mt-1">{overallAverage}%</p>
            <p className="text-blue-200 mt-2">Symbol: {getSymbol(overallAverage)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Highest</p>
              <p className="text-xl font-bold">Geography</p>
              <p className="text-blue-200 text-sm">{calculateFinalMark(subjects[4].assessments)}%</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Needs Work</p>
              <p className="text-xl font-bold">Sciences</p>
              <p className="text-blue-200 text-sm">{calculateFinalMark(subjects[2].assessments)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        {subjects.map((subject, idx) => {
          const finalMark = calculateFinalMark(subject.assessments);
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-500">{subject.teacher}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border ${getGradeColor(finalMark)}`}>
                    <span className="text-2xl font-bold">{finalMark}%</span>
                    <span className="ml-2 text-lg font-semibold">({getSymbol(finalMark)})</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {subject.assessments.map((assessment, aidx) => (
                    <div key={aidx} className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{assessment.type} ({assessment.weight}%)</p>
                      <p className={`text-lg font-bold ${
                        assessment.mark >= 70 ? 'text-green-600' :
                        assessment.mark >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {assessment.mark}/{assessment.maxMark}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Grade Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { symbol: 'A', range: '80-100%', color: 'bg-green-100 text-green-700' },
            { symbol: 'B', range: '70-79%', color: 'bg-blue-100 text-blue-700' },
            { symbol: 'C', range: '60-69%', color: 'bg-yellow-100 text-yellow-700' },
            { symbol: 'D', range: '50-59%', color: 'bg-orange-100 text-orange-700' },
            { symbol: 'E', range: '40-49%', color: 'bg-red-100 text-red-700' },
            { symbol: 'F', range: '30-39%', color: 'bg-red-200 text-red-800' },
            { symbol: 'G', range: '0-29%', color: 'bg-red-300 text-red-900' }
          ].map((grade, idx) => (
            <div key={idx} className={`rounded-lg p-3 text-center ${grade.color}`}>
              <p className="text-xl font-bold">{grade.symbol}</p>
              <p className="text-xs">{grade.range}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradesView;
