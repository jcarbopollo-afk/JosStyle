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
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CONNECTION/.test(m.text())) errores.push(m.text()); });

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
await pulsar('Además');
await page.waitForTimeout(500);
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
await pulsar('Además');
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
await pulsar('Además');
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
for (const nombre of ['Hábitos', 'Pomodoro', 'Tareas', 'Metas', 'Objetivos', 'Rutinas']) {
  ok(new RegExp(nombre, 'i').test(lanzador_pr1), `⚠️ y ${nombre} es una de ellas`);
}
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

/* Y una mini-app de las que ya existían, para comprobar que no se han tocado. */
ok(await pulsar('Abrir Tareas'), 'se entra en Tareas');
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

await pulsar('Vida');
await pulsar('Productividad');
ok(await pulsar('Abrir Tareas'), 'Tareas se abre');

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

/* Apartado 5: la prioridad determinista — lo vencido primero. */
ok(/Para hoy/i.test(centro_pr7), '⚠️ y la sección PARA HOY');
const posVencida = centro_pr7.indexOf('Llamar al dentista');
const posAlta = centro_pr7.indexOf('Estudiar biología');
ok(posVencida > -1 && posAlta > -1 && posVencida < posAlta,
  '🚨 Y LA TAREA VENCIDA VA ANTES QUE LA DE ALTA PRIORIDAD: el orden literal del enunciado');

/* Apartado 1: los seis cuadraditos con información real. */
ok(/1\/2 hoy/i.test(centro_pr7), '🚨 el cuadradito de Hábitos dice "1/2 hoy"');
ok(/2 pendientes/i.test(centro_pr7), '⚠️ el de Tareas, sus pendientes');
ok(/2 sesiones/i.test(centro_pr7), '⚠️ el de Pomodoro, sus sesiones de hoy');
ok(/1 activa/i.test(centro_pr7), '⚠️ el de Metas, las activas');
ok(/⭐ Mejorar mi físico/i.test(centro_pr7), '⚠️ y el de Objetivos destaca el principal');

/* Apartado 6: la cadena Objetivo → Meta → Tarea. */
ok(/De tus objetivos a hoy/i.test(centro_pr7), '⚠️ y se ve la cadena Objetivo → Meta → Tarea');
ok(/8 \/ 15/.test(centro_pr7), '⚠️ con el progreso de la meta');

/* 🚨 Completar algo tiene que MOVER el número. */
ok(await pulsar('Abrir Tareas'), 'se entra en Tareas');
ok(await pulsar('Completar Estudiar biología'), 'y se completa una tarea');
await page.waitForTimeout(900);
ok(await pulsar('Volver a Productividad'), 'se vuelve al centro de control');
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
const hub_bn = await esperarTexto(/Mi salud/i);
ok(/Mi salud/i.test(hub_bn), '🚨 Y DENTRO NO SE REPITE EL NOMBRE: la tarjeta es «Mi salud» (apartado 3)');
ok(/Sueño/i.test(hub_bn) && /Nutrición/i.test(hub_bn),
  '⚠️ con el resto del área intacto: no se ha movido ningún módulo');
ok(/71\.5 kg/i.test(hub_bn), '⚠️ y la tarjeta enseña su último peso de verdad');

