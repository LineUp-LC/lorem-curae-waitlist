import { useState, useCallback, useRef } from 'react';

// Types for config backup
interface FeatureFlag {
  key: string;
  value: string | number | boolean;
  type: string;
  updated_at: string;
}

interface EmailTemplate {
  key: string;
  subject: string;
  body: string;
  updated_at: string;
}

interface ConfigBackup {
  feature_flags: FeatureFlag[];
  email_templates: EmailTemplate[];
  system_settings: Record<string, unknown>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    featureFlags: number;
    emailTemplates: number;
    systemSettings: number;
  };
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Format timestamp
function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Validate config structure
function validateConfig(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let featureFlags = 0;
  let emailTemplates = 0;
  let systemSettings = 0;

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Invalid JSON: root must be an object'],
      warnings: [],
      stats: { featureFlags: 0, emailTemplates: 0, systemSettings: 0 },
    };
  }

  const config = data as Record<string, unknown>;

  // Validate feature_flags
  if ('feature_flags' in config) {
    if (!Array.isArray(config.feature_flags)) {
      errors.push('feature_flags must be an array');
    } else {
      featureFlags = config.feature_flags.length;
      config.feature_flags.forEach((flag, index) => {
        if (!flag || typeof flag !== 'object') {
          errors.push(`feature_flags[${index}] must be an object`);
        } else {
          const f = flag as Record<string, unknown>;
          if (typeof f.key !== 'string') {
            errors.push(`feature_flags[${index}].key must be a string`);
          }
          if (!['string', 'number', 'boolean'].includes(typeof f.value)) {
            errors.push(`feature_flags[${index}].value must be string, number, or boolean`);
          }
          if (typeof f.type !== 'string') {
            warnings.push(`feature_flags[${index}].type is missing or invalid`);
          }
        }
      });
    }
  }

  // Validate email_templates
  if ('email_templates' in config) {
    if (!Array.isArray(config.email_templates)) {
      errors.push('email_templates must be an array');
    } else {
      emailTemplates = config.email_templates.length;
      config.email_templates.forEach((template, index) => {
        if (!template || typeof template !== 'object') {
          errors.push(`email_templates[${index}] must be an object`);
        } else {
          const t = template as Record<string, unknown>;
          if (typeof t.key !== 'string') {
            errors.push(`email_templates[${index}].key must be a string`);
          }
          if (typeof t.subject !== 'string') {
            errors.push(`email_templates[${index}].subject must be a string`);
          }
          if (typeof t.body !== 'string') {
            errors.push(`email_templates[${index}].body must be a string`);
          }
        }
      });
    }
  }

  // Validate system_settings
  if ('system_settings' in config) {
    if (!config.system_settings || typeof config.system_settings !== 'object' || Array.isArray(config.system_settings)) {
      errors.push('system_settings must be an object');
    } else {
      systemSettings = Object.keys(config.system_settings).length;
    }
  }

  // Check if at least one section exists
  if (!('feature_flags' in config) && !('email_templates' in config) && !('system_settings' in config)) {
    errors.push('At least one of feature_flags, email_templates, or system_settings must be present');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { featureFlags, emailTemplates, systemSettings },
  };
}

