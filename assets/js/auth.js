// assets/js/auth.js

if(localStorage.getItem('mathProUser')) {
    window.location.href = 'dashboard.html';
}

async function handleLogin(e) {
    e.preventDefault();
    const name = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const grade = document.querySelector('input[name="grade"]:checked').value;
    const submitBtn = document.getElementById('submitBtn');
    
    if(!name || name.length < 2) return showMessage("Enter a valid name", "error");
    if(!pass || pass.length < 3) return showMessage("Password too short", "error");

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader"></div> Processing...';

    try {
        // 1. محاولة الدخول
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getStudent&name=${encodeURIComponent(name)}&password=${encodeURIComponent(pass)}`);
        const data = await response.json();

        if (data.exists) {
            if (data.error) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login / Register';
                return showMessage("Incorrect Password!", "error");
            }
            saveToLocal(data.name, data.grade, data);
            window.location.href = 'dashboard.html';
        } else {
            // 2. تسجيل جديد إذا لم يكن موجوداً
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'registerStudent', student: name, password: pass, grade: grade })
            });
            // الدخول المباشر بعد التسجيل
            saveToLocal(name, grade, { attendance: "0%", latestScore: "0%" });
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error(error);
        showMessage("Connection Error. Try again.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login / Register';
    }
}

function saveToLocal(name, grade, data) {
    localStorage.setItem('mathProUser', name);
    localStorage.setItem('mathProGrade', data.grade || grade);
    localStorage.setItem('latestScore', formatScore(data.latestScore));
    localStorage.setItem('attendance', data.attendance || "0%");
    localStorage.setItem('allScores', JSON.stringify(data.allScores || []));
    localStorage.setItem('watchedVideos', JSON.stringify(data.watchedVideos || []));
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = `p-3 rounded-lg text-sm ${type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`;
    el.classList.remove("hidden");
}

document.getElementById('loginForm').addEventListener('submit', handleLogin);
