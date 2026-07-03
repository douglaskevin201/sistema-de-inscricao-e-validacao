# 🌽 Sistema de Cadastro Festa Junina UniEnsino 2026

Sistema web de credenciamento e controle de acesso para a Festa Junina da UniEnsino 2026. Permite o cadastro de alunos e convidados, envio automático de QR Codes por e-mail e validação na portaria do evento.

---

## 🔗 Links do Projeto

| Tela | URL |
|---|---|
| Formulário de inscrição | https://festa-junina-six.vercel.app/ |
| Portaria (validação) | https://festa-junina-six.vercel.app/portaria |

---

## ✨ Funcionalidades

- **Cadastro de alunos** com validação de CPF (dígitos verificadores), e-mail e duplicidade
- **Cadastro de convidados** vinculados ao aluno, sem limite de quantidade
- **Adição de convidados posterior** — aluno já cadastrado pode entrar novamente pelo CPF e adicionar novos convidados
- **Envio automático de e-mail** com QR Code personalizado via Brevo
- **Tela de portaria** com leitura de QR Code pela câmera ou digitação manual do código
- **Controle de uso único** — cada convite só pode ser validado uma vez
- **Painel administrativo** com senha protegida, listagem, filtros, busca, cancelamento e reenvio de e-mails
- **Exportação** da lista de inscritos em CSV e Excel (XLSX)

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite |
| Roteamento | React Router DOM v6 |
| Banco de dados | Supabase (PostgreSQL) |
| Backend serverless | Supabase Edge Functions (Deno) |
| Envio de e-mail | Brevo (antigo Sendinblue) |
| Leitura de QR Code | html5-qrcode |
| Exportação Excel | SheetJS (xlsx) |
| Deploy | Vercel |

---

## 📁 Estrutura do Projeto

```
festa-junina/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── imagens/
│   │   └── logo.png
│   ├── Admin.jsx          # Painel administrativo
│   ├── Formulario.jsx     # Formulário público de inscrição
│   ├── Portaria.jsx       # Tela de validação na entrada do evento
│   ├── supabase.js        # Configuração do cliente Supabase
│   ├── main.jsx           # Ponto de entrada + rotas
│   └── index.css
├── supabase/
│   └── functions/
│       ├── enviar-email/  # Edge Function de envio de e-mail via Brevo
│       └── validar-admin/ # Edge Function de autenticação do painel admin
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

Na Edge Function `enviar-email`, configure no painel do Supabase:

```
BREVO_KEY=sua_chave_api_brevo
```

---

## 🗄️ Estrutura do Banco de Dados

Tabela `convites` no Supabase:

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `codigo` | text | Código único do convite (QR Code) |
| `nome` | text | Nome do participante |
| `email` | text | E-mail (único) |
| `cpf` | text | CPF do aluno (único, nulo para convidados) |
| `curso` | text | Curso e período (alunos) |
| `tipo` | text | `aluno` ou `convidado` |
| `convidado_de` | text | Nome do aluno responsável (para convidados) |
| `usado_em` | timestamp | Data/hora de uso na portaria (nulo se não usado) |
| `criado_em` | timestamp | Data/hora do cadastro |

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js 18+, npm

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## 📧 Fluxo de E-mail

1. Aluno preenche o formulário → sistema gera um código único
2. Supabase Edge Function `enviar-email` é chamada
3. E-mail HTML com o código e QR Code é enviado via API do Brevo
4. O mesmo fluxo ocorre para cada convidado cadastrado

---

## 🎪 Fluxo da Portaria

1. Operador acessa `/portaria` e insere a senha de acesso
2. Lê o QR Code pela câmera ou digita o código manualmente
3. Sistema consulta o banco e exibe o status:
   - ✅ **Válido** — registra `usado_em` e libera entrada
   - ⚠️ **Já utilizado** — exibe data e hora do uso anterior
   - ❌ **Inválido** — código não encontrado

---

## ☁️ Deploy no Vercel

O projeto é hospedado na [Vercel](https://vercel.com) com deploy automático a cada push na branch `main`.

### Configuração necessária

1. Importe o repositório do GitHub na Vercel
2. Configure as variáveis de ambiente no painel da Vercel (**Settings → Environment Variables**):

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

3. O arquivo `vercel.json` já está configurado para redirecionar todas as rotas para o `index.html`, necessário para o React Router funcionar corretamente:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

4. O build é gerado automaticamente com o comando `npm run build` e a pasta de saída é `dist/`

---

## 👥 Desenvolvido por

Kevin — Estagiários de TI · UniEnsino / Estácio · 2026
Emerson — Estagiários de TI · UniEnsino / Uninter . 2026