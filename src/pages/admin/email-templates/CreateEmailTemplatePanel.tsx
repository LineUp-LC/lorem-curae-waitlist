import { useState, FormEvent } from 'react';

interface CreateEmailTemplatePanelProps {
  onTemplateCreated: () => void;
}

interface FormState {
  key: string;
  subject: string;
  body: string;
}

interface FormErrors {
  key: string | null;
  subject: string | null;
  body: string | null;
}

// Validate key format
function isValidKey(key: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
}

// Get key validation error
function getKeyError(key: string): string | null {
  if (!key.trim()) {
    return 'Key is required';
  }
  if (!/^[a-zA-Z]/.test(key)) {
    return 'Key must start with a letter';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(key)) {
    return 'Key can only contain letters, numbers, and underscores';
  }
  return null;
}

// Get subject validation error
function getSubjectError(subject: string): string | null {
  if (!subject.trim()) {
    return 'Subject is required';
  }
  return null;
}

// Get body validation error
function getBodyError(body: string): string | null {
  if (!body.trim()) {
    return 'Body is required';
  }
  return null;
}

export function CreateEmailTemplatePanel({ onTemplateCreated }: CreateEmailTemplatePanelProps) {
  const [formState, setFormState] = useState<FormState>({
    key: '',
    subject: '',
    body: '',
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    key: false,
    subject: false,
    body: false,
  });

  // Get validation errors
  const errors: FormErrors = {
    key: touched.key ? getKeyError(formState.key) : null,
    subject: touched.subject ? getSubjectError(formState.subject) : null,
    body: touched.body ? getBodyError(formState.body) : null,
  };

  // Check if form is valid
  const isFormValid =
    isValidKey(formState.key) &&
    formState.subject.trim().length > 0 &&
    formState.body.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ key: true, subject: true, body: true });

    if (!isFormValid) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/create-email-template', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: formState.key.trim(),
          subject: formState.subject.trim(),
          body: formState.body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create template (${response.status})`);
      }

      setSuccess(true);
      setFormState({
        key: '',
        subject: '',
        body: '',
      });
      setTouched({
        key: false,
        subject: false,
        body: false,
      });

      // Notify parent to refresh
      onTemplateCreated();

      // Clear success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('[CreateEmailTemplate] Failed to create:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };

  const handleFieldBlur = (field: keyof FormState) => {
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-white rounded-xl border border-dashed border-sage-300 p-6 flex items-center justify-center gap-3 hover:bg-sage-50 hover:border-sage-400 transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-sage-100 group-hover:bg-sage-200 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span className="text-sm font-medium text-sage-600 group-hover:text-sage-800">
          Create New Email Template
        </span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between bg-sage-50/50">
        <div>
          <h2 className="text-lg font-medium text-sage-800">Create New Email Template</h2>
          <p className="text-sm text-sage-500 mt-0.5">Add a new email template to the system</p>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            setError(null);
            setSuccess(false);
            setTouched({ key: false, subject: false, body: false });
          }}
          className="text-sage-400 hover:text-sage-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-coral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-coral-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-forest-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-forest-700">Email template created successfully!</p>
            </div>
          </div>
        )}

        {/* Key and Subject row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Key input */}
          <div className="space-y-1.5">
            <label htmlFor="template-key" className="block text-sm font-medium text-sage-700">
              Template Key <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              id="template-key"
              value={formState.key}
              onChange={(e) => handleFieldChange('key', e.target.value)}
              onBlur={() => handleFieldBlur('key')}
              disabled={loading}
              placeholder="welcome_email"
              className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow ${
                errors.key ? 'border-coral-300 bg-coral-50/50' : 'border-sage-200'
              }`}
            />
            {errors.key && (
              <p className="text-xs text-coral-600">{errors.key}</p>
            )}
            {!errors.key && formState.key && (
              <p className="text-xs text-forest-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Valid key format
              </p>
            )}
          </div>

          {/* Subject input */}
          <div className="space-y-1.5">
            <label htmlFor="template-subject" className="block text-sm font-medium text-sage-700">
              Subject Line <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              id="template-subject"
              value={formState.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              onBlur={() => handleFieldBlur('subject')}
              disabled={loading}
              placeholder="Welcome to Lorem Curae!"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow ${
                errors.subject ? 'border-coral-300 bg-coral-50/50' : 'border-sage-200'
              }`}
            />
            {errors.subject && (
              <p className="text-xs text-coral-600">{errors.subject}</p>
            )}
          </div>
        </div>

        {/* Body textarea */}
        <div className="space-y-1.5">
          <label htmlFor="template-body" className="block text-sm font-medium text-sage-700">
            Email Body (HTML) <span className="text-coral-500">*</span>
          </label>
          <textarea
            id="template-body"
            value={formState.body}
            onChange={(e) => handleFieldChange('body', e.target.value)}
            onBlur={() => handleFieldBlur('body')}
            disabled={loading}
            placeholder="<h1>Welcome!</h1>\n<p>Thank you for joining...</p>"
            rows={8}
            className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow resize-y ${
              errors.body ? 'border-coral-300 bg-coral-50/50' : 'border-sage-200'
            }`}
          />
          {errors.body && (
            <p className="text-xs text-coral-600">{errors.body}</p>
          )}
        </div>

        {/* Preview */}
        {formState.body && (
          <div className="bg-sage-50 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-sage-200">
              <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Preview</p>
            </div>
            <div className="p-4 bg-white border-x border-b border-sage-200 rounded-b-lg">
              <div className="text-xs text-sage-500 mb-2">
                <strong>Subject:</strong> {formState.subject || '(No subject)'}
              </div>
              <div
                className="prose prose-sm max-w-none prose-sage"
                dangerouslySetInnerHTML={{ __html: formState.body }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-sage-100">
          <p className="text-xs text-sage-400">
            {isFormValid ? 'Ready to create' : 'Fill in all required fields'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setError(null);
                setSuccess(false);
                setTouched({ key: false, subject: false, body: false });
              }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Template
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
