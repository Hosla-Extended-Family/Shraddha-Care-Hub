// Creates member accounts and sets/resets their passwords.
// Team admins may create accounts, but a password reset from a team admin only
// raises a request; main admins act directly.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  serviceClient, getCaller, json, audit, clientIp,
  makeMembershipId, memberSyntheticEmail,
} from "../_shared/admin.ts";

function randomPassword() {
  const words = ["Sun", "Moon", "River", "Lotus", "Tiger", "Mango", "Rain", "Star"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Keep the office copy of a member's password so admins can look it up later. */
async function savePassword(svc: any, userId: string, password: string, byUserId?: string | null) {
  await svc.from("member_passwords").upsert({
    user_id: userId,
    password,
    updated_at: new Date().toISOString(),
    updated_by: byUserId ?? null,
  }, { onConflict: "user_id" });
}


/** "2026-07" or "2026-07-01" -> first day of that month. */
function monthStart(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** Last day of the month a member has paid for. */
function monthEnd(monthStartISO: string) {
  const [y, mo] = monthStartISO.split("-").map(Number);
  return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);
    const ip = clientIp(req);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    // ---- Look up what a phone number would do ------------------------------
    // Lets the admin UI confirm before an existing account gets upgraded.
    if (action === "check_phone") {
      const phone = String(body.phone ?? "").replace(/\D/g, "");
      if (phone.length < 10) return json({ error: "Enter a 10-digit phone number." }, 400, H);
      const e164 = `+91${phone.slice(-10)}`;
      const { data: existing } = await svc.from("profiles")
        .select("user_id, full_name, membership_id, status, created_at").eq("phone_e164", e164).maybeSingle();
      if (!existing) return json({ outcome: "new" }, 200, H);
      if (existing.membership_id) {
        return json({
          outcome: "member_exists",
          membership_id: existing.membership_id,
          full_name: existing.full_name,
        }, 200, H);
      }
      return json({
        outcome: "upgrade",
        user_id: existing.user_id,
        full_name: existing.full_name,
        status: existing.status,
        since: existing.created_at,
      }, 200, H);
    }

    // ---- Create a member account -------------------------------------------
    // Shared by the single "New member" dialog and the bulk sheet onboarding.
    type CreateInput = {
      name?: unknown; phone?: unknown; plan?: unknown; monthly_fee_amount?: unknown;
      chapter?: unknown; paid_up_until?: unknown; last_paid_month?: unknown;
      password?: unknown; allow_upgrade?: unknown;
    };

    const createMember = async (input: CreateInput) => {
      const name = String(input.name ?? "").trim();
      const phone = String(input.phone ?? "").replace(/\D/g, "");
      const plan = input.plan ? String(input.plan) : null;
      const fee = input.monthly_fee_amount ? Number(input.monthly_fee_amount) : null;
      const chapter = input.chapter ? String(input.chapter) : null;
      const lastPaidMonth = monthStart(input.last_paid_month);
      const paidUpUntil = input.paid_up_until
        ? String(input.paid_up_until)
        : lastPaidMonth ? monthEnd(lastPaidMonth) : null;
      const allowUpgrade = Boolean(input.allow_upgrade);
      if (name.length < 2 || phone.length < 10) {
        return { status: 400, payload: { error: "Name and a 10-digit phone number are required." } };
      }
      const membershipId = makeMembershipId(name, phone);

      const { data: clash } = await svc.from("profiles").select("user_id").eq("membership_id", membershipId).maybeSingle();
      if (clash) return { status: 400, payload: { error: `Membership ID ${membershipId} already exists.` } };

      const password = String(input.password ?? "") || randomPassword();
      const email = memberSyntheticEmail(membershipId);
      const e164 = `+91${phone.slice(-10)}`;

      // A profile may already exist for this phone (e.g. an existing blog writer).
      // Upgrade that account into a member instead of failing on the unique phone —
      // but only when the admin has explicitly confirmed the upgrade.
      const { data: existing } = await svc.from("profiles")
        .select("user_id, membership_id, full_name, status").eq("phone_e164", e164).maybeSingle();

      let userId: string;
      let upgraded = false;
      if (existing) {
        if (existing.membership_id) {
          return { status: 400, payload: { error: `This phone already belongs to member ${existing.membership_id}.` } };
        }
        if (!allowUpgrade) {
          return {
            status: 409,
            payload: {
              needs_confirmation: true,
              outcome: "upgrade",
              user_id: existing.user_id,
              full_name: existing.full_name,
              status: existing.status,
            },
          };
        }
        userId = existing.user_id;
        upgraded = true;
        const { error: pwErr } = await svc.auth.admin.updateUserById(userId, { password });
        if (pwErr) return { status: 400, payload: { error: pwErr.message } };
      } else {
        const { data: created, error: createErr } = await svc.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: name, phone_e164: e164, country_code: "+91" },
        });
        if (createErr || !created.user) {
          return { status: 400, payload: { error: createErr?.message ?? "Could not create account" } };
        }
        userId = created.user.id;
      }

      // handle_new_user() already inserted the profile row; fill in member fields.
      await svc.from("profiles").update({
        membership_id: membershipId,
        full_name: name,
        phone_e164: e164,
        plan,
        monthly_fee_amount: fee,
        chapter,
        paid_up_until: paidUpUntil,
        last_paid_month: lastPaidMonth,
        member_since: new Date().toISOString().slice(0, 10),
        member_status: paidUpUntil ? "active" : "pending_payment",
        must_change_password: false,
        status: "approved",
        approved_at: new Date().toISOString(),
      }).eq("user_id", userId);

      await savePassword(svc, userId, password, caller.userId);
      await svc.from("user_roles").insert({ user_id: userId, role: "member" });

      await audit(
        svc, caller,
        upgraded ? "upgrade_account_to_member" : "create_member",
        "profiles", userId,
        upgraded
          ? {
              membership_id: membershipId,
              upgraded_existing_account: true,
              phone_e164: e164,
              previous_name: existing?.full_name ?? null,
              previous_status: existing?.status ?? null,
              new_name: name,
              plan,
              last_paid_month: lastPaidMonth,
            }
          : { membership_id: membershipId, plan, last_paid_month: lastPaidMonth },
        ip,
      );

      return {
        status: 200,
        payload: { membership_id: membershipId, password, user_id: userId, upgraded, paid_up_until: paidUpUntil },
      };
    };

    if (action === "create_member") {
      const { status, payload } = await createMember(body);
      return json(payload, status, H);
    }

    // ---- Bulk create from the Active Members sheet ---------------------------
    if (action === "bulk_create") {
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 200) : [];
      if (rows.length === 0) return json({ error: "No rows to create." }, 400, H);

      const created: Record<string, unknown>[] = [];
      const failed: Record<string, unknown>[] = [];
      for (const row of rows) {
        const { status, payload } = await createMember({
          ...row,
          plan: row.plan ?? body.plan,
          monthly_fee_amount: row.monthly_fee_amount ?? body.monthly_fee_amount,
          last_paid_month: row.last_paid_month ?? body.last_paid_month,
          allow_upgrade: row.allow_upgrade ?? body.allow_upgrade ?? true,
        });
        const name = String(row.name ?? "");
        if (status === 200) {
          created.push({ name, phone: String(row.phone ?? ""), ...payload });
        } else {
          failed.push({ name, phone: String(row.phone ?? ""), reason: (payload as any).error ?? "Needs confirmation" });
        }
      }
      await audit(svc, caller, "bulk_create_members", "profiles", null,
        { created: created.length, failed: failed.length }, ip);
      return json({ created, failed }, 200, H);
    }


    // ---- Remove a member from the directory ---------------------------------
    // Non-destructive: the login/profile stays, but every membership field is
    // cleared so the person shows up again in the Active Members sheet panel.
    if (action === "remove_member") {
      const targetUserId = String(body.user_id ?? "");
      if (!targetUserId) return json({ error: "Missing member" }, 400, H);
      const { data: target } = await svc.from("profiles")
        .select("membership_id, full_name, phone_e164, plan").eq("user_id", targetUserId).maybeSingle();
      if (!target) return json({ error: "Member not found" }, 404, H);

      const { error: updErr } = await svc.from("profiles").update({
        membership_id: null,
        plan: null,
        monthly_fee_amount: null,
        paid_up_until: null,
        last_paid_month: null,
        member_since: null,
        chapter: null,
        member_status: "none",
      }).eq("user_id", targetUserId);
      if (updErr) return json({ error: updErr.message }, 400, H);

      await svc.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "member");
      // Let the import row be staged/activated again.
      await svc.from("member_imports")
        .update({ status: "pending", linked_user_id: null })
        .eq("linked_user_id", targetUserId);

      await audit(svc, caller, "remove_member", "profiles", targetUserId,
        { membership_id: target.membership_id, full_name: target.full_name, phone_e164: target.phone_e164 }, ip);
      return json({ ok: true, membership_id: target.membership_id }, 200, H);
    }

    // ---- Set / reset a password --------------------------------------------
    if (action === "set_password") {
      const targetUserId = String(body.user_id ?? "");
      if (!targetUserId) return json({ error: "Missing member" }, 400, H);
      const { data: target } = await svc.from("profiles")
        .select("membership_id, full_name").eq("user_id", targetUserId).maybeSingle();
      if (!target) return json({ error: "Member not found" }, 404, H);

      if (!caller.isMainAdmin) {
        // Team admin: raise a request instead of acting.
        const { error } = await svc.from("credential_requests").insert({
          target_user_id: targetUserId,
          target_membership_id: target.membership_id,
          requested_by: caller.userId,
          requested_by_name: caller.fullName,
          kind: "password_reset",
          proposed_password: body.password ? String(body.password) : null,
          reason: body.reason ? String(body.reason) : null,
        });
        if (error) return json({ error: error.message }, 400, H);
        await audit(svc, caller, "request_password_reset", "profiles", targetUserId, {}, ip);
        return json({ requested: true }, 200, H);
      }

      const password = String(body.password ?? "") || randomPassword();
      const { error: updErr } = await svc.auth.admin.updateUserById(targetUserId, { password });
      if (updErr) return json({ error: updErr.message }, 400, H);
      await savePassword(svc, targetUserId, password, caller.userId);
      await audit(svc, caller, "set_password", "profiles", targetUserId, {}, ip);
      return json({ password }, 200, H);
    }

    // ---- Reveal a member's password ----------------------------------------
    // Main admin sees it straight away. A team admin needs one approval from the
    // main admin; after that they can read it for 24 hours.
    if (action === "reveal_password") {
      const targetUserId = String(body.user_id ?? "");
      if (!targetUserId) return json({ error: "Missing member" }, 400, H);
      const { data: target } = await svc.from("profiles")
        .select("membership_id, full_name").eq("user_id", targetUserId).maybeSingle();
      if (!target) return json({ error: "Member not found" }, 404, H);

      const readVault = async () => {
        const { data } = await svc.from("member_passwords")
          .select("password, updated_at").eq("user_id", targetUserId).maybeSingle();
        return data;
      };

      if (caller.isMainAdmin) {
        const row = await readVault();
        await audit(svc, caller, "view_member_password", "profiles", targetUserId,
          { membership_id: target.membership_id }, ip);
        return json({ password: row?.password ?? null, updated_at: row?.updated_at ?? null }, 200, H);
      }

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: approved } = await svc.from("credential_requests")
        .select("id, reviewed_at")
        .eq("target_user_id", targetUserId)
        .eq("requested_by", caller.userId)
        .eq("kind", "password_view")
        .eq("status", "approved")
        .gte("reviewed_at", cutoff)
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (approved) {
        const row = await readVault();
        await audit(svc, caller, "view_member_password", "profiles", targetUserId,
          { membership_id: target.membership_id, via_request: approved.id }, ip);
        return json({ password: row?.password ?? null, updated_at: row?.updated_at ?? null }, 200, H);
      }

      // Already waiting on the main admin?
      const { data: waiting } = await svc.from("credential_requests")
        .select("id").eq("target_user_id", targetUserId).eq("requested_by", caller.userId)
        .eq("kind", "password_view").eq("status", "pending").limit(1).maybeSingle();
      if (waiting) return json({ requested: true, already: true }, 200, H);

      const { error } = await svc.from("credential_requests").insert({
        target_user_id: targetUserId,
        target_membership_id: target.membership_id,
        requested_by: caller.userId,
        requested_by_name: caller.fullName,
        kind: "password_view",
        reason: body.reason ? String(body.reason) : null,
      });
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "request_password_view", "profiles", targetUserId, {}, ip);
      return json({ requested: true }, 200, H);
    }

    // ---- Set / change a member's photo (admins) -----------------------------
    if (action === "set_avatar") {
      const targetUserId = String(body.user_id ?? "");
      const path = String(body.avatar_path ?? "");
      if (!targetUserId || !path) return json({ error: "Missing member or photo" }, 400, H);
      const { error } = await svc.from("profiles").update({ avatar_url: path }).eq("user_id", targetUserId);
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "set_member_photo", "profiles", targetUserId, { avatar_url: path }, ip);
      return json({ ok: true }, 200, H);
    }

    // ---- Approve / reject a pending credential request ----------------------
    if (action === "review_request") {
      if (!caller.isMainAdmin) return json({ error: "Only the main admin can approve this." }, 403, H);
      const requestId = String(body.request_id ?? "");
      const approve = Boolean(body.approve);
      const { data: reqRow } = await svc.from("credential_requests").select("*").eq("id", requestId).maybeSingle();
      if (!reqRow || reqRow.status !== "pending") return json({ error: "Request not found" }, 404, H);

      let password: string | null = null;
      if (approve && reqRow.kind !== "password_view") {
        password = String(reqRow.proposed_password ?? "") || randomPassword();
        const { error } = await svc.auth.admin.updateUserById(reqRow.target_user_id, { password });
        if (error) return json({ error: error.message }, 400, H);
        await savePassword(svc, reqRow.target_user_id, password, caller.userId);
      }
      await svc.from("credential_requests").update({
        status: approve ? "approved" : "rejected",
        reviewed_by: caller.userId,
        reviewed_at: new Date().toISOString(),
      }).eq("id", requestId);
      await audit(svc, caller,
        `${approve ? "approve" : "reject"}_${reqRow.kind === "password_view" ? "password_view" : "password_reset"}`,
        "credential_requests", requestId, { target_user_id: reqRow.target_user_id }, ip);
      return json({ password, membership_id: reqRow.target_membership_id }, 200, H);
    }



    // ---- Assign / remove a role (main admin only) ---------------------------
    if (action === "set_role") {
      if (!caller.isMainAdmin) return json({ error: "Only the main admin can change roles." }, 403, H);
      const targetUserId = String(body.user_id ?? "");
      const role = String(body.role ?? "");
      const grant = Boolean(body.grant);
      if (!["member", "team_admin", "main_admin", "admin"].includes(role)) {
        return json({ error: "Unknown role" }, 400, H);
      }
      if (grant) {
        await svc.from("user_roles").insert({ user_id: targetUserId, role }).select();
      } else {
        await svc.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role);
      }
      await audit(svc, caller, grant ? "grant_role" : "revoke_role", "user_roles", targetUserId, { role }, ip);
      return json({ ok: true }, 200, H);
    }

    return json({ error: "Unknown action" }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
