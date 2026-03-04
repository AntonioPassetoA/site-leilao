import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Leilão Imóveis</span>
            </Link>
            <p className="text-gray-400 max-w-md">
              Plataforma agregadora de imóveis de leilão dos principais bancos do Brasil.
              Encontre as melhores oportunidades em um só lugar.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/buscar" className="hover:text-white transition-colors">
                  Buscar Imóveis
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="hover:text-white transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/cadastro" className="hover:text-white transition-colors">
                  Cadastre-se
                </Link>
              </li>
            </ul>

            <h3 className="text-white font-semibold mb-4 mt-6">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/termos-de-uso" className="hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contato@leilaoimoveis.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(11) 9999-9999</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Leilão Imóveis. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link to="/termos-de-uso" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-4">
            Este site é um agregador de informações. Não realizamos leilões nem intermediamos negociações.
          </p>
        </div>
      </div>
    </footer>
  )
}
