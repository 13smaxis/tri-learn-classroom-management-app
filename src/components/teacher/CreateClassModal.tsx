import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { createDemoClass } from '@/lib/demoStore';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: (classData: any) => void;
}

const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const subjects = [
  'Primary Education',
  'Mathematics', 'English', 'Physical Sciences', 'Life Sciences', 'Geography',
  'History', 'Accounting', 'Business Studies', 'Economics', 'Life Orientation',
  'Computer Applications Technology', 'Information Technology', 'Agricultural Sciences',
  'Tourism', 'Visual Arts', 'Music', 'Dramatic Arts', 'Consumer Studies'
];

const availableTools = [
  { id: 'attendance', name: 'Class Register', description: 'Track daily attendance', icon: '📋' },
  { id: 'homework', name: 'Homework Allocator', description: 'Assign and track homework', icon: '📚' },
  { id: 'assignments', name: 'Assignment Manager', description: 'Create and grade assignments', icon: '📝' },
  { id: 'classMonitor', name: 'Class Monitor', description: 'Track behavior and participation', icon: '👁️' },
  { id: 'marks', name: 'Mark Capture', description: 'Record and calculate grades', icon: '📊' },
  { id: 'messaging', name: 'Communicator', description: 'Message parents and learners', icon: '💬' }
];

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onClassCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdClass, setCreatedClass] = useState<any>(null);

  const [formData, setFormData] = useState({
    className: '',
    grade: '',
    subject: '',
    academicYear: '2026',
    enabledTools: ['attendance', 'homework', 'assignments', 'marks', 'messaging']
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      enabledTools: prev.enabledTools.includes(toolId)
        ? prev.enabledTools.filter(t => t !== toolId)
        : [...prev.enabledTools, toolId]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const newClass = createDemoClass({
        name: formData.className,
        grade: formData.grade,
        subject: formData.subject,
        academicYear: formData.academicYear,
        teacherId: user.id,
        teacherName: user.fullName,
        enabledTools: formData.enabledTools
      });

      setCreatedClass(newClass);
      setStep(3);
      onClassCreated(newClass);
    } catch (err: any) {
      console.error('Full error:', err);
      setError(err.message || 'An error occurred while creating the class');
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setCreatedClass(null);
    setFormData({
      className: '',
      grade: '',
      subject: '',
      academicYear: '2026',
      enabledTools: ['attendance', 'homework', 'assignments', 'marks', 'messaging']
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 3 ? 'Class Created!' : 'Create New Class'} size="lg">
      {step === 1 && (
        <div className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g., Grade 10A Mathematics"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="">Select Grade</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.className || !formData.grade || !formData.subject}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next: Select Tools
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-700">
              Select the tools you want to enable for <strong>{formData.className}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.enabledTools.includes(tool.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{tool.name}</p>
                    <p className="text-sm text-gray-500">{tool.description}</p>
                  </div>
                  {formData.enabledTools.includes(tool.id) && (
                    <svg className="h-5 w-5 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || formData.enabledTools.length === 0}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && createdClass && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Class Created Successfully!</h3>
            <p className="text-gray-600 mt-2">{formData.className} is ready to go</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Invite Code</span>
                {user?.teacherInviteCode && (
                  <button
                    onClick={() => copyToClipboard(user.teacherInviteCode!)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Copy
                  </button>
                )}
              </div>
              {user?.teacherInviteCode ? (
                <>
                  <p className="text-2xl font-mono font-bold text-purple-900 tracking-widest">
                    {user.teacherInviteCode}
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    Share this single code with both learners and parents for all your classes
                  </p>
                </>
              ) : (
                <p className="text-sm text-purple-700">
                  Your invite code is available in your profile menu.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateClassModal;
