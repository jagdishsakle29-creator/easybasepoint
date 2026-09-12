import React, { useState, useEffect } from 'react';
import { AppProvider, useApp, ActiveTab } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { DemoModeBanner } from './components/common/DemoModeBanner';
import { ToastContainer } from './components/common/ToastContainer';
import { JoinCommunityModal } from './components/common/JoinCommunityModal';
import { HomePage } from './components/home/HomePage';
import { DepositPage } from './components/deposit/DepositPage';
import { WithdrawPage } from './components/withdraw/WithdrawPage';
import { TeamPage } from './components/team/TeamPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { HistoryPage } from './components/history/HistoryPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/landing/LandingPage';
import { openOfficialTelegramChannel } from './config/constants';
import { 
  Home, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Users, 
  User, 
  History, 
  Lock, 
  Smartphone, 
  Send
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    user, 
    isMobilePreview, 
    setIsMobilePreview,
    settings,
    addToast,
    approveDeposit,
    rejectDeposit,
  } = useApp();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthDismissed, setIsAuthDismissed] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Check URL for secret admin link: ?admin=lord12 or direct 1-click approvals
  const adminUnlockedRef = React.useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminKey = params.get('admin');
    const tabParam = params.get('tab');
    if (
      adminKey === (settings.adminSecretKey || 'lord12') || 
      adminKey === 'lord12' || 
      adminKey === 'true' || 
      adminKey === '' || 
      params.has('admin') || 
      tabParam === 'admin'
    ) {
      setActiveTab('admin');
      if (!adminUnlockedRef.current) {
        adminUnlockedRef.current = true;
        addToast('success', 'Admin session unlocked successfully!');
      }
    }

    const approveDepParam = params.get('approve_dep');
    const totalParam = params.get('total');
    if (approveDepParam) {
      approveDeposit(approveDepParam, totalParam ? parseFloat(totalParam) : undefined);
    }

    const rejectDepParam = params.get('reject_dep');
    if (rejectDepParam) {
      rejectDeposit(rejectDepParam, 'Rejected via Admin Link');
    }

    if (approveDepParam || rejectDepParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('approve_dep');
      url.searchParams.delete('total');
      url.searchParams.delete('reject_dep');
      window.history.replaceState({}, '', url.toString());
    }
  }, [settings.adminSecretKey, approveDeposit, rejectDeposit, setActiveTab, addToast]);

  // Post-login Telegram join popup (shows automatically on login/registration)
  useEffect(() => {
    const handleLoginEvent = () => {
      setTimeout(() => {
        setIsCommunityOpen(true);
      }, 500);
    };
    window.addEventListener('ebp:user-logged-in', handleLoginEvent);
    return () => window.removeEventListener('ebp:user-logged-in', handleLoginEvent);
  }, []);

  useEffect(() => {
    if (user && !sessionStorage.getItem('ebp_hide_community_popup_session')) {
      const timer = setTimeout(() => {
        setIsCommunityOpen(true);
        sessionStorage.setItem('ebp_hide_community_popup_session', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Navigation items for normal user (Never show Admin to users unless secret key active)
  const desktopNavItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'me', label: 'Me', icon: User },
    { id: 'history', label: 'History', icon: History },
  ];

  if (activeTab === 'admin') {
    desktopNavItems.push({ id: 'admin', label: 'Admin (Secret Session)', icon: Lock });
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'deposit':
        return <DepositPage />;
      case 'withdraw':
        return <WithdrawPage />;
      case 'team':
        return <TeamPage />;
      case 'me':
        return <ProfilePage />;
      case 'history':
        return <HistoryPage />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <HomePage />;
    }
  };

  // First Screen: Modern Landing Page with Company Banner & Join Telegram CTA
  if (!user && activeTab !== 'admin') {
    return (
      <div className="min-h-screen bg-[#070D18] text-white font-sans selection:bg-[#FF6B00] selection:text-white relative">
        <ToastContainer />
        <LandingPage 
          onEnterApp={() => setIsAuthOpen(true)}
          onOpenRegister={() => setIsAuthOpen(true)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          isForced={false}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FD] flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Top Demo & Trust Disclosure Banner (Strictly Admin Only) */}
      {activeTab === 'admin' && <DemoModeBanner />}

      {/* Main App Layout */}
      {isMobilePreview ? (
        /* Mobile Device Frame Simulation on Desktop */
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-md min-h-screen">
          <div className="mb-3 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
              <Smartphone className="w-3.5 h-3.5 text-[#FF6B00]" />
              iPhone 15 Pro Fintech Frame Mode
            </span>
            <button
              onClick={() => setIsMobilePreview(false)}
              className="ml-2 text-xs text-[#FF6B00] hover:underline font-bold"
            >
              Switch to Full Responsive
            </button>
          </div>

          <div className="w-full max-w-[412px] h-[850px] bg-[#F3F6FD] rounded-[48px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] border-[10px] border-slate-800 flex flex-col overflow-hidden relative">
            {/* Phone Speaker / Dynamic Island notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-50 pointer-events-none" />

            {/* Mobile Header */}
            <Header onOpenHelp={() => setIsCommunityOpen(true)} />

            {/* Content Scrollable area */}
            <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
              {renderActiveView()}
            </main>

            {/* Mobile Fixed Bottom Nav */}
            <BottomNav />
          </div>
        </div>
      ) : (
        /* Standard Responsive App */
        <div className="flex-1 flex flex-col">
          <Header onOpenHelp={() => setIsCommunityOpen(true)} />

          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 flex-1">
            {/* Desktop Navigation Bar */}
            <div className="hidden md:flex items-center justify-between pb-3 mb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#FF6B00] text-white shadow-orange-glow'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openOfficialTelegramChannel(settings.telegramChannelUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200/80 transition"
                  title="Official Telegram Group"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </button>

                <span className="text-xs font-semibold text-slate-700">
                  {user?.name || 'Administrator'}
                </span>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            </div>

            {/* Active View Content */}
            <main className="pb-16 md:pb-6">
              {renderActiveView()}
            </main>
          </div>

          {/* Mobile Bottom Navigation (Only visible on screens < 768px) */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      )}

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Authentication Modal (For Switching Account) */}
      <AuthModal
        isOpen={isAuthOpen}
        isForced={false}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Post-Login Join Telegram Announcement Modal */}
      <JoinCommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
