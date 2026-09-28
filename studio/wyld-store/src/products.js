export const COLORWAYS = {
  raspberry: { label: "Raspberry", primary: "#d11b6b", accent: "#ff8ac6", dark: "#0b0712" },
  blueberry: { label: "Blueberry", primary: "#3156ff", accent: "#9bb3ff", dark: "#10131f" },
  grape: { label: "Grape", primary: "#6a43d5", accent: "#78f0c2", dark: "#130d1f" },
  olive: { label: "Olive", primary: "#818b28", accent: "#eaff36", dark: "#12150e" },
  tiffany: { label: "Tiffany", primary: "#2ad4d1", accent: "#fffdf8", dark: "#0d1720" },
  black: { label: "Black", primary: "#111116", accent: "#fffdf8", dark: "#050506" },
  white: { label: "White", primary: "#fffdf8", accent: "#111116", dark: "#d7d2ca" }
};

const PATTERN = {
  raspberry: "radial-gradient(circle at 74% 26%,rgba(255,255,255,.72),transparent 14%),linear-gradient(145deg,#0b0712 0 18%,#d11b6b 18% 48%,#ff8ac6 48% 60%,#fffdf8 60% 68%,#2ad4d1 68% 86%,#78f0c2 86%)",
  blueberry: "radial-gradient(circle at 72% 24%,rgba(255,255,255,.6),transparent 13%),linear-gradient(145deg,#10131f 0 20%,#3156ff 20% 62%,#ff8ac6 62% 78%,#fffdf8 78%)",
  grape: "radial-gradient(circle at 70% 20%,rgba(255,255,255,.55),transparent 12%),linear-gradient(145deg,#130d1f 0 20%,#6a43d5 20% 64%,#78f0c2 64% 80%,#fffdf8 80%)",
  olive: "radial-gradient(circle at 78% 18%,#0b0712 0 13%,transparent 13.4%),linear-gradient(145deg,#fffdf8 0 28%,#818b28 28% 68%,#eaff36 68% 78%,#fffdf8 78%)",
  tiffany: "radial-gradient(circle at 74% 22%,rgba(255,255,255,.75),transparent 12%),linear-gradient(145deg,#0d1720 0 20%,#2ad4d1 20% 70%,#fffdf8 70% 82%,#d11b6b 82%)",
  black: "radial-gradient(circle at 70% 30%,transparent 0 18%,#fffdf8 18.5% 19.5%,transparent 20%),repeating-linear-gradient(24deg,#0b0712 0 34px,#fffdf8 35px 36px,#0b0712 37px 74px)"
};

