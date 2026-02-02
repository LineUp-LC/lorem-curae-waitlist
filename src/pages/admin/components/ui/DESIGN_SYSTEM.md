# Lorem Curae Admin Design System

## Phase 3 Integration & Polish Pass

This document defines the unified design system for the Lorem Curae Admin Toolkit.

---

## 1. Color Tokens

### Primary Palette (Tailwind Extended Colors)

| Token     | Light Mode          | Usage                                    |
|-----------|---------------------|------------------------------------------|
| **sage**  | 50-900 scale        | Neutral backgrounds, text, borders       |
| **forest**| 50-900 scale        | Primary actions, success states          |
| **coral** | 50-900 scale        | Danger actions, errors, warnings         |
| **cream** | 50-900 scale        | Warm accents (minimal use in admin)      |

### Semantic Color Mapping

| Semantic Use    | Light Mode Classes                              | Dark Mode Classes (future)                |
|-----------------|------------------------------------------------|-------------------------------------------|
| Background      | `bg-sage-50/50`, `bg-white`                    | `dark:bg-sage-900`, `dark:bg-sage-800`    |
| Surface         | `bg-white`                                      | `dark:bg-sage-800`                        |
| Border          | `border-sage-100`, `border-sage-200`           | `dark:border-sage-700`                    |
| Text Primary    | `text-sage-800`, `text-sage-900`               | `dark:text-sage-100`                      |
| Text Secondary  | `text-sage-500`, `text-sage-600`               | `dark:text-sage-400`                      |
| Text Muted      | `text-sage-400`                                | `dark:text-sage-500`                      |
| Primary Action  | `bg-forest-600`, `text-white`                  | `dark:bg-forest-500`                      |
| Danger Action   | `bg-coral-600`, `text-white`                   | `dark:bg-coral-500`                       |
| Success         | `bg-forest-50`, `text-forest-700`              | `dark:bg-forest-900/50`                   |
| Warning         | `bg-amber-50`, `text-amber-700`                | `dark:bg-amber-900/50`                    |
| Error           | `bg-coral-50`, `text-coral-700`                | `dark:bg-coral-900/50`                    |
| Info            | `bg-sky-50`, `text-sky-700`                    | `dark:bg-sky-900/50`                      |

### Status Color Rules

```
active, resolved, healthy, ok, enabled  → success (forest)
pending, investigating, warning, degraded → warning (amber)
disabled, failed, error, unhealthy       → error (coral)
open, critical                           → critical (red-800)
```

---

## 2. Typography Scale

### Font Families
- **Headings**: Inter (sans-serif) - `font-sans`
- **Body**: Inter (sans-serif) - `font-sans`
- **Display**: Cormorant Garamond (serif) - `font-serif` (used on public pages)

### Size Scale

| Name      | Class          | Size    | Line Height | Usage                       |
|-----------|----------------|---------|-------------|----------------------------|
| xs        | `text-xs`      | 12px    | 16px        | Labels, badges, hints       |
| sm        | `text-sm`      | 14px    | 20px        | Body text, table cells      |
| base      | `text-base`    | 16px    | 24px        | Large body text             |
| lg        | `text-lg`      | 18px    | 28px        | Card titles, section heads  |
| xl        | `text-xl`      | 20px    | 28px        | Minor headings              |
| 2xl       | `text-2xl`     | 24px    | 32px        | Page titles                 |

### Font Weights
- Regular: `font-normal` (400)
- Medium: `font-medium` (500)
- Semibold: `font-semibold` (600)
- Bold: `font-bold` (700)

---

## 3. Spacing Scale

| Token | Value | Tailwind | Usage                              |
|-------|-------|----------|-----------------------------------|
| 1     | 4px   | `1`      | Tight gaps, icon margins          |
| 1.5   | 6px   | `1.5`    | Badge padding                     |
| 2     | 8px   | `2`      | Button padding (sm), input gaps   |
| 3     | 12px  | `3`      | Component internal spacing        |
| 4     | 16px  | `4`      | Card padding (sm), section gaps   |
| 5     | 20px  | `5`      | Card padding (md)                 |
| 6     | 24px  | `6`      | Card padding (lg), page sections  |
| 8     | 32px  | `8`      | Major section spacing             |
| 12    | 48px  | `12`     | Empty state padding               |

### Standard Spacing Patterns

