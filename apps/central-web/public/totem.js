// Mango Brasil - Totem Kiosk Script
let kioskProducts = [];
let kioskCart = [];
let currentCategory = 'cat-1';
let inactivitySeconds = 60;
let inactivityInterval = null;
let activeProductToCustomize = null;
let selectedSize = null;
let selectedAdditions = {};

// ==========================================
// INACTIVITY TIMER (60 SECONDS)
// ==========================================
function resetInactivityTimer() {
  inactivitySeconds = 60;
  const box = document.getElementById('inactivity-box');
  const text = document.getElementById('inactivity-timer');

  if (document.getElementById('screen-attract').classList.contains('hidden')) {
    box.classList.remove('hidden');
    text.innerText = `${inactivitySeconds}s`;
  } else {
    box.classList.add('hidden');
  }

  if (inactivityInterval) clearInterval(inactivityInterval);

  inactivityInterval = setInterval(() => {
    if (document.getElementById('screen-attract').classList.contains('hidden')) {
      inactivitySeconds -= 1;
      text.innerText = `${inactivitySeconds}s`;

      if (inactivitySeconds <= 0) {
        clearInterval(inactivityInterval);
        resetToAttract();
      }
    }
  }, 1000);
}

// Reset timer on any touch/click
window.addEventListener('click', () => {
  if (inactivitySeconds < 55) {
    resetInactivityTimer();
  }
});

// ==========================================
// NAVIGATION BETWEEN SCREENS
// ==========================================
function startOrder() {
  document.getElementById('screen-attract').classList.add('hidden');
  document.getElementById('screen-menu').classList.remove('hidden');
  document.getElementById('screen-checkout').classList.add('hidden');
  document.getElementById('screen-success').classList.add('hidden');
  resetInactivityTimer();
  loadKioskProducts();
}

function backToMenu() {
  document.getElementById('screen-checkout').classList.add('hidden');
  document.getElementById('screen-menu').classList.remove('hidden');
  resetInactivityTimer();
}

function resetToAttract() {
  kioskCart = [];
  updateKioskCartUI();
  document.getElementById('screen-attract').classList.remove('hidden');
  document.getElementById('screen-menu').classList.add('hidden');
  document.getElementById('screen-checkout').classList.add('hidden');
  document.getElementById('screen-success').classList.add('hidden');
  document.getElementById('inactivity-box').classList.add('hidden');
  if (inactivityInterval) clearInterval(inactivityInterval);
}

// ==========================================
// PRODUCTS & CATALOG
// ==========================================
async function loadKioskProducts() {
  try {
    const res = await fetch('/api/products?kioskOnly=true');
    kioskProducts = await res.json();
    renderKioskProducts();
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
  }
}

function filterKioskCategory(catId) {
  currentCategory = catId;
  document.querySelectorAll('.kiosk-cat-pill').forEach(btn => {
    if (btn.dataset.cat === catId) {
      btn.className = "kiosk-cat-pill px-3 py-2 rounded-xl bg-mango-500 text-black shadow-sm shrink-0 font-bold";
    } else {
      btn.className = "kiosk-cat-pill px-3 py-2 rounded-xl bg-slate-900 text-slate-300 shrink-0 border border-slate-800 font-bold";
    }
  });
  renderKioskProducts();
}

function renderKioskProducts() {
  const grid = document.getElementById('kiosk-products-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const filtered = kioskProducts.filter(p => p.categoryId === currentCategory);

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = "p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-mango-500/60 transition-all cursor-pointer active:scale-95 shadow-md";
    card.onclick = () => openCustomizeModal(p);

    card.innerHTML = `
      <div>
        <div class="h-28 rounded-xl overflow-hidden mb-2 bg-slate-900 relative">
          <img src="${p.imageUrl}" alt="${p.name}" class="w-full h-full object-cover" />
          <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-mango-400 font-black text-xs font-mono">
            R$ ${p.basePrice.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <h4 class="font-extrabold text-white text-xs leading-tight mb-1">${p.name}</h4>
        <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">${p.description}</p>
      </div>

      <button class="mt-2.5 w-full py-2 rounded-xl bg-mango-500 text-black font-extrabold text-xs flex items-center justify-center gap-1 shadow-sm">
        <span>+</span> Personalizar
      </button>
    `;

    grid.appendChild(card);
  });
}

