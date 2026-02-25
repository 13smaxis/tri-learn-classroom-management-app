import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

// Layout components
import Sidebar from '@/components/layout/Sidebar';

// Auth modals
// InviteModal replaced by inline InviteView in LandingPage

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
import StarsView from '@/components/teacher/StarsView';
import MessagesView from '@/components/shared/MessagesView';
import ClassesView from '@/components/shared/ClassesView';
import ClassDetailsView from '@/components/shared/ClassDetailsView';
import GradesView from '@/components/shared/GradesView';
import CreateClassModal from '@/components/teacher/CreateClassModal';
import LearnerAssignmentsView from '@/components/learner/LearnerAssignmentsView';
import ChildProgressView from '@/components/parent/ChildProgressView';



const AppLayout: React.FC = () => {
  const { user, loading, justSignedUp, clearJustSignedUp } = useAuth();
  const { forceGlobalRefresh } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classesVersion, setClassesVersion] = useState(0);
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<'teacher' | 'parent' | 'learner' | undefined>(undefined);
  
  // Teacher modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);

  const showWelcomeOverlay = !!user && user.role === 'teacher' && justSignedUp;
  const appBgClass = 'bg-gradient-to-br from-blue-100 to-blue-50';


  // Reset to hero view after sign-out
  useEffect(() => {
    if (!user) {
      setShowLoginModal(false);
      setShowRegisterModal(false);
      setShowInviteModal(false);
      setActiveView('dashboard');
    } else {
      setActiveView('dashboard');
    }
  }, [user]);

  // Auto logout after 2 minutes of inactivity
  useEffect(() => {
    if (!user) return;
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (user) {
          // Call logout from context
          window.dispatchEvent(new Event('auto-logout'));
        }
      }, 2 * 60 * 1000); // 2 minutes
    };
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  // Listen for auto-logout event and call logout
  const { logout } = useAuth();
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auto-logout', handler);
    return () => window.removeEventListener('auto-logout', handler);
  }, [logout]);

  // Reset class details when navigating to My Classes
  useEffect(() => {
    if (activeView === 'classes') {
      setSelectedClass(null);
    }
  }, [activeView]);

  const goHome = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowInviteModal(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${appBgClass}`}>
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
      <div className="min-h-screen bg-white flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenLogin={() => { setShowRegisterModal(false); setShowInviteModal(false); setShowLoginModal(true); }}
          onOpenRegister={() => { setShowLoginModal(false); setShowInviteModal(false); setShowRegisterModal(true); }}
          onOpenInvite={() => { setShowLoginModal(false); setShowRegisterModal(false); setShowInviteModal(true); }}
          onGoHome={goHome}
        />
        
        <main className="flex-1 overflow-auto">
          <LandingPage
            onOpenLogin={() => { setShowRegisterModal(false); setShowInviteModal(false); setShowLoginModal(true); }}
            onOpenRegister={() => { setShowLoginModal(false); setShowInviteModal(false); setShowRegisterModal(true); }}
            onOpenInvite={() => { setShowLoginModal(false); setShowRegisterModal(false); setShowInviteModal(true); }}
            showLogin={showLoginModal}
            showRegister={showRegisterModal}
            showInvite={showInviteModal}
            registerRole={registerRole}
            onSwitchToRegister={(role) => {
              setShowLoginModal(false);
              setShowInviteModal(false);
              if (role) setRegisterRole(role);
              setShowRegisterModal(true);
            }}
            onSwitchToInvite={() => {
              setShowLoginModal(false);
              setShowRegisterModal(false);
              setShowInviteModal(true);
            }}
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowInviteModal(false);
              setShowLoginModal(true);
            }}
          />
        </main>
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
          <div className="flex h-full">
            <div className="w-[30%] min-w-[180px] max-w-[400px] overflow-auto">
              <ClassesView
                classesVersion={classesVersion}
                onSelectClass={setSelectedClass}
              />
            </div>
            <div className="w-[70%] flex-1 overflow-auto">
              <ClassDetailsView
                selectedClass={selectedClass}
                canCreateClass={user.role === 'teacher'}
                onCreateClass={user.role === 'teacher' ? () => setShowCreateClassModal(true) : undefined}
              />
            </div>
          </div>
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

      case 'stars':
        return <StarsView />;
      
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
    <div className={`min-h-screen ${appBgClass} relative ${showWelcomeOverlay ? 'overflow-hidden' : ''}`}>
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
          
        <main className={`flex-1 p-4 lg:p-6 overflow-auto ${appBgClass}`}>
          {activeView === 'dashboard' ? (
            <div className={`rounded-2xl p-4 sm:p-6 ${appBgClass}`}>
              {renderContent()}
            </div>
          ) : (
            renderContent()
          )}
        </main>

        {/* Teacher Create Class Modal - shared entry point */}
        {user.role === 'teacher' && (
          <CreateClassModal
            isOpen={showCreateClassModal}
            onClose={() => setShowCreateClassModal(false)}
            onClassCreated={(newClass) => {
              // Bump the classesVersion so dashboards and class lists refresh
              // from the demo store immediately after a class is created.
              setClassesVersion(v => v + 1);
              forceGlobalRefresh();
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
