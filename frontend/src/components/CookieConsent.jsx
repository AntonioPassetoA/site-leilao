import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_PREFERENCES_KEY = 'cookie_preferences'

// Default cookie preferences
const defaultPreferences = {
  essential: true, // Always required
  functional: false,
  analytics: false,
  marketing: false
}

export function getCookieConsent() {
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent === 'true'
}

export function getCookiePreferences() {
  try {
    const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    return prefs ? JSON.parse(prefs) : null
  } catch {
    return null
  }
}

export function hasAnalyticsConsent() {
  const prefs = getCookiePreferences()
  return prefs?.analytics === true
}

export function hasMarketingConsent() {
  const prefs = getCookiePreferences()
  return prefs?.marketing === true
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState(defaultPreferences)

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!hasConsent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = (prefs) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setIsVisible(false)

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: prefs }))
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    setPreferences(allAccepted)
    saveConsent(allAccepted)
  }

  const handleAcceptEssential = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    setPreferences(essentialOnly)
    saveConsent(essentialOnly)
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
  }

  const togglePreference = (key) => {
    if (key === 'essential') return // Essential cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 pointer-events-auto"
        onClick={() => {}} // Prevent closing by clicking backdrop
      />

      {/* Cookie Banner */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl pointer-events-auto animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Utilizamos cookies
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Usamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego.
                De acordo com a LGPD, você pode escolher quais cookies deseja permitir.
              </p>
            </div>
          </div>

          {/* Cookie Details (expandable) */}
          {showDetails && (
            <div className="mb-6 space-y-3 border-t border-b py-4">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Essenciais</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Obrigatório</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Necessários para o funcionamento do site. Incluem autenticação e preferências.
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="w-12 h-6 bg-primary-600 rounded-full relative cursor-not-allowed">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Funcionais</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Permitem funcionalidades aprimoradas como favoritos e preferências de busca.
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={() => togglePreference('functional')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      preferences.functional ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.functional ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Analíticos</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Nos ajudam a entender como os visitantes usam o site para melhorarmos nossos serviços.
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      preferences.analytics ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.analytics ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Marketing</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Usados para exibir anúncios relevantes e medir a eficácia de campanhas.
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      preferences.marketing ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.marketing ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Aceitar todos
            </button>
            <button
              onClick={handleAcceptEssential}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Apenas essenciais
            </button>
            {showDetails ? (
              <button
                onClick={handleSavePreferences}
                className="w-full sm:w-auto px-6 py-2.5 border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium rounded-lg transition-colors"
              >
                Salvar preferências
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="w-full sm:w-auto px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Personalizar
              </button>
            )}
          </div>

          {/* Privacy Policy Link */}
          <p className="text-xs text-gray-500 mt-4 text-center sm:text-left">
            Saiba mais sobre como usamos cookies em nossa{' '}
            <Link to="/politica-de-privacidade" className="text-primary-600 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// Component to manage cookie settings (can be used in a settings page)
export function CookieSettings() {
  const [preferences, setPreferences] = useState(() => {
    return getCookiePreferences() || defaultPreferences
  })
  const [saved, setSaved] = useState(false)

  const togglePreference = (key) => {
    if (key === 'essential') return
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: preferences }))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferências de Cookies</h3>

      <div className="space-y-4">
        {[
          { key: 'essential', label: 'Essenciais', desc: 'Necessários para o funcionamento', required: true },
          { key: 'functional', label: 'Funcionais', desc: 'Funcionalidades aprimoradas' },
          { key: 'analytics', label: 'Analíticos', desc: 'Análise de uso do site' },
          { key: 'marketing', label: 'Marketing', desc: 'Anúncios personalizados' }
        ].map(({ key, label, desc, required }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <span className="font-medium text-gray-900">{label}</span>
              {required && <span className="ml-2 text-xs text-gray-500">(obrigatório)</span>}
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <button
              onClick={() => togglePreference(key)}
              disabled={required}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                preferences[key] ? 'bg-primary-600' : 'bg-gray-300'
              } ${required ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                preferences[key] ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="mt-4 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
      >
        {saved ? 'Salvo!' : 'Salvar preferências'}
      </button>
    </div>
  )
}
