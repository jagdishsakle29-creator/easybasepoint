import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Coins, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({ isOpen, onClose }) => {
  const { 
    bankCards, 
    addBankCard, 
    deleteBankCard, 
    upis, 
    addUpi, 
    deleteUpi, 
    usdts, 
    addUsdt, 
    deleteUsdt,
    addToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bank' | 'upi' | 'usdt'>('bank');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Bank Form state
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // UPI Form state
  const [upiId, setUpiId] = useState('');
  const [upiHolder, setUpiHolder] = useState('');

  // USDT Form state
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [usdtLabel, setUsdtLabel] = useState('');

  if (!isOpen) return null;

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountHolder || !accountNumber || !ifscCode) {
      addToast('error', 'Please fill in all bank details.');
      return;
    }
    addBankCard({
      bankName,
      accountHolder,
      accountNumber: `••••••••${accountNumber.slice(-4)}`,
      ifscCode: ifscCode.toUpperCase(),
      isDefault: bankCards.length === 0,
    });
    setBankName('');
    setAccountHolder('');
    setAccountNumber('');
    setIfscCode('');
    setIsAddingNew(false);
  };

  const handleAddUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      addToast('error', 'Please enter a valid UPI ID (e.g. name@okhdfcbank).');
      return;
    }
    addUpi({
      upiId,
      accountHolder: upiHolder || 'Primary User',
      isDefault: upis.length === 0,
    });
    setUpiId('');
    setUpiHolder('');
    setIsAddingNew(false);
  };

  const handleAddUsdt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usdtAddress || usdtAddress.length < 20) {
      addToast('error', 'Please enter a valid crypto address.');
      return;
    }
    addUsdt({
      address: `${usdtAddress.slice(0, 8)}...${usdtAddress.slice(-6)}`,
      network: usdtNetwork,
      label: usdtLabel || 'My Wallet',
      isDefault: usdts.length === 0,
    });
    setUsdtAddress('');
    setUsdtLabel('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-outfit">My Payment Methods</h3>
              <p className="text-[11px] text-slate-400">Manage receiving accounts for withdrawals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Bank | UPI | USDT */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('bank'); setIsAddingNew(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Cards ({bankCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('upi'); setIsAddingNew(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>UPI IDs ({upis.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('usdt'); setIsAddingNew(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'usdt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>USDT ({usdts.length})</span>
          </button>
        </div>

        {/* ==================== BANK TAB ==================== */}
        {activeTab === 'bank' && (
          <div className="space-y-3">
            {!isAddingNew ? (
              <>
                <div className="space-y-2">
                  {bankCards.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      No bank accounts added yet.
                    </div>
                  ) : (
                    bankCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3.5 bg-gradient-to-r from-slate-50 to-orange-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{card.bankName}</span>
                            {card.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-bold rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-600 font-bold">
                            {card.accountNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {card.accountHolder} • {card.ifscCode}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteBankCard(card.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3 border border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 text-[#FF6B00] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Bank Account</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleAddBank} className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase">New Bank Details</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Account Holder</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name as in bank"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SBIN0001234"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono uppercase focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold bg-[#FF6B00] text-white rounded-xl shadow-orange-glow"
                  >
                    Save Account
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==================== UPI TAB ==================== */}
        {activeTab === 'upi' && (
          <div className="space-y-3">
            {!isAddingNew ? (
              <>
                <div className="space-y-2">
                  {upis.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      No UPI IDs added yet.
                    </div>
                  ) : (
                    upis.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs font-mono">{item.upiId}</span>
                            {item.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-bold rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.accountHolder}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteUpi(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete UPI"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3 border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New UPI ID</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleAddUpi} className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase">New UPI ID</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">VPA / UPI ID</label>
                  <input
                    type="text"
                    required
                    placeholder="yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={upiHolder}
                    onChange={(e) => setUpiHolder(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold bg-[#FF6B00] text-white rounded-xl shadow-orange-glow"
                  >
                    Save UPI
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==================== USDT TAB ==================== */}
        {activeTab === 'usdt' && (
          <div className="space-y-3">
            {!isAddingNew ? (
              <>
                <div className="space-y-2">
                  {usdts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      No USDT wallet addresses saved yet.
                    </div>
                  ) : (
                    usdts.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-gradient-to-r from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{item.label || 'Crypto Wallet'}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded-full">
                              {item.network}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-600 mt-0.5">
                            {item.address}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteUsdt(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3 border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New USDT Address</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleAddUsdt} className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase">New USDT Address</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Network</label>
                  <select
                    value={usdtNetwork}
                    onChange={(e) => setUsdtNetwork(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-[#FF6B00]"
                  >
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wallet Address</label>
                  <input
                    type="text"
                    required
                    placeholder="T..."
                    value={usdtAddress}
                    onChange={(e) => setUsdtAddress(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Label / Wallet Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Binance, TrustWallet"
                    value={usdtLabel}
                    onChange={(e) => setUsdtLabel(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold bg-[#FF6B00] text-white rounded-xl shadow-orange-glow"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
