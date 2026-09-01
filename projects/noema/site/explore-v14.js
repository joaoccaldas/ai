(() => {
  const input=document.getElementById('q'),results=document.getElementById('results'); if(!input||!results)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge=document.createElement('section');bridge.className='panel';bridge.id='conceptBridge';bridge.style.margin='14px 0 20px';results.parentElement.insertBefore(bridge,results.previousElementSibling);
  const render=()=>{const term=input.value.trim();if(!term){bridge.hidden=true;return}bridge.hidden=false;bridge.innerHTML=`<div class="eyebrow">Concept view</div><h3 style="margin:5px 0 8px">Study “${esc(term)}” across profiles, regions and time</h3><p style="max-width:780px">Search results answer <b>what matches this query?</b> The Concept Hub asks a different question: <b>where is this component encoded, what appears alongside it, and which source/evidence layer does each match belong to?</b></p><a class="btn" href="concept.html?term=${encodeURIComponent(term)}">Open ${esc(term)} Concept Hub →</a>`};
  input.addEventListener('input',render);render();
})();