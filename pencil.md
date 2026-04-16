# Algorium UK - Strict Design System (Manifesto)

## 📐 The Spacing System (Scale: Power of 2)
All margins and paddings must come from this scale to avoid "AI Slop":
- xs: 4px
- sm: 8px
- md: 16px
- lg: 32px
- xl: 64px
- xxl: 128px (Standard Section Padding)
- xxxl: 256px

## 🖋️ Typography Scale (Based on Modular 1.2)
- **Display 1:** 5rem (Hero Italic) - `clamp(3rem, 8vw, 5rem)`
- **Heading 1:** 3rem (Outfit Bold)
- **Heading 2:** 2rem (Section Headers)
- **Body:** 1.125rem (Inter - Line height: 1.6)
- **Subtext:** 0.875rem (Uppercase, Letter-spacing: 0.15em)

## 🎨 Color Registry
- **Primary:** #fcfcfc (Main Stage)
- **Inverse:** #111111 (Footer/Contact/Dark Sections)
- **Brand:** #FE532D (Algorium Orange)
- **Soft Border:** rgba(0,0,0,0.06)
- **Inverse Border:** rgba(255,255,255,0.1)

## 🧩 Component Logic
- **Borders:** No radius for "Strict Engineering" sections, 8px for "Floating Media".
- **Gradients:** Use `linear-gradient(135deg, #FE532D 0%, #D43E23 100%)` for Brand Accent only.
- **Motion:** Standard `spring` (Stiffness: 200, Damping: 25) for all reveals.

---
*Created per Design-Execution Isolation Principles - 2026-04-15*
