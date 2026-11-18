'use strict';

const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const CACHE_KEY = 'mango-kiosk-catalog-v2';
const TICKET_KEY = 'mango-kiosk-demo-ticket';
const MAX_QUANTITY = 20;
const PAYMENT_STEPS = {
  PIX: ['Escaneie o QR Code na maquininha', 'Aguardando pagamento…'],
  CARD: ['Aproxime ou insira o cartão', 'Digite a senha na maquininha', 'Processando…']
};
const PAYMENT_ERRORS = {
  recusado: 'Pagamento recusado.',
  'tempo-esgotado': 'Tempo esgotado para o pagamento.'
};
const demoResult = new URLSearchParams(window.location.search).get('pagamento');
let products = [];
let categories = [];
let cart = [];
let currentCategory = 'all';
let screen = 'attract';
let customization = null;
let paymentTimer;
let paymentMethod;
let selectedPayment = null;
let ticketSequence = readStorage(TICKET_KEY, 0);
if (!Number.isSafeInteger(ticketSequence) || ticketSequence < 0 || ticketSequence > 999) ticketSequence = 0;
let catalogLoading = false;
let catalogConnected = navigator.onLine;
let successDeadline = 0;

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
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
  document.querySelectorAll('.screen').forEach((element) => { element.hidden = element.id !== `screen-${next}`; });
  const steps = ['menu', 'checkout'];
  const currentStep = next === 'payment' ? 'checkout' : next;
  $('order-progress').hidden = !steps.includes(currentStep);
  document.querySelectorAll('[data-step]').forEach((step) => {
    const active = step.dataset.step === currentStep;
    step.classList.toggle('active', active);
    step.classList.toggle('complete', steps.indexOf(step.dataset.step) < steps.indexOf(currentStep));
    if (active) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
  });
  $(`screen-${next}`).querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
}

function resetOrder({ focusStart = true } = {}) {
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  cart = [];
  customization = null;
  clearTimeout(paymentTimer);
  paymentMethod = null;
  selectedPayment = null;
  updatePaymentSelection();
  successDeadline = 0;
  $('checkout-form').reset();
  $('success-name').textContent = '';
  $('success-name').hidden = true;
  updateCart();
  showScreen('attract');
  if (focusStart) $('start-order').focus({ preventScroll: true });
}

function pulseCartBadge() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const badge = $('cart-badge');
  badge.getAnimations().forEach((animation) => animation.cancel());
  badge.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.35)' },
    { transform: 'scale(1)' }
  ], { duration: 320, easing: 'ease-in-out' });
}

function showMessage(title, description, options = {}) {
  $('message-icon').innerHTML = icon(options.icon || 'help');
  $('message-title').textContent = title;
  $('message-description').textContent = description;
  $('message-confirm').textContent = options.confirm || 'Entendi';
  $('message-secondary').hidden = !options.secondary;
  $('message-secondary').textContent = options.secondary || '';
  $('message-confirm').onclick = () => { $('message-modal').close(); options.onConfirm?.(); };
  $('message-secondary').onclick = () => { $('message-modal').close(); options.onSecondary?.(); };
  if (!$('message-modal').open) $('message-modal').showModal();
}

function updateConnection() {
  const connected = navigator.onLine && catalogConnected;
  $('connection-notice').hidden = connected;
  $('connection-notice').textContent = 'Conexão indisponível. Você pode continuar com o cardápio salvo, se disponível.';
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
  if (!editing) pulseCartBadge();
}

function updateCart() {
  const itemCount = count();
  const formatted = money(total());
  $('cart-badge').textContent = itemCount;
  $('kiosk-cart-count').textContent = itemCount ? `${itemCount} ${itemCount === 1 ? 'item no pedido' : 'itens no pedido'}` : 'Seu pedido está vazio';
  $('kiosk-cart-total').textContent = formatted;
  $('payment-total').textContent = formatted;
  $('btn-kiosk-checkout').disabled = !itemCount;
  $('cart-items').innerHTML = cart.map((item, index) => `<article class="cart-item"><img src="${imageUrl(item.product.imageUrl)}" alt=""><div><h3>${escapeHtml(item.product.name)}</h3><p>${escapeHtml(itemDetails(item))}</p><p>${money(item.unitCents / 100)} por unidade</p></div><strong class="cart-item-total">${money(item.unitCents * item.quantity / 100)}</strong><div class="cart-item-actions"><button class="edit-item" data-edit="${index}">Editar item</button><div class="stepper"><button data-cart="${index}" data-delta="-1" aria-label="${item.quantity === 1 ? 'Remover' : 'Diminuir'} ${escapeHtml(item.product.name)}">${icon(item.quantity === 1 ? 'trash' : 'minus')}</button><span class="qty" aria-label="Quantidade">${item.quantity}</span><button data-cart="${index}" data-delta="1" ${item.quantity >= MAX_QUANTITY ? 'disabled' : ''} aria-label="Aumentar ${escapeHtml(item.product.name)}">${icon('plus')}</button></div></div></article>`).join('');
  if (!itemCount && screen === 'checkout') showScreen('menu');
}

