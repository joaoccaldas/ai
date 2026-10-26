(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pretty = v => String(v || '').replaceAll('_', ' ');
  const get = async u => {
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return r.json();
  };
  const root = document.getElementById('journey');

  function gap(title, detail) {
    return `<div class="nm-gap"><b>Gap · ${esc(title)}</b><p>${esc(detail)}</p></div>`;
  }

  function describe(e) {
    const lines = [`${e.name} (${e.id}) is stored as kind ${e.kind || 'not stored'} with profile_status ${e.profile_status || 'not stored'}.`];
    lines.push((e.aliases || []).length ? `Aliases stored: ${(e.aliases || []).join(', ')}.` : `No aliases field is stored on ${e.id}.`);
    if ((e.traditions || []).length) lines.push(`Tradition ids stored: ${e.traditions.join(', ')}.`);
    if ((e.regions || []).length) lines.push(`Regions stored: ${e.regions.join(', ')}.`);
    if ((e.roles || []).length) lines.push(`Role tags stored: ${e.roles.join(', ')}. These are catalog tags on this record, not a separate finding.`);
    if (e.time) lines.push(`Time field stored on ${e.id}: start_ce ${e.time.start_ce}, end_ce ${e.time.end_ce}, precision ${e.time.precision}.`);
    const dims = Object.entries(e.dimensions || {});
    if (dims.length) lines.push(`Dimension codes stored: ${dims.map(([k, vals]) => `${k}: ${(vals || []).join(', ')}`).join(' | ')}.`);
    else lines.push(`No dimensions object is stored on ${e.id}.`);
    if ((e.related_entities || []).length) lines.push(`Related entity ids stored: ${e.related_entities.join(', ')}.`);
    if (!(e.sources || []).length) lines.push(`No sources array is stored on ${e.id}.`);
    return `<p>${lines.map(esc).join(' ')}</p>`;
  }

  function hasEventDate(e) {
    return e.event_date != null || e.events != null || e.event != null;
  }

  function sourceRows(entities) {
    const rows = [];
    for (const e of entities) {
      const sources = e.sources || [];
      if (!sources.length) {
        rows.push(['Source date', 'Gap', `${e.id} has no sources array, so no source date and no locator are stored.`]);
        continue;
      }
      for (const s of sources) {
        const date = s.date || s.year || s.published || s.accessed || null;
        const locator = s.url || s.locator || s.doi || '';
        if (!date) rows.push(['Source date', 'Gap', `${e.id} source tier ${s.tier || 'not stored'} has no date field. Note stored: ${s.note || 'none'}. Locator: ${locator || 'none stored'}.`]);
        else rows.push(['Source date', String(date), `${e.id} · tier ${s.tier || 'not stored'} · ${s.note || ''} · ${locator}`]);
      }
    }
    return rows;
  }

  function sourceList(entities, media, reviewed) {
    const items = [];
    for (const e of entities) {
      for (const s of e.sources || []) {
        const href = s.url ? `<a href="${esc(s.url)}">${esc(s.url)}</a>` : '<span>No URL stored</span>';
        items.push(`<li><b>${esc(e.id)}</b> · tier ${esc(s.tier || 'not stored')} · profile_status ${esc(e.profile_status || 'not stored')} · note “${esc(s.note || '')}” · locator ${href}</li>`);
      }
    }
    for (const m of media) {
      items.push(`<li><b>${esc(m.provider_title || m.entity_id)}</b> · evidence_status ${esc(m.evidence_status || 'not stored')} · rights ${esc(m.rights || 'not stored')} · display_gate ${esc(m.display_gate || 'not stored')} · locator <a href="${esc(m.provider_page_url)}">${esc(m.provider_page_url)}</a><br>${esc(m.epistemic_note || '')}</li>`);
    }
    for (const m of reviewed) {
      items.push(`<li><b>${esc(m.title)}</b> · media_id ${esc(m.media_id)} · media_class ${esc(m.media_class)} · evidence_status ${esc(m.evidence_status)} · rights_status ${esc(m.rights_status || 'not stored')} · locator <a href="${esc(m.source_page_url)}">${esc(m.source_page_url)}</a></li>`);
    }
    return items.length ? `<ul>${items.join('')}</ul>` : gap('Original sources', 'No source locator is stored for the records on this journey.');
  }

  function compareTable(pair) {
    if (pair.length < 2) return gap('Cross-cultural comparison', 'This journey does not have two catalog records with dimension codes to place side by side.');
    const [a, b] = pair;
    const keys = [...new Set([...Object.keys(a.dimensions || {}), ...Object.keys(b.dimensions || {})])].sort();
    if (!keys.length) return gap('Cross-cultural comparison', `${a.id} and ${b.id} store no dimension codes to compare.`);
    const setA = new Set(Object.values(a.dimensions || {}).flat());
    const setB = new Set(Object.values(b.dimensions || {}).flat());
    const shared = [...setA].filter(x => setB.has(x));
    const head = `<tr><th>Dimension code</th><th>${esc(a.name)} · ${esc(a.profile_status || '')}</th><th>${esc(b.name)} · ${esc(b.profile_status || '')}</th></tr>`;
    const body = keys.map(k => {
      const av = (a.dimensions?.[k] || []).join(', ') || 'not coded on this record';
      const bv = (b.dimensions?.[k] || []).join(', ') || 'not coded on this record';
      return `<tr><th>${esc(k)}</th><td>${esc(av)}</td><td>${esc(bv)}</td></tr>`;
    }).join('');
    return `<p>Shared dimension values stored on both records: ${shared.length ? esc(shared.join(', ')) : 'none'}.</p>
      <div class="nm-scroll"><table class="nm-table">${head}${body}</table></div>
      <p>Open the same pair in Compare: <a href="compare.html?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}">${esc(a.id)} and ${esc(b.id)}</a>.</p>`;
  }

  function absenceReport(terms, catalog, index) {
    if (!terms?.length) return '';
    const catBlob = JSON.stringify(catalog.entities || []).toLowerCase();
    const records = index?.records || [];
    return terms.map(term => {
      const needle = term.toLowerCase();
      const inCatalog = catBlob.includes(needle);
      const hits = records.filter(r => JSON.stringify({ id: r.id, name: r.name, aliases: r.aliases, roles: r.roles, traditions: r.traditions }).toLowerCase().includes(needle));
      if (!inCatalog && !hits.length) return gap(`“${term}”`, `No belief-catalog entity text and no compact-search name, alias, role, or tradition contains “${term}”. That absence is a gap, not a finding that the subject is unrelated.`);
      const ids = hits.slice(0, 12).map(r => `${r.id} ${r.name}`).join('; ');
      return `<p>“${esc(term)}” appears in catalog text: ${inCatalog ? 'yes' : 'no'}. Compact-search hits: ${hits.length}${ids ? ` · ${esc(ids)}` : ''}.</p>`;
    }).join('');
  }

  function candidateBlocks(match, hypotheses, pubmed, ontology) {
    if (!match) return gap('Candidate files', 'This journey is not configured to read the cognition candidate files.');
    const blob = c => JSON.stringify(c).toLowerCase();
    const keep = c => match === '*' || blob(c).includes(match);
    const hyps = (hypotheses?.candidates || []).filter(keep);
    const papers = (pubmed?.records || []).filter(keep);
    const forbiddenOut = (pubmed?.forbidden_outputs || []).filter(x => match === '*' || String(x).toLowerCase().includes(match));
    const ont = (ontology?.forbidden_inferences || []).filter(x => match === '*' || String(x).toLowerCase().includes(match));
    const parts = [];
    parts.push(`<p>File status ${esc(hypotheses?.status || 'not loaded')}. Principle stored: ${esc(hypotheses?.principle || 'not loaded')}.</p>`);
    if (!hyps.length) parts.push(gap('Cross-domain hypotheses', `No candidate in cognition-cross-domain-hypotheses-v1.json matched “${match}”.`));
    else parts.push(hyps.map(c => `<article class="nm-gap"><b>${esc(c.id)} · ${esc(c.candidate_relationship || 'status not stored')}</b><p>${esc(c.question || '')}</p><p>Forbidden conclusion stored: ${esc(c.forbidden_conclusion || 'none stored')}.</p><p>Rivals stored: ${esc((c.rivals || []).join('; ') || 'none')}.</p></article>`).join(''));
    if (papers.length) parts.push(`<h3>PubMed seed rows that matched</h3>` + papers.map(r => `<article class="nm-gap"><b>${esc(r.pmid)} · ${esc(r.year || 'year not stored')} · candidate</b><p>${esc(r.title || '')}</p><p>candidate_use stored: ${esc(r.candidate_use || '')}</p><p>Guardrail stored: ${esc(r.guardrail || 'none stored')}.</p><p>Locator: <a href="https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(r.pmid)}/">PMID ${esc(r.pmid)}</a>${r.doi ? ` · DOI ${esc(r.doi)}` : ''}</p></article>`).join(''));
    else if (match !== '*') parts.push(gap('PubMed seed', `No pubmed-cognition-seed-v1.json record matched “${match}”.`));
    const forb = [...forbiddenOut, ...ont];
    if (forb.length) parts.push(`<h3>Forbidden outputs stored on the candidate files</h3><ul>${forb.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
    else parts.push(gap('Forbidden outputs', `No forbidden-output string matched “${match}”.`));
    return parts.join('');
  }

  function drhBlocks(ids, index) {
    if (!ids?.length) return '';
    return ids.map(id => {
      const r = (index?.records || []).find(x => x.id === id);
      if (!r) return gap(id, 'That id is not in search-index-v18.json.');
      const empty = !(r.dimensions || []).length && !(r.components || []).length && !(r.regions || []).length;
      return `<p><a href="drh.html?q=${encodeURIComponent(r.name)}">${esc(r.name)}</a> (${esc(r.id)}) · kind ${esc(r.kind)} · source_family ${esc(r.source_family)} · profile_status ${esc(r.profile_status || 'not stored')}.</p>${empty ? gap(r.id, 'This compact-search record stores no regions, dimensions, components, or external URL.') : ''}`;
    }).join('');
  }

  function scanBlocks(value, catalog) {
    if (!value) return '';
    const hits = (catalog.entities || []).filter(e => JSON.stringify(e.dimensions || {}).includes(value));
    if (!hits.length) return gap(value, `No catalog dimension value contains ${value}.`);
    return `<ul>${hits.map(e => `<li><a href="entity.html?id=${encodeURIComponent(e.id)}">${esc(e.name)}</a> (${esc(e.id)}) · ${esc(e.profile_status || 'status not stored')}</li>`).join('')}</ul>`;
  }

  async function render() {
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || 'odin-seidr';
    const [pack, catalog, mediaDoc, reviewedDoc, hypotheses, pubmed, ontology] = await Promise.all([
      get('./journeys.json'),
      get('../data/reference/belief-catalog-v1.json'),
      get('./museum-reference-media.json'),
      get('../data/reference/media-reviewed-v1.json'),
      get('../data/candidates/cognition-cross-domain-hypotheses-v1.json'),
      get('../data/candidates/pubmed-cognition-seed-v1.json'),
      get('../data/reference/cognition-mechanism-ontology-v1.json')
    ]);
    let indexPromise = null;
    const journey = (pack.journeys || []).find(j => j.id === id);
    if (!journey) {
      root.innerHTML = gap('Journey', `No journey id “${id}” is listed in journeys.json.`);
      return;
    }
    document.title = `${journey.title} · NOEMA`;
    const byId = new Map((catalog.entities || []).map(e => [e.id, e]));
    const focus = (journey.focus_ids || []).map(fid => byId.get(fid)).filter(Boolean);
    const missingFocus = (journey.focus_ids || []).filter(fid => !byId.has(fid));
    const pair = (journey.compare_ids || []).map(fid => byId.get(fid)).filter(Boolean);
    const media = (mediaDoc.records || []).filter(r => r.entity_id && r.entity_id === journey.media_entity_id);
    const reviewed = (reviewedDoc.items || []).filter(r => (journey.reviewed_media_ids || []).includes(r.media_id));
    const index = { records: [], epistemic_note: 'Compact search index is still loading. Absence checks update when it arrives.' };
    const rules = catalog.rules || [];
    const progress = journey.progress === 'POPULATED_FROM_EXISTING_RECORDS'
      ? 'Populated from existing records. Empty fields below are gaps in those records.'
      : 'In progress. Only records that already exist are shown.';

    const timeline = [];
    if (!focus.some(hasEventDate)) timeline.push(['Event date', 'Gap', 'No focus record stores event_date, event, or events.']);
    for (const e of focus) {
      if (e.time) timeline.push(['Reference range, not an event date', `${e.time.start_ce}–${e.time.end_ce}`, `${e.id} precision ${e.time.precision}.`]);
    }
    timeline.push(...sourceRows(focus));
    for (const m of media) timeline.push(['Later interpretation', m.date_display || 'no date_display stored', `${m.provider_title || m.entity_name}. evidence_status ${m.evidence_status}. ${m.epistemic_note || ''} Locator ${m.provider_page_url || 'none'}.`]);
    for (const m of reviewed) timeline.push(['Later interpretation', m.collection || 'date not stored as its own field', `${m.title}. media_class ${m.media_class}. evidence_status ${m.evidence_status}. ${m.description}`]);
    if (!media.length && !(journey.reviewed_media_ids || []).length) timeline.push(['Later interpretation', 'Gap', 'No museum or reviewed-media id is configured, and no later-interpretation date was found on the focus records.']);

    const related = (journey.related_ids || []).map(rid => (pack.journeys || []).find(j => j.id === rid)).filter(Boolean);
    const answer = [
      focus.map(describe).join('') || gap('Plain-language answer', 'No focus entity id from this journey was found in belief-catalog-v1.json.'),
      missingFocus.map(fid => gap(fid, 'That id is not in belief-catalog-v1.json.')).join(''),
      scanBlocks(journey.scan_dimension_value, catalog)
    ].join('');

    const contested = [];
    const contestedFields = focus.filter(e => e.contested || e.interpretations || e.contested_interpretations);
    if (!contestedFields.length) contested.push(gap('Contested interpretations', 'The focus records have no contested, interpretations, or contested_interpretations field. Nothing below is an added scholarly dispute.'));
    for (const m of reviewed) contested.push(`<p><b>${esc(m.media_id)}</b> · media_class ${esc(m.media_class)} · evidence_status ${esc(m.evidence_status)}. Stored description: ${esc(m.description)}</p>`);
    for (const m of media) if (m.epistemic_note) contested.push(`<p><b>${esc(m.entity_id)} museum record</b> · evidence_status ${esc(m.evidence_status)}. Stored epistemic note: ${esc(m.epistemic_note)}</p>`);

    root.innerHTML = `
      <p class="nm-kicker">Journey</p>
      <h1>${esc(journey.question)}</h1>
      <p><span class="nm-status">${esc(journey.progress)}</span></p>
      <p>${esc(progress)} Catalog status stored on belief-catalog-v1.json: ${esc(catalog.status || 'not stored')}. <span id="indexNote">${esc(index.epistemic_note)}</span></p>
      <section class="nm-answer" id="answer"><h2>Short answer from stored fields</h2>${answer}
        <p>Catalog rules stored with these records:</p>
        <ul>${rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      </section>
      <section class="nm-block" id="timeline"><h2>Timeline</h2>
        <p>Event date, source date, and later interpretation stay in separate rows. A reference range is not an event date.</p>
        <div class="nm-scroll"><table class="nm-table"><tr><th>Row kind</th><th>Date as stored</th><th>What the record says</th></tr>
        ${timeline.map(([k, d, t]) => `<tr><th>${esc(k)}</th><td>${esc(d)}</td><td>${esc(t)}</td></tr>`).join('')}
        </table></div>
      </section>
      <section class="nm-block" id="comparison"><h2>Cross-cultural comparison</h2>
        ${compareTable(pair)}
        <p>${esc(rules.find(r => r.toLowerCase().includes('similarity')) || 'No similarity rule was stored on the catalog.')}</p>
      </section>
      <section class="nm-block" id="sources"><h2>Original sources</h2>${sourceList(focus, media, reviewed)}</section>
      <section class="nm-block" id="contested"><h2>Contested interpretations</h2>      ${contested.join('') || gap('Contested interpretations', 'No contested-reading field and no later-interpretation note were stored.')}</section>
      <section class="nm-block" id="indexFindings"></section>
      <section class="nm-block" id="candidates"><h2>Candidate records, still candidates</h2>${journey.candidate_match ? candidateBlocks(journey.candidate_match, hypotheses, pubmed, ontology) : gap('Candidate layer', 'This journey does not attach the cognition candidate files. They are not evidence for the records above.')}</section>
      <section class="nm-block" id="related"><h2>Related questions</h2>
        <ul>${related.map(j => `<li><a href="journey.html?id=${encodeURIComponent(j.id)}">${esc(j.question)}</a> <span class="nm-status">${esc(j.progress)}</span></li>`).join('')}</ul>
        <p><a href="explore.html?q=${encodeURIComponent(journey.title)}">Search this title in Explore</a></p>
      </section>`;
    indexPromise = get('./search-index-v18.json');
    const findings = document.getElementById('indexFindings');
    if (findings) findings.innerHTML = `<h2>Search-index check</h2>${gap('Compact search index', 'Still loading. Absence checks are not finished.')}`;
    try {
      const loaded = await indexPromise;
      const note = document.getElementById('indexNote');
      if (note) note.textContent = loaded.epistemic_note || 'Search index loaded.';
      if (findings) findings.innerHTML = `<h2>Search-index check</h2>${absenceReport(journey.absence_terms, catalog, loaded) || ''}${drhBlocks(journey.drh_ids, loaded) || gap('DRH profiles', 'This journey lists no DRH ids.')}`;
    } catch (err) {
      if (findings) findings.innerHTML = `<h2>Search-index check</h2>${gap('Compact search index', err.message)}`;
    }
  }

  render().catch(err => {
    root.innerHTML = gap('Journey data', `Could not load the files this page reads: ${err.message}`);
  });
})();
