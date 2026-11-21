(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const section=$('dcBestSellers'),track=$('dcBestSellersTrack');
  const lightbox=$('dcBestSellersLightbox'),lightboxImage=$('dcBestSellersLightboxImage');
  if(!section||!track)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  let items=[];
  let activeIndex=0;
  let autoplayTimer=0;
  let scrollSyncTimer=0;

  function getCards(){return Array.from(track.querySelectorAll('.dc-best-sellers__card'));}

  function goToSlide(index){
    const cards=getCards();
    if(cards.length<2)return;
    activeIndex=((index%cards.length)+cards.length)%cards.length;
    const trackRect=track.getBoundingClientRect();
    const cardRect=cards[activeIndex].getBoundingClientRect();
    const targetLeft=track.scrollLeft+(cardRect.left-trackRect.left);
    const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({left:targetLeft,behavior:reduceMotion?'auto':'smooth'});
  }

  function startAutoplay(){
    window.clearInterval(autoplayTimer);
    activeIndex=0;
    if(getCards().length<2)return;
    autoplayTimer=window.setInterval(()=>{
      if(document.hidden||(lightbox&&!lightbox.hidden))return;
      const cards=getCards();
      if(cards.length<2){window.clearInterval(autoplayTimer);return;}
      goToSlide(activeIndex+1);
    },2000);
  }

  track.addEventListener('scroll',()=>{
    window.clearTimeout(scrollSyncTimer);
    scrollSyncTimer=window.setTimeout(()=>{
      const cards=getCards();
      if(!cards.length)return;
      activeIndex=Math.max(0,Math.min(cards.length-1,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))));
    },100);
  },{passive:true});
  function openPreview(item){
    if(!lightbox)return;
    lightboxImage.src=item.image_url;lightboxImage.alt='Dina’s Corner best seller';lightbox.hidden=false;document.body.style.overflow='hidden';
    $('dcBestSellersLightboxClose')?.focus();
  }
  function closePreview(){if(!lightbox)return;lightbox.hidden=true;lightboxImage.removeAttribute('src');document.body.style.overflow='';}
  function render(){
    const visible=items.filter(item=>item&&item.image_url);
    if(!visible.length){
      section.hidden=false;
      track.innerHTML='<div class="dc-best-sellers__empty" aria-live="polite"></div>';
      return;
    }
    track.innerHTML=visible.map((item,index)=>'<button class="dc-best-sellers__card" type="button" data-best-index="'+index+'" aria-label="View featured product photo '+(index+1)+'"><img src="'+esc(item.image_url)+'" alt="Dina’s Corner best seller" loading="'+(index<2?'eager':'lazy')+'" decoding="async"></button>').join('');
    track.querySelectorAll('[data-best-index]').forEach(button=>button.addEventListener('click',()=>{
      const item=visible[Number(button.dataset.bestIndex)];if(item)openPreview(item);
    }));
    track.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{
      const card=image.closest('.dc-best-sellers__card');if(card)card.remove();
      if(!track.querySelector('.dc-best-sellers__card'))section.hidden=true;
      startAutoplay();
    },{once:true}));
    section.hidden=false;
    startAutoplay();
  }
  async function load(){
    try{
      const client=window.sb;
      if(!client||typeof client.from!=='function')throw new Error('Supabase client unavailable');
      const {data,error}=await client.from('home_featured_products')
        .select('id,image_url,sort_order')
        .eq('is_active',true).order('sort_order',{ascending:true}).limit(24);
      if(error)throw error;
      items=Array.isArray(data)?data:[];render();
    }catch(error){
      section.hidden=false;
      track.innerHTML='<div class="dc-best-sellers__empty" aria-live="polite"></div>';
      console.warn('Welcome Best Sellers could not be loaded. Check the public read policy for home_featured_products.',error);
    }
  }
  $('dcBestSellersLightboxClose')?.addEventListener('click',closePreview);
  lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closePreview();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&lightbox&&!lightbox.hidden)closePreview();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else void load();
})();
