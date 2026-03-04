import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/formatters'

const PLACEHOLDER_IMAGE = '/placeholder-property.svg'

// Bank colors
const bankColors = {
  'Caixa Econômica Federal': 'bg-blue-600',
  'Banco do Brasil': 'bg-yellow-500',
  'Santander': 'bg-red-600',
  'Itaú Unibanco': 'bg-orange-500',
  'Portal Zuk': 'bg-purple-600'
}

export default function PropertyCard({ property }) {
  const imageUrl = property.images?.[0]?.url || PLACEHOLDER_IMAGE

  const propertyTypeLabels = {
    HOUSE: 'Casa',
    APARTMENT: 'Apartamento',
    LAND: 'Terreno',
    COMMERCIAL: 'Comercial',
    RURAL: 'Rural'
  }

  const bankColor = bankColors[property.bank] || 'bg-gray-600'

  return (
    <Link to={`/imovel/${property.id}`} className="card group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = PLACEHOLDER_IMAGE
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {property.bank && (
            <span className={`px-2 py-1 ${bankColor} text-white text-xs font-medium rounded`}>
              {property.bank}
            </span>
          )}
          <span className="px-2 py-1 bg-gray-900/80 text-white text-xs font-medium rounded">
            {propertyTypeLabels[property.propertyType]}
          </span>
        </div>

        {/* External link indicator */}
        {property.externalUrl && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver Leilão
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        <p className="text-sm text-gray-500 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{property.city}, {property.state}</span>
        </p>

        {/* Property details */}
        {(property.bedrooms || property.area) && (
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {property.bedrooms && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} quarto{property.bedrooms > 1 ? 's' : ''}
              </span>
            )}
            {property.area && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {property.area}m²
              </span>
            )}
          </div>
        )}

        {/* Price and modality */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valor</p>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(property.minBid)}
              </p>
            </div>
            {property.modality && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {property.modality}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
