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

import { spawn } from 'node:child_process';
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

const vite = spawn('npx', ['vite', '--port', String(PUERTO), '--host', '127.0.0.1'], { stdio: 'ignore' });
const esperarServidor = async () => {
  for (let i = 0; i < 40; i += 1) {
    try { const r = await fetch(`http://127.0.0.1:${PUERTO}/`); if (r.ok) return true; } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const salir = async (browser) => {
  if (browser) await browser.close();
  vite.kill('SIGTERM');
  if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
  console.log(`\n  ${n} comprobaciones correctas.`);
  process.exit(0);
};

ok(await esperarServidor(), 'El servidor de desarrollo arranca');

/* Un `estiloHombre` guardado, como el que ya tiene Josué en Supabase. Si la
   carga se rompe, esto NO llega a la pantalla — que es justo lo que pasaba. */
const ESTILO_GUARDADO = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['pelo', 'skincare'] },
  modulos: [
    { id: 'pelo', activo: true, orden: 0, config: {} },
    // EH F20 — Barba encendida, y todavía sin configurar: la entrada del apartado 1.
    { id: 'barba', activo: true, orden: 2, config: {} },
    /* ⚠️ Con el perfil de piel empezado: si no, Skincare enseña su puerta de
       entrada ("Configurar / Ahora no") y no se llega al panel. */
    { id: 'skincare', activo: true, orden: 1, config: { necesidadesPiel: 'hidratacion', complejidadPiel: 'basico' } },
  ],
  datos: {}, retirados: [],
};

/* Lo que "hay en Supabase" ahora mismo. Empieza con lo guardado y **se queda con
   lo que la app escriba**: así una recarga ve lo de antes, como en el móvil. */
const almacen = { estiloHombre: ESTILO_GUARDADO };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
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
const pulsar = async (txt) => {
  const b = page.locator(`text="${txt}"`).first();
  if (await b.count() === 0) return false;
  await b.click(); await page.waitForTimeout(600); return true;
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

await salir(browser);
