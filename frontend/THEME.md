# Custom Bootstrap Theme - Green/Blue Modern Design

## Color Palette

### Primary Colors (Teal/Green)
- **Primary**: `#0d9488` (Teal-600) - Main brand color
- **Primary Dark**: `#0f766e` (Teal-700) - Hover states
- **Primary Light**: `#14b8a6` (Teal-500) - Accents
- **Primary Lighter**: `#5eead4` (Teal-300) - Subtle highlights
- **Primary BG**: `#f0fdfa` (Teal-50) - Background tints

### Secondary Colors (Navy/Blue)
- **Secondary**: `#1e40af` (Blue-800) - Secondary actions
- **Secondary Dark**: `#1e3a8a` (Blue-900) - Hover states
- **Secondary Light**: `#2563eb` (Blue-600) - Accents
- **Secondary Lighter**: `#60a5fa` (Blue-400) - Subtle highlights
- **Secondary BG**: `#eff6ff` (Blue-50) - Background tints

### Accent Colors
- **Accent**: `#0891b2` (Cyan-600)
- **Accent Light**: `#06b6d4` (Cyan-500)

### Status Colors
- **Success**: `#059669` (Emerald-600)
- **Info**: `#0891b2` (Cyan-600)
- **Warning**: `#d97706` (Amber-600)
- **Danger**: `#dc2626` (Red-600)

## Design Principles

### Border Radius
- **Default**: `0.75rem` (12px) - Used for buttons, inputs, cards
- **Small**: `0.5rem` (8px) - Used for badges, small elements
- **Large**: `1rem` (16px) - Used for cards, modals
- **XL**: `1.25rem` (20px) - Used for large containers

### Shadows
- **Small**: Subtle elevation for buttons
- **Default**: Standard elevation for cards
- **Medium**: Hover states, elevated cards
- **Large**: Modals, dropdowns
- **XL**: Major overlays

### Buttons
- Custom border-radius: `0.75rem` (not Bootstrap default)
- Custom shadow with hover elevation
- Smooth transitions
- No default Bootstrap glossiness
- Transform on hover for modern feel

## Usage Examples

### Buttons
```tsx
// Primary button
<Button variant="primary">Click Me</Button>

// Outline button
<Button variant="outline-primary">Outline</Button>

// Sizes
<Button variant="primary" size="sm">Small</Button>
<Button variant="primary" size="lg">Large</Button>
```

### Cards
```tsx
<Card>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    Card content with custom styling
  </Card.Body>
</Card>
```

### Forms
```tsx
<Form.Group>
  <Form.Label>Email</Form.Label>
  <Form.Control type="email" placeholder="Enter email" />
</Form.Group>
```

### Alerts
```tsx
<Alert variant="primary">Primary alert</Alert>
<Alert variant="success">Success alert</Alert>
<Alert variant="danger">Danger alert</Alert>
```

## CSS Variables

All colors and design tokens are available as CSS variables:

```css
var(--bs-primary)
var(--bs-primary-dark)
var(--bs-border-radius)
var(--bs-box-shadow)
```

## Customization

To customize the theme, edit `src/styles/custom-theme.css` and update the CSS variables in the `:root` selector.

