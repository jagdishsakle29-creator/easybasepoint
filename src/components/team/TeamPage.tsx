import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  TrendingUp, 
  UserCheck, 
  ShieldCheck, 
  ExternalLink,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { TeamMember } from '../../types';

export const TeamPage: React.FC = () => {
  const { user, wallet, team, settings, addToast } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTier, setActiveTier] = useState<'ALL' | 1 | 2>('ALL');

  const referralCode = user?.referralCode || 'EBP-98241';
  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    addToast('success', 'Referral Code copied to clipboard!');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    addToast('success', 'Referral link copied to clipboard!');
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredTeam = team.filter((m) => {
    if (activeTier === 'ALL') return true;
    return m.level === activeTier;
  });

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Page Title */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black text-[#0B1528] font-outfit">Team Referral</h1>
        <span className="text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          🔥 Direct: {settings.referralL1Percent}% Lifetime | L2: {settings.referralL2Percent}%
        </span>
      </div>

      {/* Large Orange Earning Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF6B00] via-[#FF7E1D] to-[#FFA24D] text-white p-5 sm:p-6 shadow-orange-glow">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white/90 uppercase tracking-wider">
                Your Earning
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase">
                20% Lifetime Bonus
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight">
              ₹{wallet.teamCommission.toFixed(2)}
            </div>
            <p className="text-[11px] text-white/90">
              Earn lifetime <strong>20% on every deposit</strong> made by your referred members!
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-sm flex-shrink-0">
            <Gift className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today Team Recharge */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Today Team Recharge
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#0B1528] font-outfit mt-1">
            ₹{wallet.todayTeamRecharge.toFixed(2)}
          </div>
        </div>

        {/* Today Team Members */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Today Team Members
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#0B1528] font-outfit mt-1">
            {wallet.todayTeamMembers}
          </div>
        </div>

        {/* Total Team Recharge */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Team Recharge
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#0B1528] font-outfit mt-1">
            ₹{wallet.totalTeamRecharge.toFixed(2)}
          </div>
        </div>

        {/* Total Team Members */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Team Members
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#0B1528] font-outfit mt-1">
            {wallet.totalTeamMembers}
          </div>
        </div>
      </div>

      {/* Invite Code & Share Section */}
      <div className="glass-card rounded-3xl p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide font-outfit uppercase">
              Invite Friends
            </h3>
          </div>
          <span className="text-xs text-slate-400">One-click copy</span>
        </div>

        {/* Invite Code Box */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              YOUR INVITATION CODE
            </div>
            <div className="text-lg font-black text-[#0B1528] font-mono tracking-wider">
              {referralCode}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-xl shadow-orange-glow transition active:scale-95 touch-press"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Referral URL Box */}
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
          <span className="font-mono text-xs text-slate-600 truncate flex-1 mr-2 select-all">
            {referralUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6B00] transition flex-shrink-0"
            title="Copy Referral Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Team Detail Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            TEAM DETAIL
          </h3>

          {/* Level Filter Tabs */}
          <div className="flex gap-1.5 bg-[#0B1528] p-1.5 rounded-2xl text-xs border border-orange-500/20 shadow-md">
            <button
              onClick={() => setActiveTier('ALL')}
              className={`px-3 py-1.5 rounded-xl font-black font-outfit text-xs transition-all duration-300 ${
                activeTier === 'ALL' 
                  ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-[0_2px_10px_rgba(255,107,0,0.5)] scale-105' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌟 All Members
            </button>
            <button
              onClick={() => setActiveTier(1)}
              className={`px-3 py-1.5 rounded-xl font-black font-outfit text-xs transition-all duration-300 ${
                activeTier === 1 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_2px_10px_rgba(16,185,129,0.5)] scale-105' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Direct (20% L1)
            </button>
            <button
              onClick={() => setActiveTier(2)}
              className={`px-3 py-1.5 rounded-xl font-black font-outfit text-xs transition-all duration-300 ${
                activeTier === 2 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-[0_2px_10px_rgba(147,51,234,0.5)] scale-105' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚀 Indirect (5% L2)
            </button>
          </div>
        </div>

        {filteredTeam.length === 0 ? (
          /* Empty State */
          <div className="glass-card rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800 font-outfit">
                No team members yet
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Invite members to your team to earn direct recharge commission and unlock VIP benefits!
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B00] hover:bg-[#E55F00] text-white text-xs font-bold rounded-xl shadow-orange-glow transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Invite Link</span>
            </button>
          </div>
        ) : (
          /* Populated Members List */
          <div className="space-y-2.5">
            {filteredTeam.map((member) => (
              <div
                key={member.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] font-bold font-outfit flex items-center justify-center">
                    {member.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{member.username}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        Level {member.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Joined: {new Date(member.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 font-outfit">
                    +₹{member.eligibleReward.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Contr: ₹{member.teamContribution.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
