(function () {
  "use strict";

  // One guard run per page, even if a stale HTML file includes the script twice.
  if (window.__GDC_AUTH_DONE__ || window.__GDC_AUTH_PROMISE__) return;

  const GATE_ID = "authGate";
  const LOGIN_URL = "../index.html";
  const EXPECTED_EMAIL = "granddryclean@poac.com";
  const TIMEOUT_MS = 12000;
  const gate = document.getElementById(GATE_ID);

  function withTimeout(promise, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("انتهت مهلة " + label + ".")), TIMEOUT_MS);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
  }

  function showGate(message, actions) {
    if (!gate) return;
    gate.hidden = false;
    gate.replaceChildren();
    const card = document.createElement("div");
    card.className = "auth-gate-card";
    const mark = document.createElement("span");
    mark.className = "auth-gate-mark";
    mark.textContent = "G";
    const brand = document.createElement("span");
    brand.className = "auth-gate-brand";
    brand.textContent = "GRAND DRY CLEAN";
    const text = document.createElement("p");
    text.textContent = message;
    text.setAttribute("aria-live", "polite");
    card.append(mark, brand, text);

    if (actions) {
      const row = document.createElement("div");
      row.className = "auth-gate-actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "إعادة المحاولة";
      retry.addEventListener("click", () => location.reload());
      const login = document.createElement("a");
      login.href = LOGIN_URL;
      login.textContent = "العودة إلى تسجيل POAC";
      row.append(retry, login);
      card.append(row);
    } else {
      const loader = document.createElement("span");
      loader.className = "auth-loader";
      loader.setAttribute("aria-hidden", "true");
      card.append(loader);
    }
    gate.append(card);
  }

  function revealDashboard() {
    // Remove the body lock and remove the overlay node itself. This avoids
    // relying on the [hidden] CSS selector to expose the dashboard.
    document.body.classList.remove("auth-pending");
    document.body.classList.add("auth-ready");
    document.documentElement.dataset.grandDryCleanAuthorized = "true";
    if (gate && gate.isConnected) gate.remove();
    window.__GDC_AUTH_DONE__ = true;
    window.__GDC_AUTH_STATE__ = "authorized";
    window.dispatchEvent(new CustomEvent("granddryclean:authorized"));
    console.info("GRAND DRY CLEAN: account verified; dashboard unlocked.");
  }

  async function run() {
    showGate("جارٍ التحقق من حساب GRAND DRY CLEAN. قد يستغرق الاتصال بقاعدة البيانات بضع ثوانٍ…", false);

    const cfg = window.POA_CONFIG || {};
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("مكتبة Supabase لم يتم تحميلها. أعد تحميل الصفحة.");
    }
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("إعدادات Supabase غير مكتملة في assets/config.js.");
    }

    // The dashboard is a standalone page: create exactly one Supabase client
    // and use its restored session. No second getUser() request is needed.
    const client = window.__GDC_SUPABASE_CLIENT__ || window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
    window.__GDC_SUPABASE_CLIENT__ = client;

    const sessionResult = await withTimeout(client.auth.getSession(), "استعادة جلسة الدخول");
    if (sessionResult.error) throw sessionResult.error;
    const user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if (!user || !user.id) {
      location.replace(LOGIN_URL);
      return;
    }

    // This is the single profile request for this page.
    const profileResult = await withTimeout(client.rpc("get_my_profile"), "تحميل بيانات الحساب");
    if (profileResult.error) throw profileResult.error;
    const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
    if (!profile) throw new Error("لم تُرجع قاعدة البيانات ملف حساب للمستخدم الحالي.");

    const authEmail = String(user.email || "").trim().toLowerCase();
    const profileEmail = String(profile.email || "").trim().toLowerCase();
    const email = authEmail || profileEmail;
    const role = String(profile.role || "").trim().toLowerCase();
    const isActive = profile.is_active === true || String(profile.is_active).trim().toLowerCase() === "true";

    if (profile.id && String(profile.id) !== String(user.id)) {
      throw new Error("ملف الحساب لا يطابق جلسة المستخدم الحالية.");
    }

    // POAC company administrator: grant access by the exact trusted auth UID,
    // the admin role, and an active profile. Do not rely on email alone.
    const POAC_ADMIN_UID = "807cbd58-438d-40bc-9a04-62758e2f4562";
    const isPoacAdmin = user.id === POAC_ADMIN_UID && role === "admin" && isActive;

    // GRAND DRY CLEAN's own manager remains restricted to the laundry account.
    const isLaundryAdmin =
      email === EXPECTED_EMAIL &&
      (!profileEmail || profileEmail === EXPECTED_EMAIL) &&
      (role === "gm" || role === "dryclean") &&
      isActive;

    if (!isPoacAdmin && !isLaundryAdmin) {
      if (!isActive) {
        throw new Error("الحساب غير نشط في جدول profiles.");
      }
      if (email !== EXPECTED_EMAIL && user.id !== POAC_ADMIN_UID) {
        throw new Error("الحساب المسجل ليس حساب GRAND DRY CLEAN أو مدير POAC المصرح به.");
      }
      if (user.id === POAC_ADMIN_UID && role !== "admin") {
        throw new Error("حساب مدير POAC لا يحمل دور admin في جدول profiles.");
      }
      throw new Error("دور الحساب غير مصرح به لإدارة المغسلة: " + (role || "غير محدد") + ".");
    }

    revealDashboard();

    const logout = document.getElementById("logoutBtn");
    if (logout && !logout.dataset.gdcLogoutBound) {
      logout.dataset.gdcLogoutBound = "true";
      logout.addEventListener("click", async function (event) {
        event.preventDefault();
        logout.disabled = true;
        logout.setAttribute("aria-disabled", "true");
        try {
          await withTimeout(client.auth.signOut({ scope: "local" }), "تسجيل الخروج");
        } catch (error) {
          console.warn("GRAND DRY CLEAN local sign-out:", error);
        }
        location.replace(LOGIN_URL);
      });
    }
  }

  window.__GDC_AUTH_STATE__ = "checking";
  window.__GDC_AUTH_PROMISE__ = run()
    .catch(error => {
      window.__GDC_AUTH_STATE__ = "error";
      console.error("GRAND DRY CLEAN authorization failed:", error);
      showGate("تعذر فتح لوحة المغسلة: " + (error && error.message ? error.message : "خطأ غير معروف") + " يمكنك إعادة المحاولة أو العودة إلى تسجيل POAC.", true);
    })
    .finally(() => {
      // Keep the promise reference as a duplicate-run guard; navigation/reload
      // starts a fresh page and a fresh guard.
      window.__GDC_AUTH_RUNNING__ = false;
    });
  window.__GDC_AUTH_RUNNING__ = true;
})();
