'use strict';
// External proposal only. The caller owns target/file/PAGE fences and phase timing.
function sourcePlans(records, validateGradient) {
  const out=[],seen=new Set();
  for(const r of records){
    if(!r||typeof r.key!=='string'||!r.key.trim()||typeof r.ownerKey!=='string'||!r.ownerKey.trim()||!r.tree)throw Error('Blend source identity required');
    if(r.tree.blendMode===undefined)continue;
    if(seen.has(r.key))throw Error('Duplicate blend source identity');seen.add(r.key);
    if(r.tree.blendMode!=='MULTIPLY'||r.tree.type!=='FRAME'||!r.tree.gradient||r.tree.image||r.tree.fill||r.tree.children?.length)throw Error('Opt-in MULTIPLY requires source gradient leaf FRAME');
    if(typeof validateGradient!=='function')throw Error('Production gradient source validation callback required');
    validateGradient(r.tree);
    out.push(Object.freeze({key:r.key,ownerKey:r.ownerKey,value:'MULTIPLY'}));
  }
  return Object.freeze(out);
}
function children(n){return 'children' in n ? n.children : [];}
function descendants(n){const out=[];for(const c of children(n)||[]){out.push(c);out.push(...descendants(c));}return out;}
function nearest(n,type){for(let p=n.parent;p;p=p.parent)if(p.type===type)return p;return null;}
async function preflight(plans,ctx){
  if(!plans.length)return {scope:'No selected blend source plans',checkedMains:0,checkedInstances:0};
  const reject=s=>{throw Error('Source node blend: '+s);};
  const mainIds=new Map();let count=0,instanceIds=null,currentInstances=null;
  function instanceInventory(){const rows=ctx.instances();if(!Array.isArray(rows))reject('Invalid INSTANCE inventory');const map=new Map();for(const n of rows){if(!n||n.type!=='INSTANCE'||typeof n.id!=='string'||!n.id.trim()||typeof n.getMainComponentAsync!=='function'||map.has(n.id))reject('Invalid/duplicate INSTANCE inventory');map.set(n.id,n);}return map;}
  function checkInstanceMembership(){currentInstances=instanceInventory();const ids=[...currentInstances.keys()].sort();if(instanceIds!==null&&JSON.stringify(ids)!==JSON.stringify(instanceIds))reject('Current-page INSTANCE inventory changed during preflight');return ids;}
  function mainFor(p){const a=ctx.mainByKey(p.ownerKey);if(!Array.isArray(a)||a.length>1)reject('Duplicate/invalid COMPONENT owner');const n=a[0];if(n&&(n.type!=='COMPONENT'||!n.id||ctx.identity(n)!==p.ownerKey))reject('Wrong actual COMPONENT source owner');return n;}
  function leaf(root,p,instance){const hits=descendants(root).filter(n=>ctx.identity(n)===p.key&&nearest(n,instance?'INSTANCE':'COMPONENT')?.id===root.id);if(hits.length!==1)reject('Missing/duplicate owned gradient leaf '+p.key);const n=hits[0];if(n.type!=='FRAME'||typeof n.id!=='string'||!n.id||n.blendMode!==p.value)reject('Native owned blend drift '+p.key);return n;}
  function sync(){ctx.assertScope();if(instanceIds!==null)checkInstanceMembership();for(const p of plans){const m=mainFor(p);const orphan=ctx.nodesByKey(p.key).filter(n=>!nearest(n,'INSTANCE'));if(!m){if(orphan.length)reject('Orphan owned gradient leaf');continue;}const l=leaf(m,p,false);if(orphan.length!==1||orphan[0].id!==l.id)reject('Foreign/duplicate gradient ownership');if(mainIds.has(p.ownerKey)&&mainIds.get(p.ownerKey)!==m.id)reject('Main ID changed');mainIds.set(p.ownerKey,m.id);}}
  sync();
  instanceIds=checkInstanceMembership();
  for(const inst of [...currentInstances.values()]){
    if(inst.type!=='INSTANCE'||typeof inst.id!=='string'||!inst.id)reject('Invalid INSTANCE inventory');
    ctx.assertScope();const main=await inst.getMainComponentAsync();sync();
    if(!main)continue;
    for(const p of plans){if(mainIds.get(p.ownerKey)!==main.id)continue;if(main.type!=='COMPONENT'||ctx.identity(main)!==p.ownerKey)reject('Linked main source identity changed');leaf(currentInstances.get(inst.id),p,true);count++;}
  }
  sync();
  return {scope:'Exact selected source COMPONENTs and linked loaded current-page INSTANCEs; sequential checks only',checkedMains:mainIds.size,checkedInstanceLeaves:count};
}
function apply(node,plan,ctx){
  if(!plan)return;
  ctx.assertScope();
  const owner=nearest(node,'COMPONENT');
  if(node.type!=='FRAME'||ctx.identity(node)!==plan.key||!owner||ctx.identity(owner)!==plan.ownerKey)throw Error('Source node blend: apply owner mismatch');
  const expected=ctx.fresh?'PASS_THROUGH':'MULTIPLY';
  if(node.blendMode!==expected)throw Error('Source node blend: unexpected before-set value');
  if(typeof ctx.recordAttempt!=='function')throw Error('Source node blend: setter attempt journal required');
  ctx.recordAttempt({nodeId:node.id,key:plan.key,before:expected,after:plan.value});
  node.blendMode=plan.value;
  if(node.blendMode!==plan.value)throw Error('Source node blend: setter readback mismatch');
}
module.exports={sourcePlans,preflight,apply};
