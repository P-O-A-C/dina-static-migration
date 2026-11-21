(() => {
  "use strict";

  let slides = Array.from(document.querySelectorAll(".promo-slide"));
  let dots = Array.from(document.querySelectorAll(".slider-dot"));
  const slider = document.querySelector(".promo-slider");

  // These are the two confirmed public branch locations supplied for GRAND DRY CLEAN.
  // They are also synchronized to gdc_branches by the accompanying SQL script.
  const REQUESTED_BRANCHES = [
    {
      name: "فرع كارفور – جراند سيتي",
      address: "كارفور، زهراء المعادي، عمارة C10، جراند سيتي – معمار المرشدي، شارع السعادة، القاهرة",
      map_url: "https://maps.app.goo.gl/o4SEa5YtgdVmok287"
    },
    {
      name: "فرع أمام شبانة – شارع الخمسين",
      address: "زهراء المعادي، عمارة 1، بلوك 42، الشطر الثامن، شارع الخمسين، أمام شبانة، القاهرة",
      map_url: "https://maps.app.goo.gl/3rMbgmgMvmLA5yym7"
    }
  ];

  let activeSlide = 0;
  let rotationTimer = null;
  const rotationDelay = 2000;

  function showSlide(index) {
    if (!slides.length) return;
    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeSlide;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeSlide;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", String(active));
    });
  }

  function stopRotation() {
    if (rotationTimer !== null) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
  }

  function startRotation() {
    stopRotation();
    if (slides.length < 2 || document.hidden) return;
    rotationTimer = window.setInterval(() => showSlide(activeSlide + 1), rotationDelay);
  }

  function goToSlide(index) {
    showSlide(index);
    startRotation();
  }

  function bindCarouselControls() {
    dots.forEach((dot, index) => { if (!dot.dataset.carouselBound) { dot.addEventListener("click", () => goToSlide(index)); dot.dataset.carouselBound = "true"; } });
    if (!slider?.dataset.carouselEventsBound) {
      document.addEventListener("visibilitychange", () => document.hidden ? stopRotation() : startRotation());
      if (slider) slider.dataset.carouselEventsBound = "true";
    }
  }

  function getPublicSupabaseClient() {
    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("إعدادات الاتصال بقاعدة البيانات غير متاحة.");
    }
    if (!window.__GDC_PUBLIC_CLIENT__) {
      window.__GDC_PUBLIC_CLIENT__ = window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
    }
    return window.__GDC_PUBLIC_CLIENT__;
  }

  function safeWebUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function renderPublicBranches(rows) {
    const container = document.getElementById("publicBranches");
    if (!container) return;
    container.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "branches-empty";
      empty.textContent = "سيتم إضافة بيانات الفروع قريبًا.";
      container.append(empty);
      return;
    }

    rows.forEach((branch) => {
      const nameText = String(branch.name || "فرع GRAND DRY CLEAN").trim();
      const mapUrl = safeWebUrl(branch.map_url) || (
        branch.address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(branch.address))}`
          : ""
      );

      // Compact branch button: show the branch name only; open its map on click.
      const card = mapUrl ? document.createElement("a") : document.createElement("button");
      card.className = "branch-public-card";
      if (mapUrl) {
        card.href = mapUrl;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.setAttribute("aria-label", `عرض موقع ${nameText} على الخريطة`);
      } else {
        card.type = "button";
        card.disabled = true;
        card.setAttribute("aria-label", `${nameText} - الموقع غير متاح`);
      }

      const name = document.createElement("strong");
      name.textContent = nameText;
      card.append(name);
      // Public branch cards intentionally show the branch name only.
      // The full location remains available by opening the map link.
      container.append(card);
    });
  }

  async function loadPublicBranches() {
    const container = document.getElementById("publicBranches");
    if (!container) return;
    try {
      const client = getPublicSupabaseClient();
      const { data, error } = await client
        .from("gdc_branches")
        .select("id,name,phone,address,map_url,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const savedRows = Array.isArray(data) ? data : [];
      // Map the first two saved branch records to the latest confirmed locations.
      // This makes the updated locations visible immediately after GitHub deployment,
      // while the SQL script below also saves the same details in Supabase.
      const confirmedRows = REQUESTED_BRANCHES.map((branch, index) => ({
        ...(savedRows[index] || {}),
        ...branch,
        phone: savedRows[index]?.phone || ""
      }));
      const extraRows = savedRows.slice(REQUESTED_BRANCHES.length);
      renderPublicBranches([...confirmedRows, ...extraRows]);
    } catch (error) {
      console.warn("GRAND DRY CLEAN public branches query failed; showing confirmed map links:", error);
      // Keep the two user-confirmed branch cards visible even if the database
      // migration has not been run or the public branch query is temporarily unavailable.
      renderPublicBranches(REQUESTED_BRANCHES);
    }
  }

  async function loadManagedSlides() {
    if (!slider) return;
    try {
      const client = getPublicSupabaseClient();
      const { data, error } = await client.from("gdc_home_slides").select("id,image_url,alt_text,sort_order,is_active").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      if (!Array.isArray(data) || !data.length) return;
      const slidesMarkup = data.map((row, index) => {
        const article = document.createElement("article");
        article.className = "promo-slide" + (index === 0 ? " is-active" : "");
        article.setAttribute("aria-hidden", String(index !== 0));
        const img = document.createElement("img");
        img.src = row.image_url; img.alt = row.alt_text || "صورة من GRAND DRY CLEAN"; img.loading = index === 0 ? "eager" : "lazy";
        if (index === 0) img.fetchPriority = "high";
        article.append(img);
        return article;
      });
      const container = slider.querySelector(".slides");
      container.replaceChildren(...slidesMarkup);
      const dotsContainer = slider.querySelector("#sliderDots");
      if (dotsContainer) {
        dotsContainer.replaceChildren(...data.map((_, index) => {
          const dot = document.createElement("button"); dot.type = "button"; dot.className = "slider-dot" + (index === 0 ? " is-active" : "");
          dot.setAttribute("aria-label", `الصورة ${index + 1}`); dot.setAttribute("aria-current", String(index === 0)); return dot;
        }));
      }
      slides = Array.from(slider.querySelectorAll(".promo-slide"));
      dots = Array.from(slider.querySelectorAll(".slider-dot"));
      activeSlide = 0; bindCarouselControls(); showSlide(0); startRotation();
    } catch (error) {
      console.warn("GDC managed homepage slides unavailable; using built-in slides.", error);
    }
  }

  bindCarouselControls();


  showSlide(0);
  startRotation();
  loadManagedSlides();
  loadPublicBranches();


  // Same interaction pattern as Dina's Corner: copy the wallet number and
  // open Vodafone's official money-transfer page using the anchor destination.
  const vodafoneCashLink = document.querySelector(".vodafone-tile[data-wallet-number]");
  if (vodafoneCashLink && !vodafoneCashLink.dataset.copyOpenBound) {
    vodafoneCashLink.dataset.copyOpenBound = "true";
    vodafoneCashLink.addEventListener("click", () => {
      const walletNumber = vodafoneCashLink.dataset.walletNumber || "01037626070";
      const numberLabel = vodafoneCashLink.querySelector(".payment-copy small");
      const originalLabel = numberLabel?.textContent || walletNumber;

      const legacyCopy = () => {
        const helper = document.createElement("textarea");
        helper.value = walletNumber;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.left = "-9999px";
        helper.style.top = "0";
        document.body.append(helper);
        helper.select();
        let copied = false;
        try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
        helper.remove();
        return copied;
      };

      const showCopyStatus = (copied) => {
        if (!numberLabel) return;
        numberLabel.textContent = copied ? "تم نسخ الرقم" : "انسخ الرقم: 01037626070";
        window.setTimeout(() => { numberLabel.textContent = originalLabel; }, 2400);
      };

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(walletNumber)
          .then(() => showCopyStatus(true))
          .catch(() => showCopyStatus(legacyCopy()));
      } else {
        showCopyStatus(legacyCopy());
      }
      // Do not preventDefault: the anchor opens Vodafone's official transfer page in a new tab.
      // If the page requests the recipient number, the user can paste the copied number.
    });
  }


})();
