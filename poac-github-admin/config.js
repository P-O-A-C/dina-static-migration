/* POAC GitHub-only admin. No server, Worker, Supabase, or external backend. */
window.POAC_GITHUB_ADMIN_CONFIG = Object.freeze({
  apiBase: "https://api.github.com",
  maxImageBytes: 8 * 1024 * 1024,
  collections: {
    dina: [
      { id: "menu-items", title: "منتجات المنيو والأسعار", path: "data/menu-items.json", images: "images/admin-uploads" },
      { id: "menu-categories", title: "أقسام المنيو وصورها", path: "data/menu-categories.json", images: "images/admin-uploads" },
      { id: "featured", title: "المنتجات المميزة في الرئيسية", path: "data/home-featured-products.json", images: "images/admin-uploads" },
      { id: "locations", title: "الفروع والمواقع", path: "data/locations.json" }
    ],
    gdc: [
      { id: "service-items", title: "الخدمات والأسعار والصور", path: "GrandDryClean/data/service-items.json", images: "GrandDryClean/assets/admin-uploads", valuePrefix: "assets/admin-uploads" },
      { id: "service-categories", title: "تصنيفات الخدمات", path: "GrandDryClean/data/service-categories.json" },
      { id: "ironing", title: "أسعار الكي فقط", path: "GrandDryClean/data/ironing-prices.json" },
      { id: "branches", title: "الفروع والمواقع", path: "GrandDryClean/data/branches.json" },
      { id: "settings", title: "بيانات المغسلة والتواصل", path: "GrandDryClean/data/settings.json", object: true },
      { id: "slides", title: "صور السلايدر الرئيسية", path: "GrandDryClean/data/home-slides.json", images: "GrandDryClean/assets/slides", valuePrefix: "assets/slides" }
    ]
  }
});
