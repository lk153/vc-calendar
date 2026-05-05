---
name: Lumina Executive
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#4f5d72'
  on-tertiary: '#ffffff'
  tertiary-container: '#67758c'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d5e3fd'
  tertiary-fixed-dim: '#b9c7e0'
  on-tertiary-fixed: '#0d1c2f'
  on-tertiary-fixed-variant: '#3a485c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system moves away from heavy, weighted aesthetics toward a philosophy of "Clarity through Light." It targets high-level decision-makers who value efficiency, transparency, and modern sophistication. The brand personality is authoritative yet approachable, replacing the "closed-door" feel of traditional executive suites with an open, airy, and glass-walled office aesthetic.

The visual style is **Corporate / Modern** with a strong influence of **Minimalism**. It prioritizes generous whitespace and high-quality typography to reduce cognitive load. By utilizing a brighter palette, the system evokes a sense of forward-thinking optimism and technical precision.

## Colors

The palette is anchored by a vibrant Emerald primary color, chosen to represent growth and professional vitality. To maintain an executive feel, the heavy blacks of the past are replaced by a deep Navy (#0F172A) for high-contrast elements and a sophisticated Slate (#334155) for secondary text and icons.

Primary surfaces are rendered in crisp White (#FFFFFF), supported by a neutral background of very light gray (#F8FAFC) to define structural boundaries without the use of harsh lines. Semantic colors for success, warning, and error should be desaturated to stay within the professional tone of the design system.

## Typography

The typographic system utilizes a dual-font approach to balance personality with utility. **Manrope** is used for all headlines; its refined, geometric curves provide a modern executive character that feels both bespoke and systematic. 

For body copy and functional labels, **Inter** is employed to ensure maximum legibility and a neutral, utilitarian feel. Tracking should be tightened slightly on large headlines to maintain a cohesive "locked-in" appearance, while smaller labels benefit from increased letter spacing to enhance readability on high-resolution displays.

## Layout & Spacing

This design system uses a strict 8px spacing scale to ensure mathematical harmony across all views. The layout philosophy is a **Fluid Grid** that adapts to the viewport while maintaining consistent internal logic. 

A standard 12-column grid is used for desktop views, with a 24px gutter to ensure content remains breathable. Vertical rhythm is driven by the 8px base unit, with components typically separated by "md" (24px) or "lg" (48px) units to reinforce the airy, modern aesthetic. Margins on the outer edges of the container should never drop below 32px to prevent the UI from feeling cramped.

## Elevation & Depth

To sustain the airy feel, the design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Ambient Shadows**.

1.  **Low Elevation:** Used for cards and secondary buttons. A very soft, highly diffused shadow (0px 2px 10px rgba(15, 23, 42, 0.05)) is paired with a 1px border in a light slate tone.
2.  **Mid Elevation:** Used for dropdowns and navigation menus. The shadow becomes more pronounced but remains desaturated.
3.  **High Elevation:** Reserved for modals. These use a significant backdrop blur (12px) to create a "glass" effect, focusing the user's attention while maintaining a sense of space.

Surfaces should primarily be distinguished by subtle shifts in background color (e.g., White vs. Slate-50) rather than heavy drop shadows.

## Shapes

The shape language is "Soft Precision." A `roundedness` level of **1** (0.25rem/4px) is the standard for primary UI elements like buttons, input fields, and small cards. This subtle rounding removes the aggressive nature of sharp corners while maintaining the professional structure expected in an executive tool.

For larger container elements like main content areas or sidebars, use `rounded-lg` (8px) to provide a slightly softer framing of the data. Use circular shapes exclusively for avatars or status indicators.

## Components

*   **Buttons:** Primary buttons use the Emerald fill with white text. Secondary buttons use a Slate-50 background with Navy text. Tertiary buttons are text-only with the Emerald color used for the label.
*   **Input Fields:** Surfaces are White with a 1px Slate-200 border. On focus, the border shifts to Emerald with a soft Emerald glow (2px outer ring). Labels should always be positioned above the field in `label-md` style.
*   **Cards:** Use a White background with a 1px border in Slate-100. Avoid shadows on cards unless they are interactive (hover state).
*   **Chips/Tags:** Used for status. They should feature a low-opacity background tint of the status color (e.g., 10% Emerald for "Success") with high-contrast text.
*   **Lists:** Maintain high padding (16px vertical) between list items to ensure the UI feels "Airy." Use thin, 1px horizontal dividers in Slate-50.
*   **Data Tables:** Essential for an executive system. Use a clean, borderless header with a Slate-50 background. Row hover states should be a very subtle Slate-25. No vertical grid lines; use generous horizontal spacing to define columns.