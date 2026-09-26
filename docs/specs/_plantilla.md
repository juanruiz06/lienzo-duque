# NNN — Nombre de la feature

> Estado: borrador · Fecha: AAAA-MM-DD · Nivel requerido: 0 (local) / N (si necesita algo de graduación)

## Qué y por qué

2-4 frases: qué problema resuelve para el usuario y por qué ahora.

## Historia de usuario

Como **[tipo de usuario]** quiero **[hacer algo]** para **[conseguir algo]**.

## Qué verá el usuario

Pantallas nuevas o cambiadas. Para cada una:

- **Ruta**: `src/app/(app)/…`
- **Contenido**: qué se muestra.
- **Acciones**: qué se puede tocar y qué pasa.
- **Estados**: cargando · vacío (texto y acción) · error · con datos.

## Datos

### Tablas

| Tabla | Columna | Tipo | Reglas (límites, default, único…) |
| ----- | ------- | ---- | --------------------------------- |
|       |         |      |                                   |

### Quién puede hacer qué (se convertirá en policies RLS)

| Tabla | Leer          | Crear | Editar | Borrar |
| ----- | ------------- | ----- | ------ | ------ |
|       | solo el dueño |       |        |        |

### Al borrar la cuenta

Qué pasa con estos datos (normalmente: se borran en cascada).

## Casos límite

- Sin conexión:
- Textos muy largos / vacíos:
- Dos dispositivos a la vez:
- …

## Analítica (opcional)

Eventos a añadir al catálogo `AppEvents` y qué decisión permiten tomar.

## Fuera de alcance

Lo que NO se hace en esta spec (para no crecer sin fin).

## Fases

1. **Fase 1 (mínima)**: … → se puede probar así: …
2. **Fase 2**: …

## Preguntas abiertas

- …
