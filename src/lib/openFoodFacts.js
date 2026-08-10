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

function round1(v) {
  return typeof v === 'number' ? Math.round(v * 10) / 10 : 0;
}
