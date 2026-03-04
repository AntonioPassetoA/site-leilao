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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, logsRes, schedulerRes, bbStatsRes, multiBankRes] = await Promise.all([
        api.get('/scraper/stats'),
        api.get('/scraper/logs?limit=10'),
        api.get('/scraper/scheduler/status'),
        api.get('/scraper/bb/stats').catch(() => ({ data: { totalProperties: 0 } })),
        api.get('/scraper/banks/stats').catch(() => ({ data: {} }))
      ])
      setStats(statsRes.data)
      setLogs(logsRes.data)
      setScheduler(schedulerRes.data)
      setBBStats(bbStatsRes.data)
      setMultiBankStats(multiBankRes.data)
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
        <h3 className="font-semibold text-blue-900 mb-2">Sobre a Importação</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Caixa:</strong> Importação via CSV oficial - mais rápida e confiável</li>
          <li><strong>Banco do Brasil:</strong> Scraping via Puppeteer do site seuimovelbb.com.br</li>
          <li><strong>Santander:</strong> Scraping via Puppeteer do portal Resale.com.br</li>
          <li><strong>Itaú:</strong> Scraping via Puppeteer do portal de imóveis do Itaú</li>
          <li><strong>Portal Zuk:</strong> Agregador de leilões com múltiplas fontes</li>
          <li>A importação atualiza automaticamente imóveis já existentes (não duplica)</li>
          <li>Recomendamos executar a importação completa pelo menos uma vez por dia</li>
        </ul>
      </div>
    </div>
  )
}
