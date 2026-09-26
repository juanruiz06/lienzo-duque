---
name: explicar
description: Explica código, conceptos o "cómo funciona X" de este proyecto a alguien que está aprendiendo, sin jerga, con analogías y señalando los archivos reales. Úsala cuando pregunten "qué hace esto", "no entiendo", "cómo funciona", "por qué se hace así" o pidan aprender.
argument-hint: '[archivo, concepto o pregunta]'
---

# Explicar sin jerga

Tema: $ARGUMENTS (si viene vacío, pregunta qué quiere entender y ofrece: "la arquitectura", "cómo
llega una nota de la base de datos a la pantalla", "qué es RLS", "qué hace este archivo").

## Cómo explicar

1. **Lee primero el código real** relacionado. Nunca expliques de memoria algo que está en el repo.
2. **Empieza por el para qué** (1 frase), luego el cómo.
3. **Una analogía** cotidiana si el concepto es abstracto. Ejemplos que funcionan:
   - RLS = el portero de la discoteca: la base de datos mira quién eres en cada petición y solo te deja ver tus filas.
   - React Query = una libreta de apuntes: guarda lo que ya preguntaste al servidor para no volver a preguntarlo cada vez.
   - Migración = una receta numerada: cada archivo es un paso para construir la base de datos desde cero, siempre en el mismo orden.
   - Edge Function = la trastienda: código que corre en el servidor, donde puedes guardar llaves que el cliente no debe ver.
   - Hook = un enchufe: la pantalla se conecta a él y recibe datos ya listos (cargando, error, datos).
4. **Señala los archivos** con enlaces `[archivo.ts:42](src/…/archivo.ts:42)` y cita 3-10 líneas clave, no el archivo entero.
5. **Sigue el recorrido** cuando pregunte "cómo funciona X": de la pantalla al hook, a la api, a Supabase, a la tabla/policy SQL. Un diagrama ASCII corto ayuda:
   ```
   NotesScreen → useNotes() → listNotes() → supabase.from('notes') → Postgres (RLS: solo tus filas)
   ```
6. **Cierra comprobando**: una pregunta corta tipo "¿Quieres que veamos qué pasaría si…?" o un mini-ejercicio ("prueba a cambiar X y mira qué pasa").

## Qué evitar

- Siglas sin explicar. Si usas una (API, RLS, JWT), explícala la primera vez.
- Explicar todo a la vez. Máximo 3 ideas nuevas por respuesta.
- Cambiar código: esta skill solo explica. Si detectas un fallo, menciónalo y ofrece `/arreglar-bug`.

Recursos: `docs/arquitectura.md`, `docs/glosario.md`, `AGENTS.md`.