```tsx
// Page container
<main className="p-4 sm:p-6 lg:p-8">

// Card padding
<div className="p-4">  // sm
<div className="p-5">  // md
<div className="p-6">  // lg

// Section spacing
<div className="space-y-6">  // between cards
<div className="space-y-4">  // within cards
<div className="space-y-2">  // form fields

// Inline gaps
<div className="gap-2">  // tight
<div className="gap-3">  // normal
<div className="gap-4">  // loose
```

---

## 4. Component Specifications

### Buttons

| Variant   | Default State                           | Hover State                             |
|-----------|----------------------------------------|----------------------------------------|
| Primary   | `bg-forest-600 text-white`             | `hover:bg-forest-700`                  |
| Secondary | `bg-white text-sage-700 border-sage-200`| `hover:bg-sage-50 hover:border-sage-300`|
| Danger    | `bg-coral-600 text-white`              | `hover:bg-coral-700`                   |
| Subtle    | `bg-sage-100 text-sage-700`            | `hover:bg-sage-200`                    |
| Ghost     | `bg-transparent text-sage-600`         | `hover:bg-sage-100`                    |

**Sizes:**
- `sm`: `px-3 py-1.5 text-xs`
- `md`: `px-4 py-2 text-sm`
- `lg`: `px-5 py-2.5 text-base`

**Base styles:** `rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2`

### Badges

| Variant   | Background       | Text             | Border           | Dot Color        |
|-----------|------------------|------------------|------------------|------------------|
| default   | `bg-sage-100`    | `text-sage-700`  | `border-sage-200`| `bg-sage-500`    |
| success   | `bg-forest-50`   | `text-forest-700`| `border-forest-200`| `bg-forest-500`|
| warning   | `bg-amber-50`    | `text-amber-700` | `border-amber-200`| `bg-amber-500`  |
| error     | `bg-coral-50`    | `text-coral-700` | `border-coral-200`| `bg-coral-500`  |
| info      | `bg-sky-50`      | `text-sky-700`   | `border-sky-200` | `bg-sky-500`     |
| critical  | `bg-red-100`     | `text-red-800`   | `border-red-300` | `bg-red-600`     |
| purple    | `bg-purple-50`   | `text-purple-700`| `border-purple-200`| `bg-purple-500`|

**Sizes:**
- `sm`: `px-1.5 py-0.5 text-[10px]`
- `md`: `px-2.5 py-1 text-xs`

**Base styles:** `rounded-full font-medium border inline-flex items-center gap-1.5`

### Cards

| Variant  | Background       | Border             |
|----------|------------------|-------------------|
| default  | `bg-white`       | `border-sage-100` |
| warning  | `bg-amber-50`    | `border-amber-200`|
| error    | `bg-coral-50`    | `border-coral-200`|
| success  | `bg-forest-50`   | `border-forest-200`|
| info     | `bg-sky-50`      | `border-sky-200`  |

**Base styles:** `rounded-xl border shadow-sm overflow-hidden`

### Tables

**Header Row:**
```tsx
className="bg-sage-50/50"
```

**Header Cell:**
```tsx
className="px-6 py-3 text-xs font-semibold text-sage-600 uppercase tracking-wider"
```

**Body Row:**
```tsx
// Alternating
className={idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}
// Selected
className="bg-forest-50 ring-1 ring-inset ring-forest-200"
// Hover
className="hover:bg-sage-50/50"
```

**Body Cell:**
```tsx
className="px-6 py-4 text-sm text-sage-700"
```

### Modals

**Backdrop:**
```tsx
className="bg-sage-900/50 backdrop-blur-sm"
```

**Modal Card:**
```tsx
className="bg-white rounded-xl shadow-xl"
```

**Sizes:**
- `sm`: `max-w-sm`
- `md`: `max-w-md`
- `lg`: `max-w-lg`
- `xl`: `max-w-xl`
- `full`: `max-w-4xl`

### Form Inputs

**Base styles:**
```tsx
className="block rounded-lg border bg-white text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 transition-colors"
```

**States:**
- Default: `border-sage-200 focus:border-forest-500 focus:ring-forest-500/20`
- Error: `border-coral-300 focus:border-coral-500 focus:ring-coral-500/20`
- Disabled: `bg-sage-50 text-sage-500 cursor-not-allowed`

**Sizes:**
- `sm`: `px-3 py-1.5 text-xs`
- `md`: `px-3 py-2 text-sm`
- `lg`: `px-4 py-2.5 text-base`

### Toggle/Switch

**Track (unchecked):** `bg-sage-200`
**Track (checked):** `bg-forest-500`
**Thumb:** `bg-white rounded-full shadow-sm`

