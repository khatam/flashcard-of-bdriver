// Main Application Logic for Traffic Signs Learning App

let signs = [];
let currentCategory = 'all';
let bookmarks = JSON.parse(localStorage.getItem('traffic_bookmarks') || '[]');
let learnedSigns = JSON.parse(localStorage.getItem('traffic_learned') || '[]');

// Quiz State
let quizQuestions = [];
let currentQuizIndex = 0;
let quizScore = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof signsData !== 'undefined') {
            signs = signsData;
            updateCategoryCounts();
            renderFlashcards(signs);
            updateOverallProgress();
            updateBookmarkCount();

            // Restore theme preference
            const savedTheme = localStorage.getItem('traffic_theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
            }
        } else {
            console.error('signsData is not defined');
        }
    } catch (e) {
        console.error('Failed to load signs data:', e);
    }
});

// Toggle Dark/Light Mode
function toggleDarkMode() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('traffic_theme', isLight ? 'light' : 'dark');
}

// Tab Switching
function switchTab(tabName) {
    ['flashcards', 'quiz', 'bookmarks'].forEach(t => {
        document.getElementById(`view-${t}`).classList.add('hidden');
        const btn = document.getElementById(`tab-${t}`);
        const mobBtn = document.getElementById(`mob-tab-${t}`);
        if (btn) {
            btn.className = 'px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 text-slate-400 hover:text-white hover:bg-slate-700/50';
        }
        if (mobBtn) {
            mobBtn.className = 'flex flex-col items-center py-1 px-3 text-slate-400 text-xs font-medium';
        }
    });

    document.getElementById(`view-${tabName}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${tabName}`);
    const activeMobBtn = document.getElementById(`mob-tab-${tabName}`);

    if (activeBtn) {
        activeBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30';
    }
    if (activeMobBtn) {
        activeMobBtn.className = 'flex flex-col items-center py-1 px-3 text-indigo-400 text-xs font-bold';
    }

    if (tabName === 'bookmarks') {
        renderBookmarks();
    } else if (tabName === 'quiz') {
        startQuiz();
    }
}

// Update Category Counts
function updateCategoryCounts() {
    document.getElementById('count-all').innerText = signs.length;
    ['regulatory', 'warning', 'priority', 'informative'].forEach(cat => {
        const count = signs.filter(s => s.category === cat).length;
        const el = document.getElementById(`count-${cat}`);
        if (el) el.innerText = count;
    });
}

// Render Flashcards (Static HTML prerendered support)
function renderFlashcards(data) {
    const grid = document.getElementById('flashcards-grid');
    const emptyState = document.getElementById('empty-state');
    const allCards = grid.querySelectorAll('.flashcard-wrapper');

    let visibleCount = 0;
    const query = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';

    allCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const title = card.getAttribute('data-title').toLowerCase();
        const id = parseInt(card.getAttribute('data-id'));

        const matchesCat = currentCategory === 'all' || cat === currentCategory;
        const matchesQuery = title.includes(query);

        if (matchesCat && matchesQuery) {
            card.style.display = '';
            visibleCount++;

            // Update bookmark & learned visual state if needed
            const isBookmarked = bookmarks.includes(id);
            const isLearned = learnedSigns.includes(id);

            const bmBtn = card.querySelector(`[onclick*="toggleBookmark(${id})"]`);
            if (bmBtn) {
                if (isBookmarked) {
                    bmBtn.className = bmBtn.className.replace('text-slate-400 hover:text-white', 'text-amber-400 bg-amber-500/10 border-amber-500/30');
                    bmBtn.querySelector('i').className = 'fa-solid fa-bookmark';
                } else {
                    bmBtn.className = bmBtn.className.replace('text-amber-400 bg-amber-500/10 border-amber-500/30', 'text-slate-400 hover:text-white');
                    bmBtn.querySelector('i').className = 'fa-regular fa-bookmark';
                }
            }

            const lrnBtn = card.querySelector(`[onclick*="toggleLearned(${id})"]`);
            if (lrnBtn) {
                if (isLearned) {
                    lrnBtn.className = lrnBtn.className.replace('text-slate-400 hover:text-white', 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30');
                } else {
                    lrnBtn.className = lrnBtn.className.replace('text-emerald-400 bg-emerald-500/10 border-emerald-500/30', 'text-slate-400 hover:text-white');
                }
            }
        } else {
            card.style.display = 'none';
        }
    });

    if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

function getCategoryName(cat) {
    const map = {
        'regulatory': 'انتظامی و ممنوعیت',
        'warning': 'هشداردهنده',
        'priority': 'حق تقدم',
        'informative': 'اخباری و راهنما',
        'mandatory': 'اجباری'
    };
    return map[cat] || 'تابلوی رانندگی';
}

