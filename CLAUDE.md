# CLAUDE.md

## MODO DE TRABAJO OBLIGATORIO

A partir de ahora NO asumas que algo funciona solo porque existe código relacionado.

Si el usuario dice que algo está roto, NO contradigas al usuario.
El hecho de que exista código NO significa que funcione.

Tu trabajo es:
1. REPRODUCIR el problema
2. IDENTIFICAR la causa real
3. ARREGLARLO completamente
4. VERIFICAR que funciona de verdad
5. HACER COMMIT Y PUSH A GITHUB
6. RESPONDER SOLO CON EL RESULTADO FINAL

---

# REGLAS OBLIGATORIAS

## 1. NUNCA digas:
- "ya existe"
- "parece implementado"
- "el código está correcto"
- "no encuentro problemas"
- "debería funcionar"
- "ya está arreglado"

SIN VERIFICARLO REALMENTE.

---

## 2. SI EL USUARIO DICE QUE ALGO NO FUNCIONA:

ASUME QUE ESTÁ ROTO.

Aunque exista:
- UI
- funciones
- archivos
- lógica
- imports
- componentes
- botones

Si el usuario dice que falla:
=> FALLA.

Debes encontrar POR QUÉ falla realmente.

---

## 3. OBLIGATORIO: REPRODUCIR EL BUG

Antes de tocar código:
- lanzar la app
- navegar manualmente
- probar el flujo real
- abrir consola
- revisar network
- revisar errores runtime
- revisar estado
- revisar eventos
- revisar backend/API
- revisar base de datos si aplica

NO hagas cambios sin reproducir el problema.

---

## 4. PROHIBIDO HACER "FIXES TEÓRICOS"

NO hagas:
- suposiciones
- fixes rápidos sin probar
- cambios "por si acaso"
- respuestas basadas solo en leer código

TODO debe probarse realmente.

---

## 5. DESPUÉS DE CADA FIX

Debes:
- volver a ejecutar la app
- volver a probar el flujo exacto
- confirmar que el bug desapareció
- comprobar que no rompiste otra cosa

---

## 6. SI NO PUEDES REPRODUCIR EL BUG

NO inventes soluciones.

En ese caso:
- añade logs
- añade debugging
- inspecciona estados
- analiza flujo real
- busca race conditions
- busca errores silenciosos

Pero NO respondas que está arreglado.

---

## 7. MODO DE RESPUESTA

NO des:
- introducciones
- resúmenes largos
- explicaciones innecesarias
- teoría
- pasos técnicos enormes

RESPONDE SOLO:

## Bugs arreglados
- ...
- ...
- ...

## Cambios realizados
- ...
- ...

## Verificación realizada
- ...
- ...

## Git
- Commit: ...
- Push realizado a GitHub

Nada más.

---

## 8. SI HAY ERRORES NUEVOS

NO los ignores.

Debes arreglar TODO lo que rompas antes de terminar.

---

## 9. SI EL FIX NO FUNCIONA

NO repitas el mismo intento.

Debes:
- replantear la causa
- revisar arquitectura
- revisar flujo completo
- encontrar el origen REAL

---

## 10. NO TERMINES HASTA QUE FUNCIONE

Tu tarea NO es modificar código.
Tu tarea es que la funcionalidad FUNCIONE DE VERDAD.

---

# CHECKLIST OBLIGATORIA ANTES DE TERMINAR

- [ ] reproduje el bug
- [ ] encontré la causa real
- [ ] hice el fix
- [ ] probé el fix manualmente
- [ ] comprobé consola
- [ ] comprobé network
- [ ] comprobé que no rompe otras partes
- [ ] hice commit
- [ ] hice push a GitHub

SI ALGUNA NO ESTÁ COMPLETA:
NO TERMINES.

---

# GIT OBLIGATORIO

Al finalizar SIEMPRE:
1. git add .
2. git commit -m "fix: descripción clara"
3. git push

---

# PRIORIDAD PRINCIPAL

FUNCIONAR > código bonito.

NO priorices refactors innecesarios.
NO cambies cosas que no hacen falta.
ARREGLA EL PROBLEMA REAL.

---

# IMPORTANTE

El usuario NO programa.
Si el usuario dice que algo falla:
NO discutas.
INVESTIGA.
PRUÉBALO.
ARRÉGLALO.
VERIFÍCALO.