# VitaFlow - Protocolo de Insulina Hospitalar

![VitaFlow Logo](./public/icon-192x192.png)

VitaFlow é um sistema web e híbrido (mobile) desenvolvido especificamente para equipes de enfermagem em hospitais, oferecendo gerenciamento automatizado de protocolos de insulina em bomba de infusão contínua. O sistema calcula vazões, monitora glicemia (HGT), emite alertas inteligentes e registra todos os dados de forma segura.

## 🚀 Características Principais

- **✅ Autenticação Segura**: Sistema de login com NextAuth e JWT
- **📊 Protocolo Automatizado**: Cálculos automáticos de vazão baseados em HGT
- **📱 App Híbrido**: Funciona na web e como app mobile (iOS/Android)
- **🔔 Notificações**: Alertas automáticos para verificações e emergências
- **👨‍⚕️ Dashboard Admin**: Painel para coordenadores monitorarem todos os pacientes
- **💾 Banco PostgreSQL**: Armazenamento seguro e confiável na Vercel
- **📈 Histórico Completo**: Registro detalhado de todos os HGTs e ajustes
- **🎨 Interface Moderna**: Design responsivo com Tailwind CSS

## 🏥 Protocolo Médico Implementado

### Vazão Inicial
- **Cálculo**: 0,1 UI/kg/h baseado no peso do paciente
- **Arredondamento**: Opcional (padrão ativado)

### Ajustes Baseados em HGT
- **HGT < 90 mg/dL**: Hipoglicemia severa - Parar bomba + glicose 50% (20mL)
- **HGT < 140 mg/dL**: Desligar bomba, reavaliar em 30 min
- **HGT 140-180 mg/dL**: Reduzir vazão em 50%
- **HGT > 180 mg/dL**: Ajuste baseado no delta com HGT anterior:
  - Delta < 50%: Aumentar 50%
  - Delta 50-70%: Manter vazão
  - Delta > 70%: Reduzir 50%

### Cronograma de Monitoramento
- **Verificação HGT**: A cada 1 hora
- **Troca de solução**: A cada 6 horas (20 mL)
- **Reavaliações**: 15-30 min conforme protocolo

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Autenticação**: NextAuth.js com JWT
- **Mobile**: Capacitor (WebView híbrido)
- **Notificações**: @capacitor/local-notifications
- **Banco de Dados**: Vercel Postgres
- **Deploy**: Vercel
- **Segurança**: bcryptjs, HTTPS, variáveis de ambiente

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta na Vercel (para banco PostgreSQL)
- Para desenvolvimento mobile: Android Studio / Xcode

## 🚀 Instalação e Configuração

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/vitaflow.git
cd vitaflow
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```bash
# Database (Vercel Postgres)
POSTGRES_URL="sua-url-do-postgres"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Inicialize o Banco de Dados

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Em outro terminal, inicialize o banco
curl -X POST http://localhost:3000/api/init
```

### 5. Execute o Projeto

```bash
npm run dev
```

Acesse: `http://localhost:3000`

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `admin123`

## 📱 Build para Mobile (Capacitor)

### Preparar Build para Mobile

```bash
# Gerar build estático
npm run export

# Sincronizar com Capacitor
npm run cap:sync
```

### iOS

```bash
# Abrir projeto no Xcode
npm run cap:ios

# Ou manualmente
npx cap open ios
```

### Android

```bash
# Abrir projeto no Android Studio
npm run cap:android

# Ou manualmente
npx cap open android
```

## 🎯 Como Usar

### Para Enfermeiros

1. **Login**: Use suas credenciais para acessar o sistema
2. **Cadastrar Paciente**: Preencha nome, idade, setor, leito e peso
3. **Monitorar HGT**: Registre valores de glicemia a cada hora
4. **Seguir Protocolo**: O sistema calculará automaticamente os ajustes
5. **Alertas**: Receba notificações para verificações e emergências

### Para Administradores

1. **Painel Admin**: Acesse via botão "Administração"
2. **Monitorar Todos**: Visualize todos os pacientes ativos
3. **Filtros**: Filtre por setor, data ou status
4. **Exportar Dados**: Baixe relatórios em CSV
5. **Gerenciar Protocolos**: Finalize ou edite conforme necessário

