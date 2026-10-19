// ============================================================================
// 👤 INICIO — LA FOTO DE PERFIL Y LA FILA «+ AÑADIR» (2026-10-18)
//
// Lo que se ve (tamaños, alineación a 320/390/820/1280 px, un nombre largo, la
// misma foto que Ajustes y que «+ Añadir» abre el ＋) está en la sección
// «👤 INICIO» del recorrido. Aquí, que la estructura no pueda volver atrás.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const DASH = leer('src/views/DashboardView.jsx');
const SET = leer('src/views/SettingsView.jsx');
const AV = leer('src/components/avatarPerfil.jsx');
const QA = leer('src/components/quickAdd.jsx');

console.log('\n1 · La foto de perfil en Inicio');
ok(/export function CirculoAvatar\(\{ perfil, accent, lado = 88/.test(AV), 'el círculo vive en UN componente compartido (`avatarPerfil.jsx`)');
ok(!/function CirculoAvatar/.test(SET) && /import \{ CirculoAvatar \} from '\.\.\/components\/avatarPerfil'/.test(SET) && /export \{ CirculoAvatar \}/.test(SET), '…Ajustes lo importa de ahí (sin una segunda copia) y lo sigue exportando');
ok(/import \{ CirculoAvatar \} from '\.\.\/components\/avatarPerfil'/.test(DASH), 'Inicio importa el mismo');
const cab = DASH.slice(DASH.indexOf('data-cabecera-inicio'), DASH.indexOf('</div>', DASH.indexOf('<CirculoAvatar')) );
ok(/<CirculoAvatar perfil=\{perfil\} accent=\{accent\} lado=\{56\} \/>/.test(cab), '🚨 con SU perfil (la misma `perfil.foto`) y el mismo tamaño que la cabecera de Ajustes (56)');
ok(/export function AvatarCabecera\(\{ perfil, accent, onCambiar, lado = 56 \}\)/.test(SET), '…que es 56 en Ajustes');
ok(/flex items-center justify-between gap-3" data-cabecera-inicio/.test(DASH), 'a la derecha del saludo, alineada con él');
ok(/<div className="min-w-0 flex-1">\s*<p className="text-sm capitalize"/.test(DASH) && /text-2xl font-extrabold mt-0\.5 break-words/.test(DASH), '…y el saludo con `min-w-0`: un nombre largo baja de línea en vez de empujar la foto');
ok(/\{saludoCompleto\(saludo, perfil\)\}/.test(DASH), 'el saludo es el de siempre');
ok(/esFotoValida\(perfil\?\.foto\)/.test(AV) && /inicialesDe\(perfil \|\| \{\}\)/.test(AV) && /<User size/.test(AV), 'sin foto: sus iniciales; sin nombre, el icono de persona (el mismo avatar por defecto que Ajustes)');
ok(!/saveData|app_data|localStorage/.test(AV.replace(/\/\*[\s\S]*?\*\//g, '')), 'no guarda nada: ni una segunda fuente de datos');

console.log('\n2 · La fila «+ Añadir»');
ok(/<BotonAnadir accent=\{accent\} onClick=\{\(\) => setCreandoHoy\(true\)\} fila \/>/.test(DASH), 'Inicio usa el MISMO botón, como fila, con la misma acción');
ok(!/<div className="flex justify-end">\s*<BotonAnadir/.test(DASH), '…sin el envoltorio que lo dejaba pequeño a la derecha');
const ba = QA.slice(QA.indexOf('export function BotonAnadir('), QA.indexOf('<Plus size={15} />'));
ok(/fila = false/.test(ba), 'la forma pequeña sigue siendo la de serie (el Calendario no cambia)');
ok(/'w-full flex items-center justify-center gap-1\.5 text-sm font-semibold rounded-3xl toque-44'/.test(ba), 'fila: todo el ancho, solo el + centrado, el radio de la fila de la situación actual');
ok(/background: COLORS\.surface, border: `1px solid \$\{COLORS\.border\}`, color: accent, padding: '0\.8rem 1\.1rem', minHeight: 52/.test(ba), '…con su superficie, su borde y su relleno, y compacta');
ok(/onClick=\{onClick\}/.test(ba) && /aria-label=\{texto\}/.test(ba), 'el mismo toque y el mismo nombre para VoiceOver');
ok(!/active:scale|animate-|transition/.test(ba), 'sin animaciones nuevas: la respuesta al toque es la de siempre');
const CAL = leer('src/views/CalendarView.jsx');
ok((CAL.match(/<BotonAnadir accent=\{accent\} onClick=\{onAnadir\} \/>/g) || []).length === 2, 'el Calendario lo sigue usando igual');

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
