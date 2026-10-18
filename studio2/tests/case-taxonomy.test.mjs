import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PROJECTS} from '../projects.js';
import {SECTORS,checkCaseTaxonomy,classificationFor,projectsBySector} from '../case-taxonomy.js';
test('every canonical portfolio case has exactly one valid primary application',()=>{
 assert.deepEqual(checkCaseTaxonomy(PROJECTS),[]);
 assert.equal(PROJECTS.length,54);
 assert.equal(new Set(PROJECTS.map(p=>p.id)).size,54);
 for(const p of PROJECTS){const c=classificationFor(p);assert.ok(c?.primary?.name,p.id);assert.ok(Array.isArray(c.related),p.id)}
});
test('explicit architecture and property classification is source-relevant',()=>{
 for(const id of ['bellagio','gaudi-nexus','ghost']){
  const c=classificationFor(PROJECTS.find(p=>p.id===id));
  assert.equal(c.primary.id,'architecture');
  assert.ok(c.context);
 }
});
test('gaming, simulation, science, product, and rendering cover their cases',()=>{
 const expected={blockscreate:'gaming','studio-kona':'gaming','spatial-lab':'simulation',
  noema:'science',atlas:'science',konam:'product','spatial-asset-factory':'production'};
 for(const [id,sector] of Object.entries(expected)){
  assert.equal(classificationFor(PROJECTS.find(p=>p.id===id)).primary.id,sector);
 }
});
test('application filters include adjacent opportunities without changing project act',()=>{
 assert.ok(projectsBySector(PROJECTS,'architecture').some(p=>p.id==='spatial-asset-factory'));
 assert.ok(projectsBySector(PROJECTS,'science').some(p=>p.id==='gaudi-nexus'));
 assert.ok(projectsBySector(PROJECTS,'simulation').some(p=>p.id==='studio-kona'));
 assert.equal(PROJECTS.find(p=>p.id==='gaudi-nexus').act,'workshop');
});
test('all sector identifiers and explanatory copy are distinct',()=>{
 assert.equal(new Set(SECTORS.map(s=>s.id)).size,SECTORS.length);
 for(const sector of SECTORS){assert.ok(sector.name.length>5);assert.ok(sector.description.length>20)}
});
test('project lifecycle is never inferred from its sector',()=>{
 assert.equal(PROJECTS.find(p=>p.id==='canyonmuseum').status,'archived');
 assert.equal(classificationFor(PROJECTS.find(p=>p.id==='canyonmuseum')).primary.id,'product');
 assert.equal(PROJECTS.find(p=>p.id==='konam').status,'living');
});
test('invalid or unknown sector filter shows no projects',()=>{
 assert.equal(projectsBySector(PROJECTS,'unknown-category').length,0);
 assert.equal(projectsBySector(PROJECTS,'all').length,PROJECTS.length);
});
