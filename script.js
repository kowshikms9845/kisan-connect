/* script.js (module) - Smart Farmer AI
Replace firebaseConfig placeholders below with your Firebase web app config.
Optionally set PAYEE_VPA and GEMINI_API_KEY.
*/

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyCk3pyd--cSFT79PVEs4PB4fzShRSk7ZyE",
    authDomain: "kisan-connect-9845.firebaseapp.com",
    projectId: "kisan-connect-9845",
    storageBucket: "kisan-connect-9845.firebasestorage.app",
    messagingSenderId: "8600269652",
    appId: "1:8600269652:web:8490f995252badeef10ec1"
  };

const GEMINI_API_KEY = "AIzaSyDmp7VCcjmY-I0sR8c4ChxcelFaneKIq8Q"; // optional
const PAYEE_VPA = "916364159350@waicici"; // optional UPI VPA for deeplink (merchant@upi)

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Localization strings
const STRINGS = {
en: { title:"Smart Farmer AI", subtitle:"Agriculture is the backbone of India.", guideTitle:"Quick guidance", guideText:"Register as farmer to upload crops; buyers browse and contact.", marketplace:"Marketplace" },
hi: { title:"स्मार्ट फ़ार्मर एआई", subtitle:"कृषि भारतीय अर्थव्यवस्था की रीढ़ है।", guideTitle:"त्वरित मार्गदर्शन", guideText:"किसान के रूप में पंजीकरण करें और फसल अपलोड करें; खरीदार ब्राउज़ कर सकते हैं।", marketplace:"बाज़ार" },
kn: { title:"ಸ್ಮಾರ್ಟ್ ಫಾರ್ಮರ್ ಎಐ", subtitle:"ಕೃಷಿ ಭಾರತದ ಅಡಿಲು ಕಂಬವಾಗಿದೆ.", guideTitle:"ತ್ವರಿತ ಮಾರ್ಗದರ್ಶನ", guideText:"ರೈತರಾಗಿ ನೋಂದಾಯಿಸಿ ಮತ್ತು ಬೆಳೆ ಅಪ್ಲೋಡ್ ಮಾಡಿ; ಖರೀದಿಸುವವರು ವೀಕ್ಷಿಸಬಹುದು.", marketplace:"ಮಾರುಕಟ್ಟೆ" }
};
let currentLang = localStorage.getItem('sf_lang') || 'en';

function applyLangAll(){
const langSelect = document.getElementById('langSelect');
if(langSelect) langSelect.value = currentLang;
const s = STRINGS[currentLang] || STRINGS.en;
const titleEl = document.getElementById('title'); if(titleEl) titleEl.innerText = s.title || '';
const subtitleEl = document.getElementById('subtitle'); if(subtitleEl) subtitleEl.innerText = s.subtitle || '';
const guideTitleEl = document.getElementById('guide-title'); if(guideTitleEl) guideTitleEl.innerText = s.guideTitle || '';
const guideTextEl = document.getElementById('guide-text'); if(guideTextEl) guideTextEl.innerText = s.guideText || '';
const marketTitleEl = document.getElementById('market-title'); if(marketTitleEl) marketTitleEl.innerText = s.marketplace || '';
}

function onAppReady(){
  const langSelect = document.getElementById('langSelect');
  if(langSelect){
    langSelect.value = currentLang;
    langSelect.addEventListener('change', e=>{
      currentLang = e.target.value;
      localStorage.setItem('sf_lang', currentLang);
      applyLangAll();
    });
  }
  applyLangAll();
  const ttsBtn = document.getElementById('btn-tts');
  if(ttsBtn) ttsBtn.addEventListener('click', ()=> speak(STRINGS[currentLang].guideText));
  initPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onAppReady);
} else {
  onAppReady();
}


// TTS
function speak(text){
if(!('speechSynthesis' in window)) return;
const u = new SpeechSynthesisUtterance(text);
u.lang = currentLang==='hi' ? 'hi-IN' : currentLang==='kn' ? 'kn-KN' : 'en-IN';
window.speechSynthesis.cancel();
window.speechSynthesis.speak(u);
}

