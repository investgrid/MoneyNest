// ═══════════════════════════════════════════════════════════════
// MONEYNEST — DOMPurify Wrapper (XSS Protection)
// ═══════════════════════════════════════════════════════════════

/**
 * Safe HTML sanitization with DOMPurify
 * Usage: import { sanitizeHTML } from './core/dompurify-wrapper.js'
 */

let DOMPurify = null

// Lazy load DOMPurify
async function loadDOMPurify() {
  if (DOMPurify) return DOMPurify

  try {
    const module = await import('dompurify')
    DOMPurify = module.default || module
    return DOMPurify
  } catch (err) {
    console.error('[Sanitizer] Failed to load DOMPurify:', err)
    return null
  }
}

/**
 * Sanitize HTML string (async)
 * @param {string} dirty - Untrusted HTML
 * @param {object} config - DOMPurify config
 * @returns {Promise<string>} Clean HTML
 */
export async function sanitizeHTML(dirty, config = {}) {
  if (!dirty) return ''

  const purify = await loadDOMPurify()
  if (!purify) {
    // Fallback: basic escape
    const div = document.createElement('div')
    div.textContent = dirty
    return div.innerHTML
  }

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'div', 'p', 'br', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title'],
    ...config
  })
}

/**
 * Sanitize and set innerHTML (async)
 * @param {HTMLElement} element
 * @param {string} html
 */
export async function setSafeHTML(element, html) {
  if (!element) return
  const clean = await sanitizeHTML(html)
  element.innerHTML = clean
}

/**
 * Sync version (uses basic escaping if DOMPurify not loaded)
 * @param {string} dirty
 * @returns {string}
 */
export function sanitizeHTMLSync(dirty) {
  if (!dirty) return ''

  if (DOMPurify) {
    return DOMPurify.sanitize(dirty)
  }

  // Fallback: basic XSS protection
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

// Preload DOMPurify on module load
loadDOMPurify()

// Global access for legacy code
window.MN_sanitizeHTML = sanitizeHTML
window.MN_setSafeHTML = setSafeHTML