export const PRODUCTS = [
  {
    id:"raspberry-jersey", category:"Cycling", gender:"Women + Men", name:"Raspberry Jersey | Race Fit",
    price:395, currency:"AED", kind:"jersey", asset:"jersey-women.glb", defaultColor:"raspberry",
    colorways:["raspberry","black","white"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.raspberry,
    copy:"Close race fit, unmistakable WYLD color and a clean aerodynamic silhouette for warm-weather riding.",
    source:"Current RideWYLD catalog. 3D studio visualization is a semantic product analogue, not manufacturing CAD.",
    shopUrl:"https://ridewyld.com/", availability:"Current catalog"
  },
  {
    id:"blueberry-jersey", category:"Cycling", gender:"Women + Men", name:"Blueberry Jersey | Race Fit",
    price:295, compareAt:395, currency:"AED", kind:"jersey", asset:"jersey-men.glb", defaultColor:"blueberry",
    colorways:["blueberry","black","white"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.blueberry,
    copy:"Race-cut jersey in WYLD Blueberry, built for the same high-energy palette with a cooler blue frequency.",
    source:"Current RideWYLD catalog sale price. 3D studio visualization is a semantic product analogue.",
    shopUrl:"https://ridewyld.com/", availability:"Sale"
  },
  {
    id:"grape-jersey", category:"Cycling", gender:"Women + Men", name:"Grape Jersey | Race Fit",
    price:395, currency:"AED", kind:"jersey", asset:"jersey-women.glb", defaultColor:"grape",
    colorways:["grape","black","white"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.grape,
    image:"https://ridewyld.com/cdn/shop/products/grapepocket.jpg?v=1659262824&width=1200",
    copy:"A saturated grape race-fit jersey with the sharp, compact silhouette that defines the WYLD collection.",
    source:"Current RideWYLD product page. 3D studio visualization is a semantic product analogue.",
    shopUrl:"https://ridewyld.com/products/grape-jersey", availability:"Live product page"
  },
  {
    id:"olive-jersey", category:"Cycling", gender:"Women + Men", name:"Olive Jersey | Race Fit",
    price:395, currency:"AED", kind:"jersey", asset:"jersey-men.glb", defaultColor:"olive",
    colorways:["olive","black","white"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.olive,
    copy:"WYLD Olive shifts the visual energy without losing the race-fit attitude, pairing naturally with acid and white.",
    source:"Current RideWYLD product page. 3D studio visualization is a semantic product analogue.",
    shopUrl:"https://ridewyld.com/products/olive", availability:"Live product page"
  },
  {
    id:"tiffany-bibs", category:"Bib Shorts", gender:"Women + Men", name:"WYLD Tiffany Bib Shorts",
    price:585, currency:"AED", kind:"bib", asset:"bib-tiffany.glb", defaultColor:"tiffany",
    colorways:["tiffany","black","raspberry"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.tiffany,
    image:"https://ridewyld.com/cdn/shop/files/tourqoise_tiffany_bib_shorts_product_photo.jpg?v=1737450485&width=1200",
    copy:"High-quality Lycra, hot-weather construction, dual-density padding and a mid-profile leg gripper in WYLD Tiffany.",
    source:"Current RideWYLD product page; currently indexed as sold out.",
    shopUrl:"https://ridewyld.com/products/tiffany-bib-shorts", availability:"Sold out", soldOut:true
  },
  {
    id:"black-bibs", category:"Bib Shorts", gender:"Women + Men", name:"WYLD Black Bib Shorts",
    price:450, currency:"AED", kind:"bib", asset:"bib-black.glb", defaultColor:"black",
    colorways:["black","white","raspberry"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.black,
    copy:"The quiet anchor of the collection: black bibs that let the jersey color do the shouting.",
    source:"Current RideWYLD catalog. 3D studio visualization is a semantic product analogue.",
    shopUrl:"https://ridewyld.com/collections/bib-shorts", availability:"Current catalog"
  },
  {
    id:"team-singlet", category:"Run WYLD", gender:"Unisex", name:"Team WYLD Singlet",
    price:155, currency:"AED", kind:"singlet", asset:"singlet.glb", defaultColor:"raspberry",
    colorways:["raspberry","tiffany","black","white"], sizes:["XS","S","M","L","XL"], pattern:PATTERN.raspberry,
    copy:"A lightweight Run WYLD layer that carries the same palette from bike to run.",
    source:"Current RideWYLD Run WYLD catalog. 3D studio visualization is a semantic product analogue.",
    shopUrl:"https://ridewyld.com/", availability:"Current catalog"
  },
  {
    id:"trucker-cap", category:"Accessories", gender:"Unisex", name:"WYLD Trucker Caps",
    price:70, compareAt:100, currency:"AED", kind:"cap", asset:"cap.glb", defaultColor:"black",
    colorways:["black","raspberry","tiffany","olive"], sizes:["One size"], pattern:PATTERN.black,
    copy:"A compact WYLD signal piece for race week, coffee stops and everything after the finish line.",
    source:"Current RideWYLD catalog sale price. 3D studio visualization is a semantic product analogue.",
    shopUrl:"https://ridewyld.com/", availability:"Sale"
  }
];

export const PUBLIC_COLLECTION_REFERENCES = [
  {name:"Raspberry Jersey",family:"Race Fit · AED 395",url:"https://ridewyld.com/",color:"#d11b6b"},
  {name:"Blueberry Jersey",family:"Race Fit · sale AED 295",url:"https://ridewyld.com/",color:"#3156ff"},
  {name:"Grape Jersey",family:"Race Fit · AED 395",url:"https://ridewyld.com/products/grape-jersey",color:"#6a43d5"},
  {name:"Olive Jersey",family:"Race Fit · AED 395",url:"https://ridewyld.com/products/olive",color:"#818b28"},
  {name:"Black Bib Shorts",family:"Bib Shorts · AED 450",url:"https://ridewyld.com/collections/bib-shorts",color:"#111116"},
  {name:"Tiffany Bib Shorts",family:"Bib Shorts · AED 585",url:"https://ridewyld.com/products/tiffany-bib-shorts",color:"#2ad4d1"},
  {name:"Team WYLD Singlet",family:"Run WYLD · AED 155",url:"https://ridewyld.com/",color:"#ff2f92"},
  {name:"Trucker Caps",family:"Accessories · sale AED 70",url:"https://ridewyld.com/",color:"#f5f1e9"}
];
