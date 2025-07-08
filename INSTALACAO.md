# 🚀 Guia de Instalação Rápida - VitaFlow

## ⚡ Instalação Express (5 minutos)

### 1. Pré-requisitos
```bash
# Verificar Node.js (necessário 18+)
node --version

# Verificar npm
npm --version
```

### 2. Instalar Dependências
```bash
# Instalar pacotes
npm install

# Verificar instalação
npm run build
```

### 3. Configurar Banco de Dados (Vercel Postgres)

#### Opção A: Vercel Postgres (Recomendado)
1. Acesse [vercel.com](https://vercel.com)
2. Crie projeto e adicione PostgreSQL
3. Copie a URL de conexão

#### Opção B: PostgreSQL Local
```bash
# PostgreSQL local (Docker)
docker run --name vitaflow-db \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=vitaflow \
  -p 5432:5432 -d postgres
```

### 4. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local
POSTGRES_URL="sua-url-aqui"
NEXTAUTH_SECRET="sua-chave-secreta-muito-longa-e-segura"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Inicializar Sistema
```bash
# Iniciar servidor
npm run dev

# Em outro terminal, inicializar banco
curl -X POST http://localhost:3000/api/init
```

### 6. Acessar Sistema
- **URL**: http://localhost:3000
- **Usuário**: admin
- **Senha**: admin123

## 📱 Build para Mobile

### Android
```bash
# Build e abrir Android Studio
npm run cap:android
```

### iOS
```bash
# Build e abrir Xcode
npm run cap:ios
```

## 🚢 Deploy Produção

### Vercel (Recomendado)
1. Conecte repositório Git
2. Configure variáveis de ambiente
3. Deploy automático

### Outras Plataformas
```bash
# Build produção
npm run build
npm start
```

## ✅ Verificação Rápida

### Teste Completo (2 minutos)
1. **Login**: admin / admin123
2. **Cadastrar**: João, 70 anos, UTI, leito 10, 80kg
3. **Verificar**: Vazão deve ser 8 UI/h
4. **HGT**: Registre 250 mg/dL
5. **Protocolo**: Verifique ajuste automático
6. **Admin**: Teste painel administrativo

## 🆘 Problemas Comuns

### Erro de Conexão
```bash
# Verificar URL do banco
echo $POSTGRES_URL

# Testar conexão
curl -X POST http://localhost:3000/api/init
```

### Erro de Build
```bash
# Limpar cache
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Capacitor Issues
```bash
# Reinstalar Capacitor
npm install @capacitor/core @capacitor/cli
npx cap sync
```

## 📞 Suporte
- **Documentação**: README.md
- **Issues**: GitHub Issues
- **Email**: suporte@vitaflow.com

---
**VitaFlow** - Pronto para usar em 5 minutos! 🏥💙