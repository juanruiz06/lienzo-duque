---
name: revisar-seguridad
description: Revisión de seguridad RÁPIDA (5 minutos) - RLS y policies de las tablas, secretos en el código y sondeo sin sesión. Úsala tras añadir o cambiar tablas, o antes de un PR. Para la auditoría completa pensando como un atacante (cuentas, historial de git, pruebas entre usuarios, abuso, dependencias) usa /anti-hackeo.
---

# Revisar seguridad

Informe primero, cambios después (y solo con OK). Reglas de referencia: `INVARIANTS.md`.

## 1. Automático

```bash
npm run check:secrets
npm run check:ataque
npm run check:rls
```

(`check:rls` necesita la base local; en modo nube dirá que lo hace el CI. En ese caso usa además
Supabase → **Advisors → Security** y revisa las migraciones a mano, abajo.)

## 2. Revisión manual de la base (lee todas las migraciones)

Para cada tabla de `public`, escribe en castellano quién puede **leer, crear, editar y borrar**
según sus policies, y compáralo con lo que debería ser. Señales de alarma:

- `using (true)` o policies sin filtrar por usuario en datos privados.
- Policy de `update` sin `with check` (permitiría cambiar el dueño de la fila).
- Columnas que el usuario no debería poder cambiar (rol, saldo, `is_premium`) editables por la policy de update → moverlas a otra tabla escrita solo por el servidor, o usar un trigger/`column-level grants`.
- Funciones `security definer` sin `set search_path = ''` o que reciben un `user_id` como parámetro en vez de usar `auth.uid()`.
- Tablas sin FK `on delete cascade` a `auth.users` → el borrado de cuenta deja datos (INV-STORE-1).
- Buckets de Storage públicos o policies sin `storage.foldername(name)[1] = auth.uid()`.

Prueba práctica con dos usuarios (en la app, o en el SQL Editor / MCP `supabase-local`): B intenta leer,
editar y borrar datos de A por id. Todo debe fallar o devolver vacío.

## 3. Edge Functions

- ¿Sacan el usuario del token (no del body)? (INV-SEC-3)
- ¿`verify_jwt = false` solo en webhooks y con verificación de firma?
- ¿Validan la entrada? ¿Tienen límites si llaman a APIs de pago?
- ¿Los errores devueltos al cliente no filtran detalles internos?

## 4. App

- Nada secreto en `src/`, `app.json`, `eas.json` (INV-SEC-1).
- `trackEvent` y `reportError` sin datos personales (INV-PRIV-1).
- Enlaces profundos (`lienzo://…`) no ejecutan acciones peligrosas sin confirmación.

## 5. Nube (si está enlazada)

Supabase Dashboard → **Advisors** (Security y Performance): revisa y resuelve los avisos.

## Informe

Tabla: hallazgo · gravedad (alta/media/baja) · archivo · arreglo propuesto. Explica cada riesgo
alto con un ejemplo de ataque en una frase. Ofrece arreglar (migraciones nuevas, nunca editar viejas).
