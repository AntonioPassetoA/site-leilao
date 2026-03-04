import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatDateTime } from '../../utils/formatters'

const ESTADOS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
]

export default function AdminScraper() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [scrapingState, setScrapingState] = useState(null)
  const [selectedState, setSelectedState] = useState('')
  const [message, setMessage] = useState(null)
  const [scheduler, setScheduler] = useState(null)
  const [schedulerInterval, setSchedulerInterval] = useState(6)
  const [bbStats, setBBStats] = useState(null)
  const [scrapingBB, setScrapingBB] = useState(false)
  const [multiBankStats, setMultiBankStats] = useState({})
  const [scrapingBank, setScrapingBank] = useState(null)
  const [leiloeirosStats, setLeiloeirosStats] = useState({})
  const [scrapingLeiloeiro, setScrapingLeiloeiro] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, logsRes, schedulerRes, bbStatsRes, multiBankRes, leiloeirosRes] = await Promise.all([
        api.get('/scraper/stats'),
        api.get('/scraper/logs?limit=10'),
        api.get('/scraper/scheduler/status'),
        api.get('/scraper/bb/stats').catch(() => ({ data: { totalProperties: 0 } })),
        api.get('/scraper/banks/stats').catch(() => ({ data: {} })),
        api.get('/scraper/leiloeiros/stats').catch(() => ({ data: {} }))
      ])
      setStats(statsRes.data)
      setLogs(logsRes.data)
      setScheduler(schedulerRes.data)
      setBBStats(bbStatsRes.data)
      setMultiBankStats(multiBankRes.data)
      setLeiloeirosStats(leiloeirosRes.data)
    } catch (error) {
      console.error('Error loading scraper data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartScheduler = async () => {
    try {
      await api.post('/scraper/scheduler/start', { interval: schedulerInterval })
      setMessage({ type: 'success', text: `Atualização automática ativada (a cada ${schedulerInterval} horas)` })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao ativar atualização automática' })
    }
  }

  const handleStopScheduler = async () => {
    try {
      await api.post('/scraper/scheduler/stop')
      setMessage({ type: 'success', text: 'Atualização automática desativada' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao desativar atualização automática' })
    }
  }

  const handleScrapeBB = async () => {
    setScrapingBB(true)
    setMessage({ type: 'info', text: 'Importando imóveis do Banco do Brasil...' })

    try {
      await api.post('/scraper/bb')
      setMessage({ type: 'success', text: 'Importação do Banco do Brasil iniciada em background.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao iniciar importação do BB: ' + error.message })
    } finally {
      setScrapingBB(false)
      setTimeout(loadData, 10000)
    }
  }

  const handleScrapeBank = async (bank, endpoint, bankName) => {
    setScrapingBank(bank)
    setMessage({ type: 'info', text: `Importando imóveis ${bankName}...` })

    try {
      await api.post(endpoint)
      setMessage({ type: 'success', text: `Importação ${bankName} iniciada em background.` })
    } catch (error) {
      setMessage({ type: 'error', text: `Erro ao iniciar importação ${bankName}: ` + error.message })
    } finally {
      setScrapingBank(null)
      setTimeout(loadData, 10000)
    }
  }

  const handleScrapeAllBanks = async () => {
    if (!confirm('Iniciar importação de TODOS os bancos? Isso pode demorar vários minutos.')) {
      return
    }

    setScrapingBank('ALL_BANKS')
    setMessage({ type: 'info', text: 'Importação de todos os bancos iniciada...' })

    try {
      await api.post('/scraper/banks/all')
      setMessage({ type: 'success', text: 'Importação de todos os bancos iniciada em background.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao iniciar importação: ' + error.message })
    } finally {
      setScrapingBank(null)
      setTimeout(loadData, 15000)
    }
  }

  const handleScrapeLeiloeiro = async (leiloeiro, endpoint, leiloeiroName) => {
    setScrapingLeiloeiro(leiloeiro)
    setMessage({ type: 'info', text: `Importando imóveis ${leiloeiroName}...` })

    try {
      await api.post(endpoint)
      setMessage({ type: 'success', text: `Importação ${leiloeiroName} iniciada em background.` })
    } catch (error) {
      setMessage({ type: 'error', text: `Erro ao iniciar importação ${leiloeiroName}: ` + error.message })
    } finally {
      setScrapingLeiloeiro(null)
      setTimeout(loadData, 10000)
    }
  }

  const handleScrapeAllLeiloeiros = async () => {
    if (!confirm('Iniciar importação de TODOS os leiloeiros? Isso pode demorar vários minutos.')) {
      return
    }

    setScrapingLeiloeiro('ALL_LEILOEIROS')
    setMessage({ type: 'info', text: 'Importação de todos os leiloeiros iniciada...' })

    try {
      await api.post('/scraper/leiloeiros/all')
      setMessage({ type: 'success', text: 'Importação de todos os leiloeiros iniciada em background.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao iniciar importação: ' + error.message })
    } finally {
      setScrapingLeiloeiro(null)
      setTimeout(loadData, 15000)
    }
  }

  const handleScrapeAll = async () => {
    if (!confirm('Iniciar importação de TODOS os estados? Isso pode demorar alguns minutos.')) {
      return
    }

    setScraping(true)
    setScrapingState('ALL')
    setMessage({ type: 'info', text: 'Importação iniciada para todos os estados...' })

    try {
      await api.post('/scraper/all')
      setMessage({ type: 'success', text: 'Importação iniciada em background. Aguarde alguns minutos e atualize a página.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao iniciar importação: ' + error.message })
    } finally {
      setScraping(false)
      setScrapingState(null)
      // Reload data after a delay
      setTimeout(loadData, 5000)
    }
  }

  const handleScrapeState = async () => {
    if (!selectedState) {
      setMessage({ type: 'error', text: 'Selecione um estado' })
      return
    }

    setScraping(true)
    setScrapingState(selectedState)
    setMessage({ type: 'info', text: `Importando imóveis de ${selectedState}...` })

    try {
      await api.post(`/scraper/${selectedState}`)
      setMessage({ type: 'success', text: `Importação de ${selectedState} iniciada. Aguarde alguns segundos.` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao iniciar importação: ' + error.message })
    } finally {
      setScraping(false)
      setScrapingState(null)
      // Reload data after a delay
      setTimeout(loadData, 5000)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar Imóveis (Caixa)</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Imóveis</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalProperties || 0}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Imóveis da Caixa</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.caixaProperties || 0}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Última Importação</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.lastScraping ? formatDateTime(stats.lastScraping) : 'Nunca'}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Imóveis Banco do Brasil</p>
              <p className="text-3xl font-bold text-gray-900">{bbStats?.totalProperties || 0}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Import Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Importar Imóveis</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Import All */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Importar Todos os Estados</h3>
            <p className="text-sm text-gray-500 mb-4">
              Importa imóveis de todos os 27 estados do Brasil. Este processo pode levar vários minutos.
            </p>
            <button
              onClick={handleScrapeAll}
              disabled={scraping}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scraping && scrapingState === 'ALL' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </span>
              ) : (
                'Importar Todos os Estados'
              )}
            </button>
          </div>

          {/* Import Single State */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Importar Estado Específico</h3>
            <p className="text-sm text-gray-500 mb-4">
              Selecione um estado para importar apenas os imóveis daquela região.
            </p>
            <div className="flex gap-2">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="input-field flex-1"
                disabled={scraping}
              >
                <option value="">Selecione o estado</option>
                {ESTADOS.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
              <button
                onClick={handleScrapeState}
                disabled={scraping || !selectedState}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scraping && scrapingState === selectedState ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Importar'
                )}
              </button>
            </div>
          </div>

          {/* Import BB */}
          <div className="border rounded-lg p-4 border-yellow-300 bg-yellow-50">
            <h3 className="font-medium text-gray-900 mb-2">Banco do Brasil</h3>
            <p className="text-sm text-gray-500 mb-4">
              Importa imóveis do site seuimovelbb.com.br usando navegador automatizado (Puppeteer).
            </p>
            <button
              onClick={handleScrapeBB}
              disabled={scrapingBB}
              className="btn-primary w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scrapingBB ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </span>
              ) : (
                'Importar Banco do Brasil'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Other Banks Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Outros Bancos e Portais</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Santander */}
          <div className="border rounded-lg p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <h3 className="font-medium text-gray-900">Santander</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Via Resale.com.br</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{multiBankStats['Santander'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeBank('santander', '/scraper/santander', 'Santander')}
              disabled={scrapingBank !== null}
              className="btn-primary w-full text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {scrapingBank === 'santander' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Itaú */}
          <div className="border rounded-lg p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <h3 className="font-medium text-gray-900">Itaú</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Portal Itaú Imóveis</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{multiBankStats['Itaú Unibanco'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeBank('itau', '/scraper/itau', 'Itaú')}
              disabled={scrapingBank !== null}
              className="btn-primary w-full text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {scrapingBank === 'itau' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Portal Zuk */}
          <div className="border rounded-lg p-4 border-purple-200 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <h3 className="font-medium text-gray-900">Portal Zuk</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Agregador de Leilões</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{multiBankStats['Portal Zuk'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeBank('zuk', '/scraper/zuk', 'Portal Zuk')}
              disabled={scrapingBank !== null}
              className="btn-primary w-full text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {scrapingBank === 'zuk' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Import All Banks */}
          <div className="border rounded-lg p-4 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-purple-500"></div>
              <h3 className="font-medium text-gray-900">Todos os Bancos</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Santander + Itaú + Portal Zuk</p>
            <p className="text-lg font-bold text-gray-900 mb-3">
              {(multiBankStats['Santander'] || 0) + (multiBankStats['Itaú Unibanco'] || 0) + (multiBankStats['Portal Zuk'] || 0)} total
            </p>
            <button
              onClick={handleScrapeAllBanks}
              disabled={scrapingBank !== null}
              className="btn-primary w-full text-sm bg-gradient-to-r from-red-600 via-orange-600 to-purple-600 hover:from-red-700 hover:via-orange-700 hover:to-purple-700 disabled:opacity-50"
            >
              {scrapingBank === 'ALL_BANKS' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar Todos'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          * Os scrapers de outros bancos utilizam Puppeteer (navegador automatizado) e podem demorar mais tempo.
        </p>
      </div>

      {/* Leiloeiros Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Leiloeiros e Portais de Leilão</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Bradesco */}
          <div className="border rounded-lg p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <h3 className="font-medium text-gray-900">Bradesco</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Leilões Bradesco</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Bradesco'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('bradesco', '/scraper/bradesco', 'Bradesco')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'bradesco' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Sold Leilões */}
          <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <h3 className="font-medium text-gray-900">Sold Leilões</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Portal Sold</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Sold'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('sold', '/scraper/sold', 'Sold Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'sold' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Mega Leilões */}
          <div className="border rounded-lg p-4 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <h3 className="font-medium text-gray-900">Mega Leilões</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Portal Mega Leilões</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Mega Leilões'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('mega', '/scraper/mega', 'Mega Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'mega' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Lance no Leilão */}
          <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-600"></div>
              <h3 className="font-medium text-gray-900">Lance no Leilão</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Portal Lance no Leilão</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Lance no Leilão'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('lance', '/scraper/lance', 'Lance no Leilão')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'lance' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Superbid */}
          <div className="border rounded-lg p-4 border-indigo-200 bg-indigo-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <h3 className="font-medium text-gray-900">Superbid</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Portal Superbid</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Superbid'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('superbid', '/scraper/superbid', 'Superbid')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'superbid' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar'}
            </button>
          </div>

          {/* Import All Leiloeiros */}
          <div className="border rounded-lg p-4 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-indigo-500"></div>
              <h3 className="font-medium text-gray-900">Todos os Leiloeiros</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Bradesco + Sold + Mega + Lance + Superbid</p>
            <p className="text-lg font-bold text-gray-900 mb-3">
              {(leiloeirosStats['Bradesco'] || 0) + (leiloeirosStats['Sold'] || 0) + (leiloeirosStats['Mega Leilões'] || 0) + (leiloeirosStats['Lance no Leilão'] || 0) + (leiloeirosStats['Superbid'] || 0)} total
            </p>
            <button
              onClick={handleScrapeAllLeiloeiros}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-gradient-to-r from-red-600 via-green-600 to-indigo-600 hover:from-red-700 hover:via-green-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'ALL_LEILOEIROS' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Importando...
                </span>
              ) : 'Importar Todos'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          * Os leiloeiros principais são executados automaticamente diariamente às 05:00 (horário de Brasília).
        </p>
      </div>

      {/* Leiloeiros Adicionais Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Leiloeiros Adicionais</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Biasi */}
          <div className="border rounded-lg p-3 border-pink-200 bg-pink-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-pink-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Biasi Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Biasi Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('biasi', '/scraper/biasi', 'Biasi Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'biasi' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Frazão */}
          <div className="border rounded-lg p-3 border-cyan-200 bg-cyan-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Frazão Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Frazão Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('frazao', '/scraper/frazao', 'Frazão Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'frazao' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* VIP Leilões */}
          <div className="border rounded-lg p-3 border-violet-200 bg-violet-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">VIP Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['VIP Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('vip', '/scraper/vip', 'VIP Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'vip' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Pestana */}
          <div className="border rounded-lg p-3 border-rose-200 bg-rose-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Pestana Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Pestana Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('pestana', '/scraper/pestana', 'Pestana Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'pestana' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Kronberg */}
          <div className="border rounded-lg p-3 border-teal-200 bg-teal-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-teal-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Kronberg Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Kronberg Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('kronberg', '/scraper/kronberg', 'Kronberg Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'kronberg' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Sato */}
          <div className="border rounded-lg p-3 border-lime-200 bg-lime-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-lime-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Sato Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Sato Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('sato', '/scraper/sato', 'Sato Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-lime-600 hover:bg-lime-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'sato' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Lut */}
          <div className="border rounded-lg p-3 border-sky-200 bg-sky-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-sky-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Lut Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Lut Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('lut', '/scraper/lut', 'Lut Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'lut' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Sodré Santoro */}
          <div className="border rounded-lg p-3 border-fuchsia-200 bg-fuchsia-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-fuchsia-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Sodré Santoro</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Sodré Santoro'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('sodre', '/scraper/sodre', 'Sodré Santoro')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'sodre' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Zukerman */}
          <div className="border rounded-lg p-3 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Zukerman Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Zukerman Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('zukerman', '/scraper/zukerman', 'Zukerman Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'zukerman' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Brado */}
          <div className="border rounded-lg p-3 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Brado Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Brado Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('brado', '/scraper/brado', 'Brado Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'brado' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Freitag */}
          <div className="border rounded-lg p-3 border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-slate-600"></div>
              <h3 className="font-medium text-gray-900 text-sm">Freitag Leilões</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{leiloeirosStats['Freitag Leilões'] || 0}</p>
            <button
              onClick={() => handleScrapeLeiloeiro('freitag', '/scraper/freitag', 'Freitag Leilões')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-xs py-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'freitag' ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          * Os leiloeiros adicionais são executados automaticamente diariamente às 06:00 (horário de Brasília).
        </p>
      </div>

      {/* Bancos Adicionais Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Bancos Adicionais</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* BRB */}
          <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-700"></div>
              <h3 className="font-medium text-gray-900">BRB</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Banco de Brasília</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['BRB'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('brb', '/scraper/brb', 'BRB')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-blue-700 hover:bg-blue-800 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'brb' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Banrisul */}
          <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <h3 className="font-medium text-gray-900">Banrisul</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Banco do Rio Grande do Sul</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Banrisul'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('banrisul', '/scraper/banrisul', 'Banrisul')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'banrisul' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Import All Bancos Adicionais */}
          <div className="border rounded-lg p-4 border-gray-300 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-800"></div>
              <h3 className="font-medium text-gray-900">Todos os Bancos</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">BRB + Banrisul</p>
            <p className="text-lg font-bold text-gray-900 mb-3">
              {(leiloeirosStats['BRB'] || 0) + (leiloeirosStats['Banrisul'] || 0)} total
            </p>
            <button
              onClick={() => handleScrapeLeiloeiro('ALL_BANCOS', '/scraper/bancos-adicionais/all', 'todos os bancos adicionais')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-gradient-to-r from-blue-600 to-blue-800 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'ALL_BANCOS' ? 'Importando...' : 'Importar Todos'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          * Os bancos adicionais são executados automaticamente diariamente às 07:00 (horário de Brasília).
        </p>
      </div>

      {/* Fontes Governamentais Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Fontes Governamentais</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* EMGEA */}
          <div className="border rounded-lg p-4 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-700"></div>
              <h3 className="font-medium text-gray-900">EMGEA</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Empresa Gestora de Ativos</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['EMGEA'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('emgea', '/scraper/emgea', 'EMGEA')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-green-700 hover:bg-green-800 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'emgea' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Receita Federal */}
          <div className="border rounded-lg p-4 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
              <h3 className="font-medium text-gray-900">Receita Federal</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">Leilões da Receita</p>
            <p className="text-lg font-bold text-gray-900 mb-3">{leiloeirosStats['Receita Federal'] || 0} imóveis</p>
            <button
              onClick={() => handleScrapeLeiloeiro('receita', '/scraper/receita', 'Receita Federal')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'receita' ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {/* Import All Governamentais */}
          <div className="border rounded-lg p-4 border-gray-300 bg-gradient-to-br from-green-50 to-yellow-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-yellow-600"></div>
              <h3 className="font-medium text-gray-900">Todas as Fontes</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">EMGEA + Receita Federal</p>
            <p className="text-lg font-bold text-gray-900 mb-3">
              {(leiloeirosStats['EMGEA'] || 0) + (leiloeirosStats['Receita Federal'] || 0)} total
            </p>
            <button
              onClick={() => handleScrapeLeiloeiro('ALL_GOV', '/scraper/governamentais/all', 'todas as fontes governamentais')}
              disabled={scrapingLeiloeiro !== null}
              className="btn-primary w-full text-sm bg-gradient-to-r from-green-600 to-yellow-600 disabled:opacity-50"
            >
              {scrapingLeiloeiro === 'ALL_GOV' ? 'Importando...' : 'Importar Todos'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          * As fontes governamentais são executadas automaticamente diariamente às 08:00 (horário de Brasília).
        </p>
      </div>

      {/* Import Logs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Histórico de Importações</h2>
          <button onClick={loadData} className="text-primary-600 hover:text-primary-700 text-sm">
            Atualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encontrados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atualizados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erros</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{log.state || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {log.totalFound}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                      {log.imported}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                      {log.updated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">
                      {log.errors}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'completed' ? 'bg-green-100 text-green-700' :
                        log.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.status === 'completed' ? 'Concluído' :
                         log.status === 'running' ? 'Executando' : 'Erro'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {formatDateTime(log.startedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Nenhuma importação realizada ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduler */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Atualização Automática</h2>

        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-3 rounded-full ${scheduler?.running ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-gray-700">
            {scheduler?.running ? 'Ativa' : 'Inativa'}
          </span>
          {scheduler?.nextRun && (
            <span className="text-sm text-gray-500">
              Próxima execução: {formatDateTime(scheduler.nextRun)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Intervalo:</label>
            <select
              value={schedulerInterval}
              onChange={(e) => setSchedulerInterval(Number(e.target.value))}
              className="input-field w-32"
              disabled={scheduler?.running}
            >
              <option value={1}>1 hora</option>
              <option value={3}>3 horas</option>
              <option value={6}>6 horas</option>
              <option value={12}>12 horas</option>
              <option value={24}>24 horas</option>
            </select>
          </div>

          {scheduler?.running ? (
            <button onClick={handleStopScheduler} className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
              Desativar
            </button>
          ) : (
            <button onClick={handleStartScheduler} className="btn-primary">
              Ativar Atualização Automática
            </button>
          )}
        </div>

        {scheduler?.isScrapingNow && (
          <div className="mt-4 flex items-center gap-2 text-amber-600">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Importação em andamento...</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Sobre a Importação</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Bancos Principais</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Caixa:</strong> Via CSV oficial (02:00)</li>
              <li><strong>Banco do Brasil:</strong> seuimovelbb.com.br (03:00)</li>
              <li><strong>Santander:</strong> Resale.com.br (04:00)</li>
              <li><strong>Itaú:</strong> Portal Itaú Imóveis (04:00)</li>
              <li><strong>Portal Zuk:</strong> Agregador de leilões (04:00)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">Leiloeiros Principais</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Bradesco, Sold, Mega Leilões</strong> (05:00)</li>
              <li><strong>Lance no Leilão, Superbid</strong> (05:00)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">Leiloeiros Adicionais</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Biasi, Frazão, VIP, Pestana</strong> (06:00)</li>
              <li><strong>Kronberg, Sato, Lut, Sodré Santoro</strong> (06:00)</li>
              <li><strong>Zukerman, Brado, Freitag</strong> (06:00)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">Outras Fontes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>BRB, Banrisul:</strong> Bancos regionais (07:00)</li>
              <li><strong>EMGEA:</strong> Imóveis da União (08:00)</li>
              <li><strong>Receita Federal:</strong> Leilões judiciais (08:00)</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-700">
            A importação atualiza automaticamente imóveis já existentes (não duplica).
            Total de <strong>20+ fontes</strong> de leilões de imóveis integradas.
          </p>
        </div>
      </div>
    </div>
  )
}