ok(await pulsar('Abrir Mi salud'), 'se entra en Mi salud');
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
ok(!/(^|[^a-zA-ZáéíóúñÁÉÍÓÚÑ])Salud([^a-zA-ZáéíóúñÁÉÍÓÚÑ]|$)/.test(plegado_bn.replace(/Analizar mi salud/gi, '')),
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
await pulsar('Además');
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
await pulsar('Además');
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
await pulsar('Además');
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

/* ── Además, con sus cinco cosas y ni una más ─────────────────────────────── */
ok(await pulsar('Además'), '🚨 NAV F1 — la pestaña se llama «Además»');
const ademas_n1 = await esperarTexto(/Relaci[oó]n/i);
for (const rotulo of [/Relaci[oó]n/i, /\bFe\b/, /Bienestar digital/i, /N[uú]meros/i, /Ajustes/i]) {
  ok(rotulo.test(ademas_n1), `⚠️ Además tiene ${rotulo.source}`);
}
// 🚨 Y el apartado de estilo YA NO está aquí: se ha mudado a Bienestar.
ok(!/Imagen personal/i.test(ademas_n1),
  '🚨 El apartado de estilo ya no está en Además — se ha mudado, no duplicado');

/* ── Números: una puerta donde había tres ─────────────────────────────────── */
ok(await pulsar('Números'), '🚨 se abre NÚMEROS');
const num_n1 = await esperarTexto(/Estad[ií]sticas/i);
for (const rotulo of [/Estad[ií]sticas/i, /Predicciones/i, /Logros/i]) {
  ok(rotulo.test(num_n1), `⚠️ Números contiene ${rotulo.source}`);
}

// 🚨 Y las tres ABREN DE VERDAD la pantalla de siempre, que es lo que ninguna
// prueba de Node puede decir.
ok(await pulsar('Logros'), 'se abre Logros desde dentro de Números');
const logros_n1 = await esperarTexto(/Logros|Insignias|Mapa/i);
ok(/Logros|Insignias|Mapa/i.test(logros_n1), '🚨 …y es la pantalla de Logros de siempre, no una copia');
ok(await pulsar('Números'), 'y se vuelve a Números con su botón');
await esperarTexto(/Predicciones/i);

/* ── El apartado de estilo, ahora en Bienestar ────────────────────────────── */
ok(await pulsar('Bienestar'), '🚨 se entra en el área BIENESTAR');
const bien_n1 = await esperarTexto(/Mi salud/i);
ok(/Imagen personal/i.test(bien_n1),
  '🚨 NAV F1 — el apartado de estilo vive ahora en Bienestar');
ok(/Mi salud/i.test(bien_n1) && /Sue[nñ]o/i.test(bien_n1) && /Nutrici[oó]n/i.test(bien_n1),
  '⚠️ …sin haberse llevado por delante nada de lo que ya había ahí');

/* ── Calendario y Horario, ahora en Gestión ───────────────────────────────── */
ok(await pulsar('Gestión'), '🚨 se entra en GESTIÓN');
const ges_n1 = await esperarTexto(/Econom[ií]a/i);
ok(/Calendario/i.test(ges_n1), '🚨 Calendario está en Gestión');
ok(/Horario/i.test(ges_n1), '🚨 Horario está en Gestión');

// 🚨 Y lo que más importa: **el dato sigue ahí**. Mover un módulo de área es
// navegación; si esta fase hubiera tocado una clave, lo guardado se habría
// quedado huérfano.
ok(await pulsar('Calendario'), 'se abre el Calendario desde su sitio nuevo');
const cal_n1 = await esperarTexto(/HOY|Mes|Agenda/i);
ok(/HOY|Mes|Agenda/i.test(cal_n1), '🚨 …y es el Calendario entero, con sus datos');

ok(await pulsar('Vida'), 'se entra en VIDA');
const vida_n1 = await esperarTexto(/Diario|Biblioteca/i);
ok(!/Calendario/i.test(vida_n1) && !/Horario/i.test(vida_n1),
  '⚠️ …y Calendario y Horario NO siguen también en Vida: un módulo vive en un área, o se ve dos veces');
ok(/Diario/i.test(vida_n1) && /Biblioteca/i.test(vida_n1) && /Rachas/i.test(vida_n1),
  '⚠️ Vida conserva Diario, Biblioteca y Rachas');

/* ── Ajustes sigue funcionando dentro de Además ───────────────────────────── */
await pulsar('Además');
await esperarTexto(/Ajustes/i);
ok(await pulsar('Ajustes'), '🚨 Ajustes se abre desde Además');
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
await pulsar('Vida');
ok(await pulsar('Productividad'), 'se abre Productividad');
ok(await pulsar('Tareas'), 'y la mini-app Tareas');
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
await pulsar('Vida');
await pulsar('Productividad');
await pulsar('Tareas');
const tras_f4 = await esperarTexto(/Tarea que se queda/i);
ok(!/Tarea que quiero borrar/i.test(tras_f4),
  '🚨 …y SIGUE BORRADA DESPUÉS DE RECARGAR: no era un ocultar visual');

/* ── El icono de Hábitos ──────────────────────────────────────────────────── */
/* 🐛 `pulsar('Productividad')` no vuelve al lanzador: dentro de una mini-app el
   botón de volver es de solo icono y se llama **«Volver a Productividad»** —
   `pulsar` compara el `aria-label` ENTERO, así que hay que darle el nombre
   exacto. Tercera vez de la misma lección en dos fases. */
ok(await pulsar('Volver a Productividad'), 'se vuelve al lanzador de Productividad');
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

await salir(browser);
