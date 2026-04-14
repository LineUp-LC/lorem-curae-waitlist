# Deploy Checklist

## Unsubscribe Endpoint

The unsubscribe Edge Function (`supabase/functions/unsubscribe/index.ts`) and its migration (`supabase/migrations/20260414_add_unsubscribed_to_waitlist.sql`) must be deployed before any email with a live unsubscribe link goes out.

### 1. Run the migration

In the Supabase SQL editor, or via CLI:
```bash
supabase db push
```
This adds `unsubscribed_at` and `unsubscribe_token` to the `waitlist` table and creates a unique index on `unsubscribe_token`.

Verify:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'waitlist' AND column_name IN ('unsubscribed_at', 'unsubscribe_token');
```
Expect two rows.

### 2. Deploy the Edge Function

```bash
supabase functions deploy unsubscribe
```
No extra secrets needed — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected.

### 3. Smoke test

```bash
# Valid token (use a real token from a waitlist row)
curl "https://fskvzrobcfokezumadbb.supabase.co/functions/v1/unsubscribe?token=<uuid>"
# Expect: HTML page with "You've been unsubscribed..."

# Invalid token
curl "https://fskvzrobcfokezumadbb.supabase.co/functions/v1/unsubscribe?token=00000000-0000-0000-0000-000000000000"
# Expect: HTML page with "This unsubscribe link is invalid."
```

---

## Drip Scheduler

The drip-scheduler Edge Function (`supabase/functions/drip-scheduler/index.ts`) and its pg_cron job (`supabase/migrations/20260414_create_drip_send_log.sql`) require configuration in two separate places before the daily 08:00 UTC run will work.

### 1. Edge Function runtime secrets

The function reads three env vars at runtime (see `drip-scheduler/index.ts:226-228`):

| Env var | Source | Action needed |
|---|---|---|
| `SUPABASE_URL` | Auto-injected by Supabase Edge Runtime | None |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase Edge Runtime | None |
| `RESEND_API_KEY` | Manual | **Set via Dashboard → Project Settings → Edge Functions → Manage secrets**, or CLI: `supabase secrets set RESEND_API_KEY=re_...` |

The same `RESEND_API_KEY` is already referenced by `api/request-magic-link.ts` (Vercel-side). The Edge Function needs its own copy configured in Supabase — Vercel env vars do not cross over.

### 2. Vault secrets for pg_cron

The pg_cron job invokes the Edge Function via `pg_net` and reads two secrets from Supabase Vault (`vault.decrypted_secrets`). Without these, the cron row will run but emit no HTTP request.

| Secret name (exact) | Value | Where to find it in the Supabase Dashboard |
|---|---|---|
| `project_url` | `https://<project-ref>.supabase.co` — no trailing slash | Project Settings → General → Reference ID (build URL), or Project Settings → API → Project URL |
| `service_role_key` | The service role JWT (not the anon key) | Project Settings → API → Project API keys → `service_role` (reveal and copy) |

**Set via Dashboard:** Project Settings → Vault → Secrets → New secret. Create one row per name above. The `name` column must match exactly — the cron SQL looks these up by literal name.

**Or via SQL (one-time, from SQL editor as a privileged user):**
```sql
SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
SELECT vault.create_secret('<service_role_jwt>',                 'service_role_key');
```

### 3. Verify cron is scheduled

After the migration runs:
```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'drip-scheduler-daily';
```
Expect one row with `schedule = '0 8 * * *'` and `active = true`.

### 4. Disable / change

- Disable: `SELECT cron.unschedule('drip-scheduler-daily');`
- Change time: unschedule, then edit and re-run the migration's `SELECT cron.schedule(...)` block with a new cron expression.

### 5. Smoke test before waiting for cron

Manually invoke the deployed Edge Function (Authorization header = service role JWT):
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/drip-scheduler \
  -H "Authorization: Bearer <service_role_jwt>" \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expect `{"ok":true,"result":{...}}`. Then check `drip_send_log` for any rows created.
