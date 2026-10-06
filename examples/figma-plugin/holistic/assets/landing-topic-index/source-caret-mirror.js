(async()=>{
 await document.fonts.ready;
 const box=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
 const main=document.querySelector('main'),markup=main.outerHTML;
 const diagnostics=[];
 for(const a of main.querySelectorAll('.mg-card__title a')){
  const card=a.closest('.mg-card'),s=getComputedStyle(a,'::after');
  if(s.content==='none'||s.display==='none')throw Error('Missing authored source caret');
  const styles=Object.fromEntries([...s].map(k=>[k,s.getPropertyValue(k)]));
  const original=[...a.getClientRects()].map(box),span=document.createElement('span'),hide=document.createElement('style'),oldClass=a.getAttribute('class');
  try{
   for(const [k,v]of Object.entries(styles))span.style.setProperty(k,v);
   span.textContent='\u2060';hide.textContent='.mg-landing-caret-diagnostic::after{content:none!important;display:none!important}';document.head.appendChild(hide);a.classList.add('mg-landing-caret-diagnostic');a.appendChild(span);
   const mirrored=[...a.getClientRects()].map(box);if(JSON.stringify(original)!==JSON.stringify(mirrored))throw Error('Mirror changed original anchor fragments');
   diagnostics.push({title:a.textContent.slice(0,-1),href:a.getAttribute('href'),card:box(card.getBoundingClientRect()),anchor:box(a.getBoundingClientRect()),sourceFragments:original,mirroredFragments:mirrored,caret:box(span.getBoundingClientRect()),sourceAfter:styles});
  }finally{span.remove();hide.remove();if(oldClass===null)a.removeAttribute('class');else a.setAttribute('class',oldClass);}
 }
 if(main.outerHTML!==markup)throw Error('Diagnostic left source markup changes');
 return JSON.stringify({viewport:{width:innerWidth,height:innerHeight},diagnostics,originalMarkupRestored:true,method:'Ephemeral exact computed-style pseudo mirror; original anchor fragment arrays matched, then span/style/classes removed exactly. Native vector/caret/reflow pixels not accepted.'});
})()
