/**
 * Editorial project classification, not claims of customer delivery.
 * Keep sector meaning separate from seven-act storytelling and lifecycle.
 * Every canonical project must have one primary sector.
 */
export const SECTORS = Object.freeze([
  {id:'architecture',name:'Architecture & Real Estate',short:'Architecture',description:'Built environments, architectural studies and spatial presentations.'},
  {id:'product',name:'Furniture & Product',short:'Product',description:'Physical products, equipment, configuration and retail experiences.'},
  {id:'gaming',name:'Games & Worlds',short:'Gaming',description:'Interactive world-building, playable systems and spatial entertainment.'},
  {id:'simulation',name:'Simulation & XR',short:'Simulation',description:'Interactive models, performance tests, environment simulations and XR.'},
  {id:'science',name:'Science & Discovery',short:'Science',description:'Scientific exploration, evidence systems, observation and learning.'},
  {id:'production',name:'3D Production & R&D',short:'3D R&D',description:'Reusable assets, rendering workflows, experiments and creative tooling.'},
  {id:'web',name:'Websites & Branding',short:'Web & Brand',description:'Web experiences, digital storytelling, identity and customer interfaces.'},
  {id:'automation',name:'AI & Automation',short:'AI & Systems',description:'Knowledge, agents, infrastructure and automation products.'},
  {id:'finance',name:'Finance & Analytics',short:'Finance',description:'Planning, analytics, commercial models and financial information.'},
  {id:'learning',name:'Learning & Utilities',short:'Learning',description:'Education, day-to-day tools and exploratory application prototypes.'}
]);
const PRIMARY_GROUPS = Object.freeze({
  architecture:['bellagio','gaudi-nexus','ghost'],
  product:['konam','canyonmuseum','styleshift','coinsnap'],
  gaming:['studio-kona','blockscreate','blockscreate1','blockscreate11','blockscreateworld','bloxy1','bloxyrivals','bloxyrivals2','tucano','adeline','nova-realm','roblox','nonof','rawdog3d'],
  simulation:['spatial-lab','beavies','beavies-old'],
  science:['noema','atlas','caldaspace'],
  production:['ai-studio','studio2','spatial-asset-factory'],
  web:['sauna','innergroup','oicaldas','innerloom','rawdog','rawdogging'],
  automation:['sintra','nexusflow','brazil-ai','rag','caldas-companion'],
  finance:['metric-monitor','fpa-monitor-app','fpahub','fpa-trends'],
  learning:['kids-python','scratch','english','pantera','strain','countdown','laundry','leotheo','caldasgo']
});
const SECONDARY = Object.freeze({
  bellagio:['simulation','production'], 'gaudi-nexus':['simulation','science','production'],
  ghost:['web'],konam:['product','gaming','production'],canyonmuseum:['production'],
  'spatial-lab':['science','production','architecture'],beavies:['science'], 'beavies-old':['science'],
  noema:['simulation','learning'],atlas:['simulation'],caldaspace:['learning','simulation'],
  'studio-kona':['simulation','production'],blockscreate:['simulation','learning'],
  blockscreateworld:['simulation'], 'rawdog3d':['production','simulation'],
  'ai-studio':['web','architecture'],studio2:['web','learning'],
  'spatial-asset-factory':['architecture','product','simulation'],
  styleshift:['web'],coinsnap:['science'],sintra:['science','learning'],
  nexusflow:['finance'],rag:['science'], 'caldas-companion':['automation'],
  innerloom:['learning'], 'sauna':['architecture'],
  'kids-python':['gaming'],scratch:['gaming'],'english':['learning'],
  'fpa-trends':['science']
});
const CONTEXT = Object.freeze({
  bellagio:'Architectural reconstruction, world composition and visual review. Prototype evidence, not verified property-engineering accuracy.',
  'gaudi-nexus':'Parametric architecture, site truth and environmental studies. Physical validation is distinct from visual presentation.',
  ghost:'Early architecture-themed website concept. No client-project evidence is implied.',
  konam:'Interactive equipment and brand worlds, with reusable room tooling. Active athlete product, not a generic furniture configurator.',
  canyonmuseum:'Historical 3D bike and museum provenance. Preserved archive, not the current product.',
  'studio-kona':'Geospatial terrain, immersive race environments and real-time scenes. XR delivery remains a research track.',
  'spatial-lab':'Controlled comparisons of rendering, streaming, asset reuse and XR. Most experiments are still planned.',
  'spatial-asset-factory':'Procedural furniture, public-realm and scene assets. Registry and two export fixtures tested; production reuse not yet proven.',
  'ai-studio':'Immersive website and spatial gallery techniques useful for brand experiences.',
  studio2:'Narrative portfolio that connects projects, methods, failures and verified source references.',
  blockscreate:'Seeded game worlds and stateful interactions applicable to procedural entertainment.',
  'rawdog3d':'Archived 3D experiments retained for learning rather than marketed as a production capability.',
  noema:'Research and visual evidence exploration. Scientific interpretations and hypotheses must remain distinguishable.',
  atlas:'Astronomy observation and scientific information visualization.',
  caldaspace:'Space-science discovery and educational interaction.',
  styleshift:'Product visualization and digital try-on workflow exploration.',
  coinsnap:'Visual recognition and collectible product discovery.',
  sintra:'Research and knowledge presentation patterns with cross-project applicability.',
  beavies:'Weather and surf forecasting interface. Not a physically validated ocean renderer.',
  'fpa-trends':'Structured finance research and evidence communication.'
});
const byId = new Map(SECTORS.map(s=>[s.id,s]));
const primaryByProject = new Map();
for (const [sector,ids] of Object.entries(PRIMARY_GROUPS)) {
  for (const id of ids) {
    if (primaryByProject.has(id)) throw new Error('Duplicate primary project: '+id);
    primaryByProject.set(id,sector);
  }
}
export function classificationFor(project) {
  const primaryId=primaryByProject.get(project.id);
  if (!primaryId) return null;
  const related=(SECONDARY[project.id]||[]).filter(id=>id!==primaryId).map(id=>byId.get(id));
  return {primary:byId.get(primaryId),related,context:CONTEXT[project.id]||null};
}
export function projectsBySector(projects,id) {
  if(!id||id==='all') return projects;
  return projects.filter(p=>{
    const c=classificationFor(p);
    return c && (c.primary.id===id || c.related.some(s=>s.id===id));
  });
}
export function checkCaseTaxonomy(projects) {
  const ids=new Set(projects.map(p=>p.id)),errors=[];
  if(ids.size!==projects.length)errors.push('Canonical project IDs must be unique');
  for(const p of projects){
    const c=classificationFor(p);
    if(!c)errors.push('Unclassified project: '+p.id);
    if(c?.related.some(s=>!s))errors.push('Invalid related sector: '+p.id);
  }
  for(const id of primaryByProject.keys()) if(!ids.has(id))errors.push('Orphan classification: '+id);
  for(const [id,sec] of Object.entries(SECONDARY)){
    if(!ids.has(id)) errors.push('Orphan related sectors: '+id);
    for(const item of sec) if(!byId.has(item))errors.push('Unknown sector '+item+' on '+id);
  }
  for(const id of Object.keys(CONTEXT)) if(!ids.has(id))errors.push('Orphan editorial context: '+id);
  return errors;
}
