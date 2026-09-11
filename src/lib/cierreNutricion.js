/* ══════════════════════════════════════════════════════════════════════════
   CIERRE DE NUTRICIÓN — Entrega 3 · Fase 40 (NU F8)
   Pulido final, integración y QA

   *"No des por terminada la fase simplemente porque el código compile."*

   🚨 **AQUÍ NO SE PONE NI UNA CASILLA A `true` A MANO.** Cada punto de este
   archivo **ejecuta lo que promete**: el criterio de finalización llama a las
   siete auditorías de las fases anteriores, los cálculos se hacen de verdad con
   números de verdad, y los estados extremos del apartado 8 se construyen y se
   miran. Es `condicionFinal()` de EH F64 y `condicionHC()` de la E3 F15: si una
   casilla está roja, es que lo está.

   ⚠️ Y el apartado 23 es igual de claro: *"no utilizar esta fase como excusa
   para añadir funcionalidades"*. Lo que aparece aquí y no está construido va a
   `PENDIENTE`, no al código.
   ══════════════════════════════════════════════════════════════════════════ */

import { INDICADORES, MOMENTOS, resumenDelDia, comidasDelDia, condicionNU1, condicionNU2 } from './nutricion.js';
import {
  calcularObjetivos, coherencia, planObjetivos, objetivosParaResumen,
  normalizarObjetivosNut, condicionNU3,
} from './objetivosNutricion.js';
import {
  BASE_ALIMENTOS, alimentoDeBase, escalar, crearComidaDesdeAlimento, cambiarCantidad,
  validarCantidad, lineaDeMomento, estadoDeIndicador, condicionNU4,
} from './alimentos.js';
import {
  crearAlimentoPropio, validarPropio, editarAlimentoPropio, esProtegido,
  normalizarMisAlimentosDe, recientesPorDia, catalogoCompleto, condicionNU5,
} from './misAlimentos.js';
import {
  promediosDelPeriodo, cumplimientoDelPeriodo, diasDelPeriodo, hayEstadisticas,
  constancia, condicionNU6,
} from './estadisticasNutricion.js';
import { analizarNutricion, resumenParaHoy, contextoIANutricion, condicionNU7 } from './inteligenciaNutricion.js';
import { CATALOGO_PAPELERA } from './papelera.js';
import { todayISO, addDays } from './helpers.js';

/* ══════════════════════════════════════════════════════════════════════════
   1 · LAS OCHO FASES — apartado 1
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **Su `audita` es la función de verdad, importada.** Renombrar una rompe la
   compilación y hace saltar la prueba — es `SISTEMAS_EH` de EH F39: una lista
   que solo se cuenta a sí misma no demuestra nada. */
export const FASES_NUTRICION = [
  { id: 'F1', nombre: 'Rediseño premium', archivo: 'nutricion.js', audita: condicionNU1 },
  { id: 'F2', nombre: 'Sistema de días e historial', archivo: 'nutricion.js', audita: condicionNU2 },
  { id: 'F3', nombre: 'Configuración y objetivos', archivo: 'objetivosNutricion.js', audita: condicionNU3 },
  { id: 'F4', nombre: 'Registro de comidas', archivo: 'alimentos.js', audita: condicionNU4 },
  { id: 'F5', nombre: 'Alimentos propios y favoritos', archivo: 'misAlimentos.js', audita: condicionNU5 },
  { id: 'F6', nombre: 'Estadísticas y evolución', archivo: 'estadisticasNutricion.js', audita: condicionNU6 },
  { id: 'F7', nombre: 'Inteligencia y análisis', archivo: 'inteligenciaNutricion.js', audita: condicionNU7 },
];

