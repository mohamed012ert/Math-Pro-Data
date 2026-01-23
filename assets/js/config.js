
// assets/js/config.js
// 🔴 تأكد أن الرابط هو الرابط الجديد الذي يعمل معك 🔴
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKhEWe2yeIqXs3kA9rmOQ7TeJhV7tpAisWOzi2PUxce721Che26WFw833ToxFm2Xil/exec";

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

// ✅ الدالة الجديدة: تحل مشكلة 0.4 وتجعلها 40%
function formatScore(score) {
    if (score == null || score === "") return "0%"; // لو فارغ
    
    let str = String(score);
    if (str.includes('%')) return str; // لو النسبة موجودة أصلاً

    let num = parseFloat(str);
    
    // إذا كان الرقم عشري (أقل من أو يساوي 1) مثل 0.4 أو 0.55
    if (num <= 1 && num > 0) {
        return Math.round(num * 100) + "%"; 
    }
    
    // إذا كان الرقم عادي مثل 40 أو 90
    return Math.round(num) + "%";
}
