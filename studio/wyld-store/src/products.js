export const COLORWAYS = {
  berry: { label: "Berry / Tiffany", primary: "#ff2f92", accent: "#2ee7ff", dark: "#0b0712" },
  blueberry: { label: "Blueberry / Blush", primary: "#3156ff", accent: "#ff8ac6", dark: "#10131f" },
  grape: { label: "Grape / Mint", primary: "#774bff", accent: "#78f0c2", dark: "#130d1f" },
  olive: { label: "Olive / Acid", primary: "#6f7d45", accent: "#eaff36", dark: "#12150e" },
  obsidian: { label: "Black / White", primary: "#171719", accent: "#fffdf8", dark: "#050506" },
  tiffany: { label: "Tiffany / Berry", primary: "#2ee7ff", accent: "#ff2f92", dark: "#0d1720" },
  white: { label: "White / Black", primary: "#fffdf8", accent: "#111116", dark: "#d7d2ca" }
};

export const PRODUCTS = [
  {id:"aero-women",category:"Triathlon",gender:"Women",name:"WYLD Aero Trisuit / Women",price:1080,currency:"AED",kind:"trisuit",defaultColor:"berry",colorways:["berry","blueberry","grape","olive","obsidian","tiffany"],sizes:["XS","S","M","L","XL"],pattern:"./assets/brand/berry-cyan-flow.svg",copy:"Race-position first. Sculpted torso, aero sleeves and high-compression leg panels.",source:"Studio concept informed by WYLD product palette and private motion references."},
  {id:"aero-men",category:"Triathlon",gender:"Men",name:"WYLD Aero Trisuit / Men",price:1080,currency:"AED",kind:"trisuit",defaultColor:"blueberry",colorways:["blueberry","obsidian","olive","berry"],sizes:["S","M","L","XL","XXL"],pattern:"./assets/brand/black-white-orbit.svg",copy:"Close race cut with a stable torso, compressive shorts and a clean shoulder line.",source:"Studio concept informed by WYLD product palette."},
  {id:"hoodie-women",category:"After Race",gender:"Women",name:"After Race Hoodie / Women",price:435,currency:"AED",kind:"hoodie",defaultColor:"grape",colorways:["grape","berry","olive","obsidian"],sizes:["XS","S","M","L","XL"],pattern:"./assets/brand/olive-white-signal.svg",copy:"Soft recovery layer with oversized hood geometry and a compact race-week silhouette.",source:"Studio concept."},
  {id:"hoodie-men",category:"After Race",gender:"Men",name:"After Race Hoodie / Men",price:435,currency:"AED",kind:"hoodie",defaultColor:"obsidian",colorways:["obsidian","blueberry","olive"],sizes:["S","M","L","XL","XXL"],pattern:"./assets/brand/black-white-orbit.svg",copy:"Recovery weight, clean front pocket and race-week color blocking.",source:"Studio concept."},
  {id:"studio-tee",category:"Lifestyle",gender:"Unisex",name:"WYLD Studio Tee",price:215,currency:"AED",kind:"tee",defaultColor:"tiffany",colorways:["tiffany","berry","obsidian","white"],sizes:["XS","S","M","L","XL","XXL"],pattern:"./assets/brand/berry-cyan-flow.svg",copy:"Everyday layer with the same color language as the race collection.",source:"Studio concept."},
  {id:"race-cap",category:"Accessories",gender:"Unisex",name:"WYLD Race Week Cap",price:100,currency:"AED",kind:"cap",defaultColor:"berry",colorways:["berry","tiffany","olive","obsidian"],sizes:["One size"],pattern:"./assets/brand/olive-white-signal.svg",copy:"Lightweight cap with contrasting visor and a bright WYLD signal panel.",source:"Inspired by WYLD Trucker Caps."}
];

export const PUBLIC_COLLECTION_REFERENCES = [
  {name:"Raspberry Jersey",family:"Race Fit",url:"https://ridewyld.com/",color:"#ff2f92"},
  {name:"Blueberry Jersey",family:"Race Fit",url:"https://ridewyld.com/",color:"#3156ff"},
  {name:"Grape Jersey",family:"Race Fit",url:"https://ridewyld.com/",color:"#774bff"},
  {name:"Olive Jersey",family:"Race Fit",url:"https://ridewyld.com/",color:"#6f7d45"},
  {name:"WYLD Black Bib Shorts",family:"Bib Shorts",url:"https://ridewyld.com/",color:"#111116"},
  {name:"WYLD Tiffany Bib Shorts",family:"Bib Shorts",url:"https://ridewyld.com/",color:"#2ee7ff"}
];
