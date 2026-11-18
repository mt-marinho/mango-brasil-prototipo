'use strict';

// Web simulator only: payment approval is explicit and never connects to an acquirer.
const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const CACHE_KEY = 'mango-kiosk-catalog-v2';
const QUEUE_KEY = 'mango-kiosk-outbox-v2';
const MAX_QUANTITY = 20;
const PAYMENT_NAMES = { PIX: 'Pix', CREDIT_CARD: 'crédito', DEBIT_CARD: 'débito' };
let products = [];
let categories = [];
let cart = [];
let currentCategory = 'all';
let screen = 'attract';
let customization = null;
let lastActivity = Date.now();
let idleWarning = false;
let submitting = false;
let catalogLoading = false;
let catalogConnected = navigator.onLine;
let sessionOrderKey = null;
let successDeadline = 0;
let toastTimeout;
const savedQueue = readStorage(QUEUE_KEY, []);
let queue = (Array.isArray(savedQueue) ? savedQueue : []).filter((entry) => entry?.payload?.idempotency_key);
const inFlight = new Set();

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function uuidV7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let timestamp = BigInt(Date.now());
  for (let i = 5; i >= 0; i--) { bytes[i] = Number(timestamp & 255n); timestamp >>= 8n; }
  bytes[6] = 0x70 | (bytes[6] & 15);
  bytes[8] = 0x80 | (bytes[8] & 63);
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function imageUrl(value) {
  // Product images are served from this application; do not interpolate arbitrary URLs.
  return typeof value === 'string' && /^\/images\/[\w.-]+$/.test(value) ? value : '/mango-mark.svg';
}

function total() { return Math.round(cart.reduce((sum, item) => sum + item.unitCents * item.quantity, 0)) / 100; }
function count() { return cart.reduce((sum, item) => sum + item.quantity, 0); }
function itemDetails(item) {
  return [item.size?.name, ...item.additions.map((addition) => `${addition.quantity}× ${addition.name}`)].filter(Boolean).join(' · ');
}

function showScreen(next) {
  screen = next;
  lastActivity = Date.now();
  document.querySelectorAll('.screen').forEach((element) => { element.hidden = element.id !== `screen-${next}`; });
  const steps = ['menu', 'cart', 'checkout'];
  $('order-progress').hidden = !steps.includes(next);
  document.querySelectorAll('[data-step]').forEach((step) => {
    const active = step.dataset.step === next;
    step.classList.toggle('active', active);
    step.classList.toggle('complete', steps.indexOf(step.dataset.step) < steps.indexOf(next));
    if (active) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
  });
  $(`screen-${next}`).querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
}

function resetOrder() {
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  cart = [];
  customization = null;
  sessionOrderKey = null;
  idleWarning = false;
  successDeadline = 0;
  $('toast').hidden = true;
  document.querySelector('input[name="payment"][value="PIX"]').checked = true;
  updatePaymentLabel();
  updateCart();
  showScreen('attract');
  $('start-order').focus({ preventScroll: true });
}

function showToast(message) {
  clearTimeout(toastTimeout);
  $('toast').innerHTML = icon('check') + escapeHtml(message);
  $('toast').hidden = false;
  toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 2600);
}

function showMessage(title, description, options = {}) {
  $('message-icon').innerHTML = icon(options.icon || 'help');
  $('message-title').textContent = title;
  $('message-description').textContent = description;
  $('message-confirm').textContent = options.confirm || 'Entendi';
  $('message-secondary').hidden = !options.secondary;
  $('message-secondary').textContent = options.secondary || '';
  $('message-confirm').onclick = () => { $('message-modal').close(); options.onConfirm?.(); lastActivity = Date.now(); idleWarning = false; };
  $('message-secondary').onclick = () => { $('message-modal').close(); options.onSecondary?.(); lastActivity = Date.now(); idleWarning = false; };
  if (!$('message-modal').open) $('message-modal').showModal();
}

