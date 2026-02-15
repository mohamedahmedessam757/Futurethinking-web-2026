// Supabase Edge Function: Verify Moyasar Payment (Webhook)
// Deploy with: supabase functions deploy verify-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Use service role for webhook (no user auth)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json()

        // Moyasar webhook payload
        const { id, status, amount, metadata } = body

        console.log('Moyasar webhook received:', { id, status, amount })

        if (!id || !status) {
            return new Response(
                JSON.stringify({ error: 'Invalid webhook payload' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Try to find by internal transaction_id first (passed in metadata)
        const internalTxId = metadata?.transaction_id

        let query = supabaseAdmin.from('transactions').select('*')

        if (internalTxId) {
            query = query.eq('id', internalTxId)
        } else {
            query = query.eq('moyasar_invoice_id', id)
        }

        const { data: transaction, error: findError } = await query.single()

        if (findError || !transaction) {
            console.error('Transaction not found:', id)
            return new Response(
                JSON.stringify({ error: 'Transaction not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Map Moyasar status to our status
        let newStatus: 'paid' | 'failed' | 'pending'
        if (status === 'paid') {
            newStatus = 'paid'
        } else if (status === 'failed' || status === 'expired') {
            newStatus = 'failed'
        } else {
            newStatus = 'pending'
        }

        // Update transaction status
        const { error: updateError } = await supabaseAdmin
            .from('transactions')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id)

        if (updateError) {
            console.error('Transaction update error:', updateError)
        }

        // If payment successful, grant access based on item_type
        if (newStatus === 'paid') {
            const { item_type, item_id, user_id, user_name } = transaction

            if (item_type === 'course') {
                // Enroll student in course
                await supabaseAdmin
                    .from('course_enrollments')
                    .upsert({
                        course_id: item_id,
                        student_id: user_id,
                        progress: 0,
                        enrolled_at: new Date().toISOString()
                    }, { onConflict: 'course_id,student_id' })

                // Update course revenue
                const { data: course } = await supabaseAdmin
                    .from('courses')
                    .select('revenue')
                    .eq('id', item_id)
                    .single()

                if (course) {
                    await supabaseAdmin
                        .from('courses')
                        .update({ revenue: (course.revenue || 0) + transaction.amount })
                        .eq('id', item_id)
                }

            } else if (item_type === 'book') {
                // Add book to user's purchases
                await supabaseAdmin
                    .from('book_purchases')
                    .upsert({
                        book_id: item_id,
                        user_id: user_id,
                        purchased_at: new Date().toISOString()
                    }, { onConflict: 'book_id,user_id' })

            } else if (item_type === 'subscription') {
                // Update user subscription tier
                const tier = transaction.item_name.includes('enterprise') ? 'enterprise' : 'pro'
                await supabaseAdmin
                    .from('profiles')
                    .update({ subscription_tier: tier })
                    .eq('id', user_id)

            } else if (item_type === 'consultation') {
                // Create Appointment from metadata
                const appt = {
                    student_id: metadata?.student_id || user_id,
                    student_name: metadata?.student_name || user_name,
                    consultant_id: metadata?.expert_id, // ensure this is passed in metadata
                    consultant_name: metadata?.expert_name,
                    title: metadata?.title || transaction.item_name,
                    date: metadata?.date,
                    time: metadata?.time,
                    type: metadata?.type || 'video',
                    preferred_platform: metadata?.preferred_platform || 'google_meet',
                    status: 'confirmed',
                    created_at: new Date().toISOString()
                }

                const { error: apptError } = await supabaseAdmin
                    .from('appointments')
                    .insert(appt)

                if (apptError) console.error('Error creating appointments:', apptError)

                // Notify Consultant
                if (metadata?.expert_id) {
                    await supabaseAdmin
                        .from('notifications')
                        .insert({
                            target_user_id: metadata.expert_id,
                            title: 'حجز استشارة جديد 📅',
                            message: `تم حجز استشارة جديدة من قبل ${appt.student_name}`,
                            type: 'info',
                            link: '/consultant/appointments'
                        })
                }
            }

            // Send success notification
            await supabaseAdmin
                .from('notifications')
                .insert({
                    target_user_id: user_id,
                    title: 'تم الدفع بنجاح ✅',
                    message: `تم تأكيد عملية الدفع لـ "${transaction.item_name}"`,
                    type: 'success',
                })

            // Notify admin
            await supabaseAdmin
                .from('notifications')
                .insert({
                    target_role: 'admin',
                    title: 'معاملة مالية جديدة',
                    message: `دفع ${user_name} مبلغ ${transaction.amount} ر.س مقابل "${transaction.item_name}"`,
                    type: 'success',
                    link: '/admin/finance'
                })
        }

        return new Response(
            JSON.stringify({ success: true, status: newStatus }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