**Sizes:**
- `sm`: track `w-8 h-4`, thumb `w-3 h-3`
- `md`: track `w-10 h-5`, thumb `w-4 h-4`
- `lg`: track `w-12 h-6`, thumb `w-5 h-5`

---

## 5. Page Structure

### Page Header

```tsx
<PageHeader
  title="Page Title"
  subtitle="Optional description"
  backLink="/admin"
  backLabel="Back to Dashboard"
  badge={<Badge variant="success">Active</Badge>}
  actions={<Button variant="primary">Action</Button>}
/>
```

### Section Header

```tsx
<SectionHeader
  title="Section Title"
  subtitle="Optional subtitle"
  size="md" // sm | md | lg
  action={<Button size="sm">Action</Button>}
/>
```

### Standard Page Layout

```tsx
<div className="space-y-6">
  <PageHeader title="..." />

  {/* Filters/Actions bar */}
  <Card padding="md">
    <div className="flex items-center justify-between gap-4">
      {/* Filters on left */}
      {/* Actions on right */}
    </div>
  </Card>

  {/* Main content */}
  <Card>
    <CardHeader title="..." action={...} />
    <Table ... />
    {/* or */}
    <CardBody>...</CardBody>
    <CardFooter>...</CardFooter>
  </Card>
</div>
```

---

## 6. Icon Guidelines

### Icon Source
Use inline SVG from Heroicons (outline style preferred for consistency).

### Icon Sizes
- Extra small: `w-3.5 h-3.5` (in badges, small buttons)
- Small: `w-4 h-4` (in buttons, inputs)
- Medium: `w-5 h-5` (in nav, standalone icons)
- Large: `w-6 h-6` (in modals, important actions)
- Extra large: `w-12 h-12` (in empty states)

### Icon Colors
- Match parent text color with `currentColor`
- Use specific colors for semantic meaning (success, error, etc.)

---

## 7. Animation & Transitions

### Standard Transitions
```tsx
className="transition-colors"  // color changes
className="transition-transform"  // position/scale
className="transition-all"  // multiple properties
```

**Duration:** Default (150ms) is used throughout.

### Loading Animation
```tsx
className="animate-spin"  // spinners
className="animate-pulse"  // skeleton loaders
```

---

## 8. Accessibility Guidelines

### Focus States
All interactive elements must have visible focus states:
```tsx
focus:outline-none focus:ring-2 focus:ring-{color}-500/20
```

### Color Contrast
- Text on backgrounds must meet WCAG AA (4.5:1 for normal text)
- sage-700 on white: OK
- sage-600 on white: OK
- sage-500 on white: Borderline (use for secondary text only)

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Modals must trap focus
- Proper tab order must be maintained

### ARIA Labels
- Icon-only buttons must have `aria-label`
- Modals must have `aria-modal="true"` and proper labeling
- Tables should use semantic HTML (`<th>`, `<td>`)

---

## 9. Responsive Breakpoints

| Breakpoint | Width   | Tailwind | Usage                     |
|------------|---------|----------|---------------------------|
| Default    | 0px+    | (none)   | Mobile-first base         |
| sm         | 640px+  | `sm:`    | Large phones              |
| md         | 768px+  | `md:`    | Tablets                   |
| lg         | 1024px+ | `lg:`    | Desktop                   |
| xl         | 1280px+ | `xl:`    | Large desktop             |

### Common Responsive Patterns

```tsx
// Page padding
className="p-4 sm:p-6 lg:p-8"

// Grid layouts
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Hide/show elements
className="hidden sm:block"  // hide on mobile
className="sm:hidden"        // show only on mobile

// Sidebar
className="lg:pl-64"  // offset for fixed sidebar on desktop
```

---

## 10. Dark Mode (Future)

Dark mode support is prepared but not yet implemented. When enabling:

1. Add `darkMode: 'class'` to tailwind.config.ts
2. Toggle `dark` class on `<html>` element
3. Use `dark:` prefix for dark mode styles
4. Primary adjustments needed:
   - Backgrounds: sage-50/white → sage-900/sage-800
   - Text: sage-800/700 → sage-100/200
   - Borders: sage-100/200 → sage-700/600
   - Cards: white → sage-800

---

## Component Import Pattern

```tsx
// Import from the unified index
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Table,
  Modal,
  Input,
  Select,
  Toggle,
  PageHeader,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
} from '@/pages/admin/components/ui';
```
