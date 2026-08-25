---
name: Athenaeum Minimal
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#181919'
  on-primary: '#ffffff'
  primary-container: '#2d2d2d'
  on-primary-container: '#959494'
  inverse-primary: '#c8c6c6'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#1c1810'
  on-tertiary: '#ffffff'
  tertiary-container: '#322c24'
  on-tertiary-container: '#9c9388'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e2e1'
  primary-fixed-dim: '#c8c6c6'
  on-primary-fixed: '#1b1c1c'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#ece1d5'
  tertiary-fixed-dim: '#cfc5b9'
  on-tertiary-fixed: '#201b13'
  on-tertiary-fixed-variant: '#4c463d'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '500'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  ui-button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  headline-md-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  canvas-padding: 40px
  gutter: 24px
  card-padding: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built for a local-first knowledge application, prioritizing focus, longevity, and intellectual clarity. The aesthetic is rooted in **Modern Minimalism** with a **Tactile** twist, evoking the feeling of a clean, sunlit physical workspace.

The brand personality is academic yet accessible—think of a digital library or a personal archive. It avoids the coldness of traditional software by using warm neutrals and high-end editorial typography. The target audience includes researchers, writers, and thinkers who require a "quiet" interface that recedes to let their ideas take center stage. The emotional response is one of calm, order, and intentionality.

## Colors

The palette is anchored in a warm, low-contrast spectrum to reduce eye strain during long research sessions.

- **Canvas:** A soft, off-white warm gray (#EDEDED) serves as the base layer, simulating a physical desktop.
- **Surface:** Pure white (#FFFFFF) is reserved for interactive cards and panels to provide a clear cognitive distinction between the "desk" and the "document."
- **Ink (Primary):** A deep charcoal (#2D2D2D) provides high legibility for text without the harshness of pure black.
- **Atmospheric Accents:** A muted taupe (#A89F94) is used sparingly for decorative elements or secondary metadata to maintain the academic feel.

## Typography

The typography system creates a sophisticated hierarchy by pairing an elegant Serif with a functional Monospace.

- **Serif (EB Garamond):** Used for titles, document headers, and long-form reading content. It adds a literary, authoritative character to the knowledge base.
- **Sans-Serif (Inter):** Used for the primary UI interface and body text within forms, providing clarity and modern utility.
- **Monospace (Space Mono):** Specifically for metadata, tags, timestamps, and technical UI labels. This reinforces the "organized" and "digital archive" nature of the application.

Vertical rhythm is strictly maintained with a 1.5x to 1.6x line-height for body text to ensure maximum readability.

## Layout & Spacing

This design system utilizes a **Spatial Canvas** model rather than a traditional rigid grid. 

- **The Canvas:** An expansive, fluid background with 40px safe-area margins.
- **Card-Based Layout:** Information is organized into discrete containers (cards) that represent different notes, graph views, or documents. These cards follow a 24px internal padding rule.
- **The "Desk" Metaphor:** On desktop, components can be tiled or free-floating. While they don't snap to a strict 12-column grid, they respect a 24px gutter when placed adjacent to one another.
- **Density:** High whitespace is preferred. Avoid crowding components; let the background canvas "breathe" around the white surfaces to emphasize the minimalist aesthetic.

## Elevation & Depth

Hierarchy is conveyed through **Subtle Ambient Shadows** rather than color fills or heavy borders.

- **Level 0 (Canvas):** Flat, #EDEDED.
- **Level 1 (Cards):** Pure white surface with an extremely soft, diffused shadow (`0px 4px 20px rgba(0, 0, 0, 0.04)`). This makes the card feel like a thick piece of paper resting on a table.
- **Level 2 (Hover/Active):** When a card is interacted with, the shadow deepens slightly (`0px 8px 30px rgba(0, 0, 0, 0.08)`) and may feature a thin 1px outline in a soft gray to indicate focus.
- **Flat UI:** Navigation bars and sidebars should remain flat or use a simple vertical divider line to maintain the minimalist profile.

## Shapes

The shape language is **Soft** and restrained.

- **Cards & Panels:** Use a 0.25rem (4px) or 0.5rem (8px) radius. This creates a precise, architectural feel that isn't as "bubbly" as consumer social apps, but softer than brutalist software.
- **Buttons & Inputs:** Follow the `rounded-lg` (0.5rem) standard to make them feel tactile and approachable.
- **Pills:** Used only for tags and status indicators to provide a visual shape-contrast against the rectangular card structure.

## Components

- **Buttons:** Primarily outlined. Use a 1px stroke in Primary Ink (#2D2D2D) for main actions and Secondary Gray (#6B6B6B) for secondary actions. Fills should only be used for the most critical "Primary" action, using a solid Primary Ink fill with white text.
- **Input Fields:** Minimalist design with a 1px bottom border or a very light 4px rounded stroke. Use `Space Mono` for placeholder text to signal a "data entry" state.
- **Chips & Tags:** Small, pill-shaped containers with a 1px stroke and no fill. Use `label-mono` for the text.
- **Cards:** The core component. White background, soft shadow, and clear 24px internal padding. Headers within cards should use `headline-sm`.
- **The Graph View:** Nodes should be simple circles with tonal fills (muted versions of primary colors) and thin connecting lines in #D1D1D1. Labels on the graph should use `label-mono` for a technical, precise look.
- **Lists:** Clean, borderless rows with subtle hover states (a slight shift to #F5F2F0). Use hairline dividers (0.5px) only when absolutely necessary for legibility.