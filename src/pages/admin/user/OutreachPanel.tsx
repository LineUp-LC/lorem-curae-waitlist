import { useEffect, useState } from 'react';
import { getAdminToken } from '@/lib/adminAuth';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  ErrorBanner,
  Input,
  Select,
  Textarea,
  WarningBanner,
} from '@/pages/admin/components/ui';
import {
  OUTREACH_NOTES_MAX,
  OUTREACH_REMOVED,
  OUTREACH_STATUSES,
  OUTREACH_STATUS_LABELS,
  type OutreachRecord,
  type OutreachStatus,
} from '@/lib/outreachStatus';

// ============================================================================
// Outreach card for /admin/user/:email (tracked in #26)
//
// Status, last-emailed date (typed by hand, never filled in automatically) and
// short notes. Saves through the updateOutreach admin action, separately from
// the Record card, because updateUser sends emails on some changes.
// ============================================================================

interface OutreachPanelProps {
  email: string;
  outreach: OutreachRecord | null;
  outreachError: string | null;
  onSaved: () => void | Promise<void>;
}

interface FormState {
  status: OutreachStatus;
  lastEmailed: string;
  notes: string;
}

function formFrom(o: OutreachRecord): FormState {
  return {
    status: o.outreach_status,
    lastEmailed: o.last_emailed_on ?? '',
    notes: o.notes ?? '',
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

type PendingConfirm = 'undo' | 'remove' | null;

export function OutreachPanel({ email, outreach, outreachError, onSaved }: OutreachPanelProps) {
  const [form, setForm] = useState<FormState | null>(outreach ? formFrom(outreach) : null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  // Re-seed the form whenever a different person or a fresh read arrives.
  useEffect(() => {
    setForm(outreach ? formFrom(outreach) : null);
  }, [outreach, email]);

  // Clear per-person messages when the route moves to someone else.
  useEffect(() => {
    setSaveError(null);
    setSaveNote(null);
    setWarnings([]);
    setPendingConfirm(null);
  }, [email]);

  // A failed or missing read shows an error, never a form that would default
  // to Not sent.
  if (outreachError || !outreach || !form) {
    return (
      <Card>
        <CardHeader title="Outreach" />
        <CardBody>
          <ErrorBanner
            title="Outreach record unavailable"
            message={outreachError ?? 'The outreach record could not be read.'}
            onRetry={() => { void onSaved(); }}
          />
        </CardBody>
      </Card>
    );
  }

  const original = formFrom(outreach);
  const dirty: Partial<Record<keyof FormState, true>> = {};
  if (form.status !== original.status) dirty.status = true;
  if (form.lastEmailed !== original.lastEmailed) dirty.lastEmailed = true;
  if (form.notes.trim() !== original.notes) dirty.notes = true;
  const dirtyCount = Object.keys(dirty).length;

  const wasRemoved = outreach.outreach_status === OUTREACH_REMOVED;
  const undoing = wasRemoved && dirty.status;
  const removing = !wasRemoved && dirty.status && form.status === OUTREACH_REMOVED;
  const notesTooLong = form.notes.trim().length > OUTREACH_NOTES_MAX;

  const save = async (confirmUndo: boolean) => {
    setSaving(true);
    setSaveError(null);
    setSaveNote(null);
    setWarnings([]);

    const body: Record<string, unknown> = { email };
    if (dirty.status) body.outreach_status = form.status;
    if (dirty.lastEmailed) body.last_emailed_on = form.lastEmailed === '' ? null : form.lastEmailed;
    if (dirty.notes) body.notes = form.notes;
    if (confirmUndo) body.confirm_undo_removed = true;

    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/api/admin?action=updateOutreach', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `Save failed (${response.status})`);
      }
      setSaveNote('Outreach saved.');
      setWarnings(Array.isArray(result.warnings) ? result.warnings : []);
      await onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
      // Refresh anyway: a partial save (date and notes saved, status not) must
      // show what is actually stored.
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (undoing) setPendingConfirm('undo');
    else if (removing) setPendingConfirm('remove');
    else void save(false);
  };

  const handleConfirm = () => {
    const which = pendingConfirm;
    setPendingConfirm(null);
    void save(which === 'undo');
  };

  return (
    <Card>
      <CardHeader
        title="Outreach"
        subtitle="Seen only by admins. The last-emailed date is typed by hand."
      />
      <CardBody>
        {saveError && (
          <div className="mb-4">
            <ErrorBanner title="Could not save" message={saveError} />
          </div>
        )}
        {saveNote && (
          <div className="mb-4 rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-700">
            {saveNote}
          </div>
        )}
        {warnings.map((w) => (
          <div key={w} className="mb-4">
            <WarningBanner message={w} />
          </div>
        ))}

        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => (f ? { ...f, status: e.target.value as OutreachStatus } : f))}
            options={OUTREACH_STATUSES.map((s) => ({ value: s, label: OUTREACH_STATUS_LABELS[s] }))}
            hint={
              form.status === OUTREACH_REMOVED
                ? 'Removed people get no email or text and are left out of counts.'
                : undefined
            }
          />

          <Input
            type="date"
            label="Last emailed"
            value={form.lastEmailed}
            onChange={(e) => setForm((f) => (f ? { ...f, lastEmailed: e.target.value } : f))}
            hint="Typed by hand. Not filled in automatically."
          />
        </div>

        <div className="mt-6">
          <Textarea
            label="Notes"
            value={form.notes}
            maxLength={OUTREACH_NOTES_MAX}
            onChange={(e) => setForm((f) => (f ? { ...f, notes: e.target.value } : f))}
            hint={`${form.notes.trim().length} of ${OUTREACH_NOTES_MAX} characters. Seen only by admins.`}
            error={notesTooLong ? `Notes are limited to ${OUTREACH_NOTES_MAX} characters.` : undefined}
            fullWidth
          />
        </div>

        {(outreach.removed_at || outreach.removed_cleared_at) && (
          <div className="mt-4 space-y-1 text-sm text-sage-500">
            {outreach.removed_at && <p>Last moved to Removed on {formatDate(outreach.removed_at)}.</p>}
            {outreach.removed_cleared_at && (
              <p>Removed was last undone on {formatDate(outreach.removed_cleared_at)}.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-sage-100 pt-6">
          <span className="text-sm text-sage-500">
            {dirtyCount === 0
              ? 'No changes'
              : `${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={dirtyCount === 0 || saving}
              onClick={() => setForm(formFrom(outreach))}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={dirtyCount === 0 || saving || notesTooLong}
              onClick={handleSaveClick}
            >
              Save outreach
            </Button>
          </div>
        </div>
      </CardBody>

      <ConfirmModal
        isOpen={pendingConfirm === 'undo'}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirm}
        title="Undo Removed?"
        message="They may get emails again."
        confirmLabel="Undo Removed"
        variant="warning"
      />
      <ConfirmModal
        isOpen={pendingConfirm === 'remove'}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirm}
        title="Move to Removed?"
        message="They will get no email or text. Their phone number and text opt-in are deleted, and a deleted phone number is not restored if this is undone."
        confirmLabel="Move to Removed"
        variant="danger"
      />
    </Card>
  );
}
