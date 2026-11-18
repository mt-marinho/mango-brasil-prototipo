# Especificação do MVP - Sistema Totem Autoatendimento & PDV Central

## 1. Visão Geral
Sistema comercial completo composto por:
1. **Central Web**: Gestão de cadastros, caixas, fechamento de turnos, fila de produção (KDS), motor fiscal NFC-e e retaguarda de totens.
2. **App do Totem (Flutter)**: Kiosk interativo de autoatendimento touch, montagem de pedidos, pagamento TEF/Pinpad integrado, impressão térmica e resiliência offline.
3. **PDV Assistido**: Operação de caixa balcão para vendas em dinheiro com troco, sangria e suprimento.

---

## 2. Módulos do Sistema

### 2.1 Sistema Central (Web)
* **Caixa & Turnos:**
  - Abertura e fechamento de turno por terminal/caixa.
  - Conferência de fechamento cego e conferência por forma de pagamento (Dinheiro, Crédito, Débito, Pix, Voucher).
  - Relatório detalhado do turno (resumo de vendas, suprimentos, sangrias e quebras de caixa).
* **Cadastro de Produtos & Catálogo:**
  - Produto: nome, foto, categoria e dados fiscais completos (NCM, CEST, CFOP, Origem, CSOSN/CST, alíquotas).
  - Variações: tamanhos e adicionais vinculados.
  - Ativar ou desativar produto (com reflexo instantâneo no totem).
  - Preço customizado por produto, tamanho e adicional.
* **Pedidos & Produção (KDS):**
  - Fila de pedidos pagos em tempo real para tablet/tela de preparo.
  - Status do pedido: *Recebido*, *Em preparo*, *Pronto*.
  - Número de senha (chamada de senha na tela do cliente).
* **Motor Fiscal (NFC-e):**
  - Gerenciamento de Certificado Digital A1 (.pfx) com senha em cofre local/seguro.
  - Configuração de CSC (Código de Segurança do Contribuinte), IdCSC, série e numeração sequencial.
  - Regras tributárias por produto (NCM, CFOP, CST/CSOSN, regras de IBS/CBS reforma tributária, tabela IBPT).
  - Emissão síncrona com SEFAZ, tratamento de contingência offline e cancelamento fiscal.
  - Armazenamento estruturado e exportação dos XMLs autorizados.
* **Usuários & Permissões:**
  - Perfis de acesso: *Dono/Admin*, *Gerente*, *Atendente/Operador de Caixa*.
  - Controle estrito de permissão para cancelamento de itens e fechamento de caixa.
  - Log auditável de cancelamentos e estornos.
* **Configurações Gerais:**
  - Dados da empresa (Razão Social, Nome Fantasia, CNPJ, Inscrição Estadual, Endereço, Regime Tributário: Simples Nacional / Lucro Presumido / Real).
  - Cadastro, identificador e monitoramento de status online/offline dos totens.
  - Modo manutenção remoto para travamento de totens em caso de falha.

---

### 2.2 App do Totem (Flutter)
* **Autoatendimento:**
  - Interface visual otimizada para orientação vertical (Kiosk portrait) com toque responsivo.
  - Cardápio navegável por categorias, fluxo de montagem do pedido (tamanho, adicionais, observações) e carrinho interativo.
  - Seleção da forma de pagamento.
  - Impressão térmica automática de comprovante, DANFE NFC-e e cupom de senha.
  - Retorno automático à tela inicial após inatividade (timeout configurável com modal de contagem regressiva).
* **Pagamentos Integrados (TEF / Pinpad):**
  - Transações de Crédito, Débito e Pix geradas e validadas diretamente no Pinpad via TEF.
  - Confirmação em duas fases (autorização e confirmação/desfazimento da transação).
  - Tratamento rigoroso de pendências (queda de energia ou desconexão do cabo durante transação).
  - Estorno automático em caso de cancelamento da operação.
* **Comunicação com o Central & Resiliência:**
  - Download/cache local de produtos, categorias, fotos e tabela de preços.
  - Envio da venda para a Central Web para autorização da NFC-e.
  - **Fila local offline (SQLite):** Em caso de queda de conexão, armazena pedidos e pagamentos localmente para sincronização e emissão em contingência assim que o link for restaurado.

---

### 2.3 PDV Assistido (No Central Web)
* Venda assistida operada por atendente no balcão.
* Aceite de pagamento em dinheiro com cálculo automático de troco.
* Controle de sangria (retirada) e suprimento (entrada de troco) no caixa físico.
* Impressão de cupom e NFC-e via agente local ou impressora de rede ESC/POS.