function updateConnection() {
  const connected = navigator.onLine && catalogConnected;
  $('connection-notice').hidden = connected && queue.length === 0;
  $('connection-notice').textContent = queue.length
    ? `${queue.length} ${queue.length === 1 ? 'pedido salvo, aguardando confirmação' : 'pedidos salvos, aguardando confirmação'}. O reenvio é automático.`
    : 'Conexão indisponível. Você pode continuar escolhendo; seu pedido será salvo para reenvio.';
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const error = new Error('Não foi possível concluir a solicitação.');
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally { clearTimeout(timeout); }
}

async function loadCatalog() {
  if (catalogLoading) return;
  catalogLoading = true;
  if (!products.length) $('kiosk-products-grid').innerHTML = '<div class="loading" aria-label="Carregando cardápio"></div><div class="loading" aria-hidden="true"></div>';
  try {
    const [newProducts, newCategories] = await Promise.all([
      fetchJson('/api/products?kioskOnly=true'), fetchJson('/api/categories')
    ]);
    if (!Array.isArray(newProducts) || !Array.isArray(newCategories)) throw new Error('Catálogo inválido');
    products = newProducts.filter((product) => product.active && product.availableInKiosk);
    categories = newCategories;
    catalogConnected = true;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ products, categories })); } catch { /* Browsing remains available without cache. */ }
  } catch {
    catalogConnected = false;
    const cache = readStorage(CACHE_KEY, null);
    if (!products.length && Array.isArray(cache?.products) && Array.isArray(cache?.categories)) {
      products = cache.products;
      categories = cache.categories;
    }
  } finally {
    catalogLoading = false;
    renderCategories();
    renderProducts();
    updateConnection();
  }
}

function renderCategories() {
  const list = [{ id: 'all', name: 'Todos', short: 'Todos' }, ...categories.filter((category) => products.some((product) => product.categoryId === category.id))];
  if (!list.some((category) => category.id === currentCategory)) currentCategory = 'all';
  const shortNames = { 'cat-1': 'Clássicas', 'cat-2': 'Picantes', 'cat-3': 'Bebidas', 'cat-4': 'Combos' };
  $('kiosk-categories').innerHTML = list.map((category) => {
    const product = products.find((item) => item.categoryId === category.id);
    return `<button class="category" data-category="${escapeHtml(category.id)}" aria-pressed="${category.id === currentCategory}">${product ? `<img src="${imageUrl(product.imageUrl)}" alt="">` : icon('leaf')}${escapeHtml(category.short || shortNames[category.id] || category.name)}</button>`;
  }).join('');
}

