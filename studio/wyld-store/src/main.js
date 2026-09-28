import { PRODUCTS, COLORWAYS, PUBLIC_COLLECTION_REFERENCES } from "./products.js";
import { WyldViewer } from "./viewer.js";

const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const state={product:PRODUCTS[0],color:PRODUCTS[0].defaultColor,size:PRODUCTS[0].sizes[1]||PRODUCTS[0].sizes[0],pose:"product",bag:[]};
const viewer=new WyldViewer($("#viewer-canvas"),{colorways:COLORWAYS});
const money=(v,currency)=>`${currency} ${Number(v).toLocaleString()}`;

function renderCollection(){
  const grid=$("#product-grid");
  grid.innerHTML=PRODUCTS.map((p,i)=>`
    <button class="product-card ${p.id===state.product.id?"is-active":""}" data-product="${p.id}">
      <div class="product-art ${p.image?"has-image":""}" style="--pattern:${p.pattern}">
        ${p.image?`<img loading="lazy" src="${p.image}" alt="${p.name} public product photograph">`:""}
        <span>${String(i+1).padStart(2,"0")}</span><b>WYLD</b>
        <div class="mini-orbit"><i></i><i></i></div>
        <em>${p.availability}</em>
      </div>
      <div class="product-copy"><div><small>${p.category} / ${p.gender}</small><h3>${p.name}</h3></div>
        <strong>${p.compareAt?`<s>${money(p.compareAt,p.currency)}</s> `:""}${money(p.price,p.currency)}</strong></div>
    </button>`).join("");
  $$("[data-product]").forEach(b=>b.addEventListener("click",()=>selectProduct(b.dataset.product)));
}

function renderProduct(){
  const p=state.product;
  $("#product-kicker").textContent=`${p.category} / ${p.gender}`;
  $("#product-name").textContent=p.name;
  $("#product-copy").textContent=p.copy;
  $("#product-price").innerHTML=p.compareAt?`<s>${money(p.compareAt,p.currency)}</s> ${money(p.price,p.currency)}`:money(p.price,p.currency);
  $("#source-note").textContent=p.source;
  $("#availability").textContent=p.availability;
  $("#shop-live").href=p.shopUrl;
  $("#add-bag").disabled=!!p.soldOut;
  $("#add-bag").textContent=p.soldOut?"Currently sold out":"Add to bag";
  $("#colorways").innerHTML=p.colorways.map(k=>`<button class="swatch ${k===state.color?"is-active":""}" data-color="${k}" title="${COLORWAYS[k].label}" style="--c:${COLORWAYS[k].primary};--a:${COLORWAYS[k].accent}"><i></i><span>${COLORWAYS[k].label}</span></button>`).join("");
  $("#sizes").innerHTML=p.sizes.map(s=>`<button class="size ${s===state.size?"is-active":""}" data-size="${s}">${s}</button>`).join("");
  $$("[data-color]").forEach(b=>b.addEventListener("click",()=>{state.color=b.dataset.color;viewer.applyColorway(state.color);renderProduct();}));
  $$("[data-size]").forEach(b=>b.addEventListener("click",()=>{state.size=b.dataset.size;renderProduct();}));
}

async function selectProduct(id){
  state.product=PRODUCTS.find(p=>p.id===id)||PRODUCTS[0];
  state.color=state.product.defaultColor;
  state.size=state.product.sizes[1]||state.product.sizes[0];
  state.pose="product";
  renderProduct();renderCollection();
  $$("[data-pose]").forEach(x=>x.classList.toggle("is-active",x.dataset.pose==="product"));
  $("#asset-state").textContent="loading GLB";
  const mode=await viewer.loadProduct(state.product,state.color);
  $("#asset-state").textContent=mode==="GLB"?"live GLB / drag · orbit · zoom":"semantic fallback";
  if(innerWidth<720)scrollTo({top:0,behavior:"smooth"});
}

function renderReferences(){
  $("#reference-rail").innerHTML=PUBLIC_COLLECTION_REFERENCES.map((r,i)=>`
    <a href="${r.url}" target="_blank" rel="noreferrer" class="reference-card" style="--ref:${r.color}">
      <span>${String(i+1).padStart(2,"0")}</span><div><small>${r.family}</small><h3>${r.name}</h3></div><b>↗</b>
    </a>`).join("");
}

function renderBag(){
  $("#bag-count").textContent=state.bag.length;
  $("#bag-items").innerHTML=state.bag.length?state.bag.map((item,i)=>`
    <article class="bag-row"><div><small>${item.category}</small><h3>${item.name}</h3><p>${COLORWAYS[item.color]?.label||item.color} · ${item.size}</p></div>
      <div><strong>${money(item.price,item.currency)}</strong><button data-remove="${i}">Remove</button></div></article>`).join(""):`<p class="bag-empty">Your WYLD bag is waiting.</p>`;
  $$("[data-remove]").forEach(b=>b.addEventListener("click",()=>{state.bag.splice(Number(b.dataset.remove),1);renderBag();}));
  const total=state.bag.reduce((a,b)=>a+b.price,0);
  $("#bag-total").textContent=state.bag.length?`AED ${total.toLocaleString()}`:"AED 0";
}

$$("[data-shot]").forEach(b=>b.addEventListener("click",()=>{
  $$("[data-shot]").forEach(x=>x.classList.toggle("is-active",x===b));
  viewer.frame(b.dataset.shot);
}));
$$("[data-pose]").forEach(b=>b.addEventListener("click",async()=>{
  state.pose=b.dataset.pose;
  $$("[data-pose]").forEach(x=>x.classList.toggle("is-active",x===b));
  $("#asset-state").textContent=state.pose==="product"?"loading product":"loading motion GLB";
  const mode=await viewer.setPose(state.pose);
  $("#asset-state").textContent=mode==="GLB"?(state.pose==="product"?"live product GLB":"live motion GLB"):"semantic fallback";
}));
$("#cinema").addEventListener("click",()=>viewer.playCinema());

$("#add-bag").addEventListener("click",()=>{
  if(state.product.soldOut)return;
  state.bag.push({product:state.product.id,name:state.product.name,category:state.product.category,color:state.color,size:state.size,price:state.product.price,currency:state.product.currency,url:state.product.shopUrl});
  renderBag();
  $("#add-bag").textContent="Added";
  setTimeout(()=>$("#add-bag").textContent="Add to bag",900);
});
$("#bag-button").addEventListener("click",()=>$("#bag-sheet").classList.add("open"));
$("#close-bag").addEventListener("click",()=>$("#bag-sheet").classList.remove("open"));
$("#checkout-live").addEventListener("click",()=>window.open("https://ridewyld.com/","_blank","noopener"));

$("#tryon-file").addEventListener("change",e=>{
  const f=e.target.files?.[0];if(!f)return;
  const url=URL.createObjectURL(f);
  $("#tryon-preview").src=url;$("#tryon-preview").hidden=false;
  $("#tryon-copy").textContent="Photo staged locally on this device. Nothing has been uploaded.";
});
$("#open-tryon").addEventListener("click",()=>$("#tryon-sheet").classList.add("open"));
$("#open-tryon-2").addEventListener("click",()=>$("#tryon-sheet").classList.add("open"));
$("#close-tryon").addEventListener("click",()=>$("#tryon-sheet").classList.remove("open"));
$("#mobile-config").addEventListener("click",()=>$("#config-panel").classList.toggle("mobile-open"));
$("#menu-toggle").addEventListener("click",()=>$("#nav").classList.toggle("open"));

renderCollection();renderReferences();renderBag();renderProduct();await selectProduct(PRODUCTS[0].id);
