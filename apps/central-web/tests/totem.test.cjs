const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

// Exercise browser logic without network or payment/fiscal services.
function kiosk(search = '') {
  class Element {
    constructor(id) { this.id = id; this.hidden = false; this.dataset = {}; this.children = new Map(); this.value = ''; this.classList = { toggle() {}, add() {}, remove() {} }; }
    set innerHTML(value) {
      this.html = value;
      for (const match of value.matchAll(/id="([^"]+)"/g)) {
        if (!elements.has(match[1])) elements.set(match[1], new Element(match[1]));
      }
    }
    get innerHTML() { return this.html || ''; }
    querySelector(selector) { if (!this.children.has(selector)) this.children.set(selector, new Element(selector)); return this.children.get(selector); }
    focus() {}
    scrollIntoView() {}
    querySelectorAll() { return []; }
    reset() { elements.get('order-name').value = ''; }
    getAnimations() { return []; }
    animate() { this.animationCount = (this.animationCount || 0) + 1; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    addEventListener() {}
    setAttribute() {}
    removeAttribute() {}
  }
  const elements = new Map();
  const html = readFileSync(join(__dirname, '../public/totem.html'), 'utf8');
  for (const match of html.matchAll(/id="([^"]+)"/g)) elements.set(match[1], new Element(match[1]));
  const queries = new Element('queries');
  const memory = new Map();
  const timeouts = new Map();
  let timerId = 0;
  const requests = [];
  const listeners = {};
  const timers = [];
  const context = vm.createContext({
    document: {
      getElementById: id => { assert.ok(elements.has(id), `Missing element ${id}`); return elements.get(id); },
      querySelector: selector => queries.querySelector(selector),
      querySelectorAll: selector => selector === '.screen' ? [...elements.values()].filter(element => element.id.startsWith('screen-')) : [],
      addEventListener: (event, handler) => { listeners[event] = handler; }
    },
    window: { location: { search }, addEventListener() {}, matchMedia: () => ({ matches: false }) }, URLSearchParams, navigator: { onLine: false }, crypto: webcrypto,
    localStorage: { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) },
    setTimeout: (callback, delay) => { timeouts.set(++timerId, { callback, delay }); return timerId; }, clearTimeout: (id) => timeouts.delete(id), setInterval: (callback, delay) => { timers.push({ callback, delay }); },
    fetch: async (url, options) => { requests.push({ url, method: options.method }); throw new Error('Offline'); }, AbortController, Intl, Date, console
  });
  vm.runInContext(readFileSync(join(__dirname, '../public/totem.js'), 'utf8'), context);
  function tickPayment() {
    const next = [...timeouts].find(([, timer]) => timer.delay === 1700);
    if (!next) return false;
    timeouts.delete(next[0]);
    next[1].callback();
    return true;
  }
  return { run: source => vm.runInContext(source, context), elements, memory, timers, requests, listeners, tickPayment };
}

const seed = `products = [{ id: 'p1', name: 'Manga', description: 'Fresca', imageUrl: '/images/manga-classica.png', basePrice: 12.9, sizes: [{id: 'small', name: '300 g', priceModifier: 0}, {id: 'large', name: '500 g', priceModifier: 7}], additions: [{id: 'lime', name: 'Limão', price: 1.5, maxQuantity: 2}], fiscal: {} }];`;

test('personalization, quantities and editing keep exact currency totals', async () => {
  const app = kiosk();
  await new Promise(resolve => setImmediate(resolve));
  app.run(seed);
  app.run("openCustomization(products[0]); customization.sizeId = 'large'; customization.additions.lime = 2; customization.quantity = 3; saveCustomizedItem({preventDefault(){}})");
  assert.equal(app.run('total()'), 68.7);
  assert.equal(app.run('count()'), 3);
  app.run('openCustomization(cart[0].product, 0); customization.quantity = 1; saveCustomizedItem({preventDefault(){}})');
  assert.equal(app.run('cart.length'), 1);
  assert.equal(app.run('total()'), 22.9);
  assert.equal(app.elements.get('payment-total').textContent, 'R$ 22,90');
});

function beginOrder(app) {
  app.run(seed);
  app.elements.get('kiosk').onclick();
  app.run('openCustomization(products[0]); saveCustomizedItem({preventDefault(){}})');
  assert.equal(app.run('screen'), 'menu');
  assert.equal(app.elements.get('customize-modal').open, false);
  assert.equal(app.elements.get('cart-badge').animationCount, 1);
  assert.equal(app.elements.get('kiosk-cart-total').textContent, 'R$ 12,90');
  app.elements.get('btn-kiosk-checkout').onclick();
  assert.equal(app.run('screen'), 'checkout');
}

