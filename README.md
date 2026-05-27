# 🚀 Gerador de Orçamentos - Impacto

Sistema automatizado PWA para geração de orçamentos personalizados com checklists técnicos.

![Status](https://img.shields.io/badge/Status-Online-success)
![PWA](https://img.shields.io/badge/PWA-Enabled-blue)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange)

## 🌐 Demo Online

**Acesse:** https://infinityprojetos1-hub.github.io/impacto/

## ✨ Funcionalidades

- ✅ Geração automática de orçamentos
- ✅ Múltiplas empresas concorrentes
- ✅ PDFs personalizados por empresa
- ✅ Sistema de checklists técnicos
- ✅ Assinatura digital
- ✅ Gerenciamento de material
- ✅ Notas fiscais organizadas
- ✅ Relatórios técnicos
- ✅ Upload de logos personalizadas
- ✅ Sincronização em nuvem (Firebase)
- ✅ Funciona offline (PWA)
- ✅ Instalável no celular/desktop

## 📱 PWA - Progressive Web App

Este sistema funciona como um aplicativo nativo:

- 📲 **Instalável** - Adicione à tela inicial
- 🔄 **Offline** - Funciona sem internet
- 🔔 **Notificações** - Receba atualizações
- ⚡ **Rápido** - Cache inteligente
- 🔐 **Seguro** - HTTPS obrigatório

## 🔥 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **PDF:** jsPDF
- **Database:** Firebase Realtime Database
- **PWA:** Service Worker, Web App Manifest
- **Hospedagem:** GitHub Pages

## 🚀 Como Usar

### 1️⃣ Acesse o site
https://infinityprojetos1-hub.github.io/impacto/

### 2️⃣ Instale como App (Opcional)

**No celular (Android/iOS):**
1. Abra no Chrome/Safari
2. Clique em "Adicionar à tela inicial"
3. Pronto! Agora é um app

**No desktop (Chrome):**
1. Clique no ícone ➕ na barra de endereço
2. "Instalar Gerador de Orçamentos"
3. Pronto! Agora é um app

### 3️⃣ Configure o Firebase
1. Primeira vez: Modal de migração aparece
2. Clique em "Migrar para Firebase"
3. Dados sincronizados na nuvem!

## 🛠️ Deploy Local

```bash
# Clone o repositório
git clone https://github.com/infinityprojetos1-hub/impacto.git

# Entre na pasta
cd impacto

# Abra o index.html no navegador
# Ou use um servidor local:
python -m http.server 8000
# Acesse: http://localhost:8000
```

## 📂 Estrutura do Projeto

```
impacto/
├── index.html              # Página principal
├── manifest.json           # PWA Manifest
├── sw.js                   # Service Worker
├── data/                   # JSON de exemplo / referência (dados reais no Firebase + localStorage)
├── assets/logos/           # Logos das empresas (carregadas pelo app)
├── src/js/
│   ├── core/               # utils, config, firebase-config, backup-manager, ui-controller
│   ├── budget/             # orçamentos, PDFs, empresa-*.js
│   └── modules/            # NF, home, estoque, material, checklist, main, relatório, pagamento
└── docs/
    └── ...                 # Documentação
```

## 🔒 Segurança

- ✅ HTTPS obrigatório
- ✅ Dados sincronizados com Firebase
- ✅ Backup automático
- ✅ Sem senhas expostas
- ✅ Regras de segurança configuradas

## 📊 Firebase Realtime Database

### Estrutura dos Dados:

```
impacto-9e38c-default-rtdb/
├── igrejas/
├── checklists/
├── configuracoes/
└── arquivos/
```

### Configurar Regras:

1. Acesse: [Firebase Console](https://console.firebase.google.com/project/impacto-9e38c/database/rules)
2. Cole as regras:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Publique

## 🎨 Personalização

### Mudar Cores:

Edite as variáveis CSS em `index.html`:

```css
:root {
  --primary-color: #6366f1;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Adicionar Empresas:

1. Crie `src/js/budget/empresa-nome.js`
2. Adicione em `src/js/budget/pdf-concorrentes.js`
3. Configure em `src/js/core/config.js`

## 📝 Licença

Este projeto é privado e de propriedade da **Impacto**.

## 👤 Autor

**Infinity Projetos**
- GitHub: [@infinityprojetos1-hub](https://github.com/infinityprojetos1-hub)

## 🆘 Suporte

Para suporte, entre em contato através do GitHub Issues.

---

**Desenvolvido com ❤️ por Infinity Projetos**
