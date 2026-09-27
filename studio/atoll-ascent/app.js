import * as THREE from '../../vendor/three.module.js';

const COPY={
en:{
navExperience:'Experience',navCourse:'Course',navStay:'Stay',navPricing:'Founding access',
heroEyebrow:'FOUNDING EDITION · ADDU ATOLL · MALDIVES',
heroTitle:'Race paradise.<br><em>Recover in luxury.</em>',
heroLede:'A seven-night, invitation-sized endurance journey south of the equator. Four race stages. Three deliberate recovery days. Yacht support, island hospitality and a field capped at 24 athletes.',
requestAccess:'Request founding access',seeCourse:'Explore the real course',statGuests:'athletes maximum',statRace:'race days',statRecover:'recovery days',statNights:'nights all-inclusive',
manifestoEyebrow:'THE IDEA',manifestoTitle:'Not a race with a hotel.<br><em>A reason to go somewhere extraordinary.</em>',
manifestoP1:'Atoll Ascent is designed for people who already have busy calendars, demanding careers and enough race T-shirts. The race becomes the excuse. The experience is the point.',
manifestoP2:'Think expedition logic with luxury hospitality: a moving clubhouse on the water, small-field racing, concierge bike handling, chef-led nutrition, high-touch recovery and evenings worth staying awake for.',
courseEyebrow:'THE COURSE · GROUNDED IN REAL GEOGRAPHY',courseTitle:'Four stages across Addu.',
courseIntro:'Most Maldivian islands cannot support a meaningful bike leg. Addu can. Its western inhabited islands are linked by a paved road from Gan to Hithadhoo, while the surrounding lagoon and islands create a natural theatre for ocean racing.',
bikeHowTitle:'So, how does the bike actually work?',
bikeHowP1:'The Gan to Hithadhoo Link Road is roughly 14 to 16 km each way depending on the measured endpoints. Addu tourism planning explicitly identifies it as a flat route suitable for cycling and triathlon, with an approximately 30 km out-and-back.',
bikeHowP2:'The final 60 km bike leg is therefore two controlled laps, not laps around a resort island. Race bikes move by support truck and boat, transitions sit close to Gan, and any public-road racing would require local permits, traffic management, police coordination and medical coverage.',
routeNote:'Illustrative route architecture only. Exact courses, swim lines, road closures, transition sites and marine transfers require partner surveys, government approvals, local operator sign-off and event-day safety plans.',
stayEyebrow:'YOUR HOME BETWEEN STAGES',stayTitle:'Race from the water.<br><em>Recover above it.</em>',
stayIntro:'The founding format pairs a private premium liveaboard or yacht as the race clubhouse with a three-night recovery stay in an Addu overwater or pool villa. The exact vessel and resort are partner-dependent.',
stay1Title:'The race clubhouse',stay1Copy:'A chartered vessel positioned within Addu becomes breakfast room, briefing theatre, recovery lounge and moving support base. Bikes remain professionally handled on land for road stages.',stay1Meta:'4 race-stage nights · full-board · crew · tender support',
stay2Title:'The recovery island',stay2Copy:'After the final finish, transfer by speedboat to an Addu resort with overwater or pool-villa inventory, spa, lagoon access and enough privacy to disappear for three days.',stay2Meta:'3 recovery nights · spa programme · flexible dining',
stay3Title:'The invisible logistics',stay3Copy:'Bike boxes, mechanics, race nutrition, timing, laundry, luggage, transfers and recovery appointments are handled as one itinerary. Guests should spend their attention on racing and being there.',stay3Meta:'airport to airport concierge',
stayBenchmark:'Feasibility benchmark: existing Deep South liveaboards already operate Gan-linked itineraries, while Addu resorts provide speedboat-accessible villa and spa inventory. <strong>No commercial partnership is implied by this concept website.</strong>',
weekEyebrow:'8 DAYS · 7 NIGHTS',weekTitle:'The week, end to end.',weekIntro:'Four days climb the intensity curve. Then the schedule changes character completely.',
priceEyebrow:'FOUNDING EDITION · TARGET PRICING',priceTitle:'Small field.<br><em>High-touch everything.</em>',
priceIntro:'The pricing below is a launch target, not an offer for sale. It is designed against real luxury liveaboard, resort and endurance-camp benchmarks, then adds the expensive part: producing a safe private race in a remote atoll.',
includedTitle:'Designed to include',
includedList:'7 nights · all meals · non-alcoholic race nutrition · domestic MLE↔GAN transfer · yacht/tender transfers · timed stages · race support boats · mechanics · physiotherapy allocation · recovery programme · luggage and bike handling · photography · closing dinner',
excludedList:'Target package excludes international flights to the Maldives, visas where applicable, personal travel/race insurance, optional alcohol, personal equipment and discretionary excursions.',
fitEyebrow:'WHO THIS IS FOR',fitTitle:'An endurance retreat with social gravity.',
fitCopy:'Founders, executives, investors, creators and ambitious age-group athletes who value hard efforts, rare places and interesting tables. Fast is welcome. Curiosity matters more.',
newsEyebrow:'FOUNDING LIST',newsTitle:'The first edition starts<br><em>with 24 names.</em>',
newsCopy:'Join the private launch list for dates, course validation, partner announcements and founding access. No payment is taken here.',
emailLabel:'Email',profileLabel:'I am joining as',profileAthlete:'Athlete',profileCouple:'Athlete + partner',profilePartner:'Brand / hospitality partner',joinList:'Join founding list',
privacyNote:'This prototype does not silently store your email. Until a secure newsletter endpoint is configured, signup opens a pre-addressed email so you stay in control of what is sent.',
sourcesEyebrow:'REALITY CHECK',sourcesTitle:'Built on real logistics, not brochure physics.',
footerProject:'Concept project by Caldas Studio. A personal experimental project by a self-taught builder who uses AI extensively as part of the learning, research and production process.',
footerDisclaimer:'Concept only. Not yet an announced sporting event, travel package, resort partnership or invitation to purchase. Routes and pricing require local validation, permits, insurance and contracted operators.'
},
pt:{
navExperience:'Experiência',navCourse:'Percurso',navStay:'Hospedagem',navPricing:'Acesso fundador',
heroEyebrow:'EDIÇÃO FUNDADORA · ATOL DE ADDU · MALDIVAS',
heroTitle:'Corra no paraíso.<br><em>Recupere-se em luxo.</em>',
heroLede:'Uma jornada de endurance de sete noites, ao sul da linha do Equador e com grupo por convite. Quatro etapas de prova. Três dias de recuperação. Apoio por iate, hospitalidade nas ilhas e no máximo 24 atletas.',
requestAccess:'Solicitar acesso fundador',seeCourse:'Explorar o percurso real',statGuests:'atletas no máximo',statRace:'dias de prova',statRecover:'dias de recuperação',statNights:'noites all inclusive',
manifestoEyebrow:'A IDEIA',manifestoTitle:'Não é uma prova com hotel.<br><em>É um motivo para ir a um lugar extraordinário.</em>',
manifestoP1:'Atoll Ascent foi pensado para pessoas com agendas cheias, carreiras exigentes e camisetas de prova suficientes. A prova vira a desculpa. A experiência é o objetivo.',
manifestoP2:'Lógica de expedição com hospitalidade de luxo: um clube flutuante, provas em grupo pequeno, concierge para as bikes, nutrição guiada por chef, recuperação de alto nível e noites que valem a pena.',
courseEyebrow:'O PERCURSO · BASEADO NA GEOGRAFIA REAL',courseTitle:'Quatro etapas em Addu.',
courseIntro:'A maioria das ilhas das Maldivas é pequena demais para uma etapa de ciclismo relevante. Addu é diferente. As ilhas habitadas do lado oeste são conectadas por estrada entre Gan e Hithadhoo, enquanto a lagoa e as ilhas ao redor criam um cenário natural para provas no oceano.',
bikeHowTitle:'Então, como o ciclismo funciona de verdade?',
bikeHowP1:'A Link Road entre Gan e Hithadhoo tem aproximadamente 14 a 16 km por sentido, dependendo dos pontos medidos. O próprio planejamento turístico de Addu identifica o trecho como plano e adequado para ciclismo e triatlo, com cerca de 30 km ida e volta.',
bikeHowP2:'Assim, os 60 km da etapa final seriam duas voltas controladas, não voltinhas em torno de uma ilha de resort. As bikes seriam movidas por caminhão e barco de apoio, as transições ficariam próximas a Gan, e qualquer prova em via pública exigiria autorizações locais, controle de tráfego, coordenação policial e cobertura médica.',
routeNote:'Arquitetura de percurso ilustrativa. Percursos finais, linhas de natação, bloqueios de trânsito, transições e deslocamentos marítimos dependem de inspeção local, autorizações governamentais, aprovação de operadores e planos de segurança.',
stayEyebrow:'SUA CASA ENTRE AS ETAPAS',stayTitle:'Corra a partir da água.<br><em>Recupere-se sobre ela.</em>',
stayIntro:'O formato fundador combina um liveaboard premium ou iate privado como base das provas com três noites de recuperação em villa sobre a água ou com piscina em Addu. Embarcação e resort exatos dependem dos parceiros.',
stay1Title:'O clube da prova',stay1Copy:'Uma embarcação fretada em Addu vira sala de café da manhã, briefing, lounge de recuperação e base móvel de apoio. As bikes ficam em terra sob cuidado profissional para as etapas de estrada.',stay1Meta:'4 noites de competição · pensão completa · tripulação · tender',
stay2Title:'A ilha de recuperação',stay2Copy:'Depois da chegada final, um speedboat leva o grupo a um resort em Addu com villas sobre a água ou com piscina, spa, lagoa e privacidade suficiente para desaparecer por três dias.',stay2Meta:'3 noites de recuperação · spa · refeições flexíveis',
stay3Title:'A logística invisível',stay3Copy:'Bike boxes, mecânicos, nutrição, cronometragem, lavanderia, bagagem, transfers e sessões de recuperação entram em um único roteiro. A atenção do hóspede fica na prova e na experiência.',stay3Meta:'concierge de aeroporto a aeroporto',
stayBenchmark:'Referência de viabilidade: liveaboards do Deep South já operam roteiros ligados a Gan, enquanto resorts de Addu oferecem villas e spas acessíveis por speedboat. <strong>Este site conceitual não implica parceria comercial.</strong>',
weekEyebrow:'8 DIAS · 7 NOITES',weekTitle:'A semana completa.',weekIntro:'Quatro dias aumentam a intensidade. Depois, a agenda muda completamente de personalidade.',
priceEyebrow:'EDIÇÃO FUNDADORA · PREÇO-ALVO',priceTitle:'Grupo pequeno.<br><em>Tudo com alto nível de serviço.</em>',
priceIntro:'Os preços abaixo são metas de lançamento, não uma oferta de venda. Partem de referências reais de liveaboards premium, resorts e camps de endurance e acrescentam a parte cara: produzir uma prova privada e segura em um atol remoto.',
includedTitle:'Pensado para incluir',
includedList:'7 noites · todas as refeições · nutrição esportiva sem álcool · transfer doméstico MLE↔GAN · transfers de iate/tender · etapas cronometradas · barcos de apoio · mecânicos · fisioterapia · programa de recuperação · handling de bagagem e bike · fotografia · jantar final',
excludedList:'O pacote-alvo exclui voos internacionais até as Maldivas, vistos quando necessários, seguro pessoal/competição, bebidas alcoólicas opcionais, equipamento pessoal e excursões opcionais.',
fitEyebrow:'PARA QUEM É',fitTitle:'Um retiro de endurance com gravidade social.',
fitCopy:'Fundadores, executivos, investidores, criadores e atletas amadores ambiciosos que valorizam esforço, lugares raros e mesas interessantes. Ser rápido é bem-vindo. Curiosidade importa mais.',
newsEyebrow:'LISTA FUNDADORA',newsTitle:'A primeira edição começa<br><em>com 24 nomes.</em>',
newsCopy:'Entre na lista privada para receber datas, validação de percurso, anúncios de parceiros e acesso fundador. Nenhum pagamento é feito aqui.',
emailLabel:'Email',profileLabel:'Quero participar como',profileAthlete:'Atleta',profileCouple:'Atleta + acompanhante',profilePartner:'Marca / parceiro de hospitalidade',joinList:'Entrar na lista',
privacyNote:'Este protótipo não armazena seu email silenciosamente. Até configurarmos um endpoint seguro, o cadastro abre um email pré-preenchido para você controlar exatamente o que será enviado.',
sourcesEyebrow:'CHECAGEM DE REALIDADE',sourcesTitle:'Logística real, não física de folder.',
footerProject:'Projeto conceitual do Caldas Studio. Um projeto experimental pessoal de um autodidata que usa IA extensivamente como parte do processo de aprendizagem, pesquisa e produção.',
footerDisclaimer:'Conceito apenas. Ainda não é um evento esportivo anunciado, pacote de viagem, parceria com resort ou convite de compra. Percursos e preços dependem de validação local, licenças, seguro e operadores contratados.'
}};

