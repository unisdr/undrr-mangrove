(async()=>{
 await document.fonts.ready;
 const root=document.querySelector('#storybook-root > div'),markup=root.outerHTML,box=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
 const elements=[...root.querySelectorAll('main *, .mg-breadcrumb li')].filter(n=>n.getBoundingClientRect().width>0),diagnostics=[];
 function sourceId(n){const path=[];for(let p=n;p!==root;p=p.parentElement)path.unshift('node'+[...p.parentElement.children].indexOf(p));return 'root/'+path.join('/');}
 for(const n of elements)for(const pseudo of ['before','after']){
  const s=getComputedStyle(n,'::'+pseudo);if(['none','normal'].includes(s.content)||s.display==='none')continue;
  const style=Object.fromEntries([...s].map(k=>[k,s.getPropertyValue(k)])),beforeFragments=[...n.getClientRects()].map(box),beforeRect=box(n.getBoundingClientRect()),oldClass=n.getAttribute('class'),span=document.createElement('span'),hide=document.createElement('style'),cls='mg-landing-'+pseudo+'-mirror';
  try{
   for(const [k,v]of Object.entries(style))span.style.setProperty(k,v);
   if(s.content==='"\u2060"')span.textContent='\u2060';else if(s.content!=='""')throw Error('Unexpected source generated text');
   hide.textContent='.'+cls+'::'+pseudo+'{content:none!important;display:none!important}';document.head.appendChild(hide);n.classList.add(cls);pseudo==='before'?n.insertBefore(span,n.firstChild):n.appendChild(span);
   const mirroredFragments=[...n.getClientRects()].map(box),mirroredRect=box(n.getBoundingClientRect());
   if(JSON.stringify(beforeFragments)!==JSON.stringify(mirroredFragments)||JSON.stringify(beforeRect)!==JSON.stringify(mirroredRect))throw Error('Mirror changed owning source fragment/box');
   const originalTransform=span.style.transform;span.style.transform='none';const untransformedRect=box(span.getBoundingClientRect());span.style.transform=originalTransform;
   diagnostics.push({untransformedRect,ownerId:sourceId(n),pseudo,owner:beforeRect,sourceFragments:beforeFragments,mirroredFragments,rect:box(span.getBoundingClientRect()),style});
  }finally{span.remove();hide.remove();if(oldClass===null)n.removeAttribute('class');else n.setAttribute('class',oldClass);}
 }
 if(root.outerHTML!==markup)throw Error('Diagnostic left source markup changes');
 return JSON.stringify({viewport:{width:innerWidth,height:innerHeight},diagnostics,originalMarkupRestored:true,method:'Exact computed-style pseudo mirrors retain original owner rect/client fragments and restore all span/style/class changes. No native contour/compositing/raster acceptance.'});
})()
