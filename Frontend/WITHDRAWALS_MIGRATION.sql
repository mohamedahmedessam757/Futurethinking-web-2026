-- ============================================================
-- MIGRATION: CONSULTANT PAYMENTS & WITHDRAWALS SYSTEM
-- Date: 2026-02-08
-- ============================================================

-- 1. Add Balance Fields to consultant_profiles
ALTER TABLE public.consultant_profiles 
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(12, 2) DEFAULT 0;

-- 2. Create withdrawal_requests Table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'SAR',
    
    -- Bank Details
    bank_name TEXT NOT NULL,
    bank_account_holder TEXT NOT NULL,
    bank_iban TEXT NOT NULL,
    
    -- Status Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 3. Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Consultant can view their own requests
CREATE POLICY "Consultants can view own withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (auth.uid() = consultant_id);

-- Consultant can create withdrawal requests
CREATE POLICY "Consultants can create withdrawal requests" 
ON public.withdrawal_requests FOR INSERT 
WITH CHECK (auth.uid() = consultant_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update withdrawal requests" 
ON public.withdrawal_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Updated_at Trigger
CREATE TRIGGER update_withdrawal_requests_updated_at 
BEFORE UPDATE ON public.withdrawal_requests 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
