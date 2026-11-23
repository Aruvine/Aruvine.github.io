import{f as D}from"./chunk-VYESJRGO.js";import{J as H,La as _,Ra as U,X as M,qa as F,s as R,sa as y,ta as S,w as N}from"./chunk-4ZGMG5FA.js";import"./chunk-XAWE4EAK.js";var v={seconds:.9,rise:.6,size:.18},G={normal:"#ffffff",blocked:"#9fb3c8",weak:"#ffb43c",sure:"#ff5a8a"},L=4,A=[[".###.","#...#","#..##","#.#.#","##..#","#...#",".###."],["..#..",".##..","..#..","..#..","..#..","..#..",".###."],[".###.","#...#","....#","...#.","..#..",".#...","#####"],["#####","...#.","..#..","...#.","....#","#...#",".###."],["...#.","..##.",".#.#.","#..#.","#####","...#.","...#."],["#####","#....","####.","....#","....#","#...#",".###."],["..##.",".#...","#....","####.","#...#","#...#",".###."],["#####","....#","...#.","..#..",".#...",".#...",".#..."],[".###.","#...#","#...#",".###.","#...#","#...#",".###."],[".###.","#...#","#...#",".####","....#","...#.",".##.."]],f=7,h=9,p=4,T=A.length*f*p,C=h*p;function B(){let i=new Uint8Array(T*C*4),g=(s,r,o)=>r>=1&&r<=5&&o>=1&&o<=7&&A[s][o-1][r-1]==="#";for(let s=0;s<A.length;s++)for(let r=0;r<h;r++)for(let o=0;o<f;o++){let c=0;if(g(s,o,r))c=2;else for(let l=-1;l<=1&&!c;l++)for(let a=-1;a<=1;a++)if(g(s,o+a,r+l)){c=1;break}if(c)for(let l=0;l<p;l++)for(let a=0;a<p;a++){let E=(s*f+o)*p+a,t=((C-1-(r*p+l))*T+E)*4,m=c===2?255:0;i[t]=m,i[t+1]=m,i[t+2]=m,i[t+3]=255}}return i}function K(i){let g=Number.isFinite(i)?Math.round(Math.abs(i)):0;return String(Math.min(g,10**L-1))}var I=`
attribute vec3 iAnchor;
attribute vec2 iGlyph;
attribute vec4 iColor;
uniform float uSize;
varying vec2 vUv;
varying vec4 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(iAnchor, 1.0);
  mv.xy += vec2(position.x + iGlyph.y, position.y) * uSize;
  gl_Position = projectionMatrix * mv;
  vUv = vec2((iGlyph.x + uv.x) / ${A.length}.0, uv.y);
  vColor = iColor;
}`,z=`
uniform sampler2D uAtlas;
varying vec2 vUv;
varying vec4 vColor;
void main() {
  vec4 t = texture2D(uAtlas, vUv);
  float a = t.a * vColor.a;
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor.rgb * t.r, a);
}`;function V(i){let g=D[i.tier]??D.standalone,s=g*L,r=new _(f/h,1);r.translate(f/h/2,.5,0);let o=new y(new Float32Array(s*3),3),c=new y(new Float32Array(s*2),2),l=new y(new Float32Array(s*4),4);for(let n of[o,c,l])n.setUsage(H);r.setAttribute("iAnchor",o),r.setAttribute("iGlyph",c),r.setAttribute("iColor",l);let a=new F(B(),T,C,N);a.magFilter=R,a.minFilter=R,a.generateMipmaps=!1,a.needsUpdate=!0;let E=new U({name:"isekai.damageNumbers",vertexShader:I,fragmentShader:z,uniforms:{uAtlas:{value:a},uSize:{value:v.size}},transparent:!0,depthWrite:!1,depthTest:!1}),u=new S(r,E,s);u.name="damage-numbers",u.frustumCulled=!1,u.renderOrder=10,u.count=0,u.visible=!1,u.userData.share="effects",i.parent?.add(u);let t=[],m=[0,0,0],k=()=>{let n=0;for(let e of t){let b=Math.min(1,e.age/v.seconds),d=e.rel?i.positionOf?.(e.who)??null:null;m[0]=e.at[0]+(d?.[0]??0),m[1]=e.at[1]+(d?.[1]??0)+v.rise*(1-(1-b)*(1-b)),m[2]=e.at[2]+(d?.[2]??0);let x=b<.6?1:1-(b-.6)/.4,O=e.text.length*f/h;for(let w=0;w<e.text.length&&n<s;w++,n++)o.setXYZ(n,m[0],m[1],m[2]),c.setXY(n,e.text.charCodeAt(w)-48,w*f/h-O/2),l.setXYZW(n,e.color.r,e.color.g,e.color.b,x)}u.count=n,u.visible=n>0;for(let e of[o,c,l])e.needsUpdate=!0};return{mesh:u,cues(n){for(let e of n){if(!e||e.kind!=="damageNumber"||!Array.isArray(e.at))continue;let b=e.numberKind in G?e.numberKind:"normal",d=i.positionOf?.(e.who)??null,x=d?[e.at[0]-d[0],e.at[1]-d[1],e.at[2]-d[2]]:[e.at[0],e.at[1],e.at[2]];for(t.push({text:K(e.amount),kind:b,who:e.who,at:x,rel:!!d,age:0,color:new M(G[b])});t.length>g;)t.shift()}k()},count:()=>t.length,drawCalls:()=>t.length?1:0,shown:()=>t.map(n=>({text:n.text,kind:n.kind,who:n.who})),update(n){if(t.length){for(let e of t)e.age+=Math.max(0,n);for(;t.length&&t[0].age>=v.seconds;)t.shift();for(let e=t.length-1;e>=0;e--)t[e].age>=v.seconds&&t.splice(e,1);k()}},dispose(){t.length=0,u.removeFromParent(),r.dispose(),E.dispose(),a.dispose()}}}export{G as DAMAGE_NUMBER_COLOURS,L as DAMAGE_NUMBER_DIGITS,v as DAMAGE_NUMBER_LOOK,V as createDamageNumbers,K as damageText,B as digitAtlasData};
//# sourceMappingURL=numbers-5BMQYCQE.js.map
