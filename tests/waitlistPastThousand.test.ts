// Waitlist issue 56: Open wave and the waitlist analytics past 1,000 signups.
// A mocked supabase client only; this never touches the live database.
// Run: npx jiti tests/waitlistPastThousand.test.ts
import { __test } from '../api/admin.ts';

delete process.env.RESEND_API_KEY; // no email can be sent from a test
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
console.error = () => {}; // the email step logs one expected failure per person

const DEFAULT_LIMIT = 1000; // what the database returns from a read with no range
type Row = Record<string, unknown> & { id: string };
type SelectOpts = { count?: string; head?: boolean };

function makeDb(rows: Row[], opts: { failUpdateCall?: number } = {}) {
  const stats = { updateCalls: 0, updateBatchSizes: [] as number[], rangedReads: 0 };
  function builder(kind: 'select' | 'update', payload?: Record<string, unknown>, selectOpts?: SelectOpts) {
    const filters: ((r: Row) => boolean)[] = [];
    let range: [number, number] | null = null;
    let ordered = false;
    let inSize = 0;
    const b = {
      select(_cols?: string, o?: SelectOpts) { if (kind === 'select') selectOpts = o; return b; },
      eq(col: string, v: unknown) { filters.push((r) => r[col] === v); return b; },
      gte(col: string, v: string) { filters.push((r) => String(r[col]) >= v); return b; },
      in(col: string, vs: unknown[]) { inSize = vs.length; const set = new Set(vs); filters.push((r) => set.has(r[col])); return b; },
      order(_col: string) { ordered = true; return b; },
      range(from: number, to: number) { range = [from, to]; return b; },
      then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
        try {
          let hit = rows.filter((r) => filters.every((f) => f(r)));
          if (kind === 'update') {
            stats.updateCalls += 1;
            stats.updateBatchSizes.push(inSize);
            if (stats.updateCalls === opts.failUpdateCall) return resolve({ data: null, error: { message: 'boom' } });
            hit.forEach((r) => Object.assign(r, payload));
            return resolve({ data: hit.map((r) => ({ ...r })), error: null });
          }
          if (selectOpts?.head) return resolve({ data: null, count: hit.length, error: null });
          if (ordered) hit = [...hit].sort((a, c) => a.id.localeCompare(c.id));
          if (range) { stats.rangedReads += 1; hit = hit.slice(range[0], range[1] + 1); }
          else hit = hit.slice(0, DEFAULT_LIMIT);
          return resolve({ data: hit, error: null });
        } catch (e) { reject(e); }
      },
    };
    return b;
  }
  const client = {
    from(_table: string) {
      return {
        select: (cols?: string, o?: SelectOpts) => builder('select', undefined, o).select(cols, o),
        update: (payload: Record<string, unknown>) => builder('update', payload),
      };
    },
  };
  return { client: client as never, stats };
}

function makeRes() {
  const out = { status: 0, body: null as any };
  const res = { status(code: number) { out.status = code; return res; }, json(b: unknown) { out.body = b; return res; } };
  return { res: res as never, out };
}

const N = 2500;
const now = Date.now();
function waitingRows(): Row[] {
  return Array.from({ length: N }, (_, i) => ({
    id: `u${String(i).padStart(5, '0')}`,
    email: `p${i}@example.test`,
    status: 'waiting_for_next_wave',
    wave_number: null,
    is_founding_member: i % 10 === 0,
    is_founding_member_creator: false,
    created_at: new Date(now - (i % 25) * 86400000).toISOString(),
  }));
}

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures += 1;
}
const sum = (xs: { count: number }[]) => xs.reduce((a, x) => a + x.count, 0);

// 1. Open wave opens all 2,500 in batches of at most 200.
{
  const rows = waitingRows();
  const { client, stats } = makeDb(rows);
  const { res, out } = makeRes();
  await __test.handleOpenWave(client, { body: { wave_number: 3 } } as never, res);
  const max = Math.max(...stats.updateBatchSizes);
  check('open wave: status 200', out.status === 200, `got ${out.status}`);
  check('open wave: users_moved = 2500', out.body.users_moved === N, `got ${out.body.users_moved}`);
  check('open wave: every row active in wave 3', rows.every((r) => r.status === 'active' && r.wave_number === 3));
  check('open wave: batches at most 200 ids', max <= 200, `${stats.updateCalls} batches, largest ${max}`);

  // 2. A second tap opens nobody.
  const again = makeRes();
  const before = stats.updateCalls;
  await __test.handleOpenWave(client, { body: { wave_number: 3 } } as never, again.res);
  check('open wave again: users_moved = 0', again.out.status === 200 && again.out.body.users_moved === 0,
    `status ${again.out.status}, moved ${again.out.body.users_moved}, updates ${stats.updateCalls - before}`);
}

// 3. A failed batch stops, says how many were opened, and a second tap finishes the rest.
{
  const rows = waitingRows();
  const { client } = makeDb(rows, { failUpdateCall: 3 });
  const first = makeRes();
  await __test.handleOpenWave(client, { body: { wave_number: 4 } } as never, first.res);
  check('partial failure: 500 after 400 opened', first.out.status === 500 && first.out.body.users_moved === 400,
    `status ${first.out.status}, moved ${first.out.body.users_moved}`);
  check('partial failure: message says tap again', /Opened 400 of 2500.*Tap Open wave again/.test(first.out.body.error ?? ''));
  const second = makeRes();
  await __test.handleOpenWave(client, { body: { wave_number: 4 } } as never, second.res);
  const opened = rows.filter((r) => r.status === 'active').length;
  check('partial failure: second tap opens the other 2100', second.out.status === 200 && second.out.body.users_moved === 2100,
    `moved ${second.out.body.users_moved}`);
  check('partial failure: 2500 opened in total, none twice', opened === N && 400 + second.out.body.users_moved === N);
}

// 4. Analytics totals add up to 2,500 by day, wave and status.
{
  const rows = waitingRows();
  rows.forEach((r, i) => {
    if (i % 3 === 1) Object.assign(r, { status: 'active', wave_number: 1 });
    if (i % 3 === 2) Object.assign(r, { status: 'active', wave_number: 2 });
  });
  const { client, stats } = makeDb(rows);
  const { res, out } = makeRes();
  await __test.handleWaitlistAnalytics(client, res);
  check('analytics: status 200', out.status === 200, `got ${out.status}`);
  check('analytics: total_signups = 2500', out.body.total_signups === N, `got ${out.body.total_signups}`);
  check('analytics: by day adds to 2500', sum(out.body.signups_last_30_days) === N, `got ${sum(out.body.signups_last_30_days)}`);
  check('analytics: by wave adds to 2500', sum(out.body.wave_distribution) === N, `got ${sum(out.body.wave_distribution)}`);
  check('analytics: by status adds to 2500', sum(out.body.status_distribution) === N, `got ${sum(out.body.status_distribution)}`);
  check('analytics: read in pages', stats.rangedReads === 9, `${stats.rangedReads} ranged page reads`);
  check('analytics: output keys unchanged', JSON.stringify(Object.keys(out.body)) === JSON.stringify(
    ['total_signups', 'signups_last_30_days', 'wave_distribution', 'status_distribution', 'founding_member_count', 'founding_member_creator_count']));
}

console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
