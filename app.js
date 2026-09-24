// ==========================================
// ENGLISH-URDU VOCABULARY BUILDER
// INTERACTIVE ENGINE (app.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------
  // Application State
  // ------------------------------------------
  const state = {
    allWords: VOCABULARY_DATA || [],
    filteredWords: [],
    bookmarkedIds: new Set(JSON.parse(localStorage.getItem('vocab_bookmarks') || '[]')),
    currentTab: 'cards',
    selectedLevel: 'All',
    selectedCategory: 'All',
    selectedLetter: null,
    searchQuery: '',
    
    // Flashcard State
    fcDeck: [],
    fcIndex: 0,
    fcFlipped: false,

    // Quiz State
    quizMode: 'engToUrdu',
    quizTotalCount: 10,
    quizQuestions: [],
    quizCurrentIdx: 0,
    quizScore: 0,
    quizAnswered: false,

    // Theme
    theme: localStorage.getItem('vocab_theme') || 'light',

    // Phrases State
    allPhrases: typeof PHRASES_DATA !== 'undefined' ? PHRASES_DATA : [],
    filteredPhrases: [],
    selectedPhraseCat: 'All',
    selectedPhraseLevel: 'All',
    phraseSearchQuery: ''
  };

  // ------------------------------------------
  // DOM Elements
  // ------------------------------------------
  const DOM = {
    // Theme & Header
    body: document.body,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    printBtn: document.getElementById('printBtn'),
    totalWordsCount: document.getElementById('totalWordsCount'),
    bookmarkedCount: document.getElementById('bookmarkedCount'),

    // Nav Tabs
    navTabs: document.querySelectorAll('.nav-tab'),
    tabViews: document.querySelectorAll('.tab-view'),

    // Word of the day
    wotdWord: document.getElementById('wotdWord'),
    wotdPhonetic: document.getElementById('wotdPhonetic'),
    wotdPos: document.getElementById('wotdPos'),
    wotdUrdu: document.getElementById('wotdUrdu'),
    wotdEngEx: document.getElementById('wotdEngEx'),
    wotdUrduEx: document.getElementById('wotdUrduEx'),
    wotdAudioBtn: document.getElementById('wotdAudioBtn'),
    shuffleWotdBtn: document.getElementById('shuffleWotdBtn'),

    // Search & Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    levelFilterContainer: document.getElementById('levelFilterContainer'),
    categorySelect: document.getElementById('categorySelect'),
    alphabetBar: document.getElementById('alphabetBar'),
    resultsCountText: document.getElementById('resultsCountText'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),

    // Cards Grid
    wordsGrid: document.getElementById('wordsGrid'),
    noResultsState: document.getElementById('noResultsState'),
    emptyResetBtn: document.getElementById('emptyResetBtn'),

    // Flashcards
    flashcardScene: document.getElementById('flashcardScene'),
    flashcardInner: document.getElementById('flashcardInner'),
    fcWord: document.getElementById('fcWord'),
    fcPhonetic: document.getElementById('fcPhonetic'),
    fcPos: document.getElementById('fcPos'),
    fcLevelBadge: document.getElementById('fcLevelBadge'),
    fcUrduMeaning: document.getElementById('fcUrduMeaning'),
    fcEngExample: document.getElementById('fcEngExample'),
    fcUrduExample: document.getElementById('fcUrduExample'),
    fcSynonymsList: document.getElementById('fcSynonymsList'),
    fcFrontAudioBtn: document.getElementById('fcFrontAudioBtn'),
    fcBookmarkBtn: document.getElementById('fcBookmarkBtn'),
    fcShuffleBtn: document.getElementById('fcShuffleBtn'),
    fcPrevBtn: document.getElementById('fcPrevBtn'),
    fcNextBtn: document.getElementById('fcNextBtn'),
    fcFlipBtn: document.getElementById('fcFlipBtn'),
    currentCardIndex: document.getElementById('currentCardIndex'),
    totalCardsCount: document.getElementById('totalCardsCount'),
    fcCategoryBadge: document.getElementById('fcCategoryBadge'),

    // Quiz
    quizStartScreen: document.getElementById('quizStartScreen'),
    quizActiveScreen: document.getElementById('quizActiveScreen'),
    quizResultScreen: document.getElementById('quizResultScreen'),
    startQuizBtn: document.getElementById('startQuizBtn'),
    quizCountBtns: document.querySelectorAll('.count-btn'),
    quizModeRadios: document.querySelectorAll('input[name="quizMode"]'),
    quizCurrentQNum: document.getElementById('quizCurrentQNum'),
    quizTotalQNum: document.getElementById('quizTotalQNum'),
    quizScoreEl: document.getElementById('quizScore'),
    quizProgressFill: document.getElementById('quizProgressFill'),
    quizPromptLabel: document.getElementById('quizPromptLabel'),
    quizQuestionWord: document.getElementById('quizQuestionWord'),
    quizPromptSub: document.getElementById('quizPromptSub'),
    quizSpeakBtn: document.getElementById('quizSpeakBtn'),
    quizOptionsGrid: document.getElementById('quizOptionsGrid'),
    quizFooter: document.getElementById('quizFooter'),
    quizFeedback: document.getElementById('quizFeedback'),
    quizNextBtn: document.getElementById('quizNextBtn'),
    resultTitle: document.getElementById('resultTitle'),
    resultSubtitle: document.getElementById('resultSubtitle'),
    finalScoreText: document.getElementById('finalScoreText'),
    finalPercentText: document.getElementById('finalPercentText'),
    retryQuizBtn: document.getElementById('retryQuizBtn'),
    returnToCardsBtn: document.getElementById('returnToCardsBtn'),

    // Bookmarks
    bookmarksGrid: document.getElementById('bookmarksGrid'),
    noBookmarksState: document.getElementById('noBookmarksState'),
    clearAllBookmarksBtn: document.getElementById('clearAllBookmarksBtn'),
    browseWordsBtn: document.getElementById('browseWordsBtn'),

    // Phrases Elements
    phrasesGrid: document.getElementById('phrasesGrid'),
    phraseSearchInput: document.getElementById('phraseSearchInput'),
    clearPhraseSearchBtn: document.getElementById('clearPhraseSearchBtn'),
    phraseCatPills: document.getElementById('phraseCatPills'),
    phraseLevelPills: document.getElementById('phraseLevelPills'),
    phrasesCountText: document.getElementById('phrasesCountText'),
    noPhrasesState: document.getElementById('noPhrasesState'),
    resetPhrasesBtn: document.getElementById('resetPhrasesBtn')
  };

  // ------------------------------------------
  // Audio / Speech Synthesis (Native English Pronunciation)
  // ------------------------------------------
  function speakWord(text, btnElement = null) {
    if (!('speechSynthesis' in window)) {
      alert('آپ کا براؤزر آڈیو تلفظ سپورٹ نہیں کرتا۔');
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.88; // slightly slower for clear learning pronunciation

    if (btnElement) {
      btnElement.classList.add('speaking');
      utterance.onend = () => btnElement.classList.remove('speaking');
      utterance.onerror = () => btnElement.classList.remove('speaking');
    }

    window.speechSynthesis.speak(utterance);
  }

  // ------------------------------------------
  // Theme Toggle
  // ------------------------------------------
  function initTheme() {
    if (state.theme === 'dark') {
      DOM.body.classList.add('dark-theme');
      DOM.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun text-warning"></i>';
    } else {
      DOM.body.classList.remove('dark-theme');
      DOM.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  }

  DOM.themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('vocab_theme', state.theme);
    initTheme();
  });

  DOM.printBtn.addEventListener('click', () => {
    window.print();
  });

  // ------------------------------------------
  // Navigation Tabs Switching
  // ------------------------------------------
  DOM.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    state.currentTab = tabId;

    // Update Nav tab classes
    DOM.navTabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // Update View classes
    DOM.tabViews.forEach(view => {
      view.classList.remove('active');
    });

    if (tabId === 'cards') {
      document.getElementById('cardsView').classList.add('active');
      renderCards();
    } else if (tabId === 'flashcards') {
      document.getElementById('flashcardsView').classList.add('active');
      initFlashcards();
    } else if (tabId === 'quiz') {
      document.getElementById('quizView').classList.add('active');
    } else if (tabId === 'bookmarks') {
      document.getElementById('bookmarksView').classList.add('active');
      renderBookmarks();
    } else if (tabId === 'phrases') {
      document.getElementById('phrasesView').classList.add('active');
      renderPhrases();
    }
  }

  DOM.browseWordsBtn?.addEventListener('click', () => switchTab('cards'));
  DOM.returnToCardsBtn?.addEventListener('click', () => switchTab('cards'));

  // ------------------------------------------
  // Word of the Day Feature
  // ------------------------------------------
  let currentWotdWord = null;

  function pickWotd(random = false) {
    if (state.allWords.length === 0) return;
    
    let picked;
    if (random) {
      const randIdx = Math.floor(Math.random() * state.allWords.length);
      picked = state.allWords[randIdx];
    } else {
      // Deterministic day of year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const index = dayOfYear % state.allWords.length;
      picked = state.allWords[index];
    }

    currentWotdWord = picked;
    DOM.wotdWord.textContent = picked.word;
    DOM.wotdPhonetic.textContent = picked.phonetic;
    DOM.wotdPos.textContent = picked.pos;
    DOM.wotdUrdu.textContent = picked.urduMeaning;
    DOM.wotdEngEx.textContent = `"${picked.englishExample}"`;
    DOM.wotdUrduEx.textContent = `"${picked.urduExample}"`;
  }

  DOM.wotdAudioBtn.addEventListener('click', () => {
    if (currentWotdWord) {
      speakWord(currentWotdWord.word, DOM.wotdAudioBtn);
    }
  });

  DOM.shuffleWotdBtn.addEventListener('click', () => {
    pickWotd(true);
  });

  // ------------------------------------------
  // Filter & Search Controls Initialization
  // ------------------------------------------
  function initFilters() {
    // Populate Level Pills
    DOM.levelFilterContainer.innerHTML = '';
    DIFFICULTY_LEVELS.forEach(level => {
      const pill = document.createElement('button');
      pill.className = `filter-pill ${level.id === state.selectedLevel ? 'active' : ''}`;
      pill.textContent = level.label;
      pill.setAttribute('data-level', level.id);
      pill.addEventListener('click', () => {
        state.selectedLevel = level.id;
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        applyFilters();
      });
      DOM.levelFilterContainer.appendChild(pill);
    });

    // Populate Category Dropdown
    DOM.categorySelect.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon} ${cat.label}`;
      DOM.categorySelect.appendChild(opt);
    });

    DOM.categorySelect.addEventListener('change', (e) => {
      state.selectedCategory = e.target.value;
      applyFilters();
    });

    // Populate Alphabet Bar
    DOM.alphabetBar.innerHTML = '';
    const allLetterBtn = document.createElement('button');
    allLetterBtn.className = 'letter-btn active';
    allLetterBtn.textContent = 'All';
    allLetterBtn.addEventListener('click', () => {
      state.selectedLetter = null;
      updateAlphabetActive(allLetterBtn);
      applyFilters();
    });
    DOM.alphabetBar.appendChild(allLetterBtn);

    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      const hasWords = state.allWords.some(w => w.word.toUpperCase().startsWith(letter));
      const btn = document.createElement('button');
      btn.className = `letter-btn ${!hasWords ? 'disabled' : ''}`;
      btn.textContent = letter;

      if (hasWords) {
        btn.addEventListener('click', () => {
          state.selectedLetter = letter;
          updateAlphabetActive(btn);
          applyFilters();
        });
      }
      DOM.alphabetBar.appendChild(btn);
    }

    // Search Input listeners
    DOM.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      DOM.clearSearchBtn.style.display = state.searchQuery ? 'flex' : 'none';
      applyFilters();
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      DOM.clearSearchBtn.style.display = 'none';
      applyFilters();
    });

    // Reset Filters Button
    DOM.resetFiltersBtn.addEventListener('click', resetAllFilters);
    DOM.emptyResetBtn.addEventListener('click', resetAllFilters);
  }

  function updateAlphabetActive(activeBtn) {
    document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  function resetAllFilters() {
    state.selectedLevel = 'All';
    state.selectedCategory = 'All';
    state.selectedLetter = null;
    state.searchQuery = '';
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    DOM.categorySelect.value = 'All';

    // Reset Level pills
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-level') === 'All');
    });

    // Reset Alphabet bar
    document.querySelectorAll('.letter-btn').forEach((b, idx) => {
      b.classList.toggle('active', idx === 0);
    });

    applyFilters();
  }

  // ------------------------------------------
  // Filter Engine
  // ------------------------------------------
  function applyFilters() {
    let result = state.allWords;

    // Filter by Level
    if (state.selectedLevel !== 'All') {
      result = result.filter(w => w.level === state.selectedLevel);
    }

    // Filter by Category
    if (state.selectedCategory !== 'All') {
      result = result.filter(w => w.category === state.selectedCategory);
    }

    // Filter by Initial Letter
    if (state.selectedLetter) {
      result = result.filter(w => w.word.toUpperCase().startsWith(state.selectedLetter));
    }

    // Filter by Search Query (English or Urdu)
    if (state.searchQuery) {
      const q = state.searchQuery;
      result = result.filter(w => {
        return (
          w.word.toLowerCase().includes(q) ||
          w.urduMeaning.includes(q) ||
          (w.phonetic && w.phonetic.toLowerCase().includes(q)) ||
          (w.synonyms && w.synonyms.some(s => s.toLowerCase().includes(q))) ||
          (w.englishExample && w.englishExample.toLowerCase().includes(q)) ||
          (w.urduExample && w.urduExample.includes(q))
        );
      });
    }

    state.filteredWords = result;

    // Check if any filter is active
    const isFiltered = state.selectedLevel !== 'All' || 
                       state.selectedCategory !== 'All' || 
                       state.selectedLetter !== null || 
                       state.searchQuery !== '';

    DOM.resetFiltersBtn.style.display = isFiltered ? 'flex' : 'none';
    DOM.resultsCountText.textContent = `نمائش: ${result.length} الفاظ (دستیاب کل: ${state.allWords.length})`;

    renderCards();
  }

  // ------------------------------------------
  // Word Card Generator
  // ------------------------------------------
  function createWordCard(word) {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.setAttribute('data-id', word.id);

    const isBookmarked = state.bookmarkedIds.has(word.id);
    const levelClass = `badge-level-${word.level.toLowerCase()}`;

    // Generate Synonyms HTML
    let synonymsHtml = '';
    if (word.synonyms && word.synonyms.length > 0) {
      synonymsHtml = `
        <div class="card-synonyms">
          <span>مترادفات:</span>
          ${word.synonyms.map(s => `<span class="syn-pill">${s}</span>`).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="card-top">
          <div class="word-primary-group">
            <div class="card-word-title">
              <span>${word.word}</span>
              <button class="speak-btn card-audio-btn" title="انگریزی تلفظ سنیں">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
            <span class="card-phonetic">${word.phonetic}</span>
          </div>
          <div class="card-actions-quick">
            <button class="bookmark-toggle-btn ${isBookmarked ? 'bookmarked' : ''}" title="${isBookmarked ? 'بک مارک ختم کریں' : 'بک مارک کریں'}">
              <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>
          </div>
        </div>

        <div class="card-badges">
          <span class="badge ${levelClass}">${word.level}</span>
          <span class="badge badge-pos">${word.pos}</span>
          <span class="badge badge-cat">${word.category}</span>
        </div>

        <div class="card-urdu-box">
          <div class="card-urdu-meaning urdu-text">${word.urduMeaning}</div>
        </div>

        <div class="card-examples-box">
          <p class="card-english-example">"${word.englishExample}"</p>
          <p class="card-urdu-example urdu-text">"${word.urduExample}"</p>
        </div>
      </div>

      ${synonymsHtml}
    `;

    // Audio click handler
    const audioBtn = card.querySelector('.card-audio-btn');
    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      speakWord(word.word, audioBtn);
    });

    // Bookmark click handler
    const bookmarkBtn = card.querySelector('.bookmark-toggle-btn');
    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(word.id);
    });

    return card;
  }

  function renderCards() {
    DOM.wordsGrid.innerHTML = '';

    if (state.filteredWords.length === 0) {
      DOM.noResultsState.style.display = 'block';
    } else {
      DOM.noResultsState.style.display = 'none';
      state.filteredWords.forEach(word => {
        DOM.wordsGrid.appendChild(createWordCard(word));
      });
    }
  }

  // ------------------------------------------
  // Bookmarks Feature
  // ------------------------------------------
  function toggleBookmark(wordId) {
    if (state.bookmarkedIds.has(wordId)) {
      state.bookmarkedIds.delete(wordId);
    } else {
      state.bookmarkedIds.add(wordId);
    }

    // Save to localStorage
    localStorage.setItem('vocab_bookmarks', JSON.stringify([...state.bookmarkedIds]));
    updateStatsBadges();

    // Update active view
    if (state.currentTab === 'cards') {
      // Toggle star on cards in view
      document.querySelectorAll(`.word-card[data-id="${wordId}"] .bookmark-toggle-btn`).forEach(btn => {
        const isBm = state.bookmarkedIds.has(wordId);
        btn.classList.toggle('bookmarked', isBm);
        btn.innerHTML = `<i class="${isBm ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
      });
    } else if (state.currentTab === 'bookmarks') {
      renderBookmarks();
    }

    // Update flashcard bookmark icon if currently viewing that word
    if (state.fcDeck[state.fcIndex] && state.fcDeck[state.fcIndex].id === wordId) {
      updateFcBookmarkIcon();
    }
  }

  function renderBookmarks() {
    DOM.bookmarksGrid.innerHTML = '';
    const bookmarkedWords = state.allWords.filter(w => state.bookmarkedIds.has(w.id));

    if (bookmarkedWords.length === 0) {
      DOM.noBookmarksState.style.display = 'block';
      DOM.clearAllBookmarksBtn.style.display = 'none';
    } else {
      DOM.noBookmarksState.style.display = 'none';
      DOM.clearAllBookmarksBtn.style.display = 'inline-flex';
      bookmarkedWords.forEach(word => {
        DOM.bookmarksGrid.appendChild(createWordCard(word));
      });
    }
  }

  DOM.clearAllBookmarksBtn.addEventListener('click', () => {
    if (confirm('کیا آپ تمام محفوظ شدہ الفاظ کی فہرست صاف کرنا چاہتے ہیں؟')) {
      state.bookmarkedIds.clear();
      localStorage.setItem('vocab_bookmarks', '[]');
      updateStatsBadges();
      renderBookmarks();
    }
  });

  function updateStatsBadges() {
    DOM.totalWordsCount.textContent = state.allWords.length;
    DOM.bookmarkedCount.textContent = state.bookmarkedIds.size;
  }

  // ------------------------------------------
  // Flashcards Feature
  // ------------------------------------------
  function initFlashcards() {
    // Flashcard deck is based on current filtered words, or all words if none filtered
    state.fcDeck = state.filteredWords.length > 0 ? [...state.filteredWords] : [...state.allWords];
    state.fcIndex = 0;
    state.fcFlipped = false;
    DOM.totalCardsCount.textContent = state.fcDeck.length;
    renderCurrentFlashcard();
  }

  function renderCurrentFlashcard() {
    if (state.fcDeck.length === 0) return;

    // Reset flip state smoothly
    state.fcFlipped = false;
    DOM.flashcardInner.classList.remove('flipped');

    const card = state.fcDeck[state.fcIndex];
    DOM.currentCardIndex.textContent = state.fcIndex + 1;
    DOM.fcCategoryBadge.textContent = card.category;

    // Front Side
    DOM.fcWord.textContent = card.word;
    DOM.fcPhonetic.textContent = card.phonetic;
    DOM.fcPos.textContent = card.pos;
    DOM.fcLevelBadge.textContent = card.level;
    DOM.fcLevelBadge.className = `fc-level-badge badge-level-${card.level.toLowerCase()}`;

    // Back Side
    DOM.fcUrduMeaning.textContent = card.urduMeaning;
    DOM.fcEngExample.textContent = `"${card.englishExample}"`;
    DOM.fcUrduExample.textContent = `"${card.urduExample}"`;
    DOM.fcSynonymsList.textContent = card.synonyms && card.synonyms.length > 0 ? card.synonyms.join(', ') : 'کوئی نہیں';

    updateFcBookmarkIcon();
  }

  function updateFcBookmarkIcon() {
    const currentCard = state.fcDeck[state.fcIndex];
    if (!currentCard) return;
    const isBm = state.bookmarkedIds.has(currentCard.id);
    DOM.fcBookmarkBtn.classList.toggle('text-warning', isBm);
    DOM.fcBookmarkBtn.innerHTML = `<i class="${isBm ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
  }

  function flipFlashcard() {
    state.fcFlipped = !state.fcFlipped;
    DOM.flashcardInner.classList.toggle('flipped', state.fcFlipped);
  }

  DOM.flashcardScene.addEventListener('click', flipFlashcard);
  DOM.fcFlipBtn.addEventListener('click', flipFlashcard);

  DOM.fcNextBtn.addEventListener('click', () => {
    if (state.fcIndex < state.fcDeck.length - 1) {
      state.fcIndex++;
      renderCurrentFlashcard();
    } else {
      state.fcIndex = 0; // loop back to first card
      renderCurrentFlashcard();
    }
  });

  DOM.fcPrevBtn.addEventListener('click', () => {
    if (state.fcIndex > 0) {
      state.fcIndex--;
      renderCurrentFlashcard();
    } else {
      state.fcIndex = state.fcDeck.length - 1; // loop to last card
      renderCurrentFlashcard();
    }
  });

  DOM.fcShuffleBtn.addEventListener('click', () => {
    // Fisher-Yates shuffle
    for (let i = state.fcDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.fcDeck[i], state.fcDeck[j]] = [state.fcDeck[j], state.fcDeck[i]];
    }
    state.fcIndex = 0;
    renderCurrentFlashcard();
  });

  DOM.fcBookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentCard = state.fcDeck[state.fcIndex];
    if (currentCard) {
      toggleBookmark(currentCard.id);
    }
  });

  DOM.fcFrontAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentCard = state.fcDeck[state.fcIndex];
    if (currentCard) {
      speakWord(currentCard.word, DOM.fcFrontAudioBtn);
    }
  });

  // Keyboard Navigation for Flashcards
  document.addEventListener('keydown', (e) => {
    if (state.currentTab !== 'flashcards') return;
    if (e.code === 'Space') {
      e.preventDefault();
      flipFlashcard();
    } else if (e.code === 'ArrowRight') {
      DOM.fcNextBtn.click();
    } else if (e.code === 'ArrowLeft') {
      DOM.fcPrevBtn.click();
    }
  });

  // ------------------------------------------
  // Quiz Challenge Engine
  // ------------------------------------------
  DOM.quizCountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.quizCountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.quizTotalCount = parseInt(btn.getAttribute('data-count'), 10);
    });
  });

  DOM.quizModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.quizMode = e.target.value;
    });
  });

  DOM.startQuizBtn.addEventListener('click', startQuiz);
  DOM.retryQuizBtn.addEventListener('click', startQuiz);

  function startQuiz() {
    state.quizScore = 0;
    state.quizCurrentIdx = 0;
    state.quizAnswered = false;

    // Pick random questions from allWords
    const shuffledPool = [...state.allWords].sort(() => 0.5 - Math.random());
    const count = Math.min(state.quizTotalCount, shuffledPool.length);
    const selectedQuestionsWords = shuffledPool.slice(0, count);

    state.quizQuestions = selectedQuestionsWords.map(wordObj => {
      // Find 3 distractors (wrong answers) from remaining words
      const otherWords = state.allWords.filter(w => w.id !== wordObj.id);
      const shuffledOthers = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);

      const isEngToUrdu = state.quizMode === 'engToUrdu';
      const correctAnswer = isEngToUrdu ? wordObj.urduMeaning : wordObj.word;
      const options = [
        correctAnswer,
        ...shuffledOthers.map(ow => isEngToUrdu ? ow.urduMeaning : ow.word)
      ].sort(() => 0.5 - Math.random());

      return {
        wordObj,
        correctAnswer,
        options
      };
    });

    DOM.quizStartScreen.style.display = 'none';
    DOM.quizResultScreen.style.display = 'none';
    DOM.quizActiveScreen.style.display = 'block';

    DOM.quizTotalQNum.textContent = state.quizQuestions.length;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    state.quizAnswered = false;
    DOM.quizFooter.style.display = 'none';
    DOM.quizFeedback.textContent = '';
    DOM.quizFeedback.className = 'quiz-feedback';

    const currentQ = state.quizQuestions[state.quizCurrentIdx];
    DOM.quizCurrentQNum.textContent = state.quizCurrentIdx + 1;
    DOM.quizScoreEl.textContent = state.quizScore;

    // Update Progress Fill
    const progressPercent = ((state.quizCurrentIdx) / state.quizQuestions.length) * 100;
    DOM.quizProgressFill.style.width = `${progressPercent}%`;

    const isEngToUrdu = state.quizMode === 'engToUrdu';

    if (isEngToUrdu) {
      DOM.quizPromptLabel.textContent = 'اس لفظ کا درست اردو معنی منتخب کریں:';
      DOM.quizQuestionWord.textContent = currentQ.wordObj.word;
      DOM.quizPromptSub.textContent = `${currentQ.wordObj.phonetic} • ${currentQ.wordObj.pos}`;
      DOM.quizSpeakBtn.style.display = 'inline-flex';
      DOM.quizSpeakBtn.onclick = () => speakWord(currentQ.wordObj.word, DOM.quizSpeakBtn);
    } else {
      DOM.quizPromptLabel.textContent = 'اس اردو معنی کا درست انگریزی لفظ منتخب کریں:';
      DOM.quizQuestionWord.textContent = currentQ.wordObj.urduMeaning;
      DOM.quizPromptSub.textContent = `کیٹیگری: ${currentQ.wordObj.category}`;
      DOM.quizSpeakBtn.style.display = 'none';
    }

    // Render Options
    DOM.quizOptionsGrid.innerHTML = '';
    currentQ.options.forEach((optText, index) => {
      const btn = document.createElement('button');
      btn.className = `quiz-option-btn ${isEngToUrdu ? 'urdu-text' : ''}`;
      btn.innerHTML = `
        <span>${optText}</span>
        <i class="fa-regular fa-circle"></i>
      `;

      btn.addEventListener('click', () => handleQuizAnswer(optText, btn, currentQ));
      DOM.quizOptionsGrid.appendChild(btn);
    });
  }

  function handleQuizAnswer(selectedOption, clickedBtn, currentQ) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;

    const isCorrect = selectedOption === currentQ.correctAnswer;
    const optionBtns = DOM.quizOptionsGrid.querySelectorAll('.quiz-option-btn');

    optionBtns.forEach(btn => {
      btn.classList.add('disabled');
      const text = btn.querySelector('span').textContent;
      if (text === currentQ.correctAnswer) {
        btn.classList.add('correct');
        btn.querySelector('i').className = 'fa-solid fa-circle-check';
      }
    });

    if (isCorrect) {
      state.quizScore++;
      DOM.quizScoreEl.textContent = state.quizScore;
      clickedBtn.classList.add('correct');
      clickedBtn.querySelector('i').className = 'fa-solid fa-circle-check';
      DOM.quizFeedback.textContent = 'شاباش! درست جواب۔ (Correct!)';
      DOM.quizFeedback.className = 'quiz-feedback correct-text urdu-text';
    } else {
      clickedBtn.classList.add('wrong');
      clickedBtn.querySelector('i').className = 'fa-solid fa-circle-xmark';
      DOM.quizFeedback.textContent = `غلط جواب! درست جواب ہے: ${currentQ.correctAnswer}`;
      DOM.quizFeedback.className = 'quiz-feedback wrong-text urdu-text';
    }

    // Show audio pronunciation on answer
    if (state.quizMode === 'engToUrdu') {
      speakWord(currentQ.wordObj.word);
    }

    DOM.quizFooter.style.display = 'flex';
  }

  DOM.quizNextBtn.addEventListener('click', () => {
    if (state.quizCurrentIdx < state.quizQuestions.length - 1) {
      state.quizCurrentIdx++;
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  });

  function finishQuiz() {
    DOM.quizActiveScreen.style.display = 'none';
    DOM.quizResultScreen.style.display = 'block';

    const total = state.quizQuestions.length;
    const score = state.quizScore;
    const percent = Math.round((score / total) * 100);

    DOM.finalScoreText.textContent = `${score}/${total}`;
    DOM.finalPercentText.textContent = `${percent}%`;

    if (percent >= 80) {
      DOM.resultTitle.textContent = 'شاندار کارکردگی! (Outstanding!)';
      DOM.resultSubtitle.textContent = 'آپ کی انگریزی وکیبلری بہت مضبوط ہے۔ اسی محنت کو برقرار رکھیں!';
    } else if (percent >= 50) {
      DOM.resultTitle.textContent = 'اچھی کوشش! (Good Effort!)';
      DOM.resultSubtitle.textContent = 'آپ نے اچھا اسکور کیا۔ فلیش کارڈز کے ذریعے دہرائی کر کے مزید بہتر بنائیں!';
    } else {
      DOM.resultTitle.textContent = 'مزید مشق کی ضرورت ہے! (Keep Practicing!)';
      DOM.resultSubtitle.textContent = 'پریشان نہ ہوں! الفاظ کی فہرست اور فلیش کارڈز کا روزانہ مطالعہ کریں اور دوبارہ ٹیسٹ دیں۔';
    }
  }

  // ------------------------------------------
  // Phrases Engine & Rendering
  // ------------------------------------------
  function initPhrases() {
    if (!DOM.phraseCatPills || !DOM.phraseLevelPills) return;

    // Render Category Pills
    const categories = typeof PHRASE_CATEGORIES !== 'undefined' ? PHRASE_CATEGORIES : [
      { id: "All", label: "تمام (All Phrases)", icon: "🗣️" }
    ];

    DOM.phraseCatPills.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `phrase-cat-btn ${state.selectedPhraseCat === cat.id ? 'active' : ''}`;
      btn.innerHTML = `${cat.icon || '💬'} <span>${cat.label}</span>`;
      btn.addEventListener('click', () => {
        state.selectedPhraseCat = cat.id;
        document.querySelectorAll('.phrase-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyPhraseFilters();
      });
      DOM.phraseCatPills.appendChild(btn);
    });

    // Render Level Pills
    const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
    DOM.phraseLevelPills.innerHTML = '';
    levels.forEach(lvl => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${state.selectedPhraseLevel === lvl ? 'active' : ''}`;
      btn.setAttribute('data-level', lvl);
      btn.textContent = lvl === 'All' ? 'تمام' : lvl;
      btn.addEventListener('click', () => {
        state.selectedPhraseLevel = lvl;
        DOM.phraseLevelPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyPhraseFilters();
      });
      DOM.phraseLevelPills.appendChild(btn);
    });

    // Search Input
    DOM.phraseSearchInput?.addEventListener('input', (e) => {
      state.phraseSearchQuery = e.target.value.trim().toLowerCase();
      if (DOM.clearPhraseSearchBtn) {
        DOM.clearPhraseSearchBtn.style.display = state.phraseSearchQuery ? 'flex' : 'none';
      }
      applyPhraseFilters();
    });

    DOM.clearPhraseSearchBtn?.addEventListener('click', () => {
      DOM.phraseSearchInput.value = '';
      state.phraseSearchQuery = '';
      DOM.clearPhraseSearchBtn.style.display = 'none';
      applyPhraseFilters();
    });

    DOM.resetPhrasesBtn?.addEventListener('click', () => {
      state.selectedPhraseCat = 'All';
      state.selectedPhraseLevel = 'All';
      state.phraseSearchQuery = '';
      if (DOM.phraseSearchInput) DOM.phraseSearchInput.value = '';
      if (DOM.clearPhraseSearchBtn) DOM.clearPhraseSearchBtn.style.display = 'none';
      initPhrases();
      applyPhraseFilters();
    });

    applyPhraseFilters();
  }

  function applyPhraseFilters() {
    let filtered = [...state.allPhrases];

    if (state.selectedPhraseCat !== 'All') {
      filtered = filtered.filter(p => p.category === state.selectedPhraseCat);
    }

    if (state.selectedPhraseLevel !== 'All') {
      filtered = filtered.filter(p => p.level === state.selectedPhraseLevel);
    }

    if (state.phraseSearchQuery) {
      const q = state.phraseSearchQuery;
      filtered = filtered.filter(p =>
        (p.phrase && p.phrase.toLowerCase().includes(q)) ||
        (p.urduTranslation && p.urduTranslation.includes(q)) ||
        (p.explanation && p.explanation.toLowerCase().includes(q)) ||
        (p.urduExplanation && p.urduExplanation.includes(q))
      );
    }

    state.filteredPhrases = filtered;
    renderPhrases();
  }

  function renderPhrases() {
    if (!DOM.phrasesGrid) return;
    DOM.phrasesGrid.innerHTML = '';

    if (DOM.phrasesCountText) {
      DOM.phrasesCountText.textContent = `${state.filteredPhrases.length} جملے`;
    }

    if (state.filteredPhrases.length === 0) {
      if (DOM.noPhrasesState) DOM.noPhrasesState.style.display = 'block';
      return;
    }

    if (DOM.noPhrasesState) DOM.noPhrasesState.style.display = 'none';

    state.filteredPhrases.forEach(p => {
      const card = document.createElement('div');
      card.className = 'phrase-card';

      card.innerHTML = `
        <div class="phrase-card-header">
          <div class="phrase-text">${escapeHtml(p.phrase)}</div>
          <div class="phrase-meta-row">
            <span class="phrase-cat-badge"><i class="fa-solid fa-tag"></i> ${escapeHtml(p.category)}</span>
            <span class="phrase-level-badge">${escapeHtml(p.level)}</span>
          </div>
        </div>
        <div class="phrase-card-body">
          <div class="phrase-urdu-box">
            <span class="phrase-urdu-label">اردو ترجمہ (Urdu Meaning):</span>
            <div class="phrase-urdu-text urdu-text">${escapeHtml(p.urduTranslation)}</div>
          </div>
          <div class="phrase-explanation-box">
            <span class="phrase-exp-label"><i class="fa-solid fa-circle-info"></i> وضاحت (Explanation):</span>
            <p class="phrase-exp-en">${escapeHtml(p.explanation)}</p>
            <p class="phrase-exp-ur urdu-text">${escapeHtml(p.urduExplanation)}</p>
          </div>
          ${p.example ? `
          <div class="phrase-example-box">
            <span class="phrase-example-label"><i class="fa-solid fa-pen-fancy"></i> مثال (Example):</span>
            <p class="phrase-example-en">"${escapeHtml(p.example)}"</p>
            <p class="phrase-example-ur urdu-text">"${escapeHtml(p.urduExample || '')}"</p>
          </div>` : ''}
          ${p.whenToUse ? `
          <div class="phrase-when-to-use">
            <i class="fa-solid fa-lightbulb"></i>
            <span><strong>استعمال کا موقع:</strong> ${escapeHtml(p.whenToUse)}</span>
          </div>` : ''}
        </div>
      `;

      DOM.phrasesGrid.appendChild(card);
    });
  }

  // ------------------------------------------
  // App Initialization
  // ------------------------------------------
  function initApp() {
    initTheme();
    state.filteredWords = [...state.allWords];
    updateStatsBadges();
    pickWotd(false);
    initFilters();
    renderCards();
    initPhrases();
  }

  initApp();
});
