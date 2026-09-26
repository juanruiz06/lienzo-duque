---
name: planificar
description: Convierte una idea de feature en una especificación corta (docs/specs/NNN-nombre.md) antes de programar - qué hace, pantallas, datos, reglas de acceso, casos límite y fases. Úsala cuando digan "quiero que la app haga…", "tengo una idea", "cómo haríamos…" o antes de cualquier feature que toque base de datos o varias pantallas.
argument-hint: '[descripción de la idea]'
---

# Planificar una feature (spec antes de código)

Idea: $ARGUMENTS

Programar sin plan es lo que más tiempo hace perder. Una spec de 1-2 páginas evita el 80 % de
los "ah, no había pensado en eso". NO escribas código en esta skill.

## Proceso

1. **Entiende la idea**. Haz como mucho 3-5 preguntas concretas (con opciones cuando se pueda) sobre
   lo que no esté claro: ¿quién la usa?, ¿qué ve y qué toca?, ¿los datos son privados, compartidos
   con amigos o públicos?, ¿qué pasa si no hay conexión o no hay datos?
2. **Lee el código relacionado** para aterrizar la spec en lo que ya existe (tablas, pantallas, hooks).
3. **Escribe la spec** copiando `docs/specs/_plantilla.md` a `docs/specs/NNN-nombre-corto.md`
   (NNN = siguiente número libre). Rellena todas las secciones; si una no aplica, di "no aplica" y por qué.
4. **Modelo de datos en detalle**: tablas, columnas con tipo y límites, quién puede leer/crear/
   editar/borrar cada fila (esto se convertirá en las policies RLS). Si hay datos compartidos entre
   usuarios, piensa bien la policy: es donde más fallos de seguridad hay.
5. **Divide en fases entregables** (cada una termina con algo que se puede probar). La fase 1
   debe ser pequeña: lo mínimo para ver valor.
6. **Presenta un resumen** de 5-8 líneas y pide OK. Cuando lo dé, sugiere `/nueva-feature` con la spec.

## Checklist de una buena spec

- [ ] Se entiende sin haber estado en la conversación.
- [ ] Cada pantalla tiene sus estados: cargando, vacío, error, con datos.
- [ ] Cada tabla tiene sus reglas de acceso escritas en castellano ("solo el dueño ve sus tareas").
- [ ] Hay una sección "Fuera de alcance" (lo que NO se hace ahora).
- [ ] Hay casos límite (textos larguísimos, borrar algo en uso, dos móviles a la vez…).
- [ ] Coste: si necesita un servicio de pago o un nivel de graduación, se dice.
