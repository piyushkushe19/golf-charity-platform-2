// supabase/functions/stripe-webhook/index.ts
// Handles Stripe subscription lifecycle events
// Deploy with: supabase functions deploy stripe-webhook
// In Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://<project>.supabase.co/functions/v1/stripe-webhook
//   Events: customer.subscription.created, customer.subscription.updated,
//            customer.subscription.deleted, invoice.payment_succeeded

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  console.log('Webhook event:', event.type)

  switch (event.type) {
    // ── Subscription created ─────────────────────────────
    case 'customer.subscription.created': {
      const sub  = event.data.object as Stripe.Subscription
      const userId    = sub.metadata.supabase_user_id
      const planType  = sub.metadata.plan_type || 'monthly'
      const priceId   = sub.items.data[0].price.id
      const amount    = (sub.items.data[0].price.unit_amount || 0) / 100

      await supabase.from('subscriptions').upsert({
        user_id:               userId,
        stripe_customer_id:    sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id:       priceId,
        plan_type:             planType,
        plan_amount:           amount,
        status:                sub.status === 'active' ? 'active' : sub.status,
        current_period_start:  new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:    new Date(sub.current_period_end   * 1000).toISOString(),
        updated_at:            new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' })

      console.log(`Subscription created for user ${userId}`)
      break
    }

    // ── Subscription updated (renewal, cancellation) ─────
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const statusMap: Record<string, string> = {
        active:    'active',
        canceled:  'cancelled',
        past_due:  'past_due',
        trialing:  'trialing',
        unpaid:    'lapsed',
      }

      await supabase.from('subscriptions')
        .update({
          status:               statusMap[sub.status] || sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
          cancelled_at:         sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          updated_at:           new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)

      console.log(`Subscription ${sub.id} updated → ${sub.status}`)
      break
    }

    // ── Subscription deleted ─────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions')
        .update({
          status:      'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at:  new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)

      console.log(`Subscription ${sub.id} deleted`)
      break
    }

    // ── Payment succeeded (update period dates) ──────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
        await supabase.from('subscriptions')
          .update({
            status:               'active',
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
            updated_at:           new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)

        console.log(`Payment succeeded for sub ${sub.id}`)
      }
      break
    }

    default:
      console.log(`Unhandled event: ${event.type}`)
  }

  return new Response('ok', { status: 200 })
})
