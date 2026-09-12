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

-- Admin Full Access Policies (Checked via role = 'admin' on profiles)
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view all deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update deposits" ON public.deposits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ====================================================================
-- AUTOMATIC PROFILE & WALLET CREATION ON AUTH SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code TEXT;
BEGIN
  v_ref_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  
  INSERT INTO public.profiles (id, name, email, phone, referral_code, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Player'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    v_ref_code,
    'user',
    'active'
  );

  INSERT INTO public.wallets (user_id, balance, quota)
  VALUES (NEW.id, 0.00, 0.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute upon user signup in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ATOMIC & IDEMPOTENT DEPOSIT APPROVAL FUNCTION
-- Prevents double-credit, enforces admin check, updates wallet & logs
-- ====================================================================
CREATE OR REPLACE FUNCTION public.approve_deposit(
  p_deposit_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_deposit RECORD;
  v_admin_role TEXT;
BEGIN
  -- 1. Check if admin has authorization
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = p_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can approve deposits.';
  END IF;

  -- 2. Lock deposit record for update to prevent race conditions
  SELECT * INTO v_deposit
  FROM public.deposits
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found.';
  END IF;

  -- 3. Idempotency check: if already completed, do NOT credit again
  IF v_deposit.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_approved', true,
      'message', 'Deposit already approved and credited previously.'
    );
  END IF;

  IF v_deposit.status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot approve a rejected deposit.';
  END IF;

  -- 4. Mark deposit as completed
  UPDATE public.deposits
  SET status = 'completed'
  WHERE id = p_deposit_id;

  -- 5. Atomic wallet balance and quota update
  UPDATE public.wallets
  SET 
    balance = balance + v_deposit.total_inr,
    quota = quota + (CASE WHEN v_deposit.method = 'USDT' THEN v_deposit.calculated_inr ELSE v_deposit.amount END),
    today_receive = today_receive + v_deposit.total_inr,
    updated_at = NOW()
  WHERE user_id = v_deposit.user_id;

  -- 6. Insert immutable completed transaction entry
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    note,
    reference_id
  ) VALUES (
    v_deposit.user_id,
    'deposit',
    v_deposit.total_inr,
    v_deposit.method,
    'completed',
    format('%s Deposit Approved (+₹%s)', v_deposit.method, v_deposit.total_inr),
    p_deposit_id::TEXT
  );

  -- 7. Audit Log
  INSERT INTO public.audit_logs (
    admin_id,
    action,
    details,
    target_user
  ) VALUES (
    p_admin_id,
    'APPROVE_DEPOSIT',
    format('Approved deposit %s of ₹%s', p_deposit_id, v_deposit.total_inr),
    v_deposit.user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_approved', false,
    'deposit_id', p_deposit_id,
    'credited_amount', v_deposit.total_inr,
    'user_id', v_deposit.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

