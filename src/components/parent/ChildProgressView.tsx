import React, { useState } from 'react';

const ChildProgressView: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('term');

  const childInfo = {
    name: 'Alex Johnson',
    grade: 'Grade 10',
    school: 'Springfield High School',
    overallAverage: 72
  };

  const subjects = [
    { 
      id: 'math', 
      name: 'Mathematics', 
      teacher: 'Mr. Smith',
      average: 68,
      assessments: [
        { name: 'Classwork Average', weight: '10%', mark: 75 },
        { name: 'Assignment 1', weight: '25%', mark: 62 },
        { name: 'Assignment 2', weight: '25%', mark: 70 },
        { name: 'Exam', weight: '40%', mark: 65 }
      ]
    },
    { 
      id: 'english', 
      name: 'English', 
      teacher: 'Mrs. Davis',
      average: 75,
      assessments: [
        { name: 'Classwork Average', weight: '10%', mark: 80 },
        { name: 'Assignment 1', weight: '25%', mark: 72 },
        { name: 'Assignment 2', weight: '25%', mark: 78 },
        { name: 'Exam', weight: '40%', mark: 73 }
      ]
    },
    { 
      id: 'science', 
      name: 'Physical Sciences', 
      teacher: 'Dr. Brown',
      average: 62,
      assessments: [
        { name: 'Classwork Average', weight: '10%', mark: 70 },
        { name: 'Assignment 1', weight: '25%', mark: 58 },
        { name: 'Assignment 2', weight: '25%', mark: 60 },
        { name: 'Exam', weight: '40%', mark: 64 }
      ]
    },
    { 
      id: 'life', 
      name: 'Life Sciences', 
      teacher: 'Ms. Wilson',
      average: 78,
      assessments: [
        { name: 'Classwork Average', weight: '10%', mark: 85 },
        { name: 'Assignment 1', weight: '25%', mark: 76 },
        { name: 'Assignment 2', weight: '25%', mark: 80 },
        { name: 'Exam', weight: '40%', mark: 75 }
      ]
    },
    { 
      id: 'geo', 
      name: 'Geography', 
      teacher: 'Mr. Taylor',
      average: 82,
      assessments: [
        { name: 'Classwork Average', weight: '10%', mark: 88 },
        { name: 'Assignment 1', weight: '25%', mark: 80 },
        { name: 'Assignment 2', weight: '25%', mark: 85 },
        { name: 'Exam', weight: '40%', mark: 79 }
      ]
    }
  ];

  const getGradeColor = (mark: number) => {
    if (mark >= 80) return 'text-green-600 bg-green-50';
    if (mark >= 70) return 'text-blue-600 bg-blue-50';
    if (mark >= 60) return 'text-yellow-600 bg-yellow-50';
    if (mark >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
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

  return (
    <div className="space-y-6">
      {/* Child Info Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {childInfo.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{childInfo.name}</h1>
            <p className="text-green-100">{childInfo.grade} • {childInfo.school}</p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">Overall Average</p>
            <p className="text-4xl font-bold">{childInfo.overallAverage}%</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="term">This Term</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        {subjects
          .filter(s => selectedSubject === 'all' || s.id === selectedSubject)
          .map((subject) => (
          <div key={subject.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <p className="text-sm text-gray-500">Teacher: {subject.teacher}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${getGradeColor(subject.average)}`}>
                    <span className="text-2xl font-bold">{subject.average}%</span>
                    <span className="text-lg font-semibold">({getSymbol(subject.average)})</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Assessment Breakdown</h4>
              <div className="space-y-3">
                {subject.assessments.map((assessment, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{assessment.name}</span>
                        <span className="text-sm font-medium text-gray-500">{assessment.weight}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            assessment.mark >= 70 ? 'bg-green-500' : 
                            assessment.mark >= 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${assessment.mark}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`ml-4 px-2 py-1 rounded text-sm font-semibold ${getGradeColor(assessment.mark)}`}>
                      {assessment.mark}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Highest Subject</h4>
          <p className="text-xl font-bold text-green-600">Geography</p>
          <p className="text-sm text-gray-500">82% average</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Needs Attention</h4>
          <p className="text-xl font-bold text-orange-600">Physical Sciences</p>
          <p className="text-sm text-gray-500">62% average</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Class Rank</h4>
          <p className="text-xl font-bold text-blue-600">8th / 25</p>
          <p className="text-sm text-gray-500">Top 32%</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-semibold text-blue-900 mb-3">Recommendations</h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Consider extra tutoring for Physical Sciences to improve understanding
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Alex shows strong performance in Geography - encourage continued effort
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Focus on improving Assignment scores in Mathematics
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ChildProgressView;