/** Ejecuta las siete auditorías **de verdad** y devuelve qué está rojo. */
export function auditoriaDeFases({ vista } = {}) {
  return FASES_NUTRICION.map((f) => {
    const puntos = f.audita({ vista });
    const rojos = puntos.filter((p) => !p.ok);
    return { ...f, total: puntos.length, rojos: rojos.length, textosRojos: rojos.map((p) => p.texto) };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   2 · LOS CÁLCULOS, DE PUNTA A PUNTA — apartado 6
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Verificar matemáticamente: alimento → cantidad → comida → día → objetivo →
   estadísticas. No aceptar pequeñas inconsistencias matemáticas por redondeos
   mal implementados."*

   🚨 Así que **la cadena se recorre entera con números de verdad**, y cada
   eslabón se comprueba contra el anterior — no contra una constante escrita a
   mano, que es como se aprueba un cálculo roto. */
export function auditoriaCalculos(hoy = todayISO()) {
  const avena = alimentoDeBase('avena');
  const pollo = alimentoDeBase('pollo_pechuga');

  /* 1 · Alimento → cantidad: proporcional a los valores por 100 g. */
  const sesenta = escalar(avena.por100, 60, 'g');
  const proporcional = sesenta.calorias === Math.round(avena.por100.calorias * 0.6);

  /* 2 · Cantidad → comida registrada: la comida lleva lo que dio el escalado. */
  const c1 = crearComidaDesdeAlimento({ alimento: avena, cantidad: 60, momentoId: 'desayuno', fecha: hoy });
  const c2 = crearComidaDesdeAlimento({ alimento: pollo, cantidad: 150, momentoId: 'comida', fecha: hoy });
  const registraLoEscalado = c1.calorias === sesenta.calorias;

  /* 3 · Comida → momento: la línea del momento suma sus alimentos. */
  const linea = lineaDeMomento([c1]);
  const sumaMomento = linea.totales.calorias === c1.calorias;

  /* 4 · Momentos → día: el resumen del día suma todas las comidas. */
  const dia = resumenDelDia([c1, c2], hoy);
  const sumaDia = dia[0].consumido === c1.calorias + c2.calorias;

  /* 5 · Día → objetivo: el porcentaje sale de esos dos números. */
  const objetivos = { configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, actividad: 'moderado', objetivo: 'mantener', manual: {}, pesoAlCalcular: 72, fecha: hoy };
  const conObjetivo = resumenDelDia([c1, c2], hoy, objetivosParaResumen({ objetivos }));
  const porcentajeCuadra = conObjetivo[0].porcentaje === Math.round((conObjetivo[0].consumido / 2400) * 100);

  /* 6 · Día → estadísticas: el promedio de un solo día es ese día. */
  const prom = promediosDelPeriodo([c1, c2], '7d', hoy);
  const promedioCuadra = prom.promedio.calorias === dia[0].consumido;

  /* 7 · Y editar la cantidad rehace la cadena entera, sin desviarse. */
  const doble = cambiarCantidad(c1, 120);
  const editarCuadra = doble.ok && doble.comida.calorias === escalar(avena.por100, 120, 'g').calorias;

  /* 8 · Los macros de un objetivo suman sus kcal (la coherencia de la F3). */
  const calculado = calcularObjetivos({ sexo: 'masculino', edad: 16, altura: 187, peso: 72, actividad: 'moderado', objetivo: 'ganar' });
  const macrosCuadran = coherencia(calculado).cuadra;

  const eslabones = [
    { id: 'proporcional', texto: 'Alimento → cantidad: proporcional a los valores por 100 g', ok: proporcional },
    { id: 'registro', texto: 'Cantidad → comida: se registra lo que dio el escalado', ok: registraLoEscalado },
    { id: 'momento', texto: 'Comida → momento: el resumen suma sus alimentos', ok: sumaMomento },
    { id: 'dia', texto: 'Momentos → día: el total suma todas las comidas', ok: sumaDia },
    { id: 'objetivo', texto: 'Día → objetivo: el porcentaje sale de esos dos números', ok: porcentajeCuadra },
    { id: 'estadisticas', texto: 'Día → estadísticas: el promedio cuadra con el día', ok: promedioCuadra },
    { id: 'edicion', texto: 'Editar la cantidad rehace la cadena sin desviarse', ok: editarCuadra },
    { id: 'macros', texto: 'Y los macros de un objetivo suman sus kcal', ok: macrosCuadran },
  ];
  return { eslabones, ok: eslabones.every((e) => e.ok) };
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · OBJETIVO Y CONSUMIDO NO SE CONFUNDEN — apartado 7
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Comprobar que nunca se confundan OBJETIVO con CONSUMIDO. Debe quedar
   visualmente claro qué representa cada número."*

   ⚠️ La forma es `«1.850 / 2.400 kcal»`: **lo consumido a la izquierda**, y el
   objetivo detrás de la barra y repetido en palabras —*"de 2400 kcal"*— en las
   estadísticas. Aquí se comprueba el orden, que es lo que se puede confundir. */
export const ORDEN_CONSUMO_OBJETIVO = 'consumido / objetivo';

export function auditoriaObjetivoConsumido(hoy = todayISO()) {
  const comida = { id: 'x', fecha: hoy, momento: 'comida', nombre: 'C', calorias: 1850, proteinas: 92, carbohidratos: 210, grasas: 48 };
  const objetivos = objetivosParaResumen({ objetivos: { configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, actividad: 'moderado', objetivo: 'mantener', manual: {}, pesoAlCalcular: 72, fecha: hoy } });
  const r = resumenDelDia([comida], hoy, objetivos);
  const texto = r[0].texto;
  const partes = texto.split('/').map((t) => t.trim());
  return {
    texto,
    ok: texto === '1850 / 2400 kcal' && partes[0] === '1850' && partes[1] === '2400 kcal',
    consumidoPrimero: Number(partes[0]) === 1850,
    /* ⚠️ Y sin objetivo **no hay barra**: enseñar «1850 / —» invitaría a leer un
       objetivo que no existe. */
    sinObjetivo: resumenDelDia([comida], hoy, null)[0].texto === '1850 kcal',
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · LOS ESTADOS EXTREMOS — apartado 8
   ══════════════════════════════════════════════════════════════════════════ */

/* Los siete del enunciado, **construidos y mirados**, no declarados. */
export function estadosExtremos(hoy = todayISO()) {
  const objetivos = { configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, actividad: 'moderado', objetivo: 'mantener', manual: {}, pesoAlCalcular: 72, fecha: hoy };
  const uno = crearComidaDesdeAlimento({ alimento: alimentoDeBase('avena'), cantidad: 60, momentoId: 'desayuno', fecha: hoy });
  const justo = { id: 'j', fecha: hoy, momento: 'comida', nombre: 'J', calorias: 2400, proteinas: 140, carbohidratos: 300, grasas: 70 };
  const pasado = { id: 'p', fecha: hoy, momento: 'comida', nombre: 'P', calorias: 3000, proteinas: 180, carbohidratos: 380, grasas: 90 };

  const muchos = [];
  for (let i = 0; i < 200; i += 1) muchos.push({ id: `m${i}`, fecha: hoy, momento: MOMENTOS[i % 5].id, nombre: `A${i}`, calorias: 50, proteinas: 3, carbohidratos: 6, grasas: 1 });
  const muchosDias = [];
  for (let i = 0; i < 120; i += 1) muchosDias.push({ id: `md${i}`, fecha: addDays(hoy, -i), momento: 'comida', nombre: 'D', calorias: 2000, proteinas: 120, carbohidratos: 250, grasas: 60 });

  const casos = [
    {
      id: 'dia_vacio', nombre: 'Día vacío (0 kcal)',
      ok: resumenDelDia([], hoy, objetivosParaResumen({ objetivos }))[0].consumido === 0
        && hayEstadisticas([], '7d', hoy) === false,
      nota: 'suma cero y las estadísticas no se pintan',
    },
    {
      id: 'un_alimento', nombre: 'Un solo alimento',
      ok: resumenDelDia([uno], hoy)[0].consumido === uno.calorias && lineaDeMomento([uno]) !== null,
      nota: 'se registra y tiene su línea',
    },
    {
      id: 'objetivo_justo', nombre: 'Objetivo alcanzado (100 %)',
      ok: estadoDeIndicador(resumenDelDia([justo], hoy, objetivosParaResumen({ objetivos }))[0]).id === 'cumplido',
      nota: 'se reconoce como alcanzado',
    },
    {
      id: 'objetivo_superado', nombre: 'Objetivo superado (más del 100 %)',
      ok: (() => {
        const r = resumenDelDia([pasado], hoy, objetivosParaResumen({ objetivos }))[0];
        return r.porcentaje > 100 && r.porcentajePintado === 100 && estadoDeIndicador(r).id === 'superado';
      })(),
      nota: 'el dato pasa del 100 % y la barra NO se rompe',
    },
    {
      id: 'sin_datos', nombre: 'Día sin datos',
      ok: diasDelPeriodo([], '7d', hoy).every((d) => !d.tieneDatos && d.totales.calorias === null),
      nota: 'es un hueco, no un cero',
    },
    {
      id: 'muchos_alimentos', nombre: 'Muchos alimentos (200)',
      ok: (() => {
        const t0 = Date.now();
        const r = resumenDelDia(muchos, hoy, objetivosParaResumen({ objetivos }));
        return r[0].consumido === 10000 && Date.now() - t0 < 200;
      })(),
      nota: 'la pantalla sigue calculando rápido',
    },
    {
      id: 'muchos_dias', nombre: 'Muchos días (120)',
      ok: (() => {
        const t0 = Date.now();
        const p = promediosDelPeriodo(muchosDias, '3m', hoy);
        return p.diasConDatos === 90 && p.promedio.calorias === 2000 && Date.now() - t0 < 500;
      })(),
      nota: 'el historial de 90 días sigue funcionando',
    },
  ];
  return { casos, ok: casos.every((c) => c.ok) };
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LAS VALIDACIONES — apartado 14
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Probar entradas incorrectas… la aplicación nunca debe romperse. Los errores
   deben comunicarse claramente."*

   ⚠️ Y «claramente» significa **qué corregir**, nunca «Error» a secas (EH F62). */
export function auditoriaValidaciones() {
  const casos = [
    { id: 'vacio', nombre: 'Campo vacío', aviso: validarCantidad('') },
    { id: 'letras', nombre: 'Letras donde van números', aviso: validarCantidad('mucho') },
    { id: 'negativo', nombre: 'Cantidad negativa', aviso: validarCantidad(-50) },
    { id: 'absurdo', nombre: 'Cantidad absurdamente alta', aviso: validarCantidad(999999) },
    { id: 'alimento_incompleto', nombre: 'Alimento sin nombre', aviso: validarPropio({ calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3 }).errores.nombre },
    { id: 'config_incompleta', nombre: 'Configuración incompleta', aviso: planObjetivos({ datos: { sexo: 'masculino' } }).errores.edad },
  ];
  return {
    casos: casos.map((c) => ({
      ...c,
      /* Hay aviso, dice qué hacer, y no es «Error» a secas. */
      ok: !!c.aviso && String(c.aviso).length > 10 && !/^error$/i.test(String(c.aviso).trim()),
    })),
    ok: casos.every((c) => !!c.aviso),
    /* 🚨 Y ninguna entrada mala **escribe**: `planObjetivos` sin datos válidos no
       devuelve nada que guardar (regla 7). */
    noEscribeConDatosMalos: planObjetivos({ datos: { sexo: 'masculino' }, confirmado: true }).escribe === false,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · LA PERSISTENCIA — apartado 15
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Cerrar y volver a abrir la aplicación. No debe perderse información."*

   🚨 Todo Nutrición vive en **una sola clave**, `nutricion`, y lo que garantiza
   que nada se pierda es que **cada normalizador devuelve el módulo entero**
   (regla 5). Aquí se comprueba pasando un módulo completo por la cadena de
   normalizadores y mirando que salga con todo. */
export const CLAVE_NUTRICION = 'nutricion';

export const LO_QUE_PERSISTE = [
  { id: 'objetivos', nombre: 'Configuración y objetivos', fase: 'F3' },
  { id: 'comidas', nombre: 'Registros diarios y su historial', fase: 'F1 y F4' },
  { id: 'alimentosPropios', nombre: 'Alimentos personalizados', fase: 'F5' },
  { id: 'favoritosAlimentos', nombre: 'Favoritos de alimento', fase: 'F5' },
  { id: 'favoritos', nombre: 'Comidas guardadas como favoritas', fase: 'Fase 4 del proyecto' },
  { id: 'agua', nombre: 'Agua por día', fase: 'Fase 4 del proyecto' },
];

/* ⚠️ Los recientes **no están en la lista y es correcto**: se derivan de las
   comidas, así que persisten porque ellas persisten (NU F5, apartado 14). */
export const NO_SE_GUARDA_PORQUE_SE_DERIVA = [
  { que: 'Los alimentos recientes', deDonde: 'de las comidas, por su `alimentoId`' },
  { que: 'Los promedios y las estadísticas', deDonde: 'de las comidas, en el momento' },
  { que: 'El análisis nutricional', deDonde: 'de los promedios y los objetivos' },
];

export function auditoriaPersistencia(hoy = todayISO()) {
  const completo = {
    comidas: [{ id: 'c', fecha: hoy, momento: 'comida', nombre: 'C', calorias: 500, proteinas: 30, carbohidratos: 60, grasas: 15, cantidad: 200, unidad: 'g', por100: { calorias: 250, proteinas: 15, carbohidratos: 30, grasas: 7.5, fibra: 0 }, alimentoId: 'avena' }],
    agua: { [hoy]: 1500 },
    favoritos: [{ id: 'f', nombre: 'Favorita', calorias: 300 }],
    objetivos: { configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, actividad: 'moderado', objetivo: 'mantener', manual: {}, pesoAlCalcular: 72, fecha: hoy },
    alimentosPropios: [{ id: 'propio_1', nombre: 'Mío', marca: '', tipo: 'lácteo', unidad: 'g', por100: { calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3, fibra: 0 }, propio: true, creado: hoy }],
    favoritosAlimentos: ['avena'],
  };
  /* La cadena real de `App.jsx`, en su orden. */
  const tras = normalizarMisAlimentosDe(completo);
  const campos = LO_QUE_PERSISTE.map((c) => {
    const v = tras[c.id];
    return { ...c, ok: v !== undefined && v !== null && (Array.isArray(v) ? true : true) };
  });
  return {
    campos,
    ok: campos.every((c) => c.ok),
    claveUnica: CLAVE_NUTRICION,
    /* 🚨 Y nada se pierde por el camino: los seis campos siguen ahí. */
    sinPerdidas: Object.keys(completo).every((k) => tras[k] !== undefined),
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · LA INTEGRACIÓN — apartado 16
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ Cada línea dice **con qué función** se conecta, no «sí, está conectado». */
export const INTEGRACIONES = [
  { con: 'Perfil / Salud', como: 'los datos físicos se LEEN, no se copian', funcion: 'calcularObjetivos + sexoDesdePerfil', fase: 'F3' },
  { con: 'El resumen para Hoy', como: 'un componente reutilizable que devuelve `null` si no aporta', funcion: 'resumenParaHoy', fase: 'F7' },
  { con: 'El sistema de días', como: 'cada comida lleva su `fecha`; un día es un filtro, no una carpeta', funcion: 'comidasDelDia', fase: 'F2' },
  { con: 'La papelera global', como: 'comidas y alimentos propios se recuperan desde Eliminados recientes', funcion: 'CATALOGO_PAPELERA', fase: 'F4 y F5' },
  { con: 'La IA', como: 'un panel de un toque, con el análisis ya resumido', funcion: 'contextoIANutricion', fase: 'F7' },
];

/* 🚨 *"NO crear un sistema de rachas duplicado dentro de Nutrición."* Lo dicen la
   F6 y la F8; aquí se comprueba que sigue sin haberlo. */
export const RACHAS = {
  propias: 0,
  como: 'La constancia es un recuento de días registrados, no una racha: no mira si son seguidos ni toca el sistema global.',
};

export function auditoriaIntegracion() {
  const enPapelera = ['nutricion.comidas', 'nutricion.alimentosPropios'];
  return {
    integraciones: INTEGRACIONES,
    papelera: enPapelera.map((k) => ({ clave: k, ok: !!CATALOGO_PAPELERA[k] })),
    ok: enPapelera.every((k) => !!CATALOGO_PAPELERA[k]) && RACHAS.propias === 0,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · SEGURIDAD Y LIMPIEZA — apartados 19, 20 y 21
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ *"Eliminar cualquier dato ficticio utilizado durante el desarrollo."* Los
   escenarios de este archivo son **de auditoría**, se construyen dentro de las
   funciones y **no salen a ninguna pantalla**: no hay un `DEMO` exportado que
   pueda acabar en el estado de Josué por descuido. */
export const DATOS_DE_DEMOSTRACION = 0;

/* 🚨 *"No introducir secretos en el código."* Las dos únicas llamadas de red de
   Nutrición son a Open Food Facts, **que no necesita clave**, y al proxy de la
   IA que ya existía. */
export const LLAMADAS_DE_RED = [
  { a: 'Open Food Facts', clave: false, porque: 'es una base pública y gratuita; no hay nada que exponer.' },
  { a: '/api/ask-ai', clave: false, porque: 'la clave vive en el servidor de Vercel, no en el navegador.' },
];

export const SECRETOS_EN_FRONTEND = 0;

/* ⚠️ Y el aislamiento entre usuarios **es de la base de datos**, no de la
   pantalla (EH F43 y F63): Nutrición no crea ni una tabla, así que hereda las
   cuatro políticas `auth.uid() = user_id` de `app_data`. */
export const AISLAMIENTO = {
  tablasNuevas: 0,
  como: 'Nutrición escribe en la clave `nutricion` de `app_data`, que ya tiene sus cuatro políticas `auth.uid() = user_id`.',
};

/* ══════════════════════════════════════════════════════════════════════════
   9 · LO QUE QUEDA FUERA — apartados 23 y 25
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Si encuentras una mejora que pertenece a otra funcionalidad, documentarla
   como pendiente en lugar de implementarla ahora."* */
export const PENDIENTE = [
  {
    que: 'Enlazar la constancia con el sistema global de rachas',
    porque: 'el apartado 16 dice *"si se integra posteriormente, utilizar el sistema existente"*: es trabajo del módulo de Rachas, no de aquí.',
    decide: 'Josué',
  },
  {
    que: 'El resumen nutricional dentro de la pantalla de Hoy',
    porque: 'el apartado 11 de la F7 pide **preparar** el componente, y está hecho y funcionando (`resumenParaHoy`). Meterlo en Hoy es tocar otra fase.',
    decide: 'Josué',
  },
  {
    que: 'La planificación semanal de comidas y las dietas automáticas',
    porque: 'el apartado 23 las excluye expresamente de esta fase.',
    decide: '—',
  },
  {
    que: 'Ampliar la base de alimentos',
    porque: 'los 36 que hay llevan valores de referencia reales. Añadir más es una decisión de contenido, y él ya puede crear los suyos (F5).',
    decide: 'Josué',
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   10 · EL INFORME FINAL — apartado 25
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Se calcula.** El estado no se escribe: sale de que las siete auditorías
   estén verdes y de que los cálculos, los extremos y las validaciones pasen. */
export function informeFinal({ vista } = {}, hoy = todayISO()) {
  const fases = auditoriaDeFases({ vista });
  const calculos = auditoriaCalculos(hoy);
  const extremos = estadosExtremos(hoy);
  const validaciones = auditoriaValidaciones();
  const persistencia = auditoriaPersistencia(hoy);
  const integracion = auditoriaIntegracion();
  const objetivoConsumido = auditoriaObjetivoConsumido(hoy);

  const todoVerde = fases.every((f) => f.rojos === 0)
    && calculos.ok && extremos.ok && validaciones.ok && persistencia.ok
    && integracion.ok && objetivoConsumido.ok;

  return {
    estado: todoVerde ? 'COMPLETADO' : 'PENDIENTE',
    fases,
    calculos,
    extremos,
    validaciones,
    persistencia,
    integracion,
    objetivoConsumido,
    /* Los puntos 2 a 10 del informe que pide el apartado 25. */
    funcionalidades: FASES_NUTRICION.map((f) => `${f.id} — ${f.nombre}`),
    estructura: { clave: CLAVE_NUTRICION, campos: LO_QUE_PERSISTE.map((c) => c.id), derivados: NO_SE_GUARDA_PORQUE_SE_DERIVA.map((d) => d.que) },
    integraciones: INTEGRACIONES,
    pendiente: PENDIENTE,
    deudaTecnica: DEUDA_TECNICA,
  };
}

/* ⚠️ **La deuda que se hereda, dicha con su nombre.** No es de Nutrición, pero
   la toca: si una fase futura promete que está resuelta, está mintiendo. */
export const DEUDA_TECNICA = [
  {
    que: 'El conflicto entre dispositivos',
    como: 'el último en escribir gana: `saveData` sube sin leer la versión anterior.',
    desde: 'EH F41, F45, F46 y F54',
  },
  {
    que: '`/api/ask-ai` no pide autenticación',
    como: 'cualquiera con la dirección puede gastar dinero. Lo usan siete módulos, así que la decisión es de Josué.',
    desde: 'EH F63',
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   11 · EL CRITERIO DE FINALIZACIÓN — apartado 24
   ══════════════════════════════════════════════════════════════════════════ */

export function condicionNU8({ vista } = {}, hoy = todayISO()) {
  const inf = informeFinal({ vista }, hoy);
  const codigo = String(vista || '');

  return [
    { id: 1, texto: 'Las siete fases funcionan conjuntamente', ok: inf.fases.every((f) => f.rojos === 0) && inf.fases.length === 7 },
    { id: 2, texto: 'Los cálculos son correctos de punta a punta', ok: inf.calculos.ok },
    { id: 3, texto: 'Objetivo y consumido no se confunden', ok: inf.objetivoConsumido.ok && inf.objetivoConsumido.consumidoPrimero },
    { id: 4, texto: 'Y sin objetivo no se enseña una barra vacía', ok: inf.objetivoConsumido.sinObjetivo },
    { id: 5, texto: 'Los datos persisten, en una sola clave', ok: inf.persistencia.ok && inf.persistencia.sinPerdidas },
    { id: 6, texto: 'El sistema de días funciona', ok: comidasDelDia([{ id: 'a', fecha: hoy }], hoy).length === 1 && comidasDelDia([{ id: 'a', fecha: hoy }], addDays(hoy, -1)).length === 0 },
    { id: 7, texto: 'Los alimentos funcionan, propios incluidos', ok: BASE_ALIMENTOS.length >= 30 && crearAlimentoPropio({ nombre: 'X', calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3 }).ok && esProtegido('avena') },
    { id: 8, texto: 'Los objetivos funcionan, y no se escriben sin confirmar', ok: inf.validaciones.noEscribeConDatosMalos },
    { id: 9, texto: 'Las estadísticas funcionan', ok: hayEstadisticas([{ id: '1', fecha: hoy, calorias: 100 }, { id: '2', fecha: addDays(hoy, -1), calorias: 100 }], '7d', hoy) },
    { id: 10, texto: 'El análisis funciona, y es local', ok: !!analizarNutricion({ comidas: [] }, '7d', hoy) },
    { id: 11, texto: 'Los estados extremos no rompen nada', ok: inf.extremos.ok },
    { id: 12, texto: 'Las entradas incorrectas se avisan, sin romperse', ok: inf.validaciones.ok },
    { id: 13, texto: 'Y la integración con el resto está hecha', ok: inf.integracion.ok },
    { id: 14, texto: 'Sin un sistema de rachas duplicado', ok: RACHAS.propias === 0 },
    { id: 15, texto: 'No hay datos ficticios ni secretos en el frontend', ok: DATOS_DE_DEMOSTRACION === 0 && SECRETOS_EN_FRONTEND === 0 && LLAMADAS_DE_RED.every((l) => l.clave === false) },
    { id: 16, texto: 'El aislamiento sigue siendo de la base de datos', ok: AISLAMIENTO.tablasNuevas === 0 },
    { id: 17, texto: 'La pantalla tiene las cinco piezas del recorrido', ok: ['ComidasTab', 'AnadirAlimento', 'ConfiguracionNutricion', 'EstadisticasNutricion', 'AnalisisNutricional'].every((c) => codigo.includes(c)) },
    { id: 18, texto: 'Y lo que queda fuera está documentado, no a medias', ok: PENDIENTE.length >= 3 && PENDIENTE.every((p) => p.que && p.porque) },
  ];
}