function renderProducts() {
  const filtered = products.filter((product) => currentCategory === 'all' || product.categoryId === currentCategory);
  $('category-title').textContent = categories.find((category) => category.id === currentCategory)?.name || 'Todos os sabores';
  $('product-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'opção' : 'opções'}`;
  $('kiosk-products-grid').innerHTML = filtered.length ? filtered.map((product) => `<button class="product-card" data-product="${escapeHtml(product.id)}" aria-label="Escolher ${escapeHtml(product.name)}, a partir de ${money(product.basePrice)}"><span class="product-photo"><img src="${imageUrl(product.imageUrl)}" alt="" loading="lazy"></span><span class="product-copy"><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p><span class="product-price"><span><small>A partir de</small><strong>${money(product.basePrice)}</strong></span><span class="add-circle">${icon('plus')}</span></span></span></button>`).join('')
    : `<div class="empty-state"><h3>${catalogConnected ? 'Nenhum produto disponível por aqui' : 'Não conseguimos carregar o cardápio'}</h3><p>${catalogConnected ? 'Escolha outra categoria ou peça ajuda no balcão.' : 'Confira a conexão e tente novamente. Seu pedido continua aqui.'}</p><button class="button secondary" data-action="reload">${icon('wifi')} Tentar novamente</button></div>`;
}

function openCustomization(product, cartIndex = null) {
  const existing = cartIndex === null ? null : cart[cartIndex];
  customization = {
    product, cartIndex, quantity: existing?.quantity || 1,
    sizeId: existing?.size?.id || product.sizes?.[0]?.id || null,
    additions: Object.fromEntries((existing?.additions || []).map((addition) => [addition.additionId, addition.quantity]))
  };
  $('cust-prod-name').textContent = product.name;
  $('cust-prod-description').textContent = product.description;
  $('cust-prod-image').src = imageUrl(product.imageUrl);
  $('cust-sizes-box').hidden = !product.sizes?.length;
  $('cust-sizes-list').innerHTML = (product.sizes || []).map((size) => `<label class="size-option"><input type="radio" name="size" value="${escapeHtml(size.id)}" ${size.id === customization.sizeId ? 'checked' : ''}><span>${escapeHtml(size.name)}<strong>${money(product.basePrice + size.priceModifier)}</strong></span><span class="radio-mark"></span></label>`).join('');
  $('cust-additions-box').hidden = !product.additions?.length;
  $('cust-additions-list').innerHTML = (product.additions || []).map((addition, index) => `<div class="addition-row"><div>${escapeHtml(addition.name)}<small>+ ${money(addition.price)} cada · até ${addition.maxQuantity}</small></div><div class="stepper"><button type="button" data-addition="${index}" data-delta="-1" aria-label="Diminuir ${escapeHtml(addition.name)}">${icon('minus')}</button><output id="addition-qty-${index}" aria-label="Quantidade de ${escapeHtml(addition.name)}">0</output><button type="button" data-addition="${index}" data-delta="1" aria-label="Adicionar ${escapeHtml(addition.name)}">${icon('plus')}</button></div></div>`).join('');
  $('customize-form').querySelector('button[type="submit"]>span').textContent = existing ? 'Salvar' : 'Adicionar';
  updateCustomization();
  $('customize-modal').showModal();
  $('customize-modal').querySelector('.customize-scroll').scrollTop = 0;
}

function customizedItem() {
  const { product, sizeId, quantity, additions: selected } = customization;
  const size = product.sizes?.find((value) => value.id === sizeId) || null;
  const additions = (product.additions || []).filter((addition) => selected[addition.id] > 0).map((addition) => ({ additionId: addition.id, name: addition.name, price: addition.price, quantity: selected[addition.id] }));
  const unitCents = Math.round(product.basePrice * 100) + Math.round((size?.priceModifier || 0) * 100)
    + additions.reduce((sum, addition) => sum + Math.round(addition.price * 100) * addition.quantity, 0);
  return { product, size, additions, quantity, unitCents };
}

function updateCustomization() {
  $('custom-quantity').value = customization.quantity;
  $('custom-qty-minus').disabled = customization.quantity <= 1;
  $('custom-qty-plus').disabled = customization.quantity >= MAX_QUANTITY;
  (customization.product.additions || []).forEach((addition, index) => {
    const quantity = customization.additions[addition.id] || 0;
    $(`addition-qty-${index}`).value = quantity;
    document.querySelector(`[data-addition="${index}"][data-delta="-1"]`).disabled = quantity <= 0;
    document.querySelector(`[data-addition="${index}"][data-delta="1"]`).disabled = quantity >= addition.maxQuantity;
  });
  const item = customizedItem();
  $('cust-total-calc').textContent = money(item.unitCents * item.quantity / 100);
}

function saveCustomizedItem(event) {
  event.preventDefault();
  const item = customizedItem();
  const editing = customization.cartIndex !== null;
  if (editing) cart[customization.cartIndex] = item; else cart.push(item);
  $('customize-modal').close();
  updateCart();
  showToast(editing ? 'Pedido atualizado' : `${item.quantity}× ${item.product.name} no pedido`);
}

function updateCart() {
  const itemCount = count();
  const formatted = money(total());
  $('cart-badge').textContent = itemCount;
  $('kiosk-cart-count').textContent = itemCount ? `${itemCount} ${itemCount === 1 ? 'item no pedido' : 'itens no pedido'}` : 'Seu pedido está vazio';
  ['kiosk-cart-total', 'cart-total', 'checkout-total-val', 'payment-total'].forEach((id) => { $(id).textContent = formatted; });
  $('checkout-count').textContent = `${itemCount} ${itemCount === 1 ? 'item no seu pedido' : 'itens no seu pedido'}`;
  $('btn-kiosk-checkout').disabled = !itemCount;
  $('go-payment').disabled = !itemCount;
  $('cart-items').innerHTML = cart.map((item, index) => `<article class="cart-item"><img src="${imageUrl(item.product.imageUrl)}" alt=""><div><h3>${escapeHtml(item.product.name)}</h3><p>${escapeHtml(itemDetails(item))}</p><p>${money(item.unitCents / 100)} por unidade</p></div><strong class="cart-item-total">${money(item.unitCents * item.quantity / 100)}</strong><div class="cart-item-actions"><button class="edit-item" data-edit="${index}">Editar item</button><div class="stepper"><button data-cart="${index}" data-delta="-1" aria-label="${item.quantity === 1 ? 'Remover' : 'Diminuir'} ${escapeHtml(item.product.name)}">${icon(item.quantity === 1 ? 'trash' : 'minus')}</button><span class="qty" aria-label="Quantidade">${item.quantity}</span><button data-cart="${index}" data-delta="1" ${item.quantity >= MAX_QUANTITY ? 'disabled' : ''} aria-label="Aumentar ${escapeHtml(item.product.name)}">${icon('plus')}</button></div></div></article>`).join('');
  if (!itemCount && screen === 'cart') showScreen('menu');
}

function updatePaymentLabel() {
  const method = document.querySelector('input[name="payment"]:checked').value;
  $('pay-button').innerHTML = `Continuar com ${PAYMENT_NAMES[method]} ${icon('arrow')}`;
}

function openPayment() {
  if (!cart.length || submitting) return;
  const method = document.querySelector('input[name="payment"]:checked').value;
  $('payment-illustration').innerHTML = icon(method === 'PIX' ? 'pix' : 'card');
  $('payment-title').textContent = method === 'PIX' ? 'Pagamento com Pix' : `Cartão de ${PAYMENT_NAMES[method]}`;
  $('payment-description').textContent = method === 'PIX'
    ? 'Na versão integrada, o QR Code aparecerá aqui. Para testar o fluxo, simule a aprovação abaixo.'
    : 'Na versão integrada, siga as instruções da maquininha. Aqui, você pode simular a aprovação sem usar um cartão.';
  $('payment-modal-total').textContent = money(total());
  $('payment-error').hidden = true;
  $('approve-payment').disabled = false;
  $('approve-payment').innerHTML = `Simular aprovação ${icon('check')}`;
  $('payment-modal').showModal();
}

function makePayload() {
  const key = uuidV7();
  const method = document.querySelector('input[name="payment"]:checked').value;
  return {
    idempotency_key: key, origin: 'TOTEM', kioskId: 'totem-01',
    items: cart.map((item, index) => ({
      id: `${key}-${index}`, productId: item.product.id, productName: item.product.name,
      sizeId: item.size?.id, sizeName: item.size?.name, unitPrice: item.unitCents / 100,
      quantity: item.quantity, totalPrice: item.unitCents * item.quantity / 100,
      additions: item.additions, fiscal: item.product.fiscal
    })),
    payments: [{ id: uuidV7(), idempotency_key: uuidV7(), method, amount: total(), status: 'APPROVED', paidAt: new Date().toISOString() }]
  };
}

async function approvePayment() {
  if (submitting || !cart.length) return;
  const entry = { payload: makePayload(), createdAt: new Date().toISOString() };
  // Persist before sending so a timeout/reload retains the exact transaction and key.
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, entry])); } catch {
    $('payment-error').textContent = 'Não foi possível salvar o pedido neste navegador. Peça ajuda no balcão antes de continuar.';
    $('payment-error').hidden = false;
    return;
  }
  queue.push(entry);
  sessionOrderKey = entry.payload.idempotency_key;
  submitting = true;
  $('approve-payment').disabled = true;
  $('cancel-payment').disabled = true;
  $('approve-payment').textContent = 'Confirmando pedido…';
  try {
    const order = await sendEntry(entry);
    $('payment-modal').close();
    if (order) showSuccess(order); else showPending(entry);
  } finally {
    submitting = false;
    $('cancel-payment').disabled = false;
    lastActivity = Date.now();
    updateConnection();
  }
}

