(() => {
  "use strict";

  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const status = document.getElementById("catalogStatus");
  const expressBanner = document.getElementById("expressModeBanner");
  const EXPRESS_MODE = new URLSearchParams(window.location.search).get("express") === "1";
  if (!grid || !tabs) return;
  if (expressBanner) expressBanner.hidden = !EXPRESS_MODE;
  if (EXPRESS_MODE) document.body.classList.add("is-express-menu");

  const FALLBACK_PRODUCTS = [
    // Approved wash & iron prices.
    ["قميص", "غسيل وكوي", 55, "shirt.jpg"],
    ["تيشيرت", "غسيل وكوي", 45, "tshirt.jpg"],
    ["بلوزة", "غسيل وكوي", 60, "blouse.jpg"],
    ["بنطلون جينز", "غسيل وكوي", 65, "trousers-jeans.jpg"],
    ["بنطلون عادى", "غسيل وكوي", 55, "trousers-gabardine.jpg"],
    ["فستان كاجوال", "غسيل وكوي", 120, "casual-dress.jpg"],
    ["جيبة", "غسيل وكوي", 60, "skirt.jpg"],
    ["عباية حريمي", "غسيل وكوي", 120, "womens-abaya.jpg"],
    ["جلابية", "غسيل وكوي", 120, "galabeya.jpg"],
    ["سويت شيرت", "غسيل وكوي", 75, "hoodie.jpg"],
    ["بلوفر", "غسيل وكوي", 80, "pullover.jpg"],
    ["هودي", "غسيل وكوي", 75, "hoodie.jpg"],
    ["بيجامة (قطعتين)", "غسيل وكوي", 90, "pajama-2-piece.jpg"],
    ["ترينج رياضي (قطعتين)", "غسيل وكوي", 90, "tracksuit-2-piece.jpg"],
    // Approved furnishings prices.
    ["بطانيه فرد", "مفروشات", 135, "furnishings/01_blanket_single.png"],
    ["بطانية (فردين)", "مفروشات", 165, "furnishings/02_blanket_double.png"],
    ["لحاف فايبر (كبير)", "مفروشات", 205, "furnishings/03_fiber_duvet_large.png"],
    ["لحاف فايبر (صغير)", "مفروشات", 150, "furnishings/04_fiber_duvet_small.png"],
    ["كوفرتة", "مفروشات", 80, "furnishings/05_quilt_coverlet.png"],
    ["مفرش سرير", "مفروشات", 60, "furnishings/06_bedspread.png"],
    ["مخدة كبيرة", "مفروشات", 160, "furnishings/07_pillow_large.png"],
    ["خددية صغيرة", "مفروشات", 90, "furnishings/08_pillow_small.png"],
    ["متر السجاد العادي", "مفروشات", 35, "carpet.jpg", "السعر للمتر الواحد"],
    ["متر السجاد شاج أو فرو", "مفروشات", 45, "carpet.jpg", "السعر للمتر الواحد"]
  ].map((row, index) => ({
    id: `fallback-${index + 1}`,
    name: row[0],
    category: row[1],
    price: row[2],
    description: row[4] || "",
    image: `assets/products/${row[3]}`
  }));

  // Local image fallback is used whenever a database URL is empty or unavailable.
  const IMAGE_BY_NAME = new Map([
    ["قميص", "shirt.jpg"], ["تيشيرت", "tshirt.jpg"], ["تي شيرت", "tshirt.jpg"],
    ["بلوزة", "blouse.jpg"], ["بنطلون جينز", "trousers-jeans.jpg"],
    ["بنطلون عادى", "trousers-gabardine.jpg"], ["بنطلون عادي", "trousers-gabardine.jpg"],
    ["بنطلون جبردين", "trousers-gabardine.jpg"], ["فستان كاجوال", "casual-dress.jpg"],
    ["جيبة", "skirt.jpg"], ["عباية حريمي", "womens-abaya.jpg"], ["جلابية", "galabeya.jpg"],
    ["سويت شيرت", "hoodie.jpg"], ["بلوفر", "pullover.jpg"], ["هودي", "hoodie.jpg"],
    ["بيجامة (قطعتين)", "pajama-2-piece.jpg"], ["بيجامة 2 قطعة", "pajama-2-piece.jpg"],
    ["ترينج رياضي (قطعتين)", "tracksuit-2-piece.jpg"], ["ترينج رياضي 2 قطعة", "tracksuit-2-piece.jpg"],
    ["بالطو جوخ", "coat-wool.jpg"], ["جاكيت جوخ", "coat-wool.jpg"],
    ["بالطو طويل", "coat-long.jpg"], ["بدلة", "suit-2-piece.jpg"],
    ["بدلة 2 قطعة", "suit-2-piece.jpg"], ["بدلة (قطعتين)", "suit-2-piece.jpg"],
    ["بدلة 3 قطع", "suit-3-piece.jpg"], ["بدلة (3 قطع)", "suit-3-piece.jpg"],
    ["جاكيت بدلة", "suit-jacket.jpg"], ["جاكيت جلد", "leather-jacket.jpg"],
    ["جاكيت", "jacket.jpg"], ["جاكيت بامب", "jacket.jpg"], ["كرافتة", "tie.jpg"],
    ["فستان زفاف", "wedding-dress.jpg"], ["فستان سواريه", "evening-dress.jpg"],
    ["طرحة", "shawl.jpg"], ["شال", "shawl.jpg"], ["سجاد", "carpet.jpg"],
    ["متر السجاد العادي", "carpet.jpg"], ["متر السجاد شاج أو فرو", "carpet.jpg"],
    ["فوطة", "towel.jpg"], ["مريلة", "apron.jpg"], ["تونيك", "tunic.jpg"],
    ["شورت جبردين", "shorts-gabardine.jpg"], ["جوارب", "socks.jpg"], ["تي بولو", "polo-shirt.jpg"]
  ]);

  const FURNISHING_IMAGES = new Map([
    ["بطانيه فرد", "furnishings/01_blanket_single.png"],
    ["بطانية فرد", "furnishings/01_blanket_single.png"],
    ["بطانية (فردين)", "furnishings/02_blanket_double.png"],
    ["بطانية فردين", "furnishings/02_blanket_double.png"],
    ["لحاف فايبر (كبير)", "furnishings/03_fiber_duvet_large.png"],
    ["لحاف فايبر كبير", "furnishings/03_fiber_duvet_large.png"],
    ["لحاف فايبر (صغير)", "furnishings/04_fiber_duvet_small.png"],
    ["لحاف فايبر صغير", "furnishings/04_fiber_duvet_small.png"],
    ["كوفرتة", "furnishings/05_quilt_coverlet.png"],
    ["مفرش سرير", "furnishings/06_bedspread.png"],
    ["مخدة كبيرة", "furnishings/07_pillow_large.png"],
    ["خددية صغيرة", "furnishings/08_pillow_small.png"],
    ["خدادية صغيرة", "furnishings/08_pillow_small.png"]
  ]);

  let products = FALLBACK_PRODUCTS;
  let managedCategories = [];
  let activeCategory = "غسيل ومكواة";

  const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function cleanName(value) {
    return String(value || "").trim().replace(/\s+/g, " ").replace(/[ـ]/g, "");
  }

  function categoryKey(value) {
    const name = cleanName(value).replace(/\s+/g, "");
    // The administration may store the same wash-and-iron group as
    // "غسيل وكوي", "غسيل وكي" or "غسيل و مكواة". Treat them as one group.
    if (/غسيل/.test(name) && /(كي|كوي|مكواة|مكوه)/.test(name)) return "wash-and-iron";
    if (/مكواة|كي فقط/.test(name)) return "ironing-only";
    if (/خدمةسريعة|خدمةسريع/.test(name)) return "express-service";
    return name;
  }

  function canonicalCategory(value) {
    const key = categoryKey(value);
    if (key === "wash-and-iron") return "غسيل ومكواة";
    if (key === "ironing-only") return "مكواة فقط";
    return cleanName(value);
  }

  function categoryList() {
    const preferredOrder = ["غسيل ومكواة", "تنظيف جاف", "مفروشات", "مكواة فقط", "خدمة سريعة"];
    // Start with active categories from the same table used by management,
    // then include any category represented by an available product.
    const source = [...managedCategories, ...products.map(item => item.category)]
      .filter(value => categoryKey(value) !== "express-service");
    const byKey = new Map();
    source.forEach(value => {
      const display = canonicalCategory(value);
      const key = categoryKey(value);
      if (key && !byKey.has(key)) byKey.set(key, display);
    });
    const available = [...byKey.values()];
    const ordered = preferredOrder.filter(name => byKey.has(categoryKey(name)));
    available.forEach(name => {
      if (!ordered.some(existing => categoryKey(existing) === categoryKey(name))) ordered.push(name);
    });
    return ordered;
  }

  function formatAmount(value) {
    return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value)} ج.م`;
  }

  function priceMarkup(item) {
    if (item.price === null || item.price === undefined || item.price === "" || !Number.isFinite(Number(item.price))) {
      return '<strong class="service-price">السعر عند المعاينة</strong>';
    }
    const regular = Number(item.price);
    const amount = EXPRESS_MODE ? regular * 1.30 : regular;
    const perMeter = /متر السجاد/.test(cleanName(item.name)) || /للمتر|لكل متر/.test(String(item.description || ""));
    const suffix = perMeter ? " / متر" : "";
    if (EXPRESS_MODE) {
      return `<div class="service-price-block"><del>العادي: ${formatAmount(regular)}${suffix}</del><strong class="service-price service-price-express">السريع: ${formatAmount(amount)}${suffix}</strong></div>`;
    }
    return `<strong class="service-price">${formatAmount(regular)}${suffix}</strong>`;
  }

  function localImageFor(item) {
    const name = cleanName(item.name);
    const category = canonicalCategory(item.category);
    if (category === "مفروشات" && FURNISHING_IMAGES.has(name)) {
      return `assets/products/${FURNISHING_IMAGES.get(name)}`;
    }
    const direct = IMAGE_BY_NAME.get(name);
    if (direct) return `assets/products/${direct}`;
    if (category === "مفروشات" && /(سجاد|سجادة)/.test(name)) return "assets/products/carpet.jpg";
    if (category === "خدمة سريعة") return "assets/gdc-service-washing.jpg";
    return "";
  }

  function productImageMarkup(item) {
    const local = localImageFor(item);
    const remote = String(item.image || "").trim();
    const initial = remote || local;
    if (!initial) {
      return '<div class="service-image-empty" aria-hidden="true"></div>';
    }
    return `<img class="service-image" src="${safe(initial)}" data-local-fallback="${safe(local)}" alt="${safe(item.name)}" loading="lazy">`;
  }

  function attachImageFallbacks() {
    grid.querySelectorAll("img.service-image").forEach(image => {
      image.addEventListener("error", () => {
        const fallback = image.dataset.localFallback || "";
        if (fallback && image.src !== new URL(fallback, document.baseURI).href && !image.dataset.fallbackUsed) {
          image.dataset.fallbackUsed = "1";
          image.src = fallback;
          return;
        }
        image.hidden = true;
        const placeholder = image.nextElementSibling;
        if (placeholder) placeholder.hidden = false;
      }, { once: false });
    });
  }

  function renderTabs() {
    tabs.innerHTML = categoryList().map(category => `
      <button class="category-tab ${category === activeCategory ? "active" : ""}"
        type="button" data-category="${safe(category)}"
        aria-pressed="${category === activeCategory}">${safe(category)}</button>
    `).join("");

    tabs.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        render();
      });
    });
  }

  function renderProducts() {
    const menuProducts = products.filter(item => categoryKey(item.category) !== "express-service");
    const visible = menuProducts.filter(item => categoryKey(item.category) === categoryKey(activeCategory));

    if (!visible.length) {
      grid.innerHTML = '<div class="catalog-empty">لا توجد أصناف متاحة في هذا القسم حاليًا.</div>';
      return;
    }

    grid.innerHTML = visible.map(item => `
      <article class="service-card product-card">
        <div class="service-image-wrap">
          ${productImageMarkup(item)}
          <div class="service-image-empty" aria-hidden="true" hidden></div>
        </div>
        <div class="service-info">
          <h2>${safe(item.name)}</h2>
          ${priceMarkup(item)}
          ${item.description ? `<p>${safe(item.description)}</p>` : ""}
        </div>
      </article>
    `).join("");
    attachImageFallbacks();
  }

  function render() {
    renderTabs();
    renderProducts();
  }

  function normalizeProduct(row, displayCategory) {
    return {
      id: String(row.id || `${row.category_name || ""}-${row.name || ""}`),
      name: cleanName(row.name),
      category: displayCategory || canonicalCategory(row.category_name),
      description: String(row.description || ""),
      price: row.price === undefined ? null : row.price,
      image: String(row.image_url || "").trim()
    };
  }

  render();

  async function loadManagedCatalog() {
    const config = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
      status.textContent = "يتم عرض قائمة الأسعار والصور المحلية؛ تعذر الاتصال بقاعدة البيانات.";
      return;
    }

    try {
      const client = window.__GDC_PUBLIC_CATALOG_CLIENT__ || window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
      window.__GDC_PUBLIC_CATALOG_CLIENT__ = client;

      const [categoryResult, itemResult] = await Promise.all([
        client.from("gdc_service_categories")
          .select("name,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        client.from("gdc_service_items")
          .select("id,name,category_name,description,price,image_url,image_path,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      ]);

      if (categoryResult.error) throw categoryResult.error;
      if (itemResult.error) throw itemResult.error;

      managedCategories = (categoryResult.data || [])
        .filter(row => row.is_active !== false)
        .map(row => canonicalCategory(row.name))
        .filter(Boolean);

      const displayByKey = new Map();
      managedCategories.forEach(name => {
        const key = categoryKey(name);
        if (key && !displayByKey.has(key)) displayByKey.set(key, name);
      });
      const allowed = new Set(displayByKey.keys());
      const managedProducts = (itemResult.data || [])
        .filter(row => allowed.has(categoryKey(row.category_name)) && categoryKey(row.category_name) !== "express-service")
        .map(row => normalizeProduct(
          row,
          displayByKey.get(categoryKey(row.category_name)) || canonicalCategory(row.category_name)
        ));

      // If database rows are temporarily empty, retain the approved local menu instead of empty category cards.
      if (managedProducts.length) {
        products = managedProducts;
      }

      const availableCategories = categoryList();
      if (!availableCategories.some(name => categoryKey(name) === categoryKey(activeCategory))) {
        activeCategory = availableCategories[0] || "";
      }
      render();
      status.textContent = managedProducts.length
        ? ""
        : "لا توجد أصناف منشورة في قاعدة البيانات؛ تظهر قائمة الأسعار المحلية المتاحة.";
    } catch (error) {
      console.error("GRAND DRY CLEAN catalogue could not be loaded:", error);
      status.textContent = "تعذر تحديث البيانات من قاعدة البيانات؛ تظهر قائمة الأسعار المحلية المتاحة.";
    }
  }

  loadManagedCatalog();
})();
