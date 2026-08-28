// Arranca la app de verdad en Chromium, con una sesión simulada y unos datos
// guardados, y comprueba que la ruta de carga TERMINA — que es justo lo que el
// import que faltaba rompía.
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:5177/';
const SUPA = 'https://ejemplo.supabase.co';

// Un `estiloHombre` guardado, como el que tendría Josué: Pelo y Skincare
// encendidos y el asistente terminado.
const ESTILO_GUARDADO = {
  configurado: true,
  asistente: { paso: 4, estado: 'terminado', seleccion: ['pelo', 'skincare'] },
  modulos: [
    { id: 'pelo', activo: true, orden: 0, config: {} },
    { id: 'skincare', activo: true, orden: 1, config: {} },
  ],
  datos: {}, retirados: [],
};

const GUARDADO = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', channel: 'chromium' });
const page = await browser.newPage();

const errores = [];
page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
page.on('pageerror', (e) => errores.push(`PAGEERROR: ${e.message}`));

// --- Supabase simulado -----------------------------------------------------
await page.route(`${SUPA}/**`, async (route) => {
  const url = route.request().url();
  if (url.includes('/auth/v1/token') || url.includes('/auth/v1/user')) {
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake', token_type: 'bearer', expires_in: 3600,
        refresh_token: 'fake', user: { id: 'usuario-prueba', email: 'jc@ejemplo.test' },
      }),
    });
  }
  if (url.includes('/rest/v1/app_data') && route.request().method() !== 'GET') {
    // Escrituras: se apuntan para comprobar la persistencia de verdad.
    try { GUARDADO.push(JSON.parse(route.request().postData() || '{}')); } catch { /* vacío */ }
    return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
  }
  if (url.includes('/rest/v1/app_data')) {
    const key = decodeURIComponent(url).match(/key=eq\.([^&]+)/)?.[1];
    const valor = key === 'estiloHombre' ? ESTILO_GUARDADO : null;
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(valor ? { value: valor } : null),
    });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});

// Sesión ya iniciada en localStorage, para no pasar por el login.
await page.addInitScript(() => {
  const ref = 'ejemplo';
  const sesion = {
    access_token: 'fake', token_type: 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600,
    refresh_token: 'fake',
    user: { id: 'usuario-prueba', email: 'jc@ejemplo.test', aud: 'authenticated', role: 'authenticated' },
  };
  localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(sesion));
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const pulsar = async (txt) => {
  const b = page.locator(`text="${txt}"`).first();
  if (await b.count() === 0) return false;
  await b.click(); await page.waitForTimeout(700); return true;
};
const ver = async () => (await page.evaluate(() => document.body.innerText));

console.log('\n──── 1. ARRANQUE ────');
console.log((await ver()).slice(0, 120).replace(/\n+/g, ' | '));

console.log('\n──── 2. MÁS → ESTILO DE HOMBRE ────');
console.log('pulsar "Más":', await pulsar('Más'));
console.log('pulsar "Estilo de hombre":', await pulsar('Estilo de hombre'));
console.log((await ver()).slice(0, 400));

console.log('\n──── 3. ABRIR PELO ────');
console.log('pulsar "Pelo":', await pulsar('Pelo'));
console.log((await ver()).slice(0, 500));

console.log('\n──── 4. ABRIR PELUQUERÍA (EH F11/F12) ────');
console.log('pulsar "Peluquería":', await pulsar('Peluquería'));
console.log((await ver()).slice(0, 600));

console.log('\n──── 5. PERSISTENCIA: registrar un corte con "Hoy" ────');
GUARDADO.length = 0;
console.log('pulsar "Hoy":', await pulsar('Hoy'));
await page.waitForTimeout(1200);
const escrituras = GUARDADO.filter((g) => g && g.key === 'estiloHombre');
console.log('escrituras de estiloHombre:', escrituras.length);
if (escrituras.length) {
  const pelo = escrituras.at(-1).value?.modulos?.find((m) => m.id === 'pelo');
  const cortes = pelo?.config?.pelo?.peluqueria?.cortes || [];
  console.log('cortes guardados en Supabase:', JSON.stringify(cortes));
}
console.log('\n──── 6. LO QUE SE VE DESPUÉS ────');
console.log((await ver()).slice(0, 260));

const texto = await ver();

console.log('\n──── ERRORES DE CONSOLA ────');
console.log(errores.length === 0 ? '(ninguno)' : errores.slice(0, 12).join('\n'));

await page.screenshot({ path: '/tmp/josstyle-arranque.png', fullPage: false });
console.log('\nCaptura: /tmp/josstyle-arranque.png');

await browser.close();
