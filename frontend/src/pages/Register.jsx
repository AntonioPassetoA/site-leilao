import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { maskCPF, maskPhone } from '../utils/formatters'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = maskCPF(value)
    } else if (name === 'phone') {
      formattedValue = maskPhone(value)
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await register({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password
      })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="mt-2 text-gray-600">
            Cadastre-se para participar dos leilões
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="label">Nome completo</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
                placeholder="seu@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cpf" className="label">CPF</label>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  maxLength={14}
                  className="input"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">Telefone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={15}
                  className="input"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirmar senha</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input"
                placeholder="Repita a senha"
              />
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                Concordo com os{' '}
                <Link to="/termos-de-uso" target="_blank" className="text-primary-600 hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/politica-de-privacidade" target="_blank" className="text-primary-600 hover:underline">
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
