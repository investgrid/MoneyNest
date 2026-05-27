# 🐛 BUGS REALES ENCONTRADOS — 2026-05-27

## BUG #1: Onboarding no aparece en cuentas nuevas

**Causa raíz:** El flag `mn7_ob_seen_v2` está en `ACCOUNT_SCOPED_KEYS` pero también en `MIGRATION_EXCLUDE`. Cuando se crea una cuenta nueva, el proxy lee el flag desde el namespace de esa cuenta, pero como nunca se escribió, devuelve `null`, lo que `_obFlagSeen()` interpreta como `false`. Sin embargo, si el usuario ya completó onboarding en otra cuenta, el flag global antiguo puede estar presente.

**Archivos afectados:**
- `accounts.js` línea 20-28 (ACCOUNT_SCOPED_KEYS)
- `accounts.js` línea 81 (MIGRATION_EXCLUDE)
- `app.js` línea 11575 (_obFlagSeen)
- `app.js` línea 11580-11597 (checkOnboarding)

**Pasos para reproducir:**
1. Crear cuenta nueva desde el selector
2. El onboarding NO aparece (debería aparecer)

**Fix:**
El flag debe escribirse correctamente al namespace de cada cuenta. El problema es que cuando se llama `switchAccount()`, se llama `checkOnboarding()` que lee el flag ANTES de que el proxy esté apuntando a la nueva cuenta.

---

## BUG #2: Filtro de período NO filtra nada

**Causa raíz:** Los botones de período tienen `onclick="_gTimePeriod='month';${onChangeFn}"` pero `onChangeFn` es una **string** que debe ejecutarse, no una referencia a función.

**Archivos afectados:**
- `app.js` línea 3675-3679 (_gFilterBar)

**Evidencia:**
```js
// LÍNEA 3675-3679
onclick="_gTimePeriod='month';${onChangeFn}"
```

Si `onChangeFn` es `'renderGastos()'`, el resultado es:
```html
onclick="_gTimePeriod='month';renderGastos()"
```

Esto funciona ✅ PERO solo si el `onChangeFn` incluye los paréntesis.

**Verificar en consola:**
```js
// En Gastos:
_gTimePeriod = 'year'
renderGastos()
// ¿Se filtran correctamente?

// En Ingresos:
_gTimePeriod = 'year'
renderIngresos()
// ¿Se filtran correctamente?
```

---

## BUG #3: Ingresos usa filtro híbrido (periodo + mes legacy)

**Causa raíz:** `renderIngresos()` tiene lógica dual:
- Si `_ingMesFilter` está activo → usa ese filtro (legacy)
- Si no → usa `_gDateInPeriod()` (nuevo sistema)

**Archivos afectados:**
- `app.js` línea 4461-4470

**Problema:**
El dropdown de "Mes" y los botones de período conviven, causando confusión.

**Fix:**
Eliminar `_ingMesFilter` completamente y usar solo `_gTimePeriod`.

---

## PLAN DE FIX (orden de prioridad)

### 1️⃣ Fix Onboarding (P0)
- [ ] Verificar que `checkOnboarding()` se llama DESPUÉS de que el proxy esté activo
- [ ] Añadir debug logs para verificar el flujo
- [ ] Testear creando cuenta nueva desde el selector

### 2️⃣ Fix Filtro de Período (P0)
- [ ] Verificar que `_gFilterBar()` genera el HTML correcto
- [ ] Probar manualmente en consola: `_gTimePeriod='year'; renderGastos()`
- [ ] Verificar que `_gDateInPeriod()` funciona correctamente

### 3️⃣ Fix Ingresos Filtro Híbrido (P1)
- [ ] Eliminar `_ingMesFilter` de la UI
- [ ] Actualizar `renderIngresos()` para usar solo `_gDateInPeriod()`
- [ ] Verificar que el KPI usa el período correcto

### 4️⃣ Auditoría Completa (P1)
- [ ] Verificar Deudas filtro por período
- [ ] Verificar Objetivos filtro por período
- [ ] Verificar Inversiones filtro por período
- [ ] Verificar Presupuestos usa mes del período

---

## NOTAS

- **Accounts.js proxy:** Se instala una sola vez globalmente, modifica `Storage.prototype`
- **switchAccount():** Cambia `_activeId` y llama `load()` + `render()` + `checkOnboarding()`
- **Onboarding flag:** `mn7_ob_seen_v2` debe estar en namespace correcto para cada cuenta
