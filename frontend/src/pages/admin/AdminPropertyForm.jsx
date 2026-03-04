import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function AdminPropertyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpots: '',
    propertyType: 'HOUSE',
    auctionType: 'JUDICIAL',
    minBid: '',
    bidIncrement: '1000',
    auctionStart: '',
    auctionEnd: '',
    featured: false
  })

  const [images, setImages] = useState([])

  useEffect(() => {
    if (isEditing) {
      loadProperty()
    }
  }, [id])

  const loadProperty = async () => {
    try {
      const response = await api.get(`/properties/${id}`)
      const property = response.data

      setFormData({
        title: property.title,
        description: property.description,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        area: property.area || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        parkingSpots: property.parkingSpots || '',
        propertyType: property.propertyType,
        auctionType: property.auctionType,
        minBid: property.minBid,
        bidIncrement: property.bidIncrement || '1000',
        auctionStart: formatDateForInput(property.auctionStart),
        auctionEnd: formatDateForInput(property.auctionEnd),
        featured: property.featured
      })

      setImages(property.images || [])
    } catch (error) {
      console.error('Error loading property:', error)
      setError('Erro ao carregar imóvel')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (date) => {
    const d = new Date(date)
    return d.toISOString().slice(0, 16)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e) => {
    const files = e.target.files
    if (!files.length) return

    setUploading(true)
    const formDataUpload = new FormData()

    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('images', files[i])
    }

    try {
      const response = await api.post('/upload/multiple', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const newImages = response.data.urls.map(url => ({ url }))
      setImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...formData,
        images: images.map(img => img.url)
      }

      if (isEditing) {
        await api.put(`/admin/properties/${id}`, payload)
      } else {
        await api.post('/admin/properties', payload)
      }

      navigate('/admin/imoveis')
    } catch (error) {
      console.error('Error saving property:', error)
      setError(error.response?.data?.error || 'Erro ao salvar imóvel')
    } finally {
      setSaving(false)
    }
  }

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Atualize as informações do imóvel' : 'Preencha os dados para cadastrar um novo imóvel'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input"
                placeholder="Ex: Casa 3 quartos em Copacabana"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="input"
                placeholder="Descreva o imóvel..."
              />
            </div>

            <div>
              <label className="label">Tipo de Imóvel</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="input"
              >
                <option value="HOUSE">Casa</option>
                <option value="APARTMENT">Apartamento</option>
                <option value="LAND">Terreno</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="RURAL">Rural</option>
              </select>
            </div>

            <div>
              <label className="label">Modalidade do Leilão</label>
              <select
                name="auctionType"
                value={formData.auctionType}
                onChange={handleChange}
                className="input"
              >
                <option value="JUDICIAL">Judicial</option>
                <option value="EXTRAJUDICIAL">Extrajudicial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Endereço</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="input"
                placeholder="Rua, número, bairro"
              />
            </div>

            <div>
              <label className="label">Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">Selecione</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">CEP</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                required
                className="input"
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Características</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Área (m²)</label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="input"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Quartos</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Banheiros</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Vagas</label>
              <input
                type="number"
                name="parkingSpots"
                value={formData.parkingSpots}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Auction Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Leilão</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Lance Mínimo (R$)</label>
              <input
                type="number"
                name="minBid"
                value={formData.minBid}
                onChange={handleChange}
                required
                className="input"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Incremento Mínimo (R$)</label>
              <input
                type="number"
                name="bidIncrement"
                value={formData.bidIncrement}
                onChange={handleChange}
                required
                className="input"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Data/Hora de Início</label>
              <input
                type="datetime-local"
                name="auctionStart"
                value={formData.auctionStart}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Data/Hora de Término</label>
              <input
                type="datetime-local"
                name="auctionEnd"
                value={formData.auctionEnd}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">Destacar na página inicial</span>
              </label>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagens</h2>

          <div className="mb-4">
            <label className="block">
              <span className="btn-secondary cursor-pointer inline-flex items-center">
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Adicionar imagens
                  </>
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/imoveis')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
          </button>
        </div>
      </form>
    </div>
  )
}
