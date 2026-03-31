import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

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

// --- SISTEM LOGIN ---
window.handleLogin = function() {
    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;
    if(!u || !p) return;
    
    fetch(`${sheetURL}?action=login&username=${u}&password=${p}`, { method: 'POST' })
    .then(res => res.json()).then(data => {
        if(data.result === "success") {
            localStorage.setItem('ffca_user', JSON.stringify(data));
            window.location.href = "dashboard.html";
        } else { alert("Username/Password Salah!"); }
    }).catch(err => alert("Error: " + err));
}

// --- REGISTRASI ---
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

// --- LOGIKA DASHBOARD ---
function initDashboard() {
    const session = localStorage.getItem('ffca_user');
    if(!session) { window.location.href = "index.html"; return; }
    
    const user = JSON.parse(session);
    if(document.getElementById('welcome-txt')) {
        document.getElementById('welcome-txt').innerText = `Halo, ${user.nickname} (${user.role})`;
        if(document.getElementById('nick-field')) document.getElementById('nick-field').value = user.nickname;
        
        // Chat Access
        const chatArea = document.getElementById('chat-area');
        const chatNo = document.getElementById('chat-no-access');
        if(user.role === "FFCA" || user.role === "CB") {
            if(chatArea) chatArea.classList.remove('hidden');
        } else {
            if(chatNo) chatNo.classList.remove('hidden');
        }
        
        initChart();
        loadKomunitas();
    }
}

// --- DATA KOMUNITAS ---
function loadKomunitas() {
    fetch(`${sheetURL}?action=getKomunitas`)
    .then(res => res.json()).then(data => {
        allKM = data;
        renderKM(data);
        const sel = document.getElementById('prov-km');
        if(sel) {
            const provinces = [...new Set(data.map(i => i[2]))].sort();
            provinces.forEach(p => {
                const o = document.createElement('option'); o.value = p; o.innerText = p; sel.appendChild(o);
            });
        }
    });
}

function renderKM(data) {
    const list = document.getElementById('list-km');
    if(!list) return;
    list.innerHTML = data.map(i => `
        <div class="km-card">
            <h3 style="color:#ffcc00; margin:0">${i[0]}</h3>
            <p style="font-size:0.8rem; margin:5px 0">PIC: ${i[3]} | Prov: ${i[2]}</p>
            <a href="${i[4]}" target="_blank" style="color:#ffcc00; text-decoration:none; font-size:0.8rem">Instagram</a>
        </div>
    `).join('');
}

window.filterKM = () => {
    const s = document.getElementById('search-km').value.toLowerCase();
    const p = document.getElementById('prov-km').value;
    const filtered = allKM.filter(i => i[0].toLowerCase().includes(s) && (p === "All" || i[2] === p));
    renderKM(filtered);
}

// --- EVENT & CHAT ---
window.showPage = (id) => {
    ['page-dashboard', 'page-event', 'page-chat'].forEach(p => {
        const el = document.getElementById(p);
        if(el) el.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

window.sendChat = () => {
    const input = document.getElementById('chat-input');
    const user = JSON.parse(localStorage.getItem('ffca_user'));
    if(input.value.trim()) {
        push(chatRef, { sender: user.nickname, text: input.value });
        input.value = "";
    }
}

onChildAdded(chatRef, (snapshot) => {
    const msg = snapshot.val();
    const box = document.getElementById('chat-box');
    if(!box) return;
    const div = document.createElement('div');
    const user = JSON.parse(localStorage.getItem('ffca_user'));
    div.className = `msg ${msg.sender === user.nickname ? 'sent' : 'received'}`;
    div.innerHTML = `<small><b>${msg.sender}</b></small><br>${msg.text}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
});

window.handleLogout = () => { localStorage.clear(); window.location.href = "index.html"; }

function initChart() {
    const ctx = document.getElementById('leaderChart');
    if(!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Solo', 'Gorontalo', 'Bandung', 'Jogja', 'Bekasi'],
            datasets: [{ label: 'Points', data: [151, 146, 146, 141, 131], backgroundColor: '#ffcc00' }]
        },
        options: { maintainAspectRatio: false, scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } } }
    });
}

// Jalankan otomatis saat halaman selesai dimuat
window.addEventListener('DOMContentLoaded', initDashboard);