const stages={
en:[
{day:'RACE DAY 1',title:'Lagoon Prologue',location:'Gan lagoon · protected-water concept',distance:['800 m swim','5 km run'],copy:'A fast opener from the water to the island. Short enough to arrive fresh, serious enough to change the mood from holiday to expedition.'},
{day:'RACE DAY 2',title:'Island-Hopping SwimRun',location:'Addu lagoon · island and sandbank sequence',distance:['≈ 3 km swim','≈ 14 km run'],copy:'Point-to-point pairs move between shorelines with boat safety cover. Exact islands depend on access rights, currents and conservation restrictions.'},
{day:'RACE DAY 3',title:'Link Road Time Trial',location:'Gan ↔ Hithadhoo',distance:['30 km bike','5 km sunset run'],copy:'A controlled out-and-back on the connected-island road corridor, then a short run as the light changes. This is where the Maldives finally gives the bike somewhere to breathe.'},
{day:'RACE DAY 4',title:'Equator Finale',location:'Gan transition · western Addu corridor',distance:['1.5 km swim','60 km bike','15 km run'],copy:'Two road laps create the 60 km bike. The run finishes the story through the connected islands, with the lagoon never far away.'}
],
pt:[
{day:'PROVA 1',title:'Prólogo da Lagoa',location:'Lagoa de Gan · conceito em água protegida',distance:['800 m natação','5 km corrida'],copy:'Uma abertura rápida da água para a ilha. Curta para preservar o corpo, séria o suficiente para transformar férias em expedição.'},
{day:'PROVA 2',title:'SwimRun entre Ilhas',location:'Lagoa de Addu · sequência de ilhas e bancos de areia',distance:['≈ 3 km natação','≈ 14 km corrida'],copy:'Duplas seguem de costa a costa com barcos de segurança. Ilhas exatas dependem de acesso, correntes e regras de conservação.'},
{day:'PROVA 3',title:'Contrarrelógio Link Road',location:'Gan ↔ Hithadhoo',distance:['30 km bike','5 km corrida ao pôr do sol'],copy:'Ida e volta controlada no corredor rodoviário entre as ilhas, seguida de uma corrida curta no fim do dia. Aqui a bike finalmente encontra espaço nas Maldivas.'},
{day:'PROVA 4',title:'Final do Equador',location:'Transição em Gan · corredor oeste de Addu',distance:['1,5 km natação','60 km bike','15 km corrida'],copy:'Duas voltas de estrada criam os 60 km de ciclismo. A corrida final atravessa as ilhas conectadas com a lagoa sempre por perto.'}
]};

