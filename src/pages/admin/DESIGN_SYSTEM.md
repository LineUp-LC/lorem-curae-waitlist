# Admin Dashboard Design System

## Overview

This document defines the design system for the Lorem Curae Admin Dashboard. It provides guidelines for maintaining visual consistency across all admin pages.

---

## Color Tokens

### Primary Colors

| Token | Light Mode | Usage |
|-------|------------|-------|
| `forest-50` | `#F0F5F2` | Backgrounds, subtle highlights |
| `forest-100` | `#D8E5DC` | Hover states, light backgrounds |
| `forest-500` | `#4B7C5C` | Primary actions, active states |
| `forest-600` | `#3D6A4C` | Primary buttons |
| `forest-700` | `#2F583D` | Primary button hover |

### Neutral Colors (Sage)

| Token | Usage |
|-------|-------|
| `sage-50` | Page backgrounds |
| `sage-100` | Card borders, dividers |
| `sage-200` | Input borders |
| `sage-300` | Disabled states |
| `sage-400` | Placeholder text |
| `sage-500` | Secondary text |
| `sage-600` | Body text |
| `sage-700` | Primary text |
| `sage-800` | Headings |
| `sage-900` | Dark text |

### Semantic Colors

| Token | Usage |
|-------|-------|
| `coral-*` | Errors, destructive actions, critical alerts |
| `amber-*` | Warnings, caution states |
| `sky-*` | Info, neutral highlights |
| `purple-*` | Admin actions, special categories |
| `cream-*` | Pending states, secondary warnings |

---

## Typography Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-2xl font-semibold` | 24px | 600 | Page titles |
| `text-lg font-medium` | 18px | 500 | Card headers, section titles |
| `text-base font-semibold` | 16px | 600 | Section headers |
| `text-sm font-medium` | 14px | 500 | Labels, nav items |
| `text-sm` | 14px | 400 | Body text |
| `text-xs font-medium` | 12px | 500 | Badges, small labels |
| `text-xs` | 12px | 400 | Captions, hints |
| `text-[10px] uppercase tracking-wider` | 10px | 600 | Overlines, group labels |

---

## Spacing Scale

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1`, `p-1`, `m-1` | 4px | Tight spacing |
| `gap-2`, `p-2`, `m-2` | 8px | Small spacing |
| `gap-3`, `p-3`, `m-3` | 12px | Medium spacing |
| `gap-4`, `p-4`, `m-4` | 16px | Default spacing |
| `gap-5`, `p-5`, `m-5` | 20px | Section padding |
| `gap-6`, `p-6`, `m-6` | 24px | Card padding, large gaps |
| `gap-8`, `p-8`, `m-8` | 32px | Page sections |

---

## Component Patterns

### Buttons

```tsx
// Primary - main actions
<Button variant="primary">Save Changes</Button>

// Secondary - default actions
<Button variant="secondary">Cancel</Button>

// Danger - destructive actions
<Button variant="danger">Delete</Button>

// Subtle - less prominent actions
<Button variant="subtle">Learn More</Button>

// Ghost - minimal visual weight
<Button variant="ghost">View All</Button>
```

**Button Sizes:**
- `sm` - 24px height, 12px text
- `md` - 32px height, 14px text (default)
- `lg` - 40px height, 16px text

### Badges

```tsx
// Status badges
<StatusBadge status="active" />     // Green
<StatusBadge status="pending" />    // Yellow/Cream
<StatusBadge status="disabled" />   // Red

// Severity badges
<SeverityBadge severity="low" />      // Green
<SeverityBadge severity="medium" />   // Yellow
<SeverityBadge severity="high" />     // Orange
<SeverityBadge severity="critical" /> // Red

// Category badges
<CategoryBadge category="incident" />     // Red
<CategoryBadge category="email" />        // Purple
<CategoryBadge category="health" />       // Green
<CategoryBadge category="admin_action" /> // Purple

// Boolean badges
<BooleanBadge value={true} trueLabel="Verified" falseLabel="Unverified" />
```

### Cards

```tsx
// Basic card
<Card>
  <CardHeader title="Section Title" subtitle="Optional subtitle" />
  <CardBody>{content}</CardBody>
</Card>

// Section card with loading/error/empty states
<SectionCard
  title="Data Section"
  loading={isLoading}
  error={error}
  isEmpty={data.length === 0}
  emptyMessage="No data found"
>
  {content}
</SectionCard>
```

### Tables

```tsx
<Table
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]}
  data={items}
  keyExtractor={(item) => item.id}
  onRowClick={(item) => navigate(`/admin/item/${item.id}`)}
