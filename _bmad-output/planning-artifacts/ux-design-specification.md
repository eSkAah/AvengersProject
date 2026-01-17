---
status: complete
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/PRD.md
  - docs/ARCHITECTURE.md
---

# UX Design Specification - Avengers Project

**Author:** Avengers
**Date:** 2026-01-17

---

## Executive Summary

### Project Vision

Avengers Project is a 10-day POC demonstrating premium AI capabilities for a real estate fund client. The platform must deliver "stars in the eyes" (effet WOW) through:
- Smart document classification via AI
- Contextual AI assistant (Eve) with CMD+Click integration
- Proactive risk predictions and deadline forecasting

The UI must feel like a 2026-level product - beyond typical corporate apps - while respecting EY branding guidelines.

### Target Users

| User Type | Context | Key Need |
|-----------|---------|----------|
| **Fund Managers** | Real estate investment professionals | Quick visibility on engagement status, document completeness, and risk levels |
| **EY Finance Team** | Internal stakeholders evaluating AI capabilities | Proof that internal teams can deliver faster than external vendors |

**User Characteristics:**
- Corporate environment, professional expectations
- Moderate tech-savviness (familiar with Excel, portals)
- Desktop-primary usage
- Time-pressured, need immediate clarity

### Key Design Challenges

1. **Premium Perception Gap**: Bridging EY corporate aesthetics with Apple/Tesla/Stripe-level polish
2. **AI Trust Building**: Making classification and predictions feel reliable, not magical-black-box
3. **CMD+Click Discoverability**: Novel interaction pattern requiring intuitive hints
4. **Demo Flow Optimization**: Every interaction must be memorable and error-free for the 8-10 minute demo

### Design Opportunities

1. **Stripe-inspired Clarity**: Clean data presentation with purposeful whitespace
2. **Subtle Micro-interactions**: Refined hover states, smooth transitions (200-300ms)
3. **AI Feedback Moments**: Thoughtful loading states that build anticipation
4. **Premium Typography**: Inter font family leveraged for hierarchy and elegance

### Design Direction

| Aspect | Direction |
|--------|-----------|
| **Base** | EY FMSP (fmsp.ey.com) - colors & fonts |
| **Elevation** | Stripe-level refinement |
| **Animations** | Subtle, professional, purposeful |
| **Dark Mode** | Not in scope |
| **Overall Feel** | Corporate premium - confident, clean, intelligent |

---

## Core User Experience

### Defining Experience

**Primary User Journey:** Upload → Classify → Monitor → Understand

The core experience centers on three magic moments that define the platform's value:

1. **Upload & Auto-Classification**: User drops files, AI instantly recognizes document type, animates to correct engagement folder
2. **CMD+Click Intelligence**: Any financial value becomes interactive - one modifier click opens Eve with contextual explanation
3. **Proactive Risk Awareness**: Badges and predictions surface issues before users ask

### Platform Strategy

| Aspect | Decision |
|--------|----------|
| **Platform** | Web application (Angular 19 SPA) |
| **Primary Device** | Desktop (demo environment) |
| **Input Method** | Mouse + keyboard (CMD/ALT modifiers) |
| **Offline** | Not required |
| **Browser** | Modern browsers (Chrome primary for demo) |

### Effortless Interactions

| Interaction | Effortless Standard |
|-------------|---------------------|
| **File Upload** | Drag anywhere → instant classification → visual routing animation |
| **Data Understanding** | CMD+Click any value → Eve explains with source citation |
| **Status Scanning** | Glance at badges → know exactly what needs attention |
| **Navigation** | Sidebar always visible → one click to any section |
| **AI Conversation** | Eve knows context → no need to explain what you're looking at |

### Critical Success Moments

| Moment | Success Criteria | Failure Mode |
|--------|------------------|--------------|
| **First Load** | Premium UI loads instantly, risk badges visible | Slow load, generic corporate look |
| **File Drop** | Smooth animation, "Grand Livre détecté" appears | Laggy upload, no feedback |
| **Classification** | Correct document type, routes to right engagement | Wrong classification, manual correction |
| **CMD+Click** | Eve panel slides in <300ms, explanation appears <3s | Slow response, generic answer |
| **Badge Update** | Status changes in real-time after upload | Manual refresh required |

### Experience Principles

1. **Instant Intelligence**: Every AI action feels immediate and accurate - no waiting, no confusion
2. **Context Always Present**: Eve knows what you're looking at, badges show what matters now
3. **Progressive Disclosure**: Clean surfaces reveal depth on interaction (hover, click, CMD+click)
4. **Premium Minimalism**: Stripe-level restraint - every element earns its place
5. **Demo-Ready Polish**: Zero rough edges - every interaction rehearsed to perfection