const timeline={
en:[
['DAY 1','Arrive beyond the equator','MLE → GAN → race base','Airport welcome, domestic transfer, bike build, sunset mobility, opening dinner.','arrival'],
['DAY 2','Lagoon Prologue','Race Stage 1','800 m swim · 5 km run · recovery lunch · reef sunset.','race'],
['DAY 3','Island-Hopping SwimRun','Race Stage 2','≈3 km swim · ≈14 km run · beach finish · dinner afloat.','race'],
['DAY 4','Link Road TT','Race Stage 3','30 km bike · 5 km run · massage allocation · chef table.','race'],
['DAY 5','Equator Finale','Race Stage 4','1.5 km swim · 60 km bike · 15 km run · awards · resort transfer.','race'],
['DAY 6','Reset','Recovery I','Sleep-in breakfast · bodywork · contrast recovery · optional lagoon session.','recovery'],
['DAY 7','Go deeper','Recovery II','Nature park · reef / manta excursion subject to conditions · long lunch · no alarm.','recovery'],
['DAY 8','Carry it home','Recovery III + departure','Sunrise mobility · closing brunch · GAN → MLE or onward travel.','recovery']
],
pt:[
['DIA 1','Além do Equador','MLE → GAN → base da prova','Recepção no aeroporto, voo doméstico, montagem das bikes, mobilidade ao pôr do sol e jantar de abertura.','arrival'],
['DIA 2','Prólogo da Lagoa','Etapa 1','800 m natação · 5 km corrida · almoço de recuperação · pôr do sol no recife.','race'],
['DIA 3','SwimRun entre Ilhas','Etapa 2','≈3 km natação · ≈14 km corrida · chegada na praia · jantar a bordo.','race'],
['DIA 4','Contrarrelógio Link Road','Etapa 3','30 km bike · 5 km corrida · massagem · mesa do chef.','race'],
['DIA 5','Final do Equador','Etapa 4','1,5 km natação · 60 km bike · 15 km corrida · premiação · transfer ao resort.','race'],
['DIA 6','Reset','Recuperação I','Café sem despertador · terapia corporal · contraste · sessão opcional na lagoa.','recovery'],
['DIA 7','Aprofundar','Recuperação II','Nature park · recife / mantas conforme condições · almoço longo · nenhum alarme.','recovery'],
['DIA 8','Levar para casa','Recuperação III + saída','Mobilidade ao amanhecer · brunch final · GAN → MLE ou próxima viagem.','recovery']
]};

