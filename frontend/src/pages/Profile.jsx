import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { formatCPF, formatPhone, maskPhone } from '../utils/formatters'

export default function Profile() {
  const { user, updateUser } = useAuth()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'phone') {
      formattedValue = maskPhone(value)
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone.replace(/\D/g, '')
      })
      updateUser(response.data.user)
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar perfil' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage({ type: '', text: '' })

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não conferem' })
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' })
      setPasswordLoading(false)
      return
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao alterar senha' })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

        {/* Profile Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {message.text && (
              <div className={`p-4 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="input bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">CPF</label>
                <input
                  type="text"
                  value={formatCPF(user?.cpf)}
                  disabled
                  className="input bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="label">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={15}
                  className="input"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMessage.text && (
              <div className={`p-4 rounded-lg text-sm ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {passwordMessage.text}
              </div>
            )}

            <div>
              <label className="label">Senha atual</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Nova senha</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="input"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="label">Confirmar nova senha</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-primary disabled:opacity-50"
            >
              {passwordLoading ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
