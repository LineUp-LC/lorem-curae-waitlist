// Warning shown by the Delete and Anonymize panels before acting on a person who
// asked not to be contacted (decision 7a, tracked in #26). The admin must tick
// the box to continue.
//
// 'unknown' means the outreach record could not be read; we cannot rule out
// that they asked us to stop, so the same confirmation is required.

export type ContactWarningKind = 'removed' | 'unknown' | null;

export const REMOVED_DELETE_WARNING =
  'This person asked not to be contacted. Deleting this record means they could be emailed again if they sign up again.';

const UNKNOWN_DELETE_WARNING =
  'We could not read the outreach record, so we cannot rule out that this person asked not to be contacted. Deleting this record means they could be emailed again if they sign up again.';

interface ContactWarningProps {
  kind: ContactWarningKind;
  id: string;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ContactWarning({ kind, id, acknowledged, onAcknowledgedChange, disabled }: ContactWarningProps) {
  if (!kind) return null;
  return (
    <div className="bg-coral-50 border border-coral-300 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-coral-800">
        {kind === 'removed' ? REMOVED_DELETE_WARNING : UNKNOWN_DELETE_WARNING}
      </p>
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-coral-800">
        <input
          id={id}
          type="checkbox"
          checked={acknowledged}
          disabled={disabled}
          onChange={(e) => onAcknowledgedChange(e.target.checked)}
          className="rounded border-coral-300 text-coral-600 focus:ring-coral-500/30"
        />
        I understand and want to continue.
      </label>
    </div>
  );
}
