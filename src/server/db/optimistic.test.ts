import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplyOpsOptions, ApplyOpsResult, StateSnapshot, SyncOp } from '../contracts';
import { StoreStaleError } from './errors';
import { MemoryStore } from './memory-store';
import { PLAN_ATTEMPTS, applyPlanned } from './optimistic';

type Lead = { id: string; name: string; notes: string[] };

async function seededStore(): Promise<MemoryStore> {
  const store = new MemoryStore(async () => ({
    ops: [{ op: 'replace', key: 'leads', items: [{ id: 'lead-1', name: 'Amina', notes: [] }] }],
    opts: {},
  }));
  await store.init();
  return store;
}

const leadOf = (snapshot: StateSnapshot): Lead => (snapshot.state.leads as unknown as Lead[]).find((l) => l.id === 'lead-1')!;

/** Appends a note to the stored lead, the way a repeat submission is merged into its lead. */
const appendNote = (note: string) => (snapshot: StateSnapshot) => {
  const lead = leadOf(snapshot);
  return { ops: [{ op: 'upsert', key: 'leads', item: { ...lead, notes: [...lead.notes, note] } } satisfies SyncOp] };
};

/** A store on which `interfere` runs right before each of the first `times` writes. */
function racing(store: MemoryStore, times: number, interfere: (round: number) => Promise<unknown>) {
  let round = 0;
  return {
    getSnapshot: () => store.getSnapshot(),
    applyOps: async (ops: SyncOp[], opts?: ApplyOpsOptions): Promise<ApplyOpsResult> => {
      if (round < times) await interfere((round += 1));
      return store.applyOps(ops, opts);
    },
  };
}

test('a plan with no concurrent change is applied once', async () => {
  const store = await seededStore();
  let plans = 0;
  const { result } = await applyPlanned(store, (snapshot) => {
    plans += 1;
    return appendNote('visitor')(snapshot);
  });
  assert.equal(plans, 1);
  assert.equal(result.version, 2);
  assert.deepEqual(leadOf(await store.getSnapshot()).notes, ['visitor']);
});

test('a concurrent edit of the same record is kept: the plan is rebuilt on the new state', async () => {
  const store = await seededStore();
  let plans = 0;
  const staffEdit = async () => {
    const lead = leadOf(await store.getSnapshot());
    await store.applyOps([{ op: 'upsert', key: 'leads', item: { ...lead, name: 'Amina (called)', notes: [...lead.notes, 'staff'] } }]);
  };
  await applyPlanned(racing(store, 1, staffEdit), (snapshot) => {
    plans += 1;
    return appendNote('visitor')(snapshot);
  });
  assert.equal(plans, 2);
  const lead = leadOf(await store.getSnapshot());
  assert.equal(lead.name, 'Amina (called)');
  assert.deepEqual(lead.notes, ['staff', 'visitor']);
});

test('gives up with StoreStaleError after the allowed attempts and writes nothing', async () => {
  const store = await seededStore();
  let plans = 0;
  const staffEdit = async (round: number) => {
    const lead = leadOf(await store.getSnapshot());
    await store.applyOps([{ op: 'upsert', key: 'leads', item: { ...lead, notes: [...lead.notes, `staff ${round}`] } }]);
  };
  await assert.rejects(
    applyPlanned(racing(store, PLAN_ATTEMPTS, staffEdit), (snapshot) => {
      plans += 1;
      return appendNote('visitor')(snapshot);
    }),
    StoreStaleError
  );
  assert.equal(plans, PLAN_ATTEMPTS);
  assert.deepEqual(leadOf(await store.getSnapshot()).notes, ['staff 1', 'staff 2', 'staff 3']);
});

test('new records never conflict, whatever else was written meanwhile', async () => {
  const store = await seededStore();
  let plans = 0;
  const other = () => store.applyOps([{ op: 'upsert', key: 'leads', item: { id: 'lead-other', name: 'Other', notes: [] } }]);
  await applyPlanned(racing(store, 1, other), () => {
    plans += 1;
    return { ops: [{ op: 'upsert', key: 'leads', item: { id: 'lead-new', name: 'New', notes: [] } } satisfies SyncOp] };
  });
  assert.equal(plans, 1);
  assert.equal((await store.getSnapshot()).state.leads.length, 3);
});

test('errors thrown by the plan are passed on without a write', async () => {
  const store = await seededStore();
  await assert.rejects(
    applyPlanned(store, () => {
      throw new RangeError('refused');
    }),
    RangeError
  );
  assert.equal((await store.getVersion()).version, 1);
});
