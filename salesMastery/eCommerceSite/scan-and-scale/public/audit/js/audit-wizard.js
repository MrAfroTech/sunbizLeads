(function () {
  const { QUESTIONS, markPurchased, hasPurchased, saveAnswers } = window.AuditLogic;

  const gateEl = document.getElementById('audit-gate');
  const wizardEl = document.getElementById('audit-wizard');
  const progressLabel = document.getElementById('audit-progress-label');
  const progressBar = document.getElementById('audit-progress-bar');
  const questionTitle = document.getElementById('audit-question-title');
  const questionBody = document.getElementById('audit-question-body');
  const nextBtn = document.getElementById('audit-next-btn');

  const answers = {};
  let step = 0;

  function checkAccess() {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      markPurchased(sessionId);
      history.replaceState(null, '', '/audit/start');
    }
    if (!hasPurchased()) {
      gateEl.hidden = false;
      wizardEl.hidden = true;
      return false;
    }
    gateEl.hidden = true;
    wizardEl.hidden = false;
    return true;
  }

  function currentQuestion() {
    return QUESTIONS[step];
  }

  function getValue(q) {
    if (q.type === 'multi') return answers[q.id] || [];
    return answers[q.id];
  }

  function isValid(q) {
    const val = getValue(q);
    if (q.type === 'multi') return Array.isArray(val) && val.length > 0;
    if (q.type === 'number' || q.type === 'currency') {
      const n = Number(val);
      if (!Number.isFinite(n)) return false;
      if (q.min != null && n < q.min) return false;
      if (q.max != null && n > q.max) return false;
      return true;
    }
    return Boolean(val);
  }

  function renderQuestion() {
    const q = currentQuestion();
    const total = QUESTIONS.length;
    progressLabel.textContent = 'Question ' + (step + 1) + ' of ' + total;
    progressBar.style.width = ((step + 1) / total) * 100 + '%';
    questionTitle.textContent = q.text;
    questionBody.innerHTML = '';

    if (q.type === 'single') {
      const wrap = document.createElement('div');
      wrap.className = 'audit-options';
      wrap.setAttribute('role', 'radiogroup');
      q.options.forEach(function (opt) {
        const label = document.createElement('label');
        label.className = 'audit-option' + (answers[q.id] === opt ? ' is-selected' : '');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = q.id;
        input.value = opt;
        input.checked = answers[q.id] === opt;
        input.addEventListener('change', function () {
          answers[q.id] = opt;
          renderQuestion();
        });
        label.appendChild(input);
        const span = document.createElement('span');
        span.textContent = opt;
        label.appendChild(span);
        wrap.appendChild(label);
      });
      questionBody.appendChild(wrap);
    } else if (q.type === 'multi') {
      if (!answers[q.id]) answers[q.id] = [];
      const wrap = document.createElement('div');
      wrap.className = 'audit-options';
      q.options.forEach(function (opt) {
        const label = document.createElement('label');
        const selected = answers[q.id].includes(opt);
        label.className = 'audit-option' + (selected ? ' is-selected' : '');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = opt;
        input.checked = selected;
        input.addEventListener('change', function () {
          if (input.checked) {
            if (!answers[q.id].includes(opt)) answers[q.id].push(opt);
          } else {
            answers[q.id] = answers[q.id].filter(function (v) { return v !== opt; });
          }
          renderQuestion();
        });
        label.appendChild(input);
        const span = document.createElement('span');
        span.textContent = opt;
        label.appendChild(span);
        wrap.appendChild(label);
      });
      questionBody.appendChild(wrap);
    } else {
      const field = document.createElement('div');
      field.className = 'audit-field';
      const input = document.createElement('input');
      input.type = 'number';
      input.step = q.type === 'currency' ? '0.01' : '1';
      input.min = q.min != null ? String(q.min) : '0';
      if (q.max != null) input.max = String(q.max);
      input.placeholder = q.placeholder || '';
      input.value = answers[q.id] != null ? answers[q.id] : '';
      input.addEventListener('input', function () {
        answers[q.id] = input.value;
        nextBtn.disabled = !isValid(q);
      });
      field.appendChild(input);
      questionBody.appendChild(field);
    }

    nextBtn.textContent = step === total - 1 ? 'See Results' : 'Next';
    nextBtn.disabled = !isValid(q);
  }

  nextBtn.addEventListener('click', function () {
    const q = currentQuestion();
    if (!isValid(q)) return;
    if (step < QUESTIONS.length - 1) {
      step += 1;
      renderQuestion();
      return;
    }
    saveAnswers(answers);
    window.location.href = '/audit/results';
  });

  if (checkAccess()) {
    renderQuestion();
  }
})();
