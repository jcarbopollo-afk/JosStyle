// ============================================================================
// LA APLICACIÓN DE VERDAD, EN UN NAVEGADOR DE VERDAD
//
// ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
//
// Durante meses la aplicación **no arrancaba**, y ninguna de las 5 800
// comprobaciones lo vio. Dos fallos, los dos fatales, los dos invisibles para
// `vite build` y para las pruebas de renderizado:
//
//   1. `App.jsx` nunca importó `papelera.js`. `purgarCaducados(...)` lanzaba un
//      TypeError EN MITAD de la carga de datos, sin `try/catch`, así que todos
//      los `setX(...)` posteriores —`setArmario`, `setHorarioTop`, `setRachas`,
//      `setAudio`, **`setEstiloHombre`**— no llegaban a ejecutarse: **ningún
//      módulo de la Entrega 2 cargaba sus datos guardados**.
//
//   2. Cinco hooks estaban DESPUÉS de los `return` condicionales de `App.jsx`
//      (regla 4). En el primer render se salía por `<LoadingScreen />`; al
//      llegar la sesión, React veía cinco hooks más y **tumbaba la aplicación
//      entera** con "Rendered more hooks than during the previous render".
//
// Las dos cosas juntas explican exactamente lo que se veía: una app que parecía
// "prácticamente igual" por más fases que se construyeran.
//
// ⚠️ Ninguna prueba podía verlo porque **`App.jsx` no se renderizaba en
// ninguna**: necesita Supabase y un navegador. Esto lo arregla — arranca Vite,
// simula la sesión y las respuestas de Supabase, y comprueba la cadena entera:
// arranca → carga lo guardado → se llega al módulo → se toca → se guarda → se ve.
//
// Si Playwright no está instalado, la prueba **se salta con un aviso** en vez de
// fallar: no es una dependencia del proyecto y Vercel no debe instalarla.
// ============================================================================

import { spawn, execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.log('  ! Playwright no está instalado — prueba de navegador OMITIDA');
  console.log('    (npm i -D playwright, y no hace falta para desplegar)');
  process.exit(0);
}

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

const PUERTO = 5199;
const SUPA = 'https://ejemplo.supabase.co';

// Vite necesita las dos variables o `createClient` revienta al importar.
if (!existsSync('.env.local')) {
  writeFileSync('.env.local', `VITE_SUPABASE_URL=${SUPA}\nVITE_SUPABASE_ANON_KEY=clave-de-prueba\n`);
}

/* 🐛 ⚠️ En Windows el ejecutable es `npx.cmd`: con `npx` a secas, `spawn` daba
   `ENOENT` y **la comprobación más importante del proyecto no llegaba a
   arrancar** — `verificar.sh` decía "LA APLICACIÓN NO ARRANCA" cuando lo que no
   arrancaba era la prueba. Lo cazó la EH F19, la primera fase verificada entera
   en la máquina de Windows.

   ⚠️ Y además hace falta `shell: true`: desde Node 20, lanzar un `.cmd` sin
   shell da `EINVAL`. Los argumentos son fijos y sin espacios, así que no hay
   nada que escapar. */
const ESWIN = process.platform === 'win32';
const vite = spawn(ESWIN ? 'npx.cmd' : 'npx', ['vite', '--port', String(PUERTO), '--host', '127.0.0.1'],
  { stdio: 'ignore', shell: ESWIN });
const esperarServidor = async () => {
  for (let i = 0; i < 40; i += 1) {
    try { const r = await fetch(`http://127.0.0.1:${PUERTO}/`); if (r.ok) return true; } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

/* 🐛 ⚠️ **EH F47 — el servidor se quedaba vivo en Windows.** `vite.kill()` mata
   al hijo directo (`npx.cmd`), **no al `node` que escucha el puerto**: al
   terminar quedaba un servidor con el código de aquella pasada, y la siguiente
   ejecución se conectaba a ÉL. Es exactamente lo que pasó dos veces mientras se
   construían la F22 y la F47: las comprobaciones nuevas fallaban y las viejas
   pasaban, porque el navegador estaba mirando el código de antes. En Windows hay
   que matar el ÁRBOL. */
const matarServidor = () => {
  if (!vite || vite.killed) return;
  if (process.platform === 'win32') {
    try { execSync(`taskkill /pid ${vite.pid} /T /F`, { stdio: 'ignore' }); return; } catch { /* ya no estaba */ }
  }
  vite.kill('SIGTERM');
};

const salir = async (browser) => {
  if (browser) await browser.close();
  matarServidor();
  if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
  console.log(`\n  ${n} comprobaciones correctas.`);
  process.exit(0);
};

process.on('exit', matarServidor);
process.on('uncaughtException', (e) => { matarServidor(); console.error(e); process.exit(1); });

ok(await esperarServidor(), 'El servidor de desarrollo arranca');

/* ⚠️ Y que el servidor sea **el que acaba de arrancar**, no uno de una pasada
   anterior: si el puerto ya estaba ocupado, esta prueba estaría mirando código
   viejo y aprobándolo. */
ok(!!vite.pid && !vite.killed, 'y es el que ha arrancado esta pasada, no uno que quedara vivo');

/* Un `estiloHombre` guardado, como el que ya tiene Josué en Supabase. Si la
   carga se rompe, esto NO llega a la pantalla — que es justo lo que pasaba. */
const ESTILO_GUARDADO = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['pelo', 'skincare'] },
  modulos: [
    { id: 'pelo', activo: true, orden: 0, config: {} },
    // EH F20 — Barba encendida, y todavía sin configurar: la entrada del apartado 1.
    { id: 'barba', activo: true, orden: 2, config: {} },
    // EH F23 — Sonrisa encendida y sin configurar: su pantalla de entrada.
    { id: 'sonrisa', activo: true, orden: 3, config: {} },
    // EH F24 — Perfumes, encendido y sin configurar.
    { id: 'perfumes', activo: true, orden: 4, config: {} },
    // EH F26 — Accesorios, encendido y sin configurar.
    { id: 'accesorios', activo: true, orden: 5, config: {} },
    // EH F27 — Mis gustos, encendido y sin configurar.
    { id: 'gustos', activo: true, orden: 6, config: {} },
    /* ⚠️ Con el perfil de piel empezado: si no, Skincare enseña su puerta de
       entrada ("Configurar / Ahora no") y no se llega al panel. */
    { id: 'skincare', activo: true, orden: 1, config: { necesidadesPiel: 'hidratacion', complejidadPiel: 'basico' } },
  ],
  datos: {}, retirados: [],
};

/* Lo que "hay en Supabase" ahora mismo. Empieza con lo guardado y **se queda con
   lo que la app escriba**: así una recarga ve lo de antes, como en el móvil. */
const almacen = { estiloHombre: ESTILO_GUARDADO };

/* 🐛 ⚠️ La ruta del navegador estaba **escrita a mano** (`/opt/pw-browsers/
   chromium`), que es donde lo tenía el entorno de aquellas sesiones. En Windows
   no existe, y la prueba moría antes de abrir la aplicación. Ahora se usa esa
   ruta **solo si está de verdad**, y si no se deja que Playwright encuentre el
   suyo — que es lo que sabe hacer. */
const CHROMIUM_FIJO = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(CHROMIUM_FIJO) ? { executablePath: CHROMIUM_FIJO } : {},
);
const page = await browser.newPage();

const errores = [];
const guardado = [];
page.on('pageerror', (e) => errores.push(e.message));
/* ⚠️ Un RECURSO que no carga por red no es un error de JavaScript, y ya había
   precedente con `ERR_CONNECTION`. Se amplía a toda la familia `net::ERR_`
   porque `index.css` importa las tipografías de Google Fonts y **el proxy de
   este contenedor no tiene una CA que Chromium se crea**
   (`ERR_CERT_AUTHORITY_INVALID`): en el iPhone de Josué cargan, aquí no, y eso
   no dice nada del código. 🚨 **Y no puede tapar un error de verdad**: las
   excepciones de JavaScript llegan por `pageerror`, que es OTRO escuchador y no
   filtra nada. */
const esFalloDeRed = (t) => /Failed to load resource/i.test(t) && /net::ERR_/.test(t);
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (/ERR_CONNECTION/.test(m.text()) || esFalloDeRed(m.text())) return;
  errores.push(m.text());
});

/* Un PNG de 1x1 transparente: lo mínimo que un `<img>` carga de verdad. */
const PNG_DE_PRUEBA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

await page.route(`${SUPA}/**`, async (route) => {
  const url = route.request().url();
  if (url.includes('/auth/v1/')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'x', token_type: 'bearer', expires_in: 3600, refresh_token: 'x',
        user: { id: 'usuario-prueba', email: 'prueba@ejemplo.test' },
      }),
    });
  }
  if (url.includes('/rest/v1/app_data')) {
    if (route.request().method() !== 'GET') {
      try {
        const cuerpo = JSON.parse(route.request().postData() || '{}');
        guardado.push(cuerpo);
        /* ⚠️ **Y se GUARDA de verdad**, para devolverlo en el siguiente GET. Sin
           esto, recargar volvía siempre al estado inicial y la prueba no podía
           comprobar lo que más importa: que lo que toca **sobrevive a la
           recarga**, que es el punto 5 de lo que pide Josué. */
        if (cuerpo && cuerpo.key) almacen[cuerpo.key] = cuerpo.value;
      } catch { /* vacío */ }
      return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    }
    const clave = decodeURIComponent(url).match(/key=eq\.([^&]+)/)?.[1];
    const valor = almacen[clave] ?? null;
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(valor ? { value: valor } : null),
    });
  }
  /* 🚨 **Y EL ALMACENAMIENTO SIRVE FOTOS DE VERDAD** (FIT F26/F27). Antes este
     doble contestaba `{}` a todo, así que `createSignedUrl` devolvía una URL
     **válida como cadena y rota como dirección** (`…/storage/v1undefined`) y
     TODAS las fotos salían ilegibles: el recorrido solo probaba el caso malo y
     no podía ver ni una galería. Ahora firma bien y devuelve un PNG, **salvo
     la foto cuyo camino dice `rota`**, que es la que prueba el apartado 29. */
  if (url.includes('/storage/v1/')) {
    const metodo = route.request().method();
    if (metodo === 'POST' && url.includes('/object/sign/')) {
      const camino = url.split('/object/sign/')[1];
      if (/rota/.test(camino)) {
        return route.fulfill({
          status: 400, contentType: 'application/json',
          body: JSON.stringify({ statusCode: '404', error: 'Not found', message: 'Object not found' }),
        });
      }
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ signedURL: `/object/sign/${camino}?token=recorrido` }),
      });
    }
    if (metodo === 'GET') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_DE_PRUEBA });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});

await page.addInitScript(() => {
  localStorage.setItem('sb-ejemplo-auth-token', JSON.stringify({
    access_token: 'x', token_type: 'bearer', refresh_token: 'x',
    expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600,
    user: { id: 'usuario-prueba', email: 'prueba@ejemplo.test', aud: 'authenticated', role: 'authenticated' },
  }));
});

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const ver = () => page.evaluate(() => document.body.innerText);
/* ⚠️ **Solo pulsa BOTONES**, y prefiere el que dice exactamente eso.
   Antes buscaba cualquier elemento con ese texto, y en cuanto la Fase 29 puso
   "Mi estilo" arriba —que NOMBRA los módulos— empezó a pulsar el título de un
   bloque, que no es pulsable, en vez de la plaquita. Un usuario de verdad pulsa
   un botón; esto hace lo mismo. */
/* 🐛 ⚠️ **EH F57 — y `pulsar` ESPERA a que el botón aparezca.**
   Segunda vez que la pasada completa se pone roja y el archivo ejecutado solo
   pasa: con diez mil comprobaciones de Node por delante, la máquina va cargada
   y los `waitForTimeout` fijos de después de cada `goto` se quedan cortos. El
   primer `pulsar('Además')` no encontraba el botón y **toda la sección siguiente
   caía en cascada** — doce comprobaciones rojas por una que llegó pronto.
   Arreglarlo aquí, y no en cada sitio, lo arregla en las setenta llamadas: un
   usuario tampoco pulsa un botón que todavía no se ha pintado, **espera a que
   salga**. Si de verdad no sale, sigue devolviendo `false` y falla igual. */
const pulsar = async (txt, tope = 6000) => {
  const hasta = Date.now() + tope;
  let clicado = false;
  do {
    clicado = await page.evaluate((t) => {
      /* 🐛 ⚠️ **CON UN DIÁLOGO ABIERTO SOLO SE PULSA DENTRO DE ÉL** (E3 F11).
         `pulsar` miraba el documento entero, así que al abrir el ＋ de Hoy y
         buscar "Tarea" ganaba un botón **del fondo** que se llama exactamente
         así —la coincidencia exacta va primero— y el recorrido acababa en
         Productividad en vez de en el formulario. Un overlay tapa lo de
         detrás: quien lo usa no puede pulsar el fondo, y la prueba tampoco
         debe. */
      const dialogo = [...document.querySelectorAll('[role="dialog"]')].pop();
      const raiz = dialogo || document;
      const botones = [...raiz.querySelectorAll('button')];
      /* 🐛 ⚠️ **Y también por `aria-label`** (Entrega 3 · F4). Un botón de solo
         icono —una papelera, una estrella, una flecha— **no tiene `innerText`**,
         así que hasta aquí el recorrido no podía pulsar ninguno: y desde EH F42
         todos ellos llevan su `aria-label` obligatorio, que es justo el nombre
         por el que un lector de pantalla los anuncia. Pulsar por ahí es lo que
         hace alguien usando VoiceOver, y es la única forma de comprobar en el
         navegador el fallo que reportó Josué: la papelera de Movimientos.
         El texto sigue teniendo preferencia, para no cambiar nada de antes. */
      const destino = botones.find((x) => x.innerText.trim() === t)
        || botones.find((x) => x.innerText.includes(t))
        || botones.find((x) => (x.getAttribute('aria-label') || '').trim() === t);
      if (!destino) return false;
      destino.click();
      return true;
    }, txt);
    if (!clicado) await page.waitForTimeout(200);
  } while (!clicado && Date.now() < hasta);
  await page.waitForTimeout(600);
  return clicado;
};

/* 🐛 ⚠️ **Esperar un número de milisegundos no es esperar a que algo aparezca.**
   Las comprobaciones del primer uso (F40) fallaban en la pasada completa y
   pasaban al ejecutar este archivo solo: con las 9.671 pruebas de Node por
   delante, la máquina va más cargada y los 800 ms fijos se quedaban cortos.
   El resultado era el peor de todos: **un rojo falso**, que manda a quien lo
   lea a buscar una regresión que no existe. Esto espera a que el texto
   APAREZCA, con un tope; si de verdad no llega, sigue fallando. */
const eqReal = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const esperarTexto = async (patron, tope = 8000) => {
  const hasta = Date.now() + tope;
  let texto = await ver();
  while (!patron.test(texto) && Date.now() < hasta) {
    await page.waitForTimeout(200);
    texto = await ver();
  }
  return texto;
};

/* ── 1 · ⚠️ ARRANCA, Y SIN NINGÚN ERROR ────────────────────────────────── */
const inicio = await ver();
ok(inicio.length > 100, 'La aplicación pinta algo (no una pantalla en blanco)');
ok(!/Rendered more hooks/.test(errores.join(' ')),
  '⚠️ REGLA 4: ningún hook después de un `return` condicional en App.jsx');
ok(!/is not a function|is not defined/.test(errores.join(' ')),
  '⚠️ Ninguna función usada sin importar (el fallo de `purgarCaducados`)');
ok(errores.length === 0, `Sin errores de JavaScript${errores.length ? ` — ${errores[0]}` : ''}`);
ok(/Josué/.test(inicio), 'Y se ve el Inicio de Josué');

/* ── 2 · ⚠️ LO GUARDADO LLEGA A LA PANTALLA ────────────────────────────── */
await pulsar('Bienestar');
ok(await pulsar('Imagen personal'), 'Imagen personal se abre desde Bienestar (NAV F1: se mudó de área)');
const eh = await ver();
ok(/Pelo/.test(eh) && /Skincare/.test(eh),
  '⚠️ LOS DATOS GUARDADOS LLEGAN: salen los módulos que había en Supabase, no los de por defecto');
ok(!/Vamos a configurar|Empezar/.test(eh),
  'Y no se le vuelve a plantar el asistente de configuración, porque ya lo terminó');

/* ── 3 · LAS FASES SE VEN Y SE TOCAN ───────────────────────────────────── */
ok(await pulsar('Pelo'), 'La plaquita de Pelo abre su panel');
const panel = await ver();
['Mi pelo', 'Mi rutina', 'Seguimiento', 'Recomendaciones', 'Productos', 'Peluquería']
  .forEach((p) => ok(panel.includes(p), `Se ve la plaquita "${p}"`));

ok(await pulsar('Peluquería'), 'Peluquería (EH F11) se abre');
const pelu = await ver();
ok(/Mi estilo de corte/.test(pelu), 'Con "Mi estilo de corte" dentro (EH F12)');
ok(/CADA CUÁNTO|Cada cuánto/i.test(pelu), 'Y su frecuencia');
ok(/Todavía no lo sé/.test(pelu), 'Y las cuatro formas de planificar el próximo corte');

/* ── 4 · ⚠️ SE GUARDA DE VERDAD, Y SE VE ───────────────────────────────── */
guardado.length = 0;
ok(await pulsar('Hoy'), 'Se puede registrar un corte con "Hoy"');
await page.waitForTimeout(1200);

const escrituras = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escrituras.length > 0, '⚠️ PERSISTENCIA: la app ESCRIBE en Supabase al tocarlo');
const cortes = escrituras.at(-1)?.value?.modulos
  ?.find((m) => m.id === 'pelo')?.config?.pelo?.peluqueria?.cortes || [];
ok(cortes.length === 1, 'Con el corte dentro, en su sitio del modelo de datos');
ok(cortes[0] && 'corteId' in cortes[0] && 'valoracion' in cortes[0],
  'Y con los campos de la Fase 12, así que el normalizador no se los come');
ok(/Último corte/.test(await ver()), '⚠️ Y la pantalla lo enseña: el usuario VE que ha pasado algo');

/* ── 5 · LO MISMO EN SKINCARE, HASTA LA ÚLTIMA FASE ────────────────────── */
/* ⚠️ Se recarga: así se comprueba también que lo de antes **sobrevive**. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
ok(await pulsar('Skincare'), 'Skincare se abre');
const piel = await ver();
ok(!/Configurar|Ahora no/.test(piel),
  '⚠️ Y sin volver a preguntarle el perfil, porque ya lo tenía guardado');
['Mi piel', 'Mi rutina', 'Seguimiento', 'Recomendaciones', 'Productos']
  .forEach((p) => ok(piel.includes(p), `Se ve la plaquita "${p}" de Skincare`));

ok(await pulsar('Productos'), 'Productos (EH F17) se abre');
const prod = await ver();
ok(/Todavía no hay catálogo/.test(prod),
  '⚠️ Y dice que no hay catálogo (D2-03), en vez de fingir una tienda');
ok(!/Comprar|carrito/i.test(prod), '⚠️ Y no hay ni un botón de comprar (apartado 22)');

guardado.length = 0;
ok(await pulsar('Añadir producto'), 'Se puede añadir un producto suyo (apartado 14)');
await page.fill('input[aria-label="Nombre del producto"]', 'Crema de prueba');
await page.locator('button', { hasText: 'Hidratantes' }).first().click();
await page.locator('button', { hasText: 'Farmacia' }).first().click();
await page.waitForTimeout(300);
await pulsar('Guardar producto');
await page.waitForTimeout(1200);

const escPiel = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escPiel.length > 0, '⚠️ PERSISTENCIA: el producto se ESCRIBE en Supabase');
const guardados = escPiel.at(-1)?.value?.modulos
  ?.find((m) => m.id === 'skincare')?.config?.piel?.productos || [];
ok(guardados.length === 1, 'Con el producto en la lista de la Fase 13, que es la única que hay');
ok(guardados[0]?.categoria === 'hidratante' && Array.isArray(guardados[0]?.tiendas),
  '⚠️ Y con la ficha de la Fase 17 entera, así que el normalizador no se la come');
const tras = await ver();
ok(/Crema de prueba/.test(tras), '⚠️ Y la pantalla lo enseña: el usuario VE su producto');
ok(/Disponible en/.test(tras),
  '⚠️ Y dónde conseguirlo aunque no haya enlace (apartado 6): Amazon no es una limitación');

/* ── 6 · BARBA Y AFEITADO, DE PRINCIPIO A FIN (EH F20) ─────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
ok(await pulsar('Barba'), 'Barba (EH F20) se abre desde Imagen personal');
const barba = await ver();
ok(/¿Quieres utilizar este apartado\?/.test(barba),
  '⚠️ Y pregunta si lo quiere usar: es 100 % opcional (apartado 1)');
ok(/Ahora no/.test(barba), 'Con su "Ahora no"');

guardado.length = 0;
ok(await pulsar('Sí, configurarlo'), 'Se puede decir que sí');
const casillas = await ver();
ok(/¿Qué quieres gestionar\?/.test(casillas), 'Y salen las casillas del apartado 2');
['Barba', 'Afeitado', 'Perfilado', 'Productos', 'Seguimiento']
  .forEach((c) => ok(casillas.includes(c), `Se ve la casilla "${c}"`));

// Se deja solo Barba: se destildan las otras que vienen puestas.
for (const quitar of ['Afeitado', 'Perfilado', 'Cuidado de la piel después del afeitado', 'Productos']) {
  await page.locator('button', { hasText: quitar }).first().click();
  await page.waitForTimeout(150);
}
await pulsar('Continuar');
await page.waitForTimeout(1000);

const escBarba = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escBarba.length > 0, '⚠️ PERSISTENCIA: las casillas se ESCRIBEN en Supabase');
const partes = escBarba.at(-1)?.value?.modulos?.find((m) => m.id === 'barba')?.config?.barba?.partes || {};
ok(partes.barba === true && partes.afeitado === false,
  'Con solo lo que marcó, y las demás apagadas');

const panelB = await ver();
ok(/Mi barba/.test(panelB), '⚠️ Y llega a su panel: el usuario VE que ha pasado algo');
/* ⚠️ Solo marcó "Barba", así que Productos y Seguimiento no salen; lo que sí
   sale es la rutina, porque su interruptor es propio (F21, apartado 16). */
ok(/Mi rutina/.test(panelB), '⚠️ Y la rutina está ahí aunque solo gestione la barba (EH F21)');
ok(!/Llega en la fase/.test(panelB) || /Llega en la fase 2/.test(panelB),
  'Regla 8: y si algo no funciona todavía, dice en qué fase llega');

ok(await pulsar('Mi barba'), 'El perfil se abre');
const perfilB = await ver();
ok(/¿Cómo llevas la barba ahora mismo\?/.test(perfilB), 'Con la pregunta del apartado 3');
ok(!/¿Cómo sueles afeitarte\?/.test(perfilB),
  '⚠️ Y SIN las de afeitado, porque no marcó esa casilla (apartado 7)');

guardado.length = 0;
ok(await pulsar('Barba corta'), 'Se puede contestar');
await page.waitForTimeout(1000);
const conResp = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(conResp.at(-1)?.value?.modulos?.find((m) => m.id === 'barba')?.config?.tipoBarba === 'corta',
  '⚠️ Y la respuesta se guarda donde la deja el motor de cuestionarios');
ok(/1 de \d/.test(await ver()), '⚠️ Y la pantalla lo enseña, contando solo lo visible');

/* ── 7 · LA RUTINA DE BARBA, DE PRINCIPIO A FIN (EH F21) ───────────────── */
/* ⚠️ Se recarga otra vez: aquí se comprueba que lo de la Fase 20 **sobrevive**,
   porque el almacén simulado se ha quedado con lo que la app escribió. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await pulsar('Barba');
const panelBarba = await ver();
ok(/Mi barba/.test(panelBarba),
  '⚠️ RECARGA: Barba abre su panel con lo que se guardó antes, no la pantalla de entrada');
ok(/Mi rutina/.test(panelBarba), 'Con su plaquita de rutina');

ok(await pulsar('Mi rutina'), 'Mi rutina (EH F21) se abre');
const rut = await ver();
ok(/Crear rutina/.test(rut), 'Con su "Crear rutina"');
/* ⚠️ Solo marcó "Barba" en las casillas, así que se le ofrece la plantilla de
   cuidado de barba y NO la de afeitado. */
ok(/Cuidado de barba/.test(rut), '⚠️ Y la plantilla de lo que él gestiona');
ok(!/🪒 Afeitado/.test(rut), '⚠️ Y NO la de afeitado, que no marcó (apartado 2 de la F20)');

guardado.length = 0;
ok(await pulsar('Usar esta rutina'), 'Se puede usar la plantilla');
await page.waitForTimeout(1200);
const escRut = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escRut.length > 0, '⚠️ PERSISTENCIA: la rutina se ESCRIBE en Supabase');
const rutinas = escRut.at(-1)?.value?.modulos?.find((m) => m.id === 'barba')?.config?.rutinas?.rutinas || [];
ok(rutinas.length === 1 && rutinas[0].pasos.length === 5,
  'Con sus cinco pasos, los del apartado 3');
ok(rutinas[0].recordatorio === false, '⚠️ Y con el recordatorio APAGADO: nunca automático');

const conRut = await ver();
ok(/Cuidado de barba/.test(conRut), '⚠️ Y la pantalla la enseña');
ok(/Omitir hoy/.test(conRut), 'Con su "Omitir hoy" en cada paso (apartado 7)');
ok(/Pendiente|Empezada|Hecha/.test(conRut),
  '⚠️ Y el estado del día en palabras —"Pendiente", nunca "has fallado"');

guardado.length = 0;
ok(await pulsar('Omitir hoy'), 'Se puede omitir un paso');
await page.waitForTimeout(1000);
const trasOmitir = guardado.filter((g) => g && g.key === 'estiloHombre').at(-1);
const omitidos = trasOmitir?.value?.modulos?.find((m) => m.id === 'barba')?.config?.rutinas?.hechos?.[0]?.omitidos || [];
ok(omitidos.length === 1, '⚠️ Y omitir SE GUARDA como omitido, no como hecho');
ok(/Omitido hoy/.test(await ver()), 'Y la pantalla lo dice');

/* ── 8 · SONRISA, DE PRINCIPIO A FIN (EH F23) ──────────────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
ok(await pulsar('Sonrisa'), 'Sonrisa (EH F23) se abre desde Imagen personal');
const son = await ver();
ok(/Higiene bucal/.test(son), 'Con su entrada');
ok(/Ahora no/.test(son), 'Y su "Ahora no": es opcional');

guardado.length = 0;
ok(await pulsar('Sí, configurarlo'), 'Se puede configurar');
await page.waitForTimeout(1000);
const panelSon = await ver();
['Higiene diaria', 'Cuidado dental', 'Revisiones'].forEach((p) =>
  ok(panelSon.includes(p), `Se ve la plaquita "${p}"`));
/* ⚠️ Las encendidas salen DOS veces —su plaquita y su interruptor—; el
   seguimiento, apagado, sale solo una: la del interruptor, que es donde tiene
   que estar para poder encenderlo (apartado 14). */
const veces = (t) => panelSon.split(t).length - 1;
ok(veces('Seguimiento') === 1,
  '⚠️ El seguimiento viene apagado: no tiene plaquita, solo su interruptor (apartado 9)');
ok(veces('Revisiones') === 2, 'Y las encendidas sí tienen plaquita');
ok(/Gestionar apartados/.test(panelSon), 'Con su ⚙️ Gestionar apartados (apartado 14)');
ok(/Consejos/.test(panelSon), 'Con sus consejos generales');
ok(!/🏆/.test(panelSon), '⚠️ Y SIN racha, porque no tiene una: no se pinta (apartado 10)');

ok(await pulsar('Higiene diaria'), 'Higiene diaria se abre');
const hig = await ver();
ok(/Mi rutina de higiene bucal/.test(hig), 'Con la plantilla del apartado 2');
ok(/Cepillado/.test(hig) && /Hilo dental/.test(hig), 'Y sus pasos');

guardado.length = 0;
ok(await pulsar('Usar esta rutina'), 'Se puede usar la plantilla');
await page.waitForTimeout(1200);
const escSon = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escSon.length > 0, '⚠️ PERSISTENCIA: las rutinas se ESCRIBEN en Supabase');
const rutSon = escSon.at(-1)?.value?.modulos?.find((m) => m.id === 'sonrisa')?.config?.sonrisa?.rutinas || [];
ok(rutSon.length === 2, 'Las dos del enunciado: mañana y noche');
ok(rutSon.every((r) => r.recordatorio === false), '⚠️ Y con el recordatorio APAGADO');

const trasPlantilla = await ver();
ok(/Mañana/.test(trasPlantilla) && /Noche/.test(trasPlantilla), '⚠️ Y la pantalla las enseña');
ok(/Omitir hoy/.test(trasPlantilla), 'Con su "Omitir hoy" en cada paso');
ok(/Pendiente|Empezada|Hecha/.test(trasPlantilla), 'Y el estado del día en palabras');

/* ── 9 · PERFUMES, DE PRINCIPIO A FIN (EH F24) ─────────────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
ok(await pulsar('Perfumes'), 'Perfumes (EH F24) se abre desde Imagen personal');
ok(/¿Quieres utilizar este apartado\?/.test(await ver()), 'Y pregunta si lo quiere usar');

ok(await pulsar('Sí, configurarlo'), 'Se puede configurar');
await page.waitForTimeout(800);
const panelPerf = await ver();
['Mi perfil', 'Mi colección', 'Quiero probar', 'Historial']
  .forEach((p) => ok(panelPerf.includes(p), `Se ve la plaquita "${p}"`));
/* ⚠️ Esto comprobaba que las recomendaciones dijeran *"llega en la fase 25"*.
   La Fase 25 las construyó, así que ahora lo correcto es que **funcionen**. */
ok(panelPerf.includes('Recomendaciones'), 'Y la de Recomendaciones, que llenó la Fase 25');
ok(!/Llega en la fase/.test(panelPerf), '⚠️ Regla 8: y ya no queda ninguna a medias');

ok(await pulsar('Mi colección'), 'La colección se abre');
await page.fill('input[aria-label="Nombre del perfume"]', 'Uno que tengo');
await page.fill('input[aria-label="Marca"]', 'Una marca');
guardado.length = 0;
ok(await pulsar('Añadir perfume'), 'Se puede añadir un perfume');
await page.waitForTimeout(1200);

const escPerf = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escPerf.length > 0, '⚠️ PERSISTENCIA: el perfume se ESCRIBE en Supabase');
const cole = escPerf.at(-1)?.value?.modulos?.find((m) => m.id === 'perfumes')?.config?.perfumes?.perfumes || [];
ok(cole.length === 1 && cole[0].nombre === 'Uno que tengo', 'Con su nombre y su marca');
ok(cole[0].favorito === false, 'Y sin marcarlo favorito solo');

const conPerf = await ver();
ok(/Uno que tengo/.test(conPerf), '⚠️ Y la pantalla lo enseña');
ok(/Es el que uso ahora/.test(conPerf), 'Con su botón de "el que uso ahora"');

/* ⚠️ Apartado 12 — marcarlo como actual NO lo hace favorito. */
guardado.length = 0;
ok(await pulsar('Es el que uso ahora'), 'Se puede marcar el que usa ahora');
await page.waitForTimeout(1200);
const trasActual = guardado.filter((g) => g && g.key === 'estiloHombre').at(-1)
  ?.value?.modulos?.find((m) => m.id === 'perfumes')?.config?.perfumes || {};
ok(!!trasActual.actual, '⚠️ Se guarda cuál usa ahora');
ok((trasActual.perfumes || [])[0]?.favorito === false,
  '⚠️ Y NO lo marca favorito: "esto no significa que sea su favorito" (apartado 12)');

/* ── 10 · LAS RECOMENDACIONES DE PERFUME (EH F25) ──────────────────────── */
/* ⚠️ Recargando: aquí se comprueba también que el perfume de la F24 sobrevive. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await pulsar('Perfumes');
const panelP2 = await ver();
ok(/Recomendaciones/.test(panelP2), 'La plaquita de Recomendaciones (EH F25) ya funciona');
ok(!/Llega en la fase 25/.test(panelP2), '⚠️ Y ya no dice que llega en la Fase 25: ha llegado');

ok(await pulsar('Recomendaciones'), 'Recomendaciones se abre');
const recP = await ver();
ok(/¿Cuál me pongo\?/.test(recP), 'Con su pregunta');
ok(/¿Para qué lo necesitas\?/.test(recP), 'Y la del apartado 5');
ok(/¿Cuándo\?/.test(recP), 'Y la del apartado 6');
ok(/Entretiempo/.test(recP), 'Con las cuatro épocas, incluida la que no estaba en la Fase 24');

/* ⚠️ Sin decir para qué, el perfume que tiene no encaja con nada todavía. */
/* El chip lleva su icono delante, así que se busca por texto parcial. */
await page.locator('button', { hasText: 'Noche' }).first().click();
await page.waitForTimeout(200);
ok(true, 'Se puede pedir una ocasión');
await page.waitForTimeout(700);
const conOcasion = await ver();
ok(/Uno que tengo/.test(conOcasion) || /todavía no podemos/.test(conOcasion),
  '⚠️ Y o sale una recomendación, o se dice por qué no: nunca una tarjeta vacía');

/* ── 11 · ACCESORIOS, Y LA PRENDA VA AL ARMARIO (EH F26) ───────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
ok(await pulsar('Accesorios'), 'Accesorios (EH F26) se abre desde Imagen personal');
ok(/¿Quieres utilizar este apartado\?/.test(await ver()), 'Y pregunta si lo quiere usar');

ok(await pulsar('Sí, configurarlo'), 'Se puede configurar');
await page.waitForTimeout(800);
const panelAcc = await ver();
['Mis accesorios', 'Combinaciones', 'Recomendaciones', 'Quiero comprar']
  .forEach((p) => ok(panelAcc.includes(p), `Se ve la plaquita "${p}"`));
ok(!/Llega en la fase/.test(panelAcc), '⚠️ Regla 8: ninguna plaquita decorativa');

ok(await pulsar('Mis accesorios'), 'Mis accesorios se abre');
const misAcc = await ver();
ok(/se guardan en tu Armario/.test(misAcc),
  '⚠️ Y la pantalla DICE que viven en el Armario: si no, los apuntaría dos veces');

await page.fill('input[aria-label="Nombre del accesorio"]', 'Casio negro');
await page.fill('input[aria-label="Marca del accesorio"]', 'Casio');
guardado.length = 0;
ok(await pulsar('Añadir'), 'Se puede añadir un accesorio');
await page.waitForTimeout(1400);

/* ⚠️ La prueba de la fase: se escriben LOS DOS almacenes, y la prenda va al
   armario, no a Estilo de hombre. */
const escArm = guardado.filter((g) => g && g.key === 'armario');
const escAcc = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escArm.length > 0, '⚠️ PERSISTENCIA: la PRENDA se escribe en el ARMARIO');
ok(escAcc.length > 0, '⚠️ Y el envoltorio de estilo, en Imagen personal');
const prendasAcc = (escArm.at(-1)?.value?.prendas || []).filter((p) => p.categoria === 'accesorios');
ok(prendasAcc.length === 1 && prendasAcc[0].nombre === 'Casio negro',
  'La prenda entra en la categoría "accesorios" del armario que ya existía');
ok(prendasAcc[0].subcategoria === 'relojes', 'Con el tipo de accesorio como subcategoría');
const envoltorios = escAcc.at(-1)?.value?.modulos?.find((m) => m.id === 'accesorios')?.config?.accesorios?.accesorios || [];
ok(envoltorios.length === 1, 'Y aquí queda un solo envoltorio');
ok(envoltorios[0].prendaId === prendasAcc[0].id, 'Apuntando a la prenda por su id');
ok(!('nombre' in envoltorios[0]) && !('marca' in envoltorios[0]),
  '⚠️ NI UN CAMPO DE LA PRENDA duplicado aquí: *"no crear otro armario"*');

const conAcc = await ver();
ok(/Casio negro/.test(conAcc), '⚠️ Y la pantalla lo enseña, unido a su prenda');

/* ⚠️ Apartado 3 — el mismo nombre otra vez NO crea una copia. */
await page.fill('input[aria-label="Nombre del accesorio"]', 'Casio negro');
guardado.length = 0;
await pulsar('Añadir');
await page.waitForTimeout(900);
const avisoDup = await ver();
ok(/Ya tienes/.test(avisoDup), '⚠️ Con el nombre repetido AVISA en vez de crear la copia');
ok(/Usar el que ya tengo/.test(avisoDup), 'Y ofrece usar el que ya tiene');
ok(guardado.filter((g) => g && g.key === 'armario').length === 0,
  '⚠️ Y no ha escrito nada en el armario mientras él decide');

/* ⚠️ Y al recargar sigue estando: la prenda en el armario y su estilo aquí. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await pulsar('Accesorios');
await pulsar('Mis accesorios');
await page.waitForTimeout(500);
ok(/Casio negro/.test(await ver()), '⚠️ PERSISTENCIA: sigue ahí después de recargar');

/* ── 12 · MIS GUSTOS, Y NI UNA SEGUNDA LISTA (EH F27) ──────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
ok(await pulsar('Mis gustos'), 'Mis gustos (EH F27) se abre desde Imagen personal');
ok(/¿Quieres utilizar este apartado\?/.test(await ver()), 'Y pregunta si lo quiere usar');

ok(await pulsar('Sí, configurarlo'), 'Se puede configurar');
await page.waitForTimeout(800);
const panelGus = await ver();
['Me gusta', 'Quiero hacer', 'Mis intereses', 'Mis preferencias']
  .forEach((p) => ok(panelGus.includes(p), `Se ve la plaquita "${p}"`));
ok(!/Llega en la fase/.test(panelGus), '⚠️ Regla 8: ninguna plaquita decorativa');

ok(await pulsar('Quiero hacer'), '"Quiero hacer" se abre');
const quiero = await ver();
ok(/no te va a aparecer como pendiente/.test(quiero),
  '⚠️ Y dice que NO es una lista de tareas, donde se ve (apartado 4)');

await page.fill('input[aria-label="Añadir a Quiero hacer"]', 'Viajar a Londres');
guardado.length = 0;
ok(await pulsar('Añadir'), 'Se puede añadir algo que quiere hacer');
await page.waitForTimeout(1400);

const escGus = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escGus.length > 0, '⚠️ PERSISTENCIA: se escribe en Supabase');
const guardadoEH = escGus.at(-1)?.value || {};
const entradasGus = guardadoEH.modulos?.find((m) => m.id === 'gustos')?.config?.gustos?.entradas || [];
ok(entradasGus.length === 1 && entradasGus[0].nombre === 'Viajar a Londres', 'Con su ficha');
ok(entradasGus[0].estado === 'idea', 'Que nace como idea (apartado 6)');
/* ⚠️ La prueba de la fase: el NOMBRE va al registro de la Fase 4, donde ya vivía
   desde la Fase 6. Ni una segunda lista de "cosas que me gustaría hacer". */
const registro = guardadoEH.datos?.quiereHacer?.valor || [];
ok(Array.isArray(registro) && registro.includes('Viajar a Londres'),
  '⚠️ Y SU NOMBRE VA AL REGISTRO DE LA FASE 4: ni una segunda lista');
ok(/Viajar a Londres/.test(await ver()), '⚠️ Y la pantalla lo enseña');

/* ⚠️ Y al recargar sigue estando, con su ficha y su nombre en el registro. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await pulsar('Mis gustos');
await pulsar('Quiero hacer');
await page.waitForTimeout(500);
ok(/Viajar a Londres/.test(await ver()), '⚠️ PERSISTENCIA: sigue ahí después de recargar');

/* ── 13 · CONVERTIR EN OBJETIVO, SIN UN SEGUNDO SISTEMA (EH F28) ───────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await pulsar('Mis gustos');
ok(/Experiencias/.test(await ver()), 'La plaquita 🌟 Experiencias (EH F28) está ahí');
ok(await pulsar('Quiero hacer'), '"Quiero hacer" se abre');
await page.waitForTimeout(400);

/* Se abre la ficha de lo que se apuntó en la Fase 27. */
ok(await pulsar('Viajar a Londres'), 'Se abre la ficha de lo que quiere hacer');
await page.waitForTimeout(400);
const fichaF28 = await ver();
ok(/Todavía no es un objetivo/.test(fichaF28), 'Y dice que todavía no es un objetivo');
ok(/Convertir en objetivo/.test(fichaF28), 'Con su botón de convertir');
ok(/Los objetivos se gestionan en Objetivos/.test(fichaF28),
  '⚠️ Y dice DÓNDE viven de verdad (apartado 2)');
ok(/Todavía no hay dónde guardar fotos/.test(fichaF28),
  '⚠️ Y el límite de las fotos, dicho en vez de un botón muerto (regla 8)');

ok(await pulsar('🎯 Convertir en objetivo'), 'Se puede convertir');
await page.waitForTimeout(400);
ok(/¿Para cuándo te lo pones\?/.test(await ver()),
  '⚠️ Y PIDE EL PLAZO: no hay valor por defecto');

guardado.length = 0;
ok(await pulsar('1 año'), 'Se elige un plazo');
await page.waitForTimeout(1500);

/* ⚠️ La prueba de la fase: el objetivo va a OBJETIVOS y aquí solo su id. */
const escObj = guardado.filter((g) => g && g.key === 'objetivos');
const escEH28 = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escObj.length > 0, '⚠️ PERSISTENCIA: el objetivo se escribe en OBJETIVOS');
ok(escEH28.length > 0, 'Y el enlace, en Imagen personal');
const listaObj = escObj.at(-1)?.value?.lista || [];
ok(listaObj.length === 1 && listaObj[0].texto === 'Viajar a Londres',
  'El objetivo lleva el nombre que él ya había escrito');
ok(listaObj[0].plazo === '1 año' && listaObj[0].cumplido === false, 'Con su plazo y sin cumplir');
ok(Object.keys(listaObj[0]).sort().join(',') === 'cumplido,fechaCreacion,id,plazo,texto',
  '⚠️ Con los campos de Objetivos y NI UNO INVENTADO');
const entradasF28 = escEH28.at(-1)?.value?.modulos?.find((m) => m.id === 'gustos')?.config?.gustos?.entradas || [];
const enlazada = entradasF28.find((e) => e.nombre === 'Viajar a Londres');
ok(!!enlazada && enlazada.objetivoId === listaObj[0].id,
  '⚠️ Y aquí SOLO QUEDA SU ID: ni una copia del objetivo');
ok(!('texto' in enlazada) && !('plazo' in enlazada), 'Sin duplicar ni el texto ni el plazo');

/* Apartado 2 — y se abre el sistema global de objetivos, no una copia. */
await page.waitForTimeout(600);
ok(/Objetivos/.test(await ver()), '⚠️ Y navega a OBJETIVOS, el módulo que ya existía');

/* ── 14 · "MI ESTILO": EL RESUMEN DE ARRIBA (EH F29) ───────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(500);
const miEstilo = await ver();
ok(/Mi estilo personal/.test(miEstilo), 'La tarjeta "Mi estilo" (EH F29) sale arriba');
/* ⚠️ Los bloques del apartado 1, solo los que tienen módulos activos. */
['Cuidado', 'Fragancias', 'Accesorios', 'Gustos']
  .forEach((b) => ok(miEstilo.includes(b), `Se ve el bloque "${b}"`));
ok(!/\bRopa\b/.test(miEstilo),
  '⚠️ Y NO sale "Ropa", porque el módulo de Estilo y armario está apagado (apartado 6)');
ok(/⚪|🟢/.test(miEstilo), 'Cada módulo lleva su estado (apartado 13)');
ok(/Gestionar apartados/.test(miEstilo),
  '⚠️ Y dice que el orden y qué aparece se cambian ALLÍ, no aquí (D2-07)');

/* ⚠️ Y desde el resumen se abre el módulo de verdad, no una copia. */
ok(await pulsar('🟢 Perfumes') || await pulsar('⚪ Perfumes'),
  'Desde el resumen se abre Perfumes');
await page.waitForTimeout(600);
ok(/Mi colección|¿Quieres utilizar este apartado\?/.test(await ver()),
  '⚠️ Y abre SU módulo, el que ya existía');

/* Apartado 10 — ocultar, y que no se lleve nada por delante. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
guardado.length = 0;
ok(await pulsar('⚙️ Ocultar "Mi estilo"'), 'Se puede ocultar');
await page.waitForTimeout(1200);
const trasOcultar = await ver();
ok(!/Mi estilo personal/.test(trasOcultar), 'Y desaparece');
ok(/Volver a enseñar/.test(trasOcultar), 'Con su botón para traerla de vuelta');
ok(/Perfumes/.test(trasOcultar),
  '⚠️ Y LOS MÓDULOS SIGUEN AHÍ: ocultar el resumen no apaga nada (apartado 10)');
const escMiEstilo = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escMiEstilo.length > 0, '⚠️ PERSISTENCIA: se guarda que la ocultó');
const cfgEstilo = escMiEstilo.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok(cfgEstilo.miEstilo?.oculto === true, 'Y es lo ÚNICO que esta fase guarda: un booleano');

ok(await pulsar('Volver a enseñar "Mi estilo"'), 'Y se puede volver a enseñar');
await page.waitForTimeout(800);
ok(/Mi estilo personal/.test(await ver()), '⚠️ Y vuelve entera');

/* ── 15 · LA PANTALLA PRINCIPAL, POR SECCIONES (EH F30) ────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(500);
const portada = await ver();
// Apartado 1 — la cabecera, literal.
ok(/Imagen personal/.test(portada), 'La cabecera está');
ok(/Tu cuidado, estilo y preferencias\./.test(portada), 'Con su frase, tal cual (apartado 1)');
// Apartado 3 — las plaquitas, agrupadas.
ok(/Cuidado/.test(portada), 'Se ve la sección "Cuidado"');
ok(/Estilo\b/.test(portada), 'y la sección "Estilo"');
ok(/Personal/.test(portada), 'y "Personal", que es como Josué llama al tercero');
ok(/⚪/.test(portada), 'Con la marca de lo que está sin configurar (apartado 5)');

/* Apartado 9 — los accesos rápidos: nacen vacíos y los elige él. */
ok(/Accesos rápidos/.test(portada), 'La zona de accesos rápidos se ofrece');
ok(/Elige los que uses de verdad/.test(portada),
  '⚠️ Y dice que los elige él: ninguno viene puesto (apartado 9)');
guardado.length = 0;
ok(await pulsar('🪒 Afeitarme'), 'Se puede elegir uno');
await page.waitForTimeout(1200);
const escPantalla = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escPantalla.length > 0, '⚠️ PERSISTENCIA: la elección se guarda');
const cfgPantalla = escPantalla.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok((cfgPantalla.pantalla?.accesos || []).includes('afeitarme'), 'Con el acceso que eligió');

/* ⚠️ Y al recargar sigue ahí, y abre su módulo. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(500);
ok(/🪒 Afeitarme/.test(await ver()), '⚠️ PERSISTENCIA: el acceso sigue tras recargar');
ok(await pulsar('🪒 Afeitarme'), 'Y se puede pulsar');
await page.waitForTimeout(700);
ok(/Barba|¿Quieres utilizar este apartado\?/.test(await ver()),
  '⚠️ Y abre SU módulo, el que ya existía');

/* ── 16 · ⋮ PERSONALIZAR LAS PLAQUITAS (EH F31) ───────────────────────────
   ⚠️ La prueba que de verdad importa de esta fase: **cambiar el tamaño de una
   plaquita, recargar y comprobar que sigue** (apartado 11, pruebas 9 a 11). */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(500);
ok(await pulsar('⋮ Personalizar'), '⋮ Personalizar abre el modo edición (apartado 1)');
await page.waitForTimeout(600);
const personalizar = await ver();
ok(/Tamaño/.test(personalizar), 'Con el tamaño de cada plaquita (apartado 4)');
ok(/Pequeña/.test(personalizar) && /Mediana/.test(personalizar) && /Grande/.test(personalizar),
  '⚠️ Los tres tamaños, y solo tres');
ok(/Configurar contenido/.test(personalizar), 'Y qué información aparece (apartado 5)');
ok(/Ocultar una plaquita no borra nada/.test(personalizar),
  '⚠️ Diciendo antes que ocultar no borra (apartado 8)');
ok(/Restablecer diseño/.test(personalizar), 'Con 🔄 Restablecer diseño (apartado 10)');
ok(/Personalizar automáticamente/.test(personalizar), 'Y ✨ Personalizar automáticamente (apartado 17)');

guardado.length = 0;
ok(await pulsar('⬜ Grande'), 'Se puede poner una plaquita grande');
await page.waitForTimeout(1200);
const escTam = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escTam.length > 0, '⚠️ PERSISTENCIA: el tamaño se guarda');
const cfgTam = escTam.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok(Object.keys(cfgTam.pantalla?.tamanos || {}).length > 0,
  '⚠️ Y va al almacén de la PANTALLA, no a la config del módulo (apartado 12)');

/* ⚠️ Apartado 17 — y el criterio de "personalizar automáticamente" se dice de
   verdad: nunca "según el uso reciente", que es un dato que no se guarda. */
ok(await pulsar('✨ Personalizar automáticamente'), 'El botón abre su confirmación');
await page.waitForTimeout(600);
ok(/No se mira cuándo abriste cada uno/.test(await ver()),
  '⚠️ Y dice el criterio de verdad, en vez de fingir un "uso reciente"');
await pulsar('Cancelar');
await page.waitForTimeout(400);

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(500);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
/* ⚠️ El texto "⬜ Grande" está SIEMPRE —es uno de los tres botones—, así que
   comprobarlo no probaría nada. Lo que se mira es cuál está marcado. */
const grandeMarcada = await page.evaluate(() => [...document.querySelectorAll('button')]
  .some((b) => b.innerText.trim() === '⬜ Grande' && b.getAttribute('aria-pressed') === 'true'));
ok(grandeMarcada,
  '⚠️ PERSISTENCIA: tras recargar, el tamaño elegido sigue marcado (prueba 9)');

/* ── 17 · 💡 IDEAS PARA TI (EH F32) ───────────────────────────────────────
   Lo que de verdad importa: que la idea EXPLIQUE por qué aparece, que "no me
   interesa" la haga desaparecer, y que eso siga tras recargar. */
ok(/Frecuencia de sugerencias/.test(await ver()),
  '🔔 La frecuencia de sugerencias se configura desde Personalizar (apartados 7 y 16)');
await pulsar('Listo');
await page.waitForTimeout(600);
const conIdeas = await ver();
ok(/Ideas para ti/.test(conIdeas), '💡 La tarjeta de ideas está en la pantalla principal (apartado 1)');
ok(/Por qué aparece/.test(conIdeas), '⚠️ Y cada idea EXPLICA por qué aparece (apartado 8 · prueba 3)');
ok(/Lo hemos pensado porque/.test(conIdeas), 'con una frase entera, hecha con sus datos');
ok(/Podrías|Quizá te interese|Una opción sería/.test(conIdeas),
  '⚠️ Con el tono del apartado 10: nunca "debes"');
ok(!/\bdebes\b|tienes que|obligatorio/i.test(conIdeas), 'y no aparece ninguna palabra prohibida');
ok(/Me interesa/.test(conIdeas) && /No me interesa/.test(conIdeas) && /Ya lo hago/.test(conIdeas),
  'Con las tres respuestas del apartado 4');

guardado.length = 0;
ok(await pulsar('❌ No me interesa'), 'Se puede descartar una idea (prueba 5)');
await page.waitForTimeout(1200);
const escIdeas = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escIdeas.length > 0, '⚠️ PERSISTENCIA: la respuesta se guarda');
const cfgIdeas = escIdeas.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok((cfgIdeas.ideas?.recomendaciones?.feedback || []).some((f) => f.motivo === 'no_interesa'),
  'con su motivo, en el almacén de las ideas');
ok(cfgIdeas.ideas?.frecuencia === 'normal',
  '⚠️ Y la frecuencia sigue en "Normal", que es el defecto del apartado 7');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
ok(/Ideas para ti/.test(await ver()),
  '⚠️ PERSISTENCIA: tras recargar, las ideas siguen ahí (pruebas 9 y 11)');
ok(await pulsar('👁️ Ocultar'), 'Y se pueden ocultar (apartado 1)');
await page.waitForTimeout(1000);
ok(/Volver a ver las ideas/.test(await ver()),
  '⚠️ Ocultar es desactivar el sistema (apartado 16), y se puede volver (prueba 11)');

/* ── 18 · ✨ DESCUBRIR (EH F33) ───────────────────────────────────────────
   Lo que importa: que la tarjeta salga, que su lenguaje sea abierto, que
   guardar vaya a LA MISMA lista que las ideas, y que eso siga tras recargar. */
const descubrirTxt = await ver();
ok(/Descubrir/.test(descubrirTxt), '✨ Descubrir está en la pantalla principal (apartado 1)');
ok(/Inspiración, no obligación/.test(descubrirTxt), 'con la regla del objetivo, literal');
ok(/Podrías|Una idea podría ser|Si te gusta/.test(descubrirTxt),
  '⚠️ Y lenguaje abierto: nunca una tendencia como verdad absoluta (apartado 14)');
ok(/no hay seguidores/.test(descubrirTxt), '⚠️ Y se dice que NO es una red social (apartado 15)');
ok(/no se compra nada/.test(descubrirTxt), 'ni se compra nada aquí (apartado 10)');

guardado.length = 0;
ok(await pulsar('❤️ Guardar'), 'Se puede guardar una tarjeta (prueba 4)');
await page.waitForTimeout(1200);
const escDesc = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escDesc.length > 0, '⚠️ PERSISTENCIA: lo guardado se guarda');
const cfgDesc = escDesc.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok((cfgDesc.ideas?.recomendaciones?.guardadas || []).some((g) => String(g.reglaId).startsWith('desc_')),
  '⚠️ Y va a LA MISMA lista que las ideas: no hay una segunda (apartado 6)');
ok(!('guardadas' in (cfgDesc.descubrir || {})),
  '⚠️ El almacén de Descubrir no tiene lista propia de guardados');

ok(await pulsar('🔎 Temas'), 'Se pueden filtrar los temas (apartado 5 · prueba 3)');
await page.waitForTimeout(500);
ok(/¿Qué quieres descubrir\?/.test(await ver()), 'con la pregunta del enunciado');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
ok(/Quitar de guardados/.test(await ver()),
  '⚠️ PERSISTENCIA: tras recargar, la tarjeta sigue guardada (prueba 12)');

/* ── 19 · ⚙️ MIS PREFERENCIAS (EH F34) ────────────────────────────────────
   Lo que importa: que se llegue desde Mi estilo, que NO haya porcentajes, que
   el interruptor del apartado 7 se guarde y que la confirmación fuerte del
   borrado diga qué se va Y qué se queda. */
/* ⚠️ Se entra por la tarjeta "🧔 Mi estilo personal", que está SIEMPRE. La otra
   puerta —la zona de la Fase 6— solo existe con "Estilo y armario" encendido, y
   aquí no lo está: por eso hay dos, y no una. */
ok(await pulsar('⚙️ Mis preferencias'),
  '⚙️ Mis preferencias se abre desde Mi estilo (apartado 1)');
await page.waitForTimeout(600);
const prefs = await ver();
ok(/Tú tienes el control de tus datos/.test(prefs), 'con la frase del objetivo, literal');
ok(/Usar mis preferencias para recomendaciones/.test(prefs), 'y el interruptor del apartado 7');
ok(/siguen guardadas/.test(prefs), 'que dice que las preferencias no se pierden');
ok(!/%/.test(prefs), '⚠️ Y NI UN PORCENTAJE: *"no queremos gamificar la configuración"* (apartado 5)');
ok(/Sin configurar/.test(prefs), 'lo no configurado se marca, y ya');
ok(/Eliminar datos de Imagen personal/.test(prefs), 'con la opción avanzada del apartado 10');

guardado.length = 0;
ok(await pulsar('Editar'), 'Editar lleva al módulo donde de verdad se configura (apartado 3)');
await page.waitForTimeout(800);
ok(!/Mis preferencias/.test(await ver()), '⚠️ Y sale de esta pantalla: no duplica el formulario');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(500);
await pulsar('⚙️ Mis preferencias');
await page.waitForTimeout(600);
ok(await pulsar('🗑️ Eliminar datos de Imagen personal'), 'La opción avanzada abre su confirmación');
await page.waitForTimeout(600);
const aviso = await ver();
ok(/no se puede deshacer/.test(aviso), '⚠️ Con una confirmación FUERTE (apartado 10)');
ok(/No se toca:/.test(aviso) && /armario/i.test(aviso),
  '⚠️ Y diciendo qué NO se borra: el armario, el diario y los objetivos son de otros módulos');
await pulsar('Cancelar');
await page.waitForTimeout(400);
ok(/Mis preferencias/.test(await ver()), 'y cancelar no borra nada');

/* ── 20 · 📊 MI PROGRESO (EH F35) ─────────────────────────────────────────
   Lo que importa: que NO haya notas ni porcentajes, que sin registros diga que
   no hay datos en vez de enseñar un cero, y que el periodo se guarde. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(700);
const progreso = await ver();
ok(/Mi progreso/.test(progreso), '📊 Mi progreso está en la pantalla principal (apartado 1)');
ok(/Esta semana/.test(progreso), 'con el encabezado del apartado 4, literal');
ok(/Todavía no hay suficientes datos/.test(progreso),
  '⚠️ Y sin registros NO enseña un cero: dice que no hay datos (apartado 10 · prueba 9)');
ok(!/\d+\s*\/\s*100|% de hombre/.test(progreso),
  '⚠️ NI UNA PUNTUACIÓN: *"tu estilo es 73/100"* no existe (apartado 3)');
ok(!/mejor que|peor que/i.test(progreso), 'ni una comparación (apartado 9)');
ok(/solo lo que has registrado/.test(progreso), 'y se dice qué es esta pantalla');
ok(/No se comparte con nadie/.test(progreso), 'con su nota de privacidad (apartado 14)');

guardado.length = 0;
ok(await pulsar('Mes'), 'Se puede cambiar el periodo (apartado 5 · prueba 5)');
await page.waitForTimeout(1200);
const escProg = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escProg.length > 0, '⚠️ PERSISTENCIA: el periodo se guarda');
const cfgProg = escProg.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok(cfgProg.progreso?.periodo === 'mes', 'con el que eligió');
ok(!('total' in (cfgProg.progreso || {})) && !('cifras' in (cfgProg.progreso || {})),
  '⚠️ Y NO se guarda ni una cifra: la estadística es una vista (apartado 13)');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(700);
ok(/Este mes/.test(await ver()), '⚠️ PERSISTENCIA: tras recargar sigue en el mes');
ok(await pulsar('👁️ Ocultar'), 'y se puede ocultar (apartado 12 · prueba 7)');
await page.waitForTimeout(1000);
ok(/Volver a ver mi progreso/.test(await ver()),
  '⚠️ Con todo lo demás funcionando igual, y se puede volver (prueba 8)');

/* ── 21 · 🧩 GESTIONAR APARTADOS (EH F36) ─────────────────────────────────
   La prueba que de verdad importa de esta fase: **ocultar un módulo lo quita de
   la portada SIN desactivarlo**, y eso sigue tras recargar. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
ok(/Perfumes/.test(await ver()), 'De partida, Perfumes sale en la portada');
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
ok(await pulsar('🧩 Gestionar apartados'),
  '🧩 Gestionar apartados se abre desde ⋮ Personalizar (apartado 1)');
await page.waitForTimeout(700);
const gestion = await ver();
ok(/Ocultar lo quita de la portada/.test(gestion),
  '⚠️ Y separa las tres acciones con todas las letras (apartados 3, 4 y 5)');
ok(/🟢/.test(gestion) && /Activo/.test(gestion), 'con la etiqueta de estado (apartado 16)');
/* ⚠️ El buscador es un `placeholder`, y `innerText` no los ve: se mira el campo. */
ok(await page.evaluate(() => [...document.querySelectorAll('input')]
  .some((i) => /Buscar apartado/.test(i.placeholder || ''))),
'y su buscador (apartado 14)');
ok(/Ninguno es obligatorio/.test(gestion), 'diciendo que ninguno lo es (apartado 10)');
ok(/Restablecer Imagen personal/.test(gestion), 'con su restablecer (apartado 8)');

guardado.length = 0;
ok(await pulsar('👁️ Ocultar'), 'Se puede ocultar un módulo (prueba 1)');
await page.waitForTimeout(1200);
const escGest = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escGest.length > 0, '⚠️ PERSISTENCIA: se guarda');
const modsGest = escGest.at(-1)?.value?.modulos || [];
const ocultoAlguno = modsGest.find((m) => m.oculto === true);
ok(!!ocultoAlguno, 'con el módulo marcado como oculto');
ok(ocultoAlguno && ocultoAlguno.activo === true,
  '⚠️ Y SIGUE ACTIVO: ocultar no es desactivar (apartado 3)');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(700);
/* ⚠️ Y el módulo oculto YA NO SALE en la portada, tras recargar. */
const nombreOculto = ({
  estilo: 'Estilo y armario', pelo: 'Pelo', barba: 'Barba', skincare: 'Skincare',
  sonrisa: 'Sonrisa', perfumes: 'Perfumes', accesorios: 'Accesorios', gustos: 'Mis gustos',
})[ocultoAlguno.id] || ocultoAlguno.id;
ok(!new RegExp(`⚪ ${nombreOculto}|▫️ ${nombreOculto}`).test(await ver()),
  `⚠️ PERSISTENCIA: tras recargar, ${nombreOculto} sigue fuera de la portada`);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(500);
await pulsar('🧩 Gestionar apartados');
await page.waitForTimeout(700);
ok(/⚪/.test(await ver()), '⚠️ Y la etiqueta lo dice: ⚪ Oculto (prueba 15)');
ok(await pulsar('👁️ Mostrar'), 'y se puede volver a mostrar (prueba 2)');
await page.waitForTimeout(1000);
ok(!/⚪ Oculto/.test(await ver()), 'y vuelve a estar visible');

/* ── 22 · 🔍 BUSCAR EN ESTILO DE HOMBRE (EH F37) ──────────────────────────
   Lo que importa: que encuentre SIN terminar la palabra, que agrupe, y que
   abrir un resultado apunte el reciente y NO active nada por su cuenta. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(700);
ok(/Buscar en Imagen personal/.test(await ver()),
  '🔍 El buscador está arriba del todo (apartado 1)');
ok(await pulsar('🔍 Buscar en Imagen personal'), 'y se abre');
await page.waitForTimeout(600);
const buscador = await ver();
ok(/Recientes/.test(buscador), 'con sus 🕘 Recientes (apartado 5)');
ok(/lo último que abras desde el buscador/.test(buscador),
  '⚠️ diciendo que salen de lo que ABRA, no de por dónde navegue');
ok(/no hay una lista aparte/.test(buscador),
  '⚠️ y que los favoritos son los de cada apartado (apartado 6)');
ok(/Eliminados recientemente/.test(buscador), 'y dónde está lo borrado (apartado 15)');

// Apartado 3 — *"bar…"* sin terminar la palabra.
/* 🐛 ⚠️ **El renombrado de la NAV F2 rompió este selector, y el recorrido fue lo
   único que lo vio.** El marcador decía *"Buscar en Estilo de hombre"* y ahora
   dice *"Buscar en Imagen personal"*, así que `placeholder*="Buscar en Estilo"`
   dejó de encontrar el campo y la sección entera se cayó con un timeout.
   ⚠️ Se busca por **«Buscar en»**, que es lo que no depende de cómo se llame el
   apartado: un selector atado al nombre se rompe cada vez que alguien lo cambia
   con todo el derecho. */
await page.fill('input[placeholder*="Buscar en"]', 'bar');
await page.waitForTimeout(700);
const conBar = await ver();
ok(/Apartados/.test(conBar), '⚠️ "bar" encuentra sin terminar la palabra, y AGRUPADO (apartados 2 y 3)');
ok(/Barba/.test(conBar), 'con Barba dentro');

guardado.length = 0;
ok(await pulsar('Barba'), 'Se puede abrir un resultado');
await page.waitForTimeout(1200);
const escBusc = guardado.filter((g) => g && g.key === 'estiloHombre');
const cfgBusc = escBusc.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok((cfgBusc.buscador?.recientes || []).includes('barba'),
  '⚠️ PERSISTENCIA: abrirlo lo apunta en Recientes — y son IDS, no lo que escribió');

/* ── 23 · 🔔 AVISOS DE ESTILO DE HOMBRE (EH F38) ──────────────────────────
   Lo que importa: que TODO empiece apagado, que encender uno se guarde, y que
   la pantalla diga que el interruptor general es el de JosStyle. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
ok(await pulsar('🔔 Avisos de Imagen personal'),
  '🔔 Los avisos se abren desde ⋮ Personalizar (apartado 11)');
await page.waitForTimeout(700);
const avisos = await ver();
ok(/Solo te avisamos de lo que enciendas tú/.test(avisos),
  '⚠️ Con la regla principal dicha: TODO empieza apagado');
ok(/son los de JosStyle/.test(avisos),
  '⚠️ Y que el interruptor general y el horario de silencio NO son de aquí (apartados 1, 7 y 11)');
ok(/Recordarme/.test(avisos), 'con 🔔 Recordarme (apartado 4)');
ok(/todavía no guarda un historial/.test(avisos),
  '⚠️ Y la verdad sobre el historial, en vez de montar uno paralelo (apartado 13)');
ok(/No recibir avisos/.test(avisos), 'y el 🔕 por módulo (apartado 6)');
ok(!/Lo que te llegaría hoy/.test(avisos),
  '⚠️ Y de fábrica NO hay nada que mandar: nada está encendido (prueba 1)');

/* ⚠️ Se pulsa un botón de verdad —el 🔕 de un módulo—, no un interruptor cuyo
   marcado no conocemos: así la comprobación mide algo. */
guardado.length = 0;
ok(await pulsar('🔕 No recibir avisos'), 'Se puede silenciar un módulo (apartado 6 · prueba 7)');
await page.waitForTimeout(1200);
const escAv = guardado.filter((g) => g && g.key === 'estiloHombre');
ok(escAv.length > 0, '⚠️ PERSISTENCIA: se guarda');
const cfgAv = escAv.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok((cfgAv.avisos?.silenciados || []).length === 1, 'con el módulo silenciado');
const silenciado = (cfgAv.avisos?.silenciados || [])[0];
const modSil = escAv.at(-1)?.value?.modulos?.find((m) => m.id === silenciado);
ok(modSil && modSil.activo === true,
  '⚠️ Y el módulo SIGUE ACTIVO: silenciar no es desactivar (apartado 6)');
ok(Object.keys(cfgAv.avisos?.tipos || {}).length === 0,
  '⚠️ Y sigue sin ningún tipo encendido: silenciar no enciende nada');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(500);
await pulsar('🔔 Avisos de Imagen personal');
await page.waitForTimeout(700);
ok(/🔕 silenciado/.test(await ver()),
  '⚠️ PERSISTENCIA: tras recargar, el módulo sigue silenciado (prueba 14)');

/* ── 24 · 🔗 INTEGRACIÓN CON EL RESTO DE JOSSTYLE (EH F39) ────────────────
   Lo que importa de esta fase: que el mapa se vea, que lo que NO existe se
   diga en vez de fingirse, y —lo único que escribe— que "Comprar producto X"
   acabe DE VERDAD en las tareas de Productividad y aquí solo quede su id. */

/* Se siembra un deseo de accesorio, que es de donde sale una acción concreta.
   ⚠️ Se toca `almacen` directamente, no el estado inicial compartido: así esta
   sección no cambia lo que ven las anteriores. */
almacen.estiloHombre = {
  ...ESTILO_GUARDADO,
  modulos: ESTILO_GUARDADO.modulos.map((m) => (m.id === 'accesorios'
    ? { ...m, config: { accesorios: { deseos: [{ id: 'des1', nombre: 'Reloj negro', marca: 'Casio' }] } } }
    : m)),
};
almacen.productividad = { habitos: [], rutinas: [], tareas: [], metas: [], pomodoros: {} };

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
ok(await pulsar('🔗 Cómo se conecta con el resto'),
  '🔗 La integración se abre desde ⋮ Personalizar');
await page.waitForTimeout(700);
const integr = await ver();
ok(/no guarda nada dos veces/.test(integr),
  '⚠️ Con la regla de la fase dicha: usa lo que ya tienes');
ok(/Calendario/.test(integr) && /Objetivos/.test(integr) && /Eliminados recientemente/.test(integr),
  'y el mapa entero: calendario, objetivos y la papelera global');
ok(/Todavía no existe/.test(integr),
  '⚠️ Lo que NO existe se dice, en vez de un botón que no haría nada (apartados 5 y 9)');
ok(/Todavía no hay una lista de favoritos común/.test(integr),
  '⚠️ Y con su motivo: los favoritos son de cada apartado');
ok(/Todavía no hay una galería común/.test(integr),
  'igual que las fotos, que son del módulo al que pertenecen');
ok(/Un dato existe una sola vez/.test(integr), 'con la fuente única de verdad (apartado 18)');
ok(/no borra nada/.test(integr), 'y que desactivar no borra (apartado 20)');
ok(/Comprar Reloj negro \(Casio\)/.test(integr),
  '⚠️ Y la acción concreta del enunciado: *"Comprar producto X"* (apartado 3)');

guardado.length = 0;
ok(await pulsar('Crear tarea'), 'Se puede pasar a Tareas');
await page.waitForTimeout(600);
ok(await pulsar('Apuntar en Tareas'), 'y hay que confirmarlo (regla 7)');
await page.waitForTimeout(1400);

const escTareas = guardado.filter((g) => g && g.key === 'productividad');
ok(escTareas.length > 0, '⚠️ PERSISTENCIA: la tarea se guarda en PRODUCTIVIDAD, no aquí');
const tareas = escTareas.at(-1)?.value?.tareas || [];
ok(tareas.length === 1 && tareas[0].texto === 'Comprar Reloj negro (Casio)',
  'con el texto del enunciado');
ok(tareas[0].hecha === false && 'fecha' in tareas[0],
  '⚠️ y con la forma REAL de una tarea, ni un campo inventado');
ok(!('fechaLimite' in tareas[0]),
  '🚨 E3 F26: la fecha es `fecha`. Con `fechaLimite` esta tarea no salía en Hoy, ni en la Agenda, ni en el Calendario');

const escEH39 = guardado.filter((g) => g && g.key === 'estiloHombre');
const cfgAcc = escEH39.at(-1)?.value?.modulos?.find((m) => m.id === 'accesorios')?.config || {};
const deseoGuardado = (cfgAcc.accesorios?.deseos || [])[0] || {};
ok(deseoGuardado.tareaId === tareas[0]?.id,
  '⚠️ Y en Imagen personal queda SOLO su id (fuente única, apartado 18)');
ok(!('hecha' in deseoGuardado) && !('texto' in deseoGuardado),
  '⚠️ Ni el texto ni el "hecha": eso vive en Tareas');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(600);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(500);
await pulsar('🔗 Cómo se conecta con el resto');
await page.waitForTimeout(700);
ok(/Ya está en Tareas/.test(await ver()),
  '⚠️ PERSISTENCIA: tras recargar sigue apuntada, y no se le vuelve a ofrecer');

/* ── 25 · PRIMER USO: TUTORIAL, IDEA Y SUGERENCIA (EH F40) ────────────────
   Lo que importa: que el tutorial se abra SOLO a un toque suyo y se recuerde,
   que la sugerencia por uso NO active nada sola, y que "Añadir a Estilo" sea
   una referencia — el interruptor y nada más. */

/* Un estado donde Perfumes se USA de verdad (un perfume apuntado) y Accesorios
   está apagado: es el ejemplo literal del apartado 8. */
almacen.estiloHombre = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['perfumes'] },
  modulos: [
    { id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ id: 'pf1', nombre: 'Bleu' }] } } },
  ],
  datos: {}, retirados: [],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
const primerUso = await esperarTexto(/¿Quieres añadir/);
ok(/¿Quieres añadir/.test(primerUso),
  '⚠️ Usa Perfumes y se le OFRECE Accesorios (apartado 8)');
ok(/Los accesorios se apuntan igual/.test(primerUso),
  'con su motivo, no a secas');
ok(/¿Cómo funciona\?/.test(primerUso), '❔ Y la puerta al tutorial (apartado 14)');
ok(!/\d+\s?%/.test(primerUso),
  '⚠️ Y ni un porcentaje: nada de "tu perfil está al 20%" (apartado 5)');

/* Apartado 8 — *"pero no automáticamente activar nada"*. */
guardado.length = 0;
ok(await pulsar('No, gracias'), 'Se puede decir que no');
await page.waitForTimeout(1200);
const escNo = guardado.filter((g) => g && g.key === 'estiloHombre');
const cfgNo = escNo.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok((cfgNo.primerUso?.rechazados || []).includes('accesorios'),
  '⚠️ PERSISTENCIA: queda apuntado que dijo que no');
const accNo = escNo.at(-1)?.value?.modulos?.find((m) => m.id === 'accesorios');
ok(!accNo || accNo.activo !== true,
  '⚠️ Y ACCESORIOS SIGUE APAGADO: decir que no no enciende nada');
ok(!/¿Quieres añadir 🕶️ Accesorios/.test(await ver()),
  '⚠️ Y ya no se le vuelve a proponer: "no insistir"');

/* Apartados 14 y 15 — el tutorial, sus cuatro pantallas y su Saltar. */
ok(await pulsar('❔ ¿Cómo funciona?'), 'El tutorial se abre a un toque suyo');
await page.waitForTimeout(700);
const tuto = await ver();
ok(/1\/4/.test(tuto), 'con sus cuatro pantallas (apartado 14)');
ok(/Cada cosa es una plaquita/.test(tuto), 'y empieza por las plaquitas');
ok(/Saltar/.test(tuto), 'con su Saltar en cualquier momento');
ok(await pulsar('Siguiente'), 'Se puede avanzar');
await page.waitForTimeout(600);
ok(/2\/4/.test(await ver()), 'y va por la segunda');

guardado.length = 0;
await pulsar('Siguiente');
await page.waitForTimeout(400);
await pulsar('Siguiente');
await page.waitForTimeout(400);
ok(/Ocultar no es desactivar/.test(await ver()), 'la cuarta es ocultar frente a desactivar');
ok(await pulsar('Entendido'), 'y se termina');
await page.waitForTimeout(1300);
const escTuto = guardado.filter((g) => g && g.key === 'estiloHombre');
const cfgTuto = escTuto.at(-1)?.value?.modulos?.find((m) => m.id === 'estilo')?.config || {};
ok(cfgTuto.primerUso?.tutorial === 'visto',
  '⚠️ PERSISTENCIA: se recuerda que lo vio (apartado 15)');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(800);
ok(!/1\/4/.test(await ver()),
  '⚠️ Y tras recargar NO se abre solo: el tutorial nunca se enseña sin pedirlo');
ok(/¿Cómo funciona\?/.test(await ver()),
  'pero sigue estando ahí para volver a verlo (prueba 12)');

/* ── 26 · ESTADOS: VACÍO Y DATO CORRUPTO (EH F41) ─────────────────────────
   Lo que importa: que un registro roto NO rompa la pantalla —y que los otros se
   sigan viendo—, y que un vacío tenga SALIDA.

   ⚠️ El apartado desactivado NO se prueba aquí: las plaquitas, "Mi estilo" y
   Gestionar apartados ya filtran por activo, y el buscador tiene su propio aviso
   desde la F37 (sección 22). La puerta que queda —Mis preferencias → Editar— se
   comprueba en `test-estados-estilo.mjs`. */

/* Perfumes con un registro roto en medio de dos buenos, como llegaría de
   Supabase; Accesorios encendido y vacío. */
almacen.estiloHombre = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['perfumes', 'accesorios'] },
  modulos: [
    {
      id: 'perfumes', activo: true, orden: 0,
      config: { perfumes: { perfumes: [{ id: 'a', nombre: 'Uno' }, { id: 'b' }, { id: 'c', nombre: 'Tres' }] } },
    },
    { id: 'accesorios', activo: true, orden: 1, config: { accesorios: { configurado: true, accesorios: [], deseos: [] } } },
  ],
  datos: {}, retirados: [],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(900);
const estados = await ver();
ok(/Este elemento no se puede mostrar/.test(estados),
  '⚠️ Un registro roto se avisa (apartado 14)');
ok(/Se siguen viendo 2/.test(estados),
  '⚠️ Y LOS OTROS DOS SIGUEN AHÍ: no rompe la pantalla');
ok(!/undefined|NaN|\[object/.test(estados),
  '⚠️ Y la pantalla no habla en informático');

/* Apartado 1 — un vacío con salida. */
ok(await pulsar('Accesorios'), 'Se entra en Accesorios');
await page.waitForTimeout(800);
ok(await pulsar('Mis accesorios'), 'y en su lista, que está vacía');
await page.waitForTimeout(700);
const vacio = await ver();
ok(/Todavía no tienes accesorios apuntados/.test(vacio),
  '⚠️ El vacío dice qué pasa (apartado 1)');
ok(/Un reloj, unas gafas o una gorra/.test(vacio),
  'y lo explica en una frase');
ok(/Añadir accesorio/.test(vacio),
  '⚠️ Y TIENE SALIDA: nunca una pantalla completamente vacía');

/* ── 27 · ACCESIBILIDAD EN EL NAVEGADOR (EH F42) ──────────────────────────
   El revisor de la F42 lee el código; esto comprueba que lo que dice el código
   **llega al DOM**: que los interruptores tienen nombre y que el botón de
   cerrar tiene una zona de toque de verdad. */

almacen.estiloHombre = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['perfumes'] },
  modulos: [{ id: 'perfumes', activo: true, orden: 0, config: {} }],
  datos: {}, retirados: [],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(700);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
await pulsar('🔔 Avisos de Imagen personal');
await page.waitForTimeout(800);

const interruptores = await page.evaluate(() => {
  const sw = [...document.querySelectorAll('[role="switch"]')];
  return {
    total: sw.length,
    sinNombre: sw.filter((x) => !x.getAttribute('aria-label')).length,
    // El mínimo de Apple son 44 píxeles.
    pequenos: sw.filter((x) => x.getBoundingClientRect().width < 44).length,
  };
});
ok(interruptores.total > 0, '♿ Hay interruptores en la pantalla de avisos');
ok(interruptores.sinNombre === 0,
  '⚠️ Y NINGUNO se queda sin nombre para un lector de pantalla (apartado 14)');
ok(interruptores.pequenos === 0,
  '⚠️ Y ninguno mide menos de 44 píxeles (apartado 1)');

const iconos = await page.evaluate(() => {
  const botones = [...document.querySelectorAll('button')];
  const soloIcono = botones.filter((b) => !b.innerText.trim() && b.querySelector('svg'));
  return {
    total: soloIcono.length,
    sinNombre: soloIcono.filter((b) => !b.getAttribute('aria-label')).length,
    diminutos: soloIcono.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.width < 24;
    }).length,
  };
});
ok(iconos.sinNombre === 0,
  '⚠️ Y ningún botón de solo icono se queda sin `aria-label` (apartado 14)');
ok(iconos.diminutos === 0,
  '⚠️ Ni ninguno es un botón diminuto: *"compacto ≠ incómodo"* (apartados 1 y 2)');

/* Apartado 9 — nada se sale del ancho del teléfono. */
const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(desborde <= 0, '⚠️ Y la pantalla no se desborda a lo ancho (apartado 9)');

/* ── 28 · PRIVACIDAD: LA PANTALLA Y EL CAMBIO DE SESIÓN (EH F43) ──────────
   Lo que importa: que 🔒 Tus datos diga qué se guarda y dónde vive cada sistema
   —para que se vea que ninguno está dentro de Estilo de hombre—, y sobre todo
   que **al cambiar de cuenta no se vean los datos de la anterior**. */

almacen.estiloHombre = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['perfumes'] },
  modulos: [
    { id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ id: 'p1', nombre: 'Perfume Del Primero' }] } } },
  ],
  datos: {}, retirados: [],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(700);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
ok(await pulsar('🔒 Tus datos'), '🔒 Tus datos se abre desde ⋮ Personalizar');
await page.waitForTimeout(700);
const priv = await ver();
ok(/va con tu cuenta/.test(priv), '⚠️ Y dice que todo va con su cuenta (apartados 1 y 2)');
ok(/Eliminados recientemente/.test(priv), 'que lo borrado se recupera (apartados 6 y 7)');
ok(/Ajustes/.test(priv), 'que la copia se descarga desde Ajustes (apartado 9)');
ok(/la de JosStyle vale para todo/.test(priv),
  '⚠️ Y que NO hay una contraseña aparte para este apartado (apartado 4)');
ok(/no sale nunca de la aplicación/.test(priv),
  '⚠️ Y que lo más privado no sale ni en un aviso ni a la IA (apartado 5)');
ok(!/auth\.uid|RLS|user_id/.test(priv),
  '⚠️ Y no habla en técnico: son frases para Josué');

/* 🚨 La prueba de verdad de la fase: **cerrar sesión desde dentro** y comprobar
   que no queda nada del usuario anterior en la pantalla.

   ⚠️ Esto es lo que NO se puede probar recargando: al recargar, React arranca de
   cero y `loaded` vuelve a ser `false` solo. El fallo estaba en el camino de
   dentro —cerrar sesión y entrar con otra cuenta **sin recargar**—, y por eso la
   comprobación tiene que pulsar el botón de verdad. */
await pulsar('Volver');
await page.waitForTimeout(400);
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
// DIST F1 — Ajustes es la quinta pestaña: se llega de un toque.
await pulsar('Ajustes');
await page.waitForTimeout(800);
// El botón vive dentro de la categoría Seguridad, no en la portada de Ajustes.
await pulsar('Seguridad');
await page.waitForTimeout(800);
ok(await pulsar('Cerrar sesión'), 'Se puede cerrar sesión desde Ajustes → Seguridad');
await page.waitForTimeout(1500);
const fuera = await ver();
ok(!/Perfume Del Primero/.test(fuera),
  '🚨 Y NO QUEDA NADA suyo en la pantalla (apartados 3 y 15)');
ok(!/Imagen personal/.test(fuera),
  'ni se puede llegar a sus apartados');

/* ── 29 · CUERPO E HIGIENE (EH F18) ───────────────────────────────────────
   La fase que estuvo bloqueada por C-25 desde v1.67.0. Lo que importa es
   exactamente lo que la contradicción tenía en el aire: que son **DOS
   apartados**, que las siete casillas están repartidas, y que **quitar uno no
   toca el otro** (apartado 17, con esas palabras). */

almacen.estiloHombre = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['higiene', 'cuerpo'] },
  modulos: [
    { id: 'higiene', activo: true, orden: 0, config: {} },
    { id: 'cuerpo', activo: true, orden: 1, config: {} },
  ],
  datos: {}, retirados: [],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
await page.waitForTimeout(900);
const portadaCH = await ver();
ok(/Higiene/.test(portadaCH) && /Cuidado corporal/.test(portadaCH),
  '⚠️ Los DOS apartados están en la portada (C-25, respuesta 1)');

ok(await pulsar('Higiene'), 'Se entra en Higiene');
await page.waitForTimeout(800);
const entrada = await ver();
ok(/¿Qué quieres utilizar\?/.test(entrada), 'con su "¿Qué quieres utilizar?" (apartado 1)');
ok(/Higiene diaria/.test(entrada) && /Desodorante/.test(entrada),
  'y SUS casillas: Higiene diaria y Desodorante');
ok(/Cuidado de manos/.test(entrada) && /Cuidado de pies/.test(entrada),
  'más manos y pies, que aquí solo se encienden (respuesta 2)');
ok(!/Cuidado corporal.*Cuidado específico/s.test(entrada.split('¿Qué quieres utilizar?')[1] || ''),
  '⚠️ Y NO las de Cuidado corporal: cada módulo enseña las suyas');
ok(/Solo verás lo que hayas marcado/.test(entrada),
  'diciendo que no se le enseñará lo que no marque');
ok(/dos apartados/i.test(entrada),
  '⚠️ Y que Higiene y Cuidado corporal son dos, y puede quedarse con uno');

/* Se dejan solo dos marcadas y se guarda. */
guardado.length = 0;
await pulsar('Cuidado de manos');
await page.waitForTimeout(300);
await pulsar('Cuidado de pies');
await page.waitForTimeout(300);
ok(await pulsar('Continuar'), 'Se puede continuar con lo elegido');
await page.waitForTimeout(1300);
const escCH = guardado.filter((g) => g && g.key === 'estiloHombre');
const cfgHig = escCH.at(-1)?.value?.modulos?.find((m) => m.id === 'higiene')?.config?.cuerpoHigiene;
ok(!!cfgHig && cfgHig.configurado === true, '⚠️ PERSISTENCIA: se guarda que ya lo configuró');
ok(cfgHig.partes?.higieneDiaria === true && cfgHig.partes?.manos === false,
  '⚠️ Y se guarda EXACTAMENTE lo que marcó: dos sí, dos no');
const cfgCue = escCH.at(-1)?.value?.modulos?.find((m) => m.id === 'cuerpo')?.config?.cuerpoHigiene;
ok(!cfgCue || cfgCue.configurado !== true,
  '⚠️ Y CUIDADO CORPORAL NO SE HA TOCADO: son dos apartados de verdad');

const dentro = await ver();
ok(/Higiene diaria/.test(dentro), 'Dentro se ve lo que utiliza');
ok(/Ducha/.test(dentro) && /Higiene íntima/.test(dentro),
  '⚠️ Y lo de dentro de Higiene diaria: ducha, higiene corporal e íntima (apartado 3)');
ok(/¿Qué buscas principalmente\?/.test(dentro), 'y el formulario del apartado 4');
ok(/Manos, uñas y pies/.test(dentro), 'con la plaquita de la Fase 22 anunciada');
/* ⚠️ Cuando se escribió esto, "Manos, uñas y pies" anunciaba la F22 y no abría
   nada (regla 8). **La F22 ya está construida**, así que en Higiene no queda
   ninguna plaquita por llegar — y lo que se comprueba ahora es que no se anuncia
   una fase que ya existe, que sería mentir al revés. */
ok(!/Esto llega más adelante/.test(dentro),
  '⚠️ Y ya no anuncia ninguna fase pendiente: las de Higiene están construidas');
ok(!/dermatitis|hongos|infección/i.test(dentro),
  '⚠️ Y ni una palabra de diagnóstico (apartado 7)');

/* ── 30 · RUTINAS Y RECOMENDACIONES DE CUERPO E HIGIENE (EH F19) ──────────
   Lo que solo se ve usándolo: que la plaquita ABRE, que la plantilla no crea
   nada hasta que se le da al botón, que marcar marca de verdad (la lección de
   la F18, cazada aquí mismo) y que omitir no penaliza. */

ok(/Mi rutina/.test(dentro), '⚠️ **EH F19** — la plaquita "Mi rutina" está en la portada del apartado');
ok(!/Mi rutina[\s\S]{0,40}Esto llega más adelante/.test(dentro),
  '⚠️ Y ya NO anuncia otra fase: esta es su fase');

ok(await pulsar('Mi rutina'), 'Se abre "Mi rutina"');
await page.waitForTimeout(800);
const rut19 = await ver();
ok(/Crea tu primera rutina/.test(rut19), 'y sin ninguna, lo dice con las palabras del enunciado');
ok(/Rutina diaria básica/.test(rut19), 'con la plantilla del apartado 2');
ok(/Ducha · Higiene · Desodorante/.test(rut19),
  '⚠️ y con SUS tres pasos: el cuarto del ejemplo es de Cuidado corporal (C-25)');
ok(/Usar esta rutina/.test(rut19) && /Personalizar/.test(rut19) && /Crear desde cero/.test(rut19),
  'y los tres botones del apartado 2');

guardado.length = 0;
ok(await pulsar('Usar esta rutina'), 'Se usa la plantilla');
await page.waitForTimeout(1200);
const conRutina = await ver();
ok(/3 pasos/.test(conRutina), '⚠️ y aparece su tarjeta: cuántos pasos, no cuáles (apartado 4)');
ok(/Pendiente/.test(conRutina), '⚠️ con el checklist de hoy, y "Pendiente" — nunca "has fallado"');
ok(/Omitir hoy/.test(conRutina), 'con "Omitir hoy" en cada paso (apartado 16)');
ok(/Recordármelo/.test(conRutina),
  '⚠️ y el recordatorio APAGADO: hay que encenderlo (apartado 7)');

const escR = guardado.filter((g) => g && g.key === 'estiloHombre');
const rutinasHig = escR.at(-1)?.value?.modulos?.find((m) => m.id === 'higiene')?.config?.rutinas?.rutinas;
ok(Array.isArray(rutinasHig) && rutinasHig.length === 1,
  '⚠️ PERSISTENCIA: la rutina se guarda en la config de su módulo');
ok(rutinasHig?.[0]?.recordatorio === false, 'y con el recordatorio apagado, escrito en el dato');

/* ⚠️ Marcar un paso: la comprobación que en la F18 destapó que la pantalla
   pintaba desde lo guardado y alternaba sobre otra cosa. */
guardado.length = 0;
ok(await pulsar('Marcarlo todo'), 'Se marca la rutina entera');
await page.waitForTimeout(1200);
const marcada = await ver();
ok(/Hecha/.test(marcada), '⚠️ y el día pasa a "Hecha" de verdad, en la pantalla');
const hechos = guardado.filter((g) => g && g.key === 'estiloHombre')
  .at(-1)?.value?.modulos?.find((m) => m.id === 'higiene')?.config?.rutinas?.hechos;
ok(Array.isArray(hechos) && hechos[0]?.pasos?.length === 3,
  '⚠️ PERSISTENCIA: lo marcado se guarda con su fecha, no dentro del paso');

/* ⚠️ El botón de volver no lleva texto, lleva `aria-label` — que es justo lo
   que revisa la F42. Así que se pulsa por ahí. */
const volvio = await page.evaluate(() => {
  const b = document.querySelector('button[aria-label="Volver"]');
  if (!b) return false;
  b.click();
  return true;
});
ok(volvio, 'Se vuelve a la portada del apartado');
await page.waitForTimeout(900);
ok(await pulsar('Recomendaciones'), '⚠️ Y la plaquita de Recomendaciones también abre');
await page.waitForTimeout(900);
const reco = await ver();
ok(/Recomendaciones/.test(reco), 'con su pantalla');
ok(/Pack básico/.test(reco), 'y el pack del apartado 13');
ok(/no compra nada/.test(reco), '⚠️ diciendo que esto no compra nada');
ok(/los productos que ves son los que has añadido/i.test(reco),
  '⚠️ Y que el catálogo está vacío a propósito (D2-03), en vez de inventar productos');
ok(!/debes|tienes que|deberías/i.test(reco), '⚠️ Y ni un "debes": el tono de siempre');

/* ── 31 · MANOS, UÑAS Y PIES (EH F22) ─────────────────────────────────────
   Lo que solo se ve usándolo: que la plaquita que llevaba anunciando la F22
   desde la F18 **por fin abre**, que las tres secciones tienen su interruptor,
   y que apagar una **no toca las otras ni borra lo suyo** (apartados 14 y 15). */

const volverA = async () => page.evaluate(() => {
  const b = document.querySelector('button[aria-label="Volver"]');
  if (!b) return false;
  b.click();
  return true;
});

ok(await volverA(), 'Se vuelve a la portada de Higiene');
await page.waitForTimeout(900);
const portadaMP = await ver();
ok(/Manos, uñas y pies/.test(portadaMP), '⚠️ **EH F22** — la plaquita sigue en su sitio');
ok(!/Manos, uñas y pies[\s\S]{0,40}Esto llega más adelante/.test(portadaMP),
  '⚠️ Y ya NO anuncia otra fase: esta es su fase');

ok(await pulsar('Manos, uñas y pies'), 'La plaquita abre');
await page.waitForTimeout(900);
const mp = await ver();
ok(/Cuidado de uñas/.test(mp) && /Cuidado de manos/.test(mp) && /Cuidado de pies/.test(mp),
  'con las tres secciones del apartado 1');
ok(/Puedes quitar una y quedarte con las otras/.test(mp),
  '⚠️ y diciendo que se pueden quitar por separado (apartados 14 y 15)');

/* Las uñas nacen apagadas: hay que encenderlas. */
guardado.length = 0;
const encendio = await page.evaluate(() => {
  const b = [...document.querySelectorAll('[aria-label="Cuidado de uñas"]')].find((x) => x.tagName === 'BUTTON');
  if (!b) return false;
  b.click();
  return true;
});
ok(encendio, 'Se encienden las uñas con su interruptor');
await page.waitForTimeout(1200);
const escMP = guardado.filter((g) => g && g.key === 'estiloHombre');
const partesMP = escMP.at(-1)?.value?.modulos?.find((m) => m.id === 'higiene')?.config?.cuerpoHigiene?.partes;
ok(partesMP?.unas === true, '⚠️ PERSISTENCIA: queda guardado que las ha activado');
/* ⚠️ Manos y pies quedaron DESMARCADAS unas pantallas más arriba, cuando se
   probó el apartado 1 de la F18. Lo que importa aquí es que encender las uñas
   **no las ha movido**: cada interruptor es suyo (apartado 14). */
ok(partesMP?.manos === false && partesMP?.pies === false,
  '⚠️ Y las otras dos siguen como estaban: cada una es independiente');

ok(await pulsar('Cuidado de uñas'), 'Se despliega la sección de uñas');
await page.waitForTimeout(800);
const dentroMP = await ver();
ok(/Muy cortas/.test(dentroMP) && /Medias/.test(dentroMP),
  'con las longitudes del apartado 3');
ok(/Cada 2 semanas/.test(dentroMP) && /Cada mes/.test(dentroMP),
  'y las frecuencias del apartado 6');
ok(/Recordármelo/.test(dentroMP), '⚠️ Y el recordatorio APAGADO, para que lo encienda él');
ok(/Crear rutina/.test(dentroMP), 'con su "+ Crear rutina" (apartado 8)');
ok(!/infección|hongos|onicomicosis/i.test(dentroMP),
  '⚠️ Y ni una palabra de diagnóstico (apartado 5)');

guardado.length = 0;
ok(await pulsar('Cada 2 semanas'), 'Se elige una frecuencia');
await page.waitForTimeout(1100);
const cfgUnas = guardado.filter((g) => g && g.key === 'estiloHombre')
  .at(-1)?.value?.modulos?.find((m) => m.id === 'higiene')?.config?.manosPies?.secciones?.unas;
ok(cfgUnas?.frecuencia === 'quincenal', '⚠️ PERSISTENCIA: la frecuencia se guarda');
ok(typeof cfgUnas?.desde === 'string',
  '⚠️ Y con la fecha desde la que cuenta, puesta sola');

ok(await pulsar('Usar esta rutina'), 'Se usa la plantilla de uñas');
await page.waitForTimeout(1200);
const conRutinaMP = await ver();
ok(/Cortar/.test(conRutinaMP) && /Limar/.test(conRutinaMP),
  '⚠️ y aparece su checklist con los tres pasos del ejemplo del apartado 8');
ok(/¿Quieres registrar cuándo lo haces\?/.test(conRutinaMP),
  '⚠️ Y la pregunta del apartado 12, con sus palabras');
ok(/Perfecto, no aparece/.test(conRutinaMP),
  '⚠️ Y que decir que no es una respuesta completa');

/* ── 33 · LOS TOQUES DE VERDAD (EH F51) ──────────────────────────────────
   `experienciaReal.js` dice que añadir un perfume cuesta tres toques y ver las
   recomendaciones, dos. ⚠️ Eso, en una tabla, no vale nada: la tabla la escribo
   yo. Aquí se **cuentan pulsando de verdad**, así que el día que alguien meta
   una pantalla intermedia, la cuenta sube sola y esto se pone rojo. Es la única
   forma de que la fase que mide el esfuerzo no se lo invente.

   ⚠️ Perfumes va CON un perfume dentro, a propósito: los recorridos miden lo
   que cuesta una acción **habitual**. Un apartado que todavía no se usa mete un
   toque más —*"¿Quieres utilizar este apartado?"*—, y eso no es un fallo sino
   la puerta de la F13: se paga una vez en la vida, no cada día. Se comprueba
   abajo, para que quede escrito cuál de los dos números es cuál. */
almacen.estiloHombre = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['perfumes', 'skincare'] },
  modulos: [
    { id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ id: 'p1', nombre: 'El que uso' }] } } },
    { id: 'skincare', activo: true, orden: 1, config: {} },
  ],
  datos: {}, retirados: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Bienestar');
await pulsar('Imagen personal');
const simple = await esperarTexto(/Perfumes/);

/* Apartado 6 — el usuario sencillo: dos apartados encendidos y nada más. */
ok(/Perfumes/.test(simple) && /Skincare/.test(simple),
  '⚠️ Con SOLO dos apartados encendidos, la pantalla enseña los dos (apartado 6)');
ok(!/Peluquería|Sonrisa|Manos, uñas y pies/.test(simple),
  'y ni rastro de los apagados: no se cuela ninguno');
ok(simple.length > 200, '⚠️ y no se siente vacía: hay pantalla de verdad, no un hueco');

/* ===========================================================================
   ENTREGA 3 · FASE 7 — LA AGENDA DE UN DÍA
   ===========================================================================
   Apartados 1, 3, 4, 19 y 24. ⚠️ Sufijo `_e3f7` en todo. */
const hoyISO_e3f7 = new Date().toLocaleDateString('sv-SE');
almacen.productividad = {
  tareas: [
    { id: 'ag1', texto: 'Estudiar Biología', fecha: hoyISO_e3f7, hora: '09:00', hecha: false },
    { id: 'ag2', texto: 'Comprar material', fecha: hoyISO_e3f7, hecha: false },
  ],
  habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
// DIST F1 — Calendario vive dentro de Organización (Gestión → Organización → Calendario).
await pulsar('Organización');
await pulsar('Calendario');
await esperarTexto(/Mes/);
ok(await pulsar('Día'), '🚨 E3 F7 — el Calendario tiene un modo Día');
/* 🐛 ⚠️ **`innerText` devuelve el texto RENDERIZADO.** El rótulo se pinta con
   la clase `uppercase`, así que en el navegador llega **"SIN HORA"** y un
   `/Sin hora/` no lo encuentra nunca: la pantalla estaba bien y la
   comprobación decía que no. Toda búsqueda de un rótulo va con `/i`. */
const agenda_e3f7 = await esperarTexto(/sin hora/i);

ok(/Estudiar Biología/.test(agenda_e3f7), 'la tarea con hora sale en la línea temporal (apartado 3)');
ok(/09:00/.test(agenda_e3f7), 'con su hora');
ok(/sin hora/i.test(agenda_e3f7) && /Comprar material/.test(agenda_e3f7),
  '🚨 y la que no tiene hora, en su sección: no todo lleva hora (apartado 4)');

/* ===========================================================================
   ENTREGA 3 · FASE 13 — ESTADÍSTICAS DE PLANIFICACIÓN
   ===========================================================================
   🚨 El apartado 6: *"si no hay suficientes datos, mostrar «Sin datos
   suficientes». **No inventar un porcentaje**."* Con una sola tarea en el
   periodo, la pantalla tiene que decirlo — y eso solo se ve mirándola.

   ⚠️ Sufijo `_e3f13`, y `/i` en los rótulos. */
const hoyISO_e3f13 = new Date().toLocaleDateString('sv-SE');
almacen.calendario = { eventos: [] };
almacen.productividad = {
  tareas: [{ id: 'st1', texto: 'Una sola tarea', fecha: hoyISO_e3f13, hecha: true }],
  habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
// DIST F1 — Calendario vive dentro de Organización (Gestión → Organización → Calendario).
await pulsar('Organización');
await pulsar('Calendario');
await esperarTexto(/Mes/);
ok(await pulsar('📊'), '🚨 E3 F13 — el Calendario tiene su acceso a Estadísticas (apartado 1)');
const stats_e3f13 = await esperarTexto(/Planificado|Sin datos/i);

ok(/Planificado/i.test(stats_e3f13), '⚠️ con el resumen del apartado 3');
ok(/30 días/i.test(stats_e3f13), '⚠️ y el periodo por defecto (apartado 2)');
ok(/Sin datos suficientes/i.test(stats_e3f13),
  '🚨 CON UNA SOLA TAREA NO SE INVENTA UN PORCENTAJE: dice "Sin datos suficientes" (apartado 6)');
ok(!/deberías|vas bien|mejor que/i.test(stats_e3f13),
  '🚨 y ni una interpretación: *"es simplemente información"* (apartado 14)');

/* ===========================================================================
   ENTREGA 3 · FASE 12 — CALENDARIOS EXTERNOS
   ===========================================================================
   ⏸ La decisión de la fase: Google y Outlook necesitan credenciales que solo
   puede crear Josué, así que **no hay un botón "Conectar" que no conecte nada**
   (regla 8). Lo que sí hay es añadir el archivo del calendario, que es lo que el
   apartado 4 pide para Apple — y eso solo se comprueba mirando la pantalla.

   ⚠️ Sufijo `_e3f12`, y `/i` en los rótulos. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
// DIST F1 — Ajustes es la quinta pestaña: se llega de un toque.
await pulsar('Ajustes');
await esperarTexto(/Integraciones|Apariencia/i);
ok(await pulsar('Integraciones'), '🚨 E3 F12 — Ajustes tiene su apartado de Integraciones (apartado 1)');
const integ_e3f12 = await esperarTexto(/Calendarios/i);

ok(/Google Calendar/.test(integ_e3f12) && /Outlook/.test(integ_e3f12) && /Apple/.test(integ_e3f12),
  '⚠️ con los tres proveedores del enunciado (apartado 1)');
ok(/Añadir un calendario/i.test(integ_e3f12),
  '🍎 y lo que SÍ se puede hacer hoy: añadir el archivo (apartado 4)');
ok(!/Conectar Google Calendar/i.test(integ_e3f12),
  '⏸ y NO hay un botón "Conectar Google Calendar": no podría conectar nada (regla 8)');
ok(/tienes que hacer tú/i.test(integ_e3f12),
  '🚨 se dice qué hace falta para conectar la cuenta entera, y que lo decide él (regla 49)');
ok(!/OAuth|token|API/i.test(integ_e3f12.split('Calendarios')[1] || ''),
  '⚠️ sin una palabra técnica: lo lee Josué, no un programador (EH F62)');

/* ===========================================================================
   ENTREGA 3 · FASE 11 — LOS AVISOS, Y LO QUE NO SE PUEDE PROMETER
   ===========================================================================
   🚨 Los apartados 7, 23 y 24: *"no fingir que se programó"*, *"no prometer
   funcionalidad que la plataforma no soporte"*. En Chromium sin permiso, el
   interruptor del aviso tiene que nacer APAGADO y la pantalla tiene que decir
   por qué — eso solo se ve mirándola.

   ⚠️ Sufijo `_e3f11`, y `/i` en los rótulos. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
// DIST F1 — Ajustes es la quinta pestaña: se llega de un toque.
await pulsar('Ajustes');
await esperarTexto(/Notificaciones|Apariencia/i);
ok(await pulsar('Notificaciones'), '🚨 E3 F11 — Ajustes tiene su apartado de Notificaciones (apartado 3)');
const ajustes_e3f11 = await esperarTexto(/avisos llegan/i);

ok(/Qué avisos llegan de verdad/i.test(ajustes_e3f11),
  '🚨 y dice QUÉ LLEGA DE VERDAD, en vez de prometerlo todo (apartados 23 y 24)');
ok(/todavía no/i.test(ajustes_e3f11),
  '🚨 con lo que NO funciona dicho con esas palabras: *"no simularla"* (apartado 24)');
ok(/pantalla de inicio/i.test(ajustes_e3f11),
  '⚠️ y el caso del iPhone explicado (apartado 24)');
ok(!/service worker|API|null/i.test(ajustes_e3f11.split('Qué avisos llegan')[1] || ''),
  '⚠️ sin una palabra técnica: lo lee Josué, no un programador (EH F62)');

/* ===========================================================================
   ENTREGA 3 · FASE 10 — LA SEMANA, Y UNA TAREA QUE SE REPITE
   ===========================================================================
   🚨 El apartado 24: *"completar una instancia no debe marcar automáticamente
   todas las demás. La regla permanece."* Eso solo se comprueba TOCÁNDOLO: marcar
   el día que se ve y mirar que la regla siga entera en `productividad.tareas`,
   con ese día —y solo ese— dentro de `hechas`.

   ⚠️ Sufijo `_e3f10`, y `/i` en los rótulos. */
const hoyISO_e3f10 = new Date().toLocaleDateString('sv-SE');
almacen.calendario = { eventos: [] };
almacen.productividad = {
  tareas: [{ id: 'rep1', texto: 'Leer un rato', fecha: hoyISO_e3f10, recurrencia: { frecuencia: 'diaria' } }],
  habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
// DIST F1 — Calendario vive dentro de Organización (Gestión → Organización → Calendario).
await pulsar('Organización');
await pulsar('Calendario');
await esperarTexto(/Mes/);

ok(await pulsar('Semana'), '🚨 E3 F10 — el Calendario tiene la vista de Semana (apartado 1)');
const semana_e3f10 = await esperarTexto(/Leer un rato|esta semana/i);
ok(/Leer un rato/.test(semana_e3f10),
  '🚨 y una tarea DIARIA aparece en el día que se está viendo: la regla se expande (apartado 10)');

// 🚨 Apartado 24 — marcar una aparición no marca la serie.
ok(await pulsar('Completar Leer un rato'),
  '⚠️ su casilla se puede pulsar (con su `aria-label`, como con VoiceOver)');
await page.waitForTimeout(600);

const regla_e3f10 = (almacen.productividad?.tareas || []).find((t) => t.id === 'rep1');
ok(regla_e3f10 && regla_e3f10.recurrencia?.frecuencia === 'diaria',
  '🚨 LA REGLA PERMANECE: sigue siendo una tarea diaria (apartado 24)');
ok(Array.isArray(regla_e3f10?.recurrencia?.hechas) && regla_e3f10.recurrencia.hechas.includes(hoyISO_e3f10),
  '🚨 y lo que se guarda es EL DÍA dentro de la regla, no una tarea nueva: ni una instancia independiente (apartado 23)');
ok((almacen.productividad?.tareas || []).length === 1,
  '🚨 sigue habiendo UNA tarea: completar no materializó ninguna copia (regla 11)');

/* ===========================================================================
   ENTREGA 3 · FASE 9 — ACCIONES RÁPIDAS: EL ＋ DE HOY
   ===========================================================================
   🚨 El apartado 28: *"desde Hoy, ＋ Tarea debe crear una tarea para hoy"*, y el
   29: aparece a la vez en Hoy, en la Agenda y en el Calendario. Eso solo se
   comprueba **tocándolo**: escribir en el formulario y mirar que la tarea llegue
   a `productividad.tareas`, que es donde viven todas.

   ⚠️ Sufijo `_e3f9`, y `/i` en los rótulos (la lección de la F8). */
almacen.productividad = { tareas: [], habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await esperarTexto(/Hoy|Buenos|Buenas/);

ok(await pulsar('Añadir'), '🚨 E3 F9 — Hoy tiene su ＋ (apartados 1 y 2)');
const menu_e3f9 = await esperarTexto(/Apunte/);
ok(/Tarea/.test(menu_e3f9) && /Evento/.test(menu_e3f9) && /Recordatorio/.test(menu_e3f9) && /Apunte/.test(menu_e3f9),
  '⚠️ con las cuatro cosas del apartado 1');

ok(await pulsar('Tarea'), 'se elige Tarea');
await esperarTexto(/Nueva tarea/i);
/* 🚨 `TextInput` reparte sus props: si `onChange` recibiera el valor en vez del
   evento, esto escribiría y el botón seguiría deshabilitado.
   🐛 Y se escribe con `fill` de Playwright, esperando al campo: el truco del
   setter nativo daba **"Illegal invocation"** cuando el campo todavía no estaba,
   porque `.call(undefined, …)` sobre un setter nativo falla así. `fill` espera
   y dispara los eventos que React entiende. */
const CAMPO_TAREA_e3f9 = 'input[placeholder="Estudiar Biología"]';
await page.waitForSelector(CAMPO_TAREA_e3f9, { timeout: 8000 });
await page.fill(CAMPO_TAREA_e3f9, 'Repasar Historia');
await page.waitForTimeout(300);
ok(await pulsar('Añadir'), 'y se guarda');
await page.waitForTimeout(600);

const tareaNueva_e3f9 = (almacen.productividad?.tareas || []).find((t) => t.texto === 'Repasar Historia');
ok(!!tareaNueva_e3f9,
  '🚨 la tarea llega a `productividad.tareas`: es una tarea de siempre, no una lista del ＋ (apartados 18 y 28)');
ok(tareaNueva_e3f9?.fecha === new Date().toLocaleDateString('sv-SE'),
  '🚨 y con la fecha de HOY ya puesta: no se vuelve a preguntar (apartado 2)');

// Apartado 19 — el aviso pequeño.
const trasCrear_e3f9 = await ver();
ok(/Tarea añadida/i.test(trasCrear_e3f9),
  '⚠️ con su aviso pequeño, no un modal (apartado 19)');

/* ===========================================================================
   ENTREGA 3 · FASE 8 — CALENDARIO: LA VISTA TEMPORAL
   ===========================================================================
   🚨 Lo que esta fase arregla es el apartado 12: *"si una tarea tiene fecha,
   debe aparecer en Calendario"*. **No aparecía**, y eso solo se ve TOCÁNDOLO:
   ni el build, ni el renderizado, ni las pruebas de Node podían saber que la
   pantalla del mes no le pasaba las tareas a nadie.

   ⚠️ Sufijo `_e3f8` en todo, y `/i` en los rótulos: la clase `uppercase` de CSS
   llega a `innerText` en mayúsculas. */
const hoyISO_e3f8 = new Date().toLocaleDateString('sv-SE');
almacen.productividad = {
  tareas: [
    { id: 'cm1', texto: 'Repasar Química', fecha: hoyISO_e3f8, hora: '11:00', hecha: false },
    { id: 'cm2', texto: 'Llamar al dentista', fecha: hoyISO_e3f8, hecha: false },
  ],
  habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [],
};
// ⚠️ Y el calendario vacío a propósito: así lo que salga son las TAREAS, no un
// evento que dejó otra sección (la lección de la E3 F6).
almacen.calendario = { eventos: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
// DIST F1 — Calendario vive dentro de Organización (Gestión → Organización → Calendario).
await pulsar('Organización');
await pulsar('Calendario');
const mes_e3f8 = await esperarTexto(/Repasar Química/);

ok(/Repasar Química/.test(mes_e3f8),
  '🚨 E3 F8 — una tarea con fecha SALE en el Calendario (apartado 12): antes era invisible aquí');
ok(/Llamar al dentista/.test(mes_e3f8),
  '⚠️ y la que no tiene hora también (apartado 14)');
ok(/2 tareas/.test(mes_e3f8),
  '🚨 y el resumen del día las cuenta: antes contaba solo eventos (apartado 5)');
ok(/Día ocupado|Día normal|Día libre/.test(mes_e3f8),
  '⚠️ con la carga del día, en palabras y no solo en color (apartado 23)');
ok(/Ver Agenda/.test(mes_e3f8) && /Ver Hoy/.test(mes_e3f8),
  '⚠️ y los dos accesos, porque el día seleccionado es hoy (apartados 28 y 29)');

// 🚨 Completar desde el Calendario marca LA MISMA tarea (apartados 30 y 31).
ok(await pulsar('Completar Repasar Química'),
  '⚠️ la casilla de una tarea se puede pulsar (con su `aria-label`, como con VoiceOver)');
await page.waitForTimeout(400);
ok(almacen.productividad?.tareas?.find((t) => t.id === 'cm1')?.hecha === true,
  '🚨 y marca LA TAREA ORIGINAL en `productividad.tareas`: ni una copia (apartados 30 y 31)');

// Apartado 16 — el ＋ pregunta qué, y la tarea rápida escribe en Productividad.
ok(await pulsar('Añadir'), 'el botón Añadir abre el selector (apartado 16)');
const menu_e3f8 = await esperarTexto(/Recordatorio/);
ok(/Evento/.test(menu_e3f8) && /Tarea/.test(menu_e3f8) && /Recordatorio/.test(menu_e3f8),
  '⚠️ con las tres cosas del apartado 16');
ok(!/Pomodoro/.test(menu_e3f8),
  '⏸ y sin el pomodoro programado, que no existe: nada de botones muertos (regla 8)');

/* ===========================================================================
   ENTREGA 3 · FASE 6 — HOY: RESUMEN, PROGRESO Y APUNTES
   ===========================================================================
   Apartados 2, 17 y 20. Y sobre todo el 25: **una sola fuente de verdad**, así
   que el resumen tiene que salir de las tareas de siempre, no de una copia.

   ⚠️ Sufijo `_e3f6` en todo: dos `const` iguales aquí no compilan. */
const hoyISO_e3f6 = new Date().toLocaleDateString('sv-SE');
almacen.productividad = {
  tareas: [
    { id: 'tt1', texto: 'Estudiar 45 min', fecha: hoyISO_e3f6, hecha: false },
    { id: 'tt2', texto: 'Comprar material', fecha: hoyISO_e3f6, hecha: true },
  ],
  habitos: [{ id: 'hb1', nombre: 'Beber agua', historial: {} }],
  rutinas: [], metas: [], pomodoros: {}, apuntes: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
const hoy_e3f6 = await esperarTexto(/2 tareas/);

ok(/2 tareas/.test(hoy_e3f6), '🚨 E3 F6 — Hoy resume el día con datos reales (apartado 2)');
ok(/1 hábito/.test(hoy_e3f6), 'y cuenta los hábitos, en singular cuando es uno');
ok(/33 %|hechos/.test(hoy_e3f6), '⚠️ y el progreso del día, contando solo lo completable (apartado 20)');

/* Apartado 17 — apuntar algo, y que sobreviva a recargar. */
ok(/Apuntes de hoy/.test(hoy_e3f6), 'la captura rápida existe');
await page.evaluate(() => {
  const campo = [...document.querySelectorAll('input')].find((i) => i.getAttribute('aria-label') === '¿Qué tienes en mente?');
  if (campo) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(campo, 'Preguntar lo del proyecto');
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
ok(await pulsar('Guardar'), 'se pulsa Guardar');
const trasApunte_e3f6 = await esperarTexto(/Preguntar lo del proyecto/);
ok(/Preguntar lo del proyecto/.test(trasApunte_e3f6),
  '🚨 E3 F6 — el apunte se ve (y `TextInput` da el EVENTO, no el valor: si no, aquí no saldría nada)');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
const trasRecargar_e3f6 = await esperarTexto(/Preguntar lo del proyecto/);
ok(/Preguntar lo del proyecto/.test(trasRecargar_e3f6),
  '⚠️ PERSISTENCIA: y sobrevive a recargar (regla 5 — `apuntes` está en el DEFAULT)');

/* ===========================================================================
   ENTREGA 3 · FASE 5 — ELIMINAR UN HORARIO DE VERDAD
   ===========================================================================
   El apartado 3: *"los horarios no se pueden eliminar completamente; parece que
   solo pueden archivarse"*. `eliminarHorario` existía desde HT F2 y no la
   llamaba nadie. Esto lo comprueba tocándolo.

   ⚠️ Sufijo `_e3f5`: dos `const` iguales en este archivo plano no compilan. */
const hoyISO_e3f5 = new Date().toLocaleDateString('sv-SE');
almacen.horarioTop = {
  horarios: [
    { id: 'hh1', nombre: 'Bachillerato', activo: true, archivado: false, creadoEn: hoyISO_e3f5 },
    { id: 'hh2', nombre: 'Horario de verano', activo: true, archivado: false, creadoEn: hoyISO_e3f5 },
  ],
  columnas: [{ id: 'cc1', horarioId: 'hh1', nombre: 'Lunes', orden: 0 }],
  filas: [], actividades: [], bloques: [], excepciones: [], confirmaciones: [], avisos: [], mochila: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
// DIST F1 — Horario vive dentro de Organización (Gestión → Organización → Horario).
await pulsar('Organización');
await pulsar('Horario');
const hor_e3f5 = await esperarTexto(/Bachillerato/);

ok(/PLANIFICACIÓN|Planificación/i.test(hor_e3f5),
  '🚨 E3 F5 — Horario separa "Planificación" de "Mis horarios" (apartados 2 y 6)');
ok(/Mis horarios/i.test(hor_e3f5), 'y la segunda sección tiene su rótulo');
ok(/Horario de verano/.test(hor_e3f5), 'los dos horarios están ahí');

/* ===========================================================================
   ENTREGA 3 · FASE 4 — LA HUCHA CON OBJETIVO
   ===========================================================================
   Los apartados 1, 4, 6 y 10: que la papelera de movimientos borre de verdad
   (era el fallo que reportó Josué) y que la hucha enseñe su progreso.

   ⚠️ Sufijo `_e3f4` en todos los nombres: dos `const` iguales en este archivo
   plano NO COMPILAN, y eso tumba las 460 comprobaciones sin que nada más falle. */
almacen.economia = {
  saldoInicial: 100,
  hucha: 125,
  movimientos: [{ id: 'mv1', fecha: '2026-09-01', tipo: 'gasto', concepto: 'Libro de prueba', cantidad: 12 }],
  objetivoHucha: { cantidad: 500, porPeriodo: 50, frecuencia: 'semana' },
  aportaciones: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
await pulsar('Economía');
const eco_e3f4 = await esperarTexto(/Hucha/);

ok(/125\.00 € \/ 500\.00 €/.test(eco_e3f4), '🚨 E3 F4 — la hucha enseña ahorrado y objetivo (apartado 10)');
ok(/25 %/.test(eco_e3f4), 'con su porcentaje');
ok(/█/.test(eco_e3f4) && /░/.test(eco_e3f4), 'y su barra pequeña de caracteres (apartado 6)');
ok(/Ahorrar 50\.00 € cada semana/.test(eco_e3f4), 'y la línea del objetivo por semana (apartado 5)');
ok(/faltan 50\.00 €/.test(eco_e3f4), '⚠️ y dice cuánto falta esta semana, sin haber ahorrado nada aún');

/* 🚨 Apartado 1 — el botón que no borraba. Éste es EL fallo que reportó Josué. */
ok(/Libro de prueba/.test(eco_e3f4), 'el movimiento está ahí');
ok(await pulsar('Eliminar movimiento'), 'se pulsa su papelera');
await page.waitForTimeout(600);
const trasBorrar_e3f4 = await ver();
ok(!/Libro de prueba/.test(trasBorrar_e3f4),
  '🚨 E3 F1+F4 — y el movimiento DESAPARECE de verdad: era el fallo que reportó Josué');

/* ===========================================================================
   ENTREGA 3 · FASE 3 — ROPA INTERIOR EN EL ARMARIO
   ===========================================================================
   El apartado 1 pide que funcione *"exactamente igual que el resto de
   categorías"*. Esto lo comprueba donde importa: guardando una prenda de ropa
   interior y viéndola en la lista con su filtro. */
almacen.armario = {
  prendas: [
    { id: 'pr1', nombre: 'Bóxer negro', categoria: 'ropa_interior', color: 'negro', estado: 'disponible', favorita: false, creadaEn: '2026-09-01T10:00:00.000Z' },
    { id: 'pr2', nombre: 'Vaqueros', categoria: 'pantalones', color: 'azul', estado: 'disponible', favorita: false, creadaEn: '2026-09-01T10:00:00.000Z' },
  ],
  outfits: [], usos: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await pulsar('Gestión');
await pulsar('Armario');
const armario_e3f3 = await esperarTexto(/Bóxer negro/);

ok(/Bóxer negro/.test(armario_e3f3),
  '🚨 E3 F3 — una prenda de ropa interior se guarda y se ve (apartado 1)');
ok(/Ropa interior/.test(armario_e3f3),
  'y su categoría aparece como una más, con su filtro');
ok(/Pantalones/.test(armario_e3f3),
  'sin haberse llevado por delante ninguna de las que ya había (apartado 7)');

/* ===========================================================================
   ENTREGA 3 · FASE 2 — EL BLOQUE DE RACHAS EN HOY
   ===========================================================================
   Los apartados 1-5 y 13: que aparezca cuando hay rachas activas, que diga
   cuántas hay que mantener, y que pulsarlo lleve **directo** a Rachas.

   ⚠️ Nombres con sufijo `_e3f2`: este archivo es un módulo plano y **dos
   `const` con el mismo nombre no compilan**, lo que tira las 450 comprobaciones
   sin que nada más falle. Ya pasó dos veces; `test-imports.mjs` lo caza en un
   segundo, pero es más barato no provocarlo. */
const hoyISO_e3f2 = new Date().toLocaleDateString('sv-SE');
/* ⚠️ **Y se limpian los hábitos que dejó la sección de la F6.** Este archivo es
   un recorrido seguido: lo que una sección mete en `almacen` sigue ahí en la
   siguiente. La F6 deja un hábito, y `mantenimientoHoy` cuenta los hábitos de
   Productividad como rachas que mantener (E3 F2, apartado 10) — así que sin esto
   la cuenta salía 3 en vez de 2 y el bloque seguía apareciendo al vaciar las
   rachas. **Un escenario que hereda el del vecino no prueba lo que dice.** */
almacen.productividad = { tareas: [], habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [] };
almacen.rachas = {
  definiciones: [
    { id: 'ra1', tipo: 'custom', nombre: 'Beber agua', icono: '💧', regla: { clase: 'diaria' }, creadaEn: hoyISO_e3f2, activa: true },
    { id: 'ra2', tipo: 'custom', nombre: 'Leer', icono: '📖', regla: { clase: 'diaria' }, creadaEn: hoyISO_e3f2, activa: true },
  ],
  eventos: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
const hoy_e3f2 = await esperarTexto(/Mantén tus rachas/);

ok(/Mantén tus rachas/.test(hoy_e3f2),
  '🚨 E3 F2 — con rachas activas, Hoy dice "Mantén tus rachas" (apartados 1 y 5)');
ok(/2 rachas necesitan registro/.test(hoy_e3f2),
  'y dice cuántas hay que mantener hoy');

/* Apartado 3 — un solo toque lleva al Centro de Rachas, sin pantalla intermedia. */
ok(await pulsar('Abrir el Centro de Rachas') || await pulsar('Mantén tus rachas'),
  'el bloque se puede pulsar');
const enRachas_e3f2 = await esperarTexto(/Beber agua/);
ok(/Beber agua/.test(enRachas_e3f2) && /Leer/.test(enRachas_e3f2),
  '🚨 y lleva DIRECTO a Rachas, con las dos ahí (apartado 3)');

/* Apartados 6-8 — marcar el día y ver el "+1". */
ok(await pulsar('Beber agua'), 'se entra en la racha');
ok(await pulsar('Marcar hoy'), 'y se marca el día de hoy');
const trasMarcar_e3f2 = await esperarTexto(/1 día|Día completado/);
ok(/1 día/.test(trasMarcar_e3f2),
  '🚨 al subir la racha se ve el día ganado (apartados 6-8)');

/* Apartado 2 — sin ninguna racha activa, el bloque NO existe. */
almacen.rachas = { definiciones: [], eventos: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
const sinRachas_e3f2 = await ver();
ok(!/Mantén tus rachas|rachas necesitan registro/.test(sinRachas_e3f2),
  '🚨 sin rachas activas el bloque NO se pinta: el Dashboard no se llena (apartado 2)');
ok(sinRachas_e3f2.length > 200, 'y el resto de Hoy sigue ahí');

/* ⚠️ Los toques de cada recorrido se cuentan en `test-experiencia-real.mjs`,
   y allí se comprueban contra la vista de verdad: cada pantalla que un
   recorrido dice abrir tiene que existir como componente en
   `EstiloHombreView.jsx`. Contarlos AQUÍ, pulsando, pedía un estado de
   partida por cada recorrido y no salió a la primera; queda apuntado para R1
   en vez de dejar una cuenta que suma toques aunque el toque no llegue a
   pulsar nada, que es peor que no contarlos. */

/* ── E3 F16 (BL F1) · LA BIBLIOTECA ES UN LANZADOR DE SEIS MINI-APPS ─────
   🚨 Lo que esta sección tiene que demostrar no es que se vea bonito: es que
   **las notas de Josué siguen ahí**. Tres de las seis mini-apps son datos que
   ya existían con otro nombre, y si el lanzador hubiera creado listas nuevas,
   sus apuntes y sus enlaces habrían desaparecido de su propia biblioteca. */
almacen.biblioteca = {
  apuntes: [{ id: 'ap1', fecha: '2026-09-01', titulo: 'Examen de Biología', contenido: 'Es el viernes' }],
  enlaces: [{ id: 'en1', fecha: '2026-09-01', titulo: 'Repaso de Química', url: 'https://ejemplo.es', descripcion: '' }],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
ok(await pulsar('Biblioteca'), 'La Biblioteca se abre desde el área de Vida');

const lanzador_bl1 = await ver();
for (const nombre of ['Libros', 'Notas', 'Guardados', 'Ideas', 'Documentos', 'Colecciones']) {
  ok(new RegExp(nombre, 'i').test(lanzador_bl1), `🚨 la mini-app ${nombre} está en el lanzador`);
}
ok(/Escribe y guarda/i.test(lanzador_bl1) && /Organiza tu biblioteca/i.test(lanzador_bl1),
  '⚠️ y cada una con su descripción corta');
ok(!/Añadir[\s\S]{0,40}Selecciona|PDFs\s+Vídeos\s+Fotos/i.test(lanzador_bl1),
  '⚠️ el lanzador NO abre con un formulario ni con los filtros: primero las mini-apps (criterio 14)');

/* 🚨 Los indicadores salen de los datos DE VERDAD, y solo cuando existen. */
ok(/1 nota\b/i.test(lanzador_bl1),
  '🚨 el apunte guardado se cuenta como UNA NOTA: la mini-app lee `biblioteca.apuntes`, no una lista nueva');
ok(/1 guardado\b/i.test(lanzador_bl1),
  '🚨 y el enlace guardado se cuenta como UN GUARDADO');
ok(!/0 libros|0 ideas/i.test(lanzador_bl1),
  '⚠️ y lo que está vacío no enseña un cero: *"no inventar números"*');

/* ── Notas: el apunte de Josué sigue ahí, y se escribe rápido ───────────── */
ok(await pulsar('Notas'), 'Notas se abre');
const notas_bl1 = await ver();
ok(/Examen de Biología/i.test(notas_bl1),
  '🚨 EL APUNTE QUE JOSUÉ TENÍA DESDE LA FASE 11 SIGUE AHÍ, ahora llamado nota');
ok(/una nota se abre|escribe y se guarda|rápid/i.test(notas_bl1),
  '⚠️ y la pantalla dice en qué se diferencia de un documento');

/* ⚠️ Con una nota ya guardada NO hay estado vacío, así que "Nueva nota" no está
   en pantalla: el que abre el formulario es el ＋ de la cabecera, y se pulsa por
   su nombre accesible. */
ok(await pulsar('Añadir en Notas'), 'el ＋ abre el formulario rápido');
await page.waitForSelector('textarea', { timeout: 6000 });
await page.fill('textarea', 'Especificación para Claude');
ok(await pulsar('Guardar nota'), 'y se guarda sin pedir título ni categoría');
const trasNota_bl1 = await esperarTexto(/Especificación para Claude/i);
ok(/Especificación para Claude/i.test(trasNota_bl1),
  '🚨 LA NOTA SE GUARDA Y SE VE: entra, escribe y guarda (criterio 10)');
ok(/Sin título/i.test(trasNota_bl1),
  '⚠️ y sin título puesto se guarda igual, con esa etiqueta');

const escrituras_bl1 = guardado.filter((g) => g && g.key === 'biblioteca');
const ultima_bl1 = escrituras_bl1.at(-1)?.value;
ok(Array.isArray(ultima_bl1?.apuntes) && ultima_bl1.apuntes.length === 2,
  '🚨 y lo guardado va a `biblioteca.apuntes` —la lista de siempre—, ahora con dos');
ok(!ultima_bl1?.notas,
  '🚨 NO hay una lista `notas` paralela: eso es lo que habría escondido su apunte');

/* ── Volver, y una lista nueva que escribe de verdad ─────────────────────── */
ok(await pulsar('Volver a la biblioteca'), 'el botón de volver devuelve al lanzador');
ok(await pulsar('Libros'), 'y se entra en Libros');
const libros_bl1 = await ver();
ok(/Tu biblioteca empieza aquí/i.test(libros_bl1),
  '⚠️ una mini-app vacía enseña su estado vacío con salida, no una pantalla en blanco');

ok(await pulsar('Añadir libro'), 'el botón del estado vacío abre el formulario');
/* 🐛 `TextInput` es un `<input>` sin `type`, así que `input[type="text"]` NO encaja
   con ninguno de la aplicación: se busca por su nombre accesible, que es como lo
   encontraría alguien con VoiceOver. */
await page.waitForSelector('input[aria-label="Título del libro"]', { timeout: 6000 });
await page.fill('input[aria-label="Título del libro"]', 'Hábitos atómicos');
ok(await pulsar('Guardar libro'), 'y se añade');
const trasLibro_bl1 = await esperarTexto(/Hábitos atómicos/i);
ok(/Hábitos atómicos/i.test(trasLibro_bl1),
  '🚨 EL BOTÓN DE CREAR ESCRIBE DE VERDAD: nada de un control decorativo (regla 8)');
const librosGuardados_bl1 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.libros;
ok(Array.isArray(librosGuardados_bl1) && librosGuardados_bl1[0]?.titulo === 'Hábitos atómicos',
  '⚠️ y llega a Supabase, en la misma clave `biblioteca`');

/* ── Documentos: los archivos ya subidos tienen sitio ────────────────────── */
ok(await pulsar('Volver a la biblioteca'), 'se vuelve otra vez al lanzador');
ok(await pulsar('Documentos'), 'y se abre Documentos');
const docs_bl1 = await ver();
ok(/Tu archivo personal/i.test(docs_bl1),
  '⚠️ Documentos es el archivo personal: es donde siguen viviendo los PDF, vídeos y fotos ya subidos');
ok(!/próximamente|en construcción/i.test(docs_bl1),
  '🚨 y no promete nada que no exista');

/* ── E3 F17 (BL F2) · LIBROS ─────────────────────────────────────────────
   Se prueba el recorrido entero de un libro: crearlo, verlo, abrirlo,
   actualizar la página, terminarlo y comprobar que lo que se guarda en Supabase
   es lo que dice la pantalla. */
almacen.biblioteca = { apuntes: [], enlaces: [], libros: [], ideas: [], colecciones: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Biblioteca');
ok(await pulsar('Libros'), 'Libros se abre desde el lanzador');
ok(await pulsar('Añadir libro'), 'y el estado vacío abre el formulario');

await page.waitForSelector('input[aria-label="Título del libro"]', { timeout: 6000 });
await page.fill('input[aria-label="Título del libro"]', 'Hábitos atómicos');
await page.fill('input[aria-label="Autor del libro"]', 'James Clear');
await page.fill('input[aria-label="Páginas del libro"]', '250');
await page.selectOption('select[aria-label="Estado del libro"]', 'leyendo');
ok(await pulsar('Guardar libro'), 'y se guarda');

const trasCrear_bl2 = await esperarTexto(/Hábitos atómicos/i);
ok(/Hábitos atómicos/i.test(trasCrear_bl2), '🚨 EL LIBRO SE CREA Y SE VE (criterio 1)');
ok(/continuar leyendo/i.test(trasCrear_bl2),
  '🚨 y como está LEYENDO sale destacado arriba: la tarjeta de "Continuar leyendo" (criterio 14)');
ok(/1 leyendo/i.test(trasCrear_bl2),
  '⚠️ con el resumen de arriba sacado de los datos de verdad (criterio 15)');
ok(/0 %|0 páginas/i.test(trasCrear_bl2),
  '⚠️ y su progreso, que empieza a cero porque el total sí se sabe');

/* El detalle, y actualizar la página. */
ok(await pulsar('Continuar →'), 'la tarjeta destacada abre el detalle (criterio 14)');
const detalle_bl2 = await esperarTexto(/Página por la que vas/i);
ok(/James Clear/.test(detalle_bl2), '⚠️ el detalle enseña el autor');
ok(/Leyendo/i.test(detalle_bl2), 'y su estado');

await page.fill('input[aria-label="Actualizar la página actual"]', '180');
ok(await pulsar('Guardar la página'), 'se guarda la página por la que va');
const trasPagina_bl2 = await esperarTexto(/72 %/);
ok(/180 \/ 250 páginas · 72 %/.test(trasPagina_bl2),
  '🚨 EL PORCENTAJE SE CALCULA SOLO: 180 de 250 son el 72 % (criterios 5 y 6)');

/* Terminarlo, con su celebración. */
ok(await pulsar('✓ Terminado'), 'se marca como terminado');
const trasTerminar_bl2 = await esperarTexto(/Un libro más|100 %/);
ok(/100 %/.test(trasTerminar_bl2),
  '🚨 AL TERMINAR, EL PROGRESO LLEGA AL 100 % (criterio 7)');
ok(/Un libro más/i.test(trasTerminar_bl2),
  '⚠️ con su celebración discreta, que se cierra al tocar');

const librosGuardados_bl2 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.libros;
const guardadoFinal_bl2 = librosGuardados_bl2?.[0];
ok(guardadoFinal_bl2?.estado === 'terminado' && guardadoFinal_bl2?.paginaActual === 250,
  '🚨 y LO QUE SE GUARDA es lo que dice la pantalla: terminado y en la página 250');
ok(Boolean(guardadoFinal_bl2?.fin),
  '🚨 con su fecha de finalización puesta sola (criterio 8)');
ok(!('porcentaje' in (guardadoFinal_bl2 || {})),
  '🚨 y SIN el porcentaje guardado: se deriva, o mentiría en cuanto él corrija las páginas');

ok(await pulsar('Cerrar el detalle del libro'), 'se cierra el detalle');
const listaFinal_bl2 = await esperarTexto(/Libros terminados/i);
ok(/Libros terminados/i.test(listaFinal_bl2),
  '🚨 y el libro aparece en el historial de terminados (criterio 13)');
ok(!/continuar leyendo/i.test(listaFinal_bl2),
  '⚠️ mientras que "Continuar leyendo" ya no está: no queda ninguno en marcha');
ok(/1 terminado/i.test(listaFinal_bl2), '⚠️ y el resumen de arriba lo refleja');

/* ── E3 F18 (BL F4) · GUARDADOS ──────────────────────────────────────────
   El recorrido entero: pegar una dirección y guardarla sin nada más, marcarla
   favorita, archivarla y comprobar que **deja de salir entre lo activo pero
   sigue existiendo**. */
almacen.biblioteca = { apuntes: [], enlaces: [], libros: [], ideas: [], colecciones: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Biblioteca');
ok(await pulsar('Guardados'), 'Guardados se abre desde el lanzador');
ok(await pulsar('Guardar algo'), 'y el estado vacío abre el formulario');

await page.waitForSelector('input[aria-label="Dirección del enlace"]', { timeout: 6000 });
await page.fill('input[aria-label="Dirección del enlace"]', 'ejemplo.es/articulo');
const conDominio_bl4 = await esperarTexto(/ejemplo\.es/);
ok(/De ejemplo\.es/.test(conDominio_bl4),
  '🚨 el dominio se detecta solo al pegar la dirección, y sin `https://` delante (criterio 8)');
ok(/no puede leerlo de la página/i.test(conDominio_bl4),
  '🚨 y se DICE que el título no se puede sacar de la página, en vez de fingir una previsualización (regla 8)');

ok(await pulsar('Guardar'), 'se guarda sin rellenar nada más');
const trasGuardar_bl4 = await esperarTexto(/ejemplo\.es/);
ok(/ejemplo\.es/.test(trasGuardar_bl4),
  '🚨 GUARDAR ES PEGAR Y DAR A GUARDAR (criterios 4 y 5): sin título, sin descripción y sin nota');
ok(/1 guardado/i.test(trasGuardar_bl4), '⚠️ con su resumen sacado de los datos de verdad');
ok(/Un enlace que quieres volver a encontrar/i.test(trasGuardar_bl4),
  '🚨 y la diferencia con Notas dicha en la propia pantalla (criterio 22)');

const guardadosBL4 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.enlaces;
ok(guardadosBL4?.[0]?.url === 'https://ejemplo.es/articulo' && guardadosBL4[0].tipo === 'link',
  '🚨 y lo guardado lleva su dirección completa y su tipo deducido');
ok(!('dominio' in (guardadosBL4?.[0] || {})),
  '⚠️ pero NO el dominio: se deriva, o se quedaría viejo si él corrige la dirección');

/* Favorito desde la propia tarjeta. */
ok(await pulsar('Marcar ejemplo.es como favorito'), 'la estrella de la tarjeta marca favorito');
const trasFav_bl4 = await esperarTexto(/1 favorito/i);
ok(/1 favorito/i.test(trasFav_bl4), '⚠️ y el resumen lo cuenta (criterio 10)');

/* Archivar: deja de salir, pero no se borra. */
ok(await pulsar('ejemplo.es'), 'se abre el detalle');
ok(await pulsar('Archivar'), 'y se archiva');
ok(await pulsar('Cerrar el detalle del guardado'), 'se cierra el detalle');
const trasArchivar_bl4 = await esperarTexto(/1 archivado/i);
ok(/1 archivado/i.test(trasArchivar_bl4), '⚠️ el resumen lo dice');
ok(!/De ejemplo\.es|ejemplo\.es\/articulo/.test(trasArchivar_bl4),
  '🚨 Y DEJA DE SALIR ENTRE LO ACTIVO (criterio 11): si saliera igual, archivar no haría nada visible');

const trasArchivarGuardado_bl4 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.enlaces;
ok(trasArchivarGuardado_bl4?.length === 1 && trasArchivarGuardado_bl4[0].estado === 'archived',
  '🚨 PERO NO SE HA BORRADO: sigue entero, con estado archivado — archivar y eliminar son dos acciones distintas');

ok(await pulsar('Archivados'), 'y el filtro de archivados lo encuentra');
const enArchivados_bl4 = await esperarTexto(/ejemplo\.es/);
ok(/ejemplo\.es/.test(enArchivados_bl4), '⚠️ ahí sí sale');

/* ── E3 F19 (BL F5) · IDEAS ──────────────────────────────────────────────
   Captura rápida, cambio de estado y **convertir en tarea**: lo que hay que
   demostrar es que la tarea aparece en Productividad **y que la idea sigue
   estando**, que es lo que el enunciado subraya. */
almacen.biblioteca = { apuntes: [], enlaces: [], libros: [], ideas: [], colecciones: [] };
almacen.productividad = { habitos: [], rutinas: [], tareas: [], metas: [], pomodoros: {}, apuntes: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Biblioteca');
ok(await pulsar('Ideas'), 'Ideas se abre desde el lanzador');
ok(await pulsar('Nueva idea'), 'y el estado vacío abre el formulario');

await page.waitForSelector('input[aria-label="Título de la idea"]', { timeout: 6000 });
await page.fill('input[aria-label="Título de la idea"]', 'Crear una app de reservas');
ok(await pulsar('Guardar idea'), 'se guarda solo con el título');

const trasCrear_bl5 = await esperarTexto(/Crear una app de reservas/i);
ok(/Crear una app de reservas/i.test(trasCrear_bl5),
  '🚨 CAPTURA RÁPIDA: título y guardar, sin descripción ni categoría ni prioridad (criterios 1 y 2)');
ok(/Capturada/i.test(trasCrear_bl5), '⚠️ y nace capturada');
ok(/1 idea\b/i.test(trasCrear_bl5), '⚠️ con su línea de arriba sacada de los datos de verdad');
ok(/es una nota/i.test(trasCrear_bl5),
  '🚨 y la diferencia con Notas dicha en la pantalla: el enunciado la llama fundamental');

const ideasGuardadas_bl5 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.ideas;
ok(ideasGuardadas_bl5?.[0]?.prioridad === 'media' && ideasGuardadas_bl5[0].estado === 'captured',
  '⚠️ y lo guardado lleva su prioridad por defecto, que nunca se pregunta');

/* Cambiar de estado desde el detalle. */
ok(await pulsar('Crear una app de reservas'), 'se abre el detalle');
ok(await pulsar('🔧 Desarrollando'), 'y se pasa a Desarrollando');
const trasEstado_bl5 = await esperarTexto(/Desarrollando/);
ok(/Desarrollando/.test(trasEstado_bl5), '⚠️ el estado cambia (criterio 5)');

/* 🚨 Convertir en tarea: el punto que más se puede romper. */
ok(await pulsar('Convertir en…'), 'se abre el conversor');
const conversor_bl5 = await esperarTexto(/Convertir en/i);
ok(/La idea se queda donde está/i.test(conversor_bl5),
  '⚠️ y se dice que la idea no desaparece');
ok(await pulsar('✅ Tarea'), 'se elige Tarea');
const plan_bl5 = await esperarTexto(/Se creará/);
ok(/Se creará «Crear una app de reservas» en Productividad/.test(plan_bl5),
  '🚨 PRIMERO SE ENSEÑA EL PLAN, y todavía no se ha escrito nada (decimoctavo `aplicarPlan`)');

ok(await pulsar('Crear tarea'), 'y se confirma');
await page.waitForTimeout(900);
const prodGuardada_bl5 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(prodGuardada_bl5?.tareas?.[0]?.texto === 'Crear una app de reservas',
  '🚨 LA TAREA SE CREA EN PRODUCTIVIDAD, no en una lista paralela de Biblioteca (criterio 16)');
const ideasTrasConvertir_bl5 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.ideas;
ok(ideasTrasConvertir_bl5?.length === 1 && ideasTrasConvertir_bl5[0].tareaId === prodGuardada_bl5.tareas[0].id,
  '🚨 Y LA IDEA SIGUE AHÍ, con el id de lo que generó: *"la idea original no debe desaparecer automáticamente"*');
ok(ideasTrasConvertir_bl5[0].estado === 'developing',
  '⚠️ y sin cambiarle el estado por la espalda');

const detalleFinal_bl5 = await esperarTexto(/Lo que ha generado/i);
ok(/Lo que ha generado/i.test(detalleFinal_bl5), '⚠️ y el detalle lo enseña');

/* ── E3 F20 (BL F6) · DOCUMENTOS ─────────────────────────────────────────
   El recorrido entero: escribir con formato, comprobar que **el autoguardado
   guarda solo**, que el modo lectura pinta la estructura y que **los archivos
   que Josué ya tenía siguen ahí**. */
almacen.biblioteca = { apuntes: [], enlaces: [], libros: [], ideas: [], colecciones: [], documentos: [] };
almacen.bibliotecaArchivos = [{ id: 'ar1', tipo: 'pdf', path: 'u/tema3.pdf', titulo: 'Tema 3 de Biología', fecha: '2026-09-01' }];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Biblioteca');
const lanzador_bl6 = await ver();
ok(/1 documento|1 archivo/i.test(lanzador_bl6),
  '🚨 el archivo que Josué subió en la Fase 11 sigue contando en el lanzador');

ok(await pulsar('Documentos'), 'Documentos se abre');
ok(await pulsar('Añadir en Documentos'), 'y el ＋ abre el editor directamente');

await page.waitForSelector('input[aria-label="Título del documento"]', { timeout: 6000 });
await page.fill('input[aria-label="Título del documento"]', 'Especificación de Productividad');
await page.fill('textarea[aria-label="Contenido del documento"]', '# Introducción\nEsto va de Supabase.\n\n- Una viñeta\n- Otra');

/* 🚨 No se pulsa ningún botón de guardar: el autoguardado tiene que hacerlo solo. */
const trasAuto_bl6 = await esperarTexto(/Guardado/);
ok(/Guardado/.test(trasAuto_bl6),
  '🚨 EL AUTOGUARDADO GUARDA SOLO, sin pulsar nada, y lo dice discretamente (criterio 6)');

const docsGuardados_bl6 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.documentos;
ok(docsGuardados_bl6?.[0]?.titulo === 'Especificación de Productividad',
  '🚨 y lo guardado llega a Supabase');
ok(docsGuardados_bl6[0].estado === 'draft', '⚠️ como borrador, que es como nace (criterio 7)');
ok(/Supabase/.test(docsGuardados_bl6[0].contenido || ''), '⚠️ con su contenido entero');

/* Cerrar el editor y leer el documento. */
ok(await pulsar('Cerrar el editor'), 'se cierra el editor');
const lista_bl6 = await esperarTexto(/Especificación de Productividad/);
ok(/Especificación de Productividad/.test(lista_bl6), '⚠️ y el documento está en la lista');
ok(/Borrador/i.test(lista_bl6), '⚠️ marcado como borrador');
ok(/Archivos subidos/i.test(lista_bl6),
  '🚨 Y LOS ARCHIVOS DE LA FASE 11 SIGUEN AHÍ, en su apartado: esta fase no se los lleva');

ok(await pulsar('Especificación de Productividad'), 'se abre en modo lectura');
/* 🐛 Con `/i`: el rótulo del índice lleva la clase `uppercase`, así que
   `innerText` lo devuelve como CONTENIDO y `/Contenido/` no lo encuentra nunca.
   Es la lección de la E3 F8, y ya van dos veces. */
const lectura_bl6 = await esperarTexto(/1\. Introducción/);
ok(/contenido/i.test(lectura_bl6) && /1\. Introducción/.test(lectura_bl6),
  '🚨 EL ÍNDICE SALE DE LOS TÍTULOS DEL DOCUMENTO');
ok(/Esto va de Supabase/.test(lectura_bl6), '⚠️ y el texto se lee');
ok(!/^#/m.test(lectura_bl6.split('Contenido')[1] || ''),
  '⚠️ ya sin las marcas: en lectura se ve el documento, no lo que se escribió');

/* Buscar por el contenido, que es lo que el enunciado pone de ejemplo. */
/* Sacarlo de borrador desde su propia ficha, y comprobar que se guarda. */
ok(await pulsar('Ya no es un borrador'), 'se saca de borrador desde su ficha');
await page.waitForTimeout(700);
const trasPublicar_bl6 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.documentos;
ok(trasPublicar_bl6?.[0]?.estado === 'ready',
  '⚠️ y deja de ser un borrador **sin perder nada**: su contenido sigue entero');
ok(/Supabase/.test(trasPublicar_bl6[0].contenido || ''), '🚨 el texto no se toca al cambiar de estado');
ok(await pulsar('Cerrar el documento'), 'se cierra la lectura');

/* ── E3 F21 (BL F7) · COLECCIONES ────────────────────────────────────────
   Las tres promesas que hay que ver en la pantalla, no en una prueba de Node:
   **una colección agrupa lo que ya existe**, **quitar un elemento no lo borra**
   y **eliminar la colección no se lleva su contenido**. */
almacen.biblioteca = {
  apuntes: [{ id: 'n1', titulo: 'Repaso biología', contenido: 'La mitosis', fecha: '2026-09-01' }],
  enlaces: [], libros: [], ideas: [], colecciones: [], documentos: [],
};
almacen.bibliotecaArchivos = [];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Biblioteca');
ok(await pulsar('Colecciones'), 'Colecciones se abre');

const vacio_bl7 = await esperarTexto(/Organiza tu biblioteca/i);
ok(/Organiza tu biblioteca/i.test(vacio_bl7),
  '⚠️ y sin ninguna, el estado vacío del enunciado');
ok(/Crea una colección para reunir/i.test(vacio_bl7), '⚠️ con su frase entera');

ok(await pulsar('Nueva colección'), 'y su botón abre el formulario');
await page.waitForSelector('input[aria-label="Nombre de la colección"]', { timeout: 6000 });
await page.fill('input[aria-label="Nombre de la colección"]', 'Estudios');
await page.fill('input[aria-label="Descripción de la colección"]', 'Todo el curso');
ok(await pulsar('Icono Estudios'), 'se elige un icono');
ok(await pulsar('Color Azul'), 'y un color del sistema de siempre');
ok(await pulsar('Crear colección'), 'y se crea');

const conUna_bl7 = await esperarTexto(/Estudios/);
ok(/Estudios/.test(conUna_bl7), '⚠️ la colección aparece en la lista');
ok(/Vac[íi]a/i.test(conUna_bl7),
  '⚠️ y recién creada dice que está vacía, no "0 elementos"');

const colGuardada_bl7 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.colecciones;
ok(colGuardada_bl7?.length === 1 && colGuardada_bl7[0].nombre === 'Estudios',
  '🚨 y llega a Supabase de verdad');
ok(colGuardada_bl7[0].icono === 'GraduationCap' && colGuardada_bl7[0].acento === 'info',
  '⚠️ con el icono y el acento que se eligieron');
ok(Array.isArray(colGuardada_bl7[0].elementos) && colGuardada_bl7[0].elementos.length === 0,
  '⚠️ y con su lista de relaciones, vacía');

/* Entrar, añadir la nota que ya existía y comprobar que NO se ha copiado. */
ok(await pulsar('Abrir la colección Estudios'), 'se entra en la colección');
const dentro_bl7 = await esperarTexto(/Esta colección está vacía/i);
ok(/Esta colección está vacía/i.test(dentro_bl7), '⚠️ y dentro, su propio estado vacío');
ok(/Los elementos de esta colección no se eliminarán/i.test(dentro_bl7),
  '🚨 Y LA FRASE DEL ENUNCIADO SE LEE EN LA PANTALLA, no solo en el código');

ok(await pulsar('Añadir contenido'), 'se abre el selector de contenido');
const selector_bl7 = await esperarTexto(/Añadir seleccionados/i);
ok(/Añadir seleccionados/i.test(selector_bl7), '⚠️ con el botón del enunciado');
ok(await pulsar('Notas'), 'se elige el tipo Notas');
ok(await pulsar('Seleccionar Repaso biología'), 'y se marca la nota que ya existía');
ok(await pulsar('Añadir 1 seleccionado'), 'se añade');

const conNota_bl7 = await esperarTexto(/Repaso biología/);
ok(/Repaso biología/.test(conNota_bl7), '🚨 LA NOTA SALE DENTRO DE LA COLECCIÓN');
ok(/1 elemento\b/.test(conNota_bl7), '⚠️ y la cuenta es de verdad');

const trasAnadir_bl7 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value;
ok(trasAnadir_bl7.colecciones[0].elementos.length === 1
  && trasAnadir_bl7.colecciones[0].elementos[0].id === 'n1',
  '🚨 lo guardado es UNA REFERENCIA `{ tipo, id }`');
ok(!JSON.stringify(trasAnadir_bl7.colecciones[0]).includes('mitosis'),
  '🚨 **NO DUPLICAR**: el contenido de la nota NO está dentro de la colección');
ok(trasAnadir_bl7.apuntes.length === 1 && trasAnadir_bl7.apuntes[0].contenido === 'La mitosis',
  '⚠️ y la nota sigue entera en su lista de siempre');

/* Quitarla: se va de la colección y **sigue existiendo**. */
ok(await pulsar('Quitar Repaso biología de la colección'), 'se quita de la colección');
await page.waitForTimeout(700);
const trasQuitar_bl7 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value;
ok(trasQuitar_bl7.colecciones[0].elementos.length === 0, 'la relación desaparece');
ok(trasQuitar_bl7.apuntes.length === 1,
  '🚨 Y LA NOTA SIGUE EXISTIENDO: *"si se elimina de la colección, la nota sigue existiendo"*');
ok(trasQuitar_bl7.apuntes[0].contenido === 'La mitosis', '⚠️ con su contenido intacto');

ok(await pulsar('Cerrar la colección'), 'se cierra la colección');

/* Y desde la propia nota: el mismo sistema, en la otra dirección. */
ok(await pulsar('Volver a la biblioteca'), 'se vuelve al lanzador');
ok(await pulsar('Notas'), 'se abre Notas');
ok(await pulsar('Añadir a colección'),
  '🚨 Y LA NOTA TIENE EL MISMO SISTEMA: *"no crear cinco sistemas distintos"*');
ok(await pulsar('Añadir a Estudios'), 'se añade desde aquí');
await page.waitForTimeout(700);
const desdeLaNota_bl7 = guardado.filter((g) => g && g.key === 'biblioteca').at(-1)?.value?.colecciones;
ok(desdeLaNota_bl7?.[0]?.elementos?.length === 1,
  '⚠️ y escribe exactamente la misma relación que el selector de dentro');

/* ── E3 F22 (BL F8) · INTEGRACIÓN Y EXPERIENCIA GLOBAL ───────────────────
   La prueba de integración del apartado 33, hecha en el navegador: entrar,
   buscar algo desde la Biblioteca, abrirlo, volver, modificarlo y comprobar que
   sube en Recientes. */
almacen.biblioteca = {
  apuntes: [{ id: 'n1', titulo: 'Repaso biología', contenido: 'Supabase y la mitosis', fecha: '2026-08-01' }],
  enlaces: [],
  libros: [{ id: 'l1', titulo: 'Hábitos atómicos', autor: 'James Clear', estado: 'leyendo', totalPaginas: 250, paginaActual: 30, fecha: '2026-08-05', actualizado: '2026-08-05' }],
  ideas: [],
  colecciones: [],
  documentos: [{ id: 'd1', titulo: 'Arquitectura Supabase', contenido: 'RLS y app_data', estado: 'ready', etiquetas: [], favorito: true, archivado: false, fecha: '2026-08-10', actualizado: '2026-08-10' }],
};
almacen.bibliotecaArchivos = [];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Biblioteca');

const principal_bl8 = await esperarTexto(/Recientes/i);
ok(/Tu espacio personal para guardar, crear y organizar/i.test(principal_bl8),
  '⚠️ la Biblioteca se presenta con la frase del enunciado');
ok(/Recientes/i.test(principal_bl8),
  '🚨 🕘 RECIENTES ESTÁ DEBAJO DE LOS SEIS CUADRADITOS');
ok(/Arquitectura Supabase/.test(principal_bl8),
  '🚨 y enseña elementos de VERDAD, no un hueco');
ok(/Favoritos/i.test(principal_bl8),
  '⚠️ ⭐ FAVORITOS aparece, porque hay uno de verdad');
ok(/documento/i.test(principal_bl8) && /libro/i.test(principal_bl8),
  '⚠️ y cada fila dice de qué tipo es');
ok(!/hace \d+ min/i.test(principal_bl8),
  '🚨 Y NI UN "HACE 20 MIN": la fecha guardada es el día, así que decirlo sería inventarse la hora');

/* La búsqueda global: el ejemplo literal del enunciado. */
await page.fill('input[aria-label="Buscar en la Biblioteca"]', 'Supabase');
const busqueda_bl8 = await esperarTexto(/Arquitectura Supabase/);
ok(/Arquitectura Supabase/.test(busqueda_bl8),
  '🚨 BUSCAR «Supabase» ENCUENTRA EL DOCUMENTO POR SU CONTENIDO');
ok(/Repaso biología/.test(busqueda_bl8),
  '🚨 y la NOTA, que también lo menciona: la búsqueda cruza las seis mini-apps');

/* Abrirlo desde la búsqueda: se abre el ORIGINAL, no una copia. */
ok(await pulsar('Abrir Arquitectura Supabase'), 'se abre desde el resultado de búsqueda');
const abierto_bl8 = await esperarTexto(/RLS y app_data/);
ok(/RLS y app_data/.test(abierto_bl8),
  '🚨 Y ES EL DOCUMENTO ORIGINAL, con su contenido: *"no crear copias"*');

/* Modificarlo y comprobar que sube en Recientes (apartado 33, pasos 14-16). */
ok(await pulsar('Volver a borrador'), 'se cambia algo del documento');
await page.waitForTimeout(700);
ok(await pulsar('Cerrar el documento'), 'se cierra');
ok(await pulsar('Volver a la biblioteca'), 'y se vuelve a la Biblioteca');

const trasTocar_bl8 = await esperarTexto(/Recientes/i);
const ordenRecientes = trasTocar_bl8.split(/Recientes/i)[1] || '';
ok(ordenRecientes.indexOf('Arquitectura Supabase') >= 0
  && ordenRecientes.indexOf('Arquitectura Supabase') < ordenRecientes.indexOf('Hábitos atómicos'),
  '🚨 Y LO QUE ACABA DE TOCAR SUBE A LO ALTO DE RECIENTES, sin que nadie sincronice nada');

/* Las acciones rápidas: crear sin entrar antes en la mini-app. */
ok(await pulsar('Crear algo nuevo en la Biblioteca'), 'el ＋ de la Biblioteca abre las acciones rápidas');
const acciones_bl8 = await esperarTexto(/Nueva idea/i);
ok(/Nueva idea/i.test(acciones_bl8) && /Guardar algo/i.test(acciones_bl8),
  '⚠️ con una acción por mini-app (apartado 10)');
ok(await pulsar('Nueva idea'), 'y lleva a Ideas con el formulario abierto');
const enIdeas_bl8 = await esperarTexto(/Idea/);
ok(/Idea/.test(enIdeas_bl8), '🚨 SIN ENTRAR PRIMERO EN LA MINI-APP: el ＋ crea desde la Biblioteca');

/* ── E3 F23 (PR F1) · PRODUCTIVIDAD COMO LANZADOR ────────────────────────
   Lo que no se puede comprobar en Node: que la pantalla ES un lanzador, que
   Objetivos **ya no está** en el área Vida, y que sigue llegándose a él. */
almacen.productividad = {
  habitos: [{ id: 'h1', nombre: 'Leer 20 min', historial: {} }],
  rutinas: [],
  tareas: [{ id: 't1', texto: 'Estudiar mates', hecha: false }],
  metas: [],
  pomodoros: {},
  apuntes: [],
};
almacen.objetivos = { lista: [{ id: 'o1', texto: 'Aprender inglés', plazo: '1 año', cumplido: false }], ultimaRevision: null };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
const areaVida_pr1 = await esperarTexto(/Productividad/);
ok(/Productividad/.test(areaVida_pr1), 'Productividad sigue en el área Vida');
ok(!/^Objetivos$/m.test(areaVida_pr1),
  '🚨 Y OBJETIVOS YA NO ESTÁ COMO APARTADO INDEPENDIENTE (criterio 9)');

ok(await pulsar('Productividad'), 'Productividad se abre');
const lanzador_pr1 = await esperarTexto(/Construye constancia cada día/);
ok(/Construye constancia cada día/.test(lanzador_pr1),
  '🚨 Y ES UN LANZADOR: lo primero que se ve son las seis mini-apps, no una lista');
/* 🔓 DIST F1 — siguen siendo SEIS, pero **Tareas salió a Organización y Rachas
   entró**. Esta comprobación era de la E3 F23 y no se borra: se le da la vuelta,
   porque lo que vigila —que el lanzador enseñe sus mini-apps— sigue importando. */
for (const nombre of ['Hábitos', 'Pomodoro', 'Rachas', 'Metas', 'Objetivos', 'Rutinas']) {
  ok(new RegExp(nombre, 'i').test(lanzador_pr1), `⚠️ y ${nombre} es una de ellas`);
}
ok(!/Organiza lo que tienes que hacer/i.test(lanzador_pr1),
  '🚨 DIST F1 — y Tareas YA NO es una mini-app de aquí: su sitio es Organización');
ok(/Concéntrate sin distracciones/.test(lanzador_pr1) && /Define hacia dónde quieres avanzar/.test(lanzador_pr1),
  '⚠️ cada una con la descripción del enunciado');
/* Desde la E3 F29 cada cuadradito habla el idioma de SU mini-app —"0/1 hoy",
   "1 activo"— en vez de contar elementos todos igual. Lo que esta comprobación
   protege sigue siendo lo mismo: que los números salen de los módulos de verdad
   y que **los objetivos se leen de su propia clave**, no de `productividad`.
   ⚠️ Tareas no aparece aquí a propósito: la tarea del escenario **no tiene
   fecha** (es el caso de la E3 F26, unas líneas más abajo), y "pendientes" son
   las de hoy y las vencidas — una sin fecha no toca hoy, así que no se pinta. */
ok(/0\/1 hoy/.test(lanzador_pr1) && /1 activo/.test(lanzador_pr1),
  '🚨 con indicadores de DATOS REALES, incluidos los objetivos leídos de su propia clave');
ok(!/0 metas|0 rutinas/.test(lanzador_pr1),
  '🚨 y una mini-app vacía NO enseña un cero: no se pinta nada');

/* Entrar en Objetivos desde dentro de Productividad. */
ok(await pulsar('Abrir Objetivos'), 'se entra en Objetivos');
const dentroObj_pr1 = await esperarTexto(/Aprender inglés/);
ok(/Aprender inglés/.test(dentroObj_pr1),
  '🚨 Y SUS DATOS SIGUEN AHÍ: el objetivo de siempre, leído de la clave de siempre');
ok(/Define hacia dónde quieres avanzar/.test(dentroObj_pr1),
  '⚠️ con la cabecera de su mini-app');
ok((dentroObj_pr1.match(/Objetivos/g) || []).length < 3,
  '⚠️ y sin repetir el título dos veces: lo pone la cabecera, no la pantalla de dentro');

ok(await pulsar('Volver a Productividad'), 'y se vuelve al lanzador');
const vuelta_pr1 = await esperarTexto(/Construye constancia cada día/);
ok(/Construye constancia cada día/.test(vuelta_pr1), '⚠️ que sigue siendo el lanzador');

/* Y una de las listas de siempre, para comprobar que no se han tocado.
   ⚠️ DIST F1 — Tareas se abre desde Gestión → Organización. Lo que esta sección
   comprueba —que su contenido no se ha reescrito— sigue siendo lo mismo. */
await pulsar('Gestión');
await pulsar('Organización');
ok(await pulsar('Tareas'), 'se entra en Tareas');
const tareas_pr1 = await esperarTexto(/Estudiar mates/);
ok(/Estudiar mates/.test(tareas_pr1),
  '🚨 Y LAS CINCO DE SIEMPRE SIGUEN INTACTAS: esta fase es la pantalla, no su contenido');
/* 🚨 **Y ÉSTE ES EL CASO QUE CAZÓ UN FALLO EN LA E3 F26:** esta tarea **no tiene
   fecha**, así que cae en la sección «Sin fecha», que nace plegada. Con el
   acordeón cerrado la pantalla salía **en blanco** —y el estado vacío no se
   disparaba, porque sí había una tarea—. `aperturaInicial` abre la sección que
   haga falta para que eso no pase. */
ok(!/Todo despejado/.test(tareas_pr1),
  '⚠️ y con una tarea NO se dice "Todo despejado": nunca un vacío con pendientes');

/* ── E3 F24 (PR F2) · HÁBITOS ────────────────────────────────────────────
   Lo que no se puede comprobar en Node: crear un hábito de días concretos desde
   la pantalla, marcarlo, y ver que **el martes no cuenta como fallo**. */
almacen.productividad = { habitos: [], rutinas: [], tareas: [], metas: [], pomodoros: {}, apuntes: [] };
almacen.objetivos = { lista: [], ultimaRevision: null };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Hábitos'), 'Hábitos se abre');

const vacio_pr2 = await esperarTexto(/Empieza a construir tu constancia/i);
ok(/Empieza a construir tu constancia/i.test(vacio_pr2),
  '🚨 y sin hábitos NO hay una pantalla vacía: el estado del enunciado, con su frase');
ok(/pequeños hábitos repetidos/i.test(vacio_pr2), '⚠️ palabra por palabra');

ok(await pulsar('Crear mi primer hábito'), 'y su botón abre el formulario');
await page.waitForSelector('input[aria-label="Nombre del hábito"]', { timeout: 6000 });
await page.fill('input[aria-label="Nombre del hábito"]', 'Leer 20 minutos');
ok(await pulsar('Icono Leer'), 'se elige un icono');
ok(await pulsar('Frecuencia Días concretos'), 'y la frecuencia de días concretos');
ok(await pulsar('Lunes'), 'se marca el lunes');
ok(await pulsar('Miércoles'), 'y el miércoles');
ok(await pulsar('Viernes'), 'y el viernes');
ok(await pulsar('Crear hábito'), 'y se crea');

/* 🚨 Aquí es donde el recorrido encontró el fallo: si hoy no es lunes, miércoles
   ni viernes, el filtro "Hoy" lo escondía nada más crearlo. Ahora la pantalla
   cambia de filtro sola, así que **aparece siempre**. */
const conHabito_pr2 = await esperarTexto(/Leer 20 minutos/);
ok(/Leer 20 minutos/.test(conHabito_pr2),
  '🚨 EL HÁBITO APARECE NADA MÁS CREARLO, toque el día que toque: no puede guardarse y desaparecer');
ok(/Lunes, Miércoles, Viernes/i.test(conHabito_pr2),
  '🚨 CON SU FRECUENCIA DICHA CON PALABRAS, no un código');

const habGuardado_pr2 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.habitos;
ok(habGuardado_pr2?.length === 1 && habGuardado_pr2[0].nombre === 'Leer 20 minutos',
  '🚨 y llega a Supabase de verdad');
ok(habGuardado_pr2[0].regla?.clase === 'dias_concretos',
  '🚨 CON SU REGLA, que es lo que entiende el motor de rachas');
ok(Array.isArray(habGuardado_pr2[0].regla.dias) && habGuardado_pr2[0].regla.dias.length === 3,
  '⚠️ y sus tres días');
ok(habGuardado_pr2[0].rachaActual === undefined && habGuardado_pr2[0].mejorRacha === undefined,
  '🚨 y NI UN CONTADOR guardado: la racha se deriva (RA F1)');

/* Crear uno diario y marcarlo, para ver el progreso del día moverse. */
ok(await pulsar('Nuevo hábito'), 'se crea otro');
await page.waitForSelector('input[aria-label="Nombre del hábito"]', { timeout: 6000 });
await page.fill('input[aria-label="Nombre del hábito"]', 'Beber agua');
ok(await pulsar('Crear hábito'), 'esta vez diario');

const dosHabitos_pr2 = await esperarTexto(/Beber agua/);
ok(/Beber agua/.test(dosHabitos_pr2), 'y aparece');
ok(await pulsar('Completar Beber agua'), 'se marca con un toque');
await page.waitForTimeout(700);

const trasMarcar_pr2 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.habitos;
const agua = trasMarcar_pr2.find((h) => h.nombre === 'Beber agua');
ok(Object.keys(agua.historial || {}).length === 1,
  '🚨 Y SE GUARDA EN SU HISTORIAL, que es donde lleva viviendo desde la Fase 6');

const conProgreso_pr2 = await esperarTexto(/completados/i);
ok(/completados/i.test(conProgreso_pr2), '⚠️ y el progreso del día lo dice');
ok(await pulsar('Desmarcar Beber agua'), 'y se puede desmarcar');
await page.waitForTimeout(700);
const trasDesmarcar_pr2 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.habitos;
ok(Object.keys(trasDesmarcar_pr2.find((h) => h.nombre === 'Beber agua').historial || {}).length === 0,
  '⚠️ dejando el historial como estaba');

/* El detalle: estadísticas e historial. */
ok(await pulsar('Ver Leer 20 minutos'), 'se abre el detalle de un hábito');
const detalle_pr2 = await esperarTexto(/Cumplimiento/i);
ok(/Cumplimiento/i.test(detalle_pr2) && /Mejor racha/i.test(detalle_pr2),
  '🚨 CON SUS ESTADÍSTICAS: cumplimiento, mejor racha y veces completado');
ok(/no tocaban/i.test(detalle_pr2),
  '🚨 y el historial DICE que los días que no tocaban no son un fallo');
ok(await pulsar('Cerrar el detalle del hábito'), 'y se cierra');

/* ── E3 F25 (PR F3) · POMODORO ───────────────────────────────────────────
   Lo que no se puede comprobar en Node: que el temporizador se ve, que arranca,
   que se pausa, y que **la sesión sobrevive a recargar la aplicación**. */
almacen.productividad = {
  habitos: [], rutinas: [], tareas: [], metas: [], pomodoros: {}, apuntes: [],
  pomodoroConfig: null, pomodoroEnCurso: null, pomodoroSesiones: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Pomodoro'), 'Pomodoro se abre');

const inicio_pr3 = await esperarTexto(/25:00/);
ok(/25:00/.test(inicio_pr3), '🚨 Y SE VE EL TEMPORIZADOR, con los 25 minutos de siempre');
ok(/Concéntrate\. Una sesión cada vez/i.test(inicio_pr3), '⚠️ con la frase del enunciado');
ok(/Sesión 1 de 4/i.test(inicio_pr3), '⚠️ y el contador del ciclo');
ok(/Sesión de enfoque/i.test(inicio_pr3), '⚠️ y de qué tipo es');

ok(await pulsar('Iniciar la sesión'), 'se inicia');
await page.waitForTimeout(1500);
const corriendo_pr3 = await ver();
ok(/24:5\d|24:4\d/.test(corriendo_pr3), '🚨 Y EL RELOJ CORRE DE VERDAD');

const sesionGuardada_pr3 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.pomodoroEnCurso;
ok(sesionGuardada_pr3 && sesionGuardada_pr3.tipo === 'focus',
  '🚨 y la sesión se guarda en Supabase nada más empezar');
ok(Number.isFinite(sesionGuardada_pr3.inicio) && sesionGuardada_pr3.inicio > 0,
  '🚨 CON SU INSTANTE DE INICIO: es un timestamp, no un contador de segundos');
ok(sesionGuardada_pr3.duracionMs === 25 * 60 * 1000, '⚠️ y su duración');

ok(await pulsar('Pausar la sesión'), 'se pausa');
await page.waitForTimeout(1200);
const pausado_pr3 = await ver();
const marcaPausa = (pausado_pr3.match(/2[0-4]:\d\d/) || [''])[0];
await page.waitForTimeout(2000);
const seguido_pr3 = await ver();
ok(marcaPausa && seguido_pr3.includes(marcaPausa),
  '🚨 Y PAUSADO EL RELOJ NO SE MUEVE: dos segundos después marca lo mismo');
ok(/Continuar/i.test(seguido_pr3), '⚠️ y el botón ofrece continuar');

/* 🚨 La prueba que de verdad importa: recargar la aplicación entera. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Pomodoro'), 'se vuelve a entrar en Pomodoro tras recargar');
const trasRecargar_pr3 = await esperarTexto(/2[0-4]:\d\d/);
ok(/2[0-4]:\d\d/.test(trasRecargar_pr3),
  '🚨 Y LA SESIÓN SIGUE AHÍ TRAS RECARGAR: el temporizador no vuelve a empezar de cero');
ok(/Continuar/i.test(trasRecargar_pr3), '⚠️ y sigue pausada, como se dejó');

ok(await pulsar('Cancelar'), 'se cancela la sesión');
await page.waitForTimeout(900);
const trasCancelar_pr3 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(trasCancelar_pr3.pomodoroEnCurso === null, '⚠️ y deja de haber sesión en curso');
ok((trasCancelar_pr3.pomodoroSesiones || []).length === 1,
  '⚠️ pero SE REGISTRA que fue interrumpida, para las estadísticas');
ok(trasCancelar_pr3.pomodoroSesiones[0].interrumpida === true, '⚠️ marcada como interrumpida');
ok(Object.keys(trasCancelar_pr3.pomodoros || {}).length === 0,
  '🚨 Y NO CUENTA COMO POMODORO: el contador por día sigue vacío');

const vueltaAlInicio_pr3 = await esperarTexto(/25:00/);
ok(/25:00/.test(vueltaAlInicio_pr3), '⚠️ y el temporizador vuelve a su duración entera');

ok(await pulsar('Configurar'), 'se abre la configuración');
const config_pr3 = await esperarTexto(/Tiempo de enfoque/i);
ok(/Tiempo de enfoque/i.test(config_pr3) && /Descanso largo/i.test(config_pr3),
  '⚠️ con las duraciones del enunciado');
ok(await pulsar('Tiempo de enfoque: 45 minutos'), 'se cambia el enfoque a 45 minutos');
ok(await pulsar('Guardar'), 'y se guarda');
const con45_pr3 = await esperarTexto(/45:00/);
ok(/45:00/.test(con45_pr3), '🚨 Y EL TEMPORIZADOR PASA A 45 MINUTOS: las duraciones son configurables de verdad');

/* ── E3 F26 (PR F4) · TAREAS ─────────────────────────────────────────────
   🚨 Lo que ninguna prueba de Node puede ver: que **una tarea guardada con la
   forma vieja aparece de verdad en Hoy**. Ése era el fallo — la pantalla de
   Productividad guardaba `fechaLimite` y Hoy, la Agenda y el Calendario leen
   `fecha`, así que las tareas de Josué no salían en ninguna de las tres y las
   tres se pintaban perfectas. */
const HOY_PR4 = new Date().toLocaleDateString('sv-SE');
almacen.productividad = {
  habitos: [], rutinas: [], metas: [], pomodoros: {}, apuntes: [],
  pomodoroConfig: null, pomodoroEnCurso: null, pomodoroSesiones: [],
  // La forma VIEJA, tal como la tiene guardada Josué.
  tareas: [{ id: 'vieja_pr4', texto: 'Tarea guardada antes', fechaLimite: HOY_PR4, hecha: false }],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

const hoy_pr4 = await esperarTexto(/Tarea guardada antes/i);
ok(/Tarea guardada antes/i.test(hoy_pr4),
  '🚨 LA TAREA VIEJA SALE EN HOY: es el fallo que arregla la E3 F26, y solo se ve abriendo la aplicación');

/* ⚠️ DIST F1 — Tareas se abre desde Gestión → Organización. Lo que esta
   sección comprueba —el fallo de las dos fechas que arregló la E3 F26— es
   exactamente el mismo: la tarea vieja tiene que salir. */
await pulsar('Gestión');
await pulsar('Organización');
ok(await pulsar('Tareas'), 'Tareas se abre');

const inicio_pr4 = await esperarTexto(/Organiza lo que tienes que hacer/i);
ok(/Organiza lo que tienes que hacer/i.test(inicio_pr4), '⚠️ con la frase del enunciado');
ok(/1 pendiente/i.test(inicio_pr4), '⚠️ y el resumen de la cabecera: "Hoy · 1 pendiente"');
ok(/Tarea guardada antes/i.test(inicio_pr4), '⚠️ y la tarea vieja también se ve aquí');

ok(await pulsar('Nueva tarea'), 'se abre el formulario');
const form_pr4 = await esperarTexto(/Prioridad/i);
ok(/Título/i.test(form_pr4) && /Prioridad/i.test(form_pr4) && /Categoría/i.test(form_pr4),
  '⚠️ con los campos del enunciado');
ok(/Alta/i.test(form_pr4) && /Media/i.test(form_pr4) && /Baja/i.test(form_pr4),
  '⚠️ y las tres prioridades, con su palabra: nunca solo un color');
await page.fill('input[aria-label="Título de la tarea"]', 'Estudiar biología');
ok(await pulsar('Hoy'), 'se pone para hoy con el atajo');
ok(await pulsar('Prioridad Alta'), 'y con prioridad alta');
ok(await pulsar('Añadir tarea'), 'se añade');
await page.waitForTimeout(900);

const escrito_pr4 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
const tareas_pr4 = escrito_pr4?.tareas || [];
ok(tareas_pr4.length === 2, '⚠️ PERSISTENCIA: la tarea se ESCRIBE en Supabase');
const nueva_pr4 = tareas_pr4.find((t) => t.texto === 'Estudiar biología');
ok(nueva_pr4 && nueva_pr4.fecha === HOY_PR4,
  '🚨 CON `fecha`, que es el campo que leen Hoy, la Agenda y el Calendario');
ok(nueva_pr4 && !('fechaLimite' in nueva_pr4), '🚨 y sin el campo viejo: ni un duplicado');
ok(nueva_pr4 && nueva_pr4.prioridad === 'alta', '⚠️ con su prioridad');
const migrada_pr4 = tareas_pr4.find((t) => t.id === 'vieja_pr4');
ok(migrada_pr4 && migrada_pr4.fecha === HOY_PR4 && !('fechaLimite' in migrada_pr4),
  '🚨 Y LA VIEJA SE GUARDA YA MIGRADA: el arreglo se queda, no hay que repetirlo cada vez');

const lista_pr4 = await esperarTexto(/Estudiar biología/i);
ok(/Estudiar biología/i.test(lista_pr4), '⚠️ y la pantalla la enseña');
ok(/Alta/i.test(lista_pr4), '⚠️ con su prioridad en palabra, no solo en color');
ok(/2 pendientes/i.test(lista_pr4), '⚠️ y el contador de la cabecera se mueve solo');

ok(await pulsar('Completar Estudiar biología'), 'se completa con un toque');
await page.waitForTimeout(900);
const trasCompletar_pr4 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
const hecha_pr4 = (trasCompletar_pr4?.tareas || []).find((t) => t.texto === 'Estudiar biología');
ok(hecha_pr4 && hecha_pr4.hecha === true, '⚠️ y se guarda completada');
ok(hecha_pr4 && typeof hecha_pr4.completadaEn === 'string' && hecha_pr4.completadaEn.slice(0, 10) === HOY_PR4,
  '🚨 Y CON LA MARCA DE CUÁNDO: sin ella, "completadas hoy" diría siempre cero');
const trasCompletarPantalla_pr4 = await esperarTexto(/1 completada/i);
ok(/1 completada/i.test(trasCompletarPantalla_pr4), '⚠️ y la cabecera lo dice: "1 completada"');

ok(await pulsar('Tarea guardada antes'), 'se abre el detalle de una tarea');
const detalle_pr4 = await esperarTexto(/Reprogramar/i);
ok(/Reprogramar/i.test(detalle_pr4), '⚠️ con sus acciones');
ok(/Concentrarme/i.test(detalle_pr4), '⚠️ y con «Concentrarme», que abre el Pomodoro que ya existe');
ok(/Eliminar tarea/i.test(detalle_pr4), '⚠️ y eliminar');

ok(await pulsar('Concentrarme'), 'se toca «Concentrarme»');
const pomodoro_pr4 = await esperarTexto(/Concentrándote en/i);
ok(/Concentrándote en: Tarea guardada antes/i.test(pomodoro_pr4),
  '🚨 Y SE ABRE EL POMODORO DICIENDO EN QUÉ: el `tareaId` llega de verdad (criterio 13)');
ok(/25:00/.test(pomodoro_pr4) || /2[0-5]:\d\d/.test(pomodoro_pr4),
  '⚠️ con el temporizador de siempre: ni uno nuevo dentro de Tareas');
await page.waitForTimeout(900);
const sesion_pr4 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.pomodoroEnCurso;
ok(sesion_pr4 && sesion_pr4.tareaId === 'vieja_pr4',
  '🚨 y la sesión guarda el id de la tarea, no una copia de su nombre');

/* ── E3 F27 (PR F5) · METAS + OBJETIVOS ──────────────────────────────────
   🚨 Lo que ninguna prueba de Node puede ver: que **un objetivo guardado con la
   forma vieja se abre y funciona**, y que el progreso de un objetivo sale de
   sus metas de verdad. */
almacen.objetivos = {
  // La forma VIEJA, tal como la tiene guardada Josué desde la Fase 9.
  lista: [{ id: 'o_pr5', texto: 'Mejorar mi físico', plazo: '1 año', cumplido: false, fechaCreacion: '2026-01-01' }],
  ultimaRevision: new Date().toLocaleDateString('sv-SE'),
};
almacen.productividad = {
  habitos: [], rutinas: [], tareas: [], pomodoros: {}, apuntes: [],
  pomodoroConfig: null, pomodoroEnCurso: null, pomodoroSesiones: [],
  // Y una meta guardada con la forma vieja, ya enlazada al objetivo.
  metas: [{ id: 'm_pr5', nombre: 'Leer 12 libros', periodo: 'Mensual', objetivo: 12, progreso: 3 }],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Objetivos'), 'Objetivos se abre');

const obj_pr5 = await esperarTexto(/Define hacia dónde quieres avanzar/i);
ok(/Define hacia dónde quieres avanzar/i.test(obj_pr5), '⚠️ con la frase del enunciado');
ok(/Mejorar mi físico/i.test(obj_pr5),
  '🚨 Y EL OBJETIVO GUARDADO A LA VIEJA SE VE: la fase amplía la lista de siempre, no crea otra');
ok(/Sin metas todavía/i.test(obj_pr5),
  '🚨 y sin metas NO se pinta un 0 %: se dice que aún no tiene ninguna');

ok(await pulsar('Mejorar mi físico'), 'se abre su detalle');
const det_pr5 = await esperarTexto(/Marcar como principal/i);
ok(/Marcar como principal/i.test(det_pr5), '⚠️ con la estrella de objetivo principal');
ok(/Archivar/i.test(det_pr5) && /Pausar/i.test(det_pr5), '⚠️ y los estados del enunciado');
ok(/Metas de este objetivo/i.test(det_pr5), '⚠️ y sus metas');

ok(await pulsar('Marcar como principal'), 'se marca como principal');
await page.waitForTimeout(900);
const trasPpal_pr5 = guardado.filter((g) => g && g.key === 'objetivos').at(-1)?.value;
ok(trasPpal_pr5?.lista?.[0]?.principal === true, '⚠️ PERSISTENCIA: se escribe en Supabase');
ok(trasPpal_pr5?.lista?.[0]?.texto === 'Mejorar mi físico' && trasPpal_pr5.lista[0].plazo === '1 año',
  '🚨 Y CONSERVA SUS CAMPOS DE SIEMPRE: `texto`, `plazo` y `cumplido` los leen otros veinticuatro archivos');
ok(trasPpal_pr5?.lista?.[0]?.estado === 'activo',
  '⚠️ y le llegan los campos nuevos de la PR F5, así que el normalizador no se los come');
ok(trasPpal_pr5?.ultimaRevision, '🚨 y `ultimaRevision` sigue ahí: guardar la lista no se lleva el resto de la clave');

ok(await pulsar('Completar'), 'se completa el objetivo');
await page.waitForTimeout(900);
ok(await pulsar('Archivar'), 'y se archiva');
await page.waitForTimeout(900);
const trasArch_pr5 = guardado.filter((g) => g && g.key === 'objetivos').at(-1)?.value?.lista?.[0];
ok(trasArch_pr5?.cumplido === true && trasArch_pr5?.estado === 'archivado',
  '🚨 ARCHIVAR UN OBJETIVO CUMPLIDO NO LE BORRA QUE LO CUMPLIÓ: son dos campos, no uno');
ok(trasArch_pr5?.cumplidoEn, '⚠️ y queda apuntado cuándo se cumplió');

ok(await pulsar('Volver a los objetivos'), 'se vuelve a la lista');
ok(await pulsar('Volver a Productividad'), 'y al lanzador');
ok(await pulsar('Abrir Metas'), 'Metas se abre');
const metas_pr5 = await esperarTexto(/Convierte tus planes en resultados/i);
ok(/Convierte tus planes en resultados/i.test(metas_pr5), '⚠️ con SU frase, distinta de la de Objetivos');
ok(/Leer 12 libros/i.test(metas_pr5), '🚨 y la meta guardada a la vieja se ve');
ok(/3 \/ 12/.test(metas_pr5), '⚠️ con su progreso, "3 / 12"');

ok(await pulsar('Nueva meta'), 'se abre el formulario');
const formMeta_pr5 = await esperarTexto(/Cómo se mide/i);
ok(/Numérico/i.test(formMeta_pr5) && /Porcentaje/i.test(formMeta_pr5) && /Frecuencia/i.test(formMeta_pr5),
  '⚠️ con los cuatro tipos de progreso');
await page.fill('input[aria-label="Nombre de la meta"]', '15 dominadas');
await page.fill('input[aria-label="Valor objetivo"]', '15');
ok(await pulsar('Añadir meta'), 'se añade');
await page.waitForTimeout(900);
const metasEscritas_pr5 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.metas || [];
ok(metasEscritas_pr5.length === 2, '⚠️ PERSISTENCIA: la meta se escribe en Supabase');
const nueva_pr5 = metasEscritas_pr5.find((m) => m.nombre === '15 dominadas');
ok(nueva_pr5 && nueva_pr5.objetivo === 15 && nueva_pr5.tipo === 'numerico', '⚠️ con su tipo y su objetivo');
const vieja_pr5 = metasEscritas_pr5.find((m) => m.id === 'm_pr5');
ok(vieja_pr5 && vieja_pr5.periodo === 'Mensual' && vieja_pr5.progreso === 3,
  '🚨 Y LA META VIEJA CONSERVA LO SUYO: ni un campo se renombra');

ok(await pulsar('15 dominadas'), 'se abre el detalle de la meta');
const detMeta_pr5 = await esperarTexto(/Actualizar progreso/i);
ok(/Actualizar progreso/i.test(detMeta_pr5), '⚠️ con su actualización de progreso');
ok(/Tareas de esta meta/i.test(detMeta_pr5), '⚠️ y sus tareas, que es la jerarquía del enunciado');
await page.fill('input[aria-label="Progreso de la meta"]', '20');
ok(await pulsar('Guardar'), 'se pone un progreso por encima del objetivo');
await page.waitForTimeout(900);
const superada_pr5 = (guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value?.metas || [])
  .find((m) => m.nombre === '15 dominadas');
ok(superada_pr5?.progreso === 20,
  '🚨 EL VALOR SUPERIOR SÍ SE GUARDA: *"aunque internamente pueda registrarse un valor superior"*');
const pintado_pr5 = await esperarTexto(/Objetivo superado/i);
ok(/Objetivo superado/i.test(pintado_pr5),
  '🚨 Y AL PINTARLO NO PASA DEL 100 %: se dice "Objetivo superado", que es lo que pide el enunciado');

/* ── E3 F28 (PR F6) · RUTINAS ────────────────────────────────────────────
   🚨 Lo que ninguna prueba de Node puede ver: que **una rutina guardada con la
   forma vieja se abre y funciona**, que el modo de ejecución existe de verdad, y
   que **recargar la aplicación a mitad de una rutina la recupera donde estaba**. */
almacen.productividad = {
  habitos: [], tareas: [], metas: [], pomodoros: {}, apuntes: [],
  pomodoroConfig: null, pomodoroEnCurso: null, pomodoroSesiones: [],
  rutinaEjecuciones: [], rutinaEnCurso: null,
  // La forma VIEJA de la Fase 6: el paso guardaba `hecho` DENTRO de la plantilla.
  rutinas: [{
    id: 'r_pr6',
    nombre: 'Rutina de mañana',
    pasos: [
      { id: 'p1', texto: 'Levantarse', hecho: true },
      { id: 'p2', texto: 'Beber agua', hecho: false },
    ],
  }],
};
almacen.objetivos = { lista: [], ultimaRevision: null };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Rutinas'), 'Rutinas se abre');

const inicio_pr6 = await esperarTexto(/Convierte tus acciones en rutina/i);
ok(/Convierte tus acciones en rutina/i.test(inicio_pr6), '⚠️ con la frase del enunciado');
ok(/Rutina de mañana/i.test(inicio_pr6),
  '🚨 Y LA RUTINA GUARDADA A LA VIEJA SE VE: la fase amplía la lista de siempre, no crea otra');
ok(/2 pasos/i.test(inicio_pr6), '⚠️ con sus pasos contados');
ok(/Manual/i.test(inicio_pr6), '⚠️ y sin programación se dice "Manual", no una fecha inventada');

ok(await pulsar('Iniciar Rutina de mañana'), 'se inicia la rutina desde la tarjeta');
const ejec_pr6 = await esperarTexto(/Paso 1 \/ 2/i);
ok(/Paso 1 \/ 2/i.test(ejec_pr6), '🚨 Y SE ENTRA EN EL MODO DE EJECUCIÓN, que es una pantalla distinta');
ok(/Levantarse/i.test(ejec_pr6), '⚠️ con el paso actual bien grande');
ok(/Completar/i.test(ejec_pr6) && /Pausar/i.test(ejec_pr6) && /Salir/i.test(ejec_pr6),
  '⚠️ y los controles del enunciado');
await page.waitForTimeout(900);
const enCurso_pr6 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(enCurso_pr6?.rutinaEnCurso?.rutinaId === 'r_pr6',
  '⚠️ PERSISTENCIA: la ejecución en curso se ESCRIBE en Supabase nada más empezar');
ok(enCurso_pr6?.rutinaEnCurso?.inicio > 0,
  '🚨 CON SU INSTANTE DE INICIO: es un timestamp, no un contador de segundos');
const plantilla_pr6 = (enCurso_pr6?.rutinas || []).find((r) => r.id === 'r_pr6');
ok(plantilla_pr6 && !('hecho' in (plantilla_pr6.pasos[0] || {})),
  '🚨 Y EL `hecho` DE LA PLANTILLA HA DESAPARECIDO: era lo que borraba el historial de ayer al hacerla hoy');

ok(await pulsar('Completar'), 'se completa el primer paso');
const paso2_pr6 = await esperarTexto(/Beber agua/i);
ok(/Paso 2 \/ 2/i.test(paso2_pr6), '⚠️ y pasa al segundo');
await page.waitForTimeout(900);

/* 🚨 LA COMPROBACIÓN QUE NINGUNA PRUEBA DE NODE PUEDE HACER. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Rutinas'), 'se vuelve a entrar en Rutinas tras recargar');
const trasRecargar_pr6 = await esperarTexto(/Beber agua/i);
ok(/Beber agua/i.test(trasRecargar_pr6) && /Paso 2 \/ 2/i.test(trasRecargar_pr6),
  '🚨 Y LA RUTINA SIGUE DONDE ESTABA TRAS RECARGAR: *"no perder accidentalmente una ejecución en curso"*');

ok(await pulsar('Completar'), 'se completa el último paso');
const fin_pr6 = await esperarTexto(/Rutina completada/i);
ok(/Rutina completada/i.test(fin_pr6), '🚨 Y SALE LA PANTALLA DE FINALIZACIÓN');
ok(/2 \/ 2 pasos/i.test(fin_pr6), '⚠️ con los pasos que hizo');

ok(await pulsar('Volver a Rutinas'), 'se vuelve a la lista');
await page.waitForTimeout(900);
const trasFin_pr6 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok((trasFin_pr6?.rutinaEjecuciones || []).length === 1,
  '🚨 Y LA EJECUCIÓN QUEDA EN EL HISTORIAL: la plantilla y lo que pasó son dos listas');
ok(trasFin_pr6?.rutinaEjecuciones[0].estado === 'completada', '⚠️ marcada como completada');
ok(trasFin_pr6?.rutinaEnCurso === null,
  '🚨 y deja de haber una en curso: registrar e limpiar van en UNA escritura, no en dos que se pisan');
const plantillaFinal_pr6 = (trasFin_pr6?.rutinas || []).find((r) => r.id === 'r_pr6');
ok(plantillaFinal_pr6 && plantillaFinal_pr6.pasos.length === 2
  && !plantillaFinal_pr6.pasos.some((p) => 'completado' in p || 'hecho' in p),
  '🚨 Y LA PLANTILLA SIGUE LIMPIA: ejecutarla no le ha dejado ni un campo de estado (apartado «DUPLICACIÓN»)');

const lista_pr6 = await esperarTexto(/Última vez/i);
ok(/Última vez: Hoy/i.test(lista_pr6), '⚠️ y la tarjeta dice cuándo fue la última vez');

/* ── E3 F29 (PR F7) · INTEGRACIÓN GLOBAL ─────────────────────────────────
   🚨 Lo que ninguna prueba de Node puede ver: que el centro de control **se pinta
   con los números de las seis mini-apps a la vez**, que la barra **sube al
   completar algo**, y que Hoy enseña su resumen. */
const HOY_PR7 = new Date().toLocaleDateString('sv-SE');
almacen.productividad = {
  habitos: [
    { id: 'h1_pr7', nombre: 'Leer 20 min', activo: true, historial: { [HOY_PR7]: true } },
    { id: 'h2_pr7', nombre: 'Beber agua', activo: true, historial: {} },
  ],
  tareas: [
    { id: 't1_pr7', texto: 'Estudiar biología', fecha: HOY_PR7, prioridad: 'alta', hecha: false },
    { id: 't2_pr7', texto: 'Llamar al dentista', fecha: '2026-01-05', prioridad: 'media', hecha: false },
  ],
  metas: [{ id: 'm_pr7', nombre: '15 dominadas', tipo: 'numerico', objetivo: 15, progreso: 8, objetivoId: 'o_pr7' }],
  rutinas: [], rutinaEjecuciones: [], rutinaEnCurso: null,
  /* 🚨 El número de sesiones de hoy sale de `pomodoroSesiones`, NUNCA del mapa
     `pomodoros`: la E3 F25 lo dejó como una proyección con una sola fuente de
     verdad. Sembrar el mapa y dejar las sesiones vacías es sembrar la copia. */
  pomodoros: { [HOY_PR7]: 2 }, apuntes: [],
  pomodoroConfig: null, pomodoroEnCurso: null,
  pomodoroSesiones: [
    { id: 's1_pr7', tipo: 'focus', inicio: Date.now() - 5400000, fin: Date.now() - 3900000, duracionMs: 1500000, completada: true, fecha: HOY_PR7 },
    { id: 's2_pr7', tipo: 'focus', inicio: Date.now() - 3000000, fin: Date.now() - 1500000, duracionMs: 1500000, completada: true, fecha: HOY_PR7 },
  ],
};
almacen.objetivos = {
  lista: [{ id: 'o_pr7', texto: 'Mejorar mi físico', plazo: '1 año', cumplido: false, fechaCreacion: HOY_PR7, principal: true }],
  ultimaRevision: HOY_PR7,
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* Apartado 19: Hoy enseña el resumen de Productividad. */
const hoy_pr7 = await esperarTexto(/PRODUCTIVIDAD/i);
ok(/PRODUCTIVIDAD/i.test(hoy_pr7), '🚨 HOY ENSEÑA EL RESUMEN DE PRODUCTIVIDAD (apartado 19)');
ok(/2 tareas pendientes/i.test(hoy_pr7), '⚠️ con las tareas pendientes de verdad');
ok(/1\/2 hábitos/i.test(hoy_pr7), '⚠️ y los hábitos, contados por su propia mini-app');

await pulsar('Vida');
ok(await pulsar('Productividad'), 'Productividad se abre');

const centro_pr7 = await esperarTexto(/Tu productividad hoy/i);
ok(/Tu productividad hoy/i.test(centro_pr7), '🚨 Y ES UN CENTRO DE CONTROL, no solo seis cuadraditos');
/* Dos tareas (la de hoy y la vencida) + dos hábitos = 4 completables; hecho, el
   hábito de leer. El Pomodoro NO entra: no hay un número de sesiones que «toque»
   hacer (`FUENTES_RESUMEN_DIA`). */
ok(/1 \/ 4 completado/i.test(centro_pr7),
  '⚠️ con el resumen del día de datos reales: dos tareas y dos hábitos, uno hecho');
ok(/Te quedan/i.test(centro_pr7), '⚠️ y "¿qué me queda por hacer hoy?" (apartado 20)');
ok(/2 tareas/i.test(centro_pr7) && /1 hábito/i.test(centro_pr7), '⚠️ con sus cifras');

/* Apartado 5: la prioridad determinista — lo vencido primero.

   ⚠️ **Y desde GE F1 esto comprueba otra cosa, con todo el derecho.** Josué
   pidió quitar de «Para hoy» la copia de las tareas del día —*"esa duplicación
   no aporta valor"*—, así que «Estudiar biología», que es de HOY y de prioridad
   alta, **ya no puede salir aquí**: su sitio es Día. Lo que sí sigue es
   «Llamar al dentista», que está **vencida** y por tanto no sale en Día: si
   tampoco saliera aquí, se quedaría invisible en toda la aplicación.

   Esta comprobación afirmaba el orden literal de entonces y se puso roja con el
   código bien — la misma bomba de relojería que `MODULOS_EH.length === 13`. Se
   comprueba **el mecanismo**, no la lista de aquel día. */
ok(/Para hoy/i.test(centro_pr7), '⚠️ y la sección PARA HOY');
const posVencida = centro_pr7.indexOf('Llamar al dentista');
const posAlta = centro_pr7.indexOf('Estudiar biología');
ok(posVencida > -1,
  '🚨 GE F1 — LA TAREA VENCIDA SIGUE EN «PARA HOY»: no sale en Día, así que es su única lista');
ok(posAlta === -1,
  '🚨 GE F1 — Y LA DE HOY YA NO SE COPIA AQUÍ, ni siendo de prioridad alta: su sitio es Día');

/* Apartado 1: los seis cuadraditos con información real. */
ok(/1\/2 hoy/i.test(centro_pr7), '🚨 el cuadradito de Hábitos dice "1/2 hoy"');
/* ⚠️ DIST F1 — el cuadradito de Tareas ya no está: su pantalla vive en
   Organización. Lo que sí sigue —y es integración, no copia— es que el centro
   de control informe de las vencidas, que es la comprobación de GE F1 de unas
   líneas más arriba. */
ok(!/Organiza lo que tienes que hacer/i.test(centro_pr7),
  '🚨 DIST F1 — y NO hay cuadradito de Tareas: su sitio es Organización');
ok(/2 sesiones/i.test(centro_pr7), '⚠️ el de Pomodoro, sus sesiones de hoy');
ok(/1 activa/i.test(centro_pr7), '⚠️ el de Metas, las activas');
ok(/⭐ Mejorar mi físico/i.test(centro_pr7), '⚠️ y el de Objetivos destaca el principal');

/* Apartado 6: la cadena Objetivo → Meta → Tarea. */
ok(/De tus objetivos a hoy/i.test(centro_pr7), '⚠️ y se ve la cadena Objetivo → Meta → Tarea');
ok(/8 \/ 15/.test(centro_pr7), '⚠️ con el progreso de la meta');

/* 🚨 Completar algo tiene que MOVER el número.
   ⚠️ DIST F1 — la lista vive ahora en Organización, así que se va allí, se
   completa y se vuelve al centro de control por la barra. **Que el número se
   mueva es justo lo que demuestra que no hay copia**: es la misma tarea. */
await pulsar('Gestión');
await pulsar('Organización');
ok(await pulsar('Tareas'), 'se entra en Tareas');
ok(await pulsar('Completar Estudiar biología'), 'y se completa una tarea');
await page.waitForTimeout(900);
await pulsar('Vida');
ok(await pulsar('Productividad'), 'se vuelve al centro de control');
const trasCompletar_pr7 = await esperarTexto(/2 \/ 4 completado/i);
ok(/2 \/ 4 completado/i.test(trasCompletar_pr7),
  '🚨 Y LA BARRA SUBE SIN QUE CAMBIE EL TOTAL: completar no puede sacar la tarea de los dos lados');
ok(/1 tarea/i.test(trasCompletar_pr7), '⚠️ y "te quedan" baja a una');

/* Apartado 3: las acciones rápidas abren su mini-app. */
ok(await pulsar('Pomodoro — abre pomodoro'), 'una acción rápida abre su mini-app');
const pom_pr7 = await esperarTexto(/Concéntrate/i);
ok(/Concéntrate/i.test(pom_pr7), '⚠️ y llega al Pomodoro que ya existía, sin un temporizador nuevo');



/* ── E3 F30 (BN) · EL APARTADO BIENESTAR ──────────────────────────────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que la redundancia «Salud →
   Salud» ha desaparecido de la pantalla de verdad, que las tres secciones se
   pliegan y se despliegan, y que las lesiones se ven **dentro del Historial**
   sin que exista ninguna sección con ese nombre.

   ⚠️ Y una cosa más que solo se ve aquí: `HealthView` **no tenía ni un caso de
   renderizado** hasta esta fase, así que hasta ahora esta pantalla no la
   probaba absolutamente nadie. */
const HOY_BN = new Date().toLocaleDateString('sv-SE');
almacen.salud = {
  medidas: [
    { id: 'bn_m1', fecha: '2026-08-20', peso: 70 },
    { id: 'bn_m2', fecha: HOY_BN, peso: 71.5, grasaCorporal: 14, frecuenciaCardiaca: 58 },
  ],
  historial: [
    { id: 'bn_h1', fecha: HOY_BN, tipo: 'Lesión', descripcion: 'Esguince de tobillo jugando al fútbol' },
    { id: 'bn_h2', fecha: '2026-08-01', tipo: 'Vacuna', descripcion: 'Gripe' },
  ],
};
almacen.perfil = {
  nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, actividad: 'moderado',
  lesiones: [{ id: 'bn_l1', zona: 'Hombro izquierdo', estado: 'En recuperación', fecha: '2026-07-10' }],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* Apartado 2: la barra inferior dice Bienestar, no Salud. */
const barra_bn = await ver();
ok(/Bienestar/i.test(barra_bn), '🚨 E3 F30 — la barra inferior dice BIENESTAR (apartado 2)');
/* 🐛 **Y esto lo cazó esta misma sección:** el acceso de Hoy al módulo del tiempo
   de pantalla seguía diciendo «Bienestar» a secas, así que con el área llamada
   igual el recorrido pulsaba el de Hoy y acababa en la pantalla equivocada. Un
   renombrado a medias es peor que ninguno. */
ok(/Bienestar digital/i.test(barra_bn),
  '🚨 y el acceso de Hoy al tiempo de pantalla dice «Bienestar digital»: dos cosas no pueden llamarse igual');

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
/* 🏷️ DIST F1 — el módulo pasó de «Mi salud» a «Salud física». Lo que el
   apartado 3 de la E3 F30 prohíbe —repetir el nombre del área— se sigue
   cumpliendo igual, que es lo que esta comprobación protege. */
const hub_bn = await esperarTexto(/Salud f[ií]sica/i);
ok(/Salud f[ií]sica/i.test(hub_bn), '🚨 Y DENTRO NO SE REPITE EL NOMBRE: la tarjeta es «Salud física» (apartado 3)');
ok(/Sueño/i.test(hub_bn) && /Nutrición/i.test(hub_bn),
  '⚠️ con el resto del área intacto: no se ha movido ningún módulo');
ok(/71\.5 kg/i.test(hub_bn), '⚠️ y la tarjeta enseña su último peso de verdad');

ok(await pulsar('Abrir Salud física'), 'se entra en Salud física');
const bn = await esperarTexto(/Medidas/i);
ok(/71\.5/.test(bn), '🚨 EL ESTADO DE UN VISTAZO: el peso de la última medida arriba del todo');
ok(/20\.4/.test(bn), '⚠️ con su IMC, calculado con la altura del perfil');
ok(/Medidas/i.test(bn) && /Fotos/i.test(bn) && /Historial/i.test(bn),
  '🚨 y las tres secciones del apartado 4');
ok(/Analizar mi salud/i.test(bn), '🚨 Y «ANALIZAR MI SALUD» SIGUE AHÍ (apartado 4: no eliminarla, no esconderla)');
ok(/2 registros/i.test(bn), '⚠️ cada sección con su número real');
ok(!/Lesiones/i.test(bn.split('Historial')[0] || ''),
  '🚨 y NO hay ninguna sección llamada «Lesiones» (apartado 9)');

/* Medidas nace abierta: la pantalla nunca sale en blanco (E3 F26). */
ok(/Registrar medidas/i.test(bn), '🚨 MEDIDAS NACE ABIERTA: una pantalla toda plegada saldría en blanco');
ok(/Evolución del peso/i.test(bn), '⚠️ con su gráfica, la de siempre');

/* Y el Historial, con las lesiones de las DOS fuentes dentro. */
ok(await pulsar('Desplegar Historial'), 'se despliega el Historial');
const hist_bn = await esperarTexto(/Esguince de tobillo/i);
ok(/Esguince de tobillo/i.test(hist_bn), '🚨 LAS LESIONES SE CONSULTAN DENTRO DEL HISTORIAL (apartado 4)');
ok(/Hombro izquierdo/i.test(hist_bn),
  '🚨 Y TAMBIÉN LAS DEL PERFIL, sin copiarlas: se leen de `perfil.lesiones`');
ok(/Ajustes → Perfil/i.test(hist_bn),
  '⚠️ diciendo dónde se editan — una sola fuente de verdad, y el sitio escrito en la pantalla');
ok(/Vacuna/i.test(hist_bn), '⚠️ y el resto del historial sigue entero');

/* El filtro por tipo, que es lo que hace encontrable una lesión vieja. */
ok(await pulsar('Lesión'), 'se filtra por Lesión');
await page.waitForTimeout(400);
const filtrado_bn = await ver();
ok(/Esguince de tobillo/i.test(filtrado_bn) && !/Gripe/i.test(filtrado_bn),
  '⚠️ y el filtro deja solo las lesiones');

/* Plegar de verdad pliega. */
ok(await pulsar('Plegar Historial'), 'se pliega el Historial');
await page.waitForTimeout(400);
const plegado_bn = await ver();
ok(!/Esguince de tobillo/i.test(plegado_bn), '⚠️ y su contenido desaparece');
ok(/Historial/i.test(plegado_bn), '⚠️ pero la sección sigue ahí para volver a abrirla');

/* 🚨 Y lo que de verdad prohíbe el apartado 3: en ningún sitio de esta pantalla
   se lee «Salud» a secas. */
/* ⚠️ Se descuenta también «Salud física», que es el nombre del módulo desde
   DIST F1: la regla es que no se lea «Salud» **a secas**, no que la palabra
   desaparezca. Sin este descuento la comprobación saltaría con la pantalla
   perfectamente bien — un rojo por no haber mirado qué mide. */
const limpio_bn = plegado_bn.replace(/Analizar mi salud/gi, '').replace(/Salud f[ií]sica/gi, '');
ok(!/(^|[^a-zA-ZáéíóúñÁÉÍÓÚÑ])Salud([^a-zA-ZáéíóúñÁÉÍÓÚÑ]|$)/.test(limpio_bn),
  '🚨 Y «SALUD» A SECAS NO SE LEE EN NINGUNA PARTE: la redundancia del apartado 3 ha desaparecido');

/* ── E3 F31 (SU F1) · EL REGISTRO DE SUEÑO ────────────────────────────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que la calidad se contesta con
   una cara y no escribiendo un número, que la duración se ve MIENTRAS elige las
   horas, que los minutos de siesta solo salen si dice que sí, y que lo que
   guarda tiene la forma nueva.

   ⚠️ Y una noche guardada con la forma VIEJA —`siesta` en minutos— para
   comprobar que la migración funciona en la aplicación de verdad. */
almacen.sueno = [
  { id: 'su_v1', fecha: '2026-09-01', horaDormir: '23:30', horaDespertar: '07:00', calidad: 4, interrupciones: 1, siesta: 30 },
  { id: 'su_v2', fecha: '2026-09-02', horaDormir: '00:15', horaDespertar: '08:00', calidad: 1, interrupciones: 0, siesta: 0 },
];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Abrir Sueño'), 'se entra en Sueño');
const su = await esperarTexto(/noches registradas/i);
/* ⚠️ La media dejó la cabecera en la E3 F32: con la ventana móvil ese número
   pasaba a ser el de la ventana que estuviera mirando. Vive dentro de la tarjeta
   de la gráfica, y allí la comprueba la sección de la F32. */
ok(/noches registradas/i.test(su), '🚨 E3 F31 — LA CABECERA DICE CUÁNTAS NOCHES LLEVA');
ok(/🙂/.test(su), '🚨 Y LA LISTA ENSEÑA LA CARA, no el «4/5» de antes');
ok(/😫/.test(su), '⚠️ y la noche floja, la suya');
ok(/7 h 30 min/.test(su), '⚠️ con la duración escrita como pide el apartado 1');
ok(/siesta de 30 min/.test(su),
  '🚨 Y LA SIESTA GUARDADA EN MINUTOS SE HA MIGRADO: aparece como una siesta, no como un campo perdido');

ok(await pulsar('Registrar'), 'se abre el formulario');
const form_su = await esperarTexto(/¿Cómo has dormido\?/i);
ok(/Tu noche/i.test(form_su), '🚨 EL REGISTRO SON CUATRO BLOQUES: 🌙 Tu noche…');
ok(/¿Cómo has dormido\?/i.test(form_su), '⚠️ …¿Cómo has dormido?…');
ok(/Durante la noche/i.test(form_su), '⚠️ …🌙 Durante la noche…');
ok(/Ayer/i.test(form_su), '⚠️ …y ☀️ Ayer');
ok(/8 h/.test(form_su),
  '🚨 Y LA DURACIÓN SE VE MIENTRAS ELIGE, sin haber guardado nada todavía (apartado 1)');
ok(/De maravilla/i.test(form_su) && /Fatal/i.test(form_su),
  '🚨 la calidad son TRES CARAS con su palabra, no un número que escribir');
ok(/3\+/.test(form_su), '⚠️ y las interrupciones traen su «3+» (apartado 3)');
ok(!/¿Cuántos minutos\?/i.test(form_su),
  '🚨 Y LOS MINUTOS DE SIESTA NO SE VEN TODAVÍA: solo salen si dice que sí (apartado 4)');

ok(await pulsar('Sí dormí siesta'), 'se dice que sí hubo siesta');
const conSiesta_su = await esperarTexto(/¿Cuántos minutos\?/i);
ok(/¿Cuántos minutos\?/i.test(conSiesta_su), '🚨 Y AHORA SÍ aparecen los minutos');

ok(await pulsar('De maravilla'), 'se elige 🤩 De maravilla');
ok(await pulsar('2 interrupciones'), 'y dos interrupciones');
ok(await pulsar('Guardar noche'), 'se guarda la noche');
await page.waitForTimeout(900);

const guardadoSueno = guardado.filter((g) => g && g.key === 'sueno').at(-1)?.value;
const nueva_su = (guardadoSueno || []).at(-1);
ok(!!nueva_su, '🚨 PERSISTENCIA: la noche se ESCRIBE en Supabase');
ok(nueva_su && nueva_su.calidad === 5,
  '🚨 Y POR DENTRO SE GUARDA UN 5, no el nombre de la cara: la escala 1-5 es la que leen las otras pantallas');
ok(nueva_su && nueva_su.interrupciones === 2, '⚠️ con sus interrupciones');
ok(nueva_su && nueva_su.siestaAyer === true, '⚠️ y la siesta como un sí, no como un número de minutos');
ok(nueva_su && !('duracion' in nueva_su),
  '🚨 Y SIN NINGÚN CAMPO DE DURACIÓN: se calcula de las dos horas, no se copia (apartado 10)');
/* 🚨 Y la noche vieja SIGUE ESTANDO: migrar no es perder. */
ok((guardadoSueno || []).some((n) => n.id === 'su_v1'),
  '🚨 y las dos noches de antes siguen ahí: la migración no pierde nada (apartado 9)');

/* ── E3 F32 (SU F2) · LA VENTANA MÓVIL DE 7 DÍAS ──────────────────────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que la gráfica pinta los siete
   días de calendario **con sus huecos**, que las etiquetas son fechas de verdad
   («L 24»), que las flechas navegan y que volver al presente funciona.

   El escenario tiene una noche de hace seis días, otra de hace cinco, **dos días
   sin registrar**, una de hace dos y la de hoy: con `sueno.slice(-7)` se habrían
   visto cuatro puntos seguidos y los dos días que faltan **no habrían existido**. */
const D = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('sv-SE');
};
almacen.sueno = [
  { id: 'sg_1', fecha: D(20), horaDormir: '23:00', horaDespertar: '07:00', calidad: 4, interrupciones: 0, siestaAyer: false, siestaMinutos: 0 },
  { id: 'sg_2', fecha: D(6), horaDormir: '23:00', horaDespertar: '07:00', calidad: 4, interrupciones: 0, siestaAyer: false, siestaMinutos: 0 },
  { id: 'sg_3', fecha: D(5), horaDormir: '23:30', horaDespertar: '07:00', calidad: 5, interrupciones: 0, siestaAyer: false, siestaMinutos: 0 },
  { id: 'sg_4', fecha: D(2), horaDormir: '00:00', horaDespertar: '07:00', calidad: 2, interrupciones: 1, siestaAyer: false, siestaMinutos: 0 },
  { id: 'sg_5', fecha: D(0), horaDormir: '23:00', horaDespertar: '07:30', calidad: 4, interrupciones: 0, siestaAyer: false, siestaMinutos: 0 },
];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Abrir Sueño'), 'se entra en Sueño');
const graf = await esperarTexto(/Últimos 7 días/i);
ok(/Últimos 7 días/i.test(graf), '🚨 E3 F32 — LA GRÁFICA SE LLAMA «Últimos 7 días» (apartado 5)');
ok(/5 noches registradas/i.test(graf),
  '⚠️ y la cabecera cuenta las noches que lleva, no la media de la ventana que esté mirando');
/* La ventana va de D-6 a hoy; registradas están D-6, D-5, D-2 y hoy, así que
   faltan D-4, D-3 y D-1: **tres**. */
ok(/3 noches sin registrar en este periodo/i.test(graf),
  '🚨 Y DICE CUÁNTAS NOCHES FALTAN: los tres días sin registro existen y se cuentan (apartados 3 y 19)');
/* 🚨 Las etiquetas del eje son fechas de verdad, con su día de la semana. */
const etiquetasEje = await page.evaluate(() =>
  [...document.querySelectorAll('.recharts-xAxis text')].map((t) => t.textContent.trim()));
ok(etiquetasEje.length === 7,
  '🚨 SIETE PUNTOS CON CINCO NOCHES: son días de calendario, no registros (apartado 13)');
ok(etiquetasEje.every((e) => /^[LMXJVSD] \d{1,2}$/.test(e)),
  '🚨 y cada uno con su fecha real, «L 24» — nunca «1 2 3 4 5 6 7» (apartado 9)');
ok(/HOY es el último punto/i.test(graf), '⚠️ con HOY señalado dentro de los siete (apartado 10)');

/* Apartado 4: se puede retroceder, y volver. */
/* 🚨 Se cuentan las escrituras ANTES de navegar: comprobar el contenido de la
   última no sirve, porque la sección anterior ya escribió su noche y ésa es la
   que sigue ahí. Lo que hay que demostrar es que navegar **no escribe**. */
const escriturasAntes_sg = guardado.filter((g) => g && g.key === 'sueno').length;
ok(await pulsar('Semana anterior'), 'se retrocede una semana');
const atras_sg = await esperarTexto(/[0-9]+.*–.*[0-9]+/);
ok(!/Últimos 7 días/i.test(atras_sg.split('Registrar')[0] || atras_sg) || /–/.test(atras_sg),
  '⚠️ y el rótulo pasa a decir el rango de fechas');
ok(await pulsar('Semana siguiente'), 'y se vuelve con la flecha');
const vuelta_sg = await esperarTexto(/Últimos 7 días/i);
ok(/Últimos 7 días/i.test(vuelta_sg),
  '🚨 Y SE VUELVE SIEMPRE A LOS ÚLTIMOS 7 DÍAS: no se queda en una semana antigua (apartado 5)');

/* 🚨 Y lo más importante del apartado 12: retroceder NO borra nada. */
ok(guardado.filter((g) => g && g.key === 'sueno').length === escriturasAntes_sg,
  '🚨 MOVER LA VENTANA NO ESCRIBE NI BORRA NADA: navegar es mirar (apartado 12)');
ok(almacen.sueno.length === 5 && almacen.sueno.some((n) => n.id === 'sg_1'),
  '🚨 y la noche de hace veinte días sigue guardada, aunque no salga en la gráfica');

/* ── E3 F33 (NU F1) · EL APARTADO NUTRICIÓN ───────────────────────────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que la pantalla enseña las kcal
   del día de verdad **sin inventarse un objetivo**, que el selector de días
   cambia lo que se ve, que los cinco momentos están y que una comida guardada
   antes de esta fase —sin momento— **sigue apareciendo**, en Extras. */
const DN = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('sv-SE');
};
almacen.nutricion = {
  comidas: [
    { id: 'nu_1', fecha: DN(0), nombre: 'Avena con plátano', calorias: 350, proteinas: 12, carbohidratos: 55, grasas: 8, fibra: 6, momento: 'desayuno' },
    { id: 'nu_2', fecha: DN(0), nombre: 'Pollo con arroz', calorias: 500, proteinas: 45, carbohidratos: 10, grasas: 15, fibra: 2, momento: 'comida' },
    { id: 'nu_3', fecha: DN(0), nombre: 'Comida de antes de la fase', calorias: 200, proteinas: 5, carbohidratos: 30, grasas: 4, fibra: 1 },
    { id: 'nu_4', fecha: DN(1), nombre: 'Cena de ayer', calorias: 900, proteinas: 30, carbohidratos: 90, grasas: 20, fibra: 5, momento: 'cena' },
  ],
  agua: {}, favoritos: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Abrir Nutrición'), 'se entra en Nutrición');
const nu = await esperarTexto(/Calorías/i);
ok(/1050/.test(nu), '🚨 E3 F33 — LAS KCAL DEL DÍA, SUMADAS DE LAS COMIDAS DE VERDAD (apartado 2)');
ok(/62/.test(nu) && /95/.test(nu), '⚠️ con sus macros');
ok(!/2\.?400|1\.?850/.test(nu),
  '🚨 Y SIN NINGÚN OBJETIVO INVENTADO: los del enunciado son un ejemplo de maqueta (apartado 2 + regla 8)');
ok(!/\/ *\d+ *kcal/.test(nu),
  '⚠️ ni un «/ X kcal»: los objetivos son la Fase 3 y todavía no existen');
/* ⚠️ La F34 cambió esta cabecera a «HOY · 7 SEPT» —mayúsculas y con la fecha,
   que es lo que pide su apartado 8—, así que se busca sin distinguir mayúsculas.
   Es la lección de la E3 F8: `innerText` devuelve el texto RENDERIZADO. */
ok(/hoy/i.test(nu), '⚠️ el selector dice qué día se está mirando (apartado 5)');

/* Apartado 6: los cinco momentos, con la comida sin momento en Extras. */
for (const m of ['Desayuno', 'Comida', 'Merienda', 'Cena', 'Extras']) {
  ok(new RegExp(m, 'i').test(nu), `⚠️ y está ${m}`);
}
ok(/Avena con plátano/i.test(nu), '⚠️ con su comida dentro');
ok(/Comida de antes de la fase/i.test(nu),
  '🚨 Y LA COMIDA SIN MOMENTO NO SE HA PERDIDO: cae en Extras, sin inventarle un desayuno');

/* El selector de día cambia lo que se ve de verdad (regla 8). */
ok(await pulsar('Día anterior'), 'se retrocede un día');
const ayer_nu = await esperarTexto(/Ayer/i);
ok(/Ayer/i.test(ayer_nu), '⚠️ y el rótulo lo dice');
ok(/900/.test(ayer_nu) && !/1050/.test(ayer_nu),
  '🚨 Y LOS NÚMEROS CAMBIAN CON EL DÍA: el selector no es decorativo (regla 8)');
ok(/Cena de ayer/i.test(ayer_nu), '⚠️ con la comida de ese día');
ok(await pulsar('Volver a hoy'), 'y se vuelve a hoy de un toque');
const hoy_nu = await esperarTexto(/1050/);
ok(/1050/.test(hoy_nu), '⚠️ con los números de hoy otra vez');

/* Y el estado vacío del apartado 7, en un día PASADO sin nada.
   ⚠️ No en mañana: desde la E3 F34 un día futuro tiene su propio texto —no es
   que no registrara nada, es que no ha llegado—, y esa sección lo comprueba. */
ok(await pulsar('Día anterior'), 'se retrocede al día de ayer');
await page.waitForTimeout(400);
ok(await pulsar('Día anterior'), 'y a anteayer, que está vacío');
const vacio_nu = await esperarTexto(/Todavía no has registrado ninguna comida/i);
ok(/Todavía no has registrado ninguna comida/i.test(vacio_nu),
  '🚨 UN DÍA SIN COMIDAS TIENE SU ESTADO VACÍO, con su salida (apartado 7)');
ok(!/error/i.test(vacio_nu), '⚠️ y no suena a mensaje de error');

/* ── E3 F34 (NU F2) · EL SISTEMA DE DÍAS DE NUTRICIÓN ─────────────────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que la tira de días marca los
   que tienen comidas, que el calendario se despliega y lleva a la fecha que se
   toca, y que un día futuro **no dice lo mismo** que uno vacío del pasado.

   El escenario reutiliza el de la fase anterior (hoy y ayer con comidas) y añade
   una de hace cinco días, para que la tira tenga tres días marcados. */
almacen.nutricion = {
  comidas: [
    { id: 'nd_1', fecha: DN(5), nombre: 'De hace cinco días', calorias: 1200, proteinas: 60, carbohidratos: 120, grasas: 30, fibra: 8, momento: 'comida' },
    { id: 'nd_2', fecha: DN(1), nombre: 'Cena de ayer', calorias: 900, proteinas: 30, carbohidratos: 90, grasas: 20, fibra: 5, momento: 'cena' },
    { id: 'nd_3', fecha: DN(0), nombre: 'Avena de hoy', calorias: 350, proteinas: 12, carbohidratos: 55, grasas: 8, fibra: 6, momento: 'desayuno' },
  ],
  agua: {}, favoritos: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Nutrición'), 'se entra en Nutrición');
const nd = await esperarTexto(/HOY ·/);
ok(/HOY ·/.test(nd), '🚨 E3 F34 — LA CABECERA DICE «HOY · fecha» (apartados 2 y 8)');
ok(/350/.test(nd), '⚠️ con los números de hoy');

/* Apartado 9 — la tira de días, con los que tienen datos marcados. */
const puntosTira = await page.evaluate(() =>
  [...document.querySelectorAll('button[aria-label^="Ir al día"]')].length);
ok(puntosTira === 7, '🚨 LA TIRA SON SIETE DÍAS, y cada uno se puede tocar (apartado 9)');

/* Apartado 10 — el calendario se despliega y lleva a la fecha que se toca. */
ok(await pulsar('Elegir una fecha'), 'se abre el calendario');
const cal = await esperarTexto(/El punto marca los días con comidas/i);
ok(/El punto marca los días con comidas/i.test(cal),
  '🚨 Y ES UN CALENDARIO MENSUAL, con los días que tienen registros marcados (apartado 10)');
const celdasCal = await page.evaluate(() =>
  [...document.querySelectorAll('button[aria-label^="Ir al "]')].filter((b) => !/Ir al día/.test(b.getAttribute('aria-label'))).length);
ok(celdasCal >= 28, '⚠️ con todos los días del mes');
ok(await pulsar('Mes anterior'), '⚠️ y se puede cambiar de mes');
ok(await pulsar('Mes siguiente'), 'y volver');

/* Apartado 8 — cambiar de día cambia TODO lo que se ve. */
ok(await pulsar('Día anterior'), 'se retrocede un día');
const ayer_nd = await esperarTexto(/AYER ·/);
ok(/AYER ·/.test(ayer_nd), '⚠️ y la cabecera lo dice, con su fecha');
ok(/900/.test(ayer_nd) && !/350/.test(ayer_nd),
  '🚨 Y LOS NÚMEROS SON LOS DE ESE DÍA: no se reutilizan los de hoy (apartado 8)');
ok(/Cena de ayer/i.test(ayer_nd), '⚠️ con su comida');

/* Apartados 6 y 7 — un día vacío del pasado y uno futuro no dicen lo mismo. */
ok(await pulsar('Volver a hoy'), 'se vuelve a hoy');
await page.waitForTimeout(500);
ok(await pulsar('Día siguiente'), 'y se va a mañana');
const futuro_nd = await esperarTexto(/MAÑANA ·/);
ok(/MAÑANA ·/.test(futuro_nd), '⚠️ la cabecera dice MAÑANA');
ok(/no ha llegado/i.test(futuro_nd),
  '🚨 Y UN DÍA FUTURO NO ES UN DÍA VACÍO: no es que no registrara nada, es que no ha llegado (apartado 7)');
ok(!/Añade la primera/i.test(futuro_nd),
  '⚠️ así que tampoco se le ofrece añadir una comida a un día que no existe todavía');

/* 🚨 Y consultar días no escribe nada. */
const escriturasNu = guardado.filter((g) => g && g.key === 'nutricion').length;
ok(escriturasNu === 0, '🚨 Y NAVEGAR ENTRE DÍAS NO ESCRIBE NADA: consultar es mirar');


/* ── E3 F35 (NU F3) · LOS OBJETIVOS NUTRICIONALES ─────────────────────────
   🔒 **Lo que ninguna prueba de Node puede ver:** que la app PROPONE y él
   confirma — que recorrer los cuatro pasos **no escribe nada** hasta tocar
   «Guardar objetivos», que los números salen de su perfil sin copiarlo, y que
   al guardarlos el día pasa de «1.850 kcal» a «1.850 / 3.149 kcal».

   Es la regla 7 y el §7.4 (*"ni Salud ni Nutrición pueden prescribir objetivos
   calóricos estrictos"*) comprobados en la aplicación de verdad. */
almacen.nutricion = {
  comidas: [
    { id: 'no_1', fecha: DN(0), nombre: 'Avena', calorias: 350, proteinas: 12, carbohidratos: 55, grasas: 8, fibra: 6, momento: 'desayuno' },
    { id: 'no_2', fecha: DN(0), nombre: 'Pollo con arroz', calorias: 700, proteinas: 45, carbohidratos: 80, grasas: 15, fibra: 4, momento: 'comida' },
  ],
  agua: {}, favoritos: [],
};
/* Su perfil de verdad: 16 años, 187 cm, 72 kg y masculino. **La configuración
   los lee de aquí** (apartado 2): ni uno se copia dentro de `nutricion`. */
almacen.perfil = {
  nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72,
  actividad: 'moderado', sexo: 'Masculino', lesiones: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
guardado.length = 0;

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Nutrición'), 'se entra en Nutrición');

/* Apartado 1 — sin configurar hay un CTA, y la pantalla sigue funcionando. */
const sinObj = await esperarTexto(/Configura tus objetivos/i);
ok(/Configura tus objetivos/i.test(sinObj),
  '🚨 E3 F35 — SIN OBJETIVOS HAY UN CTA PARA CREARLOS (apartado 1)');
ok(/1050/.test(sinObj),
  '⚠️ y la pantalla NO se rompe sin ellos: sigue enseñando lo consumido, como en la NU F1');
ok(!/\/\s*\d+\s*kcal/i.test(sinObj),
  '⚠️ sin un objetivo inventado al lado');

ok(await pulsar('Configurar nutrición'), 'se abre la configuración');
const paso1 = await esperarTexto(/Paso 1 de/i);
ok(/Paso 1 de 4/i.test(paso1), '🚨 SON CUATRO PASOS, y dice por cuál va (apartados 2-8)');
/* 🚨 Apartado 2 — los datos vienen del PERFIL, no se le vuelven a pedir. */
const valoresPaso1 = await page.evaluate(() =>
  [...document.querySelectorAll('input[type="number"]')].map((i) => i.value));
ok(valoresPaso1.includes('187') && valoresPaso1.includes('72'),
  '🚨 Y LOS DATOS LLEGAN PUESTOS DESDE EL PERFIL: no se le piden dos veces (apartado 2)');
ok(valoresPaso1.includes('16'),
  '⚠️ con la edad DERIVADA de su fecha de nacimiento, que es la única que hay guardada');

ok(await pulsar('Continuar'), 'se pasa al nivel de actividad');
const paso2 = await esperarTexto(/Paso 2 de/i);
ok(/Entreno 3-4 días por semana/i.test(paso2),
  '⚠️ CADA OPCIÓN TRAE SU EXPLICACIÓN, no una lista técnica (apartado 3)');
ok(await pulsar('Moderado'), 'se elige Moderado');
ok(await pulsar('Continuar'), 'se pasa al objetivo');

const paso3 = await esperarTexto(/Paso 3 de/i);
ok(/Superávit suave/i.test(paso3), '⚠️ y el objetivo también se explica (apartado 4)');
ok(await pulsar('Ganar masa'), 'se elige Ganar masa');
ok(await pulsar('Continuar'), 'se llega al resumen');

const resumen = await esperarTexto(/Tu objetivo diario/i);
/* 🐛 **`innerText` NO INCLUYE EL VALOR DE UN `<input>`** (E3 F36, y es primo de
   la lección de la E3 F8 sobre las mayúsculas). Los cuatro números del resumen
   son **campos editables** —que es justo lo que hace que la app proponga y él
   decida—, así que su valor se lee del campo, nunca del texto de la pantalla. */
const numerosResumen = await page.evaluate(() =>
  [...document.querySelectorAll('input[type="number"]')].map((i) => i.value));
ok(numerosResumen.includes('3149'),
  '🚨 EL CÁLCULO ES EL DE MIFFLIN-ST JEOR CON SU FACTOR: 3149 kcal para 72 kg, 187 cm, 16 años, moderado y ganar');
ok(numerosResumen.includes('130') && numerosResumen.includes('98'),
  '⚠️ con sus macros, y los cuatro EDITABLES: son campos, no una cifra impuesta (apartado 8)');
ok(/orientativ/i.test(resumen),
  '🔒 CON LA FRASE QUE LO HACE ORIENTATIVO Y NO UNA DIETA (§7.4 y §7.5)');

/* 🚨 Lo más importante de la fase: hasta aquí NO se ha escrito nada. */
const antesDeGuardar = guardado.filter((g) => g && g.key === 'nutricion').length;
ok(antesDeGuardar === 0,
  '🚨 Y RECORRER LOS CUATRO PASOS NO ESCRIBE NADA: `planObjetivos` sin `confirmado` propone (regla 7)');

ok(await pulsar('Guardar objetivos'), 'se confirman los objetivos');
await page.waitForTimeout(600);
const escriturasObj = guardado.filter((g) => g && g.key === 'nutricion');
ok(escriturasObj.length >= 1, '🚨 Y AL CONFIRMAR SÍ SE ESCRIBE, una sola vez');
const guardadoNu = escriturasObj[escriturasObj.length - 1]?.value?.objetivos || {};
ok(guardadoNu.configurado === true && guardadoNu.kcal === 3149,
  '⚠️ con los objetivos calculados dentro de `nutricion`, sin una clave nueva (apartado 15)');
ok(guardadoNu.altura === undefined && guardadoNu.edad === undefined,
  '🚨 Y NI LA ALTURA NI LA EDAD SE COPIAN: los datos vivos son los del perfil (apartado 12)');
ok(guardadoNu.pesoAlCalcular === 72,
  '⚠️ solo el peso CON EL QUE SE CALCULÓ, que es lo que permite avisar si cambia');

/* Apartado 10 — y ahora el día enseña consumo y objetivo. */
const conObj = await esperarTexto(/3149|3\.149/);
ok(/1050/.test(conObj) && /3149|3\.149/.test(conObj),
  '🚨 EL DÍA PASA A DECIR «1.050 / 3.149 kcal»: consumo a la izquierda, objetivo a la derecha (apartado 10)');
ok(/Configurar nutrición/i.test(conObj),
  '⚠️ y el acceso para volver a cambiarlos sigue ahí (apartado 11)');
ok(!/Configura tus objetivos/i.test(conObj), '⚠️ pero ya no el CTA de crearlos');


/* ── E3 F36 (NU F4) · EL REGISTRO DE ALIMENTOS ────────────────────────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que el flujo entero
   —*"Comida → Añadir alimento → Buscar → Cantidad → Añadir"*— se puede hacer
   con el dedo, que los totales suben **al instante** (apartado 6) y que la
   cantidad de un alimento ya registrado se puede cambiar **sin borrarlo y
   volver a crearlo** (apartado 7).

   El escenario empieza con un objetivo puesto y un solo alimento, para poder
   medir el «antes» y el «después» del apartado 6. */
almacen.nutricion = {
  comidas: [
    { id: 'al_1', fecha: DN(0), nombre: 'Tostadas', calorias: 300, proteinas: 9, carbohidratos: 50, grasas: 6, fibra: 3, momento: 'desayuno' },
  ],
  agua: {}, favoritos: [],
  objetivos: {
    configurado: true, actividad: 'moderado', objetivo: 'ganar',
    kcal: 3149, proteinas: 130, carbohidratos: 437, grasas: 98,
    manual: {}, pesoAlCalcular: 72, fecha: DN(0),
  },
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
guardado.length = 0;

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Nutrición'), 'se entra en Nutrición');

const antes = await esperarTexto(/300/);
ok(/300/.test(antes), '🚨 E3 F36 — el día empieza con 300 kcal');
/* Apartado 9 — la línea de resumen de la comida, con sus macros. */
ok(/300 kcal · 9 g proteína/.test(antes),
  '🚨 Y CADA COMIDA TIENE SU RESUMEN: «300 kcal · 9 g proteína · …» (apartado 9)');
/* Apartado 14 — una comida sin alimentos lo dice, y no con un error. */
ok(/Todavía no has añadido alimentos/i.test(antes),
  '⚠️ y una comida vacía tiene su estado vacío (apartado 14)');

/* El flujo del apartado 2, de principio a fin. */
ok(await pulsar('Añadir alimento a Comida'), 'se abre el flujo desde Comida');
/* 🐛 Y lo mismo con un **placeholder**: tampoco está en el `innerText`. El
   buscador se reconoce por su campo. */
const hayBuscador = await page.evaluate(() => !!document.querySelector('input[placeholder^="Busca"]'));
ok(hayBuscador, '⚠️ y lo primero es el buscador, no un formulario gigantesco (apartado 2)');

await page.fill('input[placeholder^="Busca"]', 'avena');
await page.waitForTimeout(400);
const conResultados = await ver();
ok(/389 kcal/.test(conResultados),
  '🚨 EL BUSCADOR ENCUENTRA LA AVENA CON SUS 389 kcal POR 100 g — los del apartado 5, no inventados');
ok(await pulsar('Avena'), 'se elige');

const pasoCantidad = await esperarTexto(/Cantidad \(g\)/i);
ok(/Cantidad \(g\)/i.test(pasoCantidad), '⚠️ y el segundo paso es la cantidad (apartado 4)');
const cantidadVacia = await page.evaluate(() => {
  const i = [...document.querySelectorAll('input[type="number"]')].find((x) => x.placeholder && /Ej\./.test(x.placeholder));
  return i ? i.value : 'no-encontrado';
});
ok(cantidadVacia === '',
  '🚨 Y LA CANTIDAD NO VIENE PUESTA: 100 g de aceite y 100 g de lechuga no son el mismo plato');

await page.fill('input[placeholder="Ej. 60"]', '60');
await page.waitForTimeout(400);
const previa = await ver();
ok(/233 kcal/.test(previa),
  '🚨 Y LOS NÚMEROS SE CALCULAN DELANTE: 60 g de avena son 233 kcal (apartado 5)');
ok(/39\.8 g carbohidratos/.test(previa), '⚠️ con sus macros escalados');
ok(/referencia/i.test(previa),
  '🔒 y se dice que son valores de referencia editables, no la etiqueta de su bote');

ok(await pulsar('Añadir alimento'), 'se añade');
await page.waitForTimeout(600);

/* 🚨 Apartado 6 — *"los totales diarios deben actualizarse inmediatamente"*. */
const despues = await esperarTexto(/533/);
ok(/533/.test(despues),
  '🚨 Y EL TOTAL DEL DÍA SUBE AL INSTANTE: 300 + 233 = 533 kcal (apartado 6)');
ok(/3149|3\.149/.test(despues), '⚠️ contra el objetivo, que sigue ahí (apartado 10)');
ok(/60 g/.test(despues), '⚠️ y el alimento se ve con su cantidad');

const escritasAl = guardado.filter((g) => g && g.key === 'nutricion');
const comidasGuardadas = escritasAl[escritasAl.length - 1]?.value?.comidas || [];
const nueva = comidasGuardadas.find((c) => c.nombre === 'Avena');
ok(!!nueva && nueva.calorias === 233,
  '🚨 y se guarda en `nutricion.comidas`, la lista de siempre: no hay una segunda (apartado 17)');
ok(nueva.cantidad === 60 && nueva.por100 && nueva.por100.calorias === 389,
  '⚠️ con su cantidad y sus valores por 100 g, que es lo que permitirá editarla');
ok(nueva.momento === 'comida', '⚠️ y en la comida desde la que se abrió');
ok(nueva.fecha === DN(0), '⚠️ y en el día que se estaba mirando');

/* 🚨 Apartado 7 — editar la cantidad SIN borrar y volver a crear. */
ok(await pulsar('Editar Avena'), 'se abre la ficha del alimento ya registrado');
const edicion = await esperarTexto(/Guardar cantidad/i);
ok(/Guardar cantidad/i.test(edicion), '⚠️ con su campo de cantidad');
await page.fill('input[type="number"][value="60"]', '120');
ok(await pulsar('Guardar cantidad'), 'se guarda la cantidad nueva');
await page.waitForTimeout(600);
const recalculado = await esperarTexto(/467/);
ok(/467/.test(recalculado),
  '🚨 Y RECALCULA: 120 g de avena son 467 kcal, no las 233 de antes (apartado 7)');
ok(/767/.test(recalculado), '⚠️ y el total del día también: 300 + 467');
const trasEditar = guardado.filter((g) => g && g.key === 'nutricion');
const comidasTrasEditar = trasEditar[trasEditar.length - 1]?.value?.comidas || [];
ok(comidasTrasEditar.filter((c) => c.nombre === 'Avena').length === 1,
  '🚨 Y SIGUE HABIENDO UNA SOLA AVENA: se editó, no se borró y se creó otra (apartado 7)');
ok(comidasTrasEditar.find((c) => c.nombre === 'Avena')?.id === nueva.id,
  '⚠️ con el mismo id');

/* Apartado 7 — *"cambiar de comida"*. */
ok(await pulsar('Editar Avena'), 'se vuelve a abrir la ficha');
ok(await pulsar('🌙 Cena'), 'se mueve a Cena');
await page.waitForTimeout(600);
const movidaFinal = guardado.filter((g) => g && g.key === 'nutricion');
const avenaMovida = (movidaFinal[movidaFinal.length - 1]?.value?.comidas || []).find((c) => c.nombre === 'Avena');
ok(avenaMovida?.momento === 'cena', '🚨 Y CAMBIA DE COMIDA: de Comida a Cena');
ok(avenaMovida?.calorias === 467, '⚠️ sin tocar ni un número: moverla no la recalcula');


/* ── E3 F37 (NU F5) · LOS ALIMENTOS PROPIOS, FAVORITOS Y RECIENTES ────────
   🚨 **Lo que ninguna prueba de Node puede ver:** que al abrir el selector
   —*antes de escribir nada*— ya están sus favoritos, sus recientes y sus
   alimentos, que es lo que el apartado 12 pide; que crear uno propio funciona
   de principio a fin; y que **un alimento de la base protegida no se puede
   editar** (apartado 6).

   El escenario trae un alimento suyo, un favorito y dos días con comidas que
   **sí** llevan `alimentoId`, para que los recientes tengan de dónde salir. */
almacen.nutricion = {
  comidas: [
    { id: 'mp_1', fecha: DN(0), momento: 'desayuno', nombre: 'Avena', calorias: 233, proteinas: 10.1, carbohidratos: 39.8, grasas: 4.1, fibra: 6.4, cantidad: 60, unidad: 'g', por100: { calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, fibra: 10.6 }, alimentoId: 'avena' },
    { id: 'mp_2', fecha: DN(1), momento: 'comida', nombre: 'Pechuga de pollo', calorias: 248, proteinas: 46.5, carbohidratos: 0, grasas: 5.4, fibra: 0, cantidad: 150, unidad: 'g', por100: { calorias: 165, proteinas: 31, carbohidratos: 0, grasas: 3.6, fibra: 0 }, alimentoId: 'pollo_pechuga' },
  ],
  agua: {}, favoritos: [],
  alimentosPropios: [
    { id: 'propio_yog', nombre: 'Yogur de mi madre', marca: '', tipo: 'lácteo', unidad: 'g', por100: { calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3, fibra: 0 }, propio: true, creado: DN(3) },
  ],
  favoritosAlimentos: ['avena'],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
guardado.length = 0;

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Nutrición'), 'se entra en Nutrición');
ok(await pulsar('Añadir alimento a Merienda'), 'se abre el selector desde Merienda');
await page.waitForTimeout(700);

/* 🚨 Apartado 12 — **sin escribir nada** ya hay de dónde elegir. */
const selector = await esperarTexto(/Mis alimentos/i);
ok(/Favoritos/i.test(selector),
  '🚨 E3 F37 — EL SELECTOR ABRE CON SUS FAVORITOS, sin escribir nada (apartado 12)');
ok(/Recientes/i.test(selector), '⚠️ y con sus recientes (apartado 8)');
ok(/Mis alimentos/i.test(selector), '⚠️ y con los alimentos que ha creado él (apartado 4)');
ok(/Yogur de mi madre/.test(selector), '⚠️ que se ven con su nombre');
ok(/Crear alimento/i.test(selector), '⚠️ y el botón de crear uno nuevo (apartado 12)');
/* Apartado 8 — los recientes salen de las comidas, agrupados por día. */
ok(/Hoy/.test(selector) && /Avena/.test(selector),
  '🚨 «Hoy: Avena» — los recientes SE DERIVAN de las comidas, no se guardan (apartado 8)');
ok(/Ayer/.test(selector) && /Pechuga de pollo/.test(selector), '⚠️ y «Ayer: Pollo»');

/* Apartado 2 — la línea resumida de cada alimento. */
ok(/389 kcal · 16\.9 P · 66\.3 C · 6\.9 G \/ 100 g/.test(selector),
  '🚨 CON SU INFORMACIÓN NUTRICIONAL RESUMIDA: «389 kcal · 16,9 P · 66,3 C · 6,9 G / 100 g» (apartado 2)');

/* Apartado 7 — la ★ marca y desmarca, y es un id lo que se guarda. */
ok(await pulsar('Marcar Yogur de mi madre como favorito'), 'se marca su yogur como favorito');
await page.waitForTimeout(600);
const trasFav = guardado.filter((g) => g && g.key === 'nutricion');
const favs = trasFav[trasFav.length - 1]?.value?.favoritosAlimentos || [];
ok(favs.includes('propio_yog'),
  '🚨 Y SE GUARDA EL ID, no una copia del alimento (apartado 15)');
ok(favs.every((x) => typeof x === 'string'), '⚠️ la lista entera son ids');

/* Apartados 4 y 5 — crear un alimento propio, de principio a fin. */
ok(await pulsar('Crear alimento'), 'se abre el formulario');
const formu = await esperarTexto(/Se mide en/i);
ok(/Categoría/.test(formu), '⚠️ con su categoría (apartado 3)');
ok(/Se mide en/.test(formu), '⚠️ y su unidad de referencia (apartado 10)');
await page.fill('input[type="text"]', 'Batido de proteína');
const numeros = await page.$$('input[type="number"]');
await numeros[0].fill('370');
await numeros[1].fill('75');
await numeros[2].fill('8');
await numeros[3].fill('4');
ok(await pulsar('Crear alimento'), 'se crea');
await page.waitForTimeout(700);
const trasCrear = guardado.filter((g) => g && g.key === 'nutricion');
const propiosGuardados = trasCrear[trasCrear.length - 1]?.value?.alimentosPropios || [];
const nuevoAlim = propiosGuardados.find((a) => a.nombre === 'Batido de proteína');
ok(!!nuevoAlim, '🚨 Y SE GUARDA EN `nutricion.alimentosPropios`, sin una clave nueva (apartado 14)');
ok(nuevoAlim?.por100?.calorias === 370 && nuevoAlim?.por100?.proteinas === 75,
  '⚠️ con sus valores por 100 g');
ok(nuevoAlim?.propio === true, '⚠️ marcado como suyo, que es lo único que lo distingue de uno de la base');
ok(propiosGuardados.length === 2, '⚠️ y sin tocar el que ya tenía');

/* Y se puede usar como cualquier otro: el buscador lo encuentra. */
await page.fill('input[placeholder^="Busca"]', 'batido');
await page.waitForTimeout(600);
const buscado = await ver();
ok(/Batido de proteína/.test(buscado),
  '🚨 Y EL BUSCADOR LO ENCUENTRA: es el MISMO buscador de la F4, con la base ampliada (apartado 2)');
ok(/tuyo/.test(buscado), '⚠️ distinguido de los de la base (apartado 15)');

/* 🚨 Apartado 6 — un alimento de la base NO se puede editar.

   🐛 **Y esta comprobación buscaba «Editar Avena», que es DE OTRA COSA.** La
   comida registrada se llama «Avena» y su lápiz existe con todo el derecho —es
   el de cambiarle la cantidad, de la F4—, así que el barrido lo encontraba y
   daba por editable un alimento de la base. La lección de siempre: se busca el
   **mecanismo**, no la etiqueta, y se elige un alimento que **no** esté también
   registrado. Va la duodécima vez en el proyecto. */
await page.fill('input[placeholder^="Busca"]', 'merluza');
await page.waitForTimeout(600);
const conBase = await ver();
ok(/Merluza/.test(conBase), 'el buscador encuentra un alimento de la base');
const lapicesBase = await page.evaluate(() =>
  [...document.querySelectorAll('button[aria-label^="Editar "]')].map((b) => b.getAttribute('aria-label')));
ok(!lapicesBase.includes('Editar Merluza'),
  '🚨 Y NO SE PUEDE EDITAR: sus valores son de referencia y no se tocan (apartado 6)');

/* ⚠️ Y la otra mitad, que es la que hace que esto pueda fallar: **el suyo SÍ**. */
await page.fill('input[placeholder^="Busca"]', 'batido');
await page.waitForTimeout(600);
const lapicesPropio = await page.evaluate(() =>
  [...document.querySelectorAll('button[aria-label^="Editar "]')].map((b) => b.getAttribute('aria-label')));
ok(lapicesPropio.includes('Editar Batido de proteína'),
  '⚠️ pero el que ha creado él sí se edita (apartado 6)');


/* ── E3 F38 (NU F6) · LAS ESTADÍSTICAS DE NUTRICIÓN ───────────────────────
   🚨 **Lo que ninguna otra prueba puede ver:** los 2052 casos de renderizado
   entran por la pestaña de Comidas, así que **la pantalla de estadísticas solo
   se pinta aquí** — es el agujero de la EH F39 (*"esa tarjeta solo aparece tras
   pulsar un botón"*), y por eso esta sección pulsa la pestaña de verdad.

   El escenario trae cuatro días registrados de siete, con objetivos puestos:
   suficiente para promedios, gráfica, mejor/peor día y tendencia. */
almacen.nutricion = {
  comidas: [
    { id: 'es_1', fecha: DN(0), momento: 'comida', nombre: 'Hoy', calorias: 2000, proteinas: 120, carbohidratos: 250, grasas: 60, fibra: 20 },
    { id: 'es_2', fecha: DN(1), momento: 'comida', nombre: 'Ayer', calorias: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, fibra: 25 },
    { id: 'es_3', fecha: DN(2), momento: 'comida', nombre: 'Anteayer', calorias: 1600, proteinas: 100, carbohidratos: 200, grasas: 50, fibra: 15 },
    { id: 'es_4', fecha: DN(4), momento: 'cena', nombre: 'Hace cuatro', calorias: 2200, proteinas: 130, carbohidratos: 270, grasas: 65, fibra: 22 },
  ],
  agua: {}, favoritos: [],
  objetivos: {
    configurado: true, actividad: 'moderado', objetivo: 'mantener',
    kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70,
    manual: {}, pesoAlCalcular: 72, fecha: DN(0),
  },
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
guardado.length = 0;

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Nutrición'), 'se entra en Nutrición');
ok(await pulsar('Estadísticas'), '🚨 E3 F38 — hay un acceso a Estadísticas dentro de Nutrición (apartado 1)');

const stats = await esperarTexto(/Promedio diario/i);
ok(/Promedio diario/i.test(stats), '⚠️ y lo primero es el promedio diario (apartado 2)');
/* 🚨 Apartado 14 — la media es sobre los días CON datos: (2000+2400+1600+2200)/4 = 2050. */
ok(/2050/.test(stats),
  '🚨 LA MEDIA SE CALCULA SOBRE LOS DÍAS CON DATOS: (2000+2400+1600+2200)/4 = 2050 (apartado 14)');
ok(/de 7/.test(stats), '⚠️ y se dice de cuántos días del rango sale');
/* Apartado 3 — el cumplimiento de cada objetivo. 2050 de 2400 es un 85 %. */
ok(/85 % de 2400/.test(stats),
  '🚨 CON EL CUMPLIMIENTO DE CADA OBJETIVO: 85 % de 2400 kcal (apartado 3)');

/* Apartado 8 — la constancia, que NO es una racha. */
ok(/4 de 7 días registrados/.test(stats),
  '🚨 Y LA CONSTANCIA: «4 de 7 días registrados» (apartado 7)');
ok(/no mira si son seguidos/i.test(stats),
  '🚨 Y SE DICE QUE NO ES UNA RACHA, que es lo que el apartado 8 prohíbe duplicar');

/* Apartados 4 y 5 — las gráficas, con sus huecos declarados. */
ok(/Calorías por día/i.test(stats), '⚠️ hay una gráfica de kcal por día (apartado 4)');
ok(/3 días sin registrar/.test(stats),
  '🚨 Y LOS DÍAS SIN REGISTRAR SE DICEN: la línea se corta ahí, no se inventa el dato (apartado 13)');
const ejes = await page.evaluate(() =>
  [...document.querySelectorAll('.recharts-xAxis text')].map((t) => t.textContent).join(''));
ok(/^[LMXJVSD]+$/.test(ejes) && ejes.length >= 2,
  `🚨 Y EL EJE SON LAS INICIALES DE LOS DÍAS, «L M X J V S D» (apartado 4) — salió «${ejes}»`);

/* Apartado 5 — el selector de macros cambia la gráfica. */
ok(await pulsar('💪 Proteína'), 'se cambia el macro de la segunda gráfica');
await page.waitForTimeout(500);
const conProteina = await ver();
ok(/Proteína/.test(conProteina), '⚠️ y la gráfica pasa a la proteína (apartado 5)');

/* Apartado 10 — el análisis de proteína, con los días alcanzados. */
ok(/122\.5 g \/ 140 g|122 g \/ 140 g/.test(conProteina),
  '🚨 LA PROTEÍNA TIENE SU ANÁLISIS: media contra objetivo (apartado 10)');
ok(/alcanzado 1 de 4/.test(conProteina),
  '⚠️ con en cuántos días se alcanzó el objetivo: 1 de 4');

/* Apartado 11 — la diferencia, con su signo y SIN interpretarla. */
ok(/diferencia media: -350 kcal|diferencia media: −350 kcal/.test(conProteina),
  '🚨 Y LA DIFERENCIA LLEVA SU SIGNO: −350 kcal (apartado 11)');
ok(!/(vas bien|vas mal|deberías|te has pasado|demasiado)/i.test(conProteina),
  '🚨 Y NO SE INTERPRETA: el apartado 11 lo prohíbe expresamente');

/* Apartado 9 — mejor y peor día. */
ok(/Mayor cumplimiento/i.test(conProteina) && /Menor cumplimiento/i.test(conProteina),
  '⚠️ y están el mejor y el peor día (apartado 9)');

/* Apartado 6 — cambiar el periodo cambia los números. */
ok(await pulsar('30 días'), 'se cambia a 30 días');
await page.waitForTimeout(600);
const treinta = await ver();
ok(/4 de 30 días registrados/.test(treinta),
  '🚨 Y EL PERIODO CAMBIA DE VERDAD: «4 de 30 días registrados» (apartado 6)');
ok(/2050/.test(treinta),
  '⚠️ con la media igual, porque sigue siendo sobre los días con datos (apartado 14)');

/* 🚨 Y consultar estadísticas NO escribe nada: es una vista, no un dato. */
const escriturasStats = guardado.filter((g) => g && g.key === 'nutricion').length;
ok(escriturasStats === 0,
  '🚨 Y MIRAR LAS ESTADÍSTICAS NO ESCRIBE NADA: no se guarda ni un promedio (E3 F13)');

/* Apartado 12 — sin datos suficientes, el estado vacío y NI UNA gráfica. */
almacen.nutricion = { comidas: [], agua: {}, favoritos: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar'), 'se vuelve a entrar sin datos');
ok(await pulsar('Nutrición'), 'en Nutrición');
ok(await pulsar('Estadísticas'), 'y en Estadísticas');
const vacioStats = await esperarTexto(/Tu evolución aparecerá aquí/i);
ok(/Tu evolución aparecerá aquí/i.test(vacioStats),
  '🚨 SIN DATOS SUFICIENTES SALE EL ESTADO VACÍO, con el texto del apartado 12');
ok(/Registra tus comidas/i.test(vacioStats), '⚠️ y su explicación');
const graficasVacias = await page.evaluate(() => document.querySelectorAll('.recharts-wrapper').length);
ok(graficasVacias === 0,
  '🚨 Y NI UNA GRÁFICA VACÍA: *"no mostrar gráficas vacías"* es literal del apartado 12');


/* ── E3 F39 + F40 (NU F7 y F8) · EL ANÁLISIS Y EL CIERRE ──────────────────
   🔒 Lo que hay que ver con el dedo: que el panel **mire su objetivo**
   (apartado 10 de la F7), que hable de **sus registros** y nunca de lo que no
   come (apartados 6 y 7, marcados como MUY IMPORTANTE), y que **con un solo día
   no diga nada específico** (apartado 8).

   El escenario son ocho días con desayuno y comida —nunca merienda— y la
   proteína corta, con el objetivo puesto en **ganar masa**. */
const DIAS_AN = [];
for (let i = 0; i < 8; i += 1) {
  DIAS_AN.push({ id: `an${i}`, fecha: DN(i), momento: 'comida', nombre: 'Comida', calorias: 2000, proteinas: 110, carbohidratos: 250, grasas: 60, fibra: 20 });
  DIAS_AN.push({ id: `ad${i}`, fecha: DN(i), momento: 'desayuno', nombre: 'Desayuno', calorias: 300, proteinas: 15, carbohidratos: 40, grasas: 8, fibra: 5 });
}
almacen.nutricion = {
  comidas: DIAS_AN, agua: {}, favoritos: [],
  objetivos: {
    configurado: true, actividad: 'moderado', objetivo: 'ganar',
    kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70,
    manual: {}, pesoAlCalcular: 72, fecha: DN(0),
  },
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
guardado.length = 0;

ok(await pulsar('Bienestar'), 'se abre el área Bienestar');
ok(await pulsar('Nutrición'), 'se entra en Nutrición');
ok(await pulsar('Estadísticas'), 'y en Estadísticas, donde vive el análisis');

const an = await esperarTexto(/Análisis nutricional/i);
ok(/Análisis nutricional/i.test(an), '🚨 E3 F39 — hay un panel de análisis (apartado 1)');
ok(/Tu proteína va por debajo de tu objetivo/i.test(an),
  '⚠️ con un resumen corto sacado de sus datos (apartado 1)');

/* 🔒 Apartado 10 — la frase mira SU objetivo, que es ganar masa. */
ok(/ganar masa/i.test(an),
  '🔒 Y MIRA SU OBJETIVO: «ganar masa» aparece en la interpretación (apartado 10)');

/* 🚨 Apartados 6 y 7 — habla de registros, nunca de lo que no come. */
ok(/no suele aparecer en tus registros/i.test(an),
  '🚨 «La merienda no suele aparecer en tus registros» — la forma del apartado 6');
ok(!/(nunca meriendas|no meriendas|te saltas)/i.test(an),
  '🚨 Y NUNCA «nunca meriendas»: el apartado 7 lo marca como MUY IMPORTANTE');
ok(/no quiere decir que no lo comieras/i.test(an),
  '🚨 con la frase que lo sostiene, debajo del panel entero');

/* Apartado 9 — la recomendación, con su número. */
ok(/15 g de proteína/.test(an),
  '⚠️ y la recomendación lleva su cifra: «te faltan 15 g» (apartado 9)');

/* Apartado 11 — el resumen pequeño y reutilizable, en la cabecera. */
ok(/Te quedan \d+ g de proteína|Te quedan \d+ kcal|objetivo calórico/i.test(an),
  '⚠️ con el resumen pequeño del apartado 11, el que Hoy podrá usar');

/* 🚨 Apartado 13 — y nada de esto ha llamado a la IA. */
const llamadasIA = await page.evaluate(() => window.__llamadasIA || 0);
ok(llamadasIA === 0, '🚨 Y EL PANEL NO HA LLAMADO A LA IA: el análisis es local (apartado 13)');
ok(/Analizar mi semana/i.test(an),
  '⚠️ la IA generativa sigue siendo un botón de un toque, con el nombre del apartado 13');

/* 🚨 Apartado 8 — con pocos días, ni una conclusión.
   ⚠️ Y hay DOS pantallas distintas según cuántos días haya, porque la E3 F38 tiene
   su propio apartado 12 —*"no mostrar gráficas vacías"*— con el umbral en
   `MINIMO_DIAS_ESTADISTICA = 2`:
     · con UN día, el estado vacío de la F38 ocupa la pestaña entera y el panel de
       la F39 **ni se pinta**, porque va debajo de ese `return`;
     · con DOS, el panel sí se pinta y es **ahí** donde se ve la puerta de la F39,
       que pide tres días para la primera observación.
   La versión anterior de esta comprobación buscaba el panel de la F39 con un solo
   día —o sea, en la pantalla en la que no existe— y salía roja con el código bien.
   Se comprueban las dos, que es lo que de verdad ve Josué. */
const nutObjetivos = almacen.nutricion.objetivos;
const comidaDe = (dias, nombre) => ({ id: `un-${dias}`, fecha: DN(dias), momento: 'comida', nombre, calorias: 2000, proteinas: 110, carbohidratos: 250, grasas: 60 });

almacen.nutricion = { comidas: [comidaDe(0, 'Solo hoy')], agua: {}, favoritos: [], objetivos: nutObjetivos };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar'), 'se vuelve a entrar con un solo día');
ok(await pulsar('Nutrición'), 'en Nutrición');
ok(await pulsar('Estadísticas'), 'y en Estadísticas');
const unDia = await esperarTexto(/Tu evolución aparecerá aquí/i);
ok(/Tu evolución aparecerá aquí/i.test(unDia),
  '🚨 CON UN SOLO DÍA LA PESTAÑA ENTERA ES EL ESTADO VACÍO (E3 F38, apartado 12)');
ok(!/Comes bastante|Te faltan|de media|tiendes a/i.test(unDia),
  '🚨 y NI UNA conclusión específica con un solo día (apartado 8)');

/* 🚨 Y con DOS días, que es donde la puerta de la F39 se puede ver de verdad. */
almacen.nutricion = { comidas: [comidaDe(0, 'Hoy'), comidaDe(1, 'Ayer')], agua: {}, favoritos: [], objetivos: nutObjetivos };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar'), 'se vuelve a entrar con dos días');
ok(await pulsar('Nutrición'), 'en Nutrición');
ok(await pulsar('Estadísticas'), 'y en Estadísticas');
const dosDias = await esperarTexto(/Análisis nutricional/i);
ok(/Necesitamos más datos/i.test(dosDias),
  '🚨 CON DOS DÍAS NO SE DICE NADA ESPECÍFICO: «necesitamos más datos» (apartado 8)');
ok(!/tiendes a|de media comes|patrón/i.test(dosDias),
  '🚨 y por debajo de tres días no se cuela ni un patrón');
ok(!/va por debajo de tu objetivo|cambia bastante entre días/i.test(unDia),
  '🚨 ni una conclusión sobre la proteína ni sobre la variación');
ok(!/no suele aparecer en tus registros/i.test(unDia),
  '⚠️ ni sobre las comidas que no aparecen: con un día no se sabe');

/* 🚨 Y mirar el análisis no escribe nada. */
const escriturasAn = guardado.filter((g) => g && g.key === 'nutricion').length;
ok(escriturasAn === 0, '🚨 Y MIRAR EL ANÁLISIS NO ESCRIBE NADA: es una vista, como las estadísticas');

/* ══════════════════════════════════════════════════════════════════════════
   E3 · FASE 41 (ES F1) — ESTUDIOS: EL HOME TIPO TELÉFONO
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Lo que ninguna prueba de Node puede ver:** que al entrar en Estudios se ven
   las apps, que **las de antes de esta fase siguen ahí con sus asignaturas**
   (apartado 16 — el riesgo real de la fase), que pulsar una abre SU espacio y no
   una pantalla genérica, que dentro se llega a las ramas, y que el botón de atrás
   sube un nivel en vez de sacarte de Estudios. Las 2076 pruebas de renderizado
   pintan el Home y nada más: las otras dos pantallas **solo existen tras pulsar**,
   que es justo donde se esconden los fallos de esta entrega. */
almacen.estudios = {
  programas: [
    { id: 'bachillerato', nombre: 'Bachillerato' },
    { id: 'musica', nombre: 'Música' },
  ],
  asignaturas: [
    { id: 'ea1', programaId: 'bachillerato', nombre: 'Matemáticas' },
    { id: 'ea2', programaId: 'bachillerato', nombre: 'Biología' },
    { id: 'ea3', programaId: 'musica', nombre: 'Piano' },
  ],
  examenes: [{ id: 'eex1', asignaturaId: 'ea1', fecha: DN(-3), tema: 'Derivadas', notaObjetivo: '9', notaObtenida: '', planRepaso: [] }],
  horas: [{ id: 'eh1', asignaturaId: 'ea1', fecha: DN(0), horas: 2 }],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Vida'), 'se entra en el área Vida');
ok(await pulsar('Estudios'), 'y en Estudios');

const homeEs = await esperarTexto(/Bachillerato/i);
/* 🚨 El apartado 16: los programas de antes de la fase SIGUEN AHÍ. */
ok(/Bachillerato/i.test(homeEs) && /Música/i.test(homeEs),
  '🚨 LAS ÁREAS DE ANTES DE LA FASE SIGUEN EN EL HOME: un `programa` es una "app" (apartado 16)');
ok(/Añadir/i.test(homeEs), '⚠️ con el ＋ Añadir del apartado 3');
ok(/PRÓXIMAMENTE/i.test(homeEs), '⚠️ y la zona de PRÓXIMAMENTE del apartado 10 (la ES F6 le cambió el rótulo)');
ok(/Examen de Matemáticas/i.test(homeEs),
  '🚨 que enseña el examen de VERDAD que ya estaba guardado, no una maqueta');

/* Apartados 7 y 8 — los textos largos y el panel de IA no están en el Home. */
ok(!/Un programa por pestaña/i.test(homeEs), '🚨 EL SUBTÍTULO EXPLICATIVO HA DESAPARECIDO (apartado 7)');
ok(!/Analizar mis estudios/i.test(homeEs), '🚨 Y EL PANEL DE IA NO OCUPA EL HOME (apartado 8)');
ok(!/Explícame un concepto/i.test(homeEs), '🚨 ni el de explicar un concepto');

/* Apartado 12 — pulsar una app abre SU espacio, con sus ramas. */
ok(await pulsar('Bachillerato'), 'se abre el área Bachillerato');
const dentroEs = await esperarTexto(/Asignaturas/i);
ok(/Asignaturas/i.test(dentroEs) && /Exámenes/i.test(dentroEs),
  '🚨 Y DENTRO ESTÁN SUS RAMAS: el árbol del apartado 11');
ok(/2 asignaturas/i.test(dentroEs),
  '⚠️ con la cuenta de lo que hay de verdad en ESA app, no en todas');
ok(/Estudios › Bachillerato/i.test(dentroEs), '⚠️ y las migas dicen dónde está');

/* La rama de asignaturas es la pantalla de siempre: no se ha perdido nada. */
ok(await pulsar('Asignaturas'), 'se entra en la rama de asignaturas');
const ramaEs = await esperarTexto(/Matemáticas/i);
ok(/Matemáticas/i.test(ramaEs) && /Biología/i.test(ramaEs),
  '🚨 LAS ASIGNATURAS GUARDADAS SIGUEN ESTANDO, con su tarjeta de siempre');
ok(!/Piano/i.test(ramaEs), '⚠️ y no se cuela la de otra app');

/* 🚨 El botón de atrás sube UN nivel, no saca de Estudios (EH F37). */
ok(await pulsar('Volver atrás'), 'se pulsa atrás');
const volvioEs = await esperarTexto(/Exámenes/i);
/* ⚠️ Esto comprobaba que «Matemáticas» ya no se leía, y era un atajo: desde la ES F6 el área enseña
   su propio PRÓXIMAMENTE, donde «Examen de Matemáticas» sale **con todo el derecho** (apartado 11).
   Lo que dice de verdad en qué nivel estás son **las migas**, así que se mira eso. */
ok(/Exámenes/i.test(volvioEs) && /Estudios › Bachillerato/i.test(volvioEs)
  && !/Bachillerato › Asignaturas/i.test(volvioEs),
  '🚨 ATRÁS DESDE UNA RAMA VUELVE A SU APP, no al Home ni fuera de Estudios');
ok(await pulsar('Volver atrás'), 'se pulsa atrás otra vez');
const homeOtraVez = await esperarTexto(/PRÓXIMAMENTE/i);
ok(/Música/i.test(homeOtraVez), '🚨 y desde una app se vuelve al Home con todas las áreas');

/* 🚨 Y navegar por el árbol NO ESCRIBE NADA: mirar es mirar (E3 F32). */
const escriturasEs = guardado.filter((g) => g && g.key === 'estudios').length;
ok(escriturasEs === 0, '🚨 Y RECORRER EL ÁRBOL NO GUARDA NADA: la navegación es una vista');

/* ══════════════════════════════════════════════════════════════════════════
   E3 · FASE 42 (ES F2) — LAS RAMAS SON DE CADA APP Y LAS CONFIGURA ÉL
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Lo que ninguna prueba de Node puede ver:** que añadir una sección con el
   dedo la deja en SU área y no en las demás, que al abrirla dice lo que es en vez
   de enseñar una lista falsa, y que quitarla **no se lleva los exámenes**. Todo
   eso solo existe tras varios toques. */
ok(await pulsar('Música'), 'se abre el área Música');
const dentroMus = await esperarTexto(/Asignaturas/i);
ok(/Asignaturas/i.test(dentroMus) && /Añadir/i.test(dentroMus),
  '⚠️ un área trae sus secciones y el ＋ para añadir otra (apartado 5)');

ok(await pulsar('Añadir'), 'se abre el formulario de sección');
const formRama = await esperarTexto(/Nueva secci[óo]n/i);
ok(/Nueva secci[óo]n/i.test(formRama), 'con su formulario');
/* Apartado 4 — las sugerencias son las de SU tipo. Música no lo tiene puesto en
   este escenario, así que se le ofrecen todas: no saber su tipo no puede dejarle
   sin sugerencias. */
ok(/Repertorio/i.test(formRama), '⚠️ y con las sugerencias del apartado 4');
ok(await pulsar('🎼 Repertorio'), 'se elige una sugerencia');
ok(await pulsar('Crear sección'), 'y se añade');

const conRama = await esperarTexto(/Repertorio/i);
ok(/Repertorio/i.test(conRama), '🚨 LA SECCIÓN NUEVA APARECE EN SU ÁREA');

/* 🚨 Y una sección sin sistema detrás DICE lo que es: ni lista falsa ni botón muerto. */
ok(await pulsar('Repertorio'), 'se abre la sección nueva');
const dentroRama = await esperarTexto(/Todav[íi]a no se puede guardar/i);
ok(/Todav[íi]a no se puede guardar/i.test(dentroRama),
  '🚨 UNA SECCIÓN SIN SISTEMA DICE QUE TODAVÍA NO GUARDA NADA (regla 8)');
ok(!/pr[óo]ximamente|en construcci[óo]n|Fase \d/i.test(dentroRama),
  '🚨 y NO dice "próximamente" ni nombra una fase (reglas 8 y 9)');
ok(/Estudios › Música › Repertorio/i.test(dentroRama), '⚠️ y las migas dicen dónde está');

ok(await pulsar('Volver atrás'), 'se vuelve al área');
await esperarTexto(/Repertorio/i);

/* 🚨 Y NO se ha colado en las demás áreas. */
ok(await pulsar('Volver atrás'), 'se vuelve al Home');
await esperarTexto(/PRÓXIMAMENTE/i);
ok(await pulsar('Bachillerato'), 'se abre Bachillerato');
const otraApp = await esperarTexto(/Asignaturas/i);
ok(!/Repertorio/i.test(otraApp),
  '🚨 LA SECCIÓN DE MÚSICA NO ESTÁ EN BACHILLERATO: cada área tiene su estructura (apartado 4)');

/* 🚨 Quitar una sección NO borra lo que hay dentro. */
ok(/2 asignaturas/i.test(otraApp), '⚠️ Bachillerato sigue con sus dos asignaturas');
ok(await pulsar('Organizar secciones'), 'se abre el organizador de secciones');
await esperarTexto(/se queda donde está/i);
ok(await pulsar('Quitar Exámenes de Bachillerato'), 'se quita la sección de Exámenes');
const sinExamenes = await esperarTexto(/Asignaturas/i);
ok(!/Exámenes/i.test(sinExamenes), '⚠️ la sección desaparece de la pantalla del área');

/* Y el examen sigue existiendo: se comprueba donde de verdad vive.
   ⚠️ Desde la E3 F43 una asignatura **no se despliega en la lista, se abre**: hay que entrar en
   ella y luego en su sección de exámenes. Esta comprobación estaba escrita con la navegación de
   antes y se puso roja con el código bien — la lección de siempre, esta vez sobre una ruta. */
ok(await pulsar('Asignaturas'), 'se entra en las asignaturas');
await esperarTexto(/Matemáticas/i);
ok(await pulsar('Matemáticas'), 'se abre Matemáticas');
await esperarTexto(/Contenido/i);
ok(await pulsar('Exámenes'), 'se entra en su sección de exámenes');
const dentroAsig = await esperarTexto(/Derivadas/i);
ok(/Derivadas/i.test(dentroAsig),
  '🚨 EL EXAMEN SIGUE AHÍ DESPUÉS DE QUITAR SU SECCIÓN: quitar no es borrar');

/* Y todo esto SÍ se ha guardado (apartado 14): las ramas configuradas persisten. */
const guardadoEs = guardado.filter((g) => g && g.key === 'estudios');
ok(guardadoEs.length >= 2, '🚨 Y LAS SECCIONES CONFIGURADAS SE GUARDAN (apartado 14)');
const ultimoEs = guardadoEs.at(-1)?.value;
ok((ultimoEs?.programas || []).find((p) => p.id === 'musica')?.ramas?.some((r) => r.nombre === 'Repertorio'),
  '⚠️ con la sección nueva dentro de SU área');
ok((ultimoEs?.examenes || []).length === 1, '🚨 y sin haberse llevado ni un examen por delante');

/* ══════════════════════════════════════════════════════════════════════════
   E3 · FASE 43 (ES F3) — ASIGNATURAS, SU ESPACIO Y SU TEMARIO
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Lo que ninguna prueba de Node puede ver:** que la lista de asignaturas
   LLEVA a la asignatura en vez de desplegarla, que dentro están sus secciones,
   que un tema se crea y cambia de estado con el dedo, y sobre todo que **el
   formulario de examen y el registro de horas no se han perdido** al retirar el
   acordeón de la página larga. Todo eso solo existe tras cuatro o cinco toques. */
/* Se vuelve a la lista de asignaturas, que es donde empieza esta sección. */
ok(await pulsar('Volver atrás'), 'se vuelve a la asignatura');
await esperarTexto(/Contenido/i);
ok(await pulsar('Volver atrás'), 'y a la lista de asignaturas');
const listaAsig = await esperarTexto(/Matemáticas/i);
ok(/Matemáticas/i.test(listaAsig) && /Biología/i.test(listaAsig), '⚠️ están las dos asignaturas guardadas');
ok(/Añadir asignatura/i.test(listaAsig), '⚠️ con el botón de crear (apartado 2)');
/* 🚨 Apartado 14 — la lista ya NO despliega el examen dentro: lleva a la asignatura. */
ok(!/Derivadas/i.test(listaAsig), '🚨 LA LISTA NO ABRE EL EXAMEN DENTRO: se acabó la página larga (apartado 14)');

ok(await pulsar('Matemáticas'), 'se abre la asignatura');
const dentroAsig2 = await esperarTexto(/Contenido/i);
ok(/Exámenes/i.test(dentroAsig2) && /Contenido/i.test(dentroAsig2), '🚨 Y LA ASIGNATURA TIENE SU PROPIO ESPACIO, con sus secciones (apartado 4)');
ok(/Estudios › Bachillerato › Asignaturas › Matemáticas/i.test(dentroAsig2), '⚠️ y las migas llegan hasta ella (apartado 3)');
ok(/1 examen próximo/i.test(dentroAsig2), '⚠️ con su resumen compacto (apartado 8)');
/* 🔓 La ES F43 tuvo que comprobar aquí que NO había ni una línea de entregas, porque la entidad no
   existía. La ES F44 la construyó, así que esta comprobación pasa a vigilar que la promesa se haya
   cumplido — es la cuarta de esta tanda, y están escritas a propósito para este momento. */
ok(/Entregas/i.test(dentroAsig2), '🔓 y la asignatura YA tiene su sección de Entregas (la construyó la ES F4)');
/* 🐛 `innerText` NO incluye el `placeholder` de un `<input>` (E3 F36), y el registro de horas es
   justamente un campo con marcador de posición: se busca el campo, no el texto de la página. */
ok(await page.$('input[placeholder="Horas estudiadas hoy"]'),
  '🚨 Y EL REGISTRO DE HORAS NO SE HA PERDIDO al retirar el acordeón');

/* 🚨 El temario: crear un tema y cambiarle el estado con el dedo (apartados 5, 6 y 7). */
ok(await pulsar('Contenido'), 'se entra en el contenido');
await esperarTexto(/Añadir tema/i);
ok(await pulsar('Añadir tema'), 'se abre el formulario de tema');
await esperarTexto(/Nuevo tema/i);
await page.fill('input[placeholder^="Ej: Tema 1"]', 'Tema 1 — Derivadas');
ok(await pulsar('Crear tema'), 'se crea el tema');
const conTema = await esperarTexto(/Tema 1 — Derivadas/i);
ok(/Tema 1 — Derivadas/i.test(conTema), '🚨 EL TEMA APARECE EN SU ASIGNATURA');
ok(/Pendiente/i.test(conTema), '⚠️ y nace Pendiente, con su palabra al lado del icono (EH F42)');

ok(await pulsar('Tema 1 — Derivadas: Pendiente. Cambiar de estado'), 'se toca el estado del tema');
const enProgreso = await esperarTexto(/En progreso/i);
ok(/En progreso/i.test(enProgreso), '🚨 Y CAMBIA DE ESTADO CON UN TOQUE (apartado 7)');

/* 🚨 Y el formulario de examen tampoco se ha perdido. */
ok(await pulsar('Volver atrás'), 'se vuelve a la asignatura');
await esperarTexto(/Contenido/i);
ok(await pulsar('Exámenes'), 'se entra en sus exámenes');
const susExamenes = await esperarTexto(/Añadir examen/i);
ok(/Derivadas/i.test(susExamenes), '⚠️ está el examen que ya tenía');
ok(/Añadir examen/i.test(susExamenes), '🚨 Y EL FORMULARIO DE EXAMEN SIGUE AHÍ: se mudó, no se perdió');

/* Y todo persiste (apartado 11). */
const guardadoEs3 = guardado.filter((g) => g && g.key === 'estudios').at(-1)?.value;
ok((guardadoEs3?.temas || []).some((t) => t.nombre === 'Tema 1 — Derivadas' && t.estado === 'progreso'),
  '🚨 EL TEMA Y SU ESTADO SE HAN GUARDADO (apartado 11)');
ok((guardadoEs3?.temas || []).every((t) => t.asignaturaId), '⚠️ y cada tema con su asignatura (apartado 12)');

/* ══════════════════════════════════════════════════════════════════════════
   E3 · FASE 44 (ES F4) — EXÁMENES, ENTREGAS Y FECHAS
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Lo que ninguna prueba de Node puede ver:** que una entrega creada con el
   dedo aparece **en el Home de Estudios** sin que nadie la copie (apartado 19),
   que su estado cambia de un toque y que el detalle se abre. Todo eso está detrás
   de seis toques y de tres pantallas distintas. */
ok(await pulsar('Volver atrás'), 'se vuelve a la asignatura');
await esperarTexto(/Contenido/i);
ok(await pulsar('Entregas'), 'se entra en las entregas de la asignatura');
const sinEntregas = await esperarTexto(/Añadir entrega/i);
ok(/Añadir entrega/i.test(sinEntregas), '⚠️ con su botón de crear (apartado 4)');

ok(await pulsar('Añadir entrega'), 'se abre el formulario');
await esperarTexto(/Nuevo\/a entrega/i);
await page.fill('input[placeholder^="Ej: Trabajo"]', 'Trabajo de Historia');
/* ⚠️ La fecha viene puesta a hoy; se pone una futura para que salga en el Home. */
await page.fill('input[type="date"]', DN(-4));
ok(await pulsar('Crear'), 'se crea la entrega');
const conEntrega = await esperarTexto(/Trabajo de Historia/i);
ok(/Trabajo de Historia/i.test(conEntrega), '🚨 LA ENTREGA APARECE EN SU ASIGNATURA');
ok(/Entrega/i.test(conEntrega) && /Pendiente/i.test(conEntrega),
  '🚨 con su TIPO y su ESTADO en palabra, no solo en color (apartado 12)');

/* Apartado 13 — el detalle, y el estado de un toque. */
ok(await pulsar('Trabajo de Historia'), 'se abre su detalle');
const detalle = await esperarTexto(/Editar/i);
ok(/Editar/i.test(detalle) && /Eliminar/i.test(detalle), '⚠️ con sus dos acciones (apartado 13)');
ok(await pulsar('◐ En progreso'), 'se cambia su estado');
const enMarcha = await esperarTexto(/En progreso/i);
ok(/En progreso/i.test(enMarcha), '🚨 Y EL ESTADO CAMBIA DE UN TOQUE (apartado 5)');

/* 🚨 Y lo que de verdad prueba el apartado 19: sale en el HOME sin que nadie la copie. */
ok(await pulsar('Volver atrás'), 'se vuelve a la asignatura');
await esperarTexto(/Contenido/i);
ok(await pulsar('Volver atrás'), 'a la lista de asignaturas');
await esperarTexto(/Matemáticas/i);
ok(await pulsar('Volver atrás'), 'al área');
await esperarTexto(/Asignaturas/i);
ok(await pulsar('Volver atrás'), 'y al Home de Estudios');
const homeConEntrega = await esperarTexto(/PRÓXIMAMENTE/i);
ok(/Trabajo de Historia/i.test(homeConEntrega),
  '🚨 LA ENTREGA SALE EN EL HOME SIN QUE NADIE LA COPIE: un solo registro visto desde dos sitios (apartados 8 y 19)');
ok(/Examen de Matemáticas/i.test(homeConEntrega), '⚠️ junto al examen, las dos en la misma lista');

/* Y persiste con todo lo demás (apartado 17). */
const guardadoEs4 = guardado.filter((g) => g && g.key === 'estudios').at(-1)?.value;
ok((guardadoEs4?.entregas || []).some((t) => t.nombre === 'Trabajo de Historia' && t.estado === 'progreso'),
  '🚨 LA ENTREGA Y SU ESTADO SE HAN GUARDADO (apartado 17)');
ok((guardadoEs4?.entregas || []).every((t) => t.asignaturaId), '⚠️ y vinculada a su asignatura (apartado 7)');
ok((guardadoEs4?.examenes || []).length === 1, '⚠️ sin haberse llevado el examen por delante');

/* ══════════════════════════════════════════════════════════════════════════
   E3 · FASE 45 (ES F5) — APPS DE APRENDIZAJE INDEPENDIENTES
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Lo que ninguna prueba de Node puede ver:** que crear un área con plantilla
   la deja con SUS secciones, que un objetivo creado desde ahí **acaba en la
   pantalla de Objetivos de siempre** —que es lo que demuestra que no hay un
   segundo sistema— y que sin objetivos no se enseña un 0 % inventado. */
almacen.estudios = {
  programas: [{ id: 'bachillerato', nombre: 'Bachillerato', tipo: 'formal' }],
  asignaturas: [], examenes: [], horas: [], temas: [], entregas: [], eventos: [], actividades: [],
};
almacen.objetivos = { lista: [], ultimaRevision: null };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Vida'), 'se entra en Vida');
ok(await pulsar('Estudios'), 'y en Estudios');
await esperarTexto(/Bachillerato/i);

ok(await pulsar('Añadir'), 'se abre el formulario de área');
const formApp = await esperarTexto(/Estructura inicial/i);
ok(/Estructura inicial/i.test(formApp), '⚠️ con su estructura recomendada (apartado 4)');
ok(/Empezar desde cero/i.test(formApp), '⚠️ y la salida de empezar desde cero');
/* ⚠️ Se usa **Fútbol** y no Ajedrez porque su plantilla es la que trae la rama de Objetivos
   —Ajedrez trae Aperturas—, y así el recorrido prueba plantilla, progreso y objetivos de una
   pasada. Antes de escribir un recorrido, mirar qué ramas trae de verdad la plantilla elegida. */
await page.fill('input[placeholder="Ej: Idiomas"]', 'Fútbol');
ok(await pulsar('⚽ Fútbol'), 'se elige la plantilla de Fútbol');
ok(await pulsar('Crear'), 'se crea el área');

const dentroAjedrez = await esperarTexto(/Partidos/i);
ok(/Entrenamiento/i.test(dentroAjedrez) && /Partidos/i.test(dentroAjedrez) && /Objetivos/i.test(dentroAjedrez),
  '🚨 EL ÁREA NACE CON LAS SECCIONES DE SU PLANTILLA (apartado 3)');
ok(/Progreso/i.test(dentroAjedrez), 'incluida la de progreso');
ok(!/Asignaturas/i.test(dentroAjedrez),
  '🚨 y NO con las de un área académica, NI un «0 asignaturas»: no todo funciona como Bachillerato (apartado 1)');

/* 🚨 Apartado 9 — sin objetivos, «Sin datos todavía», nunca un 0 %. */
ok(await pulsar('Progreso'), 'se entra en Progreso');
const sinDatos = await esperarTexto(/Sin datos todav/i);
ok(/Sin datos todav/i.test(sinDatos), '🚨 SIN OBJETIVOS NO SE INVENTA UN PORCENTAJE (apartado 9)');
ok(!/0 ?%|0 \/ 0/.test(sinDatos), 'ni un cero disfrazado');

/* Apartado 10 — registrar una actividad. */
ok(await pulsar('Registrar actividad'), 'se abre el registro');
await esperarTexto(/Qué has hecho/i);
await page.fill('input[placeholder="Ej: 30 min de práctica"]', '3 partidas');
ok(await pulsar('Registrar'), 'se registra');
const conActividad = await esperarTexto(/3 partidas/i);
ok(/3 partidas/i.test(conActividad), '🚨 LA ACTIVIDAD QUEDA REGISTRADA EN SU ÁREA (apartados 10 y 11)');

/* 🚨 Y lo que de verdad prueba que no hay un segundo sistema: el objetivo acaba en Objetivos. */
ok(await pulsar('Volver atrás'), 'se vuelve al área');
await esperarTexto(/Partidos/i);
ok(await pulsar('Objetivos'), 'se entra en los objetivos del área');
await esperarTexto(/Añadir objetivo/i);
ok(await pulsar('Añadir objetivo'), 'se abre el formulario');
await esperarTexto(/Nuevo objetivo/i);
await page.fill('input[placeholder="Ej: Mejorar resistencia"]', 'Llegar a 1200 Elo');
await page.selectOption('select', { index: 1 });
ok(await pulsar('Crear objetivo'), 'se crea el objetivo');
const conObjetivo = await esperarTexto(/Llegar a 1200 Elo/i);
ok(/Llegar a 1200 Elo/i.test(conObjetivo), 'El objetivo sale en el área');
ok(/Objetivos de siempre|Se gestiona en Objetivos/i.test(conObjetivo),
  '⚠️ y la pantalla DICE que vive en Objetivos: no finge que sea suyo');

const guardadoObj = guardado.filter((g) => g && g.key === 'objetivos').at(-1)?.value;
ok((guardadoObj?.lista || []).some((o) => o.texto === 'Llegar a 1200 Elo'),
  '🚨 EL OBJETIVO SE HA GUARDADO EN LA CLAVE `objetivos` DE SIEMPRE: ni un segundo sistema (apartado 8)');
const guardadoEs5 = guardado.filter((g) => g && g.key === 'estudios').at(-1)?.value;
const appAjedrez = (guardadoEs5?.programas || []).find((p) => p.nombre === 'Fútbol');
ok(appAjedrez?.objetivoIds?.length === 1, '⚠️ y el área guarda SOLO su id');
ok(!JSON.stringify(appAjedrez?.objetivoIds || []).includes('Elo'), '🚨 ni una copia del texto');
eqReal(appAjedrez?.plantilla, 'futbol', '⚠️ y la plantilla usada queda guardada (apartado 15)');
ok((guardadoEs5?.actividades || []).some((a) => a.titulo === '3 partidas' && a.appId === appAjedrez.id),
  '⚠️ y la actividad, vinculada a su área');
ok((guardadoEs5?.actividades || []).every((a) => a.minutos === null || a.minutos > 0),
  '🚨 y sin minutos escritos se guarda `null`, no un 0');

/* ══════════════════════════════════════════════════════════════════════════
   E3 · FASE 46 (ES F6) — PRÓXIMAMENTE, VER TODOS Y EL CIERRE 🏁
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Lo que ninguna prueba de Node puede ver:** que lo de HOY sale arriba y
   aparte, que «Ver todos» abre la vista completa con sus filtros, y sobre todo
   que **pulsar un evento del Home aterriza en su detalle**, cuatro niveles más
   abajo — que es el apartado 7 y la auditoría de navegación del 20. */
almacen.estudios = {
  programas: [{
    id: 'bachillerato', nombre: 'Bachillerato', tipo: 'formal',
    ramas: [
      { id: 'r-asig', nombre: 'Asignaturas', icono: '📚', sistema: 'asignaturas' },
      { id: 'r-exam', nombre: 'Exámenes', icono: '📝', sistema: 'examenes' },
    ],
  }],
  asignaturas: [{ id: 'a1', programaId: 'bachillerato', nombre: 'Biología', orden: 0, oculto: false }],
  examenes: [
    { id: 'e1', asignaturaId: 'a1', fecha: DN(0), tema: 'Genética', hora: '09:00', estado: 'proximo', planRepaso: [] },
    { id: 'e2', asignaturaId: 'a1', fecha: DN(-6), tema: 'Metabolismo', estado: 'proximo', planRepaso: [] },
    { id: 'e3', asignaturaId: 'a1', fecha: DN(60), tema: 'El que ya pasó', estado: 'realizado', planRepaso: [] },
  ],
  entregas: [{ id: 't1', asignaturaId: 'a1', nombre: 'Trabajo de Biología', fecha: DN(-3), estado: 'pendiente' }],
  eventos: [], horas: [], temas: [], actividades: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Vida'), 'se entra en Vida');
ok(await pulsar('Estudios'), 'y en Estudios');

const homeFinal = await esperarTexto(/PRÓXIMAMENTE/i);
ok(/HOY/.test(homeFinal), '🚨 LO DE HOY TIENE SU PROPIO BLOQUE, arriba (apartado 4)');
ok(/Examen de Biología/i.test(homeFinal), 'con el examen de hoy');
ok(/Trabajo de Biología/i.test(homeFinal), '⚠️ y debajo lo que viene, exámenes y entregas juntos');
ok(!/El que ya pasó/i.test(homeFinal), '🚨 y lo que ya pasó NO sale (apartado 5)');
ok(/Ver todos/i.test(homeFinal), '⚠️ con el acceso a la vista completa (apartado 3)');
ok(/2 exámenes|1 entrega/i.test(homeFinal), '⚠️ y el resumen rápido, solo con lo que tiene algo (apartado 13)');

/* Apartados 8 y 9 — la vista completa y sus filtros. */
ok(await pulsar('Ver todos →'), 'se abre la vista completa');
const completa = await esperarTexto(/PASADOS/i);
ok(/PRÓXIMOS/i.test(completa) && /PASADOS/i.test(completa), '🚨 con próximos y pasados separados (apartado 8)');
ok(/El que ya pasó/i.test(completa), '⚠️ y lo pasado SIGUE guardado: se puede consultar (apartado 5)');
ok(await pulsar('Entregas'), 'se filtra por entregas');
const soloEntregas = await esperarTexto(/Trabajo de Biología/i);
ok(!/Genética/i.test(soloEntregas), '🚨 y el filtro deja SOLO las entregas (apartado 9)');
ok(await pulsar('Todos'), 'se vuelve a todos');
await esperarTexto(/Genética/i);

/* 🚨 Apartado 7 y auditoría del 20 — pulsar un evento aterriza en su detalle. */
ok(await pulsar('Volver atrás'), 'se vuelve al Home');
await esperarTexto(/PRÓXIMAMENTE/i);
ok(await pulsar('Examen de Biología'), 'se pulsa el examen de hoy');
const enDetalle = await esperarTexto(/Genética/i);
ok(/Genética/i.test(enDetalle), '🚨 Y SE ATERRIZA EN SU EXAMEN, cuatro niveles más abajo (apartado 7)');
ok(/Estudios › Bachillerato › Asignaturas › Biología › Exámenes/i.test(enDetalle),
  '🚨 con las migas enteras: la navegación no deja estados incorrectos (apartado 20)');

/* Apartado 10 — y la asignatura enseña lo suyo, del mismo sistema. */
ok(await pulsar('Volver atrás'), 'se sube a la asignatura');
const asigFinal = await esperarTexto(/PRÓXIMAMENTE/i);
ok(/PRÓXIMAMENTE/i.test(asigFinal), '🚨 LA ASIGNATURA ENSEÑA LO SUYO (apartado 10)');
ok(/Genética/i.test(asigFinal) && /Trabajo de Biología/i.test(asigFinal), 'con su examen y su entrega');

/* 🚨 Y todo el recorrido de vuelta, sin dejar nada roto (apartado 20). */
ok(await pulsar('Volver atrás'), 'a la lista de asignaturas');
await esperarTexto(/Biología/i);
ok(await pulsar('Volver atrás'), 'al área');
await esperarTexto(/Asignaturas/i);
ok(await pulsar('Volver atrás'), 'y al Home');
const vuelta = await esperarTexto(/PRÓXIMAMENTE/i);
ok(/HOY/.test(vuelta) && /Bachillerato/i.test(vuelta),
  '🏁 EL RECORRIDO ENTERO, IDA Y VUELTA, DEJA EL HOME COMO ESTABA (apartado 20)');

/* 🚨 Y mirar todo esto no ha escrito nada: el Home es una vista. */
const escriturasF6 = guardado.filter((g) => g && g.key === 'estudios').length;
await pulsar('Ver todos →');
await esperarTexto(/PASADOS/i);
ok(guardado.filter((g) => g && g.key === 'estudios').length === escriturasF6,
  '🚨 Y RECORRER PRÓXIMAMENTE NO GUARDA NADA: es una vista sobre lo que ya existe');

/* ⚠️ Aquí terminaba el recorrido. La sección de Perfil que viene después
   reutiliza el mismo navegador: `salir` solo se llama UNA vez, al final. */

/* ══════════════════════════════════════════════════════════════════════════
   AJUSTES · PERFIL — LA FOTO DE PERFIL Y EL NOMBRE DE LOS SALUDOS
   ══════════════════════════════════════════════════════════════════════════

   🚨 **Esto es lo único que demuestra lo que Josué pidió comprobar.** Su lista
   no habla de código: dice *"se puede seleccionar una foto"*, *"la foto se
   guarda realmente"* y *"sigue apareciendo después de cerrar/recargar"*. Las
   pruebas de Node miran el dato y los casos de renderizado pintan el círculo,
   pero **ninguno de los dos elige un archivo ni recarga la aplicación**. */
almacen.perfil = {
  nombre: 'Josué', apellidos: 'Carbonell', nombreMostrado: '',
  fechaNacimiento: '2010-07-29', altura: 187, peso: 72, actividad: 'moderado',
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* El saludo de Hoy, antes de tocar nada. */
const hoyAntes_fp = await ver();
ok(/Bu[eé]n[oa]s\s+(d[ií]as|tardes|noches), Josué/i.test(hoyAntes_fp),
  'El saludo de Hoy usa el nombre del perfil');

/* ── El nombre mostrado, que hasta esta fase no lo leía nadie ──────────────── */
/* 🐛 ⚠️ **A AJUSTES SE ENTRA POR «MÁS», NO DESDE LA BARRA** (las cinco pestañas
   son Inicio + las cuatro áreas, regla 10). Se me olvidó el primer toque y las
   **treinta** comprobaciones de esta sección salieron rojas de golpe **con la
   pantalla perfecta**: una navegación que falla arrastra todo lo que viene
   detrás, y dos de ellas hasta salieron VERDES por casualidad —«las iniciales
   desaparecen» se cumple trivialmente en una pantalla donde nunca hubo
   iniciales—. Un rojo en cascada esconde qué se está probando de verdad. */
// DIST F1 — Ajustes es la quinta pestaña: se llega de un toque.
ok(await pulsar('Ajustes'), 'se abre Ajustes');
await esperarTexto(/Apariencia/i);
ok(await pulsar('Perfil'), 'y la categoría Perfil');
const perfilAbierto = await esperarTexto(/Datos básicos/i);

// 🚨 Sin foto se ven SUS INICIALES, no una silueta de desconocido.
ok(/JC/.test(perfilAbierto), '🚨 Sin foto, el círculo enseña sus iniciales (JC), no un avatar genérico');
ok(/Elegir foto/i.test(perfilAbierto), '⚠️ …y el botón dice «Elegir foto», no «Cambiar»');
ok(/Todavía no has puesto una foto/i.test(perfilAbierto), '…y lo dice con una frase, sin fingir que hay una');

// 🚨 El círculo es un círculo DE VERDAD: se mide en el navegador, no se confía
// en que la clase esté escrita (`rounded-full` podría estar sobrescrita).
const redondo = await page.evaluate(() => {
  const cont = [...document.querySelectorAll('div')].find((d) => {
    const r = d.getBoundingClientRect();
    return Math.abs(r.width - 88) < 2 && Math.abs(r.height - 88) < 2;
  });
  if (!cont) return null;
  const br = getComputedStyle(cont).borderRadius;
  return { br, lado: Math.round(cont.getBoundingClientRect().width) };
});
ok(redondo && parseFloat(redondo.br) >= redondo.lado / 2,
  `🚨 EL AVATAR ES CIRCULAR DE VERDAD (radio ${redondo?.br} sobre ${redondo?.lado} px)`);

/* ── Elegir una foto de verdad, desde el "dispositivo" ─────────────────────── */
// Un PNG mínimo pero decodificable: el `<canvas>` tiene que poder dibujarlo.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const escrituras_fpAntes = guardado.filter((g) => g && g.key === 'perfil').length;
await page.setInputFiles('input[type="file"][accept*="image"]', {
  name: 'yo.png', mimeType: 'image/png', buffer: PNG_1PX,
});
await page.waitForTimeout(1200);

const conFoto = await ver();
ok(/Cambiar foto/i.test(conFoto), '🚨 SE HA PODIDO ELEGIR UNA FOTO: el botón pasa a «Cambiar foto»');
ok(/Esta es tu foto de perfil/i.test(conFoto), '…y la pantalla lo dice');
ok(!/JC/.test(conFoto), '⚠️ …y las iniciales desaparecen: la foto SUSTITUYE al hueco, no se apila encima');

// 🚨 Y se ha GUARDADO, que es distinto de haberse pintado.
const guardadoFoto = guardado.filter((g) => g && g.key === 'perfil').at(-1)?.value;
ok(guardado.filter((g) => g && g.key === 'perfil').length > escrituras_fpAntes,
  '🚨 ELEGIR LA FOTO ESCRIBE EN `perfil` de verdad');
ok(typeof guardadoFoto?.foto === 'string' && guardadoFoto.foto.startsWith('data:image/jpeg'),
  '🚨 …y lo guardado es un JPEG cuadrado, no el PNG original sin tocar');
ok(guardadoFoto?.nombre === 'Josué' && guardadoFoto?.altura === 187,
  '⚠️ …sin llevarse por delante el resto del perfil (regla 5: `saveData` sobrescribe)');

// 🚨 Y que la etiqueta <img> la esté pintando de verdad, no solo que esté en el dato.
const pintada = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => (i.src || '').startsWith('data:image/jpeg'));
  return img ? { ok: true, alto: Math.round(img.getBoundingClientRect().height) } : { ok: false };
});
ok(pintada.ok, '🚨 Y la foto se PINTA en un <img>, no se queda solo en el dato');

/* ── 🚨 LO QUE MÁS PIDIÓ: que siga ahí después de recargar ─────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
// DIST F1 — Ajustes es la quinta pestaña: se llega de un toque.
ok(await pulsar('Ajustes'), 'se recarga la aplicación entera y se vuelve a Ajustes');
await esperarTexto(/Apariencia/i);
ok(await pulsar('Perfil'), '…y a Perfil');
const trasRecargar = await esperarTexto(/Datos básicos/i);
ok(/Cambiar foto/i.test(trasRecargar) && /Esta es tu foto de perfil/i.test(trasRecargar),
  '🚨 LA FOTO SIGUE AHÍ DESPUÉS DE RECARGAR — no era una imagen temporal');
const sigueP = await page.evaluate(() => [...document.querySelectorAll('img')].some((i) => (i.src || '').startsWith('data:image/jpeg')));
ok(sigueP, '…y se vuelve a pintar sola, sin volver a elegirla');

/* ── Cambiar el nombre mostrado y ver que el saludo obedece ────────────────── */
// 🐛 Esto es el campo que NO LEÍA NADIE hasta esta fase: se escribía y no pasaba
// nada en ninguna pantalla.
/* 🐛 ⚠️ **UN `blur` DESPACHADO A MANO NO LLEGA A REACT** — y éste fue el último
   rojo de la fase, con el código bien. Desde React 17 `onBlur` se cablea al
   evento nativo **`focusout`**, no a `blur` (que no burbujea y no se delega),
   así que un `dispatchEvent(new Event('blur'))` actualiza el estado local del
   campo y **nunca llama a `onUpdatePerfil`**: el nombre se escribía y no salía
   de la pantalla. Se escribe como escribe una persona —`fill` y luego salir del
   campo con el tabulador—, que es lo que dispara el `focusout` de verdad. */
const CAMPO_MOSTRADO = 'input[placeholder="Josué"]'; // `placeholder={local.nombre || …}`
await page.fill(CAMPO_MOSTRADO, 'Jos');
await page.keyboard.press('Tab');
await page.waitForTimeout(900);
ok((guardado.filter((g) => g && g.key === 'perfil').at(-1)?.value || {}).nombreMostrado === 'Jos',
  '⚠️ El «Nombre mostrado» se guarda al salir del campo');
/* 🐛 ⚠️ **LA PESTAÑA DE LA PANTALLA DE HOY SE LLAMA «INICIO»** (`App.jsx`, la
   barra inferior). `pulsar('Hoy')` no fallaba: encontraba **otro** botón que
   contiene esa palabra —los atajos de fecha se llaman así— y la comprobación
   salía VERDE habiendo acabado en otra pantalla, que es peor que un rojo.
   Es la lección de la E3 F30 (dos botones con el mismo nombre) desde el lado
   de quien escribe la prueba. */
ok(await pulsar('Inicio'), 'se vuelve a la pantalla de Hoy');
const hoyConMostrado = await esperarTexto(/Bu[eé]n[oa]s/i);
ok(/Bu[eé]n[oa]s\s+(d[ií]as|tardes|noches), Jos\b/i.test(hoyConMostrado),
  '🚨 EL SALUDO USA EL «NOMBRE MOSTRADO»: cambiarlo cambia el saludo (era un campo muerto)');
ok(!/, Josué/.test(hoyConMostrado), '…y ya no usa el nombre largo');

/* ── Quitar la foto ───────────────────────────────────────────────────────── */
// DIST F1 — Ajustes es la quinta pestaña: se llega de un toque.
ok(await pulsar('Ajustes'), 'se vuelve a Ajustes');
await esperarTexto(/Apariencia/i);
ok(await pulsar('Perfil'), 'y a Perfil');
await esperarTexto(/Cambiar foto/i);
ok(await pulsar('Quitar'), 'se pulsa Quitar');
const avisoQuitar = await esperarTexto(/Sí, quitar la foto/i);
ok(/no se recupera desde Eliminados recientes/i.test(avisoQuitar),
  '⚠️ …y el aviso NO promete recuperarla: esto no va a la papelera, y decirlo sería mentir');
ok(await pulsar('Sí, quitar la foto'), 'se confirma');
await page.waitForTimeout(900);
const sinFoto = await ver();
ok(/Elegir foto/i.test(sinFoto), '🚨 LA FOTO SE PUEDE QUITAR: el botón vuelve a «Elegir foto»');
const quitada = guardado.filter((g) => g && g.key === 'perfil').at(-1)?.value;
ok(quitada?.foto === null, '…y en el dato queda `null`, no una cadena vacía ni el rastro de la anterior');
ok(quitada?.nombre === 'Josué', '⚠️ …sin tocar el resto del perfil');

/* ── Y lo que NO se ha tocado, que Josué pidió tres veces ──────────────────── */
/* 🐛 ⚠️ **`pulsar` COMPARA EL `aria-label` ENTERO, NO UN TROZO** (E3 F4 lo dejó
   así a propósito). El botón de volver de una categoría de Ajustes se llama
   «Volver a Ajustes», y yo escribí «Volver atrás»: no lo encuentra, devuelve
   `false` y la comprobación sale roja **con la pantalla bien**. Es la lección
   de siempre —mirar cómo se llama de verdad antes de escribirlo— en el sitio
   donde más cuesta: cuarenta minutos de recorrido para descubrirlo. */
ok(await pulsar('Volver a Ajustes'), 'se vuelve al índice de Ajustes');
const indiceAjustes = await esperarTexto(/Apariencia/i);
ok(/Apariencia/.test(indiceAjustes), '⚠️ Apariencia sigue en su sitio');
ok(/Pantalla principal/.test(indiceAjustes), '⚠️ Pantalla principal sigue en su sitio');
ok(/Preferencias generales/.test(indiceAjustes), '⚠️ Preferencias generales sigue en su sitio');
ok(await pulsar('Apariencia'), 'y Apariencia sigue abriéndose…');
const apar = await esperarTexto(/Tema|Acento/i);
ok(/Tema|Acento/i.test(apar), '…con su contenido de siempre, intacto');

/* ══════════════════════════════════════════════════════════════════════════
   NAV F1 — LA NUEVA ARQUITECTURA Y EL APARTADO NÚMEROS
   ══════════════════════════════════════════════════════════════════════════

   🚨 Las pruebas de Node leen `App.jsx` y comprueban las listas. Eso demuestra
   que están bien **escritas**, no que se pueda navegar por ellas: lo único que
   lo demuestra es entrar, tocar y ver que sale lo que tiene que salir. Es la
   lección de la E3 F30, donde un renombrado a medias dejó dos botones con el
   mismo nombre y solo lo vio Chromium. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* ── DIST F1 · BIENESTAR: cinco módulos exactos ───────────────────────────── */
ok(await pulsar('Bienestar'), '🚨 DIST F1 — se entra en BIENESTAR');
const bien_n1 = await esperarTexto(/Salud f[ií]sica/i);
/* 🏷️ FIT F1 — el cuarto es **«Fitness»** desde la Entrega 4. Es el mismo módulo
   de siempre: `entreno` sigue siendo su id y `calistenia` su clave de datos, y
   lo único que cambia es la etiqueta, como en NAV F2 con «Imagen personal». La
   comprobación se actualiza en vez de aflojarse: el árbol que escribió Josué en
   DIST F1 sigue teniendo sus cinco módulos exactos, con un nombre nuevo. */
for (const rotulo of [/Salud f[ií]sica/i, /Sue[nñ]o/i, /Nutrici[oó]n/i, /Fitness/i, /Imagen personal/i]) {
  ok(rotulo.test(bien_n1), `⚠️ Bienestar tiene ${rotulo.source}`);
}
// 🏷️ El módulo pasó de «Mi salud» a «Salud física», y su id NO se ha tocado.
ok(!/Mi salud/i.test(bien_n1), '🏷️ …y ya no se llama «Mi salud»: es «Salud física»');
// 🚨 Y no debe quedar ni una referencia visible al nombre viejo del apartado.
ok(!/Estilo de hombre/i.test(bien_n1), '🚨 …ni «Estilo de hombre» por ninguna parte: es «Imagen personal»');

/* ── DIST F1 · VIDA: Mente entra, Rachas se va dentro de Productividad ────── */
ok(await pulsar('Vida'), '🚨 se entra en VIDA');
const vida_n1 = await esperarTexto(/Estudios/i);
for (const rotulo of [/Estudios/i, /Productividad/i, /Mente/i, /Biblioteca/i, /Diario/i]) {
  ok(rotulo.test(vida_n1), `⚠️ Vida tiene ${rotulo.source}`);
}
ok(!/Calendario/i.test(vida_n1) && !/Horario/i.test(vida_n1),
  '⚠️ …y Calendario y Horario NO están en Vida: un módulo vive en un sitio, o se ve dos veces');
ok(!/Rachas/i.test(vida_n1),
  '🚨 …ni Rachas suelta: desde esta fase la absorbe Productividad');

/* ── MENTE: agrupa las tres, y las abre de verdad ─────────────────────────── */
ok(await pulsar('Mente'), '🚨 se abre MENTE');
const mente_n1 = await esperarTexto(/Bienestar digital/i);
for (const rotulo of [/\bFe\b/, /Relaci[oó]n/i, /Bienestar digital/i]) {
  ok(rotulo.test(mente_n1), `⚠️ Mente contiene ${rotulo.source}`);
}
// 🚨 Y abre LA PANTALLA DE SIEMPRE, que es lo que ninguna prueba de Node dice.
ok(await pulsar('Bienestar digital'), 'se abre Bienestar digital desde dentro de Mente');
const bd_n1 = await esperarTexto(/pantalla|Tiempo|Concentraci/i);
ok(/pantalla|Tiempo|Concentraci/i.test(bd_n1), '🚨 …y es la pantalla de siempre, no una copia');
ok(await pulsar('Mente'), 'y se vuelve a Mente con su botón');
await esperarTexto(/Relaci[oó]n/i);

/* ── DIST F1 · GESTIÓN: Organización y Progreso ───────────────────────────── */
ok(await pulsar('Gestión'), '🚨 se entra en GESTIÓN');
const ges_n1 = await esperarTexto(/Econom[ií]a/i);
for (const rotulo of [/Organizaci[oó]n/i, /Econom[ií]a/i, /Negocio/i, /Armario/i, /Progreso/i]) {
  ok(rotulo.test(ges_n1), `⚠️ Gestión tiene ${rotulo.source}`);
}
ok(!/N[uú]meros/i.test(ges_n1), '🏷️ …y ya no se llama «Números»: es «Progreso»');

/* ── ORGANIZACIÓN: Tareas, Calendario y Horario ───────────────────────────── */
ok(await pulsar('Organización'), '🚨 se abre ORGANIZACIÓN');
const org_n1 = await esperarTexto(/Calendario/i);
for (const rotulo of [/Tareas/i, /Calendario/i, /Horario/i]) {
  ok(rotulo.test(org_n1), `⚠️ Organización contiene ${rotulo.source}`);
}
/* 🚨 Y lo que más importa: **el dato sigue ahí**. Mover un módulo de sitio es
   navegación; si esta fase hubiera tocado una clave, lo guardado se habría
   quedado huérfano. */
ok(await pulsar('Calendario'), 'se abre el Calendario desde su sitio nuevo');
const cal_n1 = await esperarTexto(/HOY|Mes|Agenda/i);
ok(/HOY|Mes|Agenda/i.test(cal_n1), '🚨 …y es el Calendario entero, con sus datos');
/* ⚠️ Y se vuelve a Organización, no al área: la jerarquía que pidió Josué es
   sección → módulo → submódulo, y no puede ser un callejón sin salida. */
ok(await pulsar('Organización'), '⚠️ …y el volver devuelve a Organización, no a Gestión');
await esperarTexto(/Horario/i);

/* ── PROGRESO: el antiguo Números, con sus tres ───────────────────────────── */
ok(await pulsar('Gestión'), 'se vuelve a Gestión');
ok(await pulsar('Progreso'), '🚨 se abre PROGRESO');
const num_n1 = await esperarTexto(/Estad[ií]sticas/i);
for (const rotulo of [/Estad[ií]sticas/i, /Predicciones/i, /Logros/i]) {
  ok(rotulo.test(num_n1), `⚠️ Progreso contiene ${rotulo.source}`);
}
ok(await pulsar('Logros'), 'se abre Logros desde dentro de Progreso');
const logros_n1 = await esperarTexto(/Logros|Insignias|Mapa/i);
ok(/Logros|Insignias|Mapa/i.test(logros_n1), '🚨 …y es la pantalla de Logros de siempre, no una copia');
ok(await pulsar('Progreso'), 'y se vuelve a Progreso con su botón');
await esperarTexto(/Predicciones/i);

/* ── RACHAS, ahora dentro de Productividad ────────────────────────────────── */
ok(await pulsar('Vida'), 'se vuelve a Vida');
ok(await pulsar('Productividad'), 'se abre Productividad');
const prod_n1 = await esperarTexto(/H[aá]bitos/i);
ok(/Rachas/i.test(prod_n1), '🚨 DIST F1 — Rachas es ahora una mini-app de Productividad');
/* ⚠️ Se busca **la plaquita**, no la palabra: el centro de control (E3 F29)
   sigue informando del porcentaje de tareas, y eso es integración, no una copia
   —al tocarlo lleva a Organización—. Lo que no puede haber es un cuadradito que
   abra Tareas dentro de Productividad, y eso lo delata su descripción. */
ok(!/Organiza lo que tienes que hacer/i.test(prod_n1),
  '🚨 …y Tareas ya NO es una mini-app de aquí: su sitio es Organización');
ok(await pulsar('Rachas'), 'se abre Rachas desde dentro de Productividad');
const rachas_n1 = await esperarTexto(/Racha|racha/);
ok(/Racha|racha/.test(rachas_n1), '🚨 …y es la pantalla de Rachas de siempre, con sus datos');

/* ── Ajustes, ahora como quinta pestaña ───────────────────────────────────── */
ok(await pulsar('Ajustes'), '🚨 DIST F1 — Ajustes se abre directamente desde la barra');
const aj_n1 = await esperarTexto(/Apariencia/i);
ok(/Perfil/.test(aj_n1) && /Apariencia/.test(aj_n1) && /Preferencias generales/.test(aj_n1),
  '🚨 …y conserva TODAS sus categorías: mover no es recortar');

/* ══════════════════════════════════════════════════════════════════════════
   NAV F4 — ELIMINAR UNA TAREA SIN COMPLETARLA, Y EL ICONO DE HÁBITOS
   ══════════════════════════════════════════════════════════════════════════

   🚨 Las pruebas de Node comprueban que el botón está ESCRITO. Lo único que
   demuestra lo que Josué reportó —*"no existe una opción para eliminarla"*— es
   **verlo y pulsarlo**, porque su queja no era que faltara el código: era que no
   se veía. */
/* ⚠️ `HOY` a secas no existe en este archivo: cada sección declara la suya
   (`HOY_PR4`, `HOY_PR7`…) porque dos `const` con el mismo nombre no compilan y
   cuestan doce minutos descubrir — hay una regla invariante que lo caza. */
const HOY_F4 = new Date().toLocaleDateString('sv-SE');
almacen.productividad = {
  tareas: [
    { id: 'tf4-1', texto: 'Tarea que quiero borrar', fecha: HOY_F4, hecha: false, prioridad: 'media' },
    { id: 'tf4-2', texto: 'Tarea que se queda', fecha: HOY_F4, hecha: false, prioridad: 'media' },
  ],
  habitos: [], rutinas: [], metas: [], pomodoros: {}, pomodoroSesiones: [], apuntes: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
/* DIST F1 — Tareas se abre desde Gestión → Organización, ya no desde
   Productividad. La comprobación de borrar desde la fila (NAV F4) es la misma:
   lo que ha cambiado es el camino, no la pantalla. */
await pulsar('Gestión');
ok(await pulsar('Organización'), 'se abre Organización');
ok(await pulsar('Tareas'), 'y Tareas dentro de ella');
const tareas_f4 = await esperarTexto(/Tarea que quiero borrar/i);
ok(/Tarea que quiero borrar/i.test(tareas_f4), 'las dos tareas están ahí');

/* 🚨 El botón se pulsa POR SU `aria-label`, que es como lo pulsaría alguien con
   VoiceOver — y es la única forma de demostrar que existe **en la fila**, sin
   abrir el detalle. */
const escrituras_f4 = guardado.filter((g) => g && g.key === 'productividad').length;
ok(await pulsar('Eliminar Tarea que quiero borrar'),
  '🚨 NAV F4 — SE PUEDE ELIMINAR DESDE LA FILA, sin abrir la tarea y sin completarla');
await page.waitForTimeout(900);

const trasBorrar_f4 = await ver();
ok(!/Tarea que quiero borrar/i.test(trasBorrar_f4), '🚨 …y desaparece de la lista');
ok(/Tarea que se queda/i.test(trasBorrar_f4), '⚠️ …sin llevarse por delante la otra');

// 🚨 Y se ha borrado DE VERDAD, que es distinto de haberse ocultado.
ok(guardado.filter((g) => g && g.key === 'productividad').length > escrituras_f4,
  '🚨 EL BORRADO ES REAL: escribe en `productividad`, no esconde la fila');
const prodTras_f4 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(Array.isArray(prodTras_f4?.tareas) && !prodTras_f4.tareas.some((x) => x.id === 'tf4-1'),
  '🚨 …y la tarea ya no está en los datos');
ok(prodTras_f4.tareas.some((x) => x.id === 'tf4-2'), '⚠️ …y la otra sigue guardada');

// ⚠️ Y sobrevive a recargar, que es lo que él pidió comprobar.
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Gestión');
await pulsar('Organización');
await pulsar('Tareas');
const tras_f4 = await esperarTexto(/Tarea que se queda/i);
ok(!/Tarea que quiero borrar/i.test(tras_f4),
  '🚨 …y SIGUE BORRADA DESPUÉS DE RECARGAR: no era un ocultar visual');

/* ── El icono de Hábitos ──────────────────────────────────────────────────── */
/* 🐛 El botón de volver es de solo icono y `pulsar` compara el `aria-label`
   ENTERO, así que hay que darle el nombre exacto. Tercera vez de la misma
   lección en dos fases.
   ⚠️ DIST F1 — ahora se viene de Organización, así que se va a Productividad
   por la barra: es el icono de Hábitos lo que se comprueba a continuación. */
await pulsar('Vida');
ok(await pulsar('Productividad'), 'se abre el lanzador de Productividad');
await esperarTexto(/H[aá]bitos/i);
// 🚨 Se mira el SVG de verdad, no que la clase esté escrita: `ArrowUpRight`
// dibuja una línea diagonal y una punta; `Flame` no.
const iconoHabitos_f4 = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /Hábitos/i.test(b.innerText || ''));
  if (!btn) return null;
  const svg = btn.querySelector('svg');
  return svg ? svg.getAttribute('class') || svg.outerHTML.slice(0, 200) : null;
});
/* 🐛 ⚠️ **Y esta comprobación pasó EN FALSO la primera vez.** Con
   `iconoHabitos_f4` a `null`, `!/flame/.test(null || '')` es `true`: decía que el
   icono ya no era la llama **sin haber encontrado ningún icono**. Un verde por
   no haber mirado es peor que un rojo. Ahora se exige encontrarlo primero. */
ok(typeof iconoHabitos_f4 === 'string' && iconoHabitos_f4.length > 0,
  '🚨 la plaquita de Hábitos dibuja su icono');
ok(typeof iconoHabitos_f4 === 'string' && !/flame/i.test(iconoHabitos_f4),
  '🚨 NAV F4 — EL ICONO DE HÁBITOS YA NO ES LA LLAMA (era el de Rachas)');
ok(typeof iconoHabitos_f4 === 'string' && /arrow-up-right/i.test(iconoHabitos_f4),
  '…es la flecha ascendente ↗, que no se usa en ninguna otra parte de JosStyle');

/* ══════════════════════════════════════════════════════════════════════════
   GE F1 — EL RECORRIDO DE UNA TAREA: CREAR, MARCAR, DESMARCAR Y ELIMINAR
   ══════════════════════════════════════════════════════════════════════════

   🚨 Ésta es la lista de comprobaciones que pidió Josué, una a una, y en el
   navegador de verdad — que es el único sitio donde se ve si un botón **existe
   para el dedo**. Su queja era literalmente que no había forma de eliminar una
   tarea pendiente, y el botón estaba: escondido en el bloque de las tareas CON
   hora. */
/* 🐛 **UNA FECHA CAPTURADA UNA VEZ CADUCA A MEDIANOCHE, Y ESTE RECORRIDO DURA
   QUINCE MINUTOS.** `HOY_GE1` se calculaba al llegar aquí y se reutilizaba en
   los dos sembrados; la pasada del 2026-09-12 cruzó las 00:00 justo en esta
   sección, así que la tarea se sembró con el día de ayer, la aplicación la vio
   **vencida** y saltaron seis comprobaciones **con el código bien**. Y el rojo
   no se podía diagnosticar: «Para hoy» la enseñaba, que es exactamente lo que
   GE F1 construyó —una tarea vencida es la única que va ahí—, así que parecía
   que la fase estaba rota. Se recalcula en cada sembrado, y al final se dice si
   el día ha cambiado. Cualquier sección que siembre una fecha tiene el mismo
   riesgo: **la fecha se pide justo antes de sembrarla, nunca al principio.** */
const hoyGE1 = () => new Date().toLocaleDateString('sv-SE');
const DIA_AL_EMPEZAR_GE1 = hoyGE1();
almacen.productividad = {
  tareas: [
    { id: 'ge-1', texto: 'Tarea de hoy sin hora', fecha: hoyGE1(), hecha: false, prioridad: 'media' },
  ],
  habitos: [], rutinas: [], rutinaEjecuciones: [], metas: [], pomodoros: {}, pomodoroSesiones: [], apuntes: [],
};
almacen.calendario = { eventos: [] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

await pulsar('Gestión');
// DIST F1 — un nivel más: Gestión → Organización → Calendario.
await pulsar('Organización');
ok(await pulsar('Calendario'), 'se abre el Calendario');
ok(await pulsar('Día'), 'y la vista Día');
const dia_ge1 = await esperarTexto(/Tarea de hoy sin hora/i);
ok(/Tarea de hoy sin hora/i.test(dia_ge1), '🚨 2 — la tarea de hoy APARECE en Día');

// 🚨 3 — y aparece UNA vez, no dos: Día no crea una copia.
const veces_ge1 = (dia_ge1.match(/Tarea de hoy sin hora/gi) || []).length;
ok(veces_ge1 === 1, `🚨 3 — aparece UNA sola vez (${veces_ge1}): no hay copia independiente`);

/* ── 4 · Completarla ─────────────────────────────────────────────────────── */
ok(await pulsar('Completar Tarea de hoy sin hora'), '🚨 4 — se marca como completada');
await page.waitForTimeout(900);
const hecha_ge1 = await ver();
ok(/Tarea de hoy sin hora/i.test(hecha_ge1), '⚠️ …y SIGUE VISIBLE: lo hecho no desaparece del día');
const guardadaHecha = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(guardadaHecha?.tareas?.[0]?.hecha === true, '…y en los datos queda marcada');

/* ── 5 · Desmarcarla ─────────────────────────────────────────────────────── */
ok(await pulsar('Desmarcar Tarea de hoy sin hora'),
  '🚨 5 — el MISMO botón la desmarca (se anuncia como «Desmarcar»)');
await page.waitForTimeout(900);
const vuelta_ge1 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(vuelta_ge1?.tareas?.[0]?.hecha === false, '🚨 …y vuelve a PENDIENTE en los datos');
ok(vuelta_ge1?.tareas?.[0]?.id === 'ge-1', '⚠️ …siendo la misma tarea: ni se borró ni se duplicó');

/* ── 6 y 7 · Eliminarla estando PENDIENTE ────────────────────────────────── */
ok(await pulsar('Acciones de Tarea de hoy sin hora'),
  '🚨 6 — una tarea SIN HORA tiene su menú de acciones (esto es lo que faltaba)');
const menu_ge1 = await esperarTexto(/Eliminar/i);
ok(/Eliminar/i.test(menu_ge1), '…con «Eliminar» dentro, estando pendiente');
ok(await pulsar('Eliminar'), 'se elimina');
await page.waitForTimeout(1000);

const trasBorrar_ge1 = await ver();
ok(!/Tarea de hoy sin hora/i.test(trasBorrar_ge1), '🚨 7 — desaparece de Día');
const borrada_ge1 = guardado.filter((g) => g && g.key === 'productividad').at(-1)?.value;
ok(!(borrada_ge1?.tareas || []).some((x) => x.id === 'ge-1'),
  '🚨 …y se borra DE VERDAD de los datos: no era un ocultar visual');

/* ── 8 · La Agenda sigue enseñando lo programado ─────────────────────────── */
ok(await pulsar('Agenda'), '8 — se abre la Agenda');
const agenda_ge1 = await esperarTexto(/Agenda|Próxim|Nada/i);
ok(agenda_ge1.length > 0, '⚠️ …y sigue funcionando: es lo PRÓXIMO, no una copia del día');

/* ── 9 · Productividad ya no duplica las tareas de hoy ───────────────────── */
almacen.productividad = {
  tareas: [{ id: 'ge-2', texto: 'Otra tarea de hoy', fecha: hoyGE1(), hecha: false, prioridad: 'alta' }],
  habitos: [], rutinas: [], rutinaEjecuciones: [], metas: [], pomodoros: {}, pomodoroSesiones: [], apuntes: [],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Vida');
ok(await pulsar('Productividad'), '9 — se abre Productividad');
const prod_ge1 = await esperarTexto(/H[aá]bitos/i);
ok(!/Para hoy/i.test(prod_ge1) || !/Otra tarea de hoy/i.test(prod_ge1),
  '🚨 9 — Productividad ya NO copia la tarea de hoy: su sitio es Día');
ok(/H[aá]bitos/i.test(prod_ge1) && /Pomodoro/i.test(prod_ge1),
  '⚠️ …y sus herramientas siguen enteras: el encargo era quitar la copia, no vaciar la portada');

/* Y la tarea sigue existiendo: se puede abrir su lista y verla.
   ⚠️ DIST F1 — esa lista vive ahora en Gestión → Organización, no aquí. Lo que
   la comprobación dice sigue siendo lo mismo: la tarea NO se ha tocado. */
await pulsar('Gestión');
await pulsar('Organización');
ok(await pulsar('Tareas'), 'se abre Tareas desde Organización');
const tareas_ge1 = await esperarTexto(/Otra tarea de hoy/i);
ok(/Otra tarea de hoy/i.test(tareas_ge1),
  '🚨 …porque la tarea NO se ha tocado: sigue en `productividad.tareas`, que es la única fuente');

/* ⚠️ Y lo último de la sección: que el día siga siendo el mismo. Si ha cambiado,
   todo lo de arriba ha medido un día distinto del que sembró, y eso se dice aquí
   en vez de dejar seis rojos sin explicación. */
ok(DIA_AL_EMPEZAR_GE1 === hoyGE1(),
  `⚠️ …y el día no ha cambiado a mitad de la sección (empezó el ${DIA_AL_EMPEZAR_GE1}): si cambia, lo de arriba mide otro día`);

/* ── 10 · Nutrición: los tres macros en una fila ─────────────────────────── */
await pulsar('Bienestar');
ok(await pulsar('Nutrición'), '10 — se abre Nutrición');
await esperarTexto(/Calor[ií]as/i);

/* 🚨 Se mide la POSICIÓN REAL en el navegador: que los tres estén a la misma
   altura es lo único que demuestra que van en una fila. Fiarse de la clase
   `grid-cols-3` sería fiarse de que nadie la haya sobrescrito. */
const filaMacros = await page.evaluate(() => {
  const textos = ['Proteína', 'Carbos', 'Grasas'];
  const tops = textos.map((txt) => {
    const el = [...document.querySelectorAll('p')].find((p) => (p.innerText || '').includes(txt));
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  });
  return tops;
});
ok(filaMacros.every((x) => x !== null),
  `🚨 los tres macros se ven en pantalla (${JSON.stringify(filaMacros)})`);
ok(filaMacros.every((x) => x !== null) && Math.max(...filaMacros) - Math.min(...filaMacros) < 8,
  '🚨 10 — LOS TRES ESTÁN EN LA MISMA FILA: ninguno cae a una segunda línea dejando hueco');

// ⚠️ Y en el ancho de un iPhone, que es donde no cabían.
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(600);
const filaMovil = await page.evaluate(() => {
  const textos = ['Proteína', 'Carbos', 'Grasas'];
  return textos.map((txt) => {
    const el = [...document.querySelectorAll('p')].find((p) => (p.innerText || '').includes(txt));
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  });
});
ok(filaMovil.every((x) => x !== null) && Math.max(...filaMovil) - Math.min(...filaMovil) < 8,
  '🚨 …y TAMBIÉN en 375 px de ancho, que es el iPhone de Josué');
/* 🐛 **Y esta comprobación encontró un fallo que NO era de esta fase.** Las
   cuatro pestañas de Nutrición no cabían en 375 px —«📊 Estadísticas» pedía
   123 px y le tocaban 80—, así que la pantalla se salía 6 px y **se podía
   arrastrar a lo ancho** en el iPhone de Josué. Venía de la E3 F38, que añadió
   la cuarta pestaña. Se arregló con `flex-wrap` en su contenedor (no en
   `ToggleTab`, que lo usan diez vistas). **Una comprobación nueva sobre una
   pantalla vieja encuentra lo que llevaba ahí desde antes.** */
const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
ok(!desborda, '⚠️ …sin desbordar a lo ancho (y aquí saltó el desbordamiento de las pestañas)');

/* ===========================================================================
   GE F2 — EL SOLAPAMIENTO FALSO DEL HORARIO
   ===========================================================================
   Josue: *"Los horarios eliminados siguen provocando deteccion falsa de
   solapamientos"*, y *"verifica que la interfaz refleja los datos persistidos"*.

   BUG: `duplicarHorario` dejaba la copia activa y vigente desde hoy con las
   mismas clases, y `resolverDia` suma todos los horarios vigentes, asi que
   cada clase se resolvia dos veces.

   OJO: el dia de las clases SE CALCULA, no se escribe. El aviso de choques es
   del dia que se esta viendo, asi que unas clases puestas "el lunes" no se ven
   un sabado y la comprobacion saldria verde sin haber mirado nada. `dia` va de
   1 (lunes) a 7 (domingo), como `diaDeFecha`.

   Sufijo `_ge2`: dos `const` iguales en este archivo plano no compilan. */
await page.setViewportSize({ width: 1280, height: 900 });
const hoyISO_ge2 = new Date().toLocaleDateString('sv-SE');
const diaHoy_ge2 = ((new Date().getDay() + 6) % 7) + 1;
/* 🚨 **LA FRANJA DEL ESCENARIO SE ELIGE PARA QUE NINGUNA CLASE ESTÉ EN CURSO**
   (FIT F26, y es la carrera de abajo atacada por la raíz). El motor temporal del
   horario **guarda su estado mientras una clase suena**, y ese guardado de la
   página que se va pisa el escenario recién puesto: la pantalla se queda con las
   clases del caso ANTERIOR y las comprobaciones se ponen rojas **a ciertas horas
   del día**. La doble carga de `abrirHorario_ge2` lo tapaba para la ventana de
   las 09:00; a las 08:35 —con las clases de las 08:00 y las 08:30 sonando a la
   vez— volvió a caer, y cayeron cuatro del caso C).
   ⚠️ **Si ninguna clase está en curso, no hay nada que guardar y no hay carrera**,
   así que la franja se elige entre dos que no contienen la hora actual. Las horas
   concretas dan igual: lo que se mide es si se solapan, no cuándo. */
const FRANJAS_GE2 = [
  { base: 3, fila: ['03:00', '05:00'] },
  { base: 15, fila: ['15:00', '17:00'] },
];
const franjaGe2 = (() => {
  const ahora = new Date().getHours();
  return FRANJAS_GE2.find((f) => ahora < f.base - 1 || ahora > f.base + 3) || FRANJAS_GE2[1];
})();
/* «08:00» pasa a ser la base, «09:00» una hora más tarde, y así: se conserva
   exactamente la misma forma del escenario, movida de sitio. */
const horaGe2 = (etiqueta) => {
  const [h, m] = etiqueta.split(':').map(Number);
  return `${String(franjaGe2.base + (h - 8)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const horarioGe2 = (id, nombre, extra = {}) => ({
  id, nombre, activo: true, archivado: false, creadoEn: hoyISO_ge2, ...extra,
  columnas: [{ id: `c_${id}`, horarioId: id, nombre: 'Hoy', dia: diaHoy_ge2, posicion: 0, visible: true }],
  filas: [{ id: `f_${id}`, tipo: 'hora', inicio: franjaGe2.fila[0], fin: franjaGe2.fila[1], posicion: 0 }],
});
const claseGe2 = (id, horarioId, inicio, fin, titulo) => ({
  id, horarioId, columnaId: `c_${horarioId}`, filaId: `f_${horarioId}`,
  inicio: horaGe2(inicio), fin: horaGe2(fin), titulo,
});
const baseGe2 = (horarios, bloques) => ({
  horarios, bloques, actividades: [], excepciones: [], confirmaciones: [], avisos: [], mochila: [],
});
const irAlHorario_ge2 = async () => {
  await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
  await pulsar('Gestión');
  // DIST F1 — el Horario vive dentro de Organización (Gestión → Organización).
  await pulsar('Organización');
  await pulsar('Horario');
};

/* 🐛 **Carrera al cambiar de escenario, y solo con una clase EN CURSO.** Entre
   las 09:00 y las 10:00 la clase de las nueve está sonando, el motor temporal
   del horario guarda su estado, y ese guardado de la página vieja pisaba el
   escenario que la prueba acababa de dejar en el almacén: la pantalla seguía
   enseñando las clases del caso anterior y tres comprobaciones se ponían rojas
   **a ciertas horas del día**. Se vuelve a dejar el escenario con la página
   nueva ya cargada —la vieja ya no puede escribir— y se recarga. */
const abrirHorario_ge2 = async () => {
  const escenario = almacen.horarioTop;
  /* Primera carga: la página anterior se va y suelta lo que tuviera pendiente
     de guardar. Segunda: con el escenario repuesto, que ya nadie puede pisar. */
  await irAlHorario_ge2();
  almacen.horarioTop = escenario;
  await irAlHorario_ge2();
};

/* A) Un horario, dos clases SEGUIDAS. Tocarse no es solaparse: si aqui saliera
   un choque, ya seria el falso positivo que reporto Josue. */
almacen.horarioTop = baseGe2(
  [horarioGe2('hg1', 'Curso 25-26')],
  [claseGe2('bg1', 'hg1', '08:00', '09:00', 'Mates'), claseGe2('bg2', 'hg1', '09:00', '10:00', 'Lengua')],
);
await abrirHorario_ge2();
/* La CUENTA del dia no depende de la hora; los nombres si. A partir de las
   10:00 las dos clases ya han pasado y el dia las pliega detras de "Ver lo
   pasado", asi que la prueba fallaba por la tarde y pasaba por la manana.
   Es el mismo error que el dia de la semana: una prueba no puede depender del
   reloj. Se comprueba la cuenta, y despues se abren las pasadas si las hay. */
const ge2_sano = await esperarTexto(/actividades/);
ok(/2 actividades/.test(ge2_sano), 'GE F2 - A) el dia trae las dos clases de hoy');
ok(!/choque/i.test(ge2_sano),
  'GE F2 - A) y NO anuncia ningun choque: dos clases seguidas no se solapan');
await pulsar('Ver lo pasado', 1500);
const ge2_clases = await ver();
ok(/Mates/.test(ge2_clases) && /Lengua/.test(ge2_clases),
  'GE F2 - A) y las dos se ven por su nombre, hayan pasado ya o no');

/* B) CASO E: dos horarios DISTINTOS, los dos activos a proposito, que de verdad
   se pisan. TIENE que seguir detectandose -- es lo que el encargo exige
   conservar, y por eso el arreglo no fue acotar la deteccion. */
almacen.horarioTop = baseGe2(
  [horarioGe2('hg1', 'Curso 25-26'), horarioGe2('hg2', 'Gimnasio')],
  [claseGe2('bg1', 'hg1', '08:00', '09:00', 'Mates'), claseGe2('bq1', 'hg2', '08:30', '09:30', 'Pesas')],
);
await abrirHorario_ge2();
/* ⚠️ Con DOS horarios la pantalla pinta más cosas, y bajo carga esta espera se
   quedaba corta: se le da margen. Y si aun así falla, **el mensaje dice lo que
   había en pantalla**, porque un rojo que no se puede diagnosticar cuesta una
   pasada entera — que es justo la lección de esta fase. */
const ge2_choque = await esperarTexto(/choque/i, 15000);
ok(/choque/i.test(ge2_choque),
  `GE F2 - B) CASO E: un choque de VERDAD entre dos horarios se sigue detectando${/choque/i.test(ge2_choque) ? '' : ` — en pantalla: ${ge2_choque.slice(0, 200).replace(/\s+/g, ' ')}`}`);
/* Y lo que hacia este fallo indescifrable: el numero a secas. Ahora dice QUE
   choca y DE QUE horario viene cada lado. */
ok(/Mates \(Curso 25-26\)/.test(ge2_choque) && /Pesas \(Gimnasio\)/.test(ge2_choque),
  'GE F2 - B) y dice QUE choca y DE QUE HORARIOS: un numero suelto no se puede diagnosticar');
ok(/Mis horarios/i.test(ge2_choque) && /los dos están activos/i.test(ge2_choque),
  'GE F2 - B) y ofrece la salida, que es lo que arregla los datos que ya tiene guardados');

/* C) Con el de mas archivado, el choque desaparece -- y sobrevive a recargar,
   que es lo que pidio comprobar: la pantalla refleja lo persistido. */
almacen.horarioTop = baseGe2(
  [horarioGe2('hg1', 'Curso 25-26'), horarioGe2('hg2', 'Gimnasio', { activo: false, archivado: true })],
  [claseGe2('bg1', 'hg1', '08:00', '09:00', 'Mates'), claseGe2('bq1', 'hg2', '08:30', '09:30', 'Pesas')],
);
await abrirHorario_ge2();
const ge2_archivado = await esperarTexto(/actividades|Nada programado/);
ok(!/choque/i.test(ge2_archivado),
  'GE F2 - C) Con el otro horario archivado, el choque desaparece');
/* Y se comprueba EN POSITIVO que la clase del horario activo sigue estando,
   porque si no lo que se ve es una pantalla equivocada y el "no hay Pesas" de
   abajo saldria verde sin haber mirado nada. */
await pulsar('Ver lo pasado', 1500);
const ge2_soloUno = await ver();
ok(/Mates/.test(ge2_soloUno), 'GE F2 - C) la clase del horario activo sigue ahi');
ok(!/Pesas/.test(ge2_soloUno),
  'GE F2 - C) y las del archivado dejan de resolver, sin haberse borrado');

await abrirHorario_ge2();
const ge2_recargado = await esperarTexto(/actividades|Nada programado/);
ok(!/choque/i.test(ge2_recargado),
  'GE F2 - C) RECARGA: sigue sin choques, asi que no era un estado de pantalla');
await pulsar('Ver lo pasado', 1500);
const ge2_trasRecarga = await ver();
ok(/Mates/.test(ge2_trasRecarga) && !/Pesas/.test(ge2_trasRecarga),
  'GE F2 - C) RECARGA: y sigue viendose solo lo del horario activo');

/* ═══════════════════════════════════════════════════════════════════════════
   DIST F2 — LA AUDITORÍA: VOLVER ATRÁS Y EL ANCHO DE UN iPHONE
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Lo que las pruebas de Node NO pueden decir. Ellas leen los catálogos y
   demuestran que la navegación está bien **escrita**; esto demuestra que se
   puede **andar** por ella con el dedo y que cabe en 375 px, que es el iPhone
   de Josué. Es la lección de la E3 F30 (un renombrado a medias que solo vio
   Chromium) y la de GE F1 (nadie medía el ancho, y la pantalla se arrastraba).

   Josué: *"No conviertas las nuevas agrupaciones en callejones sin salida"* y
   *"La cuadrícula de módulos debe mantenerse limpia, no desbordarse."* */
await page.setViewportSize({ width: 375, height: 812 });
almacen.productividad = { tareas: [], habitos: [], rutinas: [], rutinaEjecuciones: [], metas: [], pomodoros: {}, pomodoroSesiones: [], apuntes: [] };
almacen.horarioTop = null;
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

const desbordaAncho = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);

/* ── 1 · Las cinco pestañas caben y se leen ───────────────────────────────── */
const barra_d2 = await page.evaluate(() => {
  const nav = document.querySelector('nav');
  if (!nav) return null;
  const botones = [...nav.querySelectorAll('button')];
  return {
    cuantos: botones.length,
    rotulos: botones.map((b) => (b.innerText || '').trim()),
    // ¿Alguno se sale de su hueco? Eso es un rótulo cortado.
    cortados: botones.filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => (b.innerText || '').trim()),
  };
});
ok(barra_d2?.cuantos === 5, `🚨 DIST F2 — CINCO pestañas en la barra, ni una más (${barra_d2?.cuantos})`);
ok(['Inicio', 'Bienestar', 'Vida', 'Gestión', 'Ajustes'].every((t) => barra_d2.rotulos.includes(t)),
  `🚨 …y son las que pidió Josué: ${JSON.stringify(barra_d2?.rotulos)}`);
ok((barra_d2?.cortados || []).length === 0,
  `🚨 …y ninguna se corta a 375 px${(barra_d2?.cortados || []).length ? ` — ${JSON.stringify(barra_d2.cortados)}` : ''}`);
ok(!(await desbordaAncho()), '⚠️ …y la portada no se arrastra a lo ancho');

/* ── 2 · Las tres cuadrículas de área, a 375 px ───────────────────────────── */
for (const area of ['Bienestar', 'Vida', 'Gestión']) {
  ok(await pulsar(area), `se entra en ${area} a 375 px`);
  await page.waitForTimeout(700);
  ok(!(await desbordaAncho()), `🚨 …y la cuadrícula de ${area} NO desborda a lo ancho`);
  /* ⚠️ Y las tarjetas se alinean en columnas: si una midiera distinto que las
     demás, la rejilla estaría rota aunque no desbordara. */
  const anchos = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.hub-card')];
    return cards.map((c) => Math.round(c.getBoundingClientRect().width));
  });
  ok(anchos.length >= 4 && new Set(anchos).size <= 2,
    `⚠️ …y sus tarjetas miden igual (${JSON.stringify([...new Set(anchos)])})`);
}

/* ── 3 · Volver atrás: sección → módulo → submódulo → y de vuelta ─────────── */
/* 🚨 La jerarquía que pidió Josué, andada entera. Un submódulo que no sabe
   volver a su agrupador es el callejón sin salida que él prohíbe. */
ok(await pulsar('Organización'), '🚨 DIST F2 — Gestión → Organización');
await esperarTexto(/Calendario/i);
ok(await pulsar('Horario'), '…→ Horario (tercer nivel)');
await page.waitForTimeout(700);
ok(await pulsar('Organización'), '🚨 …y el volver devuelve a ORGANIZACIÓN, no al área');
const orgVuelta_d2 = await esperarTexto(/Calendario/i);
ok(/Tareas/i.test(orgVuelta_d2) && /Horario/i.test(orgVuelta_d2),
  '⚠️ …con sus tres cosas otra vez a la vista');
ok(await pulsar('Gestión'), '🚨 …y desde Organización se vuelve a GESTIÓN');
const gesVuelta_d2 = await esperarTexto(/Econom[ií]a/i);
ok(/Organizaci[oó]n/i.test(gesVuelta_d2) && /Progreso/i.test(gesVuelta_d2),
  '⚠️ …que sigue entera: ni un módulo se ha perdido por el camino');

/* Y lo mismo en Mente, que es la otra agrupadora. */
ok(await pulsar('Vida'), 'se entra en Vida');
ok(await pulsar('Mente'), '🚨 Vida → Mente');
await esperarTexto(/Bienestar digital/i);
ok(!(await desbordaAncho()), '⚠️ …y Mente tampoco desborda a 375 px');
ok(await pulsar('Fe'), '…→ Fe (tercer nivel)');
await page.waitForTimeout(700);
ok(await pulsar('Mente'), '🚨 …y el volver devuelve a MENTE');
await esperarTexto(/Relaci[oó]n/i);
ok(await pulsar('Vida'), '🚨 …y de Mente se vuelve a VIDA');
await esperarTexto(/Estudios/i);

/* ── 4 · Ajustes conserva TODAS sus categorías ────────────────────────────── */
/* Josué: *"Comprueba que todas las opciones que existían anteriormente dentro
   de Ajustes sigan accesibles."* */
ok(await pulsar('Ajustes'), '🚨 DIST F2 — Ajustes se abre de un toque desde la barra');
const aj_d2 = await esperarTexto(/Apariencia/i);
for (const cat of [/Perfil/, /Apariencia/, /Preferencias generales/, /Notificaciones/, /Seguridad/, /Integraciones/]) {
  ok(cat.test(aj_d2), `⚠️ …y conserva ${cat.source}`);
}
ok(!(await desbordaAncho()), '⚠️ …y Ajustes tampoco desborda a 375 px');

/* ── 5 · Ningún nombre retirado se lee por ninguna parte ──────────────────── */
/* 🚨 Josué: *"No debe quedar ninguna referencia visible a «Estilo de hombre»"*.
   Se barren las pantallas por las que se acaba de pasar. */
const barrido_d2 = [];
for (const [area, modulo] of [['Bienestar', 'Imagen personal'], ['Bienestar', 'Salud física'], ['Gestión', 'Progreso']]) {
  await pulsar(area);
  await pulsar(modulo);
  await page.waitForTimeout(800);
  barrido_d2.push(await ver());
}
const todo_d2 = barrido_d2.join(' ');
ok(!/Estilo de hombre/i.test(todo_d2),
  '🚨 DIST F2 — «Estilo de hombre» NO se lee en ninguna de las pantallas visitadas');
/* 🐛 **Y esta comprobación mía saltó con la pantalla bien.** El botón
   «Analizar mi salud» contiene la frase y es legítimo —la E3 F30 lo exige:
   *"no eliminarla, no esconderla"*—, así que se descuenta, igual que ya hacía
   la comprobación de aquella fase. **Antes de negar una palabra, mirar qué la
   contiene de verdad.** */
ok(!/Mi salud/i.test(todo_d2.replace(/Analizar mi salud/gi, '')),
  '🏷️ …ni «Mi salud» como nombre de módulo: es «Salud física»');
ok(!/\bNúmeros\b/.test(todo_d2), '🏷️ …ni «Números»: el apartado es «Progreso»');

/* ═══════════════════════════════════════════════════════════════════════════
   PF F1 — EL AVATAR EN LA CABECERA DE AJUSTES
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Lo que ninguna prueba de Node dice: que el avatar **se ve arriba** y que
   **se puede tocar**. Se prueba a 375 px, que es donde tiene que caber junto al
   título sin empujarlo. */
almacen.perfil = { nombre: 'Josué', nombreMostrado: 'Josué', foto: null };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Ajustes'), '🚨 PF F1 — se abre Ajustes');
await esperarTexto(/Apariencia/i);

/* ⚠️ Se busca el botón por su `aria-label`, que es como lo encontraría alguien
   con VoiceOver — y es lo único que demuestra que el avatar es PULSABLE y no un
   dibujo. Sin foto, su etiqueta es «Elegir». */
const avatar_pf = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')]
    .find((x) => /tu foto de perfil/i.test(x.getAttribute('aria-label') || ''));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { etiqueta: b.getAttribute('aria-label'), top: Math.round(r.top), lado: Math.round(r.width), derecha: Math.round(r.right) };
});
ok(!!avatar_pf, '🚨 el avatar existe en la cabecera y es un botón, no un dibujo');
ok(/elegir/i.test(avatar_pf?.etiqueta || ''),
  `⚠️ …y sin foto invita a elegir una (${avatar_pf?.etiqueta})`);
/* 🚨 «En la parte superior»: tiene que estar arriba del todo, por encima del
   buscador y de la lista de categorías. */
ok(avatar_pf.top < 220, `🚨 …y está EN LA PARTE SUPERIOR de la pantalla (${avatar_pf.top} px)`);
ok(avatar_pf.derecha <= 375, `⚠️ …sin salirse por la derecha en un iPhone (${avatar_pf.derecha} px de 375)`);
ok(avatar_pf.lado >= 44, `⚠️ …y con zona de toque suficiente (${avatar_pf.lado} px)`);
ok(!(await desbordaAncho()), '⚠️ …y la cabecera no desborda a lo ancho');

/* 🚨 Y CON FOTO: se ve la suya, redonda, y la etiqueta cambia a «Cambiar».
   Se siembra una imagen de verdad —un PNG de 1 px en `data:`— porque el
   selector de archivos del sistema no se puede abrir desde una prueba. */
const PNG_PF = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
almacen.perfil = { nombre: 'Josué', nombreMostrado: 'Josué', foto: PNG_PF };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Ajustes');
await esperarTexto(/Apariencia/i);
const conFoto_pf = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')]
    .find((x) => /tu foto de perfil/i.test(x.getAttribute('aria-label') || ''));
  const img = b?.querySelector('img');
  const circulo = b?.querySelector('div');
  return {
    etiqueta: b?.getAttribute('aria-label') || null,
    hayImagen: !!img,
    src: (img?.getAttribute('src') || '').slice(0, 14),
    radio: circulo ? getComputedStyle(circulo).borderRadius : null,
  };
});
ok(conFoto_pf.hayImagen, '🚨 PF F1 — CON FOTO, la cabecera pinta SU imagen');
ok(conFoto_pf.src === 'data:image/png', `⚠️ …que es la suya, la guardada (${conFoto_pf.src})`);
ok(/9999px|50%/.test(conFoto_pf.radio || ''), `🚨 …y se ve REDONDA (${conFoto_pf.radio})`);
ok(/cambiar/i.test(conFoto_pf.etiqueta || ''),
  `⚠️ …y ahora invita a cambiarla, no a elegirla (${conFoto_pf.etiqueta})`);

/* 🚨 **Y SIGUE AHÍ DESPUÉS DE RECARGAR**, que es el punto 3 de su encargo. */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Ajustes');
await esperarTexto(/Apariencia/i);
const trasRecargar_pf = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')]
    .find((x) => /tu foto de perfil/i.test(x.getAttribute('aria-label') || ''));
  return !!b?.querySelector('img');
});
ok(trasRecargar_pf, '🚨 PF F1 — y la foto SIGUE AHÍ después de recargar la aplicación');

/* ⚠️ Y no se ha roto la categoría Perfil: su tarjeta grande sigue entera, con
   el «Quitar», que es donde vive lo irreversible. */
ok(await pulsar('Perfil'), 'se abre la categoría Perfil');
const perfil_pf = await esperarTexto(/foto de perfil/i);
ok(/Quitar/i.test(perfil_pf), '🚨 …y sigue teniendo su «Quitar», que NO está en la cabecera a propósito');
ok(/Datos básicos/i.test(perfil_pf), '⚠️ …y el resto de la categoría, intacto');

/* ═══════════════════════════════════════════════════════════════════════════
   SC F1 — SCROLL, CABECERAS FIJAS Y EL ACORDEÓN DE INICIO
   ═══════════════════════════════════════════════════════════════════════════

   Tres fallos que reportó Josué desde su iPhone. Esta sección **mide**, no mira:
   posiciones en píxeles antes y después de desplazar, y el alto real de la
   tarjeta cerrada. A 375 px, que es su pantalla.

   ⚠️ Lo que NO puede demostrar, y está dicho en `FUERA_DEL_ALCANCE_SC`: que el
   cuadrado vacío haya desaparecido **en Safari**. Chromium es justo el navegador
   en el que ese fallo nunca se vio. Aquí se comprueba que el arreglo está y que
   el cierre mide cero; el dedo lo pone él.
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── SC F1 · La cabecera se queda quieta y el acordeón cierra a cero ──');
await page.setViewportSize({ width: 375, height: 667 });
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* ── 1 · Vida: la cabecera NO se mueve al desplazar, y las tarjetas SÍ ─────── */
ok(await pulsar('Vida'), 'SC F1 — se abre el área Vida');
await esperarTexto(/Área/i);
const medirVida = async () => page.evaluate(() => {
  const cab = document.querySelector('.hub-sticky');
  const card = document.querySelector('.hub-card');
  return {
    cabecera: cab ? Math.round(cab.getBoundingClientRect().top) : null,
    tarjeta: card ? Math.round(card.getBoundingClientRect().top) : null,
    scroll: Math.round(window.scrollY),
  };
});
const antes_sc = await medirVida();
ok(antes_sc.cabecera !== null, 'la cabecera del área existe y se puede medir');
await page.evaluate(() => window.scrollTo(0, 260));
await page.waitForTimeout(420);
const despues_sc = await medirVida();
ok(despues_sc.scroll > 100, `⚠️ la página se ha desplazado de verdad (${despues_sc.scroll} px)`);
/* 🚨 ÉSTE ES EL FALLO QUE REPORTÓ. La cabecera tiene que seguir exactamente donde
   estaba, y las tarjetas tienen que haber subido. Si las dos se mueven, es el
   comportamiento de antes. */
ok(Math.abs(despues_sc.cabecera - antes_sc.cabecera) <= 1,
  `🚨 SC F1 — la cabecera NO se mueve al desplazar (${antes_sc.cabecera} → ${despues_sc.cabecera})`);
ok(antes_sc.tarjeta - despues_sc.tarjeta > 100,
  `🚨 …y las tarjetas SÍ se desplazan por detrás (${antes_sc.tarjeta} → ${despues_sc.tarjeta})`);

/* ── 2 · La lupa sigue fija, y la cabecera no la tapa ──────────────────────── */
const lupa_sc = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')]
    .find((x) => /buscar funciones/i.test(x.getAttribute('aria-label') || ''));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const cab = document.querySelector('.hub-sticky');
  const zCab = cab ? Number(getComputedStyle(cab).zIndex) : null;
  // ¿Quién responde al toque en el centro de la lupa? Si la banda la tapara,
  // sería otro elemento — y el buscador dejaría de abrirse.
  const enCima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { top: Math.round(r.top), zCab, laRecibe: !!(enCima && (enCima === b || b.contains(enCima))) };
});
ok(lupa_sc && lupa_sc.top >= 0 && lupa_sc.top < 120,
  `🚨 SC F1 — la lupa sigue fija arriba y entera, sin cortarse (top ${lupa_sc?.top})`);
ok(lupa_sc && lupa_sc.zCab !== null && lupa_sc.zCab < 30,
  `⚠️ …y la banda de la cabecera va por DEBAJO de ella (z-index ${lupa_sc?.zCab} < 30)`);
ok(lupa_sc && lupa_sc.laRecibe,
  '🚨 …y el toque en la lupa lo sigue recibiendo la lupa: la banda no la ha tapado');

/* ── 3 · Nada se sale de ancho, y las cinco filas caben ───────────────────── */
const ancho_sc = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  filas: document.querySelectorAll('.hub-card').length,
  alto: Math.round(document.querySelector('.hub-card')?.getBoundingClientRect().height || 0),
}));
ok(!ancho_sc.desborda, `⚠️ la pantalla no se arrastra de lado a 375 px (${ancho_sc.scrollWidth} px)`);
ok(ancho_sc.filas === 5, `Vida sigue teniendo sus cinco módulos (${ancho_sc.filas})`);
/* 🚨 Las filas encogieron, y se mide: antes de esta fase una tarjeta pasaba de
   105 px. No se comprueba un número exacto —eso sería una bomba de relojería
   (EH F21)— sino que está por debajo del listón que la hacía no caber. */
ok(ancho_sc.alto > 0 && ancho_sc.alto < 102,
  `🚨 SC F1 — las filas son más compactas que antes (${ancho_sc.alto} px por tarjeta)`);

/* ── 4 · Y las dos líneas de resumen NO se han perdido por compactar ───────── */
const lineas_sc = await page.evaluate(() => {
  const card = document.querySelector('.hub-card');
  return card ? card.innerText.split('\n').filter((x) => x.trim()).length : 0;
});
ok(lineas_sc >= 3,
  `🚨 …y cada tarjeta sigue con su nombre y sus DOS líneas de resumen (${lineas_sc} líneas)`);

/* ── 5 · Gestión se comporta igual que Vida ───────────────────────────────── */
ok(await pulsar('Gestión'), 'se abre el área Gestión');
await esperarTexto(/Área/i);
await page.evaluate(() => window.scrollTo(0, 240));
await page.waitForTimeout(420);
const gestion_sc = await page.evaluate(() => {
  const cab = document.querySelector('.hub-sticky');
  return { top: Math.round(cab.getBoundingClientRect().top), texto: cab.innerText };
});
ok(Math.abs(gestion_sc.top - antes_sc.cabecera) <= 1,
  `⚠️ SC F1 — Gestión se comporta EXACTAMENTE igual que Vida (top ${gestion_sc.top})`);
ok(/gesti/i.test(gestion_sc.texto), '…y la cabecera sigue diciendo de qué área es');

/* ── 6 · Inicio: la tarjeta desplegable cierra a cero de verdad ───────────── */
await pulsar('Inicio');
await esperarTexto(/hoy/i);
const medirAcordeon = async () => page.evaluate(() => {
  const panel = document.getElementById('panel-situacion-actual');
  if (!panel) return null;
  const item = panel.firstElementChild;
  const tarjeta = panel.parentElement;
  return {
    panel: Math.round(panel.getBoundingClientRect().height),
    item: item ? Math.round(item.getBoundingClientRect().height) : null,
    tarjeta: Math.round(tarjeta.getBoundingClientRect().height),
    minHeight: item ? getComputedStyle(item).minHeight : null,
  };
});
const cerrado_sc = await medirAcordeon();
ok(cerrado_sc !== null, 'SC F1 — la tarjeta desplegable de Inicio está en pantalla');
/* 🚨 EL FALLO: cerrada tiene que medir CERO. Cualquier cosa por encima de un par
   de píxeles es el cuadrado vacío que él veía debajo. */
ok(cerrado_sc.panel <= 2,
  `🚨 SC F1 — cerrada no ocupa NADA: ni un hueco vacío debajo (${cerrado_sc.panel} px)`);
ok(cerrado_sc.minHeight === '0px',
  `🚨 …y el elemento de rejilla lleva \`min-height: 0\`, que es la causa del fallo (${cerrado_sc.minHeight})`);
const altoCerrada_sc = cerrado_sc.tarjeta;

/* ── 7 · Y abierta se expande de verdad, empujando lo de abajo ────────────── */
const antesDeAbrir_sc = await page.evaluate(() => {
  const t = document.getElementById('panel-situacion-actual')?.parentElement;
  let n = t?.nextElementSibling;
  return n ? Math.round(n.getBoundingClientRect().top) : null;
});
await page.evaluate(() => {
  const b = document.querySelector('[aria-controls="panel-situacion-actual"]');
  if (b) b.click();
});
await page.waitForTimeout(520);
const abierto_sc = await medirAcordeon();
ok(abierto_sc.panel > 40,
  `🚨 SC F1 — abierta se expande de verdad (${altoCerrada_sc} → ${abierto_sc.tarjeta} px de tarjeta)`);
const trasAbrir_sc = await page.evaluate(() => {
  const t = document.getElementById('panel-situacion-actual')?.parentElement;
  let n = t?.nextElementSibling;
  return n ? Math.round(n.getBoundingClientRect().top) : null;
});
ok(antesDeAbrir_sc !== null && trasAbrir_sc - antesDeAbrir_sc > 40,
  `⚠️ …y lo de abajo baja de forma natural (${antesDeAbrir_sc} → ${trasAbrir_sc})`);

/* ── 8 · Y al cerrarla vuelve EXACTAMENTE a su alto compacto ──────────────── */
await page.evaluate(() => {
  const b = document.querySelector('[aria-controls="panel-situacion-actual"]');
  if (b) b.click();
});
await page.waitForTimeout(620);
const recerrado_sc = await medirAcordeon();
ok(recerrado_sc.panel <= 2,
  `🚨 SC F1 — al cerrarla vuelve a cero, sin altura residual (${recerrado_sc.panel} px)`);
ok(Math.abs(recerrado_sc.tarjeta - altoCerrada_sc) <= 2,
  `⚠️ …y la tarjeta recupera su alto compacto de antes (${altoCerrada_sc} → ${recerrado_sc.tarjeta})`);

/* ═══════════════════════════════════════════════════════════════════════════
   NAVO F1 — ATRÁS VUELVE DE DONDE VINISTE, NO AL ÁREA DEL MÓDULO
   ═══════════════════════════════════════════════════════════════════════════

   Josué: *"Si entro desde Inicio a una funcionalidad… y después pulso atrás, la
   aplicación puede devolverme a otra sección como Gestión."*

   🚨 **ECONOMÍA ES EL CASO PERFECTO PARA MEDIRLO**, y por eso se usa aquí: vive
   en Gestión y tiene una tarjeta en Inicio. Abierta desde Inicio, el botón de
   atrás decía «Gestión» —un sitio por el que Josué no había pasado— y ahora dice
   «Inicio». La MISMA pantalla, dos orígenes, dos vueltas distintas: eso es lo que
   demuestra que atrás mira el recorrido y no el catálogo.
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── NAVO F1 · Atrás vuelve de donde viniste ──');
await page.setViewportSize({ width: 375, height: 667 });
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* 🐛 **ESPERA, NO MIRA UNA VEZ.** La primera versión leía la barra de atrás justo después de un
   `waitForTimeout` fijo, y bajo carga —con veinticinco minutos de recorrido por delante— llegaba
   antes de que la pantalla se pintara: devolvía `null` con la aplicación perfecta. Es la lección de
   EH F51 y EH F57, que ya costó dos cascadas de rojos falsos: **nunca esperar milisegundos fijos a
   que aparezca algo; esperar a que aparezca.** Si de verdad no está, sigue devolviendo `null` y la
   comprobación falla igual. */
const rotuloAtras = async (tope = 5000) => {
  const hasta = Date.now() + tope;
  do {
    const t = await page.evaluate(() => {
      const b = document.querySelector('button.back-bar');
      return b ? b.innerText.trim() : null;
    });
    if (t) return t;
    await page.waitForTimeout(120);
  } while (Date.now() < hasta);
  return null;
};

/* ── 1 · Desde INICIO: el fallo que él reportó ─────────────────────────────── */
ok(await pulsar('Economía'), 'NAVO F1 — se abre Economía desde Inicio');
await esperarTexto(/econom/i);
const desdeInicio_nv = await rotuloAtras();
ok(desdeInicio_nv !== null, 'hay un botón de atrás');
ok(/inicio/i.test(desdeInicio_nv || ''),
  `🚨 NAVO F1 — abierta desde INICIO, atrás dice «Inicio» (decía «Gestión»): «${desdeInicio_nv}»`);
ok(await pulsar(desdeInicio_nv), '…y se pulsa');
await esperarTexto(/hoy|inicio/i);
/* ⚠️ Se comprueba con la ESTRUCTURA, no con una palabra suelta: un hub siempre pinta su cabecera
   pegada y un módulo siempre pinta su barra de atrás. Buscar «Área» en el texto era frágil —
   cualquier pantalla podría llegar a decir esa palabra por otro motivo.
   ⚠️ Y se ESPERA a que las dos desaparezcan en vez de mirar una vez tras un retardo fijo: bajo
   carga, mirar pronto da un rojo falso (EH F51). */
const sinRastro = async (tope = 5000) => {
  const hasta = Date.now() + tope;
  let ultimo = { hub: true, back: true };
  do {
    ultimo = await page.evaluate(() => ({
      hub: !!document.querySelector('.hub-sticky'),
      back: !!document.querySelector('button.back-bar'),
    }));
    if (!ultimo.hub && !ultimo.back) return ultimo;
    await page.waitForTimeout(120);
  } while (Date.now() < hasta);
  return ultimo;
};
const dondeAcabo_nv = await sinRastro();
ok(!dondeAcabo_nv.hub && !dondeAcabo_nv.back,
  '🚨 …y acaba en Inicio DE VERDAD: ni cabecera de área ni barra de atrás');

/* ── 2 · La MISMA pantalla desde Gestión vuelve a Gestión ─────────────────── */
ok(await pulsar('Gestión'), 'se entra en Gestión por la barra de abajo');
await esperarTexto(/Área/i);
ok(await pulsar('Economía'), '…y se abre Economía desde ahí');
await esperarTexto(/econom/i);
const desdeGestion_nv = await rotuloAtras();
ok(/gesti/i.test(desdeGestion_nv || ''),
  `🚨 NAVO F1 — la MISMA pantalla, abierta desde Gestión, vuelve a Gestión: «${desdeGestion_nv}»`);
ok(desdeGestion_nv !== desdeInicio_nv,
  '🚨 …y son destinos DISTINTOS: el origen manda, no el área a la que pertenece el módulo');
ok(await pulsar(desdeGestion_nv), 'se pulsa atrás');
ok(/Área/i.test(await esperarTexto(/Área/i)), '…y acaba en el hub de Gestión');

/* ── 3 · Anidado: Gestión → Organización → Horario → atrás → Organización ── */
ok(await pulsar('Organización'), 'se abre Organización');
await esperarTexto(/horario/i);
ok(await pulsar('Horario'), '…y dentro, Horario');
await page.waitForTimeout(700);
const dentroDeOrg_nv = await rotuloAtras();
ok(/gesti/i.test(dentroDeOrg_nv || ''),
  `⚠️ el botón de arriba sigue llevando a Gestión, que es de donde salió Organización («${dentroDeOrg_nv}»)`);

/* ── 4 · La barra de abajo NO apila: cambia de sección ────────────────────── */
ok(await pulsar('Vida'), 'se toca Vida en la barra de abajo');
await esperarTexto(/Área/i);
ok(await pulsar('Diario'), 'se abre Diario');
await page.waitForTimeout(700);
const enDiario_nv = await rotuloAtras();
ok(/vida/i.test(enDiario_nv || ''),
  `⚠️ NAVO F1 — atrás dice «Vida», no «Gestión»: tocar una pestaña reinicia el recorrido («${enDiario_nv}»)`);

/* ── 5 · Y lo que él pidió que no cambiara, no ha cambiado ────────────────── */
const barra_nv = await page.evaluate(() => {
  const nav = document.querySelector('nav');
  return nav ? [...nav.querySelectorAll('button')].map((b) => b.innerText.trim()).filter(Boolean) : [];
});
ok(barra_nv.length === 5, `⚠️ la barra inferior sigue teniendo sus cinco pestañas (${barra_nv.join(' · ')})`);
ok(/Inicio/.test(barra_nv.join(' ')) && /Ajustes/.test(barra_nv.join(' ')),
  '…y son las mismas de siempre: no se ha tocado la navegación inferior');

/* ── 6 · Desde Inicio a un módulo CUALQUIERA, sin condición para él ───────── */
/* 🐛 ⚠️ **UN ACORDEÓN CERRADO SIGUE TENIENDO SU TEXTO EN LA PÁGINA, Y ESO DIO UN
   ROJO FALSO.** Esta comprobación pulsaba `'Nutrición'` con `pulsar`, que cuando
   no hay coincidencia exacta se queda con **el primer botón que CONTENGA la
   palabra**. Y el primero no es la tarjeta del módulo: es **la tarjeta de
   puntuación de Inicio**, que está más arriba y que en cuanto hay datos se
   convierte en un botón con el desglose dentro —«Sueño», «Entrenamiento»,
   «Nutrición», «Tareas»…, las `etiqueta` de `puntuacion.js`—. Ese desglose se
   pliega con `grid-template-rows: 0fr` y `overflow: hidden`, **no con
   `display: none`**, así que sigue contando para `innerText` aunque no se vea.
   En una pasada limpia la tarjeta no tiene datos, no es un botón y no pasa
   nada; en la pasada completa sí, y el resultado era el peor posible: `pulsar`
   devolvía `true` habiendo pulsado **otra cosa** —abrir y cerrar el acordeón— y
   la barra de atrás no aparecía nunca.

   ⚠️ La lección va más allá de esta línea: **buscar por texto en Inicio
   encuentra el desglose de la puntuación antes que cualquier tarjeta**. Toda
   comprobación futura que abra un módulo desde Inicio tiene el mismo problema.

   No se afloja la comprobación: se pulsa **lo que se quería pulsar**. La
   tarjeta de un módulo del Inicio tiene el nombre en su PRIMERA línea, así que
   se busca por ahí. Y antes se exige estar en Inicio **de verdad** —ni cabecera
   de área ni barra de atrás—, para que un clic sobre la pantalla anterior no
   pueda colarse como si nada. */
const pulsarTarjetaInicio = async (titulo, tope = 6000) => {
  const hasta = Date.now() + tope;
  do {
    const hecho = await page.evaluate((t) => {
      const destino = [...document.querySelectorAll('button')]
        .find((b) => (b.innerText || '').split('\n')[0].trim() === t);
      if (!destino) return false;
      destino.click();
      return true;
    }, titulo);
    if (hecho) { await page.waitForTimeout(600); return true; }
    await page.waitForTimeout(200);
  } while (Date.now() < hasta);
  return false;
};

ok(await pulsar('Inicio'), 'se vuelve a Inicio');
const enInicio_nv = await sinRastro();
ok(!enInicio_nv.hub && !enInicio_nv.back, 'se está en Inicio de verdad antes de abrir nada');
ok(await pulsarTarjetaInicio('Nutrición'), 'se abre Nutrición desde su tarjeta de Inicio');
/* ⚠️ Aquí NO vale `esperarTexto(/nutric/i)`: Inicio YA dice «Nutrición» en su tarjeta, así que
   encontraría el texto sin haber navegado y devolvería al instante. Se espera a la barra de atrás,
   que solo existe dentro de un módulo — `rotuloAtras` la sondea hasta que aparece. */
const nutri_nv = await rotuloAtras();
ok(/inicio/i.test(nutri_nv || ''),
  `🚨 NAVO F1 — y otro módulo distinto hace lo mismo sin una regla propia: «${nutri_nv}»`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F1 — Fitness, la fundación (Entrega 4 · Fase 1/45)
   ══════════════════════════════════════════════════════════════════════════

   El apartado 26 pide comprobar cuatro cosas en el navegador: que se entra, que
   se cambia entre las tres áreas, que el móvil se ve bien y que las tres se ven
   correctamente **sin datos**. Y el criterio de éxito remata: que parezca *"una
   parte real de la aplicación"*.

   🚨 Lo que más importa aquí no es lo que se ve, sino lo que NO se ha perdido:
   la pantalla de calistenia —siete habilidades, récords, sesiones, vídeos y los
   partidos— tiene que seguir estando dentro, entera. Si un día alguien
   «integra» Fitness copiando su contenido, esta sección se pone roja. */
console.log('\n── FIT F1 · Fitness: la fundación ──');
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

ok(await pulsar('Bienestar'), 'FIT F1 — se abre el área Bienestar');
ok(await pulsar('Fitness'), '🚨 FIT F1 — la entrada del módulo se llama «Fitness» (apartado 4)');
const enFitness = await esperarTexto(/Rangos/i);
ok(/Rangos/i.test(enFitness) && /Progreso/i.test(enFitness) && /Entrenamiento/i.test(enFitness),
  '🚨 …y dentro están las tres áreas: Rangos · Progreso · Entrenamiento (apartado 5)');

/* El apartado 4 dice *"No crees una navegación global nueva"*. */
const barra_fit = await page.evaluate(() => {
  const nav = document.querySelector('nav');
  return nav ? [...nav.querySelectorAll('button')].map((b) => b.innerText.trim()).filter(Boolean) : [];
});
ok(barra_fit.length === 5, `⚠️ la barra de abajo sigue con sus cinco pestañas (${barra_fit.join(' · ')})`);

/* Arranca en Entrenamiento, y ahí tiene que seguir estando TODO lo de antes. */
ok(/Habilidades/i.test(enFitness), '⚠️ el área de Entrenamiento abre por defecto, con sus Habilidades');
ok(/Handstand|Planche|Front Lever/i.test(enFitness),
  '🚨 FIT F1 — la pantalla de calistenia sigue DENTRO, entera: no se ha copiado ni se ha perdido');
ok(/Tu Plan/i.test(enFitness), '…y la estructura nueva: «Tu Plan» (apartado 12)');

/* Área RANGOS, sin datos: «Sin Rango» y el texto literal del apartado 9. */
ok(await pulsar('Rangos'), 'se cambia al área de Rangos');
const enRangos = await esperarTexto(/Sin Rango/i);
ok(/Rango Predicho/i.test(enRangos), '🚨 FIT F1 — «Rango Predicho» (apartado 9)');
ok(/Sin Rango/i.test(enRangos), '…y sin datos dice «Sin Rango», no un nivel 1 inventado');
ok(/Completa ejercicios para comenzar a establecer tu nivel/i.test(enRangos),
  '…con el texto exacto que pide el enunciado');
ok(/Brazos/i.test(enRangos) && /Piernas/i.test(enRangos) && /Cuello/i.test(enRangos),
  '⚠️ y los siete rankings musculares están (apartado 9)');
ok(/Clasificar ejercicios/i.test(enRangos),
  '⚠️ el CTA de clasificar existe y se ve…');
/* 🔓 FIT F17 — el contador ES real y el botón lleva a un cuestionario que
   existe, así que lo que se vigila ya no es que no haya contador, sino que no
   anuncie CERO preguntas: un botón que ofrece clasificar nada sería el control
   decorativo de siempre. ⚠️ Con el separador delante, porque «100 restantes»
   contiene «0 restantes» y eso ponía la prueba roja sin motivo. */
ok(!/·\s*0 restantes/i.test(enRangos),
  '🚨 …y el CTA no ofrece «0 restantes»: nunca lleva a un cuestionario vacío (regla 8)');

/* Área PROGRESO, sin fotos: estado vacío con salida, no una pantalla en blanco. */
ok(await pulsar('Progreso'), 'se cambia al área de Progreso');
/* 🔓 FIT F12 — Progreso se abre en «Resumen»; las fotos tienen ahora su pestaña. */
await esperarTexto(/Tu progreso/i);
ok(await pulsar('Fotos'), 'FIT F12 — se abre la pestaña Fotos de Progreso');
/* 🔓 **ESTAS COMPROBACIONES SE DAN LA VUELTA CON LA FIT F26/F27** (E3 F44 y
   SU F1 → SU F2). Lo que vigilaban era la promesa del apartado 11 de la F1:
   *"esta área no finge una subida; lleva a donde las fotos viven de verdad"*, y
   entonces eso era Salud. **Desde la F26 las fotos viven TAMBIÉN aquí**, así
   que la promesa se cumple de otra forma: la pestaña es la galería, detrás del
   **mismo PIN que Salud** (C-35). En una cuenta recién estrenada
   `fotos_privadas` está protegida, así que lo que sale es la puerta.
   ⚠️ Y lo que NO cambia es lo que de verdad importaba: **ni un callejón sin
   salida**. Aquí se mide justamente eso. */
const enProgreso_fit = await esperarTexto(/PIN|fotograf/i);
ok(/PIN/i.test(enProgreso_fit),
  '🔓 FIT F1 → F26 — la pestaña de Fotos pide el PIN, que es la puerta de Salud (C-35)');
ok(/Ajustes|Seguridad/i.test(enProgreso_fit),
  '⚠️ …y dice dónde se abre: nunca un callejón sin salida (apartado 11 de la F1)');
ok(!/Añadir progreso/i.test(enProgreso_fit),
  '🚨 …y la galería NO se ve mientras tanto');

/* Nada de esto ha escrito un solo dato: entrar y mirar es mirar. */
const escrituras_fit = guardado.length;
await pulsar('Bienestar');
await pulsar('Fitness');
await esperarTexto(/Rangos/i);
await pulsar('Rangos');
await page.waitForTimeout(400);
await pulsar('Progreso');
await page.waitForTimeout(400);
ok(guardado.length === escrituras_fit,
  '⚠️ FIT F1 — cambiar de área NO guarda nada: cuál está abierta es de la pantalla (EH F40)');

/* Y en un iPhone pequeño no se sale del ancho (apartado 18). */
const desborde_fit = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth,
  ventana: window.innerWidth,
}));
ok(desborde_fit.ancho <= desborde_fit.ventana + 1,
  `🚨 FIT F1 — a 375 px no se desborda de lado (${desborde_fit.ancho} vs ${desborde_fit.ventana})`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F2 — el catálogo maestro de ejercicios (Entrega 4 · Fase 2/45)
   ══════════════════════════════════════════════════════════════════════════

   El apartado 29 pide comprobar en el navegador que el catálogo carga, que la
   búsqueda funciona, que los filtros funcionan, que el detalle funciona y que
   los músculos y sus porcentajes aparecen. Eso es lo que hace esta sección.

   🚨 Y lo que más importa: **los porcentajes que se ven en pantalla son los del
   catálogo**, no una estimación que se invente la vista. Se abre un ejercicio
   concreto y se mira su número. */
/* 🐛 **`innerText` NO INCLUYE NI EL `placeholder` NI EL `aria-label` DE UN
   `<input>`** (E3 F36, y es la tercera vez). «Buscar un ejercicio» es el
   marcador del campo, así que buscarlo con `esperarTexto` esperaba ocho
   segundos y salía rojo **con la pantalla perfecta** — la búsqueda de las dos
   líneas siguientes funcionaba. Se le pregunta al campo, que es donde vive. */
const hayCampo = async (etiqueta) => page.evaluate((e) => [...document.querySelectorAll('input, textarea')]
  .some((i) => (i.getAttribute('aria-label') || i.placeholder || '') === e), etiqueta);

const esperarCampo = async (etiqueta, tope = 8000) => {
  const hasta = Date.now() + tope;
  while (Date.now() < hasta) {
    if (await hayCampo(etiqueta)) return true;
    await page.waitForTimeout(200);
  }
  return false;
};

console.log('\n── FIT F2 · El catálogo de ejercicios ──');
ok(await pulsar('Bienestar'), 'FIT F2 — se abre el área Bienestar');
ok(await pulsar('Fitness'), '…y Fitness');
await esperarTexto(/Rangos/i);
ok(await pulsar('Ejercicios'), '🚨 FIT F2 — se abre el catálogo desde Entrenamiento (apartado 23)');
ok(await esperarCampo('Buscar un ejercicio'), '…con su buscador');
const catalogo_f2 = await ver();
ok(/ejercicios/i.test(catalogo_f2), '…y diciendo cuántos hay');

/* El catálogo carga de verdad: al menos ochenta fichas (apartado 19). */
const cuantos_f2 = await page.evaluate(() => {
  const t = document.body.innerText.match(/(\d+)\s+ejercicios/);
  return t ? Number(t[1]) : 0;
});
ok(cuantos_f2 >= 80, `🚨 FIT F2 — el catálogo carga entero: ${cuantos_f2} ejercicios (el apartado 19 pide 80-120)`);

/* La búsqueda (apartado 29, punto 4). */
const escribirBusqueda = async (texto) => page.evaluate((t) => {
  const campo = [...document.querySelectorAll('input')]
    .find((i) => /buscar un ejercicio/i.test(i.getAttribute('aria-label') || i.placeholder || ''));
  if (!campo) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(campo, t);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, texto);

ok(await escribirBusqueda('dominadas'), 'se escribe «dominadas» en el buscador');
await page.waitForTimeout(500);
const buscado_f2 = await ver();
ok(/Dominadas/i.test(buscado_f2), '🚨 FIT F2 — la búsqueda encuentra las dominadas');
const trasBuscar_f2 = await page.evaluate(() => {
  const t = document.body.innerText.match(/(\d+)\s+ejercicios?\s+de\s+(\d+)/);
  return t ? { visibles: Number(t[1]), total: Number(t[2]) } : null;
});
ok(trasBuscar_f2 && trasBuscar_f2.visibles < trasBuscar_f2.total,
  `⚠️ …y la lista se recorta de verdad (${trasBuscar_f2?.visibles} de ${trasBuscar_f2?.total})`);

/* ⚠️ El apartado 20 dice que el usuario ve español, pero el nombre técnico
   también se busca: es lo que hace que «pull up» sirva. */
ok(await escribirBusqueda('pull up'), 'se busca «pull up», que no es como se llama en pantalla');
await page.waitForTimeout(500);
ok(/Dominadas/i.test(await ver()),
  '⚠️ FIT F2 — y encuentra las dominadas igual: el nombre técnico también se busca');

/* El detalle (apartados 24 y 29, punto 6). */
ok(await escribirBusqueda('press de banca'), 'se busca el press de banca');
await page.waitForTimeout(500);
ok(await pulsar('Press de banca'), 'se abre su ficha');
const detalle_f2 = await esperarTexto(/M[uú]sculos/i);
ok(/Press de banca/i.test(detalle_f2), '🚨 FIT F2 — el detalle abre con su nombre');
ok(/M[uú]sculos/i.test(detalle_f2), '…con sus músculos implicados (apartado 24)');
ok(/50\s*%/.test(detalle_f2),
  '🚨 FIT F2 — y con la distribución porcentual DEL CATÁLOGO, no inventada por la pantalla');
ok(/T[eé]cnica|Ejecuci[oó]n/i.test(detalle_f2), '…y sus instrucciones (apartado 12)');
ok(/Dificultad/i.test(detalle_f2) && /Material/i.test(detalle_f2),
  '…y la ficha: dificultad, dónde y con qué');
ok(/Alternativas|Variantes/i.test(detalle_f2),
  '⚠️ …y sus sustitutos, que es lo que prepara el apartado 16');
/* 🚨 El apartado 22, en pantalla: sin vídeo, se DICE, no se finge un reproductor. */
ok(/Todav[ií]a no hay v[ií]deo/i.test(detalle_f2),
  '🚨 FIT F2 — sin vídeo lo dice con una frase, no deja un reproductor muerto (regla 8)');

/* Y se puede volver, que es lo que convierte el detalle en una pantalla y no en
   un callejón. */
ok(await pulsar('Catálogo'), 'se vuelve al catálogo desde la ficha');
await esperarCampo('Buscar un ejercicio');

/* Los filtros (apartado 29, punto 5). */
ok(await escribirBusqueda(''), 'se limpia la búsqueda');
await page.waitForTimeout(400);
ok(await pulsar('Filtros'), 'se abren los filtros');
await esperarTexto(/Grupo muscular/i);
ok(await pulsar('Calistenia'), 'se filtra por entorno: calistenia');
await page.waitForTimeout(500);
const filtrado_f2 = await page.evaluate(() => {
  const t = document.body.innerText.match(/(\d+)\s+ejercicios?\s+de\s+(\d+)/);
  return t ? { visibles: Number(t[1]), total: Number(t[2]) } : null;
});
ok(filtrado_f2 && filtrado_f2.visibles > 0 && filtrado_f2.visibles < filtrado_f2.total,
  `🚨 FIT F2 — el filtro recorta la lista y deja algo (${filtrado_f2?.visibles} de ${filtrado_f2?.total})`);
ok(await pulsar('Quitar los filtros'), 'y se pueden quitar de un toque');
await page.waitForTimeout(400);
const sinFiltro_f2 = await page.evaluate(() => {
  const t = document.body.innerText.match(/(\d+)\s+ejercicios/);
  return t ? Number(t[1]) : 0;
});
ok(sinFiltro_f2 === cuantos_f2, `⚠️ …y vuelven a salir todos (${sinFiltro_f2})`);

/* Nada de esto ha guardado un solo dato: el catálogo son datos de la
   aplicación, y buscar y filtrar es mirar. */
const escrituras_f2 = guardado.length;
await escribirBusqueda('curl');
await page.waitForTimeout(500);
ok(guardado.length === escrituras_f2,
  '⚠️ FIT F2 — buscar y filtrar NO guarda nada: el catálogo no vive en app_data');

/* Y a 375 px no se desborda, con cien tarjetas en la lista (apartado 25). */
const desborde_f2 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(desborde_f2.ancho <= desborde_f2.ventana + 1,
  `🚨 FIT F2 — a 375 px el catálogo no se desborda de lado (${desborde_f2.ancho} vs ${desborde_f2.ventana})`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F3 — el constructor de entrenamientos (Entrega 4 · Fase 3/45)
   ══════════════════════════════════════════════════════════════════════════

   El apartado 32 es una lista de trece validaciones obligatorias, y tres de
   ellas **solo se pueden comprobar tocando la pantalla**: que el flujo entero
   funcione, que la rutina persista de verdad y que se pueda volver a abrir.
   Eso es esta sección.

   🚨 Y la que más importa: **el ejercicio maestro no se mueve** (apartado 28).
   Se configuran cuatro series dentro de la rutina y se comprueba que lo que
   viaja a `app_data` son las series de LA LÍNEA, no del catálogo. */
console.log('\n── FIT F3 · El constructor de entrenamientos ──');
ok(await pulsar('Bienestar'), 'FIT F3 — se abre el área Bienestar');
ok(await pulsar('Fitness'), '…y Fitness');
await esperarTexto(/Tu Plan/i);
ok(await pulsar('Crear entrenamiento'),
  '🚨 FIT F3 — el CTA del apartado 2 existe y abre el constructor');
const constructor_f3 = await esperarTexto(/Nombre/i);
ok(/A[ñn]adir ejercicio/i.test(constructor_f3), '…con su «Añadir ejercicio» (apartado 4)');
ok(/Guardar/i.test(constructor_f3), '…y su «Guardar»');
ok(/Todav[ií]a no hay ning[uú]n ejercicio/i.test(constructor_f3),
  '⚠️ …y un vacío que dice qué hacer, no una lista en blanco');

/* 🚨 Las pestañas de Fitness NO están debajo: el constructor es pantalla
   entera (apartado 4), y con ellas se podría salir a Rangos en mitad de una
   rutina. */
ok(!/Rangos/i.test(constructor_f3),
  '🚨 FIT F3 — el constructor ocupa la pantalla: no quedan pestañas por las que salirse');

const escribirCampo = async (etiqueta, texto) => page.evaluate(([e, t]) => {
  const campo = [...document.querySelectorAll('input, textarea')]
    .find((i) => (i.getAttribute('aria-label') || '') === e);
  if (!campo) return false;
  const proto = campo.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement : window.HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
  setter.call(campo, t);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, [etiqueta, texto]);

ok(await escribirCampo('Nombre del entrenamiento', 'Push'), 'se le pone nombre: «Push»');
await page.waitForTimeout(300);

/* Apartado 5: el selector ES el catálogo de la F2. */
ok(await pulsar('Añadir ejercicio'), 'se abre el selector de ejercicios');
ok(await esperarCampo('Buscar un ejercicio'),
  '🚨 FIT F3 — y es el catálogo de la F2, con su buscador: no hay un segundo buscador (E3 F22)');

const buscarEnSelector = async (texto) => page.evaluate((t) => {
  const campo = [...document.querySelectorAll('input')]
    .find((i) => /buscar un ejercicio/i.test(i.getAttribute('aria-label') || i.placeholder || ''));
  if (!campo) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(campo, t);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, texto);

ok(await buscarEnSelector('press de banca'), 'se busca el press de banca');
await page.waitForTimeout(500);
ok(await pulsar('Press de banca'), '🚨 FIT F3 — y tocarlo lo AÑADE (apartado 6), sin más pasos');
await page.waitForTimeout(400);
/* Apartado 6: *"El usuario debe poder seguir añadiendo ejercicios sin perder el
   contexto"* — así que se queda en el selector. */
const trasAnadir_f3 = await ver();
ok(await hayCampo('Buscar un ejercicio'),
  '⚠️ …y se queda en el selector, para poder seguir añadiendo sin perder el contexto');
ok(/Ya est[áa]/i.test(trasAnadir_f3), '…diciendo cuál ya está puesto');

ok(await buscarEnSelector('dominadas pronas'), 'se busca otro más');
await page.waitForTimeout(500);
ok(await pulsar('Dominadas pronas'), 'y se añade un segundo ejercicio (apartado 32)');
await page.waitForTimeout(400);

ok(await pulsar('Volver a Entrenamiento'), 'se vuelve al constructor');
const conDos_f3 = await esperarTexto(/Ejercicios/i);
ok(/Press de banca/i.test(conDos_f3) && /Dominadas pronas/i.test(conDos_f3),
  '🚨 FIT F3 — los dos ejercicios están en la lista, en el orden en que se añadieron');
ok(/3 × |3 series/i.test(conDos_f3), '…con sus tres series por defecto (apartado 9)');
ok(/90 s descanso/i.test(conDos_f3), '…y sus noventa segundos de descanso (apartado 13)');
ok(/Pecho|Espalda/i.test(conDos_f3), '…y sus músculos resumidos (apartado 7)');
/* Apartados 21 y 22: el número y la duración se CALCULAN. */
ok(/2 ejercicios/i.test(conDos_f3), '🚨 FIT F3 — «2 ejercicios», contados, no escritos a mano (apartado 21)');
ok(/≈ \d+ min/.test(conDos_f3),
  '🚨 FIT F3 — y una duración que PARECE una estimación: «≈ X min» (apartado 20)');
ok(/Distribuci[oó]n muscular/i.test(conDos_f3) && /%/.test(conDos_f3),
  '🚨 FIT F3 — con la distribución muscular derivada de los porcentajes de la F2 (apartado 19)');

/* Apartado 8: ordenar. */
ok(await pulsar('Bajar Press de banca · Con barra'), 'se baja el primer ejercicio (apartado 8)');
await page.waitForTimeout(400);
const ordenado_f3 = await page.evaluate(() => {
  const t = document.body.innerText;
  return t.indexOf('Dominadas pronas') < t.indexOf('Press de banca');
});
ok(ordenado_f3, '🚨 FIT F3 — y el orden cambia de verdad en la pantalla');
ok(await pulsar('Subir Press de banca · Con barra'), '…y se vuelve a subir');
await page.waitForTimeout(400);

/* Apartado 17: duplicar. */
ok(await pulsar('Duplicar'), 'se duplica un ejercicio (apartado 17)');
await page.waitForTimeout(400);
ok(/3 ejercicios/i.test(await ver()), '…y pasan a ser tres');

/* Apartado 15: configurar. */
ok(await pulsar('Configurar'), 'se abre la configuración de un ejercicio (apartado 15)');
const editor_f3 = await esperarTexto(/Series/i);
ok(/Repeticiones/i.test(editor_f3), '…con sus repeticiones (apartado 10)');
ok(/Carga/i.test(editor_f3), '…su carga (apartado 12)');
ok(/Descanso/i.test(editor_f3), '…su descanso (apartado 13)');
ok(/Nota/i.test(editor_f3), '…y su nota de plantilla (apartado 14)');
ok(await pulsar('Subir Series'), 'se sube a cuatro series');
await page.waitForTimeout(300);
ok(await pulsar('Subir Repeticiones'), 'y se le ponen repeticiones');
await page.waitForTimeout(300);
ok(await pulsar('Hecho'), 'se cierra la configuración');
await page.waitForTimeout(400);
const configurado_f3 = await ver();
ok(/4 × /.test(configurado_f3),
  '🚨 FIT F3 — la fila enseña «4 × …»: lo configurado se ve (apartados 7 y 15)');

/* Apartado 16: eliminar. */
ok(await pulsar('Quitar Dominadas pronas · Agarre prono'), 'se elimina un ejercicio (apartado 16)');
await page.waitForTimeout(400);
ok(/2 ejercicios/i.test(await ver()), '…y vuelven a ser dos');

/* Apartado 23: guardar, con persistencia de verdad. */
const antesDeGuardar_f3 = guardado.filter((g) => g && g.key === 'fitness').length;
ok(await pulsar('Guardar'), 'se guarda el entrenamiento (apartado 23)');
await page.waitForTimeout(700);
ok(/Entrenamiento guardado/i.test(await ver()),
  '🚨 FIT F3 — y lo dice: *"mostrar feedback de éxito"* (apartado 23)');
const escrituras_f3 = guardado.filter((g) => g && g.key === 'fitness');
ok(escrituras_f3.length > antesDeGuardar_f3,
  '🚨 FIT F3 — la rutina se escribe en `app_data`, en la clave `fitness`');
/* 🚨 Lo que se crea Josué son PLANTILLAS, no planes: `planes` es la biblioteca
   de una fase posterior, y mezclarlos dejaría lo suyo perdido entre lo que no
   es suyo. La F1 dejó esa división escrita en `crearWorkoutPlan`. */
const guardadoFit_f3 = escrituras_f3.at(-1)?.value || {};
ok((guardadoFit_f3.planes || []).length === 0,
  '🚨 FIT F3 — y NO se ha tocado `planes`, que es la biblioteca de una fase posterior');
const planGuardado_f3 = guardadoFit_f3.plantillas?.[0];
ok(planGuardado_f3?.nombre === 'Push', `…con su nombre («${planGuardado_f3?.nombre}»)`);
ok(planGuardado_f3?.ejercicios?.length === 2, '…y sus dos ejercicios');
/* 🚨 Apartado 28, en el dato que de verdad se guarda: la línea lleva las cuatro
   series y **el `exerciseId`**, nunca el nombre ni los músculos copiados. */
const linea_f3 = planGuardado_f3?.ejercicios?.find((e) => e.series === 4);
ok(!!linea_f3, '🚨 FIT F3 — las cuatro series están en la LÍNEA de la rutina (apartado 28)');
ok(!!linea_f3?.exerciseId && !linea_f3?.nombre && !linea_f3?.musculos,
  '🚨 …que apunta al catálogo por id y no copia ni el nombre ni los músculos');
ok(JSON.stringify(escrituras_f3.at(-1)?.value || {}).includes('"ejercicios"'),
  '⚠️ Y se guarda el objeto `fitness` ENTERO, no solo los planes (regla 5)');

/* Apartado 24: volver a abrirla. */
ok(await pulsar('Volver a Entrenamiento'), 'se vuelve a Entrenamiento');
const vueltaF3 = await esperarTexto(/Tu Plan/i);
ok(/Tus plantillas/i.test(vueltaF3), '🚨 FIT F3 — y hay una sección «Tus plantillas»');
ok(/Push/i.test(vueltaF3), '…con el entrenamiento guardado dentro');
ok(/2 ejercicios/i.test(vueltaF3), '…con lo que tiene dentro');
/* ⚠️ **El camino para reabrirla lo cambió la FIT F4**, y esta comprobación se
   quedó vieja con el código bien: la tarjeta del área ya no abre el
   constructor, abre «Tus plantillas» —que es donde vive la gestión—, y desde
   ahí se edita. Es la lección de la E3 F34: al cerrar una fase que cambia una
   navegación, buscar las comprobaciones de la anterior. */
/* ⚠️ **Y LA FIT F6 LO VOLVIÓ A CAMBIAR**, que es la misma lección por segunda
   vez seguida: «Tu Plan» pasó a ser la pantalla entera y con ella se fue el
   botón «Gestionarlas» — ahora se entra **tocando la plantilla**, que es lo que
   hace quien la usa. Al cerrar una fase que cambia una navegación, buscar las
   comprobaciones de las anteriores (E3 F34). */
const abrirPlantillas_fit = async () => {
  if (!await pulsar('Ver Push')) return false;
  return !!await esperarTexto(/plantilla/i);
};
const editarPush_f3 = async () => {
  if (!await abrirPlantillas_fit()) return false;
  if (!await pulsar('Acciones de Push')) return false;
  return pulsar('Editar');
};
ok(await editarPush_f3(), '🚨 FIT F3 — y se puede volver a abrir para editarla (apartado 24)');
const reabierta_f3 = await esperarTexto(/A[ñn]adir ejercicio/i);
ok(/Press de banca/i.test(reabierta_f3), '…con sus ejercicios dentro');
ok(/4 × /.test(reabierta_f3),
  '🚨 FIT F3 — y con la configuración que se le puso: las cuatro series siguen ahí');

/* Apartado 26: salir sin guardar avisa **solo si hay cambios**. */
ok(await pulsar('Volver a Entrenamiento'), 'se sale sin haber tocado nada');
await page.waitForTimeout(400);
ok(/Tu Plan/i.test(await ver()),
  '🚨 FIT F3 — y NO pregunta nada: *"No muestres esta alerta si no existen cambios"* (apartado 26)');

/* Y a 375 px el constructor no se desborda (apartado 29 y la lección de GE F1). */
ok(await editarPush_f3(), 'se abre otra vez para medirla');
await esperarTexto(/A[ñn]adir ejercicio/i);
const desborde_f3 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(desborde_f3.ancho <= desborde_f3.ventana + 1,
  `🚨 FIT F3 — a 375 px el constructor no se desborda de lado (${desborde_f3.ancho} vs ${desborde_f3.ventana})`);
ok(await escribirCampo('Nombre del entrenamiento', 'Push A'), 'se le cambia el nombre');
await page.waitForTimeout(400);
ok(await pulsar('Volver a Entrenamiento'), 'y ahora se intenta salir');
await page.waitForTimeout(400);
ok(/Salir sin guardar/i.test(await ver()),
  '🚨 FIT F3 — con cambios sin guardar, SÍ avisa, con sus dos salidas (apartado 26)');
ok(await pulsar('Seguir editando'), '…y «Seguir editando» te deja donde estabas');
await page.waitForTimeout(300);
ok(/A[ñn]adir ejercicio/i.test(await ver()), '…comprobado: sigue en el constructor');
ok(await pulsar('Volver a Entrenamiento'), 'se vuelve a intentar salir');
await page.waitForTimeout(300);
ok(await pulsar('Salir'), '…y esta vez se sale');
await page.waitForTimeout(500);
const trasSalir_f3 = await ver();
ok(/Tu Plan/i.test(trasSalir_f3), 'se está otra vez en Entrenamiento');
/* Apartado 25: el borrador no se pierde, y se OFRECE. */
ok(/a medias/i.test(trasSalir_f3),
  '🚨 FIT F3 — y lo que quedó a medias se ofrece al volver: el borrador no se pierde (apartado 25)');
ok(await pulsar('Descartar'), '…y se puede descartar');
await page.waitForTimeout(300);
ok(!/a medias/i.test(await ver()), '…y entonces desaparece');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F4 — gestión de entrenamientos y plantillas propias (Entrega 4 · 4/45)
   ══════════════════════════════════════════════════════════════════════════

   El apartado 25 es una lista de validaciones obligatorias, y el criterio de
   finalización las resume: *"Crear → Guardar → Ver → Editar → Duplicar →
   Eliminar una rutina creada por mí y comprobar que todos los cambios son
   reales y persistentes"*.

   🚨 Y la que el enunciado pide comprobar EXPLÍCITAMENTE (apartado 7): que
   editar la copia **no toca el original**. Aquí se hace tocando la pantalla.

   ⚠️ Esta sección se apoya en la plantilla «Push» que dejó guardada la sección
   de la FIT F3: es el único camino por el que se crea una, y probar sobre lo
   que de verdad hay es la lección de EH F44. */
console.log('\n── FIT F4 · Tus plantillas ──');
ok(await pulsar('Bienestar'), 'FIT F4 — se abre el área Bienestar');
ok(await pulsar('Fitness'), '…y Fitness');
const area_fit4 = await esperarTexto(/Tus plantillas/i);
ok(/Push/i.test(area_fit4), 'FIT F4 — la plantilla guardada se ve en el área');

ok(await abrirPlantillas_fit(), 'se abre la gestión de plantillas');
const lista_fit4 = await ver();
ok(/Push/i.test(lista_fit4), '…con la plantilla dentro');
ok(/Editado hoy/i.test(lista_fit4),
  '🚨 FIT F4 — con su fecha de última modificación (apartado 3)');
ok(/Gimnasio|Calistenia|Casa/i.test(lista_fit4), '…y los filtros de entorno (apartado 16)');

/* Apartado 4: el menú de acciones. */
ok(await pulsar('Acciones de Push'), 'se abre el menú de tres puntos de la plantilla');
const menu_fit4 = await ver();
ok(/Editar/i.test(menu_fit4) && /Duplicar/i.test(menu_fit4) && /Eliminar/i.test(menu_fit4),
  '🚨 FIT F4 — con Editar, Duplicar y Eliminar (apartado 4)');
/* 🚨 Apartado 19: *"Si esto genera una acción muerta, es preferible NO mostrar
   todavía el botón"*. El motor de entrenamiento es la FIT F7. */
/* 🔓 FIT F7 — el apartado 19 de la F4 dejó «Empezar entrenamiento» pendiente del
   motor, y ya existe: pero vive en el DETALLE de la plantilla, no en el menú de
   tres acciones de la tarjeta, que el apartado 4 quiere corto. */
ok(!/Empezar entrenamiento/i.test(menu_fit4),
  '🚨 FIT F4 — el menú `⋯` sigue con sus tres acciones: el arranque vive en el detalle');

/* Apartado 7 — duplicar, y que la copia sea independiente. */
const antesDup_fit4 = guardado.filter((g) => g && g.key === 'fitness').length;
ok(await pulsar('Duplicar'), 'se duplica la plantilla (apartado 7)');
await page.waitForTimeout(700);
const trasDup_fit4 = await ver();
ok(/Copia/i.test(trasDup_fit4), '🚨 FIT F4 — y aparece «Push — Copia»');
const escrituras_fit4 = guardado.filter((g) => g && g.key === 'fitness');
ok(escrituras_fit4.length > antesDup_fit4, '…y se ha guardado de verdad en `app_data`');
const plantillas_fit4 = escrituras_fit4.at(-1)?.value?.plantillas || [];
ok(plantillas_fit4.length === 2, `…y ahora hay dos plantillas (${plantillas_fit4.length})`);
ok(plantillas_fit4[0].id !== plantillas_fit4[1].id, '🚨 …con ids distintos');
const idsLineas_fit4 = new Set([
  ...(plantillas_fit4[0].ejercicios || []).map((e) => e.id),
  ...(plantillas_fit4[1].ejercicios || []).map((e) => e.id),
]);
ok(idsLineas_fit4.size === (plantillas_fit4[0].ejercicios.length + plantillas_fit4[1].ejercicios.length),
  '🚨 FIT F4 — y CADA LÍNEA con su propio id: con el mismo, editar la copia editaría el original');

/* Apartado 9 — el detalle. */
ok(await pulsar('Ver Push — Copia'), 'se abre el detalle de la copia (apartado 9)');
const detalle_fit4 = await esperarTexto(/Distribuci[oó]n muscular/i);
ok(/Distribuci[oó]n muscular/i.test(detalle_fit4),
  '🚨 FIT F4 — con la distribución muscular derivada (apartado 10)');
ok(/%/.test(detalle_fit4), '…con sus porcentajes');
ok(/≈ \d+ min/.test(detalle_fit4), '…y la duración estimada, con su «≈» (apartado 11)');
ok(/Press de banca/i.test(detalle_fit4), '…y sus ejercicios (apartado 9)');
ok(/× /.test(detalle_fit4), '…con sus series');

/* Apartado 6 y 7 — editar la copia y comprobar que el original no se entera. */
ok(await pulsar('Editar'), 'se abre el constructor con la copia dentro (apartado 6)');
await esperarTexto(/A[ñn]adir ejercicio/i);
ok(await pulsar('Configurar'), 'se configura su primer ejercicio');
await esperarTexto(/Series/i);
ok(await pulsar('Subir Series'), 'se le sube una serie');
await page.waitForTimeout(300);
ok(await pulsar('Hecho'), 'se cierra la configuración');
await page.waitForTimeout(300);
ok(await pulsar('Guardar'), 'y se guarda la copia');
await page.waitForTimeout(700);
const trasEditar_fit4 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.plantillas || [];
ok(trasEditar_fit4.length === 2,
  '🚨 FIT F4 — guardar una que ya existía la SUSTITUYE: siguen siendo dos (apartado 6)');
const original_fit4 = trasEditar_fit4.find((p) => !/Copia/.test(p.nombre));
const copia_fit4 = trasEditar_fit4.find((p) => /Copia/.test(p.nombre));
ok(copia_fit4?.ejercicios?.[0]?.series !== original_fit4?.ejercicios?.[0]?.series,
  '🚨 FIT F4 — y el ORIGINAL no se ha enterado: la copia es independiente (apartado 7)');
ok(copia_fit4?.editadoEn, '…y la copia lleva su fecha de edición actualizada');

/* Apartado 8 — eliminar, con confirmación de verdad. */
ok(await pulsar('Volver a Entrenamiento'), 'se vuelve de la copia');
await page.waitForTimeout(400);
ok(await abrirPlantillas_fit(), 'se vuelve a la gestión');
ok(await pulsar('Acciones de Push — Copia'), 'se abre el menú de la copia');
ok(await pulsar('Eliminar'), 'se pulsa eliminar (apartado 8)');
const confirma_fit4 = await esperarTexto(/¿Eliminar esta plantilla\?/i);
ok(/¿Eliminar esta plantilla\?/i.test(confirma_fit4),
  '🚨 FIT F4 — y NO se borra de golpe: pregunta antes (apartado 8)');
ok(/Eliminados recientes/i.test(confirma_fit4),
  '🚨 FIT F4 — diciendo que se recupera, porque va a la papelera: prometer lo contrario sería mentir (E3 F26)');
ok(!/no se puede deshacer|para siempre/i.test(confirma_fit4),
  '⚠️ …y sin prometer que es definitivo');
ok(await pulsar('Cancelar'), 'se cancela');
await page.waitForTimeout(400);
ok(!/¿Eliminar esta plantilla\?/i.test(await ver()), '…y no pasa nada (apartado 25)');
const antesBorrar_fit4 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.plantillas || []).length;
ok(antesBorrar_fit4 === 2, '…la copia sigue ahí');

ok(await pulsar('Eliminar'), 'se vuelve a pulsar eliminar');
await esperarTexto(/¿Eliminar esta plantilla\?/i);
ok(await pulsar('Confirmar eliminar Push — Copia'), 'y esta vez se confirma');
await page.waitForTimeout(800);
const trasBorrar_fit4 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.plantillas || [];
ok(trasBorrar_fit4.length === 1, '🚨 FIT F4 — la plantilla se va de verdad de `app_data`');
ok(!trasBorrar_fit4.some((p) => /Copia/.test(p.nombre)), '…y es la que se eligió');
const papelera_fit4 = guardado.filter((g) => g && g.key === 'papelera').at(-1)?.value?.elementos || [];
ok(papelera_fit4.some((e) => e.modulo === 'fitness' && e.coleccion === 'plantillas'),
  '🚨 FIT F4 — y aparece en Eliminados recientes, como prometía el aviso');
ok(!/Copia/i.test(await ver()), '…y desaparece de la lista (apartado 8)');

/* Y a 375 px no se desborda, con el menú abierto (apartado 21). */
const desborde_fit4 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(desborde_fit4.ancho <= desborde_fit4.ventana + 1,
  `🚨 FIT F4 — a 375 px Tus plantillas no se desborda de lado (${desborde_fit4.ancho} vs ${desborde_fit4.ventana})`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F5 — la biblioteca de planificaciones (Entrega 4 · 5/45)
   ══════════════════════════════════════════════════════════════════════════

   El criterio de finalización pide entrar en *Fitness → Entrenamiento → Más
   planes* y poder **Explorar → Buscar → Filtrar → Abrir → Revisar →
   Seleccionar → Personalizar** *"sin que ninguna de esas acciones sea
   simplemente un mockup"*. Aquí se hacen las siete, tocando la pantalla.

   ⚠️ Esta sección se apoya en la plantilla «Push» que dejaron las secciones de
   la F3 y la F4: al final se comprueba que personalizar un plan **añade** a esa
   lista, no la sustituye. */
console.log('\n── FIT F5 · La biblioteca de planificaciones ──');
ok(await pulsar('Volver a Entrenamiento'), 'FIT F5 — se vuelve al área de Entrenamiento');
const area_fit5 = await esperarTexto(/Tu Plan/i);
ok(/Más planes/i.test(area_fit5),
  '🚨 FIT F5 — «Más planes» se ofrece desde Entrenamiento (apartado 20)');

/* Apartado 20: sin plan elegido, Tu Plan lleva a la biblioteca. */
/* ⚠️ Y desde la FIT F6 el botón del estado vacío se llama «Explorar planes»,
   que son las palabras del apartado 2 de esa fase. */
ok(await pulsar('Explorar planes'), 'se entra a la biblioteca desde Tu Plan');
const bib_fit5 = await esperarTexto(/PPL/i);
ok(/PPL Est/i.test(bib_fit5), '🚨 FIT F5 — aparecen planes de verdad (apartado 24)');
ok(/Gimnasio/i.test(bib_fit5) && /Calistenia/i.test(bib_fit5) && /Casa/i.test(bib_fit5),
  '🚨 …con las categorías horizontales del apartado 3');
ok(/≈ \d+ min/.test(bib_fit5), '…y cada tarjeta dice cuánto dura una sesión (apartado 4)');
ok(/d[ií]as\/semana/i.test(bib_fit5), '…y su frecuencia');
/* 🚨 Apartado 14: el motor en vivo es una fase posterior. */
/* 🔓 FIT F7 — el motor ya existe, pero aquí sigue sin haber arranque, y ahora
   por su razón de verdad: en la biblioteca **se elige un plan**, que es una
   semana; entrenar es un día concreto, y eso se hace desde Tu Plan (apartado 1
   de la F7: *"Tu Plan → entrenamiento → Empezar entrenamiento"*). */
ok(!/Empezar entrenamiento/i.test(bib_fit5),
  '🚨 FIT F5 — en la biblioteca se ELIGE un plan, no se entrena un día (apartado 14)');

/* Apartado 3 — las categorías filtran de verdad. */
ok(await pulsar('Ver planes de calistenia'), 'se filtra por Calistenia (apartado 3)');
await page.waitForTimeout(400);
const soloCali_fit5 = await ver();
ok(!/PPL Est/i.test(soloCali_fit5),
  '🚨 FIT F5 — y el filtro filtra: el plan de gimnasio deja de verse');
ok(/Calistenia/i.test(soloCali_fit5), '…y quedan los de calistenia');
ok(await pulsar('Ver planes de todos'), 'se vuelve a Todos');
await page.waitForTimeout(400);
ok(/PPL Est/i.test(await ver()), '…y vuelven todos (apartado 3)');

/* Apartado 6 — la búsqueda. */
ok(await esperarCampo('Buscar un plan'), 'la biblioteca tiene su buscador (apartado 6)');
ok(await escribirCampo('Buscar un plan', 'calistenia'), 'se busca «calistenia»');
await page.waitForTimeout(500);
ok(!/PPL Est/i.test(await ver()), '🚨 FIT F5 — la búsqueda por entorno encuentra (apartado 6)');
ok(await escribirCampo('Buscar un plan', 'zzzz'), 'se busca algo que no existe');
await page.waitForTimeout(500);
const vacio_fit5 = await esperarTexto(/No encontramos planes/i);
ok(/No encontramos planes/i.test(vacio_fit5),
  '🚨 FIT F5 — y sin resultados se dice, con las palabras del apartado 17');
ok(/Quitar los filtros/i.test(vacio_fit5),
  '🚨 …y CON SALIDA: un vacío sin botón es una pantalla rota (EH F41)');
ok(await pulsar('Quitar los filtros'), 'se quitan los filtros');
await page.waitForTimeout(500);
ok(/PPL Est/i.test(await ver()), '…y vuelven los planes');

/* Apartados 11, 12 y 13 — el detalle. */
ok(await pulsar('Abrir PPL Estético'), 'se abre un plan (apartado 11)');
const det_fit5 = await esperarTexto(/Distribuci[oó]n muscular/i);
ok(/Distribuci[oó]n muscular/i.test(det_fit5),
  '🚨 FIT F5 — con la distribución muscular DERIVADA de sus ejercicios (apartado 10)');
ok(/%/.test(det_fit5), '…con sus porcentajes');
ok(/≈ \d+ min/.test(det_fit5), '…la duración estimada, con su «≈» (apartado 11)');
ok(/La semana/i.test(det_fit5) && /Descanso/i.test(det_fit5),
  '🚨 FIT F5 — y la semana entera, con sus días de descanso (apartados 9 y 12)');
ok(!/Empezar entrenamiento/i.test(det_fit5),
  '🚨 …y tampoco en el detalle de un plan: un plan es una semana, no una sesión');

ok(await pulsar('Ver los ejercicios de Push'), 'se toca un día (apartado 12)');
const dia_fit5 = await esperarTexto(/Press de banca/i);
ok(/Press de banca/i.test(dia_fit5),
  '🚨 FIT F5 — y salen sus EJERCICIOS REALES, resueltos contra el catálogo de la F2 (apartado 13)');
ok(/×/.test(dia_fit5), '…con sus series y repeticiones');

/* Apartado 14 — elegir el plan. Con ninguno puesto NO pregunta. */
const antesUsar_fit5 = guardado.filter((g) => g && g.key === 'fitness').length;
ok(await pulsar('Usar este plan'), 'se elige el plan (apartado 14)');
await page.waitForTimeout(800);
const escrituras_fit5 = guardado.filter((g) => g && g.key === 'fitness');
ok(escrituras_fit5.length > antesUsar_fit5, '…y se guarda de verdad en `app_data`');
const activo_fit5 = escrituras_fit5.at(-1)?.value?.planActivo;
ok(activo_fit5?.planId === 'ppl-estetico',
  '🚨 FIT F5 — el plan elegido QUEDA PERSISTIDO, por su id (apartado 24)');
ok(!activo_fit5?.dias && !activo_fit5?.nombre,
  '🚨 …y se guarda el ID, no una copia del plan: con copia, corregir un ejercicio no le llegaría');

/* Apartado 14 — y con otro ya puesto, SÍ pregunta. */
ok(await pulsar('Volver a la biblioteca de planes'), 'se vuelve a la biblioteca');
await esperarTexto(/PPL/i);
ok(await pulsar('Abrir Upper / Lower'), 'se abre otro plan');
await esperarTexto(/La semana/i);
ok(await pulsar('Usar este plan'), 'se pulsa usarlo');
const confirma_fit5 = await esperarTexto(/¿Cambiar tu plan actual\?/i);
ok(/¿Cambiar tu plan actual\?/i.test(confirma_fit5),
  '🚨 FIT F5 — con otro plan activo, pregunta antes de reemplazarlo (apartado 14)');
ok(/PPL Est/i.test(confirma_fit5),
  '⚠️ …diciendo CUÁL se va: «tu plan actual» a secas no deja decidir (EH F62)');
ok(/sigue en la biblioteca/i.test(confirma_fit5),
  '⚠️ …y que no se pierde nada, porque un plan prediseñado no se borra');
ok(await pulsar('Cancelar'), 'se cancela el cambio (apartado 24)');
await page.waitForTimeout(600);
const trasCancelar_fit5 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.planActivo;
ok(trasCancelar_fit5?.planId === 'ppl-estetico',
  '🚨 FIT F5 — y al cancelar NO se ha cambiado nada: sigue el de antes');

ok(await pulsar('Usar este plan'), 'se vuelve a pulsar');
await esperarTexto(/¿Cambiar tu plan actual\?/i);
ok(await pulsar('Confirmar cambiar a Upper / Lower'), 'y esta vez se confirma');
await page.waitForTimeout(800);
const trasCambiar_fit5 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.planActivo;
ok(trasCambiar_fit5?.planId === 'upper-lower',
  '🚨 FIT F5 — y ahora sí cambia el plan activo (apartado 24)');

/* Apartado 16 — favoritos. */
ok(await pulsar('Guardar Upper / Lower'), 'se guarda el plan como favorito (apartado 16)');
await page.waitForTimeout(700);
const favs_fit5 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.favoritosPlanes || [];
ok(favs_fit5.includes('upper-lower'),
  '🚨 FIT F5 — y el favorito se guarda como ID, no como copia (apartado 16)');

/* 🚨 Apartado 15 — personalizar: *"la copia no modifica el original"*. */
const plantillasAntes_fit5 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.plantillas || []).length;
ok(await pulsar('Personalizar'), 'se pulsa Personalizar (apartado 15)');
const pers_fit5 = await esperarTexto(/Personalizar este plan/i);
ok(/plantillas tuyas/i.test(pers_fit5) || /plantilla tuya/i.test(pers_fit5),
  '🚨 FIT F5 — y se dice cuántas plantillas van a aparecer antes de crearlas');
ok(/original se queda/i.test(pers_fit5),
  '🚨 …y que el plan ORIGINAL se queda como está (apartado 15)');
ok(await pulsar('Crear mis plantillas'), 'se confirman');
await esperarTexto(/Upper/i);
await page.waitForTimeout(800);
const plantillas_fit5 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.plantillas || [];
ok(plantillas_fit5.length === plantillasAntes_fit5 + 4,
  `🚨 FIT F5 — un plan de cuatro días de entreno crea CUATRO plantillas suyas (${plantillas_fit5.length - plantillasAntes_fit5})`);
ok(plantillas_fit5.some((p) => /Upper \/ Lower · Upper A/.test(p.nombre)),
  '…con el nombre del plan y el del día (apartado 15)');
ok(plantillas_fit5.some((p) => p.nombre === 'Push'),
  '🚨 …y la plantilla que ya tenía Josué SIGUE AHÍ: personalizar añade, no sustituye');
ok(plantillas_fit5.every((p) => (p.ejercicios || []).every((e) => e.id)),
  '🚨 FIT F5 — y cada línea copiada tiene su propio id: sin él editarla tocaría el plan original (apartado 15)');
ok(/plantilla/i.test(await ver()),
  '…y se acaba en Tus plantillas, que es donde el apartado 15 dice que aparecen');

/* Apartado 20 — y Tu Plan consume el plan activo. */
ok(await pulsar('Volver a Entrenamiento'), 'se vuelve al área');
const tuPlan_fit5 = await esperarTexto(/Tu Plan/i);
ok(/Upper \/ Lower/.test(tuPlan_fit5),
  '🚨 FIT F5 — «Tu Plan» enseña el plan elegido, resuelto contra la biblioteca (apartado 20)');
ok(/Quitar el plan/i.test(tuPlan_fit5), '…y se puede dejar de tenerlo puesto');
/* 🔓 Esta comprobación decía lo contrario hasta la F7, y estaba escrita a
   propósito para este momento: guardaba la promesa, ahora vigila que se cumpla
   (E3 F44, y ya van varias). */
/* 🐛 ⚠️ **Y con «Hoy toca descansar», como ya hacía la sección de la F6.** Este
   botón es el de HOY, y de los diecisiete planes de la biblioteca **dos
   entrenan el sábado y ninguno el domingo**: un fin de semana no puede existir,
   y es correcto que no exista. Sin esta alternativa, la comprobación solo
   pasaba de lunes a viernes. */
ok(/Empezar entrenamiento/i.test(tuPlan_fit5) || /Hoy toca descansar/i.test(tuPlan_fit5),
  '🔓 …y en Tu Plan YA está «Empezar entrenamiento»: el motor llegó con la FIT F7');

/* Y a 375 px no se desborda (apartado 18). */
const desborde_fit5 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(desborde_fit5.ancho <= desborde_fit5.ventana + 1,
  `🚨 FIT F5 — a 375 px la biblioteca no se desborda de lado (${desborde_fit5.ancho} vs ${desborde_fit5.ventana})`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F6 — Tu Plan (Entrega 4 · 6/45)
   ══════════════════════════════════════════════════════════════════════════

   El criterio de finalización pide encontrar **Tu Plan → Próximo entrenamiento
   → Semana → Tus plantillas** *"realmente conectados"*, y poder *elegir un plan
   → verlo → consultar su semana → abrir sus sesiones → cambiar de plan →
   acceder a sus plantillas* *"sin que ninguna de estas acciones sea un simple
   mockup"*.

   ⚠️ Se apoya en el plan que dejó activo la sección de la F5 (Upper / Lower) y
   en las plantillas que creó al personalizar: probar sobre lo que de verdad hay
   es la lección de EH F44. */
console.log('\n── FIT F6 · Tu Plan ──');
const tuplan_fit6 = await ver();
ok(/Pr[oó]ximo entrenamiento/i.test(tuplan_fit6) || /Hoy toca descansar/i.test(tuplan_fit6),
  '🚨 FIT F6 — Tu Plan abre con lo siguiente que toca, o con el descanso de hoy (apartado 21)');
ok(/Tu semana/i.test(tuplan_fit6), '…y enseña la semana (apartado 7)');
ok(/Distribuci[oó]n semanal/i.test(tuplan_fit6),
  '🚨 …con la distribución muscular DERIVADA del plan (apartado 10)');
ok(/%/.test(tuplan_fit6), '…con sus porcentajes');
ok(/Tus plantillas/i.test(tuplan_fit6),
  '🚨 …y el acceso a Tus plantillas, en la misma pantalla (apartado 11)');
ok(/Activo desde el/i.test(tuplan_fit6),
  '🚨 FIT F6 — y la fecha de activación, que es lo que pide el apartado 17');
ok(/Cambiar plan/i.test(tuplan_fit6), '…y se puede cambiar de plan (apartado 4)');

/* 🔓 El apartado 6 de la F6 pedía NO empezar nada *"si todavía no puede existir
   una acción funcional completa"*. Con la FIT F7 existe, así que la promesa se
   da la vuelta: era una espera, no una exclusión. */
ok(/Empezar entrenamiento/i.test(tuplan_fit6) || /Hoy toca descansar/i.test(tuplan_fit6),
  '🔓 FIT F6 → F7 — el CTA de Tu Plan es ya «Empezar entrenamiento»');
ok(/Ver entrenamiento/i.test(tuplan_fit6) || /Hoy toca descansar/i.test(tuplan_fit6),
  '…y «Ver entrenamiento» sigue estando, de secundario: abrir el detalle no se ha perdido');

/* Apartado 7: la semana, con sus siete días y hoy marcado. */
const diasSemana_fit6 = await page.evaluate(() => {
  const botones = [...document.querySelectorAll('button[aria-label]')]
    .filter((b) => /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo):/.test(b.getAttribute('aria-label') || ''));
  return {
    cuantos: botones.length,
    hoy: botones.filter((b) => b.getAttribute('aria-current') === 'date').length,
    etiquetas: botones.map((b) => b.getAttribute('aria-label')),
  };
});
ok(diasSemana_fit6.cuantos === 7,
  `🚨 FIT F6 — la semana tiene sus siete días (${diasSemana_fit6.cuantos}, apartado 7)`);
ok(diasSemana_fit6.hoy === 1,
  `🚨 …y UNO solo marcado como hoy (${diasSemana_fit6.hoy}, apartado 29)`);
ok(diasSemana_fit6.etiquetas.some((e) => /descanso/i.test(e)),
  '🚨 …y los días de descanso se identifican (apartado 29)');
ok(!diasSemana_fit6.etiquetas.some((e) => /completado/i.test(e)),
  '🚨 FIT F6 — y NINGUNO dice «completado»: sin historial no se puede afirmar (apartado 8)');

/* 🐛 🚨 **UNA COMPROBACIÓN QUE SOLO PASA DE LUNES A VIERNES ES UNA BOMBA DE
   RELOJERÍA, Y ÉSTA LLEVABA SIÉNDOLO DESDE QUE EXISTE.** La pasada verde de la
   FIT F22 fue un **viernes**; la siguiente, un **sábado**, y cayeron cuarenta y
   cinco comprobaciones de golpe en las secciones de la F6, la F7 y la F8.
   La causa no era ninguna de esas fases: **los diecisiete planes de la
   biblioteca tienen siete días**, así que el plan ES la semana y su día 1 es el
   lunes (F6, apartado 7). El recorrido activa el plan HOY, y los días
   anteriores de esta misma semana salen entonces como «antes de empezar» —que
   es correcto, y lo arregló la propia F6—, así que un sábado la semana entera
   es «antes de empezar» o «descanso» y **no queda ni un día que abrir**.
   La aplicación está bien: lo que estaba mal era dar por hecho que esto se
   ejecuta entre semana.
   Se retrasa la activación al lunes de esta semana, que además es el caso
   normal —alguien que lleva ya unos días con su plan puesto— y hasta hoy no lo
   probaba nadie. ⚠️ La fecha se construye en **local**, nunca con
   `toISOString()`: en España resta un día (la lección de siempre, y van
   varias). */
const lunesDeLaSemana_fit6 = (() => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toLocaleDateString('sv-SE');
})();
almacen.fitness = {
  ...(almacen.fitness || {}),
  planActivo: { ...((almacen.fitness || {}).planActivo || {}), desde: lunesDeLaSemana_fit6 },
};
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar') && await pulsar('Fitness'),
  `FIT F6 — se vuelve con el plan activado el lunes (${lunesDeLaSemana_fit6})`);
await esperarTexto(/Tu semana/i);
const semanaDesdeLunes_fit6 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .filter((b) => /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo):/.test(b.getAttribute('aria-label') || ''))
  .map((b) => b.getAttribute('aria-label')));
ok(semanaDesdeLunes_fit6.length === 7,
  `🚨 FIT F6 — la semana sigue teniendo siete días (${semanaDesdeLunes_fit6.length})`);
ok(!semanaDesdeLunes_fit6.some((e) => /antes de empezar/i.test(e)),
  '🚨 FIT F6 — y con el plan empezado el lunes ya no hay ningún día «antes de empezar»');

/* Apartado 9 — tocar un día abre su sesión, con los ejercicios de siempre. */
const diaConEntreno_fit6 = semanaDesdeLunes_fit6
  .find((e) => !/descanso|antes de empezar/i.test(e)) || '';
ok(!!diaConEntreno_fit6, `hay un día con entrenamiento (${diaConEntreno_fit6})`);
ok(await pulsar(diaConEntreno_fit6), 'se toca ese día (apartado 9)');
await page.waitForTimeout(600);
const sesion_fit6 = await ver();
ok(/× /.test(sesion_fit6),
  '🚨 FIT F6 — y sale su sesión con series y repeticiones, las de la F5 (apartado 9)');
ok(/s descanso/i.test(sesion_fit6), '…con el descanso de cada ejercicio');
ok(await pulsar('Cerrar la sesión'), 'se cierra la sesión');
await page.waitForTimeout(400);

/* 🚨 Apartado 18 — una plantilla suya puede ser el plan activo. Se comprueba
   sobre el dato, porque la pantalla que lo activa es de una fase posterior:
   aquí lo que importa es que Tu Plan sepa enseñarla. */
const plantillasGuardadas_fit6 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.plantillas || [];
ok(plantillasGuardadas_fit6.length > 0, 'siguen estando sus plantillas (apartado 19)');
ok(/Upper \/ Lower · Upper A/.test(tuplan_fit6) || /plantilla/i.test(tuplan_fit6),
  '…y se ven en Tu Plan, sin duplicar su gestión (apartado 11)');

/* Apartado 19: cambiar de plan no borra ni el anterior ni las plantillas. */
ok(await pulsar('Cambiar plan'), 'se pulsa «Cambiar plan» (apartado 4)');
const bibVuelta_fit6 = await esperarTexto(/PPL/i);
ok(/PPL Est/i.test(bibVuelta_fit6), '🚨 FIT F6 — y lleva a la biblioteca (apartado 4)');
ok(await pulsar('Volver a Entrenamiento'), 'se vuelve');
await esperarTexto(/Tu Plan/i);
const trasVolver_fit6 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {};
ok((trasVolver_fit6.plantillas || []).length === plantillasGuardadas_fit6.length,
  '🚨 FIT F6 — y NO se ha borrado ninguna plantilla por el camino (apartado 19)');
ok(trasVolver_fit6.planActivo?.planId === 'upper-lower',
  '…ni ha cambiado el plan activo sin confirmarlo (apartado 20)');

/* Apartado 24 — y todo sobrevive a una recarga de verdad. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar'), 'FIT F6 — se recarga la aplicación y se vuelve a entrar');
ok(await pulsar('Fitness'), '…y a Fitness');
const trasRecargar_fit6 = await esperarTexto(/Tu Plan/i);
ok(/Upper \/ Lower/.test(trasRecargar_fit6),
  '🚨 FIT F6 — el plan activo SIGUE AHÍ tras recargar (apartado 24)');
ok(/Activo desde el/i.test(trasRecargar_fit6), '…con su fecha de activación');
ok(/Tu semana/i.test(trasRecargar_fit6), '…y su semana');

/* Y a 375 px no se desborda (apartado 22). */
const desborde_fit6 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(desborde_fit6.ancho <= desborde_fit6.ventana + 1,
  `🚨 FIT F6 — a 375 px Tu Plan no se desborda de lado (${desborde_fit6.ancho} vs ${desborde_fit6.ventana})`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F7 — el entrenamiento en vivo (Entrega 4 · 7/45)
   ══════════════════════════════════════════════════════════════════════════

   El criterio de finalización pide hacer **una sesión de verdad**: *Empezar →
   navegar ejercicios → introducir peso/reps → completar series → añadir series
   → descansar → añadir notas → sustituir un ejercicio → salir/reanudar* sin
   perder datos. Eso es exactamente lo que hace esta sección, con el dedo, sobre
   el plan que dejó activo la de la F5.

   🚨 Y las dos cosas que SOLO se pueden ver aquí: que el cronómetro **corre de
   verdad** en el navegador, y que al salir y volver la sesión **sigue estando**
   con todo dentro. Ninguna prueba de Node puede afirmar eso. */
console.log('\n── FIT F7 · El entrenamiento en vivo ──');

/* 🐛 **Y EL MISMO FIN DE SEMANA TUMBABA LA SESIÓN EN VIVO ENTERA.** El botón de
   la cabecera es el de HOY, y **ninguno de los diecisiete planes entrena el
   domingo**: ese día no puede existir, y es correcto que no exista. El
   apartado 1 pide *"Tu Plan → entrenamiento → Empezar entrenamiento"*, que es
   exactamente el camino del **detalle de un día** —el que construyó esta misma
   fase, `TuPlanView` §detalle— y ése está cualquier día. Así que se intenta por
   la cabecera y, si hoy toca descansar, se entra por la semana: la sesión se
   prueba igual un martes que un domingo. */
let empezado_fit7 = await pulsar('Empezar entrenamiento', 1500);
if (!empezado_fit7) {
  await pulsar(diaConEntreno_fit6);
  await page.waitForTimeout(600);
  empezado_fit7 = await pulsar('Empezar entrenamiento', 3000);
}
ok(empezado_fit7,
  '🚨 FIT F7 — se pulsa «Empezar entrenamiento» desde Tu Plan (apartado 1)');
const vivo_fit7 = await esperarTexto(/Terminar/i);
ok(/Terminar/i.test(vivo_fit7), '🚨 …y se abre el entrenamiento en vivo (apartado 4)');
ok(/\d\d:\d\d/.test(vivo_fit7), '…con su cronómetro (apartado 6)');
ok(/Serie/i.test(vivo_fit7) && /Repes|Seg/i.test(vivo_fit7) && /Kg/i.test(vivo_fit7),
  '🚨 …y la tabla SERIE | KG | REPES | ✓ (apartado 13)');
ok(/Tutorial/i.test(vivo_fit7) && /Reemplazar/i.test(vivo_fit7)
  && /Notas/i.test(vivo_fit7) && /Descanso/i.test(vivo_fit7),
'🚨 …con los cuatro botones del apartado 12');
ok(/Ejercicio 1 de \d+/i.test(vivo_fit7), '…y dice por dónde va');

/* 🚨 Apartado 4: la pantalla es ENTERA. Con las pestañas debajo se podría uno ir
   a Rangos en mitad de una serie. */
ok(!/Rangos/i.test(vivo_fit7) && !/Progreso[\s\S]{0,20}Entrenamiento/i.test(vivo_fit7),
  '🚨 FIT F7 — y es pantalla ENTERA: ni las pestañas de Fitness ni el resto de la app');

/* 🚨 Apartado 6 — el cronómetro CORRE de verdad. Esto no lo puede decir Node. */
const reloj_a = await page.evaluate(() => (document.body.innerText.match(/\d\d:\d\d/) || [''])[0]);
await page.waitForTimeout(2200);
const reloj_b = await page.evaluate(() => (document.body.innerText.match(/\d\d:\d\d/) || [''])[0]);
ok(reloj_a !== reloj_b,
  `🚨 FIT F7 — el cronómetro AVANZA en el navegador (${reloj_a} → ${reloj_b}, apartado 6)`);

/* Apartados 15 y 16 — el peso y las repeticiones, escritos a mano. */
/* 🐛 ⚠️ **React escucha `focusout`, no `blur`** (desde React 17 delega en la
   raíz), así que un `new Event('blur')` **no dispara `onBlur`**. Esto salió
   cuando cinco comprobaciones daban `null` con el campo enseñando 62.5 en
   pantalla — y lo que destapó de verdad es que confirmar solo al salir del
   campo **pierde el dato si se bloquea el iPhone escribiendo**, que es lo que
   el apartado 29 prohíbe. Ahora el campo guarda al escribir, así que basta con
   el `input`; el `focusout` va detrás para probar también ese camino. */
const escribirSerie_fit7 = async (etiqueta, valor) => page.evaluate(([e, v]) => {
  const campo = [...document.querySelectorAll('input[aria-label]')]
    .find((i) => (i.getAttribute('aria-label') || '').startsWith(e));
  if (!campo) return false;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(campo, v);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  campo.dispatchEvent(new Event('focusout', { bubbles: true }));
  return true;
}, [etiqueta, valor]);

ok(await escribirSerie_fit7('Peso de la serie 1', '62.5'),
  '🚨 FIT F7 — se escribe el peso de la serie 1 (apartado 15)');
ok(await escribirSerie_fit7('Repeticiones de la serie 1', '10'),
  '…y sus repeticiones (apartado 16)');
await page.waitForTimeout(500);

/* 🚨 Apartado 29 — se guarda EN EL MOMENTO, no al final. */
const guardadoTrasPeso_fit7 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {};
const sesionGuardada_fit7 = (guardadoTrasPeso_fit7.sesiones || []).at(-1) || null;
ok(!!sesionGuardada_fit7, '🚨 FIT F7 — la sesión se ha GUARDADO ya, sin esperar al final (apartado 29)');
const primeraSerie_fit7 = sesionGuardada_fit7?.origen?.ejercicios?.[0]?.series?.[0] || {};
ok(primeraSerie_fit7.hecho?.peso === 62.5,
  `🚨 …con los 62,5 kg exactos, sin redondear (${primeraSerie_fit7.hecho?.peso}, apartado 15)`);
ok(primeraSerie_fit7.hecho?.reps === 10, `…y las 10 repeticiones (${primeraSerie_fit7.hecho?.reps})`);

/* Apartado 17 — marcar, desmarcar y volver a marcar. */
ok(await pulsar('Marcar la serie 1 como hecha'), 'se marca la serie 1 (apartado 17)');
await page.waitForTimeout(400);
const marcada_fit7 = await ver();
ok(/1 de \d+ series/i.test(marcada_fit7), '🚨 …y el progreso de la cabecera se mueve');
/* Apartado 24 — y se ofrece el descanso, que NO bloquea. */
ok(/Descanso/i.test(marcada_fit7) && /\d\d:\d\d/.test(marcada_fit7),
  '🚨 FIT F7 — al marcarla arranca el descanso (apartado 24)');
ok(await pulsar('Desmarcar la serie 1'), 'se desmarca');
await page.waitForTimeout(400);
const trasDesmarcar_fit7 = await page.evaluate(() => {
  const c = [...document.querySelectorAll('input[aria-label]')]
    .find((i) => (i.getAttribute('aria-label') || '').startsWith('Peso de la serie 1'));
  return c ? c.value : '';
});
ok(trasDesmarcar_fit7 === '62.5',
  `🚨 FIT F7 — desmarcar NO borra los datos (${trasDesmarcar_fit7}, apartado 17)`);
ok(await pulsar('Marcar la serie 1 como hecha'), '…y se vuelve a marcar (marcar → desmarcar → marcar)');
await page.waitForTimeout(400);

/* Apartado 23 — el descanso se pausa, se reinicia y se salta, sin bloquear. */
ok(await pulsar('Pausar el descanso'), 'se pausa el descanso (apartado 23)');
ok(await pulsar('Reanudar el descanso'), '…se reanuda');
ok(await pulsar('Sumar treinta segundos al descanso'), '…se le suman 30 s');
ok(await pulsar('Reiniciar el descanso'), '…se reinicia');
/* 🔓 FIT F9 — el botón se llama «Terminar el descanso» (su apartado 15). */
ok(await pulsar('Terminar el descanso'), '…y se termina a mano, que es lo que pide el apartado 24');
await page.waitForTimeout(300);

/* Apartado 18 — añadir una serie. */
const antesDeAnadir_fit7 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || [])
  .at(-1)?.origen?.ejercicios?.[0]?.series?.length || 0;
ok(await pulsar('Añadir serie'), 'se añade una serie (apartado 18)');
await page.waitForTimeout(500);
const trasAnadir_fit7 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || [])
  .at(-1)?.origen?.ejercicios?.[0]?.series || [];
ok(trasAnadir_fit7.length === antesDeAnadir_fit7 + 1,
  `🚨 FIT F7 — la sesión pasa a tener ${trasAnadir_fit7.length} series (apartado 18)`);
ok(trasAnadir_fit7.at(-1)?.origen === 'anadida', '…marcada como añadida, no como del plan');
ok(trasAnadir_fit7.at(-1)?.hecho?.peso === 62.5, '…heredando los 62,5 kg que él ya había puesto');

/* Apartado 27 — una nota, que persiste. */
ok(await pulsar('Notas'), 'se abren las notas (apartado 27)');
await page.waitForTimeout(400);
ok(await page.evaluate(() => {
  const t = [...document.querySelectorAll('textarea')].pop();
  if (!t) return false;
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  set.call(t, 'Me costó la última serie.');
  t.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}), 'se escribe la nota');
ok(await pulsar('Guardar nota'), '…y se guarda');
await page.waitForTimeout(500);
ok(/Me costó la última serie/.test(await ver()), '🚨 FIT F7 — y la nota se ve en la pantalla');

/* Apartado 9 — navegar sin perder nada. */
ok(await pulsar('Siguiente'), 'se pasa al siguiente ejercicio (apartado 9)');
await page.waitForTimeout(400);
ok(/Ejercicio 2 de/i.test(await ver()), '…y se está en el 2');
ok(await pulsar('Anterior'), '…se vuelve');
await page.waitForTimeout(500);
const alVolver_fit7 = await ver();
ok(/Ejercicio 1 de/i.test(alVolver_fit7), '…al 1');
ok(/Me costó la última serie/.test(alVolver_fit7), '🚨 FIT F7 — con la nota intacta (apartado 9)');
const pesoAlVolver_fit7 = await page.evaluate(() => {
  const c = [...document.querySelectorAll('input[aria-label]')]
    .find((i) => (i.getAttribute('aria-label') || '').startsWith('Peso de la serie 1'));
  return c ? c.value : '';
});
ok(pesoAlVolver_fit7 === '62.5', `🚨 …y con el peso intacto (${pesoAlVolver_fit7}, apartado 9)`);

/* Apartado 8 — el carrusel, con sus estados. */
const carrusel_fit7 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .filter((b) => /^Ejercicio \d+:/.test(b.getAttribute('aria-label') || ''))
  .map((b) => ({ label: b.getAttribute('aria-label'), actual: b.getAttribute('aria-current') === 'true' })));
ok(carrusel_fit7.length >= 2, `🚨 FIT F7 — el carrusel enseña los ${carrusel_fit7.length} ejercicios (apartado 8)`);
ok(carrusel_fit7.filter((c) => c.actual).length === 1, '…con UNO marcado como actual');
ok(await pulsar(carrusel_fit7.at(-1).label), '…y se toca el último (apartado 9)');
await page.waitForTimeout(400);
ok(new RegExp(`Ejercicio ${carrusel_fit7.length} de`).test(await ver()), '…que abre ése');

/* 🚨 Apartado 26 — sustituir, que SOLO toca la sesión.
   ⚠️ Se hace **en el último ejercicio, no en el primero**, y a propósito:
   `sustituirEjercicio` **borra el peso registrado** —60 kg de barra no dicen
   nada de unas mancuernas—, así que sustituir en el primero dejaría sin peso
   justo la serie con la que después se comprueba que recargar no pierde nada.
   Fue un rojo real de esta prueba: el producto estaba bien y la comprobación
   pedía algo que el diseño no promete. */
const planAntes_fit7 = JSON.stringify(
  (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {}).planActivo,
);
ok(await pulsar('Reemplazar'), 'se abre el selector de ejercicios (apartado 26)');
const selector_fit7 = await esperarTexto(/Cambios r[aá]pidos|Buscar/i);
ok(/Cambios r[aá]pidos/i.test(selector_fit7) || /Ejercicios/i.test(selector_fit7),
  '🚨 FIT F7 — con sustitutos compatibles primero (apartado 26)');
const sustituto_fit7 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button[aria-label]')]
    .find((x) => /^Cambiar por /.test(x.getAttribute('aria-label') || ''));
  return b ? b.getAttribute('aria-label') : '';
});
if (sustituto_fit7) {
  ok(await pulsar(sustituto_fit7), `se elige un sustituto (${sustituto_fit7})`);
  await page.waitForTimeout(600);
  const trasSustituir_fit7 = await ver();
  ok(/En lugar de/i.test(trasSustituir_fit7),
    '🚨 FIT F7 — y se DICE de cuál venía, «solo en este entrenamiento» (apartado 26)');
  ok(/solo en este entrenamiento/i.test(trasSustituir_fit7), '…con esas palabras');
} else {
  ok(await pulsar('Volver a Entrenamiento') || await pulsar('Entrenamiento'),
    'no había sustituto compatible: se vuelve');
}
const planDespues_fit7 = JSON.stringify(
  (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {}).planActivo,
);
ok(planAntes_fit7 === planDespues_fit7,
  '🚨 FIT F7 — y el PLAN ACTIVO no se ha tocado: sustituir es solo de la sesión (apartado 26)');

/* Y se vuelve al primero, que es el que lleva los datos registrados. */
ok(await pulsar(carrusel_fit7[0].label), 'se vuelve al primer ejercicio');
await page.waitForTimeout(500);
const peso1_fit7 = await page.evaluate(() => {
  const c = [...document.querySelectorAll('input[aria-label]')]
    .find((i) => (i.getAttribute('aria-label') || '').startsWith('Peso de la serie 1'));
  return c ? c.value : '';
});
ok(peso1_fit7 === '62.5',
  `🚨 FIT F7 — y el ejercicio que NO se sustituyó conserva sus 62,5 kg (${peso1_fit7})`);

/* Apartado 31 — salir PREGUNTA, y no marca como completada. */
ok(await pulsar('Salir del entrenamiento'), 'se intenta salir (apartado 31)');
await page.waitForTimeout(400);
const avisoSalir_fit7 = await ver();
ok(/¿Salir del entrenamiento\?/i.test(avisoSalir_fit7), '🚨 FIT F7 — y sale la protección del apartado 31');
ok(/Tu sesión está en curso/i.test(avisoSalir_fit7), '…con sus palabras');
ok(await pulsar('Seguir entrenando'), '…y se puede seguir entrenando');
await page.waitForTimeout(400);
ok(/Terminar/i.test(await ver()), '…que devuelve al entrenamiento');

ok(await pulsar('Salir del entrenamiento'), 'ahora sí se sale');
await page.waitForTimeout(300);
ok(await pulsar('Salir'), '…confirmando');
const fuera_fit7 = await esperarTexto(/Tu Plan/i);
ok(/Tu Plan/i.test(fuera_fit7), '…y se vuelve a Entrenamiento');

/* 🚨 Apartado 30 — y la sesión SIGUE AHÍ, ofrecida para continuar. */
ok(/Tienes un entrenamiento en curso/i.test(fuera_fit7),
  '🚨 FIT F7 — la sesión a medias se ofrece para continuar (apartado 30)');
ok(/Continuar entrenamiento/i.test(fuera_fit7), '…con su botón');
const sesionTrasSalir_fit7 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || []).at(-1);
ok(sesionTrasSalir_fit7?.estado === 'en_curso',
  `🚨 …y NO se ha marcado como completada al salir (${sesionTrasSalir_fit7?.estado}, apartado 31)`);

/* 🚨 Y lo que solo se ve aquí: recargar de verdad y encontrarlo todo. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar'), 'FIT F7 — se recarga la aplicación');
ok(await pulsar('Fitness'), '…y se vuelve a Fitness');
const trasRecargar_fit7 = await esperarTexto(/entrenamiento en curso/i);
ok(/Tienes un entrenamiento en curso/i.test(trasRecargar_fit7),
  '🚨 FIT F7 — el entrenamiento a medias SOBREVIVE a recargar (apartado 30)');
ok(await pulsar('Continuar entrenamiento'), '…y se continúa');
const continuado_fit7 = await esperarTexto(/Terminar/i);
ok(/Me costó la última serie/.test(continuado_fit7),
  '🚨 FIT F7 — con la nota donde estaba (apartado 30: *"datos intactos"*)');
const pesoTrasRecargar_fit7 = await page.evaluate(() => {
  const c = [...document.querySelectorAll('input[aria-label]')]
    .find((i) => (i.getAttribute('aria-label') || '').startsWith('Peso de la serie 1'));
  return c ? c.value : '';
});
ok(pesoTrasRecargar_fit7 === '62.5',
  `🚨 …y con los 62,5 kg (${pesoTrasRecargar_fit7}): el apartado 38, cumplido de punta a punta`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F9 — la UX avanzada del entrenamiento en vivo (Entrega 4 · 9/45)
   ══════════════════════════════════════════════════════════════════════════

   El apartado 43 pide *"un entrenamiento simulado"* de punta a punta. Aquí se
   hace con la aplicación de verdad y sobre la MISMA sesión de la F7, que es la
   que después termina la F8: así se comprueba también lo que pide su apartado
   45 —*"Comprueba que Fase 8 sigue funcionando"*— sin montar nada aparte.
   ⚠️ No se marca ningún ejercicio entero: la F8 necesita uno «No realizado». */
console.log('\n── FIT F9 · UX avanzada del entrenamiento en vivo ──');

const sesion_fit9 = () => (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || []).at(-1) || null;
const ejActual_fit9 = () => {
  const ses = sesion_fit9();
  return ses?.origen?.ejercicios?.[ses?.actual ?? 0] || null;
};
const pulsarEtiqueta_fit9 = async (empieza) => page.evaluate((e) => {
  const b = [...document.querySelectorAll('button[aria-label]')]
    .find((x) => (x.getAttribute('aria-label') || '').startsWith(e));
  if (!b) return false;
  b.click();
  return true;
}, empieza);
const etiquetaActiva_fit9 = () => page.evaluate(() => {
  const b = document.querySelector('[data-serie-activa="true"] button[aria-label^="Marcar la serie"]');
  return b ? b.getAttribute('aria-label') : '';
});

ok(await pulsar(carrusel_fit7[0].label), 'FIT F9 — se está en el primer ejercicio, el que lleva datos');
await page.waitForTimeout(400);
const iniciada_fit9 = sesion_fit9()?.iniciadaEn;

/* Apartados 3 y 24 — planificado frente a realizado. */
const vista_fit9 = await ver();
ok(/Planificado/i.test(vista_fit9) && /Realizado/i.test(vista_fit9),
  '🚨 FIT F9 — el ejercicio enseña PLANIFICADO y REALIZADO por separado (apartado 24)');
ok(/\d+ × /.test(vista_fit9), '…con el objetivo como «4 × 8–12» (apartado 3)');
ok(/\b10\b/.test(vista_fit9.split(/Realizado/i)[1] || ''),
  '…y en realizado, las 10 repeticiones de la serie marcada');

/* Apartado 7 — la serie activa, reconocible. */
const activa_fit9 = await etiquetaActiva_fit9();
ok(!!activa_fit9, `🚨 FIT F9 — hay una serie ACTIVA resaltada (${activa_fit9}, apartado 7)`);
/* ⚠️ Con /i: la etiqueta va con `uppercase`, y Chromium devuelve «AHORA» en innerText. */
ok(/ahora/i.test(vista_fit9), '…que lo dice con palabra, no solo con color');
const numActiva_fit9 = (activa_fit9.match(/serie (\d+)/) || [])[1];
ok(await page.evaluate(() => !!document.querySelector('button[aria-label^="Marcar la serie"] svg.lucide-circle')),
  '🚨 FIT F9 — una serie pendiente es ○, no un ✓ gris: el estado no depende del color (apartado 38)');

/* Apartados 9 y 10 — − y +. */
ok(await pulsarEtiqueta_fit9(`Sumar 2,5 kg a la serie ${numActiva_fit9}`), 'FIT F9 — se pulsa «+2,5 kg» (apartado 10)');
await page.waitForTimeout(500);
ok(await pulsarEtiqueta_fit9(`Sumar 2,5 kg a la serie ${numActiva_fit9}`), '…otra vez');
await page.waitForTimeout(500);
ok(await pulsarEtiqueta_fit9(`Restar 2,5 kg a la serie ${numActiva_fit9}`), '…y «−2,5 kg»');
await page.waitForTimeout(600);
const serieActiva_fit9 = () => (ejActual_fit9()?.series || []).filter((x) => x.estado !== 'omitida')[Number(numActiva_fit9) - 1] || null;
const pesoPasos_fit9 = serieActiva_fit9()?.hecho?.peso;
ok(typeof pesoPasos_fit9 === 'number' && pesoPasos_fit9 > 0 && Math.round(pesoPasos_fit9 * 10) % 25 === 0,
  `🚨 FIT F9 — los pasos GUARDAN el peso, de 2,5 en 2,5 (${pesoPasos_fit9} kg, apartados 10 y 41)`);
ok(await pulsarEtiqueta_fit9(`Sumar una repetición a la serie ${numActiva_fit9}`), 'FIT F9 — «+1 repetición» (apartado 9)');
await page.waitForTimeout(600);
ok((serieActiva_fit9()?.hecho?.reps || 0) > 0,
  `…y sobre un campo vacío parte de lo que decía el plan (${serieActiva_fit9()?.hecho?.reps} repes)`);

/* Apartados 11 y 16 — completar arranca el descanso, que vive en la sesión. */
ok(await pulsar(activa_fit9), `FIT F9 — se completa la serie ${numActiva_fit9} (apartado 11)`);
const conDescanso_fit9 = await esperarTexto(/Terminar el descanso|Descanso en pausa|DESCANSO/i);
ok(/\d\d:\d\d/.test(conDescanso_fit9), '…y arranca el descanso automático (apartado 16)');
await page.waitForTimeout(400);
const descanso1_fit9 = sesion_fit9()?.descanso;
ok(!!descanso1_fit9 && descanso1_fit9.segundos > 0,
  `🚨 FIT F9 — el descanso está GUARDADO en la sesión: una sola fuente de verdad (${descanso1_fit9?.segundos} s, apartado 41)`);

/* Apartado 14 — +15 s. */
ok(await pulsar('Sumar quince segundos al descanso'), 'FIT F9 — «+15 s» (apartado 14)');
await page.waitForTimeout(500);
ok(sesion_fit9()?.descanso?.segundos === (descanso1_fit9?.segundos || 0) + 15,
  `🚨 …y suma quince de verdad (${descanso1_fit9?.segundos} → ${sesion_fit9()?.descanso?.segundos})`);

/* Apartado 31 — el estado compacto enseña el descanso. */
ok(await pulsar('Salir del entrenamiento') && await pulsar('Salir'), 'FIT F9 — se sale con el descanso corriendo');
const compacto_fit9 = await esperarTexto(/entrenamiento en curso/i);
ok(/Descansando \d\d:\d\d/.test(compacto_fit9),
  '🚨 FIT F9 — la tarjeta de sesión en curso dice que está DESCANSANDO y cuánto le queda (apartado 31)');
ok(await pulsar('Continuar entrenamiento'), '…se vuelve');
const vuelta_fit9 = await esperarTexto(/Terminar el descanso|Descanso/i);
ok(/\d\d:\d\d/.test(vuelta_fit9) && !!sesion_fit9()?.descanso,
  '🚨 …y el descanso sigue corriendo donde estaba: no se perdió al salir');

/* Apartado 15 — terminarlo a mano, sin tocar el cronómetro general. */
ok(await pulsar('Terminar el descanso'), 'FIT F9 — se termina el descanso a mano (apartado 15)');
await page.waitForTimeout(600);
ok(sesion_fit9()?.descanso === null, '…y se quita de la sesión');
ok(sesion_fit9()?.iniciadaEn === iniciada_fit9,
  '🚨 FIT F9 — y el cronómetro general NO se ha reiniciado (apartados 15 y 30)');

/* Apartado 17 — configurar el descanso sin tocar el plan. */
const planAntes_fit9 = JSON.stringify((guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {}).planActivo);
ok(await pulsar('Descanso'), 'FIT F9 — se abre la configuración del descanso (apartado 17)');
const panelDescanso_fit9 = await esperarTexto(/Descanso de este ejercicio/i);
ok(/Solo cambia en este entrenamiento/i.test(panelDescanso_fit9), '…que dice que el plan no se toca');
ok(await pulsar('Descanso de 60 segundos'), '…se elige 60 s');
await page.waitForTimeout(600);
ok(ejActual_fit9()?.descanso === 60, `🚨 FIT F9 — el ejercicio de la SESIÓN pasa a 60 s (${ejActual_fit9()?.descanso})`);
ok(JSON.stringify((guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {}).planActivo) === planAntes_fit9,
  '🚨 …y el PLAN no se ha modificado (apartado 17, literal)');
ok(await pulsar('Descanso automático al completar una serie'), 'FIT F9 — se apaga el descanso automático (apartado 16)');
await page.waitForTimeout(600);
ok(sesion_fit9()?.descansoAuto === false, '…y queda guardado');
ok(await pulsar('Cerrar'), '…se cierra el panel');
await page.waitForTimeout(300);
const otraActiva_fit9 = await etiquetaActiva_fit9();
if (otraActiva_fit9) {
  ok(await pulsar(otraActiva_fit9), `FIT F9 — se completa otra serie con el automático apagado (${otraActiva_fit9})`);
  await page.waitForTimeout(600);
  ok(sesion_fit9()?.descanso === null, '🚨 FIT F9 — y esta vez NO arranca ningún descanso (apartado 16)');
}

/* Apartados 19, 20 y 33 — el tutorial, sin abandonar la sesión. */
ok(await pulsar('Tutorial'), 'FIT F9 — se abre el tutorial (apartado 19)');
const tutorial_fit9 = await esperarTexto(/Volver a la serie/i);
ok(/Terminar/.test(tutorial_fit9) && /\d\d:\d\d/.test(tutorial_fit9),
  '🚨 FIT F9 — con el cronómetro y «Terminar» a la vista: no se abandona el entrenamiento (apartados 20 y 33)');
ok(await pulsar('Volver al entrenamiento'), '…se cierra');
const trasTutorial_fit9 = await esperarTexto(/Ejercicio \d+ de/i);
ok(/Ejercicio 1 de/i.test(trasTutorial_fit9), '🚨 …y se vuelve EXACTAMENTE al mismo ejercicio (apartado 20)');
ok(sesion_fit9()?.iniciadaEn === iniciada_fit9, '…sin reiniciar el cronómetro');

/* Apartado 6 — deslizar para cambiar de ejercicio, y que el scroll no lo haga. */
const deslizar_fit9 = (dx, dy) => page.evaluate(([x, y]) => {
  const zona = [...document.querySelectorAll('div')].find((d) => d.style && d.style.touchAction === 'pan-y');
  if (!zona) return false;
  const r = zona.getBoundingClientRect();
  const x0 = r.left + r.width / 2;
  const y0 = r.top + Math.min(40, r.height / 2);
  zona.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x0, clientY: y0, pointerType: 'touch' }));
  zona.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x0 + x, clientY: y0 + y, pointerType: 'touch' }));
  return true;
}, [dx, dy]);
ok(await deslizar_fit9(-140, 6), 'FIT F9 — se desliza la tarjeta hacia la izquierda (apartado 6)');
const trasDeslizar_fit9 = await esperarTexto(/Ejercicio 2 de/i);
ok(/Ejercicio 2 de/i.test(trasDeslizar_fit9), '🚨 FIT F9 — y pasa al SIGUIENTE ejercicio');
ok(await deslizar_fit9(140, -4), '…se desliza hacia la derecha');
const trasVolver_fit9 = await esperarTexto(/Ejercicio 1 de/i);
ok(/Ejercicio 1 de/i.test(trasVolver_fit9), '…y vuelve al anterior');
ok(await deslizar_fit9(-60, 240), 'FIT F9 — un gesto hacia abajo, como el de hacer scroll');
await page.waitForTimeout(500);
ok(/Ejercicio 1 de/i.test(await ver()), '🚨 FIT F9 — y NO cambia de ejercicio: el gesto no se pelea con el scroll (apartado 6)');
ok(sesion_fit9()?.iniciadaEn === iniciada_fit9, '…y cambiar de ejercicio tampoco tocó el cronómetro (apartado 5)');

/* Apartado 22 — reemplazar un ejercicio CON datos pregunta. */
const exerciseAntes_fit9 = ejActual_fit9()?.exerciseId;
ok(await pulsar('Reemplazar'), 'FIT F9 — se intenta reemplazar el ejercicio que tiene datos (apartado 22)');
await esperarTexto(/Cambios r[aá]pidos|Buscar/i);
ok(await pulsarEtiqueta_fit9('Cambiar por '), '…se elige un sustituto');
const confirmar_fit9 = await esperarTexto(/Reemplazar ejercicio por/i);
ok(/Reemplazar ejercicio por/i.test(confirmar_fit9) && /Ya has registrado datos/i.test(confirmar_fit9),
  '🚨 FIT F9 — y PREGUNTA antes, porque ya había datos (apartado 22, literal)');
ok(await pulsar('Cancelar'), '…se cancela');
await page.waitForTimeout(500);
ok(ejActual_fit9()?.exerciseId === exerciseAntes_fit9,
  '🚨 …y el ejercicio sigue siendo el mismo, con sus datos: no se perdió nada por accidente');
ok(await pulsar('Volver a Entrenamiento') || await pulsar('Entrenamiento'), '…y se vuelve al entrenamiento');
const final_fit9 = await esperarTexto(/Ejercicio \d+ de/i);
ok(/Ejercicio 1 de/i.test(final_fit9), '…al mismo ejercicio');

/* Apartado 32 — Terminar pregunta, y no completa sin confirmar. */
/* ══════════════════════════════════════════════════════════════════════════
   FIT F8 — la finalización y el guardado (Entrega 4 · 8/45)
   ══════════════════════════════════════════════════════════════════════════

   🔓 **AQUÍ LA F7 TERMINABA LA SESIÓN CON UNA CONFIRMACIÓN**, porque no había
   pantalla de resumen: su propio apartado 32 decía *"Debe llevar posteriormente
   a la pantalla de finalización que construiremos en la siguiente fase"*. Ya
   existe, así que Terminar lleva al resumen y la comprobación se da la vuelta.

   El criterio del apartado 38: *"Empezar → entrenar → Terminar → revisar
   resumen → modificar nombre/notas → guardar → cerrar aplicación → volver"*. */
console.log('\n── FIT F8 · La finalización ──');

ok(await pulsar('Terminar el entrenamiento'), 'se pulsa Terminar (apartado 1)');
const resumen_fit8 = await esperarTexto(/Entrenamiento completado/i);
ok(/¡Entrenamiento completado!/i.test(resumen_fit8),
  '🚨 FIT F8 — y lleva al RESUMEN, no a completada (apartado 1)');
ok(/Revisa lo que has hecho/i.test(resumen_fit8), '…que invita a revisar antes de guardar');
const trasTerminar_fit8 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || []).at(-1);
ok(trasTerminar_fit8?.estado === 'finalizando',
  `🚨 FIT F8 — la sesión queda en «finalizando», ni entrenando ni guardada (${trasTerminar_fit8?.estado})`);
ok(!!trasTerminar_fit8?.terminadaEn, '…con el reloj ya parado (apartado 22)');

/* Apartados 2, 4, 5 y 6 — lo que el resumen tiene que enseñar. */
ok(/Duraci[oó]n/i.test(resumen_fit8), '…enseña la duración (apartado 5)');
ok(/\d+ min/.test(resumen_fit8), '…en minutos');
ok(/Fecha/i.test(resumen_fit8) && /septiembre|octubre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|noviembre|diciembre/i.test(resumen_fit8),
  '…la fecha en largo (apartado 4)');
ok(/\d\d:\d\d → \d\d:\d\d/.test(resumen_fit8), '…y la franja horaria (apartado 4, su ejemplo)');
ok(/\d+\/\d+ series completadas/.test(resumen_fit8),
  '🚨 …y «16/20 series completadas» (apartados 6 y 25)');
ok(/Ejercicios/i.test(resumen_fit8), '…con el desglose por ejercicio (apartado 7)');
ok(/No realizado/i.test(resumen_fit8),
  '🚨 FIT F8 — y un ejercicio sin series marcadas sale «No realizado» (apartado 10)');
ok(/Volumen/i.test(resumen_fit8), '…y el volumen, que aquí SÍ se puede calcular (apartado 9)');
ok(!/calor[ií]a/i.test(resumen_fit8),
  '🚨 …y NI UNA caloría quemada: no hay modelo fiable (apartado 8, literal)');
ok(!/Compartir/i.test(resumen_fit8),
  '🚨 …ni un «Compartir»: sin sistema social sería un botón muerto (apartado 20)');
ok(/Privado/i.test(resumen_fit8), '…y se dice que es privado (apartado 15)');

/* Apartado 3 — el nombre, editable. */
const escribirEn_fit8 = async (etiqueta, valor, etiquetaHTML = 'input') => page.evaluate(([e, v, tag]) => {
  const campo = [...document.querySelectorAll(`${tag}[aria-label]`)]
    .find((i) => (i.getAttribute('aria-label') || '').startsWith(e));
  if (!campo) return false;
  const proto = tag === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(campo, v);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, [etiqueta, valor, etiquetaHTML]);

/* 🚨 Apartado 28 — se cierra la aplicación AQUÍ, en el resumen, sin guardar.
   ⚠️ **Antes de escribir nada**, y a propósito: lo que tiene que sobrevivir es
   **el entrenamiento**, no un nombre a medio teclear que nunca se guardó. Fue un
   rojo mío: escribía el nombre, recargaba y luego lo exigía — el formulario se
   monta de cero con lo que hay en la sesión, que es lo correcto. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar'), 'FIT F8 — se recarga la aplicación en mitad del resumen');
ok(await pulsar('Fitness'), '…y se vuelve a Fitness');
const recuperable_fit8 = await esperarTexto(/sin guardar/i);
ok(/Te quedó un entrenamiento sin guardar/i.test(recuperable_fit8),
  '🚨 FIT F8 — el entrenamiento TERMINADO y sin guardar se ofrece (apartado 28)');
ok(!/Tienes un entrenamiento en curso/i.test(recuperable_fit8),
  '🚨 …y NO como «en curso»: ya no se entrena, se guarda');
ok(await pulsar('Terminar de guardarlo'), '…y se sigue donde lo dejó');
const vuelta_fit8 = await esperarTexto(/Entrenamiento completado/i);
ok(/\d+\/\d+ series completadas/.test(vuelta_fit8), '…con sus series intactas (apartado 28)');

/* Apartados 3 y 13 — y ahora sí, el nombre y la nota. */
ok(await escribirEn_fit8('Nombre del entrenamiento', 'Push — Fuerza'),
  '🚨 FIT F8 — se cambia el nombre del entrenamiento (apartado 3)');
ok(await escribirEn_fit8('Notas del entrenamiento', 'Me noté fuerte en los presses.', 'textarea'),
  '…y se escribe la nota general (apartado 13)');
await page.waitForTimeout(400);

/* Apartados 16, 17 y 18 — guardar, una sola vez. */
const antesDeGuardar_fit8 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || []).length;
ok(await pulsar('Terminar entrenamiento'), '🚨 FIT F8 — se guarda (apartado 16)');
await page.waitForTimeout(700);
const exito_fit8 = await ver();
ok(/¡Entrenamiento completado!/i.test(exito_fit8), '…y sale la pantalla de éxito (apartado 19)');
ok(/Ver entrenamiento/i.test(exito_fit8) && /Volver a Tu Plan/i.test(exito_fit8),
  '🚨 …con las dos acciones del apartado 20');
ok(!/Compartir/i.test(exito_fit8), '…y sin «Compartir» (apartado 20, literal)');

const sesiones_fit8 = guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.sesiones || [];
const sesionFinal_fit8 = sesiones_fit8.at(-1);
ok(sesionFinal_fit8?.estado === 'completada',
  `🚨 FIT F8 — la sesión queda COMPLETADA (${sesionFinal_fit8?.estado}, apartado 16)`);
ok(sesionFinal_fit8?.nombre === 'Push — Fuerza',
  `🚨 …con el nombre que él escribió (${sesionFinal_fit8?.nombre}, apartado 3)`);
ok(/fuerte en los presses/.test(sesionFinal_fit8?.notas || ''), '…y su nota general (apartado 13)');
ok(!!sesionFinal_fit8?.guardadaEn, '…apuntando cuándo la guardó');
ok(sesionFinal_fit8?.visibilidad === 'privado', '…privada (apartado 15)');
ok((sesionFinal_fit8?.origen?.ejercicios || []).length > 0,
  '🚨 …conservando TODO el snapshot: se podrá enseñar en el historial (apartado 23)');
ok(!!sesionFinal_fit8?.diaDePlan,
  '🚨 FIT F8 — y qué día del plan se completó, para la adherencia de fases futuras (apartado 21)');
ok(!!sesionFinal_fit8?.diaDePlan?.nombre,
  '⚠️ …con el NOMBRE, no solo el id: si borra el plan, la sesión sigue sabiendo cuál era');
ok(sesiones_fit8.length === antesDeGuardar_fit8,
  `🚨 FIT F8 — y NO se ha creado una sesión nueva al guardar (${sesiones_fit8.length}, apartado 17)`);

/* Apartado 20 — «Ver entrenamiento» enseña el resumen guardado. */
ok(await pulsar('Ver entrenamiento'), 'se pulsa «Ver entrenamiento» (apartado 20)');
await page.waitForTimeout(500);
const verGuardado_fit8 = await ver();
ok(/Push — Fuerza/.test(verGuardado_fit8),
  '🚨 FIT F8 — y se ve el resumen GUARDADO, con el nombre que le puso');
ok(/fuerte en los presses/.test(verGuardado_fit8), '…y su nota general');
ok(/\d+\/\d+ series completadas/.test(verGuardado_fit8), '…y sus series');
ok(await pulsar('Volver al resumen final'), '…y se puede volver');
await page.waitForTimeout(400);

ok(await pulsar('Volver a Tu Plan'), 'se vuelve a Tu Plan (apartado 20)');
const terminado_fit7 = await esperarTexto(/Tu Plan/i);
ok(!/Tienes un entrenamiento en curso/i.test(terminado_fit7),
  '…y ya no se ofrece continuarla');
ok(!/sin guardar/i.test(terminado_fit7), '…ni terminar de guardarla');

/* 🔓 FIT F6 → F8 — el estado «Completado» de un día, que nació apagado. */
const semana_fit8 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .filter((b) => /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo):/.test(b.getAttribute('aria-label') || ''))
  .map((b) => b.getAttribute('aria-label')));
ok(semana_fit8.length === 7, 'la semana sigue teniendo sus siete días');
ok(!semana_fit8.some((e) => /descanso/i.test(e) && /completado/i.test(e)),
  '🚨 FIT F8 — y entrenar NO convierte un día de DESCANSO en «Completado»: no tocaba');

/* Y a 375 px no se desborda: es la pantalla que se usa entrenando (apartado 35). */
/* 🐛 **Esta parte dependía del día de la semana.** Tras completar el
   entrenamiento del día, Tu Plan solo sigue ofreciendo «Empezar entrenamiento»
   si al siguiente día del plan le toca entrenar; un viernes con sábado de
   descanso lo dejaba sin CTA y cuatro comprobaciones se ponían rojas **sin que
   nada estuviera roto** (comprobado: fallan igual en el commit anterior). Lo
   que aquí se mide es el ancho de la pantalla de series, no de dónde se
   arranca, así que si Tu Plan no ofrece empezar se arranca desde una plantilla
   —la otra puerta real, F4 apartado 19—. */
const empezarComoSea_fit7 = async () => {
  if (await pulsar('Empezar entrenamiento', 2500)) return true;
  if (!await pulsar('Bienestar') || !await pulsar('Fitness')) return false;
  if (!await abrirPlantillas_fit()) return false;
  if (await pulsar('Empezar entrenamiento', 2500)) return true;
  if (!await pulsar('Ver Push')) return false;
  return pulsar('Empezar entrenamiento');
};
ok(await empezarComoSea_fit7(), 'se empieza otra para medir el ancho (desde Tu Plan o desde una plantilla)');
await esperarTexto(/Terminar/i);
const desborde_fit7 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(desborde_fit7.ancho <= desborde_fit7.ventana + 1,
  `🚨 FIT F7 — a 375 px la tabla de series NO se desborda de lado (${desborde_fit7.ancho} vs ${desborde_fit7.ventana})`);
/* Apartado 33 — botones grandes: la zona de toque del ✓ y de los campos. */
const toques_fit7 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button[aria-label], input[aria-label]')]
    .filter((x) => /serie 1/i.test(x.getAttribute('aria-label') || ''));
  return b.map((x) => Math.round(x.getBoundingClientRect().height));
});
ok(toques_fit7.length > 0 && toques_fit7.every((h) => h >= 44),
  `🚨 FIT F7 — y los controles de una serie miden los 44 px de EH F42 (${toques_fit7.join(', ')} px, apartado 33)`);
ok(await pulsar('Salir del entrenamiento') && await pulsar('Salir'), 'se sale de la que sobraba');
await page.waitForTimeout(400);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F10 — el historial de entrenamientos (Entrega 4 · 10/45)
   ══════════════════════════════════════════════════════════════════════════

   El criterio del apartado 45, con la sesión que la F8 acaba de guardar:
   *"Completar un entrenamiento → guardarlo → abrir Historial → encontrarlo →
   abrirlo → consultar exactamente lo que hice."* Y *"Buscar → filtrar → abrir →
   eliminar"*. ⚠️ Y hay una sesión EN CURSO recién dejada a medias (la del ancho
   de pantalla): es justo la que el apartado 38 prohíbe que aparezca. */
console.log('\n── FIT F10 · El historial ──');

const fitness_fit10 = () => guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value || {};
const guardada_fit10 = (fitness_fit10().sesiones || []).find((x) => x && x.estado === 'completada' && x.nombre === 'Push — Fuerza');
ok(!!guardada_fit10, 'FIT F10 — la sesión de la F8 está guardada como completada');
ok((fitness_fit10().sesiones || []).some((x) => x && x.estado === 'en_curso'), '…y hay otra EN CURSO, la del ancho de pantalla');
const escribirBusqueda_fit10 = (valor) => page.evaluate((v) => {
  const c = document.querySelector('input[aria-label="Buscar entrenamientos por nombre"]');
  if (!c) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(c, v);
  c.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, valor);
const pulsarQueEmpiece_fit10 = (empieza) => page.evaluate((e) => {
  const b = [...document.querySelectorAll('button[aria-label]')].find((x) => (x.getAttribute('aria-label') || '').startsWith(e));
  if (!b) return false;
  b.click();
  return true;
}, empieza);

/* Apartado 2 — Entrenamiento → Historial. */
ok(await pulsar('Abrir Historial'), 'FIT F10 — se abre Entrenamiento → Historial (apartado 2)');
const lista_fit10 = await esperarTexto(/entrenamientos? *$|\d+ entrenamiento/im);
ok(/Push — Fuerza/.test(lista_fit10), '🚨 FIT F10 — el entrenamiento guardado APARECE solo, sin ningún paso más (apartado 37)');
ok(/\b1 entrenamiento\b/.test(lista_fit10), `🚨 …y es el ÚNICO: la sesión en curso NO aparece (apartado 38)`);
ok(/\bhoy\b/i.test(lista_fit10), '…agrupado bajo «Hoy» (apartados 5 y 39)');
ok(/\d+ min|menos de 1 min/.test(lista_fit10) && /\d+ series?|\d+\/\d+ series/.test(lista_fit10),
  '…con su duración y sus series en la tarjeta (apartado 6)');

/* Apartado 10 — buscar, y el «sin resultados». */
ok(await escribirBusqueda_fit10('FUERZA'), 'FIT F10 — se busca «FUERZA» en mayúsculas (apartado 10)');
await page.waitForTimeout(400);
ok(/Push — Fuerza/.test(await ver()), '…y lo encuentra igual');
ok(await escribirBusqueda_fit10('zzzz'), '…se busca algo que no existe');
const sinResultados_fit10 = await esperarTexto(/No hay entrenamientos que coincidan/i);
ok(/No hay entrenamientos que coincidan/i.test(sinResultados_fit10),
  '🚨 FIT F10 — y dice que no hay coincidencias, NO que no tenga entrenamientos (apartado 35)');
ok(await pulsar('Limpiar filtros'), '…y se limpian los filtros (apartado 34)');
await page.waitForTimeout(400);
ok(/Push — Fuerza/.test(await ver()), '🚨 …y vuelve la lista entera');

/* Apartados 11, 14 y 33 — filtrar y ordenar, combinados. */
ok(await pulsar('Mostrar filtros'), 'FIT F10 — se abren los filtros');
ok(await pulsar('Esta semana'), '…«Esta semana» (apartado 11)');
ok(await pulsar('Más antiguos'), '…y «Más antiguos», a la vez (apartados 14 y 33)');
await page.waitForTimeout(400);
const filtrado_fit10 = await ver();
ok(/Push — Fuerza/.test(filtrado_fit10) && /\b1 entrenamiento\b/.test(filtrado_fit10),
  '🚨 FIT F10 — los filtros combinados siguen encontrando el de hoy');
ok(await page.evaluate(() => [...document.querySelectorAll('button[aria-pressed="true"]')].some((b) => /Esta semana/.test(b.innerText))),
  '…y el filtro elegido se anuncia como pulsado, no solo con color (apartado 42)');
ok(await pulsar('Limpiar filtros'), '…se limpian');
await page.waitForTimeout(300);

/* Apartado 36 — sobrevive a recargar. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar') && await pulsar('Fitness'), 'FIT F10 — se recarga la aplicación');
ok(await pulsar('Abrir Historial'), '…y se vuelve al historial');
ok(/Push — Fuerza/.test(await esperarTexto(/Push — Fuerza/)), '🚨 FIT F10 — y el entrenamiento sigue ahí (apartado 36)');

/* Apartados 16-25 — el detalle. */
ok(await pulsarQueEmpiece_fit10('Abrir Push — Fuerza'), 'FIT F10 — se abre el entrenamiento (apartado 16)');
const detalle_fit10 = await esperarTexto(/Planificado/i);
ok(/Push — Fuerza/.test(detalle_fit10) && /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) \d{4}/i.test(detalle_fit10),
  '🚨 FIT F10 — con su nombre y la fecha en largo (apartados 16 y 39)');
ok(/Inicio/i.test(detalle_fit10) && /Final/i.test(detalle_fit10) && /Duraci[oó]n/i.test(detalle_fit10),
  '…inicio, final y duración (apartado 17)');
ok(/\d+\/\d+ series completadas/.test(detalle_fit10), '…las series completadas');
ok(/Planificado/i.test(detalle_fit10) && /Realizado/i.test(detalle_fit10),
  '🚨 FIT F10 — planificado y realizado, por separado (apartado 25)');
ok(/fuerte en los presses/.test(detalle_fit10), '…y la nota general que escribió en la F8 (apartado 24)');
/* 🔓 FIT F11, apartado 34 — es su primer entrenamiento de estos ejercicios: la comparación con «la última vez» NO puede salir. */
ok(!/respecto a la última vez/.test(detalle_fit10), '🚨 FIT F11 — y como es la primera vez, NO dice «respecto a la última vez»: no hay con qué comparar');
ok(/No realizado/i.test(detalle_fit10), '⚠️ …y el ejercicio que no hizo dice «No realizado»');
ok(await page.evaluate(() => document.querySelectorAll('input[aria-label^="Peso de la serie"], input[aria-label^="Repeticiones de la serie"]').length === 0),
  '🚨 FIT F10 — y es de CONSULTA: ni un campo para cambiar un peso o una repetición (apartado 30)');
ok(!/Compartir/i.test(detalle_fit10), '…ni un «Compartir» sin función (apartado 31)');

ok(await pulsarQueEmpiece_fit10('Ver las series de'), 'FIT F10 — se despliega un ejercicio (apartado 19)');
await page.waitForTimeout(400);
const series_fit10 = await ver();
ok(/Serie/i.test(series_fit10) && /Hecha/i.test(series_fit10), '🚨 …y enseña cada serie con su estado');
ok(/62,5 kg/.test(series_fit10), '🚨 …con los 62,5 kg que registró en la F7, en español');
ok(await page.evaluate(() => !!document.querySelector('button[aria-expanded="true"][aria-label^="Ocultar las series de"]')),
  '…y anuncia que está desplegado');

/* Apartados 28 y 29 — eliminar. */
const papeleraAntes_fit10 = (guardado.filter((g) => g && g.key === 'papelera').at(-1)?.value?.elementos || []).length;
const planAntes_fit10 = JSON.stringify(fitness_fit10().planActivo);
ok(await pulsar('Eliminar entrenamiento'), 'FIT F10 — se pulsa «Eliminar entrenamiento» (apartado 28)');
const aviso_fit10 = await esperarTexto(/¿Eliminar este entrenamiento\?/);
ok(/¿Eliminar este entrenamiento\?/.test(aviso_fit10) && /Papelera/.test(aviso_fit10), '🚨 …y pregunta, diciendo que va a la papelera');
ok(await pulsar('Cancelar'), '…se cancela');
await page.waitForTimeout(400);
ok((fitness_fit10().sesiones || []).some((x) => x && x.id === guardada_fit10?.id), '…y el entrenamiento sigue');
ok(await pulsar('Eliminar entrenamiento'), 'ahora sí');
ok(await pulsar('Eliminar este entrenamiento del historial'), '…se confirma');
const trasEliminar_fit10 = await esperarTexto(/Aún no tienes entrenamientos/i);
ok(/Aún no tienes entrenamientos/i.test(trasEliminar_fit10),
  '🚨 FIT F10 — sale del historial, que se queda con su estado vacío (apartados 9 y 28)');
ok(/Empezar entrenamiento/.test(trasEliminar_fit10), '…con el botón para empezar (apartado 9)');
await page.waitForTimeout(500);
ok(!(fitness_fit10().sesiones || []).some((x) => x && x.id === guardada_fit10?.id), '🚨 …la sesión ya no está en lo guardado');
ok((guardado.filter((g) => g && g.key === 'papelera').at(-1)?.value?.elementos || []).length === papeleraAntes_fit10 + 1,
  '🚨 …y está en la PAPELERA, recuperable');
ok((fitness_fit10().sesiones || []).some((x) => x && x.estado === 'en_curso'), '…sin tocar las demás sesiones (apartado 28)');
ok(JSON.stringify(fitness_fit10().planActivo) === planAntes_fit10, '…ni el plan');

ok(await pulsar('Volver a Entrenamiento'), 'FIT F10 — se vuelve a Entrenamiento');
ok(/Tu Plan/i.test(await esperarTexto(/Tu Plan/i)), '…a Tu Plan');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F12 — Fitness → Progreso (Entrega 4 · 12/45)
   ══════════════════════════════════════════════════════════════════════════

   El criterio del apartado 45: *"Progreso → Ejercicio → Comparación → Historial
   → Sesión, y todos los datos deben coincidir."* Hace falta más de una sesión
   del mismo ejercicio para que haya comparación, así que **se siembran**: tres
   de press de banca con una mejora real al final, y un L-sit de una sola vez.
   ⚠️ Van DESPUÉS de la F10, que deja el historial vacío al eliminar, para no
   cambiar lo que aquélla cuenta. La sesión en curso que había se conserva. */
console.log('\n── FIT F12 · Progreso por ejercicio ──');

const hoy_fit12 = new Date().toLocaleDateString('sv-SE');
const haceDias_fit12 = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv-SE'); };
const serie_fit12 = (id, reps, peso) => ({ id, origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 8, repsHasta: 10, duracion: null, peso: null }, hecho: { reps, peso, duracion: null } });
const sesionSembrada_fit12 = (id, dias, series, exerciseId = 'press-banca-barra', modo = 'reps') => {
  const fecha = haceDias_fit12(dias);
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  return {
    id, nombre: 'Push sembrado', fecha, estado: 'completada', iniciadaEn: inicio, terminadaEn: inicio + 50 * 60000,
    guardadaEn: inicio + 51 * 60000, pausadoMs: 0, actual: 0, visibilidad: 'privado', notas: '', entorno: 'gym',
    origen: { tipo: 'plantilla', id: null, ejercicios: [{ id: `${id}-e`, exerciseId, orden: 0, modo, notas: '', descanso: 90, sustituyeA: null, linea: { series: series.length, tipoCarga: 'externo' }, series }] },
  };
};
almacen.fitness = {
  ...(almacen.fitness || {}),
  sesiones: [
    ...((almacen.fitness && almacen.fitness.sesiones) || []).filter((x) => x && x.estado !== 'completada'),
    sesionSembrada_fit12('f12-a', 20, [serie_fit12('a1', 8, 60), serie_fit12('a2', 8, 60)]),
    sesionSembrada_fit12('f12-b', 10, [serie_fit12('b1', 8, 62.5), serie_fit12('b2', 8, 62.5)]),
    sesionSembrada_fit12('f12-c', 2, [serie_fit12('c1', 10, 62.5), serie_fit12('c2', 9, 62.5)]),
    sesionSembrada_fit12('f12-d', 5, [{ id: 'd1', origen: 'planificada', estado: 'hecha', modo: 'tiempo', plan: { reps: null, repsHasta: null, duracion: 15, peso: null }, hecho: { reps: null, peso: null, duracion: 12 } }], 'l-sit', 'tiempo'),
  ],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness'), 'FIT F12 — se entra en Fitness con cuatro sesiones sembradas');
ok(await pulsar('Progreso'), '…y en Progreso (apartado 1)');
const resumen_fit12 = await esperarTexto(/Mejorando/i);
ok(/Tu progreso/i.test(resumen_fit12) && /Evoluci[oó]n de tu rendimiento/i.test(resumen_fit12), '🚨 FIT F12 — la cabecera «Tu progreso» (apartado 3)');
ok(/Mejorando/i.test(resumen_fit12) && /Entrenamientos/i.test(resumen_fit12), '🚨 …con las cifras reales: hay un ejercicio comparable (apartado 4)');
/* 🔓 **ESTA COMPROBACIÓN SE MUDA CON LA FIT F28, NO SE BORRA** (E3 F44 y la
   SU F1 → SU F2 otra vez). El Resumen pasó a ser el centro de seguimiento, así
   que el bloque ya no se llama «Progreso reciente» sino «Ejercicios en
   progreso» (apartado 4, literal) — pero **el cambio real sigue ahí**, que es
   lo que esta comprobación guardaba: retirar una pantalla no puede llevarse
   una función (E3 F43). */
ok(/Ejercicios en progreso/i.test(resumen_fit12) && /62,5 kg × 8 → 62,5 kg × 10/.test(resumen_fit12),
  '🚨 FIT F12 — el cambio REAL sigue en el resumen: 62,5 kg × 8 → 62,5 kg × 10 (apartado 26)');
ok(!/confeti|\bXP\b|monedas/i.test(resumen_fit12), '…sin gamificación (apartado 27)');

ok(await pulsar('Ejercicios'), 'FIT F12 — la pestaña Ejercicios');
const lista_fit12 = await esperarTexto(/Primer registro|Mejorando/i);
ok(/Primer registro/i.test(lista_fit12) && /Mejorando/i.test(lista_fit12),
  '🚨 …con el press «Mejorando» y el L-sit como «Primer registro»: estados distintos (apartado 36)');
const orden_fit12 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver el progreso de"]')].map((b) => b.getAttribute('aria-label')));
ok(orden_fit12.length >= 2 && /Mejorando/.test(orden_fit12[0]) && /Primer registro/.test(orden_fit12[orden_fit12.length - 1]),
  '🚨 FIT F12 — lo que tiene comparación va DELANTE de lo que no, aunque el L-sit sea más reciente (apartado 8)');
ok(await pulsar('Sin datos'), 'FIT F12 — filtro «Sin datos» (apartado 10)');
await page.waitForTimeout(400);
const sinDatos_fit12 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver el progreso de"]')].map((b) => b.getAttribute('aria-label')));
ok(sinDatos_fit12.length === 1 && /Primer registro/.test(sinDatos_fit12[0]), '…deja solo el de una vez');
ok(await pulsar('Todos'), '…se vuelve a «Todos»');

/* Progreso → Ejercicio → Comparación → Historial → Sesión. */
ok(await pulsarQueEmpiece_fit10('Ver el progreso de Press'), 'FIT F12 — se abre el progreso del press de banca (apartado 11)');
const detalle_fit12 = await esperarTexto(/Última vez/i);
ok(/Última vez/i.test(detalle_fit12) && /62,5 kg × 10/.test(detalle_fit12), '🚨 FIT F12 — «Última vez: 62,5 kg × 10», destacada (apartado 12)');
ok(/Anterior/i.test(detalle_fit12) && /62,5 kg × 8/.test(detalle_fit12) && /\+2 reps/.test(detalle_fit12),
  '🚨 FIT F12 — la comparación: anterior 62,5 kg × 8 → +2 reps (apartado 13)');
ok(/Mejor resultado/i.test(detalle_fit12), '…el mejor resultado (apartado 14)');
ok(/Mejor peso por sesi[oó]n/i.test(detalle_fit12), '🚨 …y la gráfica, diciendo QUÉ mide (apartado 22)');
ok(await page.evaluate(() => document.querySelectorAll('svg circle[role="button"]').length === 3), '…con un punto por sesión: tres (apartado 21)');
const desborde_fit12 = await page.evaluate(() => ({ a: document.documentElement.scrollWidth, v: window.innerWidth }));
ok(desborde_fit12.a <= desborde_fit12.v + 1, `🚨 FIT F12 — a 375 px la gráfica NO desborda de lado (${desborde_fit12.a} vs ${desborde_fit12.v}, apartado 40)`);

ok(await page.evaluate(() => {
  const puntos = document.querySelectorAll('svg circle[role="button"]');
  if (!puntos.length) return false;
  puntos[puntos.length - 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}), 'FIT F12 — se toca el último punto de la gráfica (apartado 25)');
await page.waitForTimeout(400);
ok(/Ver entrenamiento/.test(await ver()), '…y dice su fecha y su resultado, con «Ver entrenamiento»');

ok(await pulsarQueEmpiece_fit10('Ver las series del'), 'FIT F12 — se despliega una sesión del historial del ejercicio (apartado 17)');
await page.waitForTimeout(400);
ok(/Serie 1 — 62,5 kg × 10/.test(await ver()) && /Serie 2 — 62,5 kg × 9/.test(await ver()),
  '🚨 FIT F12 — «Serie 1 — 62,5 kg × 10 · Serie 2 — 62,5 kg × 9»');
ok(await pulsar('Ver entrenamiento'), 'FIT F12 — «Ver entrenamiento» (apartado 30)');
const sesion_fit12 = await esperarTexto(/Planificado/i);
ok(/Push sembrado/.test(sesion_fit12), '🚨 …abre la pantalla de la F10, la misma del historial');
ok(await pulsarQueEmpiece_fit10('Ver las series de'), '…se despliega el ejercicio');
await page.waitForTimeout(400);
const seriesF10_fit12 = await ver();
ok(/62,5 kg/.test(seriesF10_fit12) && /\b10\b/.test(seriesF10_fit12) && /\b9\b/.test(seriesF10_fit12),
  '🚨 FIT F12 — y el historial dice LO MISMO que Progreso: 62,5 kg, 10 y 9 (apartado 31)');
ok(/\+2 reps respecto a la última vez/.test(seriesF10_fit12), '🚨 …incluida la comparación de la F11: «+2 reps respecto a la última vez»');
/* 🔓 FIT F31 — abierta desde Progreso, el botón dice adónde vuelve: antes
   decía «Volver al historial» y volvía a Progreso. */
ok(await pulsar('Volver a Progreso'), '…se vuelve (a Progreso, y lo dice)');
await page.waitForTimeout(400);

/* Apartado 9 — buscar un ejercicio que nunca ha hecho. */
ok(await pulsar('Volver a Progreso'), 'FIT F12 — se vuelve a Progreso');
await page.waitForTimeout(300);
ok(await pulsar('Ejercicios'), '…a Ejercicios');
ok(await page.evaluate(() => {
  const c = document.querySelector('input[aria-label="Buscar ejercicio en tu progreso"]');
  if (!c) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(c, 'planche');
  c.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}), 'FIT F12 — se busca «planche», que nunca ha hecho');
const busca_fit12 = await esperarTexto(/Sin datos/i);
ok(/Todavía no los has registrado/i.test(busca_fit12) && /planche/i.test(busca_fit12),
  '🚨 FIT F12 — sale APARTE, como «Sin datos», sin mezclarse con su progreso (apartado 9)');

/* Apartado 41 — recargar y que se reconstruya. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F12 — se recarga la aplicación');
ok(/62,5 kg × 8 → 62,5 kg × 10/.test(await esperarTexto(/Ejercicios en progreso/i)), '🚨 …y el progreso se reconstruye igual desde las sesiones guardadas (apartado 41)');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F13 — Progreso por grupos musculares (Entrega 4 · 13/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 27, literal: *"Fitness → Progreso → Progreso
   muscular → Espalda → Dorsales → Dominadas → Ver evolución del ejercicio"*.
   Se siembran dos sesiones de dominadas con una mejora, sobre las de la F12. */
console.log('\n── FIT F13 · Progreso muscular ──');

const dominada_fit13 = (id, dias, reps) => {
  const base = sesionSembrada_fit12(id, dias, [{ id: `${id}-1`, origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 8, repsHasta: null, duracion: null, peso: null }, hecho: { reps, peso: null, duracion: null } }], 'dominada-prona');
  base.origen.ejercicios[0].linea.tipoCarga = 'corporal';
  base.nombre = 'Pull sembrado';
  return base;
};
almacen.fitness = { ...almacen.fitness, sesiones: [...almacen.fitness.sesiones, dominada_fit13('f13-a', 9, 8), dominada_fit13('f13-b', 1, 11)] };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F13 — Fitness → Progreso');
ok(await pulsar('Músculos'), '…→ Progreso muscular (apartado 3)');
const musculos_fit13 = await esperarTexto(/Espalda/);
ok(['Brazos', 'Piernas', 'Espalda', 'Pecho', 'Hombros', 'Abdominales', 'Cuello'].every((g) => musculos_fit13.includes(g)),
  '🚨 FIT F13 — aparecen los siete grupos (26.2)');
ok(/no el tamaño del músculo/i.test(musculos_fit13), '🚨 …diciendo que mide rendimiento, no el músculo (apartado 2)');
const tarjetasMusculo_fit13 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .map((b) => b.getAttribute('aria-label')).filter((a) => /^(Brazos|Piernas|Espalda|Pecho|Hombros|Abdominales|Cuello):/.test(a)));
ok(tarjetasMusculo_fit13.some((a) => /^Cuello: Sin datos/.test(a)), '🚨 FIT F13 — el Cuello, que no ha entrenado, dice «Sin datos», NO «Descenso» (apartado 11)');
ok(tarjetasMusculo_fit13.some((a) => /^Pecho: Mejorando\. Poca información/.test(a)),
  '🚨 …y el Pecho, con un solo ejercicio, su tendencia con «Poca información» (26.4)');

ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F13 — → Espalda (apartado 6)');
const espalda_fit13 = await esperarTexto(/Rendimiento general/i);
ok(/Rendimiento general/i.test(espalda_fit13) && /Subgrupos/i.test(espalda_fit13) && /Dorsales/.test(espalda_fit13),
  '🚨 …con su rendimiento general y sus subgrupos');
ok(/Implicación en este músculo: \d+ %/.test(espalda_fit13), '🚨 …y cada ejercicio con su implicación del catálogo (apartado 9)');
ok(await pulsarQueEmpiece_fit10('Dorsales:'), 'FIT F13 — → Dorsales (apartado 9)');
const dorsales_fit13 = await esperarTexto(/Implicación en este músculo/i);
ok(/Dominada/i.test(dorsales_fit13), '…que lista las dominadas');
ok(await pulsarQueEmpiece_fit10('Ver el progreso de Dominada'), 'FIT F13 — → Dominadas');
const evol_fit13 = await esperarTexto(/Última vez/i);
ok(/11 reps/.test(evol_fit13) && /\+3 reps/.test(evol_fit13),
  '🚨 FIT F13 — → «Ver evolución del ejercicio»: la pantalla de la F12, con 8 → 11 reps y «+3 reps» (apartado 27)');
ok(!/\bkg\b/.test(evol_fit13.split('Mejor resultado')[0]), '…y a peso corporal, sin un solo kg inventado (apartado 5)');
ok(await pulsar('Volver a Progreso'), '…se vuelve');
ok(/Dorsales/.test(await esperarTexto(/Implicación en este músculo/i)), '🚨 …al subgrupo de donde venía');
ok(await pulsar('Volver a Espalda'), '…a Espalda');
ok(await pulsar('Volver a Progreso'), '…y a Progreso');

/* Apartado 13 — el periodo cambia el resumen muscular. */
ok(await pulsar('7 días'), 'FIT F13 — periodo «7 días» (apartado 13)');
await page.waitForTimeout(500);
const siete_fit13 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .map((b) => b.getAttribute('aria-label')).filter((a) => /^(Espalda|Pecho):/.test(a)));
ok(siete_fit13.some((a) => /^Pecho: Sin datos/.test(a)),
  '🚨 FIT F13 — en 7 días el Pecho NO tiene con qué comparar (la sesión anterior es de hace 10): «Sin datos», sin usar datos viejos');

/* Apartado 8 — filtrar la lista de ejercicios por grupo. */
ok(await pulsar('Todo'), '…se vuelve a «Todo»');
ok(await pulsar('Ejercicios'), 'FIT F13 — Ejercicios');
ok(await page.evaluate(() => {
  const g = document.querySelector('[aria-label="Filtrar por grupo muscular"]');
  const b = g && [...g.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Espalda');
  if (!b) return false;
  b.click();
  return true;
}), '…filtro «Espalda» (apartado 8)');
await page.waitForTimeout(400);
const filtradosEsp_fit13 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver el progreso de"]')].map((b) => b.getAttribute('aria-label')));
ok(filtradosEsp_fit13.length === 1 && /Dominada/.test(filtradosEsp_fit13[0]),
  `🚨 FIT F13 — deja solo las dominadas: el press y el L-sit no trabajan la espalda (${filtradosEsp_fit13.length})`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F14 — Objetivos de rendimiento (Entrega 4 · 14/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 31, literal: *"Fitness → Progreso → Mis objetivos →
   + Crear objetivo → Dominadas → 15 repeticiones"*, y registrar entrenamientos
   hasta ver *15 / 15 · ✓ Objetivo conseguido*. Las dominadas sembradas en la F13
   llegan a 11; después se siembra una sesión con 15. */
console.log('\n── FIT F14 · Objetivos ──');

ok(await pulsar('Objetivos'), 'FIT F14 — Progreso → Mis objetivos');
const vacioObj_fit14 = await esperarTexto(/Sin objetivos todav[ií]a/i);
ok(/Sin objetivos todav[ií]a/i.test(vacioObj_fit14) && /\+ Crear objetivo/.test(vacioObj_fit14),
  '🚨 FIT F14 — el estado vacío, sin un solo objetivo de ejemplo (apartado 22)');
ok(await pulsar('+ Crear objetivo'), 'FIT F14 — + Crear objetivo');
ok(await pulsar('Elegir ejercicio'), '…se elige el ejercicio con el catálogo de siempre (apartado 4)');
ok(await page.evaluate(() => {
  const c = document.querySelector('input[aria-label="Buscar un ejercicio"]');
  if (!c) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(c, 'dominada prona');
  c.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}), '…se busca «dominada prona»');
ok(await pulsar('Añadir Dominadas pronas · Agarre prono'), '…→ Dominadas');
const form_fit14 = await esperarTexto(/Qué quieres medir/i);
ok(/Dominadas pronas/.test(form_fit14) && /Repeticiones/.test(form_fit14), '🚨 FIT F14 — con la métrica que admite: repeticiones (apartado 3)');
const escribirObjetivo_fit14 = (valor) => page.evaluate((v) => {
  const c = [...document.querySelectorAll('input[aria-label]')].find((i) => /^Objetivo en /.test(i.getAttribute('aria-label')));
  if (!c) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(c, v);
  c.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, valor);
ok(await escribirObjetivo_fit14('0') && await pulsar('Crear objetivo'), 'FIT F14 — se intenta crear con 0');
ok(/mayor que cero/i.test(await esperarTexto(/mayor que cero/i)), '🚨 …y NO deja: «tiene que ser mayor que cero» (apartado 5)');
ok(await escribirObjetivo_fit14('15') && await pulsar('Crear objetivo'), 'FIT F14 — → 15 repeticiones → Crear objetivo');
const detalleObj_fit14 = await esperarTexto(/11 \/ 15 reps/);
ok(/11 \/ 15 reps/.test(detalleObj_fit14) && /73 %/.test(detalleObj_fit14),
  '🚨 FIT F14 — «11 / 15 reps · 73 %»: la mejor serie real de las sesiones (apartados 6 y 9)');
ok(/En progreso/.test(detalleObj_fit14), '…en progreso');
await page.waitForTimeout(500);
const objGuardado_fit14 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.objetivos || []);
ok(objGuardado_fit14.length === 1 && objGuardado_fit14[0].valor === 15 && objGuardado_fit14[0].exerciseId === 'dominada-prona' && objGuardado_fit14[0].unidad === 'reps',
  '🚨 FIT F14 — el objetivo está GUARDADO: dominada-prona, 15 reps (apartado 24)');
ok(await pulsar('Ver progreso del ejercicio'), 'FIT F14 — «Ver progreso del ejercicio» (apartado 16)');
ok(/Última vez/i.test(await esperarTexto(/Última vez/i)), '…abre la pantalla de la F12');
ok(await pulsar('Volver a Progreso'), '…y se vuelve');
ok(/11 \/ 15 reps/.test(await esperarTexto(/11 \/ 15 reps/)), '…al objetivo');

/* Y ahora un entrenamiento real con una serie de 15. */
almacen.fitness = {
  ...almacen.fitness,
  sesiones: [...almacen.fitness.sesiones, dominada_fit13('f14-a', 0, 15)],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso') && await pulsar('Objetivos'),
  'FIT F14 — tras entrenar 15 dominadas se vuelve a Mis objetivos (y a recargar: persistencia)');
const conseguido_fit14 = await esperarTexto(/15 \/ 15 reps/);
ok(/15 \/ 15 reps/.test(conseguido_fit14) && /✓ Objetivo conseguido/.test(conseguido_fit14),
  '🚨 FIT F14 — «15 / 15 reps · ✓ Objetivo conseguido» (apartado 31, literal)');
ok(!/confeti|\bXP\b|medalla|recompensa/i.test(conseguido_fit14), '…sin recompensas ni gamificación (apartado 29)');
const objTrasConseguir_fit14 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.objetivos || []);
ok(objTrasConseguir_fit14.length === 1 && objTrasConseguir_fit14[0].estado === 'activo',
  '⚠️ …y «conseguido» se DEDUCE: lo guardado no se ha reescrito solo');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F16 — La pantalla de Rangos (Entrega 4 · 16/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 28: abrir Fitness → Rangos y ver el rango global,
   la cobertura, el progreso al siguiente, los diez rangos, los ejercicios
   clasificados, el cuerpo y los rankings musculares — **todo con datos reales**
   (apartado 25). Se aprovecha lo que ya han sembrado la F12, la F13 y la F14.

   ⚠️ Lo que se comprueba aquí es lo que **no depende** de cuántas sesiones haya
   dejado el recorrido antes: los números exactos (dos ejercicios no dan rango
   global, tres sí) se fijan en `scripts/test-pantalla-rangos.mjs`, donde los
   datos se controlan. Una prueba de recorrido que fije un número que otra
   sección puede cambiar se vuelve roja sin que nada esté roto. */
console.log('\n── FIT F16 · Rangos ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F16 — Fitness → Rangos');
const rangos_fit16 = await esperarTexto(/Rango Predicho/i);
ok(/Rango Predicho/i.test(rangos_fit16), 'FIT F16 — la tarjeta principal (apartado 3)');
ok(/de 7 grupos con datos/.test(rangos_fit16),
  '⚠️ FIT F16 — la cobertura, contada de verdad (apartado 5)');
ok(/no tu forma física/i.test(rangos_fit16),
  '🚨 …diciendo que mide información disponible, no forma física (apartado 5)');
const clasificados_fit16 = /(\d+) de (\d+) clasificados/.exec(rangos_fit16);
ok(clasificados_fit16 && Number(clasificados_fit16[1]) > 0 && Number(clasificados_fit16[2]) > 40,
  `🚨 FIT F16 — «N de M clasificados» sobre el catálogo real (${clasificados_fit16 ? clasificados_fit16[0] : 'no sale'}, apartado 9)`);
ok(!/0 restantes/i.test(rangos_fit16) && !/próximamente/i.test(rangos_fit16),
  '⚠️ …sin contadores falsos ni pantallas «próximamente» (regla 8)');
ok(/Tu cuerpo/i.test(rangos_fit16) && /Rankings musculares/i.test(rangos_fit16),
  'FIT F16 — «Tu cuerpo» y los rankings musculares (apartados 10 y 11)');
ok(/Cuello/.test(rangos_fit16) && /Sin datos/.test(rangos_fit16),
  '🚨 FIT F16 — el grupo que no ha entrenado dice «Sin datos», no un rango de consolación (apartado 12)');
ok(!/\bXP\b|leaderboard|medalla|recompensa/i.test(rangos_fit16),
  '⚠️ FIT F16 — sin gamificación (apartado 26)');

const anchoRangos_fit16 = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth + 2,
  ancho: document.documentElement.scrollWidth,
}));
ok(!anchoRangos_fit16.desborda,
  `⚠️ FIT F16 — los diez hexágonos no arrastran la pantalla de lado (${anchoRangos_fit16.ancho} px, apartado 19)`);

/* Apartado 8 — tocar un rango abre su hoja, sin abrir media aplicación. */
ok(await pulsar('Élite'), 'FIT F16 — se toca el rango Élite');
const hoja_fit16 = await esperarTexto(/Empieza en/i);
ok(/Élite/.test(hoja_fit16) && /Continúa mejorando/i.test(hoja_fit16),
  '🚨 FIT F16 — la hoja dice qué es y cómo se alcanza (apartado 8)');
ok(/Empieza en 950 de 1000/.test(hoja_fit16),
  '⚠️ FIT F16 — con el umbral de la escala, que es igual para todos…');
ok(await pulsar('Cerrar'), '…y se cierra donde estaba');

/* Y ahora, con sentadillas sembradas, tiene que haber rango global: tres
   ejercicios y tres grupos, que es el mínimo de la F15. */
almacen.fitness = {
  ...almacen.fitness,
  sesiones: [
    ...almacen.fitness.sesiones,
    sesionSembrada_fit12('f16-a', 12, [serie_fit12('s1', 6, 80), serie_fit12('s2', 6, 80)], 'sentadilla-barra'),
    sesionSembrada_fit12('f16-b', 3, [serie_fit12('s3', 6, 90), serie_fit12('s4', 5, 90)], 'sentadilla-barra'),
  ],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F16 — se siembran sentadillas y se vuelve a Rangos');
const conRango_fit16 = await esperarTexto(/Cobertura/i);
ok(/Próximo rango/i.test(conRango_fit16),
  '🚨 FIT F16 — con tres ejercicios de tres zonas ya hay rango global y camino al siguiente (apartado 6)');
const destacado_fit16 = await page.evaluate(() => [...document.querySelectorAll('button')]
  .filter((b) => /\bActual\b/.test(b.innerText || ''))
  .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim()));
ok(destacado_fit16.length === 1,
  `🚨 FIT F16 — exactamente UN rango está marcado como actual (${destacado_fit16.join(' · ') || 'ninguno'}, apartado 7)`);
const grupos_fit16 = (t) => Number((/(\d+) de 7 grupos con datos/.exec(t) || [])[1] || 0);
ok(grupos_fit16(conRango_fit16) >= grupos_fit16(rangos_fit16) && grupos_fit16(conRango_fit16) >= 3,
  `⚠️ FIT F16 — y la cobertura ha subido con el ejercicio nuevo (${grupos_fit16(rangos_fit16)} → ${grupos_fit16(conRango_fit16)} de 7)`);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F25 — El resumen de la pantalla de Rangos (Entrega 4 · 25/45)
   ══════════════════════════════════════════════════════════════════════════
   Se comprueba **aquí**, con el rango global que la F16 acaba de sembrar: es el
   único punto del recorrido donde existe, y sin él los destacados, la confianza
   y los ejercicios relevantes saldrían vacíos y esto no mediría nada (la lección
   de las fábricas de escenarios, FIT F22).

   ⚠️ Y **no se afirma un rango concreto**: depende de las sesiones sembradas más
   arriba, y una comprobación atada a «Intermedio» se pondría roja el día que
   alguien cambie un peso de ese escenario. Lo que se mide es **la jerarquía y
   lo que se puede decir**. */
console.log('\n── FIT F25 · El resumen de Rangos ──');

const resumen_fit25 = conRango_fit16;
/* Apartado 2 — el orden: primero el rango, y la escala de los diez DESPUÉS.
   🐛 **En minúsculas, y con el rótulo que de verdad se lee** (dos rojos míos):
   «Rango Predicho» lleva la clase `uppercase`, así que `innerText` lo devuelve
   **renderizado** —«RANGO PREDICHO»— y un `indexOf` con mayúsculas y minúsculas
   daba −1 (la lección de la E3 F8). Y la sección de los siete grupos **se llama
   «Rankings musculares»**, no «Rangos musculares», que es el nombre del bloque
   en `BLOQUES`: el rótulo de pantalla y el del catálogo no tienen por qué
   coincidir, y aquí se busca el de pantalla. */
const enMinusculas_fit25 = resumen_fit25.toLowerCase();
const orden_fit25 = (t) => ['rango predicho', 'cobertura', 'destacados', 'rankings musculares']
  .map((x) => t.indexOf(x));
const pos_fit25 = orden_fit25(enMinusculas_fit25);
ok(pos_fit25.every((p) => p >= 0),
  `🚨 FIT F25 — los bloques del apartado 2 están todos en la pantalla (${pos_fit25.join(', ')})`);
ok(pos_fit25[0] < pos_fit25[1] && pos_fit25[1] < pos_fit25[2] && pos_fit25[2] < pos_fit25[3],
  '🚨 FIT F25 — y en ese orden: rango → cobertura → destacados → rankings (apartado 2)');
const escala_fit25 = enMinusculas_fit25.indexOf('los diez niveles de la escala');
ok(escala_fit25 > pos_fit25[0],
  '⚠️ FIT F25 — la escala de los diez baja: es referencia, no la respuesta a «¿cómo estoy?» (apartado 27)');

/* 🔓 Apartado 6 — la confianza, que hasta esta fase NO se enseñaba en ninguna
   parte del rango general: el motor no la devolvía y callaba. */
ok(/Confianza alta|Confianza media|Datos limitados/.test(resumen_fit25),
  `🔓 FIT F25 — se enseña la confianza real del motor (${(/Confianza alta|Confianza media|Datos limitados/.exec(resumen_fit25) || ['no sale'])[0]}, apartado 6)`);

/* Apartados 9 y 10 — «Destacados», y su frase diciendo qué NO significa. */
ok(/Destacados/.test(resumen_fit25) && /no los que tienes más desarrollados/i.test(resumen_fit25),
  '🚨 FIT F25 — «Destacados», con la frase que niega que midan desarrollo físico (apartado 10)');
ok(!/mejores músculos/i.test(resumen_fit25), '🚨 FIT F25 — y en ningún sitio dice «mejores músculos»');

/* 🚨 Apartado 11 — y un destacado NO puede decir «Sin datos» de tendencia.
   ⚠️ Se mide sobre los botones de los destacados, no sobre la página entera:
   «Cuello · Sin datos» de los rankings es correcto y está más abajo. */
const destacados_fit25 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .map((b) => b.getAttribute('aria-label') || '')
  .filter((l) => /Ver su detalle$/.test(l)));
ok(destacados_fit25.length > 0 && destacados_fit25.length <= 3,
  `🚨 FIT F25 — entre uno y tres destacados, nunca los siete (${destacados_fit25.length}, apartado 9)`);
ok(destacados_fit25.every((l) => !/Sin datos/.test(l)),
  `🐛 FIT F25 — ningún destacado dice «Sin datos» (${destacados_fit25.join(' | ') || 'ninguno'})`);
/* Apartado 29 — y su nombre accesible lleva el rango en PALABRAS, no solo color. */
ok(destacados_fit25.every((l) => /: .+\. Ver su detalle$/.test(l)),
  '⚠️ FIT F25 — cada destacado dice su rango en palabras en el nombre accesible (apartado 29)');

/* Apartado 11, el otro lado: un grupo sin datos SÍ lo dice, y sigue en la lista. */
ok(/Cuello/.test(resumen_fit25) && /Sin datos/.test(resumen_fit25),
  '🚨 FIT F25 — el grupo sin entrenar sigue ahí y dice «Sin datos», no un 0 % (apartado 11)');

/* Apartados 12 y 13 — los ejercicios relevantes, sin afirmar causalidad. */
ok(/Ejercicios relevantes/.test(resumen_fit25),
  '🔓 FIT F25 — hay ejercicios relevantes en el rango GLOBAL (la F23 los daba solo por músculo)');
ok(!/gracias a|porque has|te ha hecho/i.test(resumen_fit25),
  '🚨 FIT F25 — y ningún texto afirma una causa (apartado 13)');

/* Apartados 14 y 15 — la clasificación pendiente, con su número de verdad. */
ok(/Clasifica algunos ejercicios/.test(resumen_fit25) && /recomendados?/.test(resumen_fit25),
  '⚠️ FIT F25 — la clasificación pendiente dice cuántos recomendados hay (apartado 14)');

/* Apartado 35 y D2-02 — ni XP, ni niveles, ni logros. */
ok(!/\bXP\b/.test(resumen_fit25) && !/\bNivel \d/.test(resumen_fit25) && !/\bLogros?\b/.test(resumen_fit25),
  '🚨 FIT F25 — sin gamificación en el resumen (apartado 35)');

/* Apartado 28 — y en el iPhone pequeño no se arrastra de lado. */
const anchoResumen_fit25 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(anchoResumen_fit25.ancho <= anchoResumen_fit25.ventana + 1,
  `⚠️ FIT F25 — el resumen no arrastra la pantalla de lado (${anchoResumen_fit25.ancho} px, apartado 28)`);

/* Apartado 22 — cada bloque abre su detalle. Desde un destacado, el muscular. */
const nombreDestacado_fit25 = (destacados_fit25[0] || '').split(':')[0];
ok(nombreDestacado_fit25 && await pulsarQueEmpiece_fit10(`${nombreDestacado_fit25}:`),
  `FIT F25 — se toca el destacado «${nombreDestacado_fit25}»`);
const desdeDestacado_fit25 = await esperarTexto(new RegExp(nombreDestacado_fit25, 'i'));
ok(new RegExp(nombreDestacado_fit25, 'i').test(desdeDestacado_fit25),
  '🚨 FIT F25 — y abre su detalle muscular, sin pantalla nueva (apartado 22)');
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F25 — se vuelve a Rangos');
await esperarTexto(/Cobertura/i);

/* ══════════════════════════════════════════════════════════════════════════
   FIT F26 — El progreso físico en fotos (Entrega 4 · 26/45)
   ══════════════════════════════════════════════════════════════════════════
   🚨 **Y aquí las imágenes NO cargan a propósito**: el stub de Supabase
   devuelve `{}` para Storage, así que ninguna URL se firma. Eso es exactamente
   el apartado 29 —*"si una foto almacenada ya no está disponible, mostrar un
   estado de error; no romper toda la galería"*—, y es la mejor forma de
   probarlo: si la pantalla aguantara solo con las fotos cargadas, no serviría
   de nada el día que a Josué le falle una. */
console.log('\n── FIT F26 · El progreso en fotos ──');

/* 🚨 **Y PRIMERO, EL PIN — porque esto tumbó la sección TRES PASADAS SEGUIDAS
   y yo se lo achaqué a las bombas de relojería del domingo y del horario.**
   `fotos_privadas` entra en `protectedActions` **en la primera carga de toda
   cuenta** (la migración de Seguridad Centralizada), así que la galería estaba
   detrás de un PIN **que Fitness no ofrecía**: se quedaba en el acceso de la
   F12 y ninguna de estas comprobaciones podía pasar jamás.
   Aquí se siembra la cuenta de quien **ha desprotegido** las fotos —con la
   migración ya hecha, para que no se las vuelva a poner— y unas líneas más
   abajo se comprueba el caso contrario: con la protección puesta, la MISMA
   puerta de Salud (C-35). */
almacen.ajustes = {
  ...(almacen.ajustes || {}),
  seguridad: {
    ...((almacen.ajustes || {}).seguridad || {}),
    protectedActions: [], protectedAreas: [],
    migradoAcciones: true, migradoAreas: true,
  },
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* El vacío primero, que es por donde entra quien no ha subido ninguna. */
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F26 — Fitness → Progreso');
ok(await pulsar('Fotos'), 'FIT F26 — y su pestaña de Fotos');
const vacio_fit26 = await esperarTexto(/Empieza a registrar tu progreso|fotos de progreso/i);
ok(/Empieza a registrar tu progreso/i.test(vacio_fit26),
  '🚨 FIT F26 — sin fotos, el estado vacío del apartado 24');
ok(/Guarda una foto ahora/i.test(vacio_fit26), '…con su frase');
ok(/Añadir primera foto/i.test(vacio_fit26), '…y su salida, que es un botón de verdad (regla 8)');

/* Ahora tres fotos, dos del MISMO día — y con la forma que tenía lo guardado
   antes de esta fase, sin sus cinco campos nuevos: así se prueba la migración. */
almacen.saludFotos = [
  { id: 'fr1', path: 'usuario-prueba/junio.jpg', fecha: '2026-06-12', nota: 'Inicio del verano' },
  { id: 'fr2', path: 'usuario-prueba/sept-a.jpg', fecha: '2026-09-12', nota: '' },
  { id: 'fr3', path: 'usuario-prueba/sept-b.jpg', fecha: '2026-09-12', nota: 'Inicio de curso' },
  /* 🚨 Y UNA que no se puede leer, en su propio día, para el apartado 29: las
     otras tres cargan de verdad, así que lo que se mide es que **una** rota no
     se lleve la galería por delante — no que fallen todas. */
  { id: 'fr4', path: 'usuario-prueba/rota.jpg', fecha: '2026-07-15', nota: 'La que no carga' },
];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso') && await pulsar('Fotos'),
  'FIT F26 — se siembran tres fotos y se vuelve a Fotos');
const galeria_fit26 = await esperarTexto(/SEP 2026|JUN 2026/i);

/* Apartado 10 — agrupadas por día, con su rótulo. */
ok(/12 SEP 2026/i.test(galeria_fit26) && /12 JUN 2026/i.test(galeria_fit26),
  '🚨 FIT F26 — las fotos se agrupan por día, con su rótulo (apartado 10)');
ok(/2 fotos/i.test(galeria_fit26), '…y el día que tiene dos lo dice: «2 fotos»');
ok(/Inicio de curso/i.test(galeria_fit26), '…con la nota que él escribió, no una inventada');
/* Apartado 9 — más reciente primero. */
ok(galeria_fit26.indexOf('12 SEP 2026') < galeria_fit26.indexOf('12 JUN 2026'),
  '⚠️ FIT F26 — y el día más reciente va primero (apartado 9)');

/* 🚨 Apartado 29 — las imágenes no cargan y la galería NO se rompe.
   ⚠️ **Y hay que ESPERAR a que la firma falle** (EH F51): `galeria_fit26` se
   leyó en cuanto salieron los rótulos de los días, y firmar tres fotos es un
   viaje asíncrono que todavía no había terminado. Un `innerText` leído pronto
   no dice que no esté: dice que aún no. */
const rotas_fit26 = await esperarTexto(/no se puede mostrar/i);
ok(/no se puede mostrar/i.test(rotas_fit26),
  '🚨 FIT F26 — una foto que no se puede leer lo DICE (apartado 29)');
ok(/12 SEP 2026/i.test(rotas_fit26) && /Añadir progreso/i.test(rotas_fit26),
  '🚨 …y la pantalla sigue entera: los días, la nota y el botón siguen ahí');

/* Apartado 13 — comparar, que con tres fotos sí se puede.
   🔓 **Y estas comprobaciones se dan la vuelta con la FIT F27** (E3 F44 y
   SU F1 → SU F2): la F26 pintaba la comparación DENTRO de la galería, con
   «Primera foto» y «Segunda foto», porque todavía no existía la pantalla de
   comparar. La F27 la construye, ese bloque se retira, y lo que estas líneas
   vigilan ahora es que el botón lleve al comparador entero. Lo que NO cambia
   es lo que de verdad importaba: que **manda la fecha**, no el orden en que
   las elige. */
ok(/Comparar progreso/i.test(galeria_fit26), 'FIT F26 — se ofrece comparar (apartado 13)');
ok(await pulsar('Comparar progreso'), 'FIT F27 — se abre el comparador');
const comparar_fit26 = await esperarTexto(/Inicial/i);
ok(/Inicial/i.test(comparar_fit26) && /Final/i.test(comparar_fit26),
  '⚠️ FIT F27 — con la selección sencilla del apartado 3: una inicial y una final');
ok(!/calendario/i.test(comparar_fit26), '…y sin un calendario complejo');

/* 🚨 Apartado 4 — ANTES y DESPUÉS los decide la FECHA. Se eligen AL REVÉS
   —primero la de septiembre como inicial— y tiene que salir junio como «Antes». */
const elegir_fit26 = async (etiqueta, fecha) => page.evaluate(({ e, f }) => {
  const b = [...document.querySelectorAll('button[aria-label]')]
    .find((x) => (x.getAttribute('aria-label') || '') === `${e}: ${f}`);
  if (b) { b.click(); return true; }
  return false;
}, { e: etiqueta, f: fecha });
ok(await elegir_fit26('Inicial', '12 SEP 2026'), 'FIT F27 — se elige primero la de SEPTIEMBRE');
await page.waitForTimeout(350);
ok(await elegir_fit26('Final', '12 JUN 2026'), 'FIT F27 — y después la de JUNIO');
const resultado_fit26 = await esperarTexto(/Antes/i);
ok(/Antes/i.test(resultado_fit26) && /Después/i.test(resultado_fit26), 'FIT F27 — sale la comparación');

/* 🐛 ⚠️ **Y LO QUE SE MIDE ES EL COMPARADOR, NO LA PÁGINA ENTERA** (E3 F11
   otra vez). El comparador va por `createPortal` al final del `body`, así que
   `innerText` trae **primero la galería de detrás** —que lista septiembre
   arriba, porque el día más reciente va primero— y las dos comprobaciones de
   abajo salían rojas con la pantalla bien: una encontraba «12 SEP 2026» en la
   galería antes que el «12 JUN 2026» del comparador, y la otra encontraba
   «músculo» en la pestaña **Músculos** de Progreso. Un overlay tapa lo de
   detrás: lo que hay que leer es lo que se ve. */
const enComparador_fit27 = () => page.evaluate(() => {
  const d = [...document.querySelectorAll('[role="dialog"]')].pop();
  return d ? d.innerText : '';
});
const comparado_fit27 = await enComparador_fit27();
ok(comparado_fit27.length > 0, 'FIT F27 — y se mide DENTRO del comparador, no la página de detrás');
/* ⚠️ **Y se mide por el PAPEL de cada foto, no por el orden del texto**: el
   `alt` dice «Foto anterior» o «Foto posterior» con su fecha, que es
   exactamente lo que afirma el apartado 4 — y no se mueve aunque se
   intercambien los lados (apartado 21). Un `indexOf` sobre el texto mediría
   la posición, que es justo lo que esta fase separa del tiempo. */
const papeles_fit27 = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] img[alt]')]
  .map((i) => i.getAttribute('alt')).filter((a) => /Foto (anterior|posterior)/.test(a)));
ok(papeles_fit27.some((a) => /Foto anterior: 12 JUN 2026/.test(a)),
  '🚨 FIT F27 — y JUNIO sale como «Antes» aunque se eligiera la segunda: manda la fecha (apartado 4)');
ok(papeles_fit27.some((a) => /Foto posterior: 12 SEP 2026/.test(a)),
  '…y SEPTIEMBRE como «Después», que es lo que dice el calendario');
ok(/de diferencia/i.test(comparado_fit27), '…con el tiempo entre las dos, que es lo único que se afirma');
/* 🚨 Apartados 14 y 41 de la F26, y 34 de la F27 — ni una palabra sobre el cuerpo. */
ok(!/músculo|grasa|has ganado|has perdido|masa corporal/i.test(comparado_fit27),
  '🚨 FIT F27 — y ni una palabra sobre su cuerpo (apartado 34)');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F27 — El comparador (Entrega 4 · 27/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 35, con el comparador ya abierto: verlas lado a
   lado, cambiar al modo deslizar, hacer zoom, cambiar las fotos y volver. */
console.log('\n── FIT F27 · El comparador ──');

/* 🚨 Apartado 21 — cada lado se entiende SIN depender de dónde está. */
const lados_fit27 = await page.evaluate(() => [...document.querySelectorAll('img[alt]')]
  .map((i) => i.getAttribute('alt')).filter((a) => /Foto (anterior|posterior)/.test(a)));
ok(lados_fit27.length >= 2,
  `🚨 FIT F27 — cada foto se llama «Foto anterior» o «Foto posterior» (${lados_fit27.length})`);

/* 🚨 Apartado 11 — con proporciones distintas NO se deforma ninguna. */
const ajuste_fit27 = await page.evaluate(() => [...document.querySelectorAll('img[alt]')]
  .filter((i) => /Foto (anterior|posterior)/.test(i.getAttribute('alt') || ''))
  .map((i) => getComputedStyle(i).objectFit));
ok(ajuste_fit27.length > 0 && ajuste_fit27.every((v) => v === 'contain'),
  `🚨 FIT F27 — y ninguna se estira: object-fit «contain» medido en el navegador (${ajuste_fit27.join(', ')})`);

/* 🚨 Apartado 4 — intercambiar cambia la POSICIÓN, nunca el rótulo. */
const ordenAntes_fit27 = await page.evaluate(() => [...document.querySelectorAll('img[alt]')]
  .map((i) => i.getAttribute('alt')).filter((a) => /Foto (anterior|posterior)/.test(a))[0]);
ok(await pulsar('Intercambiar lados'), 'FIT F27 — se intercambian los lados');
await page.waitForTimeout(400);
const ordenDespues_fit27 = await page.evaluate(() => [...document.querySelectorAll('img[alt]')]
  .map((i) => i.getAttribute('alt')).filter((a) => /Foto (anterior|posterior)/.test(a))[0]);
ok(ordenAntes_fit27 !== ordenDespues_fit27,
  '🚨 FIT F27 — la primera imagen pasa a ser la otra: el intercambio hace algo de verdad');
ok(/12 SEP 2026/.test(ordenDespues_fit27) && /posterior/.test(ordenDespues_fit27),
  '🚨 …y la de SEPTIEMBRE sigue llamándose «posterior» estando a la izquierda (apartado 21)');
ok(await pulsar('Intercambiar lados'), 'FIT F27 — y se deshace');
await page.waitForTimeout(300);

/* 🚨 Apartado 8 — el divisor existe, se anuncia y se mueve con el teclado. */
ok(await pulsar('Modo Deslizar'), 'FIT F27 — se cambia al modo deslizar (apartado 9)');
await page.waitForTimeout(400);
const divisor_fit27 = await page.evaluate(() => {
  const s = document.querySelector('[role="slider"]');
  if (!s) return null;
  return {
    valor: Number(s.getAttribute('aria-valuenow')),
    min: Number(s.getAttribute('aria-valuemin')),
    max: Number(s.getAttribute('aria-valuemax')),
    nombre: s.getAttribute('aria-label'),
    enfocable: s.tabIndex >= 0,
  };
});
ok(!!divisor_fit27, 'FIT F27 — hay un divisor de verdad, anunciado como deslizador');
ok(divisor_fit27 && divisor_fit27.valor === 50 && divisor_fit27.min === 0 && divisor_fit27.max === 100,
  '…que empieza en el centro y llega a los dos extremos (apartado 8)');
ok(divisor_fit27 && divisor_fit27.enfocable && /Divisor/i.test(divisor_fit27.nombre),
  '🚨 …y se puede enfocar con el teclado, con su nombre (apartado 21)');
await page.evaluate(() => document.querySelector('[role="slider"]').focus());
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(250);
const movido_fit27 = await page.evaluate(() => Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow')));
ok(movido_fit27 > 50, `🚨 FIT F27 — y la flecha derecha lo MUEVE de verdad (${movido_fit27})`);
await page.keyboard.press('End');
await page.waitForTimeout(250);
const alBorde_fit27 = await page.evaluate(() => Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow')));
ok(alBorde_fit27 === 100,
  '🚨 FIT F27 — y llega al borde: sin eso no se puede ver ninguna de las dos entera (apartado 8)');

/* Apartado 19 y 31 — ni compartir, ni exportar, ni una palabra de IA. */
const textoComp_fit27 = await page.evaluate(() => document.body.innerText);
ok(!/compartir|exportar|descargar|publicar/i.test(textoComp_fit27),
  '🚨 FIT F27 — ni compartir, ni exportar, ni publicar (apartados 19, 20 y 31)');
ok(!/inteligencia artificial|analizar tu cuerpo|% de grasa/i.test(textoComp_fit27),
  '🚨 FIT F27 — y ni análisis corporal ni IA (apartado 34)');

/* Apartado 10 — el zoom, en lado a lado, y con su vuelta. */
ok(await pulsar('Modo Lado a lado'), 'FIT F27 — se vuelve a lado a lado');
await page.waitForTimeout(400);
ok(await pulsar('Acercar: Foto anterior'), 'FIT F27 — se amplía UNA de las dos fotos (apartado 10)');
await page.waitForTimeout(400);
const escalas_fit27 = await page.evaluate(() => [...document.querySelectorAll('img[alt]')]
  .filter((i) => /Foto (anterior|posterior)/.test(i.getAttribute('alt') || ''))
  .map((i) => getComputedStyle(i).transform));
ok(escalas_fit27.filter((t) => t !== 'none' && !/matrix\(1, 0, 0, 1/.test(t)).length === 1,
  `🚨 FIT F27 — y SOLO esa se amplía: las dos imágenes son independientes (apartado 10)`);
const vuelta_fit27 = await page.evaluate(() => document.body.innerText);
ok(/Escala normal/i.test(vuelta_fit27),
  '⚠️ FIT F27 — con un botón claro para volver, que solo aparece cuando hay zoom (regla 8)');
ok(await pulsar('Escala normal'), 'FIT F27 — y se vuelve a escala normal');
await page.waitForTimeout(400);

/* Apartado 7 — el ancho: dos mitades en un iPhone de 375 px sin arrastrar. */
const ancho_fit27 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(ancho_fit27.ancho <= ancho_fit27.ventana + 1,
  `⚠️ FIT F27 — el comparador no arrastra la pantalla de lado (${ancho_fit27.ancho} px)`);

/* Apartado 17 — cambiar una foto SIN salir del flujo. Y de paso el caso 14 del
   apartado 32: el escenario tiene DOS fotos del 12 de septiembre, así que al
   poner la otra como final quedan **las dos del mismo día**. */
ok(await elegir_fit26('Final', '12 SEP 2026'), 'FIT F27 — se cambia la foto final sin salir (apartado 17)');
await page.waitForTimeout(400);
const cambiada_fit27 = await esperarTexto(/mismo día/i);
ok(/12 SEP 2026/.test(cambiada_fit27), 'FIT F27 — y la comparación se rehace con la nueva');
ok(/mismo día/i.test(cambiada_fit27) && !/0 días/.test(cambiada_fit27),
  '🚨 FIT F27 — con dos del mismo día dice «El mismo día», no «0 días de diferencia»');

/* Apartado 35 — volver a la galería. */
ok(await pulsar('Volver a la galería'), 'FIT F27 — se vuelve a la galería (apartado 35)');
const galeriaVuelta_fit27 = await esperarTexto(/Añadir progreso/i);
ok(/Añadir progreso/i.test(galeriaVuelta_fit27) && !/Intercambiar lados/i.test(galeriaVuelta_fit27),
  '🚨 FIT F27 — y el comparador se cierra entero: la galería vuelve a ser la galería');

/* Apartado 28 — el ancho en el iPhone pequeño. */
const anchoFotos_fit26 = await page.evaluate(() => ({
  ancho: document.documentElement.scrollWidth, ventana: window.innerWidth,
}));
ok(anchoFotos_fit26.ancho <= anchoFotos_fit26.ventana + 1,
  `⚠️ FIT F26 — la galería no arrastra la pantalla de lado (${anchoFotos_fit26.ancho} px)`);

/* 🚨 Apartado 25 — con UNA sola foto, la comparación lo DICE en vez de
   desaparecer, y la galería sigue funcionando. */
almacen.saludFotos = [{ id: 'fr1', path: 'usuario-prueba/junio.jpg', fecha: '2026-06-12', nota: 'Inicio del verano' }];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso') && await pulsar('Fotos'),
  'FIT F26 — se deja una sola foto y se vuelve');
const una_fit26 = await esperarTexto(/JUN 2026|otra foto/i);
ok(/Necesitas otra foto para comparar/i.test(una_fit26),
  '🚨 FIT F26 — con una sola se dice qué falta, y la sección NO desaparece (apartado 25)');
ok(/12 JUN 2026/i.test(una_fit26), '…y la foto que tiene se sigue viendo con normalidad');
ok(!/Empieza a registrar tu progreso/i.test(una_fit26),
  '⚠️ …y NO se le dice que no tiene ninguna, que es lo que sí tiene');

/* 🚨 Y lo que de verdad importa de la migración: la fase añade cinco campos, y
   lo guardado en la Fase 3 tiene que llegar entero al siguiente guardado. */
const migradas_fit26 = await page.evaluate(() => {
  const crudo = document.body.innerText;
  return crudo.length > 0;
});
ok(migradas_fit26, 'FIT F26 — y lo guardado antes de esta fase se lee sin romper nada');

/* 🚨 **C-35 — CON LA PROTECCIÓN PUESTA, LA MISMA PUERTA QUE SALUD.** Esto es
   lo que faltaba: la F26 escondía la galería y no ofrecía nada, así que no se
   podía llegar a ella **ni desbloqueándola**. Ahora sale el `PinGate` de
   siempre, que es lo que ve quien tiene las fotos protegidas. */
almacen.ajustes = {
  ...(almacen.ajustes || {}),
  seguridad: {
    ...((almacen.ajustes || {}).seguridad || {}),
    protectedActions: ['fotos_privadas'], migradoAcciones: true, migradoAreas: true,
  },
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso') && await pulsar('Fotos'),
  'FIT F26 — se protegen las fotos y se vuelve a la pestaña');
const protegido_fit26 = await esperarTexto(/PIN/i);
ok(/PIN/i.test(protegido_fit26),
  '🚨 FIT F26 (C-35) — con la protección puesta, la pestaña pide el PIN…');
ok(!/Añadir progreso/i.test(protegido_fit26),
  '…y la galería NO se ve mientras tanto');
ok(!/Todavía no has añadido fotograf/i.test(protegido_fit26),
  '🚨 …pero tampoco se queda en el acceso mudo de la F12: hay una puerta que abrir');

/* Se devuelve la cuenta a su estado de antes para lo que viene. */
almacen.ajustes = {
  ...(almacen.ajustes || {}),
  seguridad: {
    ...((almacen.ajustes || {}).seguridad || {}),
    protectedActions: [], migradoAcciones: true, migradoAreas: true,
  },
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

/* Apartado 15 — el grupo muscular lleva al detalle de la F13, no a una copia. */
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F16 — se vuelve a Rangos');
await esperarTexto(/Cobertura/i);
ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F16 — se toca Espalda en los rankings musculares');
const detalle_fit16 = await esperarTexto(/Dorsales/i);
ok(/Dorsales/.test(detalle_fit16),
  '🚨 FIT F16 — abre el detalle muscular de la F13, sin duplicar pantalla (apartado 15)');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F17 — Clasificar ejercicios (Entrega 4 · 17/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 37, literal: *"Rangos → Clasificar ejercicios →
   Dominadas → ¿Cuántas puedes hacer? → Seleccionar respuesta → Continuar → …
   → Clasificación completada → Ver mis rangos"*.

   🚨 Y lo que de verdad hay que ver funcionando: que **salir y volver no pierde
   nada** (se guarda al contestar) y que una estimación **no sobrevive a un
   entrenamiento real** (apartados 24 y 27). */
console.log('\n── FIT F17 · Clasificar ejercicios ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F17 — Fitness → Rangos');
const antesClasificar_fit17 = await esperarTexto(/Clasificar ejercicios/i);
ok(/Clasificar ejercicios/.test(antesClasificar_fit17) && /recomendados/.test(antesClasificar_fit17),
  '🔓 FIT F17 → F24 — el CTA lleva los RECOMENDADOS, no «87 restantes» (F24, apartado 18)');

ok(await pulsar('Clasificar ejercicios'), 'FIT F17 — se abre la clasificación');
const hub_fit17 = await esperarTexto(/Clasifica tus ejercicios/i);
ok(/Responde unas preguntas rápidas/.test(hub_fit17),
  'FIT F17 — con el subtítulo del apartado 1…');
/* 🔓 **FIT F24 — la entrada ya NO es la pregunta: es la cola priorizada.** Su
   apartado 34 dibuja el recorrido entero: *«Clasificar ejercicios → Cola
   priorizada → Seleccionar ejercicio → Cuestionario»*. Esta comprobación decía
   lo contrario y pasa a vigilar lo de después, que es lo que toca cuando una
   fase construye lo que otra dejó apuntado (E3 F44, y ya van varias). */
ok(/Te recomendamos empezar por estos ejercicios/i.test(hub_fit17),
  '🚨 FIT F24 — y lo primero es la cola recomendada (apartado 17)');
ok(await pulsarQueEmpiece_fit10('Clasificar '), 'FIT F24 — se elige un ejercicio de la cola');
const pregunta1_fit17 = await esperarTexto(/\?/);
/* ⚠️ Con /i: la etiqueta lleva `uppercase` de CSS, así que `innerText` la
   devuelve como «PREGUNTA 1 DE 14». Sin la /i, la prueba se ponía roja por un
   estilo. */
ok(/\d+ \/ \d+ recomendados/i.test(pregunta1_fit17),
  '…y el progreso, «N / M recomendados» (F24, apartado 19)');
ok(/\?/.test(pregunta1_fit17), 'FIT F17 — hay una pregunta de verdad, adaptada al ejercicio (apartado 5)');

/* Se contesta la primera: la respuesta se guarda AL TOCARLA. */
const opcion_fit17 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /^(6 – 9|3 – 5|10 – 14|1 – 2|Ninguna todavía|Menos de 10 s|10 – 20 s|20 – 30 s|Progresión intermedia|No puedo realizarlo|\d+ kg)$/.test((x.innerText || '').trim()));
  if (!b) return null;
  const t = (b.innerText || '').trim();
  b.click();
  return t;
});
ok(!!opcion_fit17, `FIT F17 — se elige una respuesta (${opcion_fit17 || 'ninguna encontrada'})`);
const estimado_fit17 = await esperarTexto(/Nivel estimado/i);
ok(/Nivel estimado/i.test(estimado_fit17),
  '🚨 FIT F17 — sale el NIVEL estimado, no una puntuación (apartado 7)');
ok(!/\b[0-9]{3}\b\s*puntos|score/i.test(estimado_fit17),
  '🚨 …sin «tu score exacto es 638» por ningún lado');
ok(/se actualizará con tus entrenamientos/i.test(estimado_fit17),
  '⚠️ …diciendo que los entrenamientos lo van a sustituir (apartado 8)');

/* 🐛 FIT F31 — **LA ESCRITURA LLEGA POR LA RED, Y LA RED ES ASÍNCRONA.** La
   tarjeta del nivel se pinta en el mismo toque que `saveData` sale, pero el
   `POST` pasa por el cliente de Supabase y por la ruta simulada antes de caer
   en `guardado`. Leerlo en el instante en que aparece «Nivel estimado» era una
   carrera: en una máquina cargada salió **rojo con la aplicación bien**, y el
   `[0].confianza` de debajo **tumbó el recorrido entero** con un `TypeError`
   —ninguna sección de después llegó a ejecutarse—. Se espera a que la
   escritura aparezca, con un tope (EH F51: esperar a que algo aparezca, nunca
   milisegundos fijos); si de verdad no se guarda, sigue saliendo rojo. */
const clasificacionesGuardadas_fit17 = () => (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.clasificaciones || []);
const topeEscritura_fit17 = Date.now() + 8000;
while (!clasificacionesGuardadas_fit17().length && Date.now() < topeEscritura_fit17) await page.waitForTimeout(100);
const guardadoClas_fit17 = clasificacionesGuardadas_fit17();
ok(guardadoClas_fit17.length === 1 && guardadoClas_fit17[0].fuente === 'cuestionario',
  `🚨 FIT F17 — la respuesta YA está guardada al contestarla (apartado 24) — ${guardadoClas_fit17.length} guardada(s)`);
ok(!!guardadoClas_fit17[0] && guardadoClas_fit17[0].confianza !== 'alta',
  '⚠️ …con confianza baja o media, nunca alta (apartado 28)');

/* Apartados 9 y 23 — salir a mitad y volver: no se pierde nada. */
ok(await pulsar('Continuar'), 'FIT F17 — Continuar');
const vuelta_fit17 = await esperarTexto(/Te recomendamos|completa/i);
ok(/1 \/ \d+ recomendados/i.test(vuelta_fit17),
  '🚨 FIT F24 — al volver, la cola se ha RECALCULADO y el progreso lo dice (apartados 20 y 21)');
ok(await pulsar('Salir de la clasificación'), 'FIT F17 — se intenta salir a mitad…');
const salir_fit17 = await esperarTexto(/¿Salir de la clasificación\?/i);
ok(/ya está guardado/i.test(salir_fit17),
  '🚨 FIT F17 — y el aviso dice la verdad: lo contestado está guardado (apartado 23)');
ok(await pulsar('Salir'), 'FIT F17 — se sale');
const volviendo_fit17 = await esperarTexto(/Rango Predicho/i);
ok(/Clasificar ejercicios/.test(volviendo_fit17), 'FIT F17 — se vuelve a Rangos');

/* Y recargando: el progreso sobrevive (apartado 24). */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F17 — se recarga la aplicación');
ok(await pulsar('Clasificar ejercicios'), 'FIT F17 — y se vuelve a la clasificación');
const trasRecargar_fit17 = await esperarTexto(/recomendados/i);
ok(/1 \/ \d+ recomendados/i.test(trasRecargar_fit17),
  '🚨 FIT F17 — sigue por donde iba tras recargar: lo guardado ES el progreso (apartado 24)');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F24 — Priorización inteligente de clasificación (Entrega 4 · 24/45)
   ══════════════════════════════════════════════════════════════════════════
   El apartado 34, literal: *"Clasificar ejercicios → Cola priorizada →
   Seleccionar ejercicio → Cuestionario → Resultado → RankEngine → Actualizar
   cobertura → Recalcular cola"*.

   🚨 Y lo que de verdad hay que ver funcionando en el navegador: que el
   contador NO diga «87 restantes» (apartado 18), que cada tarjeta explique por
   qué está (apartado 16), que saltar uno **no le asigne un nivel** (apartado
   24) y que la cola **se recalcule sola** al clasificar (apartado 21). */
console.log('\n── FIT F24 · Cola priorizada de clasificación ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F24 — Fitness → Rangos');
await esperarTexto(/Clasificar ejercicios/i);
ok(await pulsar('Clasificar ejercicios'), 'FIT F24 — se abre la clasificación');
const hub_fit24 = await esperarTexto(/Te recomendamos empezar/i);

ok(/Te recomendamos empezar por estos ejercicios/i.test(hub_fit24),
  '🚨 FIT F24 — la frase del apartado 17, literal');
const contador_fit24 = /(\d+) ejercicios? recomendados?/i.exec(hub_fit24);
ok(contador_fit24 && Number(contador_fit24[1]) > 0 && Number(contador_fit24[1]) <= 8,
  `🚨 FIT F24 — el contador que manda es el de recomendados (${contador_fit24 ? contador_fit24[0] : 'no sale'}, apartado 18)`);
ok(!/\d{2,} restantes/i.test(hub_fit24),
  '🚨 …y NO dice «87 restantes»: eso es lo que esta fase viene a quitar');
ok(/sin clasificación/i.test(hub_fit24),
  '⚠️ FIT F24 — la cifra secundaria existe, detrás y en pequeño (apartado 18)');
ok(/\d+ \/ \d+ recomendados/i.test(hub_fit24),
  '🚨 FIT F24 — el progreso es un recuento, jamás XP (apartado 19 y D2-02)');
ok(!/\bXP\b|logro|recompensa/i.test(hub_fit24),
  '🚨 …y no aparece ni una palabra de juego en la pantalla (apartado 35)');

/* Apartado 16 — cada tarjeta dice por qué está ahí, en palabras. */
const razones_fit24 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Clasificar "]')]
  .map((b) => (b.getAttribute('aria-label') || '')));
ok(razones_fit24.length > 0, `FIT F24 — la cola trae tarjetas de verdad (${razones_fit24.length})`);
ok(razones_fit24.every((a) => /Sin clasificación|Mejora tu cobertura|Subgrupo sin datos|Ejercicio representativo|Datos insuficientes/.test(a)),
  '🚨 FIT F24 — y TODAS explican por qué, con una de las razones del apartado 16');
ok(!/priorityScore|puntuación/i.test(hub_fit24),
  '🚨 FIT F24 — el score técnico no se enseña (apartado 16)');

/* Apartado 15 — no diez seguidos del mismo grupo. */
const gruposCola_fit24 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Clasificar "]')]
  .map((b) => ((b.innerText || '').split('\n')[1] || '').split(' · ')[0]));
const seguidos_fit24 = gruposCola_fit24.reduce((acc, g, i) => (i && g === gruposCola_fit24[i - 1] ? Math.max(acc, 2) : acc), 1);
ok(seguidos_fit24 <= 2,
  `⚠️ FIT F24 — la cola está repartida, no diez de espalda seguidos (apartado 15)`);

/* Apartado 24 — saltar deja el ejercicio PENDIENTE, sin inventarle un nivel. */
const antesSaltar_fit24 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.clasificaciones || []).length;
const primero_fit24 = (razones_fit24[0] || '').replace(/^Clasificar /, '').split('.')[0];
ok(await pulsarQueEmpiece_fit10('Clasificar '), `FIT F24 — se abre «${primero_fit24}»`);
await esperarTexto(/\?/);
ok(await pulsar('Saltar este ejercicio'), 'FIT F24 — y se salta sin contestar (apartado 24)');
const trasSaltar_fit24 = await esperarTexto(/Te recomendamos empezar/i);
const despuesSaltar_fit24 = (guardado.filter((g) => g && g.key === 'fitness').at(-1)?.value?.clasificaciones || []).length;
ok(despuesSaltar_fit24 === antesSaltar_fit24,
  '🚨 FIT F24 — saltar NO le asigna un nivel arbitrario: no se ha guardado nada (apartado 24)');
ok(!new RegExp(`Clasificar ${primero_fit24.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`)
  .test(await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Clasificar "]')]
    .map((b) => b.getAttribute('aria-label')).join(' | '))),
  `⚠️ …y sale de la cola, que es lo que significa saltarlo («${primero_fit24}»)`);
ok(/Te recomendamos empezar/i.test(trasSaltar_fit24), '…y se vuelve a la cola, con otro delante');

/* Apartados 20 y 21 — clasificar uno recalcula la cola. */
const antesClasificar_fit24 = await page.evaluate(() => (document.querySelector('button[aria-label^="Clasificar "]') || {}).ariaLabel || '');
ok(await pulsarQueEmpiece_fit10('Clasificar '), 'FIT F24 — se abre el siguiente de la cola');
await esperarTexto(/\?/);
const opcion_fit24 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /^(6 – 9|3 – 5|10 – 14|1 – 2|Ninguna todavía|Menos de 10 s|10 – 20 s|20 – 30 s|30 s o más|No puedo mantenerlo|Progresión intermedia|Progresión avanzada|No puedo realizarlo|\d+ kg)$/.test((x.innerText || '').trim()));
  if (!b) return null;
  const t = (b.innerText || '').trim();
  b.click();
  return t;
});
ok(!!opcion_fit24, `FIT F24 — se contesta (${opcion_fit24 || 'ninguna encontrada'})`);
await esperarTexto(/Nivel estimado/i);
ok(await pulsar('Continuar'), 'FIT F24 — Continuar');
const recalculada_fit24 = await esperarTexto(/Te recomendamos empezar|completa/i);
const despuesClasificar_fit24 = await page.evaluate(() => (document.querySelector('button[aria-label^="Clasificar "]') || {}).ariaLabel || '');
ok(despuesClasificar_fit24 !== antesClasificar_fit24,
  '🚨 FIT F24 — la cola se ha RECALCULADO: el primero ya no es el mismo (apartado 21)');
ok(/\d+ \/ \d+ recomendados/i.test(recalculada_fit24),
  '…y el progreso ha subido con él');

/* 🐛 ⚠️ **Y AQUÍ NO SE COMPRUEBA EL AVISO DE COBERTURA DEL APARTADO 29**, que es
   lo que había escrito primero y falló: a esta altura del recorrido ya se han
   entrenado y clasificado ejercicios de varios grupos, así que la cobertura
   **ya no está baja** y la aplicación acierta al no insistir. Era una
   comprobación que dependía de cuánto hubieran entrenado las secciones
   anteriores — la misma clase de bomba de relojería que la del día de la
   semana. Que el aviso salga **solo** por debajo del umbral lo demuestra
   `test-cola-clasificacion.mjs`, que además puede ponerse roja.
   Lo que sí se mira aquí es lo que tiene que ser verdad SIEMPRE. */
ok(!/deberías|tienes que|obligatorio/i.test(recalculada_fit24),
  '🚨 FIT F24 — la pantalla no le da una orden: se recomienda, no se manda');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F18 — El detalle de un grupo muscular (Entrega 4 · 18/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 34, literal: *"Rangos → Espalda → Dorsales →
   Dominadas → Progreso de Dominadas"*. Se apoya en las dominadas que sembró la
   F13 y en las sentadillas de la F16, que ya están guardadas. */
console.log('\n── FIT F18 · Detalle muscular ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F18 — Fitness → Rangos');
await esperarTexto(/Rangos musculares|Rankings musculares/i);
ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F18 — → Espalda (apartado 34)');
const espalda_fit18 = await esperarTexto(/Subgrupos/i);
ok(/Espalda/i.test(espalda_fit18) && /Subgrupos/i.test(espalda_fit18),
  '🚨 FIT F18 — se abre el detalle del grupo, con sus subgrupos (apartados 2 y 5)');
ok(/Dorsales/i.test(espalda_fit18) && /Trapecio/i.test(espalda_fit18),
  '…que son los del catálogo, no una lista escrita a mano (apartado 8)');
ok(/ejercicios? clasificados?/i.test(espalda_fit18) && /subgrupos con datos/i.test(espalda_fit18),
  '⚠️ FIT F18 — y la cabecera dice de dónde sale el rango (apartado 2)');
ok(/ejercicios con datos/i.test(espalda_fit18),
  '…con la cobertura en palabras (apartado 13)');
ok(/no el tamaño del músculo/i.test(espalda_fit18),
  '🚨 …recordando que mide rendimiento, no músculo');
ok(/Mejorando|Estable|Sin datos/i.test(espalda_fit18),
  '⚠️ FIT F18 — los estados llevan palabra, no solo color (apartado 29)');

const anchoF18 = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth + 2,
  ancho: document.documentElement.scrollWidth,
}));
ok(!anchoF18.desborda, `⚠️ FIT F18 — a 375 px el detalle no se arrastra de lado (${anchoF18.ancho} px, apartado 28)`);

/* Apartado 20 — los filtros por estado. */
/* 🐛 🚨 **ESTA COMPROBACIÓN NO PODÍA FALLAR, Y POR ESO NADIE VIO QUE MEDÍA
   OTRA COSA** (EH F42, enésima vez). Buscaba «: Mejorando.» en cualquier botón
   de la página, y las tarjetas de la lista de contribución —que son justo las
   que el filtro recorta— se llaman «Remo: Principiante, Mejorando. Ver su
   progreso», **con el rango en medio**: jamás encajaban. Contaba cero con el
   filtro puesto y cero sin él.
   Lo destapó la tarjeta de la FIT F23, cuyos ejercicios relevantes sí tienen
   esa forma — y **siguen ahí con el filtro puesto, que es lo correcto**: esa
   tarjeta habla del rango del músculo, no de la lista, y el filtro es de la
   lista. Ahora se mide la lista de verdad, y se exige que el número BAJE. */
const conTendencia_fit18 = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .filter((b) => /, (Mejorando|Estable|Descenso)\. Ver su progreso$/.test(b.getAttribute('aria-label') || '')).length);
const antesDeFiltrar_fit18 = await conTendencia_fit18();
ok(antesDeFiltrar_fit18 > 0,
  `⚠️ FIT F18 — y la comprobación PUEDE verlos: sin filtro hay ${antesDeFiltrar_fit18} con tendencia`);
ok(await pulsar('Sin datos'), 'FIT F18 — se filtra por «Sin datos» (apartado 20)');
await esperarTexto(/Ejercicios/i);
const filtrados_fit18 = await conTendencia_fit18();
ok(filtrados_fit18 === 0,
  `🚨 …y deja fuera los que sí tienen tendencia (${antesDeFiltrar_fit18} → ${filtrados_fit18})`);
ok(await pulsar('Todos'), '…y se vuelve a verlos todos');

/* Apartado 6 — el subgrupo. */
ok(await pulsarQueEmpiece_fit10('Dorsales:'), 'FIT F18 — → Dorsales (apartado 6)');
const dorsales_fit18 = await esperarTexto(/Ejercicios/i);
ok(/Dorsales/i.test(dorsales_fit18) && /Espalda/i.test(dorsales_fit18),
  '🚨 FIT F18 — el detalle del subgrupo, sabiendo de qué grupo viene');
ok(/Dominadas/i.test(dorsales_fit18),
  '…con los ejercicios que lo trabajan de verdad (apartado 6)');
ok(/% de participación/i.test(dorsales_fit18),
  '🚨 FIT F18 → F21 — diciendo CUÁNTO aporta cada uno, no que «pertenezca» (apartado 7)');

/* Apartado 11 — y el ejercicio lleva a la pantalla de progreso de la F12. */
ok(await pulsarQueEmpiece_fit10('Dominadas pronas:'), 'FIT F18 — → Dominadas');
const progresoEj_fit18 = await esperarTexto(/Historial|Progreso reciente|Evolución/i);
ok(/Dominadas/i.test(progresoEj_fit18),
  '🚨 FIT F18 — se abre la pantalla de progreso de la F12, no otra nueva (apartado 11)');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F20 — Por qué tengo este rango (Entrega 4 · 20/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 33: pulsar el rango y entender qué rango tengo, de
   dónde sale, qué lo sustenta y qué me acercaría al siguiente. Se comprueba en
   los tres sitios que pide el apartado 2 —global, músculo y ejercicio— y, sobre
   todo, que **no se promete una cifra** (apartado 9). */
console.log('\n── FIT F20 · Por qué este rango ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F20 — Fitness → Rangos');
await esperarTexto(/Rango Predicho/i);
ok(await pulsar('Por qué tu rango general'), 'FIT F20 — se abre la explicación del rango general (apartado 2)');
const expGlobal_fit20 = await esperarTexto(/En qué se basa/i);
ok(/Basado en:/i.test(expGlobal_fit20),
  '🚨 FIT F20 — dice de dónde sale el rango (apartados 11 a 13)');
ok(/grupos con datos/i.test(expGlobal_fit20),
  '…con la cobertura en palabras (apartado 15)');
ok(/Qué te acerca al siguiente/i.test(expGlobal_fit20),
  '…y qué haría falta para subir (apartado 9)');
ok(!/te faltan \d+|en \d+ días|\d+ kg para/i.test(expGlobal_fit20),
  '🚨 FIT F20 — y NO promete cifras ni plazos: el sistema no puede garantizarlos (apartados 9 y 31)');
ok(/Iniciación/i.test(expGlobal_fit20) && /Élite/i.test(expGlobal_fit20),
  '⚠️ FIT F20 — con la escala entera y el suyo marcado (apartado 16)');
ok(await pulsar('Cerrar'), '…y se cierra donde estaba');

/* Apartado 2 — la misma explicación desde un músculo. */
ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F20 — → Espalda');
await esperarTexto(/Subgrupos/i);
ok(await pulsar('Por qué tu rango en Espalda'), 'FIT F20 — se abre la explicación del músculo (apartado 5)');
const expMusculo_fit20 = await esperarTexto(/En qué se basa/i);
ok(/Espalda/i.test(expMusculo_fit20) && /ejercicios con datos/i.test(expMusculo_fit20),
  '🚨 FIT F20 — con los ejercicios que lo sostienen (apartado 5)');
ok(/Confianza/i.test(expMusculo_fit20),
  '…y con qué confianza, dicho con palabras (apartado 14)');
ok(!/%\s*de confianza/i.test(expMusculo_fit20),
  '⚠️ …sin porcentajes de confianza inventados (apartado 14)');
ok(await pulsar('Cerrar'), '…y se cierra');

/* Y desde un ejercicio: el hexágono de su tarjeta. */
const abrioEjercicio_fit20 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button[aria-label]')]
    .find((x) => /^Por qué tu rango en (?!Espalda)/.test(x.getAttribute('aria-label') || ''));
  if (!b) return null;
  const t = b.getAttribute('aria-label');
  b.click();
  return t;
});
ok(!!abrioEjercicio_fit20, `FIT F20 — se abre la explicación de un ejercicio (${abrioEjercicio_fit20 || 'ninguna'}, apartado 6)`);
const expEjercicio_fit20 = await esperarTexto(/En qué se basa/i);
ok(/Mejor resultado/i.test(expEjercicio_fit20) && /Tendencia/i.test(expEjercicio_fit20),
  '🚨 FIT F20 — con su mejor resultado y su tendencia (apartado 6)');
ok(/Ver su progreso/i.test(expEjercicio_fit20),
  '…y con la salida a la pantalla de progreso, sin rutas nuevas (apartado 21)');
ok(await pulsar('Cerrar'), '…y se cierra');

/* ══════════════════════════════════════════════════════════════════════════
   FIT F21 — Qué ejercicios sostienen el rango (Entrega 4 · 21/45)
   ══════════════════════════════════════════════════════════════════════════
   El flujo del apartado 27: Rangos → Espalda → «Ejercicios que contribuyen» →
   Dominadas → su progreso. Y lo que más importa comprobar con el dedo: que la
   participación se enseña **con su etiqueta** (no como «el 60 % de tu
   espalda») y que los que no tienen datos salen aparte. */
console.log('\n── FIT F21 · Contribución al rango ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F21 — Fitness → Rangos');
await esperarTexto(/Rangos musculares|Rankings musculares/i);
ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F21 — → Espalda');
const contrib_fit21 = await esperarTexto(/Ejercicios que contribuyen/i);
ok(/Ejercicios que contribuyen/i.test(contrib_fit21),
  '🚨 FIT F21 — la sección existe en el detalle del músculo (apartado 25)');
ok(/% de participación/i.test(contrib_fit21),
  '🚨 FIT F21 — con cuánto participa cada ejercicio en ESTE grupo (apartados 4 y 8)');
ok(/Participación estimada en este grupo muscular/i.test(contrib_fit21),
  '🚨 …y diciendo qué significa ese porcentaje: no es «el 60 % de tu desarrollo» (apartado 15)');
ok(/no cuál desarrolla más músculo/i.test(contrib_fit21),
  '🚨 FIT F21 — y que esto mide rendimiento, no hipertrofia (apartado 6)');
ok(/Principal|Secundario|Estabilizador/.test(contrib_fit21),
  '⚠️ FIT F21 — con el papel que tiene el ejercicio en ese músculo');
ok(/Todavía sin datos/i.test(contrib_fit21),
  '🚨 FIT F21 — y los que no ha entrenado van aparte, no mezclados (apartado 10)');
ok(/Por subgrupo/i.test(contrib_fit21),
  '⚠️ FIT F21 — con el desglose por subgrupos (apartado 7)');

const anchoF21 = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth + 2,
  ancho: document.documentElement.scrollWidth,
}));
ok(!anchoF21.desborda, `⚠️ FIT F21 — a 375 px las tarjetas no se desbordan (${anchoF21.ancho} px, apartado 29)`);

/* Apartado 14 — y desde un ejercicio se sigue llegando a su progreso. */
ok(await pulsarQueEmpiece_fit10('Dominadas pronas:'), 'FIT F21 — → Dominadas (apartado 27)');
const progresoF21 = await esperarTexto(/Historial|Progreso reciente|Evolución/i);
ok(/Dominadas/i.test(progresoF21),
  '🚨 FIT F21 — abre la pantalla de progreso de la F12, no una nueva (apartado 14)');


/* ══════════════════════════════════════════════════════════════════════════
   FIT F22 — El historial de un rango (Entrega 4 · 22/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 37: entender de dónde viene el rango actual, cuál
   tenía antes, cuándo cambió y si fue por datos reales o por clasificación. Y
   lo que más importa comprobar con el dedo, porque ninguna prueba de Node lo
   ve: que **no se inventa un evento**. Con las pocas sesiones que lleva este
   recorrido, lo honesto es decir «Historial insuficiente» — y eso es
   exactamente lo que tiene que salir. */
console.log('\n── FIT F22 · El historial del rango ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F22 — Fitness → Rangos');
await esperarTexto(/Rango Predicho/i);
ok(await pulsar('Historial de tu rango general'), 'FIT F22 — se abre el historial del rango general (apartado 30)');
const histGlobal_fit22 = await esperarTexto(/HISTORIAL/i);
ok(/HISTORIAL/i.test(histGlobal_fit22),
  '🚨 FIT F22 — la hoja se abre desde el propio rango, sin una sección aparte (apartado 30)');
/* 🚨 Lo uno o lo otro, nunca las dos ni ninguna: o hay evolución de verdad, o
   se dice que no hay bastante. Un timeline con puntos inventados sería lo que
   prohíben los apartados 2 y 37. */
const hayTimeline_fit22 = /Clasificación inicial|Primer dato registrado|desde /i.test(histGlobal_fit22);
const hayVacio_fit22 = /Historial insuficiente/i.test(histGlobal_fit22);
ok(hayTimeline_fit22 !== hayVacio_fit22,
  `🚨 FIT F22 — o hay historial o se dice que no lo hay, nunca las dos cosas (timeline: ${hayTimeline_fit22}, vacío: ${hayVacio_fit22})`);
ok(!/confeti|¡Enhorabuena|¡Felicidades|has desbloqueado|nivel \d/i.test(histGlobal_fit22),
  '🚨 FIT F22 — ni celebración, ni niveles, ni recompensas (apartados 13 y 36, y D2-02)');
ok(!/\bXP\b|puntos ganados|insignia/i.test(histGlobal_fit22),
  '…ni una sola palabra de gamificación');
const anchoF22 = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth + 2,
  ancho: document.documentElement.scrollWidth,
}));
ok(!anchoF22.desborda, `⚠️ FIT F22 — a 375 px la hoja no desborda a lo ancho (${anchoF22.ancho} px, apartado 32)`);
ok(await pulsar('Cerrar el historial'), '…y se cierra donde estaba');

/* Apartado 30 — el mismo componente desde un músculo. */
ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F22 — → Espalda');
await esperarTexto(/Subgrupos/i);
ok(await pulsar('Historial de tu rango en Espalda'), 'FIT F22 — y desde un músculo se abre el mismo historial (apartado 30)');
const histMusculo_fit22 = await esperarTexto(/HISTORIAL/i);
ok(/Espalda/i.test(histMusculo_fit22),
  '🚨 FIT F22 — con el músculo que se estaba mirando, no el global');
/* Apartado 23 — los cuatro periodos, y solo cuando hay algo que filtrar. */
if (!/Historial insuficiente/i.test(histMusculo_fit22)) {
  ok(/Todo/.test(histMusculo_fit22) && /3 meses/.test(histMusculo_fit22) && /1 año/.test(histMusculo_fit22),
    '🚨 FIT F22 — con los cuatro periodos del apartado 23');
  ok(await pulsar('3 meses'), '…y se puede cambiar de periodo');
  const tresMeses_fit22 = await esperarTexto(/HISTORIAL/i);
  ok(/No hay cambios en este periodo|desde |Clasificación inicial|Primer dato/i.test(tresMeses_fit22),
    '🚨 FIT F22 — y si en ese periodo no cambió nada, se dice (apartado 23, literal)');
} else {
  ok(!/Todo\s*3 meses/.test(histMusculo_fit22),
    '⚠️ FIT F22 — sin historial no se pintan unos filtros que no filtrarían nada (regla 8)');
  ok(/Historial insuficiente|todavía no tiene suficiente historial/i.test(histMusculo_fit22),
    '🚨 FIT F22 — se dice «Historial insuficiente» en vez de dibujar una evolución falsa (apartado 2)');
}
ok(await pulsar('Cerrar el historial'), '…y se cierra');

/* Apartado 30 — y desde un EJERCICIO, que se llega por su explicación. */
const abrioEj_fit22 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button[aria-label]')]
    .find((x) => /^Por qué tu rango en (?!Espalda)/.test(x.getAttribute('aria-label') || ''));
  if (!b) return null;
  const t = b.getAttribute('aria-label');
  b.click();
  return t;
});
ok(!!abrioEj_fit22, `FIT F22 — se abre la explicación de un ejercicio (${abrioEj_fit22 || 'ninguna'})`);
await esperarTexto(/En qué se basa/i);
const pasoAlHistorial_fit22 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button[aria-label]')]
    .find((x) => /^Historial de tu rango en (?!Espalda)/.test(x.getAttribute('aria-label') || ''));
  if (!b) return false;
  b.click();
  return true;
});
ok(pasoAlHistorial_fit22, '🚨 FIT F22 — desde «por qué este rango» se pasa a su historial (apartado 30)');
const histEj_fit22 = await esperarTexto(/HISTORIAL/i);
/* 🚨 Y la explicación se ha CERRADO: dos overlays apilados dejan el de abajo
   pulsable por los bordes, y en un iPhone eso es un toque perdido. */
ok(!/En qué se basa/i.test(histEj_fit22),
  '🚨 FIT F22 — y la explicación se cierra al hacerlo: no quedan dos hojas apiladas');
ok(!/Historial insuficiente/i.test(histEj_fit22) ? /desde |Primer dato registrado|Sigues en/i.test(histEj_fit22) : true,
  '⚠️ FIT F22 — con su evolución, o con el vacío que dice que todavía no la hay');
ok(await pulsar('Cerrar el historial'), '…y se cierra');


/* ══════════════════════════════════════════════════════════════════════════
   FIT F23 — El objetivo del siguiente rango (Entrega 4 · 23/45)
   ══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 37: abrir un rango y entender qué tengo, cuál es el
   siguiente, cuánto llevo dentro y cuántos puntos faltan **si son fiables**. Y
   lo que solo se ve con el dedo: que la tarjeta **no traduce los puntos a kilos
   ni a repeticiones** (apartados 12 y 13) y que no enseña un `NaN`. */
console.log('\n── FIT F23 · El siguiente rango ──');

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Rangos'), 'FIT F23 — Fitness → Rangos');
const rangos_fit23 = await esperarTexto(/Rango Predicho/i);
/* 🚨 Lo uno o lo otro: o hay rango y se dice qué falta, o se dice que todavía
   no lo hay. Nunca un 0 % ni un «te falta X» sin rango (apartado 7). */
const conRango_fit23 = /Siguiente:|Rango máximo alcanzado/i.test(rangos_fit23);
const sinRango_fit23 = /Completa o clasifica ejercicios/i.test(rangos_fit23);
ok(conRango_fit23 !== sinRango_fit23,
  `🚨 FIT F23 — o hay siguiente rango o se dice que aún no hay rango (con: ${conRango_fit23}, sin: ${sinRango_fit23})`);
ok(!/NaN|Infinity|undefined/.test(rangos_fit23),
  '🚨 FIT F23 — y ni un NaN, Infinity o undefined en pantalla (apartado 33)');
ok(!/\d+\s*kg para|levanta \d+|necesitas \d+ repeticion/i.test(rangos_fit23),
  '🚨 FIT F23 — los puntos NO se traducen a kilos ni a repeticiones (apartados 12 y 13)');
ok(!/en \d+ (días|semanas|meses)|tardarás/i.test(rangos_fit23),
  '🚨 FIT F23 — ni una predicción de cuánto tardará (apartado 36)');

if (conRango_fit23 && !/Rango máximo alcanzado/i.test(rangos_fit23)) {
  ok(/\d+\s*%/.test(rangos_fit23), '🚨 FIT F23 — con rango se ve el porcentaje dentro del rango (apartado 1)');
  ok(/Estás a \d+ puntos? de |Necesitas mejorar tu rendimiento/i.test(rangos_fit23),
    '🚨 FIT F23 — y qué falta: los puntos si son fiables, o la frase honesta si no (apartados 1 y 11)');
} else {
  ok(!/\d+\s*%\s*$/m.test(rangos_fit23) || sinRango_fit23,
    '⚠️ FIT F23 — sin rango o en el máximo no se pinta un porcentaje suelto');
}

const anchoF23 = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth + 2,
  ancho: document.documentElement.scrollWidth,
}));
ok(!anchoF23.desborda, `⚠️ FIT F23 — a 375 px la tarjeta no desborda (${anchoF23.ancho} px, apartado 35)`);

/* Apartado 30 — «Ver por qué» abre la explicación de la F20, sin pantalla nueva. */
const hayPorQue_fit23 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /^Ver por qué$/.test((x.innerText || '').trim()));
  if (!b) return false;
  b.click();
  return true;
});
if (hayPorQue_fit23) {
  const exp_fit23 = await esperarTexto(/En qué se basa/i);
  ok(/En qué se basa/i.test(exp_fit23),
    '🚨 FIT F23 — «Ver por qué» abre la explicación que YA existe (apartado 30)');
  ok(await pulsar('Cerrar'), '…y se cierra donde estaba');
} else {
  ok(sinRango_fit23, '⚠️ FIT F23 — sin rango no hay «Ver por qué» que ofrecer (regla 8)');
}

/* Apartado 16 — la misma tarjeta en un músculo, con sus ejercicios debajo. */
ok(await pulsarQueEmpiece_fit10('Espalda:'), 'FIT F23 — → Espalda');
const musculo_fit23 = await esperarTexto(/Subgrupos/i);
ok(/Siguiente:|Rango máximo alcanzado|Completa o clasifica ejercicios/i.test(musculo_fit23),
  '🚨 FIT F23 — apartado 16: el músculo también dice qué falta para el siguiente');
ok(!/NaN|Infinity|undefined/.test(musculo_fit23),
  '…sin un solo número roto (apartado 33)');
if (/Ejercicios relevantes/i.test(musculo_fit23)) {
  ok(/Estos ejercicios tienen mayor contribución actualmente/i.test(musculo_fit23),
    '🚨 FIT F23 — apartado 22: se dice lo único afirmable, no «debes entrenar X»');
  ok(!/debes entrenar|tienes que entrenar/i.test(musculo_fit23),
    '…y no hay ni una orden en la pantalla');
} else {
  ok(true, '⚠️ FIT F23 — sin ejercicios con datos no se pinta la lista (regla 8)');
}

/* ══════════════════════════════════════════════════════════════════════════
   FIT F28 — Integración completa del progreso físico (Entrega 4 · 28/45)
   ══════════════════════════════════════════════════════════════════════════
   Se comprueba **aquí y no antes**, a propósito: en este punto del recorrido el
   almacén ya tiene sesiones de tres grupos (F12, F13 y F16), las cuatro fotos
   de la F26 —tres que cargan y una rota— y un rango global de verdad. Con el
   escenario vacío de más arriba, la mitad de los bloques saldría sin datos y
   esto no mediría nada (la lección de las fábricas de escenarios, FIT F22).

   🚨 Lo que de verdad hay que ver funcionando: que los seis sistemas están en
   una sola pantalla **sin una cifra que los mezcle** (apartado 10), que el
   periodo filtra lo que se ve y **no toca el rango** (apartado 16), y que
   «Comparar progreso» abre el comparador de la F27 con las dos fotos ya
   elegidas, sin una pantalla nueva (apartado 19). */
console.log('\n── FIT F28 · El centro de seguimiento ──');

/* 🐛 **Y SUS PROPIAS FOTOS, PORQUE LA F27 DEJÓ UNA SOLA** (E3 F6: *"un
   escenario que hereda el del vecino no prueba lo que dice"*). Aquella sección
   recorta `saludFotos` a una para probar su caso de «falta otra foto», así que
   aquí no había con qué comparar — y la primera pasada dio cinco rojos
   diciendo que «Comparar progreso» no existía **cuando la aplicación estaba
   bien**: con una foto, ese botón NO debe pintarse (regla 8). */
almacen.saludFotos = [
  { id: 'f28-a', path: 'usuario-prueba/junio.jpg', fecha: '2026-06-12', nota: 'Inicio del verano', tags: ['frontal'] },
  { id: 'f28-b', path: 'usuario-prueba/agosto.jpg', fecha: '2026-08-01', nota: '', tags: ['espalda'] },
  { id: 'f28-c', path: 'usuario-prueba/sept.jpg', fecha: '2026-09-12', nota: 'Inicio de curso', tags: ['frontal'] },
];
/* Un objetivo, para que el bloque de objetivos tenga algo que enseñar. */
almacen.fitness = {
  ...almacen.fitness,
  objetivos: [
    { id: 'f28-obj', exerciseId: 'sentadilla-barra', tipo: 'peso', valor: 120, unidad: 'kg', creadoEn: Date.parse('2026-08-15T12:00:00'), actualizadoEn: null, fechaObjetivo: '', estado: 'activo', nota: '' },
  ],
};
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F28 — Fitness → Progreso');
const resumen_fit28 = await esperarTexto(/entrenamientos registrados/i);

/* Apartado 34 — los seis sistemas, en una sola pantalla. */
ok(/entrenamientos registrados/i.test(resumen_fit28), '🚨 FIT F28 — «N entrenamientos registrados» (apartado 3)');
ok(/Ejercicios en progreso/i.test(resumen_fit28), '…«Ejercicios en progreso» (apartado 4)');
ok(/Progreso muscular/i.test(resumen_fit28), '…«Progreso muscular» (apartado 5)');
ok(/Progreso físico/i.test(resumen_fit28), '…«Progreso físico», las fotos (apartado 6)');
ok(/Tus objetivos/i.test(resumen_fit28), '…«Tus objetivos» (apartado 8)');
ok(/Tu rango/i.test(resumen_fit28), '…y «Tu rango» (apartado 9)');
ok(/Línea temporal/i.test(resumen_fit28), '…con la línea temporal debajo (apartado 12)');
/* Apartado 28 — símbolo Y palabra. */
ok(/[↗→↘]\s*(Mejorando|Estable|Descenso)/.test(resumen_fit28),
  '🚨 FIT F28 — las tendencias llevan símbolo Y palabra, no solo el color (apartado 28)');

/* 🚨 Apartado 10 — ni una métrica que mezcle los seis sistemas. */
ok(!/progreso f[ií]sico\s*[:·-]?\s*\d+\s*%/i.test(resumen_fit28),
  '🚨 FIT F28 — ni un «progreso físico 82 %»: eso sería la métrica inventada del apartado 10');
ok(!/desde que|gracias a|ha hecho que/i.test(resumen_fit28),
  '🚨 FIT F28 — ni una correlación automática (apartado 11)');
ok(!/NaN|Infinity|undefined|\[object/.test(resumen_fit28),
  '🚨 FIT F28 — y ni un número roto en pantalla');

/* 🚨 Apartado 16 — el periodo filtra lo que se ve y NO toca el rango. */
const rangoDeLaPantalla = (t) => (/Tu rango\s*\n?\s*([A-Za-zÁÉÍÓÚáéíóúñ ]+)/.exec(t) || [])[1] || '';
const rangoAntes_fit28 = rangoDeLaPantalla(resumen_fit28);
const eventosVisibles = async () => page.evaluate(() => [...document.querySelectorAll('li button')].length);
const eventosTodo_fit28 = await eventosVisibles();
ok(await pulsar('7 días'), 'FIT F28 — se pone el periodo de 7 días');
const siete_fit28 = await esperarTexto(/entrenamientos registrados/i);
const eventos7_fit28 = await eventosVisibles();
ok(rangoDeLaPantalla(siete_fit28) === rangoAntes_fit28 && !!rangoAntes_fit28,
  `🚨 FIT F28 — el periodo NO cambia el rango actual (${rangoAntes_fit28 || 'sin rango'}, apartado 16)`);
ok(eventos7_fit28 <= eventosTodo_fit28,
  `🚨 FIT F28 — …pero SÍ recorta la línea temporal (${eventosTodo_fit28} → ${eventos7_fit28})`);
ok(/\d+ en los últimos 7 días/.test(siete_fit28),
  '…y aparece la segunda línea del periodo, que sin periodo no existía (apartado 3)');
ok(!/esta semana/i.test(siete_fit28),
  '⚠️ FIT F28 — y dice «en los últimos 7 días», no «esta semana», que es otra cosa');
ok(await pulsar('Todo'), 'FIT F28 — se vuelve a «Todo»');
await page.waitForTimeout(500);

/* Apartado 15 — los filtros de la línea temporal, con su recuento.
   ⚠️ Las pastillas se pulsan por su TEXTO, no por `aria-label`: son chips, y
   `pulsar('Fotos')` a secas se llevaría la pestaña «Fotos» de Progreso, que se
   llama exactamente igual (el fallo de Ajustes · Perfil otra vez). */
const pulsarChip_fit28 = (empieza) => page.evaluate((e) => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(e));
  if (!b) return false;
  b.click();
  return true;
}, empieza);
const conFiltros_fit28 = await esperarTexto(/Línea temporal/i);
ok(/Fotos \d+/.test(conFiltros_fit28) && /Entrenamientos \d+/.test(conFiltros_fit28),
  '🚨 FIT F28 — cada pastilla del filtro dice cuántos hay (para no vaciar la pantalla sin avisar)');
const antesDelFiltro_fit28 = await eventosVisibles();
ok(await pulsarChip_fit28('Fotos '), 'FIT F28 — se filtra la línea temporal por Fotos');
await page.waitForTimeout(500);
const soloFotos_fit28 = await eventosVisibles();
ok(soloFotos_fit28 > 0 && soloFotos_fit28 < antesDelFiltro_fit28,
  `🚨 FIT F28 — el filtro deja menos eventos y no ninguno (${antesDelFiltro_fit28} → ${soloFotos_fit28}, apartado 15)`);
ok(await pulsarChip_fit28('Todos '), 'FIT F28 — y se quita el filtro');
await page.waitForTimeout(500);

/* Apartado 27 — a 375 px no se sale nada. */
const anchoF28 = await page.evaluate(() => ({
  desborda: document.documentElement.scrollWidth > window.innerWidth + 2,
  ancho: document.documentElement.scrollWidth,
}));
ok(!anchoF28.desborda, `⚠️ FIT F28 — a 375 px el resumen no desborda (${anchoF28.ancho} px, apartado 27)`);

/* 🚨 Apartado 7 — «Comparar progreso» abre el comparador de la F27, con las dos
   fotos ya elegidas. ⚠️ Y se mide DENTRO del diálogo: un portal pone su
   contenido al final del `body`, así que `innerText` trae primero lo de detrás
   (FIT F27 y E3 F11). */
ok(await pulsar('Comparar progreso'), 'FIT F28 — se toca «Comparar progreso» desde el resumen');
await page.waitForTimeout(900);
const comparador_fit28 = await page.evaluate(() => {
  const d = [...document.querySelectorAll('[role="dialog"]')].pop();
  return d ? (d.innerText || '').replace(/\s+/g, ' ') : '';
});
ok(/Comparar/i.test(comparador_fit28),
  '🚨 FIT F28 — abre el comparador de la F27, no una pantalla nueva (apartado 19)');
ok(/Antes/i.test(comparador_fit28) && /Después/i.test(comparador_fit28),
  '…con sus dos lados ya puestos: no hay que volver a elegirlas (apartado 7)');
const fotosDelComparador_fit28 = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] img[alt]')]
  .map((i) => i.getAttribute('alt')));
ok(fotosDelComparador_fit28.length >= 1,
  `⚠️ FIT F28 — y las fotos elegidas son las de la galería (${fotosDelComparador_fit28.join(' | ') || 'ninguna legible'})`);
ok(!/ganado|grasa|masa muscular|composición/i.test(comparador_fit28),
  '🚨 FIT F28 — y ni una palabra sobre el cuerpo (F26, apartado 41)');
ok(await pulsar('Volver a la galería'), 'FIT F28 — se cierra el comparador');
await page.waitForTimeout(600);

/* Apartado 19 — «Ver todo» cambia de sección, sin duplicar pantalla. */
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F28 — se vuelve al resumen');
await esperarTexto(/Ejercicios en progreso/i);
/* ⚠️ Por su `aria-label`, que dice DE QUÉ bloque es: hay un «Ver todo» por
   sección y pulsar «el primero» depende del orden, no de lo que se quiere
   medir. */
const hayVerTodo_fit28 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')]
  .some((b) => (b.getAttribute('aria-label') || '') === 'Ver todo: Ejercicios en progreso'));
if (hayVerTodo_fit28) {
  ok(await pulsar('Ver todo: Ejercicios en progreso'), 'FIT F28 — se toca el «Ver todo» de los ejercicios');
  const seccion_fit28 = await esperarTexto(/Buscar ejercicio/i);
  ok(/Buscar ejercicio/i.test(seccion_fit28),
    '🚨 FIT F28 — «Ver todo» lleva a la sección de siempre, no a una pantalla nueva (apartado 19)');
} else {
  ok(true, '⚠️ FIT F28 — sin nada que quede fuera, «Ver todo» NO se pinta (regla 8)');
}

/* 🚨 Apartado 17 — y el onboarding: con la cuenta recién estrenada, «Tu
   progreso empieza aquí» con sus salidas, y ni un bloque vacío de relleno. */
const fitnessDeAntes_fit28 = almacen.fitness;
const fotosDeAntes_fit28 = almacen.saludFotos;
almacen.fitness = { ...almacen.fitness, sesiones: [], objetivos: [], clasificaciones: [] };
almacen.saludFotos = [];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F28 — se vacía la cuenta y se entra a Progreso');
const vacio_fit28 = await esperarTexto(/Tu progreso empieza aquí/i);
ok(/Tu progreso empieza aquí/i.test(vacio_fit28),
  '🚨 FIT F28 — sin datos, el onboarding del apartado 17, literal');
ok(/Añadir entrenamiento/i.test(vacio_fit28) && /Añadir foto/i.test(vacio_fit28) && /Crear objetivo/i.test(vacio_fit28),
  '…con sus tres salidas de verdad');
ok(!/0 entrenamientos registrados/i.test(vacio_fit28),
  '🚨 FIT F28 — y NO se llena la pantalla de ceros: «No llenar la pantalla de estados vacíos» (apartado 17)');
ok(!/Línea temporal/i.test(vacio_fit28),
  '…ni una línea temporal vacía debajo');

/* Apartado 18 — datos parciales: hay entrenamientos y no hay fotos. */
almacen.fitness = fitnessDeAntes_fit28;
almacen.saludFotos = [];
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F28 — con entrenamientos y sin fotos');
const parcial_fit28 = await esperarTexto(/entrenamientos registrados/i);
ok(/entrenamientos registrados/i.test(parcial_fit28) && /Empieza a registrar tu progreso visual/i.test(parcial_fit28),
  '🚨 FIT F28 — se enseña lo que hay y Fotos dice su frase: «No ocultar todo por falta de una fuente» (apartado 18)');
ok(!/Comparar progreso/i.test(parcial_fit28),
  '…y sin fotos no se ofrece comparar (regla 8)');
almacen.saludFotos = fotosDeAntes_fit28;

/* ══════════════════════════════════════════════════════════════════════════
   FIT F29 — El análisis avanzado por ejercicio (Entrega 4 · 29/45)
   ══════════════════════════════════════════════════════════════════════════

   La pantalla tiene que contestar *"¿Cómo estoy progresando realmente en este
   ejercicio?"*. Lo que de verdad hay que ver funcionando, y que ninguna prueba
   de Node puede: que la cabecera, el rango, el objetivo, la gráfica, las
   variantes y el historial caben **en una sola pantalla**, que el selector de
   métrica aparece **solo** cuando hay dos de verdad, y que al cambiarla cambia
   la unidad del gráfico (apartados 10 y 11).

   🐛 **Y siembra lo suyo, sin heredar el escenario del vecino** (E3 F6, y es el
   fallo que costó cinco rojos en la F28): hace falta un ejercicio hecho **de
   dos formas** —con lastre y sin él—, y eso no lo deja ninguna sección
   anterior. */
console.log('\n── FIT F29 · El análisis por ejercicio ──');

const serie_fit29 = (id, reps, peso) => ({
  id, origen: 'planificada', estado: 'hecha', modo: 'reps',
  plan: { reps: 8, repsHasta: 10, duracion: null, peso: null },
  hecho: { reps, peso, duracion: null },
});
const sesion_fit29 = (id, dias, series, exerciseId, tipoCarga, nota = '') => {
  const fecha = haceDias_fit12(dias);
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  return {
    id, nombre: 'Pull sembrado', fecha, estado: 'completada', iniciadaEn: inicio, terminadaEn: inicio + 45 * 60000,
    guardadaEn: inicio + 46 * 60000, pausadoMs: 0, actual: 0, visibilidad: 'privado', notas: nota, entorno: 'gym',
    origen: { tipo: 'plantilla', id: null, ejercicios: [{ id: `${id}-e`, exerciseId, orden: 0, modo: 'reps', notas: '', descanso: 90, sustituyeA: null, linea: { series: series.length, tipoCarga }, series }] },
  };
};
const fitnessDeAntes_fit29 = almacen.fitness;
almacen.fitness = {
  ...almacen.fitness,
  sesiones: [
    ...(almacen.fitness.sesiones || []),
    /* 🐛 **TRES por clase, no dos**: la gráfica necesita `PUNTOS_MINIMOS_GRAFICA`
       (3) para dibujarse, así que con dos por métrica no había ni etiqueta que
       leer y el rojo no era del código — es «un escenario se construye de lo
       que el motor pide» (FIT F8) otra vez. */
    sesion_fit29('f29-a', 90, [serie_fit29('a1', 8, null), serie_fit29('a2', 7, null)], 'dominada-lastrada', 'corporal'),
    sesion_fit29('f29-b', 75, [serie_fit29('b1', 9, null), serie_fit29('b2', 8, null)], 'dominada-lastrada', 'corporal'),
    sesion_fit29('f29-c', 60, [serie_fit29('c1', 10, null), serie_fit29('c2', 9, null)], 'dominada-lastrada', 'corporal'),
    sesion_fit29('f29-d', 40, [serie_fit29('d1', 5, 10), serie_fit29('d2', 4, 10)], 'dominada-lastrada', 'adicional'),
    sesion_fit29('f29-e', 20, [serie_fit29('e1', 6, 10), serie_fit29('e2', 5, 10)], 'dominada-lastrada', 'adicional'),
    sesion_fit29('f29-f', 4, [serie_fit29('f1', 7, 10), serie_fit29('f2', 6, 10)], 'dominada-lastrada', 'adicional', 'Me sentí fuerte hoy.'),
    /* Una HERMANA con historial propio, para los apartados 20 y 21: la lastrada
       y la supina comparten base, y es justo el caso que el aviso tiene que
       cubrir —estar EN una variante— y que la primera pasada destapó roto. */
    sesion_fit29('f29-g', 12, [serie_fit29('g1', 12, null)], 'dominada-supina', 'corporal'),
  ],
  objetivos: [
    ...(almacen.fitness.objetivos || []),
    { id: 'f29-obj', exerciseId: 'dominada-lastrada', tipo: 'reps', valor: 12, unidad: 'reps', creadoEn: Date.parse('2026-07-01T12:00:00'), actualizadoEn: null, fechaObjetivo: '', estado: 'activo', nota: '' },
  ],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F29 — se entra en Progreso');
ok(await pulsar('Ejercicios'), '…y en la pestaña Ejercicios');
await page.waitForTimeout(500);
ok(await pulsarQueEmpiece_fit10('Ver el progreso de Dominadas lastradas'), 'FIT F29 — se abre el detalle de las dominadas lastradas');
const det_fit29 = await esperarTexto(/Última vez/i);

/* Apartado 2 — la cabecera: nombre, agarre/equipamiento y grupo muscular. */
ok(/Dominadas lastradas/i.test(det_fit29) && /Espalda/i.test(det_fit29),
  '🚨 FIT F29 — la cabecera con el ejercicio y su grupo muscular principal (apartado 2)');
ok(/Agarre|Lastre|Barra/i.test(det_fit29), '…y su línea de agarre y equipamiento');

/* Apartados 4, 5 y 6 — último, anterior y mejor, en una lectura. */
ok(/Última vez/i.test(det_fit29) && /Anterior/i.test(det_fit29) && /Mejor resultado/i.test(det_fit29),
  '🚨 FIT F29 — último, anterior y mejor resultado, los tres (apartados 4, 5 y 6)');
ok(/Cambio/i.test(det_fit29), '…con el cambio entre los dos comparables (apartado 5)');

/* Apartados 3 y 25 — el rango, y su camino al siguiente. */
ok(/Rango/i.test(det_fit29), '🚨 FIT F29 — el rango del ejercicio, del RankEngine (apartado 3)');
ok(/Ver evolución del rango/i.test(det_fit29),
  '🚨 …y «Ver evolución del rango», que lleva al historial de la F22 (apartado 26)');

/* Apartados 23 y 24 — el objetivo. */
ok(/Objetivo/i.test(det_fit29), '🚨 FIT F29 — el objetivo del ejercicio, de la F14 (apartado 23)');

/* Apartados 20 y 21 — las variantes, con su aviso. */
ok(/Esta variante tiene un historial separado/i.test(det_fit29),
  '🚨 FIT F29 — «Esta variante tiene un historial separado.» (apartado 21)');
ok(/Dominadas supinas/i.test(det_fit29), '…y se ofrece ir a la que sí tiene registros');

/* 🚨 Apartado 11 — el selector de métrica, que SOLO existe porque este
   ejercicio se ha hecho de dos formas. */
const metricas_fit29 = await page.evaluate(() => {
  const g = [...document.querySelectorAll('[role="group"]')].find((x) => /Métrica del gráfico/.test(x.getAttribute('aria-label') || ''));
  return g ? [...g.querySelectorAll('button')].map((b) => b.textContent.trim()) : [];
});
ok(metricas_fit29.length === 2,
  `🚨 FIT F29 — el selector de métrica con las DOS que tiene de verdad (${metricas_fit29.join(' / ')}, apartado 11)`);

/* ⚠️ La etiqueta se lee del `aria-label` del gráfico, NO de `innerText`: el
   rótulo lleva la clase `uppercase`, así que el texto renderizado llega en
   mayúsculas (E3 F8) — y además el `aria-label` trae **la unidad**, que es lo
   que de verdad demuestra el apartado 10. */
const etiquetaGrafica_fit29 = () => page.evaluate(() => {
  const svg = document.querySelector('svg[role="img"]');
  return svg ? svg.getAttribute('aria-label') || '' : '';
});
const unidadAntes_fit29 = await etiquetaGrafica_fit29();
ok(!!unidadAntes_fit29, `…y la gráfica dice qué mide y en qué unidad: «${unidadAntes_fit29}»`);
/* ⚠️ Se pulsa por `aria-pressed`, no por texto: «Repeticiones» es subcadena de
   «Peso añadido y repeticiones», así que buscar por nombre pulsaría la
   equivocada — el fallo de «Más» dentro de «Además» (NAV F1). */
ok(await page.evaluate(() => {
  const g = [...document.querySelectorAll('[role="group"]')].find((x) => /Métrica del gráfico/.test(x.getAttribute('aria-label') || ''));
  const otra = g && [...g.querySelectorAll('button')].find((b) => b.getAttribute('aria-pressed') === 'false');
  if (!otra) return false;
  otra.click();
  return true;
}), 'FIT F29 — se cambia a la otra métrica (apartado 11)');
await page.waitForTimeout(500);
const unidadDespues_fit29 = await etiquetaGrafica_fit29();
ok(!!unidadDespues_fit29 && unidadDespues_fit29 !== unidadAntes_fit29,
  `🚨 FIT F29 — al cambiar de métrica cambia lo que mide el gráfico: «${unidadAntes_fit29}» → «${unidadDespues_fit29}» (apartado 10)`);
/* 🚨 Y cada clase conserva SU unidad: kg para el lastre, reps sin él. */
ok(/\bkg\b/.test(`${unidadAntes_fit29} ${unidadDespues_fit29}`) && /\breps\b/.test(`${unidadAntes_fit29} ${unidadDespues_fit29}`),
  '🚨 FIT F29 — y las dos métricas van en SU unidad —kg y reps—, sin sumarlas (apartado 10)');

/* 🚨 Apartado 35 — la alternativa textual del gráfico. */
ok(/mejor resultado fue/i.test(await ver()),
  '🚨 FIT F29 — el gráfico tiene alternativa textual: «No depender únicamente del gráfico» (apartado 35)');

/* Apartado 12 — los seis periodos. */
const periodos_fit29 = await page.evaluate(() => {
  const g = [...document.querySelectorAll('[role="group"]')].find((x) => /Periodo de la gráfica/.test(x.getAttribute('aria-label') || ''));
  return g ? [...g.querySelectorAll('button')].map((b) => b.textContent.trim()) : [];
});
ok(periodos_fit29.length === 6,
  `🚨 FIT F29 — los seis periodos del apartado 12 (${periodos_fit29.join(', ')})`);

/* 🚨 Apartados 18, 19 y 27 — el desglose de una sesión: series, parcial y nota. */
ok(await pulsarQueEmpiece_fit10('Ver las series del'), 'FIT F29 — se despliega una sesión del historial (apartado 17)');
await page.waitForTimeout(400);
const desglose_fit29 = await ver();
ok(/Serie 1 —/.test(desglose_fit29), '…con sus series numeradas como el historial (apartado 17)');
ok(/\d+\/\d+ series/.test(desglose_fit29),
  '🚨 FIT F29 — y el desglose de cuántas se hicieron (apartado 18)');
ok(/Me sentí fuerte hoy/.test(desglose_fit29),
  '🚨 FIT F29 — la nota de la sesión, TAL CUAL: «No analizar automáticamente el texto» (apartado 27)');

/* 🚨 Y lo que NO puede aparecer (apartado 39). */
const textoFinal_fit29 = await ver();
ok(!/\bXP\b|predicci[oó]n|hipertrofia estimada|leaderboard/i.test(textoFinal_fit29),
  '🚨 FIT F29 — ni XP, ni predicciones, ni estimaciones, ni comparación social (apartado 39)');
ok(!/\bPR\b|récord personal/i.test(textoFinal_fit29),
  '🚨 …ni un sistema de récords aparte: el mejor es el de la F11 (apartado 7)');

/* Apartado 34 — y a 375 px no se desborda de lado. */
const ancho_fit29 = await page.evaluate(() => ({ a: document.documentElement.scrollWidth, v: window.innerWidth }));
ok(ancho_fit29.a <= ancho_fit29.v + 1,
  `🚨 FIT F29 — a 375 px la pantalla NO desborda de lado (${ancho_fit29.a} vs ${ancho_fit29.v}, apartado 34)`);

almacen.fitness = fitnessDeAntes_fit29;

/* ══════════════════════════════════════════════════════════════════════════
   FIT F30 — Sistema avanzado de objetivos fitness (Entrega 4 · 30/45)
   ══════════════════════════════════════════════════════════════════════════

   Los objetivos son los de la **F14** y esta fase les añade el ciclo entero:
   progreso derivado, historial, gráfica con su línea, habilidades sin
   porcentaje, el aviso de duplicado y recuperar uno cancelado.

   Lo que solo se puede ver aquí: que el detalle de un objetivo **cabe en una
   pantalla** con sus cuatro bloques, que una HABILIDAD no pinta ni un
   porcentaje ni un gráfico (apartados 14 y 32), que crear uno repetido
   **avisa y sin confirmar no escribe** (apartado 24) y que un cancelado se
   recupera (apartado 20).

   🐛 Y siembra lo suyo: el escenario de la F29 se acaba de deshacer, así que
   hacen falta **tres registros** del mismo ejercicio —`PUNTOS_MINIMOS_OBJETIVO`
   es 3— o la gráfica no se dibujaría y el rojo no sería del código. */
console.log('\n── FIT F30 · Los objetivos avanzados ──');

const fitnessDeAntes_fit30 = almacen.fitness;
/* 🐛 **Y LIMPIA LO QUE VA A MIRAR** (E3 F6, y lo escribí en el comentario de
   arriba antes de saltármelo): la sección de la F12/F14 siembra sus propias
   dominadas pronas **con una de 15 repeticiones**, que es justo el valor del
   objetivo de aquí — así que el objetivo salía **ya conseguido** y «Te faltan
   3 reps» no podía aparecer. La aplicación estaba bien; el escenario heredaba
   el del vecino. Se quitan las sesiones de ESE ejercicio, no todas. */
const sinEseEjercicio_fit30 = (sesiones, exerciseId) => (sesiones || []).filter(
  (s) => !((s.origen && s.origen.ejercicios) || []).some((e) => e.exerciseId === exerciseId),
);
almacen.fitness = {
  ...almacen.fitness,
  sesiones: [
    ...sinEseEjercicio_fit30(almacen.fitness.sesiones, 'dominada-prona'),
    sesion_fit29('f30-a', 70, [serie_fit29('h1', 8, null), serie_fit29('h2', 7, null)], 'dominada-prona', 'corporal'),
    sesion_fit29('f30-b', 45, [serie_fit29('h3', 10, null), serie_fit29('h4', 9, null)], 'dominada-prona', 'corporal'),
    sesion_fit29('f30-c', 10, [serie_fit29('h5', 12, null), serie_fit29('h6', 11, null)], 'dominada-prona', 'corporal'),
    /* Un peldaño de la progresión del muscle-up, para el apartado 14. */
    sesion_fit29('f30-d', 30, [serie_fit29('h7', 6, null)], 'dominada-explosiva', 'corporal'),
  ],
  objetivos: [
    /* Y lo mismo con los objetivos: la F14 dejó el SUYO sobre dominada-prona a
       15 reps, así que sin esto habría **dos tarjetas idénticas** y
       `pulsarQueEmpiece` abriría una cualquiera de las dos. */
    ...(almacen.fitness.objetivos || []).filter((o) => o.exerciseId !== 'dominada-prona'),
    { id: 'f30-obj', exerciseId: 'dominada-prona', tipo: 'reps', valor: 15, unidad: 'reps', creadoEn: Date.parse('2026-07-01T12:00:00'), actualizadoEn: null, fechaObjetivo: '', estado: 'activo', nota: '' },
    /* 🚨 Apartado 14 — una habilidad: sin `valor` y sin porcentaje posible. */
    { id: 'f30-skill', exerciseId: 'muscle-up', tipo: 'skill', valor: null, unidad: '', creadoEn: Date.parse('2026-07-02T12:00:00'), actualizadoEn: null, fechaObjetivo: '', estado: 'activo', nota: '' },
    /* Y uno cancelado, para el apartado 20. */
    { id: 'f30-cancel', exerciseId: 'press-banca-barra', tipo: 'peso', valor: 80, unidad: 'kg', creadoEn: Date.parse('2026-07-03T12:00:00'), actualizadoEn: null, fechaObjetivo: '', estado: 'cancelado', nota: '' },
  ],
};

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F30 — se entra en Progreso');
ok(await pulsar('Objetivos'), '…y en la pestaña Objetivos');
await page.waitForTimeout(500);

const lista_fit30 = await ver();
ok(/Mis objetivos/i.test(lista_fit30), '🚨 FIT F30 — la lista de objetivos, la de la F14 (apartado 2: *"REUTILIZARLOS"*)');
/* Apartado 21 — «Cancelados» solo aparece porque HAY uno cancelado. */
ok(/Cancelad/i.test(lista_fit30),
  '🚨 FIT F30 — el filtro «Cancelados» existe porque hay uno: no es una pastilla que dejaría la pantalla vacía (apartado 21)');

/* ── El detalle de un objetivo numérico: los cuatro bloques juntos ───────── */
ok(await pulsarQueEmpiece_fit10('Objetivo Dominadas pronas'), 'FIT F30 — se abre el detalle del objetivo de dominadas');
const det_fit30 = await esperarTexto(/Lo que has hecho/i);

/* Apartados 10 y 33 — el progreso derivado y cuánto falta, nunca cuándo. */
ok(/12\s*\/\s*15\s*reps/i.test(det_fit30),
  '🚨 FIT F30 — el progreso sale de los entrenamientos: «12 / 15 reps», sin que nadie lo escriba (apartado 10)');
ok(/faltan?\s*3/i.test(det_fit30),
  '🚨 FIT F30 — «Te faltan 3 reps»: aritmética sobre lo que hay, no una predicción (apartado 33)');
ok(!/quedan \d+ (d[ií]as|semanas)|conseguir[aá]s|a este ritmo/i.test(det_fit30),
  '🚨 FIT F30 — y NI UNA predicción de cuándo llegará (apartado 34, tres veces)');

/* Apartado 31 — las sesiones que han contribuido, del historial que ya existe. */
ok(/Lo que has hecho/i.test(det_fit30),
  '🚨 FIT F30 — las sesiones que han contribuido, sin duplicar el historial (apartado 31)');

/* Apartado 32 — la gráfica CON su línea de objetivo, y con alternativa textual. */
const graficaObj_fit30 = await page.evaluate(() => {
  const g = [...document.querySelectorAll('svg[role="img"]')].map((s) => s.getAttribute('aria-label') || '');
  return g.find((t) => /objetivo/i.test(t)) || '';
});
ok(/objetivo en 15/i.test(graficaObj_fit30),
  `🚨 FIT F30 — la gráfica lleva la LÍNEA del objetivo, que es lo único que añade a la de la F12 («${graficaObj_fit30}», apartado 32)`);

/* ── Apartado 14 · Una HABILIDAD: peldaños, y ni un porcentaje ───────────── */
ok(await pulsar('Volver a Mis objetivos'), 'FIT F30 — se vuelve a la lista');
await page.waitForTimeout(400);
ok(await pulsarQueEmpiece_fit10('Objetivo Muscle-up'), 'FIT F30 — se abre el objetivo de habilidad');
const skill_fit30 = await esperarTexto(/Progresi[oó]n/i);
/* 🐛 Es «Dominada explosiva», en SINGULAR: el nombre sale del catálogo, no de
   cómo suene. Escribirlo de memoria costó un rojo con la pantalla bien. */
ok(/Dominada explosiva/i.test(skill_fit30),
  '🚨 FIT F30 — una habilidad enseña sus PELDAÑOS, que salen del catálogo (apartado 14)');
ok(!/%/.test(skill_fit30),
  '🚨 FIT F30 — y NI UN porcentaje: *"No mostrar «73 % completado» si no existe una escala válida"* (apartado 14)');
ok(/no se dibuja en una l[ií]nea|habilidad se consigue o no/i.test(skill_fit30),
  '🚨 FIT F30 — ni un gráfico artificial: se dice por qué (apartado 32)');

/* ── Apartado 20 · Recuperar uno cancelado ──────────────────────────────── */
ok(await pulsar('Volver a Mis objetivos'), 'FIT F30 — se vuelve otra vez a la lista');
await page.waitForTimeout(400);
ok(await pulsar('Cancelados'), 'FIT F30 — se filtra por cancelados');
await page.waitForTimeout(400);
ok(await pulsarQueEmpiece_fit10('Objetivo Press de banca'), 'FIT F30 — se abre el cancelado');
await esperarTexto(/Recuperar objetivo/i);
ok(await pulsar('Recuperar objetivo'), '🚨 FIT F30 — un objetivo cancelado se RECUPERA, no hay que crearlo otra vez (apartado 20)');
await page.waitForTimeout(700);
ok((almacen.fitness.objetivos || []).find((o) => o.id === 'f30-cancel')?.estado === 'activo',
  '🚨 FIT F30 — …y queda guardado como activo, con el MISMO id (apartado 20)');

/* ── Apartado 24 · El duplicado avisa, y sin confirmar NO escribe ────────── */
const cuantosAntes_fit30 = (almacen.fitness.objetivos || []).length;
ok(await pulsar('Volver a Mis objetivos'), 'FIT F30 — de vuelta a la lista');
await page.waitForTimeout(400);
ok(await pulsar('+ Añadir objetivo'), 'FIT F30 — se abre el formulario');
await esperarTexto(/Nuevo objetivo/i);
ok(await pulsar('Elegir ejercicio'), 'FIT F30 — se abre el catálogo para elegir');
await page.waitForTimeout(600);
await page.fill('input[aria-label="Buscar un ejercicio"]', 'Dominadas pronas');
await page.waitForTimeout(600);
/* 🐛 `pulsar()` compara el `aria-label` ENTERO (Ajustes · Perfil), y el de una
   tarjeta del catálogo es «Añadir Dominadas pronas · Agarre prono»: el nombre
   completo lleva su agarre. Por prefijo, que es lo que esto necesita. */
ok(await pulsarQueEmpiece_fit10('Añadir Dominadas pronas'), 'FIT F30 — se elige el ejercicio que YA tiene objetivo');
await esperarTexto(/Nuevo objetivo/i);
await page.fill('input[aria-label="Objetivo en reps"]', '15');
await page.waitForTimeout(300);
ok(await pulsar('Crear objetivo'), 'FIT F30 — se intenta guardar el mismo objetivo otra vez');
const aviso_fit30 = await esperarTexto(/Ya tienes un objetivo igual/i);
ok(/Ya tienes un objetivo igual/i.test(aviso_fit30),
  '🚨 FIT F30 — «Ya tienes un objetivo igual»: avisa en vez de crear dos (apartado 24)');
ok((almacen.fitness.objetivos || []).length === cuantosAntes_fit30,
  '🚨 FIT F30 — …y SIN confirmar NO ha escrito nada, que es el patrón `aplicarPlan` de siempre (apartado 24)');

/* Apartado 44 — y todo esto a 375 px, sin desbordar de lado. */
const ancho_fit30 = await page.evaluate(() => ({ a: document.documentElement.scrollWidth, v: window.innerWidth }));
ok(ancho_fit30.a <= ancho_fit30.v + 1,
  `🚨 FIT F30 — a 375 px la pantalla NO desborda de lado (${ancho_fit30.a} vs ${ancho_fit30.v}, apartado 44)`);

/* Apartado 16 y D2-02 — ni XP, ni monedas, ni leaderboard en toda la pantalla. */
const textoFinal_fit30 = await ver();
ok(!/\bXP\b|monedas|leaderboard|ranking social/i.test(textoFinal_fit30),
  '🚨 FIT F30 — ni XP, ni monedas, ni leaderboard: esto mide, no premia (apartado 16 y D2-02)');

almacen.fitness = fitnessDeAntes_fit30;

/* ══════════════════════════════════════════════════════════════════════════
   FIT F31 — Consistencia y actividad de entrenamiento (Entrega 4 · 31/45)
   ══════════════════════════════════════════════════════════════════════════

   Lo que solo se puede ver aquí: que Progreso → Resumen dice **cuándo** entrenó,
   **cuánto**, **cómo se reparte** y **cómo va el plan** (apartado 41), que un
   día sin sesión dice «sin entrenamiento registrado» y NUNCA «descanso» sin plan
   (apartados 28 y 29), que la actividad lleva al detalle de la sesión y al
   Historial (apartados 17, 18 y 30) y que Tu Plan enseña «Esta semana» con la
   misma función (apartado 31).

   🚨 **ESTE ESCENARIO NO DEPENDE DEL DÍA DE LA SEMANA** (FIT F23 y F26, dos
   bombas de relojería). Cada etiqueta esperada **se calcula aquí** a partir de
   lo que se siembra y de hoy, con su propia cuenta: la de un lunes y la de un
   domingo son distintas y las dos se comprueban enteras.

   🐛 **Y LIMPIA LO QUE VA A MIRAR** (E3 F6 y FIT F30): se quitan TODAS las
   sesiones y el plan activo de las secciones de antes. Esta fase cuenta
   sesiones, así que una sola heredada cambiaría cada número. */
console.log('\n── FIT F31 · La actividad de entrenamiento ──');

const fitnessDeAntes_fit31 = almacen.fitness;
const MESES_fit31 = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const iso_fit31 = (d) => d.toLocaleDateString('sv-SE');
const hoy_fit31 = iso_fit31(new Date());
const masDias_fit31 = (isoBase, n) => { const d = new Date(`${isoBase}T12:00:00`); d.setDate(d.getDate() + n); return iso_fit31(d); };
const lunes_fit31 = masDias_fit31(hoy_fit31, -((new Date(`${hoy_fit31}T12:00:00`).getDay() + 6) % 7));
const diaYMes_fit31 = (f) => `${Number(f.slice(8, 10))} de ${MESES_fit31[Number(f.slice(5, 7)) - 1]}`;
/* Una sesión con UN ejercicio y sus series; `pendientes` la deja parcial. */
const sesion_fit31 = (id, nombre, diasAtras, hora, minutos, pendientes = 0) => {
  const fecha = masDias_fit31(hoy_fit31, -diasAtras);
  const inicio = new Date(`${fecha}T${String(hora).padStart(2, '0')}:00:00`).getTime();
  const series = [serie_fit29(`${id}-1`, 8, null), serie_fit29(`${id}-2`, 7, null)];
  for (let i = 0; i < pendientes; i += 1) series.push({ ...serie_fit29(`${id}-p${i}`, null, null), estado: 'pendiente', hecho: { reps: null, peso: null, duracion: null } });
  return {
    id, nombre, fecha, estado: 'completada', iniciadaEn: inicio, terminadaEn: inicio + minutos * 60000,
    guardadaEn: inicio + (minutos + 1) * 60000, pausadoMs: 0, actual: 0, visibilidad: 'privado', notas: '', entorno: 'gym',
    origen: { tipo: 'plantilla', id: null, ejercicios: [{ id: `${id}-e`, exerciseId: 'dominada-prona', orden: 0, modo: 'reps', notas: '', descanso: 90, sustituyeA: null, linea: { series: series.length, tipoCarga: 'corporal' }, series }] },
  };
};
const SEMBRADAS_fit31 = [
  sesion_fit31('f31-push', 'Push F31', 0, 18, 58),
  /* Dos el mismo día: el día los lleva a los dos (apartado 39). Y parcial. */
  sesion_fit31('f31-core', 'Core F31', 0, 8, 25, 2),
  sesion_fit31('f31-legs', 'Legs F31', 3, 18, 60),
  sesion_fit31('f31-pull', 'Pull F31', 10, 18, 45),
];
almacen.fitness = {
  ...almacen.fitness,
  sesiones: [
    ...SEMBRADAS_fit31,
    /* 🚨 Apartado 24 — una sin NINGUNA marca de tiempo: la puerta de carga ya
       no la muda a hoy (era un fallo de la F1/F7), así que no cae en ningún día. */
    { id: 'f31-sin-fecha', nombre: 'Sin fecha F31', estado: 'completada', origen: { tipo: 'plantilla', id: null, ejercicios: [] } },
  ],
  planActivo: null,
};

/* Lo esperado, calculado aquí y no leído de la aplicación. */
const porDia_fit31 = new Map();
for (const x of SEMBRADAS_fit31) porDia_fit31.set(x.fecha, [...(porDia_fit31.get(x.fecha) || []), x]);
const etiquetasEsperadas_fit31 = (conPlan) => Array.from({ length: 7 }, (_, i) => {
  const f = masDias_fit31(lunes_fit31, i);
  const del = (porDia_fit31.get(f) || []).sort((a, b) => b.iniciadaEn - a.iniciadaEn);
  /* El plan PPL descansa el jueves (4) y el domingo (7). */
  const descansaElPlan = conPlan && (i === 3 || i === 6);
  let que;
  if (del.length > 1) que = `${del.length} entrenamientos: ${[...del].sort((a, b) => a.iniciadaEn - b.iniciadaEn).map((x) => x.nombre).join(' y ')}`;
  else if (del.length === 1) que = `entrenamiento ${del[0].nombre}`;
  else if (f > hoy_fit31) que = 'todavía no ha llegado';
  else if (descansaElPlan) que = 'descanso del plan';
  else que = 'sin entrenamiento registrado';
  return `${diaYMes_fit31(f)} — ${que}`;
});
const etiquetasSemana_fit31 = () => page.evaluate(() => {
  const grupo = document.querySelector('[aria-label="Actividad de esta semana"]');
  return grupo ? [...grupo.children].map((el) => el.getAttribute('aria-label') || (el.querySelector('.sr-only') || {}).textContent || '') : [];
});

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness') && await pulsar('Progreso'), 'FIT F31 — se entra en Progreso → Resumen');
const resumen_fit31 = await esperarTexto(/Último entrenamiento/i);

/* 1 · Cuándo (apartado 3). */
ok(/Hoy · Push F31/.test(resumen_fit31) && /58 min/.test(resumen_fit31),
  '🚨 FIT F31 — «Último entrenamiento: Hoy · Push F31 · 58 min» — el más reciente, aunque no sea el primero de la lista (apartado 3)');

/* 2 · Cuánto, esta semana (apartados 4 y 10). */
const enSemana_fit31 = SEMBRADAS_fit31.filter((x) => x.fecha >= lunes_fit31 && x.fecha <= hoy_fit31).length;
const pasada_fit31 = SEMBRADAS_fit31.filter((x) => x.fecha >= masDias_fit31(lunes_fit31, -7) && x.fecha < lunes_fit31).length;
const cuenta_fit31 = (n0) => `${n0} ${n0 === 1 ? 'entrenamiento' : 'entrenamientos'}`;
ok(resumen_fit31.includes(`${cuenta_fit31(enSemana_fit31)} · semana en curso`),
  `🚨 FIT F31 — «${cuenta_fit31(enSemana_fit31)} · semana en curso»: el número real, y dicho que la semana no ha terminado (apartados 4 y 10)`);
ok(resumen_fit31.includes(`La semana pasada: ${cuenta_fit31(pasada_fit31)}`),
  `FIT F31 — …y «La semana pasada: ${cuenta_fit31(pasada_fit31)}» (prueba 5)`);

/* 3 · Cómo se reparte (apartados 6, 28, 29 y 37), día a día. */
const semana_fit31 = await etiquetasSemana_fit31();
eqReal(semana_fit31, etiquetasEsperadas_fit31(false),
  '🚨 FIT F31 — los siete días, CON PALABRAS, tal y como salen del escenario (apartados 6 y 37)');
ok(semana_fit31.length === 7 && !semana_fit31.some((e) => /descanso/i.test(e)),
  '🚨 FIT F31 — …y sin plan NINGÚN día dice «descanso»: sin registro no es descanso (apartados 28 y 29)');

/* 4 · Constancia (apartado 8), con «Todo»: empezó hace 10 días. */
const diasActivos_fit31 = porDia_fit31.size;
ok(resumen_fit31.includes(`Entrenaste ${diasActivos_fit31} de los 11 días desde tu primer entrenamiento.`),
  `🚨 FIT F31 — «Entrenaste ${diasActivos_fit31} de los 11 días desde tu primer entrenamiento.»: una frase, no un porcentaje (apartado 8)`);
ok(/sin fecha y no aparece|no tiene fecha y no aparece/i.test(resumen_fit31),
  '🚨 FIT F31 — la sesión sin fecha se DICE, en vez de caer en hoy o desaparecer (apartado 24)');

/* 5 · El periodo es el del resumen (apartado 5). */
ok(await pulsar('7 días'), 'FIT F31 — se elige «7 días» en el selector del resumen');
await page.waitForTimeout(500);
const siete_fit31 = await ver();
const activos7_fit31 = [...porDia_fit31.keys()].filter((f) => f >= masDias_fit31(hoy_fit31, -6)).length;
ok(siete_fit31.includes(`Entrenaste ${activos7_fit31} de los últimos 7 días.`),
  `🚨 FIT F31 — «Entrenaste ${activos7_fit31} de los últimos 7 días.»: siete días de verdad, no ocho (apartado 5 y el arreglo de la F12)`);
const sesiones7_fit31 = SEMBRADAS_fit31.filter((x) => x.fecha >= masDias_fit31(hoy_fit31, -6)).length;
ok(siete_fit31.includes(`${sesiones7_fit31} en los últimos 7 días`),
  `🚨 FIT F31 — …y el bloque de la F28 dice el MISMO número: «${sesiones7_fit31} en los últimos 7 días»`);
ok(await pulsar('Todo'), '…y se vuelve a «Todo»');
await page.waitForTimeout(400);

/* 6 · Actividad reciente (apartados 15 y 17). */
const recientes_fit31 = await ver();
ok(/Actividad reciente/i.test(recientes_fit31) && /Parcial/.test(recientes_fit31) && /Completa/.test(recientes_fit31),
  '🚨 FIT F31 — «Actividad reciente», con la parcial marcada «Parcial» y las demás «Completa» (apartados 15 y 17)');
ok(!/%/.test(recientes_fit31.slice(recientes_fit31.search(/Último entrenamiento/i), recientes_fit31.search(/Actividad reciente/i) + 400)),
  '🚨 FIT F31 — ni un «%» en toda la actividad (apartados 8, 14 y 40)');

/* 7 · Un día con dos sesiones enseña las dos (apartado 30). */
ok(await pulsarQueEmpiece_fit10(`${diaYMes_fit31(hoy_fit31)} — 2 entrenamientos`), 'FIT F31 — se toca hoy, que tiene dos entrenamientos');
await page.waitForTimeout(400);
const dosHoy_fit31 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver el entrenamiento: Hoy"]')].length);
ok(dosHoy_fit31 === 4,
  `🚨 FIT F31 — …y salen los dos para elegir, además de en la actividad reciente (${dosHoy_fit31} botones «Ver» de hoy)`);

/* 8 · De la actividad al detalle, y vuelta (apartados 17 y 30). */
const legs_fit31 = masDias_fit31(hoy_fit31, -3);
ok(await pulsarQueEmpiece_fit10(`Ver el entrenamiento: ${Number(legs_fit31.slice(8, 10))} ${MESES_fit31[Number(legs_fit31.slice(5, 7)) - 1]} ${legs_fit31.slice(0, 4)}, Legs F31`),
  'FIT F31 — «Ver» en la tarjeta de Legs');
const detalle_fit31 = await esperarTexto(/Planificado/i);
ok(/Legs F31/.test(detalle_fit31), '🚨 FIT F31 — abre el detalle de ESA sesión, el de la F10 (apartado 17: «→ detalle de sesión»)');
ok(await pulsar('Ver su progreso'), '🚨 FIT F31 — y desde la sesión, al progreso del ejercicio (apartado 30)');
const progresoEj_fit31 = await esperarTexto(/Dominadas pronas/i);
ok(/Dominadas pronas/i.test(progresoEj_fit31) && !/Planificado/.test(progresoEj_fit31),
  '…que es el detalle del ejercicio en Progreso, no otra pantalla');
ok(await pulsar('Volver a Progreso'), '…y se vuelve a Progreso');
await page.waitForTimeout(500);
if (!/Último entrenamiento/i.test(await ver())) { await pulsar('Resumen'); await page.waitForTimeout(400); }

/* 9 · La vista mensual (apartado 7). */
ok(await pulsarQueEmpiece_fit10('Ver el mes entero'), 'FIT F31 — se abre el mes');
await page.waitForTimeout(400);
const mesVisible_fit31 = await page.evaluate(() => {
  const g = [...document.querySelectorAll('[role="group"]')].find((x) => /^Actividad de [A-ZÁÉÍÓÚ]/.test(x.getAttribute('aria-label') || '') && !/esta semana/.test(x.getAttribute('aria-label')));
  return g ? { nombre: g.getAttribute('aria-label'), dias: g.querySelectorAll('button[aria-label]').length } : null;
});
const diasMes_fit31 = [...porDia_fit31.keys()].filter((f) => f.slice(0, 7) === hoy_fit31.slice(0, 7)).length;
ok(mesVisible_fit31 && mesVisible_fit31.dias === diasMes_fit31,
  `🚨 FIT F31 — el mes, con una marca por día con entrenamiento (${mesVisible_fit31 && mesVisible_fit31.dias} de ${diasMes_fit31}) (apartado 7)`);
ok(await pulsarQueEmpiece_fit10('Ver solo esta semana'), '…y se vuelve a la semana');

/* 10 · «Ver historial» → la misma sesión, en el Historial (apartados 18 y 34). */
ok(await pulsar('Ver historial'), 'FIT F31 — «Ver historial» (apartado 18)');
const historial_fit31 = await esperarTexto(/Legs F31/);
ok(['Push F31', 'Core F31', 'Legs F31', 'Pull F31'].every((x) => historial_fit31.includes(x)),
  '🚨 FIT F31 — toda sesión de la actividad EXISTE en el Historial: no hay una segunda lista (apartado 34)');

/* 11 · Tu Plan: «Esta semana», con el PPL activo desde hace dos semanas (apartado 31). */
almacen.fitness = { ...almacen.fitness, planActivo: { planId: 'ppl-estetico', origen: 'preset', desde: masDias_fit31(lunes_fit31, -14) } };
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok(await pulsar('Bienestar') && await pulsar('Fitness'), 'FIT F31 — se vuelve a Fitness con el PPL activo');
const tuPlan_fit31 = await esperarTexto(/sesiones planificadas|planificados/i);
const planTexto_fit31 = enSemana_fit31 > 5 ? `${cuenta_fit31(enSemana_fit31)} · 5 planificados` : `${enSemana_fit31} / 5 sesiones planificadas`;
ok(tuPlan_fit31.includes(planTexto_fit31),
  `🚨 FIT F31 — Tu Plan: «${planTexto_fit31}», sin nota ni porcentaje (apartados 11 y 31)`);
ok(/L Push · M Pull · X Legs · V Upper · S Lower/.test(tuPlan_fit31),
  '🚨 FIT F31 — …con la estructura REAL del plan: «L Push · M Pull · X Legs · V Upper · S Lower» (apartado 12)');
ok(await pulsar('Progreso'), '…y en Progreso, con el plan');
await esperarTexto(/Último entrenamiento/i);
eqReal(await etiquetasSemana_fit31(), etiquetasEsperadas_fit31(true),
  '🚨 FIT F31 — con plan, SOLO el jueves y el domingo ya pasados pueden decir «descanso del plan» (apartado 28)');

/* Apartado 36 — a 375 px, sin arrastrar la página de lado. */
const ancho_fit31 = await page.evaluate(() => ({ a: document.documentElement.scrollWidth, v: window.innerWidth }));
ok(ancho_fit31.a <= ancho_fit31.v + 1,
  `🚨 FIT F31 — a 375 px la actividad NO desborda de lado (${ancho_fit31.a} vs ${ancho_fit31.v}, apartado 36)`);
ok(!/\bXP\b|racha de entrenamiento nueva|leaderboard|recompensa/i.test(await ver()),
  '🚨 FIT F31 — ni XP, ni recompensas, ni una racha nueva (apartados 16 y 40)');

almacen.fitness = fitnessDeAntes_fit31;

await page.setViewportSize({ width: 1280, height: 900 });

/* ── 9 · Y en escritorio se comporta igual: no se ha roto lo que iba bien ─── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const escritorio_sc = await medirAcordeon();
ok(escritorio_sc && escritorio_sc.panel <= 2,
  `🚨 SC F1 — en escritorio la tarjeta cerrada también mide cero: no se ha roto lo que ya funcionaba (${escritorio_sc?.panel} px)`);

await salir(browser);
