import { Helmet } from 'react-helmet-async'

export const SITE_NAME = 'RZ Hub'
// www: rzhub.es (sin www) hace un 308 a www.rzhub.es — el canonical,
// og:url y las URLs del sitemap deben apuntar directamente al destino
// final, nunca a una URL que a su vez redirige a otra.
export const SITE_URL = 'https://www.rzhub.es'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export default function SEO({ title, description, keywords, path = '', image = DEFAULT_OG_IMAGE, jsonLd, noindex = false }) {
  const url = `${SITE_URL}${path}`
  const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_ES" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={url} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </Helmet>
  )
}
