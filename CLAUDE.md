# rzhub.es — gestión de jugadores

## Añadir/actualizar un jugador (sync_jugador.py)

Flujo de dos pasos, siempre desde `~/Desktop/lineup-zaragoza`:

```bash
python3 scripts/sync_jugador.py "Nombre del jugador"      # busca en FotMob, upsert en Supabase
node --env-file=.env.local scripts/upload-photos.js        # descarga foto y sube a Supabase Storage
```

Varios jugadores a la vez: pasar cada nombre como argumento separado, un solo paso 2 al final.

Flags:
- Sin flags → `is_zaragoza=true`, `is_cantera=false`
- `--no-zaragoza` → jugador que no es del Zaragoza (para añadir plantillas de otros equipos, o para dar de baja a alguien)
- `--cantera` → `is_cantera=true`

Traducción de lenguaje natural:
- "hemos fichado a X" → sin flags
- "X ya no es del Zaragoza" → `--no-zaragoza`
- "X es de cantera" → `--cantera`
- "añade la plantilla del [equipo]" → todos los nombres + `--no-zaragoza`

Si FotMob devuelve varios candidatos, el script pide elegir por número interactivamente (no funciona con stdin no interactivo salvo que se sepa de antemano qué número elegir).

## Movimientos de mercado (mercado.js)

```bash
node --env-file=.env.local scripts/mercado.js "Nombre" alta|baja "Club" POS
```

- `alta` = ficha por el Zaragoza (llega de `Club`) → `is_zaragoza=true`
- `baja` = sale del Zaragoza (se va a `Club`) → `is_zaragoza=false`
- `POS`: POR, DEF, MED o DEL — **pasarlo siempre explícito**. Si se omite, el script usa la posición ya guardada en `players`, o si tampoco existe, cae a `MED` por defecto — sin avisar.

## ⚠️ Bug conocido: posición vacía → se muestra como MED

La API de sugerencias de FotMob (`searchapi/suggest`, la que usa `sync_jugador.py`) casi nunca devuelve la posición del jugador salvo para clubes muy grandes. Eso deja `position=""` en Supabase, y el frontend (`src/hooks/usePlayers.js:32,49`) hace `position || 'MED'`, así que **todo jugador sin posición se muestra como centrocampista sin ningún error visible**. Ya pasó con una plantilla entera del Real Madrid y del Málaga CF.

**Después de un alta masiva de una plantilla externa, comprobar siempre:**

```bash
curl -s "https://gqslryreaiqmvnyyhwzf.supabase.co/rest/v1/players?is_zaragoza=eq.false&position=eq.&select=name" \
  -H "apikey: <SUPABASE_KEY>" -H "Authorization: Bearer <SUPABASE_KEY>"
```

Si aparece alguien, hay que rellenarle la posición a mano (`PATCH .../players?name=eq.<nombre>` con `{"position": "DEF"}` etc.), sacando el dato real de una fuente fiable — no adivinar.

- Para jugadores muy conocidos (galácticos, selecciones top): la posición se puede asignar directamente por conocimiento futbolístico, es estable aunque cambien de club.
- Para plantillas menos conocidas: mejor sacar el HTML crudo de la ficha de plantilla de Transfermarkt (`transfermarkt.es/<club>/kader/verein/<id>/saison_id/<año>/plus/1`) y buscar los `title="Portero|Defensa|Centrocampista|Delantero"` junto a cada nombre. **No usar WebFetch (resumen con modelo pequeño) para esto** — en la práctica ha deformado nombres (p. ej. "Fernando Cabero" → "Calero", "Pablo Artaiza" → "Arriaza"), aunque en ese caso concreto el nombre real correcto SÍ era el que dio Transfermarkt (el usuario había escrito mal el apellido original). Verificar siempre el nombre exacto contra el HTML crudo, no contra el resumen.

Credenciales de Supabase: ambos scripts (`sync_jugador.py` y `mercado.js`) leen `VITE_SUPABASE_URL`/`SUPABASE_SERVICE_KEY` de `.env.local` (raíz del repo, no se sube a git). Un colaborador nuevo solo necesita copiar ese archivo — sin tocar código. `sync_jugador.py` lo carga solo (no hace falta `--env-file`, a diferencia de los scripts de Node).
