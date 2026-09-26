import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const PUERTO = 5288; const SUPA = 'https://ejemplo.supabase.co';
const vite = spawn('npx', ['vite', '--port', String(PUERTO), '--host', '127.0.0.1'], { stdio: 'ignore', cwd: process.cwd() });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PUERTO}/`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
const hoy = new Date().toLocaleDateString('sv-SE');
const menos = (d) => { const x = new Date(`${hoy}T12:00:00`); x.setDate(x.getDate() - d); return x.toLocaleDateString('sv-SE'); };
const serie = (id, reps, peso) => ({ id, origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 8, repsHasta: null, duracion: null, peso: null }, hecho: { reps, peso, duracion: null } });
const sesion = (id, d, series) => { const fecha = menos(d); const inicio = new Date(`${fecha}T18:00:00`).getTime(); return { id, nombre: 'Pecho F34', fecha, estado: 'completada', iniciadaEn: inicio, terminadaEn: inicio + 2400000, guardadaEn: inicio + 2460000, pausadoMs: 0, actual: 0, visibilidad: 'privado', notas: '', entorno: 'gym', origen: { tipo: 'plantilla', id: null, ejercicios: [{ id: `${id}-e`, exerciseId: 'press-banca-barra', orden: 0, modo: 'reps', notas: '', descanso: 90, sustituyeA: null, linea: { series: series.length, tipoCarga: 'externo' }, series }] } }; };
const almacen = { fitness: { sesiones: [sesion('a', 9, [serie('a1', 8, 60)]), sesion('b', 2, [serie('b1', 8, 62.5)])], favoritosEjercicios: ['press-banca-barra'], plantillas: [], objetivos: [] } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.route(`${SUPA}/**`, async (route) => {
  const url = route.request().url();
  if (url.includes('/auth/v1/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'x', token_type: 'bearer', expires_in: 3600, refresh_token: 'x', user: { id: 'u', email: 'p@e.t' } }) });
  if (url.includes('/rest/v1/app_data')) {
    if (route.request().method() !== 'GET') return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    const clave = decodeURIComponent(url).match(/key=eq\.([^&]+)/)?.[1];
    const valor = almacen[clave] ?? null;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valor ? { value: valor } : null) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});
await page.addInitScript(() => { localStorage.setItem('sb-ejemplo-auth-token', JSON.stringify({ access_token: 'x', token_type: 'bearer', refresh_token: 'x', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user: { id: 'u', email: 'p@e.t', aud: 'authenticated', role: 'authenticated' } })); });
await page.goto(`http://127.0.0.1:${PUERTO}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const pulsar = async (t) => { const r = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')]; const d = b.find(x => x.innerText.trim() === t) || b.find(x => x.innerText.includes(t)) || b.find(x => (x.getAttribute('aria-label')||'').trim() === t); if (!d) return false; d.click(); return true; }, t); await page.waitForTimeout(900); return r; };
const medir = (etq) => page.evaluate((etq) => {
  const W = window.innerWidth; const out = [];
  for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > W + 1) out.push({ tag: el.tagName, cls: (el.className && el.className.baseVal === undefined ? el.className : '').slice(0, 90), right: Math.round(r.right), w: Math.round(r.width), txt: (el.innerText || '').slice(0, 50).replace(/\n/g, ' | ') }); }
  return { etq, scroll: document.documentElement.scrollWidth, W, n: out.length, out: out.slice(0, 12) };
}, etq);
console.log(await pulsar('Bienestar'), await pulsar('Fitness'), await pulsar('Abrir Ejercicios'));
console.log(JSON.stringify(await medir('biblioteca'), null, 1));
