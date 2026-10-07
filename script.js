'use strict';

/* ---------- глобальні множини для швидких перевірок ---------- */
let WORDS_UP = new Set(), WORDS_LO = new Set(), DICT_UP = new Set(), DICT_LO = new Set();

function rebuildSets(lang){
  const { WORDS, DICT } = getWordSets(lang);
  WORDS_UP = new Set(WORDS.map(w => String(w).toUpperCase()));
  WORDS_LO = new Set(WORDS.map(w => String(w).toLowerCase()));
  DICT_UP = new Set(DICT.map(w => String(w).toUpperCase()));
  DICT_LO = new Set(DICT.map(w => String(w).toLowerCase()));
}

function epochDayUTC(){
  const now = new Date();
  const ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor(ms / 86400000);
}


function lcgIndex(epochDay, wordsCount){
  return ((epochDay * 1103515245 + 12345) & 0x7fffffff) % wordsCount;
}


function getWordSets(lang){

  return { WORDS: (window.WORDS_EN || []), DICT: (window.DICT_EN || []) };
}

/* ---------- ключ для ЗБЕРЕЖЕНЬ з урахуванням МОВИ і ДНЯ ---------- */
function KDaily(s, lang){
  const day = epochDayUTC();
  return `${s}_${lang}_d${day}`;
}

/* ---------- стан під конкретну мову (добові ключі) ---------- */
function makeState(lang){
  const { WORDS } = getWordSets(lang);
  rebuildSets(lang);

  const epoch = epochDayUTC();
  const idx = lcgIndex(epoch, WORDS.length || 1);
  const today = (WORDS[idx] || 'apple').toUpperCase();

  // базові (довготривалі) ключі
  const K = (s) => `${s}_${lang}`;
  // добові (для score/letters/guesses)
  const KD = (s) => KDaily(s, lang);

  return {
    lang,
    keys: { K, KD },
    dayEpoch: epoch,
    secretWord: today,
    lettersToShow: Number(localStorage.getItem(KD('lettersToShow'))) || 0,
    guesses: JSON.parse(localStorage.getItem(KD('guesses')) || '[]'),
    score: Number(localStorage.getItem(KD('score'))) || 0,
  };
}

/* ---------- глобальний стан ---------- */
let state = makeState(I18N.getLang());

/* ---------- утиліти ---------- */
function inWordsOrDict(str){
  return (
    WORDS_UP.has(str) ||
    WORDS_LO.has(str) ||
    DICT_UP.has(str) ||
    DICT_LO.has(str)
  );
}

function createPattern(word, lettersToShow) {
  if (!word || word.length < 2) return '[' + (word || '') + ']';
  let s = word[0];
  for (let i = 1; i < word.length - 1; i++) {
    s += (i <= lettersToShow) ? word[i] : ' ';
  }
  return '[' + s + word[word.length - 1] + ']';
}

function firstLastMatch(a, b) {
  if (!a || !b) return false;
  return a[0] === b[0] && a[a.length - 1] === b[b.length - 1];
}

function nextHintCost() {
  return 50 + 25 * state.lettersToShow;
}

/* ---------- рендер ---------- */
function renderPattern() {
  const el = document.getElementById('pattern');
  if (!el) return;
  const fullOpen = (state.lettersToShow + 2) >= state.secretWord.length;
  el.textContent = fullOpen ? state.secretWord : createPattern(state.secretWord, state.lettersToShow);
}

function renderGuesses(){
  const list = document.getElementById('words-list');
  if (!list) return;
  list.innerHTML = '';
  // показувати нові зверху
  for (let i = state.guesses.length - 1; i >= 0; i--){
    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = state.guesses[i];
    list.appendChild(item);
  }
}

function addWordToTop(text) {
  const list = document.getElementById('words-list');
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'item';
  item.textContent = text;
  list.prepend(item);
}

function renderInputPlaceholder(){
  const input = document.getElementById('word-input');
  if (input) input.placeholder = I18N.t('write_word');
}

function renderScore(){
  const s = document.getElementById('score');
  if (s) s.textContent = I18N.t('points') + ' = ' + state.score;
}

