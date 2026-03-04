import { Link } from 'react-router-dom'

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Cadastre-se gratuitamente',
      description: 'Crie sua conta em poucos minutos. Você precisará de um email válido, CPF e telefone para participar dos leilões.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      number: 2,
      title: 'Pesquise imóveis',
      description: 'Use nossos filtros avançados para encontrar o imóvel ideal. Filtre por cidade, tipo, faixa de preço e modalidade do leilão.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      number: 3,
      title: 'Analise as oportunidades',
      description: 'Acesse fotos, descrição detalhada, localização e histórico de lances. Salve seus favoritos para acompanhar.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      number: 4,
      title: 'Faça seu lance',
      description: 'Participe do leilão em tempo real. Acompanhe os lances de outros participantes e faça sua oferta.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      number: 5,
      title: 'Arremate e formalize',
      description: 'Se você der o maior lance, entre em contato para formalizar a compra e receber as orientações necessárias.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  const faqs = [
    {
      question: 'O que é um leilão judicial?',
      answer: 'O leilão judicial é realizado por determinação da Justiça, geralmente para quitar dívidas. Os imóveis são vendidos com descontos significativos, mas é importante verificar toda a documentação antes de participar.'
    },
    {
      question: 'O que é um leilão extrajudicial?',
      answer: 'O leilão extrajudicial é realizado fora do âmbito judicial, geralmente por bancos e instituições financeiras. Ocorre quando o comprador não consegue pagar o financiamento e o imóvel é retomado.'
    },
    {
      question: 'Quais são os riscos de comprar em leilão?',
      answer: 'Os principais riscos incluem: imóvel ocupado, dívidas de condomínio ou IPTU, problemas na documentação e necessidade de reformas. Por isso, é fundamental pesquisar bem antes de dar um lance.'
    },
    {
      question: 'Como faço para participar de um leilão?',
      answer: 'Primeiro, cadastre-se em nossa plataforma. Depois, escolha o imóvel de interesse e, no dia e horário do leilão, acesse a página do imóvel e faça seu lance.'
    },
    {
      question: 'Posso visitar o imóvel antes do leilão?',
      answer: 'Em alguns casos sim, dependendo do tipo de leilão e se o imóvel está desocupado. Verifique as informações na página de cada imóvel.'
    },
    {
      question: 'Como funciona o pagamento?',
      answer: 'Após arrematar o imóvel, você receberá as instruções de pagamento. Geralmente é possível pagar à vista ou parcelado, dependendo das condições do leilão.'
    }
  ]

  const auctionTypes = [
    {
      type: 'Leilão Judicial',
      description: 'Realizado por ordem judicial para quitação de dívidas',
      advantages: [
        'Descontos que podem chegar a 50%',
        'Processo transparente e legal',
        'Possibilidade de financiamento'
      ],
      considerations: [
        'Verificar situação de ocupação',
        'Analisar dívidas existentes',
        'Prazo maior para desocupação'
      ]
    },
    {
      type: 'Leilão Extrajudicial',
      description: 'Realizado por bancos e instituições financeiras',
      advantages: [
        'Processo mais rápido',
        'Documentação geralmente regularizada',
        'Condições de financiamento facilitadas'
      ],
      considerations: [
        'Verificar estado de conservação',
        'Analisar débitos pendentes',
        'Ler atentamente o edital'
      ]
    }
  ]

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="bg-primary-700 text-white py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl font-bold mb-4">Como Funciona</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Entenda o passo a passo para participar dos leilões e fazer o melhor negócio
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Passo a Passo
          </h2>
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center">
                    {step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-16 bg-primary-200 mx-auto mt-2"></div>
                  )}
                </div>
                <div className="pt-3">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auction Types */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tipos de Leilão
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {auctionTypes.map((type) => (
              <div key={type.type} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{type.type}</h3>
                <p className="text-gray-600 mb-4">{type.description}</p>

                <div className="mb-4">
                  <h4 className="font-semibold text-green-700 mb-2">Vantagens</h4>
                  <ul className="space-y-1">
                    {type.advantages.map((adv, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 text-sm">{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-amber-700 mb-2">Pontos de Atenção</h4>
                  <ul className="space-y-1">
                    {type.considerations.map((con, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-gray-600 text-sm">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perguntas Frequentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-white rounded-xl shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer list-none flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Cadastre-se agora e tenha acesso a milhares de imóveis em leilão com descontos imperdíveis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Criar conta grátis
            </Link>
            <Link to="/buscar" className="btn-outline border-white text-white hover:bg-white/10">
              Ver imóveis disponíveis
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
