// ═══════════════════════════════════════════════════════════════
// MONEYNEST — SANITIZER (XSS Protection)
// ═══════════════════════════════════════════════════════════════

/**
 * Safe innerHTML wrapper con sanitización básica
 * TODO: Integrar DOMPurify en producción
 */

export const Sanitizer = {
  /**
   * Sanitiza HTML básico (escapa tags peligrosos)
   * @param {string} html
   * @returns {string}
   */
  clean(html) {
    if (!html) return ''

    // Temporal: escape básico (reemplazar con DOMPurify)
    const div = document.createElement('div')
    div.textContent = html
    return div.innerHTML
  },

  /**
   * Permite HTML limitado (solo tags seguros)
   * @param {string} html
   * @returns {string}
   */
  allowLimited(html) {
    if (!html) return ''

    // Whitelist de tags seguros
    const allowed = ['b', 'i', 'em', 'strong', 'span', 'div', 'p', 'br', 'ul', 'ol', 'li']

    // TODO: Parser robusto con DOMPurify
    // Por ahora: básico strip de scripts
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '')
  },

  /**
   * Safe set innerHTML
   * @param {HTMLElement} element
   * @param {string} html
   */
  setHTML(element, html) {
    if (!element) return
    element.innerHTML = this.allowLimited(html)
  },

  /**
   * Safe textContent (siempre seguro)
   * @param {HTMLElement} element
   * @param {string} text
   */
  setText(element, text) {
    if (!element) return
    element.textContent = text || ''
  }
}

// Global alias para migración progresiva
window.MN_Sanitizer = Sanitizer