/>
```

**Table styling:**
- Alternating row colors: `bg-white` / `bg-sage-50/30`
- Header: `bg-sage-50/50`
- Hover: `bg-sage-50/50`
- Selected: `bg-forest-50 ring-1 ring-inset ring-forest-200`

### Modals

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Optional description"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={onConfirm}>Confirm</Button>
    </>
  }
>
  {content}
</Modal>

// Confirmation modal
<ConfirmModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Item?"
  message="This action cannot be undone."
  variant="danger"
/>
```

### Form Inputs

```tsx
// Text input
<Input
  label="Email"
  placeholder="Enter email"
  error={errors.email}
  hint="We'll never share your email"
/>

// Select
<Select
  label="Category"
  options={[
    { value: 'all', label: 'All Categories' },
    { value: 'email', label: 'Email' },
  ]}
/>

// Toggle
<Toggle
  label="Enable Feature"
  description="Turn on to enable this feature"
  checked={enabled}
  onChange={setEnabled}
/>
```

---

## Loading & Error States

### Loading State

```tsx
// Inline spinner
<LoadingSpinner size="sm" />

// Full section loading
<LoadingState message="Loading data..." />

// Skeleton loading
<SkeletonTable rows={5} columns={4} />
<SkeletonCard />
<SkeletonText lines={3} />
```

### Error State

```tsx
// Inline error
<ErrorState variant="inline" message="Failed to load" onRetry={retry} />

// Banner error (dismissible)
<ErrorBanner
  title="Connection Error"
  message="Unable to reach the server"
  onRetry={retry}
/>

// Full page error
<ErrorState
  variant="fullPage"
  title="Something went wrong"
  message="We couldn't load this page"
  onRetry={retry}
/>
```

### Empty State

```tsx
<EmptyState
  title="No results"
  message="Try adjusting your filters"
  variant="search"
  action={<Button onClick={clearFilters}>Clear Filters</Button>}
/>
```

---

## Page Structure

### Standard Page Layout

```tsx
export default function MyPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Page Title"
        subtitle="Page description"
        actions={<Button>Action</Button>}
      />

      {/* Status/Filter Bar */}
      <div className="flex items-center gap-4">
        {/* Filters, stats, etc. */}
      </div>

      {/* Main Content */}
      <SectionCard title="Section">
        {/* Content */}
      </SectionCard>
    </div>
  );
}
```

---

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Pages: `page.tsx` in folder (e.g., `user-profile/page.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)

### CSS Classes
- Use Tailwind utility classes
- Group related classes: layout, spacing, typography, colors
- Use consistent ordering: position, display, size, spacing, typography, colors

### Types
- Interfaces: `PascalCase` (e.g., `UserProfile`)
- Props: `ComponentNameProps` (e.g., `ButtonProps`)
- State: `FetchState<T>`, `ComponentState`

---

## API Patterns

### Fetch Pattern

```tsx
const [state, setState] = useState<FetchState<DataType>>({
  data: null,
  loading: true,
  error: null,
});

const fetchData = useCallback(async () => {
  setState(prev => ({ ...prev, loading: true, error: null }));

  try {
    const res = await fetch('/api/endpoint', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setState({ data, loading: false, error: null });
  } catch (err) {
    setState({
      data: null,
      loading: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

## Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`)
- Include `aria-label` for icon-only buttons
- Modals trap focus and can be closed with Escape
- Form inputs have associated labels
- Color is not the only indicator of state (use icons, text)
- Sufficient color contrast (4.5:1 for normal text)

---

## Phase 3 Completion Summary

### What the Admin Toolkit Now Includes

1. **Component Library** (`src/pages/admin/components/ui/`)
   - Button, Badge, Card, Table, Modal
   - Input, Select, Toggle, Checkbox
   - PageHeader, SectionHeader
   - EmptyState, LoadingSpinner, ErrorState
   - All banners (Error, Warning, Info)

2. **Admin Pages**
   - Dashboard, Waitlist Analytics, Wave Analytics
   - Email Analytics, Email Events, Email Templates
   - Activity Log, Health Checks, Feature Flags
   - Search Users, User Details, User Profile, User Simulation
   - Incidents, Metrics, Notifications
   - Tools, Live Logs, Activity Stream

3. **Global Layout**
   - Collapsible sidebar with grouped navigation
   - Header with breadcrumbs and notifications
   - Mobile-responsive design
   - Consistent spacing and styling

### Capabilities Unlocked

- **User Management**: Search, view, simulate user experiences
- **Monitoring**: Real-time metrics, health checks, incidents
- **Communication**: Email analytics, templates, events
- **Operations**: Activity logs, notifications, feature flags
- **Scalability**: Reusable component library for future pages

### Phase 4 Foundation

The admin toolkit is now ready for Phase 4 features:
- Advanced analytics dashboards
- Bulk operations (multi-select, batch actions)
- Real-time updates (WebSocket integration)
- Export/import functionality
- Role-based access control UI
- Dark mode theming