export default function ConfigBackupPage() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{ date: Date; size: number } | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedConfig, setParsedConfig] = useState<ConfigBackup | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAdminSecret = () => import.meta.env.VITE_ADMIN_SECRET;

  // Export configuration
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      setExportError(null);

      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/config-backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error(`Export failed (${response.status})`);
      }

      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `config-backup-${timestamp}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastExport({ date: new Date(), size: jsonString.length });
    } catch (err) {
      console.error('[ConfigBackup] Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, []);

  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedFile(null);
      setParsedConfig(null);
      setParseError(null);
      setValidation(null);
      return;
    }

    setUploadedFile(file);
    setRestoreSuccess(false);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setParsedConfig(parsed);
        setParseError(null);

        const validationResult = validateConfig(parsed);
        setValidation(validationResult);
      } catch (err) {
        setParsedConfig(null);
        setParseError(err instanceof Error ? err.message : 'Failed to parse JSON');
        setValidation(null);
      }
    };
    reader.onerror = () => {
      setParsedConfig(null);
      setParseError('Failed to read file');
      setValidation(null);
    };
    reader.readAsText(file);
  }, []);

  // Clear uploaded file
  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setParsedConfig(null);
    setParseError(null);
    setValidation(null);
    setRestoreError(null);
    setRestoreSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Restore configuration
  const handleRestore = useCallback(async () => {
    if (!parsedConfig || !validation?.valid) return;

    try {
      setRestoring(true);
      setRestoreError(null);
      setRestoreSuccess(false);

      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/config-restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Restore failed (${response.status})`);
      }

      setRestoreSuccess(true);

      // Clear success after 5 seconds
      setTimeout(() => {
        setRestoreSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('[ConfigBackup] Restore failed:', err);
      setRestoreError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoring(false);
    }
  }, [parsedConfig, validation]);

  const canRestore = parsedConfig && validation?.valid && !restoring;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-sage-900">Configuration Backup & Restore</h1>
        <p className="mt-1 text-sage-500">
          Export and restore system configuration safely
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100 bg-sage-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-sage-800">Export Configuration</h2>
              <p className="text-sm text-sage-500">Download a complete backup of all system settings</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-sage-600">
                This will export feature flags, email templates, and system settings.
              </p>
              {lastExport && (
                <p className="text-xs text-sage-400">
                  Last export: {formatTimestamp(lastExport.date)} ({formatFileSize(lastExport.size)})
                </p>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Backup
                </>
              )}
            </button>
          </div>

          {exportError && (
            <div className="mt-4 bg-coral-50 border border-coral-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-coral-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{exportError}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100 bg-sage-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-sage-800">Import Configuration</h2>
              <p className="text-sm text-sage-500">Upload a backup file to preview and restore</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* File input */}
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-sage-200 rounded-lg hover:border-sage-400 hover:bg-sage-50/50 transition-colors cursor-pointer">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-2 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-sage-600">
                    {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-sage-400 mt-1">
                    {uploadedFile ? formatFileSize(uploadedFile.size) : 'JSON files only'}
                  </p>
                </div>
              </div>
            </label>
            {uploadedFile && (
              <button
                onClick={handleClearFile}
                className="p-2 text-sage-400 hover:text-sage-600 transition-colors"
                title="Clear file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-coral-800">Invalid JSON file</p>
                  <p className="text-sm text-coral-600 mt-0.5">{parseError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation results */}
          {validation && (
            <div className="space-y-3">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-sage-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-sage-800">{validation.stats.featureFlags}</p>
                  <p className="text-xs text-sage-500">Feature Flags</p>
                </div>
                <div className="bg-sage-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-sage-800">{validation.stats.emailTemplates}</p>
                  <p className="text-xs text-sage-500">Email Templates</p>
                </div>
                <div className="bg-sage-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-sage-800">{validation.stats.systemSettings}</p>
                  <p className="text-xs text-sage-500">System Settings</p>
                </div>
              </div>

              {/* Validation errors */}
              {validation.errors.length > 0 && (
                <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-coral-800">Validation Errors</p>
                      <ul className="text-sm text-coral-600 mt-1 list-disc list-inside space-y-0.5">
                        {validation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation warnings */}
              {validation.warnings.length > 0 && (
                <div className="bg-cream-50 border border-cream-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cream-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-cream-800">Warnings</p>
                      <ul className="text-sm text-cream-700 mt-1 list-disc list-inside space-y-0.5">
                        {validation.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Valid indicator */}
              {validation.valid && (
                <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-forest-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium text-forest-700">Configuration file is valid and ready to restore</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON preview */}
          {parsedConfig && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-sage-700">Preview</p>
                <p className="text-xs text-sage-400">
                  {formatFileSize(JSON.stringify(parsedConfig).length)}
                </p>
              </div>
              <pre className="bg-sage-50 border border-sage-200 rounded-lg p-4 text-xs font-mono text-sage-700 overflow-auto max-h-64">
                {JSON.stringify(parsedConfig, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100 bg-sage-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${canRestore ? 'bg-cream-100' : 'bg-sage-100'}`}>
              <svg className={`w-5 h-5 ${canRestore ? 'text-cream-600' : 'text-sage-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-sage-800">Restore Configuration</h2>
              <p className="text-sm text-sage-500">Apply the imported configuration to the system</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-cream-50 border border-cream-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cream-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-cream-800">Warning: This action will overwrite existing configuration</p>
                <p className="text-sm text-cream-700 mt-0.5">
                  All feature flags, email templates, and system settings in the backup will replace the current values.
                  This action cannot be undone. Make sure to export a backup first.
                </p>
              </div>
            </div>
          </div>

          {/* Restore error */}
          {restoreError && (
            <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-coral-800">Restore failed</p>
                  <p className="text-sm text-coral-600">{restoreError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Restore success */}
          {restoreSuccess && (
            <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-forest-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-forest-800">Configuration restored successfully!</p>
                  <p className="text-sm text-forest-600">All settings have been applied. The changes are now active.</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-sage-500">
              {!uploadedFile && 'Upload a configuration file to enable restore'}
              {uploadedFile && !validation?.valid && 'Fix validation errors to enable restore'}
              {canRestore && 'Ready to restore configuration'}
            </p>
            <button
              onClick={handleRestore}
              disabled={!canRestore}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cream-600 rounded-lg hover:bg-cream-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-sage-400"
            >
              {restoring ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restoring...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="text-center text-xs text-sage-400 py-2">
        Configuration backups include feature flags, email templates, and system settings
      </div>
    </div>
  );
}
