import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Fase 11 — Biblioteca: extrae el texto de un PDF en el propio navegador (nunca sale del
// dispositivo) para poder buscar dentro de su contenido más tarde — la funcionalidad clave del
// Prompt Maestro para esta fase ("clave para el instituto"). Si el PDF es un escaneo sin texto
// real (solo imagen) no falla: simplemente devuelve una cadena vacía, y ese PDF concreto queda
// buscable solo por su título, en vez de romper la subida.
export async function extractPdfText(file) {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let texto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texto += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return texto.trim();
  } catch (e) {
    console.error('No se pudo extraer texto del PDF', e);
    return '';
  }
}
