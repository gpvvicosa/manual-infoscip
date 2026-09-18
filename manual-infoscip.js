
(() => {
  const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const sidebar=qs('#sidebar'), backdrop=qs('#sidebarBackdrop'), menuBtn=qs('#menuBtn');
  const openMenu=()=>{sidebar.classList.add('open');backdrop.hidden=false;backdrop.classList.add('show');menuBtn?.setAttribute('aria-expanded','true');document.body.style.overflow='hidden'};
  const closeMenu=()=>{sidebar.classList.remove('open');backdrop.classList.remove('show');backdrop.hidden=true;menuBtn?.setAttribute('aria-expanded','false');document.body.style.overflow=''};
  menuBtn?.addEventListener('click',openMenu);qs('#openTocBtn')?.addEventListener('click',openMenu);qs('#closeMenuBtn')?.addEventListener('click',closeMenu);backdrop?.addEventListener('click',closeMenu);
  qsa('.toc-link').forEach(a=>a.addEventListener('click',()=>{if(innerWidth<=1040)closeMenu()}));
  qs('#printBtn')?.addEventListener('click',()=>window.print());

  // Active section in table of contents
  const navLinks=new Map(qsa('.toc-link').map(a=>[a.dataset.target,a]));
  const heads=qsa('.manual-heading[id]');
  if('IntersectionObserver' in window){
    const obs=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(!visible.length)return;
      const id=visible[0].target.id; qsa('.toc-link.active').forEach(x=>x.classList.remove('active'));
      navLinks.get(id)?.classList.add('active');
    },{rootMargin:'-90px 0px -74% 0px',threshold:[0,1]});
    heads.forEach(h=>obs.observe(h));
  }

  // Search with highlights; preserve original DOM by unwrapping prior marks.
  const input=qs('#searchInput'), controls=qs('#searchControls'), status=qs('#searchStatus');
  const content=qs('#manualContent'); let hits=[],current=-1;
  function clearMarks(){
    qsa('mark.search-hit',content).forEach(m=>m.replaceWith(document.createTextNode(m.textContent)));
    content.normalize(); hits=[];current=-1;
  }
  const fold=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR');
  function markQuery(query){
    clearMarks(); query=query.trim();
    if(!query){controls.hidden=true; return;}
    const walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
      if(node.parentElement?.closest('script,style,mark'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[]; while(walker.nextNode())nodes.push(walker.currentNode);
    const needle=fold(query);
    nodes.forEach(node=>{
      const txt=node.nodeValue, low=fold(txt); let idx=0,last=0; const frag=document.createDocumentFragment(); let found=false;
      while((idx=low.indexOf(needle,last))>-1){found=true;frag.append(document.createTextNode(txt.slice(last,idx)));const m=document.createElement('mark');m.className='search-hit';m.textContent=txt.slice(idx,idx+query.length);frag.append(m);last=idx+query.length;}
      if(found){frag.append(document.createTextNode(txt.slice(last)));node.replaceWith(frag);}
    });
    hits=qsa('mark.search-hit',content); controls.hidden=false;
    if(!hits.length){status.textContent='Nenhuma ocorrência encontrada';return;}
    current=0; showCurrent();
  }
  function showCurrent(){if(!hits.length)return;hits.forEach(h=>h.classList.remove('current'));const h=hits[current];h.classList.add('current');h.scrollIntoView({behavior:'smooth',block:'center'});status.textContent=`${current+1} de ${hits.length} ocorrências`;}
  function next(delta){if(!hits.length)return;current=(current+delta+hits.length)%hits.length;showCurrent()}
  let timer; input?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>markQuery(input.value),180)});
  input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next(e.shiftKey?-1:1)}});
  qs('#nextMatchBtn')?.addEventListener('click',()=>next(1)); qs('#prevMatchBtn')?.addEventListener('click',()=>next(-1));
  qs('#clearSearchBtn')?.addEventListener('click',()=>{input.value='';clearMarks();controls.hidden=true;input.focus()});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input?.focus()}if(e.key==='Escape'){closeMenu();closeLightbox();}});

  // Image lightbox
  const lb=qs('#lightbox'), lbImg=qs('#lightboxImage'), lbCap=qs('#lightboxCaption');
  function openLightbox(img,cap){lbImg.src=img.src;lbImg.alt=img.alt;lbCap.textContent=cap||img.alt;lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function closeLightbox(){if(!lb?.classList.contains('open'))return;lb.classList.remove('open');lb.setAttribute('aria-hidden','true');lbImg.src='';document.body.style.overflow=''}
  qsa('.image-zoom').forEach(b=>b.addEventListener('click',()=>openLightbox(qs('img',b),b.closest('figure')?.querySelector('figcaption')?.textContent)));
  qs('#lightboxClose')?.addEventListener('click',closeLightbox);lb?.addEventListener('click',e=>{if(e.target===lb)closeLightbox()});

  // back to top
  const topBtn=qs('#scrollTopBtn');addEventListener('scroll',()=>topBtn.classList.toggle('show',scrollY>800),{passive:true});topBtn?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
})();
