import { useState, useEffect, useCallback, useMemo } from 'react';
import { CreateEmailTemplatePanel } from './CreateEmailTemplatePanel';

// Types for API response
interface EmailTemplate {
  key: string;
  subject: string;
  body: string;
  updated_at: string;
}

interface EmailTemplatesResponse {
  templates: EmailTemplate[];
}

// Editor state
interface EditorState {
  subject: string;
  body: string;
}

// Format timestamp for display
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format template key for display
function formatTemplateKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Template list item component
function TemplateListItem({
  template,
  isSelected,
  hasUnsavedChanges,
  onClick,
}: {
  template: EmailTemplate;
  isSelected: boolean;
  hasUnsavedChanges: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-sage-100 transition-colors ${
        isSelected
          ? 'bg-sage-100 border-l-2 border-l-sage-600'
          : 'hover:bg-sage-50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${isSelected ? 'text-sage-900' : 'text-sage-700'}`}>
          {formatTemplateKey(template.key)}
        </span>
        {hasUnsavedChanges && isSelected && (
          <span className="w-2 h-2 rounded-full bg-cream-500 flex-shrink-0" title="Unsaved changes" />
        )}
      </div>
      <p className="text-xs text-sage-500 mt-0.5 truncate font-mono">
        {template.key}
      </p>
    </button>
  );
}

// Email preview container component
function EmailPreview({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="h-full flex flex-col">
      {/* Email client header */}
      <div className="bg-sage-100 border-b border-sage-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-coral-400" />
          <div className="w-3 h-3 rounded-full bg-cream-400" />
          <div className="w-3 h-3 rounded-full bg-forest-400" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-sage-500 w-12">From:</span>
            <span className="text-sage-700">Lorem Curae &lt;hello@loremcurae.com&gt;</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-sage-500 w-12">To:</span>
            <span className="text-sage-700">user@example.com</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-sage-500 w-12">Subject:</span>
            <span className="text-sage-800 font-medium">{subject || '(No subject)'}</span>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-auto bg-white p-6">
        {body ? (
          <div
            className="prose prose-sm max-w-none prose-sage"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="text-sage-400 italic text-sm">No content to preview</p>
        )}
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({ subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get the currently selected template
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.key === selectedKey) ?? null,
    [templates, selectedKey]
  );

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedTemplate) return false;
    return (
      editorState.subject !== selectedTemplate.subject ||
      editorState.body !== selectedTemplate.body
    );
  }, [selectedTemplate, editorState]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/email-templates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - check admin credentials');
        }
        throw new Error(`Failed to fetch email templates (${response.status})`);
      }

      const data: EmailTemplatesResponse = await response.json();
      setTemplates(data.templates || []);

      // Select the first template if none selected
      if (!selectedKey && data.templates.length > 0) {
        const firstTemplate = data.templates[0];
        setSelectedKey(firstTemplate.key);
        setEditorState({
          subject: firstTemplate.subject,
          body: firstTemplate.body,
        });
      }
    } catch (err) {
      console.error('[EmailTemplates] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle template selection
  const handleSelectTemplate = (key: string) => {
    const template = templates.find((t) => t.key === key);
    if (template) {
      setSelectedKey(key);
      setEditorState({
        subject: template.subject,
        body: template.body,
      });
      setSaveSuccess(false);
      setSaveError(null);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedKey || !hasUnsavedChanges) return;

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      // Build update payload - only include changed fields
      const payload: { key: string; subject?: string; body?: string } = {
        key: selectedKey,
      };

      if (selectedTemplate && editorState.subject !== selectedTemplate.subject) {
        payload.subject = editorState.subject;
      }
      if (selectedTemplate && editorState.body !== selectedTemplate.body) {
        payload.body = editorState.body;
      }

      const response = await fetch('/api/admin/update-email-template', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update template (${response.status})`);
      }

      // Update local state with new values and timestamp
      setTemplates((prev) =>
        prev.map((t) =>
          t.key === selectedKey
            ? {
                ...t,
                subject: editorState.subject,
                body: editorState.body,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('[EmailTemplates] Failed to save:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Handle discard changes
  const handleDiscard = () => {
    if (selectedTemplate) {
      setEditorState({
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      });
      setSaveError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Email Templates</h1>
          <p className="mt-1 text-sage-500">
            Edit and preview system email content
          </p>
        </div>
        <button
          onClick={fetchTemplates}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load email templates</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchTemplates}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Create new template panel */}
      <CreateEmailTemplatePanel onTemplateCreated={fetchTemplates} />

      {/* Main content */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="grid grid-cols-12 min-h-[600px]">
          {/* Template list sidebar */}
          <div className="col-span-3 border-r border-sage-100 flex flex-col">
            <div className="px-4 py-3 border-b border-sage-100 bg-sage-50/50">
              <h2 className="text-sm font-semibold text-sage-700 uppercase tracking-wider">
                Templates
              </h2>
              <p className="text-xs text-sage-500 mt-0.5">
                {templates.length} template{templates.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-4 bg-sage-100 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-sage-100 rounded w-1/2 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <TemplateListItem
                    key={template.key}
                    template={template}
                    isSelected={selectedKey === template.key}
                    hasUnsavedChanges={selectedKey === template.key && hasUnsavedChanges}
                    onClick={() => handleSelectTemplate(template.key)}
                  />
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-sage-500">No templates found</p>
                </div>
              )}
            </div>
          </div>

          {/* Editor panel */}
          <div className="col-span-5 border-r border-sage-100 flex flex-col">
            <div className="px-4 py-3 border-b border-sage-100 bg-sage-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-sage-700 uppercase tracking-wider">
                  Editor
                </h2>
                {selectedTemplate && (
                  <p className="text-xs text-sage-500 mt-0.5">
                    Last updated: {formatTimestamp(selectedTemplate.updated_at)}
                  </p>
                )}
              </div>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cream-100 text-cream-700 border border-cream-200">
                  Unsaved changes
                </span>
              )}
            </div>

            {selectedTemplate ? (
              <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
                {/* Template key badge */}
                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono bg-sage-100 text-sage-700 border border-sage-200">
                    {selectedTemplate.key}
                  </span>
                </div>

                {/* Subject field */}
                <div className="space-y-1.5">
                  <label htmlFor="template-subject" className="block text-sm font-medium text-sage-700">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    id="template-subject"
                    value={editorState.subject}
                    onChange={(e) => setEditorState((prev) => ({ ...prev, subject: e.target.value }))}
                    disabled={saving}
                    placeholder="Enter email subject..."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow ${
                      editorState.subject !== selectedTemplate.subject
                        ? 'border-cream-300 bg-cream-50/50'
                        : 'border-sage-200'
                    }`}
                  />
                </div>

                {/* Body field */}
                <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
                  <label htmlFor="template-body" className="block text-sm font-medium text-sage-700">
                    Email Body (HTML)
                  </label>
                  <textarea
                    id="template-body"
                    value={editorState.body}
                    onChange={(e) => setEditorState((prev) => ({ ...prev, body: e.target.value }))}
                    disabled={saving}
                    placeholder="Enter email body HTML..."
                    className={`flex-1 w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow resize-none min-h-[200px] ${
                      editorState.body !== selectedTemplate.body
                        ? 'border-cream-300 bg-cream-50/50'
                        : 'border-sage-200'
                    }`}
                  />
                </div>

                {/* Save error */}
                {saveError && (
                  <div className="bg-coral-50 border border-coral-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-coral-700">{saveError}</p>
                    </div>
                  </div>
                )}

                {/* Save success */}
                {saveSuccess && (
                  <div className="bg-forest-50 border border-forest-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-forest-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-forest-700">Template saved successfully!</p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-sage-100">
                  {hasUnsavedChanges && (
                    <button
                      onClick={handleDiscard}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors disabled:opacity-50"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-sm text-sage-500">Select a template to edit</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="col-span-4 flex flex-col">
            <div className="px-4 py-3 border-b border-sage-100 bg-sage-50/50">
              <h2 className="text-sm font-semibold text-sage-700 uppercase tracking-wider">
                Preview
              </h2>
              <p className="text-xs text-sage-500 mt-0.5">
                Live preview of rendered email
              </p>
            </div>

            {selectedTemplate ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden">
                  <EmailPreview
                    subject={editorState.subject}
                    body={editorState.body}
                  />
                </div>

                {/* Version history placeholder */}
                <div className="border-t border-sage-100 px-4 py-3 bg-sage-50/30">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-sage-500">
                      Version History
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sage-200 text-sage-600">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 bg-sage-50/30">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-sm text-sage-500">Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
