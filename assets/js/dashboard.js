// assets/js/dashboard.js

const currentUser = localStorage.getItem('mathProUser');
const currentGrade = localStorage.getItem('mathProGrade');
if (!currentUser || !currentGrade) window.location.href = 'index.html';

let database = { grade4: [], prep1: [] };

window.onload = async function() {
    updateUI();
    await loadContent();
    refreshData();
};

async function loadContent() {
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getContent`);
        const data = await res.json();
        if(data && (data.grade4 || data.prep1)) {
            database = data;
            renderContent(database[currentGrade] || []);
        } else {
            document.getElementById('cardsGrid').innerHTML = '<p class="col-span-full text-center text-gray-500">No content added yet.</p>';
        }
    } catch(e) {
        console.error(e);
        document.getElementById('cardsGrid').innerHTML = '<p class="col-span-full text-center text-red-500">Error loading content.</p>';
    }
}

async function refreshData(btn) {
    if(btn) btn.innerHTML = 'Refreshing...';
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getStudent&name=${encodeURIComponent(currentUser)}&password=SKIP`);
        const data = await response.json();
        
        if (data.exists) {
            localStorage.setItem('attendance', data.attendance);
            localStorage.setItem('latestScore', formatScore(data.latestScore));
            localStorage.setItem('watchedVideos', JSON.stringify(data.watchedVideos || []));
            localStorage.setItem('allScores', JSON.stringify(data.allScores || []));
            
            if(data.announcement) localStorage.setItem('announcementText', data.announcement);
            
            updateUI();
            
            // تحديث محتوى الكروت
            if(database[currentGrade]) renderContent(database[currentGrade]);
        }
    } catch (e) { console.log("Sync error"); }
    if(btn) btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
}

function updateUI() {
    document.getElementById('welcomeName').textContent = currentUser;
    document.getElementById('statsName').textContent = currentUser;
    document.getElementById('sidebarName').textContent = currentUser;
    document.getElementById('avatarInitials').textContent = currentUser.charAt(0).toUpperCase();
    document.getElementById('sidebarAvatar').textContent = currentUser.charAt(0).toUpperCase();
    document.getElementById('statsGrade').textContent = currentGrade;
    document.getElementById('sidebarGrade').textContent = currentGrade;

    // 🔥 إصلاح الغياب (0.95 -> 95%)
    let rawAtt = localStorage.getItem('attendance') || "0";
    let attNum = parseFloat(String(rawAtt).replace('%', ''));
    if (attNum <= 1 && attNum > 0) attNum = Math.round(attNum * 100); // التحويل هنا
    document.getElementById('attendanceDisplay').textContent = attNum + "%";
    document.getElementById('attendanceBar').style.width = attNum + '%';

    // 🔥 إصلاح الدرجة (0.2 -> 20%)
    let rawScore = localStorage.getItem('latestScore') || "0";
    let scoreNum = parseFloat(String(rawScore).replace('%', ''));
    if (scoreNum <= 1 && scoreNum > 0) scoreNum = Math.round(scoreNum * 100); // التحويل هنا
    
    document.getElementById('avgScoreDisplay').textContent = scoreNum + "%";
    document.getElementById('scoreBar').style.width = scoreNum + "%";

    try {
        const ann = localStorage.getItem('announcementText'); 
        if(ann && ann !== "") {
            document.getElementById('announcementBar').classList.remove('hidden');
            document.getElementById('marqueeText').textContent = "📢 " + ann;
        }
    } catch(e) {}
}
function getQuizScore(quizTitle) {
    try {
        let allScores = JSON.parse(localStorage.getItem('allScores') || '[]');
        const found = allScores.find(q => q.quiz === quizTitle);
        return found ? found.score : null;
    } catch(e) { return null; }
}

