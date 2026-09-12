-- ====================================================================
-- EasyBasePoint - Supabase / PostgreSQL Production Schema
-- Designed with strict Row Level Security (RLS) & Audit Logging
-- ====================================================================

-- 1. PROFILES & USERS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  telegram TEXT,
  is_google_auth_enabled BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLETS (Restricted: only updated by server triggers / admin functions)
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance NUMERIC(14, 2) DEFAULT 0.00 CHECK (balance >= 0),
  quota NUMERIC(14, 2) DEFAULT 0.00 CHECK (quota >= 0),
  referral_balance NUMERIC(14, 2) DEFAULT 0.00,
  today_receive NUMERIC(14, 2) DEFAULT 0.00,
  team_commission NUMERIC(14, 2) DEFAULT 0.00,
  today_team_recharge NUMERIC(14, 2) DEFAULT 0.00,
  today_team_members INT DEFAULT 0,
  total_team_recharge NUMERIC(14, 2) DEFAULT 0.00,
  total_team_members INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QUOTA PACKAGES
CREATE TABLE IF NOT EXISTS public.quota_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price NUMERIC(14, 2) NOT NULL,
  income NUMERIC(14, 2) NOT NULL,
  income_percent NUMERIC(5, 2) NOT NULL,
  quota NUMERIC(14, 2) NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('LOW', 'MIDDLE', 'HIGH')),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'reward', 'commission', 'quota_purchase')),
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'USDT')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'failed')),
  note TEXT,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DEPOSITS
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('INR', 'USDT')),
  calculated_inr NUMERIC(14, 2) NOT NULL,
  bonus_inr NUMERIC(14, 2) DEFAULT 0.00,
  activity_reward_inr NUMERIC(14, 2) DEFAULT 0.00,
  total_inr NUMERIC(14, 2) NOT NULL,
  network TEXT,
  wallet_address TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WITHDRAWALS
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank', 'upi', 'usdt')),
  fee NUMERIC(14, 2) DEFAULT 0.00,
  net_amount NUMERIC(14, 2) NOT NULL,
  account_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REWARD & PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  usdt_rate NUMERIC(10, 2) DEFAULT 110.00,
  normal_usdt_price NUMERIC(10, 2) DEFAULT 105.00,
  inr_reward_percent NUMERIC(5, 2) DEFAULT 9.00,
  low_bonus_percent NUMERIC(5, 2) DEFAULT 5.00,
  middle_bonus_percent NUMERIC(5, 2) DEFAULT 7.00,
  high_bonus_percent NUMERIC(5, 2) DEFAULT 9.00,
  min_withdrawal NUMERIC(14, 2) DEFAULT 200.00,
  withdrawal_fee_percent NUMERIC(5, 2) DEFAULT 5.00,
  referral_l1_percent NUMERIC(5, 2) DEFAULT 10.00,
  referral_l2_percent NUMERIC(5, 2) DEFAULT 5.00,
  is_demo_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  target_user UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile & wallet
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert deposit requests" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert withdrawal requests" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Everyone can view active quota packages and platform settings
CREATE POLICY "Public read quota packages" ON public.quota_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read platform settings" ON public.platform_settings FOR SELECT USING (true);
