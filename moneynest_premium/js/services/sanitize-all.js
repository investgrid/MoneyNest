// ═══════════════════════════════════════════════════════════════
// MONEYNEST — SANITIZE ALL innerHTML (Migration Helper)
// ═══════════════════════════════════════════════════════════════

import { sanitizeHTMLSync } from '../core/dompurify-wrapper.js'

/**
 * Replace all innerHTML assignments with sanitized versions
 * Call once on app init: sanitizeAllHTML()
 */

export function sanitizeAllHTML() {
  // Override innerHTML setter globally
  const originalInnerHTMLSetter = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'innerHTML'
  ).set

  Object.defineProperty(Element.prototype, 'innerHTML', {
    set: function(value) {
      if (typeof value === 'string') {
        // Sanitize before setting
        const sanitized = sanitizeHTMLSync(value)
        originalInnerHTMLSetter.call(this, sanitized)
      } else {
        originalInnerHTMLSetter.call(this, value)
      }
    },
    get: function() {
      return this.innerHTML
    }
  })

  console.log('[Security] innerHTML sanitization enabled globally')
}

// Auto-enable on import (can disable for dev)
if (typeof window !== 'undefined' && !window.MN_DISABLE_SANITIZE) {
  sanitizeAllHTML()
}

window.MN_sanitizeAllHTML = sanitizeAllHTML
