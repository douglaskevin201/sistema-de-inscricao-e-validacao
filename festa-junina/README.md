🌽 Sistema de Inscrição e Validação – Festa Junina UniEnsino 2026

Sistema completo de gerenciamento de convites para eventos, desenvolvido para a Festa Junina da UniEnsino 2026. Permite inscrição de alunos e convidados, envio automático de QR Codes por email e validação na portaria via celular.


🚀 Funcionalidades


Formulário de inscrição — alunos preenchem seus dados e adicionam convidados ilimitados
Envio automático de QR Code — cada inscrito recebe um email com QR Code e código único gerado aleatoriamente
Validação na portaria — funcionários validam convites pelo celular, com suporte a leitura de QR Code pela câmera ou digitação manual do código
Painel administrativo — visão completa de inscritos, convidados e presença em tempo real, com reenvio de email e cancelamento de convites
Proteção contra duplicidade — CPF único por inscrição, impedindo cadastros repetidos
Proteção contra fraude — cada código só pode ser utilizado uma única vez
Cancelamento em cascata — ao cancelar um aluno, seus convidados são cancelados automaticamente



🛠️ Tecnologias utilizadas

TecnologiaFunçãoReact + ViteInterface do usuário (SPA)SupabaseBanco de dados PostgreSQL, Row Level Security e Edge Functions (Deno)BrevoEnvio de emails transacionais com HTML customizadoVercelHospedagem, deploy contínuo via GitHubQR Server APIGeração dinâmica de QR Codes por URLhtml5-qrcodeLeitura de QR Code pela câmera do celular na portaria


📁 Estrutura do projeto

festa-junina/
├── public/
├── src/
│   ├── Admin.jsx              # Painel administrativo protegido por senha
│   ├── Formulario.jsx         # Formulário público de inscrição
│   ├── Portaria.jsx           # Validação de convites (câmera ou código manual)
│   ├── supabase.js            # Configuração do cliente Supabase
│   ├── main.jsx               # Rotas da aplicação (React Router)
│   └── index.css              # Estilos globais
├── supabase/
│   └── functions/
│       ├── enviar-email/      # Edge Function: envio de email via Brevo
│       │   └── index.ts
│       └── validar-admin/     # Edge Function: validação de senha do admin
│           └── index.ts
├── .env                       # Variáveis de ambiente (não versionar)
├── vercel.json                # Configuração de rotas SPA no Vercel
├── package.json
└── README.md


🌐 Rotas da aplicação

RotaDescriçãoAcesso/Formulário de inscriçãoPúblico/portariaValidação de QR CodeFuncionários/adminPainel administrativoAdministrador


🗄️ Banco de dados

Tabela: convites

ColunaTipoDescriçãoiduuidChave primária gerada automaticamentecodigotext (unique)Código único do convite (ex: A3F9KZ2B)nometextNome completo do inscritoemailtextEmail para envio do convitecpftextCPF do aluno (null para convidados)cursotextCurso e período (null para convidados)tipotextaluno ou convidadoconvidado_detextNome do aluno que convidou (null para alunos)usado_emtimestampData/hora de uso na portaria (null se não usado)criado_emtimestampData/hora de criação do registro

SQL de criação

sqlcreate table convites (
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


⚙️ Configuração do ambiente

Pré-requisitos


Node.js v18+
Conta no Supabase
Conta no Brevo
Conta no Vercel
CLI do Supabase: npm install -g supabase


Variáveis de ambiente

Crie um arquivo .env na raiz do projeto:

envVITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase

Secrets nas Edge Functions (Supabase)

bashnpx supabase secrets set BREVO_KEY=sua_chave_api_brevo --project-ref seu_project_ref
npx supabase secrets set ADMIN_PASSWORD=sua_senha_admin --project-ref seu_project_ref

Deploy das Edge Functions

bashnpx supabase functions deploy enviar-email --no-verify-jwt --project-ref seu_project_ref
npx supabase functions deploy validar-admin --project-ref seu_project_ref


Importante: A flag --no-verify-jwt é necessária na função enviar-email pois ela é chamada por usuários não autenticados no formulário público.



Configuração do Brevo


Crie uma conta em brevo.com
Gere uma chave API em SMTP & API → Chaves API e MCP
Em Segurança, desative o bloqueio de IPs para chaves API (necessário pois os servidores do Supabase usam IPs dinâmicos)
Configure o email remetente como um endereço verificado na sua conta



💻 Rodando localmente

bash# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

Acesse http://localhost:5173


🚢 Deploy no Vercel

O projeto usa deploy contínuo via GitHub. A cada git push na branch main, o Vercel faz o deploy automaticamente.

bashgit add .
git commit -m "sua mensagem"
git push

Configuração manual (primeira vez)

bashnpm run build
npx vercel --prod

Variáveis de ambiente no Vercel

Configure pelo dashboard do Vercel ou via CLI:

bashvercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY


📱 Como usar

Aluno


Acessa o link do formulário
Preenche nome, email, CPF e curso
Adiciona convidados (opcional, sem limite)
Confirma a inscrição
Recebe QR Code e código alfanumérico por email


Portaria


Acessa o link /portaria no celular
Digita o código manualmente ou lê o QR Code pela câmera
Sistema exibe ✅ ENTRADA LIBERADA ou ❌ CONVITE INVÁLIDO ou ⚠️ JÁ UTILIZADO
Convite marcado automaticamente como usado com horário de entrada


Administrador


Acessa /admin
Insere a senha de administrador (validada via Edge Function)
Visualiza todos os inscritos com filtros por tipo e busca por nome
Reenvia emails individualmente
Cancela convites (com cancelamento automático dos convidados vinculados)
Acompanha presença em tempo real com contadores



🔒 Segurança


Cada QR Code é gerado com código aleatório único (Math.random().toString(36))
Convites só podem ser utilizados uma única vez (campo usado_em)
CPF validado com algoritmo oficial antes do cadastro
Página de portaria sem acesso a dados administrativos
Senha do admin validada via Edge Function com secret no servidor (nunca exposta no frontend)
Row Level Security habilitado no Supabase
Chave API do Brevo armazenada como secret no Supabase (nunca no código)



📊 Painel administrativo

O painel exibe:


Total de inscritos, alunos, convidados
Quantos compareceram vs não compareceram
Tabela completa com filtros por tipo (aluno/convidado/todos) e busca por nome
Horário exato de cada entrada validada
Ações por convite: reenviar email, cancelar inscrição



🔄 Fluxo de dados

Aluno preenche formulário
        ↓
Supabase insere registro na tabela convites
        ↓
Frontend invoca Edge Function enviar-email
        ↓
Edge Function chama API do Brevo
        ↓
Brevo envia email com QR Code (gerado via QR Server API)
        ↓
Na portaria: código lido → Supabase valida → marca usado_em


🐛 Limitações conhecidas


O email remetente precisa ser um endereço verificado no Brevo (não pode ser qualquer email)
Para uso em produção recomenda-se configurar um domínio próprio no Brevo para melhor entregabilidade
Leitura de QR Code pela câmera pode ser instável em alguns dispositivos Android



📅 Possíveis melhorias futuras


 Configurar domínio próprio para envio de emails
 Exportar lista de presença em CSV
 Envio de lembrete por email antes do evento
 Limite de convidados por aluno configurável pelo admin
 Dashboard com gráficos de presença por curso



👨‍💻 Desenvolvido por


Kevin Douglas — Estudante de Análise e Desenvolvimento de Sistemas
Emerson Castro - Estudante de Ciência da Computação
UniEnsino — 2026