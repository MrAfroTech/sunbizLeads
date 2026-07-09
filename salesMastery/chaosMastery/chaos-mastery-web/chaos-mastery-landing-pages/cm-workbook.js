import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GUEST_TOKEN_KEY = 'cm_guest_token';

function localChapterKey(ch) {
  return `cm_workbook_local_${ch}`;
}

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
}

async function main() {
  const root = document.getElementById('cm-workbook-section');
  if (!root) return;
  const inner = root.querySelector('.cm-workbook-inner');
  const chapter = parseInt(root.getAttribute('data-chapter'), 10);
  const cfg = window.CM_WORKBOOK_CONFIG || {};

  if (!inner || Number.isNaN(chapter)) return;

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.warn('CM workbook: missing CM_WORKBOOK_CONFIG');
    root.classList.remove('cm-loading');
    root.removeAttribute('aria-busy');
    return;
  }

  const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });

  const manifestRes = await fetch('/cm-workbook-manifest.json');
  if (!manifestRes.ok) throw new Error('Workbook manifest failed to load');
  const manifest = await manifestRes.json();
  const meta = manifest[String(chapter)];
  if (!meta) throw new Error(`No workbook for chapter ${chapter}`);

  let guestToken = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!guestToken) {
    guestToken = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, guestToken);
  }

  const values = {};
  const fieldRefs = new Map();

  function readLocal() {
    try {
      const raw = localStorage.getItem(localChapterKey(chapter));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeLocalPartial(patch) {
    const cur = readLocal();
    Object.assign(cur, patch);
    localStorage.setItem(localChapterKey(chapter), JSON.stringify(cur));
  }

  async function loadRemote(session) {
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from('chaos_mastery_workbook')
        .select('field_id,field_value')
        .eq('chapter', chapter)
        .eq('user_id', session.user.id);
      if (error) throw error;
      return Object.fromEntries((data || []).map((r) => [r.field_id, r.field_value]));
    }
    const { data, error } = await supabase.rpc('cm_guest_workbook_select', {
      p_guest_token: guestToken,
      p_chapter: chapter,
    });
    if (error) throw error;
    return Object.fromEntries((data || []).map((r) => [r.field_id, r.field_value]));
  }

  function applyValuesToFields() {
    fieldRefs.forEach((el, fid) => {
      const v = values[fid];
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        el.checked = v === 'true';
      } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.value = v ?? '';
        autosize(el);
      }
    });
  }

  let session = (await supabase.auth.getSession()).data.session;
  let remote = {};
  try {
    remote = await loadRemote(session);
  } catch (e) {
    console.warn('CM workbook remote load:', e);
  }

  Object.assign(values, readLocal(), remote);

  inner.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'cm-workbook-header';
  header.innerHTML = '<div class="label">Your Workbook</div><div class="section-head"></div>';
  header.querySelector('.section-head').textContent = meta.sectionTitle;

  const banner = document.createElement('div');
  banner.className = 'cm-auth-banner';

  const saveInd = document.createElement('div');
  saveInd.className = 'cm-save-indicator';

  inner.append(header, banner, saveInd);

  if (meta.introHtml) {
    const intro = document.createElement('div');
    intro.className = 'cm-intro-html';
    intro.innerHTML = meta.introHtml;
    inner.append(intro);
  }

  const pending = new Map();
  let saveTimer;

  function schedulePersist(fieldId, rawVal) {
    const field_value = rawVal == null ? '' : String(rawVal);
    pending.set(fieldId, field_value);
    saveInd.textContent = 'Saving...';
    saveInd.classList.remove('cm-saved');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushPersist, 800);
  }

  async function flushPersist() {
    if (pending.size === 0) return;
    const batch = [...pending.entries()];
    pending.clear();
    saveInd.textContent = 'Saving...';
    saveInd.classList.remove('cm-saved');
    try {
      const sess = (await supabase.auth.getSession()).data.session;
      if (sess?.user?.id) {
        const rows = batch.map(([field_id, field_value]) => ({
          user_id: sess.user.id,
          guest_token: null,
          chapter,
          field_id,
          field_value,
        }));
        const { error } = await supabase.from('chaos_mastery_workbook').upsert(rows, {
          onConflict: 'owner_key,chapter,field_id',
        });
        if (error) throw error;
      } else {
        for (const [field_id, field_value] of batch) {
          const { error } = await supabase.rpc('cm_guest_workbook_upsert', {
            p_guest_token: guestToken,
            p_chapter: chapter,
            p_field_id: field_id,
            p_field_value,
          });
          if (error) throw error;
        }
      }
      saveInd.textContent = 'Saved';
      saveInd.classList.add('cm-saved');
    } catch (e) {
      console.error(e);
      saveInd.textContent = 'Could not save — check connection';
      saveInd.classList.remove('cm-saved');
    }
  }

  function bindTextarea(ta, fieldId) {
    ta.addEventListener('input', () => {
      values[fieldId] = ta.value;
      writeLocalPartial({ [fieldId]: ta.value });
      autosize(ta);
      schedulePersist(fieldId, ta.value);
    });
  }

  function renderBlocks(blocks, container) {
    for (const b of blocks) {
      container.appendChild(renderBlock(b));
    }
  }

  function renderBlock(b) {
    if (b.type === 'html') {
      const d = document.createElement('div');
      d.className = 'cm-html-block';
      d.innerHTML = b.html;
      return d;
    }

    if (b.type === 'checkbox') {
      const row = document.createElement('div');
      row.className = 'cm-chk-row';
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.dataset.fieldId = b.fieldId;
      inp.checked = values[b.fieldId] === 'true';
      const span = document.createElement('span');
      span.className = 'cm-chk-text';
      span.innerHTML = b.labelHtml;
      row.append(inp, span);
      inp.addEventListener('change', () => {
        values[b.fieldId] = inp.checked ? 'true' : 'false';
        writeLocalPartial({ [b.fieldId]: values[b.fieldId] });
        schedulePersist(b.fieldId, values[b.fieldId]);
      });
      fieldRefs.set(b.fieldId, inp);
      return row;
    }

    if (b.type === 'grid') {
      const g = document.createElement('div');
      g.className = 'cm-grid';
      for (const colBlocks of b.columns) {
        const col = document.createElement('div');
        col.className = 'cm-grid-col';
        renderBlocks(colBlocks, col);
        g.appendChild(col);
      }
      return g;
    }

    if (b.type === 'textarea') {
      const variant = b.variant || 'inline-lines';

      if (variant === 'reflection-card') {
        const wrap = document.createElement('div');
        wrap.className = 'cm-reflection-card cm-edge-gold cm-field';
        const tag = document.createElement('div');
        tag.className = 'cm-reflection-tag';
        tag.textContent = b.label || '';
        const q = document.createElement('div');
        q.className = 'cm-reflection-q';
        q.textContent = b.question || '';
        const ta = document.createElement('textarea');
        ta.className = 'cm-input';
        ta.rows = 4;
        ta.value = values[b.fieldId] || '';
        bindTextarea(ta, b.fieldId);
        wrap.append(tag, q, ta);
        fieldRefs.set(b.fieldId, ta);
        autosize(ta);
        return wrap;
      }

      const wrap = document.createElement('div');
      if (variant === 'fill-card') wrap.className = 'cm-fill-card cm-field';
      else if (variant === 'fill-card-dark') wrap.className = 'cm-fill-card-dark cm-field';
      else {
        wrap.className = 'cm-field';
        if (variant === 'inline-dark') wrap.classList.add('cm-inline-dark');
      }

      if (b.label) {
        const lab = document.createElement('div');
        lab.className = 'cm-field-label';
        lab.textContent = b.label;
        wrap.appendChild(lab);
      }
      if (b.hint) {
        const h = document.createElement('div');
        h.className = 'cm-field-hint';
        h.textContent = b.hint;
        wrap.appendChild(h);
      }

      const ta = document.createElement('textarea');
      ta.className = 'cm-input';
      ta.rows = variant === 'fill-card' || variant === 'fill-card-dark' ? 5 : 3;
      ta.value = values[b.fieldId] || '';
      bindTextarea(ta, b.fieldId);
      wrap.appendChild(ta);
      fieldRefs.set(b.fieldId, ta);
      autosize(ta);
      return wrap;
    }

    const unk = document.createElement('div');
    unk.className = 'cm-html-block';
    unk.textContent = '[unsupported workbook block]';
    return unk;
  }

  const bodyWrap = document.createElement('div');
  renderBlocks(meta.blocks, bodyWrap);
  inner.appendChild(bodyWrap);

  const actions = document.createElement('div');
  actions.className = 'cm-workbook-actions';
  const dlBtn = document.createElement('button');
  dlBtn.type = 'button';
  dlBtn.className = 'cm-btn-secondary';
  dlBtn.textContent = 'Download My Answers';
  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.className = 'cm-btn-secondary';
  printBtn.textContent = 'Print';
  actions.append(dlBtn, printBtn);
  inner.appendChild(actions);

  function walkExport(blocks, lines, indent) {
    for (const b of blocks) {
      if (b.type === 'html') continue;
      if (b.type === 'grid') {
        for (const col of b.columns) walkExport(col, lines, indent);
        continue;
      }
      if (b.type === 'checkbox') {
        lines.push(`${indent}${stripHtml(b.labelHtml)}`);
        lines.push(`${indent}${values[b.fieldId] === 'true' ? '[x]' : '[ ]'}`);
        lines.push('');
        continue;
      }
      if (b.type === 'textarea') {
        let head = b.label || '';
        if (b.question) head = `${head}: ${b.question}`;
        lines.push(`${indent}${head}`);
        lines.push(String(values[b.fieldId] || '').trim() || '(no answer yet)');
        lines.push('');
      }
    }
  }

  dlBtn.addEventListener('click', () => {
    const lines = [
      `Chaos Mastery — Chapter ${chapter} workbook`,
      '',
      meta.sectionTitle,
      '',
    ];
    walkExport(meta.blocks, lines, '');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chaos-mastery-ch${chapter}-workbook.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  printBtn.addEventListener('click', () => window.print());

  function renderBanner(sess) {
    banner.innerHTML = '';
    banner.classList.toggle('cm-logged-in', Boolean(sess?.user));
    if (sess?.user) {
      banner.innerHTML =
        '<div class="cm-auth-text"><span class="cm-teal-check" aria-hidden="true">✓</span>Progress saved to your account.</div>';
      return;
    }
    const txt = document.createElement('div');
    txt.className = 'cm-auth-text';
    txt.textContent =
      "You're working as a guest. Create a free account to save your progress across devices.";
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'cm-auth-actions';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cm-btn-account';
    btn.textContent = 'Sign in / Create account';
    btn.addEventListener('click', async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.href.split('#')[0] },
        });
        if (error) throw error;
      } catch {
        window.open(cfg.accountUrl || 'https://chaosmastery.seamlessly.us/checkout.html', '_blank', 'noopener,noreferrer');
      }
    });
    actionsWrap.appendChild(btn);
    banner.append(txt, actionsWrap);
  }

  renderBanner(session);

  supabase.auth.onAuthStateChange(async (event, sess) => {
    session = sess;
    renderBanner(sess);
    if (event === 'SIGNED_IN' && sess?.user) {
      try {
        remote = await loadRemote(sess);
        Object.assign(values, remote);
        applyValuesToFields();
      } catch (e) {
        console.warn(e);
      }
    }
  });

  root.classList.remove('cm-loading');
  root.removeAttribute('aria-busy');
}

main().catch((err) => {
  console.error(err);
  const root = document.getElementById('cm-workbook-section');
  if (root) {
    root.classList.remove('cm-loading');
    root.removeAttribute('aria-busy');
  }
});
