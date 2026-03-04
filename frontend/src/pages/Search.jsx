import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard'
import { SearchSEO } from '../components/SEO'
import { getProperties, getStates, getCities } from '../services/propertyService'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [pagination, setPagination] = useState({})
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    auctionType: searchParams.get('auctionType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)

  useEffect(() => {
    loadStates()
  }, [])

  useEffect(() => {
    if (filters.state) {
      loadCities(filters.state)
    } else {
      setCities([])
    }
  }, [filters.state])

  useEffect(() => {
    loadProperties()
  }, [page, searchParams])

  const loadStates = async () => {
    try {
      const data = await getStates()
      setStates(data)
    } catch (error) {
      console.error('Error loading states:', error)
    }
  }

  const loadCities = async (state) => {
    try {
      const data = await getCities(state)
      setCities(data)
    } catch (error) {
      console.error('Error loading cities:', error)
    }
  }

  const loadProperties = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 12,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      }

      const data = await getProperties(params)
      setProperties(data.properties)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set('page', '1')
    setSearchParams(params)
    setPage(1)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      state: '',
      city: '',
      propertyType: '',
      auctionType: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    setSearchParams({})
    setPage(1)
  }

  const propertyTypes = [
    { value: '', label: 'Todos os tipos' },
    { value: 'HOUSE', label: 'Casa' },
    { value: 'APARTMENT', label: 'Apartamento' },
    { value: 'LAND', label: 'Terreno' },
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'RURAL', label: 'Rural' }
  ]

  const auctionTypes = [
    { value: '', label: 'Todas as modalidades' },
    { value: 'JUDICIAL', label: 'Judicial' },
    { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' }
  ]

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Mais recentes' },
    { value: 'createdAt-asc', label: 'Mais antigos' },
    { value: 'minBid-asc', label: 'Menor preço' },
    { value: 'minBid-desc', label: 'Maior preço' },
    { value: 'auctionEnd-asc', label: 'Encerrando primeiro' }
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <SearchSEO state={filters.state} city={filters.city} propertyType={filters.propertyType} />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Buscar Imóveis em Leilão
          </h1>

          {/* Search bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Busque por cidade, bairro ou endereço..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                className="input"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="btn-secondary flex items-center justify-center md:hidden"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            <button onClick={applyFilters} className="btn-primary">
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`lg:w-72 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Limpar
                </button>
              </div>

              <div className="space-y-4">
                {/* State */}
                <div>
                  <label className="label">Estado</label>
                  <select
                    value={filters.state}
                    onChange={(e) => {
                      handleFilterChange('state', e.target.value)
                      handleFilterChange('city', '')
                    }}
                    className="input"
                  >
                    <option value="">Todos os estados</option>
                    {states.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                {cities.length > 0 && (
                  <div>
                    <label className="label">Cidade</label>
                    <select
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="input"
                    >
                      <option value="">Todas as cidades</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Property Type */}
                <div>
                  <label className="label">Tipo de Imóvel</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="input"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Auction Type */}
                <div>
                  <label className="label">Modalidade</label>
                  <select
                    value={filters.auctionType}
                    onChange={(e) => handleFilterChange('auctionType', e.target.value)}
                    className="input"
                  >
                    {auctionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="label">Faixa de Preço</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder="Máx"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <button onClick={applyFilters} className="btn-primary w-full">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Sort and count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-gray-600">
                {pagination.total || 0} imóveis encontrados
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                    setTimeout(applyFilters, 0)
                  }}
                  className="input py-1 px-3 w-auto"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Properties Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            ) : properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
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

                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          className={`px-4 py-2 rounded-lg ${
                            page === i + 1
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )).slice(
                        Math.max(0, page - 3),
                        Math.min(pagination.totalPages, page + 2)
                      )}

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
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum imóvel encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros para encontrar mais resultados.
                </p>
                <button onClick={clearFilters} className="btn-primary">
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
