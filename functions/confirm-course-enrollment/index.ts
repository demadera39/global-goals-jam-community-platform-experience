import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe";
import { createClient } from "npm:@blinkdotnew/sdk";

// Blink SDK in Edge (no auth required)
const blink = createClient({ projectId: "global-goals-jam-community-platform-7uamgc2j", authRequired: false });

// Stripe client from secret in project vault
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeKey, { apiVersion: "2022-11-15" });

function cors(headers: HeadersInit = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
    ...headers,
  } as HeadersInit;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors() });
  }

  try {
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe secret key not configured" }), { status: 500, headers: cors() });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;
    const userIdFromClient = body.userId as string | undefined;
    const providedEnrollmentId = body.enrollmentId as string | undefined;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), { status: 400, headers: cors() });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items"],
    });

    // Validate paid session (robust): check session + payment intent
    let pi: any = null;
    try {
      if (typeof session.payment_intent === "string" && session.payment_intent) {
        pi = await stripe.paymentIntents.retrieve(session.payment_intent);
      } else if (session.payment_intent) {
        pi = session.payment_intent as any;
      }
    } catch (_) {}

    const paymentStatus = (session as any).payment_status;
    const sessionStatus = session.status as string | undefined;
    const piStatus = pi?.status as string | undefined;

    const paid = paymentStatus === "paid" || sessionStatus === "complete" || piStatus === "succeeded" || piStatus === "requires_capture";
    if (!paid) {
      // If Stripe is still processing, tell client to keep polling
      if (piStatus === "processing" || sessionStatus === "open" || paymentStatus === "unpaid") {
        return new Response(
          JSON.stringify({ error: "Session not paid yet", status: sessionStatus, payment_status: paymentStatus, pi_status: piStatus }),
          { status: 202, headers: cors() }
        );
      }
      return new Response(
        JSON.stringify({ error: "Session not paid yet", status: sessionStatus, payment_status: paymentStatus, pi_status: piStatus }),
        { status: 409, headers: cors() }
      );
    }

    // Determine user and enrollment
    const email = (session.customer_details?.email || session.customer_email || "").toLowerCase().trim();
    let userId = userIdFromClient || "";

    if (!userId && email) {
      try {
        const users = await (blink.db as any).users.list({ where: { email }, limit: 1 });
        if (users?.[0]?.id) userId = users[0].id;
      } catch (_) {}
    }

    // Enrollment from explicit param, metadata or client_reference_id
    const enrollmentId = providedEnrollmentId || (session.metadata as any)?.enrollment_id || session.client_reference_id || "";

    let enrollment: any = null;
    try {
      if (enrollmentId) {
        const rows = await (blink.db as any).courseEnrollments.list({ where: { id: enrollmentId }, limit: 1 });
        enrollment = rows?.[0] || null;
      }
      // Fallback: latest pending for user
      if (!enrollment && userId) {
        const rows = await (blink.db as any).courseEnrollments.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1 });
        enrollment = rows?.[0] || null;
      }
    } catch (_) {}

    // If still no enrollment found, create one (idempotent best-effort)
    if (!enrollment) {
      if (!userId) {
        return new Response(JSON.stringify({ error: "Could not determine user for enrollment" }), { status: 400, headers: cors() });
      }
      enrollment = await (blink.db as any).courseEnrollments.create({
        id: enrollmentId || undefined,
        userId,
        status: "pending",
        enrolledAt: new Date().toISOString(),
      });
    }

    // Update enrollment to active
    const amount = (typeof session.amount_total === "number" ? session.amount_total : 0) / 100;
    const paymentIntent = (typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent as any)?.id) || "";

    await (blink.db as any).courseEnrollments.update(enrollment.id, {
      status: "active",
      stripeSessionId: session.id,
      stripePaymentIntent: paymentIntent,
      amountPaid: String(amount || 0),
      updatedAt: new Date().toISOString(),
      currentModule: enrollment.currentModule || "1",
    });

    // Optionally schedule the 8-day email sequence (idempotent best-effort)
    try {
      const existingEmails = await (blink.db as any).emailSchedule.list({ where: { enrollmentId: enrollment.id }, limit: 1 });
      if (!existingEmails || existingEmails.length === 0) {
        const startDate = new Date();
        for (let day = 1; day <= 8; day++) {
          const scheduledDate = new Date(startDate);
          scheduledDate.setDate(scheduledDate.getDate() + (day - 1));
          scheduledDate.setHours(9, 0, 0, 0);
          await (blink.db as any).emailSchedule.create({
            id: `email_${enrollment.id}_${day}`,
            enrollmentId: enrollment.id,
            userId: userId,
            moduleNumber: String(day),
            scheduledFor: scheduledDate.toISOString(),
            status: "scheduled",
          });
        }
      }
    } catch (e) {
      console.warn("email schedule creation failed (non-fatal)", e);
    }

    // Auto-upgrade user role after payment (they get host privileges immediately after paying)
    if (userId) {
      try {
        // Check if user should be upgraded to host
        const { checkAndUpgradeUser } = await import('../userStatusHelper.ts')
        await checkAndUpgradeUser(userId)
      } catch (upgradeError) {
        console.warn('Auto-upgrade check failed (non-fatal):', upgradeError)
      }
    }

    // Return enrollment
    const fresh = await (blink.db as any).courseEnrollments.list({ where: { id: enrollment.id }, limit: 1 });
    return new Response(JSON.stringify({ ok: true, enrollment: fresh?.[0] || enrollment }), { status: 200, headers: cors() });
  } catch (err: any) {
    console.error("confirm-course-enrollment error", err?.message || err);
    return new Response(JSON.stringify({ error: "Failed to confirm enrollment", details: err?.message || String(err) }), { status: 500, headers: cors() });
  }
});