function renderContent(items) {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';
    
    if(!items.length) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-500">No lessons available.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = "glass-panel rounded-xl p-6 hover:shadow-lg transition flex flex-col h-full relative";
        
        let typeBadge = "";
        if (item.type === 'video') typeBadge = `<span class="absolute top-4 right-4 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full uppercase">Video 🎥</span>`;
        else if (item.type === 'quiz') typeBadge = `<span class="absolute top-4 right-4 bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full uppercase">Quiz 🏆</span>`;
        else typeBadge = `<span class="absolute top-4 right-4 bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full uppercase">Lesson 📖</span>`;

        if (item.type === 'lesson') {
            card.innerHTML = `
                ${typeBadge}
                <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-4"><i class="fa-solid fa-book-open text-xl"></i></div>
                <h3 class="font-bold text-lg mb-2 pr-10">${item.title}</h3>
                <p class="text-sm text-gray-500 mb-4 flex-grow">${item.desc}</p>
                <div class="text-xs bg-gray-100 p-2 rounded">${item.content}</div>`;
        } else if (item.type === 'video') {
            const isWatched = hasWatched(item.vidId);
            card.innerHTML = `
                ${typeBadge}
                <div class="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-4"><i class="fa-solid fa-play text-xl"></i></div>
                <h3 class="font-bold text-lg mb-2 pr-10">${item.title}</h3>
                <div class="aspect-video bg-black rounded-lg overflow-hidden mb-4"><iframe src="${item.url}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>
                <button onclick="markVideo('${item.vidId}', this)" class="w-full py-2 rounded-lg font-bold text-sm transition ${isWatched ? 'bg-green-100 text-green-700' : 'bg-brand-600 text-white'}" ${isWatched ? 'disabled' : ''}>
                    ${isWatched ? 'Watched ✅' : 'Mark as Watched'}
                </button>`;
        } else if (item.type === 'quiz') {
            const safeItem = JSON.stringify(item).replace(/"/g, '&quot;');
            const prevScore = getQuizScore(item.title);
            let btnHtml = '';

            if (prevScore !== null) {
                btnHtml = `<button disabled class="w-full py-2 rounded-lg font-bold text-sm bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300">
                    Done (Score: ${prevScore}%) ✅
                </button>`;
            } else {
                btnHtml = `<button onclick="startQuiz(${safeItem})" class="w-full py-2 rounded-lg font-bold text-sm bg-brand-600 text-white hover:bg-brand-700">Start Quiz</button>`;
            }

            card.innerHTML = `
                ${typeBadge}
                <div class="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-lg flex items-center justify-center mb-4"><i class="fa-solid fa-trophy text-xl"></i></div>
                <h3 class="font-bold text-lg mb-2 pr-10">${item.title}</h3>
                <p class="text-sm text-gray-500 mb-4 flex-grow">${item.questions.length} Questions</p>
                ${btnHtml}`;
        }
        grid.appendChild(card);
    });
}

function filterView(type) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');
    const all = database[currentGrade] || [];
    renderContent(type === 'all' ? all : all.filter(i => i.type === type));
}

function hasWatched(id) {
    try { return JSON.parse(localStorage.getItem('watchedVideos') || '[]').includes(id); } catch(e) { return false; }
}

function markVideo(id, btn) {
    let watched = JSON.parse(localStorage.getItem('watchedVideos') || '[]');
    if(watched.includes(id)) return;
    watched.push(id);
    localStorage.setItem('watchedVideos', JSON.stringify(watched));
    btn.className = "w-full py-2 rounded-lg font-bold text-sm bg-green-100 text-green-700";
    btn.innerHTML = "Watched ✅";
    btn.disabled = true;
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ action: 'logActivity', student: currentUser, watched: JSON.stringify(watched) })
    });
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

let quizState = {};
function startQuiz(quiz) {
    quizState = { active: true, ...quiz, index: 0, score: 0 };
    document.getElementById('quizTitle').innerText = quiz.title;
    document.getElementById('quizModal').classList.remove('hidden');
    renderQuestion();
}

function closeQuiz() {
    document.getElementById('quizModal').classList.add('hidden');
    refreshData(); 
}

function renderQuestion() {
    const container = document.getElementById('quizBody');
    if (quizState.index >= quizState.questions.length) {
        const pct = Math.round((quizState.score / quizState.questions.length) * 100);
        let all = JSON.parse(localStorage.getItem('allScores') || '[]');
        
        all.push({ date: new Date().toISOString(), quiz: quizState.title, score: pct });
        localStorage.setItem('allScores', JSON.stringify(all));
        localStorage.setItem('latestScore', pct + "%");
        
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({ action: 'updateScore', student: currentUser, score: pct, allScores: JSON.stringify(all) })
        });
        
        container.innerHTML = `
            <div class="text-center">
                <h2 class="text-3xl font-bold ${pct>=50?'text-green-600':'text-red-600'}">${pct}%</h2>
                <p class="text-gray-500 mb-4">Quiz Completed!</p>
                <button onclick="closeQuiz()" class="mt-4 bg-gray-800 text-white px-6 py-2 rounded hover:bg-black transition">Close & Save</button>
            </div>`;
        return;
    }
    const q = quizState.questions[quizState.index];
    let html = `<h3 class="font-bold text-xl mb-4">${q.q}</h3><div class="space-y-2">`;
    q.options.forEach((opt, idx) => {
        html += `<button onclick="answer(${idx})" class="w-full text-left p-3 border rounded hover:bg-brand-50 hover:border-brand-200 transition">${opt}</button>`;
    });
    container.innerHTML = html + '</div>';
}

function answer(idx) {
    if (idx === quizState.questions[quizState.index].a) quizState.score++;
    quizState.index++;
    renderQuestion();
}
