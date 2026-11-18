const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

// Exercise browser logic without network or payment/fiscal services.
function kiosk(initialStorage = {}) {
  class Element {
    constructor(id) { this.id = id; this.hidden = false; this.dataset = {}; this.children = new Map(); this.classList = { toggle() {} }; }
    set innerHTML(value) {
      this.html = value;
      for (const match of value.matchAll(/id="([^"]+)"/g)) {
        if (!elements.has(match[1])) elements.set(match[1], new Element(match[1]));
      }
    }
    get innerHTML() { return this.html || ''; }
    querySelector(selector) { if (!this.children.has(selector)) this.children.set(selector, new Element(selector)); return this.children.get(selector); }
    focus() {}
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
  queries.querySelector('input[name="payment"]:checked').value = 'PIX';
  const memory = new Map(Object.entries(initialStorage));
  const listeners = {};
  const timers = [];
  const context = vm.createContext({
    document: {
      getElementById: id => { assert.ok(elements.has(id), `Missing element ${id}`); return elements.get(id); },
      querySelector: selector => queries.querySelector(selector),
      querySelectorAll: selector => selector === '.screen' ? [...elements.values()].filter(element => element.id.startsWith('screen-')) : [],
      addEventListener: (event, handler) => { listeners[event] = handler; }
    },
    window: { addEventListener() {} }, navigator: { onLine: false }, crypto: webcrypto,
    localStorage: { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) },
    setTimeout: () => 1, clearTimeout() {}, setInterval: (callback, delay) => { timers.push({ callback, delay }); },
    fetch: async () => { throw new Error('Offline'); }, AbortController, Intl, Date, console
  });
  vm.runInContext(readFileSync(join(__dirname, '../public/totem.js'), 'utf8'), context);
  return { run: source => vm.runInContext(source, context), elements, memory, context, timers };
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
  assert.equal(app.elements.get('cart-total').textContent, 'R$ 22,90');
});

test('offline approval preserves payload and UUID v7, then retries once with same key', async () => {
  const app = kiosk();
  await new Promise(resolve => setImmediate(resolve));
  app.run(seed);
  app.run('openCustomization(products[0]); saveCustomizedItem({preventDefault(){}}); showScreen("checkout")');
  await app.run('approvePayment()');
  assert.equal(app.run('screen'), 'pending');
  assert.equal(app.run('queue.length'), 1);
  const saved = JSON.parse(app.memory.get('mango-kiosk-outbox-v2'));
  const key = saved[0].payload.idempotency_key;
  assert.match(key, /^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(saved[0].payload.payments[0].method, 'PIX');
  let sent;
  app.context.navigator.onLine = true;
  app.context.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ...sent, publicTicketNumber: '123', total: 12.9 }) };
  };
  await app.run('syncQueue()');
  assert.equal(sent.idempotency_key, key);
  assert.deepEqual(sent.payments, saved[0].payload.payments);
  assert.equal(app.run('screen'), 'success');
  assert.equal(app.elements.get('success-ticket-number').textContent, '#123');
  assert.equal(app.memory.get('mango-kiosk-outbox-v2'), '[]');
});

test('a validation failure stops automatic retries and asks for assistance', async () => {
  const app = kiosk();
  await new Promise(resolve => setImmediate(resolve));
  app.run(seed);
  app.run('openCustomization(products[0]); saveCustomizedItem({preventDefault(){}})');
  app.context.fetch = async () => ({ ok: false, status: 409 });
  await app.run('approvePayment()');
  assert.equal(app.run('queue[0].needsReview'), true);
  assert.equal(app.elements.get('retry-order').hidden, true);
  assert.equal(app.elements.get('pending-title').textContent, 'Seu pedido precisa de atenção');
});

test('inactivity warns before discarding and pauses while submitting', async () => {
  const app = kiosk();
  await new Promise(resolve => setImmediate(resolve));
  app.run('showScreen("menu"); lastActivity = Date.now() - 101000');
  const tick = app.timers.find(timer => timer.delay === 1000).callback;
  tick();
  assert.equal(app.elements.get('message-modal').open, true);
  assert.match(app.elements.get('message-description').textContent, /19s/);
  app.run('submitting = true; lastActivity = Date.now() - 130000');
  tick();
  assert.equal(app.run('screen'), 'menu');
  app.run('submitting = false');
  tick();
  assert.equal(app.run('screen'), 'attract');
});

test('reload recovers a queued order without inventing a pickup ticket', async () => {
  const app = kiosk({ 'mango-kiosk-outbox-v2': JSON.stringify([{ payload: { idempotency_key: 'pending-key' } }]) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.run('screen'), 'pending');
  assert.equal(app.elements.get('success-ticket-number').textContent, undefined);
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
