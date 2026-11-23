import{S as H,h as l}from"./chunk-JS4G6UW2.js";import{Da as T,Fa as x,Ga as R,Ma as b,N as u,Na as M,Ra as d,W as h,X as g,Y as E,Z as k,c as v,e as y,ma as w,na as m}from"./chunk-4ZGMG5FA.js";function B(t,e,r){let o=typeof t.wipe=="number"?Math.min(2,Math.max(0,t.wipe)):H;return e==="flat"?o:r==="Comfort"?Math.min(1,2*o):o}function S(t,e){let r=Math.max(0,e),o=i=>Math.min(64,Math.max(0,i)*r);return t==="zone"?{kind:"zone",r:200,h:[200,200,200]}:"sphere"in t?{kind:"sphere",r:o(t.sphere),h:[o(t.sphere),o(t.sphere),o(t.sphere)]}:"box"in t?{kind:"box",r:Math.max(o(t.box[0]),o(t.box[2])),h:[o(t.box[0]),o(t.box[1]),o(t.box[2])]}:{kind:"cylinder",r:o(t.cylinder[0]),h:[o(t.cylinder[0]),o(t.cylinder[1])/2,o(t.cylinder[0])]}}var W=`
  varying vec3 vW;
  varying vec3 vD;
  uniform vec3 uCentre;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vD = normalize(w.xyz - uCentre);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`,D=`
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform float uFull;
  uniform float uStars;
  uniform float uMoon;
  uniform vec3 uFrom;
  uniform float uWipe;
  varying vec3 vW;
  varying vec3 vD;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    if (distance(vW, uFrom) > uWipe) discard;
    vec3 c = uHorizon;
    if (uFull > 0.5) {
      float up = clamp(vD.y, 0.0, 1.0);
      c = mix(uHorizon, uTop, smoothstep(0.0, 0.8, up));
      if (uStars > 0.0 && vD.y > 0.05) {
        vec3 cell = floor(vD * 90.0);
        float s = step(1.0 - 0.02 * uStars, hash(cell));
        c += vec3(s * smoothstep(0.05, 0.3, vD.y));
      }
      if (uMoon > 0.5) {
        float m = dot(vD, normalize(vec3(0.35, 0.6, -0.7)));
        c = mix(c, vec3(0.95, 0.95, 0.85), smoothstep(0.9975, 0.999, m));
      }
    }
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`,O=`
  varying vec3 vW;
  varying vec2 vL;
  void main() {
    vL = position.xy;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`,_=`
  uniform vec3 uColor;
  uniform int uPattern;
  uniform float uTime;
  uniform vec3 uFrom;
  uniform float uWipe;
  varying vec3 vW;
  varying vec2 vL;
  void main() {
    if (distance(vW, uFrom) > uWipe) discard;
    vec3 c = uColor;
    float r = length(vL);
    if (uPattern == 1) c *= 0.85 + 0.15 * sin(r * 3.0 - uTime * 1.5);
    else if (uPattern == 2) { vec2 g = abs(fract(vL) - 0.5); c *= 0.8 + 0.4 * step(0.47, max(g.x, g.y)); }
    else if (uPattern == 3) { vec2 t = floor(vL * 0.5); c *= 0.88 + 0.12 * mod(t.x + t.y, 2.0); }
    else if (uPattern == 4) c *= 0.85 + 0.15 * sin(vL.x * 0.7 + uTime * 0.2) * sin(vL.y * 0.5 - uTime * 0.15);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`,A={none:0,ripples:1,grid:2,tiles:3,clouds:4};function c(t,e){return new g(typeof t=="string"&&/^#[0-9a-fA-F]{6}$/.test(t)?t:e)}function N(){let t=new p(new h,new k),e={schemaVersion:2,id:"warm",kind:"backdrop",life:0,floor:{glow:"#ffffff"}};t.set({area:"warm",effect:"warm",record:e,at:[0,0,0],shape:{sphere:1},sizeNow:1,from:[0,0,0]},"simple","flat","Standard",0);let r=[...t.root.children];for(let o of r)o.visible=!0,o.removeFromParent();return r}var p=class{constructor(e,r){this.scene=r;this.root.name="FxBackdrop",this.root.userData.share="effects",e.add(this.root)}scene;root=new h;sky=null;floor=null;glow=null;key="";wipeStart=0;wipeS=0;wipeMax=0;target=null;wiped=!1;fogBefore=void 0;set(e,r,o,i,f){let a=e?`${e.area}|${e.effect}|${r}`:"";a!==this.key&&(this.clear(),this.key=a,e&&(this.build(e,r),this.wipeStart=f,this.wipeS=B(e.record,o,i),this.wiped=!1)),this.target=e,e&&this.place(e)}build(e,r){let o=e.record,i={...l.sky,...o.sky??{}},f={...l.floor,...o.floor??{}},a=r==="full",s=S(e.shape,1),F={uFrom:{value:new u},uWipe:{value:1e6}},z=new d({name:`backdrop-sky-${r}`,uniforms:{uTop:{value:c(i.top,l.sky.top)},uHorizon:{value:c(i.horizon,l.sky.horizon)},uFull:{value:a?1:0},uStars:{value:a&&typeof i.stars=="number"?i.stars:0},uMoon:{value:a&&i.moon?1:0},uCentre:{value:new u},...F},vertexShader:W,fragmentShader:D,side:v,depthWrite:s.kind!=="zone",fog:!1}),C=s.kind==="box"?new T(2,2,2):s.kind==="cylinder"?new R(1,1,2,32,1):new M(1,32,16);if(this.sky=new m(C,z),this.sky.name="backdrop-sky",this.sky.frustumCulled=!1,this.sky.renderOrder=s.kind==="zone"?-1e3:0,this.root.add(this.sky),s.kind==="zone")return;let P=new d({name:`backdrop-floor-${r}`,uniforms:{uColor:{value:c(f.color,l.floor.color)},uPattern:{value:a?A[String(f.pattern)]??0:0},uTime:{value:0},uFrom:{value:new u},uWipe:{value:1e6}},vertexShader:O,fragmentShader:_,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,fog:!1});if(this.floor=new m(new x(1,48),P),this.floor.rotation.x=-Math.PI/2,this.floor.name="backdrop-floor",this.root.add(this.floor),f.glow){let n=new m(new b(.94,1,64),new w({color:c(f.glow,"#ffffff"),transparent:!0,opacity:.8,blending:y,depthWrite:!1,fog:!1}));n.rotation.x=-Math.PI/2,n.renderOrder=100,n.name="backdrop-glow",this.glow=n,this.root.add(n)}if(a){let n=o.fog??{};this.fogBefore=this.scene.fog,this.scene.fog=new E(c(n.color??i.horizon,l.sky.horizon),typeof n.near=="number"?n.near:l.fog.near,typeof n.far=="number"?n.far:l.fog.far)}}place(e){let r=S(e.shape,e.sizeNow);this.sky&&r.kind!=="zone"&&(this.sky.position.set(e.at[0],e.at[1],e.at[2]),r.kind==="sphere"?this.sky.scale.setScalar(Math.max(.01,r.r)):this.sky.scale.set(Math.max(.01,r.h[0]),Math.max(.01,r.h[1]),Math.max(.01,r.h[2])),this.sky.material.uniforms.uCentre.value.set(e.at[0],e.at[1],e.at[2]));let o=r.kind==="box"?Math.max(r.h[0],r.h[2]):r.r;for(let i of[this.floor,this.glow])i&&(i.position.set(e.at[0],e.at[1]+.01,e.at[2]),i.scale.set(Math.max(.01,o),Math.max(.01,o),1));this.wipeMax=Math.max(1,r.r*2+Math.hypot(e.from[0]-e.at[0],e.from[1]-e.at[1],e.from[2]-e.at[2]))}frame(e,r){let o=this.target;if(!o||!this.sky)return;let i=this.wipeS>0?Math.min(1,Math.max(0,(e-this.wipeStart)/this.wipeS)):1,f=i>=1?1e6:this.wipeMax*i;for(let a of[this.sky,this.floor]){if(!a)continue;let s=a.material.uniforms;s.uFrom.value.set(o.from[0],o.from[1],o.from[2]),s.uWipe.value=f,s.uTime&&(s.uTime.value=e)}this.glow&&(this.glow.visible=i>=1),this.wiped=i>=1,o.shape==="zone"&&(this.sky.position.set(r[0],r[1],r[2]),this.sky.scale.setScalar(200),this.sky.material.uniforms.uCentre.value.set(r[0],r[1],r[2]))}drawCalls(){return[this.sky,this.floor,this.glow].filter(e=>e&&e.visible).length}culling(){let e=this.target;return!e||e.shape==="zone"||!this.sky||!this.wiped?null:{area:e.area,at:e.at,shape:e.shape,sizeNow:e.sizeNow}}active(){return this.key}clear(){for(let e of[this.sky,this.floor,this.glow])e&&(e.removeFromParent(),e.geometry.dispose(),e.material.dispose());this.sky=this.floor=this.glow=null,this.wiped=!1,this.fogBefore!==void 0&&(this.scene.fog=this.fogBefore,this.fogBefore=void 0),this.key=""}dispose(){this.clear(),this.target=null,this.root.removeFromParent()}};export{N as a,p as b};
//# sourceMappingURL=chunk-DF4RHVT2.js.map