const fits={
en:[['01','High earners','People who want the Maldives anyway, but prefer a compelling reason to block the week.'],['02','Ambitious amateurs','Fit enough for four consecutive stages, without needing to be elite.'],['03','Couples','One races. One can join the hospitality and recovery programme, or both can race.'],['04','Founder circles','A field small enough that dinner matters as much as the leaderboard.'],['05','Brands','Selective title, equipment, wellness and hospitality partners with credible fit.']],
pt:[['01','Alta renda','Pessoas que já querem ir às Maldivas, mas preferem ter um motivo irresistível para bloquear a semana.'],['02','Amadores ambiciosos','Condicionamento para quatro etapas seguidas, sem precisar ser atleta de elite.'],['03','Casais','Um compete e outro participa da hospitalidade e recuperação, ou os dois competem.'],['04','Círculos de founders','Grupo pequeno o suficiente para que o jantar importe tanto quanto a classificação.'],['05','Marcas','Parceiros seletivos de título, equipamento, wellness e hospitalidade com aderência real.']]
};

const priceTiers={
en:[
{tier:'FOUNDING ATHLETE',name:'Race Deck',usd:11900,features:['Shared premium yacht cabin','Race programme + full support','Three-night recovery villa','Domestic transfer included'],cta:'Request access'},
{tier:'SIGNATURE',name:'Ocean Suite',usd:14900,features:['Upgraded yacht suite','Enhanced recovery allocation','Premium villa category','Priority concierge'],cta:'Request access',featured:true},
{tier:'FOUNDER CIRCLE',name:'Private Suite',usd:18900,features:['Best available private suite','Private transfer windows','Expanded recovery programme','Founding dinner / partner salon'],cta:'Join founder circle'}
],
pt:[
{tier:'ATLETA FUNDADOR',name:'Race Deck',usd:11900,features:['Cabine premium compartilhada no iate','Provas + apoio completo','Três noites em villa de recuperação','Transfer doméstico incluído'],cta:'Solicitar acesso'},
{tier:'SIGNATURE',name:'Ocean Suite',usd:14900,features:['Suíte superior no iate','Recuperação ampliada','Categoria premium de villa','Concierge prioritário'],cta:'Solicitar acesso',featured:true},
{tier:'CÍRCULO FUNDADOR',name:'Private Suite',usd:18900,features:['Melhor suíte privada disponível','Janelas de transfer privadas','Programa de recuperação ampliado','Jantar fundador / partner salon'],cta:'Entrar no círculo'}
]};

