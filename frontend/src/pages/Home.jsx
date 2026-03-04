import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard'
import { HomeSEO } from '../components/SEO'
import { getFeaturedProperties, getEndingSoon, getStates } from '../services/propertyService'

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState([])
  const [endingSoon, setEndingSoon] = useState([])
  const [states, setStates] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [featured, ending, statesList] = await Promise.all([
        getFeaturedProperties(),
        getEndingSoon(),
        getStates()
      ])
      setFeaturedProperties(featured)
      setEndingSoon(ending)
      setStates(statesList)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedState) params.set('state', selectedState)
    navigate(`/buscar?${params.toString()}`)
  }

  const propertyTypes = [
    { type: 'HOUSE', label: 'Casas', icon: '🏠' },
    { type: 'APARTMENT', label: 'Apartamentos', icon: '🏢' },
    { type: 'LAND', label: 'Terrenos', icon: '🌳' },
    { type: 'COMMERCIAL', label: 'Comerciais', icon: '🏪' },
    { type: 'RURAL', label: 'Rurais', icon: '🌾' }
  ]

  return (
    <div>
      <HomeSEO />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 to-primary-900 text-white py-20 lg:py-32">
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Encontre as melhores oportunidades em leilões de imóveis
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Casas, apartamentos, terrenos e muito mais com descontos de até 50%
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Busque por cidade, bairro ou endereço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input text-gray-900"
                  />
                </div>
                <div className="md:w-48">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="input text-gray-900"
                  >
                    <option value="">Todos os estados</option>
                    {states.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary md:w-auto">
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600 rounded-full opacity-50"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-800 rounded-full opacity-50"></div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Buscar por categoria
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {propertyTypes.map((type) => (
              <Link
                key={type.type}
                to={`/buscar?propertyType=${type.type}`}
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border-2 border-transparent transition-all group"
              >
                <span className="text-4xl mb-3">{type.icon}</span>
                <span className="font-medium text-gray-900 group-hover:text-primary-600">
                  {type.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Imóveis em Destaque
              </h2>
              <Link to="/buscar?featured=true" className="text-primary-600 hover:text-primary-700 font-medium">
                Ver todos →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Ending Soon */}
      {endingSoon.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Encerrando em breve
                </h2>
                <p className="text-gray-600">Não perca essas oportunidades</p>
              </div>
              <Link to="/buscar" className="text-primary-600 hover:text-primary-700 font-medium">
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endingSoon.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cadastre-se</h3>
              <p className="text-gray-400">
                Crie sua conta gratuitamente e tenha acesso a todos os leilões disponíveis.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Encontre seu imóvel</h3>
              <p className="text-gray-400">
                Busque entre milhares de imóveis em leilão por toda a região.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dê seu lance</h3>
              <p className="text-gray-400">
                Participe dos leilões em tempo real e faça o melhor negócio.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link to="/como-funciona" className="btn-accent">
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e tenha acesso a milhares de oportunidades em leilões de imóveis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Criar conta grátis
            </Link>
            <Link to="/buscar" className="btn-outline border-white text-white hover:bg-white/10">
              Explorar imóveis
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
