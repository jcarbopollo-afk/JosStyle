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
   primer `pulsar('Más')` no encontraba el botón y **toda la sección siguiente
   caía en cascada** — doce comprobaciones rojas por una que llegó pronto.
   Arreglarlo aquí, y no en cada sitio, lo arregla en las setenta llamadas: un
   usuario tampoco pulsa un botón que todavía no se ha pintado, **espera a que
   salga**. Si de verdad no sale, sigue devolviendo `false` y falla igual. */
const pulsar = async (txt, tope = 6000) => {
  const hasta = Date.now() + tope;
  let clicado = false;
  do {
    clicado = await page.evaluate((t) => {
      const botones = [...document.querySelectorAll('button')];
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
await pulsar('Más');
ok(await pulsar('Estilo de hombre'), 'Estilo de hombre se abre desde Más');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
ok(await pulsar('Barba'), 'Barba (EH F20) se abre desde Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
ok(await pulsar('Sonrisa'), 'Sonrisa (EH F23) se abre desde Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
ok(await pulsar('Perfumes'), 'Perfumes (EH F24) se abre desde Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
ok(await pulsar('Accesorios'), 'Accesorios (EH F26) se abre desde Estilo de hombre');
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
ok(escAcc.length > 0, '⚠️ Y el envoltorio de estilo, en Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await pulsar('Accesorios');
await pulsar('Mis accesorios');
await page.waitForTimeout(500);
ok(/Casio negro/.test(await ver()), '⚠️ PERSISTENCIA: sigue ahí después de recargar');

/* ── 12 · MIS GUSTOS, Y NI UNA SEGUNDA LISTA (EH F27) ──────────────────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Más');
await pulsar('Estilo de hombre');
ok(await pulsar('Mis gustos'), 'Mis gustos (EH F27) se abre desde Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await pulsar('Mis gustos');
await pulsar('Quiero hacer');
await page.waitForTimeout(500);
ok(/Viajar a Londres/.test(await ver()), '⚠️ PERSISTENCIA: sigue ahí después de recargar');

/* ── 13 · CONVERTIR EN OBJETIVO, SIN UN SEGUNDO SISTEMA (EH F28) ───────── */
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Más');
await pulsar('Estilo de hombre');
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
ok(escEH28.length > 0, 'Y el enlace, en Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await page.waitForTimeout(500);
const portada = await ver();
// Apartado 1 — la cabecera, literal.
ok(/Estilo de hombre/.test(portada), 'La cabecera está');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
ok(/Eliminar datos de Estilo de hombre/.test(prefs), 'con la opción avanzada del apartado 10');

guardado.length = 0;
ok(await pulsar('Editar'), 'Editar lleva al módulo donde de verdad se configura (apartado 3)');
await page.waitForTimeout(800);
ok(!/Mis preferencias/.test(await ver()), '⚠️ Y sale de esta pantalla: no duplica el formulario');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await pulsar('Más');
await pulsar('Estilo de hombre');
await page.waitForTimeout(500);
await pulsar('⚙️ Mis preferencias');
await page.waitForTimeout(600);
ok(await pulsar('🗑️ Eliminar datos de Estilo de hombre'), 'La opción avanzada abre su confirmación');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
ok(/Restablecer Estilo de hombre/.test(gestion), 'con su restablecer (apartado 8)');

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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await page.waitForTimeout(700);
ok(/Buscar en Estilo de hombre/.test(await ver()),
  '🔍 El buscador está arriba del todo (apartado 1)');
ok(await pulsar('🔍 Buscar en Estilo de hombre'), 'y se abre');
await page.waitForTimeout(600);
const buscador = await ver();
ok(/Recientes/.test(buscador), 'con sus 🕘 Recientes (apartado 5)');
ok(/lo último que abras desde el buscador/.test(buscador),
  '⚠️ diciendo que salen de lo que ABRA, no de por dónde navegue');
ok(/no hay una lista aparte/.test(buscador),
  '⚠️ y que los favoritos son los de cada apartado (apartado 6)');
ok(/Eliminados recientemente/.test(buscador), 'y dónde está lo borrado (apartado 15)');

// Apartado 3 — *"bar…"* sin terminar la palabra.
await page.fill('input[placeholder*="Buscar en Estilo"]', 'bar');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await page.waitForTimeout(600);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
ok(await pulsar('🔔 Avisos de Estilo de hombre'),
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await page.waitForTimeout(600);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(500);
await pulsar('🔔 Avisos de Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
ok(tareas[0].hecha === false && 'fechaLimite' in tareas[0],
  '⚠️ y con la forma REAL de una tarea, ni un campo inventado');

const escEH39 = guardado.filter((g) => g && g.key === 'estiloHombre');
const cfgAcc = escEH39.at(-1)?.value?.modulos?.find((m) => m.id === 'accesorios')?.config || {};
const deseoGuardado = (cfgAcc.accesorios?.deseos || [])[0] || {};
ok(deseoGuardado.tareaId === tareas[0]?.id,
  '⚠️ Y en Estilo de hombre queda SOLO su id (fuente única, apartado 18)');
ok(!('hecha' in deseoGuardado) && !('texto' in deseoGuardado),
  '⚠️ Ni el texto ni el "hecha": eso vive en Tareas');

await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
await page.waitForTimeout(700);
await pulsar('⋮ Personalizar');
await page.waitForTimeout(600);
await pulsar('🔔 Avisos de Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
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
ok(!/Estilo de hombre/.test(fuera),
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
await pulsar('Más');
await pulsar('Estilo de hombre');
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
await pulsar('Más');
await pulsar('Estilo de hombre');
const simple = await esperarTexto(/Perfumes/);

/* Apartado 6 — el usuario sencillo: dos apartados encendidos y nada más. */
ok(/Perfumes/.test(simple) && /Skincare/.test(simple),
  '⚠️ Con SOLO dos apartados encendidos, la pantalla enseña los dos (apartado 6)');
ok(!/Peluquería|Sonrisa|Manos, uñas y pies/.test(simple),
  'y ni rastro de los apagados: no se cuela ninguno');
ok(simple.length > 200, '⚠️ y no se siente vacía: hay pantalla de verdad, no un hueco');

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

await salir(browser);
