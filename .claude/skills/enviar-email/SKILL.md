---
name: enviar-email
description: Envía emails transaccionales (bienvenida, avisos, recordatorios) desde una Edge Function con Resend, con plantilla en castellano y la API key como secreto. Úsala cuando la app tenga que mandar un correo que no sea de login (los de login los envía Supabase Auth).
argument-hint: '[qué email y cuándo]'
---

# Enviar un email con Resend

Email: $ARGUMENTS

**Requisito**: nivel 4 de graduación hecho (`docs/graduacion/04-emails-con-resend.md`): cuenta de
Resend, dominio verificado y `RESEND_API_KEY` como secreto. Si no está, explícalo y ofrece `/graduar 04`.

Nota: confirmar email y recuperar contraseña NO se programan: los envía Supabase Auth a través del
SMTP configurado (Resend). Esta skill es para emails propios.

## Pasos

1. **Cuándo se dispara**:
   - Tras una acción del usuario → la app llama a la Edge Function (`verify_jwt = true`).
   - Tras un cambio en la base (p. ej. nueva fila) → Database Webhook de Supabase o trigger con `pg_net` hacia la función (`verify_jwt = false` + secreto compartido en cabecera que la función comprueba).
2. **Edge Function** con `/edge-function`. Envío:
   ```ts
   const res = await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       from: 'Tu App <hola@tudominio.com>',
       to: [email],
       subject,
       html,
       text,
     }),
   });
   ```
   - El destinatario se obtiene del **servidor** (usuario del token o de la base), nunca de un campo libre que mande la app (evita que te usen para spam).
   - Versión `text` además de `html`. Castellano, breve, con el nombre de la app y cómo darse de baja si es un email recurrente.
   - Límite por usuario/día si lo puede disparar el usuario.
3. **Probar en local**: `supabase/functions/.env` con una API key de pruebas y enviarte el email a ti.
4. **Nube**: `npx supabase secrets set RESEND_API_KEY=…` (pide confirmación) y desplegar.