function renderHint(){
  const btn = document.getElementById('hintBtn');
  const card = document.querySelector('.hint-card');
  if (!btn || !card) return;

  const cost = nextHintCost();
  const canMore = state.lettersToShow < Math.max(0, state.secretWord.length - 2);
  const ok = state.score >= cost && canMore;

  btn.textContent = I18N.t('hint_button');
  btn.disabled = !ok;
  card.classList.toggle('enabled', ok);
}

// (опціонально) заголовок у смузі
function renderTitle(){
  const t = document.getElementById('appTitle');
  if (t) t.textContent = I18N.t('title');
}

function renderLangToggleLabel(){
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  const cur = I18N.getLang();
  btn.textContent = (cur === 'uk') ? 'ENG' : 'УКР';
}

/* ---------- збереження ДЛЯ СЬОГОДНІ (добові ключі) ---------- */
function persistState(){
  localStorage.setItem(state.keys.KD('lettersToShow'), String(state.lettersToShow));
  localStorage.setItem(state.keys.KD('score'), String(state.score));
  localStorage.setItem(state.keys.KD('guesses'), JSON.stringify(state.guesses));
}

/* ---------- Toast API ---------- */
function ensureToastHost(){
  let host = document.getElementById('toast-host');
  if (!host){
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}
function showToast(message, type = 'info', ms = 3200){
  const host = ensureToastHost();
  const el = document.createElement('div');
  el.className = 'toast';
  if (type === 'success') el.classList.add('toast--success');
  else if (type === 'warn') el.classList.add('toast--warn');
  else if (type === 'error') el.classList.add('toast--error');

  const icon = document.createElement('div');
  icon.className = 'toast__icon';
  icon.textContent = (type === 'success' ? '✓' : type === 'warn' ? '!' : type === 'error' ? '!' : 'i');

  const msg = document.createElement('div');
  msg.className = 'toast__msg';
  msg.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast__close';
  close.setAttribute('aria-label', 'Закрити');
  close.textContent = '✕';
  close.addEventListener('click', () => removeToast(el));

  el.append(icon, msg, close);
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  if (ms > 0) el._timer = setTimeout(() => removeToast(el), ms);
}
function removeToast(el){
  if (!el) return;
  clearTimeout(el._timer);
  el.classList.remove('visible');
  setTimeout(() => el.remove(), 250);
}
const toast = {
  ok : (m, ms)=> showToast(m, 'success', ms),
  warn: (m, ms)=> showToast(m, 'warn', ms),
  err : (m, ms)=> showToast(m, 'error', ms),
  info: (m, ms)=> showToast(m, 'info', ms),
};

/* ---------- статистика ---------- */
// читання/збереження з новим полем lastPlayEpoch (перша активність у день)
function loadStats(lang){
  try{
    const st = JSON.parse(localStorage.getItem(`stats_${lang}`)) || {};
    return {
      games: st.games ?? 0,
      wins: st.wins ?? 0,
      streak: st.streak ?? 0,
      bestStreak: st.bestStreak ?? 0,
      bestScore: st.bestScore ?? 0,
      lastWinEpoch: st.lastWinEpoch ?? null,
      lastSeenEpoch:st.lastSeenEpoch?? null,
      lastPlayEpoch:st.lastPlayEpoch?? null,
    };
  }catch(_){
    return {
      games:0, wins:0, streak:0, bestStreak:0, bestScore:0,
      lastWinEpoch:null, lastSeenEpoch:null, lastPlayEpoch:null
    };
  }
}
function saveStats(lang, st){
  localStorage.setItem(`stats_${lang}`, JSON.stringify(st));
}

// викликати при кожному завантаженні/зміні мови (скидає серію, якщо вчора не виграли)
function statsDailyTick(lang){
  const today = epochDayUTC();
  const st = loadStats(lang);
  if (st.lastSeenEpoch != null && today - st.lastSeenEpoch >= 1){
    if (st.lastWinEpoch !== (today - 1)){ // якщо вчора не було перемоги — серія обривається
      st.streak = 0;
    }
  }
  st.lastSeenEpoch = today;
  saveStats(lang, st);
}

// перша активність за сьогодні (ввід слова або підказка) — рахуємо "всього ігор"
function statsOnFirstActivity(lang){
  const today = epochDayUTC();
  const st = loadStats(lang);
  if (st.lastPlayEpoch !== today){
    st.games += 1;
    st.lastPlayEpoch = today;
    saveStats(lang, st);
  }
}

// перемога: максимум одна на день; серія/перемоги ростуть лише при першій перемозі сьогодні
function statsOnWin(lang, score){
  const today = epochDayUTC();
  const st = loadStats(lang);

  if (st.lastWinEpoch !== today){
    st.wins += 1;
    st.streak += 1;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
  }
  st.bestScore = Math.max(st.bestScore, score);
  st.lastWinEpoch = today;
  st.lastPlayEpoch = today; // точно були в грі
  st.lastSeenEpoch = today;

  saveStats(lang, st);
}

/* ---------- логіка вводу ---------- */
function onSubmitWord(raw) {
  const upper = raw.trim().toUpperCase();
  const lower = raw.trim().toLowerCase();
  if (!upper) return;

  // рахуємо день як “зіграний”, якщо це перша активність
  statsOnFirstActivity(state.lang);

  // 1) Вгадали слово дня
  if (upper === state.secretWord) {
    state.lettersToShow = Math.max(0, state.secretWord.length - 2);
    renderPattern(); // показати повне слово
    //toast.ok(I18N.t('toast_correct'));

    state.score += 1000;
    renderScore();
    state.lettersToShow = state.secretWord.length - 2;
    renderPattern();
    renderHint();
    persistState();

    statsOnWin(state.lang, state.score);
    openWinModal(state.secretWord);
    return;
  }

  // 2) Є у словниках?
  const inDb = inWordsOrDict(upper) || inWordsOrDict(lower);
  if (!inDb) {
    toast.err(I18N.t('toast_not_found'));
    return;
  }

  // 3) Відповідає шаблону?
  if (!firstLastMatch(upper, state.secretWord)) {
    toast.warn(I18N.t('toast_wrong_pattern'));
    return;
  }

  // 4) Уникати дублікатів
  if (state.guesses.includes(upper)) return;

  // 5) Додаємо слово і бали

  state.guesses.push(upper);
  addWordToTop(upper);
  state.score += upper.length * 10;
  renderScore();
  renderHint();
  persistState();
  statsEnsureBestScore(state.lang, state.score);
  toast.info(I18N.t('toast_nice_try') + ' +' + (upper.length * 10 ) + ' ' + I18N.t('points_word'));

}

/* ---------- підказка ---------- */
function revealNextLetter() {
  const cost = nextHintCost();
  const maxInner = Math.max(0, state.secretWord.length - 2); 
  const canMore = state.lettersToShow < maxInner;
  if (!canMore || state.score < cost) return;

  const was = state.lettersToShow; 

  state.score -= cost;
  state.lettersToShow = Math.min(was + 1, maxInner);

  renderPattern();
  renderScore();
  renderHint();
  persistState();

  
  const becameFull = (was < maxInner) && (state.lettersToShow >= maxInner);
  if (becameFull) {
  
    state.score += 1000;
    renderScore();
    persistState();

    openWinModal(state.secretWord);
    statsOnWin(state.lang, state.score);
  }
}

function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
}

