/* ==========================================================================
   STUDYHUB — APPLICATION SCRIPT
   Organised into small, focused modules:
     1. Theme (light/dark)
     2. Hero (greeting, date, quote)
     3. To-Do
     4. Notes
     5. Timetable
     6. Scroll reveal
   Each module reads/writes its own slice of localStorage so state survives
   a page refresh, and each is self-contained so it can be reused elsewhere.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHero();
  initTodo();
  initNotes();
  initTimetable();
  initScrollReveal();

  // Lucide renders icons from <i data-lucide="..."> tags. Call once on load;
  // each module also re-calls this after injecting new markup dynamically.
  if (window.lucide) window.lucide.createIcons();
});

/* --------------------------------------------------------------------------
   1. THEME — light / dark, persisted, respects prior choice on reload
-------------------------------------------------------------------------- */
function initTheme() {
  const STORAGE_KEY = 'studyhub-theme';
  const toggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  // Fall back to the visitor's OS preference if they've never chosen one.
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  applyTheme(initialTheme);

  toggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  });

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      toggle.setAttribute('aria-pressed', 'true');
    } else {
      root.removeAttribute('data-theme');
      toggle.setAttribute('aria-pressed', 'false');
    }
  }
}

/* --------------------------------------------------------------------------
   2. HERO — time-aware greeting, formatted date, a rotating quote
-------------------------------------------------------------------------- */
function initHero() {
  setGreeting();
  setDate();
  setQuote();
}

function setGreeting() {
  const el = document.getElementById('greeting');
  const hour = new Date().getHours();

  let timeOfDay = 'evening';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';

  // A short, rotating set of address terms keeps the greeting from feeling
  // like static copy pasted into a template.
  const addressTerms = ['Scholar', 'Reader', 'Friend'];
  const term = addressTerms[new Date().getDate() % addressTerms.length];

  el.textContent = `Good ${timeOfDay}, ${term}`;
}

function setDate() {
  const el = document.getElementById('currentDate');
  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  el.textContent = formatted;
}

function setQuote() {
  const quotes = [
    { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
    { text: 'Quality means doing it right when no one is looking.', author: 'Henry Ford' },
    { text: 'What we learn with pleasure we never forget.', author: 'Alfred Mercier' },
    { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
    { text: 'Focus is a matter of deciding what things you\u2019re not going to do.', author: 'John Carmack' },
  ];

  // Pick deterministically by day-of-year so the quote feels considered
  // rather than jarring on every refresh, but still changes daily.
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const quote = quotes[dayOfYear % quotes.length];

  document.getElementById('dailyQuote').textContent = quote.text;
  document.getElementById('dailyQuoteAuthor').textContent = `\u2014 ${quote.author}`;
}

/* --------------------------------------------------------------------------
   3. TO-DO — add, toggle complete, remove; persisted to localStorage
-------------------------------------------------------------------------- */
function initTodo() {
  const STORAGE_KEY = 'studyhub-todos';
  const form = document.getElementById('todoForm');
  const input = document.getElementById('todoInput');
  const list = document.getElementById('todoList');
  const emptyState = document.getElementById('todoEmpty');

  let todos = loadTodos();
  render();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({ id: crypto.randomUUID(), text, done: false });
    input.value = '';
    saveTodos();
    render();
  });

  function loadTodos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function toggleTodo(id) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    saveTodos();
    render();
  }

  function removeTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    render();
  }

  function render() {
    list.innerHTML = '';

    todos.forEach((todo) => {
      const item = document.createElement('li');
      item.className = `todo__item${todo.done ? ' todo__item--done' : ''}`;

      const checkbox = document.createElement('button');
      checkbox.type = 'button';
      checkbox.className = 'todo__checkbox';
      checkbox.setAttribute('aria-label', todo.done ? 'Mark as not done' : 'Mark as done');
      checkbox.innerHTML = '<i data-lucide="check"></i>';
      checkbox.addEventListener('click', () => toggleTodo(todo.id));

      const text = document.createElement('span');
      text.className = 'todo__text';
      text.textContent = todo.text;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'todo__remove';
      remove.setAttribute('aria-label', 'Remove task');
      remove.innerHTML = '<i data-lucide="x"></i>';
      remove.addEventListener('click', () => removeTodo(todo.id));

      item.append(checkbox, text, remove);
      list.appendChild(item);
    });

    emptyState.classList.toggle('todo__empty--visible', todos.length === 0);

    if (window.lucide) window.lucide.createIcons();
  }
}