// Category Filter
function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.className = 'cat-pill px-4 py-2 rounded-xl text-xs font-medium transition bg-slate-800 text-slate-300 hover:bg-slate-700';
    });
    event.currentTarget.className = 'cat-pill px-4 py-2 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-lg shadow-indigo-600/20';

    filterSigns();
}

// Search & Filter combined
function filterSigns() {
    const query = document.getElementById('search-input').value.toLowerCase();

    let filtered = signs.filter(sign => {
        const matchesCat = currentCategory === 'all' || sign.category === currentCategory;
        const matchesQuery = sign.title.toLowerCase().includes(query) || sign.filename.toLowerCase().includes(query);
        return matchesCat && matchesQuery;
    });

    renderFlashcards(filtered);
}

// Bookmarks Toggle
function toggleBookmark(id) {
    if (bookmarks.includes(id)) {
        bookmarks = bookmarks.filter(b => b !== id);
    } else {
        bookmarks.push(id);
    }
    localStorage.setItem('traffic_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkCount();

    // Re-render current view
    if (!document.getElementById('view-bookmarks').classList.contains('hidden')) {
        renderBookmarks();
    } else {
        filterSigns();
    }
}

function updateBookmarkCount() {
    document.getElementById('bookmark-count').innerText = bookmarks.length;
}

// Learned Status Toggle
function toggleLearned(id) {
    if (learnedSigns.includes(id)) {
        learnedSigns = learnedSigns.filter(l => l !== id);
    } else {
        learnedSigns.push(id);
    }
    localStorage.setItem('traffic_learned', JSON.stringify(learnedSigns));
    updateOverallProgress();
    filterSigns();
}

function updateOverallProgress() {
    if (signs.length === 0) return;
    const percent = Math.round((learnedSigns.length / signs.length) * 100);
    document.getElementById('overall-progress').innerText = percent + '٪';
}

// Render Bookmarks View
function renderBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    const empty = document.getElementById('empty-bookmarks');
    grid.innerHTML = '';

    const bookmarkedSigns = signs.filter(s => bookmarks.includes(s.id));

    if (bookmarkedSigns.length === 0) {
        empty.classList.remove('hidden');
        return;
    } else {
        empty.classList.add('hidden');
    }

    renderFlashcardsInto(bookmarkedSigns, grid);
}

