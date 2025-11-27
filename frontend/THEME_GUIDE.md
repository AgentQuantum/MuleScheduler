# MuleScheduler Theme Guide

## Color System

### Primary Green Palette (Main Brand Colors)
- **Light Green Fill**: `#a7f3d0` - Used for buttons, schedule blocks, highlights
- **Darker Green Border**: `#059669` - Used for borders and outlines
- **Dark Green**: `#10b981` - Used for hover/active states
- **Darker Green Text**: `#047857` - Used for text on light backgrounds
- **Light Green Background**: `#ecfdf5` - Used for subtle backgrounds

### Colby Blue (Limited Use)
- **Colby Blue**: `#002169` - Only for Colby-specific branding elements
- Use sparingly for:
  - Colby student details
  - Certain headings
  - Subtle links
  - Login/signup page backgrounds

## Components

### ScheduleBlock Component

The `ScheduleBlock` component creates green rectangular blocks matching the schedule block aesthetic:

```tsx
import ScheduleBlock from './components/ScheduleBlock'

<ScheduleBlock
  timeSlot="9a - 5p"
  location="FRONT OF HOUSE"
  assigned="John Doe"
  onClick={() => handleClick()}
  active={false}
/>
```

**Props:**
- `timeSlot`: Time range (e.g., "9a - 5p")
- `location`: Location name (e.g., "FRONT OF HOUSE")
- `assigned`: Optional assigned worker name
- `onClick`: Optional click handler
- `active`: Boolean for active/selected state

### Buttons

All buttons use the green theme:
- Light green fill (`--color-primary`)
- Darker green border (`--color-primary-border`)
- Darker green text (`--color-primary-darker`)
- On hover: Darker green fill with white text

```tsx
<Button variant="primary">Click Me</Button>
<Button variant="outline-primary">Outline</Button>
```

### Cards

Cards use subtle borders and shadows:
- Border: `1px solid var(--color-border)`
- Border radius: `0.75rem`
- Light shadow for depth

### Forms

Form controls use:
- Green border on focus
- Consistent border radius
- Subtle hover states

## CSS Variables

All theme colors are available as CSS variables:

```css
var(--color-primary)           /* Light green fill */
var(--color-primary-border)    /* Darker green border */
var(--color-primary-dark)      /* Hover/active green */
var(--color-primary-darker)    /* Text green */
var(--color-colby-blue)        /* Colby Blue (use sparingly) */
```

## Utility Classes

- `.bg-primary-light` - Light green background
- `.border-primary` - Green border
- `.text-primary-dark` - Dark green text
- `.text-colby` - Colby Blue text (use sparingly)
- `.bg-colby` - Colby Blue background (use sparingly)

## Design Principles

1. **Green is dominant** - Use green for primary actions, buttons, schedule blocks
2. **Colby Blue is limited** - Only use for Colby-specific branding
3. **Flat design** - Minimal shadows, clean borders
4. **Consistent radius** - Use `0.5rem` for most elements
5. **Clear hierarchy** - Darker green for emphasis, lighter for backgrounds

## Examples

### Schedule Grid
```tsx
<Row>
  <Col md={6}>
    <ScheduleBlock
      timeSlot="9a - 5p"
      location="FRONT OF HOUSE"
      assigned="Alice Smith"
    />
  </Col>
  <Col md={6}>
    <ScheduleBlock
      timeSlot="4p - 10p"
      location="KITCHEN"
      assigned="Bob Jones"
    />
  </Col>
</Row>
```

### Colby-Specific Elements
```tsx
<div className="text-colby">
  <h3>Colby College Student Details</h3>
  <p>@colby.edu email required</p>
</div>
```

