import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropertyById, checkFavorite, addFavorite, removeFavorite } from '../services/propertyService'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import InterestForm from '../components/InterestForm'
import { PropertySEO } from '../components/SEO'

const PLACEHOLDER_IMAGE = '/placeholder-property.svg'

// Bank logos and colors
const bankInfo = {
  'Caixa Econômica Federal': { color: 'bg-blue-600', textColor: 'text-blue-600' },
  'Banco do Brasil': { color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  'Santander': { color: 'bg-red-600', textColor: 'text-red-600' },
  'Itaú Unibanco': { color: 'bg-orange-500', textColor: 'text-orange-600' },
  'Portal Zuk': { color: 'bg-purple-600', textColor: 'text-purple-600' },
  'default': { color: 'bg-gray-600', textColor: 'text-gray-600' }
}

export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    loadProperty()
    if (isAuthenticated) {
      loadFavoriteStatus()
    }
  }, [id, isAuthenticated])

  const loadProperty = async () => {
    try {
      const data = await getPropertyById(id)
      setProperty(data)
    } catch (error) {
      console.error('Error loading property:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavoriteStatus = async () => {
    try {
      const data = await checkFavorite(id)
      setIsFavorited(data.isFavorited)
    } catch (error) {
      console.error('Error checking favorite:', error)
    }
  }

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/imovel/${id}` } })
      return
    }

    try {
      if (isFavorited) {
        await removeFavorite(id)
      } else {
        await addFavorite(id)
      }
      setIsFavorited(!isFavorited)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleAccessAuction = () => {
    if (property.externalUrl) {
      window.open(property.externalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Imóvel não encontrado</h2>
          <Link to="/buscar" className="btn-primary">Voltar para busca</Link>
        </div>
      </div>
    )
  }

  const propertyTypeLabels = {
    HOUSE: 'Casa',
    APARTMENT: 'Apartamento',
    LAND: 'Terreno',
    COMMERCIAL: 'Comercial',
    RURAL: 'Rural'
  }

  const auctionTypeLabels = {
    JUDICIAL: 'Judicial',
    EXTRAJUDICIAL: 'Extrajudicial'
  }

  const bank = bankInfo[property.bank] || bankInfo['default']

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <PropertySEO property={property} />

      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-gray-500 hover:text-primary-600">Home</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li><Link to="/buscar" className="text-gray-500 hover:text-primary-600">Buscar</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li className="text-gray-900 truncate max-w-xs">{property.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative aspect-video">
                <img
                  src={property.images?.[selectedImage]?.url || PLACEHOLDER_IMAGE}
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE }}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {property.bank && (
                    <span className={`px-3 py-1 ${bank.color} text-white text-sm font-medium rounded-lg`}>
                      {property.bank}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-lg">
                    {auctionTypeLabels[property.auctionType]}
                  </span>
                  <span className="px-3 py-1 bg-gray-900/80 text-white text-sm font-medium rounded-lg">
                    {propertyTypeLabels[property.propertyType]}
                  </span>
                </div>
                <button
                  onClick={toggleFavorite}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className={`w-6 h-6 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                    fill={isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {property.images?.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{property.title}</h1>

              <div className="flex items-center text-gray-600 mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property.address ? `${property.address}, ` : ''}{property.city} - {property.state}
                {property.zipCode && `, ${property.zipCode}`}
              </div>

              {/* Property specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-semibold">{propertyTypeLabels[property.propertyType]}</p>
                </div>
                {property.modality && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Modalidade</p>
                    <p className="font-semibold">{property.modality}</p>
                  </div>
                )}
                {property.area && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Área</p>
                    <p className="font-semibold">{property.area}m²</p>
                  </div>
                )}
                {property.bedrooms && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Quartos</p>
                    <p className="font-semibold">{property.bedrooms}</p>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Banheiros</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                )}
                {property.parkingSpots && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Vagas</p>
                    <p className="font-semibold">{property.parkingSpots}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h2>
                  <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              {/* Bank/Source */}
              {property.bank && (
                <div className={`text-center p-4 rounded-lg mb-6 ${bank.color} bg-opacity-10`}>
                  <p className="text-sm text-gray-600 mb-1">Imóvel disponível em</p>
                  <p className={`text-xl font-bold ${bank.textColor}`}>
                    {property.bank}
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="border-b pb-6 mb-6">
                <p className="text-sm text-gray-500 mb-1">Valor</p>
                <p className="text-3xl font-bold text-primary-600">
                  {formatCurrency(property.minBid)}
                </p>
                {property.evaluatedValue && property.evaluatedValue > property.minBid && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Valor de avaliação</p>
                    <p className="text-lg text-gray-400 line-through">
                      {formatCurrency(property.evaluatedValue)}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                      {Math.round((1 - property.minBid / property.evaluatedValue) * 100)}% de desconto
                    </span>
                  </div>
                )}
              </div>

              {/* Auction Info */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Modalidade</span>
                  <span className="font-medium">{auctionTypeLabels[property.auctionType]}</span>
                </div>
                {property.modality && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de Venda</span>
                    <span className="font-medium">{property.modality}</span>
                  </div>
                )}
                {property.auctionEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Limite</span>
                    <span className="font-medium">{formatDateTime(property.auctionEnd)}</span>
                  </div>
                )}
              </div>

              {/* Access Auction Button */}
              {property.externalUrl ? (
                <button
                  onClick={handleAccessAuction}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Acessar Leilão
                </button>
              ) : (
                <div className="bg-gray-100 text-gray-600 text-center py-4 px-6 rounded-lg">
                  Link não disponível
                </div>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                Você será redirecionado para o site oficial do leiloeiro
              </p>

              {/* Favorite Button */}
              <button
                onClick={toggleFavorite}
                className={`w-full mt-4 py-3 px-6 rounded-lg border-2 font-medium flex items-center justify-center gap-2 transition-colors ${
                  isFavorited
                    ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <svg
                  className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`}
                  fill={isFavorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFavorited ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  <Link to="/login" className="text-primary-600 hover:underline">
                    Faça login
                  </Link>{' '}
                  para salvar favoritos
                </p>
              )}
            </div>

            {/* Interest Form */}
            <div className="mt-6">
              <InterestForm propertyId={property.id} propertyTitle={property.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
