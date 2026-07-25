import { useState, useEffect } from 'react'

export const ESCUDO_ZARAGOZA = '/escudos/Real_Zaragoza_logo (3).svg'

export const ESCUDOS_CLUBS = {
  'Gimnàstic de Tarragona':    '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Nàstic':                    '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Antequera CF':              '/escudos/spain_antequera.football-logos.cc.svg',
  'Antequera':                 '/escudos/spain_antequera.football-logos.cc.svg',
  'Juventud de Torremolinos CF': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'Torremolinos':              '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'FC Cartagena':              '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'Cartagena':                 '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza':                  '/escudos/UD_Ibiza_logo.svg',
  'Ibiza':                     '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel':                 '/escudos/CD_Teruel_logo.svg',
  'Teruel':                    '/escudos/CD_Teruel_logo.svg',
  'Atlético Madrileño':        '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Murcia CF':            '/escudos/Real_Murcia_CF_logo.svg',
  'Real Murcia':               '/escudos/Real_Murcia_CF_logo.svg',
  'CE Europa':                 '/escudos/Club_Esportiu_Europa.svg',
  'Hércules de Alicante CF':   '/escudos/Hercules_CF_crest.svg',
  'Hércules':                  '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF':              '/escudos/spain_algeciras.football-logos.cc.svg',
  'Algeciras':                 '/escudos/spain_algeciras.football-logos.cc.svg',
  'UE Sant Andreu':            '/escudos/ue-sant-andreu-vector-logo.png',
  'CF Rayo Majadahonda':       '/escudos/Rayo_Majadahonda_(logo).svg',
  'Rayo Majadahonda':          '/escudos/Rayo_Majadahonda_(logo).svg',
  'Real Jaén CF':              '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'Real Jaén':                 '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'AD Alcorcón':               '/escudos/AD_Alcorcon_logo.svg',
  'Alcorcón':                  '/escudos/AD_Alcorcon_logo.svg',
  'Águilas FC':                '/escudos/logo.svg',
  'Real Madrid Castilla':      '/escudos/Real_Madrid_CF.svg',
  'Real Madrid B':             '/escudos/Real_Madrid_CF.svg',
  'Real Madrid':               '/escudos/Real_Madrid_CF.svg',
  'Villarreal B':              '/escudos/Villarreal_CF_logo-en.svg',
  'Villarreal CF B':           '/escudos/Villarreal_CF_logo-en.svg',
  'Villarreal CF':             '/escudos/Villarreal CF.png',
  'SD Huesca':                 '/escudos/Logo_of_SD_Huesca.svg',
  'Huesca':                    '/escudos/huesca.png',
  'Athletic Club':             '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Athletic':                  '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Bilbao Athletic':           '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Atlético de Madrid':        '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Atlético Madrid':           '/escudos/Atletico_Madrid_Logo_2024.svg',
  'FC Barcelona':              '/escudos/FC_Barcelona_(crest) (5).svg',
  'Barcelona':                 '/escudos/FC_Barcelona_(crest) (5).svg',
  'Real Sociedad':             '/escudos/Real_Sociedad_logo.svg',
  'Real Sociedad B':           '/escudos/Real_Sociedad_logo.svg',
  'Sevilla FC':                '/escudos/Sevilla_FC_logo.svg',
  'Sevilla':                   '/escudos/Sevilla_FC_logo.svg',
  'Real Betis':                '/escudos/Real_betis_logo (1).svg',
  'Betis':                     '/escudos/Real_betis_logo (1).svg',
  'Getafe CF':                 '/escudos/Getafe_logo.svg',
  'Getafe':                    '/escudos/Getafe_logo.svg',
  'Girona FC':                 '/escudos/Girona_FC_Logo.svg',
  'Girona':                    '/escudos/Girona_FC_Logo.svg',
  'Osasuna':                   '/escudos/CA_Osasuna_2024_crest.svg',
  'CA Osasuna':                '/escudos/CA_Osasuna_2024_crest.svg',
  'Rayo Vallecano':            '/escudos/Rayo_Vallecano_logo (1).svg',
  'Levante':                   '/escudos/Levante_Unión_Deportiva,_S.A.D._logo.svg',
  'Levante UD':                '/escudos/Levante_Unión_Deportiva,_S.A.D._logo.svg',
  'Deportivo Alavés':          '/escudos/Deportivo_Alaves_logo_(2020).svg',
  'Alavés':                    '/escudos/Deportivo_Alaves_logo_(2020).svg',
  'Elche CF':                  '/escudos/Elche_CF_logo.svg',
  'Elche':                     '/escudos/Elche_CF_logo.svg',
  'Celta de Vigo':             '/escudos/RC_Celta_de_Vigo_logo (1).svg',
  'RC Celta':                  '/escudos/RC_Celta_de_Vigo_logo (1).svg',
  'Espanyol':                  '/escudos/RCD_Espanyol_crest.svg',
  'RCD Espanyol':              '/escudos/RCD_Espanyol_crest.svg',
  'Mallorca':                  '/escudos/Rcd_mallorca.svg',
  'RCD Mallorca':              '/escudos/Rcd_mallorca.svg',
  'Real Valladolid':           '/escudos/Real_Valladolid_CF_crest.svg',
  'Valladolid':                '/escudos/valladolid.png',
  'Real Oviedo':               '/escudos/Real_Oviedo_logo (1).svg',
  'Oviedo':                    '/escudos/Real_Oviedo_logo (1).svg',
  'Deportivo de La Coruña':    '/escudos/RC_Deportivo_La_Coruña_logo (1).svg',
  'Deportivo':                 '/escudos/Depor.png',
  'Sporting de Gijón':         '/escudos/Real_Sporting_de_Gijon (1).svg',
  'Sporting':                  '/escudos/sporting.png',
  'SD Eibar':                  '/escudos/SD_Eibar_logo_2016.svg',
  'Eibar':                     '/escudos/eibar.png',
  'Burgos CF':                 '/escudos/burgos-cf.svg',
  'Burgos':                    '/escudos/burgos.png',
  'Albacete':                  '/escudos/albacete.png',
  'Albacete BP':               '/escudos/Albacete_balompie.svg',
  'Almería':                   '/escudos/almeria.png',
  'UD Almería':                '/escudos/UD_Almería_logo (1).svg',
  'Cádiz':                     '/escudos/cadiz.png',
  'Cádiz CF':                  '/escudos/Cádiz_CF_logo (1).svg',
  'CD Castellón':              '/escudos/CD Castellon.png',
  'Castellón':                 '/escudos/Logo_of_CD_Castellón (1).svg',
  'Córdoba CF':                '/escudos/Cordoba CF.png',
  'Córdoba':                   '/escudos/Córdoba_CF_logo.svg',
  'Cultural Leonesa':          '/escudos/Cultural leonesa.png',
  'Cultural y Deportiva Leonesa': '/escudos/Logo_of_Cultural_y_Deportiva_Leonesa.svg',
  'Granada CF':                '/escudos/Logo_of_Granada_Club_de_Fútbol.svg',
  'Granada':                   '/escudos/granada.png',
  'Las Palmas':                '/escudos/las palmas.png',
  'UD Las Palmas':             '/escudos/UD_Las_Palmas_logo (1).svg',
  'Leganés':                   '/escudos/leganes.png',
  'CD Leganés':                '/escudos/Club_Deportivo_Leganés_logo.svg',
  'Málaga CF':                 '/escudos/Malaga CF.png',
  'Málaga':                    '/escudos/Málaga_CF (1).svg',
  'Mirandés':                  '/escudos/mirandes.png',
  'CD Mirandés':               '/escudos/CD_Mirandés_logo.svg',
  'Racing de Santander':       '/escudos/Racing_de_Santander_logo.svg',
  'Racing':                    '/escudos/racing.png',
  'FC Andorra':                '/escudos/Logo_FC_Andorra_-_2021 (1).svg',
  'Andorra':                   '/escudos/Logo_FC_Andorra_-_2021 (1).svg',
  'UD Barbastro':              '/escudos/ud-barbastro-seeklogo.png',
  'Barbastro':                 '/escudos/ud-barbastro-seeklogo.png',
  'AD Ceuta':                  '/escudos/Logo_AD_Ceuta_FC.svg',
  'Ceuta':                     '/escudos/ad ceuta.png',
  'Valencia CF':               '/escudos/Valenciacf (2).svg',
  'Valencia':                  '/escudos/Valenciacf (2).svg',
  'Venezia':                   '/escudos/venezia.cc.svg',
  'UD Logroñés':               '/escudos/spain_ud-logrones.football-logos.cc.svg',
  'Logroñés':                  '/escudos/spain_ud-logrones.football-logos.cc.svg',
  'Utebo':                     '/escudos/spain_utebo.football-logos.cc.svg',
  'CD Numancia':               '/escudos/spain_numancia.football-logos.cc.svg',
  'Numancia':                  '/escudos/spain_numancia.football-logos.cc.svg',
}

const _tsdbCache = {}

export async function fetchEscudoFallback(club) {
  if (!club) return null
  if (_tsdbCache[club] !== undefined) return _tsdbCache[club]
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(club)}`
    )
    const data = await res.json()
    const badge = data?.teams?.[0]?.strBadge || null
    _tsdbCache[club] = badge
    return badge
  } catch {
    _tsdbCache[club] = null
    return null
  }
}

export function getEscudo(club) {
  return ESCUDOS_CLUBS[club] || null
}

const AGENTE_LIBRE_ICON = '/escudos/agentelibre.png'

// Hook compartido por cualquier card que necesite el escudo de un club
// (estático si está en ESCUDOS_CLUBS, si no vía fallback de TheSportsDB).
export function useEscudo(club) {
  const [src, setSrc] = useState(() => (club === 'Libre' ? AGENTE_LIBRE_ICON : getEscudo(club)))

  useEffect(() => {
    if (!club) return
    if (club === 'Libre') { setSrc(AGENTE_LIBRE_ICON); return }
    if (getEscudo(club)) { setSrc(getEscudo(club)); return }
    fetchEscudoFallback(club).then(url => setSrc(url))
  }, [club])

  return src
}
