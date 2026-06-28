'use strict';

const API   = window.location.origin;
let TOKEN   = localStorage.getItem('softora_token');
let LANG    = localStorage.getItem('softora_lang') || 'ar';
let BILLING = 'monthly';

// ══════════════ INIT ══════════════
document.addEventListener('DOMContentLoaded', () => {
    applyLang();
    updateNavLang();
    initNavbar();
    if (TOKEN) updateNavForUser();
});

// ══════════════ LANG ══════════════
function toggleLang() {
    LANG = LANG === 'ar' ? 'en' : 'ar';
    localStorage.setItem('softora_lang', LANG);
    document.documentElement.lang = LANG;
    document.documentElement.dir  = LANG === 'ar' ? 'rtl' : 'ltr';
    applyLang();
    updateNavLang();
}

function applyLang() {
    document.querySelectorAll('[data-ar]').forEach(el => {
        const txt = el.getAttribute(`data-${LANG}`);
        if (txt) el.innerHTML = txt;
    });
    document.querySelector('.lang-btn').textContent = LANG === 'ar' ? 'EN' : 'عر';
    // تبديل محتوى الصفحات القانونية
    document.querySelectorAll('.legal-ar').forEach(el => el.style.display = LANG==='ar'?'block':'none');
    document.querySelectorAll('.legal-en').forEach(el => el.style.display = LANG==='en'?'block':'none');
}

function updateNavLang() {
    document.documentElement.lang = LANG;
    document.documentElement.dir  = LANG === 'ar' ? 'rtl' : 'ltr';
}

// ══════════════ NAVBAR ══════════════
function initNavbar() {
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', scrollY > 20);
    });
    // active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let cur = '';
        sections.forEach(s => { if (scrollY >= s.offsetTop - 100) cur = s.id; });
        document.querySelectorAll('.nav-link').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#'+cur);
        });
    });
}

function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('open');
}

// ══════════════ MODALS ══════════════
function showModal(id) { document.getElementById(id)?.classList.add('open'); }
function hideModal(id) { document.getElementById(id)?.classList.remove('open'); }
function switchModal(from, to) { hideModal(from); showModal(to); }

document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ══════════════ BILLING ══════════════
function switchBilling(type) {
    BILLING = type;
    document.getElementById('btn-monthly').classList.toggle('active', type==='monthly');
    document.getElementById('btn-yearly').classList.toggle('active', type==='yearly');
    document.querySelectorAll('.price-monthly').forEach(el => el.style.display = type==='monthly'?'block':'none');
    document.querySelectorAll('.price-yearly').forEach(el  => el.style.display = type==='yearly'?'block':'none');
}

// ══════════════ PLAN SELECTION ══════════════
function selectPlan(plan) {
    if (!TOKEN) { showModal('register-modal'); return; }
    toast(LANG==='ar'?`جاري معالجة اشتراك ${plan}...`:`Processing ${plan} subscription...`);
    // هنا يتم التوجيه لبوابة الدفع
}

// ══════════════ AUTH ══════════════
async async function doLogin() {
    const email    = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-pass').value;
    const errEl    = document.getElementById('login-err');
    errEl.style.display = 'none';
    if (!email||!password) { showErr(errEl, LANG==='ar'?'أدخل البريد وكلمة المرور':'Enter email and password'); return; }
    try {
        const r = await post('/api/auth/login', {email,password});
        TOKEN = r.token;
        localStorage.setItem('softora_token', TOKEN);
        localStorage.setItem('softora_user', JSON.stringify(r.user));
        hideModal('login-modal');
        updateNavForUser(r.user);
        showDashboard(r.user);
        toast(LANG==='ar'?'مرحباً بك 👋':'Welcome back 👋');
    } catch(e) { showErr(errEl, e.message); }
}

