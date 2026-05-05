const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function loadTsModule(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require,
    process,
    console,
    crypto: globalThis.crypto,
    Date,
    Math,
  };

  vm.runInNewContext(output, sandbox, { filename: filePath });
  return module.exports;
}

const tokenStorage = loadTsModule('lib/security/token-storage.ts');
assert.equal(
  tokenStorage.getTenantTokenStorageKey('access', 'store-one'),
  'gocart_access:store-one'
);
assert.equal(
  tokenStorage.getTenantTokenStorageKey('refresh', 'Store-Two'),
  'gocart_refresh:store-two'
);
assert.equal(tokenStorage.getTenantTokenStorageKey('access', '../bad'), null);
assert.equal(tokenStorage.getTenantTokenStorageKey('refresh', ''), null);

const idempotency = loadTsModule('lib/security/idempotency.ts');
const firstKey = idempotency.createIdempotencyKey('checkout');
const secondKey = idempotency.createIdempotencyKey('checkout');
assert.match(firstKey, /^gocart-checkout-[a-z0-9-]+$/i);
assert.notEqual(firstKey, secondKey);
assert.match(
  idempotency.createIdempotencyKey('BAD SCOPE'),
  /^gocart-request-[a-z0-9-]+$/i
);

const clientSource = read('lib/api/client.ts');
assert.match(clientSource, /getTenantTokenStorageKey\('access'/);
assert.match(clientSource, /getTenantTokenStorageKey\('refresh'/);
assert.doesNotMatch(clientSource, /localStorage\.getItem\(ACCESS_KEY\)/);
assert.doesNotMatch(clientSource, /localStorage\.setItem\(ACCESS_KEY/);
assert.doesNotMatch(clientSource, /api\.defaults\.headers\.common\.Authorization\s*=/);
assert.match(clientSource, /delete config\.headers\.Authorization/);

const serviceSource = read('lib/api/services.ts');
assert.match(serviceSource, /IDEMPOTENCY_KEY_HEADER/);
assert.match(serviceSource, /idempotencyKey/);

const checkoutSource = read('components/checkout-panel.tsx');
assert.match(checkoutSource, /createIdempotencyKey\('checkout'\)/);
assert.match(checkoutSource, /createIdempotencyKey\('payment-initiate'\)/);
assert.match(checkoutSource, /createIdempotencyKey\('payment-card-initiate'\)/);
assert.match(checkoutSource, /createIdempotencyKey\('payment-finalize'\)/);
assert.doesNotMatch(checkoutSource, /AIRTEL|Airtel/);
assert.match(checkoutSource, /Bank \/ Debit Card/);
assert.match(checkoutSource, /card_last4/);
assert.doesNotMatch(checkoutSource, /cvv:\s*cardForm\.cvv/);
assert.doesNotMatch(checkoutSource, /card_number:\s*cardForm\.cardNumber/);

console.log('Security regression tests passed.');
