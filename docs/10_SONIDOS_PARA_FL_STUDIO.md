# LOS SONIDOS — lo que hay que producir

> **Para ti, Josué, con el FL Studio delante.** Esto no es una idea de cómo deberían sonar: es la
> lista exacta de archivos que la aplicación va a buscar, con su nombre, su duración y su
> carácter. **El día que estén en la carpeta, suenan sin tocar una línea de código.**
>
> 🚨 Se genera desde `src/lib/especificacionSonidos.js`. No lo edites a mano.

---

## Lo primero, en tres líneas

1. Exporta cada sonido en **MP3**, con el nombre exacto de la lista de abajo.
2. Déjalos todos en la carpeta **`public/sonidos/`** del proyecto.
3. Ninguno debe pasar de **60 KB**. Son sonidos cortos: si uno pesa más, es que dura de más.

**No hace falta que estén todos para empezar a oír algo.** Con los cinco de interfaz ya se nota al
usar la aplicación, y el resto puede ir llegando.

## Cómo tienen que sonar

**Sí:** premium · tecnológico · deportivo · elegante · motivacional · progreso · satisfacción.

**No:** infantil · arcade excesivo · molesto · demasiado largo · genérico · alarma agresiva.

> ⚠️ El que más se cuela es **"demasiado largo"**. Un clic de interfaz se va a oír doscientas
> veces al día: si dura 300 ms en vez de 80, cansa a la semana. Cuando dudes, corta.

## Firma de JosStyle

**3 notas**, definidas como **intervalos** y no como notas concretas —así puedes
tocarlas en la tonalidad que quieras y siguen reconociéndose:

```
intervalos: 0 · 5 · 7  (semitonos desde la nota base)
ejemplo en Do:  Do → Fa → Sol
```

Es una **cuarta justa ascendente más una segunda mayor**: abierta, sin resolver. Deja sitio para
que las versiones grandes la completen hacia arriba.

**Cómo aparece según la importancia del momento:**

| Nivel | Cómo suena la firma |
|---|---|
| logro | Las tres notas, limpias. |
| record | Las tres notas y la octava, más cuerpo. |
| milestone_medio | Las tres notas con una capa debajo. |
| milestone_grande | La firma completa, resuelta hacia arriba. |
| gran_logro | La firma completa con cola larga. |

Y estos son los **ocho sonidos donde tiene que aparecer** — son los que hacen que todo suene del
mismo producto:

`level_up` · `achievement_unlocked` · `personal_record` · `grand_achievement` · `streak_milestone_30` · `streak_milestone_100` · `streak_milestone_365` · `reward_major`

## Cuánto dura cada cosa

| Tramo | Duración |
|---|---|
| Microinteracción | 40–150 ms |
| Feedback | 100–300 ms |
| Recompensa | 250–700 ms |
| Milestone | 500–1200 ms |
| Gran logro | 800–2000 ms |

| Familia | Duración | Nota |
|---|---|---|
| Interfaz (`ui`) | 40–150 ms | |
| Confirmación (`feedback`) | 100–300 ms | |
| Progreso (`progress`) | 150–400 ms | |
| Recompensa (`reward`) | 250–700 ms | |
| Racha (`streak`) | 250–1200 ms | |
| Logro (`achievement`) | 500–2000 ms | |
| Aviso (`warning`) | 150–500 ms | |
| Sistema (`system`) | 80–400 ms | |

> ⚠️ Cuando las dos cosas se pisan, **manda la más estricta**. Un `ui_click` cumpliría "feedback"
> con 300 ms y aun así se solaparía con el siguiente toque. En la lista de abajo ya está resuelto:
> el rango que aparece es el bueno.

## Los archivos

**46 en total.** Los marcados 🔒 son **únicos**: sin variantes, a propósito. Un récord
con tres versiones deja de ser un momento.

### Interfaz

| Archivo | Duración | |
|---|---|---|
| `ui_click_01.mp3` | 40–150 ms |  |
| `ui_click_02.mp3` | 40–150 ms |  |
| `ui_click_03.mp3` | 40–150 ms |  |
| `ui_toggle_on.mp3` | 40–150 ms |  |
| `ui_toggle_off.mp3` | 40–150 ms |  |
| `ui_open_01.mp3` | 40–150 ms |  |
| `ui_open_02.mp3` | 40–150 ms |  |
| `ui_close_01.mp3` | 40–150 ms |  |
| `ui_close_02.mp3` | 40–150 ms |  |

### Confirmación