function initPage(){
const path = location.pathname.split('/').pop();
if(path === '' || path === 'index.html') { loadMarketplacePreview(); }
else if (path === 'register.html') { attachRegister(); }
else if (path === 'login.html') { attachLogin(); }
else if (path === 'upload.html') { attachUpload(); }
else if (path === 'profile.html') { initProfilePage(); }
setTimeout(()=>{
attachFocusTTS();
attachHintTTS();
}, 100);
onAuthStateChanged(auth, user => { if(location.pathname.endsWith('profile.html') && !user) location.href='login.html'; });
}

// Auth: register / login / forgot
function attachRegister(){
const form = document.getElementById('registerForm');
const btn = document.getElementById('btnRegister');
if(!form || !btn) return;
const doRegister = async () => {
  const role = document.getElementById('role').value;
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim().replace(/\D/g, '');
  const locationName = document.getElementById('locationName').value.trim();
  const password = document.getElementById('password').value;
  const prefLang = document.getElementById('prefLang').value || 'en';
  if(!phone || phone.length !== 10){ alert('Please enter a valid 10-digit phone number'); return; }
  if(!name){ alert('Please enter your full name'); return; }
  if(!password || password.length < 6){ alert('Password must be at least 6 characters'); return; }
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phone', '==', phone));
  const existing = await getDocs(q);
  if(!existing.empty){
    alert('This phone number is already registered. Please login or reset your password.');
    location.href = 'login.html';
    return;
  }
  const syntheticEmail = phone + '@kisan-connect-9845.firebaseapp.com';
  try {
    const userCred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
    const uid = userCred.user.uid;
    await updateProfile(userCred.user, { displayName: name });
    await setDoc(doc(db, 'users', uid), { name, phone, role, locationName, languagePref: prefLang, email: syntheticEmail, createdAt: serverTimestamp() });
    alert('Account created successfully! Redirecting to profile.');
    location.href = 'profile.html';
  } catch(err){
    console.error(err);
    if(err.code === 'auth/email-already-in-use'){
      alert('This phone number is already registered in Firebase. Please login or reset your password.');
      location.href = 'login.html';
    } else {
      alert(err.message || 'Registration failed');
    }
  }
};
form.addEventListener('submit', async e => { e.preventDefault(); await doRegister(); });
btn.addEventListener('click', async e => { e.preventDefault(); await doRegister(); });
}

function attachLogin(){
const form = document.getElementById('loginForm');
const btn = document.getElementById('btnLogin');
if(!form || !btn) return;
const doLogin = async () => {
  const phone = document.getElementById('loginPhone').value.trim().replace(/\D/g, '');
  const password = document.getElementById('loginPassword').value;
  if(!phone || phone.length !== 10){ alert('Please enter a valid 10-digit phone number'); return; }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const snap = await getDocs(q);
    if(snap.empty){ alert('Phone number not found. Please register first.'); return; }
    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    const email = userData.email || '';
    if(!email){ const syntheticEmail = phone + '@kisan-connect-9845.firebaseapp.com'; await signInWithEmailAndPassword(auth, syntheticEmail, password); } else { await signInWithEmailAndPassword(auth, email, password); }
    location.href = 'profile.html';
  } catch(err){ console.error(err); alert('Login failed: ' + err.message); }
};
form.addEventListener('submit', async e => { e.preventDefault(); await doLogin(); });
btn.addEventListener('click', async e => { e.preventDefault(); await doLogin(); });
const forgotLink = document.getElementById('forgotPwd');
if(forgotLink) forgotLink.addEventListener('click', async (ev)=>{
  ev.preventDefault();
  const phone = prompt('Enter your 10-digit phone number for password reset:\n\nExample: 9876543210');
  if(!phone) return;
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if(!cleanPhone || cleanPhone.length !== 10){ alert('Please enter a valid 10-digit phone number'); return; }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', cleanPhone));
    const snap = await getDocs(q);
    if(snap.empty){ alert('Phone number not found.'); return; }
    const userDoc = snap.docs[0];
    const email = userDoc.data().email || (cleanPhone + '@kisan-connect-9845.firebaseapp.com');
    await sendPasswordResetEmail(auth, email);
    alert('Password reset email sent. Check your email to reset your password.');
  } catch(err){ console.error(err); alert('Failed to send reset email: ' + err.message); }
});
}

