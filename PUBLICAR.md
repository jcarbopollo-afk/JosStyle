# PUBLICAR.md — la lista de antes de pulsar publicar

> **Para ti, Josué.** Esto sale de la **EH Fase 52/65**. No es un resumen bonito: es lo que hay que
> hacer, en orden, y lo que hay que mirar si algo sale mal. Lo que puedo comprobar yo, lo comprueba
> un comando. Lo que solo puedes comprobar tú, lo dice **con tu nombre** y no lo doy por bueno.

---

## Antes de nada: los entornos que hay

| | ¿Existe? | Dónde | Base de datos |
|---|---|---|---|
| 🧪 **Desarrollo** | Sí | Tu ordenador, `npm run dev` | **La de verdad**, la tuya de Supabase |
| 🧪 **Pruebas** | **No** | — | — |
| 🟢 **Producción** | Sí | Vercel | La tuya de Supabase |

🚨 **No hay entorno de pruebas, y conviene que lo sepas.** Solo hay un proyecto de Supabase: el tuyo.
Las vistas previas de Vercel (las URL que salen al subir una rama) **apuntan a esa misma base**, así
que sirven para *ver* la pantalla nueva, no para ensayar un cambio de datos.

Lo que lo sustituye es la **copia de seguridad automática de la Fase 46**: antes de migrar nada, se
guarda una copia, y si la migración falla se vuelve atrás sola. Por eso esa copia no es opcional.

---

## La lista, antes de pulsar publicar

### Lo que compruebo yo (siete)

```bash
bash scripts/verificar.sh
```

Ese comando solo ya cubre seis de las siete: **compila**, **los tests pasan**, **las migraciones
están revisadas**, **las variables están donde deben**, **la seguridad está comprobada** y **el login
funciona** (esa última en un Chromium de verdad). La séptima, la **copia de seguridad**, se hace sola
antes de cualquier migración.

Si sale `═══ TODO CORRECTO ═══`, esas siete están.

### Lo que solo puedes comprobar tú (cuatro)

- [ ] **Sincronización** — toca algo, cierra la aplicación del todo, vuelve a abrirla: tiene que
      seguir ahí.
- [ ] **PWA** — que se instale en la pantalla de inicio y se abra desde ahí.
- [ ] **Modo oscuro** — que no haya un solo texto que no se lea.
- [ ] **Datos antiguos intactos** — que tu armario, tus objetivos y tus rutinas sigan enteros después
      de actualizar.

⚠️ **No las he marcado, y no las voy a marcar.** Una lista de publicación con casillas marcadas por
buena voluntad es peor que no tener lista.

---

## Si algo sale mal: cómo volver atrás

Cuatro pasos, del más rápido al más raro:

1. **El código** → en Vercel, *Instant Rollback* al despliegue anterior. Segundos, y sin tocar nada
   más.
2. **El repositorio** → `git revert <commit>` y subir. **Nunca** `push --force` sobre `main`.
3. **Los datos** → `restaurarCopia(copia)`, con la copia que se hizo antes de migrar (Fase 46).
4. **La base de datos** → no hace falta. **Estilo de hombre no cambia el esquema**: 65 fases y cero
   líneas de SQL nuevas. Si algún día cambiara, habría que escribir el SQL inverso a mano *antes* de
   ejecutar el otro.

---

## Cuando ya está publicado

Los primeros días, mirar cuatro cosas: **errores**, **rendimiento**, **sincronización** y **qué te
molesta a ti usándolo**.

Y si aparece un fallo, clasificarlo antes de discutirlo:

| | Qué es | Qué se hace |
|---|---|---|
| 🔴 Crítico | Impide usar la aplicación | Volver atrás o corregir ya |
| 🟠 Importante | Afecta a una función | Corregir rápido |
| 🟡 Menor | Un detalle visual o de comportamiento | Programarlo |
| 🟢 Mejora | No es un error | Al backlog |

⚠️ **Y una idea nueva después de publicar se apunta, no se toca producción por un impulso.**

---

## Dos cosas que hoy no existen, dichas a la cara

- **No hay monitorización.** JC Fitness no tiene ninguna. Lo que hay son los errores de la consola del
  navegador y los registros de la función de IA en Vercel. Añadir un servicio externo significa
  mandarle datos, y eso se decide, no se cuela en la última fase.
- **Un fallo al guardar todavía no se ve en pantalla.** Desde esta fase, `saveData` **sí devuelve** si
  ha ido bien o mal — antes se lo tragaba con un mensaje en la consola y la aplicación seguía como si
  nada. Encender el aviso es el siguiente paso, y hasta que esté, el estado `error_guardado` sigue
  marcado como **no detectable** en el código, para que nadie lo lea como resuelto.

---

## Y un detalle del `schema.sql` que muerde

Los `create policy` del archivo **no llevan `if not exists`**. Volver a ejecutar el archivo entero da
error de *política duplicada*. Cada bloque dice *"si ya ejecutaste los anteriores, pega solo éste"* —
hazle caso.