function openCheckout() {
  if (!cart.length) return;
  updateCart();
  showScreen('checkout');
  document.querySelector('.checkout-scroll').scrollTop = 0;
}

function updatePaymentSelection() {
  document.querySelectorAll('[data-payment]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.payment === selectedPayment));
  });
  $('finalize-order').disabled = !selectedPayment;
}

function selectPayment(method) {
  selectedPayment = method;
  updatePaymentSelection();
}

function startPayment(method) {
  if (!cart.length || !method) return;

  clearTimeout(paymentTimer);
  paymentMethod = method;
  $('payment-recovery').hidden = true;
  $('cancel-payment').hidden = false;
  const status = $('payment-status');
  status.classList.remove('failed');
  showScreen('payment');
  const steps = method === 'PIX' ? PAYMENT_STEPS.PIX : PAYMENT_STEPS.CARD;
  let step = 0;

  function advance() {
    if (step < steps.length) {
      status.textContent = steps[step++];
      paymentTimer = setTimeout(advance, 1700);
      return;
    }
    if (!Object.hasOwn(PAYMENT_ERRORS, demoResult)) {
      showSuccess();
      return;
    }
    status.textContent = PAYMENT_ERRORS[demoResult];
    status.classList.add('failed');
    $('cancel-payment').hidden = true;
    $('payment-recovery').hidden = false;
    $('retry-payment').focus();
  }

  advance();
}

function leavePayment() {
  clearTimeout(paymentTimer);
  paymentMethod = null;
  showScreen('checkout');
  document.querySelector('.payment-options').scrollIntoView({ block: 'nearest' });
}

function showSuccess() {
  ticketSequence = ticketSequence % 999 + 1;
  try { localStorage.setItem(TICKET_KEY, JSON.stringify(ticketSequence)); } catch { /* The sequence remains available for this session. */ }
  $('success-ticket-number').textContent = `#${String(ticketSequence).padStart(3, '0')}`;
  const firstName = $('order-name').value.trim().split(/\s+/)[0];
  $('success-name').textContent = firstName;
  $('success-name').hidden = !firstName;
  $('checkout-form').reset();
  cart = [];
  updateCart();
  showScreen('success');
  successDeadline = Date.now() + 10000;
  $('success-countdown').textContent = 'Voltando ao início em 10 s';
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.close) $(button.dataset.close).close();
  if (button.dataset.action === 'help') showMessage('A gente te ajuda', 'Chame um atendente no balcão. Seu pedido fica aqui enquanto você recebe ajuda.', { confirm: 'Continuar meu pedido' });
  if (button.dataset.action === 'cancel-order') confirmCancelOrder();
  if (button.dataset.action === 'finish') resetOrder();
  if (button.dataset.action === 'menu') showScreen('menu');
  if (button.dataset.payment && screen === 'checkout') selectPayment(button.dataset.payment);
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

$('kiosk').onclick = () => {
  if (screen !== 'attract') return;
  currentCategory = 'all';
  showScreen('menu');
  loadCatalog();
};
$('btn-kiosk-checkout').onclick = openCheckout;
$('finalize-order').onclick = () => startPayment(selectedPayment);
$('customize-form').onsubmit = saveCustomizedItem;
$('custom-qty-minus').onclick = () => { customization.quantity = Math.max(1, customization.quantity - 1); updateCustomization(); };
$('custom-qty-plus').onclick = () => { customization.quantity = Math.min(MAX_QUANTITY, customization.quantity + 1); updateCustomization(); };
$('cust-sizes-list').onchange = (event) => { customization.sizeId = event.target.value; updateCustomization(); };
$('checkout-form').onsubmit = (event) => event.preventDefault();
function confirmCancelOrder() {
  showMessage('Cancelar seu pedido?', 'Os itens serão removidos e você voltará à tela inicial.', {
    icon: 'trash', confirm: 'Continuar meu pedido', secondary: 'Sim, cancelar pedido', onSecondary: resetOrder
  });
}
$('cancel-payment').onclick = leavePayment;
$('change-payment').onclick = leavePayment;
$('retry-payment').onclick = () => startPayment(paymentMethod);
window.addEventListener('online', loadCatalog);
window.addEventListener('offline', updateConnection);
document.addEventListener('error', (event) => {
  if (event.target.tagName === 'IMG' && !event.target.src.endsWith('/mango-mark.svg')) event.target.src = '/mango-mark.svg';
}, true);

setInterval(() => {
  if (screen !== 'success') return;
  const seconds = Math.max(0, Math.ceil((successDeadline - Date.now()) / 1000));
  $('success-countdown').textContent = `Voltando ao início em ${seconds} s`;
  if (!seconds) resetOrder();
}, 1000);
resetOrder({ focusStart: false });
updateConnection();
// Preload now, so the welcome screen does not lead to an empty catalog.
loadCatalog();
