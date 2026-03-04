import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard'
import { getUserFavorites, removeFavorite } from '../services/propertyService'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadFavorites()
  }, [page])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const data = await getUserFavorites({ page, limit: 12 })
      setFavorites(data.favorites)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (propertyId) => {
    try {
      await removeFavorite(propertyId)
      setFavorites(prev => prev.filter(f => f.property.id !== propertyId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Favoritos</h1>
            <p className="text-gray-600">Imóveis que você está acompanhando</p>
          </div>
          <Link to="/buscar" className="btn-primary">
            Buscar imóveis
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="relative group">
                  <PropertyCard property={favorite.property} />
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemove(favorite.property.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remover dos favoritos"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum favorito
            </h3>
            <p className="text-gray-500 mb-4">
              Você ainda não salvou nenhum imóvel nos favoritos.
            </p>
            <Link to="/buscar" className="btn-primary">
              Buscar imóveis
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