test('approval simulates Pix locally and returns to the start after confirmation', async () => {
  const app = kiosk();
  await new Promise(resolve => setImmediate(resolve));
  beginOrder(app);
  app.elements.get('order-name').value = 'Ana Maria';
  assert.equal(app.elements.get('finalize-order').disabled, true);
  app.run("selectPayment('CREDIT_CARD')");
  assert.equal(app.run('screen'), 'checkout');
  assert.equal(app.elements.get('finalize-order').disabled, false);
  app.run("openCustomization(cart[0].product, 0); customization.quantity = 2; saveCustomizedItem({preventDefault(){}})");
  assert.equal(app.run('count()'), 2);
  app.run("selectPayment('PIX')");
  app.elements.get('finalize-order').onclick();
  assert.match(app.elements.get('payment-status').textContent, /Escaneie/);
  app.tickPayment();
  assert.match(app.elements.get('payment-status').textContent, /Aguardando/);
  app.tickPayment();
  assert.equal(app.run('screen'), 'success');
  assert.equal(app.elements.get('success-name').textContent, 'Ana');
  assert.equal(app.elements.get('success-ticket-number').textContent, '#001');
  assert.equal(app.requests.some(request => request.method === 'POST'), false);
  assert.deepEqual([...app.memory], [['mango-kiosk-demo-ticket', '1']]);
  app.run('successDeadline = Date.now()');
  app.timers[0].callback();
  assert.equal(app.run('screen'), 'attract');
});

test('each forced failure supports retry, cancellation and changing method with the cart preserved', async () => {
  for (const [scenario, message] of [['recusado', /recusado/], ['tempo-esgotado', /Tempo esgotado/]]) {
    const app = kiosk('?pagamento=' + scenario);
    await new Promise(resolve => setImmediate(resolve));
    beginOrder(app);
    app.run("startPayment('CREDIT_CARD')");
    while (app.tickPayment()) {}
    assert.match(app.elements.get('payment-status').textContent, message);
    assert.equal(app.elements.get('payment-recovery').hidden, false);
    app.elements.get('retry-payment').onclick();
    assert.match(app.elements.get('payment-status').textContent, /Aproxime/);
    app.elements.get('cancel-payment').onclick();
    assert.equal(app.tickPayment(), false);
    assert.equal(app.run('screen'), 'checkout');
    assert.equal(app.run('count()'), 1);
    app.run("startPayment('DEBIT_CARD')");
    while (app.tickPayment()) {}
    app.elements.get('change-payment').onclick();
    assert.equal(app.run('screen'), 'checkout');
    assert.equal(app.run('count()'), 1);
  }
});

test('waiting leaves the cart intact in both checkout and menu', async () => {
  const app = kiosk();
  await new Promise(resolve => setImmediate(resolve));
  beginOrder(app);
  for (const screen of ['checkout', 'menu']) {
    app.run(`showScreen('${screen}')`);
    for (let second = 0; second < 90; second++) app.timers[0].callback();
    assert.equal(app.run('screen'), screen);
    assert.equal(app.run('count()'), 1);
    assert.equal(app.elements.get('message-modal').open, undefined);
  }
});

test('API deduplicates concurrent submissions and rejects changed payloads', async () => {
  const routes = new Map();
  const db = { orders: [], shifts: [{ id: 'shift', status: 'OPEN' }], fiscalConfig: {}, nextTicketSequence: 1 };
  let emissions = 0;
  const express = () => ({ use() {}, get() {}, patch() {}, post: (path, handler) => routes.set(path, handler), listen() {} });
  express.json = express.static = () => () => {};
  const fakeRequire = name => {
    if (name === 'express') return express;
    if (name === 'cors') return () => () => {};
    if (name === './database.js') return { db };
    if (name === '@totem-pdv/fiscal-engine') return { FiscalEngineService: class {
      async emitNFCe() { emissions++; await new Promise(resolve => setImmediate(resolve)); return { id: 'nfce', chaveAcesso: 'demo', status: 'AUTHORIZED', numero: 1 }; }
    } };
    return require(name);
  };
  vm.runInNewContext(readFileSync(join(__dirname, '../dist/server.js'), 'utf8'), {
    require: fakeRequire, exports: {}, __dirname: join(__dirname, '../dist'), process: { env: {} },
    console: { log() {}, error() {} }, fetch: async () => ({ ok: true })
  });
  const submit = async body => {
    const response = { code: 200, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
    await routes.get('/api/orders')({ body }, response);
    return response;
  };
  const body = { idempotency_key: '019abcde-1234-7123-8123-123456789abc', origin: 'TOTEM', kioskId: 'totem-01', items: [{ totalPrice: 12.9 }], payments: [{ method: 'PIX', amount: 12.9 }] };
  const results = await Promise.all([submit(body), submit(body)]);
  assert.deepEqual(results.map(result => result.code).sort(), [200, 201]);
  assert.equal(results[0].body.id, results[1].body.id);
  assert.equal(results[0].body.publicTicketNumber, '001');
  assert.equal(db.orders.length, 1);
  assert.equal(emissions, 1);
  assert.equal((await submit({ ...body, items: [{ totalPrice: 99 }] })).code, 409);
  assert.equal((await submit({ ...body, idempotency_key: 'invalid' })).code, 400);
  assert.equal((await submit({ ...body, items: {} })).code, 400);
});
