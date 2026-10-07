(function(){
  const SUPPORTED = ['uk','en'];

  function detect(){
    const saved = localStorage.getItem('lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    const n = (navigator.language || 'uk').toLowerCase();
    return n.startsWith('uk') ? 'uk' : 'en';
  }

  const DICTS = {
    uk: {
      title: 'СЛОВО ДНЯ',
      write_word: 'Напишіть своє слово',
      points: 'БАЛИ',
      hint_button: 'ВІДКРИТИ ЛІТЕРУ',
      toast_correct: 'Вітаю! Ви відгадали слово!',
      toast_not_found: 'Цього слова, на жаль, немає в базі',
      toast_wrong_pattern: 'Не відповідає шаблону',
      toast_nice_try: 'Гарна спроба',
      points_word: 'балів',
      lang_btn_label: 'УК',
      share_total: "Загалом",

      win_title       : 'Вітаю!',
      win_sub         : 'Ви вгадали слово дня',
      win_score_label : 'Бали сьогодні',
      win_share       : 'Поділитися',
      win_close       : 'Закрити',
      win_shared_text : 'А я вже знаю слово дня! А ти?',
      toast_copied    : 'Скопійовано в буфер обміну',

      // about
      about_title: 'Вгадай слово дня!',
      about_p1: 'Відкриті лише перша й остання літери.',
      about_p2: 'Відкривай нові слова за шаблоном і заробляй бали — 10 балів за кожну літеру.',
      about_p3: 'Використовуй бали для підказок, щоб відкривати ще літери у слові дня:',
      about_li1: '1-ша підказка — 50 балів',
      about_li2: '2-га — 75 балів',
      about_li3: '3-я — 100 балів',
      about_li4: 'Далі — ще дорожче.',
      about_p4: 'Твоя мета — відгадати слово дня. Заходь щодня — на тебе чекає нове слово і новий виклик!',
      about_back: '← Назад до гри',

      // stats 
      stats_title: 'Статистика',
      stats_games: 'Всього ігор',
      stats_wins: '% перемог',
      stats_streak: 'Поточна серія',
      stats_best: 'Найкраща серія',
      stats_best_score: 'Найбільше балів',
      stats_back: '← Назад до гри'

    },

    en: {
      title: 'WORD OF THE DAY',
      write_word: 'Type your word',
      points: 'SCORE',
      hint_button: 'REVEAL LETTER',
      toast_correct: 'Congrats! You guessed the word!',
      toast_not_found: 'This word was not found',
      toast_wrong_pattern: 'Does not match the pattern',
      toast_nice_try: 'Nice try',
      points_word: 'points',
      lang_btn_label: 'EN',
      share_total: "Total",

      win_title       : 'Congrats!',
      win_sub         : 'You guessed the word of the day',
      win_score_label : 'Today’s score',
      win_share       : 'Share',
      win_close       : 'Close',
      win_shared_text : 'I already know today’s word! Do you?',
      toast_copied    : 'Copied to clipboard',

      about_title: 'Guess the word of the day!',
      about_p1: 'Only the first and last letters are visible.',
      about_p2: 'Find new words matching the pattern and earn points — 10 points per letter.',
      about_p3: 'Use points for hints to reveal more letters in the daily word:',
      about_li1: '1st hint — 50 points',
      about_li2: '2nd — 75 points',
      about_li3: '3rd — 100 points',
      about_li4: 'Later — more expensive.',
      about_p4: 'Your goal is to guess the daily word. Come back every day — a new word and a new challenge await!',
      about_back: '← Back to the game',

      stats_title: 'Stats',
      stats_games: 'Games played',
      stats_wins: 'Win %',
      stats_streak: 'Current streak',
      stats_best: 'Best streak',
      stats_best_score: 'Best score',
      stats_back: '← Back to game'
    }
  };

  let current = detect();

  function t(key){ return (DICTS[current] && DICTS[current][key]) || key; }
  function getLang(){ return current; }
  function setLang(lang){
    if (!SUPPORTED.includes(lang)) return;
    current = lang;
    localStorage.setItem('lang', lang);
  
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = t('lang_btn_label');
  
    const title = document.getElementById('appTitle');
    if (title) title.textContent = t('title');
  }

  function applyI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
  }

  window.I18N = { t, getLang, setLang, applyI18n, SUPPORTED };
})();