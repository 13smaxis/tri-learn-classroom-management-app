import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Layout components
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

// Auth modals
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';
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
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<'teacher' | 'parent' | 'learner' | undefined>(undefined);
  
  // Teacher modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);

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
      <>
        <Header
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenRegister={() => setShowRegisterModal(true)}
          onToggleSidebar={() => {}}
          sidebarOpen={false}
        />
        <LandingPage
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenRegister={() => setShowRegisterModal(true)}
          onOpenInvite={() => setShowInviteModal(true)}
        />
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSwitchToInvite={() => {
            setShowLoginModal(false);
            setShowInviteModal(true);
          }}
        />
        
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            setRegisterRole(undefined);
          }}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          defaultRole={registerRole}
        />
        
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
      </>
    );
  }

  // Render the appropriate dashboard based on user role
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (user.role === 'teacher') {
          return <TeacherDashboard onViewChange={setActiveView} />;
        } else if (user.role === 'parent') {
          return <ParentDashboard onViewChange={setActiveView} />;
        } else {
          return <LearnerDashboard onViewChange={setActiveView} />;
        }
      
      case 'classes':
        return (
          <ClassesView 
            onCreateClass={user.role === 'teacher' ? () => setShowCreateClassModal(true) : undefined} 
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
    <div className="min-h-screen bg-gray-50">
      <Header
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenRegister={() => setShowRegisterModal(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Teacher Modals */}
      {user.role === 'teacher' && (
        <CreateClassModal
          isOpen={showCreateClassModal}
          onClose={() => setShowCreateClassModal(false)}
          onClassCreated={() => {
            setShowCreateClassModal(false);
            setActiveView('classes');
          }}
        />
      )}
    </div>
  );
};

export default AppLayout;
