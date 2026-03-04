import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { CookieSettings } from '../components/CookieConsent'

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Política de Privacidade"
        description="Política de Privacidade da plataforma Leilão Imóveis. Saiba como tratamos seus dados pessoais em conformidade com a LGPD."
        url="/politica-de-privacidade"
      />
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-gray-500 mb-8">Última atualização: Março de 2026</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800 text-sm">
              Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de Proteção
              de Dados Pessoais (LGPD - Lei nº 13.709/2018).
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
              <p className="text-gray-600 mb-4">
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos
                suas informações pessoais quando você utiliza nosso site de agregação de imóveis de leilão.
              </p>
              <p className="text-gray-600 mb-4">
                Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo
                com esta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Dados que Coletamos</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">2.1 Dados fornecidos por você:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Cadastro:</strong> Nome, e-mail, CPF, telefone e senha</li>
                <li><strong>Formulário de interesse:</strong> Nome, e-mail, telefone e mensagem</li>
                <li><strong>Favoritos:</strong> Lista de imóveis salvos</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">2.2 Dados coletados automaticamente:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Dados de navegação:</strong> Páginas visitadas, tempo de permanência, cliques</li>
                <li><strong>Dados técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
                <li><strong>Cookies:</strong> Identificadores de sessão e preferências</li>
                <li><strong>Localização aproximada:</strong> Baseada no endereço IP</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Finalidade do Tratamento</h2>
              <p className="text-gray-600 mb-4">Utilizamos seus dados para:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Gerenciar sua conta e autenticação</li>
                <li>Entrar em contato sobre imóveis de seu interesse</li>
                <li>Enviar comunicações relevantes (com seu consentimento)</li>
                <li>Personalizar sua experiência no site</li>
                <li>Realizar análises estatísticas e melhorias</li>
                <li>Cumprir obrigações legais</li>
                <li>Prevenir fraudes e garantir a segurança</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Base Legal (LGPD)</h2>
              <p className="text-gray-600 mb-4">
                O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Consentimento:</strong> Para envio de comunicações de marketing</li>
                <li><strong>Execução de contrato:</strong> Para fornecer os serviços solicitados</li>
                <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços e segurança</li>
                <li><strong>Obrigação legal:</strong> Para cumprir exigências legais e regulatórias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Compartilhamento de Dados</h2>
              <p className="text-gray-600 mb-4">
                Seus dados podem ser compartilhados com:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Parceiros comerciais:</strong> Corretores e consultores imobiliários autorizados</li>
                <li><strong>Prestadores de serviço:</strong> Hospedagem, análise de dados, e-mail marketing</li>
                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="text-gray-600 mt-4">
                <strong>Não vendemos</strong> seus dados pessoais para terceiros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Armazenamento e Segurança</h2>
              <p className="text-gray-600 mb-4">
                Adotamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Criptografia de dados em trânsito (HTTPS/SSL)</li>
                <li>Senhas armazenadas com hash seguro (bcrypt)</li>
                <li>Acesso restrito aos dados por funcionários autorizados</li>
                <li>Backups regulares e seguros</li>
                <li>Monitoramento de segurança</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Seus dados são armazenados em servidores localizados no Brasil.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Retenção de Dados</h2>
              <p className="text-gray-600 mb-4">
                Mantemos seus dados pelo tempo necessário para:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Conta ativa:</strong> Enquanto você mantiver a conta</li>
                <li><strong>Leads:</strong> Por até 2 anos após o último contato</li>
                <li><strong>Dados de navegação:</strong> Por até 1 ano</li>
                <li><strong>Obrigações legais:</strong> Pelo prazo exigido por lei</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Após esses períodos, os dados são anonimizados ou excluídos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Seus Direitos (LGPD)</h2>
              <p className="text-gray-600 mb-4">
                De acordo com a LGPD, você tem direito a:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Confirmação:</strong> Saber se tratamos seus dados</li>
                <li><strong>Acesso:</strong> Obter cópia dos seus dados</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão dos dados</li>
                <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se a tratamento que viole a LGPD</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Para exercer seus direitos, entre em contato através dos canais indicados abaixo.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
              <p className="text-gray-600 mb-4">
                Utilizamos cookies para melhorar sua experiência. Os tipos de cookies que usamos:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Essenciais:</strong> Necessários para o funcionamento do site</li>
                <li><strong>Funcionais:</strong> Lembram suas preferências</li>
                <li><strong>Analíticos:</strong> Nos ajudam a entender como o site é usado</li>
                <li><strong>Marketing:</strong> Usados para publicidade relevante (com consentimento)</li>
              </ul>
              <p className="text-gray-600 mt-4 mb-4">
                Você pode gerenciar suas preferências de cookies abaixo ou nas configurações do seu navegador.
              </p>
              <CookieSettings />
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Menores de Idade</h2>
              <p className="text-gray-600 mb-4">
                Nosso site não é destinado a menores de 18 anos. Não coletamos intencionalmente
                dados de menores. Se tomarmos conhecimento de que coletamos dados de um menor,
                tomaremos medidas para excluí-los.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Alterações na Política</h2>
              <p className="text-gray-600 mb-4">
                Podemos atualizar esta política periodicamente. Alterações significativas serão
                comunicadas por e-mail ou aviso no site. Recomendamos revisar esta página regularmente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Encarregado de Dados (DPO)</h2>
              <p className="text-gray-600 mb-4">
                Para questões relacionadas à proteção de dados, contate nosso Encarregado:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-none text-gray-600 space-y-1">
                  <li><strong>Nome:</strong> [Nome do Encarregado]</li>
                  <li><strong>E-mail:</strong> privacidade@seusite.com.br</li>
                  <li><strong>Telefone:</strong> (00) 0000-0000</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Autoridade Nacional</h2>
              <p className="text-gray-600 mb-4">
                Se você acredita que seus direitos não foram atendidos, pode entrar em contato
                com a Autoridade Nacional de Proteção de Dados (ANPD):
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-none text-gray-600 space-y-1">
                  <li><strong>Site:</strong> www.gov.br/anpd</li>
                  <li><strong>E-mail:</strong> anpd@anpd.gov.br</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contato</h2>
              <p className="text-gray-600 mb-4">
                Para dúvidas, solicitações ou reclamações sobre esta política:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-none text-gray-600 space-y-1">
                  <li><strong>E-mail:</strong> contato@seusite.com.br</li>
                  <li><strong>Telefone:</strong> (00) 0000-0000</li>
                  <li><strong>Endereço:</strong> [Endereço completo]</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t flex flex-wrap gap-4">
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
              &larr; Voltar para a página inicial
            </Link>
            <Link to="/termos-de-uso" className="text-primary-600 hover:text-primary-700 font-medium">
              Ver Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
