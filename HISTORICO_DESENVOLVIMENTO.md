# Histórico de Desenvolvimento - Leilão Imóveis

## Resumo do Projeto
Plataforma agregadora de imóveis de leilão de múltiplos bancos brasileiros.

**Data:** Março 2026

---

## Stack Tecnológica

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Puppeteer (web scraping)
- node-cron (agendamento)
- Socket.io (tempo real)

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router DOM

---

## Funcionalidades Implementadas

### 1. Scrapers de Imóveis
- **Caixa Econômica Federal:** 29.166 imóveis
- **Banco do Brasil:** 5.020 imóveis (com imagens)
- **Itaú Unibanco:** 4 imóveis
- **Santander:** Implementado (problemas de paginação)
- **Portal Zuk:** Implementado (seletores precisam ajuste)

### 2. Sistema de Agregador
Convertido de plataforma de leilão para **modo agregador** (igual leilaoimovel.com.br):
- Botão "Acessar Leilão" redireciona para site oficial
- Badges coloridos por banco
- Placeholder para imóveis sem imagem

### 3. Formulário de Interesse (Leads)
- Formulário público na página do imóvel
- Campos: nome, email, telefone, mensagem
- Painel admin para gerenciar leads
- Status: Novo, Contatado, Convertido, Perdido
- Estatísticas de leads

### 4. Sistema de Agendamento Automático
Tarefas cron configuradas:

| Tarefa | Horário | Descrição |
|--------|---------|-----------|
| cleanExpired | A cada hora | Marca imóveis expirados |
| updateStatus | A cada 30 min | Ativa imóveis pendentes |
| scrapeCaixa | Diário 02:00 | Atualiza Caixa |
| scrapeBB | Diário 03:00 | Atualiza BB |
| scrapeMulti | Diário 04:00 | Atualiza outros bancos |
| logStats | A cada 6h | Registra estatísticas |

**Limpeza automática:**
- Imóveis expirados → Status CANCELLED
- Cancelados há +30 dias → Deletados

### 5. Painel Administrativo
- Dashboard com estatísticas
- Gerenciar imóveis
- Gerenciar usuários
- Gerenciar leads
- Importar imóveis (scrapers)
- Controle do scheduler

---

## Estrutura de Arquivos Principais

```
leilao-imoveis/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── leadController.js      # API de leads
│   │   │   └── scraperController.js   # API de scrapers
│   │   ├── services/
│   │   │   ├── scheduler.js           # Agendamento automático
│   │   │   ├── scraperCaixa.js        # Scraper Caixa
│   │   │   ├── scraperBB.js           # Scraper BB
│   │   │   └── scraperMultiBancos.js  # Scrapers Santander/Itaú/Zuk
│   │   ├── routes/
│   │   │   └── leads.js               # Rotas de leads
│   │   └── server.js                  # Servidor Express
│   └── prisma/
│       └── schema.prisma              # Modelos do banco
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InterestForm.jsx       # Formulário de interesse
│   │   │   ├── PropertyCard.jsx       # Card de imóvel
│   │   │   └── AdminLayout.jsx        # Layout admin
│   │   ├── pages/
│   │   │   ├── PropertyDetails.jsx    # Detalhes do imóvel
│   │   │   └── admin/
│   │   │       └── AdminLeads.jsx     # Painel de leads
│   │   └── services/
│   │       └── leadService.js         # API de leads
│   └── public/
│       └── placeholder-property.svg   # Imagem placeholder
```

---

## Banco de Dados - Modelos

### Property (Imóvel)
- id, title, description, address
- city, state, zipCode
- area, bedrooms, bathrooms, parkingSpots
- propertyType, auctionType
- minBid, currentBid, evaluatedValue
- auctionStart, auctionEnd, status
- source, externalId, externalUrl, bank, modality

### Lead (Interesse)
- id, name, email, phone, message
- propertyId, status (NEW/CONTACTED/CONVERTED/LOST)
- createdAt, updatedAt

### Image
- id, url, propertyId

### User, Favorite, Bid, ScrapingLog

---

## APIs Principais

### Leads
```
POST /api/leads              # Enviar interesse (público)
GET  /api/leads              # Listar leads (admin)
GET  /api/leads/stats        # Estatísticas (admin)
PATCH /api/leads/:id/status  # Atualizar status (admin)
DELETE /api/leads/:id        # Excluir lead (admin)
```

### Scheduler
```
GET  /api/scraper/scheduler/status     # Status do scheduler
POST /api/scraper/scheduler/start      # Iniciar scheduler
POST /api/scraper/scheduler/stop       # Parar scheduler
POST /api/scraper/scheduler/run/:task  # Executar tarefa
POST /api/scraper/cleanup              # Limpar expirados
```

---

## Estatísticas Atuais

- **Total de imóveis:** 34.190
- **Banco do Brasil:** 5.020
- **Caixa Econômica:** 29.166
- **Itaú:** 4
- **Total de leads:** 2

---

## O que Falta para Produção

### Crítico
- [ ] HTTPS/SSL
- [ ] Termos de Uso e Política de Privacidade
- [ ] Rate limiting
- [ ] reCAPTCHA no formulário
- [ ] Domínio e hospedagem

### Importante
- [ ] SEO (meta tags, sitemap)
- [ ] Google Analytics
- [ ] Backup automático
- [ ] Monitoramento de erros

### Monetização
- [ ] Sistema de anúncios
- [ ] Planos premium
- [ ] Gateway de pagamento
- [ ] Destaque de imóveis (pago)

---

## Comandos Úteis

```bash
# Backend
cd backend
npm run dev              # Desenvolvimento
npm start                # Produção

# Frontend
cd frontend
npm run dev              # Desenvolvimento
npm run build            # Build produção

# Prisma
npx prisma studio        # Visualizar banco
npx prisma db push       # Sincronizar schema
npx prisma generate      # Gerar client

# Testar scheduler
node test-scheduler.js
node count-leads.js
node check-images.js
```

---

## Configuração (.env)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/leilao_imoveis"
JWT_SECRET="sua-chave-secreta-forte"
FRONTEND_URL="http://localhost:5173"
PORT=3001
ENABLE_SCHEDULER=true
```

---

## Notas de Desenvolvimento

1. **Modo Agregador:** O site não realiza leilões, apenas agrega e redireciona para os sites oficiais dos bancos.

2. **Imagens:** Apenas o scraper do BB captura imagens. Outros bancos usam placeholder.

3. **Scrapers de terceiros (Santander, Itaú, Zuk):** Usam o site Resale.com.br que tem paginação com problemas (retorna mesmos resultados).

4. **Scheduler:** Inicia automaticamente com o servidor. Para desabilitar: ENABLE_SCHEDULER=false

5. **Timezone:** Scheduler usa America/Sao_Paulo

---

*Última atualização: Março 2026*
