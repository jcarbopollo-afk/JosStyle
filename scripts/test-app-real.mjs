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
    { id: 'skincare', activo: true, orden: 1, config: {} },
  ],
  datos: {}, retirados: [],
};

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
      try { guardado.push(JSON.parse(route.request().postData() || '{}')); } catch { /* vacío */ }
      return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    }
    const clave = decodeURIComponent(url).match(/key=eq\.([^&]+)/)?.[1];
    const valor = clave === 'estiloHombre' ? ESTILO_GUARDADO : null;
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

await salir(browser);
