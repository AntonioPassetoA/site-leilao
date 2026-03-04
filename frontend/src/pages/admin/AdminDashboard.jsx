import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setData(response.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total de Imóveis',
      value: data?.stats?.totalProperties || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'bg-blue-500'
    },
    {
      title: 'Leilões Ativos',
      value: data?.stats?.activeAuctions || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500'
    },
    {
      title: 'Total de Usuários',
      value: data?.stats?.totalUsers || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-purple-500'
    },
    {
      title: 'Total de Lances',
      value: data?.stats?.totalBids || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-amber-500'
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/admin/imoveis/novo" className="btn-primary">
          Novo Imóvel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white mb-8">
        <p className="text-primary-100 mb-1">Receita Total (Imóveis Vendidos)</p>
        <p className="text-4xl font-bold">
          {formatCurrency(data?.stats?.totalRevenue || 0)}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bids */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900">Lances Recentes</h2>
          </div>
          <div className="p-6">
            {data?.recentBids?.length > 0 ? (
              <div className="space-y-4">
                {data.recentBids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{bid.user?.name}</p>
                      <p className="text-sm text-gray-500">{bid.property?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">{formatCurrency(bid.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(bid.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum lance recente</p>
            )}
          </div>
        </div>

        {/* Top Properties */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900">Imóveis com Mais Lances</h2>
          </div>
          <div className="p-6">
            {data?.topProperties?.length > 0 ? (
              <div className="space-y-4">
                {data.topProperties.map((property) => (
                  <div key={property.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{property.title}</p>
                      <p className="text-sm text-gray-500">{property.city}, {property.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">
                        {formatCurrency(property.currentBid || property.minBid)}
                      </p>
                      <p className="text-xs text-gray-500">{property._count?.bids || 0} lances</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum imóvel ativo</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/imoveis" className="btn-secondary">
            Gerenciar Imóveis
          </Link>
          <Link to="/admin/usuarios" className="btn-secondary">
            Gerenciar Usuários
          </Link>
          <Link to="/admin/imoveis/novo" className="btn-primary">
            Cadastrar Novo Imóvel
          </Link>
        </div>
      </div>
    </div>
  )
}