// ==========================================
// CUSTOMIZE PRODUCT MODAL
// ==========================================
function openCustomizeModal(product) {
  activeProductToCustomize = product;
  selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
  selectedAdditions = {};

  document.getElementById('cust-prod-name').innerText = product.name;

  // Render Sizes
  const sizesBox = document.getElementById('cust-sizes-box');
  const sizesList = document.getElementById('cust-sizes-list');
  if (product.sizes && product.sizes.length > 0) {
    sizesBox.classList.remove('hidden');
    sizesList.innerHTML = '';

    product.sizes.forEach((s, idx) => {
      const isSelected = idx === 0;
      const div = document.createElement('div');
      div.className = `p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
        isSelected ? 'bg-mango-500/10 border-mango-500 text-mango-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
      }`;
      div.onclick = () => {
        selectedSize = s;
        updateModalSizeSelection();
      };

      div.innerHTML = `
        <span>${s.name}</span>
        <span class="font-mono text-[11px]">${s.priceModifier > 0 ? `+R$ ${s.priceModifier.toFixed(2)}` : 'Incluso'}</span>
      `;
      sizesList.appendChild(div);
    });
  } else {
    sizesBox.classList.add('hidden');
  }

  // Render Additions
  const addBox = document.getElementById('cust-additions-box');
  const addList = document.getElementById('cust-additions-list');
  if (product.additions && product.additions.length > 0) {
    addBox.classList.remove('hidden');
    addList.innerHTML = '';

    product.additions.forEach(add => {
      selectedAdditions[add.id] = 0;

      const div = document.createElement('div');
      div.className = "p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs";

      div.innerHTML = `
        <div>
          <div class="font-bold text-white text-xs">${add.name}</div>
          <div class="text-[10px] text-mango-400 font-mono">+R$ ${add.price.toFixed(2)} un.</div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="changeAdditionQty('${add.id}', -1, ${add.price})" class="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold">-</button>
          <span id="add-qty-${add.id}" class="w-5 text-center font-mono font-bold text-xs">0</span>
          <button onclick="changeAdditionQty('${add.id}', 1, ${add.price}, ${add.maxQuantity})" class="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold">+</button>
        </div>
      `;

      addList.appendChild(div);
    });
  } else {
    addBox.classList.add('hidden');
  }

  updateModalTotal();
  document.getElementById('customize-modal').classList.remove('hidden');
}

function updateModalSizeSelection() {
  const sizesList = document.getElementById('cust-sizes-list');
  sizesList.childNodes.forEach((node, i) => {
    const s = activeProductToCustomize.sizes[i];
    const isSelected = selectedSize && selectedSize.id === s.id;
    node.className = `p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
      isSelected ? 'bg-mango-500/10 border-mango-500 text-mango-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
    }`;
  });
  updateModalTotal();
}

function changeAdditionQty(addId, delta, price, maxQty = 3) {
  const current = selectedAdditions[addId] || 0;
  const updated = Math.max(0, Math.min(maxQty, current + delta));
  selectedAdditions[addId] = updated;

  const countEl = document.getElementById(`add-qty-${addId}`);
  if (countEl) countEl.innerText = updated;

  updateModalTotal();
}

