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

  function statusPhrase(s) {
    if (s === 'REFERENCE_ONLY') return 'a reference sketch: a name we can point to, not a proved history';
    if (!s) return 'a status that was not written down';
    return humanCode(s);
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

  function nameOf(byId, id) {
    return byId.get(id)?.name || id;
  }

  function recordCard(e, byId) {
    const aliases = (e.aliases || []).length ? ` Also called ${e.aliases.join(', ')}.` : '';
    const regions = (e.regions || []).length ? ` Placed in ${e.regions.join(' and ')}.` : '';
    const roles = (e.roles || []).length ? ` Roles written on the record: ${e.roles.join(', ')}.` : '';
    const trads = (e.traditions || []).map(id => nameOf(byId, id));
    const trad = trads.length ? ` Tied to ${trads.join(' and ')}.` : '';
    let time = '';
    if (e.time) time = ` The record gives a span of ${e.time.start_ce}–${e.time.end_ce}, a ${humanCode(e.time.precision)}, not the date of an event.`;
    const pages = e.sources || [];
    const src = pages.length
      ? pages.map(s => `<a href="${esc(s.url || '#')}">${esc(linkLabel(s.url, e.name))}</a>`).join(' ')
      : '<span>No source of its own is stored.</span>';
    const srcLine = pages.length
      ? `${pages.length === 1 ? 'One encyclopedia page' : `${pages.length} encyclopedia pages`} ${pages.length === 1 ? 'names' : 'name'} this record.`
      : `${e.name} has no source of its own.`;
    return `<article class="nm-record" tabindex="0" data-id="${esc(e.id)}" data-profile-status="${esc(e.profile_status || '')}">
      <h3>${esc(e.name)}</h3>
      <p>${esc(e.name)} is listed as a ${esc(kindWord(e.kind))}.${esc(aliases)}${esc(regions)}${esc(trad)}${esc(roles)}${esc(time)} It is ${esc(statusPhrase(e.profile_status))}.</p>
      <p>${esc(srcLine)} ${src}</p>
      <details class="nm-fold"><summary>Exact fields</summary>${describe(e)}</details>
    </article>`;
  }

  function sourceRows(entities) {
    const rows = [];
    for (const e of entities) {
      const sources = e.sources || [];
      if (!sources.length) {
        rows.push({ kind: 'Date of the source', when: 'Not stored', what: `${e.name} has no source of its own, so no date is stored.` });
        continue;
      }
      for (const s of sources) {
        const date = s.date || s.year || s.published || s.accessed || null;
        if (!date) rows.push({ kind: 'Date of the source', when: 'Not stored', what: `The page for ${e.name} has no date on the record.` });
        else rows.push({ kind: 'Date of the source', when: String(date), what: `${e.name}. ${s.note || ''}`.trim() });
      }
    }
    return rows;
  }

  function sourceList(entities, media, reviewed) {
    const items = [];
    for (const e of entities) {
      for (const s of e.sources || []) {
        const href = s.url ? `<a href="${esc(s.url)}">${esc(linkLabel(s.url, e.name))}</a>` : '<span>No page stored</span>';
        items.push(`<li class="nm-source" tabindex="0" data-profile-status="${esc(e.profile_status || '')}" data-tier="${esc(s.tier || '')}"><b>${esc(e.name)}</b><p>${esc(statusPhrase(e.profile_status))}. ${esc(s.note || 'Reference page.')}</p>${href}</li>`);
      }
      if (!(e.sources || []).length) {
        items.push(`<li class="nm-source" tabindex="0" data-profile-status="${esc(e.profile_status || '')}"><b>${esc(e.name)}</b><p>No source of its own is stored. That is a gap, not a verdict.</p></li>`);
      }
    }
    for (const m of media) {
      items.push(`<li class="nm-source" tabindex="0" data-evidence-status="${esc(m.evidence_status || '')}"><b>${esc(m.provider_title || m.entity_name || 'Picture')}</b><p>Reference art — not evidence. ${esc(m.rights || '')}.</p><a href="${esc(m.provider_page_url)}">Source and rights</a></li>`);
    }
    for (const m of reviewed) {
      items.push(`<li class="nm-source" tabindex="0" data-evidence-status="${esc(m.evidence_status || '')}" data-media-id="${esc(m.media_id || '')}"><b>${esc(m.title)}</b><p>Reference art — not evidence. ${esc(m.license || '')}.</p><a href="${esc(m.source_page_url)}">Source and rights</a></li>`);
    }
    return items.length ? `<ul class="nm-sources">${items.join('')}</ul>` : gap('Sources', 'No page is stored for the records in this chapter.');
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
    return `<p><b>${shared.length} shared ${shared.length === 1 ? 'label' : 'labels'} across ${keys.length} themes.</b> ${uncoded} of ${keys.length} rows are blank on at least one side. A blank is not a no.</p>
      <p>On both records: ${sharedWords.length ? esc(sharedWords.join(', ')) : 'nothing'}.</p>
      <div class="nm-scroll"><table class="nm-table">${head}${body}</table></div>
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
    else if (noSource.length) missing.push(`${noSource.map(e => e.name).join(' and ')} have no source of their own`);
    const pageWord = encyclopedia ? (locators === 1 ? 'encyclopedia page' : 'encyclopedia pages') : (locators === 1 ? 'written reference' : 'written references');
    const recordWord = focus.length === 1 ? 'record' : 'records';
    const have = focus.length
      ? `${locators} ${pageWord}, on ${focus.length} ${recordWord}, in a catalog of ${n}.`
      : `No record to open, in a catalog of ${n}.`;
    const missingText = missing.length ? missing.map(s => `${sentence(s).replace(/\.$/, '')}.`).join(' ') : 'Nothing empty showed up on these records.';
    return { have, missingText, locators, focus: focus.length, catalog: n };
  }

  function denomHtml(model) {
    return `<span class="nm-label">What we have so far</span><b>${esc(model.have)}</b><p><span class="nm-label">What we don't know yet</span> ${esc(model.missingText)} What we have not recorded is not the same as false.</p>`;
  }

  function leadText(focus, journey) {
    if (!focus.length) {
      return `No catalog entry is stored for ${termList(journey.absence_terms)}. Anything that names the subject stays a question, not a finding.`;
    }
    if (journey.id === 'gods-pantheon') {
      const shown = focus.slice(0, 2).map(e => e.name).join(' and ');
      return `${focus.length} deities are named here, including ${shown}. Each record is a reference sketch: a name and an encyclopedia page, not a proved history. Resemblance is not causation.`;
    }
    const first = focus[0];
    const aliases = (first.aliases || []).length ? `, also called ${naturalList(first.aliases)}` : '';
    const lines = [`${first.name} is in the catalog as a ${kindWord(first.kind)}${aliases}.`];
    const term = (journey.absence_terms || [])[0];
    if (term) lines.push(`${sentence(term)} is not written on these records. That is a gap, not a verdict that the two are unrelated.`);
    else lines.push('What follows is only what those records actually hold.');
    return lines.join(' ');
  }

  function catalogShare(catalog, focus) {
    const entities = catalog.entities || [];
    const withSources = entities.filter(e => (e.sources || []).length).length;
    return `${withSources} of ${entities.length} catalog entries have a source of their own. The file that holds them is marked ${humanCode(catalog.status || 'not stored')}.`;
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
    const frameEnd = hero ? '</div>' : '';
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
    const line = showResemblance ? '<p class="nm-quiet">Resemblance is not causation.</p>' : '';
    const know = `<details class="nm-fold"><summary>How these pictures are used</summary><p>Each plate is a picture someone else made. It is not proof of a catalog record, a date, or a historical link. ${showResemblance ? 'Resemblance is not causation.' : 'Looking alike, in paint or in a label, is not a shared origin.'}</p></details>`;
    return figureHtml(hero, true) + row + line + know;
  }

  function bindFocus(scope) {
    scope.querySelectorAll('.nm-tick, .nm-source, .nm-record, .nm-figure').forEach(el => {
      const toggle = event => {
        if (event.target.closest('a, summary, details')) return;
        el.classList.toggle('is-focus');
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        el.classList.toggle('is-focus');
      });
    });
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
    const lead = leadText(focus, journey);
    if (leadEl) {
      leadEl.textContent = lead;
      if (focus.length && focus.every(e => e.profile_status === 'REFERENCE_ONLY')) leadEl.dataset.profileStatus = 'REFERENCE_ONLY';
      else delete leadEl.dataset.profileStatus;
    }
    const showResemblance = journey.id !== 'gods-pantheon' && pair.length < 2;

    const timeline = [];
    if (!focus.some(hasEventDate)) timeline.push({ kind: 'Dated event', when: 'Not stored', what: 'No record here stores a dated event.' });
    for (const e of focus) {
      if (!e.time) continue;
      timeline.push({
        kind: 'A span, not a dated event',
        when: `${e.time.start_ce}–${e.time.end_ce}`,
        what: `${e.name} calls this a ${humanCode(e.time.precision)}. It is not the date of an event.`,
        precision: e.time.precision || ''
      });
    }
    timeline.push(...sourceRows(focus));
    for (const m of reviewed) {
      timeline.push({ kind: 'A later picture', when: 'Not a catalog date', what: `${m.title}. ${m.description || ''} Reference art — not evidence.` });
    }
    for (const m of media) {
      timeline.push({ kind: 'A later picture', when: m.date_display || 'Not a catalog date', what: `${m.provider_title || m.entity_name || 'Picture'}. ${m.epistemic_note || ''} Reference art — not evidence.` });
    }

    const visual = document.getElementById('journeyVisual');
    const museumForFocus = (mediaDoc.records || []).filter(r => (journey.focus_ids || []).includes(r.entity_id));
    if (visual) visual.innerHTML = figuresHtml(reviewed, museumForFocus, journey, showResemblance);

    const related = (journey.related_ids || []).map(rid => (pack.journeys || []).find(j => j.id === rid)).filter(Boolean);
    const records = focus.map(e => recordCard(e, byId)).join('')
      || gap('The records', 'No catalog entry was found for this chapter.');
    const exact = missingFocus.map(fid => gap(fid, 'That id is not in the catalog.')).join('') + scanBlocks(journey.scan_dimension_value, catalog, focus);

    const index = { epistemic_note: '' };
    rest.innerHTML = `
      <section class="nm-block" id="records">
        <p class="nm-label">The records</p>
        <h2>What is actually written</h2>
        ${records}
      </section>
      <section class="nm-block" id="comparison">
        <p class="nm-label">Side by side</p>
        <h2>What the labels share</h2>
        ${compareTable(pair, journey.id !== 'gods-pantheon')}
      </section>
      <section class="nm-block" id="sources">
        <p class="nm-label">Sources</p>
        <h2>Where a reader can go next</h2>
        ${sourceList(focus, media, reviewed)}
      </section>
      <section class="nm-block" id="timeline">
        <p class="nm-label">Time</p>
        <h2>What kind of date this is</h2>
        <p>A dated event, the date of a source, and a later picture stay on separate lines. A range is not an event.</p>
        <ol class="nm-time">${timeline.map(r => `<li class="nm-tick" tabindex="0"${r.precision ? ` data-precision="${esc(r.precision)}"` : ''}><b>${esc(r.kind)}</b><span>${esc(r.when)}</span><p>${esc(r.what)}</p></li>`).join('')}</ol>
      </section>
      <section class="nm-block" id="indexFindings">
        <p class="nm-label">A search</p>
        <h2>What we looked for</h2>
        <p id="indexNote">${esc(index.epistemic_note)}</p>
      </section>
      <section class="nm-block" id="candidates">
        <p class="nm-label">Still open</p>
        <h2>Questions we are not ready to settle</h2>
        ${journey.candidate_match ? candidateBlocks(journey.candidate_match, hypotheses, pubmed, ontology) : gap('Research notes', 'This chapter stays with the catalog. The separate notes on mind and experience are not used as evidence here.')}
      </section>
      <details class="nm-fold nm-how" id="how">
        <summary>How we know</summary>
        <p>${journey.progress === 'POPULATED_FROM_EXISTING_RECORDS' ? 'Drawn from records already on file. Empty fields are gaps in those records.' : 'In progress. Only records that already exist are shown.'} ${esc(catalogShare(catalog, focus))}</p>
        <p>The catalog file says these limits, in its own words:</p>
        <ul>${rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        <div class="nm-exact">${exact}</div>
      </details>
      <section class="nm-block" id="related">
        <p class="nm-label">Continue</p>
        <h2>Other chapters</h2>
        <ul class="nm-next">${related.map(j => `<li><a href="journey.html?id=${encodeURIComponent(j.id)}" data-progress="${esc(j.progress || '')}">${esc(j.title)}</a></li>`).join('')}</ul>
        <p><a href="explore.html?q=${encodeURIComponent(journey.title)}">Search this in Explore</a></p>
      </section>`;
    bindFocus(root);
    const findings = document.getElementById('indexFindings');
    try {
      const loaded = await get('./search-index-v18.json');
      const note = document.getElementById('indexNote');
      if (note) note.textContent = 'Names below were checked against the catalog and the search index. A match is not a shared history.';
      if (note) note.dataset.epistemicNote = loaded.epistemic_note || '';
      const body = `${absenceReport(journey.absence_terms, catalog, loaded) || ''}${drhBlocks(journey.drh_ids, loaded) || ''}`;
      if (findings && body) findings.insertAdjacentHTML('beforeend', body);
      else if (findings) findings.insertAdjacentHTML('beforeend', gap('Nothing extra to check', 'This chapter did not ask the index for a missing word.'));
    } catch (err) {
      if (findings) findings.insertAdjacentHTML('beforeend', gap('Search index', err.message));
    }
  }

  bindAccent();
  render().catch(err => {
    const rest = document.getElementById('journeyRest') || root;
    rest.innerHTML = gap('This chapter', `The files for this page did not load: ${err.message}`);
  });
})();
