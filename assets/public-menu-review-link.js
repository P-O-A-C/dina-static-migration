/* Optional branch-specific Google Maps review link: ?location_id=<branch-id> */
(function(){
  'use strict';
  const link=document.getElementById('publicMenuReviewLink');
  if(!link||!window.sb)return;
  const params=new URLSearchParams(window.location.search);
  const locationId=(params.get('location_id')||params.get('branch_id')||'').trim();
  if(!locationId)return;
  const isHttpsUrl=value=>{try{return new URL(String(value||'')).protocol==='https:';}catch(_){return false;}};
  (async function(){
    try{
      const {data,error}=await window.sb.from('locations')
        .select('id,name,city,address,maps_url,is_active')
        .eq('id',locationId).eq('is_active',true).maybeSingle();
      if(error||!data)return;
      const destination=window.DinaBranchMaps?.resolve(data) || '';
      if(!isHttpsUrl(destination))return;
      link.href=destination;
      link.hidden=false;
      link.setAttribute('aria-label','رأيك يهمنا - افتح موقع '+String(data.name||'الفرع')+' على Google Maps');
    }catch(_){link.hidden=true;}
  })();
})();
