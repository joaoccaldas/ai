const { chromium } = require('/tmp/spatial-pw/node_modules/playwright');

const base=process.env.SPATIAL_TEST_URL||'http://127.0.0.1:4173';
const cases=[
  {name:'phone-320-portrait',width:320,height:568},
  {name:'phone-390-portrait',width:390,height:844},
  {name:'phone-844-landscape',width:844,height:390},
  {name:'phone-740-short-landscape',width:740,height:360},
];
const routes=[
  {path:'/',hero:'.hero',actions:'.bottom'},
  {path:'/bellagio.html',hero:'.copy',actions:'.bottom'}
];
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));

(async()=>{
  const browser=await chromium.launch({headless:true});
  const failures=[];
  try{
    for(const c of cases){
      for(const route of routes){
        const page=await browser.newPage({viewport:{width:c.width,height:c.height},javaScriptEnabled:false});
        await page.goto(base+route.path,{waitUntil:'domcontentloaded'});
        const r=await page.evaluate(({heroSel,actionsSel})=>{
          const vw=innerWidth,vh=innerHeight,doc=document.documentElement;
          const fallback=document.querySelector('#fallback');
          const actions=document.querySelector(actionsSel),hero=document.querySelector(heroSel);
          const interactive=[...document.querySelectorAll(actionsSel+' a,'+actionsSel+' button,'+actionsSel+' label,'+actionsSel+' select')]
            .filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0})
            .map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,text:(el.textContent||'').trim().slice(0,40),left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
          const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
          return {vw,vh,scrollWidth:doc.scrollWidth,fallbackDisplay:fallback?getComputedStyle(fallback).display:null,interactive,hero:rect(hero),actions:rect(actions)};
        },{heroSel:route.hero,actionsSel:route.actions});
        if(r.scrollWidth>r.vw+1)failures.push(c.name+' '+route.path+': horizontal overflow '+r.scrollWidth+'>'+r.vw);
        if(r.fallbackDisplay!=='none')failures.push(c.name+' '+route.path+': hidden fallback display='+r.fallbackDisplay);
        for(const el of r.interactive){
          if(el.left<-1||el.right>r.vw+1||el.top<-1||el.bottom>r.vh+1)failures.push(c.name+' '+route.path+': clipped '+el.tag+' "'+el.text+'" '+JSON.stringify(el));
          if(el.height<36&&el.tag!=='SELECT')failures.push(c.name+' '+route.path+': action target too short '+el.height+'px "'+el.text+'"');
        }
        if(c.width>c.height&&r.hero&&r.actions&&overlap(r.hero,r.actions)>20)failures.push(c.name+' '+route.path+': hero/actions overlap');
        await page.close();
      }
    }
  }finally{await browser.close();}
  if(failures.length){console.error(failures.join('\n'));process.exit(1);}
  console.log('Spatial Lab layout PASS: '+(cases.length*routes.length)+' viewport/route combinations.');
})().catch(e=>{console.error(e);process.exit(1)});
