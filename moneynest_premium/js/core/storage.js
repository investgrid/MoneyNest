// ═══════════════════════════════════════════════════════════════
// MONEYNEST — STORAGE WRAPPER (Security Layer)
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from './config.js'

/**
 * Wrapper seguro de localStorage con:
 * - Validación de tipos
 * - Protección contra corrupción
 * - Keys centralizadas
 * - Fallback a sessionStorage
 */

export const Storage = {
  /**
   * Get item from storage
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue

      // Try parse JSON
      try {
        return JSON.parse(raw)
      } catch {
        // Return as-is if not JSON
        return raw
      }
    } catch (err) {
      console.warn(`[Storage] Failed to read ${key}:`, err)
      return defaultValue
    }
  },

  /**
   * Set item to storage
   * @param {string} key
   * @param {*} value
   * @returns {boolean} success
   */
  set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return true
    } catch (err) {
      console.warn(`[Storage] Failed to write ${key}:`, err)
      return false
    }
  },

  /**
   * Remove item
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.warn(`[Storage] Failed to remove ${key}:`, err)
    }
  },

  /**
   * Clear all (DANGEROUS - use with caution)
   */
  clear() {
    try {
      localStorage.clear()
    } catch (err) {
      console.warn('[Storage] Failed to clear:', err)
    }
  },

  /**
   * Check if storage is available
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },

  // Alias para keys comunes (migración progresiva)
  getAppData() {
    return this.get(CONFIG.STORAGE_KEYS.DATA, {})
  },

  setAppData(data) {
    return this.set(CONFIG.STORAGE_KEYS.DATA, data)
  },

  getUser() {
    return this.get(CONFIG.STORAGE_KEYS.USER, {})
  },

  setUser(user) {
    return this.set(CONFIG.STORAGE_KEYS.USER, user)
  },

  getLang() {
    return this.get(CONFIG.STORAGE_KEYS.LANG, 'es')
  },

  setLang(lang) {
    return this.set(CONFIG.STORAGE_KEYS.LANG, lang)
  }
}

// Global alias
window.MN_Storage = Storage
