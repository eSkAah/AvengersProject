import { trigger, transition, style, query, animate, group } from '@angular/animations';

/**
 * Route transition animations for smooth page navigation
 * Premium 2026-level transitions with fade and slide effects
 */
export const routeAnimations = trigger('routeAnimations', [
  // Fade transition for all routes
  transition('* <=> *', [
    // Set initial state
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          opacity: 1,
        }),
      ],
      { optional: true }
    ),

    // Animate out the leaving component
    query(
      ':leave',
      [
        animate(
          '200ms ease-out',
          style({
            opacity: 0,
            transform: 'translateY(-10px)',
          })
        ),
      ],
      { optional: true }
    ),

    // Animate in the entering component
    query(
      ':enter',
      [
        style({
          opacity: 0,
          transform: 'translateY(10px)',
        }),
        animate(
          '300ms ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
          })
        ),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Fade in animation for elements appearing on screen
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [style({ opacity: 0 }), animate('300ms ease-out', style({ opacity: 1 }))]),
]);

/**
 * Slide in from bottom animation
 */
export const slideInUp = trigger('slideInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/**
 * Slide in from right animation (for panels)
 */
export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })),
  ]),
]);

/**
 * Scale in animation for cards and modals
 */
export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
]);

/**
 * Stagger animation for lists
 */
export const staggerList = trigger('staggerList', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Expand/collapse animation for accordions
 */
export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate('250ms ease-out', style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    style({ height: '*', opacity: 1, overflow: 'hidden' }),
    animate('200ms ease-in', style({ height: 0, opacity: 0 })),
  ]),
]);

/**
 * Pulse animation for attention-grabbing elements
 */
export const pulse = trigger('pulse', [
  transition('* => pulse', [
    animate('300ms ease-in-out', style({ transform: 'scale(1.05)' })),
    animate('300ms ease-in-out', style({ transform: 'scale(1)' })),
  ]),
]);
