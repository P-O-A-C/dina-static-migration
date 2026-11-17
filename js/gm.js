// GM demo UI. No database connection is active in this temporary package.
const initialProducts = [
  {id:"p1",name:"قميص",category:"غسيل وكي",price:"",description:"غسيل وكي للقميص",active:true,icon:"👔",image:""},
  {id:"p2",name:"بنطلون",category:"غسيل وكي",price:"",description:"غسيل وكي للبنطلون",active:true,icon:"👖",image:""},
  {id:"p3",name:"بدلة",category:"تنظيف جاف",price:"",description:"تنظيف جاف للبدلة",active:true,icon:"🧥",image:""},
  {id:"p4",name:"فستان",category:"تنظيف جاف",price:"",description:"تنظيف وعناية بالفستان",active:true,icon:"👗",image:""},
  {id:"p5",name:"بطانية",category:"مفروشات",price:"",description:"تنظيف البطاطين",active:true,icon:"🛏️",image:""},
  {id:"p6",name:"ستارة",category:"مفروشات",price:"",description:"تنظيف الستائر",active:true,icon:"🪟",image:""}
];
let products = initialProducts.map(p=>({...p}));
let categories = ["غسيل وكي","تنظيف جاف","مفروشات"];
let currentImage = "";
const $ = id => document.getElementById(id);
const safe = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => v!=="" && Number.isFinite(Number(v)) ? `${Number(v).toLocaleString("ar-EG")} ج.م` : "لم يحدد";
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.view===id));if(id==="products")renderProducts();if(id==="categories")renderCategories();window.scrollTo(0,0);$("sidebar").classList.remove("open")}
document.querySelectorAll("[data-view]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showView(a.dataset.view)}));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
$("menuToggle").onclick=()=>$("sidebar").classList.toggle("open");
$("todayLabel").textContent=new Intl.DateTimeFormat("ar-EG",{dateStyle:"long"}).format(new Date());

function updateMetrics(){
  $("metricProducts").textContent=products.length;
  $("metricCategories").textContent=categories.length;
  $("metricPriced").textContent=products.filter(p=>p.price!==""&&Number(p.price)>0).length;
}
function productRow(p){
  const visual=p.image?`<img src="${p.image}" alt="">`:safe(p.icon||"♧");
  return `<tr><td><div class="product-cell"><span class="product-thumb">${visual}</span><b>${safe(p.name)}</b></div></td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td><span class="status ${p.active?"":"off"}">${p.active?"متاح":"مخفي"}</span></td><td><div class="row-actions"><button data-edit="${p.id}">تعديل</button><button class="delete" data-delete="${p.id}">حذف</button></div></td></tr>`;
}
function bindRowActions(){
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openProductModal(b.dataset.edit));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.delete);if(p&&confirm(`حذف الصنف "${p.name}" من المعاينة؟`)){products=products.filter(x=>x.id!==p.id);renderAll();toast("تم حذف الصنف من المعاينة")}})
}
function renderProducts(){
  const query=$("productSearch").value.trim().toLowerCase(), cat=$("categoryFilter").value;
  const list=products.filter(p=>(!cat||p.category===cat)&&(!query||p.name.toLowerCase().includes(query)));
  $("productRows").innerHTML=list.length?list.map(productRow).join(""):'<tr><td colspan="5">لا توجد أصناف مطابقة.</td></tr>';
  bindRowActions();
}
function renderOverview(){
  $("overviewRows").innerHTML=products.slice(0,6).map(p=>`<tr><td>${safe(p.name)}</td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td><span class="status ${p.active?"":"off"}">${p.active?"متاح":"مخفي"}</span></td></tr>`).join("");
}
function refreshCategoryOptions(){
  $("categoryFilter").innerHTML='<option value="">كل الأقسام</option>'+categories.map(c=>`<option>${safe(c)}</option>`).join("");
  $("pCategory").innerHTML=categories.map(c=>`<option>${safe(c)}</option>`).join("");
}
function renderCategories(){
  $("categoryCards").innerHTML=categories.map(c=>`<article class="category-card"><div><b>${safe(c)}</b><small>${products.filter(p=>p.category===c).length} صنف</small></div><button data-remove-category="${safe(c)}">حذف القسم</button></article>`).join("");
  document.querySelectorAll("[data-remove-category]").forEach(b=>b.onclick=()=>{
    const name=b.dataset.removeCategory;
    if(products.some(p=>p.category===name)){toast("انقل الأصناف إلى قسم آخر قبل حذف هذا القسم");return}
    categories=categories.filter(c=>c!==name);renderAll();toast("تم حذف القسم من المعاينة");
  });
}
function renderAll(){refreshCategoryOptions();renderProducts();renderOverview();renderCategories();updateMetrics()}
function openProductModal(id=""){
  $("productForm").reset();currentImage="";$("imagePreview").textContent="معاينة الصورة";
  $("editingId").value=id;
  const p=products.find(x=>x.id===id);
  $("productModalTitle").textContent=p?"تعديل الصنف":"إضافة صنف جديد";
  if(p){$("pName").value=p.name;$("pCategory").value=p.category;$("pPrice").value=p.price;$("pDescription").value=p.description;$("pActive").checked=p.active;currentImage=p.image||"";if(currentImage)$("imagePreview").innerHTML=`<img src="${currentImage}" alt="معاينة">`;}
  $("modalShade").classList.add("show");
}
function closeProductModal(){$("modalShade").classList.remove("show")}
$("newProductBtn").onclick=()=>openProductModal();
$("modalClose").onclick=closeProductModal;
$("cancelProduct").onclick=closeProductModal;
$("modalShade").addEventListener("click",e=>{if(e.target===$("modalShade"))closeProductModal()});
$("pImage").addEventListener("change",e=>{
  const file=e.target.files[0];if(!file)return;
  if(!file.type.startsWith("image/")){toast("اختر ملف صورة صالحًا");return}
  const reader=new FileReader();reader.onload=()=>{currentImage=reader.result;$("imagePreview").innerHTML=`<img src="${currentImage}" alt="معاينة الصورة">`};reader.readAsDataURL(file);
});
$("productForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("editingId").value||`p${Date.now()}`;
  const item={id,name:$("pName").value.trim(),category:$("pCategory").value,price:$("pPrice").value,description:$("pDescription").value.trim(),active:$("pActive").checked,icon:"♧",image:currentImage};
  const index=products.findIndex(p=>p.id===id);if(index>=0)products[index]=item;else products.push(item);
  closeProductModal();renderAll();toast("تم تحديث المعاينة — لم يتم الحفظ على الخادم");
});
$("productSearch").addEventListener("input",renderProducts);
$("categoryFilter").addEventListener("change",renderProducts);
$("newCategoryBtn").onclick=()=>{$("categoryForm").reset();$("categoryShade").classList.add("show")};
$("categoryClose").onclick=$("cancelCategory").onclick=()=>$("categoryShade").classList.remove("show");
$("categoryShade").addEventListener("click",e=>{if(e.target===$("categoryShade"))$("categoryShade").classList.remove("show")});
$("categoryForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("newCategoryName").value.trim();
  if(!name)return;if(categories.includes(name)){toast("هذا القسم موجود بالفعل");return}
  categories.push(name);$("categoryShade").classList.remove("show");renderAll();toast("تمت إضافة القسم للمعاينة");
});
$("profileForm").addEventListener("submit",e=>{e.preventDefault();$("profileMessage").textContent="تم حفظ التعديلات للمعاينة الحالية فقط. لم يتم إرسالها إلى قاعدة البيانات.";toast("حُفظت المعاينة")});
renderAll();