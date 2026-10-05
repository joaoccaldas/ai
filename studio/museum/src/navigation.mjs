// Obstacle-aware routes. Every edge and shortcut is checked in world space.
export function findRoute(start, end, walkable, extent=40) {
  const step=.4, margin=.22;
  const safe=(x,y)=>walkable(x,y)&&[[margin,0],[-margin,0],[0,margin],[0,-margin]].every(([dx,dy])=>walkable(x+dx,y+dy));
  const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.1);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!safe(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;};
  if(clear(start,end))return [end];
  const point=([x,y])=>({x:x*step,y:y*step});
  const key=([x,y])=>`${x},${y}`;
  function nearby(p){const cx=Math.round(p.x/step),cy=Math.round(p.y/step), candidates=[];for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){const q=[cx+dx,cy+dy];if(clear(p,point(q)))candidates.push(q);}return candidates.sort((a,b)=>Math.hypot(point(a).x-p.x,point(a).y-p.y)-Math.hypot(point(b).x-p.x,point(b).y-p.y))[0];}
  const from=nearby(start), to=nearby(end);if(!from||!to)return [];
  const goal=key(to), heap=[], best=new Map([[key(from),0]]), previous=new Map(), visited=new Set();
  function push(item){heap.push(item);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=item.f)break;heap[i]=heap[p];i=p;}heap[i]=item;}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;}
  push({q:from,g:0,f:Math.hypot(from[0]-to[0],from[1]-to[1])});
  while(heap.length){
    const current=pop(),id=key(current.q);if(visited.has(id))continue;visited.add(id);
    if(id===goal){const path=[end];let q=current.q;while(q){path.unshift(point(q));q=previous.get(key(q));}path.unshift(start);const smooth=[];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clear(path[i],path[j]))j--;smooth.push(path[j]);i=j;}return smooth;}
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      if(!dx&&!dy)continue;const q=[current.q[0]+dx,current.q[1]+dy],nid=key(q);
      if(Math.abs(q[0]*step)>extent||Math.abs(q[1]*step)>extent||visited.has(nid)||!clear(point(current.q),point(q)))continue;
      const g=current.g+Math.hypot(dx,dy);if(g>=(best.get(nid)??Infinity))continue;best.set(nid,g);previous.set(nid,current.q);push({q,g,f:g+Math.hypot(q[0]-to[0],q[1]-to[1])});
    }
  }
  return [];
}
