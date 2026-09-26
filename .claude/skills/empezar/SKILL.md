---
name: empezar
description: Guía de primera vez para dejar el ordenador (Windows) listo y la app funcionando en el móvil con Expo Go y Supabase gratis en la nube - Node, Git, dependencias, npm run setup, npm start. Úsala cuando alguien acaba de recibir el repo, dice "no me arranca", "cómo empiezo" o es su primera sesión.
---

# Empezar: de cero a la app en el móvil

Objetivo: que la persona vea la app abierta en **su móvil (Expo Go)**, registrada y creando una
nota. Usa **Windows** y no es técnica. La guía visual completa es **`SETUP.html`** (que la abra
con doble clic): síguela como guion y ve **paso a paso**, comprobando cada uno antes del siguiente.
Todo es gratis; no propongas nada de pago.

## Reglas para esta sesión

- Tú puedes ejecutar comandos de diagnóstico, pero los **interactivos los ejecuta ella** en la
  terminal de VS Code: `npm run setup` (pide datos y contraseña) y `npm start` (se queda abierto,
  hay que escanear el QR). Dale el comando en su propio bloque y dile qué verá.
- Comandos para Windows: uno por bloque, sin `&&`, sin `cp`/`rm`/`export`.
- **No le pidas que te pegue contraseñas** ni la _Secret key_ de Supabase. La _Publishable key_ es
  pública, pero igualmente la escribe ella en el asistente.

## 1. Diagnóstico

Ejecuta `npm run doctor` y lee la salida. Resuelve los ❌ en orden:

- **Node < 20 o no instalado** → que instale la versión LTS (nodejs.org, instalador `.msi`, todo por
  defecto) y **reabra VS Code**. No lo instales tú.
- **Proyecto dentro de OneDrive** → que mueva la carpeta a `C:\proyectos\` y la reabra en VS Code.
- **Sin node_modules** → `npm install`. Si PowerShell dice "la ejecución de scripts está
  deshabilitada": que ejecute `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y responda `S`.
- **Sin .env / sin enlazar** → paso 2.

## 2. Base de datos (Supabase Free en la nube)

1. Si no tiene proyecto: supabase.com → New project → nombre, **Generate a password** (¡que la
   guarde!), región Europa, plan Free. Esperar 1-2 min.
2. Que ejecute `npm run setup` y conteste: Project URL, Publishable key (botón **Connect** o
   Project Settings → API Keys), login en el navegador, contraseña de la base de datos, y el
   ajuste manual de **Confirm email** (desactivar).
3. Si falla, lee el mensaje con ella. Lo más común: contraseña de BD incorrecta → _Project
   Settings → Database → Reset database password_ y repetir `npm run setup` (es seguro repetirlo).

## 3. Abrir la app

1. Que tenga **Expo Go** instalado en el móvil (Play Store / App Store) y el móvil en la misma wifi.
2. `npm start` → Firewall de Windows: permitir en **redes privadas** → escanear el QR
   (Android: desde Expo Go; iPhone: con la cámara).
3. Si no conecta: `Ctrl + C` y `npm run start:tunnel`.
4. En la app: **Regístrate** → crear una nota.

## 4. Comprobar

- Crea una nota y se ve en la lista. (Opcional: en supabase.com → Table Editor → `notes`, ahí está.)
- Primer cambio: en `src/app/(auth)/sign-in.tsx` cambiar el texto "Entra para ver tus notas.",
  guardar con `Ctrl + S` y verlo cambiar en el móvil.
- `npm run check` → todo en verde.

## 5. Siguiente paso

Cuéntale en 3 frases qué tiene (app con login, notas y perfil; base de datos gratuita con
seguridad por usuario; tests) y sugiérele:

- `npm run rename -- "Nombre de su app" com.sunombre.suapp` para hacerla suya.
- `/explicar arquitectura` para entender cómo encaja todo.
- `/planificar` con la primera idea que quiera construir.

## Problemas típicos

| Síntoma                            | Solución                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `npm`/`node` "no se reconoce"      | Cerrar y reabrir VS Code (se abrió antes de instalar Node)                         |
| "Configuración inválida" en la app | Falta `npm run setup`; después reiniciar `npm start`                               |
| El móvil no carga la app           | Misma wifi + Firewall; si no, `npm run start:tunnel`                               |
| Expo Go "Project is incompatible"  | Actualizar Expo Go desde la tienda                                                 |
| "Sin conexión" al entrar           | Proyecto de Supabase pausado por inactividad → panel → Restore                     |
| "Confirma tu email" al registrarse | Supabase → Authentication → Sign In / Providers → Email → desactivar Confirm email |
