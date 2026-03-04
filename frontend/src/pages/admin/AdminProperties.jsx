import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

export default function AdminProperties() {
  const [properties, setProperties] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadProperties()
  }, [page, statusFilter])

  const loadProperties = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search

      const response = await api.get('/admin/properties', { params })
      setProperties(response.data.properties)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadProperties()
  }

  const handleStatusChange = async (propertyId, action) => {
    try {
      await api.post(`/admin/properties/${propertyId}/${action}`)
      loadProperties()
    } catch (error) {
      console.error(`Error ${action} property:`, error)
      alert(error.response?.data?.error || 'Erro ao processar ação')
    }
  }

  const handleDelete = async (propertyId) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return

    try {
      await api.delete(`/admin/properties/${propertyId}`)
      loadProperties()
    } catch (error) {
      console.error('Error deleting property:', error)
      alert(error.response?.data?.error || 'Erro ao excluir imóvel')
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Imóveis</h1>
        <Link to="/admin/imoveis/novo" className="btn-primary">
          Novo Imóvel
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por título ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="input md:w-48"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendentes</option>
            <option value="ACTIVE">Ativos</option>
            <option value="SOLD">Vendidos</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
          <button type="submit" className="btn-primary">
            Buscar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imóvel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : properties.length > 0 ? (
                properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={property.images?.[0]?.url || 'https://via.placeholder.com/40'}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900 max-w-xs truncate">
                            {property.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(property.auctionEnd)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {property.city}, {property.state}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(property.currentBid || property.minBid)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Mín: {formatCurrency(property.minBid)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property._count?.bids || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[property.status]}`}>
                        {statusLabels[property.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/imoveis/${property.id}/editar`}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Editar
                        </Link>
                        {property.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusChange(property.id, 'activate')}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Ativar
                          </button>
                        )}
                        {property.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(property.id, 'finalize')}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Finalizar
                            </button>
                            <button
                              onClick={() => handleStatusChange(property.id, 'cancel')}
                              className="text-orange-600 hover:text-orange-700 text-sm"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {property._count?.bids === 0 && (
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum imóvel encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
