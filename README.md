# 🥭 Mango Brasil — Totem & PDV Central

Protótipo da **Mango Brasil**, estabelecimento de mangas temperadas. Sistema de autoatendimento (Totem Kiosk) e gestão de frente de caixa (PDV Assistido, KDS de Preparo, Fechamento Cego de Turnos e Motor Fiscal NFC-e), arquitetado em monorepo pnpm para alta performance, robustez e conformidade fiscal.

---

## 🏗️ Arquitetura do Monorepo

```
totem-pdv-central/
├── apps/
│   ├── central-web/        # API REST Node.js + Single Page Application (PDV, KDS, Caixa, NFC-e, Simulador Totem)
│   ├── totem_app/          # Aplicativo Totem Touch em Flutter (Mobile / Tablet / Desktop Kiosk)
│   └── cockpit/            # Cockpit Multi-Agente em tempo real (SSE + Pipeline Kanban + Deep Links)
├── packages/
│   ├── shared-types/       # Contratos de domínio e interfaces TypeScript compartilhadas
│   ├── fiscal-engine/      # Motor de emissão de NFC-e (Chave 44 dígitos Módulo 11, QR-Code v2, DANFE)
│   └── tef-client/         # Cliente de integração TEF (Protocolo Two-Phase Commit 2PC)
└── pnpm-workspace.yaml     # Configuração do monorepo pnpm
```

---

## 🚀 Funcionalidades Principais

### 1. 🖥️ PDV Assistido & Caixa (Balcão)
- **Catálogo Interativo:** Seleção rápida por categorias (Mangas Clássicas, Mangas Picantes, Bebidas Naturais e Combos).
- **Calculadora de Troco em Tempo Real:** Digitação do valor recebido em dinheiro com cálculo instantâneo do troco e bloqueio em caso de valor insuficiente.
- **Formas de Pagamento:** Suporte a Dinheiro, Cartão de Crédito/Débito (TEF) e Pix instantâneo.
- **Despacho Automático:** Pedidos finalizados geram documento fiscal e caem imediatamente na fila de preparo.

### 2. 👨‍🍳 KDS (Kitchen Display System — Preparo)
- **Fila de Pedidos em Tempo Real:** Atualização automática sem necessidade de recarregar a página.
- **Esteira de Produção:** Transição de status em 1 clique: `RECEBIDO` ➔ `PREPARANDO` ➔ `PRONTO` ➔ `ENTREGUE`.
- **Filtros e Contadores:** Métricas de pedidos pendentes, em preparo e finalizados.

### 3. 💰 Gestão de Turnos & Fechamento Cego
- **Abertura e Fechamento de Caixa:** Controle rigoroso de operador, data/hora e saldo inicial de suprimento.
- **Fechamento Cego:** O operador informa a contagem física sem ver o saldo do sistema. O sistema calcula e audita automaticamente:
  - Vendas por forma de pagamento (Dinheiro, Cartão, Pix).
  - Sangrias e Suprimentos efetuados.
  - Quebra ou sobra de caixa auditada.
- **Emissão de Redução Z:** Relatório gerencial consolidado do turno.

### 4. 📜 Motor Fiscal NFC-e Homologado
- **Chave de Acesso Padrão SEFAZ:** 44 dígitos com algoritmo de validação Módulo 11 (código UF, AAMM, CNPJ, modelo 65, série, número, tipo de emissão, código numérico e DV).
- **QR-Code Versão 2.0:** Link assinado com parâmetros `chNFe`, `nVersao`, `tpAmb` e `cDest`.
- **Detalhamento Tributário:** Cálculo de tributos aproximados (IBPT - Federal e Estadual) e DANFE NFC-e visualizável e imprimível.

