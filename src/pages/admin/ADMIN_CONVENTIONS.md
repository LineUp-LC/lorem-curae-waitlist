# Lorem Curae Admin Toolkit - Conventions & Guidelines

## Phase 3 Consistency Audit Checklist

This document defines the naming conventions, file structure, component usage patterns, and best practices for the Lorem Curae Admin Toolkit.

---

## 1. Naming Conventions

### File Naming
| Type | Convention | Example |
|------|------------|---------|
| Page components | `page.tsx` in feature folder | `admin/search/page.tsx` |
| Panel components | `PascalCase` + `Panel.tsx` | `EditUserPanel.tsx` |
| UI components | `PascalCase.tsx` | `Button.tsx`, `Card.tsx` |
| Layout components | `PascalCase.tsx` | `AdminLayout.tsx` |
| Utility files | `camelCase.ts` | `apiHelpers.ts` |
| Type files | `camelCase.types.ts` | `waitlist.types.ts` |
| Hook files | `use` + `PascalCase.ts` | `useWaitlistData.ts` |

### Component Naming
- Use `PascalCase` for all component names
- Prefix with context where needed: `AdminLayout`, `AdminSidebar`
- Use descriptive, action-oriented names for panels: `EditUserPanel`, `DeleteUserPanel`
- Preset components should describe their purpose: `StatusBadge`, `SeverityBadge`

### Variable Naming
- Use `camelCase` for variables, functions, and props
- Use `SCREAMING_SNAKE_CASE` for constants
- Prefix booleans with `is`, `has`, `can`, `should`
- Use descriptive names: `userList`, not `data`

### CSS Class Naming
- Use Tailwind utility classes directly
- Group related classes logically
- Put responsive modifiers in order: base, `sm:`, `md:`, `lg:`, `xl:`
- Put state modifiers after responsive: `hover:`, `focus:`, `disabled:`
- Put dark mode last: `dark:`

```tsx
// Good
className="px-4 py-2 text-sm font-medium bg-white hover:bg-sage-50 dark:bg-sage-800"

// Avoid: Unorganized
className="hover:bg-sage-50 px-4 text-sm py-2 bg-white"
```

---

## 2. File Structure Conventions

```
src/pages/admin/
├── components/
│   ├── ui/                    # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   ├── PageHeader.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorState.tsx
│   │   ├── index.ts           # Unified exports
│   │   └── DESIGN_SYSTEM.md   # Design system docs
│   ├── AdminLayout.tsx        # Main layout
│   ├── AdminSidebar.tsx       # Sidebar navigation
│   ├── AdminHeader.tsx        # Top header bar
│   └── StatCard.tsx           # Dashboard stat cards
├── [feature]/                 # Feature folders
│   ├── page.tsx               # Main page component
│   └── [Action]Panel.tsx      # Action panels (Edit, Delete, etc.)
├── page.tsx                   # Dashboard (index)
└── ADMIN_CONVENTIONS.md       # This file
```

### Feature Folder Structure
Each admin feature should follow this structure:
```
feature-name/
├── page.tsx                   # Main page component
├── EditPanel.tsx              # Optional: Edit form panel
├── CreatePanel.tsx            # Optional: Create form panel
├── DeletePanel.tsx            # Optional: Delete confirmation
└── hooks/                     # Optional: Feature-specific hooks
    └── useFeatureData.ts
```

---

## 3. Component Usage Conventions

### Importing Components
Always import from the unified index:
```tsx
// Good
import { Button, Badge, Card, Table } from '@/pages/admin/components/ui';

// Avoid
import { Button } from '@/pages/admin/components/ui/Button';
import { Badge } from '@/pages/admin/components/ui/Badge';
```

### Component Prop Patterns
```tsx
// Standard props interface
interface ComponentProps {
  // Required props first
  data: DataType;

  // Optional props with defaults
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';

  // Event handlers
  onClick?: () => void;
  onClose?: () => void;

  // Optional customization
  className?: string;
  children?: ReactNode;
}
```

### Button Usage Rules
| Context | Variant | Size |
|---------|---------|------|
| Primary page action | `primary` | `md` or `lg` |
| Secondary action | `secondary` | `md` |
| Destructive action | `danger` | `md` |
| Inline table action | `ghost` or `subtle` | `sm` |
| Form cancel | `secondary` | `md` |
| Form submit | `primary` | `md` |
| Modal cancel | `secondary` | `md` |
| Modal confirm (danger) | `danger` | `md` |

### Badge Usage Rules
| Status | Variant |
|--------|---------|
| Active, Healthy, Enabled, Resolved | `success` |
| Pending, Investigating, Degraded | `warning` |
| Failed, Error, Disabled, Unhealthy | `error` |
| Critical, Open (incident) | `critical` |
| Info, System | `info` |
| Admin, Email category | `purple` |
| Default/Unknown | `default` |

### Card Usage Rules
- Use `Card` for grouping related content
- Use `SectionCard` when you need loading/error/empty states built-in
- Always include `CardHeader` with title for context
- Use `CardFooter` for actions that apply to the card content

### Table Layout Rules
- Always define columns with explicit `key`, `header`, and `render`
- Use `keyExtractor` to provide unique keys
- Provide meaningful `emptyMessage` for empty states
- Use `loading` prop during data fetches
- For clickable rows, use `onRowClick` and visual feedback via `selectedKey`

---

## 4. API Fetch Patterns

### Standard Fetch Pattern
```tsx
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch('/api/admin/endpoint', {
      headers: {
        'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    setData(result.data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [/* dependencies */]);
```

