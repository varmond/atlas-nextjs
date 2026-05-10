# Page Design Patterns

This document outlines the standardized design patterns for dashboard pages in our application.

## Overview

We follow a minimal design philosophy that prioritizes content over decoration, using shadcn/ui components consistently throughout.

## Standard Page Structure

### 1. Page Header (DashboardPage)
- **Title**: Clear, descriptive page title
- **CTA Button**: Single primary action (e.g., "Add Product", "Add Location")
- **No Back Button**: Disabled by default for cleaner navigation

### 2. Content Area
- **Search Bar**: Simple search input with icon and count
- **Data Table**: Clean table with minimal columns
- **No Stats Cards**: Removed redundant information display

## Design Principles

### Minimal Design
- **Focus on Data**: Content is the hero, not decorative elements
- **Single Action**: One primary action per page
- **Clean Typography**: Use shadcn design tokens for consistency
- **Subtle Interactions**: Hover states that don't distract

### Shadcn Design System
- **Colors**: Use design tokens (`text-muted-foreground`, `text-destructive`)
- **Spacing**: Consistent with shadcn spacing system
- **Components**: Standard shadcn variants (`default`, `secondary`, `outline`)
- **Hover States**: Subtle feedback (`hover:bg-muted`, `hover:bg-destructive/10`)

## Page Types

### Table Pages (Products, Locations, etc.)

#### Structure
```tsx
<div className="space-y-4">
  {/* Search */}
  <div className="flex items-center space-x-4">
    <div className="relative flex-1 max-w-sm">
      <Input placeholder="Search..." className="pl-8" />
      <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    </div>
    <div className="text-sm text-muted-foreground">
      {count} item{count !== 1 ? 's' : ''}
    </div>
  </div>

  {/* Data Table */}
  <DataTable {...props} />
</div>
```

#### Table Columns
- **Primary Column**: Main identifier with optional subtitle
- **Status Column**: Badge with appropriate variant
- **Actions Column**: Icon-only buttons with consistent spacing
- **No Redundant Columns**: Remove unnecessary information

#### Action Buttons
```tsx
const ActionButtons = ({ item }) => (
  <div className="flex items-center space-x-1">
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
      <Eye className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
      <Edit className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
)
```

### Card Pages (Inventory, etc.)

#### Structure
```tsx
<div className="space-y-4">
  {/* Search */}
  <div className="flex items-center space-x-4">
    <div className="relative flex-1 max-w-sm">
      <Input placeholder="Search..." className="pl-8" />
      <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    </div>
    <div className="text-sm text-muted-foreground">
      {count} item{count !== 1 ? 's' : ''}
    </div>
  </div>

  {/* Card Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
</div>
```

## Component Guidelines

### Search Input
- **Icon**: Use relevant icon (Package, Building2, etc.)
- **Placeholder**: Descriptive placeholder text
- **Positioning**: Left-aligned with icon
- **Count**: Show filtered results count

### Data Table
- **Searchable**: `false` (handle manually)
- **Sortable**: `true`
- **Filterable**: `false` (keep simple)
- **Selectable**: `true`
- **Page Size**: 25 items

### Badges
- **Status**: Use `default` for active, `secondary` for inactive
- **Types**: Use `default`, `secondary`, `outline` variants
- **Colors**: Let shadcn handle color schemes

### Buttons
- **Primary**: Full-width in page header
- **Actions**: Icon-only in table rows
- **Hover States**: Subtle background changes
- **Spacing**: Consistent `space-x-1` for action groups

## Loading States

### Table Loading
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
```

### Error States
```tsx
if (error) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Error Loading Data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Failed to load data. Please try again.
        </p>
      </div>
    </div>
  )
}
```

## Color Tokens

### Text Colors
- `text-foreground`: Primary text
- `text-muted-foreground`: Secondary text
- `text-destructive`: Error/danger text

### Background Colors
- `bg-muted`: Subtle hover states
- `bg-destructive/10`: Danger hover states
- `bg-background`: Page background

### Border Colors
- `border`: Default borders
- `border-muted`: Subtle borders

## Spacing

### Container Spacing
- `space-y-4`: Between major sections
- `space-y-1`: Between related elements
- `space-x-4`: Horizontal spacing for search bar
- `space-x-1`: Tight spacing for action buttons

### Component Spacing
- `p-4`: Standard padding
- `h-8 w-8`: Icon button size
- `h-4 w-4`: Icon size
- `max-w-sm`: Search input width

## Examples

### Products Page
- **Search**: "Search products..."
- **Icon**: Package icon
- **Columns**: Product, SKU, Type, Price, Package, Actions
- **Actions**: View, Edit, Delete

### Locations Page
- **Search**: "Search locations..."
- **Icon**: Building2 icon
- **Columns**: Location, Status, Sub-locations, Actions
- **Actions**: View, Edit, Delete

## Benefits

1. **Consistency**: All pages follow the same patterns
2. **Performance**: Minimal re-renders and calculations
3. **Maintainability**: Easy to update and extend
4. **User Experience**: Predictable and clean interface
5. **Accessibility**: Proper focus states and keyboard navigation

## Migration Checklist

When updating a page to follow these patterns:

- [ ] Remove stats cards
- [ ] Simplify to single search input
- [ ] Use shadcn design tokens
- [ ] Implement consistent action buttons
- [ ] Add proper loading/error states
- [ ] Remove duplicate buttons
- [ ] Use minimal column set
- [ ] Test responsive behavior
