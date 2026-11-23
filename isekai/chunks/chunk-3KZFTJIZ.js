import{g as l}from"./chunk-2SFQWSQO.js";import{a as f}from"./chunk-AWTWMGB3.js";import{c as o,d as r}from"./chunk-GYX6BMMI.js";var d=1,S=(t,e)=>r(o(`sanitised
${t}
${d}
${e}`));function m(t){let{bytes:e,...i}=t,n=o(JSON.stringify(i)),s=new Uint8Array(4+n.length+e.length);return new DataView(s.buffer).setUint32(0,n.length,!0),s.set(n,4),s.set(e,4+n.length),s}function p(t){try{let e=new DataView(t.buffer,t.byteOffset,t.byteLength).getUint32(0,!0),i=JSON.parse(new TextDecoder().decode(t.subarray(4,4+e))),n=t.slice(4+e);return r(n)!==i.sha256?null:f(Object.freeze({...i,bytes:n}))}catch{return null}}async function k(t,e,i,n={}){let s=S(r(t),e),u=await i.get(s),c=u?p(u):null;if(c)return{ok:!0,model:c,fromCache:!0};let a=await l(t,e,n);return a.ok&&await i.put(s,"sanitised",m(a.model)),{...a,fromCache:!1}}export{d as a,k as b};
//# sourceMappingURL=chunk-3KZFTJIZ.js.map
