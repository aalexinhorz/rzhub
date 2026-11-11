// Desplazamientos de liga del Real Zaragoza en la temporada 2026/27,
// ordenados de más corto a más largo (num). Los usan la página On Tour y la
// plantilla "On Tour" de /redaccion-graficos. `rival` es el nombre oficial
// (el de rivales.nombre y porra_partidos.rival); `club`, el corto del mapa.
export const DESPLAZAMIENTOS = [
  { rival: 'SD Huesca', num: 1,  club: 'SD Huesca',             ciudad: 'Huesca',            km: 74,  lat: 42.1318883, lng: -0.4247182, escudo: '/escudos/Logo_of_SD_Huesca.svg',                            color: '#2ECC71', label: 'Corto' },
  { rival: 'CD Teruel', num: 2,  club: 'CD Teruel',             ciudad: 'Teruel',            km: 185, lat: 40.332743,  lng: -1.1065112, escudo: '/escudos/CD_Teruel_logo.svg',                                color: '#2ECC71', label: 'Corto' },
  { rival: 'Gimnàstic de Tarragona', num: 3,  club: 'Nastic Tarragona',      ciudad: 'Tarragona',         km: 235, lat: 41.127051,  lng: 1.272851,   escudo: '/escudos/Gimnastic_de_Tarragona_logo.svg',                   color: '#FFC800', label: 'Medio' },
  { rival: 'UE Sant Andreu', num: 4,  club: 'UE Sant Andreu',        ciudad: 'Barcelona',         km: 295, lat: 41.4288822, lng: 2.1930871,  escudo: '/escudos/ue-sant-andreu-vector-logo.webp',                    color: '#FFC800', label: 'Medio' },
  { rival: 'CE Europa', num: 5,  club: 'CE Europa',             ciudad: 'Barcelona',         km: 295, lat: 41.438057,  lng: 2.183797,   escudo: '/escudos/Club_Esportiu_Europa.svg',                          color: '#FFC800', label: 'Medio' },
  { rival: 'Villarreal CF B', num: 6,  club: 'Villarreal B',          ciudad: 'Villarreal',        km: 295, lat: 39.9394068, lng: -0.1167347, escudo: '/escudos/Villarreal_CF_logo-en.svg',                         color: '#FFC800', label: 'Medio' },
  { rival: 'CF Rayo Majadahonda', num: 7,  club: 'Rayo Majadahonda',      ciudad: 'Majadahonda',       km: 310, lat: 40.4575422, lng: -3.8602657, escudo: '/escudos/Rayo_Majadahonda_(logo).svg',                       color: '#FFC800', label: 'Medio' },
  { rival: 'AD Alcorcón', num: 8,  club: 'AD Alcorcon',           ciudad: 'Alcorcon',          km: 315, lat: 40.3388592, lng: -3.8404714, escudo: '/escudos/AD_Alcorcon_logo.svg',                              color: '#FFC800', label: 'Medio' },
  { rival: 'Atlético Madrileño', num: 9,  club: 'Atleti B',              ciudad: 'Alcala Henares',    km: 320, lat: 40.5082172, lng: -3.3609447, escudo: '/escudos/Atletico_Madrid_Logo_2024.svg',                     color: '#FFC800', label: 'Medio' },
  { rival: 'Real Madrid Castilla', num: 10, club: 'Real Madrid B',         ciudad: 'Valdebebas',        km: 325, lat: 40.47693,   lng: -3.6142698, escudo: '/escudos/Real_Madrid_CF.svg',                                color: '#FFC800', label: 'Medio' },
  { rival: 'Hércules de Alicante CF', num: 11, club: 'Hercules',              ciudad: 'Alicante',          km: 470, lat: 38.3573154, lng: -0.4926576, escudo: '/escudos/Hercules_CF_crest.svg',                             color: '#FF9F1A', label: 'Largo' },
  { rival: 'UD Ibiza', num: 12, club: 'UD Ibiza',              ciudad: 'Ibiza',             km: 480, lat: 38.9139282, lng: 1.4157596,  escudo: '/escudos/UD_Ibiza_logo.svg',                                 color: '#FF9F1A', label: 'Largo', nota: 'Valencia ~330 + ferry ~150' },
  { rival: 'Real Murcia CF', num: 13, club: 'Real Murcia',           ciudad: 'Murcia',            km: 535, lat: 38.0422688, lng: -1.1452422, escudo: '/escudos/Real_Murcia_CF_logo.svg',                           color: '#FF9F1A', label: 'Largo' },
  { rival: 'FC Cartagena', num: 14, club: 'Cartagena',             ciudad: 'Cartagena',         km: 560, lat: 37.6097329, lng: -0.9960535, escudo: '/escudos/spain_fc-cartagena.football-logos.cc.svg',           color: '#FF9F1A', label: 'Largo' },
  { rival: 'Águilas FC', num: 15, club: 'Aguilas FC',            ciudad: 'Aguilas',           km: 620, lat: 37.4037154, lng: -1.5907668, escudo: '/escudos/logo.svg',                                          color: '#FF4D4D', label: 'Extremo' },
  { rival: 'Real Jaén CF', num: 16, club: 'Real Jaen',             ciudad: 'Jaen',              km: 630, lat: 37.7753883, lng: -3.7673872, escudo: '/escudos/spain_real-jaen-cf.football-logos.cc.svg',           color: '#FF4D4D', label: 'Extremo' },
  { rival: 'Antequera CF', num: 17, club: 'Antequera',             ciudad: 'Antequera',         km: 840, lat: 37.0205922, lng: -4.5718066, escudo: '/escudos/spain_antequera.football-logos.cc.svg',              color: '#FF4D4D', label: 'Extremo' },
  { rival: 'Juventud de Torremolinos CF', num: 18, club: 'Juventud Torremolinos', ciudad: 'Torremolinos',      km: 870, lat: 36.62132,   lng: -4.5099324, escudo: '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',  color: '#FF4D4D', label: 'Extremo' },
  { rival: 'Algeciras CF', num: 19, club: 'Algeciras',             ciudad: 'Algeciras',         km: 900, lat: 36.1630173, lng: -5.4651517, escudo: '/escudos/spain_algeciras.football-logos.cc.svg',              color: '#FF4D4D', label: 'Extremo' },
]

// Ibercaja Estadio.
export const ZARAGOZA = { lat: 41.6366, lng: -0.9018 }

export const desplazamientoDe = rival => DESPLAZAMIENTOS.find(d => d.rival === rival) || null