async async function doRegister() {
    const name     = document.getElementById('r-name').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-pass').value;
    const errEl    = document.getElementById('reg-err');
    errEl.style.display = 'none';
    if (!name||!email||!password) { showErr(errEl, LANG==='ar'?'جميع الحقول مطلوبة':'All fields required'); return; }
    if (password.length<8) { showErr(errEl, LANG==='ar'?'كلمة المرور 8 أحرف على الأقل':'Password min 8 chars'); return; }
    try {
        const r = await post('/api/auth/register', {name,email,password,lang:LANG});
        TOKEN = r.token;
        localStorage.setItem('softora_token', TOKEN);
        localStorage.setItem('softora_user', JSON.stringify(r.user));
        hideModal('register-modal');
        updateNavForUser(r.user);
        showDashboard(r.user);
        toast(LANG==='ar'?'تم إنشاء حسابك بنجاح 🎉':'Account created successfully 🎉');
    } catch(e) { showErr(errEl, e.message); }
}

function logout() {
    TOKEN = null;
    localStorage.removeItem('softora_token');
    localStorage.removeItem('softora_user');
    location.reload();
}

function updateNavForUser(user) {
    user = user || JSON.parse(localStorage.getItem('softora_user')||'{}');
    const actions = document.querySelector('.nav-actions');
    if (!actions||!user.name) return;
    const loginBtn = actions.querySelector('.btn-outline');
    const regBtn   = actions.querySelector('.btn-primary-nav');
    if (loginBtn) loginBtn.textContent = user.name.charAt(0).toUpperCase() + user.name.slice(1,12);
    if (loginBtn) { loginBtn.onclick = () => showDashboard(user); loginBtn.className = 'btn-primary-nav'; }
    if (regBtn)   { regBtn.textContent = LANG==='ar'?'تسجيل الخروج':'Logout'; regBtn.onclick = logout; regBtn.className = 'btn-outline'; }
}

function showDashboard(user) {
    user = user || JSON.parse(localStorage.getItem('softora_user')||'{}');
    if (!user.name) return;
    document.getElementById('dash-name').textContent  = user.name;
    document.getElementById('dash-email').textContent = user.email;
    document.getElementById('dash-avatar').textContent = user.name.charAt(0).toUpperCase();
    showModal('dashboard-modal');
}

// ══════════════ CONTACT ══════════════
document.getElementById('contact-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('contact-msg');
    msg.style.display = 'none';
    try {
        await post('/api/contact', {
            name:    document.getElementById('c-name').value.trim(),
            email:   document.getElementById('c-email').value.trim(),
            subject: document.getElementById('c-subject').value.trim(),
            message: document.getElementById('c-message').value.trim(),
        });
        msg.style.cssText = 'display:block;color:#059669;font-weight:600;';
        msg.textContent   = LANG==='ar'?'✅ تم إرسال رسالتك بنجاح':'✅ Message sent successfully';
        e.target.reset();
    } catch(err) {
        msg.style.cssText = 'display:block;color:#dc2626;';
        msg.textContent   = err.message;
    }
});

// ══════════════ HELPERS ══════════════
async function post(url, data) {
    const r = await fetch(API+url, {
        method:'POST',
        headers:{'Content-Type':'application/json', ...(TOKEN?{'Authorization':'Bearer '+TOKEN}:{})},
        body: JSON.stringify(data)
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'خطأ في الاتصال');
    return d;
}

function showErr(el, msg) { el.style.display='block'; el.textContent=msg; }

// تصدير الدوال للـ window (للاستخدام من HTML)
window.showModal   = showModal;
window.hideModal   = hideModal;
window.switchModal = switchModal;
window.doLogin     = doLogin;
window.doRegister  = doRegister;
window.logout      = logout;
window.toggleLang  = toggleLang;
window.toggleMenu  = toggleMenu;
window.switchBilling = switchBilling;
window.selectPlan  = selectPlan;
window.showDashboard = showDashboard;

function toast(msg, type='info') {
    const t = document.getElementById('site-toast');
    const colors = {info:'#1f2937', success:'#059669', error:'#dc2626'};
    t.style.background = colors[type]||colors.info;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(()=>t.style.display='none', 3500);
}
