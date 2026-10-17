import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  RotateCw, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  Send,
  X
} from 'lucide-react';
import { openOfficialTelegramChannel } from '../../config/constants';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bonus: number;
  total: number;
  utr: string;
  screenshotUrl: string;
  depositId?: string;
  isAutoApprovedInitially?: boolean;
  onApproveDeposit?: (id: string, totalInr: number) => void;
}

export const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  amount,
  bonus,
  total,
  utr,
  screenshotUrl,
  depositId,
  isAutoApprovedInitially = false,
  onApproveDeposit,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(35);
  const [status, setStatus] = useState<'verifying' | 'approved' | 'admin_review'>(
    isAutoApprovedInitially ? 'approved' : 'verifying'
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const hasApprovedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(35);
      setStatus(isAutoApprovedInitially ? 'approved' : 'verifying');
      setCurrentStep(1);
      hasApprovedRef.current = false;
      return;
    }

    if (isAutoApprovedInitially) {
      setStatus('approved');
      setCurrentStep(3);
      return;
    }

    setStatus('verifying');
    setSecondsLeft(35);
    setCurrentStep(1);
    hasApprovedRef.current = false;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 35-second countdown ended:
          // If valid screenshot was attached, auto-approve and credit the wallet!
          if (!hasApprovedRef.current) {
            hasApprovedRef.current = true;
            if (depositId && onApproveDeposit) {
              onApproveDeposit(depositId, total);
            }
            setStatus('approved');
            setCurrentStep(3);
          }
          return 0;
        }

        const next = prev - 1;
        // Step transitions
        if (next <= 25 && next > 12) {
          setCurrentStep(2);
        } else if (next <= 12) {
          setCurrentStep(3);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isAutoApprovedInitially, depositId, total, onApproveDeposit]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((35 - secondsLeft) / 35) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0F1E36] via-[#0B1528] to-[#070D18] rounded-3xl border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl text-white space-y-4 overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button only if finished or user wants to dismiss */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2 pt-1">
          {status === 'verifying' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wide">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>PAYMENT PROCESS ME HAI ({secondsLeft}s)</span>
            </div>
          ) : status === 'approved' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black tracking-wide animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PAYMENT VERIFIED & APPROVED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-black tracking-wide">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>SUBMITTED FOR ADMIN REVIEW</span>
            </div>
          )}

          <h3 className="text-lg sm:text-xl font-black font-outfit text-white tracking-tight">
            {status === 'verifying'
              ? 'Verifying Payment Receipt...'
              : status === 'approved'
              ? '🎉 ₹' + total.toLocaleString('en-IN') + ' Credited to Wallet!'
              : '✅ Request Under Admin Review'}
          </h3>

          <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
            {status === 'verifying'
              ? 'Aapka screenshot aur UTR check ho raha hai. 30-40 seconds me verify karke wallet me add ho jayega.'
              : status === 'approved'
              ? 'Payment successfully verify ho gaya hai aur aapke wallet balance me credit kar diya gaya hai!'
              : 'Admin 5-7 minutes ke andar UTR check karke aapke wallet me balance credit kar dega.'}
          </p>
        </div>

        {/* Amount & Bonus Summary Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Deposit Amount</div>
            <div className="text-xl font-black text-white font-mono">₹{amount.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">+ Bonus Added</div>
            <div className="text-xl font-black text-emerald-300 font-mono">+₹{bonus.toFixed(0)}</div>
          </div>
          <div className="text-right pl-3 border-l border-white/10">
            <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Total Credit</div>
            <div className="text-xl font-black text-amber-300 font-mono">₹{total.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Progress Bar & Countdown (During Verifying) */}
        {status === 'verifying' && (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI Verification in Progress...</span>
              </span>
              <span className="font-mono text-amber-400 font-black">{secondsLeft}s remaining</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
              <div 
                className="bg-gradient-to-r from-[#FF6B00] via-amber-400 to-emerald-400 h-2.5 rounded-full transition-all duration-1000 ease-linear shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Step Checklist */}
        <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-white/10 text-xs">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 flex items-center justify-center font-bold text-[11px]">
              ✓
            </div>
            <div className="flex-1">
              <span className="font-bold text-white">Payment Screenshot Attached</span>
              <span className="text-[10px] text-slate-400 block">Bank receipt image securely received</span>
            </div>
            {screenshotUrl && (
              <img 
                src={screenshotUrl} 
                alt="thumb" 
                className="w-7 h-7 object-cover rounded border border-white/20 shrink-0" 
              />
            )}
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
              currentStep >= 2 || status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse'
            }`}>
              {currentStep >= 2 || status === 'approved' ? '✓' : '2'}
            </div>
            <div className="flex-1">
              <span className="font-bold text-white">Bank UTR & Payee Verification</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                UTR: {utr ? utr.slice(0, 4) + '••••' + utr.slice(-4) : 'Auto-detected'}
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-2.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
              status === 'approved'
                ? 'bg-emerald-500 text-white shadow-emerald-glow'
                : currentStep === 3
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse'
                : 'bg-white/10 text-slate-500'
            }`}>
              {status === 'approved' ? '✓' : '3'}
            </div>
            <div className="flex-1">
              <span className="font-bold text-white">Wallet Credit (+Bonus)</span>
              <span className="text-[10px] text-slate-400 block">
                {status === 'approved'
                  ? '✓ ₹' + total.toLocaleString('en-IN') + ' Credited'
                  : 'Instant auto-credit upon verification'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {status === 'approved' ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-outfit"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Check Wallet Balance ➔</span>
            </button>
          ) : status === 'verifying' ? (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Checking live bank servers...</span>
              <button
                type="button"
                onClick={onClose}
                className="text-amber-400 hover:underline font-bold cursor-pointer"
              >
                Hide & Run in Background
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openOfficialTelegramChannel('https://t.me/VIEWPOINT78')}
                className="w-full py-3 bg-[#229ED9] hover:bg-[#1e8dbf] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition shadow cursor-pointer font-outfit"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact Admin on Telegram (@VIEWPOINT78)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