---

## Desired Emotional Response

### Primary Emotional Goals

| Emotion | Target Moment | Design Support |
|---------|---------------|----------------|
| **"This looks premium"** | First load | Clean layout, quality typography, subtle animation |
| **"They've thought of everything"** | Risk badges visible | Proactive intelligence, smart defaults |
| **"That was magic"** | File classification | Smooth animation, instant AI feedback |
| **"It actually understands"** | Eve responds | Accurate context, source citations |
| **"I've never seen this before"** | CMD+Click | Novel interaction = memorable moment |
| **"We need this"** | Demo end | Trust established, capability proven |

### Emotional Design Principles

1. **Confident, Not Flashy**: Premium feeling through restraint and precision
2. **Intelligent, Not Mysterious**: AI feels helpful and transparent
3. **Professional Delight**: WOW moments appropriate for corporate setting
4. **Trust Through Accuracy**: Every AI response reinforces reliability

### Emotions to Avoid

| Negative Emotion | Prevention Strategy |
|------------------|---------------------|
| **Confusion** | Clear navigation, obvious actions, consistent patterns |
| **Waiting Anxiety** | Immediate feedback, skeleton loaders, progress indicators |
| **Skepticism** | Source citations, accurate classifications, professional tone |
| **Overwhelm** | Progressive disclosure, clean surfaces, focused content |

---

## UX Pattern Analysis & Inspiration

### Primary Inspiration: Stripe

| Pattern | Stripe Approach | Our Application |
|---------|-----------------|-----------------|
| **Typography** | Clean Inter font, strong hierarchy | Inter 100-900, clear hierarchy |
| **Whitespace** | Generous, purposeful spacing | Cards with breathing room |
| **Color Restraint** | Minimal accent use, mostly neutrals | EY Yellow as strategic accent only |
| **Data Presentation** | Clear tables, clean cards | Financial data in clean grids |
| **Hover States** | Subtle, informative | Show CMD+Click hint on hover |
| **Loading States** | Skeleton shimmer, not spinners | Skeleton loaders throughout |
| **Error States** | Friendly, helpful messaging | Clear guidance, not red walls |

### Anti-Patterns to Avoid

| Anti-Pattern | Why Avoid | Our Alternative |
|--------------|-----------|-----------------|
| Heavy shadows | Feels dated | Subtle shadows, clean borders |
| Gradient overload | Unprofessional | Flat colors, subtle depth |
| Spinner chaos | Creates anxiety | Skeleton loaders |
| Dense data walls | Overwhelming | Progressive disclosure |
| Hover-only actions | Poor discoverability | Visible actions + hover extras |

### Design Inspiration Strategy

**Adopt:** Typography scale, card layouts, generous padding, subtle transitions (200ms), clean data tables
**Adapt:** Stripe blue → EY Yellow, corporate tone, risk badge system, Eve chat panel

---

## Design System

> **MANDATORY**: All UI development MUST follow these specifications exactly. No deviations without updating this document.

### Design System Choice

**Approach:** Tailwind CSS + Custom EY Theme
**Rationale:** Already in stack, rapid development, full customization control

### Typography

