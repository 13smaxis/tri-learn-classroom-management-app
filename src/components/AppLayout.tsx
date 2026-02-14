import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Layout components
import Sidebar from '@/components/layout/Sidebar';

// Auth modals
import InviteModal from '@/components/auth/InviteModal';

// Landing page
import LandingPage from '@/components/landing/LandingPage';

// Dashboards
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import LearnerDashboard from '@/components/dashboard/LearnerDashboard';

// Views
import AttendanceView from '@/components/teacher/AttendanceView';
import MarksView from '@/components/teacher/MarksView';
import AssignmentsView from '@/components/teacher/AssignmentsView';
import HomeworkView from '@/components/teacher/HomeworkView';
import MessagesView from '@/components/shared/MessagesView';
import ClassesView from '@/components/shared/ClassesView';
import GradesView from '@/components/shared/GradesView';
import CreateClassModal from '@/components/teacher/CreateClassModal';
import LearnerAssignmentsView from '@/components/learner/LearnerAssignmentsView';
import ChildProgressView from '@/components/parent/ChildProgressView';



const AppLayout: React.FC = () => {
  const { user, loading, justSignedUp, clearJustSignedUp } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [classesVersion, setClassesVersion] = useState(0);
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<'teacher' | 'parent' | 'learner' | undefined>(undefined);
  
  // Teacher modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);

  const showWelcomeOverlay = !!user && user.role === 'teacher' && justSignedUp;

  // Reset to hero view after sign-out
  useEffect(() => {
    if (!user) {
      setShowLoginModal(false);
      setShowRegisterModal(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenRegister={() => setShowRegisterModal(true)}
          onOpenInvite={() => setShowInviteModal(true)}
        />
        
        <main className="flex-1 overflow-auto">
          <LandingPage
            onOpenLogin={() => setShowLoginModal(true)}
            onOpenRegister={() => setShowRegisterModal(true)}
            onOpenInvite={() => setShowInviteModal(true)}
            showLogin={showLoginModal}
            showRegister={showRegisterModal}
            registerRole={registerRole}
            onSwitchToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
            onSwitchToInvite={() => {
              setShowLoginModal(false);
              setShowInviteModal(true);
            }}
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          />
        </main>
        
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSwitchToLogin={() => {
            setShowInviteModal(false);
            setShowLoginModal(true);
          }}
          onSwitchToRegister={(role) => {
            setShowInviteModal(false);
            setRegisterRole(role);
            setShowRegisterModal(true);
          }}
        />
      </div>
    );
  }

  // Render the appropriate dashboard based on user role
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (user.role === 'teacher') {
          return <TeacherDashboard onViewChange={setActiveView} classesVersion={classesVersion} />;
        } else if (user.role === 'parent') {
          return <ParentDashboard onViewChange={setActiveView} />;
        } else {
          return <LearnerDashboard onViewChange={setActiveView} />;
        }
      
      case 'classes':
        return (
          <ClassesView 
            onCreateClass={user.role === 'teacher' ? () => setShowCreateClassModal(true) : undefined}
            classesVersion={classesVersion}
          />
        );
      
      case 'create-class':
        setShowCreateClassModal(true);
        setActiveView('dashboard');
        return null;
      
      case 'attendance':
        return <AttendanceView />;
      
      case 'marks':
        if (user.role === 'learner' || user.role === 'parent') {
          return <GradesView />;
        }
        return <MarksView />;

      case 'assignments':
        if (user.role === 'learner') {
          return <LearnerAssignmentsView />;
        }
        return <AssignmentsView />;
      
      case 'homework':
        if (user.role === 'learner') {
          return <LearnerAssignmentsView />;
        }
        return <HomeworkView />;

      
      case 'messages':
        return <MessagesView />;
      
      case 'progress':
        return <ChildProgressView />;

      
      default:
        if (user.role === 'teacher') {
          return <TeacherDashboard onViewChange={setActiveView} />;
        } else if (user.role === 'parent') {
          return <ParentDashboard onViewChange={setActiveView} />;
        } else {
          return <LearnerDashboard onViewChange={setActiveView} />;
        }
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 relative ${showWelcomeOverlay ? 'overflow-hidden' : ''}`}>
      <div className={`flex h-screen ${showWelcomeOverlay ? 'pointer-events-none blur-sm transition-all' : 'transition-all'}`}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenRegister={() => setShowRegisterModal(true)}
          onOpenInvite={() => setShowInviteModal(true)}
        />
          
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>

        {/* Teacher Create Class Modal - shared entry point */}
        {user.role === 'teacher' && (
          <CreateClassModal
            isOpen={showCreateClassModal}
            onClose={() => setShowCreateClassModal(false)}
            onClassCreated={() => {
              // Bump the classesVersion so dashboards and class lists refresh
              // from the demo store immediately after a class is created.
              setClassesVersion(v => v + 1);
              setActiveView('classes');
            }}
          />
        )}
      </div>

      {showWelcomeOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Congratulations, {user.title ? `${user.title} ` : ''}{user.fullName.split(' ')[0]}!
            </h2>
            <p className="text-gray-600 mb-6">
              You're all set! Your classroom is ready — everything you need is right here.
            </p>
            <button
              type="button"
              onClick={clearJustSignedUp}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              Enter your classroom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
