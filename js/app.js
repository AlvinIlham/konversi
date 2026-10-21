/**
 * app.js – Main application controller
 * Handles UI interactions, step rendering, toggle, navigation, and drawer menu.
 */
(function () {
  'use strict';

  // ===== State =====
  let currentType = 'dec-bin';
  let currentSteps = [];
  let currentStepIndex = 0;
  let tryItMode = false;

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const convCards     = $$('.conv-card');
  const inputField    = $('#input-field');
  const btnConvert    = $('#btn-convert');
  const inputHint     = $('#input-hint');
  const stepViewer    = $('#step-viewer');
  const stepTitle     = $('#step-header-title');
  const stepConv      = $('#step-header-conversion');
  const progressBar   = $('#step-progress-fill');
  const stepContent   = $('#step-content');
  const stepInfo      = $('#step-nav-info');
  const btnPrev       = $('#btn-prev');
  const btnNext       = $('#btn-next');
  const toggleEl      = $('#toggle-switch');
  const toggleLabel   = $('#toggle-label');

  // Nav
  const hamburger     = $('#nav-hamburger');
  const drawer        = $('#drawer');
  const backdrop      = $('#drawer-backdrop');
  const drawerLinks   = $$('.drawer__link');
  const navLinks      = $$('.nav__link');

  // ===== Drawer =====
  function openDrawer()  { drawer.classList.add('open'); hamburger.classList.add('open'); }
  function closeDrawer() { drawer.classList.remove('open'); hamburger.classList.remove('open'); }

  if (hamburger) hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  drawerLinks.forEach(l => l.addEventListener('click', closeDrawer));
  navLinks.forEach(l => l.addEventListener('click', closeDrawer));

  // Active nav link on scroll
  function updateNavActive() {
    const sections = ['converter', 'ref-section'];
    const scrollY = window.scrollY + 100;
    let activeId = 'converter';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) activeId = id;
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + activeId);
    });
  }
  window.addEventListener('scroll', updateNavActive, { passive: true });

  // ===== Conversion Card Selection =====
  function selectConversion(type) {
    currentType = type;
    convCards.forEach(c => c.classList.toggle('active', c.dataset.type === type));
    const label = Converter.getLabel(type);
    inputField.placeholder = Converter.getPlaceholder(type);
    inputField.value = '';
    inputHint.textContent = `Format input: bilangan ${label.from.toLowerCase()}`;
    inputHint.classList.remove('error-text');
    inputField.classList.remove('error');
    stepViewer.classList.remove('visible');
    inputField.focus();
  }

  convCards.forEach(c => {
    c.addEventListener('click', () => selectConversion(c.dataset.type));
  });

  // ===== Input Validation =====
  inputField.addEventListener('input', () => {
    inputField.classList.remove('error');
    inputHint.classList.remove('error-text');
    const v = Converter.validate(currentType, inputField.value);
    if (inputField.value.trim() && !v.valid) {
      inputHint.textContent = v.message;
      inputHint.classList.add('error-text');
      inputField.classList.add('error');
    } else {
      const label = Converter.getLabel(currentType);
      inputHint.textContent = `Format input: bilangan ${label.from.toLowerCase()}`;
    }
  });

  // ===== Convert =====
  function doConvert() {
    const val = inputField.value.trim();
    const v = Converter.validate(currentType, val);
    if (!v.valid) {
      inputHint.textContent = v.message;
      inputHint.classList.add('error-text');
      inputField.classList.add('error');
      return;
    }
    const result = Converter.convert(currentType, val);
    currentSteps = result.steps;
    currentStepIndex = 0;
    const label = Converter.getLabel(currentType);
    stepTitle.textContent = `${label.from} ke ${label.to}`;
    stepConv.textContent = `${val} \u2192 ?`;
    stepViewer.classList.add('visible');
    renderStep();
    stepViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnConvert.addEventListener('click', doConvert);
  inputField.addEventListener('keydown', e => { if (e.key === 'Enter') doConvert(); });

  // ===== Step Navigation =====
  btnPrev.addEventListener('click', () => { if (currentStepIndex > 0) { currentStepIndex--; renderStep(); } });
  btnNext.addEventListener('click', () => { if (currentStepIndex < currentSteps.length - 1) { currentStepIndex++; renderStep(); } });

  // ===== Toggle =====
  toggleEl.addEventListener('click', () => {
    tryItMode = !tryItMode;
    toggleEl.classList.toggle('active', tryItMode);
    toggleEl.setAttribute('aria-checked', tryItMode);
    toggleLabel.textContent = tryItMode ? 'Latihan' : 'Latihan';
    if (currentSteps.length > 0) renderStep();
  });

  // ===== Keyboard Nav =====
  document.addEventListener('keydown', e => {
    if (!stepViewer.classList.contains('visible') || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft'  && currentStepIndex > 0) { currentStepIndex--; renderStep(); }
    if (e.key === 'ArrowRight' && currentStepIndex < currentSteps.length - 1) { currentStepIndex++; renderStep(); }
  });

  // ===== Step Rendering =====
  function renderStep() {
    const step = currentSteps[currentStepIndex];
    const total = currentSteps.length;

    progressBar.style.width = `${((currentStepIndex + 1) / total) * 100}%`;
    stepInfo.textContent = `${currentStepIndex + 1} / ${total}`;
    btnPrev.disabled = currentStepIndex === 0;
    btnNext.disabled = currentStepIndex === total - 1;

    let h = `<div class="step-card active">`;
    h += `<div class="step-card__number">${step.stepLabel}</div>`;
    h += `<div class="step-card__instruction">${step.instruction}</div>`;

    switch (step.type) {
      case 'division':        h += renderDivision(step.data); break;
      case 'division-result': h += renderDivisionResult(step.data); break;
      case 'bit-group':
      case 'bit-group-reverse': h += renderBitGroups(step.data, step.type === 'bit-group-reverse'); break;
      case 'combine':         h += renderCombine(step.data); break;
      case 'positional':      h += renderPositional(step.data); break;
      case 'calculation':     h += renderCalculation(step.data); break;
      case 'result':          h += renderResult(step); break;
    }

    h += `</div>`;
    stepContent.innerHTML = h;

    if (tryItMode) {
      stepContent.querySelectorAll('.try-input').forEach(inp => {
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(inp); });
        inp.addEventListener('blur', () => checkAnswer(inp));
      });
    }
  }

  // ===== Render helpers =====

  function renderDivision(d) {
    let h = `<table class="division-table"><thead><tr><th>Bilangan</th><th>Dibagi</th><th>Hasil</th><th>Sisa</th></tr></thead><tbody>`;
    d.divisions.forEach((r, i) => {
      const cls = i === d.highlightIndex ? 'highlight' : i < d.highlightIndex ? 'completed' : '';
      const divisor = r.divisor !== undefined ? r.divisor : 2;
      const displayRemainder = r.remainderDisplay !== undefined ? r.remainderDisplay : r.remainder;
      h += `<tr class="${cls}"><td>${r.dividend}</td><td>${divisor}</td><td>${r.quotient}</td>`;
      if (tryItMode && i === d.highlightIndex) {
        const ans = d.tryAnswer !== undefined ? d.tryAnswer : r.remainder;
        h += `<td class="remainder"><input type="text" class="try-input" data-answer="${ans}" placeholder="?" autocomplete="off"><div class="try-feedback"></div></td>`;
      } else {
        h += `<td class="remainder">${displayRemainder}</td>`;
      }
      h += `</tr>`;
    });
    return h + `</tbody></table>`;
  }

  function renderDivisionResult(d) {
    let h = `<table class="division-table"><thead><tr><th>Bilangan</th><th>Dibagi</th><th>Hasil</th><th>Sisa</th></tr></thead><tbody>`;
    d.divisions.forEach(r => {
      const divisor = r.divisor !== undefined ? r.divisor : 2;
      const displayRemainder = r.remainderDisplay !== undefined ? r.remainderDisplay : r.remainder;
      h += `<tr class="completed"><td>${r.dividend}</td><td>${divisor}</td><td>${r.quotient}</td><td class="remainder">${displayRemainder}</td></tr>`;
    });
    h += `</tbody></table><div class="calc-expression">Baca sisa dari bawah ke atas: `;
    for (let i = d.divisions.length - 1; i >= 0; i--) {
      const digit = d.divisions[i].hexDigit !== undefined ? d.divisions[i].hexDigit : d.divisions[i].remainder;
      h += `<span class="highlight-term">${digit}</span>`;
    }
    return h + ` = <span class="highlight-term">${d.result}</span></div>`;
  }

  function renderBitGroups(d, rev) {
    let h = `<div class="bit-groups">`;
    d.groups.forEach((g, i) => {
      const hl = i === d.highlightIndex ? 'highlight' : '';
      h += `<div class="bit-group ${hl}">`;
      if (rev) {
        h += `<div class="bit-group__source" style="letter-spacing:1.5px">${g.source}</div><div class="bit-group__arrow-down">&#8595;</div>`;
        h += tryItMode && i === d.highlightIndex
          ? `<input type="text" class="try-input" data-answer="${g.result}" placeholder="?" autocomplete="off" style="width:50px"><div class="try-feedback"></div>`
          : `<div class="bit-group__result">${g.result}</div>`;
      } else {
        h += `<div class="bit-group__source">${g.source}</div><div class="bit-group__arrow-down">&#8595;</div>`;
        h += tryItMode && i === d.highlightIndex
          ? `<input type="text" class="try-input" data-answer="${g.result}" placeholder="?" autocomplete="off" style="width:70px"><div class="try-feedback"></div>`
          : `<div class="bit-group__result">${g.result}</div>`;
      }
      h += `</div>`;
    });
    return h + `</div>`;
  }

  function renderCombine(d) {
    let h = `<div class="bit-groups">`;
    d.groups.forEach(g => { h += `<div class="bit-group"><div class="bit-group__source">${g.source}</div><div class="bit-group__arrow-down">&#8595;</div><div class="bit-group__result">${g.result}</div></div>`; });
    h += `</div><div class="calc-expression">Gabungan: <span class="highlight-term">${d.combined}</span>`;
    if (d.combined !== d.result) h += ` = <span class="highlight-term">${d.result}</span>`;
    return h + `</div>`;
  }

  function renderPositional(d) {
    let h = `<div class="positional-table">`;
    d.positions.forEach((p, i) => {
      const hl = i === d.highlightIndex ? 'highlight' : '';
      h += `<div class="pos-cell ${hl}"><div class="pos-cell__bit">${p.bit}</div><div class="pos-cell__power">2<sup>${p.position}</sup>=${p.powerValue}</div>`;
      if (tryItMode && i === d.highlightIndex) {
        h += `<input type="text" class="try-input" data-answer="${p.value}" placeholder="?" autocomplete="off" style="width:50px"><div class="try-feedback"></div>`;
      } else if (d.highlightIndex >= 0 && i <= d.highlightIndex) {
        h += `<div class="pos-cell__value">${p.value}</div>`;
      } else {
        h += `<div class="pos-cell__value" style="opacity:${d.highlightIndex === -1 ? '1' : '.25'}">?</div>`;
      }
      h += `</div>`;
    });
    return h + `</div>`;
  }

  function renderCalculation(d) {
    let h = `<div class="positional-table">`;
    d.positions.forEach(p => { h += `<div class="pos-cell"><div class="pos-cell__bit">${p.bit}</div><div class="pos-cell__power">2<sup>${p.position}</sup>=${p.powerValue}</div><div class="pos-cell__value">${p.value}</div></div>`; });
    h += `</div><div class="calc-expression">`;
    h += d.positions.map(p => p.value === 0
      ? `<span class="zero-term">${p.bit}&#215;${p.powerValue}</span>`
      : `<span class="highlight-term">${p.bit}&#215;${p.powerValue}</span>`
    ).join(`<span class="operator">+</span>`);
    h += `<span class="operator">=</span>`;
    if (tryItMode) {
      h += `<input type="text" class="try-input" data-answer="${d.result}" placeholder="?" autocomplete="off" style="width:70px"><div class="try-feedback"></div>`;
    } else {
      h += `<span class="highlight-term" style="font-weight:700">${d.result}</span>`;
    }
    return h + `</div>`;
  }

  function renderResult(step) {
    const sub = {'2':'\u2082','8':'\u2088','10':'\u2081\u2080','16':'\u2081\u2086'};
    return `<div class="result-display"><div><div class="result-display__label">Hasil Konversi</div><div class="result-display__value">${step.result}<span class="result-display__subscript">${sub[step.toBase]||''}</span></div></div></div>`;
  }

  // ===== Answer Check =====
  function checkAnswer(inp) {
    const rawAns = inp.dataset.answer || '';
    const validAnswers = rawAns.toString().split('|').map(s => s.trim().toUpperCase());
    const val = inp.value.trim().toUpperCase();
    const fb = inp.parentElement.querySelector('.try-feedback') || inp.nextElementSibling;
    if (!val) return;
    if (validAnswers.includes(val)) {
      inp.classList.remove('incorrect'); inp.classList.add('correct'); inp.disabled = true;
      if (fb) { fb.textContent = 'Benar!'; fb.className = 'try-feedback correct'; }
    } else {
      inp.classList.remove('correct'); inp.classList.add('incorrect');
      if (fb) { fb.textContent = `Jawaban: ${validAnswers[0]}`; fb.className = 'try-feedback incorrect'; }
    }
  }

  // ===== Init =====
  selectConversion('dec-bin');
})();
