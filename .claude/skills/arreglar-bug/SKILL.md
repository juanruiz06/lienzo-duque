---
name: arreglar-bug
description: Encuentra y arregla un fallo con método - reproducir, localizar la causa raíz, test que falla, arreglo mínimo, verificación y explicación. Úsala cuando algo no funciona, sale un error, la app se cierra o "antes iba y ahora no".
argument-hint: '[qué pasa, dónde y cuándo]'
---

# Arreglar un bug

Síntoma: $ARGUMENTS

No adivines. Un arreglo sin entender la causa suele esconder el fallo y crear otro.

## 1. Datos del fallo

Si falta información, pide (máximo 3 preguntas): pasos exactos, qué esperaba vs qué pasa, texto del
error o captura, en qué plataforma (iOS/Android/web), si pasaba antes (y qué cambió desde entonces).
Mira también: salida de Metro (terminal de `npm start`), `git log --oneline -10`, `git diff`.

## 2. Reproducir

Consigue ver el fallo tú mismo (app, test o script). Si no se reproduce, dilo y busca qué es distinto
(usuario, datos, red, plataforma).

## 3. Localizar (sigue el flujo de datos)

`Pantalla (src/app) → hook (src/hooks) → api (src/api) → Supabase → tabla/policy`

Pistas por síntoma:

- **Lista vacía que debería tener datos** → casi siempre **RLS** (la policy no deja ver) o falta `grant`. Prueba la consulta en el SQL Editor / Table Editor de Supabase (o Studio y el MCP `supabase-local` en modo local).
- **"permission denied for table"** → falta `grant … to authenticated` en la migración.
- **Guardo y no se actualiza la lista** → falta `invalidateQueries` o la clave no coincide con `queryKeys`.
- **"Network request failed" / "Sin conexión"** → proyecto de Supabase **pausado** por inactividad (panel → Restore), URL mal en `.env` (`npm run doctor`), o en modo local `127.0.0.1` en un móvil físico.
- **El móvil no carga la app (Expo Go)** → distinta wifi o Firewall de Windows; `npm run start:tunnel`.
- **Pantalla roja / crash al abrir** → error de import o de tipos; `npm run typecheck`.
- **Funciona en web pero no en móvil (o al revés)** → API específica de plataforma (`Alert`, `window`…).
- **Tras añadir una librería, crash en Expo Go** → tiene código nativo: hace falta development build.
- **Error en una Edge Function** → Supabase → Edge Functions → Logs (o `npx supabase functions serve` en modo local).

Formula la causa en una frase antes de tocar código: "falla porque…".

## 4. Test que falla (cuando se pueda)

Si la causa está en lógica testeable (`utils`, `api`, un componente), escribe primero un test que
reproduzca el fallo y compruébalo en rojo (`npm test -- <archivo>`).

## 5. Arreglo mínimo

Cambia lo justo para la causa raíz. No aproveches para refactorizar otras cosas.

## 6. Verificar

Test en verde, `npm run check`, y reproduce el escenario original en la app: ya no falla.
Si tocaste la base: migración NUEVA aplicada (nube: `npm run db:push` con OK; local: `npm run db:reset`) y `npm run db:types`.

## 7. Explicar

En 3-4 frases llanas: qué pasaba, por qué, qué has cambiado (con enlaces), y cómo evitar que vuelva.