## 📊 Estrutura do Projeto

```
vitaflow/
├── components/           # Componentes React
│   ├── PatientForm.tsx
│   └── PatientDashboard.tsx
├── lib/                 # Lógica de negócio
│   ├── db.ts           # Configuração do banco
│   ├── insulin-protocol.ts  # Lógica do protocolo
│   └── notifications.ts     # Sistema de notificações
├── pages/              # Páginas Next.js
│   ├── api/           # API Routes
│   ├── index.tsx      # Página principal
│   ├── login.tsx      # Página de login
│   └── admin.tsx      # Painel administrativo
├── styles/            # Estilos CSS
├── types/             # Tipos TypeScript
└── public/            # Arquivos estáticos
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start

# Build estático (Capacitor)
npm run export

# Capacitor
npm run cap:build      # Build + sync
npm run cap:sync       # Sincronizar apenas
npm run cap:ios        # Abrir no Xcode
npm run cap:android    # Abrir no Android Studio

# Linting
npm run lint
```

## 🌟 Funcionalidades Detalhadas

### Sistema de Autenticação
- Login seguro com username/password
- Proteção de rotas
- Diferenciação de roles (enfermeiro/admin)
- Sessões JWT

### Protocolo de Insulina
- Cálculo automático de vazão inicial
- Ajustes baseados em diretrizes médicas
- Histórico completo de alterações
- Validação de valores de HGT

### Notificações Inteligentes
- Alertas para verificação de HGT
- Lembretes de troca de solução
- Notificações de emergência
- Funciona offline (mobile)

### Dashboard Administrativo
- Visão geral de todos os pacientes
- Estatísticas em tempo real
- Filtros avançados
- Exportação de dados

## 🔒 Segurança

- **Criptografia**: Senhas com bcryptjs
- **Autenticação**: JWT com NextAuth
- **HTTPS**: Conexões criptografadas
- **Variáveis de Ambiente**: Credenciais protegidas
- **Validação**: Dados validados no frontend e backend

## 📈 Performance

- **SSR**: Server-Side Rendering com Next.js
- **Otimização**: Imagens e assets otimizados
- **Cache**: Estratégias de cache inteligentes
- **Responsivo**: Interface adaptativa
- **PWA Ready**: Funcionalidades de app nativo

## 🚢 Deploy na Vercel

1. **Fork/Clone** este repositório
2. **Conecte** à Vercel
3. **Configure** variáveis de ambiente
4. **Deploy** automático

### Variáveis de Ambiente Necessárias:
- `POSTGRES_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## 🧪 Testando o Sistema

### Teste Manual Completo

1. **Cadastrar Paciente**: João, 70 anos, UTI, leito 10, 80kg
2. **Verificar Vazão**: Deve calcular 8 UI/h
3. **Registrar HGT**: Teste com valores 250, 180, 120, 80
4. **Verificar Ajustes**: Confirme cálculos automáticos
5. **Testar Alertas**: Simule hipoglicemia < 90
6. **Admin**: Acesse painel administrativo
7. **Export**: Teste exportação CSV

## 🐛 Troubleshooting

### Erro de Conexão com Banco
```bash
# Verifique POSTGRES_URL no .env.local
# Teste conexão manualmente
curl -X POST http://localhost:3000/api/init
```

### Erro de Autenticação
```bash
# Verifique NEXTAUTH_SECRET
# Limpe cookies do navegador
```

### Problemas de Build Mobile
```bash
# Reinstale Capacitor
npm install @capacitor/core @capacitor/cli --save-dev
npx cap sync
```

## 📞 Suporte

Para dúvidas técnicas ou sugestões:

- **Issues**: GitHub Issues
- **Documentação**: Este README
- **Email**: suporte@vitaflow.com

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 🏆 Reconhecimentos

- **Equipe Médica**: Pelas diretrizes do protocolo de insulina
- **Enfermeiros**: Pelo feedback e testes práticos
- **Open Source**: Next.js, React, Tailwind CSS e comunidade

---

**VitaFlow** - Desenvolvido com ❤️ para profissionais de saúde
*"Tecnologia a serviço do cuidado"*