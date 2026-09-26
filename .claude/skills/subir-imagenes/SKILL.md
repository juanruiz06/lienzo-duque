---
name: subir-imagenes
description: Añade subida de imágenes (galería o cámara) a Supabase Storage con bucket privado, policies por usuario, compresión y visualización con URL firmada. Úsala para avatares, fotos de un elemento, adjuntos…
argument-hint: '[para qué son las imágenes]'
---

# Subir imágenes a Supabase Storage

Caso: $ARGUMENTS

## Decisiones previas (explícaselas)

- **Bucket privado** por defecto: las fotos solo se ven con una URL firmada que caduca. Público
  solo si de verdad es contenido público (y aun así, escritura solo en la carpeta propia).
- **Ruta por usuario**: `<user_id>/<uuid>.jpg`. Las policies se apoyan en la primera carpeta.
- **Comprimir antes de subir** (ahorra datos y almacenamiento; el plan free tiene 1 GB aprox.).

## Pasos

1. Dependencias (funcionan en Expo Go):
   ```bash
   npx expo install expo-image-picker expo-image-manipulator
   ```
   Añade el plugin de `expo-image-picker` en `app.json` con los textos de permiso en castellano
   (`photosPermission`, `cameraPermission`). Eso cambia la parte nativa: en builds EAS hace falta build nuevo.
2. **Migración** (`/nueva-tabla`): crear bucket + policies.
   ```sql
   insert into storage.buckets (id, name, public) values ('images', 'images', false);

   create policy "images: leer las mías" on storage.objects for select to authenticated
     using (bucket_id = 'images' and (storage.foldername(name))[1] = (select auth.uid())::text);
   create policy "images: subir a mi carpeta" on storage.objects for insert to authenticated
     with check (bucket_id = 'images' and (storage.foldername(name))[1] = (select auth.uid())::text);
   create policy "images: borrar las mías" on storage.objects for delete to authenticated
     using (bucket_id = 'images' and (storage.foldername(name))[1] = (select auth.uid())::text);
   ```
   Guarda la **ruta** (no la URL) en tu tabla (p. ej. `avatar_path text`).
3. **`src/api/images.ts`**:
   - `pickImage()` → `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })`.
   - Redimensionar a ~1080 px de ancho y JPEG 0.7 con `expo-image-manipulator`.
   - Subir: leer el archivo como `ArrayBuffer` (`await fetch(uri).then((r) => r.arrayBuffer())`) y
     `supabase.storage.from('images').upload(path, buffer, { contentType: 'image/jpeg' })`.
   - `getSignedUrl(path)` → `createSignedUrl(path, 60 * 60)`.
   - Borrar la imagen vieja al reemplazarla.
4. **Hooks**: `useUploadImage` (mutation) y `useSignedUrl(path)` (query con `staleTime` < caducidad).
5. **UI**: `<Image>` de `expo-image` con `source={{ uri: signedUrl }}`, placeholder mientras carga, botón "Cambiar foto".
6. **Borrado de cuenta** (INV-STORE-1): los archivos de Storage NO se borran en cascada. Añade a
   `supabase/functions/delete-account/index.ts` el borrado de la carpeta del usuario
   (`admin.storage.from('images').list(userId)` + `remove([...])`) antes de `deleteUser`.
7. Verifica: dos usuarios; B no puede leer la ruta de A (la URL firmada de A no se puede generar desde B). `npm run check` (y `check:rls` en el CI).
