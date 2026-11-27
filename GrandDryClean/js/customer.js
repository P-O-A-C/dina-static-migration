(() => {
  "use strict";

  let slides = Array.from(document.querySelectorAll(".promo-slide"));
  let dots = Array.from(document.querySelectorAll(".slider-dot"));
  const slider = document.querySelector(".promo-slider");

  // Offline fallback matching the latest exported branch records.
  const FALLBACK_BRANCHES = [
  {
    "id": "c8d9bc98-6699-43d2-8a3c-4775f726c3d8",
    "name": "جراند دراي كلين (1) – كارفور جراند سيتي",
    "phone": "01141262821",
    "address": "زهراء المعادي، عمارة C10، جراند سيتي – معمار المرشدي، شارع السعادة، القاهرة، مصر",
    "map_url": "https://maps.app.goo.gl/o4SEa5YtgdVmok287",
    "is_active": true,
    "sort_order": 10
  },
  {
    "id": "bcbb92b6-4029-4ad1-b179-0bf7424c9e48",
    "name": "جراند دراي كلين (2) – أمام شبانة",
    "phone": "",
    "address": "زهراء المعادي، عمارة 1، بلوك 42، الشطر الثامن، شارع الخمسين، أمام شبانة، القاهرة، مصر",
    "map_url": "https://maps.app.goo.gl/3rMbgmgMvmLA5yym7",
    "is_active": true,
    "sort_order": 20
  },
  {
    "id": "fe04f61e-d682-4b1f-9c93-249fd63e27e4",
    "name": "التجمع حي البنفسج",
    "phone": "01141262821",
    "address": "2FM9+J8V امام مدرسة بدايه - هايبر كارفور البنفسج، التجمع الاول-حي البنفسج، محافظة القاهرة",
    "map_url": "https://maps.app.goo.gl/bqkd76f4tntXbjje9",
    "is_active": true,
    "sort_order": 20
  }
];

  let activeSlide = 0;
  let rotationTimer = null;
  const rotationDelay = 1000;

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

  // Full-screen image viewer with navigation and zoom controls.
  let imageViewer = null;
  let viewerImage = null;
  let viewerIndex = 0;
  let viewerZoom = 1;

  function ensureImageViewer() {
    if (imageViewer) return;
    imageViewer = document.createElement("div");
    imageViewer.className = "gdc-image-viewer";
    imageViewer.setAttribute("role", "dialog");
    imageViewer.setAttribute("aria-modal", "true");
    imageViewer.setAttribute("aria-label", "عرض الصورة بالحجم الكامل");
    imageViewer.hidden = true;
    imageViewer.innerHTML = `
      <div class="gdc-viewer-toolbar">
        <button type="button" class="gdc-viewer-close" aria-label="إغلاق">×</button>
        <div class="gdc-viewer-tools">
          <button type="button" class="gdc-viewer-zoom-out" aria-label="تصغير">−</button>
          <button type="button" class="gdc-viewer-zoom-reset" aria-label="إعادة الحجم">100%</button>
          <button type="button" class="gdc-viewer-zoom-in" aria-label="تكبير">+</button>
        </div>
      </div>
      <button type="button" class="gdc-viewer-prev" aria-label="الصورة السابقة">‹</button>
      <div class="gdc-viewer-stage"><img alt="" /></div>
      <button type="button" class="gdc-viewer-next" aria-label="الصورة التالية">›</button>
      <div class="gdc-viewer-counter" aria-live="polite"></div>`;
    document.body.append(imageViewer);
    viewerImage = imageViewer.querySelector(".gdc-viewer-stage img");

    const close = () => {
      imageViewer.hidden = true;
      document.body.classList.remove("gdc-viewer-open");
      showSlide(viewerIndex);
      startRotation();
    };
    const changeViewerImage = (step) => {
      if (!slides.length) return;
      viewerIndex = (viewerIndex + step + slides.length) % slides.length;
      viewerZoom = 1;
      updateViewerImage();
    };
    imageViewer.querySelector(".gdc-viewer-close").addEventListener("click", close);
    imageViewer.querySelector(".gdc-viewer-prev").addEventListener("click", () => changeViewerImage(-1));
    imageViewer.querySelector(".gdc-viewer-next").addEventListener("click", () => changeViewerImage(1));
    imageViewer.querySelector(".gdc-viewer-zoom-in").addEventListener("click", () => setViewerZoom(viewerZoom + .25));
    imageViewer.querySelector(".gdc-viewer-zoom-out").addEventListener("click", () => setViewerZoom(viewerZoom - .25));
    imageViewer.querySelector(".gdc-viewer-zoom-reset").addEventListener("click", () => setViewerZoom(1));
    imageViewer.addEventListener("click", (event) => { if (event.target === imageViewer) close(); });
    document.addEventListener("keydown", (event) => {
      if (imageViewer.hidden) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") changeViewerImage(1);
      if (event.key === "ArrowRight") changeViewerImage(-1);
      if (event.key === "+" || event.key === "=") setViewerZoom(viewerZoom + .25);
      if (event.key === "-") setViewerZoom(viewerZoom - .25);
    });
  }

  function setViewerZoom(value) {
    viewerZoom = Math.min(4, Math.max(.5, value));
    if (viewerImage) viewerImage.style.transform = `scale(${viewerZoom})`;
    const reset = imageViewer?.querySelector(".gdc-viewer-zoom-reset");
    if (reset) reset.textContent = `${Math.round(viewerZoom * 100)}%`;
  }

  function updateViewerImage() {
    const slide = slides[viewerIndex];
    const image = slide?.querySelector("img");
    if (!image || !viewerImage) return;
    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt || "صورة من GRAND DRY CLEAN";
    setViewerZoom(1);
    const counter = imageViewer.querySelector(".gdc-viewer-counter");
    if (counter) counter.textContent = `${viewerIndex + 1} / ${slides.length}`;
  }

  function openImageViewer(index) {
    ensureImageViewer();
    if (!slides.length) return;
    viewerIndex = index;
    updateViewerImage();
    stopRotation();
    imageViewer.hidden = false;
    document.body.classList.add("gdc-viewer-open");
    imageViewer.querySelector(".gdc-viewer-close")?.focus();
  }

  function bindCarouselControls() {
    dots.forEach((dot, index) => { if (!dot.dataset.carouselBound) { dot.addEventListener("click", () => goToSlide(index)); dot.dataset.carouselBound = "true"; } });
    slides.forEach((slide, index) => {
      const image = slide.querySelector("img");
      if (image && !image.dataset.viewerBound) {
        image.dataset.viewerBound = "true";
        image.addEventListener("click", () => openImageViewer(index));
        image.setAttribute("tabindex", "0");
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", "اضغط لفتح الصورة بالحجم الكامل");
        image.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openImageViewer(index); }
        });
      }
    });
    if (!slider?.dataset.carouselEventsBound) {
      document.addEventListener("visibilitychange", () => document.hidden ? stopRotation() : startRotation());
      if (slider) slider.dataset.carouselEventsBound = "true";
    }
  }

  async function readLocalJson(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`تعذر قراءة ${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function imageIsAvailable(path) {
    if (!path) return false;
    try {
      const response = await fetch(path, { method: "HEAD", cache: "force-cache" });
      return response.ok;
    } catch (_) {
      return false;
    }
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
      const rows = await readLocalJson("data/branches.json");
      const activeRows = (Array.isArray(rows) ? rows : [])
        .filter(row => row && row.is_active !== false)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      renderPublicBranches(activeRows.length ? activeRows : FALLBACK_BRANCHES);
    } catch (error) {
      console.warn("GRAND DRY CLEAN local branches unavailable; using bundled branch details:", error);
      renderPublicBranches(FALLBACK_BRANCHES);
    }
  }

  async function loadManagedSlides() {
    if (!slider) return;
    try {
      const rows = await readLocalJson("data/home-slides.json");
      const activeRows = (Array.isArray(rows) ? rows : [])
        .filter(row => row && row.is_active !== false && row.image_url)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

      // Only use exported slides whose local image files have been uploaded.
      // If none are present yet, keep the existing three bundled slides visible.
      const checks = await Promise.all(activeRows.map(async row => ({
        row,
        available: await imageIsAvailable(row.image_url)
      })));
      const availableRows = checks.filter(item => item.available).map(item => item.row);
      if (!availableRows.length) return;

      const slidesMarkup = availableRows.map((row, index) => {
        const article = document.createElement("article");
        article.className = "promo-slide" + (index === 0 ? " is-active" : "");
        article.setAttribute("aria-hidden", String(index !== 0));
        const img = document.createElement("img");
        img.src = row.image_url;
        img.alt = row.alt_text || "صورة من GRAND DRY CLEAN";
        img.loading = index === 0 ? "eager" : "lazy";
        if (index === 0) img.fetchPriority = "high";
        article.append(img);
        return article;
      });

      const container = slider.querySelector(".slides");
      container.replaceChildren(...slidesMarkup);
      const dotsContainer = slider.querySelector("#sliderDots");
      if (dotsContainer) {
        dotsContainer.replaceChildren(...availableRows.map((_, index) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "slider-dot" + (index === 0 ? " is-active" : "");
          dot.setAttribute("aria-label", `الصورة ${index + 1}`);
          dot.setAttribute("aria-current", String(index === 0));
          return dot;
        }));
      }
      slides = Array.from(slider.querySelectorAll(".promo-slide"));
      dots = Array.from(slider.querySelectorAll(".slider-dot"));
      activeSlide = 0;
      bindCarouselControls();
      showSlide(0);
      startRotation();
    } catch (error) {
      console.warn("GRAND DRY CLEAN local homepage slides unavailable; using built-in slides:", error);
    }
  }

  async function loadBusinessSettings() {
    try {
      const settings = await readLocalJson("data/settings.json");
      const phone = String(settings?.phone || "").replace(/\D/g, "");
      const instapayNumber = String(settings?.instapay_number || settings?.phone || "").replace(/\D/g, "");
      if (instapayNumber) {
        const instapayButton = document.querySelector(".instapay-tile[data-copy-number]");
        if (instapayButton) {
          instapayButton.dataset.copyNumber = instapayNumber;
          const number = instapayButton.querySelector(".payment-copy small");
          if (number) number.textContent = instapayNumber;
        }
      }
      if (phone) {
        const walletLink = document.querySelector(".vodafone-tile[data-wallet-number]");
        if (walletLink) {
          walletLink.dataset.walletNumber = phone;
          const number = walletLink.querySelector(".payment-copy small");
          if (number) number.textContent = phone;
        }
        const whatsappLink = document.querySelector('.below-fold-contact a[href*="wa.me/"]');
        if (whatsappLink) {
          const whatsappPhone = phone.startsWith("20") ? phone : (phone.startsWith("0") ? `2${phone}` : phone);
          whatsappLink.href = `https://wa.me/${whatsappPhone}`;
        }
      }
      const mapsLink = document.querySelector('.below-fold-contact a[href*="maps.app.goo.gl"]');
      if (mapsLink && settings?.location_url) mapsLink.href = settings.location_url;
    } catch (error) {
      console.warn("GRAND DRY CLEAN local settings unavailable; keeping page defaults:", error);
    }
  }

  bindCarouselControls();


  showSlide(0);
  startRotation();
  loadManagedSlides();
  loadPublicBranches();
  loadBusinessSettings();


  // InstaPay tile is copy-only: it never opens an external app or payment URL.
  const instapayButton = document.querySelector(".instapay-tile[data-copy-number]");
  if (instapayButton && !instapayButton.dataset.copyBound) {
    instapayButton.dataset.copyBound = "true";
    instapayButton.addEventListener("click", async () => {
      const instapayNumber = String(instapayButton.dataset.copyNumber || "").replace(/\D/g, "");
      const numberLabel = instapayButton.querySelector(".payment-copy small");
      if (!instapayNumber) {
        if (numberLabel) numberLabel.textContent = "الرقم غير متاح";
        return;
      }

      const originalLabel = numberLabel?.textContent || instapayNumber;
      const legacyCopy = () => {
        const helper = document.createElement("textarea");
        helper.value = instapayNumber;
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

      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(instapayNumber);
          copied = true;
        } else {
          copied = legacyCopy();
        }
      } catch (_) {
        copied = legacyCopy();
      }

      if (numberLabel) {
        numberLabel.textContent = copied ? "تم نسخ الرقم" : "تعذر النسخ";
        window.setTimeout(() => { numberLabel.textContent = originalLabel; }, 2400);
      }
    });
  }

  // Same interaction pattern as before: copy the wallet number and
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
        numberLabel.textContent = copied ? "تم نسخ الرقم" : `انسخ الرقم: ${walletNumber}`;
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
