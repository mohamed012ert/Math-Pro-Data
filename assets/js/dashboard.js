// assets/js/dashboard.js

// ------------------------------- grade4 ---------------------------------
const database = {
    grade4: [
        { id: 1, type: 'lesson', title: 'Introduction to Fractions', desc: 'Understanding numerator and denominator.', content: 'A fraction represents a part of a whole.' },
       
        { id: 2, type: 'quiz', title: 'Fractions Unit Quiz', quizId: 'q_g4_fr', questions: [{ q: "What is 1/2 of 10?", options: ["2", "5", "10", "1"], a: 1 }, { q: "Which fraction is larger?", options: ["1/4", "1/2", "1/8", "1/10"], a: 1 }] },
       // -------------------------------  video ---------------------------------

        { id: 3, type: 'video', title: 'تأثير الضغط على الكائنات البحرية', url: 'https://www.youtube.com/embed/6pu8_A0ks2Q?si=g_EAkxl6NLONHeoo', vidId: 'الضغط', duration: '15:23' },
        { 
            id: 4, 
            type: 'video', 
            title: 'مكونات وطبقات الغلاف الجوي', 
            url: 'https://www.youtube.com/embed/uqCxXJrE7rw', 
            vidId: 'مكونات الغلاف', 
            duration: '10:00' 
        }
    ],

// ------------------------------- prep1 -----------------------------------------------------------
    prep1: [
        { id: 101, type: 'lesson', title: 'Rational Numbers', desc: 'Set of rational numbers Q.', content: 'Any number expressed as p/q.' },
        { id: 102, type: 'video', title: 'Algebra Basics', url: 'https://www.youtube.com/embed/NybHckSEQBI', vidId: 'vid_p1_alg', duration: '18:30' },
     
            // -------------------------------  video ---------------------------------
 
        { id: 103, type: 'quiz', title: 'Algebra Month 1', quizId: 'q_p1_alg', questions: [{ q: "Solve for x: x + 5 = 10", options: ["2", "5", "15", "50"], a: 1 }, { q: "Simplify: 2x + 3x", options: ["5x", "6x", "5", "6"], a: 0 }] }
    ]
};
// ------------------------------- -------------------------- ---------------------------------

const currentUser = localStorage.getItem('mathProUser');
const currentGrade = localStorage.getItem('mathProGrade');
if (!currentUser || !currentGrade) window.location.href = 'index.html';

window.onload = function() {
    updateStatsUI();
    renderContent(database[currentGrade]);
    fetchDataFromSheet();
};

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// --- CORE FUNCTIONS ---
async function fetchDataFromSheet() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getStudent&name=${encodeURIComponent(currentUser)}`);
        const data = await response.json();
        if (data.exists) {
            localStorage.setItem('attendance', data.attendance);
            // 🔥 FIX: Normalize score using shared function
            localStorage.setItem('latestScore', formatScore(data.latestScore));
            localStorage.setItem('allScores', typeof data.allScores === 'string' ? data.allScores : JSON.stringify(data.allScores));
            localStorage.setItem('watchedVideos', typeof data.watchedVideos === 'string' ? data.watchedVideos : JSON.stringify(data.watchedVideos));
            updateStatsUI();
        }
    } catch (e) { console.log("Offline mode/Sync error"); }
}

function updateStatsUI() {
    // Basic Info
    document.getElementById('statsName').textContent = currentUser;
    document.getElementById('welcomeName').textContent = currentUser;
    document.getElementById('sidebarName').textContent = currentUser;
    const init = currentUser.charAt(0).toUpperCase();
    document.getElementById('avatarInitials').textContent = init;
    document.getElementById('sidebarAvatar').textContent = init;
    
    const gradeText = currentGrade === 'grade4' ? 'Grade 4' : 'Prep 1';
    document.getElementById('statsGrade').textContent = gradeText;
    document.getElementById('sidebarGrade').textContent = gradeText;

    // Attendance
    const attendance = localStorage.getItem('attendance') || "0%";
    document.getElementById('attendanceDisplay').textContent = attendance;
    document.getElementById('attendanceBar').style.width = attendance.includes('%') ? attendance : attendance + '%';

    // Score Display
    const latestScore = formatScore(localStorage.getItem('latestScore'));
    document.getElementById('avgScoreDisplay').textContent = latestScore;
    
    const scoreNum = parseInt(latestScore.replace('%', ''));
    const safeScoreNum = isNaN(scoreNum) ? 0 : scoreNum;
    document.getElementById('scoreBar').style.width = safeScoreNum + "%";
    
    const color = safeScoreNum >= 80 ? 'green' : (safeScoreNum >= 50 ? 'yellow' : 'red');
    document.getElementById('avgScoreDisplay').className = `text-3xl font-black mt-2 text-${color}-600`;
    document.getElementById('scoreBar').className = `shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-${color}-500 transition-all duration-500`;

    try {
        const allScores = JSON.parse(localStorage.getItem('allScores') || '[]');
        if (allScores.length > 0) document.getElementById('quizzesTakenText').textContent = `${allScores.length} quizzes completed`;
    } catch (e) {}

    const lastLogin = localStorage.getItem('lastLogin');
    if (lastLogin) document.getElementById('lastLogin').textContent = `Last login: ${new Date(lastLogin).toLocaleDateString()}`;
}

function refreshLiveData(btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    fetchDataFromSheet().then(() => {
        setTimeout(() => { btn.innerHTML = originalText; }, 500);
    });
}

// --- CONTENT RENDERING ---
function renderContent(items) {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = "glass-panel rounded-xl p-6 hover:shadow-lg transition duration-300 flex flex-col h-full";
        
        if (item.type === 'lesson') {
            card.innerHTML = `
                <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-4"><i class="fa-solid fa-book-open text-xl"></i></div>
                <h3 class="font-bold text-lg mb-2">${item.title}</h3>
                <p class="text-sm text-gray-500 mb-4 flex-grow">${item.desc}</p>
                <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block w-max">Read Lesson</span>`;
        } else if (item.type === 'video') {
            const isWatched = hasWatchedVideo(item.vidId);
            const btnClass = isWatched ? 'bg-green-100 text-green-700 cursor-default' : 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer';
            card.innerHTML = `
                <div class="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-4"><i class="fa-solid fa-play text-xl"></i></div>
                <h3 class="font-bold text-lg mb-2">${item.title}</h3>
                <div class="aspect-video bg-black rounded-lg overflow-hidden mb-4"><iframe src="${item.url}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>
                <button onclick="trackVideo('${item.vidId}', '${item.title}', this)" class="w-full py-2 rounded-lg font-bold text-sm transition ${btnClass}" ${isWatched ? 'disabled' : ''}>
                    ${isWatched ? '<i class="fa-solid fa-check"></i> Watched' : 'Mark as Watched'}
                </button>`;
        } else if (item.type === 'quiz') {
            const safeItem = JSON.stringify(item).replace(/"/g, '&quot;');
            card.innerHTML = `
                <div class="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-lg flex items-center justify-center mb-4"><i class="fa-solid fa-trophy text-xl"></i></div>
                <h3 class="font-bold text-lg mb-2">${item.title}</h3>
                <p class="text-sm text-gray-500 mb-4 flex-grow">${item.questions.length} questions.</p>
                <button onclick="startQuiz(${safeItem})" class="w-full py-2 rounded-lg font-bold text-sm bg-brand-600 text-white hover:bg-brand-700 transition">Start Quiz</button>`;
        }
        grid.appendChild(card);
    });
}