**Font Family:** Inter (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Type Scale:**

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-display` | 36px | 700 | 1.2 | Hero headings, page titles |
| `text-h1` | 28px | 600 | 1.3 | Section headings |
| `text-h2` | 22px | 600 | 1.35 | Card titles, subsections |
| `text-h3` | 18px | 600 | 1.4 | Component headers |
| `text-body-lg` | 16px | 400 | 1.6 | Primary content |
| `text-body` | 14px | 400 | 1.6 | Default body text |
| `text-body-sm` | 13px | 400 | 1.5 | Secondary text, metadata |
| `text-caption` | 12px | 500 | 1.4 | Labels, hints, timestamps |
| `text-overline` | 11px | 600 | 1.3 | Uppercase labels |

### Color Palette

#### Primary (EY Brand)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `ey-yellow` | `#FFE600` | 255, 230, 0 | Primary accent, CTAs, active states |
| `ey-yellow-hover` | `#FFD000` | 255, 208, 0 | Hover state for yellow elements |
| `ey-yellow-light` | `#FFF9CC` | 255, 249, 204 | Subtle yellow backgrounds |
| `ey-yellow-dark` | `#CCB800` | 204, 184, 0 | Pressed states |

#### Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#FAFAFA` | Main app background |
| `neutral-100` | `#F5F5F5` | Subtle backgrounds |
| `neutral-200` | `#E5E5E5` | Default borders, dividers |
| `neutral-300` | `#D4D4D4` | Emphasized borders |
| `neutral-400` | `#A3A3A3` | Disabled text |
| `neutral-500` | `#737373` | Placeholder text |
| `neutral-600` | `#525252` | Secondary text |
| `neutral-700` | `#404040` | Body text |
| `neutral-800` | `#2E2E38` | Headlines, primary text (EY Black) |
| `neutral-900` | `#1A1A2E` | Sidebar background |

#### Semantic Colors

| Token | Main | Light BG | Dark Text | Usage |
|-------|------|----------|-----------|-------|
| `success` | `#10B981` | `#D1FAE5` | `#047857` | Completed, positive |
| `warning` | `#F59E0B` | `#FEF3C7` | `#B45309` | Attention needed |
| `error` | `#EF4444` | `#FEE2E2` | `#B91C1C` | Errors, critical |
| `info` | `#3B82F6` | `#DBEAFE` | `#1D4ED8` | Informational |

#### Risk Level System

| Level | Badge BG | Badge Text | Badge Border | Dot Color |
|-------|----------|------------|--------------|-----------|
| `HIGH` | `#FEE2E2` | `#B91C1C` | `#FECACA` | `#EF4444` |
| `MEDIUM` | `#FEF3C7` | `#B45309` | `#FDE68A` | `#F59E0B` |
| `LOW` | `#D1FAE5` | `#047857` | `#A7F3D0` | `#10B981` |

### Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `space-0.5` | 2px | `p-0.5` | Micro spacing |
| `space-1` | 4px | `p-1` | Tight spacing, icon gaps |
| `space-2` | 8px | `p-2` | Default element spacing |
| `space-3` | 12px | `p-3` | Compact padding |
| `space-4` | 16px | `p-4` | Standard padding |
| `space-5` | 20px | `p-5` | Card padding |
| `space-6` | 24px | `p-6` | Section spacing |
| `space-8` | 32px | `p-8` | Large gaps |
| `space-10` | 40px | `p-10` | Section separation |
| `space-12` | 48px | `p-12` | Page margins |

### Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `radius-sm` | 4px | `rounded-sm` | Small elements, badges |
| `radius-md` | 6px | `rounded-md` | Buttons, inputs |
| `radius-lg` | 8px | `rounded-lg` | Cards, dropdowns |
| `radius-xl` | 12px | `rounded-xl` | Modals, large cards |
| `radius-2xl` | 16px | `rounded-2xl` | Feature cards |
| `radius-full` | 9999px | `rounded-full` | Pills, avatars |

### Shadows

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | `shadow-sm` | Subtle elevation |
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.06)` | `shadow` | Cards default |
| `shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.08)` | `shadow-md` | Card hover |
| `shadow-dropdown` | `0 4px 16px rgba(0,0,0,0.12)` | `shadow-lg` | Dropdowns |
| `shadow-modal` | `0 8px 32px rgba(0,0,0,0.16)` | `shadow-xl` | Modals |

### Transitions & Animations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | `100ms` | Micro-interactions |
| `duration-normal` | `200ms` | Default transitions |
| `duration-slow` | `300ms` | Panel slides, modals |
| `ease-default` | `ease-out` | Standard easing |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy (sparingly) |

**Standard Patterns:**
```css
/* Hover states */
transition: all 200ms ease-out;

/* Panel slides */
transition: transform 300ms ease-out;

/* Skeleton shimmer */
animation: shimmer 1.5s ease-in-out infinite;

