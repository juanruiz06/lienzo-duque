---
name: implement-task
description: Flujo completo para implementar una tarea de punta a punta en este proyecto - entender, preguntar, brainstorm si toca, clasificar por dificultad/riesgo, plan o spec con OK del dueño, implementación por partes con subagentes acotados, verificación, prueba en su móvil, documentación, PR y despliegue. Solo se invoca a mano con /implement-task.
disable-model-invocation: true
argument-hint: '<qué hay que hacer>'
---

# implement-task

Tarea: `$ARGUMENTS`

Un único flujo para cualquier tarea, con la ceremonia graduada por dificultad. La sesión
principal es el **orquestador**: decide, parte el trabajo, hace los commits y habla con el
dueño. Los subagentes ejecutan y devuelven resultados; nunca hablan con el dueño ni hacen commits.

**El dueño no es técnico, usa Windows y ve la app en su móvil con Expo Go** (ver "Entorno del
dueño" en `AGENTS.md`). En cada parada (gate) explícale en lenguaje llano qué va a pasar y qué
necesitas que decida, con tu recomendación. Nada de jerga sin traducir.

Referencias (léelas cuando el paso lo diga, no antes):

- `references/spec-template.md` — plantilla de spec técnica (media y compleja).
- `references/matriz-verificacion.md` — qué comprobar y cómo desplegar según lo que se toque.

Agentes (en `.claude/agents/`, se llaman por nombre con la herramienta `Agent`):

| Agente             | Para qué                                      |
| ------------------ | --------------------------------------------- |
| `idea-scout`       | Una óptica del brainstorm (paso 2)            |
| `spec-writer`      | Escribe la spec (media y compleja)            |
| `spec-reviewer`    | Revisión escéptica de la spec (solo compleja) |
| `task-implementer` | Implementa UN nodo del plan                   |
| `task-verifier`    | El único que corre la verificación (paso 6)   |

## Reglas que valen en todo el flujo

- **Presupuesto de subagentes = máximo SIMULTÁNEO**: fácil **0**, media **2**, compleja **3**.
  Los subagentes gastan mucho del límite de uso del plan de Claude: si una tarea media se puede
  hacer bien sin ellos, hazla tú.
- **Ningún subagente lanza subagentes.** Usa solo los agentes de la tabla (no `general-purpose`).
- **Gates del dueño (esperas de verdad, no avisos):** G1 preguntas · G2 opción del brainstorm ·
  G3 plan/spec (media/compleja) · G4 prueba en su móvil · G5 merge · G6 cualquier cosa que
  **cueste dinero** o toque **producción**. En cada gate paras el turno y esperas respuesta.
- **Reclasifica hacia arriba** en cuanto el alcance crezca (aparece una migración o una
  dependencia nativa que no estaban). Avisa en una línea con el motivo.
- **Commits según se avanza**, por ti, añadiendo archivos **por nombre** (nunca `git add -A`).
- `AGENTS.md`, `CLAUDE.md` e `INVARIANTS.md` mandan sobre esta skill si chocan.
- Comandos que tenga que ejecutar él: para Windows, uno por bloque, sin `&&`.

---

## Paso 0 · Recon (siempre, antes de preguntar nada)

1. Lee lo que toque de `AGENTS.md` e `INVARIANTS.md`, y busca specs relacionadas:
   `grep -ril "<palabra clave>" docs/`.
2. Localiza el código implicado (Grep/Glob). Mira el modo de base de datos (`.env`:
   `supabase.co` = nube de desarrollo; `127.0.0.1` = local con Docker).
3. Anota las **decisiones ya cerradas por el dueño** que afecten (specs, `docs/decisiones/`).
4. Git: `git status` y `git branch --show-current`. Si estás en `main` o hay cambios sin
   commitear que no son de esta tarea, **no empieces ahí**: rama nueva desde `main` actualizado
   (`git checkout main`, `git pull` si hay GitHub, `git checkout -b <tipo>/<descripcion>`). Si hay
   cambios a medias, pregúntale qué hacer con ellos antes.

## Paso 1 · Entender la tarea (G1)

Reformula la tarea en 1–3 frases **de usuario**: qué verá distinto en la app y cómo sabremos que
está bien. Pregunta **solo** lo que el recon no resuelve y cambia lo que vas a hacer (con
`AskUserQuestion`, recomendación primero, opciones en lenguaje llano). Si no hay dudas reales,
no preguntes y sigue.

## Paso 2 · Brainstorm (solo si se dispara) (G2)

Se dispara si la tarea pregunta **qué** hacer (función nueva, diseño, textos), si hay ≥2 formas
de hacerlo con costes muy distintos, o si el dueño lo pide. Un bug con causa clara, **no**.

- **Fácil:** en línea, sin subagentes: tres opciones en un párrafo y tu recomendación.
- **Media/compleja:** 2 `idea-scout` **en paralelo y en el mismo mensaje**, cada uno con una óptica:
  1. _Usuario_: una persona real usando la app con prisa, con el móvil en una mano.
  2. _Pragmática_: lo mínimo que resuelve el 80 %, sin tocar nada nativo ni pagar nada.
     (La óptica _radical_ — qué haría la mejor app del mundo sin miedo — solo si el dueño quiere ideas.)
     Pásales el resumen del paso 1, el código relevante y las decisiones cerradas.
- **Convergencia (tú):** tabla de 3–5 opciones: _qué es · esfuerzo · riesgo · ¿cuesta dinero? ·
  ¿rompe Expo Go? · recomendada_. Incluye siempre la mínima. Una ronda; sin ganadora clara, preguntas.
- La opción elegida **y por qué se descartaron las otras** van al plan o la spec.

## Paso 3 · Clasificar

### Dificultad = max(tamaño, riesgo)

|            | Fácil                            | Media                                                         | Compleja                                                    |
| ---------- | -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| **Tamaño** | 1 área, ≤~5 archivos, sin dudas  | varias áreas o ~5–15 archivos                                 | muchas áreas, varias tablas nuevas, varias oleadas          |
| **Riesgo** | solo app (JS), fácil de deshacer | migración, RLS/policy, Edge Function, datos de otros usuarios | auth/login, borrado de datos, pagos, dependencia **nativa** |

Subidas automáticas: migración/RLS/Edge Function → **mínimo media**. Dependencia nativa,
cambios en `app.json`/`eas.json`, login o pagos → **compleja**.

**Dependencia nativa = para y avisa antes de seguir.** Con ella, **Expo Go deja de servir**: hace
falta un development build (`docs/graduacion/02-builds-con-eas.md`), y en iPhone eso exige la
cuenta de Apple Developer (99 $/año). Propón primero una alternativa que funcione en Expo Go.

### Tipo y skills

Etiqueta el tipo y **carga con `Skill` las que encajen** antes de planificar:

- Pantallas/UI → `nueva-pantalla`, `nuevo-componente`, `pulir-ui`, `vercel-react-native-skills`,
  `vercel-composition-patterns`.
- Base de datos → `nueva-tabla`; si hay datos compartidos entre usuarios, también
  `revisar-arquitectura`.
- Servidor → `edge-function`; emails → `enviar-email`; fotos → `subir-imagenes`.
- Cualquier cosa con login, datos de otros, pagos o claves → `anti-hackeo` (modo revisión de cambio).
- Supabase / Expo → documentación oficial (versión 57 de Expo: `https://docs.expo.dev/versions/v57.0.0/`).

### Superficie

Marca las que apliquen: **app (JS)** · **migración** · **Edge Function** · **nativo** ·
**servicio externo** (y si cuesta dinero). Anúncialo en una línea, por ejemplo:
`Clasificación: media · base de datos + pantallas · migración + app · 2 subagentes.`

## Paso 4 · Plan o spec (G3 en media/compleja)

**Fácil — plan en línea** (en el chat): archivos a tocar, pasos, tests y cómo lo comprobarás.
Sin gate: sigue.

**Media — spec** con `spec-writer`. Si ya hay spec de producto de `/planificar`
(`docs/specs/NNN-*.md`), se amplía esa. Si no: `docs/specs/NNN-<slug>.md` con el siguiente
número libre. Plantilla: `references/spec-template.md`.

**Compleja — spec + revisión escéptica:**

1. `spec-writer` escribe la spec completa (con el plan por partes y cómo deshacerlo).
2. `spec-reviewer` la revisa contra el código e `INVARIANTS.md`.
3. Aplicas lo bloqueante. **Máximo 2 rondas**; si sigue habiendo bloqueantes, se los enseñas al dueño.

**G3:** resumen para el dueño en ≤12 líneas y en llano: qué verá cambiar, qué no se hace, si
cuesta dinero, si rompe Expo Go, riesgos, y decisiones abiertas con tu recomendación. Espera su OK.
Sus decisiones van a la sección «Decisiones» de la spec.

## Paso 5 · Implementar por partes (DAG)

1. **Plan por partes:** cada nodo es algo que un agente cierra solo, con sus **archivos exactos**.
   Las dependencias reales marcan el orden: esquema zod/tipos → migración → `src/api` → hooks →
   pantallas.
2. **Oleadas:** lo que no depende de nada va primero. Los contratos compartidos (tipos, esquemas
   zod, `queryKeys`) en la primera oleada aunque sean pequeños.
3. **Sin pisarse:** nodos de la misma oleada con **archivos distintos**. Toda la parte SQL en
   **un solo nodo**. Lanza los `task-implementer` de una oleada en el mismo mensaje, hasta el
   presupuesto.
4. **Encargo de cada implementer** (autocontenido; no ve esta conversación): objetivo, archivos que
   PUEDE tocar, contrato de entrada/salida, extracto de la spec, reglas de `INVARIANTS.md` que
   aplican, tests a escribir y el comando para correrlos (`npx jest <ruta>`).
5. **Fácil:** lo implementas tú, con el mismo rigor (tests incluidos).
6. **Migraciones:** cuando el nodo SQL esté listo, aplícala a la base de **desarrollo** para poder
   seguir: nube → explícale en una frase qué cambia y, con su OK, `npm run db:push`; local →
   `npm run db:reset`. Después `npm run db:types`.
7. Al cerrar cada oleada: revisa los diffs, `npx tsc --noEmit` y **commit** de la oleada.

## Paso 6 · Verificar

1. Un único `task-verifier` corre `references/matriz-verificacion.md` según la superficie (en
   fácil la corres tú).
2. El verifier diagnostica y **no arregla**. Repartes el arreglo y se vuelve a verificar.
   **Máximo 2 rondas**; a la tercera, paras y se lo cuentas al dueño con la salida exacta.
3. **Revisión del diff completo:** si existe la skill `code-review`, úsala (low en fácil, medium
   en media, high en compleja). Si se tocó login, RLS, Edge Functions, claves o datos personales:
   `anti-hackeo` en modo "revisión de cambio". Si se tocó el modelo de datos o hay piezas nuevas:
   `revisar-arquitectura` en modo "cambio". Aplica o descarta cada hallazgo con motivo.

## Paso 7 · Míralo tú y luego pruébalo él (G4, si el cambio se ve)

1. **Antes de pedirle nada, míralo tú**: `npm start` y abre la versión web (tecla `w`, o el
   navegador integrado si lo tienes). Recorre el flujo, los estados vacío/error y el modo oscuro.
   Haz capturas si puedes.
2. Dale una checklist corta para **su móvil con Expo Go**: qué tocar, qué debería ver, y los casos
   límite (sin conexión, texto muy largo, lista vacía, Android/iPhone si tiene ambos).
3. **Espera su prueba.** Lo que diga vuelve al paso 5 (y a G3 si cambia el alcance).

## Paso 8 · Documentación (rápida)

- **Spec** (media/compleja): marca lo hecho, lo que cambió respecto al plan y las decisiones de su prueba.
- **`AGENTS.md`**: solo si has aprendido algo que **va a volver a morder** (una trampa, un "nunca
  hagas X"). Una entrada corta. Si no pasa ese listón, no se toca.
- **Decisiones de diseño importantes** (una tabla nueva compartida, un servicio externo): una
  entrada en `docs/decisiones/` (ver skill `revisar-arquitectura`).

## Paso 9 · Integrar (G5)

**Con GitHub configurado (nivel 1):**

1. `git fetch` y `git rebase origin/main` (o merge si hay conflictos gordos). Si hay migración,
   comprueba que su fecha sigue siendo la última.
2. `git log --stat main..HEAD` para confirmar que no viaja nada ajeno. `git push -u origin HEAD`.
3. `gh pr create` en castellano: qué y por qué (en llano), qué se tocó, pruebas hechas, capturas,
   pasos de despliegue, riesgos y cómo deshacerlo, enlace a la spec.
4. Explícale que el CI de GitHub lo comprobará todo (incluidas las reglas de seguridad de la base
   de datos, que en su ordenador no se pueden correr sin Docker). **Espera su OK para mergear.**

**Sin GitHub todavía (nivel 0):** con su OK, `git checkout main` y `git merge --squash <rama>`,
y un commit con buen mensaje. Recomiéndale el nivel 1: el CI revisa cosas que en local no se ven.

## Paso 10 · Desplegar y comprobar

Mergear no siempre despliega. Sigue `references/matriz-verificacion.md` §Despliegue según su nivel:

- **Solo desarrollo (nivel 0–1):** la migración ya se aplicó en el paso 5; con eso está.
- **Con producción (nivel 10):** la migración llega a producción al mergear por el workflow
  `deploy-supabase.yml` (con el CI en verde antes). Edge Functions, igual.
- **App publicada:** cambios solo de JS → `/actualizar-ota` (nivel 7); nativos → `/publicar`.

La tarea está hecha cuando funciona donde la usan, no cuando se mergea. Cierra con un resumen de
3–4 frases en llano: qué cambió, dónde está, y qué comprobar.
