const initialCatalogItems = [
  {name:"قميص",category:"غسيل وكي",price:"—"},
  {name:"بنطلون",category:"غسيل وكي",price:"—"},
  {name:"بدلة",category:"تنظيف جاف",price:"—"},
  {name:"فستان",category:"تنظيف جاف",price:"—"},
  {name:"بطانية",category:"مفروشات",price:"—"},
  {name:"ستارة",category:"مفروشات",price:"—"}
];
const table = document.getElementById("itemsTable");
function renderItems(){
  table.innerHTML = initialCatalogItems.map(item=>`<tr><td>${safe(item.name)}</td><td>${safe(item.category)}</td><td>${safe(item.price)} ${item.price==="—"?"":"ج.م"}</td><td><span class="table-status">متاح</span></td></tr>`).join("");
  document.getElementById("itemsCount").textContent=initialCatalogItems.length;
}
function safe(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
const backdrop=document.getElementById("modalBackdrop");
document.getElementById("addItemBtn").onclick=()=>backdrop.classList.add("show");
document.getElementById("closeModal").onclick=()=>backdrop.classList.remove("show");
backdrop.addEventListener("click",e=>{if(e.target===backdrop)backdrop.classList.remove("show")});
document.getElementById("itemForm").addEventListener("submit",e=>{
  e.preventDefault();
  initialCatalogItems.push({name:document.getElementById("itemName").value.trim(),category:document.getElementById("itemCategory").value.trim(),price:document.getElementById("itemPrice").value});
  renderItems(); e.target.reset(); backdrop.classList.remove("show");
});
renderItems();