async function sendEntry(entry) {
  const key = entry.payload.idempotency_key;
  if (inFlight.has(key)) return null;
  inFlight.add(key);
  try {
    const order = await fetchJson('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify(entry.payload)
    });
    queue = queue.filter((value) => value.payload.idempotency_key !== key);
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch { /* Server deduplicates a retained entry. */ }
    catalogConnected = true;
    return order;
  } catch (error) {
    if (error.status && error.status < 500) {
      // A validation/conflict response requires operator review, not endless retries.
      entry.needsReview = true;
      try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch { /* Retain in memory. */ }
    } else { catalogConnected = false; }
    return null;
  } finally { inFlight.delete(key); updateConnection(); }
}

async function syncQueue() {
  if (submitting || !navigator.onLine) return;
  $('retry-order').disabled = true;
  try {
    for (const entry of [...queue]) {
      if (entry.needsReview) continue;
      const order = await sendEntry(entry);
      if (order && sessionOrderKey === entry.payload.idempotency_key && screen === 'pending') showSuccess(order);
    }
  } finally { $('retry-order').disabled = false; }
}

function showPending(entry) {
  $('pending-title').textContent = entry.needsReview ? 'Seu pedido precisa de atenção' : 'Pedido salvo neste totem';
  $('screen-pending').querySelector('.result-content>p').textContent = entry.needsReview
    ? 'Não foi possível confirmar este pedido. Peça ajuda no balcão antes de fazer outro.'
    : 'A conexão está instável. Vamos reenviar automaticamente quando ela voltar.';
  $('screen-pending').querySelector('.pending-message').textContent = entry.needsReview
    ? 'O pedido foi preservado para conferência. Não há senha de retirada confirmada.'
    : 'Ainda não temos uma senha de retirada. Se precisar, peça ajuda no balcão.';
  $('retry-order').hidden = Boolean(entry.needsReview);
  showScreen('pending');
}