| Archivo | Duración | |
|---|---|---|
| `success_01.mp3` | 100–300 ms |  |
| `success_02.mp3` | 100–300 ms |  |
| `save_01.mp3` | 100–300 ms |  |
| `save_02.mp3` | 100–300 ms |  |

### Progreso

| Archivo | Duración | |
|---|---|---|
| `task_complete_01.mp3` | 150–300 ms |  |
| `task_complete_02.mp3` | 150–300 ms |  |
| `habit_complete_01.mp3` | 150–300 ms |  |
| `habit_complete_02.mp3` | 150–300 ms |  |
| `goal_progress_01.mp3` | 150–300 ms |  |
| `goal_progress_02.mp3` | 150–300 ms |  |

### Recompensa

| Archivo | Duración | |
|---|---|---|
| `level_up.mp3` | 250–700 ms | 🔒 único · 🎵 lleva la firma |

### Racha

| Archivo | Duración | |
|---|---|---|
| `streak_start.mp3` | 250–700 ms |  |
| `streak_increment_01.mp3` | 250–700 ms |  |
| `streak_increment_02.mp3` | 250–700 ms |  |
| `streak_increment_03.mp3` | 250–700 ms |  |
| `streak_recovered.mp3` | 250–700 ms |  |
| `streak_milestone_03.mp3` | 250–700 ms |  |
| `streak_milestone_07.mp3` | 500–1200 ms |  |
| `streak_milestone_14.mp3` | 500–1200 ms |  |
| `streak_milestone_21.mp3` | 500–1200 ms |  |
| `streak_milestone_30.mp3` | 500–1200 ms | 🔒 único · 🎵 lleva la firma |
| `streak_milestone_50.mp3` | 500–1200 ms | 🔒 único |
| `streak_milestone_75.mp3` | 500–1200 ms | 🔒 único |

### Logro

| Archivo | Duración | |
|---|---|---|
| `streak_milestone_100.mp3` | 800–2000 ms | 🔒 único · 🎵 lleva la firma |
| `streak_milestone_180.mp3` | 800–2000 ms | 🔒 único |
| `streak_milestone_365.mp3` | 800–2000 ms | 🔒 único · 🎵 lleva la firma |
| `personal_record.mp3` | 800–2000 ms | 🔒 único · 🎵 lleva la firma |
| `achievement_unlocked.mp3` | 500–1200 ms | 🔒 único · 🎵 lleva la firma |
| `badge_unlocked.mp3` | 500–1200 ms |  |
| `goal_complete.mp3` | 500–1200 ms | 🔒 único |
| `grand_achievement.mp3` | 800–2000 ms | 🔒 único · 🎵 lleva la firma |

### Aviso

| Archivo | Duración | |
|---|---|---|
| `error.mp3` | 150–300 ms |  |
| `warning.mp3` | 150–300 ms |  |
| `streak_at_risk.mp3` | 150–300 ms |  |

### Sistema

| Archivo | Duración | |
|---|---|---|
| `sync_complete.mp3` | 80–150 ms |  |
| `connection_lost.mp3` | 100–300 ms |  |
| `connection_restored.mp3` | 100–300 ms |  |

## Por dónde empezar

Si vas a hacer cinco y parar, que sean estos — son los que se oyen al usar la aplicación:

- `ui_click_01.mp3` (40–150 ms)
- `ui_click_02.mp3` (40–150 ms)
- `ui_click_03.mp3` (40–150 ms)
- `ui_toggle_on.mp3` (40–150 ms)
- `ui_toggle_off.mp3` (40–150 ms)

Después, por orden de lo que más se nota: las confirmaciones (`success`, `error`, `save`), los
completar (`task_complete`, `habit_complete`) y ya los grandes.

## Las variantes

Los sonidos que se repiten mucho llevan **varias versiones numeradas** (`ui_click_01`,
`ui_click_02`, `ui_click_03`). La aplicación va alternando sola.

No tienen que ser sonidos distintos: **el mismo con un pelín de variación** —medio semitono, un
poco menos de cuerpo— basta. Lo que cansa es la repetición idéntica, no el sonido.

---

## Cuando los tengas

Déjalos en `public/sonidos/` y enciende el sonido en **Ajustes → Sonido y respuesta**. Ahí mismo
tienes un **▶ Escuchar** por categoría que reproduce exactamente lo que sonará en la aplicación.

Si alguno no cumple su ficha —dura de más, pesa de más, se llama de otra forma— hay un validador
que lo dice: `validarArchivo()` en `especificacionSonidos.js`.
