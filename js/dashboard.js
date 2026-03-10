/**
 * Kept.ai Dashboard — Interactive JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== DATA =====

  // Daily data for last 7 days (Jan 25–31, 2026)
  const data7D = [
    { label: 'Jan 25', orders: 105, returns: 18, prevented: 12, returnRate: 17.1 },
    { label: 'Jan 26', orders: 98,  returns: 16, prevented: 10, returnRate: 16.3 },
    { label: 'Jan 27', orders: 122, returns: 22, prevented: 14, returnRate: 18.0 },
    { label: 'Jan 28', orders: 134, returns: 24, prevented: 16, returnRate: 17.9 },
    { label: 'Jan 29', orders: 118, returns: 20, prevented: 13, returnRate: 16.9 },
    { label: 'Jan 30', orders: 141, returns: 25, prevented: 18, returnRate: 17.7 },
    { label: 'Jan 31', orders: 128, returns: 21, prevented: 15, returnRate: 16.4 },
  ];

  // Daily data for last 30 days (Jan 2026)
  const data30D = [
    { label: 'Jan 1',  orders: 145, returns: 31, prevented: 14, returnRate: 21.4 },
    { label: 'Jan 3',  orders: 132, returns: 27, prevented: 13, returnRate: 20.5 },
    { label: 'Jan 5',  orders: 128, returns: 26, prevented: 14, returnRate: 20.3 },
    { label: 'Jan 7',  orders: 119, returns: 24, prevented: 12, returnRate: 20.2 },
    { label: 'Jan 9',  orders: 134, returns: 26, prevented: 15, returnRate: 19.4 },
    { label: 'Jan 11', orders: 126, returns: 24, prevented: 14, returnRate: 19.0 },
    { label: 'Jan 13', orders: 118, returns: 22, prevented: 13, returnRate: 18.6 },
    { label: 'Jan 15', orders: 131, returns: 24, prevented: 15, returnRate: 18.3 },
    { label: 'Jan 17', orders: 122, returns: 22, prevented: 14, returnRate: 18.0 },
    { label: 'Jan 19', orders: 115, returns: 20, prevented: 13, returnRate: 17.4 },
    { label: 'Jan 21', orders: 127, returns: 22, prevented: 14, returnRate: 17.3 },
    { label: 'Jan 23', orders: 120, returns: 20, prevented: 13, returnRate: 16.7 },
    { label: 'Jan 25', orders: 105, returns: 18, prevented: 12, returnRate: 17.1 },
    { label: 'Jan 27', orders: 122, returns: 22, prevented: 14, returnRate: 18.0 },
    { label: 'Jan 31', orders: 128, returns: 21, prevented: 15, returnRate: 16.4 },
  ];

  // Last 3 months (weekly, Nov 2025 – Jan 2026)
  const data3M = [
    { label: 'Nov W1', orders: 890, returns: 218, prevented: 42, returnRate: 24.5 },
    { label: 'Nov W2', orders: 960, returns: 230, prevented: 48, returnRate: 24.0 },
    { label: 'Nov W3', orders: 1020, returns: 240, prevented: 51, returnRate: 23.5 },
    { label: 'Nov W4', orders: 970, returns: 234, prevented: 46, returnRate: 24.1 },
    { label: 'Dec W1', orders: 1050, returns: 236, prevented: 68, returnRate: 22.5 },
    { label: 'Dec W2', orders: 1080, returns: 232, prevented: 74, returnRate: 21.5 },
    { label: 'Dec W3', orders: 1040, returns: 224, prevented: 78, returnRate: 21.5 },
    { label: 'Dec W4', orders: 950, returns: 214, prevented: 74, returnRate: 22.5 },
    { label: 'Jan W1', orders: 920, returns: 182, prevented: 82, returnRate: 19.8 },
    { label: 'Jan W2', orders: 880, returns: 170, prevented: 80, returnRate: 19.3 },
    { label: 'Jan W3', orders: 850, returns: 158, prevented: 78, returnRate: 18.6 },
    { label: 'Jan W4', orders: 800, returns: 146, prevented: 78, returnRate: 18.3 },
  ];

  // Last 12 months (monthly, Feb 2025 – Jan 2026)
  const data1Y = [
    { label: 'Feb',  orders: 1980, returns: 495, prevented: 0,   returnRate: 25.0 },
    { label: 'Mar',  orders: 2050, returns: 533, prevented: 0,   returnRate: 26.0 },
    { label: 'Apr',  orders: 2120, returns: 551, prevented: 0,   returnRate: 26.0 },
    { label: 'May',  orders: 2060, returns: 556, prevented: 0,   returnRate: 27.0 },
    { label: 'Jun',  orders: 2180, returns: 589, prevented: 0,   returnRate: 27.0 },
    { label: 'Jul',  orders: 2340, returns: 655, prevented: 0,   returnRate: 28.0 },
    { label: 'Aug',  orders: 2890, returns: 838, prevented: 0,   returnRate: 29.0 },
    { label: 'Sep',  orders: 3010, returns: 843, prevented: 42,  returnRate: 28.0, tag: 'Kept starts' },
    { label: 'Oct',  orders: 3280, returns: 886, prevented: 108, returnRate: 27.0 },
    { label: 'Nov',  orders: 3840, returns: 922, prevented: 187, returnRate: 24.0 },
    { label: 'Dec',  orders: 4120, returns: 906, prevented: 294, returnRate: 22.0 },
    { label: 'Jan',  orders: 3450, returns: 656, prevented: 318, returnRate: 19.0 },
  ];

  // All time (quarterly, Q1 2024 – Jan 2026)
  const dataALL = [
    { label: 'Q1 24', orders: 4200,  returns: 882,  prevented: 0,   returnRate: 21.0 },
    { label: 'Q2 24', orders: 5100,  returns: 1122, prevented: 0,   returnRate: 22.0 },
    { label: 'Q3 24', orders: 5800,  returns: 1334, prevented: 0,   returnRate: 23.0 },
    { label: 'Q4 24', orders: 6200,  returns: 1488, prevented: 0,   returnRate: 24.0 },
    { label: 'Q1 25', orders: 5900,  returns: 1475, prevented: 0,   returnRate: 25.0 },
    { label: 'Q2 25', orders: 6360,  returns: 1654, prevented: 0,   returnRate: 26.0 },
    { label: 'Q3 25', orders: 7420,  returns: 2082, prevented: 42,  returnRate: 28.0, tag: 'Kept starts' },
    { label: 'Q4 25', orders: 11240, returns: 2714, prevented: 589, returnRate: 24.1 },
    { label: 'Jan 26', orders: 3450, returns: 656,  prevented: 318, returnRate: 19.0 },
  ];

  const datasets = {
    '7D':  data7D,
    '30D': data30D,
    '3M':  data3M,
    '1Y':  data1Y,
    'ALL': dataALL,
  };

  // Return reasons data
  const reasonsData = [
    { name: 'Size / Fit Issues', pct: 40, count: 263, colorClass: 'reason__fill--navy' },
    { name: 'Not as Described',  pct: 20, count: 131, colorClass: 'reason__fill--blue' },
    { name: 'Quality Issues',    pct: 15, count: 98,  colorClass: 'reason__fill--muted' },
    { name: 'Changed Mind',      pct: 12, count: 79,  colorClass: 'reason__fill--cyan' },
    { name: 'Arrived Damaged',   pct: 7,  count: 46,  colorClass: 'reason__fill--gray' },
    { name: 'Other',             pct: 6,  count: 40,  colorClass: 'reason__fill--lightgray' },
  ];

  // ===== KPI RENDERING =====

  function updateKPIs(data) {
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const totalReturns = data.reduce((s, d) => s + d.returns, 0);
    const totalPrevented = data.reduce((s, d) => s + d.prevented, 0);
    const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100) : 0;
    const returnCost = Math.round(totalReturns * 60.2); // avg cost per return
    const savedCost = Math.round(totalPrevented * 55.2);

    const kpiEls = document.querySelectorAll('.kpi-card__value');
    const deltaEls = document.querySelectorAll('.kpi-card__delta');

    if (kpiEls[0]) kpiEls[0].textContent = fmt(totalOrders);
    if (kpiEls[1]) kpiEls[1].textContent = fmt(totalReturns);
    if (kpiEls[2]) kpiEls[2].textContent = returnRate.toFixed(1) + '%';
    if (kpiEls[3]) kpiEls[3].textContent = fmt(totalPrevented);

    // Update deltas
    const totalRevenue = Math.round(totalOrders * 121.4); // avg order value
    if (deltaEls[0]) deltaEls[0].textContent = '$' + fmt(totalRevenue) + ' revenue';
    if (deltaEls[1]) deltaEls[1].textContent = '$' + fmt(returnCost) + ' cost';
    if (deltaEls[2]) {
      const firstRate = data[0]?.returnRate || 0;
      const lastRate = data[data.length - 1]?.returnRate || 0;
      const diff = lastRate - firstRate;
      deltaEls[2].textContent = (diff > 0 ? '+' : '') + diff.toFixed(1) + 'pp over period';
      deltaEls[2].className = 'kpi-card__delta ' + (diff <= 0 ? 'kpi-card__delta--green' : 'kpi-card__delta--red');
    }
    if (deltaEls[3]) deltaEls[3].textContent = '$' + fmt(savedCost) + ' saved';
  }

  // ===== CHART RENDERING =====

  const chartBarsEl = document.getElementById('chart-bars');
  const chartYAxisEl = document.getElementById('chart-y-axis');
  let currentPeriod = '1Y';

  function fmt(n) {
    return n.toLocaleString('en-US');
  }

  function renderChart(data, animate) {
    if (!chartBarsEl || !chartYAxisEl) return;

    const maxOrders = Math.max(...data.map(d => d.orders));
    const yMax = Math.ceil(maxOrders / 1000) * 1000;
    const ySteps = 5;
    const yStep = yMax / ySteps;

    // Y axis
    chartYAxisEl.innerHTML = '';
    for (let i = ySteps; i >= 0; i--) {
      const span = document.createElement('span');
      span.textContent = fmt(Math.round(i * yStep));
      chartYAxisEl.appendChild(span);
    }

    // Bars
    chartBarsEl.innerHTML = '';
    data.forEach((d, idx) => {
      const ordersPct = (d.orders / yMax) * 100;
      const returnsPct = (d.returns / yMax) * 100;
      const preventedPct = (d.prevented / yMax) * 100;

      const group = document.createElement('div');
      group.className = 'chart__bar-group';

      const stack = document.createElement('div');
      stack.className = 'chart__bar-stack';

      const barOrders = document.createElement('div');
      barOrders.className = 'chart__bar chart__bar--orders';
      barOrders.title = `${fmt(d.orders)} orders`;
      barOrders.style.height = animate && !reducedMotion ? '0%' : ordersPct + '%';

      const barReturns = document.createElement('div');
      barReturns.className = 'chart__bar chart__bar--returns';
      barReturns.title = `${fmt(d.returns)} returns`;
      barReturns.style.height = animate && !reducedMotion ? '0%' : returnsPct + '%';

      const barPrevented = document.createElement('div');
      barPrevented.className = 'chart__bar chart__bar--prevented';
      barPrevented.title = `${fmt(d.prevented)} prevented`;
      barPrevented.style.height = animate && !reducedMotion ? '0%' : preventedPct + '%';

      stack.appendChild(barOrders);
      stack.appendChild(barReturns);
      if (d.prevented > 0) stack.appendChild(barPrevented);

      group.appendChild(stack);

      const labelEl = document.createElement('span');
      labelEl.className = 'chart__bar-label';
      labelEl.textContent = d.label;
      group.appendChild(labelEl);

      const rateEl = document.createElement('span');
      rateEl.className = 'chart__bar-rate';
      rateEl.textContent = d.returnRate.toFixed(1) + '%';
      group.appendChild(rateEl);

      if (d.tag) {
        const tagEl = document.createElement('span');
        tagEl.className = 'chart__bar-tag';
        tagEl.textContent = d.tag;
        group.appendChild(tagEl);
      }

      chartBarsEl.appendChild(group);

      // Animate in
      if (animate && !reducedMotion) {
        setTimeout(() => {
          barOrders.style.height = ordersPct + '%';
          barReturns.style.height = returnsPct + '%';
          barPrevented.style.height = preventedPct + '%';
        }, idx * 60 + 50);
      }
    });

    // Re-attach tooltips
    attachTooltips();
  }

  // ===== REASONS RENDERING =====

  const reasonsEl = document.getElementById('reasons-container');

  function renderReasons(animate) {
    if (!reasonsEl) return;
    reasonsEl.innerHTML = '';

    reasonsData.forEach((r, i) => {
      const div = document.createElement('div');
      div.className = 'reason';
      div.innerHTML = `
        <div class="reason__header">
          <span class="reason__name">${r.name}</span>
          <span class="reason__pct">${r.pct}%</span>
        </div>
        <div class="reason__bar"><div class="reason__fill ${r.colorClass}" style="width: ${animate && !reducedMotion ? '0%' : r.pct + '%'}"></div></div>
        <span class="reason__count">${r.count} returns</span>
      `;
      reasonsEl.appendChild(div);

      if (animate && !reducedMotion) {
        const fill = div.querySelector('.reason__fill');
        setTimeout(() => { fill.style.width = r.pct + '%'; }, i * 100 + 200);
      }
    });
  }

  // ===== TOOLTIPS =====

  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  function attachTooltips() {
    document.querySelectorAll('.chart__bar-group').forEach(group => {
      const bars = group.querySelectorAll('.chart__bar');
      const label = group.querySelector('.chart__bar-label')?.textContent || '';

      group.addEventListener('mouseenter', () => {
        const orders = bars[0]?.title || '';
        const returns = bars[1]?.title || '';
        const prevented = bars[2]?.title || '';
        const rate = group.querySelector('.chart__bar-rate')?.textContent || '';

        tooltip.innerHTML = `
          <strong>${label}</strong>
          <div class="chart-tooltip__row"><span class="chart-tooltip__dot chart-tooltip__dot--orders"></span>${orders}</div>
          <div class="chart-tooltip__row"><span class="chart-tooltip__dot chart-tooltip__dot--returns"></span>${returns}</div>
          ${prevented && !prevented.startsWith('0') ? `<div class="chart-tooltip__row"><span class="chart-tooltip__dot chart-tooltip__dot--prevented"></span>${prevented}</div>` : ''}
          <div class="chart-tooltip__rate">Return rate: ${rate}</div>
        `;
        tooltip.style.display = 'block';
      });

      group.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.pageX + 12 + 'px';
        tooltip.style.top = e.pageY - 10 + 'px';
      });

      group.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  }

  // ===== PERIOD SELECTOR =====

  const periodBtns = document.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      if (period === currentPeriod) return;

      periodBtns.forEach(b => b.classList.remove('period-btn--active'));
      btn.classList.add('period-btn--active');
      currentPeriod = period;

      renderChart(datasets[period], true);
      updateKPIs(datasets[period]);
    });
  });

  // ===== KPI COUNTER ANIMATION =====

  const kpiValues = document.querySelectorAll('.kpi-card__value');
  const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const duration = 1400;

  const parseKpiValue = (text) => {
    const clean = text.trim();
    const prefix = clean.match(/^[^0-9.]*/)?.[0] || '';
    const suffix = clean.match(/[^0-9.]*$/)?.[0] || '';
    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    const decimals = clean.includes('.') ? clean.split('.')[1].replace(/[^0-9]/g, '').length : 0;
    return { prefix, suffix, num, decimals };
  };

  const animateCounter = (el) => {
    const { prefix, suffix, num, decimals } = parseKpiValue(el.textContent);
    if (isNaN(num)) return;
    if (reducedMotion) return;

    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const value = easeOutExpo(progress) * num;
      const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      el.textContent = prefix + formatted + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (kpiValues.length) {
    const kpiObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        kpiObs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    kpiValues.forEach(el => kpiObs.observe(el));
  }

  // ===== SORTABLE TABLE =====

  const table = document.querySelector('.product-table');
  if (table) {
    const headers = table.querySelectorAll('.product-table__th');
    const tbody = table.querySelector('tbody');

    const getCellValue = (row, idx) => {
      const cell = row.children[idx];
      const text = cell?.textContent?.trim() || '';
      const num = parseFloat(text.replace(/[$,%,]/g, ''));
      return isNaN(num) ? text.toLowerCase() : num;
    };

    headers.forEach((th, colIdx) => {
      th.style.cursor = 'pointer';
      th.dataset.sortDir = 'none';

      th.addEventListener('click', () => {
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const currentDir = th.dataset.sortDir;
        const newDir = currentDir === 'asc' ? 'desc' : 'asc';

        headers.forEach(h => {
          h.dataset.sortDir = 'none';
          h.classList.remove('product-table__th--sorted-asc', 'product-table__th--sorted-desc');
        });

        th.dataset.sortDir = newDir;
        th.classList.add(`product-table__th--sorted-${newDir}`);

        rows.sort((a, b) => {
          const aVal = getCellValue(a, colIdx);
          const bVal = getCellValue(b, colIdx);
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return newDir === 'asc' ? aVal - bVal : bVal - aVal;
          }
          return newDir === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });

        rows.forEach(row => tbody.appendChild(row));
      });
    });
  }

  // ===== AI INSIGHT PANELS =====

  const aiInsights = {
    'olb-2024': {
      product: 'Oversized Linen Blazer — OLB-2024',
      summary: '81% of returns cite "Wrong Size." Customer review analysis reveals the blazer runs 1.5 sizes larger than standard. The size chart references body measurements but doesn\'t account for the intentional oversized fit, causing customers to order their regular size and find it too large.',
      actions: [
        { priority: 'high', text: 'Update size chart to include "Oversized Fit" guidance — recommend sizing down 1–2 sizes. Add a visual fit comparison showing this blazer vs. a standard-fit blazer.', impact: 'Est. -18% return rate → saves ~$2,900/quarter' },
        { priority: 'high', text: 'Add a checkout fit warning: "This blazer is designed for an oversized look. Most customers size down." triggered when cart size matches customer\'s usual size.', impact: 'Est. -12% return rate → saves ~$1,950/quarter' },
        { priority: 'medium', text: 'Reshoot product images to show the blazer on models of varying body types with size labels visible. Current photos make the fit ambiguous.', impact: 'Est. -6% return rate → saves ~$975/quarter' },
      ]
    },
    'hwj-1189': {
      product: 'High-Rise Wide Leg Jean — HWJ-1189',
      summary: '74% of returns cite "Wrong Size." Inseam length is the primary complaint — the product page lists a single inseam (32") but doesn\'t offer length options. Customers under 5\'6" consistently report the jeans are too long, and customers with curvier builds report the waist-to-hip ratio is off.',
      actions: [
        { priority: 'high', text: 'Introduce short (28"), regular (30"), and long (32") inseam options. This single change addresses the majority of fit-related returns.', impact: 'Est. -22% return rate → saves ~$4,850/quarter' },
        { priority: 'high', text: 'Deploy the Kept checkout widget with height-based inseam recommendations. Prompt: "What\'s your height?" and auto-suggest the best inseam.', impact: 'Est. -10% return rate → saves ~$2,200/quarter' },
        { priority: 'medium', text: 'Add waist-to-hip ratio guidance in the size chart. Current sizing only references waist — adding hip measurements will help curvier customers pick the right size.', impact: 'Est. -5% return rate → saves ~$1,100/quarter' },
      ]
    },
    'mod-3302': {
      product: 'Mesh Overlay Midi Dress — MOD-3302',
      summary: '68% of returns cite "Didn\'t Match Photos." The studio lighting makes the mesh overlay appear sheer/ethereal, but in person the fabric is more opaque and structured. Color also appears lighter in photos than reality. Customers expect a flowy, semi-transparent look and receive a more structured garment.',
      actions: [
        { priority: 'high', text: 'Reshoot product photos in natural lighting and include close-up texture shots of the mesh overlay. Add a "What to Expect" section showing studio vs. natural light comparison.', impact: 'Est. -15% return rate → saves ~$2,240/quarter' },
        { priority: 'medium', text: 'Add a 15-second video showing the dress in motion and in different lighting conditions. Customer data shows products with video have 23% fewer "not as described" returns.', impact: 'Est. -10% return rate → saves ~$1,490/quarter' },
        { priority: 'low', text: 'Update the product description to explicitly describe the mesh as "structured overlay" rather than "delicate mesh" to set accurate expectations.', impact: 'Est. -4% return rate → saves ~$600/quarter' },
      ]
    },
    'cps-0891': {
      product: 'Chunky Platform Sneaker — CPS-0891',
      summary: '72% of returns cite "Wrong Size." The platform sole adds 2 inches of height which affects the internal fit — the toe box runs narrow at the platform junction. International customers ordering EU sizes are also experiencing conversion mismatches with the current size chart.',
      actions: [
        { priority: 'high', text: 'Add "Runs narrow — we recommend ordering a half size up" as a prominent callout on the product page. Integrate this into the Kept checkout widget as an auto-suggestion.', impact: 'Est. -16% return rate → saves ~$2,760/quarter' },
        { priority: 'high', text: 'Fix the EU/UK size conversion table — current mapping is off by 0.5 sizes for EU 38–42. This directly impacts 31% of international orders.', impact: 'Est. -8% return rate → saves ~$1,380/quarter' },
        { priority: 'medium', text: 'Add foot width guidance (narrow/regular/wide) and recommend sizing up for wide feet. Include a printable foot measurement guide.', impact: 'Est. -5% return rate → saves ~$865/quarter' },
      ]
    }
  };

  function createInsightPanel(productId) {
    const data = aiInsights[productId];
    if (!data) return null;

    const panel = document.createElement('tr');
    panel.className = 'insight-row';
    const td = document.createElement('td');
    td.setAttribute('colspan', '9');
    td.innerHTML = `
      <div class="insight-panel is-open">
        <div class="insight-panel__inner">
          <div class="insight-card">
            <div class="insight-card__header">
              <div class="insight-card__icon">&#x2728;</div>
              <span class="insight-card__label">Kept's Insight</span>
              <span class="insight-card__product">${data.product}</span>
            </div>
            <p class="insight-card__summary">${data.summary}</p>
            <span class="insight-card__actions-title">Recommended Actions</span>
            <div class="insight-card__actions">
              ${data.actions.map(a => `
                <div class="insight-action">
                  <span class="insight-action__priority insight-action__priority--${a.priority}">${a.priority}</span>
                  <div>
                    <span class="insight-action__text">${a.text}</span>
                    <span class="insight-action__impact">${a.impact}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="insight-card__footer">
              <span class="insight-card__footer-dot"></span>
              Generated by Kept — based on return data, customer reviews, and product analytics
            </div>
          </div>
        </div>
      </div>
    `;
    panel.appendChild(td);
    return panel;
  }

  // Attach click handlers to product rows
  const productRows = document.querySelectorAll('tr[data-product]');
  let activeInsightRow = null;
  let activeProductRow = null;

  productRows.forEach(row => {
    row.addEventListener('click', () => {
      const productId = row.dataset.product;

      // If clicking the same row, close it
      if (activeProductRow === row) {
        if (activeInsightRow) {
          const panel = activeInsightRow.querySelector('.insight-panel');
          panel.classList.remove('is-open');
          setTimeout(() => activeInsightRow.remove(), 400);
          activeInsightRow = null;
        }
        row.classList.remove('is-active');
        activeProductRow = null;
        return;
      }

      // Close any existing panel
      if (activeInsightRow) {
        const panel = activeInsightRow.querySelector('.insight-panel');
        panel.classList.remove('is-open');
        setTimeout(() => {
          if (activeInsightRow && activeInsightRow.parentNode) {
            activeInsightRow.remove();
          }
        }, 400);
      }
      if (activeProductRow) {
        activeProductRow.classList.remove('is-active');
      }

      // Open new panel
      row.classList.add('is-active');
      activeProductRow = row;

      const insightRow = createInsightPanel(productId);
      if (insightRow) {
        row.after(insightRow);
        activeInsightRow = insightRow;

        // Trigger animation
        const panel = insightRow.querySelector('.insight-panel');
        panel.classList.remove('is-open');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            panel.classList.add('is-open');
          });
        });
      }
    });
  });

  // ===== FADE-IN ON SCROLL =====

  const fadeEls = document.querySelectorAll('[data-dash-animate]');
  if (fadeEls.length && !reducedMotion) {
    fadeEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    });

    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.dataset.dashAnimateDelay || 0;
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, delay);
        fadeObs.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    fadeEls.forEach(el => fadeObs.observe(el));
  }

  // ===== INITIAL RENDER =====

  renderChart(datasets[currentPeriod], true);
  updateKPIs(datasets[currentPeriod]);
  renderReasons(true);
});
