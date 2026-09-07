// Open Food Facts: base de datos pública y gratuita de productos por código de barras.
// No necesita API key. Se llama directamente desde el navegador del usuario (no desde este
// entorno de desarrollo, que no tiene acceso a red) — funcionará una vez la app esté desplegada.
export async function buscarProductoPorCodigoBarras(codigo) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codigo}.json`);
  if (!res.ok) throw new Error('No se pudo consultar Open Food Facts');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};
  // Valores por cada 100 g/ml del producto — el usuario ajusta luego según la cantidad real que come.
  return {
    nombre: p.product_name || p.generic_name || 'Producto sin nombre',
    marca: p.brands || '',
    por100g: {
      calorias: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
      proteinas: round1(n.proteins_100g),
      carbohidratos: round1(n.carbohydrates_100g),
      grasas: round1(n.fat_100g),
      fibra: round1(n.fiber_100g),
    },
    foto: p.image_front_small_url || p.image_small_url || null,
  };
}

/* Entrega 3 · Fase 36 (NU F4), apartado 3 — *"Crear un buscador de alimentos.
   Debe permitir buscar por nombre, marca o tipo"*.

   🚨 **Los valores no se inventan** (apartado 5): son los de la etiqueta, la
   misma fuente que ya usa el escáner. Sin clave y desde el navegador de Josué,
   como la búsqueda por código: aquí no hay secreto que exponer.

   ⚠️ Y **se descartan los productos sin calorías**: Open Food Facts tiene fichas
   a medio rellenar, y una con 0 kcal registraría un plato que no suma nada
   (regla 8). Mejor no ofrecerla que ofrecer un dato falso. */
export async function buscarAlimentosPorNombre(texto, limite = 12) {
  const q = String(texto || '').trim();
  if (q.length < 3) return [];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}`
    + `&search_simple=1&action=process&json=1&page_size=${limite}`
    + '&fields=code,product_name,generic_name,brands,nutriments';
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo consultar Open Food Facts');
  const data = await res.json();
  const productos = Array.isArray(data.products) ? data.products : [];
  return productos
    .map((p) => {
      const n = p.nutriments || {};
      const kcal = Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
      const nombre = p.product_name || p.generic_name || '';
      if (!nombre || !kcal) return null;
      return {
        codigo: p.code || '',
        nombre,
        marca: p.brands || '',
        por100g: {
          calorias: kcal,
          proteinas: round1(n.proteins_100g),
          carbohidratos: round1(n.carbohydrates_100g),
          grasas: round1(n.fat_100g),
          fibra: round1(n.fiber_100g),
        },
      };
    })
    .filter(Boolean);
}

function round1(v) {
  return typeof v === 'number' ? Math.round(v * 10) / 10 : 0;
}
