import * as crypto from 'crypto';
import { TEFOperationType, TEFTransaction, TEFTransactionStatus } from '@totem-pdv/shared-types';

export interface PinpadDisplayEvent {
  message: string;
  step: 'INSERT_CARD' | 'ENTER_PIN' | 'PROCESSING' | 'REMOVE_CARD' | 'DONE';
}

export type PinpadCallback = (event: PinpadDisplayEvent) => void;

/**
 * Interface do Driver de Comunicação com Pinpad físico (SiTef, PayGo, D-TEF)
 */
export interface IPinpadDriver {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  processPayment(
    amount: number,
    operationType: TEFOperationType,
    onProgress: PinpadCallback
  ): Promise<{
    success: boolean;
    nsu?: string;
    authCode?: string;
    brand?: string;
    lastDigits?: string;
    acquirer?: string;
    errorMessage?: string;
  }>;
  confirm(nsu: string): Promise<boolean>;
  reverse(nsu: string): Promise<boolean>;
}

/**
 * Driver Simulado de Pinpad para desenvolvimento e testes
 */
export class MockPinpadDriver implements IPinpadDriver {
  public async connect(): Promise<boolean> {
    return true;
  }

  public async disconnect(): Promise<void> {}

  public async processPayment(
    amount: number,
    operationType: TEFOperationType,
    onProgress: PinpadCallback
  ): Promise<{
    success: boolean;
    nsu?: string;
    authCode?: string;
    brand?: string;
    lastDigits?: string;
    acquirer?: string;
    errorMessage?: string;
  }> {
    if (operationType === 'PIX_PINPAD') {
      onProgress({ message: 'Aguardando leitura do QR Code Pix no Pinpad...', step: 'PROCESSING' });
    } else {
      onProgress({ message: 'Aproxime, insira ou passe o cartão', step: 'INSERT_CARD' });
      await new Promise((r) => setTimeout(r, 600));
      onProgress({ message: 'Digite a senha no teclado do Pinpad e tecle ENTER', step: 'ENTER_PIN' });
      await new Promise((r) => setTimeout(r, 800));
      onProgress({ message: 'Processando transação com a adquirente...', step: 'PROCESSING' });
      await new Promise((r) => setTimeout(r, 600));
      onProgress({ message: 'Transação autorizada! Pode retirar o cartão.', step: 'REMOVE_CARD' });
    }

    const nsu = Math.floor(100000 + Math.random() * 900000).toString();
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();

    return {
      success: true,
      nsu,
      authCode,
      brand: operationType === 'CREDIT' ? 'Mastercard' : 'Visa',
      lastDigits: '4567',
      acquirer: 'Rede/SiTef'
    };
  }

  public async confirm(nsu: string): Promise<boolean> {
    return true;
  }

  public async reverse(nsu: string): Promise<boolean> {
    return true;
  }
}

/**
 * Gerenciador de Transações TEF com garantia de Two-Phase Commit e Desfazimento
 */
export class TEFManager {
  private driver: IPinpadDriver;
  private pendingTransactions: Map<string, TEFTransaction> = new Map();

  constructor(driver?: IPinpadDriver) {
    this.driver = driver || new MockPinpadDriver();
  }

  /**
   * Fase 1: Autorização da Transação com Pinpad
   */
  public async startPayment(
    orderId: string,
    amount: number,
    operationType: TEFOperationType,
    onProgress?: PinpadCallback
  ): Promise<TEFTransaction> {
    const transactionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const transaction: TEFTransaction = {
      id: transactionId,
      orderId,
      operationType,
      amount,
      status: 'INITIALIZING',
      createdAt: now,
      updatedAt: now
    };

    this.pendingTransactions.set(transactionId, transaction);

    const result = await this.driver.processPayment(
      amount,
      operationType,
      onProgress || (() => {})
    );

    if (result.success && result.nsu) {
      transaction.status = 'AUTHORIZED';
      transaction.nsu = result.nsu;
      transaction.authorizationCode = result.authCode;
      transaction.cardBrand = result.brand;
      transaction.cardLastDigits = result.lastDigits;
      transaction.acquirerName = result.acquirer;
      transaction.updatedAt = new Date().toISOString();
    } else {
      transaction.status = 'FAILED';
      transaction.errorMessage = result.errorMessage || 'Transação recusada pela operadora.';
      transaction.updatedAt = new Date().toISOString();
      this.pendingTransactions.delete(transactionId);
    }

    return transaction;
  }

  /**
   * Fase 2: Confirmação definitiva da transação após emissão da NFC-e e impressão
   */
  public async confirmPayment(transactionId: string): Promise<boolean> {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction || !transaction.nsu) {
      return false;
    }

    const confirmed = await this.driver.confirm(transaction.nsu);
    if (confirmed) {
      transaction.status = 'CONFIRMED';
      transaction.updatedAt = new Date().toISOString();
      this.pendingTransactions.delete(transactionId);
      return true;
    }

    return false;
  }

  /**
   * Desfazimento / Estorno automático em caso de erro na impressão ou cancelamento
   */
  public async reversePayment(transactionId: string): Promise<boolean> {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction || !transaction.nsu) {
      return false;
    }

    const reversed = await this.driver.reverse(transaction.nsu);
    transaction.status = 'CANCELLED';
    transaction.updatedAt = new Date().toISOString();
    this.pendingTransactions.delete(transactionId);
    return reversed;
  }

  /**
   * Varredura na inicialização do Kiosk para desfazer transações que ficaram órfãs (ex: queda de luz)
   */
  public async resolveOrphanPendencies(): Promise<number> {
    let resolvedCount = 0;
    for (const [id, tx] of this.pendingTransactions.entries()) {
      if (tx.status === 'AUTHORIZED' && tx.nsu) {
        await this.driver.reverse(tx.nsu);
        tx.status = 'PENDING_REVERSAL';
        this.pendingTransactions.delete(id);
        resolvedCount++;
      }
    }
    return resolvedCount;
  }
}
