/**
 * app.js
 * Main application controller – handles UI interactions, step rendering, and the "Try It" mode.
 */

(function () {
  'use strict';

  // ===== State =====
  let currentType = 'dec-bin';
  let currentSteps = [];
  let currentStepIndex = 0;
  let tryItMode = false;

  // ===== DOM References =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const convCards = $$('.conv-card');
  const inputField = $('#input-field');
  const btnConvert = $('#btn-convert');
  const inputHint = $('#input-hint');
  const stepViewer = $('#step-viewer');
  const stepHeaderTitle = $('#step-header-title');
  const stepHeaderConversion = $('#step-header-conversion');
  const stepProgressFill = $('#step-progress-fill');
  const stepContent = $('#step-content');
  const stepNavInfo = $('#step-nav-info');
  const btnPrev = $('#btn-prev');
  const btnNext = $('#btn-next');
  const toggleSwitch = $('#toggle-switch');
  const toggleLabel = $('#toggle-label');

  // ===== Binary Rain Effect =====
  function initBinaryRain() {
    const container = $('.binary-rain');
    if (!container) return;
    const chars = '01';
    const columns = Math.floor(window.innerWidth / 40);

    for (let i = 0; i < columns; i++) {
      const span = document.createElement('span');
      span.textContent = chars[Math.floor(Math.random() * 2)];
      span.style.left = (i * 40 + Math.random() * 20) + 'px';
      span.style.animationDuration = (8 + Math.random() * 16) + 's';
      span.style.animationDelay = (-Math.random() * 20) + 's';
      span.style.fontSize = (12 + Math.random() * 8) + 'px';
      container.appendChild(span);
    }
  }

  // ===== Conversion Card Selection =====
  function selectConversion(type) {
    currentType = type;
    convCards.forEach(card => {
      card.classList.toggle('active', card.dataset.type === type);
    });

    const label = Converter.getLabel(type);
    inputField.placeholder = Converter.getPlaceholder(type);
    inputField.value = '';
    inputHint.textContent = `Format input: bilangan ${label.from.toLowerCase()}`;
    inputHint.classList.remove('error-text');
    stepViewer.classList.remove('visible');
    inputField.classList.remove('error');
    inputField.focus();
  }

  convCards.forEach(card => {
    card.addEventListener('click', () => selectConversion(card.dataset.type));
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

  // ===== Convert Button =====
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
    stepHeaderTitle.textContent = `${label.from} ke ${label.to}`;
    stepHeaderConversion.textContent = `${val} → ?`;

    stepViewer.classList.add('visible');
    renderStep();
    stepViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnConvert.addEventListener('click', doConvert);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doConvert();
  });

  // ===== Step Navigation =====
  btnPrev.addEventListener('click', () => {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderStep();
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentStepIndex < currentSteps.length - 1) {
      currentStepIndex++;
      renderStep();
    }
  });

  // ===== Try It Toggle =====
  toggleSwitch.addEventListener('click', () => {
    tryItMode = !tryItMode;
    toggleSwitch.classList.toggle('active', tryItMode);
    toggleLabel.textContent = tryItMode ? 'Mode Latihan: Aktif' : 'Mode Latihan: Nonaktif';
    if (currentSteps.length > 0) renderStep();
  });

  // ===== Keyboard Navigation =====
  document.addEventListener('keydown', (e) => {
    if (!stepViewer.classList.contains('visible')) return;
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
      currentStepIndex--;
      renderStep();
    } else if (e.key === 'ArrowRight' && currentStepIndex < currentSteps.length - 1) {
      currentStepIndex++;
      renderStep();
    }
  });

  // ===== Step Rendering =====
  function renderStep() {
    const step = currentSteps[currentStepIndex];
    const total = currentSteps.length;

    // Progress
    stepProgressFill.style.width = `${((currentStepIndex + 1) / total) * 100}%`;
    stepNavInfo.textContent = `Langkah ${currentStepIndex + 1} dari ${total}`;

    // Nav buttons
    btnPrev.disabled = currentStepIndex === 0;
    btnNext.disabled = currentStepIndex === total - 1;

    // Build step HTML
    let html = `<div class="step-card active">`;
    html += `<div class="step-card__number">${step.stepLabel}</div>`;
    html += `<div class="step-card__instruction">${step.instruction}</div>`;

    switch (step.type) {
      case 'info':
        // Just text, nothing extra
        break;

      case 'division':
        html += renderDivisionTable(step.data);
        break;

      case 'division-result':
        html += renderDivisionResult(step.data);
        break;

      case 'bit-group':
      case 'bit-group-reverse':
        html += renderBitGroups(step.data, step.type === 'bit-group-reverse');
        break;

      case 'combine':
        html += renderCombine(step.data);
        break;

      case 'positional':
        html += renderPositional(step.data);
        break;

      case 'calculation':
        html += renderCalculation(step.data);
        break;

      case 'result':
        html += renderFinalResult(step);
        break;
    }

    html += `</div>`;
    stepContent.innerHTML = html;

    // If try-it mode, attach event listeners to try inputs
    if (tryItMode) {
      const tryInputs = stepContent.querySelectorAll('.try-input');
      tryInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') checkTryAnswer(input);
        });
        input.addEventListener('blur', () => checkTryAnswer(input));
      });
    }
  }

  // ===== Render Functions =====

  function renderDivisionTable(data) {
    let html = `<table class="division-table"><thead><tr>
      <th>Bilangan</th><th>Dibagi</th><th>Hasil Bagi</th><th>Sisa</th>
    </tr></thead><tbody>`;

    data.divisions.forEach((div, i) => {
      const isCurrent = i === data.highlightIndex;
      const isCompleted = i < data.highlightIndex;
      const cls = isCurrent ? 'highlight' : (isCompleted ? 'completed' : '');

      html += `<tr class="${cls}">
        <td>${div.dividend}</td>
        <td>2</td>
        <td>${div.quotient}</td>`;

      if (tryItMode && isCurrent) {
        html += `<td class="remainder">
          <input type="text" class="try-input" data-answer="${div.remainder}" placeholder="?" autocomplete="off">
          <div class="try-feedback" id="try-fb-${i}"></div>
        </td>`;
      } else {
        html += `<td class="remainder">${div.remainder}</td>`;
      }

      html += `</tr>`;
    });

    html += `</tbody></table>`;
    return html;
  }

  function renderDivisionResult(data) {
    let html = `<table class="division-table"><thead><tr>
      <th>Bilangan</th><th>Dibagi</th><th>Hasil Bagi</th><th>Sisa</th>
    </tr></thead><tbody>`;

    data.divisions.forEach((div, i) => {
      html += `<tr class="completed">
        <td>${div.dividend}</td>
        <td>2</td>
        <td>${div.quotient}</td>
        <td class="remainder">${div.remainder}</td>
      </tr>`;
    });

    html += `</tbody></table>`;

    // Arrow showing read direction
    html += `<div class="calc-expression">`;
    html += `Baca sisa dari bawah ke atas: `;
    const remainders = data.divisions.map(d => d.remainder);
    for (let i = remainders.length - 1; i >= 0; i--) {
      html += `<span class="highlight-term">${remainders[i]}</span>`;
    }
    html += ` = <span class="highlight-term">${data.result}</span>`;
    html += `</div>`;

    return html;
  }

  function renderBitGroups(data, isReverse) {
    let html = `<div class="bit-groups">`;

    data.groups.forEach((grp, i) => {
      const isCurrent = i === data.highlightIndex;
      const cls = isCurrent ? 'highlight' : '';

      html += `<div class="bit-group ${cls}">`;

      if (isReverse) {
        // Binary → Octal/Hex: source is binary group, result is digit
        html += `<div class="bit-group__source" style="letter-spacing:2px;">${grp.source}</div>`;
        html += `<div class="bit-group__arrow-down">&#8595;</div>`;
        if (tryItMode && isCurrent) {
          html += `<input type="text" class="try-input" data-answer="${grp.result}" placeholder="?" autocomplete="off" style="width:60px;">`;
          html += `<div class="try-feedback"></div>`;
        } else {
          html += `<div class="bit-group__result">${grp.result}</div>`;
        }
      } else {
        // Octal/Hex → Binary: source is digit, result is binary group
        html += `<div class="bit-group__source">${grp.source}</div>`;
        html += `<div class="bit-group__arrow-down">&#8595;</div>`;
        if (tryItMode && isCurrent) {
          html += `<input type="text" class="try-input" data-answer="${grp.result}" placeholder="?" autocomplete="off" style="width:80px;">`;
          html += `<div class="try-feedback"></div>`;
        } else {
          html += `<div class="bit-group__result">${grp.result}</div>`;
        }
      }

      html += `</div>`;
    });

    html += `</div>`;
    return html;
  }

  function renderCombine(data) {
    let html = `<div class="bit-groups">`;
    data.groups.forEach(grp => {
      html += `<div class="bit-group">
        <div class="bit-group__source">${grp.source}</div>
        <div class="bit-group__arrow-down">&#8595;</div>
        <div class="bit-group__result">${grp.result}</div>
      </div>`;
    });
    html += `</div>`;

    html += `<div class="calc-expression">
      Gabungan: <span class="highlight-term">${data.combined}</span>
      ${data.combined !== data.result ? ` = <span class="highlight-term">${data.result}</span>` : ''}
    </div>`;

    return html;
  }

  function renderPositional(data) {
    let html = `<div class="positional-table">`;

    data.positions.forEach((pos, i) => {
      const isCurrent = i === data.highlightIndex;
      const cls = isCurrent ? 'highlight' : '';

      html += `<div class="pos-cell ${cls}">
        <div class="pos-cell__bit">${pos.bit}</div>
        <div class="pos-cell__power">2<sup>${pos.position}</sup> = ${pos.powerValue}</div>`;

      if (tryItMode && isCurrent) {
        html += `<input type="text" class="try-input" data-answer="${pos.value}" placeholder="?" autocomplete="off" style="width:60px;">`;
        html += `<div class="try-feedback"></div>`;
      } else if (data.highlightIndex >= 0 && i <= data.highlightIndex) {
        html += `<div class="pos-cell__value">${pos.value}</div>`;
      } else if (data.highlightIndex === -1) {
        html += `<div class="pos-cell__value">?</div>`;
      } else {
        html += `<div class="pos-cell__value" style="opacity:0.3">?</div>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
    return html;
  }

  function renderCalculation(data) {
    let html = `<div class="positional-table">`;
    data.positions.forEach(pos => {
      html += `<div class="pos-cell">
        <div class="pos-cell__bit">${pos.bit}</div>
        <div class="pos-cell__power">2<sup>${pos.position}</sup> = ${pos.powerValue}</div>
        <div class="pos-cell__value">${pos.value}</div>
      </div>`;
    });
    html += `</div>`;

    // Show sum expression
    html += `<div class="calc-expression">`;
    const termStrings = data.positions.map(p => {
      if (p.value === 0) {
        return `<span class="zero-term">${p.bit}&#215;${p.powerValue}</span>`;
      }
      return `<span class="highlight-term">${p.bit}&#215;${p.powerValue}</span>`;
    });
    html += termStrings.join(`<span class="operator"> + </span>`);
    html += `<span class="operator"> = </span>`;

    if (tryItMode) {
      html += `<input type="text" class="try-input" data-answer="${data.result}" placeholder="?" autocomplete="off" style="width:80px;">`;
      html += `<div class="try-feedback"></div>`;
    } else {
      html += `<span class="highlight-term" style="font-size:1.2rem;font-weight:700;">${data.result}</span>`;
    }

    html += `</div>`;
    return html;
  }

  function renderFinalResult(step) {
    const baseNames = { '2': 'biner', '8': 'oktal', '10': 'desimal', '16': 'heksadesimal' };
    const baseSub = { '2': '\u2082', '8': '\u2088', '10': '\u2081\u2080', '16': '\u2081\u2086' };

    let html = `<div class="result-display">
      <div>
        <div class="result-display__label">Hasil Konversi</div>
        <div class="result-display__value">${step.result}<span class="result-display__subscript">${baseSub[step.toBase] || ''}</span></div>
      </div>
    </div>`;

    return html;
  }

  // ===== Try It Answer Checking =====
  function checkTryAnswer(input) {
    const answer = input.dataset.answer;
    const userVal = input.value.trim().toUpperCase();
    const feedback = input.parentElement.querySelector('.try-feedback') || input.nextElementSibling;

    if (userVal === '') return;

    if (userVal === answer.toString().toUpperCase()) {
      input.classList.remove('incorrect');
      input.classList.add('correct');
      input.disabled = true;
      if (feedback) {
        feedback.textContent = 'Benar!';
        feedback.className = 'try-feedback correct';
      }
    } else {
      input.classList.remove('correct');
      input.classList.add('incorrect');
      if (feedback) {
        feedback.textContent = `Coba lagi. Jawaban yang benar: ${answer}`;
        feedback.className = 'try-feedback incorrect';
      }
    }
  }

  // ===== Init =====
  function init() {
    initBinaryRain();
    selectConversion('dec-bin');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
