import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserBids } from '../services/propertyService'
import { formatCurrency, formatDateTime, getTimeRemaining } from '../utils/formatters'

export default function MyBids() {
  const [bids, setBids] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadBids()
  }, [page])

  const loadBids = async () => {
    setLoading(true)
    try {
      const data = await getUserBids({ page, limit: 10 })
      setBids(data.bids)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error loading bids:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusLabels = {
    ACTIVE: 'Ativo',
    SOLD: 'Vendido',
    CANCELLED: 'Cancelado',
    PENDING: 'Pendente'
  }

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-700',
    SOLD: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Lances</h1>
            <p className="text-gray-600">Acompanhe todos os seus lances</p>
          </div>
          <Link to="/buscar" className="btn-primary">
            Buscar imóveis
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bids.length > 0 ? (
          <>
            <div className="space-y-4">
              {bids.map((bid) => {
                const timeRemaining = getTimeRemaining(bid.property.auctionEnd)
                const isHighestBid = parseFloat(bid.amount) === parseFloat(bid.property.currentBid)

                return (
                  <Link
                    key={bid.id}
                    to={`/imovel/${bid.property.id}`}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow block"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="w-full md:w-40 h-32 flex-shrink-0">
                        <img
                          src={bid.property.images?.[0]?.url || 'https://via.placeholder.com/160x120?text=Im%C3%B3vel'}
                          alt={bid.property.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{bid.property.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[bid.property.status]}`}>
                            {statusLabels[bid.property.status]}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-3">
                          {bid.property.city}, {bid.property.state}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Seu lance</p>
                            <p className={`font-bold ${isHighestBid ? 'text-green-600' : 'text-gray-900'}`}>
                              {formatCurrency(bid.amount)}
                              {isHighestBid && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Maior lance
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Lance atual</p>
                            <p className="font-bold text-primary-600">
                              {formatCurrency(bid.property.currentBid || bid.property.minBid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Data do lance</p>
                            <p className="font-medium">{formatDateTime(bid.createdAt)}</p>
                          </div>
                          {bid.property.status === 'ACTIVE' && (
                            <div>
                              <p className="text-gray-500">Tempo restante</p>
                              <p className={`font-medium ${timeRemaining.urgent ? 'text-red-600' : ''}`}>
                                {timeRemaining.text}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum lance realizado
            </h3>
            <p className="text-gray-500 mb-4">
              Você ainda não fez nenhum lance em leilões.
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