let lang=localStorage.getItem('atoll-lang')||'en';
let currency=localStorage.getItem('atoll-currency')||'USD';
let fx={USD:1,EUR:.87,BRL:5.35};
const currencyFmt={USD:{locale:'en-US',currency:'USD'},EUR:{locale:'en-IE',currency:'EUR'},BRL:{locale:'pt-BR',currency:'BRL'}};

function money(usd){
  const c=currencyFmt[currency];
  return new Intl.NumberFormat(c.locale,{style:'currency',currency:c.currency,maximumFractionDigits:0}).format(usd*fx[currency]);
}
function render(){
  document.documentElement.lang=lang==='pt'?'pt-BR':'en';
  document.querySelectorAll('[data-i18n]').forEach(function(el){const k=el.dataset.i18n;if(COPY[lang][k])el.textContent=COPY[lang][k]});
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){const k=el.dataset.i18nHtml;if(COPY[lang][k])el.innerHTML=COPY[lang][k]});
  document.querySelectorAll('[data-lang]').forEach(function(b){b.classList.toggle('active',b.dataset.lang===lang)});
  document.querySelectorAll('[data-currency]').forEach(function(b){b.classList.toggle('active',b.dataset.currency===currency)});
  document.getElementById('stageGrid').innerHTML=stages[lang].map(function(s){
    return '<article class="stage"><span class="day">'+s.day+'</span><h3>'+s.title+'</h3><span class="location">'+s.location+'</span><div class="distance">'+s.distance.map(function(d){return '<span>'+d+'</span>'}).join('')+'</div><p>'+s.copy+'</p></article>';
  }).join('');
  document.getElementById('timeline').innerHTML=timeline[lang].map(function(i){
    return '<article class="timeline-item '+i[4]+'"><span class="day">'+i[0]+'</span><h3>'+i[1]+'</h3><small>'+i[2]+'</small><p>'+i[3]+'</p></article>';
  }).join('');
  document.getElementById('fitList').innerHTML=fits[lang].map(function(i){
    return '<div class="fit-item"><b>'+i[0]+'</b><div><h3>'+i[1]+'</h3><p>'+i[2]+'</p></div></div>';
  }).join('');
  document.getElementById('priceGrid').innerHTML=priceTiers[lang].map(function(p){
    return '<article class="price-card '+(p.featured?'featured':'')+'"><span class="tier">'+p.tier+'</span><h3>'+p.name+'</h3><div class="amount">'+money(p.usd)+'<small>pp</small></div><ul>'+p.features.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul><a class="btn" href="#newsletter">'+p.cta+'</a></article>';
  }).join('');
}
document.querySelectorAll('[data-lang]').forEach(function(b){b.addEventListener('click',function(){lang=b.dataset.lang;localStorage.setItem('atoll-lang',lang);render()})});
document.querySelectorAll('[data-currency]').forEach(function(b){b.addEventListener('click',function(){currency=b.dataset.currency;localStorage.setItem('atoll-currency',currency);render()})});
render();

