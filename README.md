# Loja Gefen Software - Next.js

Este projeto foi refatorado de Vite + React Router para Next.js 14 com App Router.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Jotai** - Gerenciamento de estado
- **Shadcn/ui** - Componentes UI
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas
- **Lucide React** - Ícones

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página inicial
│   ├── globals.css        # Estilos globais
│   ├── providers.tsx      # Providers do Jotai
│   └── [name_store]/      # Rotas dinâmicas das lojas
│       ├── layout.tsx     # Layout da loja
│       ├── page.tsx       # Página de produtos
│       ├── cart/          # Página do carrinho
│       ├── profile/       # Página do perfil
│       └── product/       # Página de detalhes do produto
├── components/            # Componentes reutilizáveis
├── pages/                 # Páginas (componentes)
├── store/                 # Gerenciamento de estado (Jotai)
├── api/                   # Configuração da API
├── types/                 # Definições de tipos TypeScript
└── styles/                # Estilos adicionais
```

## 🔄 Principais Mudanças da Refatoração

### 1. Roteamento
- **Antes**: React Router DOM
- **Depois**: Next.js App Router com rotas dinâmicas

### 2. Estrutura de Arquivos
- **Antes**: `src/App.tsx` com BrowserRouter
- **Depois**: `src/app/layout.tsx` e páginas individuais

### 3. Navegação
- **Antes**: `useNavigate` e `Link` do React Router
- **Depois**: `useRouter` e `Link` do Next.js

### 4. Configuração
- **Antes**: Vite + configurações separadas
- **Depois**: Next.js com configuração unificada

## 🔐 Ambiente

A vitrine fala com a API Go (`catalog-api-go`) através de uma única variável
de ambiente:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Copie `.env.example` para `.env.local` e ajuste o valor para o ambiente
desejado. Em desenvolvimento, na ausência da variável o cliente HTTP cai de
volta para `http://localhost:3000`. **Em produção a variável é obrigatória**:
um `next build` sem `NEXT_PUBLIC_API_URL` definida falha de propósito — uma
vitrine publicada sem saber para onde apontar não serve para nada.

### Verificando a guarda de ambiente

O Next carrega `.env.local` sozinho, antes de qualquer código do projeto.
Então **`unset NEXT_PUBLIC_API_URL && npm run build` não demonstra a falha**
numa máquina que tenha esse arquivo: a variável volta pelo arquivo e o build
passa, e a verificação afirma o contrário do que mediu.

```bash
npm run check:env-guard
```

O script (`scripts/check-env-guard.mjs`) tira `.env`, `.env.local`,
`.env.production` e `.env.production.local` do caminho, roda o build de
produção sem a variável, restaura os arquivos aconteça o que acontecer, e
falha se o build tiver passado.

## ✅ Verificação

```bash
npm ci          # instalação determinística, a partir do package-lock.json
npm run verify  # tipos + lint + build + guarda de ambiente
```

É a régua desta fatia (ver a spec em `catalog-api-go`,
`docs/superpowers/specs/2026-09-12-fatia-vitrine-carrinho-design.md`, seção
8) e é exatamente o que o workflow `.github/workflows/ci.yml` roda a cada
push e pull request. O projeto não tem suíte de testes: o compilador de tipos
contra `src/types/catalog.ts` é o que pega um campo renomeado no contrato da
API antes de ele aparecer só em tempo de execução.

## 🛠️ Como Executar

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Produção
```bash
npm start
```

## 🌐 Rotas Disponíveis

- `/` - Página inicial (Under Construction)
- `/[name_store]` - Página de produtos da loja
- `/[name_store]/cart` - Carrinho de compras
- `/[name_store]/profile` - Perfil do usuário
- `/[name_store]/product/[id_product]` - Detalhes do produto

## 🔧 Configurações

### Next.js
- App Router habilitado
- TypeScript configurado
- ESLint com configuração do Next.js

### Tailwind CSS
- Configuração completa com tema customizado
- Variáveis CSS para cores dinâmicas

### API
- Base URL configurada para produção
- Interceptors para autenticação

## 📝 Notas da Migração

1. **Componentes**: Todos os componentes foram adaptados para usar `'use client'` quando necessário
2. **Roteamento**: Rotas dinâmicas implementadas com App Router
3. **Estado**: Jotai mantido como gerenciador de estado
4. **Estilos**: Tailwind CSS e tema customizado preservados
5. **API**: Configuração mantida com interceptors

## 🚀 Próximos Passos

- [ ] Otimização de performance
- [ ] Implementação de SSR/SSG onde apropriado
- [ ] Melhorias de SEO
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)

## 📄 Licença

Este projeto é privado e pertence à Gefen Software. 