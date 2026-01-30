import React, { useState } from 'react';

const MarksView: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});

  const classes = [
    { id: '1', name: 'Grade 10A - Mathematics' },
    { id: '2', name: 'Grade 11B - Mathematics' }
  ];

  const learners = [
    { id: '1', name: 'Alex Johnson' },
    { id: '2', name: 'Sarah Smith' },
    { id: '3', name: 'Mike Brown' },
    { id: '4', name: 'Emily Davis' },
    { id: '5', name: 'James Wilson' },
    { id: '6', name: 'Lisa Anderson' },
    { id: '7', name: 'David Taylor' },
    { id: '8', name: 'Emma Thomas' }
  ];

  const assessmentTypes = [
    { id: 'classwork', name: 'Classwork', weight: 10 },
    { id: 'assignment1', name: 'Assignment 1', weight: 25 },
    { id: 'assignment2', name: 'Assignment 2', weight: 25 },
    { id: 'exam', name: 'Exam', weight: 40 }
  ];

  const handleMarkChange = (learnerId: string, assessmentId: string, value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setMarks(prev => ({
      ...prev,
      [learnerId]: {
        ...prev[learnerId],
        [assessmentId]: numValue
      }
    }));
  };

  const calculateFinalMark = (learnerId: string): number => {
    const learnerMarks = marks[learnerId] || {};
    let total = 0;
    assessmentTypes.forEach(type => {
      const mark = learnerMarks[type.id] || 0;
      total += (mark * type.weight) / 100;
    });
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

  const passCount = learners.filter(l => calculateFinalMark(l.id) >= 50).length;
  const passRate = Math.round((passCount / learners.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark Capture</h1>
          <p className="text-gray-500">Record and calculate learner grades</p>
        </div>
      </div>

      {/* Weight Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Mark Weighting</h3>
        <div className="flex flex-wrap gap-4">
          {assessmentTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm text-blue-800">{type.name}: {type.weight}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Choose a class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          {/* Pass Rate Indicator */}
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
              <span>{learners.length - passCount} failing</span>
            </div>
          </div>

          {/* Marks Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Learner</th>
                    {assessmentTypes.map(type => (
                      <th key={type.id} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        {type.name}
                        <span className="block text-xs font-normal text-gray-500">{type.weight}%</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Final</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Symbol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {learners.map((learner) => {
                    const finalMark = calculateFinalMark(learner.id);
                    return (
                      <tr key={learner.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                              {learner.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{learner.name}</span>
                          </div>
                        </td>
                        {assessmentTypes.map(type => (
                          <td key={type.id} className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={marks[learner.id]?.[type.id] || ''}
                              onChange={(e) => handleMarkChange(learner.id, type.id, e.target.value)}
                              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="--"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg font-bold ${getGradeColor(finalMark)}`}>
                            {finalMark}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center font-bold ${getGradeColor(finalMark)}`}>
                            {getSymbol(finalMark)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all">
              Export to CSV
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all">
              Save Marks
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MarksView;