async function updateFx(){
  const status=document.getElementById('fxStatus');
  try{
    const rates=await Promise.all([
      fetch('https://api.frankfurter.dev/v2/rate/usd/eur').then(function(r){return r.json()}),
      fetch('https://api.frankfurter.dev/v2/rate/usd/brl').then(function(r){return r.json()})
    ]);
    if(rates[0]&&rates[0].rate&&rates[1]&&rates[1].rate){
      fx.EUR=rates[0].rate;fx.BRL=rates[1].rate;
      status.textContent='USD base · indicative FX '+(rates[0].date||rates[1].date||'')+' · Frankfurter';
      render();
    }
  }catch(e){status.textContent=lang==='pt'?'Preço-base em USD · câmbio indicativo de fallback':'USD base price · indicative fallback FX'}
}
updateFx();

addEventListener('scroll',function(){document.querySelector('.topbar').classList.toggle('scrolled',scrollY>60)},{passive:true});

const form=document.getElementById('newsletterForm');
form.addEventListener('submit',function(e){
  e.preventDefault();
  const email=document.getElementById('email').value.trim();
  const profile=document.getElementById('profile').value;
  const state=document.getElementById('formState');
  if(!/^\S+@\S+\.\S+$/.test(email)){state.textContent=lang==='pt'?'Digite um email válido.':'Enter a valid email.';return}
  const endpoint=window.ATOLL_NEWSLETTER_ENDPOINT;
  if(endpoint){
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,profile:profile,source:'atoll-ascent'})})
      .then(function(r){if(!r.ok)throw new Error('signup');state.textContent=lang==='pt'?'Você entrou na lista.':'You are on the founding list.';form.reset()})
      .catch(function(){state.textContent=lang==='pt'?'Não foi possível enviar agora. Tente novamente.':'Could not submit right now. Please try again.'});
    return;
  }
  const subject=encodeURIComponent('Atoll Ascent founding list');
  const body=encodeURIComponent('Please add '+email+' to the Atoll Ascent founding list.\nProfile: '+profile);
  state.textContent=lang==='pt'?'Abrindo seu email para concluir o cadastro.':'Opening your email app to complete signup.';
  location.href='mailto:hello@caldas.studio?subject='+subject+'&body='+body;
});

