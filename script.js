import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDT9hPRbKJ3BRsnQ3R6su0YVA1C_YhaAN4",
  authDomain: "ffca-chat.firebaseapp.com",
  databaseURL: "https://ffca-chat-default-rtdb.firebaseio.com",
  projectId: "ffca-chat",
  storageBucket: "ffca-chat.firebasestorage.app",
  messagingSenderId: "893006406369",
  appId: "1:893006406369:web:d4c5e38f7d3ce9cde68da0",
  measurementId: "G-4GXJLEDT7E"
};
const sheetURL = 'https://script.google.com/macros/s/AKfycbxHeGviAYwQyAv4AanTpaOvx15sVTyCE6zn9OPGq7KIOHeEenZM25czrr9zNfBu0cm14w/exec';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const chatRef = ref(db, "chats");
let allKM = [];

// --- LOGIN ---
window.handleLogin = function() {
    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;
    const st = document.getElementById('login-status');
    if(!u || !p) return;
    st.innerText = "Checking...";
    
    fetch(`${sheetURL}?action=login&username=${u}&password=${p}`, { method: 'POST' })
    .then(res => res.json()).then(data => {
        if(data.result === "success") {
            localStorage.setItem('ffca_user', JSON.stringify(data));
            window.location.href = "dashboard.html";
        } else { st.innerText = "Login Gagal!"; st.style.color = "red"; }
    });
}

// --- REGISTER ---
const regForm = document.getElementById('form-registrasi');
if(regForm) {
    regForm.addEventListener('submit', e => {
        e.preventDefault();
        let fd = new FormData(regForm); fd.append('action', 'register');
        fetch(sheetURL, { method: 'POST', body: fd }).then(res => res.text()).then(t => {
            alert(t); window.location.href = "index.html";
        });
    });
}

// --- DASHBOARD LOGIC ---
function enterApp() {
    const user = JSON.parse(localStorage.getItem('ffca_user'));
    if(!user && window.location.pathname.includes("dashboard")) {
        window.location.href = "index.html"; return;
    }
    if(document.getElementById('welcome-txt')) {
        document.getElementById('welcome-txt').innerText = `Halo, ${user.nickname} (${user.role})`;
        document.getElementById('nick-field').value = user.nickname;
        if(user.role === "FFCA" || user.role === "CB") {
            document.getElementById('chat-area').classList.remove('hidden');
        } else { document.getElementById('chat-no-access').classList.remove('hidden'); }
        initChart(); loadKM();
    }
}

window.showPage = (id) => {
    ['page-dashboard', 'page-event', 'page-chat'].forEach(p => document.getElementById(p).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

window.handleLogout = () => { localStorage.clear(); window.location.href = "index.html"; }

// --- KOMUNITAS & CHART ---
function loadKM() {
    fetch(`${sheetURL}?action=getKomunitas`).then(res => res.json()).then(data => {
        allKM = data; renderKM(data);
        const sel = document.getElementById('prov-km');
        [...new Set(data.map(i => i[2]))].sort().forEach(p => {
            const o = document.createElement('option'); o.value = p; o.innerText = p; sel.appendChild(o);
        });
    });
}

function renderKM(data) {
    const l = document.getElementById('list-km');
    l.innerHTML = data.map(i => `<div class="km-card"><h3>${i[0]}</h3><p>PIC: ${i[3]}</p><a href="${i[4]}" target="_blank">Instagram</a></div>`).join('');
}

window.filterKM = () => {
    const s = document.getElementById('search-km').value.toLowerCase();
    const p = document.getElementById('prov-km').value;
    renderKM(allKM.filter(i => i[0].toLowerCase().includes(s) && (p === "All" || i[2] === p)));
}

function initChart() {
    new Chart(document.getElementById('leaderChart'), {
        type: 'bar',
        data: { labels: ['Solo', 'Gorontalo', 'Bandung'], datasets: [{ label: 'Points', data: [151, 146, 146], backgroundColor: '#ffcc00' }] },
        options: { maintainAspectRatio: false, scales: { y: { ticks: { color: '#fff' } } } }
    });
}

// --- CHAT ---
window.sendChat = () => {
    const i = document.getElementById('chat-input');
    const u = JSON.parse(localStorage.getItem('ffca_user'));
    if(i.value.trim()) { push(chatRef, { sender: u.nickname, text: i.value }); i.value = ""; }
}
onChildAdded(chatRef, (d) => {
    const m = d.val(); const b = document.getElementById('chat-box'); if(!b) return;
    const div = document.createElement('div');
    div.className = `msg ${m.sender === JSON.parse(localStorage.getItem('ffca_user')).nickname ? 'sent' : 'received'}`;
    div.innerHTML = `<small><b>${m.sender}</b></small><br>${m.text}`;
    b.appendChild(div); b.scrollTop = b.scrollHeight;
});

window.onload = enterApp;
