import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { avisarEnDesarrollo } from './lib/validacionCatalogo';

/* 🔓 FIT F35, apartado 25 — en desarrollo, el catálogo de ejercicios se valida
   al arrancar: un error sale en la consola como error —y el recorrido de
   Chromium lo cuenta como fallo— y los avisos, en una línea. En producción
   `import.meta.env.DEV` es `false` y no corre: el build ya se ha negado a
   salir con un error (vite.config.js). */
if (import.meta.env.DEV) avisarEnDesarrollo();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
