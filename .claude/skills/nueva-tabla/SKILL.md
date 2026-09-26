---
name: nueva-tabla
description: Crea o cambia tablas de la base de datos Supabase con una migración segura - RLS, policies, GRANTs, índices, trigger updated_at, aplicar en local, regenerar tipos y verificar. Úsala para cualquier cambio de esquema (tabla nueva, columna nueva, índice, policy).
argument-hint: '[qué tabla o cambio]'
---

# Migración de base de datos segura

Cambio: $ARGUMENTS

Referencia obligatoria: `supabase/migrations/20260926000100_notes.sql` (tabla nueva) y
`20260926000000_base.sql` (triggers, funciones). Reglas: `INVARIANTS.md` → INV-DB-1 a 7.

## Pasos

1. **Nunca edites una migración existente** (INV-DB-4). Crea una nueva:
   ```bash
   npm run db:new -- nombre_en_snake_case
   ```
2. **Escribe el SQL** en el archivo creado. Plantilla de tabla nueva:

   ```sql
   create table public.tasks (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
     title text not null check (char_length(title) between 1 and 200),
     done boolean not null default false,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );

   create index tasks_user_id_created_at_idx on public.tasks (user_id, created_at desc);

   create trigger tasks_set_updated_at
     before update on public.tasks
     for each row execute function public.set_updated_at();

   alter table public.tasks enable row level security;

   create policy "tasks: el dueño lee"   on public.tasks for select to authenticated
     using (user_id = (select auth.uid()));
   create policy "tasks: el dueño crea"  on public.tasks for insert to authenticated
     with check (user_id = (select auth.uid()));
   create policy "tasks: el dueño edita" on public.tasks for update to authenticated
     using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
   create policy "tasks: el dueño borra" on public.tasks for delete to authenticated
     using (user_id = (select auth.uid()));

   grant select, insert, update, delete on public.tasks to authenticated;
   revoke all on public.tasks from anon;
   ```

   Criterios:
   - `check` con límites en todo texto (y los mismos en zod).
   - Índice para la consulta principal (normalmente `user_id` + orden).
   - FK a `auth.users` con `on delete cascade` si son datos de un usuario (borrado de cuenta).
   - **Datos compartidos** (p. ej. miembros de un grupo): la policy de SELECT usa `exists (select 1 from … where … = (select auth.uid()))`. Si la lógica se complica, una función `security definer` con `set search_path = ''` y `stable`. Explica la regla en un comentario SQL en castellano.
   - Columna nueva en tabla con datos: `not null` solo con `default`, o en dos pasos.
   - Renombrar/borrar columnas rompe apps ya instaladas que las usan → avisa y propone hacerlo en dos fases (añadir nueva, migrar, borrar vieja más tarde).

3. **Aplica la migración.** Mira el modo en `.env` (`supabase.co` = nube) o con `npm run doctor`:
   - **Nube (lo normal)**: es su proyecto de desarrollo. Revisa el SQL una última vez, explícale
     en una frase qué cambia y, con su OK: `npm run db:push`. Si el push falla por un error de SQL,
     NO se ha aplicado nada: corrige el archivo (aún no está aplicado, se puede editar) y repite.
   - **Local (Docker)**: `npm run db:reset` (recrea la base local; el seed vuelve).
4. **Tipos**: `npm run db:types`. En modo local, además `npm run check:rls`. En modo nube, las
   reglas las comprueba el CI (`check:rls`) al abrir el PR; revísalas tú contra INV-DB-1/2/3/5.
5. **Prueba el RLS de verdad** si hay datos por usuario: con dos cuentas en la app (el usuario B no
   debe ver ni tocar filas de A). En la nube, también en el SQL Editor de Supabase.
6. **Seed** (opcional): añade datos de ejemplo a `supabase/seed.sql` para el usuario demo.
7. **Producción**: si ya existe un proyecto de producción (nivel 10), la migración llega a él
   solo por PR + workflow `deploy-supabase.yml`, nunca con un push a mano.

Explica al final, en castellano llano, qué reglas de acceso tiene la tabla ("solo tú ves tus tareas").
