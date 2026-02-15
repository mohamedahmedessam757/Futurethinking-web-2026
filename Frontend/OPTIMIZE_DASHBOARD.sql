-- Function to calculate total revenue securely and fast
-- Usage: supabase.rpc('get_total_revenue')
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM transactions
  WHERE status = 'paid';
$$;

-- Function to get monthly revenue for the current year (for charts)
-- Usage: supabase.rpc('get_monthly_revenue', { year_param: 2025 })
CREATE OR REPLACE FUNCTION get_monthly_revenue(year_param int)
RETURNS TABLE (
  month int,
  total_amount numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    EXTRACT(MONTH FROM created_at)::int as month,
    COALESCE(SUM(amount), 0) as total_amount
  FROM transactions
  WHERE status = 'paid' AND EXTRACT(YEAR FROM created_at) = year_param
  GROUP BY 1
  ORDER BY 1;
$$;
