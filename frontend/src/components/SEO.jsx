import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Leilão Imóveis'
const DEFAULT_DESCRIPTION = 'Encontre imóveis de leilão dos principais bancos do Brasil. Casas, apartamentos e terrenos com até 50% de desconto. Caixa, Banco do Brasil, Santander e mais.'
const DEFAULT_IMAGE = '/og-image.jpg'
const SITE_URL = 'https://www.seusite.com.br' // Alterar para URL real

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  schema = null,
  property = null
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

  // Schema.org para imóvel
  const propertySchema = property ? {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: fullUrl,
    image: property.images?.[0]?.url || fullImage,
    offers: {
      '@type': 'Offer',
      price: property.minBid,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      addressRegion: property.state,
      addressCountry: 'BR'
    }
  } : null

  // Schema.org padrão para o site
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/buscar?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  const schemaToUse = schema || propertySchema || defaultSchema

  return (
    <Helmet>
      {/* Básico */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaToUse)}
      </script>
    </Helmet>
  )
}

// Componentes específicos para diferentes páginas
export function HomeSEO() {
  return (
    <SEO
      title="Imóveis de Leilão com até 50% de Desconto"
      description="A maior plataforma de imóveis de leilão do Brasil. Encontre casas, apartamentos e terrenos da Caixa, Banco do Brasil, Santander e outros bancos com descontos incríveis."
      url="/"
    />
  )
}

export function SearchSEO({ state, city, propertyType }) {
  let title = 'Buscar Imóveis de Leilão'
  let description = 'Encontre imóveis de leilão em todo o Brasil.'

  if (state && city) {
    title = `Imóveis de Leilão em ${city}, ${state}`
    description = `Encontre imóveis de leilão em ${city}, ${state}. Casas, apartamentos e terrenos com desconto.`
  } else if (state) {
    title = `Imóveis de Leilão em ${state}`
    description = `Encontre imóveis de leilão no estado de ${state}. Casas, apartamentos e terrenos com desconto.`
  }

  if (propertyType) {
    const types = {
      HOUSE: 'Casas',
      APARTMENT: 'Apartamentos',
      LAND: 'Terrenos',
      COMMERCIAL: 'Imóveis Comerciais',
      RURAL: 'Imóveis Rurais'
    }
    title = `${types[propertyType] || propertyType} de Leilão`
  }

  return (
    <SEO
      title={title}
      description={description}
      url="/buscar"
    />
  )
}

export function PropertySEO({ property }) {
  if (!property) return null

  const description = `${property.title} em ${property.city}, ${property.state}. Valor: R$ ${Number(property.minBid).toLocaleString('pt-BR')}. ${property.bedrooms ? `${property.bedrooms} quartos. ` : ''}${property.area ? `${property.area}m². ` : ''}Leilão ${property.bank || ''}.`

  return (
    <SEO
      title={property.title}
      description={description.substring(0, 160)}
      image={property.images?.[0]?.url}
      url={`/imovel/${property.id}`}
      type="product"
      property={property}
    />
  )
}
