import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await api.get('/users/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    {
      title: 'Meus Lances',
      description: 'Acompanhe seus lances ativos e histórico',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/minha-conta/lances',
      stat: stats?.totalBids || 0,
      statLabel: 'lances realizados'
    },
    {
      title: 'Favoritos',
      description: 'Imóveis salvos para acompanhar',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      link: '/minha-conta/favoritos',
      stat: stats?.favorites || 0,
      statLabel: 'favoritos'
    },
    {
      title: 'Meu Perfil',
      description: 'Edite seus dados cadastrais',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      link: '/minha-conta/perfil'
    }
  ]

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">Bem-vindo à sua área de cliente</p>
        </div>

        {/* Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-3xl font-bold text-primary-600">{stats.totalBids}</p>
              <p className="text-gray-600 text-sm">Total de lances</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-3xl font-bold text-green-600">{stats.activeBids}</p>
              <p className="text-gray-600 text-sm">Leilões ativos</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-3xl font-bold text-red-500">{stats.favorites}</p>
              <p className="text-gray-600 text-sm">Favoritos</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-3xl font-bold text-accent-500">{stats.wonAuctions}</p>
              <p className="text-gray-600 text-sm">Leilões ganhos</p>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.link}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3">{item.description}</p>
              {item.stat !== undefined && (
                <p className="text-sm">
                  <span className="font-bold text-primary-600">{item.stat}</span>{' '}
                  <span className="text-gray-500">{item.statLabel}</span>
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/buscar" className="btn-primary">
              Buscar imóveis
            </Link>
            <Link to="/como-funciona" className="btn-secondary">
              Como funciona
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
