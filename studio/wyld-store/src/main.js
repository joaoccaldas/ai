import { PRODUCTS, COLORWAYS, PUBLIC_COLLECTION_REFERENCES } from "./products.js";
import { WyldViewer } from "./viewer.js";

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const state = { product: PRODUCTS[0], color: PRODUCTS[0].defaultColor, size: PRODUCTS[0].sizes[1] || PRODUCTS[0].sizes[0], pose:"stand", bag:[] };
const viewer = new WyldViewer($("#viewer-canvas"), { colorways: COLORWAYS });
const money=(v,currency)=>`${currency} ${Number(v).toLocaleString()}`;

function renderCollection(){
  const grid=$("#product-grid");
  grid.innerHTML=PRODUCTS.map((p,i)=>`
    <button class="product-card ${p.id===state.product.id?"is-active":""}" data-product="${p.id}">
      <div class="product-art" style="--pattern:url('${p.pattern}')">
        <span>${String(i+1).padStart(2,"0")}</span><b>WYLD</b><div class="mini-orbit"><i></i><i></i></div>
      </div>
      <div class="product-copy"><div><small>${p.category} / ${p.gender}</small><h3>${p.name}</h3></div><strong>${money(p.price,p.currency)}</strong></div>
    </button>`).join("");
  $$('[data-product]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.product)));
}

function renderProduct(){
  const p=state.product;
  $("#product-kicker").textContent=`${p.category} / ${p.gender}`;
  $("#product-name").textContent=p.name;
  $("#product-copy").textContent=p.copy;
  $("#product-price").textContent=money(p.price,p.currency);
  $("#source-note").textContent=p.source;
  $("#colorways").innerHTML=p.colorways.map(k=>`<button class="swatch ${k===state.color?"is-active":""}" data-color="${k}" title="${COLORWAYS[k].label}" style="--c:${COLORWAYS[k].primary};--a:${COLORWAYS[k].accent}"><i></i><span>${COLORWAYS[k].label}</span></button>`).join("");
  $("#sizes").innerHTML=p.sizes.map(s=>`<button class="size ${s===state.size?"is-active":""}" data-size="${s}">${s}</button>`).join("");
  $$('[data-color]').forEach(b=>b.addEventListener('click',()=>{state.color=b.dataset.color;viewer.applyColorway(state.color);renderProduct();}));
  $$('[data-size]').forEach(b=>b.addEventListener('click',()=>{state.size=b.dataset.size;renderProduct();}));
}

async function selectProduct(id){
  state.product=PRODUCTS.find(p=>p.id===id) || PRODUCTS[0];
  state.color=state.product.defaultColor;
  state.size=state.product.sizes[1] || state.product.sizes[0];
  renderProduct();renderCollection();
  $("#asset-state").textContent="building 3D";
  viewer.loadProduct(state.product.kind,state.color);
  $("#asset-state").textContent="live 3D";
  if(innerWidth<720) scrollTo({top:0,behavior:'smooth'});
}

function renderReferences(){
  $("#reference-rail").innerHTML=PUBLIC_COLLECTION_REFERENCES.map((r,i)=>`
    <a href="${r.url}" target="_blank" rel="noreferrer" class="reference-card" style="--ref:${r.color}">
      <span>${String(i+1).padStart(2,"0")}</span><div><small>${r.family}</small><h3>${r.name}</h3></div><b>↗</b>
    </a>`).join("");
}

$$('[data-shot]').forEach(b=>b.addEventListener('click',()=>{
  $$('[data-shot]').forEach(x=>x.classList.toggle('is-active',x===b));
  viewer.frame(b.dataset.shot);
}));
$$('[data-pose]').forEach(b=>b.addEventListener('click',()=>{
  state.pose=b.dataset.pose;
  $$('[data-pose]').forEach(x=>x.classList.toggle('is-active',x===b));
  viewer.setPose(state.pose);
}));
$("#cinema").addEventListener('click',()=>viewer.playCinema());

$("#add-bag").addEventListener('click',()=>{
  state.bag.push({product:state.product.id,color:state.color,size:state.size});
  $("#bag-count").textContent=state.bag.length;
  $("#add-bag").textContent="Added";
  setTimeout(()=>$("#add-bag").textContent="Add to bag",900);
});

$("#tryon-file").addEventListener('change',(e)=>{
  const f=e.target.files?.[0]; if(!f)return;
  const url=URL.createObjectURL(f);
  $("#tryon-preview").src=url;
  $("#tryon-preview").hidden=false;
  $("#tryon-copy").textContent="Local photo staged. A future inference adapter can replace this preview without changing the store UI.";
});
$("#open-tryon").addEventListener('click',()=>$("#tryon-sheet").classList.add('open'));
$("#open-tryon-2").addEventListener('click',()=>$("#tryon-sheet").classList.add('open'));
$("#close-tryon").addEventListener('click',()=>$("#tryon-sheet").classList.remove('open'));
$("#mobile-config").addEventListener('click',()=>$("#config-panel").classList.toggle('mobile-open'));
$("#menu-toggle").addEventListener('click',()=>$("#nav").classList.toggle('open'));

renderCollection();renderReferences();renderProduct();viewer.setPose('stand');await selectProduct(PRODUCTS[0].id);