### Mutation Pattern
```tsx
const [mutating, setMutating] = useState(false);

const handleMutation = async (payload: PayloadType) => {
  setMutating(true);
  try {
    const response = await fetch('/api/admin/endpoint', {
      method: 'POST', // or PUT, DELETE
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Operation failed');
    }
    // Refresh data or update local state
    await fetchData();
    // Show success feedback
  } catch (err) {
    // Show error feedback
  } finally {
    setMutating(false);
  }
};
```

### API Headers
Always include the admin secret header:
```tsx
headers: {
  'Content-Type': 'application/json',
  'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '',
}
```

---

## 5. Error Handling Patterns

### Page-Level Errors
Use `ErrorState` with `variant="fullPage"` or `variant="card"`:
```tsx
if (error) {
  return (
    <ErrorState
      variant="fullPage"
      message={error}
      onRetry={fetchData}
    />
  );
}
```

### Section-Level Errors
Use `ErrorState` with `variant="banner"`:
```tsx
{error && (
  <ErrorBanner
    title="Failed to load"
    message={error}
    onRetry={fetchData}
    onDismiss={() => setError(null)}
  />
)}
```

### Inline Errors
Use `ErrorState` with `variant="inline"`:
```tsx
{error && (
  <ErrorState
    variant="inline"
    message={error}
    onRetry={retry}
  />
)}
```

### Form Validation Errors
Use the `error` prop on form components:
```tsx
<Input
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

---

## 6. Loading Patterns

### Page-Level Loading
Use `LoadingState` for initial page loads:
```tsx
if (loading) {
  return <LoadingState message="Loading data..." />;
}
```

### Section-Level Loading
Use skeleton components:
```tsx
if (loading) {
  return <SkeletonTable rows={5} columns={4} />;
}
```

### Inline Loading
Use `LoadingSpinner`:
```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

### Overlay Loading
Use `LoadingOverlay` for operations that shouldn't block interaction:
```tsx
<div className="relative">
  <Table ... />
  {refreshing && <LoadingOverlay message="Refreshing..." />}
</div>
```

---

## 7. Empty State Patterns

### No Data
```tsx
<EmptyState
  variant="default"
  message="No users in the waitlist yet."
  action={<Button onClick={openAddDialog}>Add User</Button>}
/>
```

### No Search Results
```tsx
<EmptyState
  variant="search"
  title="No results found"
  message="Try adjusting your search or filter criteria."
  action={<Button variant="subtle" onClick={clearFilters}>Clear Filters</Button>}
/>
```

### All Caught Up
```tsx
<EmptyState
  variant="success"
  message="You're all caught up! No pending items."
/>
```

---

## 8. Modal Patterns

### Confirmation Modal
Use `ConfirmModal` for destructive actions:
```tsx
<ConfirmModal
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  title="Delete User"
  message="Are you sure you want to delete this user? This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  loading={deleting}
/>
```

### Form Modal
Use `Modal` with custom content:
```tsx
<Modal
  isOpen={showEdit}
  onClose={() => setShowEdit(false)}
  title="Edit User"
  size="lg"
  footer={
    <>
      <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
    </>
  }
>
  {/* Form content */}
</Modal>
```

---

## 9. Accessibility Checklist

- [ ] All buttons have visible focus states
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] Modals have `aria-modal="true"` and proper titles
- [ ] Color is not the only indicator of state
- [ ] Interactive elements are keyboard accessible
- [ ] Tab order follows logical flow
- [ ] Error messages are associated with inputs
- [ ] Loading states are announced to screen readers
- [ ] Sufficient color contrast (WCAG AA)

---

## 10. Performance Guidelines

- Use `useMemo` for expensive computations
- Use `useCallback` for callbacks passed to child components
- Implement pagination for large data sets (50+ items)
- Use skeleton loaders instead of spinners for better perceived performance
- Lazy load panels/modals that aren't immediately visible
- Debounce search/filter inputs (300ms recommended)

---

## 11. Testing Patterns

### Component Testing Priorities
1. User interactions (clicks, form submissions)
2. Conditional rendering (loading, error, empty states)
3. Data transformations
4. Edge cases (empty data, missing fields)

### Test File Naming
```
Component.test.tsx
useHook.test.ts
utils.test.ts
```

---

## 12. Code Organization

### Component File Structure
```tsx
// 1. Imports
import { useState } from 'react';
import { Button, Card } from '@/pages/admin/components/ui';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Constants
const ITEMS_PER_PAGE = 20;

// 4. Helper functions (if small and component-specific)
function formatDate(date: string) {
  // ...
}

// 5. Component
export function Component({ ...props }: ComponentProps) {
  // State
  const [data, setData] = useState();

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render helpers
  const renderItem = (item: ItemType) => {
    // ...
  };

  // Early returns
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  // Main render
  return (
    // ...
  );
}

// 6. Default export (optional)
export default Component;
```

---

## Quick Reference Checklist

### Before Creating a New Page
- [ ] Component imports from unified index
- [ ] Page uses `PageHeader` for title
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] API calls use standard pattern
- [ ] Buttons follow usage rules
- [ ] Badges follow color rules
- [ ] Dark mode classes included

### Before PR Review
- [ ] No console.logs in production code
- [ ] No unused imports
- [ ] No hardcoded strings (use constants)
- [ ] Error boundaries in place
- [ ] Accessibility attributes present
- [ ] Responsive design tested
- [ ] Dark mode tested
