---
name: edge-function
description: Crea una Supabase Edge Function (código de servidor en Deno) para lo que la app no puede hacer por seguridad - usar claves secretas, llamar APIs de pago (IA, emails, pagos), tareas de administrador o webhooks. Úsala cuando algo necesite un secreto o permisos que la app no debe tener.
argument-hint: '[qué debe hacer la función]'
---

# Nueva Edge Function

Función: $ARGUMENTS

Modelo: `supabase/functions/delete-account/index.ts` + `supabase/functions/_shared/cors.ts`.

## ¿De verdad hace falta?

Sí si: usa una clave secreta, llama a una API de pago, necesita la service-role, recibe webhooks
externos o hace algo que el usuario no debe poder falsear. No, si basta con una consulta a una
tabla protegida con RLS (eso se hace desde `src/api` directamente).

## Pasos

1. Crear: `npx supabase functions new <nombre-con-guiones>`.
2. Añadir en `supabase/config.toml`:
   ```toml
   [functions.<nombre>]
   enabled = true
   verify_jwt = true   # false SOLO para webhooks externos (y entonces verifica su firma)
   ```
3. Escribir `index.ts` con este esqueleto:
   - `Deno.serve`, responder a `OPTIONS` con `corsHeaders`, aceptar solo el método previsto.
   - Identificar al usuario con el token (`userClient.auth.getUser()`), **nunca** con un id del body (INV-SEC-3).
   - Validar la entrada (tipos, longitudes). Nunca confiar en el cliente.
   - Secretos con `Deno.env.get('NOMBRE')`. Si falta, responder 500 con un log claro.
   - Cliente admin (`SUPABASE_SERVICE_ROLE_KEY`) solo si hace falta, y solo para lo imprescindible.
   - Responder con `json(...)` del `_shared/cors.ts`. Errores sin detalles internos al cliente; detalles al `console.error` (se ven en los logs de Supabase).
   - Importar paquetes con `npm:` (p. ej. `npm:@supabase/supabase-js@2`).
4. Secretos:
   - Local: archivo `supabase/functions/.env` (está en `.gitignore`) con `NOMBRE=valor`.
   - Nube: `npx supabase secrets set NOMBRE=valor` (pide confirmación: es una acción en la nube).
5. Llamarla desde la app: función en `src/api/…` con `supabase.functions.invoke('<nombre>', { body })`
   - hook en `src/hooks`. Errores con `AppError` y mensaje para el usuario.
6. Probar:
   - **Modo nube (el normal)**: despliégala en su proyecto de desarrollo (pide OK):
     `npx supabase functions deploy <nombre> --use-api` (`--use-api` = sin Docker). Pruébala desde
     la app y mira los logs en Supabase → Edge Functions → la función → Logs.
   - **Modo local**: se sirven solas con `npm run db:start`; logs en vivo con `npx supabase functions serve`.
7. Desplegar (solo si lo piden): `npx supabase functions deploy <nombre>` — o al mergear en `main`
   con el workflow `deploy-supabase.yml` si está configurado.

## Coste y abuso

Si llama a una API de pago (IA, SMS, emails), añade límite por usuario (tabla de uso + comprobación)
para que nadie te arruine con un bucle. Coméntalo con el dueño.
