// Supabase Edge Function: Create Moyasar Payment
// Deploy with: supabase functions deploy create-payment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
}

interface PaymentRequest {
    amount: number
    item_type: 'course' | 'book' | 'consultation' | 'subscription'
    item_id: string
    item_name: string
    callback_url: string
    description?: string
    create_db_only?: boolean
    user_id: string
    user_name?: string
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Function create-payment invoked (Direct User ID Version)");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Initialize Admin Client (Bypass RLS)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Parse Body
        let body: PaymentRequest;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { amount, item_type, item_id, item_name, callback_url, description, create_db_only, user_id, user_name } = body

        // Validate required fields
        if (!user_id) {
            return new Response(
                JSON.stringify({ error: 'user_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!amount || amount <= 0) {
            return new Response(
                JSON.stringify({ error: 'Invalid amount' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Pending Transaction
        const txData = {
            user_id: user_id,
            user_name: user_name || 'مستخدم',
            item_type,
            item_id: item_id,
            item_name,
            amount,
            status: 'pending',
            payment_method: 'Visa',
            moyasar_invoice_id: null
        }

        const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert(txData)
            .select()
            .single()

        if (txError) {
            console.error('Transaction insert error:', txError)
            return new Response(
                JSON.stringify({ error: 'Database Insert Failed', details: txError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 7. DB Only Mode
        if (create_db_only) {
            return new Response(
                JSON.stringify({
                    success: true,
                    transaction_id: transaction.id,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: false, error: 'Standard flow not implemented' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Critical Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
