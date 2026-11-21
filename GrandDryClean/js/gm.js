// GRAND DRY CLEAN management workspace — persistent Supabase-backed administration.
(function () {
  "use strict";

  const TABLES = {
    categories: "gdc_service_categories",
    products: "gdc_service_items",
    branches: "gdc_branches",
    settings: "gdc_settings",
    homeSlides: "gdc_home_slides"
  };
  const IMAGE_BUCKET = "gdc-service-images";
  const $ = id => document.getElementById(id);
  const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = value => value !== null && value !== "" && Number.isFinite(Number(value))
    ? `${Number(value).toLocaleString("ar-EG")} ج.م`
    : "لم يحدد";
  const validViews = ["overview", "products", "categories", "branches", "popular", "profile"];

  let client = null;
  let products = [];
  let categories = [];
  let branches = [];
  let homeSlides = [];
  let homeSlidesReady = false;
  let homeSlidesLoadError = "";
  let currentImageUrl = "";
  let currentImagePath = "";
  let initialized = false;
  let busy = false;

  function setDbStatus(message, kind = "info") {
    const element = $("dbStatus");
    if (!element) return;
    element.hidden = !message;
    element.textContent = message || "";
    element.dataset.kind = kind;
  }

  function toast(message, isError = false) {
    const element = $("toast");
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = isError ? "error" : "success";
    element.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => element.classList.remove("show"), 3200);
  }

  function setBusy(value) {
    busy = Boolean(value);
    document.querySelectorAll("#gmSaveButton, #newProductBtn, #newCategoryBtn, #branchForm button[type='submit'], #profileForm button[type='submit']")
      .forEach(button => { if (button) button.disabled = busy; });
  }

  function showView(id, updateUrl = true) {
    const selected = validViews.includes(id) ? id : "overview";
    document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === selected));
    document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === selected));
    const backButton = $("backToOverview");
    if (backButton) backButton.hidden = selected === "overview";
    if (selected === "products") renderProducts();
    if (selected === "categories") renderCategories();
    if (selected === "branches") renderBranches();
    if (selected === "popular") { renderPopular(); renderHomeSlides(); }
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("view", selected);
      history.replaceState(null, "", url);
    }
    window.scrollTo(0, 0);
    $("sidebar")?.classList.remove("open");
  }

  function bindNavigation() {
    document.querySelectorAll("[data-view]").forEach(link => link.addEventListener("click", event => {
      event.preventDefault();
      showView(link.dataset.view);
    }));
    document.querySelectorAll("[data-goto]").forEach(button => button.addEventListener("click", () => showView(button.dataset.goto)));
    if ($("backToOverview")) $("backToOverview").addEventListener("click", () => showView("overview"));
    if ($("menuToggle") && $("sidebar")) $("menuToggle").onclick = () => $("sidebar").classList.toggle("open");
    if ($("todayLabel")) $("todayLabel").textContent = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(new Date());
  }

  async function getUserId() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const user = data?.session?.user;
    if (!user?.id) throw new Error("انتهت جلسة الدخول. سجّل الدخول مرة أخرى.");
    return user.id;
  }

  function mapProduct(row) {
    return {
      id: String(row.id),
      name: row.name || "",
      category: row.category_name || "",
      price: row.price === null || row.price === undefined ? "" : String(row.price),
      description: row.description || "",
      active: row.is_active !== false,
      featured: row.is_featured === true,
      icon: row.icon || "♧",
      image: row.image_url || "",
      imagePath: row.image_path || ""
    };
  }

  async function loadDatabase() {
    setDbStatus("جارٍ تحميل بيانات المغسلة من Supabase…", "info");
    const results = await Promise.all([
      client.from(TABLES.categories).select("id,name,sort_order,is_active").order("sort_order", { ascending: true }),
      client.from(TABLES.products).select("id,name,category_name,price,description,is_active,is_featured,icon,image_url,image_path,sort_order").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      client.from(TABLES.branches).select("id,name,phone,address,map_url,is_active,sort_order").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      client.from(TABLES.settings).select("id,business_name,phone,currency,location_url").eq("id", 1).maybeSingle()
    ]);
    const [categoryResult, productResult, branchResult, settingsResult] = results;
    for (const result of results) if (result.error) throw result.error;

    // All service groups, including "مكواة فقط", are normal editable rows
    // in gdc_service_categories and are included in the regular item selectors.
    categories = (categoryResult.data || [])
      .filter(row => row.is_active !== false)
      .map(row => row.name)
      .filter(Boolean);
    products = (productResult.data || []).map(mapProduct);
    branches = (branchResult.data || []).map(row => ({
      id: String(row.id), name: row.name || "", phone: row.phone || "", address: row.address || "", map: row.map_url || "", active: row.is_active !== false
    }));

    const settings = settingsResult.data;
    if ($("businessName")) $("businessName").value = settings?.business_name || "GRAND DRY CLEAN";
    if ($("businessPhone")) {
      const storedPhone = String(settings?.phone || "").trim();
      // Replace the previous default contact number with the newly approved WhatsApp number.
      $("businessPhone").value = !storedPhone || storedPhone === "01005854115" ? "01037626070" : storedPhone;
    }
    if ($("businessCurrency")) $("businessCurrency").value = settings?.currency || "EGP";
    if ($("businessLocation")) $("businessLocation").value = settings?.location_url || "";

    renderAll();
    setDbStatus("تم تحميل البيانات المحفوظة من قاعدة البيانات. أي تعديل ناجح سيظهر بعد إعادة فتح الصفحة ومن الأجهزة الأخرى.", "success");
  }

  function updateMetrics() {
    if ($("metricProducts")) $("metricProducts").textContent = products.length;
    if ($("metricCategories")) $("metricCategories").textContent = categories.length;
    if ($("metricPriced")) $("metricPriced").textContent = products.filter(product => product.price !== "" && Number(product.price) > 0).length;
  }

  function productRow(product) {
    const visual = product.image ? `<img src="${safe(product.image)}" alt="">` : safe(product.icon || "♧");
    return `<tr><td><div class="product-cell"><span class="product-thumb">${visual}</span><b>${safe(product.name)}</b></div></td><td>${safe(product.category)}</td><td>${money(product.price)}</td><td><span class="status ${product.active ? "" : "off"}">${product.active ? "متاح" : "مخفي"}</span></td><td><div class="row-actions"><button type="button" data-edit="${safe(product.id)}">تعديل</button><button type="button" class="delete" data-delete="${safe(product.id)}">حذف</button></div></td></tr>`;
  }

  function bindRowActions() {
    document.querySelectorAll("[data-edit]").forEach(button => { button.onclick = () => openProductModal(button.dataset.edit); });
    document.querySelectorAll("[data-delete]").forEach(button => {
      button.onclick = async () => {
        const product = products.find(item => item.id === button.dataset.delete);
        if (!product || !confirm(`حذف الصنف "${product.name}"؟`)) return;
        button.disabled = true;
        try {
          const { error } = await client.from(TABLES.products).delete().eq("id", product.id);
          if (error) throw error;
          if (product.imagePath) await client.storage.from(IMAGE_BUCKET).remove([product.imagePath]);
          products = products.filter(item => item.id !== product.id);
          renderAll();
          toast("تم حذف الصنف وحفظ التغيير في قاعدة البيانات.");
        } catch (error) {
          console.error("GDC delete service failed:", error);
          toast(`تعذر حذف الصنف: ${error.message || "خطأ غير معروف"}`, true);
          button.disabled = false;
        }
      };
    });
  }

  function renderProducts() {
    if (!$("productRows")) return;
    const query = $("productSearch").value.trim().toLowerCase();
    const category = $("categoryFilter").value;
    const list = products.filter(product => (!category || product.category === category) && (!query || product.name.toLowerCase().includes(query)));
    $("productRows").innerHTML = list.length ? list.map(productRow).join("") : '<tr><td colspan="5">لا توجد أصناف مطابقة.</td></tr>';
    bindRowActions();
  }

  function renderOverview() {
    if ($("overviewRows")) $("overviewRows").innerHTML = products.slice(0, 6).map(product => `<tr><td>${safe(product.name)}</td><td>${safe(product.category)}</td><td>${money(product.price)}</td><td><span class="status ${product.active ? "" : "off"}">${product.active ? "متاح" : "مخفي"}</span></td></tr>`).join("");
  }

  function refreshCategoryOptions() {
    if ($("categoryFilter")) $("categoryFilter").innerHTML = '<option value="">كل الأقسام</option>' + categories.map(category => `<option>${safe(category)}</option>`).join("");
    if ($("pCategory")) $("pCategory").innerHTML = categories.map(category => `<option>${safe(category)}</option>`).join("");
  }

  function openCategoryEditor(type, name) {
    const form = $("categoryForm");
    if (!form) return;
    form.reset();
    $("categoryEditingOriginal").value = name || "";
    $("categoryEditingType").value = type || "";
    $("newCategoryName").value = name || "";
    form.querySelector("h2").textContent = name ? "تعديل القسم" : "إضافة قسم";
    form.querySelector('button[type="submit"]').textContent = name ? "حفظ التعديل" : "إضافة القسم";
    $("categoryShade").classList.add("show");
    $("newCategoryName").focus();
  }

  function renderCategories() {
    if (!$('categoryCards')) return;
    const cards = categories.map(category => `
      <article class="category-card">
        <div><b>${safe(category)}</b><small>${products.filter(product => product.category === category).length} صنف</small></div>
        <div class="category-card-actions">
          <button type="button" class="category-edit-btn" data-edit-category="${safe(category)}">تعديل</button>
          <button type="button" class="category-delete-btn" data-remove-category="${safe(category)}">حذف</button>
        </div>
      </article>
    `).join('');
    $('categoryCards').innerHTML = cards || '<div class="empty-state">لا توجد أقسام مسجلة بعد.</div>';

    document.querySelectorAll('[data-edit-category]').forEach(button => {
      button.onclick = () => openCategoryEditor('service', button.dataset.editCategory);
    });

    document.querySelectorAll('[data-remove-category]').forEach(button => {
      button.onclick = async () => {
        const name = button.dataset.removeCategory;
        const linkedCount = products.filter(product => product.category === name).length;
        if (linkedCount > 0) {
          toast(`لا يمكن حذف القسم قبل نقل أو حذف الأصناف المرتبطة به (${linkedCount} صنف).`, true);
          return;
        }
        if (!confirm(`حذف القسم "${name}"؟`)) return;
        button.disabled = true;
        try {
          const { error } = await client.from(TABLES.categories).delete().eq('name', name);
          if (error) throw error;
          categories = categories.filter(category => category !== name);
          renderAll();
          toast('تم حذف القسم وحفظ التغيير في قاعدة البيانات.');
        } catch (error) {
          console.error('GDC delete category failed:', error);
          toast(`تعذر حذف القسم: ${error.message || 'خطأ غير معروف'}`, true);
          button.disabled = false;
        }
      };
    });
  }

  function validMapUrl(value) {
    try { const url = new URL(String(value || "")); return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""; }
    catch { return ""; }
  }

  function renderBranches() {
    if (!$("branchCards")) return;
    if ($("branchCount")) $("branchCount").textContent = `${branches.length} فرع`;
    if (!branches.length) {
      $("branchCards").innerHTML = '<div class="empty-state">لم تتم إضافة فروع بعد. استخدم النموذج أعلاه لإضافة أول فرع.</div>';
      return;
    }
    $("branchCards").innerHTML = branches.map(branch => `<article class="branch-card"><h3>${safe(branch.name)}</h3><p>${safe(branch.address)}</p><div class="branch-meta">${branch.phone ? `<p dir="ltr">${safe(branch.phone)}</p>` : ""}${validMapUrl(branch.map) ? `<a href="${safe(validMapUrl(branch.map))}" target="_blank" rel="noopener noreferrer">فتح الموقع على الخريطة ↗</a>` : ""}</div><button type="button" data-delete-branch="${safe(branch.id)}">حذف الفرع</button></article>`).join("");
    document.querySelectorAll("[data-delete-branch]").forEach(button => {
      button.onclick = async () => {
        if (!confirm("هل تريد حذف هذا الفرع؟")) return;
        button.disabled = true;
        try {
          const { error } = await client.from(TABLES.branches).delete().eq("id", button.dataset.deleteBranch);
          if (error) throw error;
          branches = branches.filter(branch => branch.id !== button.dataset.deleteBranch);
          renderBranches();
          toast("تم حذف الفرع وحفظ التغيير في قاعدة البيانات.");
        } catch (error) {
          console.error("GDC delete branch failed:", error);
          toast(`تعذر حذف الفرع: ${error.message || "خطأ غير معروف"}`, true);
          button.disabled = false;
        }
      };
    });
  }

  async function loadHomeSlides() {
    homeSlidesReady = false;
    try {
      const { data, error } = await client.from(TABLES.homeSlides)
        .select("id,image_url,image_path,alt_text,sort_order,is_active")
        .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (error) throw error;
      homeSlides = (data || []).map(row => ({
        id: String(row.id), image: row.image_url || "", path: row.image_path || "",
        alt: row.alt_text || "صورة من GRAND DRY CLEAN", order: Number(row.sort_order || 0), active: row.is_active !== false
      }));
      homeSlidesReady = true;
      homeSlidesLoadError = "";
      renderHomeSlides();
    } catch (error) {
      console.error("GDC homepage slides load failed:", error);
      homeSlidesLoadError = error.message || "تعذر تحميل الجدول.";
      const box = $("homeSlidesCards");
      if (box) box.innerHTML = '<div class="empty-state">لم يتم إعداد جدول صور الصفحة الرئيسية بعد. نفّذ ملف GDC-HOMEPAGE-SLIDES-SETUP.sql مرة واحدة في Supabase ثم أعد تحميل لوحة الإدارة.</div>';
      if ($("homeSlidesMessage")) $("homeSlidesMessage").textContent = error.message || "تعذر تحميل صور الصفحة الرئيسية.";
    }
  }

  function renderHomeSlides() {
    const box = $("homeSlidesCards");
    if (!box) return;
    if (!homeSlidesReady) {
      box.innerHTML = '<div class="empty-state">نفّذ ملف GDC-HOMEPAGE-SLIDES-SETUP.sql في Supabase لتفعيل التحكم في صور السلايدر.</div>';
      return;
    }
    if ($("homeSlidesCount")) $("homeSlidesCount").textContent = `${homeSlides.length} صورة`;
    if (!homeSlides.length) {
      box.innerHTML = '<div class="empty-state">لا توجد صور مخصصة بعد. أضف أول صورة للسلايدر؛ وستظل الصور الافتراضية ظاهرة للعملاء حتى تضيف صورك.</div>';
      return;
    }
    box.innerHTML = homeSlides.map((slide, index) => `
      <article class="home-slide-card ${slide.active ? '' : 'is-disabled'}">
        <img src="${safe(slide.image)}" alt="${safe(slide.alt)}" loading="lazy">
        <div class="home-slide-meta"><b>الصورة ${index + 1}</b><small>${slide.active ? 'ظاهرة للعملاء' : 'مخفية عن العملاء'}</small></div>
        <div class="home-slide-actions">
          <label class="popular-image-upload">تغيير الصورة<input type="file" accept="image/*" data-replace-home-slide="${safe(slide.id)}"></label>
          <button type="button" data-toggle-home-slide="${safe(slide.id)}">${slide.active ? 'إخفاء' : 'إظهار'}</button>
          <button type="button" data-move-home-slide="up" data-id="${safe(slide.id)}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-move-home-slide="down" data-id="${safe(slide.id)}" ${index === homeSlides.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="delete" data-delete-home-slide="${safe(slide.id)}">حذف</button>
        </div>
      </article>`).join("");

    box.querySelectorAll('[data-replace-home-slide]').forEach(input => input.addEventListener('change', async () => {
      const slide = homeSlides.find(item => item.id === input.dataset.replaceHomeSlide);
      const file = input.files?.[0];
      if (!slide || !file) return;
      if (!file.type.startsWith('image/')) { toast('اختر ملف صورة صالحًا.', true); return; }
      input.disabled = true;
      let uploaded = null;
      try {
        uploaded = await uploadProductImage(file);
        const { error } = await client.from(TABLES.homeSlides).update({ image_url: uploaded.url, image_path: uploaded.path, updated_at: new Date().toISOString() }).eq('id', slide.id);
        if (error) throw error;
        const oldPath = slide.path;
        slide.image = uploaded.url; slide.path = uploaded.path;
        if (oldPath) await client.storage.from(IMAGE_BUCKET).remove([oldPath]);
        renderHomeSlides(); toast('تم تحديث صورة السلايدر.');
      } catch (error) {
        if (uploaded?.path) await client.storage.from(IMAGE_BUCKET).remove([uploaded.path]).catch(() => {});
        console.error('GDC homepage slide replace failed:', error);
        toast(`تعذر تغيير الصورة: ${error.message || 'خطأ غير معروف'}`, true);
        input.disabled = false;
      }
    }));

    box.querySelectorAll('[data-toggle-home-slide]').forEach(button => button.addEventListener('click', async () => {
      const slide = homeSlides.find(item => item.id === button.dataset.toggleHomeSlide);
      if (!slide) return;
      button.disabled = true;
      try {
        const next = !slide.active;
        const { error } = await client.from(TABLES.homeSlides).update({ is_active: next, updated_at: new Date().toISOString() }).eq('id', slide.id);
        if (error) throw error;
        slide.active = next; renderHomeSlides(); toast(next ? 'تم إظهار الصورة للعملاء.' : 'تم إخفاء الصورة عن العملاء.');
      } catch (error) { toast(`تعذر تحديث الحالة: ${error.message || 'خطأ غير معروف'}`, true); button.disabled = false; }
    }));

    box.querySelectorAll('[data-move-home-slide]').forEach(button => button.addEventListener('click', async () => {
      const index = homeSlides.findIndex(item => item.id === button.dataset.id);
      const target = button.dataset.moveHomeSlide === 'up' ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= homeSlides.length) return;
      const first = homeSlides[index], second = homeSlides[target];
      try {
        const updates = await Promise.all([
          client.from(TABLES.homeSlides).update({ sort_order: second.order, updated_at: new Date().toISOString() }).eq('id', first.id),
          client.from(TABLES.homeSlides).update({ sort_order: first.order, updated_at: new Date().toISOString() }).eq('id', second.id)
        ]);
        const failure = updates.find(result => result.error); if (failure) throw failure.error;
        [first.order, second.order] = [second.order, first.order];
        homeSlides.sort((a,b) => a.order - b.order); renderHomeSlides();
      } catch (error) { toast(`تعذر تغيير الترتيب: ${error.message || 'خطأ غير معروف'}`, true); }
    }));

    box.querySelectorAll('[data-delete-home-slide]').forEach(button => button.addEventListener('click', async () => {
      const slide = homeSlides.find(item => item.id === button.dataset.deleteHomeSlide);
      if (!slide || !confirm('حذف هذه الصورة من سلايدر صفحة العملاء؟')) return;
      button.disabled = true;
      try {
        const { error } = await client.from(TABLES.homeSlides).delete().eq('id', slide.id);
        if (error) throw error;
        if (slide.path) { const removed = await client.storage.from(IMAGE_BUCKET).remove([slide.path]); if (removed.error) console.warn('Slide image cleanup failed:', removed.error.message); }
        homeSlides = homeSlides.filter(item => item.id !== slide.id);
        homeSlides.forEach((item, i) => item.order = (i + 1) * 10);
        await Promise.all(homeSlides.map(item => client.from(TABLES.homeSlides).update({ sort_order: item.order }).eq('id', item.id)));
        renderHomeSlides(); toast('تم حذف الصورة من السلايدر.');
      } catch (error) { toast(`تعذر حذف الصورة: ${error.message || 'خطأ غير معروف'}`, true); button.disabled = false; }
    }));
  }

  async function addHomeSlide(file) {
    if (!file || !file.type.startsWith('image/')) { toast('اختر ملف صورة صالحًا.', true); return; }
    if (homeSlides.length >= 6) { toast('يمكن إضافة 6 صور كحد أقصى.', true); return; }
    const input = $('homeSlideUpload'); if (input) input.disabled = true;
    let uploaded = null;
    try {
      uploaded = await uploadProductImage(file);
      const nextOrder = homeSlides.length ? Math.max(...homeSlides.map(item => item.order)) + 10 : 10;
      const { data, error } = await client.from(TABLES.homeSlides).insert({
        image_url: uploaded.url, image_path: uploaded.path, alt_text: 'صورة من GRAND DRY CLEAN',
        sort_order: nextOrder, is_active: true
      }).select('id,image_url,image_path,alt_text,sort_order,is_active').single();
      if (error) throw error;
      homeSlides.push({ id: String(data.id), image: data.image_url, path: data.image_path, alt: data.alt_text, order: Number(data.sort_order), active: data.is_active !== false });
      renderHomeSlides(); toast('تمت إضافة الصورة إلى سلايدر صفحة العملاء.');
    } catch (error) {
      if (uploaded?.path) await client.storage.from(IMAGE_BUCKET).remove([uploaded.path]).catch(() => {});
      console.error('GDC homepage slide add failed:', error);
      toast(`تعذرت إضافة الصورة: ${error.message || 'خطأ غير معروف'}`, true);
    } finally { if (input) { input.disabled = false; input.value = ''; } }
  }

  function renderPopular() {
    if (!$('popularCards')) return;
    const selected = products.filter(product => product.featured);
    if ($('popularCount')) $('popularCount').textContent = `${selected.length} صنف محدد`;
    $('popularCards').innerHTML = products.map(product => {
      const visual = product.image
        ? `<img src="${safe(product.image)}" alt="${safe(product.name)}" loading="lazy">`
        : safe(product.icon || '♧');
      return `<article class="popular-card">
        <span class="product-thumb">${visual}</span>
        <div class="popular-info"><b>${safe(product.name)}</b><small>${safe(product.category)} · ${money(product.price)}</small>
          <label class="popular-image-upload">${product.image ? 'تغيير الصورة' : 'إضافة صورة'}<input type="file" accept="image/*" data-popular-image="${safe(product.id)}"></label>
        </div>
        <button type="button" class="${product.featured ? 'is-selected' : ''}" data-toggle-popular="${safe(product.id)}">${product.featured ? 'محدد ✓' : 'إضافة للقائمة'}</button>
      </article>`;
    }).join('') || '<div class="empty-state">أضف أصنافًا أولًا لاختيار الأكثر طلبًا.</div>';

    document.querySelectorAll('[data-popular-image]').forEach(input => {
      input.addEventListener('change', async () => {
        const product = products.find(item => item.id === input.dataset.popularImage);
        const file = input.files?.[0];
        if (!product || !file) return;
        if (!file.type.startsWith('image/')) { toast('اختار ملف صورة صالح.', true); input.value = ''; return; }
        input.disabled = true;
        let uploaded = null;
        try {
          uploaded = await uploadProductImage(file);
          const oldPath = product.imagePath;
          const { error } = await client.from(TABLES.products).update({
            image_url: uploaded.url,
            image_path: uploaded.path,
            updated_at: new Date().toISOString()
          }).eq('id', product.id);
          if (error) throw error;
          product.image = uploaded.url;
          product.imagePath = uploaded.path;
          if (oldPath && oldPath !== uploaded.path) {
            const removed = await client.storage.from(IMAGE_BUCKET).remove([oldPath]);
            if (removed.error) console.warn('Old GDC image was not removed:', removed.error.message);
          }
          renderPopular();
          toast('تم حفظ الصورة، وستظهر في صفحة العملاء.');
        } catch (error) {
          if (uploaded?.path) await client.storage.from(IMAGE_BUCKET).remove([uploaded.path]).catch(() => {});
          console.error('GDC popular image upload failed:', error);
          toast(`تعذر رفع الصورة: ${error.message || 'خطأ غير معروف'}`, true);
          input.disabled = false;
          input.value = '';
        }
      });
    });

    document.querySelectorAll('[data-toggle-popular]').forEach(button => {
      button.onclick = async () => {
        const product = products.find(item => item.id === button.dataset.togglePopular);
        if (!product) return;
        button.disabled = true;
        try {
          const nextValue = !product.featured;
          const { error } = await client.from(TABLES.products).update({ is_featured: nextValue, updated_at: new Date().toISOString() }).eq('id', product.id);
          if (error) throw error;
          product.featured = nextValue;
          renderPopular();
          toast('تم حفظ قائمة الأكثر طلبًا في قاعدة البيانات.');
        } catch (error) {
          console.error('GDC featured service update failed:', error);
          toast(`تعذر حفظ الاختيار: ${error.message || 'خطأ غير معروف'}`, true);
          button.disabled = false;
        }
      };
    });
  }

  function renderAll() {
    refreshCategoryOptions();
    renderProducts();
    renderOverview();
    renderCategories();
    renderBranches();
    renderPopular();
    updateMetrics();
  }

  function openProductModal(id = "") {
    $("productForm").reset();
    currentImageUrl = "";
    currentImagePath = "";
    $("imagePreview").textContent = "عرض الصورة";
    $("editingId").value = id;
    const product = products.find(item => item.id === id);
    $("productModalTitle").textContent = product ? "تعديل الصنف" : "إضافة صنف جديد";
    if (product) {
      $("pName").value = product.name;
      $("pCategory").value = product.category;
      $("pPrice").value = product.price;
      $("pDescription").value = product.description;
      $("pActive").checked = product.active;
      currentImageUrl = product.image || "";
      currentImagePath = product.imagePath || "";
      if (currentImageUrl) $("imagePreview").innerHTML = `<img src="${safe(currentImageUrl)}" alt="عرض الصورة">`;
    }
    $("modalShade").classList.add("show");
  }

  function closeProductModal() { $("modalShade").classList.remove("show"); }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !String(file.type || "").startsWith("image/")) return reject(new Error("اختر ملف صورة صالحًا."));
      if (file.size > 20 * 1024 * 1024) return reject(new Error("حجم الصورة يجب ألا يتجاوز 20 ميجابايت."));
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const maxDimension = 1200;
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("تعذر تجهيز الصورة في المتصفح.");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return reject(new Error("تعذر ضغط الصورة."));
            resolve(blob);
          }, "image/jpeg", 0.82);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("تعذر فتح الصورة المختارة.")); };
      image.src = objectUrl;
    });
  }

  async function uploadProductImage(file) {
    const userId = await getUserId();
    const blob = await compressImage(file);
    const filePath = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await client.storage.from(IMAGE_BUCKET).upload(filePath, blob, {
      upsert: false,
      contentType: "image/jpeg",
      cacheControl: "31536000"
    });
    if (error) throw error;
    return { path: filePath, url: client.storage.from(IMAGE_BUCKET).getPublicUrl(filePath).data.publicUrl };
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (busy) return;
    const id = $("editingId").value;
    const name = $("pName").value.trim();
    const categoryName = $("pCategory").value;
    if (!name || !categoryName) { toast("اكتب اسم الصنف واختر القسم.", true); return; }
    setBusy(true);
    let uploaded = null;
    try {
      let imageUrl = currentImageUrl;
      let imagePath = currentImagePath;
      const file = $("pImage").files?.[0];
      if (file) {
        uploaded = await uploadProductImage(file);
        imageUrl = uploaded.url;
        imagePath = uploaded.path;
      }
      const payload = {
        name,
        category_name: categoryName,
        price: $("pPrice").value === "" ? null : Number($("pPrice").value),
        description: $("pDescription").value.trim(),
        is_active: $("pActive").checked,
        image_url: imageUrl || null,
        image_path: imagePath || null,
        updated_at: new Date().toISOString()
      };
      const result = id
        ? await client.from(TABLES.products).update(payload).eq("id", id).select("id,name,category_name,price,description,is_active,is_featured,icon,image_url,image_path,sort_order").single()
        : await client.from(TABLES.products).insert(payload).select("id,name,category_name,price,description,is_active,is_featured,icon,image_url,image_path,sort_order").single();
      if (result.error) throw result.error;
      if (uploaded && currentImagePath && currentImagePath !== uploaded.path) {
        const removed = await client.storage.from(IMAGE_BUCKET).remove([currentImagePath]);
        if (removed.error) console.warn("Old GDC service image was not removed:", removed.error.message);
      }
      const saved = mapProduct(result.data);
      const index = products.findIndex(item => item.id === saved.id);
      if (index >= 0) products[index] = saved;
      else products.push(saved);
      closeProductModal();
      renderAll();
      toast("تم حفظ الصنف بنجاح في Supabase.");
    } catch (error) {
      if (uploaded?.path) await client.storage.from(IMAGE_BUCKET).remove([uploaded.path]).catch(() => {});
      console.error("GDC save service failed:", error);
      toast(`تعذر حفظ الصنف: ${error.message || "خطأ غير معروف"}`, true);
    } finally {
      setBusy(false);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    if (busy) return;
    const name = $("newCategoryName").value.trim();
    const originalName = $("categoryEditingOriginal")?.value || "";
    const editingType = $("categoryEditingType")?.value || "";
    if (!name) return;

    if (name !== originalName && categories.includes(name)) {
      toast("هذا القسم موجود بالفعل.", true);
      return;
    }

    setBusy(true);
    try {
      if (originalName) {
        if (name !== originalName) {
          const { error: productError } = await client.from(TABLES.products)
            .update({ category_name: name }).eq("category_name", originalName);
          if (productError) throw productError;

          const { error: categoryError } = await client.from(TABLES.categories)
            .update({ name }).eq("name", originalName);
          if (categoryError) {
            await client.from(TABLES.products).update({ category_name: originalName }).eq("category_name", name);
            throw categoryError;
          }

          categories = categories.map(category => category === originalName ? name : category);
          products = products.map(product => product.category === originalName ? { ...product, category: name } : product);
          toast("تم تعديل اسم القسم وتحديث الأصناف المرتبطة به.");
        }
      } else {
        const { data, error } = await client.from(TABLES.categories)
          .insert({ name, sort_order: categories.length * 10, is_active: true })
          .select("id,name,sort_order,is_active").single();
        if (error) throw error;
        categories.push(data.name);
        toast("تم حفظ القسم في Supabase.");
      }
      $("categoryShade").classList.remove("show");
      $("categoryForm").reset();
      $("categoryEditingOriginal").value = "";
      $("categoryEditingType").value = "";
      $("categoryForm").querySelector("h2").textContent = "إضافة قسم";
      $("categoryForm").querySelector('button[type="submit"]').textContent = "إضافة القسم";
      renderAll();
    } catch (error) {
      console.error("GDC save category failed:", error);
      toast(`تعذر حفظ القسم: ${error.message || "خطأ غير معروف"}`, true);
    } finally { setBusy(false); }
  }

  // Verify the real browser session against the same RLS function used by gdc_branches.
  // This distinguishes a database policy problem from a stale/wrong browser session.
  async function verifyBranchManagerSession() {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw new Error(`تعذر التحقق من جلسة الدخول: ${userError.message}`);
    const user = userData?.user;
    if (!user?.id) throw new Error("جلسة الدخول غير موجودة أو انتهت. سجّل الخروج ثم ادخل مرة أخرى.");

    const { data: allowed, error: permissionError } = await client.rpc("gdc_can_manage");
    if (permissionError) throw new Error(`تعذر فحص صلاحية إدارة المغسلة: ${permissionError.message}`);
    if (allowed !== true) {
      throw new Error(`الجلسة الحالية غير مصرح لها بإدارة الفروع. الحساب الحالي: ${user.email || user.id}. ادخل بحساب POAC أو مدير المغسلة ثم أعد المحاولة.`);
    }
    return user;
  }

  async function saveBranch(event) {
    event.preventDefault();
    if (busy) return;
    const name = $("branchName").value.trim();
    const address = $("branchAddress").value.trim();
    const phone = $("branchPhone").value.trim();
    const map = $("branchMap").value.trim();
    if (!name || !address) { toast("اسم الفرع والعنوان مطلوبان.", true); return; }
    if (map && !validMapUrl(map)) { toast("أدخل رابط موقع صحيحًا يبدأ بـ https:// أو http://", true); return; }
    setBusy(true);
    try {
      // Check the real logged-in browser identity before attempting the RLS-protected insert.
      await verifyBranchManagerSession();
      const { data, error } = await client.from(TABLES.branches).insert({ name, address, phone: phone || null, map_url: map || null, is_active: true, sort_order: branches.length * 10 }).select("id,name,phone,address,map_url,is_active,sort_order").single();
      if (error) throw error;
      branches.push({ id: String(data.id), name: data.name, address: data.address, phone: data.phone || "", map: data.map_url || "", active: data.is_active !== false });
      $("branchForm").reset();
      renderBranches();
      toast("تم حفظ الفرع في Supabase.");
    } catch (error) {
      console.error("GDC save branch failed:", error);
      toast(`تعذر حفظ الفرع: ${error.message || "خطأ غير معروف"}`, true);
    } finally { setBusy(false); }
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const payload = {
      id: 1,
      business_name: $("businessName").value.trim(),
      phone: $("businessPhone").value.trim(),
      currency: $("businessCurrency").value || "EGP",
      location_url: validMapUrl($("businessLocation").value.trim()) || null,
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await client.from(TABLES.settings).upsert(payload, { onConflict: "id" });
      if (error) throw error;
      if ($("profileMessage")) $("profileMessage").textContent = "تم حفظ بيانات المغسلة بنجاح في قاعدة البيانات.";
      toast("تم حفظ بيانات المغسلة في Supabase.");
    } catch (error) {
      console.error("GDC save settings failed:", error);
      if ($("profileMessage")) $("profileMessage").textContent = `تعذر الحفظ: ${error.message || "خطأ غير معروف"}`;
      toast(`تعذر حفظ البيانات: ${error.message || "خطأ غير معروف"}`, true);
    } finally { setBusy(false); }
  }

  function bindForms() {
    if ($("newProductBtn")) $("newProductBtn").onclick = () => openProductModal();
    if ($("modalClose")) $("modalClose").onclick = closeProductModal;
    if ($("cancelProduct")) $("cancelProduct").onclick = closeProductModal;
    if ($("modalShade")) $("modalShade").addEventListener("click", event => { if (event.target === $("modalShade")) closeProductModal(); });
    if ($("pImage")) $("pImage").addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { toast("اختر ملف صورة صالحًا.", true); return; }
      const objectUrl = URL.createObjectURL(file);
      $("imagePreview").innerHTML = `<img src="${objectUrl}" alt="عرض الصورة">`;
    });
    if ($("productForm")) $("productForm").addEventListener("submit", saveProduct);
    if ($("productSearch")) $("productSearch").addEventListener("input", renderProducts);
    if ($("categoryFilter")) $("categoryFilter").addEventListener("change", renderProducts);
    if ($("newCategoryBtn")) $("newCategoryBtn").onclick = () => openCategoryEditor("", "");
    if ($("categoryClose")) $("categoryClose").onclick = () => { $("categoryShade").classList.remove("show"); $("categoryEditingType").value = ""; };
    if ($("cancelCategory")) $("cancelCategory").onclick = () => { $("categoryShade").classList.remove("show"); $("categoryEditingType").value = ""; };
    if ($("categoryShade")) $("categoryShade").addEventListener("click", event => { if (event.target === $("categoryShade")) $("categoryShade").classList.remove("show"); });
    if ($("categoryForm")) $("categoryForm").addEventListener("submit", saveCategory);
    if ($("branchForm")) $("branchForm").addEventListener("submit", saveBranch);
    if ($("profileForm")) $("profileForm").addEventListener("submit", saveSettings);
    if ($("homeSlideUpload")) $("homeSlideUpload").addEventListener("change", event => addHomeSlide(event.target.files?.[0]));
  }

  async function initialize() {
    if (initialized) return;
    initialized = true;

    // Bind navigation independently of database readiness so dashboard links
    // still work even when the Supabase client is delayed or unavailable.
    bindNavigation();
    bindForms();

    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("view");
    const selectedView = validViews.includes(requestedView) ? requestedView : "overview";
    showView(selectedView, false);

    client = window.__GDC_SUPABASE_CLIENT__;
    if (!client) {
      setDbStatus("تعذر بدء الاتصال بقاعدة البيانات. يمكنك التنقل بين أقسام الإدارة، لكن الحفظ يحتاج إلى جلسة دخول نشطة.", "error");
      initialized = false;
      return;
    }

    try {
      await loadDatabase();
      await loadHomeSlides();
      showView(selectedView, false);

      // The overview's “Add new item” shortcut opens the creation form directly.
      if (selectedView === "products" && params.get("action") === "add") {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("action");
        history.replaceState(null, "", cleanUrl);
        openProductModal();
      }
    } catch (error) {
      console.error("GDC management data load failed:", error);
      setDbStatus(`تعذر تحميل بيانات الإدارة من Supabase: ${error.message || "خطأ غير معروف"}. تأكد من تنفيذ ملف GDC-MANAGEMENT-SUPABASE-SETUP.sql في SQL Editor.`, "error");
      toast("تعذر تحميل بعض البيانات. راجع رسالة الاتصال أعلى الصفحة.", true);
    }
  }

  window.addEventListener("granddryclean:authorized", initialize, { once: true });
  if (document.documentElement.dataset.grandDryCleanAuthorized === "true") initialize();
})();
