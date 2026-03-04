import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getLeads, getLeadStats, updateLeadStatus, deleteLead } from '../../services/leadService'
import { formatCurrency, formatDateTime, formatPhone } from '../../utils/formatters'

const statusLabels = {
  NEW: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'Contatado', color: 'bg-yellow-100 text-yellow-700' },
  CONVERTED: { label: 'Convertido', color: 'bg-green-100 text-green-700' },
  LOST: { label: 'Perdido', color: 'bg-red-100 text-red-700' }
}

export default function AdminLeads() {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadLeads()
    loadStats()
  }, [page, statusFilter])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter

      const response = await getLeads(params)
      setLeads(response.leads)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await getLeadStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus)
      loadLeads()
      loadStats()
    } catch (error) {
      console.error('Error updating status:', error)
      alert(error.response?.data?.error || 'Erro ao atualizar status')
    }
  }

  const handleDelete = async (leadId) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return

    try {
      await deleteLead(leadId)
      loadLeads()
      loadStats()
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert(error.response?.data?.error || 'Erro ao excluir lead')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Leads</h1>
        <p className="text-gray-600">Visualize e gerencie os interessados nos imóveis</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total de Leads</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Últimos 7 dias</p>
            <p className="text-2xl font-bold text-blue-600">{stats.recentWeek}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Novos</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.byStatus?.NEW || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Convertidos</p>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus?.CONVERTED || 0}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="input w-48"
          >
            <option value="">Todos</option>
            <option value="NEW">Novos</option>
            <option value="CONTACTED">Contatados</option>
            <option value="CONVERTED">Convertidos</option>
            <option value="LOST">Perdidos</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imóvel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
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
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
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
                      <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                        <p className="text-sm text-gray-500">{formatPhone(lead.phone)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/imovel/${lead.property?.id}`}
                        target="_blank"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        {lead.property?.title?.substring(0, 50)}...
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {lead.property?.city}, {lead.property?.state} - {lead.property?.bank}
                      </p>
                      <p className="text-xs font-medium text-green-600 mt-1">
                        {lead.property?.minBid && formatCurrency(lead.property.minBid)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {lead.message || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-sm rounded px-2 py-1 border-0 ${statusLabels[lead.status]?.color || 'bg-gray-100'}`}
                      >
                        <option value="NEW">Novo</option>
                        <option value="CONTACTED">Contatado</option>
                        <option value="CONVERTED">Convertido</option>
                        <option value="LOST">Perdido</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {lead.property?.externalUrl && (
                          <a
                            href={lead.property.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Ver Leilão
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum lead encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
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
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
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
