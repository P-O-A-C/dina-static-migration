/* Remove only legacy account/auth artifacts. Do not clear locally saved order history. */
(function(){
  try {
    localStorage.removeItem('gdc_customer_accounts_v1');
    localStorage.removeItem('gdc_customer_session_v1');
    for (var i=localStorage.length-1;i>=0;i--) {
      var key=localStorage.key(i)||'';
      if (/^sb-.+-auth-token$/.test(key) || key === 'supabase.auth.token') localStorage.removeItem(key);
    }
    sessionStorage.removeItem('gdc_customer_session_v1');
  } catch (error) { /* Storage may be unavailable in private browsing. */ }
})();
