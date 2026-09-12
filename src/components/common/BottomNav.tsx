import React from 'react';
import { Home, ArrowDownToLine, ArrowUpFromLine, Users, User } from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'me', label: 'Me', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1528]/95 backdrop-blur-xl border-t border-orange-500/20 shadow-[0_-8px_30px_rgba(255,107,0,0.15)] transition-all">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="group relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300"
            >
              {/* Active ambient aura */}
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-orange-400 via-[#FF6B00] to-amber-400 rounded-full shadow-[0_0_12px_#FF6B00]" />
              )}

              <div
                className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white shadow-[0_4px_16px_rgba(255,107,0,0.4)] scale-110'
                    : 'bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>

              <span
                className={`text-[11px] mt-1 font-outfit tracking-wide transition-all ${
                  isActive 
                    ? 'text-[#FF7A00] font-extrabold scale-105 drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]' 
                    : 'text-slate-400 font-medium group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