### 5. 📱 Totem Touchscreen Kiosk (Autoatendimento)
- **Tela de Atração Dinâmica:** Vídeo promocional/banner de boas-vindas touch.
- **Personalização de Itens:** Modal para escolha de porção de manga, limão, mix de pimentas e melado de cana.
- **Simulador Interativo de Pinpad TEF:** Etapas visuais de transação (Insira o cartão ➔ Processando ➔ Senha ➔ Aprovado).
- **Animação de Impressão:** Emissão visual do cupom com senha do pedido e DANFE simplificado.
- **Timer de Inatividade (Safety Kiosk):** Contagem regressiva de 60 segundos com retorno automático para a tela de atração em caso de abandono.

### 6. 🎛️ Cockpit Multi-Agente & Mesa Redonda (`:5050`)
- **Dashboard Global:** Visualização de múltiplos projetos simultâneos.
- **Pipeline Kanban:** Esteira de execução com estados `Ideação`, `Planejamento`, `Implementação`, `Revisão QA` e `Deploy`.
- **Stream de Pensamentos:** Transmissão via Server-Sent Events (SSE) dos raciocínios dos agentes em tempo real.
- **Deep Links Nativos:** Abertura direta de arquivos no VS Code (`code`) e no Windows Explorer (`explorer.exe`).

---

## ⚡ Como Executar Localmente

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **pnpm** (`npm.cmd install -g pnpm@10`)
- **Flutter SDK** (opcional, para compilação nativa do Totem App)

### Instalação de Dependências
```bash
# Na raiz do monorepo:
pnpm install
```

### Inicialização dos Serviços

#### 1. Central Web (PDV, KDS, Caixa e Totem Web)
```bash
cd apps/central-web
pnpm build
node dist/server.js
# Servidor disponível em: http://localhost:4000
```
- **PDV & Gestão:** [http://localhost:4000/](http://localhost:4000/)
- **Totem Kiosk Touch:** [http://localhost:4000/totem](http://localhost:4000/totem)

#### 2. Cockpit Multi-Projeto (Orquestração & Visualização)
```bash
cd apps/cockpit
node server.js
# Cockpit disponível em: http://localhost:5050
```

#### 3. Totem Flutter App (Opcional - Desktop / Tablet)
```bash
cd apps/totem_app
flutter pub get
flutter run -d chrome # ou -d windows
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Monorepo** | pnpm Workspaces, TypeScript |
| **Backend & APIs** | Node.js, Express, Server-Sent Events (SSE), SQLite/Memory Store |
| **Frontend Web** | HTML5 Semântico, CSS3 Moderno (Glassmorphism & Dracula Dark), Vanilla JS modular |
| **Totem Mobile/Desktop** | Flutter 3.x, Dart 3, Material 3, Clean Architecture |
| **Motor Fiscal** | Cálculo Módulo 11 SEFAZ, QR-Code v2, DANFE NFC-e |
| **Orquestração Multi-Agente** | Google Antigravity, Claude Code, OpenAI Codex, Orchestra Board |

---

## 📄 Licença
Distribuído sob licença proprietária para uso no projeto **Mango Brasil**.


## Cardápio demonstrativo Mango Brasil

- Manga Limão & Sal — R$ 12,90
- Manga Picante da Casa — R$ 15,90
- Manga Fogo Tropical — R$ 17,90
- Manga Agridoce — R$ 14,90
- Suco de Manga Natural (400 ml) — R$ 8,00
- Combo Dupla Tropical — R$ 34,90

Porções de manga: copo de 300 g ou bowl de 500 g (+ R$ 7,00). Adicionais: limão, mix de pimentas e melado de cana. Catálogo, preços, identificação empresarial e parâmetros fiscais são dados ilustrativos de homologação.

As fotos ilustrativas foram geradas com a ferramenta de imagens integrada e ficam em apps/central-web/public/images. Prompts: fotografias de catálogo de manga em palitos com limão e sal; manga com pimenta e páprica; suco de manga com gelo; combo com duas porções e um suco. Fundo creme, folhas tropicais, luz natural, sem rótulos.
