// assets/js/auth.js

// Check local session immediately
if(localStorage.getItem('mathProUser')) {
    window.location.href = 'dashboard.html';
}

async function handleLogin(e) {
    e.preventDefault();
    const name = document.getElementById('username').value.trim();
    const grade = document.querySelector('input[name="grade"]:checked').value;
    const submitBtn = document.getElementById('submitBtn');
    const msgDiv = document.getElementById('message');
    
    if(!name || name.length < 2) return showMessage("Please enter a valid name", "error");

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader"></div> Connecting...';
    msgDiv.classList.add("hidden");

    try {
        // 1. Fetch user data
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getStudent&name=${encodeURIComponent(name)}`);
        const data = await response.json();

        if (data.exists) {
            saveToLocal(data.name, data.grade, data);
        } else {
            // 2. Register new user
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'registerStudent', student: name, grade: grade })
            });
            saveToLocal(name, grade, { attendance: "0%", latestScore: "0%", allScores: [], watchedVideos: [] });
        }
        
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error("Offline/Error:", error);
        // Fallback for offline usage
        saveToLocal(name, grade, { attendance: "0%", latestScore: "0%", allScores: [], watchedVideos: [] });
        window.location.href = 'dashboard.html';
    }
}

function saveToLocal(name, grade, data) {
    localStorage.setItem('mathProUser', name);
    localStorage.setItem('mathProGrade', data.grade || grade);
    
    // 🔥 FIX: Apply formatting here to prevent "1"
    let score = data.latestScore || data.score || "0%";
    localStorage.setItem('latestScore', formatScore(score));
    
    localStorage.setItem('attendance', data.attendance || "0%");
    localStorage.setItem('allScores', typeof data.allScores === 'string' ? data.allScores : JSON.stringify(data.allScores || []));
    localStorage.setItem('watchedVideos', typeof data.watchedVideos === 'string' ? data.watchedVideos : JSON.stringify(data.watchedVideos || []));
    localStorage.setItem('lastLogin', new Date().toISOString());
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = `p-3 rounded-lg text-sm ${type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`;
    el.classList.remove("hidden");
}

document.getElementById('loginForm').addEventListener('submit', handleLogin);