function renderFlashcardsInto(data, grid) {
    data.forEach(sign => {
        const isBookmarked = true;
        const isLearned = learnedSigns.includes(sign.id);

        const card = document.createElement('div');
        card.className = 'flashcard-wrapper';
        card.innerHTML = `
            <div class="flashcard-inner" onclick="this.parentElement.classList.toggle('flipped')">
                <div class="flashcard-front relative">
                    <button onclick="event.stopPropagation(); toggleBookmark(${sign.id})" class="absolute top-3 left-3 w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center transition">
                        <i class="fa-solid fa-bookmark"></i>
                    </button>

                    <button onclick="event.stopPropagation(); toggleLearned(${sign.id})" class="absolute top-3 right-3 w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center ${isLearned ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-400'} transition">
                        <i class="fa-solid fa-check"></i>
                    </button>

                    <div class="w-36 h-36 flex items-center justify-center mb-4 mt-2">
                        <img src="${sign.imageUrl}" alt="${sign.title}" class="max-h-full max-w-full object-contain drop-shadow-lg pointer-events-none">
                    </div>

                    <span class="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 mb-2">${getCategoryName(sign.category)}</span>
                    <p class="text-xs text-indigo-400 font-medium">برای دیدن نام تابلو کلیک کنید <i class="fa-solid fa-rotate mr-1"></i></p>
                </div>

                <div class="flashcard-back text-center p-6 flex flex-col justify-between items-center">
                    <span class="text-xs text-indigo-300 font-semibold uppercase tracking-wider">نام تابلوی رانندگی</span>

                    <div class="flex flex-col items-center space-y-3 w-full">
                        <button onclick="event.stopPropagation(); speakSign('${sign.audioUrl}', '${sign.title.replace(/'/g, "\\'")}')" class="group relative px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold flex items-center justify-center space-x-2 space-x-reverse shadow-xl shadow-indigo-600/30 transition transform hover:scale-105" title="تلفظ صوتی نام تابلو">
                            <i class="fa-solid fa-volume-high text-lg animate-pulse ml-2"></i>
                            <span class="text-sm">پخش تلفظ صوتی</span>
                        </button>

                        <h3 class="text-lg font-bold text-white leading-relaxed mt-2">${sign.title}</h3>
                    </div>

                    <p class="text-xs text-slate-400">کلیک برای بازگشت</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function clearBookmarks() {
    bookmarks = [];
    localStorage.setItem('traffic_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkCount();
    renderBookmarks();
}

// Quiz Mode Logic
function startQuiz() {
    if (signs.length < 4) return;

    currentQuizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-score').innerText = '0';
    document.getElementById('quiz-results').classList.add('hidden');
    document.getElementById('quiz-question-container').classList.remove('hidden');

    // Shuffle signs for quiz (10 questions)
    const shuffled = [...signs].sort(() => 0.5 - Math.random());
    quizQuestions = shuffled.slice(0, 10).map(correctSign => {
        // Get 3 wrong options
        const wrongs = signs.filter(s => s.id !== correctSign.id).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [...wrongs, correctSign].sort(() => 0.5 - Math.random());
        return {
            correct: correctSign,
            options: options
        };
    });

    loadQuizQuestion();
}

function loadQuizQuestion() {
    if (currentQuizIndex >= quizQuestions.length) {
        showQuizResults();
        return;
    }

    const q = quizQuestions[currentQuizIndex];
    document.getElementById('current-q-num').innerText = currentQuizIndex + 1;
    document.getElementById('total-q-num').innerText = quizQuestions.length;
    document.getElementById('quiz-progress-bar').style.width = `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`;

    document.getElementById('quiz-sign-img').src = q.correct.imageUrl;

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-800 hover:border-indigo-500 transition text-right flex items-center justify-between group';
        btn.innerHTML = `
            <span>${opt.title}</span>
            <span class="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-400">
                <i class="fa-solid fa-chevron-left text-[10px]"></i>
            </span>
        `;
        btn.onclick = () => handleAnswer(opt.id === q.correct.id, btn, q.correct.id);
        optionsContainer.appendChild(btn);
    });
}

function handleAnswer(isCorrect, btnElement, correctId) {
    const optionsContainer = document.getElementById('quiz-options');
    const allBtns = optionsContainer.querySelectorAll('button');

    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
        quizScore++;
        document.getElementById('quiz-score').innerText = quizScore;
        btnElement.className = 'p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm font-bold text-right flex items-center justify-between shadow-lg shadow-emerald-500/10';
        btnElement.querySelector('span:last-child').className = 'w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs';
        btnElement.querySelector('span:last-child').innerHTML = '<i class="fa-solid fa-check text-[10px]"></i>';
    } else {
        btnElement.className = 'p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm font-medium text-right flex items-center justify-between';
        btnElement.querySelector('span:last-child').className = 'w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs';
        btnElement.querySelector('span:last-child').innerHTML = '<i class="fa-solid fa-xmark text-[10px]"></i>';

        // Highlight correct
        allBtns.forEach(b => {
            if (b.innerText.includes(signs.find(s => s.id === correctId).title)) {
                b.className = 'p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm font-bold text-right flex items-center justify-between';
            }
        });
    }

    setTimeout(() => {
        currentQuizIndex++;
        loadQuizQuestion();
    }, 1200);
}

function showQuizResults() {
    document.getElementById('quiz-question-container').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');
    document.getElementById('final-score').innerText = quizScore;

    const msg = document.getElementById('quiz-feedback-msg');
    if (quizScore >= 9) {
        msg.innerHTML = '🌟 فوق‌العاده! شما آماده قبولی صددرصد در آزمون آیین‌نامه هستید.';
        msg.className = 'text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl max-w-md mx-auto';
    } else if (quizScore >= 6) {
        msg.innerHTML = '👍 خوب است! اما برای تسلط کامل پیشنهاد می‌شود فلش‌کارت‌ها را بیشتر مرور کنید.';
        msg.className = 'text-sm bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl max-w-md mx-auto';
    } else {
        msg.innerHTML = '⚠️ نیاز به تمرین بیشتر دارید. توصیه می‌کنیم تابلوهای نشان‌شده را مرور کنید.';
        msg.className = 'text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl max-w-md mx-auto';
    }
}

// Play audio file corresponding to the sign or fallback to Web Speech API
function speakSign(audioPath, title) {
    if (audioPath && !audioPath.includes('undefined')) {
        const audio = new Audio(audioPath);
        audio.play().catch(e => {
            console.log('Audio file play failed, using Web Speech API:', e);
            fallbackSpeech(title);
        });
    } else {
        fallbackSpeech(title);
    }
}

function fallbackSpeech(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    } else {
        alert('امکان پخش صوتی وجود ندارد.');
    }
}

// Toggle Dark/Light Mode
function toggleDarkMode() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('traffic_theme', isLight ? 'light' : 'dark');
}

// Toggle Sandwich Menu Dropdown
function toggleSandwichMenu() {
    const dropdown = document.getElementById('sandwich-dropdown');
    dropdown.classList.toggle('hidden');
}

// Close sandwich menu when clicking outside
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('sandwich-dropdown');
    if (!dropdown) return;
    const btn = dropdown.previousElementSibling;
    if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && btn && !btn.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});