function updateModalTotal() {
  if (!activeProductToCustomize) return;
  let total = activeProductToCustomize.basePrice;

  if (selectedSize) {
    total += selectedSize.priceModifier;
  }

  if (activeProductToCustomize.additions) {
    activeProductToCustomize.additions.forEach(add => {
      const q = selectedAdditions[add.id] || 0;
      total += q * add.price;
    });
  }

  document.getElementById('cust-total-calc').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function confirmCustomizedProduct() {
  if (!activeProductToCustomize) return;

  let unitPrice = activeProductToCustomize.basePrice;
  if (selectedSize) unitPrice += selectedSize.priceModifier;

  const additionsList = [];
  if (activeProductToCustomize.additions) {
    activeProductToCustomize.additions.forEach(add => {
      const q = selectedAdditions[add.id] || 0;
      if (q > 0) {
        additionsList.push({
          additionId: add.id,
          name: add.name,
          price: add.price,
          quantity: q
        });
        unitPrice += q * add.price;
      }
    });
  }

  kioskCart.push({
    product: activeProductToCustomize,
    size: selectedSize,
    additions: additionsList,
    unitPrice,
    quantity: 1,
    totalPrice: unitPrice
  });

  closeCustomizeModal();
  updateKioskCartUI();
}

function closeCustomizeModal() {
  document.getElementById('customize-modal').classList.add('hidden');
}

// ==========================================
// CART & CHECKOUT
// ==========================================
function updateKioskCartUI() {
  const countEl = document.getElementById('kiosk-cart-count');
  const totalEl = document.getElementById('kiosk-cart-total');
  const btnCheckout = document.getElementById('btn-kiosk-checkout');

  const totalCount = kioskCart.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = kioskCart.reduce((acc, i) => acc + i.totalPrice, 0);

  countEl.innerText = `${totalCount} ${totalCount === 1 ? 'ITEM' : 'ITENS'} NO PEDIDO`;
  totalEl.innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

  btnCheckout.disabled = totalCount === 0;
}

function goToCheckout() {
  if (kioskCart.length === 0) return;

  const totalPrice = kioskCart.reduce((acc, i) => acc + i.totalPrice, 0);
  document.getElementById('checkout-total-val').innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

  document.getElementById('screen-menu').classList.add('hidden');
  document.getElementById('screen-checkout').classList.remove('hidden');
  resetInactivityTimer();
}

// ==========================================
// TEF PINPAD & PAYMENT SIMULATION
// ==========================================
function startTefSimulation(method) {
  const modal = document.getElementById('pinpad-modal');
  const display = document.getElementById('pinpad-display');
  const sub = document.getElementById('pinpad-sub');
  modal.classList.remove('hidden');

  const totalPrice = kioskCart.reduce((acc, i) => acc + i.totalPrice, 0);
  sub.innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

  // Step 1: Insert card
  display.innerText = 'INSIRA OU APROXIME';

  setTimeout(() => {
    // Step 2: Reading chip & ask PIN
    display.innerText = 'DIGITE A SENHA [****]';

    setTimeout(() => {
      // Step 3: Authorizing with Adquirente
      display.innerText = 'PROCESSANDO ADQUIRENTE...';

      setTimeout(async () => {
        // Step 4: Approved!
        display.innerText = 'TRANSAÇÃO APROVADA!';
        sub.innerText = 'NSU 984712 · AUT 612849';

        setTimeout(async () => {
          modal.classList.add('hidden');
          await submitKioskOrder(method);
        }, 1200);
      }, 1500);
    }, 1200);
  }, 1000);
}

async function startPixSimulation() {
  const modal = document.getElementById('pinpad-modal');
  const display = document.getElementById('pinpad-display');
  const sub = document.getElementById('pinpad-sub');
  modal.classList.remove('hidden');

  display.innerText = 'GERANDO PIX DINÂMICO...';
  sub.innerText = 'Aguarde o QR Code no Totem';

  setTimeout(async () => {
    display.innerText = 'PAGAMENTO PIX CONFIRMADO!';
    sub.innerText = 'Recebido via Banco Central';

    setTimeout(async () => {
      modal.classList.add('hidden');
      await submitKioskOrder('PIX');
    }, 1200);
  }, 2000);
}

// ==========================================
// SUBMIT ORDER TO CENTRAL API
// ==========================================
async function submitKioskOrder(paymentMethod) {
  const totalPrice = kioskCart.reduce((acc, i) => acc + i.totalPrice, 0);

  const payload = {
    origin: 'TOTEM',
    kioskId: 'totem-01',
    items: kioskCart.map((i, idx) => ({
      id: 'item-' + (idx + 1),
      productId: i.product.id,
      productName: i.product.name + (i.size ? ` (${i.size.name})` : ''),
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      totalPrice: i.totalPrice,
      additions: i.additions,
      fiscal: i.product.fiscal
    })),
    payments: [
      {
        id: 'pay-' + Date.now(),
        method: paymentMethod,
        amount: totalPrice,
        status: 'APPROVED',
        nsu: '984712',
        authorizationCode: '612849',
        paidAt: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Falha ao processar pedido');
    const order = await res.json();

    // Show Success Screen
    showSuccessScreen(order);
  } catch (err) {
    alert('Erro ao enviar pedido para o Central: ' + err.message);
  }
}

function showSuccessScreen(order) {
  document.getElementById('screen-checkout').classList.add('hidden');
  document.getElementById('screen-success').classList.remove('hidden');

  document.getElementById('success-ticket-number').innerText = `#${order.publicTicketNumber}`;
  document.getElementById('success-receipt-total').innerText = `R$ ${order.total.toFixed(2).replace('.', ',')}`;
  document.getElementById('success-receipt-nfce').innerText = `Chave: ${order.nfceKey?.slice(0, 16) || 'NFC-e'}...`;

  const itemsContainer = document.getElementById('success-receipt-items');
  itemsContainer.innerHTML = '';
  order.items.forEach(it => {
    itemsContainer.innerHTML += `
      <div class="flex justify-between">
        <span>${it.quantity}x ${it.productName}</span>
        <span>R$ ${it.totalPrice.toFixed(2)}</span>
      </div>
    `;
  });

  // Auto reset after 15 seconds
  setTimeout(() => {
    if (!document.getElementById('screen-success').classList.contains('hidden')) {
      resetToAttract();
    }
  }, 15000);
}

// Start in attract screen
resetToAttract();
