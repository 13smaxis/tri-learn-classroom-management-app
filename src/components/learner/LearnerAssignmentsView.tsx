import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

const LearnerAssignmentsView: React.FC = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const assignments = [
    { 
      id: '1', 
      title: 'Chapter 5: Quadratic Equations', 
      subject: 'Mathematics',
      type: 'assignment1',
      dueDate: 'Feb 3, 2026',
      status: 'pending',
      description: 'Complete exercises 5.1 to 5.4 from the textbook. Show all working.',
      maxMarks: 100,
      weight: '25%'
    },
    { 
      id: '2', 
      title: 'Essay: Climate Change Impact', 
      subject: 'English',
      type: 'assignment2',
      dueDate: 'Feb 5, 2026',
      status: 'submitted',
      description: 'Write a 1000-word essay on the impact of climate change on your community.',
      maxMarks: 100,
      weight: '25%',
      submittedAt: 'Jan 28, 2026'
    },
    { 
      id: '3', 
      title: 'Lab Report: Chemical Reactions', 
      subject: 'Physical Sciences',
      type: 'assignment1',
      dueDate: 'Feb 7, 2026',
      status: 'pending',
      description: 'Write a lab report on the experiment conducted in class.',
      maxMarks: 50,
      weight: '25%'
    },
    { 
      id: '4', 
      title: 'Problem Set 4', 
      subject: 'Mathematics',
      type: 'classwork',
      dueDate: 'Jan 30, 2026',
      status: 'graded',
      description: 'Complete the problem set on functions.',
      maxMarks: 20,
      weight: '10%',
      marksObtained: 18
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'graded':
        return 'bg-green-100 text-green-700';
      case 'late':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = () => {
    console.log('Submitting assignment:', selectedAssignment?.id);
    setShowSubmitModal(false);
    setSelectedAssignment(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-500">View and submit your assignments</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Pending', 'Submitted', 'Graded'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
              tab === 'All' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div 
            key={assignment.id} 
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {assignment.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {assignment.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Weight: {assignment.weight}
                  </span>
                  <span>Max: {assignment.maxMarks} marks</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {assignment.status === 'graded' && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{assignment.marksObtained}/{assignment.maxMarks}</p>
                    <p className="text-xs text-gray-500">Marks obtained</p>
                  </div>
                )}
                {assignment.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowSubmitModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Submit
                  </button>
                )}
                {assignment.status === 'submitted' && (
                  <div className="text-right">
                    <p className="text-sm text-blue-600 font-medium">Submitted</p>
                    <p className="text-xs text-gray-500">{assignment.submittedAt}</p>
                  </div>
                )}
                <button className="px-4 py-2 text-gray-600 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-all">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Modal */}
      <Modal 
        isOpen={showSubmitModal} 
        onClose={() => {
          setShowSubmitModal(false);
          setSelectedAssignment(null);
        }} 
        title="Submit Assignment" 
        size="lg"
      >
        {selectedAssignment && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900">{selectedAssignment.title}</h3>
              <p className="text-sm text-blue-700 mt-1">{selectedAssignment.subject} • Due: {selectedAssignment.dueDate}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer / Notes</label>
              <textarea
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Type your answer or notes here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <svg className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, Images (Max 10MB)</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedAssignment(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
              >
                Submit Assignment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LearnerAssignmentsView;
