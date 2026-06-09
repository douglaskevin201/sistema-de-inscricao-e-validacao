# 🌽 Sistema de Inscrição e Validação – Festa Junina UniEnsino 2025

Sistema completo de gerenciamento de convites para eventos, desenvolvido para a Festa Junina da UniEnsino. Permite inscrição de alunos e convidados, envio automático de QR Codes por email e validação na portaria via celular.

---

## 🚀 Funcionalidades

- **Formulário de inscrição** — alunos preenchem seus dados e adicionam convidados ilimitados
- **Envio automático de QR Code** — cada inscrito recebe um email com QR Code e código único
- **Validação na portaria** — funcionários validam convites pelo celular sem acesso ao sistema administrativo
- **Painel administrativo** — visão completa de inscritos, convidados e presença em tempo real
- **Proteção contra fraude** — cada código só pode ser utilizado uma única vez

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Função |
|---|---|
| React + Vite | Interface do usuário |
| Supabase | Banco de dados e Edge Functions |
| Brevo (SendinBlue) | Envio de emails transacionais |
| Vercel | Hospedagem e deploy |
| QR Server API | Geração de QR Codes |

---

## 📁 Estrutura do projeto

festa-junina/
├── public/
├── src/
│   ├── Admin.jsx         # Painel administrativo
│   ├── Formulario.jsx    # Formulário de inscrição
│   ├── Portaria.jsx      # Validação de convites
│   ├── supabase.js       # Configuração do Supabase
│   ├── main.jsx          # Rotas da aplicação
│   └── index.css         # Estilos globais
├── supabase/
│   └── functions/
│       └── enviar-email/ # Edge Function de envio de email
│           └── index.ts
├── .env                  # Variáveis de ambiente (não versionar)
├── vercel.json           # Configuração de rotas do Vercel
├── package.json
└── README.md

---

## 🌐 Rotas da aplicação

| Rota | Descrição | Acesso |
|---|---|---|
| `/` | Formulário de inscrição | Público |
| `/portaria` | Validação de QR Code | Funcionários |
| `/admin` | Painel administrativo | Administrador |

---

## ⚙️ Configuração do ambiente

### Pré-requisitos

- Node.js v18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Brevo](https://brevo.com)
- Conta no [Vercel](https://vercel.com)

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

### Banco de dados (Supabase)

Execute o seguinte SQL no Supabase SQL Editor:

```sql
create table convites (
  id uuid default gen_random_uuid() primary key,
  codigo text unique not null,
  nome text not null,
  email text not null,
  cpf text,
  curso text,
  tipo text not null,
  convidado_de text,
  usado_em timestamp,
  criado_em timestamp default now()
);

alter table convites enable row level security;

create policy "permitir insert publico" on convites
for insert with check (true);

create policy "permitir select publico" on convites
for select using (true);

create policy "permitir update publico" on convites
for update using (true);
```

### Edge Function (envio de email)

Configure os secrets no Supabase:

```bash
supabase secrets set BREVO_KEY=sua_chave_brevo --project-ref seu_project_ref
```

Deploy da função:

```bash
supabase functions deploy enviar-email --project-ref seu_project_ref
```

---

## 💻 Rodando localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`

---

## 🚢 Deploy no Vercel

```bash
# Build do projeto
npm run build

# Deploy
vercel build --prod
vercel deploy --prebuilt --prod
```

### Variáveis de ambiente no Vercel

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## 📱 Como usar

### Aluno
1. Acessa o link do formulário
2. Preenche nome, email, CPF e curso
3. Adiciona convidados (opcional, sem limite)
4. Confirma a inscrição
5. Recebe QR Code no email

### Portaria
1. Acessa o link `/portaria` no celular
2. Digita o código do convite ou lê o QR Code
3. Sistema mostra ✅ ENTRADA LIBERADA ou ❌ CONVITE INVÁLIDO
4. Convite marcado como usado automaticamente

### Administrador
1. Acessa `/admin`
2. Insere a senha de administrador
3. Visualiza todos os inscritos com filtros
4. Acompanha presença em tempo real

---

## 🔒 Segurança

- Cada QR Code é único e gerado aleatoriamente
- Convites só podem ser utilizados uma única vez
- Página de portaria não tem acesso aos dados administrativos
- Página de admin protegida por senha
- Row Level Security habilitado no Supabase

---

## 📊 Painel administrativo

O painel admin exibe:

- Total de inscritos
- Quantidade de alunos vs convidados  
- Quantos compareceram vs não vieram
- Tabela completa com filtros e busca
- Horário exato de cada entrada validada

---

## 🐛 Problemas conhecidos

- O email remetente não pode ser o mesmo email do aluno inscrito (limitação do Brevo com Gmail)
- Para uso em produção recomenda-se configurar um domínio próprio no Brevo

---

## 📅 Próximas melhorias

- [ ] Configurar domínio próprio para envio de emails
- [ ] Exportar lista de presença em CSV/Excel
- [ ] Leitura automática de QR Code pela câmera na portaria
- [ ] Envio de lembrete por email antes do evento
- [ ] Limite de convidados por aluno configurável

---

## 👨‍💻 Desenvolvido por

Kevin Douglas — Estudante de Análise e Desenvolvimento de Sistemas  
UniEnsino — 2026