/**
 * Timing Constants
 *
 * Centralized timing values for animations, delays, and timeouts.
 * Use these instead of hardcoded magic numbers.
 */

// Animation durations
export const ANIMATION_DURATION_MS = 200;
export const ANIMATION_DURATION_FAST_MS = 100;
export const ANIMATION_DURATION_SLOW_MS = 300;

// Debounce delays
export const DEBOUNCE_DEFAULT_MS = 300;
export const DEBOUNCE_SEARCH_MS = 300;
export const DEBOUNCE_INPUT_MS = 200;

// Toast durations
export const TOAST_DURATION_MS = 5000;
export const TOAST_DURATION_SHORT_MS = 3000;
export const TOAST_DURATION_LONG_MS = 8000;

// Chart initialization delays
export const CHART_INIT_DELAY_MS = 100;
export const CHART_INIT_DELAY_SLOW_MS = 500;
export const CHART_INIT_DELAY_MEDIUM_MS = 300;
export const CHART_RENDER_DELAY_MS = 0; // Immediate render in next tick

// Upload feedback delays
export const UPLOAD_FEEDBACK_DELAY_MS = 500;
export const UPLOAD_SIMULATION_DELAY_MS = 800;

// UI transition delays
export const DROPDOWN_CLOSE_DELAY_MS = 150;
export const MODAL_TRANSITION_MS = 200;

// Polling intervals
export const NOTIFICATION_POLL_INTERVAL_MS = 30000;
export const STATUS_REFRESH_INTERVAL_MS = 60000;

// Timeouts
export const API_TIMEOUT_MS = 30000;
export const SESSION_TIMEOUT_MS = 1800000; // 30 minutes
