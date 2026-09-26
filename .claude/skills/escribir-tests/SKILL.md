---
name: escribir-tests
description: Añade tests con Jest y Testing Library al código existente - lógica pura, capa de datos con Supabase simulado y componentes. Úsala cuando pidan tests, antes de refactorizar algo delicado o tras arreglar un bug.
argument-hint: '[qué probar]'
---

# Escribir tests

Objetivo: $ARGUMENTS

## Qué testear (por orden de valor)

1. **Lógica pura** (`src/utils`): validación, fechas, cálculos, transformaciones. Rápido y muy rentable.
2. **Capa de datos** (`src/api`) con Supabase **simulado**: que llama a la tabla correcta, valida antes de enviar, no manda `user_id`, propaga errores. Modelo: `src/api/__tests__/notes.test.ts` (`mockQuery`).
3. **Componentes** con comportamiento (`src/components`): se pulsan, se deshabilitan, muestran estados. Modelo: `src/components/ui/__tests__/Button.test.tsx`.
4. Las **reglas RLS** no se prueban con Jest: prueba manual con dos usuarios en la app, `/revisar-seguridad`, y el CI (`check:rls` en el PR).

## Convenciones

- Archivo en `__tests__/` junto al código: `src/utils/__tests__/dates.test.ts`.
- Nombres en castellano que describan el comportamiento: `it('no manda user_id (lo pone la base de datos)')`.
- Un comportamiento por `it`. Arrange / act / assert.
- Casos límite: vacío, máximo, caracteres raros, error de red.
- Nada de red ni base de datos reales en Jest. Fechas: pasa `now` como parámetro.
- Testing Library v14: `await render(...)`, `await fireEvent.press(...)`; busca por rol/texto (`getByRole('button', { name: 'Guardar' })`), como lo haría un usuario.
- Variables de entorno y mocks globales ya están en `jest.setup.js`.

## Ejecutar

```bash
npm test -- src/utils/__tests__/dates.test.ts
npm test
```

Comprueba que el test **falla** si rompes a propósito lo que prueba (si no falla nunca, no prueba nada).
Termina con `npm run check`.
