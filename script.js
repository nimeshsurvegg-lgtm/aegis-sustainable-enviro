let userData = {};
let footprintChartInstance = null;

// Check for saved user on page load (LocalStorage implementation)
window.onload = () => {
  const savedUser = localStorage.getItem('aegisUser');
  if (savedUser) {
    userData = JSON.parse(savedUser);
    processLogin('user', true);
  }
};

// Dark/Light Mode
function toggleTheme() {
  document.body.classList.toggle('light-mode');
}

// Navigation
const tabs = document.querySelectorAll('nav.tabs button');
const screens = document.querySelectorAll('.screen');
function goTo(id){
  tabs.forEach(b=>b.classList.toggle('active', b.dataset.screen===id));
  screens.forEach(s=>s.classList.toggle('active', s.id===id));
  window.scrollTo({top:0, behavior:'smooth'});
  
  // Render chart if we are navigating to dashboard and it exists
  if(id === 'dashboard' && Object.keys(userData).length > 0) {
    renderChart();
  }
}
tabs.forEach(b=>b.addEventListener('click', ()=>goTo(b.dataset.screen)));

// Hero Drag Slider
const toxic = document.querySelector('.side-toxic');
const line = document.getElementById('dragLine');
const handle = document.getElementById('dragHandle');
let dragging = false;
function setSplit(pct){
  pct = Math.min(88, Math.max(12, pct));
  toxic.style.width = pct+'%'; line.style.left = pct+'%'; handle.style.left = pct+'%';
}
setSplit(50);
window.addEventListener('mousemove', e => { if(dragging){ setSplit((e.clientX/window.innerWidth)*100); }});
window.addEventListener('mouseup', () => dragging=false);
document.getElementById('dragRail').addEventListener('mousedown', e=>{ dragging=true; setSplit((e.clientX/window.innerWidth)*100); });

// Modals & Auth State
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Auto-Detect Geolocation City
function autoDetectCity() {
  const cityInput = document.getElementById('uCity');
  cityInput.value = "Detecting...";
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      try {
        // Using free reverse geocoding
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        cityInput.value = data.address.city || data.address.town || data.address.state_district || "Unknown Location";
      } catch (e) {
        cityInput.value = "Failed to fetch";
      }
    }, () => {
      cityInput.value = "Permission denied";
    });
  } else {
    cityInput.value = "Not supported by browser";
  }
}

document.getElementById('surveyForm').addEventListener('submit', function(e) {
  e.preventDefault();
  userData = {
    name: document.getElementById('uName').value,
    age: document.getElementById('uAge').value,
    city: document.getElementById('uCity').value,
    commute: document.getElementById('uCommute').value,
    diet: document.getElementById('uDiet').value,
    recycle: document.getElementById('uRecycle').value
  };
  closeModal('surveyModal');
  openModal('authModal');
});

function processLogin(type, isReload = false) {
  closeModal('authModal');
  
  // Logic for Score Generation
  let score = 100;
  if(userData.commute === 'car') score -= 30;
  if(userData.commute === 'bike') score -= 15;
  if(userData.commute === 'transit') score += 10;
  
  if(userData.diet === 'meat') score -= 25;
  if(userData.diet === 'vegan') score += 20;

  if(userData.recycle === 'poor') score -= 15;

  // Constrain score 0-100
  score = Math.max(0, Math.min(100, score));
  
  // LocalStorage implementation
  if (type === 'user') {
    localStorage.setItem('aegisUser', JSON.stringify(userData));
    document.getElementById('logoutBtn').style.display = 'block';
  }

  // Update DOM
  document.getElementById('dashScoreVal').innerText = score;
  document.getElementById('dashScoreVal').style.color = score > 60 ? 'var(--green-soft)' : 'var(--amber)';
  
  document.getElementById('headerName').innerText = type === 'guest' ? 'Guest' : userData.name;
  document.getElementById('headerAvatar').innerText = type === 'guest' ? 'G' : userData.name.charAt(0);
  
  if(type === 'user') {
    document.getElementById('profName').innerText = userData.name;
  } else {
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('profName').innerText = 'Guest (Unsaved)';
  }

  // Map Updates
  if (userData.city) {
    document.getElementById('mapCityLabel').innerText = userData.city.toUpperCase();
    document.getElementById('mapCityEyebrow').innerText = userData.city;
  }
  
  // Profile Updates
  document.getElementById('profAge').innerText = userData.age || '--';
  document.getElementById('profCity').innerText = userData.city || '--';
  document.getElementById('profCommute').innerText = userData.commute || '--';
  document.getElementById('profDiet').innerText = userData.diet || '--';
  document.getElementById('profRank').innerText = score > 70 ? 'Rank: Eco Warrior' : 'Rank: Beginner';
  
  document.getElementById('scoreFeedback').innerHTML = `Based on your profile, your biggest impact is your <b>${userData.commute}</b> commute and <b>${userData.diet}</b> diet.`;

  if (!isReload) {
    goTo('dashboard');
  }
}

function logout() {
  userData = {};
  localStorage.removeItem('aegisUser');
  document.getElementById('headerName').innerText = 'Guest';
  document.getElementById('headerAvatar').innerText = '?';
  document.getElementById('logoutBtn').style.display = 'none';
  
  // Reset Profile UI
  document.getElementById('profName').innerText = 'Guest';
  document.getElementById('profAge').innerText = '--';
  document.getElementById('profCity').innerText = '--';
  document.getElementById('profCommute').innerText = '--';
  document.getElementById('profDiet').innerText = '--';
  document.getElementById('dashScoreVal').innerText = '--';
  document.getElementById('scoreFeedback').innerHTML = 'Complete the onboarding to see your dynamic breakdown here.';

  if (footprintChartInstance) { footprintChartInstance.destroy(); }
  
  goTo('hero');
}

// Chart.js Implementation
function renderChart() {
  if (footprintChartInstance) { footprintChartInstance.destroy(); } // Prevent duplicates

  const ctx = document.getElementById('footprintChart').getContext('2d');
  
  // Generate pseudo-random data based on commute
  const baseVal = userData.commute === 'car' ? 20 : (userData.commute === 'walk' ? 2 : 8);
  const dataPoints = [baseVal+2, baseVal-1, baseVal+4, baseVal, baseVal-2, baseVal-1, baseVal+1];

  footprintChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Est. Daily CO2 (kg)',
        data: dataPoints,
        borderColor: '#3ddc84',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(61, 220, 132, 0.1)',
        pointBackgroundColor: '#4fd6e0'
      }]
    },
    options: {
      responsive: true,
      plugins: { 
        legend: { display: false } 
      },
      scales: { 
        y: { display: false, beginAtZero: true }, 
        x: { grid: { display: false } } 
      }
    }
  });
}

// Mission Confetti Logic
function completeMission(element) {
  const isDone = element.classList.toggle('done');
  const checkmark = element.querySelector('.quest-check');
  
  if (isDone) {
    checkmark.innerText = '✓';
    checkmark.style.background = 'var(--green)';
    checkmark.style.color = '#04140b';
    
    // Trigger canvas confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3ddc84', '#4fd6e0', '#f5b25c']
    });
  } else {
    checkmark.innerText = '';
    checkmark.style.background = 'transparent';
  }
}