// Marketplace preview
async function loadMarketplacePreview(){
const grid = document.getElementById('market-grid') || document.getElementById('marketGrid');
if(!grid) return;
grid.innerHTML = '<div class="small">Loading...</div>';
try {
const cropsCol = collection(db, 'crops');
const q = query(cropsCol, orderBy('createdAt','desc'));
const snap = await getDocs(q);
grid.innerHTML = '';
snap.forEach(docSnap=>{
const d = docSnap.data();
if(!d || !d.cropName || !d.photoURL) return;
const e = createCropCard(d, docSnap.id);
grid.appendChild(e);
});
if(grid.children.length===0) grid.innerHTML = '<div class="small">No crops yet.</div>';
} catch(err){ console.error(err); grid.innerHTML = '<div class="small">Failed to load marketplace.</div>'; }
}

// Create crop card with Call/WhatsApp/View location and Pay button
function createCropCard(d, id){
const card = document.createElement('div'); card.className='crop-card';
card.innerHTML = `<img src="${escapeHtml(d.photoURL)}" alt="${escapeHtml(d.cropName)}"><div class="body"><strong>${escapeHtml(d.cropName)}</strong><div class="small">₹${escapeHtml(d.price)} • ${escapeHtml(d.quantity)}</div><div class="small">Seller: ${escapeHtml(d.farmerName || '')}</div><div style="display:flex;gap:8px;margin-top:8px"></div></div>`;
const actions = card.querySelector('.body > div:last-child');
if(d.farmerId){
getDoc(doc(db,'users', d.farmerId)).then(ud=>{
const u = ud.exists() ? ud.data() : null;
if(u && u.locationName){
const locName = document.createElement('div');
locName.className = 'small';
locName.innerText = `Location: ${u.locationName}`;
actions.parentElement.insertBefore(locName, actions);
}
if(u && u.phone){
const call = document.createElement('a'); call.className='btn small'; call.href = `tel:${encodeURIComponent(u.phone)}`; call.innerText='Call'; actions.appendChild(call);
const waNum = u.phone.replace(/\D/g,''); // remove symbols
const wa = document.createElement('a'); wa.className='btn small btn-outline'; wa.href = `https://wa.me/${waNum}`; wa.innerText='WhatsApp'; wa.target='_blank'; actions.appendChild(wa);
}
}).catch(e=>console.error(e));
}

// Pay button for buyers (simple demo + UPI deeplink if PAYEE_VPA set)
const payBtn = document.createElement('button'); payBtn.className='btn small'; payBtn.innerText='Pay / Buy';
payBtn.addEventListener('click', async ()=>{
const user = auth.currentUser;
if(!user){ alert('Please login as buyer to purchase'); location.href='login.html'; return; }
const amount = d.price;
const buyerConfirm = confirm(`Proceed to pay ₹${amount} for ${d.cropName}?`);
if(!buyerConfirm) return;
if(PAYEE_VPA){
const upi = `upi://pay?pa=${encodeURIComponent(PAYEE_VPA)}&pn=${encodeURIComponent(d.farmerName||'Farmer')}&am=${encodeURIComponent(amount)}&cu=INR`;
window.location.href = upi;
}
// Demo: record transaction as paid
try {
await addDoc(collection(db,'transactions'), { buyerId: user.uid, farmerId: d.farmerId||'', cropId: id, amount: Number(amount), timestamp: serverTimestamp(), status: 'paid' });
alert('Payment recorded (demo). Transaction saved.');
if(location.pathname.endsWith('profile.html')) loadTransactions();
} catch(err){ console.error(err); alert('Failed to save transaction'); }
});
actions.appendChild(payBtn);
return card;
}


