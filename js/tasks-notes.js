/* ============================================================
   STUDY HUB — Notes & Roughs
   Subject-wise notebooks + a corkboard for quick roughs.
   Persists to localStorage. Pin, search, filter, delete-confirm,
   toasts and a couple of small motion touches included.
   ============================================================ */

(() => {
  const STORAGE_KEY = "studyhub_notes_v2";

  /* ---------- subject config ---------- */
  const SUBJECTS = {
    maths: {
      label: "Mathematics", subtitle: "Theorems, proofs & problem sets", short: "Maths",
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16M4 12h7M4 19l6-7-6-7M20 19l-4-7 4-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    physics: {
      label: "Physics", subtitle: "Forces, fields & motion", short: "Physics",
      icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.4" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" stroke-width="1.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" stroke-width="1.6" transform="rotate(120 12 12)"/></svg>`
    },
    chemistry: {
      label: "Chemistry", subtitle: "Reactions, bonds & elements", short: "Chemistry",
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6.2L4.8 18a1.6 1.6 0 0 0 1.4 2.4h11.6a1.6 1.6 0 0 0 1.4-2.4L14 9.2V3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 15h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
    },
    biology: {
      label: "Biology", subtitle: "Cells, systems & life sciences", short: "Biology",
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M20 4C10 4 4 10 4 19c9 0 15-6 15-15Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M6 18C10 13 13 10 18.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
    },
    roughs: {
      label: "Roughs", subtitle: "Scratch space — messy on purpose", short: "Roughs",
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13.5 7.5l3 3" stroke="currentColor" stroke-width="1.7"/></svg>`
    }
  };
  const SUBJECT_ORDER = ["maths", "physics", "chemistry", "biology", "roughs"];

  /* ---------- seed data (first run only) ---------- */
  const seedNotes = () => ([
    { id: cryptoId(), subject: "maths", title: "Quadratic formula", body: "x = (-b ± √(b² - 4ac)) / 2a\n\nDiscriminant tells you the nature of roots:\n> 0 → two real roots\n= 0 → one repeated root\n< 0 → complex roots", date: Date.now() - 86400000 * 2, pinned: true },
    { id: cryptoId(), subject: "maths", title: "Trig identities", body: "sin²θ + cos²θ = 1\n1 + tan²θ = sec²θ\n1 + cot²θ = cosec²θ", date: Date.now() - 86400000 * 4, pinned: false },
    { id: cryptoId(), subject: "physics", title: "Newton's laws", body: "1st: a body stays at rest / uniform motion unless acted on by a net force.\n2nd: F = ma\n3rd: every action has an equal and opposite reaction.", date: Date.now() - 86400000, pinned: false },
    { id: cryptoId(), subject: "chemistry", title: "Periodic trends", body: "Atomic radius decreases across a period, increases down a group.\nElectronegativity increases across a period, decreases down a group.", date: Date.now() - 3600000 * 5, pinned: false },
    { id: cryptoId(), subject: "biology", title: "Cell organelles", body: "Mitochondria — powerhouse, ATP synthesis.\nRibosomes — protein synthesis.\nGolgi apparatus — packaging & shipping of proteins.", date: Date.now() - 3600000, pinned: false },
    { id: cryptoId(), subject: "roughs", title: "calc doubt", body: "why does integration by parts flip sign on 2nd term??\nask sir tmrw", date: Date.now() - 3600000 * 3, rot: -4, tape: false },
    { id: cryptoId(), subject: "roughs", title: "todo", body: "- finish ch.4 numericals\n- redo mole concept sums\n- revise reproduction diagram", date: Date.now() - 3600000 * 8, rot: 3, tape: true },
  ]);

  function cryptoId(){ return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* ---------- state ---------- */
  let notes = loadNotes();
  let currentSubject = "maths";
  let searchQuery = "";
  let activeFilter = "all"; // all | pinned
  let editingId = null;
  let pinDraft = false;

  /* ---------- persistence ---------- */
  function loadNotes(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw){
        const seeded = seedNotes();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    }catch(e){ console.warn("Could not read saved notes, starting fresh.", e); return []; }
  }
  function persist(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
    catch(e){ console.warn("Could not save notes.", e); }
  }

  /* ---------- dom refs ---------- */
  const $subjectNav    = document.getElementById("subjectNav");
  const $sidebarStats  = document.getElementById("sidebarStats");
  const $notesGrid     = document.getElementById("notesGrid");
  const $roughsBoard   = document.getElementById("roughsBoard");
  const $emptyState    = document.getElementById("emptyState");
  const $emptyTitle    = document.getElementById("emptyTitle");
  const $emptyText     = document.getElementById("emptyText");
  const $workspaceIcon = document.getElementById("workspaceIcon");
  const $workspaceEyebrow = document.getElementById("workspaceEyebrow");
  const $workspaceTitle= document.getElementById("workspaceTitle");
  const $workspaceSubtitle = document.getElementById("workspaceSubtitle");
  const $searchInput   = document.getElementById("searchInput");
  const $searchClear   = document.getElementById("searchClear");
  const $newNoteBtn    = document.getElementById("newNoteBtn");
  const $newNoteLabel  = document.getElementById("newNoteLabel");
  const $filterRow     = document.getElementById("filterRow");

  const $modalBackdrop = document.getElementById("modalBackdrop");
  const $noteTitleInput = document.getElementById("noteTitleInput");
  const $noteBodyInput  = document.getElementById("noteBodyInput");
  const $sheetSubjectTag= document.getElementById("sheetSubjectTag");
  const $sheetDate      = document.getElementById("sheetDate");
  const $sheetCharCount = document.getElementById("sheetCharCount");
  const $sheetPinBtn    = document.getElementById("sheetPinBtn");
  const $saveNoteBtn    = document.getElementById("saveNoteBtn");
  const $deleteNoteBtn  = document.getElementById("deleteNoteBtn");
  const $closeModalBtn  = document.getElementById("closeModalBtn");

  const $confirmBackdrop= document.getElementById("confirmBackdrop");
  const $confirmCancel  = document.getElementById("confirmCancel");
  const $confirmDelete  = document.getElementById("confirmDelete");

  const $toastHost      = document.getElementById("toastHost");

  const $mobileNavToggle = document.getElementById("mobileNavToggle");
  const $sidebar = document.getElementById("sidebar");
  const $sidebarScrim = document.getElementById("sidebarScrim");

  /* ---------- toasts ---------- */
  function toast(message, variant = ""){
    const el = document.createElement("div");
    el.className = `toast ${variant}`;
    el.innerHTML = `<span class="dot"></span>${message}`;
    $toastHost.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  }

  /* ---------- sidebar ---------- */
  function renderSidebar(){
    $subjectNav.innerHTML = SUBJECT_ORDER.map(key => {
      const s = SUBJECTS[key];
      const count = notes.filter(n => n.subject === key).length;
      const active = key === currentSubject ? "active" : "";
      return `
        <button class="subject-btn ${active}" data-subject="${key}">
          <span class="icon-chip">${s.icon}</span>
          <span class="label-block">
            <strong>${s.short}</strong>
            <small>${key === "roughs" ? "scratch board" : "notebook"}</small>
          </span>
          <span class="count-badge">${count}</span>
        </button>`;
    }).join("");

    const total = notes.length;
    const pinned = notes.filter(n => n.pinned).length;
    $sidebarStats.innerHTML = `
      <div class="stat-pill"><strong>${total}</strong><small>Total</small></div>
      <div class="stat-pill"><strong>${pinned}</strong><small>Pinned</small></div>
    `;

    $subjectNav.querySelectorAll(".subject-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentSubject = btn.dataset.subject;
        searchQuery = ""; $searchInput.value = ""; $searchClear.hidden = true;
        activeFilter = "all";
        closeSidebarMobile();
        render();
      });
    });
  }

  /* ---------- header ---------- */
  function renderHeader(){
    const s = SUBJECTS[currentSubject];
    $workspaceIcon.innerHTML = s.icon;
    $workspaceIcon.style.setProperty("--accent", accentVar(currentSubject));
    $workspaceIcon.style.color = accentVar(currentSubject);
    $workspaceEyebrow.textContent = currentSubject === "roughs" ? "Scratch board" : "Notebook";
    $workspaceEyebrow.style.color = accentVar(currentSubject);
    $workspaceTitle.textContent = s.label;
    $workspaceSubtitle.textContent = s.subtitle;
    $newNoteLabel.textContent = currentSubject === "roughs" ? "New rough" : "New note";
    $searchInput.placeholder = `Search ${s.short.toLowerCase()}…`;
    $filterRow.style.display = currentSubject === "roughs" ? "none" : "flex";
  }

  function accentVar(subject){
    return { maths: "var(--maths)", physics: "var(--physics)", chemistry: "var(--chem)", biology: "var(--bio)", roughs: "var(--roughs)" }[subject];
  }

  /* ---------- grid / board ---------- */
  function currentNotes(){
    return notes
      .filter(n => n.subject === currentSubject)
      .filter(n => activeFilter === "pinned" ? n.pinned : true)
      .filter(n => {
        if(!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.pinned - a.pinned) || (b.date - a.date));
  }

  function formatDate(ts){
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  function snippet(body){ return body.trim().slice(0, 160); }
  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderGrid(){
    const list = currentNotes();
    const isRoughs = currentSubject === "roughs";

    $notesGrid.hidden = isRoughs;
    $roughsBoard.hidden = !isRoughs;

    if(isRoughs){
      $roughsBoard.innerHTML = list.map((n, i) => `
        <div class="rough-note ${n.tape ? "tape" : ""}" style="--r:${n.rot || 0}deg; animation-delay:${Math.min(i * 0.05, 0.4)}s" data-id="${n.id}">
          <h4>${escapeHtml(n.title || "Untitled")}</h4>
          <p>${escapeHtml(snippet(n.body))}</p>
        </div>
      `).join("") + `
        <div class="rough-note new-card" id="newCardTrigger" style="animation-delay:${Math.min(list.length * 0.05, 0.4)}s">
          <span>+ Pin a rough</span>
        </div>`;
    }else{
      $notesGrid.innerHTML = list.map((n, i) => `
        <div class="note-card" data-subject="${n.subject}" data-id="${n.id}" style="animation-delay:${Math.min(i * 0.05, 0.4)}s">
          <div class="card-top-row">
            <h3>${escapeHtml(n.title || "Untitled")}</h3>
            ${n.pinned ? `<span class="pin-flag"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.8H21l-5.6 4.1 2.1 6.9L12 15.8 6.5 19.8l2.1-6.9L3 8.8h6.8L12 2z"/></svg></span>` : ""}
          </div>
          <p>${escapeHtml(snippet(n.body))}</p>
          <span class="card-date">${formatDate(n.date)}</span>
        </div>
      `).join("") + `
        <div class="note-card new-card" id="newCardTrigger" style="animation-delay:${Math.min(list.length * 0.05, 0.4)}s">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>New note</span>
        </div>`;
    }

    $emptyState.hidden = list.length > 0;
    if(list.length === 0){
      $emptyTitle.textContent = searchQuery ? "No matches here" : (activeFilter === "pinned" ? "Nothing pinned yet" : "This shelf is empty");
      $emptyText.textContent = searchQuery
        ? "Try a different search term."
        : (activeFilter === "pinned" ? "Pin a note to keep it close." : (isRoughs ? "Pin your first rough thought." : "Start your first note — it only takes a line."));
    }

    const container = isRoughs ? $roughsBoard : $notesGrid;
    container.querySelectorAll("[data-id]").forEach(card => {
      card.addEventListener("click", () => openModal(card.dataset.id));
    });
    const newTrigger = document.getElementById("newCardTrigger");
    if(newTrigger) newTrigger.addEventListener("click", () => openModal(null));
  }

  /* ---------- modal ---------- */
  function updateCharCount(){
    const n = $noteBodyInput.value.length;
    $sheetCharCount.textContent = `${n} character${n === 1 ? "" : "s"}`;
  }

  function openModal(id){
    editingId = id;
    const s = SUBJECTS[currentSubject];
    $sheetSubjectTag.textContent = s.short;

    if(id){
      const note = notes.find(n => n.id === id);
      $noteTitleInput.value = note.title;
      $noteBodyInput.value = note.body;
      $sheetDate.textContent = formatDate(note.date);
      $deleteNoteBtn.style.display = "inline-flex";
      pinDraft = !!note.pinned;
    }else{
      $noteTitleInput.value = "";
      $noteBodyInput.value = "";
      $sheetDate.textContent = "New";
      $deleteNoteBtn.style.display = "none";
      pinDraft = false;
    }
    $sheetPinBtn.classList.toggle("active", pinDraft);
    $sheetPinBtn.style.display = currentSubject === "roughs" ? "none" : "grid";
    updateCharCount();

    $modalBackdrop.classList.add("open");
    setTimeout(() => $noteTitleInput.focus(), 150);
  }

  function closeModal(){
    $modalBackdrop.classList.remove("open");
    editingId = null;
  }

  function saveNote(){
    const title = $noteTitleInput.value.trim();
    const body = $noteBodyInput.value.trim();
    if(!title && !body){ closeModal(); return; }

    if(editingId){
      const note = notes.find(n => n.id === editingId);
      note.title = title; note.body = body; note.date = Date.now(); note.pinned = pinDraft;
      toast("Note updated");
    }else{
      notes.push({
        id: cryptoId(), subject: currentSubject, title, body, date: Date.now(),
        pinned: pinDraft,
        rot: currentSubject === "roughs" ? (Math.random() * 8 - 4).toFixed(1) : 0,
        tape: currentSubject === "roughs" ? Math.random() > 0.6 : false
      });
      toast(currentSubject === "roughs" ? "Rough pinned to the board" : "Note saved");
    }
    persist();
    closeModal();
    render();
  }

  function requestDelete(){
    if(!editingId) return;
    $confirmBackdrop.classList.add("open");
  }
  function performDelete(){
    notes = notes.filter(n => n.id !== editingId);
    persist();
    $confirmBackdrop.classList.remove("open");
    closeModal();
    render();
    toast("Note deleted", "danger");
  }

  /* ---------- mobile sidebar ---------- */
  function openSidebarMobile(){ $sidebar.classList.add("open"); $sidebarScrim.classList.add("show"); }
  function closeSidebarMobile(){ $sidebar.classList.remove("open"); $sidebarScrim.classList.remove("show"); }

  /* ---------- events ---------- */
  $newNoteBtn.addEventListener("click", () => openModal(null));
  $closeModalBtn.addEventListener("click", closeModal);
  $modalBackdrop.addEventListener("click", (e) => { if(e.target === $modalBackdrop) closeModal(); });
  $confirmBackdrop.addEventListener("click", (e) => { if(e.target === $confirmBackdrop) $confirmBackdrop.classList.remove("open"); });

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      if($confirmBackdrop.classList.contains("open")) $confirmBackdrop.classList.remove("open");
      else if($modalBackdrop.classList.contains("open")) closeModal();
    }
    if((e.metaKey || e.ctrlKey) && e.key === "Enter" && $modalBackdrop.classList.contains("open")){
      saveNote();
    }
  });

  $saveNoteBtn.addEventListener("click", saveNote);
  $deleteNoteBtn.addEventListener("click", requestDelete);
  $confirmCancel.addEventListener("click", () => $confirmBackdrop.classList.remove("open"));
  $confirmDelete.addEventListener("click", performDelete);
  $sheetPinBtn.addEventListener("click", () => { pinDraft = !pinDraft; $sheetPinBtn.classList.toggle("active", pinDraft); });
  $noteBodyInput.addEventListener("input", updateCharCount);

  $searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    $searchClear.hidden = !searchQuery;
    renderGrid();
  });
  $searchClear.addEventListener("click", () => {
    searchQuery = ""; $searchInput.value = ""; $searchClear.hidden = true; $searchInput.focus();
    renderGrid();
  });

  $filterRow.querySelectorAll(".chip-filter").forEach(chip => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      $filterRow.querySelectorAll(".chip-filter").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderGrid();
    });
  });

  $mobileNavToggle.addEventListener("click", openSidebarMobile);
  $sidebarScrim.addEventListener("click", closeSidebarMobile);

  /* ---------- render ---------- */
  function render(){
    renderSidebar();
    renderHeader();
    renderGrid();
  }

  render();
})();