function showSuccess(order) {
  $('success-ticket-number').textContent = `#${order.publicTicketNumber}`;
  $('success-receipt-total').textContent = money(order.total);
  $('success-receipt-items').innerHTML = order.items.map((item) => `<div class="receipt-row"><span>${item.quantity}× ${escapeHtml(item.productName)}${item.sizeName ? ` · ${escapeHtml(item.sizeName)}` : ''}</span><span>${money(item.totalPrice)}</span></div>`).join('');
  cart = [];
  updateCart();
  showScreen('success');
  successDeadline = Date.now() + 45000;
  $('success-countdown').textContent = 'Esta tela será encerrada em 45s';
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.close) $(button.dataset.close).close();
  if (button.dataset.action === 'help') showMessage('A gente te ajuda', 'Chame um atendente no balcão. Seu pedido fica aqui enquanto você recebe ajuda.', { confirm: 'Continuar meu pedido' });
  if (button.dataset.action === 'cancel-order') confirmCancelOrder();
  if (button.dataset.action === 'finish') resetOrder();
  if (button.dataset.action === 'menu') showScreen('menu');
  if (button.dataset.action === 'cart' && cart.length) { updateCart(); showScreen('cart'); }
  if (button.dataset.action === 'reload') loadCatalog();
  if (button.dataset.category) {
    currentCategory = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((category) => category.setAttribute('aria-pressed', category === button ? 'true' : 'false'));
    renderProducts();
    document.querySelector('.catalog-scroll').scrollTop = 0;
  }
  if (button.dataset.product) {
    const product = products.find((value) => value.id === button.dataset.product);
    if (product) openCustomization(product);
  }
  if (button.dataset.addition !== undefined && customization) {
    const addition = customization.product.additions[Number(button.dataset.addition)];
    customization.additions[addition.id] = Math.max(0, Math.min(addition.maxQuantity, (customization.additions[addition.id] || 0) + Number(button.dataset.delta)));
    updateCustomization();
  }
  if (button.dataset.edit !== undefined) {
    const index = Number(button.dataset.edit);
    openCustomization(cart[index].product, index);
  }
  if (button.dataset.cart !== undefined) {
    const index = Number(button.dataset.cart);
    const item = cart[index];
    const delta = Number(button.dataset.delta);
    const update = () => { item.quantity = Math.min(MAX_QUANTITY, item.quantity + delta); if (item.quantity <= 0) cart.splice(index, 1); updateCart(); };
    if (item.quantity === 1 && delta < 0) showMessage('Remover este item?', item.product.name, { icon: 'trash', confirm: 'Remover item', secondary: 'Manter no pedido', onConfirm: update });
    else update();
  }
});

