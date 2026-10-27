(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const humanCode = v => String(v || '').replaceAll('_', ' ').toLowerCase();
  const sentence = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const get = async u => {
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return r.json();
  };
  const root = document.getElementById('journey');

  const KIND = {
    DEITY: 'deity',
    BELIEF_SYSTEM: 'tradition',
    BELIEF_COMPONENT: 'idea',
    RITUAL: 'ritual',
    SUBSTANCE: 'substance',
    PRACTICE_COMPLEX: 'practice',
    PROFILE: 'profile'
  };
  const DIM = {
    ONTOLOGY_AGENCY: 'Kind of being',
    KNOWLEDGE_AUTHORITY: 'How knowing is described',
    DEATH_AFTERLIFE: 'Death and what follows',
    RITUAL_GRAMMAR: 'Ritual forms',
    SPECIALIST_ROLE: 'Specialists',
    MATERIAL_MEDIATION: 'Objects and places',
    MORALITY_ORDER: 'Moral order',
    COSMOLOGY: 'The cosmos',
    SACRED_SPACE_TIME: 'Sacred time and place'
  };
  const REL = {
    PHENOMENOLOGICALLY_RESEMBLES: 'Looks similar. That is not a shared origin.',
    POSSIBLE_MECHANISM_FOR: 'A possible mechanism, not a cause we have shown.',
    SOCIAL_ROLE_ASSOCIATED_WITH: 'A possible link with a social role, not a diagnosis.',
    HISTORICAL_DIAGNOSIS_DISPUTED: 'A diagnosis the note itself disputes.'
  };

  function gap(title, detail) {
    return `<div class="nm-gap"><b>${esc(title)}</b><p>${esc(detail)}</p></div>`;
  }

  function dimLabel(k) {
    return DIM[k] || sentence(humanCode(k));
  }

  function kindWord(kind) {
    return KIND[kind] || humanCode(kind) || 'record';
  }

  function linkLabel(url, name) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('britannica.com')) return `Britannica · ${name || 'source'}`;
      if (u.hostname.includes('wikimedia.org') || u.hostname.includes('commons.wikimedia.org')) return 'Wikimedia Commons';
      return u.hostname.replace(/^www\./, '');
    } catch {
      return 'Source';
    }
  }

  function naturalList(items, conj = 'and') {
    const list = (items || []).filter(Boolean);
    if (list.length <= 1) return list.join('');
    if (list.length === 2) return `${list[0]} ${conj} ${list[1]}`;
    return `${list.slice(0, -1).join(', ')}, ${conj} ${list[list.length - 1]}`;
  }

  function termList(terms) {
    return naturalList(terms, 'or') || 'this subject';
  }

  function hasEventDate(e) {
    return e.event_date != null || e.events != null || e.event != null;
  }

  function nameOf(byId, id) {
    return byId.get(id)?.name || id;
  }

  function fieldList(e) {
    const rows = [
      ['Kind', kindWord(e.kind)],
      ['On file', e.profile_status === 'REFERENCE_ONLY' ? 'reference only' : (humanCode(e.profile_status) || 'not written')],
      ['Also called', (e.aliases || []).join(', ') || 'none written'],
      ['Places', (e.regions || []).join(', ') || 'none written'],
      ['Roles', (e.roles || []).join(', ') || 'none written']
    ];
    if (e.time) rows.push(['Span', `${e.time.start_ce}–${e.time.end_ce}, a ${humanCode(e.time.precision)}`]);
    const dims = Object.entries(e.dimensions || {});
    if (dims.length) rows.push(['Themes', dims.map(([k, vals]) => `${dimLabel(k)}: ${(vals || []).map(humanCode).join(', ')}`).join('. ')]);
    return `<dl class="nm-fields">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }

  function recordCard(e, byId) {
    const bits = [];
    if ((e.aliases || []).length) bits.push(`Also called ${naturalList(e.aliases)}.`);
    if ((e.regions || []).length) bits.push(`Placed in ${naturalList(e.regions)}.`);
    const trads = (e.traditions || []).map(id => nameOf(byId, id));
    if (trads.length) bits.push(`Tied to ${naturalList(trads)}.`);
    if ((e.roles || []).length) bits.push(`Written roles: ${naturalList(e.roles)}.`);
    if (e.time) bits.push(`A span of ${e.time.start_ce}–${e.time.end_ce}, not the date of an event.`);
    const pages = e.sources || [];
    const src = pages.length
      ? pages.map(s => `<a href="${esc(s.url || '#')}">${esc(linkLabel(s.url, e.name))}</a>`).join(' ')
      : 'No page of its own.';
    return `<article class="nm-record" tabindex="0" data-id="${esc(e.id)}" data-profile-status="${esc(e.profile_status || '')}">
      <h3>${esc(e.name)}</h3>
      <p>${esc(bits.join(' ') || `${e.name} is listed as a ${kindWord(e.kind)}.`)}</p>
      <p>${src}</p>
      <details class="nm-fold"><summary>The fields on file</summary>${fieldList(e)}</details>
    </article>`;
  }

  function recordSection(focus, byId) {
    if (!focus.length) return gap('The records', 'No catalog entry was found for this chapter.');
    if (focus.length <= 4) return focus.map(e => recordCard(e, byId)).join('');
    const roll = focus.map(e => {
      const place = (e.regions || [])[0] || '';
      const role = (e.roles || []).slice(0, 3).join(', ');
      return `<li><b>${esc(e.name)}</b><span>${esc([place, role].filter(Boolean).join(' · '))}</span></li>`;
    }).join('');
    return `<ul class="nm-roll">${roll}</ul><details class="nm-fold"><summary>Read each name</summary>${focus.map(e => recordCard(e, byId)).join('')}</details>`;
  }

  function sourceList(entities) {
    const items = [];
    for (const e of entities) {
      for (const s of e.sources || []) {
        const href = s.url ? `<a href="${esc(s.url)}">${esc(linkLabel(s.url, e.name))}</a>` : '<span>No page stored</span>';
        items.push(`<li class="nm-source" tabindex="0" data-profile-status="${esc(e.profile_status || '')}" data-tier="${esc(s.tier || '')}">${href}<span>${esc(s.note || 'A reference page.')}</span></li>`);
      }
      if (!(e.sources || []).length) {
        items.push(`<li class="nm-source" tabindex="0" data-profile-status="${esc(e.profile_status || '')}"><b>${esc(e.name)}</b><span>No page of its own.</span></li>`);
      }
    }
    const intro = `<p data-profile-status="REFERENCE_ONLY">A reference sketch: a page that names someone, not a proved history.</p>`;
    return items.length ? `${intro}<ul class="nm-sources">${items.join('')}</ul>` : gap('Sources', 'No page is stored for the records in this chapter.');
  }

  function compareTable(pair, withLine) {
    if (pair.length < 2) return gap('Side by side', 'This chapter does not have two records with coded themes to place next to each other.');
    const [a, b] = pair;
    const keys = [...new Set([...Object.keys(a.dimensions || {}), ...Object.keys(b.dimensions || {})])].sort();
    if (!keys.length) return gap('Side by side', `${a.name} and ${b.name} have no coded themes to compare.`);
    const setA = new Set(Object.values(a.dimensions || {}).flat());
    const setB = new Set(Object.values(b.dimensions || {}).flat());
    const shared = [...setA].filter(x => setB.has(x));
    const head = `<tr><th>Theme</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr>`;
    const body = keys.map(k => {
      const av = (a.dimensions?.[k] || []).map(humanCode).join(', ') || 'not written on this record';
      const bv = (b.dimensions?.[k] || []).map(humanCode).join(', ') || 'not written on this record';
      return `<tr><th data-dimension="${esc(k)}">${esc(dimLabel(k))}</th><td>${esc(av)}</td><td>${esc(bv)}</td></tr>`;
    }).join('');
    const uncoded = keys.filter(k => !(a.dimensions?.[k] || []).length || !(b.dimensions?.[k] || []).length).length;
    const sharedWords = shared.map(humanCode);
    const sharedLine = sharedWords.length ? naturalList(sharedWords) : 'no written label';
    return `<p>${esc(a.name)} and ${esc(b.name)} share ${esc(sharedLine)}. ${uncoded} of ${keys.length} themes are blank on at least one side. A blank is not a no.</p>
      <details class="nm-fold"><summary>The labels, line by line</summary><div class="nm-scroll"><table class="nm-table">${head}${body}</table></div></details>
      <p><a href="compare.html?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}">Compare ${esc(a.name)} and ${esc(b.name)}</a></p>
      ${withLine ? '<p class="nm-quiet">Resemblance is not causation.</p>' : ''}`;
  }

  function absenceReport(terms, catalog, index) {
    if (!terms?.length) return '';
    const catBlob = JSON.stringify(catalog.entities || []).toLowerCase();
    const records = index?.records || [];
    return terms.map(term => {
      const needle = term.toLowerCase();
      const inCatalog = catBlob.includes(needle);
      const hits = records.filter(r => JSON.stringify({ id: r.id, name: r.name, aliases: r.aliases, roles: r.roles, traditions: r.traditions }).toLowerCase().includes(needle));
      if (!inCatalog && !hits.length) {
        return gap(`“${term}” is not in the catalog`, `No entry, and no search name, alias, role, or tradition, contains “${term}”. That absence is a gap, not a finding that the subject is unrelated.`);
      }
      const ids = hits.slice(0, 8).map(r => r.name).join(', ');
      return `<p>“${esc(term)}” ${inCatalog ? 'does appear in the catalog text' : 'does not appear in the catalog text'}. Search names that match: ${hits.length}${ids ? ` — ${esc(ids)}` : ''}.</p>`;
    }).join('');
  }

  function candidateBlocks(match, hypotheses, pubmed, ontology) {
    if (!match) return gap('Research notes', 'This chapter stays with the catalog. The separate notes on mind and experience are not used as evidence here.');
    const blob = c => JSON.stringify(c).toLowerCase();
    const keep = c => match === '*' || blob(c).includes(match);
    const hyps = (hypotheses?.candidates || []).filter(keep);
    const papers = (pubmed?.records || []).filter(keep);
    const forbiddenOut = (pubmed?.forbidden_outputs || []).filter(x => match === '*' || String(x).toLowerCase().includes(match));
    const ont = (ontology?.forbidden_inferences || []).filter(x => match === '*' || String(x).toLowerCase().includes(match));
    const forb = [...new Set([
      ...hyps.map(c => c.forbidden_conclusion).filter(Boolean),
      ...forbiddenOut.map(String),
      ...ont.map(String)
    ])];
    const parts = [];
    parts.push(`<p data-status="${esc(hypotheses?.status || '')}">These notes are questions for review, not findings. ${esc(hypotheses?.principle || '')}</p>`);
    if (forb.length) {
      parts.push(`<h3>We must not conclude</h3><ul class="nm-forbid">${forb.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
    } else parts.push(gap('Limits', `No forbidden conclusion on file matched “${match}”.`));
    if (hyps.length) {
      parts.push(`<details class="nm-fold"><summary>The questions behind those limits</summary>${hyps.map(c => `<article class="nm-note-card" data-relationship="${esc(c.candidate_relationship || '')}"><h3>${esc(c.question || c.id)}</h3><p>${esc(REL[c.candidate_relationship] || humanCode(c.candidate_relationship || ''))}</p><p>Other explanations still on the table: ${esc((c.rivals || []).join('; ') || 'none stored')}.</p></article>`).join('')}</details>`);
    } else parts.push(gap('Questions', `No question on file matched “${match}”.`));
    if (papers.length) {
      parts.push(`<details class="nm-fold"><summary>Papers in the seed list</summary>${papers.map(r => `<article class="nm-note-card"><h3>${esc(r.title || r.pmid)}</h3><p>${esc(r.year || 'Year not stored')}. Still a candidate, not a finding.</p><p>${esc(r.candidate_use || '')}</p><p>Limit written on the note: ${esc(r.guardrail || 'none stored')}.</p><p><a href="https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(r.pmid)}/">PubMed ${esc(r.pmid)}</a></p></article>`).join('')}</details>`);
    } else if (match !== '*') parts.push(gap('Papers', `No seed paper matched “${match}”.`));
    return parts.join('');
  }

  function drhBlocks(ids, index) {
    if (!ids?.length) return '';
    return `<h3>Profiles from the religious-history file</h3>` + ids.map(id => {
      const r = (index?.records || []).find(x => x.id === id);
      if (!r) return gap(id, 'That id is not in the search index.');
      const empty = !(r.dimensions || []).length && !(r.components || []).length && !(r.regions || []).length;
      return `<p><a href="drh.html?q=${encodeURIComponent(r.name)}">${esc(r.name)}</a> is named in the search index.${empty ? ' The index row has no region, theme, or link of its own.' : ''}</p>`;
    }).join('');
  }

  function denomModel(catalog, focus) {
    const n = (catalog.entities || []).length;
    const locators = focus.reduce((sum, e) => sum + (e.sources || []).length, 0);
    const tiers = new Set(focus.flatMap(e => (e.sources || []).map(s => s.tier || '')));
    const encyclopedia = !locators || [...tiers].every(t => t === 'ENCYCLOPEDIA_REFERENCE');
    const noSource = focus.filter(e => !(e.sources || []).length);
    const missing = [];
    if (!focus.length) missing.push('the catalog has no entry for this subject');
    if (focus.length && !focus.some(hasEventDate)) missing.push('no dated event');
    if (focus.some(e => (e.sources || []).some(s => !(s.date || s.year || s.published || s.accessed)))) missing.push('no date on those pages');
    if (noSource.length === 1) missing.push(`${noSource[0].name} has no source of its own`);
    else if (noSource.length) missing.push(`${naturalList(noSource.map(e => e.name))} have no source of their own`);
    const withPages = focus.filter(e => (e.sources || []).length).map(e => e.name);
    const without = focus.filter(e => !(e.sources || []).length).map(e => e.name);
    let have;
    if (!focus.length) have = `No name for this subject. The shelf holds ${n} other names.`;
    else if (focus.length > 4 && encyclopedia) have = `A name and a page for each. They sit among ${n} names.`;
    else if (!withPages.length) have = `No encyclopedia page on these records. The catalog holds ${n} names.`;
    else have = `Encyclopedia pages for ${naturalList(withPages)}. The catalog holds ${n} names.`;
    const missingText = missing.length ? missing.map(s => `${sentence(s).replace(/\.$/, '')}.`).join(' ') : 'Nothing empty showed up on these records.';
    return { have, missingText, locators, focus: focus.length, catalog: n };
  }

  function denomHtml(model) {
    return `<div class="nm-denom-grid"><div class="nm-denom-card"><span class="nm-label">What we have so far</span><b>${esc(model.have)}</b></div><div class="nm-denom-card"><span class="nm-label">What we don't know yet</span><p>${esc(model.missingText)} What we have not recorded is not the same as false.</p></div></div>`;
  }

  function exactTitle(catalog, word) {
    const needle = word.toLowerCase();
    return (catalog.entities || []).some(e => String(e.name || '').toLowerCase() === needle || (e.aliases || []).some(a => String(a).toLowerCase() === needle));
  }

  function leadText(focus, journey, catalog) {
    if (!focus.length) {
      return `No catalog entry is stored for ${termList(journey.absence_terms)}. Anything that names the subject stays a question, not a finding.`;
    }
    if (journey.id === 'gods-pantheon') {
      const shown = focus.slice(0, 2).map(e => e.name).join(' and ');
      return `${focus.length} deities are named here, including ${shown}. Each record is a reference sketch: a name and an encyclopedia page, not a proved history. Resemblance is not causation.`;
    }
    if (journey.id === 'ancestors-spirits') {
      const first = focus[0];
      const aliases = (first.aliases || []).length ? ` Also called ${naturalList(first.aliases)}.` : '';
      return `${first.name} is in the catalog as an ${kindWord(first.kind)}.${aliases} No page of its own is stored, and no reference picture is on file. Other records that use the same label are listed below. Resemblance is not causation.`;
    }
    if (journey.id === 'shamanism-altered') {
      const names = naturalList(focus.map(e => e.name));
      const missing = exactTitle(catalog, 'shamanism')
        ? 'One of these records is titled shamanism.'
        : 'None of them is a single entry named shamanism.';
      return `${names} are on file. ${missing} No reference picture is stored.`;
    }
    const first = focus[0];
    const aliases = (first.aliases || []).length ? `, also called ${naturalList(first.aliases)}` : '';
    const lines = [`${first.name} is in the catalog as a ${kindWord(first.kind)}${aliases}.`];
    const term = (journey.absence_terms || [])[0];
    if (term) lines.push(`${sentence(term)} is not written on these records. That is a gap, not a verdict that the two are unrelated.`);
    else lines.push('What follows is only what those records actually hold.');
    return lines.join(' ');
  }

  function catalogShare(catalog) {
    const entities = catalog.entities || [];
    const withSources = entities.filter(e => (e.sources || []).length).length;
    const mark = catalog.status === 'REFERENCE_PROFILE_UNREVIEWED'
      ? 'The catalog file has not been reviewed as history.'
      : `The file is marked ${humanCode(catalog.status || 'not stored')}.`;
    return `${withSources} of ${entities.length} names have a page of their own. ${mark}`;
  }

  function timelineHtml(focus, reviewed, media) {
    const noEvent = !focus.length || !focus.some(hasEventDate);
    const spans = focus.filter(e => e.time && e.time.start_ce != null && e.time.end_ce != null).map(e => {
      const attr = e.time.precision ? ` data-precision="${esc(e.time.precision)}"` : '';
      return `<span${attr}>${esc(e.name)} is placed around ${esc(String(e.time.start_ce))}–${esc(String(e.time.end_ce))}</span>`;
    });
    const openSpans = focus.filter(e => e.time && (e.time.start_ce == null || e.time.end_ce == null));
    const undated = focus.some(e => (e.sources || []).some(s => !(s.date || s.year || s.published || s.accessed)));
    const pics = (reviewed || []).length + (media || []).length;
    const bits = [];
    bits.push(noEvent ? 'No dated event is stored.' : 'A dated event is stored.');
    if (spans.length === 1) bits.push(`A span, not a dated event: ${spans[0]}.`);
    else if (spans.length) bits.push(`Spans, not dated events: ${spans.join('; ')}.`);
    if (openSpans.length) bits.push(openSpans.map(e => `${esc(e.name)} is marked ${esc(humanCode(e.time.precision || 'without a year'))}, with no start or end year.`).join(' '));
    if (undated) bits.push('The pages have no date of their own.');
    if (!focus.length) bits.push('With no catalog entry, there is no date to put on a line.');
    if (pics === 1) bits.push('The picture above is later art, not a catalog date.');
    else if (pics) bits.push('The pictures above are later art, not catalog dates.');
    const paragraph = `<p>${bits.join(' ')}</p>`;
    const placed = focus.filter(e => e.time && e.time.start_ce != null && e.time.end_ce != null && Number.isFinite(Number(e.time.start_ce)) && Number.isFinite(Number(e.time.end_ce)));
    if (!placed.length) return `${paragraph}<p class="nm-rail-empty">Nothing dated is on file to place on a line.</p>`;
    const starts = placed.map(e => Number(e.time.start_ce));
    const ends = placed.map(e => Number(e.time.end_ce));
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const span = Math.max(1, max - min);
    const rails = placed.map(e => {
      const a = Number(e.time.start_ce);
      const b = Number(e.time.end_ce);
      const left = ((a - min) / span) * 100;
      const width = Math.max(6, Math.min(100 - left, ((b - a) / span) * 100));
      return `<li class="nm-tick" tabindex="0"><b>${esc(e.name)}</b><span class="nm-rail-track" aria-hidden="true"><i style="left:${left.toFixed(1)}%;width:${Math.min(100, width).toFixed(1)}%"></i></span><span class="nm-rail-years">${esc(String(a))}–${esc(String(b))}. A span on file, not a dated event.</span></li>`;
    }).join('');
    return `${paragraph}<ol class="nm-rail" aria-label="Spans written on these records">${rails}</ol><p class="nm-quiet">The line uses only the years already written on these records.</p>`;
  }

  function scanBlocks(value, catalog, focus) {
    if (!value) return '';
    const hits = (catalog.entities || []).filter(e => JSON.stringify(e.dimensions || {}).includes(value));
    const extra = hits.filter(e => !focus.some(f => f.id === e.id));
    if (!hits.length) return gap(humanCode(value), `No catalog theme contains ${humanCode(value)}.`);
    if (!extra.length) return '';
    return `<p>Other records coded with “${esc(humanCode(value))}”:</p><ul>${extra.map(e => `<li><a href="entity.html?id=${encodeURIComponent(e.id)}">${esc(e.name)}</a></li>`).join('')}</ul>`;
  }

  function afterPaint() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function remoteOk(url) {
    return !!url && !/artic\.edu/i.test(url);
  }

  const LOCAL_MEDIA = {
    'MEDIA-ODIN-GEHRTS-001': ['media/odin-gehrts-1888.jpg', 480, 732],
    'MEDIA-WITCH-DURER-001': ['media/witch-durer-1500.jpg', 640, 1018],
    'MEDIA-WITCH-BALDUNG-001': ['media/witch-baldung-sabbath.jpg', 640, 932],
    'MEDIA-ZEUS-HYPSISTOS-DION-001': ['media/zeus-hypsistos.jpg', 640, 960],
    'MEDIA-OSIRIS-LOUVRE-001': ['media/osiris-louvre.jpg', 640, 960]
  };
  const LOCAL_ENTITY = {
    'GOD-ISIS': ['media/isis-horus.jpg', 640, 948],
    'GOD-SHIVA': ['media/shiva-nataraja.jpg', 640, 800]
  };

  function shortNote(note) {
    const text = String(note || '').trim();
    if (!text) return '';
    const parts = text.split(/(?<=\.)\s+/).slice(0, 2);
    return parts.join(' ');
  }

  function figureHtml(v, hero) {
    const id = hero ? ' id="journeyFigure"' : '';
    const frame = hero ? `<div class="nm-plate-frame" style="--ar:${Number(v.w)}/${Number(v.h)}">` : '';
    const mark = hero ? `<em class="nm-plate-mark">${esc(v.license)} · Reference art — not evidence.</em>` : '';
    const frameEnd = hero ? `${mark}</div>` : '';
    return `<figure${id} class="nm-figure${hero ? ' is-hero' : ''}" tabindex="0" data-evidence-status="${esc(v.status || '')}" data-license="${esc(v.license || '')}">
      ${frame}<img src="${esc(v.src)}" width="${Number(v.w)}" height="${Number(v.h)}" alt="" loading="lazy" decoding="async">${frameEnd}
      <figcaption>
        <b>${esc(v.title)}</b>
        <span>${esc(v.credit)} · ${esc(v.license)}</span>
        <span>Reference art — not evidence.</span>
        <span>${esc(shortNote(v.note))}</span>
        <a href="${esc(v.href)}">Source and rights</a>
      </figcaption>
    </figure>`;
  }

  function plateFromReviewed(item) {
    if (!item) return null;
    const local = LOCAL_MEDIA[item.media_id];
    const src = local ? local[0] : (remoteOk(item.image_url) ? item.image_url : '');
    if (!src) return null;
    return {
      src, w: local ? local[1] : 960, h: local ? local[2] : 640,
      entityId: item.entity_id || '',
      title: item.title,
      credit: item.creator_or_photographer || item.collection || '',
      license: item.license,
      klass: item.media_class,
      status: item.evidence_status,
      note: item.description,
      href: item.source_page_url
    };
  }

  function plateFromMuseum(rec) {
    if (!rec || !remoteOk(rec.image_url) || !['CC0', 'PUBLIC_DOMAIN'].includes(rec.rights)) return null;
    const local = LOCAL_ENTITY[rec.entity_id];
    return {
      src: local ? local[0] : rec.image_url,
      w: local ? local[1] : 843,
      h: local ? local[2] : 640,
      entityId: rec.entity_id,
      title: rec.provider_title,
      credit: [rec.creator, rec.date_display, rec.provider].filter(Boolean).join(' · '),
      license: rec.rights,
      klass: rec.display_class,
      status: rec.evidence_status,
      note: rec.epistemic_note,
      href: rec.provider_page_url
    };
  }

  function figuresHtml(reviewed, museumRows, journey, showResemblance) {
    const plates = [];
    const seen = new Set();
    for (const id of journey.reviewed_media_ids || []) {
      const plate = plateFromReviewed((reviewed || []).find(m => m.media_id === id));
      if (!plate) continue;
      plates.push(plate);
      if (plate.entityId) seen.add(plate.entityId);
    }
    for (const rec of museumRows || []) {
      if (seen.has(rec.entity_id)) continue;
      const plate = plateFromMuseum(rec);
      if (!plate) continue;
      plates.push(plate);
      seen.add(rec.entity_id);
    }
    if (!plates.length) return '';
    const [hero, ...rest] = plates;
    const row = rest.length ? `<div class="nm-plate-row" aria-label="More reference plates">${rest.map(p => figureHtml(p, false)).join('')}</div>` : '';
    const controls = rest.length ? `<div class="nm-plate-controls"><button type="button" class="nm-plate-prev">Previous picture</button><button type="button" class="nm-plate-next">Next picture</button></div>` : '';
    const line = showResemblance ? '<p class="nm-quiet">Resemblance is not causation.</p>' : '';
    const know = `<details class="nm-fold"><summary>How these pictures are used</summary><p>Each plate is a picture someone else made. It is not proof of a catalog record, a date, or a historical link. ${showResemblance ? 'Resemblance is not causation.' : 'Looking alike, in paint or in a label, is not a shared origin.'}</p></details>`;
    return figureHtml(hero, true) + `<button type="button" class="nm-see">See the whole picture</button>` + controls + row + line + know;
  }

  function syncSee(scope) {
    const see = scope.querySelector('.nm-see');
    const fig = scope.querySelector('#journeyFigure');
    if (!see || !fig) return;
    see.textContent = fig.classList.contains('is-focus') ? 'Show the crop' : 'See the whole picture';
  }

  function bindPlates(scope) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const row = scope.querySelector('.nm-plate-row');
    const prev = scope.querySelector('.nm-plate-prev');
    const next = scope.querySelector('.nm-plate-next');
    const step = () => Math.max(160, Math.round((row ? row.clientWidth : 240) * 0.72));
    if (row && prev && next) {
      prev.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
      next.addEventListener('click', () => row.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    }
    const see = scope.querySelector('.nm-see');
    const fig = scope.querySelector('#journeyFigure');
    if (see && fig) {
      see.addEventListener('click', event => {
        event.stopPropagation();
        fig.classList.toggle('is-focus');
        syncSee(scope);
      });
    }
    syncSee(scope);
  }

  function bindBeats(scope) {
    const links = [...scope.querySelectorAll('.nm-beats a')];
    if (!links.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    links.forEach(a => {
      a.addEventListener('click', event => {
        const el = scope.querySelector(a.getAttribute('href'));
        if (!el) return;
        event.preventDefault();
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        links.forEach(link => link.classList.toggle('is-current', link === a));
      });
    });
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0.01 });
    links.forEach(a => {
      const el = scope.querySelector(a.getAttribute('href'));
      if (el) obs.observe(el);
    });
  }

  function bindFocus(scope) {
    scope.querySelectorAll('.nm-tick, .nm-source, .nm-record, .nm-figure').forEach(el => {
      const toggle = event => {
        if (event.target.closest('a, summary, details, button')) return;
        el.classList.toggle('is-focus');
        if (el.id === 'journeyFigure') syncSee(scope);
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        el.classList.toggle('is-focus');
      });
    });
  }

  function shelfLinks() {
    const rows = [
      ['human-meaning-atlas.html', 'Atlas', 'Where and when dated evidence is mapped.'],
      ['compare.html', 'Compare', 'Two records, side by side.'],
      ['observatory.html', 'Observatory', 'Optional. A guided look. This chapter does not depend on it.'],
      ['deep-time.html', 'Deep Time', 'What was found before anyone called it religion.'],
      ['research.html', 'Research and methods', 'The files, the review queue, and the notes on what is missing.'],
      ['drh.html', 'Religious history', 'Expert-coded entries, each tied to a time and a place.'],
      ['religion-decomposition.html', 'Austronesian beliefs', 'Pulotu societies, taken apart. A shared piece is not a common origin.']
    ];
    return rows.map(([href, title, note]) => `<li><a href="${href}"><b>${esc(title)}</b><small>${esc(note)}</small></a></li>`).join('');
  }

  function bindAccent() {
    const bar = document.querySelector('.nm-scroll-accent');
    const wash = document.querySelector('.nm-atmosphere');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      if (bar) bar.hidden = true;
      return;
    }
    const paint = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (wash) wash.style.setProperty('--my', `${Math.round(p * 70)}%`);
      const img = document.querySelector('#journeyFigure:not(.is-focus) img');
      if (!img) return;
      const r = img.getBoundingClientRect();
      const shift = Math.max(-12, Math.min(12, (window.innerHeight / 2 - (r.top + r.height / 2)) / 40));
      img.style.transform = `translateY(${shift}px)`;
    };
    window.addEventListener('scroll', paint, { passive: true });
    paint();
  }

  async function render() {
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || 'odin-seidr';
    await afterPaint();
    const [pack, catalog, mediaDoc, reviewedDoc, hypotheses, pubmed, ontology] = await Promise.all([
      get('./journeys.json'),
      get('../data/reference/belief-catalog-v1.json'),
      get('./museum-reference-media.json'),
      get('../data/reference/media-reviewed-v1.json'),
      get('../data/candidates/cognition-cross-domain-hypotheses-v1.json'),
      get('../data/candidates/pubmed-cognition-seed-v1.json'),
      get('../data/reference/cognition-mechanism-ontology-v1.json')
    ]);
    const journey = (pack.journeys || []).find(j => j.id === id);
    const rest = document.getElementById('journeyRest') || root;
    const questionEl = document.getElementById('journeyQuestion');
    const denomEl = document.getElementById('denominator');
    const kicker = document.getElementById('journeyKicker');
    if (!journey) {
      rest.innerHTML = gap('This chapter', `No chapter id “${id}” is listed.`);
      return;
    }
    document.title = `${journey.title} · NOEMA`;
    if (kicker) kicker.textContent = journey.title;
    if (questionEl) questionEl.textContent = journey.question;
    root.dataset.progress = journey.progress || '';
    const byId = new Map((catalog.entities || []).map(e => [e.id, e]));
    const focus = (journey.focus_ids || []).map(fid => byId.get(fid)).filter(Boolean);
    const missingFocus = (journey.focus_ids || []).filter(fid => !byId.has(fid));
    const pair = (journey.compare_ids || []).map(fid => byId.get(fid)).filter(Boolean);
    const media = (mediaDoc.records || []).filter(r => r.entity_id && r.entity_id === journey.media_entity_id);
    const reviewed = (reviewedDoc.items || []).filter(r => (journey.reviewed_media_ids || []).includes(r.media_id));
    const rules = catalog.rules || [];
    const model = denomModel(catalog, focus);
    if (denomEl) {
      denomEl.innerHTML = denomHtml(model);
      denomEl.dataset.locators = String(model.locators);
      denomEl.dataset.focus = String(model.focus);
      denomEl.dataset.catalog = String(model.catalog);
      denomEl.dataset.rule = 'UNKNOWN is not false';
    }
    const leadEl = document.getElementById('journeyLead');
    const lead = leadText(focus, journey, catalog);
    if (leadEl) {
      leadEl.textContent = lead;
      if (focus.length && focus.every(e => e.profile_status === 'REFERENCE_ONLY')) leadEl.dataset.profileStatus = 'REFERENCE_ONLY';
      else delete leadEl.dataset.profileStatus;
    }
    const showResemblance = journey.id !== 'gods-pantheon' && pair.length < 2;

    const visual = document.getElementById('journeyVisual');
    const museumForFocus = (mediaDoc.records || []).filter(r => (journey.focus_ids || []).includes(r.entity_id));
    if (visual) {
      const plates = figuresHtml(reviewed, museumForFocus, journey, showResemblance);
      const thin = !focus.length
        ? `<p class="nm-thin-note"><b>This chapter is thin.</b> No catalog name is stored for it. ${plates ? 'The picture is reference art — not a finding.' : 'No picture is stored, and none is added here.'}</p>`
        : '';
      const empty = plates ? '' : `<p class="nm-thin-note" id="journeyEmpty"><b>No picture on file.</b> This chapter does not add one.</p>`;
      visual.innerHTML = thin + (plates || empty);
    }

    const related = (journey.related_ids || []).map(rid => (pack.journeys || []).find(j => j.id === rid)).filter(Boolean);
    const thinChapter = ['ancestors-spirits', 'shamanism-altered', 'unexplained-experiences'].includes(journey.id);
    const scan = scanBlocks(journey.scan_dimension_value, catalog, focus);
    const exact = missingFocus.map(fid => gap(fid, 'That id is not in the catalog.')).join('') + (thinChapter ? '' : scan);

    const index = { epistemic_note: '' };
    const beats = `<nav class="nm-beats" aria-label="In this chapter"><a href="#records">The names</a><a href="#comparison">Side by side</a><a href="#sources">Pages</a><a href="#timeline">Time</a><a href="#indexFindings">The gap</a></nav><button type="button" class="nm-continue">Continue</button>`;
    rest.innerHTML = beats + `
      <section class="nm-block" id="records">
        <p class="nm-label">Written down</p>
        <h2>The names</h2>
        ${recordSection(focus, byId)}
      </section>
      <section class="nm-block" id="comparison">
        <p class="nm-label">Beside each other</p>
        <h2>Where they meet</h2>
        ${compareTable(pair, journey.id !== 'gods-pantheon')}
      </section>
      <section class="nm-block" id="sources">
        <p class="nm-label">Reading</p>
        <h2>Pages you can open</h2>
        ${sourceList(focus)}
      </section>
      <section class="nm-block" id="timeline">
        <p class="nm-label">Time</p>
        <h2>Dates, and what they are not</h2>
        ${timelineHtml(focus, reviewed, media)}
      </section>
      <section class="nm-block" id="indexFindings">
        <p class="nm-label">The gap</p>
        <h2>What we looked for</h2>
        <p id="indexNote">${esc(index.epistemic_note)}</p>
        ${thinChapter ? scan : ''}
      </section>
      <section class="nm-block" id="candidates">
        <p class="nm-label">Still open</p>
        <h2>Questions we are not ready to settle</h2>
        ${journey.candidate_match ? candidateBlocks(journey.candidate_match, hypotheses, pubmed, ontology) : gap('Research notes', 'This chapter stays with the catalog. The separate notes on mind and experience are not used as evidence here.')}
      </section>
      <details class="nm-fold nm-how" id="how">
        <summary>How we know</summary>
        <p>${journey.progress === 'POPULATED_FROM_EXISTING_RECORDS' ? 'Drawn from records already on file. Empty fields are gaps in those records.' : 'In progress. Only records that already exist are shown.'} ${esc(catalogShare(catalog))}</p>
        <p>The catalog file says these limits, in its own words:</p>
        <ul>${rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        <div class="nm-exact">${exact}</div>
      </details>
      <section class="nm-block" id="related">
        <p class="nm-label">Continue</p>
        <h2>Other chapters</h2>
        <ul class="nm-next">${related.map(j => `<li><a href="journey.html?id=${encodeURIComponent(j.id)}" data-progress="${esc(j.progress || '')}">${esc(j.title)}</a></li>`).join('')}</ul>
        <h2>Also on the shelf</h2>
        <ul class="nm-next">${shelfLinks()}</ul>
        <p><a href="explore.html?q=${encodeURIComponent(journey.title)}">Search this in Explore</a></p>
      </section>`;
    bindFocus(root);
    bindPlates(root);
    bindBeats(root);
    bindContinue(root);
    if (window.noemaRememberChapter) {
      window.noemaRememberChapter({
        href: 'journey.html?id=' + encodeURIComponent(journey.id),
        title: journey.title,
        question: journey.question
      });
    }
    const findings = document.getElementById('indexFindings');
    try {
      const loaded = await get('./search-index-v18.json');
      const note = document.getElementById('indexNote');
      if (note) note.textContent = 'Names below were checked against the catalog and the search index. A match is not a shared history.';
      if (note) note.dataset.epistemicNote = loaded.epistemic_note || '';
      const body = `${absenceReport(journey.absence_terms, catalog, loaded) || ''}${drhBlocks(journey.drh_ids, loaded) || ''}`;
      if (findings && body) findings.insertAdjacentHTML('beforeend', body);
      else if (findings && !(thinChapter && scan)) findings.insertAdjacentHTML('beforeend', gap('Nothing extra to check', 'This chapter did not ask the index for a missing word.'));
    } catch (err) {
      if (findings) findings.insertAdjacentHTML('beforeend', gap('Search index', err.message));
    }
    if (window.noemaRestoreScroll) window.noemaRestoreScroll();
  }

  function bindContinue(scope) {
    const button = scope.querySelector('.nm-continue');
    if (!button) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stops = [
      ['#records', 'Continue to the names'],
      ['#comparison', 'Continue to what sits beside them'],
      ['#sources', 'Continue to the pages'],
      ['#timeline', 'Continue to time'],
      ['#indexFindings', 'Continue to the gap'],
      ['#candidates', 'Continue to what stays open'],
      ['#related', 'Continue to other chapters']
    ];
    const nextStop = () => {
      const y = window.scrollY + 96;
      return stops
        .map(([id, text]) => ({ el: scope.querySelector(id), text }))
        .find(row => row.el && row.el.offsetTop > y) || null;
    };
    const label = () => {
      const next = nextStop();
      button.textContent = next ? next.text : 'You are at the end of what is on file';
      return next;
    };
    label();
    window.addEventListener('scroll', () => label(), { passive: true });
    button.addEventListener('click', () => {
      const next = label();
      if (!next || !next.el) return;
      next.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  bindAccent();
  render().catch(err => {
    const rest = document.getElementById('journeyRest') || root;
    rest.innerHTML = gap('This chapter', `The files for this page did not load: ${err.message}`);
  });
})();