function dismissKeyboard(input){
  try{
    input?.blur();
    if (isIOS()){
      // маленький iOS-хак: на мить робимо readOnly, щоб гарантовано сховалась клавіатура
      const prev = input.readOnly;
      input.readOnly = true;
      setTimeout(()=>{ input.readOnly = prev; }, 50);
      // прибираємо можливий стрибок сторінки
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
  }catch(_){}
}

function ensureTodayState(){
  const today = epochDayUTC();
  if (state.dayEpoch !== today){
    state.dayEpoch = today;
    state.lettersToShow = 0;
    state.guesses = [];
    state.score = 0;

    // старі добові ключі з минулого дня залишаться в LS, але це не заважає
    persistState();
    renderPattern();
    renderScore();
    renderHint();
    const list = document.getElementById('words-list');
    if (list) list.innerHTML = '';
  }
}

/* ---------- перемикання мови ---------- */
function applyLang(lang){
  I18N.setLang(lang); 
  state = makeState(lang); 
  ensureTodayState(); 

  renderPattern();
  renderScore();
  renderHint();
  renderGuesses();
  renderInputPlaceholder();
  renderTitle();
  renderLangToggleLabel();

  persistState();
  statsDailyTick(lang);
  statsEnsureBestScore(state.lang, state.score);

  const els = document.querySelectorAll('[data-i18n]');
  els.forEach(el => {
  const key = el.getAttribute('data-i18n');
  el.textContent = I18N.t(key);
  });
}

function statsEnsureBestScore(lang, score){
  const st = loadStats(lang);
  if (score > st.bestScore){
    st.bestScore = score;
    saveStats(lang, st);
  }
}


function formatInt(n){
  try {
    return Number(n||0).toLocaleString('uk-UA').replace(/\u00A0/g,' ');
  } catch { return String(n||0); }
}

function buildAttemptsShareText(guesses, secretWord, totalScore){
  const nums = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
  const lines = [];

  for (let i = 0; i < guesses.length; i++){
    const w = guesses[i]; 
    const label = nums[i] || (String(i+1).padStart(2,'0') + ')');
    const bar = (w && w.length > 0) ? '░'.repeat(w.length) : '░░░';
    lines.push(`${label} ${bar}`);
  }

  const totalLine = `${I18N.t('share_total')}: ${totalScore} ${I18N.t('points_word')}`;
  return (lines.join('\n') + '\n\n' + totalLine).trim();
}

function openWinModal(word){
  const m = document.getElementById('winModal');
  if (!m) return;

  const tt = document.getElementById('winTitle'); tt && (tt.textContent = I18N.t('win_title'));
  const ss = document.getElementById('winSub'); ss && (ss.textContent = I18N.t('win_sub'));
  const sl = document.getElementById('winScoreLabel'); sl && (sl.textContent = I18N.t('win_score_label'));
  const ww = document.getElementById('winWord'); ww && (ww.textContent = `[${word}]`);
  const sv = document.getElementById('winScore'); sv && (sv.textContent = String(state.score));

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  m.hidden = false;
  m.setAttribute('aria-hidden', 'false');

  const close = () => {
    m.hidden = true;
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = prevOverflow || '';
  };
  m.querySelectorAll('[data-close]').forEach(btn=>{
    btn.addEventListener('click', close, { once:true });
  });

  const shareBtn = document.getElementById('winShareBtn');
  if (shareBtn){
    shareBtn.textContent = I18N.t('win_share');

  
    const attemptsText = buildAttemptsShareText(state.guesses, state.secretWord, state.score);

    shareBtn.onclick = async () => {
      const isFile = location.protocol === 'file:';
      const url = isFile ? '' : location.href;

      if (navigator.share && !isFile) {
        try {
          if (isIOS()) {
            
            await navigator.share({ text: `${attemptsText}${url ? '\n' + url : ''}`.trim() });
          } else {
            await navigator.share({ title: I18N.t('title'), text: attemptsText, url });
          }
          return;
        } catch {}
      }

     
      try {
        await navigator.clipboard.writeText(`${attemptsText}${url ? ' ' + url : ''}`.trim());
        toast.ok(I18N.t('toast_copied'));
      } catch {
        window.prompt('', `${attemptsText}${url ? ' ' + url : ''}`.trim());
      }
    };
  }
}

function shareTextSmart(text, url){
  const isFile = location.protocol === 'file:';
  const safeURL = isFile ? '' : (url || location.href);
  if (navigator.share && !isFile){
    if (isIOS()){
      return navigator.share({ text: `${text}${safeURL ? '\n' + safeURL : ''}`.trim() });
    }else{
      return navigator.share({ title: I18N.t('title'), text, url: safeURL || undefined });
    }
  }

  return navigator.clipboard.writeText(`${text}${safeURL ? ' ' + safeURL : ''}`.trim())
    .then(()=> toast.ok(I18N.t('toast_copied')))
    .catch(()=> prompt('', `${text}${safeURL ? ' ' + safeURL : ''}`.trim()));
}

/* ---------- init ---------- */
function init(){

  const form = document.getElementById('word-form');
  const input = document.getElementById('word-input');
  const hint = document.getElementById('hintBtn');
  const langBtn = document.getElementById('langToggle');

  const handle = () => {
    const val = (input && input.value || '').trim();
    if (!val) return;

    onSubmitWord(val);
    if (input) {
      input.value = '';
    }
  };


  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handle();
    });
  }


  if (hint) {
    hint.addEventListener('click', () => {
      revealNextLetter();
    });
  }

 
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const next = I18N.getLang() === 'uk' ? 'en' : 'uk';
      applyLang(next);
    });
  }


  statsDailyTick(state.lang);
  applyLang(I18N.getLang());
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();