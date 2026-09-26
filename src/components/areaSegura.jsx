import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card } from './ui';

/* FIT F36, apartado 47 — «Errores parciales».
   ═══════════════════════════════════════════════════════════════════════════

   *"Si falla una parte —por ejemplo, Rangos— no debe desaparecer Progreso,
   Historial ni Entrenamiento. Mostrar error localizado."*

   🚨 Hasta esta fase **no había ni un límite de error en toda la aplicación**:
   una excepción al pintar Rangos subía hasta la raíz de React, que desmonta el
   árbol entero, y Josué se quedaba con la pantalla en blanco —sin Progreso, sin
   Entrenamiento y sin la barra de abajo para salir—. Las librerías ya se
   protegían con `seguro()` y `panelSeguro()` (E3 F29, F28, F34), pero eso cubre
   un cálculo, no el pintado de un componente.

   React solo tiene una forma de parar un error al pintar: un componente de
   clase con `getDerivedStateFromError`. Envuelve **cada área de Fitness por
   separado**, así que lo que se rompe es solo esa pestaña, con su frase y su
   «Reintentar»; las otras tres y la barra de abajo siguen funcionando.

   ⚠️ **No esconde el fallo**: lo manda a la consola con `console.error`, que es
   justo lo que el recorrido de Chromium cuenta como error. Un límite que callara
   convertiría un fallo de verdad en una pantalla que «funciona». Y al cambiar de
   área se limpia solo (`clave`): el error de Rangos no se queda pegado a
   Progreso. */

export class AreaSegura extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, clave: props.clave };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    /* Otra área, otro intento: un fallo de Rangos no puede tapar Progreso. */
    if (props.clave !== state.clave) return { error: null, clave: props.clave };
    return null;
  }

  componentDidCatch(error) {
    try {
      // eslint-disable-next-line no-console
      console.error(`[JosStyle] ${this.props.nombre || 'Una parte de Fitness'} no se ha podido pintar:`, error);
    } catch { /* la consola no puede tumbar nada */ }
  }

  render() {
    const { error } = this.state;
    const { nombre = 'Esta parte', children, accent } = this.props;
    if (!error) return children;
    return (
      <Card>
        <div role="alert" className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(COLORS.negative, 0.14) }}>
            <AlertTriangle size={17} style={{ color: COLORS.negative }} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>No se ha podido cargar {nombre}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              El resto de Fitness sigue funcionando, y tus datos no se han tocado.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold py-1.5 toque-44"
              style={{ color: accent || COLORS.info }}
            >
              <RotateCcw size={13} aria-hidden="true" />Reintentar
            </button>
          </div>
        </div>
      </Card>
    );
  }
}

/** Lo que la F36 pinta cuando una parte falla, para probarlo sin romper nada. */
export const TEXTOS_AREA_SEGURA = {
  titulo: (nombre) => `No se ha podido cargar ${nombre}`,
  texto: 'El resto de Fitness sigue funcionando, y tus datos no se han tocado.',
  reintentar: 'Reintentar',
};