// Upload flow
function attachUpload(){
const form = document.getElementById('uploadForm');
if(!form) return;
form.addEventListener('submit', handleUpload);
}

async function handleUpload(e){
e.preventDefault();
const user = auth.currentUser;
if(!user){ alert('Please login'); location.href='login.html'; return; }
const cropName = document.getElementById('cropName').value.trim();
const quantity = document.getElementById('quantity').value.trim();
const price = document.getElementById('price').value.trim();
const photoFiles = document.getElementById('photo').files;
const locationLink = document.getElementById('location').value.trim();
if(!photoFiles || photoFiles.length === 0){ alert('Select a photo'); return; }
const photoFile = photoFiles[0];
const path = `crops/${user.uid}/${Date.now()}_${photoFile.name}`;
const storageRef = sref(storage, path);
document.getElementById('uploadStatus').innerText = 'Uploading photo...';
try {
const snap = await uploadBytes(storageRef, photoFile);
const url = await getDownloadURL(snap.ref);
document.getElementById('uploadStatus').innerText = 'Saving crop info...';
await addDoc(collection(db,'crops'), { farmerId: user.uid, farmerName: user.displayName || user.email, cropName, photoURL: url, quantity, price, locationLink, createdAt: serverTimestamp() });
document.getElementById('uploadStatus').innerText = 'Uploaded successfully.';
form.reset();
} catch(err){ console.error(err); document.getElementById('uploadStatus').innerText = 'Upload failed.'; }
}

// Profile & My crops & Transactions
async function initProfilePage(){
const user = auth.currentUser;
if(!user){
onAuthStateChanged(auth, u => { if(u) initProfilePage(); else location.href='login.html'; });
return;
} document.getElementById('profileName').innerText = user.displayName || user.email;
const ud = await getDoc(doc(db,'users', user.uid));
if(ud.exists()) {
const data = ud.data();
document.getElementById('profileInfo').innerText = `Name: ${data.name || ''}\nPhone: ${data.phone || ''}\nRole: ${data.role || ''}`;
}
const logoutBtn = document.getElementById('btnLogout');
if(logoutBtn) logoutBtn.addEventListener('click', async ()=>{ await signOut(auth); location.href='index.html'; });
const uploadPageBtn = document.getElementById('btnUploadPage');
if(uploadPageBtn) uploadPageBtn.addEventListener('click', ()=> location.href='upload.html');

// My crops
const myGrid = document.getElementById('myCropsGrid');
myGrid.innerHTML = 'Loading...';
try {
const cropsCol = collection(db,'crops');
const q = query(cropsCol, where('farmerId','==', user.uid), orderBy('createdAt','desc'));
const snap = await getDocs(q);
myGrid.innerHTML = '';
snap.forEach(docSnap=>{
const d = docSnap.data();
const card = document.createElement('div'); card.className='crop-card';
card.innerHTML = `<img src="${escapeHtml(d.photoURL)}"><div class="body"><strong>${escapeHtml(d.cropName)}</strong><div class="small">₹${escapeHtml(d.price)} • ${escapeHtml(d.quantity)}</div><div class="small">${d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString() : ''}</div></div>`;
const del = document.createElement('button'); del.className='btn btn-outline small'; del.innerText='Delete';
del.addEventListener('click', async ()=> {
if(!confirm('Delete this crop?')) return;
try { await deleteDoc(doc(db,'crops', docSnap.id)); card.remove(); } catch(err){ console.error(err); alert('Delete failed'); }
});
card.querySelector('.body').appendChild(del);
myGrid.appendChild(card);
});
if(myGrid.children.length===0) myGrid.innerHTML = '<div class="small">You have no crops yet.</div>';
} catch(err){ console.error(err); myGrid.innerHTML = '<div class="small">Failed to load your crops.</div>'; }

await loadTransactions();
loadMarketplacePreview();
}

