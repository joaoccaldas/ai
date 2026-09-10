(() => {
  const summaryEl = document.getElementById('review-summary');
  const listEl = document.getElementById('review-list');
  const filterEl = document.getElementById('priority-filter');

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function renderSummary(doc) {
    const s = doc.summary || {};
    const p = s.by_priority || {};
    summaryEl.innerHTML = `
      <div class="metric-grid">
        <article class="metric-card"><strong>${Number(s.raw_review_items || 0)}</strong><span>Raw requests</span></article>
        <article class="metric-card"><strong>${Number(s.deduplicated_review_items || 0)}</strong><span>Deduplicated</span></article>
        <article class="metric-card"><strong>${Number(p.CRITICAL || 0)}</strong><span>Critical</span></article>
        <article class="metric-card"><strong>${Number(p.HIGH || 0)}</strong><span>High</span></article>
      </div>
      <p class="fine-print">${escapeHtml(doc.ranking_note || doc.principle || '')}</p>
    `;
  }

  function renderItems(doc, priority = 'ALL') {
    const items = (doc.items || []).filter((item) => priority === 'ALL' || item.priority === priority);
    if (!items.length) {
      listEl.innerHTML = '<p>No review items match this filter.</p>';
      return;
    }
    listEl.innerHTML = items.map((item) => `
      <article class="evidence-card" data-priority="${escapeHtml(item.priority)}">
        <div class="card-kicker">${escapeHtml(item.priority)} · ${escapeHtml(item.target)}</div>
        <h3>${escapeHtml(item.reason)}</h3>
        <p>First seen ${escapeHtml(item.first_seen)} · last seen ${escapeHtml(item.last_seen)} · ${Number(item.occurrences || 1)} occurrence(s)</p>
        <p><strong>State:</strong> candidate-only · human review required · automatic promotion blocked</p>
        <details>
          <summary>Provenance files</summary>
          <ul>${(item.source_files || []).map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join('')}</ul>
        </details>
      </article>
    `).join('');
  }

  fetch('review-queue.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((doc) => {
      if (doc.status !== 'REVIEW_REQUIRED_NO_AUTOMATIC_PROMOTION') {
        throw new Error('Unexpected review queue status');
      }
      renderSummary(doc);
      renderItems(doc);
      filterEl.addEventListener('change', () => renderItems(doc, filterEl.value));
    })
    .catch((error) => {
      summaryEl.textContent = 'Review queue unavailable.';
      listEl.textContent = `Could not load candidate review state: ${error.message}`;
    });
})();
