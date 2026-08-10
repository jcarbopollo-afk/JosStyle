# Puesta en marcha — pasos para ti, Josué

## 1. Supabase (base de datos + login) — obligatorio
1. Ve a [supabase.com](https://supabase.com), crea una cuenta gratis y un proyecto nuevo (elige nombre, contraseña de base de datos y región — cualquier región de Europa va bien).
2. Espera 1-2 minutos a que se cree.
3. Entra en **SQL Editor** (menú lateral), pega el contenido de `supabase/schema.sql` de este proyecto y dale a **Run**. Esto crea la tabla donde vivirán tus datos.
4. Ve a **Configuración del proyecto → API**. Copia:
   - **Project URL**
   - **anon public key**
5. Pégame los dos aquí en el chat cuando los tengas — los meteré en el sitio correcto.

## 2. Ejecutarlo en tu ordenador (para probar antes de publicarlo)
1. Instala [Node.js](https://nodejs.org) si no lo tienes.
2. Copia `.env.example` a un archivo nuevo llamado `.env` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con lo que copiaste en el paso 1.
3. Abre una terminal en esta carpeta y ejecuta:
   ```
   npm install
   npm run dev
   ```
4. Abre la URL que te muestre (normalmente `http://localhost:5173`). Prueba a crear una cuenta y usar la app.
5. **Si algo falla o da un error al instalar o al abrir**, copia el mensaje de error exacto y pégamelo — lo arreglo.

## 3. Publicarlo de verdad (para poder instalarlo en tu iPhone)
1. Crea una cuenta gratis en [vercel.com](https://vercel.com) (puedes entrar con GitHub).
2. Sube esta carpeta a un repositorio de GitHub (o usa el botón de Vercel para importar la carpeta directamente).
3. En Vercel, al importar el proyecto, añade estas **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (opcional — solo si decides activar la IA en producción, ver punto 4)
4. Dale a **Deploy**. En un par de minutos tendrás una URL real (tipo `tu-proyecto.vercel.app`).
5. Abre esa URL en Safari del iPhone → botón compartir → **"Añadir a pantalla de inicio"**. Ya tienes tu app instalada.

## 4. La IA en producción (opcional, tiene coste)
Ahora mismo, si no añades `ANTHROPIC_API_KEY`, toda la app funciona perfectamente — solo los botones de IA mostrarán un aviso de que no está activada todavía. Si más adelante quieres activarla:
1. Crea una cuenta en [console.anthropic.com](https://console.anthropic.com) y genera una API key.
2. **Esto normalmente pide una tarjeta de pago** (es de pago por uso, no gratis como aquí en Claude) — si eres menor de edad probablemente necesites que un adulto la configure.
3. Añade esa key como `ANTHROPIC_API_KEY` en las Environment Variables de Vercel (nunca en el código, nunca con prefijo `VITE_`).

## 5. Fase 3 — activar las fotos de progreso de Salud (nuevo, obligatorio si quieres usar esa pestaña)
El módulo de Salud ya funciona sin esto (Medidas e Historial no lo necesitan) — este paso solo hace falta para la pestaña **Fotos**, que sube imágenes reales a Supabase Storage.
1. Entra en **SQL Editor** de tu proyecto de Supabase, abre una pestaña **nueva** en blanco.
2. Copia solo el bloque de `supabase/schema.sql` que empieza en el comentario `-- Fase 3 — Salud: bucket de Storage privado...` hasta el final del archivo (no hace falta repetir lo de arriba, eso ya lo ejecutaste en la Fase 2).
3. Pégalo y dale a **Run**.
4. Para comprobar que funcionó: menú lateral → **Storage** → deberías ver un bucket llamado `progreso`.
5. Recuerda que la pestaña Fotos pide el PIN que configuraste (o configures) en Ajustes — es la misma protección que usará el futuro módulo de Relación.

## 6. Cámara para escanear (Fase 4 — Nutrición)
El escaneo de código de barras y la foto de plato piden permiso de cámara la primera vez que los uses en Safari. Si le diste a "no" sin querer: Ajustes del iPhone → Safari → Cámara → permitir para tu web (o vuelve a intentarlo y dale a "Permitir" en el aviso).

## 8. Fase 5 — activar los vídeos de Calistenia (nuevo, obligatorio si quieres usar esa pestaña)
Igual que en la Fase 3 con las fotos: el resto de Calistenia (nivel, progresión, PRs, sesiones) ya funciona sin esto — este paso solo hace falta para subir y analizar vídeos.
1. Entra en **SQL Editor** de tu proyecto de Supabase, abre una pestaña **nueva** en blanco.
2. Copia solo el bloque de `supabase/schema.sql` que empieza en el comentario `-- Fase 5 — Calistenia a fondo: bucket de Storage privado...` hasta el final del archivo.
3. Pégalo y dale a **Run**.
4. Comprueba en **Storage** que aparece un bucket llamado `entrenamiento-videos`.
5. Los vídeos están limitados a 100 MB cada uno — si grabas en 4K, mejor recorta el clip a unos pocos segundos antes de subirlo (basta con ver el movimiento clave, la IA solo analiza unos fotogramas sueltos, no el vídeo entero).
6. "Analizar con IA" en un vídeo requiere `ANTHROPIC_API_KEY` configurada (ver punto 4) — sin ella, verás el mismo aviso de "IA no configurada" que en el resto de la app.

## 9. Iconos de la app (pendiente)
El `manifest.json` espera `icon-192.png` e `icon-512.png` dentro de `public/`. Todavía no existen — cuando quieras, dime qué diseño de icono quieres y te lo genero, o súbeme tú unas imágenes cuadradas y las adapto.

---
Cualquier error que veas en cualquiera de estos pasos: pégamelo tal cual aparece y lo resolvemos juntos.
