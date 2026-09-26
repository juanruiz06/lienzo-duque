# Glosario

Palabras que vas a ver a menudo, en una o dos frases. Por orden alfabético.

| Término                              | Qué es                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Anon / publishable key**           | La clave pública de Supabase que va dentro de la app. Identifica tu proyecto, no da permisos por sí sola: los permisos los ponen RLS y los GRANTs. |
| **API**                              | La "ventanilla" por la que la app pide o envía datos al servidor.                                                                                  |
| **App Store Connect / Play Console** | Los paneles de Apple y Google donde se gestionan las apps publicadas.                                                                              |
| **Auth**                             | Autenticación: saber quién es el usuario (login).                                                                                                  |
| **Branch (rama)**                    | Copia paralela del código para trabajar sin tocar `main`.                                                                                          |
| **Build**                            | La app compilada, lista para instalar (un `.ipa` en iOS, `.apk`/`.aab` en Android).                                                                |
| **Bundle id / package**              | Identificador único de tu app en las tiendas (`com.minombre.miapp`). No se cambia tras publicar.                                                   |
| **Caché**                            | Copia guardada de datos para no volver a pedirlos. React Query la gestiona.                                                                        |
| **CI (integración continua)**        | Robot (GitHub Actions) que comprueba cada cambio automáticamente.                                                                                  |
| **CNG / prebuild**                   | Expo genera las carpetas nativas `ios/` y `android/` a partir de `app.json`. Por eso no están en el repo.                                          |
| **Commit**                           | Una "foto" guardada del código con un mensaje.                                                                                                     |
| **Componente**                       | Pieza de interfaz reutilizable (`Button`, `Card`…).                                                                                                |
| **Deep link**                        | Enlace que abre una pantalla concreta de la app (`lienzo://note/123`).                                                                             |
| **Development build**                | Tu propia versión de "Expo Go" con las librerías nativas que tú elijas. Hace falta cuando Expo Go se queda corto.                                  |
| **EAS**                              | Expo Application Services: compila (Build), publica (Submit) y actualiza (Update) tu app en la nube.                                               |
| **Edge Function**                    | Código que corre en el servidor de Supabase. Donde van las claves secretas.                                                                        |
| **Expo Go**                          | App de las tiendas que abre tu proyecto en desarrollo sin compilar nada.                                                                           |
| **Feature**                          | Una funcionalidad (p. ej. "notas", "amigos").                                                                                                      |
| **GRANT**                            | Permiso SQL a nivel de tabla ("los usuarios con sesión pueden leer esta tabla"). Se combina con RLS, que filtra por fila.                          |
| **Hook**                             | Función de React que empieza por `use` y conecta una pantalla con datos o comportamiento.                                                          |
| **Invalidar (caché)**                | Marcar un dato como viejo para que React Query lo vuelva a pedir.                                                                                  |
| **JWT / token**                      | El "pase" que demuestra que has iniciado sesión. Viaja en cada petición.                                                                           |
| **Lint / ESLint**                    | Revisor automático que detecta errores y malas prácticas en el código.                                                                             |
| **Merge**                            | Juntar una rama con otra (normalmente tu rama en `main`).                                                                                          |
| **Metro**                            | El servidor de desarrollo que envía tu código a la app (`npm start`).                                                                              |
| **Migración**                        | Archivo SQL numerado que cambia la estructura de la base de datos. Se aplican en orden y nunca se editan una vez aplicadas.                        |
| **Mock**                             | Sustituto falso de algo real (p. ej. Supabase) para poder hacer tests.                                                                             |
| **OTA (over-the-air)**               | Actualizar el código JavaScript de la app instalada sin pasar por la tienda.                                                                       |
| **Policy (RLS)**                     | Una regla concreta de RLS: "puedes borrar una nota si es tuya".                                                                                    |
| **PR (Pull Request)**                | Petición de meter tu rama en `main`, con revisión y CI.                                                                                            |
| **Prettier**                         | Formateador automático: deja el código con un estilo uniforme.                                                                                     |
| **React Query**                      | Librería que pide, cachea y refresca los datos del servidor.                                                                                       |
| **RLS (Row Level Security)**         | Seguridad por filas en Postgres: cada consulta solo ve las filas que sus policies permiten. La base de la seguridad de la app.                     |
| **Seed**                             | Datos de prueba que se cargan en la base local.                                                                                                    |
| **Service-role / secret key**        | Clave de administrador de Supabase que se salta RLS. **Solo** en el servidor.                                                                      |
| **Spec**                             | Documento corto que describe una feature antes de construirla (`docs/specs/`).                                                                     |
| **Splash**                           | La pantalla que se ve mientras la app arranca.                                                                                                     |
| **Squash and merge**                 | Forma de mergear que junta todos los commits del PR en uno.                                                                                        |
| **Supabase**                         | Backend: base de datos Postgres + login + archivos + funciones.                                                                                    |
| **Test**                             | Código que comprueba automáticamente que otro código funciona.                                                                                     |
| **Token (diseño)**                   | Valor con nombre del sistema visual (`color.primary`, `spacing.md`).                                                                               |
| **TypeScript**                       | JavaScript con tipos: te avisa de errores mientras escribes.                                                                                       |
| **Zod**                              | Librería para describir y validar datos ("un email válido", "de 1 a 120 caracteres").                                                              |
| **Zustand**                          | Librería mínima para estado global de la app que no viene del servidor.                                                                            |
