// assets/js/config.js

// 🔴 تأكد من أن هذا الرابط هو الرابط الخاص بك 🔴
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-tnShVGNz6-IUXdyDYkoKiLr-F3FBG18qEVqSO6J-k1Eoo23JUrw_O1eVbOW-Q1nOIg/exec";

// إعدادات Tailwind والألوان
tailwind.config = {
    theme: {
        extend: {
            fontFamily: { sans: ['Poppins', 'sans-serif'] },
            colors: {
                brand: { 
                    50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 
                    600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' 
                }
            }
        }
    }
};

// دالة مساعدة لحل مشكلة النسبة المئوية (1 -> 100%)
function formatScore(score) {
    if (score === 1 || score === "1" || score === 100) return "100%";
    if (!score) return "0%";
    return String(score).includes('%') ? score : score + "%";
}