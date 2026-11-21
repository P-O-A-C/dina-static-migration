(async function () {
  const state = document.getElementById("accessState");
  const shell = document.getElementById("adminShell");
  const cfg = window.POA_CONFIG || {};
  const configured = /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(String(cfg.SUPABASE_URL || "https://nbwqoknkpkqgorxtyjnm.supabase.co")) &&
    !!String(cfg.SUPABASE_PUBLISHABLE_KEY || "") &&
    !/YOUR[_-]|PLACEHOLDER|REPLACE_ME|POA_CONFIG_NOT_SET/i.test(String(cfg.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ncPKXMFDGB6HI1lHs1kYmg_dB3hgaer"));
  const goLogin = () => location.replace("../index.html");

  if (!configured || !window.supabase?.createClient) {
    state.textContent = "تعذر الاتصال بإعدادات Supabase. ارجع إلى صفحة POAC الرئيسية.";
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData?.session) { goLogin(); return; }

    // The same profile RPC used by the existing Dina's Corner app is the authority.
    const { data: profileData, error: profileError } = await client.rpc("get_my_profile");
    if (profileError) throw profileError;
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;

    if (!profile || profile.role !== "admin" || profile.is_active === false) {
      await client.auth.signOut();
      goLogin();
      return;
    }

    state.hidden = true;
    shell.hidden = false;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await client.auth.signOut();
      goLogin();
    });
  } catch (error) {
    console.error("POAC admin access check failed:", error);
    state.textContent = "تعذر التحقق من صلاحيات الإدارة. لم يتم فتح صفحة المشروعات.";
  }
})();