/* --------------------------------------------------------------------------
   4. NOTES — add, remove; persisted to localStorage
-------------------------------------------------------------------------- */
function initNotes() {
  const STORAGE_KEY = 'studyhub-notes';
  const form = document.getElementById('notesForm');
  const titleInput = document.getElementById('noteTitleInput');
  const bodyInput = document.getElementById('noteBodyInput');
  const grid = document.getElementById('notesGrid');
  const emptyState = document.getElementById('notesEmpty');

  let notes = loadNotes();
  render();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title && !body) return;

    notes.unshift({
      id: crypto.randomUUID(),
      title: title || 'Untitled',
      body,
    });

    titleInput.value = '';
    bodyInput.value = '';
    saveNotes();
    render();
  });

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  function removeNote(id) {
    notes = notes.filter((note) => note.id !== id);
    saveNotes();
    render();
  }

  function render() {
    grid.innerHTML = '';

    notes.forEach((note) => {
      const card = document.createElement('article');
      card.className = 'note-card';

      const title = document.createElement('h3');
      title.className = 'note-card__title';
      title.textContent = note.title;

      const body = document.createElement('p');
      body.className = 'note-card__body';
      body.textContent = note.body;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'note-card__remove';
      remove.setAttribute('aria-label', 'Delete note');
      remove.innerHTML = '<i data-lucide="trash-2"></i>';
      remove.addEventListener('click', () => removeNote(note.id));

      card.append(title, body, remove);
      grid.appendChild(card);
    });

    emptyState.classList.toggle('notes__empty--visible', notes.length === 0);

    if (window.lucide) window.lucide.createIcons();
  }
}

/* --------------------------------------------------------------------------
   5. TIMETABLE — data-driven weekly grid
   Edit the `schedule` object below to customise entries per day.
-------------------------------------------------------------------------- */
function initTimetable() {
  const grid = document.getElementById('timetableGrid');

  const schedule = {
    Mon: [{ time: '09:00', title: 'Mathematics' }, { time: '14:00', title: 'Physics Lab' }],
    Tue: [{ time: '10:00', title: 'Literature Seminar' }],
    Wed: [{ time: '09:00', title: 'Mathematics' }, { time: '13:00', title: 'History' }],
    Thu: [{ time: '11:00', title: 'Chemistry' }, { time: '15:30', title: 'Study Group' }],
    Fri: [{ time: '09:00', title: 'Literature Seminar' }],
    Sat: [],
    Sun: [],
  };

  Object.entries(schedule).forEach(([day, entries]) => {
    const column = document.createElement('div');
    column.className = 'timetable__day';
    column.setAttribute('role', 'row');

    const dayName = document.createElement('p');
    dayName.className = 'timetable__day-name';
    dayName.textContent = day;

    const entriesWrap = document.createElement('div');
    entriesWrap.className = 'timetable__entries';

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'timetable__entry timetable__entry--empty';
      empty.textContent = 'Free';
      entriesWrap.appendChild(empty);
    } else {
      entries.forEach((entry) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'timetable__entry';

        const time = document.createElement('span');
        time.className = 'timetable__entry-time';
        time.textContent = entry.time;

        const title = document.createElement('span');
        title.className = 'timetable__entry-title';
        title.textContent = entry.title;

        entryEl.append(time, title);
        entriesWrap.appendChild(entryEl);
      });
    }

    column.append(dayName, entriesWrap);
    grid.appendChild(column);
  });
}

/* --------------------------------------------------------------------------
   6. SCROLL REVEAL — fades/lifts elements in as they enter the viewport
-------------------------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = entry.target.dataset.revealDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('reveal--visible');
        }, delay);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((target) => observer.observe(target));
}