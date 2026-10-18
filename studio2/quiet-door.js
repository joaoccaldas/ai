/**
 * Studio 2 Quiet Door. One small optional discovery, not an overlay or second renderer.
 * All timers are tab-visible time; background tabs never generate an idle reveal.
 */
export const QUIET_TIMING = Object.freeze({armMs:60000,idleMs:10000,countdownMs:5000});
export function quietDoorPhase({armed=false,idleVisibleMs=0,busy=false,enabled=true}={}) {
  if (!enabled || !armed || busy) return {phase:'waiting',seconds:0};
  if (idleVisibleMs < QUIET_TIMING.idleMs) return {phase:'waiting',seconds:0};
  const remainder=QUIET_TIMING.idleMs+QUIET_TIMING.countdownMs-idleVisibleMs;
  if (remainder <= 0) return {phase:'reveal',seconds:0};
  return {phase:'countdown',seconds:Math.ceil(remainder/1000)};
}
export function mountQuietDoor({doc=globalThis.document,win=globalThis.window}={}) {
  if (!doc?.body || !win || doc.getElementById('quietDoor') || doc.documentElement?.dataset.quietDoor==='off') return () => {};
  const reduce=win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
  const fine=win.matchMedia?.('(pointer: fine)')?.matches??false;
  if (reduce || !fine) return () => {};

  const node=doc.createElement('aside');
  node.id='quietDoor';
  node.className='quiet-door';
  node.hidden=true;
  node.setAttribute('aria-label','Optional hidden discovery');
  node.innerHTML=`<div class="quiet-door-kicker">A little curiosity</div>
    <div class="quiet-door-counter" id="quietCounter" aria-live="off"></div>
    <div id="quietReveal" hidden>
      <span class="quiet-door-symbol" aria-hidden="true">✧</span>
      <strong>A quieter way in.</strong>
      <p>Some rooms appear only when the world stops moving.</p>
      <a href="../studio/effects/bioluminescence/" class="quiet-door-link">Enter the light study ↗</a>
      <button type="button" id="quietClose" class="quiet-door-close" aria-label="Dismiss the hidden discovery">×</button>
    </div>`;
  doc.body.append(node);
  const counter=node.querySelector('#quietCounter'),reveal=node.querySelector('#quietReveal');
  const controller=new AbortController(),events={signal:controller.signal,passive:true};
  const now=()=>win.performance.now();
  let last=now(),visible=0,idle=0,armed=false,finished=false,lastSeconds=-1,phase='waiting';
  function hide(){
    node.hidden=true;counter.hidden=false;reveal.hidden=true;counter.textContent='';
    node.classList.remove('is-revealed');phase='waiting';lastSeconds=-1;
  }
  function resetActivity(){
    if (finished)return;
    idle=0;
    if (phase==='countdown')hide();
  }
  function dismiss(){finished=true;hide();win.clearInterval(timer)}
  function busy(){
    const active=doc.activeElement;
    return !!(doc.querySelector('.project-drawer.open,.map-panel.open,dialog[open]')||
      active?.matches?.('input,textarea,select,[contenteditable="true"]'));
  }
  function tick(){
    const t=now(),delta=Math.max(0,t-last);last=t;
    if (finished)return;
    if (doc.hidden){idle=0;if(phase==='countdown')hide();return}
    visible+=delta;
    if(!armed && visible>=QUIET_TIMING.armMs){armed=true;idle=0;return;}
    if(!armed)return;
    const blocked=busy();
    if(blocked){idle=0;if(phase==='countdown')hide();return}
    idle+=delta;
    const state=quietDoorPhase({armed,idleVisibleMs:idle});
    if(state.phase==='reveal'){
      finished=true;phase='reveal';win.clearInterval(timer);node.hidden=false;counter.hidden=true;
      reveal.hidden=false;node.classList.add('is-revealed');reveal.setAttribute('role','status');return;
    }
    if(state.phase==='countdown'){
      phase='countdown';node.hidden=false;counter.hidden=false;reveal.hidden=true;
      if(lastSeconds!==state.seconds){lastSeconds=state.seconds;counter.textContent=`A little door opens in ${state.seconds}…`}
    }else if(phase==='countdown')hide();
  }
  for(const event of ['pointermove','pointerdown','keydown','wheel','scroll','focusin']) {
    win.addEventListener(event,resetActivity,events);
  }
  doc.addEventListener('visibilitychange',()=>{last=now();idle=0;if(phase==='countdown')hide()},{signal:controller.signal});
  doc.addEventListener('keydown',e=>{if(e.key==='Escape' && !node.hidden)dismiss()},{signal:controller.signal});
  node.querySelector('#quietClose').addEventListener('click',dismiss,{signal:controller.signal});
  const timer=win.setInterval(tick,250);
  return ()=>{win.clearInterval(timer);controller.abort();node.remove()};
}