const canvas=document.getElementById('atollCanvas');
if(canvas&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  try{
    const renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(32,1,.1,100);
    camera.position.set(0,7.6,12);camera.lookAt(0,0,0);
    scene.add(new THREE.HemisphereLight(0xa9f4ff,0x082633,2.1));
    const key=new THREE.DirectionalLight(0xffdfab,3.5);key.position.set(-4,8,5);scene.add(key);
    const group=new THREE.Group();group.rotation.x=-.12;scene.add(group);
    const water=new THREE.Mesh(new THREE.CircleGeometry(6.3,96),new THREE.MeshPhysicalMaterial({color:0x2ab0bc,transparent:true,opacity:.17,roughness:.2,metalness:.05,side:THREE.DoubleSide}));
    water.rotation.x=-Math.PI/2;water.position.y=-.28;group.add(water);
    const islandMat=new THREE.MeshStandardMaterial({color:0xe7d09d,roughness:.78});
    const greenMat=new THREE.MeshStandardMaterial({color:0x2a675d,roughness:.9});
    const nodes=[[-3.6,-.7,1.2],[-2.7,-.3,1.4],[-1.8,.1,1.55],[-.8,.35,1.55],[.25,.45,1.45],[1.35,.25,1.5],[2.45,-.05,1.35],[3.45,-.25,1.05]];
    nodes.forEach(function(n){
      const isl=new THREE.Mesh(new THREE.CylinderGeometry(n[2],n[2]*1.12,.18,28),islandMat);isl.position.set(n[0],-.05,n[1]);isl.scale.z=.48;group.add(isl);
      const veg=new THREE.Mesh(new THREE.CylinderGeometry(n[2]*.72,n[2]*.84,.12,28),greenMat);veg.position.set(n[0],.08,n[1]);veg.scale.z=.42;group.add(veg);
    });
    const roadPts=nodes.map(function(n){return new THREE.Vector3(n[0],.2,n[1])});
    const roadCurve=new THREE.CatmullRomCurve3(roadPts);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(roadCurve,96,.045,8,false),new THREE.MeshStandardMaterial({color:0xeac17b,emissive:0x5f3d12,emissiveIntensity:.45})));
    const swimCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-3.9,.14,-1.65),new THREE.Vector3(-2.6,.18,-2.25),new THREE.Vector3(-.8,.16,-1.75),new THREE.Vector3(.7,.17,-2.3),new THREE.Vector3(2.3,.15,-1.65)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(swimCurve,100,.032,8,false),new THREE.MeshBasicMaterial({color:0xb2ffff,transparent:true,opacity:.9})));
    const yacht=new THREE.Group();
    const hull=new THREE.Mesh(new THREE.BoxGeometry(1.55,.22,.48),new THREE.MeshStandardMaterial({color:0xf7f6f1,metalness:.15,roughness:.3}));hull.scale.x=1.25;yacht.add(hull);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(.75,.28,.38),new THREE.MeshStandardMaterial({color:0xf4efe2}));deck.position.set(.12,.23,0);yacht.add(deck);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.9,10),new THREE.MeshStandardMaterial({color:0xffffff}));mast.position.set(.25,.76,0);yacht.add(mast);yacht.position.set(1.8,.2,2.1);yacht.rotation.y=-.35;group.add(yacht);
    const rings=[];
    for(let i=0;i<4;i++){
      const r=new THREE.Mesh(new THREE.TorusGeometry(.22,.025,10,30),new THREE.MeshBasicMaterial({color:i===3?0xf0c77a:0xb8f5f6}));
      const p=roadPts[Math.min(roadPts.length-1,1+i*2)];r.position.copy(p);r.position.y=.45;r.rotation.x=Math.PI/2;group.add(r);rings.push(r);
    }
    let pointerX=0,pointerY=0;
    addEventListener('pointermove',function(e){pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5},{passive:true});
    function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
    resize();addEventListener('resize',resize);
    const clock=new THREE.Clock();
    function loop(){
      requestAnimationFrame(loop);const t=clock.getElapsedTime();
      group.rotation.y=Math.sin(t*.14)*.08+pointerX*.12;group.rotation.x=-.12+pointerY*.05;
      yacht.position.y=.2+Math.sin(t*.9)*.04;rings.forEach(function(r,i){r.scale.setScalar(1+Math.sin(t*1.5+i)*.08)});
      renderer.render(scene,camera);
    }
    loop();
  }catch(e){console.warn('Atoll 3D disabled',e)}
}