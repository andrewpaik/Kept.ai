/**
 * Kept.ai Dashboard — Interactive JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== ACTIVE COMPANY STATE =====

  let activeCompanyId = 'acme-apparel';
  let datasets = COMPANIES[activeCompanyId].datasets;
  let reasonsData = COMPANIES[activeCompanyId].reasonsData;
  let aiInsights = COMPANIES[activeCompanyId].aiInsights;
  let channelData = COMPANIES[activeCompanyId].channelData;
  let avgOrderValue = COMPANIES[activeCompanyId].avgOrderValue;
  let products = COMPANIES[activeCompanyId].products;
  let avgReturnCost = COMPANIES[activeCompanyId].avgReturnCost;
  let currentPeriod = '1Y';

  // ===== UTILITY =====

  function fmt(n) {
    return n.toLocaleString('en-US');
  }

  // Simple deterministic hash from a string
  function strHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // Generate period-specific reason splits from the base data
  function varyReasons(baseReasons, periodData, periodKey) {
    const totalReturns = periodData.reduce((s, d) => s + d.returns, 0);
    const h = strHash(periodKey + activeCompanyId);

    // Apply small deterministic offsets to base percentages
    const raw = baseReasons.map((r, i) => {
      const offset = (((h * (i + 3) * 13) % 9) - 4) * 0.8;
      return { ...r, rawPct: Math.max(2, r.pct + offset) };
    });

    // Normalize percentages to sum to 100
    const rawSum = raw.reduce((s, r) => s + r.rawPct, 0);
    raw.forEach(r => {
      r.pct = Math.round((r.rawPct / rawSum) * 100);
    });

    // Fix rounding so pcts sum to exactly 100
    const pctSum = raw.reduce((s, r) => s + r.pct, 0);
    if (pctSum !== 100) raw[0].pct += 100 - pctSum;

    // Distribute counts so they sum to exactly totalReturns
    let assigned = 0;
    raw.forEach((r, i) => {
      if (i < raw.length - 1) {
        r.count = Math.round(totalReturns * r.pct / 100);
        assigned += r.count;
      } else {
        r.count = totalReturns - assigned;
      }
      delete r.rawPct;
    });

    return raw;
  }

  // Generate period-specific product stats derived from the chart period data.
  // Product returned counts sum to the period's totalReturns, and return costs use avgReturnCost.
  function varyProducts(baseProducts, periodData, periodKey) {
    const h = strHash(periodKey + activeCompanyId);
    const totalReturns = periodData.reduce((s, d) => s + d.returns, 0);
    const totalOrders = periodData.reduce((s, d) => s + d.orders, 0);

    // Base weights from each product's returned count
    const baseReturnedSum = baseProducts.reduce((s, p) => s + p.returned, 0) || 1;
    const baseSoldSum = baseProducts.reduce((s, p) => s + p.sold, 0) || 1;

    // Compute varied weights with small deterministic offsets
    const raw = baseProducts.map((p, i) => {
      const retWeightOff = (((h * (i + 3) * 13) % 11) - 5) * 0.008;
      const retWeight = Math.max(0.05, (p.returned / baseReturnedSum) + retWeightOff);
      const soldWeight = Math.max(0.05, p.sold / baseSoldSum);
      return { ...p, retWeight, soldWeight };
    });

    // Normalize return weights
    const retWeightSum = raw.reduce((s, r) => s + r.retWeight, 0);
    const soldWeightSum = raw.reduce((s, r) => s + r.soldWeight, 0);

    // Distribute returned counts to sum exactly to totalReturns
    const totalReturnCost = Math.round(totalReturns * avgReturnCost);
    let assignedReturned = 0;
    let assignedSold = 0;
    let assignedCost = 0;
    return raw.map((r, i) => {
      let returned, sold, returnCost;
      if (i < raw.length - 1) {
        returned = Math.round(totalReturns * r.retWeight / retWeightSum);
        sold = Math.round(totalOrders * r.soldWeight / soldWeightSum);
        returnCost = Math.round(returned * avgReturnCost);
        assignedReturned += returned;
        assignedSold += sold;
        assignedCost += returnCost;
      } else {
        returned = totalReturns - assignedReturned;
        sold = totalOrders - assignedSold;
        returnCost = totalReturnCost - assignedCost;
      }

      sold = Math.max(returned, sold); // sold must be >= returned
      const returnRate = sold > 0 ? +((returned / sold) * 100).toFixed(1) : 0;
      const risk = returnRate >= 33 ? 'critical' : returnRate >= 25 ? 'high' : 'moderate';

      // Vary reason percentage slightly
      const reasonOff = (((h * (i + 2) * 7) % 7) - 3);
      const reasonPct = Math.max(30, Math.min(95, r.reasonPct + reasonOff));

      return { ...r, sold, returned, returnRate, returnCost, risk, reasonPct };
    });
  }

  // Generate period-specific channel splits from the base data
  function varyChannels(baseChannels, periodData, periodKey) {
    const totalReturns = periodData.reduce((s, d) => s + d.returns, 0);
    const h = strHash(periodKey + activeCompanyId);

    // Apply small deterministic offsets
    const raw = baseChannels.map((c, i) => {
      const pctOff = (((h * (i + 7) * 11) % 7) - 3) * 0.6;
      const rateOff = (((h * (i + 2) * 17) % 9) - 4) * 0.3;
      return {
        ...c,
        rawPct: Math.max(2, c.pct + pctOff),
        rate: Math.max(1, +(c.rate + rateOff).toFixed(1)),
      };
    });

    // Normalize percentages to sum to 100
    const rawSum = raw.reduce((s, c) => s + c.rawPct, 0);
    raw.forEach(c => {
      c.pct = Math.round((c.rawPct / rawSum) * 100);
    });

    // Fix rounding so pcts sum to exactly 100
    const pctSum = raw.reduce((s, c) => s + c.pct, 0);
    if (pctSum !== 100) raw[0].pct += 100 - pctSum;

    // Distribute returns so they sum to exactly totalReturns
    let assigned = 0;
    raw.forEach((c, i) => {
      if (i < raw.length - 1) {
        c.returns = Math.round(totalReturns * c.pct / 100);
        assigned += c.returns;
      } else {
        c.returns = totalReturns - assigned;
      }
      delete c.rawPct;
    });

    return raw;
  }

  // ===== KPI RENDERING =====

  function updateKPIs(data) {
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const totalReturns = data.reduce((s, d) => s + d.returns, 0);
    const totalPrevented = data.reduce((s, d) => s + d.prevented, 0);
    const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100) : 0;
    const returnCost = Math.round(totalReturns * avgReturnCost);
    const savedCost = Math.round(totalPrevented * avgReturnCost);

    const kpiEls = document.querySelectorAll('.kpi-card__value');
    const deltaEls = document.querySelectorAll('.kpi-card__delta');

    if (kpiEls[0]) kpiEls[0].textContent = fmt(totalOrders);
    if (kpiEls[1]) kpiEls[1].textContent = fmt(totalReturns);
    if (kpiEls[2]) kpiEls[2].textContent = returnRate.toFixed(1) + '%';
    if (kpiEls[3]) kpiEls[3].textContent = fmt(totalPrevented);

    const totalRevenue = Math.round(totalOrders * avgOrderValue);
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

  function renderChart(data, animate) {
    if (!chartBarsEl || !chartYAxisEl) return;

    const maxOrders = Math.max(...data.map(d => d.orders));
    // Pick a nice round ceiling based on magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxOrders || 1)));
    const roundTo = magnitude >= 1000 ? 1000 : magnitude >= 100 ? 100 : magnitude >= 10 ? 10 : 5;
    const yMax = Math.ceil(maxOrders / roundTo) * roundTo || roundTo;
    const ySteps = 5;
    const yStep = yMax / ySteps;

    chartYAxisEl.innerHTML = '';
    for (let i = ySteps; i >= 0; i--) {
      const span = document.createElement('span');
      span.textContent = fmt(Math.round(i * yStep));
      chartYAxisEl.appendChild(span);
    }

    chartBarsEl.innerHTML = '';
    data.forEach((d, idx) => {
      const ordersPct = (d.orders / yMax) * 100;
      // Returns and prevented are subsets of orders — size them relative to orders
      const returnsPct = d.orders > 0 ? (d.returns / d.orders) * ordersPct : 0;
      const preventedPct = d.orders > 0 ? (d.prevented / d.orders) * ordersPct : 0;

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

      if (d.tag) {
        const tagEl = document.createElement('span');
        tagEl.className = 'chart__bar-tag';
        tagEl.textContent = d.tag;
        group.appendChild(tagEl);
      }

      chartBarsEl.appendChild(group);

      if (animate && !reducedMotion) {
        setTimeout(() => {
          barOrders.style.height = ordersPct + '%';
          barReturns.style.height = returnsPct + '%';
          barPrevented.style.height = preventedPct + '%';
        }, idx * 60 + 50);
      }
    });

    // --- Return rate line overlay ---
    const maxRate = Math.max(...data.map(d => d.returnRate));
    const rateYMax = Math.ceil(maxRate / 5) * 5 + 5;

    const oldOverlay = chartBarsEl.querySelector('.chart__rate-overlay');
    if (oldOverlay) oldOverlay.remove();

    const svgNS = 'http://www.w3.org/2000/svg';
    const overlaySvg = document.createElementNS(svgNS, 'svg');
    overlaySvg.setAttribute('class', 'chart__rate-overlay');
    overlaySvg.setAttribute('preserveAspectRatio', 'none');
    chartBarsEl.appendChild(overlaySvg);

    requestAnimationFrame(() => {
      const barsRect = chartBarsEl.getBoundingClientRect();
      const chartH = barsRect.height - 40;
      const chartW = barsRect.width;
      const groups = chartBarsEl.querySelectorAll('.chart__bar-group');
      const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#0F172A';

      overlaySvg.setAttribute('viewBox', `0 0 ${chartW} ${barsRect.height}`);
      overlaySvg.setAttribute('width', chartW);
      overlaySvg.setAttribute('height', barsRect.height);

      const points = [];
      groups.forEach((g, i) => {
        const gRect = g.getBoundingClientRect();
        const x = gRect.left - barsRect.left + gRect.width / 2;
        const y = chartH - (data[i].returnRate / rateYMax) * chartH;
        points.push({ x, y, rate: data[i].returnRate });
      });

      if (points.length > 1) {
        const polyline = document.createElementNS(svgNS, 'polyline');
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        polyline.setAttribute('points', pointsStr);
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', lineColor);
        polyline.setAttribute('stroke-width', '2');
        polyline.setAttribute('stroke-linejoin', 'round');
        polyline.setAttribute('stroke-linecap', 'round');

        if (animate && !reducedMotion) {
          polyline.style.opacity = '0';
          setTimeout(() => { polyline.style.opacity = '1'; }, 300);
        }

        overlaySvg.appendChild(polyline);
      }

      points.forEach((p, i) => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', lineColor);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', p.x);
        text.setAttribute('y', p.y - 12);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '700');
        text.setAttribute('fill', lineColor);
        text.setAttribute('font-family', 'DM Sans, sans-serif');
        text.textContent = p.rate.toFixed(1) + '%';

        if (animate && !reducedMotion) {
          circle.style.opacity = '0';
          text.style.opacity = '0';
          circle.style.transition = 'opacity 0.3s ease';
          text.style.transition = 'opacity 0.3s ease';
          setTimeout(() => {
            circle.style.opacity = '1';
            text.style.opacity = '1';
          }, i * 60 + 400);
        }

        overlaySvg.appendChild(circle);
        overlaySvg.appendChild(text);
      });
    });

    attachTooltips();
  }

  // ===== REASONS RENDERING =====

  const reasonsEl = document.getElementById('reasons-container');

  function renderReasons(animate, dataOverride) {
    if (!reasonsEl) return;
    reasonsEl.innerHTML = '';
    const activeReasons = dataOverride || reasonsData;

    // Mini donut pie
    const pieWrap = document.createElement('div');
    pieWrap.className = 'reasons__pie-wrap';

    const size = 120;
    const cx = size / 2;
    const cy = size / 2;
    const r = 50;
    const hole = 30;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('class', 'reasons__pie');

    let cumulative = 0;
    const totalPct = activeReasons.reduce((s, d) => s + d.pct, 0);
    const slicePaths = [];

    activeReasons.forEach((d, i) => {
      const startAngle = (cumulative / totalPct) * 360 - 90;
      const sliceAngle = (d.pct / totalPct) * 360;
      cumulative += d.pct;
      const endAngle = startAngle + sliceAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const midRad = ((startAngle + sliceAngle / 2) * Math.PI) / 180;
      const largeArc = sliceAngle > 180 ? 1 : 0;

      // Outer arc
      const ox1 = cx + r * Math.cos(startRad);
      const oy1 = cy + r * Math.sin(startRad);
      const ox2 = cx + r * Math.cos(endRad);
      const oy2 = cy + r * Math.sin(endRad);
      // Inner arc
      const ix1 = cx + hole * Math.cos(endRad);
      const iy1 = cy + hole * Math.sin(endRad);
      const ix2 = cx + hole * Math.cos(startRad);
      const iy2 = cy + hole * Math.sin(startRad);

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', `M ${ox1} ${oy1} A ${r} ${r} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${hole} ${hole} 0 ${largeArc} 0 ${ix2} ${iy2} Z`);
      path.setAttribute('fill', d.color);
      path.style.cursor = 'pointer';
      path.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
      path._hoverTx = Math.cos(midRad) * 4;
      path._hoverTy = Math.sin(midRad) * 4;
      path.style.transformOrigin = `${cx}px ${cy}px`;

      if (animate && !reducedMotion) {
        path.style.opacity = '0';
        setTimeout(() => { path.style.opacity = '1'; }, i * 60 + 50);
      }

      svg.appendChild(path);
      slicePaths.push(path);
    });

    // Center total
    const totalCount = activeReasons.reduce((s, d) => s + d.count, 0);
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#0F172A';
    const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8E96A6';

    const valText = document.createElementNS(svgNS, 'text');
    valText.setAttribute('x', cx);
    valText.setAttribute('y', cy + 1);
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('dominant-baseline', 'central');
    valText.setAttribute('font-size', '14');
    valText.setAttribute('font-weight', '800');
    valText.setAttribute('fill', textColor);
    valText.setAttribute('font-family', 'DM Sans, sans-serif');
    valText.textContent = totalCount >= 1000 ? (totalCount / 1000).toFixed(1) + 'k' : fmt(totalCount);
    valText.style.pointerEvents = 'none';
    svg.appendChild(valText);

    pieWrap.appendChild(svg);

    // Rows list
    const list = document.createElement('div');
    list.className = 'reasons__list';

    const rows = [];
    activeReasons.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'reasons__row';
      row.innerHTML = `
        <span class="reasons__dot" style="background:${r.color}"></span>
        <span class="reasons__name">${r.name}</span>
        <span class="reasons__pct">${r.pct}%</span>
        <span class="reasons__count">${fmt(r.count)}</span>
      `;
      list.appendChild(row);
      rows.push(row);
    });

    reasonsEl.appendChild(pieWrap);
    reasonsEl.appendChild(list);

    // Hover interactions
    function highlight(index) {
      slicePaths.forEach((p, j) => {
        if (j === index) {
          p.style.transform = `translate(${p._hoverTx}px, ${p._hoverTy}px)`;
          p.style.filter = 'brightness(1.15)';
        } else {
          p.style.filter = 'brightness(0.7)';
          p.style.opacity = '0.45';
        }
      });
      rows.forEach((r, j) => {
        r.style.opacity = j === index ? '1' : '0.3';
      });
    }

    function reset() {
      slicePaths.forEach(p => {
        p.style.transform = 'translate(0,0)';
        p.style.filter = 'none';
        p.style.opacity = '1';
      });
      rows.forEach(r => { r.style.opacity = '1'; });
    }

    slicePaths.forEach((path, i) => {
      path.addEventListener('mouseenter', () => highlight(i));
      path.addEventListener('mouseleave', reset);
    });

    rows.forEach((row, i) => {
      row.addEventListener('mouseenter', () => highlight(i));
      row.addEventListener('mouseleave', reset);
    });
  }

  // ===== SPARKLINE (Return Rate Trend) =====

  const sparklineEl = document.getElementById('sparkline-container');

  function renderSparkline(periodData, animate) {
    if (!sparklineEl) return;
    sparklineEl.innerHTML = '';

    // Remove old sparkline tooltips
    document.querySelectorAll('.spark-tooltip').forEach(el => el.remove());

    const trendData = periodData.map(d => ({ label: d.label, rate: d.returnRate }));

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('preserveAspectRatio', 'none');
    sparklineEl.appendChild(svg);

    const sparkTooltip = document.createElement('div');
    sparkTooltip.className = 'spark-tooltip';
    sparkTooltip.style.display = 'none';
    document.body.appendChild(sparkTooltip);

    requestAnimationFrame(() => {
      const rect = sparklineEl.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const padTop = 24;
      const padBottom = 20;
      const padX = 30;
      const chartH = h - padTop - padBottom;
      const chartW = w - padX * 2;

      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);

      const rates = trendData.map(d => d.rate);
      const minR = Math.floor(Math.min(...rates) / 2) * 2 - 2;
      const maxR = Math.ceil(Math.max(...rates) / 2) * 2 + 2;
      const rangeR = maxR - minR || 1;

      const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() || '#2E9CDB';
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8E96A6';
      const greenColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#22A873';
      const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#E2E8F0';
      const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#FFFFFF';

      const points = trendData.map((d, i) => ({
        x: padX + (i / (trendData.length - 1)) * chartW,
        y: padTop + (1 - (d.rate - minR) / rangeR) * chartH,
        rate: d.rate,
        label: d.label,
      }));

      // Gradient fill under line
      const defs = document.createElementNS(svgNS, 'defs');
      const grad = document.createElementNS(svgNS, 'linearGradient');
      grad.setAttribute('id', 'spark-grad');
      grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
      const stop1 = document.createElementNS(svgNS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', lineColor);
      stop1.setAttribute('stop-opacity', '0.25');
      const stop2 = document.createElementNS(svgNS, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', lineColor);
      stop2.setAttribute('stop-opacity', '0.02');
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
      svg.appendChild(defs);

      // Area fill
      const areaPath = document.createElementNS(svgNS, 'path');
      const areaD = `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
      areaPath.setAttribute('d', areaD);
      areaPath.setAttribute('fill', 'url(#spark-grad)');
      svg.appendChild(areaPath);

      // Line
      const polyline = document.createElementNS(svgNS, 'polyline');
      polyline.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('stroke', lineColor);
      polyline.setAttribute('stroke-width', '2.5');
      polyline.setAttribute('stroke-linejoin', 'round');
      polyline.setAttribute('stroke-linecap', 'round');
      svg.appendChild(polyline);

      // Hover crosshair line (hidden by default)
      const hoverLine = document.createElementNS(svgNS, 'line');
      hoverLine.setAttribute('y1', padTop);
      hoverLine.setAttribute('y2', padTop + chartH);
      hoverLine.setAttribute('stroke', borderColor);
      hoverLine.setAttribute('stroke-width', '1');
      hoverLine.setAttribute('stroke-dasharray', '4 3');
      hoverLine.style.display = 'none';
      svg.appendChild(hoverLine);

      // Hover dot (hidden by default)
      const hoverDot = document.createElementNS(svgNS, 'circle');
      hoverDot.setAttribute('r', '6');
      hoverDot.setAttribute('fill', lineColor);
      hoverDot.setAttribute('stroke', cardBg);
      hoverDot.setAttribute('stroke-width', '3');
      hoverDot.style.display = 'none';
      svg.appendChild(hoverDot);

      // Static points and month labels
      const staticCircles = [];
      const staticLabels = [];
      const staticMonthLabels = [];

      // Determine label skip interval to avoid crowding
      const n = points.length;
      const labelStep = n > 12 ? 3 : n > 8 ? 2 : 1;

      const dotR = n > 12 ? '2.5' : '3.5';
      const dotStroke = n > 12 ? '1.5' : '2';

      points.forEach((p, i) => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', dotR);
        circle.setAttribute('fill', i === n - 1 ? greenColor : lineColor);
        circle.setAttribute('stroke', cardBg);
        circle.setAttribute('stroke-width', dotStroke);
        svg.appendChild(circle);
        staticCircles.push(circle);

        // Show rate label only for visible points (first, last, every Nth)
        const showLabel = i === 0 || i === n - 1 || i % labelStep === 0;

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', p.x);
        text.setAttribute('y', p.y - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', '700');
        text.setAttribute('fill', i === n - 1 ? greenColor : textColor);
        text.setAttribute('font-family', 'DM Sans, sans-serif');
        text.textContent = p.rate.toFixed(1) + '%';
        if (!showLabel) text.style.display = 'none';
        svg.appendChild(text);
        staticLabels.push(text);

        const monthLabel = document.createElementNS(svgNS, 'text');
        monthLabel.setAttribute('x', p.x);
        monthLabel.setAttribute('y', h - 4);
        monthLabel.setAttribute('text-anchor', 'middle');
        monthLabel.setAttribute('font-size', '10');
        monthLabel.setAttribute('fill', textColor);
        monthLabel.setAttribute('font-family', 'DM Sans, sans-serif');
        monthLabel.textContent = p.label;
        if (!showLabel) monthLabel.style.display = 'none';
        svg.appendChild(monthLabel);
        staticMonthLabels.push(monthLabel);
      });

      // Delta badge
      const first = rates[0];
      const last = rates[rates.length - 1];
      const diff = last - first;
      const deltaText = document.createElementNS(svgNS, 'text');
      deltaText.setAttribute('x', w - 8);
      deltaText.setAttribute('y', 14);
      deltaText.setAttribute('text-anchor', 'end');
      deltaText.setAttribute('font-size', '11');
      deltaText.setAttribute('font-weight', '700');
      deltaText.setAttribute('fill', diff <= 0 ? greenColor : (getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#E05252'));
      deltaText.setAttribute('font-family', 'DM Sans, sans-serif');
      deltaText.textContent = (diff > 0 ? '+' : '') + diff.toFixed(1) + 'pp';
      svg.appendChild(deltaText);

      // Invisible hover zones for each point
      points.forEach((p, i) => {
        const zone = document.createElementNS(svgNS, 'rect');
        const zoneW = chartW / points.length;
        zone.setAttribute('x', p.x - zoneW / 2);
        zone.setAttribute('y', 0);
        zone.setAttribute('width', zoneW);
        zone.setAttribute('height', h);
        zone.setAttribute('fill', 'transparent');
        zone.style.cursor = 'pointer';

        zone.addEventListener('mouseenter', () => {
          // Show crosshair + enlarged dot
          hoverLine.setAttribute('x1', p.x);
          hoverLine.setAttribute('x2', p.x);
          hoverLine.style.display = '';
          hoverDot.setAttribute('cx', p.x);
          hoverDot.setAttribute('cy', p.y);
          hoverDot.setAttribute('fill', i === points.length - 1 ? greenColor : lineColor);
          hoverDot.style.display = '';

          // Dim other points; show hovered label even if normally hidden
          staticCircles.forEach((c, j) => { c.style.opacity = j === i ? '0' : '0.3'; });
          staticLabels.forEach((t, j) => {
            if (j === i) { t.style.display = ''; t.style.opacity = '1'; }
            else { t.style.opacity = '0.3'; }
          });
          staticMonthLabels.forEach((t, j) => {
            if (j === i) { t.style.display = ''; t.style.opacity = '1'; }
            else { t.style.opacity = '0.3'; }
          });

          // Show tooltip
          const prevRate = i > 0 ? points[i - 1].rate : null;
          const changePp = prevRate !== null ? (p.rate - prevRate) : null;
          sparkTooltip.innerHTML = `
            <strong>${p.label}</strong>
            <span class="spark-tooltip__rate">${p.rate.toFixed(1)}%</span>
            ${changePp !== null ? `<span class="spark-tooltip__change" style="color: ${changePp <= 0 ? greenColor : 'var(--red, #E05252)'}">${changePp > 0 ? '+' : ''}${changePp.toFixed(1)}pp vs prev</span>` : ''}
          `;
          sparkTooltip.style.display = 'flex';
        });

        zone.addEventListener('mousemove', (e) => {
          sparkTooltip.style.left = e.clientX + 12 + 'px';
          sparkTooltip.style.top = e.clientY - 60 + 'px';
        });

        zone.addEventListener('mouseleave', () => {
          hoverLine.style.display = 'none';
          hoverDot.style.display = 'none';
          staticCircles.forEach(c => { c.style.opacity = '1'; });
          staticLabels.forEach((t, j) => {
            t.style.opacity = '1';
            const vis = j === 0 || j === n - 1 || j % labelStep === 0;
            if (!vis) t.style.display = 'none';
          });
          staticMonthLabels.forEach((t, j) => {
            t.style.opacity = '1';
            const vis = j === 0 || j === n - 1 || j % labelStep === 0;
            if (!vis) t.style.display = 'none';
          });
          sparkTooltip.style.display = 'none';
        });

        svg.appendChild(zone);
      });

      if (animate) {
        svg.style.opacity = '0';
        svg.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => { svg.style.opacity = '1'; }, 100);
      }
    });
  }

  // ===== CHANNEL BREAKDOWN =====

  const channelEl = document.getElementById('channel-container');
  const channelColors = ['#2E9CDB', '#2E9CDB', '#5BB8E8', '#A0AEC0'];

  function renderChannels(baseChannelData, periodData, periodKey, animate) {
    if (!channelEl) return;
    channelEl.innerHTML = '';

    const cData = varyChannels(baseChannelData, periodData, periodKey);

    const items = [];

    cData.forEach((d, i) => {
      const item = document.createElement('div');
      item.className = 'channel-item';

      const barWidth = d.pct;

      item.innerHTML = `
        <span class="channel-item__name">${d.channel}</span>
        <div class="channel-item__bar-wrap">
          <div class="channel-item__bar" style="width: ${animate ? 0 : barWidth}%; background: ${channelColors[i]}"></div>
        </div>
        <div class="channel-item__stats">
          <span class="channel-item__share"><span class="channel-item__stat-label">Share</span>${d.pct}%</span>
          <span class="channel-item__divider"></span>
          <span class="channel-item__rate"><span class="channel-item__stat-label">Rate</span>${d.rate}%</span>
        </div>
      `;

      channelEl.appendChild(item);
      items.push(item);

      if (animate) {
        const bar = item.querySelector('.channel-item__bar');
        setTimeout(() => { bar.style.width = barWidth + '%'; }, i * 80 + 100);
      }

      // Hover: highlight this row, dim others
      item.addEventListener('mouseenter', () => {
        items.forEach((el, j) => {
          if (j === i) {
            el.classList.add('channel-item--active');
          } else {
            el.classList.add('channel-item--dimmed');
          }
        });
      });

      item.addEventListener('mouseleave', () => {
        items.forEach(el => {
          el.classList.remove('channel-item--active', 'channel-item--dimmed');
        });
      });
    });
  }

  // ===== PRODUCT TABLE RENDERING =====

  function renderProductTable(products) {
    const tbody = document.querySelector('.product-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const badge = document.querySelector('.card__badge');
    if (badge) badge.textContent = `${products.length} products flagged`;

    products.forEach(p => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-product', p.id);
      tr.innerHTML = `
        <td class="product-table__td">
          <div>
            <span class="product-table__name">${p.name}</span>
            <span class="product-table__cat">${p.cat}</span>
          </div>
        </td>
        <td class="product-table__td product-table__td--mono">${p.sku}</td>
        <td class="product-table__td product-table__td--right">$${p.price}</td>
        <td class="product-table__td product-table__td--right">${fmt(p.sold)}</td>
        <td class="product-table__td product-table__td--right">${fmt(p.returned)}</td>
        <td class="product-table__td product-table__td--right ${p.returnRate >= 33 ? 'product-table__td--red' : 'product-table__td--amber'}">${p.returnRate.toFixed(1)}%</td>
        <td class="product-table__td">
          <span class="product-table__reason">${p.topReason}</span>
          <span class="product-table__reason-pct">${p.reasonPct}%</span>
        </td>
        <td class="product-table__td product-table__td--right product-table__td--bold">$${fmt(p.returnCost)}</td>
        <td class="product-table__td"><span class="risk-badge risk-badge--${p.risk}">${p.risk.charAt(0).toUpperCase() + p.risk.slice(1)}</span></td>
      `;
      tbody.appendChild(tr);
    });

    // Re-attach insight click handlers
    attachProductRowHandlers();
    // Re-attach sort handlers
    attachSortHandlers();
  }

  // ===== INTERVENTION EFFECTIVENESS =====

  let interventions = COMPANIES[activeCompanyId].interventions;

  function varyInterventions(baseInterventions, periodKey, periodData) {
    const h = strHash(periodKey + activeCompanyId);

    // The total prevented from the chart data is the source of truth
    const chartPrevented = periodData.reduce((s, d) => s + d.prevented, 0);

    // Compute base weights from each intervention's prevented count
    const baseTotal = baseInterventions.reduce((s, iv) => s + iv.prevented, 0) || 1;

    // Distribute chartPrevented proportionally with small deterministic offsets
    const raw = baseInterventions.map((iv, i) => {
      const weightOff = (((h * (i + 5) * 11) % 9) - 4) * 0.01;
      const weight = Math.max(0.05, (iv.prevented / baseTotal) + weightOff);
      return { ...iv, weight };
    });

    // Normalize weights
    const weightSum = raw.reduce((s, r) => s + r.weight, 0);

    // Assign prevented counts that sum exactly to chartPrevented
    let assigned = 0;
    const result = raw.map((r, i) => {
      let prevented;
      if (i < raw.length - 1) {
        prevented = Math.round(chartPrevented * r.weight / weightSum);
        assigned += prevented;
      } else {
        prevented = chartPrevented - assigned;
      }

      // Derive triggered from prevented and a varied rate
      const rateOff = (((h * (i + 3) * 13) % 9) - 4) * 0.7;
      const rate = Math.max(10, Math.min(65, +(r.rate + rateOff).toFixed(1)));
      const triggered = rate > 0 ? Math.round(prevented / (rate / 100)) : 0;

      return { type: r.type, triggered, prevented, rate };
    });

    return result;
  }

  function renderInterventions(data, costPerReturn) {
    const container = document.getElementById('interventions-container');
    if (!container) return;
    container.innerHTML = '';

    let totalTriggered = 0;
    let totalPrevented = 0;
    let totalSavings = 0;

    data.forEach(iv => {
      const savings = iv.prevented * costPerReturn;
      totalTriggered += iv.triggered;
      totalPrevented += iv.prevented;
      totalSavings += savings;

      const row = document.createElement('div');
      row.className = 'intervention-row';
      row.innerHTML = `
        <div class="intervention-row__type">${iv.type}</div>
        <div class="intervention-row__rate">${iv.rate}%</div>
        <div class="intervention-row__bar-wrap">
          <div class="intervention-row__bar" style="width: ${iv.rate}%"></div>
        </div>
        <div class="intervention-row__stats">
          <span class="intervention-row__prevented">${iv.prevented}</span> / ${fmt(iv.triggered)}
        </div>
        <div class="intervention-row__savings">$${fmt(Math.round(savings))}</div>
      `;
      container.appendChild(row);
    });

    // Totals row
    const totalRate = totalTriggered > 0 ? ((totalPrevented / totalTriggered) * 100).toFixed(1) : '0.0';
    const totals = document.createElement('div');
    totals.className = 'intervention-row intervention-row--total';
    totals.innerHTML = `
      <div class="intervention-row__type">Total</div>
      <div class="intervention-row__rate">${totalRate}%</div>
      <div class="intervention-row__bar-wrap">
        <div class="intervention-row__bar" style="width: ${totalRate}%"></div>
      </div>
      <div class="intervention-row__stats">
        <span class="intervention-row__prevented">${fmt(totalPrevented)}</span> / ${fmt(totalTriggered)}
      </div>
      <div class="intervention-row__savings">$${fmt(Math.round(totalSavings))}</div>
    `;
    container.appendChild(totals);
  }

  // ===== TOOLTIPS =====

  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  function attachTooltips() {
    const currentData = datasets[currentPeriod];
    document.querySelectorAll('.chart__bar-group').forEach((group, idx) => {
      const bars = group.querySelectorAll('.chart__bar');
      const label = group.querySelector('.chart__bar-label')?.textContent || '';
      const rate = currentData[idx] ? currentData[idx].returnRate.toFixed(1) + '%' : '';

      group.addEventListener('mouseenter', () => {
        const orders = bars[0]?.title || '';
        const returns = bars[1]?.title || '';
        const prevented = bars[2]?.title || '';

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

      const pd = datasets[period];
      renderChart(pd, true);
      updateKPIs(pd);
      renderSparkline(pd, true);
      renderReasons(true, varyReasons(reasonsData, pd, period));
      renderChannels(channelData, pd, period, true);
      renderProductTable(varyProducts(products, pd, period));
      renderInterventions(varyInterventions(interventions, period, pd), avgReturnCost);
    });
  });

  // ===== KPI COUNTER ANIMATION =====

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

  // ===== SORTABLE TABLE =====

  function attachSortHandlers() {
    const table = document.querySelector('.product-table');
    if (!table) return;
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

      // Remove old listeners by cloning
      const newTh = th.cloneNode(true);
      th.parentNode.replaceChild(newTh, th);

      newTh.addEventListener('click', () => {
        const rows = Array.from(tbody.querySelectorAll('tr:not(.insight-row)'));
        const currentDir = newTh.dataset.sortDir;
        const newDir = currentDir === 'asc' ? 'desc' : 'asc';

        document.querySelectorAll('.product-table__th').forEach(h => {
          h.dataset.sortDir = 'none';
          h.classList.remove('product-table__th--sorted-asc', 'product-table__th--sorted-desc');
        });

        newTh.dataset.sortDir = newDir;
        newTh.classList.add(`product-table__th--sorted-${newDir}`);

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

  let activeInsightRow = null;
  let activeProductRow = null;

  function attachProductRowHandlers() {
    activeInsightRow = null;
    activeProductRow = null;

    document.querySelectorAll('tr[data-product]').forEach(row => {
      row.addEventListener('click', () => {
        const productId = row.dataset.product;

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

        row.classList.add('is-active');
        activeProductRow = row;

        const insightRow = createInsightPanel(productId);
        if (insightRow) {
          row.after(insightRow);
          activeInsightRow = insightRow;

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
  }

  // ===== COMPANY SWITCHING =====

  const profileToggle = document.getElementById('profile-toggle');
  const profileDropdown = document.getElementById('profile-dropdown');
  const companyListEl = document.getElementById('company-list');
  const navStoreName = document.getElementById('nav-store-name');
  const navAvatar = document.getElementById('nav-avatar');

  function buildCompanyList() {
    if (!companyListEl) return;
    companyListEl.innerHTML = '';

    Object.entries(COMPANIES).forEach(([id, co]) => {
      const item = document.createElement('button');
      item.className = 'profile-dropdown__company' + (id === activeCompanyId ? ' profile-dropdown__company--active' : '');
      item.innerHTML = `
        <span class="profile-dropdown__avatar">${co.initials}</span>
        <div class="profile-dropdown__info">
          <span class="profile-dropdown__name">${co.name}</span>
          <span class="profile-dropdown__industry">${co.industry}</span>
        </div>
        ${id === activeCompanyId ? '<span class="profile-dropdown__check">&#x2713;</span>' : ''}
      `;
      item.addEventListener('click', () => switchCompany(id));
      companyListEl.appendChild(item);
    });
  }

  function switchCompany(companyId) {
    if (companyId === activeCompanyId) {
      profileDropdown.classList.remove('is-open');
      return;
    }

    const co = COMPANIES[companyId];
    if (!co) return;

    activeCompanyId = companyId;
    datasets = co.datasets;
    reasonsData = co.reasonsData;
    aiInsights = co.aiInsights;
    channelData = co.channelData;
    avgOrderValue = co.avgOrderValue;
    products = co.products;
    avgReturnCost = co.avgReturnCost || 50;
    interventions = co.interventions || [];

    // Update nav
    navStoreName.textContent = co.name;
    navAvatar.textContent = co.initials;

    // Reset period to 1Y
    currentPeriod = '1Y';
    periodBtns.forEach(b => {
      b.classList.toggle('period-btn--active', b.dataset.period === '1Y');
    });

    // Re-render everything
    renderChart(datasets[currentPeriod], true);
    updateKPIs(datasets[currentPeriod]);
    renderReasons(true, varyReasons(reasonsData, datasets[currentPeriod], currentPeriod));
    renderSparkline(datasets[currentPeriod], true);
    renderChannels(channelData, datasets[currentPeriod], currentPeriod, true);
    renderProductTable(varyProducts(products, datasets[currentPeriod], currentPeriod));
    renderInterventions(varyInterventions(interventions, currentPeriod, datasets[currentPeriod]), avgReturnCost);

    // Rebuild company list to update active state
    buildCompanyList();

    // Close dropdown
    profileDropdown.classList.remove('is-open');
  }

  // Toggle dropdown
  if (profileToggle && profileDropdown) {
    profileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
        profileDropdown.classList.remove('is-open');
      }
    });
  }

  // ===== IMPORT MODAL =====

  const importBtn = document.getElementById('import-btn');
  const importModal = document.getElementById('import-modal');
  const importModalClose = document.getElementById('import-modal-close');
  const importCancel = document.getElementById('import-cancel');
  const importSubmit = document.getElementById('import-submit');
  const importDropzone = document.getElementById('import-dropzone');
  const importFileInput = document.getElementById('import-file');
  const importFileList = document.getElementById('import-file-list');

  let importedFiles = [];

  function openImportModal() {
    if (importModal) {
      importModal.classList.add('is-open');
      profileDropdown.classList.remove('is-open');
    }
  }

  function closeImportModal() {
    if (importModal) {
      importModal.classList.remove('is-open');
      importedFiles = [];
      if (importFileList) importFileList.innerHTML = '';
      if (importFileInput) importFileInput.value = '';
      document.getElementById('import-company-name').value = '';
      document.getElementById('import-industry').value = '';
    }
  }

  function updateFileList() {
    if (!importFileList) return;
    importFileList.innerHTML = '';
    importedFiles.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'modal__file-item';
      item.innerHTML = `
        <span class="modal__file-name">${f.name}</span>
        <span class="modal__file-size">${(f.size / 1024).toFixed(1)} KB</span>
        <button class="modal__file-remove" data-index="${i}">&times;</button>
      `;
      item.querySelector('.modal__file-remove').addEventListener('click', () => {
        importedFiles.splice(i, 1);
        updateFileList();
      });
      importFileList.appendChild(item);
    });
  }

  if (importBtn) importBtn.addEventListener('click', openImportModal);
  if (importModalClose) importModalClose.addEventListener('click', closeImportModal);
  if (importCancel) importCancel.addEventListener('click', closeImportModal);

  if (importModal) {
    importModal.addEventListener('click', (e) => {
      if (e.target === importModal) closeImportModal();
    });
  }

  if (importDropzone && importFileInput) {
    importDropzone.addEventListener('click', () => importFileInput.click());

    importDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      importDropzone.classList.add('is-dragover');
    });

    importDropzone.addEventListener('dragleave', () => {
      importDropzone.classList.remove('is-dragover');
    });

    importDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      importDropzone.classList.remove('is-dragover');
      const files = Array.from(e.dataTransfer.files);
      importedFiles.push(...files);
      updateFileList();
    });

    importFileInput.addEventListener('change', () => {
      const files = Array.from(importFileInput.files);
      importedFiles.push(...files);
      updateFileList();
    });
  }

  function showToast(html, duration) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = html;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, duration || 5000);
    return toast;
  }

  if (importSubmit) {
    importSubmit.addEventListener('click', async () => {
      const companyName = document.getElementById('import-company-name').value.trim();
      const industry = document.getElementById('import-industry').value.trim();

      // Validate
      if (!companyName) {
        document.getElementById('import-company-name').style.borderColor = '#E05252';
        return;
      }
      if (importedFiles.length === 0) {
        importDropzone.style.borderColor = '#E05252';
        return;
      }

      // Reset validation styles
      document.getElementById('import-company-name').style.borderColor = '';
      importDropzone.style.borderColor = '';

      // Show processing state
      importSubmit.textContent = 'Analyzing with AI...';
      importSubmit.disabled = true;
      importCancel.disabled = true;

      const processingToast = showToast(`
        <span class="toast__icon">&#x1F9E0;</span>
        <div>
          <strong>AI Agent processing "${companyName}" data...</strong>
          <br><span class="toast__sub">Interpreting files and generating dashboard. This may take 15-30 seconds.</span>
          <div class="toast__progress"><div class="toast__progress-bar"></div></div>
        </div>
      `, 60000);

      try {
        // Build FormData
        const formData = new FormData();
        formData.append('companyName', companyName);
        formData.append('industry', industry || 'E-commerce');
        importedFiles.forEach(f => formData.append('files', f));

        // Send to backend
        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        // Remove processing toast
        processingToast.classList.remove('is-visible');
        setTimeout(() => processingToast.remove(), 400);

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Processing failed');
        }

        const co = result.company;

        // Generate a slug ID
        const companyId = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Add to COMPANIES global
        COMPANIES[companyId] = co;

        // Close modal and switch to the new company
        closeImportModal();
        switchCompany(companyId);

        showToast(`
          <span class="toast__icon">&#x2705;</span>
          <div>
            <strong>${co.name}</strong> dashboard is ready!
            <br><span class="toast__sub">AI agent analyzed your data and generated returns intelligence.</span>
          </div>
        `, 5000);

      } catch (err) {
        console.error('Import error:', err);

        // Remove processing toast
        processingToast.classList.remove('is-visible');
        setTimeout(() => processingToast.remove(), 400);

        showToast(`
          <span class="toast__icon">&#x274C;</span>
          <div>
            <strong>Processing failed</strong>
            <br><span class="toast__sub">${err.message}</span>
          </div>
        `, 6000);
      } finally {
        importSubmit.textContent = 'Import & Process';
        importSubmit.disabled = false;
        importCancel.disabled = false;
      }
    });
  }

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

  // ===== RESIZE HANDLER =====

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderChart(datasets[currentPeriod], false);
      renderSparkline(datasets[currentPeriod], false);
    }, 150);
  });

  // ===== THEME TOGGLE =====

  const themeToggle = document.getElementById('theme-toggle');
  const navLogoImg = document.querySelector('.nav__logo-img:not(.nav__logo-img--footer)');
  const savedTheme = localStorage.getItem('kept-theme');

  function updateNavLogo(dark) {
    if (!navLogoImg) return;
    navLogoImg.src = dark ? 'assets/kept-logo-white.png?v=4' : 'assets/kept-logo.png?v=4';
  }

  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateNavLogo(true);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('kept-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('kept-theme', 'dark');
      }
      updateNavLogo(!isDark);
      // Re-render SVG elements so colors update
      renderChart(datasets[currentPeriod], false);
      renderReasons(false, varyReasons(reasonsData, datasets[currentPeriod], currentPeriod));
      renderSparkline(datasets[currentPeriod], false);
    });
  }

  // ===== INITIAL RENDER =====

  buildCompanyList();
  renderChart(datasets[currentPeriod], true);
  updateKPIs(datasets[currentPeriod]);
  renderReasons(true, varyReasons(reasonsData, datasets[currentPeriod], currentPeriod));
  renderSparkline(datasets[currentPeriod], true);
  renderChannels(channelData, datasets[currentPeriod], currentPeriod, true);
  renderProductTable(varyProducts(products, datasets[currentPeriod], currentPeriod));
  renderInterventions(varyInterventions(interventions, currentPeriod, datasets[currentPeriod]), avgReturnCost);
});