$('start-order').onclick = () => { currentCategory = 'all'; showScreen('menu'); loadCatalog(); };
$('btn-kiosk-checkout').onclick = () => { updateCart(); showScreen('cart'); };
$('go-payment').onclick = () => { if (cart.length) { updateCart(); showScreen('checkout'); } };
$('customize-form').onsubmit = saveCustomizedItem;
$('custom-qty-minus').onclick = () => { customization.quantity = Math.max(1, customization.quantity - 1); updateCustomization(); };
$('custom-qty-plus').onclick = () => { customization.quantity = Math.min(MAX_QUANTITY, customization.quantity + 1); updateCustomization(); };
$('cust-sizes-list').onchange = (event) => { customization.sizeId = event.target.value; updateCustomization(); };
document.querySelector('.payment-options').onchange = updatePaymentLabel;
function confirmCancelOrder() { showMessage('Cancelar seu pedido?', 'Os itens serão removidos e você voltará à tela inicial.', { icon: 'trash', confirm: 'Continuar meu pedido', secondary: 'Sim, cancelar pedido', onSecondary: resetOrder }); }
$('cancel-order').onclick = confirmCancelOrder;
$('pay-button').onclick = openPayment;
$('approve-payment').onclick = approvePayment;
$('cancel-payment').onclick = () => { if (!submitting) $('payment-modal').close(); };
$('retry-order').onclick = syncQueue;
$('payment-modal').addEventListener('cancel', (event) => { if (submitting) event.preventDefault(); });
$('message-modal').addEventListener('cancel', () => { idleWarning = false; lastActivity = Date.now(); });
['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((name) => document.addEventListener(name, () => { if (!idleWarning) lastActivity = Date.now(); }, { passive: true }));
window.addEventListener('online', () => { loadCatalog(); syncQueue(); });
window.addEventListener('offline', updateConnection);
document.addEventListener('error', (event) => {
  if (event.target.tagName === 'IMG' && !event.target.src.endsWith('/mango-mark.svg')) event.target.src = '/mango-mark.svg';
}, true);

setInterval(() => {
  if (screen === 'success') {
    const seconds = Math.max(0, Math.ceil((successDeadline - Date.now()) / 1000));
    $('success-countdown').textContent = `Esta tela será encerrada em ${seconds}s`;
    if (!seconds) resetOrder();
    return;
  }
  if (['attract', 'pending'].includes(screen) || submitting) return;
  const remaining = 120 - Math.floor((Date.now() - lastActivity) / 1000);
  if (remaining <= 0) { resetOrder(); return; }
  if (remaining <= 20) {
    if (!idleWarning) {
      idleWarning = true;
      showMessage('Você ainda está por aqui?', '', { icon: 'clock', confirm: 'Sim, continuar pedido', secondary: 'Encerrar pedido', onSecondary: resetOrder });
    }
    $('message-description').textContent = `Seu pedido será encerrado em ${remaining}s por inatividade. Toque em continuar para manter seus itens.`;
  }
}, 1000);
setInterval(syncQueue, 15000);
resetOrder();
if (queue.length) {
  const entry = queue[queue.length - 1];
  sessionOrderKey = entry.payload.idempotency_key;
  showPending(entry);
  syncQueue();
}
updateConnection();
// Preload now, so the welcome screen does not lead to an empty catalog.
loadCatalog();
