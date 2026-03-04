import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function TermsOfUse() {
  return (
    <>
      <SEO
        title="Termos de Uso"
        description="Termos de Uso da plataforma Leilão Imóveis. Conheça as regras e condições para utilização do nosso serviço de agregação de imóveis de leilão."
        url="/termos-de-uso"
      />
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-gray-500 mb-8">Última atualização: Março de 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-600 mb-4">
                Ao acessar e utilizar este site, você concorda em cumprir e estar vinculado aos seguintes
                termos e condições de uso. Se você não concordar com qualquer parte destes termos,
                não deverá utilizar nosso site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
              <p className="text-gray-600 mb-4">
                Este site é uma <strong>plataforma agregadora de imóveis de leilão</strong>. Nosso serviço
                consiste em coletar e exibir informações públicas sobre imóveis disponíveis em leilões
                de diversas instituições financeiras e leiloeiros.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Importante:</strong> Não realizamos leilões, não intermediamos negociações e não
                somos responsáveis pela venda dos imóveis. Atuamos apenas como um facilitador de informações,
                redirecionando os usuários para os sites oficiais das instituições responsáveis pelos leilões.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Uso do Site</h2>
              <p className="text-gray-600 mb-4">Você concorda em:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Usar o site apenas para fins legais e de acordo com estes Termos</li>
                <li>Não usar o site de forma que possa danificar, desabilitar ou sobrecarregar nossos servidores</li>
                <li>Não tentar acessar áreas restritas do site sem autorização</li>
                <li>Não coletar informações de outros usuários sem consentimento</li>
                <li>Fornecer informações verdadeiras ao preencher formulários</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Informações dos Imóveis</h2>
              <p className="text-gray-600 mb-4">
                As informações sobre os imóveis exibidos neste site são coletadas de fontes públicas e
                de terceiros. Embora nos esforcemos para manter as informações atualizadas e precisas:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Não garantimos a exatidão, completude ou atualidade das informações</li>
                <li>Os valores, datas e condições podem sofrer alterações sem aviso prévio</li>
                <li>Recomendamos sempre verificar as informações no site oficial do leiloeiro</li>
                <li>Não nos responsabilizamos por decisões tomadas com base nas informações do site</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cadastro e Conta</h2>
              <p className="text-gray-600 mb-4">
                Para acessar alguns recursos do site, pode ser necessário criar uma conta. Ao fazer isso:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Você é responsável por manter a confidencialidade de sua senha</li>
                <li>Você é responsável por todas as atividades realizadas em sua conta</li>
                <li>Deve nos notificar imediatamente sobre qualquer uso não autorizado</li>
                <li>Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Formulário de Interesse</h2>
              <p className="text-gray-600 mb-4">
                Ao preencher o formulário de interesse em um imóvel, você:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Autoriza o contato por telefone, e-mail ou WhatsApp</li>
                <li>Concorda que suas informações sejam utilizadas para fins de atendimento</li>
                <li>Entende que o contato pode ser realizado por parceiros autorizados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Propriedade Intelectual</h2>
              <p className="text-gray-600 mb-4">
                Todo o conteúdo do site, incluindo textos, gráficos, logos, ícones e software,
                é de nossa propriedade ou de nossos licenciadores e está protegido por leis de
                propriedade intelectual.
              </p>
              <p className="text-gray-600 mb-4">
                As informações e imagens dos imóveis são de propriedade das respectivas instituições
                financeiras e leiloeiros, sendo utilizadas apenas para fins informativos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Links para Terceiros</h2>
              <p className="text-gray-600 mb-4">
                Este site contém links para sites de terceiros (bancos, leiloeiros, etc.).
                Não temos controle sobre o conteúdo desses sites e não nos responsabilizamos por:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Conteúdo, políticas de privacidade ou práticas de sites de terceiros</li>
                <li>Danos ou prejuízos decorrentes do uso desses sites</li>
                <li>Transações realizadas em sites externos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Limitação de Responsabilidade</h2>
              <p className="text-gray-600 mb-4">
                Na máxima extensão permitida por lei, não seremos responsáveis por:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Danos diretos, indiretos, incidentais ou consequenciais</li>
                <li>Perda de dados, lucros ou oportunidades de negócio</li>
                <li>Erros, interrupções ou indisponibilidade do serviço</li>
                <li>Decisões de investimento baseadas em informações do site</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Modificações dos Termos</h2>
              <p className="text-gray-600 mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento.
                As alterações entram em vigor imediatamente após sua publicação no site.
                O uso continuado do site após as alterações constitui sua aceitação dos novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Lei Aplicável</h2>
              <p className="text-gray-600 mb-4">
                Estes termos são regidos pelas leis da República Federativa do Brasil.
                Qualquer disputa será submetida ao foro da comarca de [Sua Cidade],
                com exclusão de qualquer outro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contato</h2>
              <p className="text-gray-600 mb-4">
                Para dúvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <ul className="list-none text-gray-600 space-y-1">
                <li>E-mail: contato@seusite.com.br</li>
                <li>Telefone: (00) 0000-0000</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t">
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
              &larr; Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
