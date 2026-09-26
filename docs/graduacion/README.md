# Niveles de graduación

Lienzo arranca en el **Nivel 0**: todo funciona en tu ordenador, sin cuentas y sin pagar nada.
La base de datos corre en local (Supabase dentro de Docker), la app se abre en el simulador o en
Expo Go y nadie más que tú puede usarla. Es el sitio perfecto para aprender y construir.

Un día querrás que la app viva en internet, que la usen tus amigos, saber cuándo falla o
publicarla en las tiendas. Cada una de esas cosas es un **nivel de graduación**: una guía que
añade **una sola capacidad** a tu proyecto, te dice **qué cuesta**, **cuándo merece la pena** y
**qué desbloquea**.

Tres ideas para leer esta carpeta:

- **No hay prisa.** Sube de nivel cuando tengas un motivo real ("quiero que mi hermana la pruebe",
  "me han dicho que no les llega el email"), no antes. Cada servicio nuevo es algo más que
  mantener.
- **Todo está preparado para enchufarse.** El código ya tiene los "enchufes" (por ejemplo,
  `setErrorReporter` para Sentry o los workflows de GitHub que no hacen nada hasta que les das una
  clave). Subir de nivel es conectar, no reescribir.
- **Público vs. secreto.** Lo que empieza por `EXPO_PUBLIC_` acaba dentro de la app y cualquiera
  puede leerlo. Las claves secretas **nunca** van en el código ni en `.env` de la app: van a los
  "secrets" de EAS, GitHub o Supabase. Cada guía te dice cuál es cuál.

## Los niveles

| Nivel | Guía                                             | Qué añade                                                                            | Qué desbloquea                                                             |
| ----- | ------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 0     | [Empieza aquí](../00-empieza-aqui.md)            | Todo local y gratis (ya lo tienes)                                                   | Construir y probar la app en tu ordenador                                  |
| 1     | [Nube, GitHub y CI](01-nube-github-y-ci.md)      | Supabase en la nube (plan gratis) + repo en GitHub + comprobaciones automáticas (CI) | Que la app funcione fuera de tu wifi; copia de tu código; no romper `main` |
| 2     | [Builds con EAS](02-builds-con-eas.md)           | Tu propia app instalable (development build) y distribución interna a móviles reales | Librerías nativas, probar en tu móvil sin Expo Go, pasársela a amigos      |
| 3     | [Observabilidad](03-observabilidad.md)           | Sentry (errores) + PostHog (analítica de uso)                                        | Enterarte de los fallos antes que tus usuarios; saber qué se usa           |
| 4     | [Emails con Resend](04-emails-con-resend.md)     | SMTP propio para Supabase Auth + emails transaccionales + dominio propio             | Registro y "olvidé mi contraseña" con usuarios reales                      |
| 5     | [Publicar en tiendas](05-publicar-en-tiendas.md) | App Store + Google Play                                                              | Que cualquiera descargue tu app                                            |
| 6     | [Login social](06-login-social.md)               | Sign in with Apple / Google                                                          | Registro en un toque                                                       |
| 7     | [Actualizaciones OTA](07-actualizaciones-ota.md) | EAS Update                                                                           | Arreglar fallos de JavaScript sin pasar por la revisión de las tiendas     |
| 8     | [Notificaciones push](08-notificaciones-push.md) | Push con `expo-notifications`                                                        | Avisar a tus usuarios aunque la app esté cerrada                           |
| 9     | [Cobrar](09-cobrar.md)                           | Pagos dentro de la app (RevenueCat) / Stripe                                         | Suscripciones y compras                                                    |
| 10    | [Escalar y pagar más](10-escalar-y-pagar-mas.md) | Supabase Pro, planes de pago, entornos staging/producción, backups                   | Crecer sin miedo a perder datos                                            |
| 99    | [Más allá](99-mas-alla.md)                       | Temas avanzados                                                                      | Lo que necesites cuando lo necesites                                       |

## Orden recomendado

No es obligatorio, pero es el camino que menos sorpresas da:

1. **Nivel 1** en cuanto quieras enseñar la app a alguien o tener tu código a salvo fuera de tu
   ordenador.
2. **Nivel 2** cuando quieras la app en tu móvil "de verdad" o necesites una librería que Expo Go
   no trae.
3. **Nivel 3** antes de que la use gente que no seas tú (Sentry funciona mejor con el nivel 2).
4. **Nivel 4** antes de abrir el registro a desconocidos: sin él, los emails de confirmación y
   de recuperar contraseña no les llegarán.
5. **Nivel 5** para publicar. A partir de aquí, 6–10 en el orden que pida tu app.

Los niveles 3 y 4 son independientes entre sí: puedes hacerlos en cualquier orden.

## Cuánto cuesta cada cosa

> Precios revisados en **septiembre de 2026**. Cambian a menudo: **compruébalos** en la web de
> cada servicio antes de decidir. Las cifras en dólares se cobran en dólares o en su equivalente.

| Servicio                    | Gratis                                                                                                                        | De pago (desde)                                               | Nivel |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----- |
| Supabase                    | 2 proyectos activos, 500 MB de BD, 1 GB de archivos, 50.000 usuarios activos/mes; se pausa tras 1 semana sin uso; sin backups | Pro: ~25 $/mes por organización (8 GB de BD, backups diarios) | 1, 10 |
| GitHub                      | Repos privados ilimitados, 2.000 min/mes de Actions                                                                           | Pro: ~4 $/mes (reglas de rama obligatorias en repos privados) | 1     |
| Expo / EAS                  | 15 builds Android + 15 iOS al mes (cola lenta); updates para 1.000 usuarios/mes                                               | Starter: ~19 $/mes                                            | 2, 7  |
| Apple Developer Program     | —                                                                                                                             | 99 $/año (obligatorio para instalar en iPhone y publicar)     | 2, 5  |
| Google Play Console         | —                                                                                                                             | ~25 $ una sola vez                                            | 5     |
| Sentry                      | Developer: 5.000 errores/mes, 1 usuario                                                                                       | Team: ~26 $/mes                                               | 3     |
| PostHog                     | 1 millón de eventos/mes, 5.000 grabaciones de sesión/mes                                                                      | Pago por uso a partir de ahí                                  | 3     |
| Resend                      | 3.000 emails/mes, máximo 100/día                                                                                              | Pro: ~20 $/mes (50.000 emails)                                | 4     |
| Dominio propio              | —                                                                                                                             | ~10–15 €/año                                                  | 4     |
| RevenueCat                  | Gratis hasta 2.500 $/mes de ingresos                                                                                          | 1 % de lo que pase de ahí                                     | 9     |
| Notificaciones push de Expo | Gratis                                                                                                                        | —                                                             | 8     |

**Resumen honesto:** puedes llegar al nivel 4 pagando solo el dominio (~12 €/año) si usas
Android. Si quieres el iPhone, desde el nivel 2 necesitas la cuenta de Apple (99 $/año).

## Que te guíe Claude

En Claude Code tienes la skill **`/graduar`**. Escribe, por ejemplo:

```
/graduar 01
```

Claude leerá la guía de ese nivel, comprobará qué tienes ya hecho y te irá guiando paso a paso,
parando cada vez que tengas que hacer algo tú (crear una cuenta, copiar una clave, pagar). Si no
sabes qué nivel te toca, escribe solo `/graduar` y te lo recomendará según el estado del
proyecto.
