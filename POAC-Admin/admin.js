(() => {
  "use strict";
  const CFG = window.POAC_GITHUB_ADMIN_CONFIG;
  const $ = (id) => document.getElementById(id);
  const state = { owner:"", repo:"", branch:"main", token:"", project:"dina", path:"", data:null, sha:"", original:"", collection:null, invalid:0 };
  const labels = {id:"المعرف",category_id:"معرف القسم",category_name:"القسم",name:"الاسم",item_name:"اسم الصنف",description:"الوصف",price:"السعر",price_display:"طريقة عرض السعر",image_url:"مسار الصورة",image_path:"مسار الصورة الداخلي",image_name:"اسم الصورة",icon:"الأيقونة",sort_order:"ترتيب العرض",status:"الحالة",is_active:"نشط",is_featured:"مميز في الرئيسية",phone:"رقم الهاتف",city:"المدينة",address:"العنوان",maps_url:"رابط الخرائط",map_url:"رابط الخرائط",latitude:"خط العرض",longitude:"خط الطول",note:"ملاحظة",alt_text:"وصف الصورة",business_name:"اسم النشاط",currency:"العملة",location_url:"رابط الموقع",updated_at:"آخر تحديث",created_at:"تاريخ الإضافة",ingredients:"المكونات",sizes:"الأحجام",extras:"الإضافات",allergen_notes:"ملاحظات الحساسية"};
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const now = () => new Date().toISOString();
  const isArrayData = () => Array.isArray(state.data);
  const list = () => isArrayData() ? state.data : [state.data];
  const pathFor = p => p.split("/").map(encodeURIComponent).join("/");
  function notify(message, error=false) { $("editorMessage").textContent=message||""; $("editorMessage").classList.toggle("error",!!error); }
  function connectMessage(message,error=false){$("connectStatus").textContent=message;$("connectStatus").style.color=error?"#b33b37":"#176b4b";}
  function endpoint(path){return `${CFG.apiBase}/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/contents/${pathFor(path)}`;}
  async function github(path, options={}) {
    const response = await fetch(path, { ...options, headers: {
      "Accept":"application/vnd.github+json",
      "Authorization":`Bearer ${state.token}`,
      "X-GitHub-Api-Version":"2022-11-28",
      ...(options.headers||{})
    }});
    const body = await response.json().catch(()=>({}));
    if(!response.ok){
      const apiMessage=String(body.message||`GitHub API error ${response.status}`);
      const remaining=response.headers.get("x-ratelimit-remaining");
      const reset=response.headers.get("x-ratelimit-reset");
      const retryAfter=response.headers.get("retry-after");
      const accepted=response.headers.get("x-accepted-github-permissions");
      const requestId=response.headers.get("x-github-request-id");
      const isRateLimited=response.status===429 || remaining==="0" || /rate limit|secondary rate limit/i.test(apiMessage);
      let guidance="";
      if(response.status===401){
        guidance="المفتاح غير صحيح أو منتهي. أنشئ Fine-grained token جديدًا وتأكد أنك أدخلت قيمته كاملة.";
      } else if(isRateLimited){
        if(retryAfter) guidance=`تجاوزت حدود الطلبات الثانوية. انتظر ${retryAfter} ثانية على الأقل قبل إعادة المحاولة.`;
        else if(remaining==="0" && reset){
          const resetAt=new Date(Number(reset)*1000);
          guidance=`انتهى الحد الأساسي للطلبات. انتظر حتى ${resetAt.toLocaleString("ar-EG",{timeZone:"UTC"})} بتوقيت UTC قبل إعادة المحاولة.`;
        } else guidance="قد يكون GitHub فرض حدًا ثانويًا. أوقف المحاولات وانتظر دقيقة على الأقل قبل المحاولة مرة أخرى.";
      } else if(response.status===403 && /resource not accessible|personal access token|integration/i.test(apiMessage)){
        guidance="المفتاح وصل إلى GitHub لكنه غير مخوّل لهذا المستودع أو للمسار المطلوب. راجع Resource owner، وحدد المستودع نفسه داخل Fine-grained token، واجعل Contents = Read and write. إذا كان المستودع تابعًا لمؤسسة، تحقق من موافقة المؤسسة على المفتاح.";
      } else if(response.status===403 && /protected branch|branch protection|ruleset/i.test(apiMessage)){
        guidance="الفرع محمي بقواعد تمنع هذا التعديل. راجع قواعد حماية الفرع أو استخدم فرعًا مسموحًا به؛ لا توسّع صلاحيات المفتاح لتجاوز الحماية.";
      } else if(response.status===403){
        guidance="رفض GitHub الطلب. قد يكون السبب سياسة مؤسسة، أو صلاحية المستودع، أو حماية الفرع، أو حدود الطلبات. راجع رسالة GitHub الأصلية أدناه.";
      } else if(response.status===404){
        guidance="المستودع أو الملف أو الفرع غير موجود، أو أن بيانات المالك/اسم المستودع غير صحيحة، أو أن المفتاح لا يملك حق رؤيته.";
      } else if(response.status===409 || response.status===422){
        guidance="تعذر تحديث الملف. قد تكون نسخة الملف تغيرت منذ تحميلها أو توجد قواعد تحقق تمنع الحفظ. أعد تحميل الملف واقرأ رسالة GitHub الأصلية.";
      } else {
        guidance="تعذر إكمال طلب GitHub. راجع التفاصيل أدناه.";
      }
      const diagnostics=[`HTTP ${response.status}`, `رسالة GitHub: ${apiMessage}`];
      if(remaining!==null) diagnostics.push(`الطلبات المتبقية في الحد الأساسي: ${remaining}`);
      if(retryAfter) diagnostics.push(`Retry-After: ${retryAfter} ثانية`);
      if(accepted) diagnostics.push(`الصلاحيات المطلوبة حسب GitHub: ${accepted}`);
      if(requestId) diagnostics.push(`Request ID: ${requestId}`);
      const err=new Error(`${guidance}\n\n${diagnostics.join("\n")}`);
      err.status=response.status; err.apiMessage=apiMessage; err.rateLimitRemaining=remaining; err.rateLimitReset=reset; err.retryAfter=retryAfter; err.acceptedPermissions=accepted; err.requestId=requestId;
      throw err;
    }
    return body;
  }
  function decodeContent(base64){
    const clean=String(base64||"").replace(/\s/g,"");
    const bytes=Uint8Array.from(atob(clean),c=>c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }
  function encodeContent(text){
    const bytes=new TextEncoder().encode(text); let binary="";
    for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    return btoa(binary);
  }
  async function getFile(path){
    const result=await github(`${endpoint(path)}?ref=${encodeURIComponent(state.branch)}`);
    if(!result.content) throw new Error(`ملف البيانات فارغ أو أكبر من الحد المدعوم: ${path}`);
    return {value:JSON.parse(decodeContent(result.content)),sha:result.sha};
  }
  let lastMutationAt=0;
  async function putEncodedFile(path, encodedContent, sha, message){
    const wait=Math.max(0,1100-(Date.now()-lastMutationAt));
    if(wait) await new Promise(resolve=>setTimeout(resolve,wait));
    const body={message,content:encodedContent,branch:state.branch};
    if(sha) body.sha=sha;
    const result=await github(endpoint(path),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    lastMutationAt=Date.now();
    return result;
  }
  async function putFile(path, content, sha, message){
    return putEncodedFile(path,encodeContent(content),sha,message);
  }
  function collectionFor(path){return CFG.collections[state.project].find(x=>x.path===path)||null;}
  function renderCollections(){
    $("projectLabel").textContent=state.project==="dina"?"DINA’S CORNER":"GRAND DRY CLEAN";
    document.querySelectorAll("[data-project]").forEach(b=>b.classList.toggle("active",b.dataset.project===state.project));
    $("collectionList").innerHTML=CFG.collections[state.project].map(c=>`<button type="button" class="collection-btn ${state.path===c.path?"active":""}" data-path="${esc(c.path)}"><strong>${esc(c.title)}</strong><small>${esc(c.path)}</small></button>`).join("");
    $("collectionList").querySelectorAll("[data-path]").forEach(b=>b.addEventListener("click",()=>loadCollection(b.dataset.path)));
  }
  async function connect(){
    const owner=$("ownerInput").value.trim(), repo=$("repoInput").value.trim(), branch=$("branchInput").value.trim()||"main", token=$("tokenInput").value.trim();
    if(!owner||!repo||!token){connectMessage("أكمل مالك المستودع واسم المستودع والمفتاح.",true);return;}
    if(!/^[A-Za-z0-9_.-]+$/.test(owner)||!/^[A-Za-z0-9_.-]+$/.test(repo)||!/^[A-Za-z0-9_.-]+$/.test(branch)){connectMessage("راجع صيغة المالك والمستودع والفرع.",true);return;}
    state.owner=owner;state.repo=repo;state.branch=branch;state.token=token;
    $("connectBtn").disabled=true;connectMessage("جارٍ التحقق من صلاحية المستودع…");
    try{
      const info=await github(`${CFG.apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
      const branchInfo=await github(`${CFG.apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`);
      $("connectPanel").hidden=true;$("workspace").hidden=false;$("lockBtn").hidden=false;
      $("repoStatus").textContent=`${info.full_name||owner+'/'+repo} · الفرع ${branchInfo.name||branch}`;
      renderCollections();
      const first=CFG.collections[state.project][0]; if(first) loadCollection(first.path);
    }catch(error){state.token="";connectMessage(error.message,true);}
    finally{$("connectBtn").disabled=false;$("tokenInput").value="";}
  }
  async function loadCollection(path){
    state.path=path;state.collection=collectionFor(path);renderCollections();
    $("collectionTitle").textContent=state.collection?.title||path;$("filePath").textContent=path;
    $("rows").innerHTML="";$("emptyState").hidden=false;$("emptyState").textContent="جارٍ تحميل بيانات GitHub…";
    $("saveBtn").disabled=true;$("addRowBtn").disabled=true;$("reloadBtn").disabled=true;notify("");
    try{
      const result=await getFile(path);state.data=result.value;state.sha=result.sha;state.original=JSON.stringify(state.data);state.invalid=0;
      if(!Array.isArray(state.data)&&(!state.data||typeof state.data!=="object")) throw new Error("صيغة البيانات غير مدعومة.");
      renderRows();$("reloadBtn").disabled=false;$("addRowBtn").disabled=!Array.isArray(state.data);updateSaveState();
      $("statusLine").textContent="تم تحميل الملف من المستودع.";
    }catch(error){state.data=null;state.sha="";$("emptyState").textContent=error.message;notify(error.message,true);$("statusLine").textContent="تعذر تحميل الملف.";}
  }
  function updateSaveState(){
    state.invalid=document.querySelectorAll(".field input.invalid,.field textarea.invalid").length;
    const changed=state.data!==null&&JSON.stringify(state.data)!==state.original;
    $("saveBtn").disabled=!changed||state.invalid>0;
    $("recordCount").textContent=state.data===null?"":`${list().length} سجل`;
    if(state.invalid>0) notify("يوجد حقل بصيغة غير صحيحة. راجع الحقول المظللة.",true);
    else if($("editorMessage").textContent.includes("حقل بصيغة غير صحيحة")) notify("");
  }
  function fieldInput(index,key,value){
    const type=Array.isArray(value)|| (value!==null&&typeof value==="object")?"json":value===null?"nullable":typeof value;
    const long=(typeof value==="string"&& (value.length>90||["description","address","ingredients","allergen_notes","note"].includes(key)))||type==="json"||key==="sizes"||key==="extras";
    const disabled=["id","created_at"].includes(key);
    const label=labels[key]||key;
    if(type==="boolean") return `<label class="field check"><input type="checkbox" data-i="${index}" data-k="${esc(key)}" data-kind="boolean" ${value?"checked":""}><span>${esc(label)}</span></label>`;
    const raw=type==="json"?JSON.stringify(value,null,2):value===null?"":String(value);
    const cls=(long?"wide ":"")+(disabled?"readonly":"");
    const input=long?`<textarea data-i="${index}" data-k="${esc(key)}" data-kind="${type}" ${disabled?"readonly":""}>${esc(raw)}</textarea>`:`<input data-i="${index}" data-k="${esc(key)}" data-kind="${type}" value="${esc(raw)}" ${disabled?"readonly":""} ${type==="number"?'type="number" step="any"':'type="text"'}>`;
    return `<label class="field ${cls}"><span>${esc(label)}</span>${input}</label>`;
  }
  function renderRows(){
    if(state.data===null){$("emptyState").hidden=false;return;}
    const rows=list();$("emptyState").hidden=rows.length>0;$("emptyState").textContent=rows.length?"":"لا توجد سجلات حاليًا. اضغط إضافة سجل للبدء.";
    $("rows").innerHTML=rows.map((row,i)=>{
      const fields=Object.entries(row||{}).map(([key,value])=>fieldInput(i,key,value)).join("");
      const image=row?.image_url||row?.image_path||"";
      const canUpload=Boolean(state.collection?.images)&&(Object.prototype.hasOwnProperty.call(row||{},"image_url")||Object.prototype.hasOwnProperty.call(row||{},"image_path"));
      const imageBlock=canUpload?`<div class="image-tools">${image?`<img src="${esc(image)}" alt="" loading="lazy">`:"<span>لا توجد صورة مرتبطة بهذا السجل.</span>"}<span>${esc(image)}</span><label class="mini">رفع / استبدال الصورة<input type="file" accept="image/*" data-upload="${i}" hidden></label></div>`:"";
      const title=row?.name||row?.item_name||row?.business_name||row?.alt_text||`سجل ${i+1}`;
      return `<article class="record"><div class="record-top"><strong>${esc(title)}</strong><div class="record-actions">${Array.isArray(state.data)?`<button type="button" class="mini danger" data-delete="${i}">حذف السجل</button>`:""}</div></div><div class="fields">${fields}</div>${imageBlock}</article>`;
    }).join("");
    $("rows").querySelectorAll("[data-i]").forEach(el=>el.addEventListener("change",()=>updateField(el)));
    $("rows").querySelectorAll("[data-delete]").forEach(el=>el.addEventListener("click",()=>{const i=Number(el.dataset.delete);const row=list()[i];const title=row?.name||row?.item_name||"هذا السجل";if(!confirm(`هل تريد حذف ${title} من ملف GitHub؟`))return;state.data.splice(i,1);renderRows();updateSaveState();}));
    $("rows").querySelectorAll("[data-upload]").forEach(el=>el.addEventListener("change",()=>uploadImage(Number(el.dataset.upload),el.files?.[0])));
  }
  function updateField(el){
    const i=Number(el.dataset.i),key=el.dataset.k,kind=el.dataset.kind,row=list()[i];if(!row)return;
    try{
      let value;
      if(kind==="boolean") value=el.checked;
      else if(kind==="number") value=el.value===""?null:Number(el.value);
      else if(kind==="json") value=el.value.trim()===""?null:JSON.parse(el.value);
      else if(kind==="nullable") value=el.value===""?null:el.value;
      else value=el.value;
      row[key]=value;el.classList.remove("invalid");
    }catch(_){el.classList.add("invalid");}
    updateSaveState();
  }
  function addRow(){
    if(!Array.isArray(state.data))return;
    const first=state.data[0];
    const row=first?JSON.parse(JSON.stringify(first)):{id:crypto.randomUUID(),name:"سجل جديد",is_active:true,sort_order:10,created_at:now(),updated_at:now()};
    row.id=crypto.randomUUID();
    if("name" in row)row.name="اسم جديد";if("item_name" in row)row.item_name="صنف جديد";if("business_name" in row)row.business_name="اسم النشاط";
    if("created_at" in row)row.created_at=now();if("updated_at" in row)row.updated_at=now();
    if("sort_order" in row)row.sort_order=Math.max(0,...state.data.map(x=>Number(x.sort_order)||0))+10;
    if("is_active" in row)row.is_active=true;if("status" in row)row.status="active";
    for(const key of ["image_url","image_path","image_name"])if(key in row)row[key]="";
    state.data.push(row);renderRows();updateSaveState();
  }
  function fileBase64(file){return file.arrayBuffer().then(buffer=>{const bytes=new Uint8Array(buffer);let binary="";for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);});}
  async function uploadImage(index,file){
    if(!file)return;
    if(!file.type.startsWith("image/")){notify("اختر ملف صورة فقط.",true);return;}
    if(file.size>CFG.maxImageBytes){notify("الحد الأقصى للصورة 8 ميجابايت.",true);return;}
    try{
      notify("جارٍ رفع الصورة مباشرة إلى المستودع…");
      const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
      const safeBase=(file.name.replace(/\.[^.]+$/," ").trim().replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g,"-").replace(/-+/g,"-").slice(0,35)||"image");
      const stamp=new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,14);
      const fileName=`${stamp}-${crypto.randomUUID().slice(0,8)}-${safeBase}.${ext}`;
      const repoPath=`${state.collection.images}/${fileName}`;
      const valuePath=`${state.collection.valuePrefix||state.collection.images}/${fileName}`.replace(/^images\/admin-uploads/,'images/admin-uploads').replace(/^GrandDryClean\//,'');
      await putEncodedFile(repoPath, await fileBase64(file), null, `POAC admin: upload ${fileName}`);
      const row=list()[index];if("image_url" in row)row.image_url=valuePath;if("image_path" in row)row.image_path=valuePath;if("image_name" in row)row.image_name=fileName;
      renderRows();updateSaveState();notify("تم رفع الصورة إلى GitHub. اضغط حفظ في GitHub لحفظ مسارها داخل ملف البيانات.");
    }catch(error){notify(error.message,true);}
  }
  async function save(){
    try{
      if(state.invalid){notify("أصلح الحقول غير الصحيحة قبل الحفظ.",true);return;}
      $("saveBtn").disabled=true;notify("جارٍ حفظ ملف البيانات وإنشاء Commit في GitHub…");
      const content=JSON.stringify(state.data,null,2)+"\n";
      const result=await putFile(state.path,content,state.sha,`POAC admin: update ${state.path}`);
      state.sha=result.content?.sha||result.commit?.sha||state.sha;state.original=JSON.stringify(state.data);
      updateSaveState();notify("تم الحفظ في GitHub بنجاح. صفحات GitHub Pages ستعرض البيانات بعد اكتمال النشر.");
      $("statusLine").textContent=`آخر حفظ: ${new Date().toLocaleString("ar-EG")}`;
    }catch(error){notify(error.message,true);$("saveBtn").disabled=false;}
  }
  function lock(){state.token="";state.data=null;state.sha="";state.path="";$("workspace").hidden=true;$("connectPanel").hidden=false;$("lockBtn").hidden=true;$("rows").innerHTML="";$("connectStatus").textContent="تم قفل لوحة الإدارة ومسح المفتاح من الذاكرة.";$("tokenInput").value="";}
  $("connectBtn").addEventListener("click",connect);
  $("tokenInput").addEventListener("keydown",e=>{if(e.key==="Enter")connect();});
  $("lockBtn").addEventListener("click",lock);
  $("reloadBtn").addEventListener("click",()=>state.path&&loadCollection(state.path));
  $("addRowBtn").addEventListener("click",addRow);
  $("saveBtn").addEventListener("click",save);
  document.querySelectorAll("[data-project]").forEach(btn=>btn.addEventListener("click",()=>{state.project=btn.dataset.project;state.path="";state.data=null;state.sha="";$("rows").innerHTML="";$("emptyState").hidden=false;$("emptyState").textContent="اختر ملف بيانات من القائمة.";$("collectionTitle").textContent="اختر ملفًا";$("filePath").textContent="";$("saveBtn").disabled=true;$("addRowBtn").disabled=true;$("reloadBtn").disabled=true;notify("");renderCollections();}));
  window.addEventListener("pagehide",()=>{state.token="";});
})();
