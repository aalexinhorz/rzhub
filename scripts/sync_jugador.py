"""
sync_jugador.py — rzhub.es
Flujo:
  1. Busca el jugador en la API pública de FotMob (sin auth)
  2. Mete la URL de foto de FotMob en la tabla 'players'
  3. Luego ejecutas upload-photos.js como siempre → sube la foto a Supabase

Uso:
  python3 scripts/sync_jugador.py "Enzo Fernández"
  python3 scripts/sync_jugador.py "Jair" "Bermejo" "Nieto"
  python3 scripts/sync_jugador.py --file plantilla.txt
  python3 scripts/sync_jugador.py "Alguien" --cantera
  python3 scripts/sync_jugador.py "Alguien" --no-zaragoza
"""

import os
import sys
import time
import argparse
import requests

# ─────────────────────────────────────────────────────────────
# CONFIGURACIÓN — credenciales en .env.local (raíz del repo)
# ─────────────────────────────────────────────────────────────
def _cargar_env_local():
    ruta = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if not os.path.exists(ruta):
        return
    with open(ruta, encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith("#") or "=" not in linea:
                continue
            clave, _, valor = linea.partition("=")
            os.environ.setdefault(clave.strip(), valor.strip())

_cargar_env_local()

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
TABLE        = "players"
# ─────────────────────────────────────────────────────────────

FOTMOB_SEARCH    = "https://apigw.fotmob.com/searchapi/suggest"
FOTMOB_PHOTO_URL = "https://images.fotmob.com/image_resources/playerimages/{id}.png"

OK   = "\033[92m✓\033[0m"
ERR  = "\033[91m✗\033[0m"
INFO = "\033[94m→\033[0m"
WARN = "\033[93m!\033[0m"
def log(s, m): print(f"  {s} {m}")


# ── 1. BUSCAR EN FOTMOB ───────────────────────────────────────
def buscar_en_fotmob(nombre):
    try:
        r = requests.get(
            FOTMOB_SEARCH,
            params={"term": nombre, "lang": "es"},
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=8
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log(ERR, f"Error FotMob: {e}")
        return []

    candidatos = []
    squad_raw = data.get("squadMemberSuggest", [])
    if isinstance(squad_raw, dict):
        items = squad_raw.get("options", [])
    elif isinstance(squad_raw, list):
        items = []
        for grupo in squad_raw:
            if isinstance(grupo, dict):
                items += grupo.get("options", [])
            else:
                items.append(grupo)
    else:
        items = []

    for item in items:
        p = item.get("payload", {})
        fid = p.get("id") or p.get("participantId")
        if not fid:
            continue
        # Nombre viene en "text" como "Nombre Apellido|ID"
        raw_text = item.get("text", "")
        nombre_limpio = raw_text.split("|")[0].strip() if "|" in raw_text else raw_text.strip()
        rol = p.get("role", "")
        posicion = rol.get("fallback", "") if isinstance(rol, dict) else str(rol)
        candidatos.append({
            "fotmob_id" : str(fid),
            "name"      : nombre_limpio or p.get("name", ""),
            "equipo"    : p.get("teamName", ""),
            "posicion"  : posicion,
        })
    return candidatos


def elegir_candidato(nombre_buscado, candidatos):
    if not candidatos:
        return None
    if len(candidatos) == 1:
        c = candidatos[0]
        log(INFO, f"Encontrado: {c['name']} ({c['equipo']}) — ID {c['fotmob_id']}")
        return c

    print(f"\n  {WARN} Varios resultados para '{nombre_buscado}':")
    for i, c in enumerate(candidatos[:8], 1):
        print(f"     [{i}] {c['name']} — {c['equipo']}  (ID: {c['fotmob_id']})")
    print(f"     [0] Saltar")
    try:
        sel = int(input("  Elige número: ").strip())
        if sel == 0:
            return None
        return candidatos[sel - 1]
    except (ValueError, IndexError):
        log(WARN, "Selección inválida, saltando.")
        return None


# ── 2. UPSERT EN TABLA PLAYERS ────────────────────────────────
def upsert_jugador(name, short_name, position, photo, is_zaragoza, is_cantera):
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey"       : SUPABASE_KEY,
        "Content-Type" : "application/json",
        "Prefer"       : "return=representation",
    }
    payload = {
        "short_name"  : short_name,
        "position"    : position,
        "photo"       : photo,
        "is_zaragoza" : is_zaragoza,
        "is_cantera"  : is_cantera,
    }

    # Intentar UPDATE primero (si ya existe)
    try:
        url_update = f"{SUPABASE_URL}/rest/v1/{TABLE}?name=eq.{requests.utils.quote(name)}"
        r = requests.patch(url_update, headers=headers, json=payload, timeout=10)
        if r.status_code in (200, 204):
            # Comprobar si actualizó algo (204 = sin filas, 200 = actualizó)
            if r.status_code == 200 and r.text and r.text != "[]":
                log(OK, "Jugador actualizado en Supabase")
                return True
            # No existía — hacer INSERT
            payload["name"] = name
            r2 = requests.post(
                f"{SUPABASE_URL}/rest/v1/{TABLE}",
                headers=headers, json=payload, timeout=10
            )
            if r2.status_code in (200, 201):
                log(OK, "Jugador insertado en Supabase")
                return True
            else:
                log(ERR, f"Error al insertar: {r2.status_code} — {r2.text[:300]}")
                return False
        else:
            log(ERR, f"Error Supabase: {r.status_code} — {r.text[:300]}")
            return False
    except Exception as e:
        log(ERR, f"Excepción Supabase: {e}")
        return False


# ── FLUJO COMPLETO POR JUGADOR ────────────────────────────────
def procesar_jugador(nombre, is_zaragoza=True, is_cantera=False):
    print(f"\n{'─'*52}")
    print(f"  \033[1m{nombre}\033[0m")
    print(f"{'─'*52}")

    candidatos = buscar_en_fotmob(nombre)
    jugador    = elegir_candidato(nombre, candidatos)
    if not jugador:
        log(ERR, "No encontrado en FotMob. Saltando.")
        return False

    fotmob_id  = jugador["fotmob_id"]
    name       = jugador["name"]
    partes     = name.split()
    short_name = partes[-1] if len(partes) > 1 else name
    position   = jugador.get("posicion", "")

    # URL de foto de FotMob — upload-photos.js la convertirá a Supabase
    photo = FOTMOB_PHOTO_URL.replace("{id}", fotmob_id)
    log(INFO, f"URL foto → {photo}")

    ok = upsert_jugador(
        name        = name,
        short_name  = short_name,
        position    = position,
        photo       = photo,
        is_zaragoza = is_zaragoza,
        is_cantera  = is_cantera,
    )

    if ok:
        print(f"\n  {OK} \033[92mListo:\033[0m {name} guardado")
        print(f"     Ahora ejecuta: node --env-file=.env.local scripts/upload-photos.js")
    return ok


# ── ENTRY POINT ───────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Sincroniza jugadores FotMob → Supabase (rzhub.es)"
    )
    parser.add_argument("nombres", nargs="*",
        help='Nombre(s) del jugador, ej: "Enzo Fernández"')
    parser.add_argument("--file", "-f",
        help="Archivo .txt con un nombre por línea")
    parser.add_argument("--cantera", action="store_true",
        help="Marcar is_cantera=true")
    parser.add_argument("--no-zaragoza", action="store_true",
        help="Marcar is_zaragoza=false")
    args = parser.parse_args()

    nombres = list(args.nombres)
    if args.file:
        try:
            with open(args.file, encoding="utf-8") as f:
                nombres += [l.strip() for l in f if l.strip() and not l.startswith("#")]
        except FileNotFoundError:
            print(f"{ERR} Archivo no encontrado: {args.file}")
            sys.exit(1)

    if not nombres:
        parser.print_help()
        sys.exit(0)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print(f"\n{ERR} Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY en .env.local")
        sys.exit(1)

    print(f"\n{'═'*52}")
    print(f"  rzhub.es — Sync jugadores → Supabase")
    print(f"  {len(nombres)} jugador(es) en cola")
    print(f"{'═'*52}")

    ok_count = err_count = 0
    for nombre in nombres:
        exito = procesar_jugador(
            nombre,
            is_zaragoza = not args.no_zaragoza,
            is_cantera  = args.cantera,
        )
        if exito: ok_count += 1
        else:     err_count += 1
        time.sleep(0.8)

    print(f"\n{'═'*52}")
    print(f"  Resultado: {ok_count} ✓  |  {err_count} ✗")
    if ok_count > 0:
        print(f"\n  Siguiente paso:")
        print(f"  node --env-file=.env.local scripts/upload-photos.js")
    print(f"{'═'*52}\n")


if __name__ == "__main__":
    main()
