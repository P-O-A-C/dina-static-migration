/* Dina's Corner static runtime: no database, auth, or external backend. */
(function (global) {
  'use strict';
  const cache = new Map();

  async function readJson(path) {
    const key = String(path || '').replace(/^\/+/, '');
    if (!key || key.split('/').includes('..')) throw new Error('Invalid local data path.');
    if (cache.has(key)) return cache.get(key);
    const request = fetch(key, { method: 'GET', cache: 'no-cache', credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load ' + key + ' (' + response.status + ').');
        const value = await response.json();
        if (!Array.isArray(value)) throw new Error('Invalid data format in ' + key + '.');
        return value;
      });
    cache.set(key, request);
    try { return await request; }
    catch (error) { cache.delete(key); throw error; }
  }

  global.DinaStaticData = Object.freeze({ readJson });

  global.POA_GET_CURRENCY_CODE = function () {
    const raw = String(global.POA_TENANT_CONFIG?.CURRENCY || 'EGP').toUpperCase().trim();
    return /^[A-Z]{3}$/.test(raw) ? raw : 'EGP';
  };
  global.POA_FORMAT_CURRENCY = function (value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '';
    const currency = global.POA_GET_CURRENCY_CODE();
    const locale = String(global.POA_TENANT_CONFIG?.CURRENCY_LOCALE || (currency === 'EGP' ? 'en-EG' : 'en'));
    return currency + ' ' + new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };
})(window);