// Transactions: list and download receipt
async function loadTransactions(){
const list = document.getElementById('transactionsList');
if(!list) return;
list.innerHTML = 'Loading...';
const user = auth.currentUser;
if(!user){ list.innerHTML = '<div class="small">Login to view transactions.</div>'; return; }
try {
const txCol = collection(db,'transactions');
const qBuyer = query(txCol, where('buyerId','==', user.uid), orderBy('timestamp','desc'));
const qSeller = query(txCol, where('farmerId','==', user.uid), orderBy('timestamp','desc'));
const snapB = await getDocs(qBuyer);
const snapS = await getDocs(qSeller);
list.innerHTML = '';
const combined = [];
snapB.forEach(s=> combined.push(s));
snapS.forEach(s=> combined.push(s));
if(combined.length===0){ list.innerHTML = '<div class="small">No transactions yet.</div>'; return; }
combined.sort((a,b)=> {
  const aTs = a.data().timestamp && a.data().timestamp.toDate ? a.data().timestamp.toDate().getTime() : 0;
  const bTs = b.data().timestamp && b.data().timestamp.toDate ? b.data().timestamp.toDate().getTime() : 0;
  return bTs - aTs;
});
combined.forEach(docSnap=>{
const d = docSnap.data();
const el = document.createElement('div'); el.className='transaction-card';
const time = d.timestamp && d.timestamp.toDate ? d.timestamp.toDate().toLocaleString() : '';
el.innerHTML = `<div><strong>₹${escapeHtml(d.amount)} • ${escapeHtml(d.status)}</strong><div class="small">Buyer: ${escapeHtml(d.buyerId)}</div><div class="small">Farmer: ${escapeHtml(d.farmerId)}</div><div class="small">${time}</div></div>`;
const btnWrap = document.createElement('div');
const dl = document.createElement('button'); dl.className='btn small'; dl.innerText='Download Receipt';
dl.addEventListener('click', ()=> downloadReceipt(docSnap.id, d));
btnWrap.appendChild(dl);
el.appendChild(btnWrap);
list.appendChild(el);
});
} catch(err){ console.error(err); list.innerHTML = '<div class="small">Failed to load transactions.</div>'; }
}

function downloadReceipt(id, data){
const w = window.open('', '_blank');
const time = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : new Date().toLocaleString();
w.document.write(`<html><head><title>Receipt ${escapeHtml(id)}</title><style>body{font-family:Arial;padding:20px} .head{color:#2e7d32}</style></head><body><h2 class="head">Smart Farmer AI - Receipt</h2><p><strong>Transaction:</strong> ${escapeHtml(id)}</p><p><strong>Amount:</strong> ₹${escapeHtml(data.amount)}</p><p><strong>Status:</strong> ${escapeHtml(data.status)}</p><p><strong>Buyer:</strong> ${escapeHtml(data.buyerId)}</p><p><strong>Farmer:</strong> ${escapeHtml(data.farmerId)}</p><p><strong>Time:</strong> ${escapeHtml(time)}</p><hr><p>Thank you for using Smart Farmer AI.</p></body></html>`);
w.document.close();
w.print();
}

// TTS on focus for inputs
function attachFocusTTS(){
document.querySelectorAll('input,select,button').forEach(el=>{
el.addEventListener('focus', ()=>{
let label = document.querySelector(`label[for="${el.id}"]`);
if(!label && el.previousElementSibling && el.previousElementSibling.tagName.toLowerCase()==='label') label = el.previousElementSibling;
const text = label ? label.innerText : el.placeholder || el.getAttribute('aria-label') || '';
if(text) speak(text);
});
});
}

// Hint TTS buttons
function attachHintTTS(){
document.querySelectorAll('.hint-tts').forEach(b=>{
b.addEventListener('click', ()=> speak(b.dataset.text || b.innerText));
});
}

// Expose small helper
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }