'use strict';const assert=require('assert/strict');
const api=require('./node-blend-capability-indexed.cjs');const ownerKey='family/a/variant/source',key=ownerKey+'/gradient';const plans=api.sourcePlans([{ownerKey,key,tree:{type:'FRAME',blendMode:'MULTIPLY',gradient:{layers:[]}}}],()=>{});
function env(){const main={id:'main',type:'COMPONENT',stamp:ownerKey,children:[]},leaf={id:'leaf',type:'FRAME',stamp:key,parent:main,blendMode:'MULTIPLY',children:[]};main.children=[leaf];const rows=[],leaves=[leaf],attempts=[];
 function make(id,value='MULTIPLY'){const n={id,type:'INSTANCE',children:[],getMainComponentAsync:async()=>main},l={id:id+'/leaf',type:'FRAME',stamp:key,parent:n,children:[],blendMode:value};n.children=[l];leaves.push(l);return n;}
 const i1=make('i1'),i2=make('i2');rows.push(i1,i2);const ctx={assertScope(){},refreshInventory(){},identity:n=>n.stamp||'',mainByKey:()=>[main],nodesByKey:()=>leaves.slice(),instances:()=>rows.slice(),recordAttempt:a=>attempts.push(a)};return{main,leaf,rows,leaves,i1,i2,ctx,make,attempts};}
(async()=>{
 let cases=0;for(const mutate of [e=>{e.rows.push(e.make('late','NORMAL'));},e=>e.rows.pop(),e=>{e.rows[1]=e.make('replacement','NORMAL');}]){const e=env();e.i1.getMainComponentAsync=async()=>{mutate(e);return e.main;};await assert.rejects(api.preflight(plans,e.ctx),/inventory changed/);assert.deepEqual(e.attempts,[]);cases++;}
 const duplicate=env();duplicate.rows.push(duplicate.i1);await assert.rejects(api.preflight(plans,duplicate.ctx),/duplicate INSTANCE inventory/);assert.deepEqual(duplicate.attempts,[]);cases++;
 const proxy=env();proxy.ctx.instances=()=>proxy.rows.map(n=>({...n}));const r=await api.preflight(plans,proxy.ctx);assert.equal(r.checkedInstanceLeaves,2);assert.deepEqual(proxy.attempts,[]);
 const badFresh=env();badFresh.ctx.instances=()=>badFresh.rows.map(n=>({...n}));badFresh.i1.getMainComponentAsync=async()=>{badFresh.i2.children[0].blendMode='NORMAL';return badFresh.main;};await assert.rejects(api.preflight(plans,badFresh.ctx),/blend drift/);assert.deepEqual(badFresh.attempts,[]);cases++;
 console.log('PASS '+cases+' zero-setter late/add/remove/same-count-replacement/duplicate/current-proxy-leaf refusals; stable typed equivalent-ID inventory accepted');
})().catch(e=>{console.error(e);process.exitCode=1});
