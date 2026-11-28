/** Pure, browser-safe experimental evidence validator. No generated numerical claims. */
export const STATUS = Object.freeze(['planned','running','measured','independently-reviewed']);
const SHA = /^[0-9a-f]{40}$/i;
const ID = /^EXP-[0-9]{2,3}$/;
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
function canonical(x) {
  if (Array.isArray(x)) return x.map(canonical);
  if (isObj(x)) return Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])]));
  return x;
}
export function compareMetric(m) {
  const hasNumbers = finite(m?.baseline) && finite(m?.candidate);
  const sameEnvironment = isObj(m?.environment?.baseline)
    && isObj(m?.environment?.candidate)
    && JSON.stringify(canonical(m.environment.baseline)) === JSON.stringify(canonical(m.environment.candidate));
  const validDirection = ['higher','lower'].includes(m?.direction);
  const comparable = Boolean(hasNumbers && sameEnvironment && validDirection && m.baseline !== 0);
  return {
    comparable,
    improvement_percent: comparable
      ? Number((100*(m.direction === 'lower'
          ? (m.baseline-m.candidate)/Math.abs(m.baseline)
          : (m.candidate-m.baseline)/Math.abs(m.baseline))).toFixed(2))
      : null,
    reason: !hasNumbers?'not-measured':!sameEnvironment?'environment-mismatch':
      !validDirection?'direction-missing':m.baseline===0?'zero-baseline':'paired'
  };
}
export function inspectRegistry(doc) {
  const errors=[], rows=[], ids=new Set();
  if (!isObj(doc) || doc.schema_version !== 1 || !Array.isArray(doc.experiments))
    return {errors:['Expected schema_version 1 and experiments array'],rows:[]};
  for (const [i,e] of doc.experiments.entries()) {
    const loc='experiments['+i+']';
    if (!ID.test(e?.id || '') || ids.has(e.id)) errors.push(loc+': invalid or duplicate experiment id');
    else ids.add(e.id);
    if (!nonempty(e?.title) || !nonempty(e?.domain) || !nonempty(e?.question))
      errors.push(loc+': title, domain and question required');
    if (!STATUS.includes(e?.status)) errors.push(loc+': unknown status');
    if (!Array.isArray(e?.methods) || e.methods.length < 2 || new Set(e.methods).size !== e.methods.length)
      errors.push(loc+': at least two distinct methods required');
    if (!Array.isArray(e?.metrics)) errors.push(loc+': metrics array required');
    if (!nonempty(e?.fixture) || !nonempty(e?.source_repo))
      errors.push(loc+': fixture and source_repo required');
    const measured=['measured','independently-reviewed'].includes(e.status);
    if (measured) {
      const run=e.run;
      if (!isObj(run) || !SHA.test(run.commit || '') || !SHA.test(run.scene_sha || '')
        || !nonempty(run.device) || !nonempty(run.protocol)
        || !nonempty(run.captured_at) || !nonempty(run.evidence_url))
        errors.push(loc+': measured experiments need pinned commit, scene SHA, device, protocol, date, evidence URL');
      if (!e.metrics?.length) errors.push(loc+': measured experiments need metrics');
    } else if (e.run || (Array.isArray(e.metrics) && e.metrics.some(m=>finite(m?.baseline)||finite(m?.candidate)))) {
      errors.push(loc+': planned/running experiments must not publish measured results without a run');
    }
    const metrics=[];
    if (Array.isArray(e.metrics)) for (const [j,m] of e.metrics.entries()) {
      if (!nonempty(m?.id) || !nonempty(m?.unit) || !['higher','lower'].includes(m?.direction))
        errors.push(loc+'.metrics['+j+']: id, unit, direction required');
      if (measured && (!finite(m.baseline)||!finite(m.candidate)||!nonempty(m.evidence_url)))
        errors.push(loc+'.metrics['+j+']: measured values and evidence URL required');
      const comparison=compareMetric(m);
      metrics.push({id:m?.id,unit:m?.unit,baseline:finite(m?.baseline)?m.baseline:null,
        candidate:finite(m?.candidate)?m.candidate:null,...comparison});
    }
    const reviewed=e.status==='independently-reviewed';
    if (reviewed && (!isObj(e.review) || !Number.isInteger(e.review.raters)
      || e.review.raters < 3 || !nonempty(e.review.protocol)
      || !nonempty(e.review.evidence_url))) errors.push(loc+': independent-review receipt is incomplete');
    if (e.status!=='independently-reviewed' && e.review)
      errors.push(loc+': review receipt supplied outside independently-reviewed state');
    rows.push({id:e.id,title:e.title,domain:e.domain,question:e.question,
      status:e.status,fixture:e.fixture,source_repo:e.source_repo,
      methods:e.methods,metrics,
      evidence_level:reviewed?'independent':measured?'instrumented':'unmeasured',
      run:e.run || null,review:e.review||null});
  }
  return {errors,rows};
}
export function summary(report) {
  const counts=Object.fromEntries(STATUS.map(s=>[s,report.rows.filter(x=>x.status===s).length]));
  return {experiments:report.rows.length,counts,errors:report.errors.length,
    comparable_metrics:report.rows.flatMap(x=>x.metrics).filter(x=>x.comparable).length,
    independently_reviewed:counts['independently-reviewed']};
}
