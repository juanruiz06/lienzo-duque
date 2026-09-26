---
name: empezar
description: Guía de primera vez para dejar la máquina lista y la app de Lienzo funcionando (Node, dependencias, .env, Supabase local o en la nube, abrir en móvil). Úsala cuando alguien acaba de clonar el repo, dice "no me arranca", "cómo empiezo" o es su primera sesión.
---

# Empezar: de cero a la app funcionando

Objetivo: que la persona vea la app abierta en su móvil/simulador con sesión iniciada. Ve **paso a
paso**, comprobando cada uno antes del siguiente, y explicando en una frase qué hace cada cosa.
La guía larga para humanos es `docs/00-empieza-aqui.md`; síguela como referencia.

## 1. Diagnóstico

Ejecuta `npm run doctor` y lee la salida. Resuelve los ❌ en este orden:

- **Node < 20** → que instale Node 22 (https://nodejs.org, versión LTS). No lo instales tú.
- **Sin node_modules** → `npm install`.
- **Sin .env** → `cp .env.example .env` y sigue al paso 2.

## 2. Elegir backend (pregunta si no está claro)

| Opción                                               | Cuándo                                  | Requisitos             |
| ---------------------------------------------------- | --------------------------------------- | ---------------------- |
| **A. Supabase local** (recomendada para desarrollar) | Tiene Docker Desktop o puede instalarlo | Docker abierto         |
| **B. Supabase en la nube (free)**                    | No quiere/puede instalar Docker         | Cuenta en supabase.com |

**A. Local**

1. `npm run db:start` (la primera vez descarga imágenes: varios minutos).
2. Copia al `.env` los valores que imprime: `API_URL` → `EXPO_PUBLIC_SUPABASE_URL`, `PUBLISHABLE_KEY` → `EXPO_PUBLIC_SUPABASE_KEY`.
3. Usuario de prueba ya creado por el seed: `demo@lienzo.test` / `lienzo-demo-1234`.

**B. Nube** → sigue `docs/graduacion/01-nube-github-y-ci.md` (solo la parte de Supabase).

## 3. Abrir la app

`npm start` y luego:

- **Simulador iOS** (Mac con Xcode): pulsar `i`.
- **Emulador Android**: pulsar `a`.
- **Navegador**: pulsar `w` (útil para ir rápido; no sustituye probar en móvil).
- **Móvil físico**: instalar **Expo Go** desde la tienda y escanear el QR. Con Supabase LOCAL,
  la URL del `.env` debe ser la IP del ordenador (la imprime `npm run doctor`), no `127.0.0.1`,
  y móvil y ordenador en la misma wifi.

Tras cambiar el `.env` hay que parar Metro (Ctrl+C) y volver a `npm start`.

## 4. Comprobar

- Entra con el usuario demo (o regístrate) → deben verse las notas.
- `npm run check` → todo en verde.

## 5. Siguiente paso

Cuéntale en 3 frases qué tiene delante (app con login, notas y perfil; base de datos con
seguridad por usuario; tests y CI) y sugiérele:

- `/explicar arquitectura` para entender cómo encaja todo.
- `npm run rename -- "Nombre de su app" com.suempresa.suapp` para hacerla suya.
- `/planificar` con la primera idea que quiera construir.

## Problemas típicos

- **"Configuración inválida"** al abrir → falta o está mal el `.env`; tras arreglarlo reiniciar Metro.
- **"Network request failed"** en móvil físico → está usando `127.0.0.1` en vez de la IP del ordenador, o distinta wifi.
- **Expo Go dice "incompatible SDK"** → actualizar Expo Go desde la tienda.
- **`db:start` falla** → Docker Desktop no está abierto, o hay otro Supabase usando los puertos 544xx.
