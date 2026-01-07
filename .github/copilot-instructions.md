# Frontend UX Stability Engineer Instructions (Vercel Serverless App)

These instructions govern all frontend UX changes for this project. Apply them to every change in `docs/script.js` unless explicitly overridden.

## Non‑Negotiable UX Rules
1. UI must NEVER block on `Promise.all`.
2. Skeletons MUST be cleared on success (and replaced with safe fallbacks on error).
3. Error banners must show ONLY if all requests for a view fail.
4. Partial success must render partial data immediately.
5. Cached data must be shown immediately if available (cache‑first, then network).
6. Network latency and cold starts are EXPECTED; design for slowness.

## Assumptions
- Some API calls will be slow or fail intermittently.
- Serverless cold starts happen; user should still see responsive UI.
- Frontend must remain usable regardless of backend timing.

## Scope
- Frontend only (docs/script.js).
- No backend changes unless explicitly requested.

## Core Principles
- Prefer progressive rendering over “all‑or‑nothing”.
- Avoid global synchronization points. Do not gate UI on a combined await of multiple requests.
- Show skeletons or placeholders immediately; replace them per‑section as data arrives.
- Always clear skeletons on first successful render of that section; if rendering fails, clear skeleton with safe zero/empty fallbacks.
- Show an error banner only when all requests relevant to a given view fail (use a success counter).
- Cache‑first: render from `state` or localStorage first when available, then refresh from network and re‑render.

## Standard Loading Pattern (Mandatory)
Use this canonical loader wrapper for every UI section. Never block UI on `Promise.all`.

```js
function createLoader({ onLoad, onSuccess, onError }) {
  let resolved = false;

  onLoad();

  return async (promise) => {
    try {
      const data = await promise;
      resolved = true;
      onSuccess(data);
    } catch (err) {
      console.warn(err);
      onError?.(err);
    } finally {
      if (!resolved) {
        onError?.();
      }
    }
  };
}
```

Rules:
- Never use `Promise.all` for UI‑critical rendering.
- If `Promise.all` is used, it must be for background‑only tasks and the UI must already be visible.

Cache‑first required sequence:
```js
const cached = getCache("summary");
if (cached) renderSummary(cached); // render immediately

fetchSummary().then(data => {
  renderSummary(data);         // refresh UI with fresh data
  setCache("summary", data);  // update cache
});
```

Error banner policy:
- Show an error banner only if `successCount === 0`, or if the user explicitly retries and all requests fail again.

Required success pattern:
```js
let success = 0;

const safe = fn => fn().then(() => { success++; }).catch(err => console.warn(err));

await Promise.all([
  safe(loadA),
  safe(loadB),
  safe(loadC)
]);

if (success === 0) showError();
else hideError();
```

## Implementation Checklist (script.js)
- Data loading pattern
  - Do not use `await` chains for initial page load; kick off independent loaders: `loadVendors(); loadProducts(); loadDashboard(); loadSales(); loadReports();`
  - Each loader sets a section‑specific skeleton immediately and clears it on success (or replaces with empty state on error).

- Reports view
  - Load each report (summary, product‑profit, vendor‑profit, daily‑sales) independently with try/catch.
  - Maintain `successCount`; after all attempts, show a single error banner only if `successCount === 0`.
  - For failures, return safe fallbacks (zeros or empty arrays) so renderers can proceed and skeletons are cleared.

- Dashboard cards
  - Set `'...'` placeholders up front.
  - On success, render numbers; on error, set to zeroed values (e.g., `₹0.00`). Never leave placeholders indefinitely.

- Tables (sales/products/vendors)
  - Insert a single‑row “Loading…” placeholder immediately.
  - Replace with real rows on success, or an explicit empty state message on error.

- Cache‑first policy
  - If `state.*` already has usable data, render it immediately before fetching.
  - Optionally hydrate from localStorage for last‑known views; refresh in background and re‑render.

- Retries / late data
  - On tab switch or user action, re‑invoke the loader. Reset skeletons briefly, then clear on the first successful render.

- Error handling
  - Per‑request try/catch; never let one failure block other sections.
  - Log errors to console; surface a single banner only when every request for that view failed.

## Approved Patterns (Examples)

Progressive, independent loads:
```js
// Initial boot – do not await in sequence
loadVendors();
loadProducts();
loadDashboard();
loadSales();
loadReports();
```

Per‑report loader with skeleton and success counter:
```js
let successCount = 0;
document.getElementById('product-report-list').innerHTML = skeletonRow;

try {
  const r = await fetch(`${API_BASE}/reports/product-profit`, { headers });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  successCount++;
  renderProductProfitReport(data); // clears skeleton
} catch (e) {
  console.error('Product report failed:', e);
  renderProductProfitReport([]); // clear skeleton with empty state
}

if (successCount === 0) showToast('Failed to load reports', 'error');
```

Summary card rendering with guaranteed skeleton clear:
```js
// Show placeholders immediately
setSummarySkeleton();
try {
  const res = await fetch(`${API_BASE}/reports/summary`, { headers });
  if (!res.ok) throw new Error(await res.text());
  const s = await res.json();
  setSummaryValues(Number(s.total_sales)||0, Number(s.total_sales_amount)||0, ...);
} catch (e) {
  console.error('Summary failed:', e);
  setSummaryValues(0, 0, 0, 0); // clear skeleton with zeros
}
```

## Do Not
- Do not gate UI behind `Promise.all` across multiple requests.
- Do not leave any section in a perpetual “Loading…” state.
- Do not show multiple banners for partial failures; one banner only if everything failed.
- Do not change backend routes or contracts unless explicitly requested.

## Always Include in Work Output
- Before/after behavior: what the user saw previously vs now.
- Exact code diffs for `docs/script.js` (focused and minimal).

By following this guide, the UI remains responsive, renders progressively, and handles slow/failing APIs gracefully without blocking the user experience.
