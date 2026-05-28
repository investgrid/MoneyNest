// ═══════════════════════════════════════════════════════════════
// MONEYNEST — RATE LIMITER
// ═══════════════════════════════════════════════════════════════

/**
 * Client-side rate limiting to prevent spam/abuse
 * Usage: RateLimiter.check('action_name', maxRequests, windowMs)
 */

export const RateLimiter = {
  limits: new Map(),

  /**
   * Check if action is rate limited
   * @param {string} key - Action identifier
   * @param {number} maxRequests - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} true if allowed, false if rate limited
   */
  check(key, maxRequests, windowMs) {
    const now = Date.now()
    const record = this.limits.get(key) || { count: 0, resetAt: now + windowMs }

    // Reset window if expired
    if (now > record.resetAt) {
      record.count = 0
      record.resetAt = now + windowMs
    }

    // Check limit
    if (record.count >= maxRequests) {
      return false // Rate limited
    }

    // Increment counter
    record.count++
    this.limits.set(key, record)
    return true
  },

  /**
   * Get remaining requests for a key
   * @param {string} key
   * @param {number} maxRequests
   * @returns {number}
   */
  remaining(key, maxRequests) {
    const record = this.limits.get(key)
    if (!record) return maxRequests
    return Math.max(0, maxRequests - record.count)
  },

  /**
   * Reset limit for a key
   * @param {string} key
   */
  reset(key) {
    this.limits.delete(key)
  },

  /**
   * Clear all limits
   */
  clearAll() {
    this.limits.clear()
  }
}

// Presets for common actions
export const RATE_LIMITS = {
  // API calls
  STRIPE_CHECKOUT: { max: 3, window: 60000 },      // 3 per minute
  EXPORT_PDF: { max: 5, window: 300000 },          // 5 per 5 min
  EXPORT_EXCEL: { max: 5, window: 300000 },
  IMPORT_CSV: { max: 10, window: 600000 },         // 10 per 10 min

  // CRUD operations
  CREATE_INGRESO: { max: 30, window: 60000 },      // 30 per minute
  CREATE_GASTO: { max: 30, window: 60000 },
  CREATE_INVERSION: { max: 20, window: 60000 },
  CREATE_DEUDA: { max: 10, window: 60000 },

  // Bulk operations
  BULK_DELETE: { max: 5, window: 60000 },          // 5 per minute

  // External requests
  SYNC_SUPABASE: { max: 10, window: 60000 },       // 10 per minute

  // Auth
  LOGIN_ATTEMPT: { max: 5, window: 300000 },       // 5 per 5 min
  REGISTER_ATTEMPT: { max: 3, window: 600000 },    // 3 per 10 min
}

/**
 * Helper: check with preset
 * @param {string} preset - Key from RATE_LIMITS
 * @returns {boolean}
 */
export function checkRateLimit(preset) {
  const config = RATE_LIMITS[preset]
  if (!config) {
    console.warn(`[RateLimiter] Unknown preset: ${preset}`)
    return true
  }
  return RateLimiter.check(preset, config.max, config.window)
}

// Global access
window.MN_RateLimiter = RateLimiter
window.MN_checkRateLimit = checkRateLimit
window.MN_RATE_LIMITS = RATE_LIMITS

// Example usage:
// if (!checkRateLimit('STRIPE_CHECKOUT')) {
//   toast('Demasiadas peticiones. Espera 1 minuto.', 'error')
//   return
// }
