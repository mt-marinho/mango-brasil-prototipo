# Diretrizes de Engenharia e Agentes - Totem PDV Central

Este arquivo orienta agentes autônomos (**Claude Code**, **Codex**, **Antigravity**) na arquitetura, convenções e implementação do sistema **Totem PDV Central**.

---

## 1. Arquitetura do Repositório (Monorepo)

O projeto é estruturado em monorepo com isolamento de responsabilidades:

```text
totem-pdv-central/
├── apps/
│   ├── central-web/        # Frontend & API de Gestão (React / Next.js ou NestJS / Node)
│   └── totem-app/          # Kiosk Autoatendimento em Flutter (Android/Linux/Windows)
├── packages/
│   ├── fiscal-engine/      # Motor NFC-e (Certificado A1, XML, SEFAZ, Contingência)
│   ├── tef-client/         # Camada de comunicação com Pinpad / TEF
│   └── shared-types/       # DTOs, schemas e contratos de API compartilhados
└── docs/
    └── MVP.md              # Requisitos de negócio e escopo detalhado
```

---

## 2. Divisão de Papéis dos Agentes (Multi-Agent Swarm)

Para trabalho concorrente via **Agent Workbench (Git Worktrees)**:

* **Agente Arquiteto / Backend (Claude Code - Branch `backend-central`):**
  - Responsável por: API Central, banco de dados (migrations, Prisma/TypeORM/Postgres), autenticação, regras de caixa, controle de turnos e fila de produção (KDS).
  - Regra de Ouro: APIs devem fornecer contratos OpenAPI/Swagger tipados em `packages/shared-types`.
* **Agente Fiscal & Integrações (Claude Code / Codex - Branch `fiscal-engine`):**
  - Responsável por: Motor fiscal NFC-e, assinatura digital de XML via certificado A1, cálculo de IBPT/IBS/CBS e contingência offline.
  - Regra de Ouro: Todo XML gerado deve ser estritamente validado contra o XSD da SEFAZ antes do envio.
* **Agente Front-end Totem (Codex / Antigravity - Branch `totem-flutter`):**
  - Responsável por: Interface Flutter (responsividade Kiosk touch 1080x1920 portrait), fluxo de montagem do pedido, carrinho, integração TEF e fila local SQLite para contingência offline.
  - Regra de Ouro: O totem NUNCA deve travar ou bloquear a tela em caso de falha de conexão. Qualquer requisição com timeout entra na fila local offline.

---

## 3. Padrões de Qualidade e Código

1. **Estado = Forma + Texto + Cor:** Nunca use apenas cor para indicar estado. Todo botão ou badge precisa de ícone/forma e texto descritivo.
2. **Contingência e Idempotência:** Toda transação de pagamento e pedido deve possuir um `idempotency_key` (UUID v7) único para evitar cobranças ou emissões duplicadas em instabilidades de rede.
3. **Privacidade e LGPD:** Logs de sistema NUNCA devem registrar dados sensíveis de cartões (PAN, CVV, senhas de pinpad).
4. **Commits e Branches:** Cada agente deve realizar commits atômicos acompanhados de descrição clara antes de solicitar handoff ou merge.