function filterView(type) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');
    const allItems = database[currentGrade];
    renderContent(type === 'all' ? allItems : allItems.filter(i => i.type === type));
}

// --- LOGIC: VIDEO & QUIZ ---
function hasWatchedVideo(vidId) {
    try { return JSON.parse(localStorage.getItem('watchedVideos') || '[]').includes(vidId); } catch (e) { return false; }
}

function trackVideo(vidId, title, btn) {
    let watched = JSON.parse(localStorage.getItem('watchedVideos') || '[]');
    if (watched.includes(vidId)) return;
    watched.push(vidId);
    localStorage.setItem('watchedVideos', JSON.stringify(watched));
    btn.className = "w-full py-2 rounded-lg font-bold text-sm bg-green-100 text-green-700 cursor-default";
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Watched';
    btn.disabled = true;
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ action: 'logActivity', student: currentUser, watched: JSON.stringify(watched) })
    });
}

let quizState = {};
function startQuiz(quizObj) {
    quizState = { active: true, ...quizObj, index: 0, score: 0 };
    document.getElementById('quizTitle').innerText = quizObj.title;
    document.getElementById('quizModal').classList.remove('hidden');
    renderQuestion();
}

function closeQuiz() {
    document.getElementById('quizModal').classList.add('hidden');
    updateStatsUI();
}

function renderQuestion() {
    const container = document.getElementById('quizBody');
    if (quizState.index >= quizState.questions.length) {
        const percentage = Math.round((quizState.score / quizState.questions.length) * 100);
        let allScores = JSON.parse(localStorage.getItem('allScores') || '[]');
        allScores.push({ date: new Date().toISOString(), quiz: quizState.title, score: percentage });
        localStorage.setItem('allScores', JSON.stringify(allScores));
        localStorage.setItem('latestScore', percentage + "%");
        
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({ action: 'updateScore', student: currentUser, score: percentage, allScores: JSON.stringify(allScores) })
        });

        container.innerHTML = `
            <div class="text-center py-6">
                <h2 class="text-2xl font-bold mb-2">Quiz Completed!</h2>
                <div class="text-5xl font-black ${percentage >= 50 ? 'text-green-600' : 'text-red-600'} mb-8">${percentage}%</div>
                <button onclick="closeQuiz()" class="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold">Return to Dashboard</button>
            </div>`;
        return;
    }
    const q = quizState.questions[quizState.index];
    let html = `<div class="mb-6"><h3 class="text-xl font-bold mt-2">${q.q}</h3></div><div class="space-y-3">`;
    q.options.forEach((opt, idx) => {
        html += `<button onclick="answerQuestion(${idx})" class="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-brand-50 transition">${opt}</button>`;
    });
    container.innerHTML = html + `</div>`;
}

function answerQuestion(idx) {
    if (idx === quizState.questions[quizState.index].a) quizState.score++;
    quizState.index++;
    renderQuestion();

}



