/* Dina's Corner branch maps are managed only from GM > Branch Locations.
   Customer pages open the exact Google Maps link saved in locations.maps_url.
   No name-based guessing or generic text-search fallback is allowed. */
(function (global) {
  'use strict';

  function isExactMapsUrl(value) {
    const supplied = String(value || '').trim();
    if (!supplied) return false;
    try {
      const parsed = new URL(supplied);
      if (parsed.protocol !== 'https:') return false;
      const host = parsed.hostname.toLowerCase();
      if (host === 'maps.app.goo.gl') return parsed.pathname.length > 1;
      if (host === 'goo.gl') return parsed.pathname.toLowerCase().startsWith('/maps/');
      if (!['google.com', 'www.google.com', 'maps.google.com'].includes(host)) return false;
      const path = parsed.pathname.toLowerCase();
      if (!path.startsWith('/maps')) return false;
      if (/^\/maps\/search(?:\/|$)/i.test(path)) {
        return parsed.searchParams.has('query_place_id');
      }
      return path.includes('/maps/place') || parsed.searchParams.has('cid') ||
        parsed.searchParams.has('query_place_id') || parsed.searchParams.has('destination_place_id');
    } catch (_) {
      return false;
    }
  }

  function resolve(location) {
    const supplied = String(location && location.maps_url || '').trim();
    return isExactMapsUrl(supplied) ? supplied : '';
  }

  global.DinaBranchMaps = Object.freeze({ isExactMapsUrl, resolve });
})(window);
