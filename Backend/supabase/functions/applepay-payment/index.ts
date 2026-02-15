// Supabase Edge Function: Apple Pay Token Handler
// Deploy with: supabase functions deploy applepay-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplePayRequest {
    token: string // Apple Pay payment token
    amount: number
    item_type: 'course' | 'book' | 'consultation' | 'subscription'
    item_id: string
    item_name: string
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: req.headers.get('Authorization')! } }
            }
        )

        // Verify user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('name, email')
            .eq('id', user.id)
            .single()

        const body: ApplePayRequest = await req.json()
        const { token, amount, item_type, item_id, item_name } = body

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'Apple Pay token required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Process with Moyasar using Apple Pay token
        const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY')

        const moyasarResponse = await fetch('https://api.moyasar.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100),
                currency: 'SAR',
                description: item_name,
                source: {
                    type: 'applepay',
                    token: token,
                },
                metadata: {
                    user_id: user.id,
                    user_name: profile?.name,
                    item_type,
                    item_id,
                    item_name,
                },
            }),
        })

        const moyasarData = await moyasarResponse.json()

        if (!moyasarResponse.ok) {
            console.error('Moyasar Apple Pay error:', moyasarData)
            return new Response(
                JSON.stringify({ error: 'Payment failed', details: moyasarData }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if payment was successful
        const isPaid = moyasarData.status === 'paid'

        // Create transaction record
        const { data: transaction } = await supabaseClient
            .from('transactions')
            .insert({
                user_id: user.id,
                user_name: profile?.name || 'مستخدم',
                item_type,
                item_id,
                item_name,
                amount,
                status: isPaid ? 'paid' : 'failed',
                payment_method: 'ApplePay',
                moyasar_payment_id: moyasarData.id,
            })
            .select()
            .single()

        if (isPaid) {
            // Grant access immediately (same logic as webhook)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            if (item_type === 'course') {
                await supabaseAdmin.from('course_enrollments').upsert({
                    course_id: item_id,
                    student_id: user.id,
                    progress: 0,
                }, { onConflict: 'course_id,student_id' })
            } else if (item_type === 'book') {
                await supabaseAdmin.from('book_purchases').upsert({
                    book_id: item_id,
                    user_id: user.id,
                }, { onConflict: 'book_id,user_id' })
            }
        }

        return new Response(
            JSON.stringify({
                success: isPaid,
                payment_id: moyasarData.id,
                status: moyasarData.status,
                transaction_id: transaction?.id,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Apple Pay error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