/* Scale on hover */
transform: scale(1.02);
transition: transform 200ms ease-out;
```

### Component Specifications

#### Cards

```scss
.card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 200ms ease-out;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
}
```

#### Buttons

**Primary Button:**
```scss
.btn-primary {
  background: #FFE600;
  color: #2E2E38;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 200ms ease-out;

  &:hover {
    background: #FFD000;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
}
```

**Secondary Button:**
```scss
.btn-secondary {
  background: transparent;
  color: #2E2E38;
  border: 1px solid #D4D4D4;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 20px;
  border-radius: 6px;

  &:hover {
    background: #F5F5F5;
    border-color: #A3A3A3;
  }
}
```

#### Inputs

```scss
.input {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 14px;
  color: #2E2E38;
  transition: all 200ms ease-out;

  &::placeholder {
    color: #A3A3A3;
  }

  &:focus {
    outline: none;
    border-color: #FFE600;
    box-shadow: 0 0 0 3px #FFF9CC;
  }
}
```

#### Risk Badges

```scss
.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;

  &--high {
    background: #FEE2E2;
    color: #B91C1C;
    border: 1px solid #FECACA;
  }

  &--medium {
    background: #FEF3C7;
    color: #B45309;
    border: 1px solid #FDE68A;
  }

  &--low {
    background: #D1FAE5;
    color: #047857;
    border: 1px solid #A7F3D0;
  }
}
```

#### Sidebar

```scss
.sidebar {
  width: 240px; // Expanded
  // width: 64px; // Collapsed
  background: #1A1A2E;
  transition: width 300ms ease-out;

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: #A3A3A3;
    transition: all 200ms ease-out;

    &:hover {
      color: #FFFFFF;
      background: rgba(255,255,255,0.05);
    }

    &--active {
      color: #FFE600;
      border-left: 3px solid #FFE600;
      background: rgba(255,230,0,0.1);
    }
  }
}
```

#### Eve Chat Panel

```scss
.eve-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: #FFFFFF;
  box-shadow: -8px 0 32px rgba(0,0,0,0.16);
  border-radius: 16px 0 0 16px;
  transform: translateX(100%);
  transition: transform 300ms ease-out;

  &--open {
    transform: translateX(0);
  }
}
```

#### Skeleton Loader

```scss
.skeleton {
  background: linear-gradient(
    90deg,
    #F5F5F5 0%,
    #E5E5E5 50%,
    #F5F5F5 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        ey: {
          yellow: '#FFE600',
          'yellow-hover': '#FFD000',
          'yellow-light': '#FFF9CC',
          'yellow-dark': '#CCB800',
          black: '#2E2E38',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#2E2E38',
          900: '#1A1A2E',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1D4ED8',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.16)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
```

### SCSS Variables

```scss
// _variables.scss

// =============================================================================
// Avengers Project Design System Variables
// =============================================================================

// Typography
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

$font-size-display: 36px;
$font-size-h1: 28px;
$font-size-h2: 22px;
$font-size-h3: 18px;
$font-size-body-lg: 16px;
$font-size-body: 14px;
$font-size-body-sm: 13px;
$font-size-caption: 12px;
$font-size-overline: 11px;

// Colors - Primary
$ey-yellow: #FFE600;
$ey-yellow-hover: #FFD000;
$ey-yellow-light: #FFF9CC;
$ey-yellow-dark: #CCB800;

// Colors - Neutrals
$neutral-50: #FAFAFA;
$neutral-100: #F5F5F5;
$neutral-200: #E5E5E5;
$neutral-300: #D4D4D4;
$neutral-400: #A3A3A3;
$neutral-500: #737373;
$neutral-600: #525252;
$neutral-700: #404040;
$neutral-800: #2E2E38;
$neutral-900: #1A1A2E;

// Colors - Semantic
$success: #10B981;
$success-light: #D1FAE5;
$success-dark: #047857;

$warning: #F59E0B;
$warning-light: #FEF3C7;
$warning-dark: #B45309;

$error: #EF4444;
$error-light: #FEE2E2;
$error-dark: #B91C1C;

$info: #3B82F6;
$info-light: #DBEAFE;
$info-dark: #1D4ED8;

// Spacing
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;

// Border Radius
$radius-sm: 4px;
$radius-md: 6px;
$radius-lg: 8px;
$radius-xl: 12px;
$radius-2xl: 16px;
$radius-full: 9999px;

// Shadows
$shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
$shadow-card: 0 1px 3px rgba(0,0,0,0.06);
$shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08);
$shadow-dropdown: 0 4px 16px rgba(0,0,0,0.12);
$shadow-modal: 0 8px 32px rgba(0,0,0,0.16);

// Transitions
$duration-fast: 100ms;
$duration-normal: 200ms;
$duration-slow: 300ms;
$ease-default: ease-out;

// Layout
$sidebar-width: 240px;
$sidebar-collapsed: 64px;
$eve-panel-width: 400px;
$header-height: 64px;
```

---

## Design Rules (MUST FOLLOW)

### Golden Rules

1. **Never use colors not in this palette** - All colors must come from the defined tokens
2. **Always use Inter font** - No other fonts allowed
3. **Hover = 200ms ease-out** - All hover transitions use this timing
4. **Cards have 12px radius** - No other border radius for cards
5. **No spinners** - Always use skeleton loaders
6. **EY Yellow is accent only** - Never use as large background areas
7. **Shadows are subtle** - Never use heavy drop shadows

### Component Checklist

Before implementing any component, verify:
- [ ] Uses only palette colors
- [ ] Uses correct typography scale
- [ ] Has proper hover states (200ms)
- [ ] Uses correct border radius
- [ ] Uses appropriate shadow level
- [ ] Has skeleton loader for loading state
- [ ] Follows spacing scale
