/**
 * ===================================================================
 * AEGIS 3.0 — IMMERSIVE VISUAL EXPERIENCE MASTER JAVASCRIPT
 * Living Environmental Intelligence Ecosystem | Mission Swachh-City
 * ===================================================================
 */

'use strict';

/* ===================================================================
   1. DATABASE & PERSISTENCE LAYER — AegisDB 2.0
=================================================================== */
const AegisDB = (function() {
  const DB_PREFIX = 'aegis_v2_';
  const K = {
    AUTH: DB_PREFIX + 'auth',
    PROFILE: DB_PREFIX + 'profile',
    THEME: DB_PREFIX + 'theme',
    ACTIVITIES: DB_PREFIX + 'activities',
    SCORE_HISTORY: DB_PREFIX + 'score_history',
    MISSIONS: DB_PREFIX + 'missions',
    REWARDS: DB_PREFIX + 'rewards',
    GOALS: DB_PREFIX + 'goals',
    POSTS: DB_PREFIX + 'posts',
    SAVED_GYAN: DB_PREFIX + 'saved_gyan',
    ADMIN: DB_PREFIX + 'admin',
    ALERTS: DB_PREFIX + 'alerts'
  };

  function read(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    getAuth: () => read(K.AUTH, null),
    setAuth: (val) => write(K.AUTH, val),
    clearAuth: () => localStorage.removeItem(K.AUTH),

    getProfile: () => read(K.PROFILE, null),
    setProfile: (val) => write(K.PROFILE, val),

    getTheme: () => localStorage.getItem(K.THEME) || 'dark',
    setTheme: (val) => localStorage.setItem(K.THEME, val),

    getActivities: () => read(K.ACTIVITIES, []),
    setActivities: (val) => write(K.ACTIVITIES, val),

    getScoreHistory: () => read(K.SCORE_HISTORY, []),
    setScoreHistory: (val) => write(K.SCORE_HISTORY, val),

    getMissions: () => read(K.MISSIONS, {}),
    setMissions: (val) => write(K.MISSIONS, val),

    getRewards: () => read(K.REWARDS, []),
    setRewards: (val) => write(K.REWARDS, val),

    getGoals: () => read(K.GOALS, []),
    setGoals: (val) => write(K.GOALS, val),

    getPosts: () => read(K.POSTS, null),
    setPosts: (val) => write(K.POSTS, val),

    getSavedGyan: () => read(K.SAVED_GYAN, []),
    setSavedGyan: (val) => write(K.SAVED_GYAN, val),

    getAdminData: () => read(K.ADMIN, { reports: [], audit: [] }),
    setAdminData: (val) => write(K.ADMIN, val),

    getAlerts: () => read(K.ALERTS, null),
    setAlerts: (val) => write(K.ALERTS, val),

    exportAll: () => {
      const data = {};
      Object.keys(K).forEach(k => { data[k] = read(K[k]); });
      data.exportedAt = new Date().toISOString();
      data.version = '3.0.0';
      return data;
    },

    importAll: (json) => {
      try {
        if (!json || typeof json !== 'object') return false;
        Object.keys(K).forEach(k => { if (json[k] !== undefined) write(K[k], json[k]); });
        return true;
      } catch (e) {
        return false;
      }
    },

    resetAll: () => {
      Object.values(K).forEach(key => localStorage.removeItem(key));
    }
  };
})();

/* ===================================================================
   2. GLOBAL STATE, TOASTS & UTILITIES
=================================================================== */
let sessionUser = null;
let activeScreen = 'hero';
let activeChartDays = 7;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function showToast(msg, isAlert = false) {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast';
  if (isAlert) {
    t.style.borderColor = 'var(--amber)';
    t.style.color = 'var(--amber)';
  }
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ===================================================================
   3. NAVIGATION & SPATIAL SCREEN ROUTER
=================================================================== */
function goTo(screenId) {
  const target = document.getElementById(screenId);
  if (!target) return;

  activeScreen = screenId;

  // Update desktop navigation tabs
  document.querySelectorAll('nav.tabs button').forEach(b => {
    const isCur = b.dataset.screen === screenId;
    b.classList.toggle('active', isCur);
    b.setAttribute('aria-selected', isCur ? 'true' : 'false');
  });

  // Update mobile bottom bar
  document.querySelectorAll('.mobile-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screenId);
  });

  // Switch visible screen
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('active', s.id === screenId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 3D & WebGL Scene Visibility Management (Conserve GPU)
  if (screenId === 'hero') {
    startHeroPlanetAnimation();
    stopCity3dAnimation();
    stopEarthGlobeAnimation();
  } else if (screenId === 'city') {
    stopHeroPlanetAnimation();
    startCity3dAnimation();
    stopEarthGlobeAnimation();
  } else if (screenId === 'globe') {
    stopHeroPlanetAnimation();
    stopCity3dAnimation();
    startEarthGlobeAnimation();
  } else {
    stopHeroPlanetAnimation();
    stopCity3dAnimation();
    stopEarthGlobeAnimation();
  }

  // Lifecycle screen callbacks
  if (screenId === 'map') {
    onMapScreenEnter();
  } else if (screenId === 'dashboard') {
    renderDashboard();
  } else if (screenId === 'activities') {
    renderActivityHistory();
  } else if (screenId === 'passport') {
    renderPassportScreen();
  } else if (screenId === 'profile') {
    renderProfile();
  } else if (screenId === 'feed') {
    renderGyanFeed();
  } else if (screenId === 'community') {
    renderCommunityFeed();
  } else if (screenId === 'missions') {
    renderMissions();
  }
}

// Bind desktop tab buttons
document.querySelectorAll('nav.tabs button').forEach(btn => {
  btn.addEventListener('click', () => goTo(btn.dataset.screen));
});

/* ===================================================================
   4. THEME MANAGEMENT (DARK / LIGHT THEME ENGINE)
=================================================================== */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
  AegisDB.setTheme(theme);

  // Switch map tiles dynamically to match theme
  if (leafletMap && currentTileLayer) {
    leafletMap.removeLayer(currentTileLayer);
    currentTileLayer = createBaseMapTileLayer(theme);
    currentTileLayer.addTo(leafletMap);
  }
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(cur);
}

/* ===================================================================
   5. AUTHENTICATION (DEMO OTP & GUEST MODE)
=================================================================== */
let pendingOtpObj = null;

function renderAuthState() {
  const container = document.getElementById('userAuthBadge');
  if (!container) return;
  container.innerHTML = '';

  if (!sessionUser) {
    const btn = document.createElement('button');
    btn.className = 'cta sm';
    btn.textContent = 'Sign In';
    btn.onclick = openAuthModal;
    container.appendChild(btn);
  } else if (sessionUser.mode === 'guest') {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '8px';
    wrap.innerHTML = `
      <span class="user-points-badge" style="color:var(--amber);">👤 Guest Mode</span>
      <button class="cta ghost sm" onclick="openAuthModal()">Register</button>
    `;
    container.appendChild(wrap);
  } else {
    const profile = AegisDB.getProfile() || {};
    const name = profile.name || sessionUser.phone || 'Citizen';
    const avatar = profile.avatar || '🧑‍🚀';
    const pts = profile.totalPoints || 0;

    const pill = document.createElement('div');
    pill.className = 'user-profile-btn';
    pill.onclick = () => goTo('profile');
    pill.title = 'View Citizen Profile';
    pill.innerHTML = `
      <div class="user-avatar-tiny">${avatar}</div>
      <span>${name}</span>
      <span class="user-points-badge">${pts} pts</span>
    `;
    container.appendChild(pill);
  }

  refreshJoinMissionButton();
}

function openAuthModal() {
  document.getElementById('authOverlay').classList.remove('hide');
  authGoStep('authStepPhone');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.add('hide');
}

function authGoStep(id) {
  document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function authSendOtp(isResend = false) {
  const input = document.getElementById('authPhoneInput');
  const phone = input.value.trim();
  const err = document.getElementById('authPhoneErr');

  if (!/^\d{10}$/.test(phone)) {
    if (err) err.textContent = 'Please enter a valid 10-digit Indian phone number.';
    return;
  }
  if (err) err.textContent = '';

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  pendingOtpObj = { phone, otp, time: Date.now() };

  document.getElementById('authPhoneDisplay').textContent = '+91 ' + phone;
  document.getElementById('authDemoOtpHint').textContent = `(Demo OTP: ${otp})`;
  document.querySelectorAll('.otp-d').forEach(i => (i.value = ''));

  authGoStep('authStepOtp');
  const firstOtp = document.querySelector('.otp-d');
  if (firstOtp) firstOtp.focus();

  showToast(isResend ? 'OTP resent.' : `OTP dispatched to +91 ${phone}`);
}

function authVerifyOtp() {
  const digits = Array.from(document.querySelectorAll('.otp-d')).map(i => i.value).join('');
  const err = document.getElementById('authOtpErr');

  if (digits.length !== 4) {
    if (err) err.textContent = 'Enter all 4 digits.';
    return;
  }

  if (!pendingOtpObj || digits !== pendingOtpObj.otp) {
    if (err) err.textContent = 'Incorrect verification code.';
    return;
  }

  sessionUser = { mode: 'phone', phone: pendingOtpObj.phone };
  AegisDB.setAuth(sessionUser);

  let profile = AegisDB.getProfile() || {};
  profile.phone = pendingOtpObj.phone;
  profile.name = document.getElementById('authName').value.trim() || profile.name || 'Citizen';
  profile.age = document.getElementById('authAge').value || profile.age || '18-24';
  profile.city = document.getElementById('authCity').value.trim() || profile.city || 'Mumbai';
  profile.avatar = profile.avatar || '🧑‍🚀';
  profile.totalPoints = profile.totalPoints || 150;
  profile.streak = profile.streak || { current: 1, longest: 1, lastActive: new Date().toISOString() };
  if (profile.onboarded === undefined) profile.onboarded = false;

  AegisDB.setProfile(profile);
  closeAuthModal();
  renderAuthState();
  showToast(`Welcome back, ${profile.name}!`);

  if (!profile.onboarded) {
    openOnboarding();
  } else {
    goTo('dashboard');
  }
}

function authContinueGuest() {
  sessionUser = { mode: 'guest' };
  closeAuthModal();
  renderAuthState();
  showToast('Operating in guest session.');
  openOnboarding();
}

function doLogout() {
  sessionUser = null;
  AegisDB.clearAuth();
  renderAuthState();
  showToast('Logged out.');
  goTo('hero');
}

// Auto-advance OTP inputs
document.addEventListener('input', (e) => {
  if (e.target && e.target.classList.contains('otp-d')) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 1);
    if (e.target.value && e.target.nextElementSibling && e.target.nextElementSibling.classList.contains('otp-d')) {
      e.target.nextElementSibling.focus();
    }
  }
});

function refreshJoinMissionButton() {
  const btn = document.getElementById('joinMissionBtn');
  if (!btn) return;
  const profile = AegisDB.getProfile();
  const onboarded = sessionUser && sessionUser.mode === 'phone' && profile && profile.onboarded;
  btn.textContent = onboarded ? '📊 View Citizen Dashboard' : '🚀 Enter Aegis Dashboard';
}

function handleJoinMission() {
  const profile = AegisDB.getProfile();
  if (sessionUser && sessionUser.mode === 'phone' && profile && profile.onboarded) {
    goTo('dashboard');
  } else {
    openOnboarding();
  }
}

/* ===================================================================
   6. ONBOARDING & CARBON ASSESSMENT ENGINE
=================================================================== */
const obState = {
  name: '', age: '18-24', city: 'Mumbai',
  commute: 'walk_cycle', dist: 3, fuel: 'petrol', elec: 0,
  household: 1, diet: 'vegetarian', waste: 'rare', recycle: 'always'
};

function openOnboarding() {
  const modal = document.getElementById('onboarding');
  if (modal) modal.classList.remove('hide');
  obGoStep('obStepCommute');
}

function closeOnboarding() {
  const modal = document.getElementById('onboarding');
  if (modal) modal.classList.add('hide');
  refreshJoinMissionButton();
  goTo('dashboard');
}

function obGoStep(id) {
  document.querySelectorAll('#onboarding .auth-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function setupChipGrid(gridId, stateKey, callback) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      obState[stateKey] = btn.dataset.v;
      if (callback) callback(btn.dataset.v);
    });
  });
}

setupChipGrid('obCommuteGrid', 'commute', (v) => {
  const fuelWrap = document.getElementById('obFuelWrap');
  if (fuelWrap) {
    fuelWrap.style.display = (v === 'bike' || v === 'car' || v === 'carpool') ? 'block' : 'none';
  }
});
setupChipGrid('obDistGrid', 'dist');
setupChipGrid('obFuelGrid', 'fuel');
setupChipGrid('obElecGrid', 'elec');
setupChipGrid('obHouseholdGrid', 'household');
setupChipGrid('obDietGrid', 'diet');
setupChipGrid('obWasteGrid', 'waste');
setupChipGrid('obRecycleGrid', 'recycle');

function obNext(stepNum) {
  if (stepNum === 2) obGoStep('obStepDiet');
  else if (stepNum === 3) runOnboardingCalculation();
}

function obBack(stepId) {
  obGoStep(stepId);
}

function computeBharatCarbonScore(params) {
  const commuteWeights = { walk_cycle: 25, metro: 22, rickshaw: 14, bike: 12, carpool: 11, car: 5 };
  let cScore = commuteWeights[params.commute] ?? 15;
  const dist = parseInt(params.dist, 10) || 5;
  if (dist > 25 && params.commute !== 'walk_cycle') cScore = Math.max(3, cScore - 6);
  else if (dist > 10 && params.commute !== 'walk_cycle') cScore = Math.max(4, cScore - 3);

  const acHours = parseInt(params.elec, 10) || 0;
  const household = parseInt(params.household, 10) || 1;
  const perCapitaAc = acHours / household;
  let eScore = Math.round(clamp(25 - perCapitaAc * 3.5, 5, 25));

  const dietWeights = { vegan: 25, vegetarian: 21, omnivore: 14, heavy_meat: 6 };
  const dScore = dietWeights[params.diet] ?? 16;

  const wasteFactors = { rare: 13, weekly: 8, often: 3 };
  const recycleFactors = { always: 12, sometimes: 7, never: 2 };
  const wScore = (wasteFactors[params.waste] || 8) + (recycleFactors[params.recycle] || 7);

  const totalScore = clamp(Math.round(cScore + eScore + dScore + wScore), 12, 98);
  const estAnnualTonnes = +(4.8 - (totalScore / 100) * 3.2).toFixed(2);

  return {
    score: totalScore,
    estTonnes: estAnnualTonnes,
    breakdown: [
      { label: 'Commute & Mobility', value: Math.round((cScore / 25) * 100) },
      { label: 'Household & AC Grid', value: Math.round((eScore / 25) * 100) },
      { label: 'Diet & Food Sourcing', value: Math.round((dScore / 25) * 100) },
      { label: 'Waste Segregation & 3Rs', value: Math.round((wScore / 25) * 100) }
    ]
  };
}

function runOnboardingCalculation() {
  obGoStep('obStepLoading');
  const city = obState.city || 'Mumbai';
  const lbl = document.getElementById('obLoadingLbl');
  if (lbl) lbl.textContent = `Calibrating emissions with ${city} regional baseline…`;

  setTimeout(() => {
    const result = computeBharatCarbonScore(obState);

    const cityEl = document.getElementById('obResultCity');
    if (cityEl) cityEl.textContent = city.toUpperCase();

    const scoreEl = document.getElementById('obCarbonScoreResult');
    if (scoreEl) scoreEl.textContent = result.score;

    const bdWrap = document.getElementById('obScoreBreakdown');
    if (bdWrap) {
      bdWrap.innerHTML = '';
      result.breakdown.forEach(item => {
        const row = document.createElement('div');
        row.className = 'sb-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.marginBottom = '8px';
        row.style.fontSize = '12.5px';
        row.innerHTML = `
          <span style="flex:0 0 140px; color:var(--text-secondary);">${item.label}</span>
          <div style="flex:1; height:8px; background:var(--bg-surface-elevated); border-radius:4px; overflow:hidden;">
            <div style="width:${item.value}%; height:100%; background:linear-gradient(90deg, var(--cyan), var(--green));"></div>
          </div>
          <span class="mono" style="flex:0 0 45px; text-align:right;">${item.value}%</span>
        `;
        bdWrap.appendChild(row);
      });
    }

    let profile = AegisDB.getProfile() || {};
    profile = Object.assign(profile, obState, {
      onboarded: true,
      carbonScore: result.score,
      estTonnes: result.estTonnes,
      scoreBreakdown: result.breakdown,
      co2SavedKg: profile.co2SavedKg || 14.5,
      totalPoints: profile.totalPoints || 150
    });
    AegisDB.setProfile(profile);

    let history = AegisDB.getScoreHistory();
    if (!history.length) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      history.push({ date: today, score: result.score });
      AegisDB.setScoreHistory(history);
    }

    obGoStep('obStepResult');
  }, 1000);
}

/* ===================================================================
   7. THREE.JS 3D LIVING CITY VIRTUAL TWIN (SIGNATURE FEATURE)
=================================================================== */
let cityRenderer, cityScene, cityCamera, cityControls;
let cityAnimId = null;
let cityBuildings = [];
let cityMetroTrain = null;
let cityWindTurbine = null;
let cityActiveOverlay = 'normal';
let cityIsNight = false;
let cityRaycaster, cityMouse;

const DISTRICT_DATA = {
  commercial: {
    title: 'Commercial Financial Core',
    desc: 'High-density commercial towers with solar-integrated curtain glass and LEED Platinum certification.',
    metrics: [
      { label: 'Energy Demand', val: '840 kW (42% Solar Sourced)' },
      { label: 'Waste Segregation Rate', val: '94.2% Compliance' },
      { label: 'Clean Mobility Footfall', val: '12,400 daily via Metro' }
    ]
  },
  residential: {
    title: 'Eco-Residential Green Quarter',
    desc: 'Medium-rise residential apartments with balcony biomes, rainwater catchment, and composting matkas.',
    metrics: [
      { label: 'Rooftop Solar Coverage', val: '68% Households' },
      { label: 'Per Capita Water Use', val: '65 L/day (Water-saver swap)' },
      { label: 'Composting Diversion', val: '4.2 Tonnes Organic / Mo' }
    ]
  },
  industrial: {
    title: 'Clean Energy & Industrial Substation',
    desc: 'Regenerative power generation hub with hybrid wind turbines, grid inverters, and battery storage banks.',
    metrics: [
      { label: 'Renewable Power Yield', val: '1.4 MW Grid Feed' },
      { label: 'Battery Storage Capacity', val: '800 kWh High-Efficiency' },
      { label: 'Carbon Abatement', val: '28 Tonnes CO₂e Monthly' }
    ]
  },
  green: {
    title: 'Central Botanical Park & Wetland Canal',
    desc: 'Urban green lung featuring indigenous biodiversity canopy, wetland bio-retention, and EV corridors.',
    metrics: [
      { label: 'Canopy Density', val: '14,200 Mature Native Trees' },
      { label: 'Aquifer Recharging', val: '180,000 Liters Monsoonal' },
      { label: 'Microclimate Cooling', val: '-2.8°C Urban Heat Mitigation' }
    ]
  },
  recycling: {
    title: 'Circular Waste & Kabadi Depot',
    desc: 'Municipal source-segregation logistics depot with automated optical polymer sorters and e-waste collection.',
    metrics: [
      { label: 'Daily Dry Waste Sorted', val: '8.4 Tonnes Plastics & Paper' },
      { label: 'E-Waste Recovery', val: '1.2 Tonnes Rare Earth Electronics' },
      { label: 'Citizen Incentive Bank', val: '82,400 Green Points Issued' }
    ]
  }
};

function initCity3d() {
  const canvas = document.getElementById('city3dCanvas');
  if (!canvas || cityRenderer) return;

  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;

  // 1. Scene & Renderer
  cityScene = new THREE.Scene();
  cityScene.background = new THREE.Color(0x060c09);
  cityScene.fog = new THREE.FogExp2(0x060c09, 0.008);

  cityRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  cityRenderer.setSize(w, h);
  cityRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  cityRenderer.shadowMap.enabled = true;
  cityRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 2. Camera & Controls
  cityCamera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
  cityCamera.position.set(45, 40, 45);

  if (typeof THREE.OrbitControls !== 'undefined') {
    cityControls = new THREE.OrbitControls(cityCamera, canvas);
    cityControls.enableDamping = true;
    cityControls.dampingFactor = 0.08;
    cityControls.maxPolarAngle = Math.PI / 2.15;
    cityControls.minDistance = 20;
    cityControls.maxDistance = 140;
    cityControls.target.set(0, 0, 0);
  }

  // 3. Lighting
  const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.75);
  ambientLight.name = 'cityAmbient';
  cityScene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
  sunLight.position.set(50, 70, 40);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 160;
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  sunLight.name = 'citySun';
  cityScene.add(sunLight);

  // 4. Build City Geometry
  buildCityLandscape();
  buildCityDistricts();
  buildCityTransitAndInfrastructure();

  // 5. Raycasting for Interaction
  cityRaycaster = new THREE.Raycaster();
  cityMouse = new THREE.Vector2();

  canvas.addEventListener('mousemove', onCityMouseMove);
  canvas.addEventListener('click', onCityCanvasClick);
  window.addEventListener('resize', onCityResize);
}

function buildCityLandscape() {
  // Island Base
  const baseGeo = new THREE.CylinderGeometry(36, 38, 4, 32);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x0f1d16 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -2;
  baseMesh.receiveShadow = true;
  cityScene.add(baseMesh);

  // Top Ground / Park Turf
  const groundGeo = new THREE.CylinderGeometry(36, 36, 0.4, 32);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x163826 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.receiveShadow = true;
  cityScene.add(ground);

  // Central Blue River / Water Canal
  const riverGeo = new THREE.PlaneGeometry(70, 6, 24, 2);
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.rotation.z = Math.PI / 5;
  river.position.y = 0.22;
  cityScene.add(river);
}

function buildCityDistricts() {
  cityBuildings = [];

  // Helper Material Creators
  const matComm = new THREE.MeshStandardMaterial({ color: 0x223830, roughness: 0.2, metalness: 0.7 });
  const matRes = new THREE.MeshStandardMaterial({ color: 0x2d483a, roughness: 0.6, metalness: 0.2 });
  const matInd = new THREE.MeshStandardMaterial({ color: 0x3b3f3c, roughness: 0.5, metalness: 0.5 });
  const matSolar = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8, emissive: 0x0369a1, emissiveIntensity: 0.2 });
  const matTreeTrunk = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
  const matTreeFoliage = new THREE.MeshLambertMaterial({ color: 0x16a34a });

  // 1. Commercial Core (North-East Quadrant)
  const commCoords = [
    { x: 10, z: 8, w: 5, d: 5, h: 22 },
    { x: 17, z: 6, w: 4, d: 6, h: 18 },
    { x: 8, z: 15, w: 6, d: 4, h: 15 },
    { x: 15, z: 15, w: 5, d: 5, h: 25 },
    { x: 22, z: 12, w: 4, d: 4, h: 12 }
  ];

  commCoords.forEach((b, i) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mesh = new THREE.Mesh(geo, matComm.clone());
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { district: 'commercial', id: 'comm_' + i };
    cityScene.add(mesh);
    cityBuildings.push(mesh);

    // Rooftop Solar Array
    const solarGeo = new THREE.BoxGeometry(b.w * 0.75, 0.4, b.d * 0.75);
    const solarMesh = new THREE.Mesh(solarGeo, matSolar);
    solarMesh.position.set(b.x, b.h + 0.2, b.z);
    solarMesh.userData = { isSolar: true, district: 'commercial' };
    cityScene.add(solarMesh);
  });

  // 2. Residential Eco-Quarter (North-West Quadrant)
  const resCoords = [
    { x: -10, z: 10, w: 4, d: 4, h: 10 },
    { x: -16, z: 8, w: 5, d: 4, h: 8 },
    { x: -8, z: 16, w: 4, d: 5, h: 12 },
    { x: -14, z: 16, w: 4, d: 4, h: 9 },
    { x: -20, z: 14, w: 3, d: 5, h: 7 }
  ];

  resCoords.forEach((b, i) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mesh = new THREE.Mesh(geo, matRes.clone());
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { district: 'residential', id: 'res_' + i };
    cityScene.add(mesh);
    cityBuildings.push(mesh);

    // Rooftop Garden / Foliage
    const roofGeo = new THREE.BoxGeometry(b.w * 0.8, 0.6, b.d * 0.8);
    const roofMesh = new THREE.Mesh(roofGeo, matTreeFoliage);
    roofMesh.position.set(b.x, b.h + 0.3, b.z);
    roofMesh.userData = { isGreenRoof: true, district: 'residential' };
    cityScene.add(roofMesh);
  });

  // 3. Clean Energy & Industrial Zone (South-East Quadrant)
  const indCoords = [
    { x: 12, z: -10, w: 6, d: 8, h: 6 },
    { x: 20, z: -8, w: 7, d: 5, h: 5 }
  ];

  indCoords.forEach((b, i) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mesh = new THREE.Mesh(geo, matInd.clone());
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { district: 'industrial', id: 'ind_' + i };
    cityScene.add(mesh);
    cityBuildings.push(mesh);
  });

  // Wind Turbine
  const turbineTowerGeo = new THREE.CylinderGeometry(0.5, 0.9, 18, 12);
  const turbineTowerMat = new THREE.MeshLambertMaterial({ color: 0xecfdf5 });
  const turbineTower = new THREE.Mesh(turbineTowerGeo, turbineTowerMat);
  turbineTower.position.set(16, 9, -18);
  turbineTower.castShadow = true;
  cityScene.add(turbineTower);

  const nacelleGeo = new THREE.BoxGeometry(1.4, 1.2, 2.6);
  const nacelle = new THREE.Mesh(nacelleGeo, turbineTowerMat);
  nacelle.position.set(16, 18, -18);
  cityScene.add(nacelle);

  // Turbine Rotor & Blades Group
  cityWindTurbine = new THREE.Group();
  cityWindTurbine.position.set(16, 18, -16.6);

  const hubGeo = new THREE.SphereGeometry(0.7, 12, 12);
  const hub = new THREE.Mesh(hubGeo, turbineTowerMat);
  cityWindTurbine.add(hub);

  for (let r = 0; r < 3; r++) {
    const bladeGeo = new THREE.BoxGeometry(0.35, 7.5, 0.15);
    const blade = new THREE.Mesh(bladeGeo, turbineTowerMat);
    blade.position.y = 3.6;
    blade.rotation.z = (r * Math.PI * 2) / 3;
    cityWindTurbine.add(blade);
  }
  cityScene.add(cityWindTurbine);

  // 4. Circular Waste & Recycling Depot (South-West Quadrant)
  const recCoords = [
    { x: -14, z: -12, w: 7, d: 6, h: 6 },
    { x: -8, z: -16, w: 5, d: 5, h: 5 }
  ];

  recCoords.forEach((b, i) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const matRec = new THREE.MeshStandardMaterial({ color: 0x283b32, roughness: 0.4, metalness: 0.4 });
    const mesh = new THREE.Mesh(geo, matRec);
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { district: 'recycling', id: 'rec_' + i };
    cityScene.add(mesh);
    cityBuildings.push(mesh);
  });

  // Recycling Silos / Tanks
  for (let s = 0; s < 2; s++) {
    const siloGeo = new THREE.CylinderGeometry(1.6, 1.6, 7, 16);
    const siloMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.6 });
    const silo = new THREE.Mesh(siloGeo, siloMat);
    silo.position.set(-18 + s * 3.8, 3.5, -7);
    silo.castShadow = true;
    silo.userData = { district: 'recycling' };
    cityScene.add(silo);
  }

  // 5. Central Park Canopy & Trees
  const treePositions = [
    [-2, 0], [0, 4], [3, -2], [-4, -4], [-8, 2], [6, -8],
    [-2, 8], [8, -4], [2, 10], [-12, -2], [-6, -10], [10, -14],
    [-18, 4], [22, 2], [4, 18], [-22, -8], [14, 20]
  ];

  treePositions.forEach(([tx, tz]) => {
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunk = new THREE.Mesh(trunkGeo, matTreeTrunk);
    trunk.position.y = 1;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const foliage = new THREE.Mesh(foliageGeo, matTreeFoliage);
    foliage.position.y = 2.4;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    treeGroup.position.set(tx, 0.2, tz);
    treeGroup.userData = { isTree: true, district: 'green' };
    cityScene.add(treeGroup);
  });
}

function buildCityTransitAndInfrastructure() {
  // Elevated Circular Metro Track Loop
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-24, 4.5, 0),
    new THREE.Vector3(-16, 4.5, 20),
    new THREE.Vector3(12, 4.5, 22),
    new THREE.Vector3(26, 4.5, 6),
    new THREE.Vector3(18, 4.5, -20),
    new THREE.Vector3(-12, 4.5, -22)
  ], true);

  const trackGeo = new THREE.TubeGeometry(curve, 64, 0.3, 8, true);
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
  const track = new THREE.Mesh(trackGeo, trackMat);
  cityScene.add(track);

  // Futuristic Moving Metro Train Car
  const trainGeo = new THREE.BoxGeometry(4.2, 1.4, 1.6);
  const trainMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.8
  });
  cityMetroTrain = new THREE.Mesh(trainGeo, trainMat);
  cityMetroTrain.userData = { curve: curve, progress: 0 };
  cityScene.add(cityMetroTrain);
}

function startCity3dAnimation() {
  if (!cityRenderer) initCity3d();
  if (cityAnimId) return;

  function animate() {
    cityAnimId = requestAnimationFrame(animate);

    // 1. Rotate Wind Turbine
    if (cityWindTurbine) {
      cityWindTurbine.rotation.z += 0.04;
    }

    // 2. Animate Metro Train along CatmullRom Curve
    if (cityMetroTrain && cityMetroTrain.userData.curve) {
      const u = (cityMetroTrain.userData.progress += 0.0018) % 1;
      const pos = cityMetroTrain.userData.curve.getPointAt(u);
      const tangent = cityMetroTrain.userData.curve.getTangentAt(u);
      cityMetroTrain.position.copy(pos);
      cityMetroTrain.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
    }

    // 3. Orbit Controls
    if (cityControls) {
      cityControls.update();
    }

    if (cityRenderer && cityScene && cityCamera) {
      cityRenderer.render(cityScene, cityCamera);
    }
  }

  animate();
}

function stopCity3dAnimation() {
  if (cityAnimId) {
    cancelAnimationFrame(cityAnimId);
    cityAnimId = null;
  }
}

function onCityMouseMove(e) {
  if (!cityRaycaster || !cityCamera || !cityBuildings.length) return;
  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  cityMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  cityMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  cityRaycaster.setFromCamera(cityMouse, cityCamera);
  const intersects = cityRaycaster.intersectObjects(cityBuildings);

  const hoverBadge = document.getElementById('cityHoverBadge');
  const title = document.getElementById('hoverDistrictTitle');
  const desc = document.getElementById('hoverDistrictDesc');

  if (intersects.length > 0) {
    canvas.style.cursor = 'pointer';
    const distKey = intersects[0].object.userData.district;
    const info = DISTRICT_DATA[distKey];
    if (info && title && desc) {
      title.textContent = info.title;
      desc.textContent = info.desc;
    }
  } else {
    canvas.style.cursor = 'default';
  }
}

function onCityCanvasClick(e) {
  if (!cityRaycaster || !cityCamera || !cityBuildings.length) return;
  cityRaycaster.setFromCamera(cityMouse, cityCamera);
  const intersects = cityRaycaster.intersectObjects(cityBuildings);

  if (intersects.length > 0) {
    const distKey = intersects[0].object.userData.district;
    openDistrictDrawer(distKey);
  }
}

function openDistrictDrawer(districtKey) {
  const info = DISTRICT_DATA[districtKey];
  if (!info) return;

  const drawer = document.getElementById('cityDistrictDrawer');
  const title = document.getElementById('drawerDistrictTitle');
  const desc = document.getElementById('drawerDistrictDesc');
  const metricsWrap = document.getElementById('drawerDistrictMetrics');

  if (title) title.textContent = info.title;
  if (desc) desc.textContent = info.desc;

  if (metricsWrap) {
    metricsWrap.innerHTML = info.metrics.map(m => `
      <div class="city-metric-row">
        <span>${m.label}</span>
        <b class="mono" style="color:var(--green-soft);">${m.val}</b>
      </div>
    `).join('');
  }

  if (drawer) drawer.classList.remove('collapsed');
}

function closeDistrictDrawer() {
  const drawer = document.getElementById('cityDistrictDrawer');
  if (drawer) drawer.classList.add('collapsed');
}

function boostDistrictAction() {
  const profile = AegisDB.getProfile() || {};
  profile.totalPoints = (profile.totalPoints || 0) + 25;
  AegisDB.setProfile(profile);
  renderAuthState();
  showToast('Contributed to District Regeneration! +25 Green Points.');
}

function switchCityOverlay(layerKey) {
  cityActiveOverlay = layerKey;
  document.querySelectorAll('.city-layer-controls button').forEach(b => {
    b.classList.toggle('active', b.dataset.layer === layerKey);
  });

  const ambient = cityScene.getObjectByName('cityAmbient');
  const sun = cityScene.getObjectByName('citySun');

  if (layerKey === 'pollution') {
    cityScene.fog.color.setHex(0x78350f);
    cityScene.fog.density = 0.022;
    if (ambient) ambient.color.setHex(0xfef3c7);
    showToast('Simulating Urban Smog & Atmospheric Inversion layer.', true);
  } else if (layerKey === 'green') {
    cityScene.fog.color.setHex(0x064e3b);
    cityScene.fog.density = 0.006;
    if (ambient) ambient.color.setHex(0x34d399);
    showToast('Urban Green Canopy & Wetland buffer highlighted.');
  } else if (layerKey === 'energy') {
    cityScene.fog.color.setHex(0x0c4a6e);
    cityScene.fog.density = 0.008;
    if (ambient) ambient.color.setHex(0x38bdf8);
    showToast('Rooftop Solar Generation & Substation Grid highlighted.');
  } else if (layerKey === 'recycling') {
    cityScene.fog.color.setHex(0x1e293b);
    cityScene.fog.density = 0.008;
    if (ambient) ambient.color.setHex(0xfbbf24);
    showToast('Circular Recycling Logistics & E-Waste Depot highlighted.');
  } else {
    // Normal
    cityScene.fog.color.setHex(cityIsNight ? 0x020617 : 0x060c09);
    cityScene.fog.density = 0.008;
    if (ambient) ambient.color.setHex(cityIsNight ? 0x334155 : 0xdcfce7);
    showToast('Standard environmental balance view.');
  }
}

function toggleCityDayNight() {
  cityIsNight = !cityIsNight;
  const ambient = cityScene.getObjectByName('cityAmbient');
  const sun = cityScene.getObjectByName('citySun');

  if (cityIsNight) {
    cityScene.background.setHex(0x020617);
    if (ambient) ambient.intensity = 0.35;
    if (sun) sun.intensity = 0.4;
    showToast('Night-time grid monitoring active.');
  } else {
    cityScene.background.setHex(0x060c09);
    if (ambient) ambient.intensity = 0.75;
    if (sun) sun.intensity = 1.25;
    showToast('Daylight solar generation active.');
  }
}

function resetCityCamera() {
  if (cityCamera && cityControls) {
    cityCamera.position.set(45, 40, 45);
    cityControls.target.set(0, 0, 0);
  }
}

function zoomCity(dir) {
  if (cityCamera) {
    const factor = dir > 0 ? 0.85 : 1.15;
    cityCamera.position.multiplyScalar(factor);
  }
}

function rotateCity45() {
  if (cityCamera) {
    const x = cityCamera.position.x;
    const z = cityCamera.position.z;
    const angle = Math.PI / 4;
    cityCamera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    cityCamera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
  }
}

function onCityResize() {
  const canvas = document.getElementById('city3dCanvas');
  if (!canvas || !cityRenderer || !cityCamera) return;
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  cityCamera.aspect = w / h;
  cityCamera.updateProjectionMatrix();
  cityRenderer.setSize(w, h);
}

/* ===================================================================
   8. THREE.JS EARTH PULSE 3D GLOBE EXPLORER
=================================================================== */
let globeRenderer, globeScene, globeCamera, globeControls;
let globeAnimId = null;
let earthMesh, cloudsMesh, atmosMesh, globeSunLight, globeAmbLight;
let globeCityPins = [];
let globePulseRings = [];
let globeAutoRotate = true;
let globeSunState = 'day';
let targetRotY = null;
let targetCamY = 0;

const GLOBAL_HOTSPOTS = [
  { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, aqi: 142, status: 'Moderate', plan: '2050 Net-Zero Charter', canopy: '18.4%', temp: '29°C' },
  { city: 'Delhi NCR', country: 'India', lat: 28.6139, lng: 77.2090, aqi: 368, status: 'Severe', plan: 'NCAP Accelerated Clean Air', canopy: '14.2%', temp: '26°C' },
  { city: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946, aqi: 68, status: 'Good', plan: 'Solar City Grid Initiative', canopy: '28.6%', temp: '24°C' },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, aqi: 38, status: 'Pristine Hub', plan: 'Zero Emission Tokyo 2050', canopy: '30.5%', temp: '16°C' },
  { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, aqi: 42, status: 'Clean Hub', plan: 'Ultra Low Emission Zone', canopy: '32.0%', temp: '14°C' },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, aqi: 48, status: 'Good', plan: 'PlaNYC Climate Charter', canopy: '24.0%', temp: '18°C' },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, aqi: 44, status: 'Clean Hub', plan: 'Paris 15-Minute City Plan', canopy: '21.0%', temp: '17°C' },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, aqi: 32, status: 'Green Oasis', plan: 'Singapore Green Plan 2030', canopy: '46.5%', temp: '31°C' },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, aqi: 28, status: 'Pristine Hub', plan: 'Sustainable Sydney 2030', canopy: '26.8%', temp: '22°C' },
  { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, aqi: 112, status: 'Moderate', plan: 'PlanClima Action 2030', canopy: '19.5%', temp: '23°C' },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, aqi: 185, status: 'Unhealthy', plan: 'Greater Cairo Air Action', canopy: '8.2%', temp: '27°C' },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, aqi: 88, status: 'Moderate', plan: 'Nairobi Climate Resilient 2050', canopy: '22.3%', temp: '25°C' }
];

function createProceduralEarthCanvas() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  const og = ctx.createLinearGradient(0, 0, 0, 1024);
  og.addColorStop(0, '#061a29');
  og.addColorStop(0.18, '#0a2a44');
  og.addColorStop(0.5, '#0d3856');
  og.addColorStop(0.82, '#0a2a44');
  og.addColorStop(1, '#061a29');
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, 2048, 1024);

  // Polar ice caps
  ctx.fillStyle = '#e2f1f8';
  ctx.fillRect(0, 0, 2048, 55);
  ctx.fillRect(0, 965, 2048, 60);

  ctx.fillStyle = '#1e4835';
  ctx.strokeStyle = '#2b654a';
  ctx.lineWidth = 3;

  function drawPoly(pts) {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // North America
  drawPoly([[160, 120], [320, 140], [420, 220], [460, 310], [400, 360], [360, 420], [330, 480], [300, 520], [270, 500], [240, 420], [180, 380], [140, 310], [120, 220], [130, 150]]);
  // Greenland
  drawPoly([[510, 80], [600, 90], [580, 180], [500, 160]]);
  // South America
  drawPoly([[320, 520], [410, 550], [490, 600], [470, 720], [420, 840], [370, 890], [350, 790], [320, 660], [300, 580]]);
  // Europe
  drawPoly([[930, 180], [1050, 190], [1120, 260], [1080, 320], [980, 360], [920, 340], [900, 260], [910, 200]]);
  // Africa
  drawPoly([[920, 380], [1080, 370], [1180, 480], [1150, 640], [1090, 780], [1020, 810], [950, 680], [890, 520], [880, 420]]);
  // Asia & Eurasia
  drawPoly([[1090, 180], [1380, 150], [1680, 200], [1760, 280], [1680, 380], [1540, 460], [1420, 440], [1320, 400], [1240, 380], [1150, 280]]);
  // Indian Subcontinent
  drawPoly([[1280, 410], [1360, 410], [1340, 540], [1310, 580], [1280, 530], [1270, 460]]);
  // Australia
  drawPoly([[1550, 660], [1720, 650], [1780, 740], [1710, 830], [1580, 820], [1520, 740]]);

  return c;
}

function initEarthGlobe3d() {
  const canvas = document.getElementById('earthGlobeCanvas');
  if (!canvas || globeRenderer) return;

  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;

  globeScene = new THREE.Scene();
  globeScene.background = new THREE.Color(0x050a08);

  globeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  globeRenderer.setSize(w, h);
  globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  globeCamera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
  globeCamera.position.set(0, 0, 50);

  if (typeof THREE.OrbitControls !== 'undefined') {
    globeControls = new THREE.OrbitControls(globeCamera, canvas);
    globeControls.enableDamping = true;
    globeControls.dampingFactor = 0.08;
    globeControls.minDistance = 24;
    globeControls.maxDistance = 85;
  }

  // Starfield Deep Space Background
  const starGeo = new THREE.BufferGeometry();
  const starCount = 380;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const sr = 90 + Math.random() * 80;
    const sTheta = Math.random() * Math.PI * 2;
    const sPhi = Math.acos(2 * Math.random() - 1);
    starPos[i] = sr * Math.sin(sPhi) * Math.cos(sTheta);
    starPos[i + 1] = sr * Math.cos(sPhi);
    starPos[i + 2] = sr * Math.sin(sPhi) * Math.sin(sTheta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.8, transparent: true, opacity: 0.65 });
  const starField = new THREE.Points(starGeo, starMat);
  globeScene.add(starField);

  // Realistic Day/Night Terminator Lighting
  globeSunLight = new THREE.DirectionalLight(0xffffff, 1.45);
  globeSunLight.position.set(55, 20, 45);
  globeScene.add(globeSunLight);

  globeAmbLight = new THREE.AmbientLight(0x1a2b38, 0.48);
  globeScene.add(globeAmbLight);

  // Texture Loader for NASA Blue Marble Earth Assets
  const texLoader = new THREE.TextureLoader();
  const fallbackCanvas = createProceduralEarthCanvas();
  const fallbackTex = new THREE.CanvasTexture(fallbackCanvas);

  const earthTexture = texLoader.load(
    'assets/textures/earth_atmos_2048.jpg',
    function (tex) { tex.needsUpdate = true; },
    undefined,
    function () {
      if (earthMesh) {
        earthMesh.material.map = fallbackTex;
        earthMesh.material.needsUpdate = true;
      }
    }
  );

  const normalTexture = texLoader.load('assets/textures/earth_normal_2048.jpg');
  const cloudsTexture = texLoader.load('assets/textures/earth_clouds_1024.png');

  // Main Earth Planetary Sphere
  const earthGeo = new THREE.SphereGeometry(18, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.65,
    metalness: 0.12
  });
  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  globeScene.add(earthMesh);

  // Dynamic Atmospheric Clouds Sphere
  const cloudsGeo = new THREE.SphereGeometry(18.25, 64, 64);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    roughness: 0.95
  });
  cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
  globeScene.add(cloudsMesh);

  // Atmospheric Glow Halo
  const atmosGeo = new THREE.SphereGeometry(19.2, 48, 48);
  const atmosMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.16,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  globeScene.add(atmosMesh);

  // Plot Hotspot Pins with Radar Rings
  plotGlobeHotspots();

  canvas.addEventListener('click', onGlobeCanvasClick);
  window.addEventListener('resize', onGlobeResize);
}

function plotGlobeHotspots() {
  globeCityPins = [];
  globePulseRings = [];
  const R = 18.0;

  GLOBAL_HOTSPOTS.forEach(spot => {
    const phi = (90 - spot.lat) * (Math.PI / 180);
    const theta = (spot.lng + 180) * (Math.PI / 180);

    const x = -(R * Math.sin(phi) * Math.cos(theta));
    const z = R * Math.sin(phi) * Math.sin(theta);
    const y = R * Math.cos(phi);

    const color = spot.aqi > 200 ? 0xef4444 : (spot.aqi > 100 ? 0xf59e0b : 0x10b981);

    // Glowing Pin Head Sphere
    const pinGeo = new THREE.SphereGeometry(0.48, 14, 14);
    const pinMat = new THREE.MeshBasicMaterial({ color });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(x * 1.025, y * 1.025, z * 1.025);
    pin.userData = spot;

    earthMesh.add(pin);
    globeCityPins.push(pin);

    // Expanding Surface Radar Pulse Ring
    const ringGeo = new THREE.RingGeometry(0.35, 0.75, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x * 1.008, y * 1.008, z * 1.008);
    const normalVec = new THREE.Vector3(x, y, z).normalize();
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalVec);

    earthMesh.add(ring);
    globePulseRings.push({ mesh: ring, phase: Math.random() * Math.PI * 2, spot });
  });
}

function startEarthGlobeAnimation() {
  if (!globeRenderer) initEarthGlobe3d();
  if (globeAnimId) return;

  function animate() {
    globeAnimId = requestAnimationFrame(animate);

    // Smooth transition to target city coordinates
    if (targetRotY !== null && earthMesh) {
      const diff = targetRotY - earthMesh.rotation.y;
      const normDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(normDiff) > 0.005) {
        earthMesh.rotation.y += normDiff * 0.08;
      } else {
        earthMesh.rotation.y = targetRotY;
        targetRotY = null;
      }
      if (globeCamera) {
        globeCamera.position.y += (targetCamY - globeCamera.position.y) * 0.08;
      }
    } else if (earthMesh && globeAutoRotate) {
      earthMesh.rotation.y += 0.0012;
    }

    // Clouds drift with independent atmospheric velocity
    if (cloudsMesh) {
      cloudsMesh.rotation.y += globeAutoRotate ? 0.0016 : 0.0004;
    }

    // Animate radar rings
    const time = Date.now() * 0.003;
    globePulseRings.forEach(p => {
      const s = 1 + 0.6 * Math.sin(time + p.phase);
      p.mesh.scale.set(s, s, s);
      p.mesh.material.opacity = 0.25 + 0.5 * Math.cos(time + p.phase);
    });

    if (globeControls) {
      globeControls.update();
    }

    if (globeRenderer && globeScene && globeCamera) {
      globeRenderer.render(globeScene, globeCamera);
    }
  }

  animate();
}

function stopEarthGlobeAnimation() {
  if (globeAnimId) {
    cancelAnimationFrame(globeAnimId);
    globeAnimId = null;
  }
}

function jumpGlobeCity(cityName) {
  const spot = GLOBAL_HOTSPOTS.find(s => s.city.toLowerCase() === cityName.toLowerCase());
  if (!spot) return;

  // Highlight active chip
  document.querySelectorAll('#globeCityChips button').forEach(b => {
    b.classList.toggle('active', b.textContent.includes(spot.city));
  });

  // Calculate target rotation to face camera (+Z axis)
  targetRotY = -Math.PI / 2 - (spot.lng * Math.PI / 180);
  targetCamY = (spot.lat / 90) * 10;

  updateGlobeCityFocus(spot);
}

function toggleGlobeOrbit() {
  globeAutoRotate = !globeAutoRotate;
  const btn = document.getElementById('globeOrbitBtn');
  if (btn) btn.textContent = globeAutoRotate ? '⏸' : '▶';
  showToast(globeAutoRotate ? 'Earth auto-orbit resumed.' : 'Earth auto-orbit paused.');
}

function toggleGlobeSun() {
  globeSunState = (globeSunState === 'day') ? 'dusk' : 'day';
  const sunBtn = document.getElementById('globeSunBtn');
  if (globeSunState === 'dusk') {
    if (sunBtn) sunBtn.textContent = '🌙';
    if (globeSunLight) {
      globeSunLight.position.set(-50, 10, -40);
      globeSunLight.color.setHex(0xffaa66);
    }
    if (globeAmbLight) globeAmbLight.color.setHex(0x0c1520);
    showToast('Observatory lighting: Solar Twilight / Dusk Mode');
  } else {
    if (sunBtn) sunBtn.textContent = '☀️';
    if (globeSunLight) {
      globeSunLight.position.set(55, 20, 45);
      globeSunLight.color.setHex(0xffffff);
    }
    if (globeAmbLight) globeAmbLight.color.setHex(0x1a2b38);
    showToast('Observatory lighting: Solar Day Mode');
  }
}

function zoomGlobe(dir) {
  if (!globeCamera) return;
  const step = dir > 0 ? -6 : 6;
  globeCamera.position.z = clamp(globeCamera.position.z + step, 24, 85);
}

function resetGlobeView() {
  if (!globeCamera) return;
  globeCamera.position.set(0, 0, 50);
  if (globeControls) globeControls.target.set(0, 0, 0);
  targetRotY = null;
  targetCamY = 0;
  showToast('Observatory view centered.');
}

function onGlobeCanvasClick(e) {
  if (!globeCamera || !globeCityPins.length) return;
  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, globeCamera);
  const intersects = raycaster.intersectObjects(globeCityPins);

  if (intersects.length > 0) {
    const data = intersects[0].object.userData;
    jumpGlobeCity(data.city);
  }
}

function updateGlobeCityFocus(spot) {
  const nameEl = document.getElementById('globeCityName');
  if (nameEl) nameEl.textContent = `${spot.city}, ${spot.country || ''}`;

  const aqiEl = document.getElementById('globeCityAqi');
  if (aqiEl) {
    aqiEl.textContent = `${spot.aqi} AQI (${spot.status || (spot.aqi > 200 ? 'Severe' : spot.aqi > 100 ? 'Moderate' : 'Good')})`;
    aqiEl.style.color = spot.aqi > 200 ? 'var(--red)' : spot.aqi > 100 ? 'var(--amber)' : 'var(--green-soft)';
  }

  const planEl = document.getElementById('globeCityPlan');
  if (planEl) planEl.textContent = spot.plan || 'Municipal Climate Plan';

  const canopyEl = document.getElementById('globeCityCanopy');
  if (canopyEl) canopyEl.textContent = `${spot.canopy} Urban Canopy`;

  const tempEl = document.getElementById('globeCityTemp');
  if (tempEl) tempEl.textContent = spot.temp || '26°C';

  showToast(`Calibrated Earth observatory to ${spot.city}.`);
}

function setCityFromGlobe() {
  const name = document.getElementById('globeCityName').textContent.split(',')[0].trim();
  switchAqiCity(name);
  showToast(`Active local city set to ${name}.`);
}

function switchGlobeLayer(layer) {
  document.querySelectorAll('#globeLayerPills button').forEach(b => {
    b.classList.toggle('active', b.dataset.glayer === layer);
  });

  globeCityPins.forEach(p => {
    const aqi = p.userData.aqi;
    let visible = true;
    if (layer === 'aqi') visible = aqi >= 100;
    else if (layer === 'clean') visible = aqi < 100;
    p.visible = visible;
  });

  globePulseRings.forEach(r => {
    const aqi = r.spot.aqi;
    let visible = true;
    if (layer === 'aqi') visible = aqi >= 100;
    else if (layer === 'clean') visible = aqi < 100;
    r.mesh.visible = visible;
  });

  showToast(`Earth Pulse layer: ${layer.toUpperCase()}`);
}

function onGlobeResize() {
  const canvas = document.getElementById('earthGlobeCanvas');
  if (!canvas || !globeRenderer || !globeCamera) return;
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  globeCamera.aspect = w / h;
  globeCamera.updateProjectionMatrix();
  globeRenderer.setSize(w, h);
}

/* ===================================================================
   9. THREE.JS CINEMATIC HERO PLANET CANVAS
=================================================================== */
let heroRenderer, heroScene, heroCamera;
let heroAnimId = null;
let heroPlanetSphere, heroCloudsSphere;

function initHeroPlanet3d() {
  const canvas = document.getElementById('heroPlanetCanvas');
  if (!canvas || heroRenderer) return;

  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;

  heroScene = new THREE.Scene();
  heroCamera = new THREE.PerspectiveCamera(40, w / h, 1, 1000);
  heroCamera.position.set(0, 0, 48);

  heroRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  heroRenderer.setSize(w, h);
  heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const amb = new THREE.AmbientLight(0xffffff, 0.75);
  heroScene.add(amb);
  const dir = new THREE.DirectionalLight(0x7cffb2, 1.4);
  dir.position.set(40, 20, 30);
  heroScene.add(dir);

  // Realistic Earth Planet Sphere
  const texLoader = new THREE.TextureLoader();
  const earthTexture = texLoader.load('assets/textures/earth_atmos_2048.jpg');
  const normalTexture = texLoader.load('assets/textures/earth_normal_2048.jpg');
  const cloudsTexture = texLoader.load('assets/textures/earth_clouds_1024.png');

  const planetGeo = new THREE.SphereGeometry(15, 48, 48);
  const planetMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.6,
    metalness: 0.15
  });
  heroPlanetSphere = new THREE.Mesh(planetGeo, planetMat);
  heroScene.add(heroPlanetSphere);

  // Cloud Layer on Hero Planet
  const cloudsGeo = new THREE.SphereGeometry(15.22, 48, 48);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    roughness: 0.95
  });
  heroCloudsSphere = new THREE.Mesh(cloudsGeo, cloudsMat);
  heroScene.add(heroCloudsSphere);

  // Wireframe Atmospheric Grid Ring
  const ringGeo = new THREE.RingGeometry(18, 18.3, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x3ddc84, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.3;
  heroScene.add(ring);

  startHeroPlanetAnimation();

  window.addEventListener('resize', () => {
    if (!heroRenderer || !heroCamera) return;
    const cw = canvas.parentElement.clientWidth;
    const ch = canvas.parentElement.clientHeight;
    heroCamera.aspect = cw / ch;
    heroCamera.updateProjectionMatrix();
    heroRenderer.setSize(cw, ch);
  });
}

function startHeroPlanetAnimation() {
  if (!heroRenderer) initHeroPlanet3d();
  if (heroAnimId) return;

  function animate() {
    heroAnimId = requestAnimationFrame(animate);
    if (heroPlanetSphere) {
      heroPlanetSphere.rotation.y += 0.002;
    }
    if (heroCloudsSphere) {
      heroCloudsSphere.rotation.y += 0.0026;
    }
    if (heroRenderer && heroScene && heroCamera) {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  animate();
}

function stopHeroPlanetAnimation() {
  if (heroAnimId) {
    cancelAnimationFrame(heroAnimId);
    heroAnimId = null;
  }
}

/* ===================================================================
   10. ECOSCAN: WASTE IDENTIFICATION & MATERIAL VISION
=================================================================== */
const SCAN_SAMPLES = [
  {
    icon: '🥤',
    title: 'Plastic Beverage Bottle',
    polymer: 'Polyethylene Terephthalate (#1 PET)',
    bin: 'Blue Bin (Dry Recyclable)',
    lifespan: '~450 Years',
    tip: 'Rinse with leftover dishwater, crush flat to conserve bin volume by 70%, and place in dry bin.',
    stream: 'Dry Recyclable',
    confidence: '96.4%'
  },
  {
    icon: '🔋',
    title: 'Alkaline AA Battery Cell',
    polymer: 'Zinc / Manganese / Hazardous Potassium Hydroxide',
    bin: 'Red Bin (Domestic Hazardous) or Battery Kiosk',
    lifespan: 'Non-biodegradable (Heavy Metal Contaminant)',
    tip: 'Keep terminals taped to prevent short-circuits. Route to nearest municipal battery kiosk on our map.',
    stream: 'Hazardous Waste',
    confidence: '98.1%'
  },
  {
    icon: '📦',
    title: 'Corrugated Cardboard Box',
    polymer: 'Unbleached Kraft Cellulose Fiber',
    bin: 'Blue Bin (Paper & Cardboard)',
    lifespan: '2–3 Months in Composting',
    tip: 'Flatten boxes and remove plastic shipping tapes. Excellent carbon brown matter for terrace composting.',
    stream: 'Dry Recyclable',
    confidence: '95.2%'
  },
  {
    icon: '🍌',
    title: 'Organic Fruit / Vegetable Peels',
    polymer: 'Biodegradable Organic Lignocellulose',
    bin: 'Green Bin (Wet Composting)',
    lifespan: '14–21 Days in Matka Composter',
    tip: 'Chop coarsely and layer with dry coco-peat in a terracotta pot to yield natural garden fertilizer.',
    stream: 'Wet Organic',
    confidence: '99.0%'
  },
  {
    icon: '🥫',
    title: 'Aluminium Beverage Can',
    polymer: 'Recyclable Aluminum Alloy (#41 ALU)',
    bin: 'Blue Bin (Dry Metal Recyclable)',
    lifespan: '~200–500 Years if landfilled',
    tip: 'Infinitely recyclable with 95% less energy than virgin bauxite mining. Empty and rinse before binning.',
    stream: 'Dry Metal Recyclable',
    confidence: '97.8%'
  },
  {
    icon: '🍾',
    title: 'Amber Glass Bottle',
    polymer: 'Amorphous Silica / Soda-Lime Glass',
    bin: 'Blue Bin or Local Kabadiwala Deposit',
    lifespan: 'Over 1 Million Years (Inert)',
    tip: '100% recyclable infinitely without loss of purity or quality. Deposit at authorized glass drop-off hubs.',
    stream: 'Dry Glass Recyclable',
    confidence: '98.5%'
  },
  {
    icon: '📱',
    title: 'Defunct Lithium Smartphone Board',
    polymer: 'Printed Circuit Board / Gold / Cobalt / Lead',
    bin: 'Red Bin (E-Waste Facility Only)',
    lifespan: 'Severe Toxic Ground Leaching if dumped',
    tip: 'Never place with household garbage. Deposit at certified municipal e-waste stations on the Aegis Map.',
    stream: 'E-Waste Hazardous',
    confidence: '96.9%'
  }
];

function handleScanDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const vp = document.getElementById('scanViewport');
  if (vp) vp.classList.add('drag-active');
}

function handleScanDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const vp = document.getElementById('scanViewport');
  if (vp) vp.classList.remove('drag-active');
}

function handleScanDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const vp = document.getElementById('scanViewport');
  if (vp) vp.classList.remove('drag-active');
  const files = e.dataTransfer && e.dataTransfer.files;
  if (files && files.length > 0) {
    processScanFile(files[0]);
  }
}

function handleScanUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (file) {
    processScanFile(file);
  }
}

function processScanFile(file) {
  const reader = new FileReader();
  const viewport = document.getElementById('scanViewport');
  const img = document.getElementById('scanPreviewImg');
  const promptWrap = document.getElementById('scanPromptWrap');

  reader.onload = (event) => {
    img.src = event.target.result;
    img.style.display = 'block';
    promptWrap.style.display = 'none';
    viewport.classList.add('scanning');

    showToast('EcoScan AI analyzing material polymers…');

    setTimeout(() => {
      viewport.classList.remove('scanning');
      const randomSample = SCAN_SAMPLES[Math.floor(Math.random() * SCAN_SAMPLES.length)];
      displayScanResult(randomSample);
    }, 1800);
  };

  reader.readAsDataURL(file);
}

function displayScanResult(res) {
  document.getElementById('scanPlaceholderText').style.display = 'none';
  const content = document.getElementById('scanResultContent');
  content.style.display = 'block';

  document.getElementById('scanConfidence').textContent = `Confidence: ${res.confidence}`;
  document.getElementById('scanResultIcon').textContent = res.icon;
  document.getElementById('scanResultTitle').textContent = res.title;
  document.getElementById('scanResultStream').textContent = res.stream;
  document.getElementById('scanResultPolymer').textContent = res.polymer;
  document.getElementById('scanResultBin').textContent = res.bin;
  document.getElementById('scanResultLifespan').textContent = res.lifespan;
  document.getElementById('scanResultTip').textContent = res.tip;

  showToast(`Material detected: ${res.title}`);
}

function routeScanToMap() {
  const streamEl = document.getElementById('scanResultStream');
  const stream = streamEl ? streamEl.textContent.toLowerCase() : '';
  let filter = 'all';
  if (stream.includes('hazard') || stream.includes('battery')) filter = 'battery';
  else if (stream.includes('e-waste')) filter = 'e-waste';
  else if (stream.includes('metal')) filter = 'metal';
  else if (stream.includes('dry') || stream.includes('recyclable')) filter = 'plastic';

  goTo('map');
  setTimeout(() => {
    filterMap(filter);
  }, 120);
}

function logScannedItemActivity() {
  const profile = AegisDB.getProfile() || {};
  profile.totalPoints = (profile.totalPoints || 0) + 10;
  AegisDB.setProfile(profile);
  renderAuthState();
  showToast('EcoScan action recorded! +10 Green Points.');
}

/* ===================================================================
   11. GREEN PASSPORT (COLLECTIBLE CITIZEN IDENTITY)
=================================================================== */
const PASSPORT_STAMPS = [
  { id: 'st_first', icon: '🚴‍♂️', title: 'First Green Commute', date: '2026-03-12', condition: 'Log a walk, cycle, or metro commute', category: 'Mobility', stamped: true },
  { id: 'st_streak', icon: '🔥', title: '7-Day Climate Streak', date: '2026-04-05', condition: 'Maintain 7-day sustainable streak', category: 'Commitment', stamped: true },
  { id: 'st_compost', icon: '🪴', title: 'Compost Pioneer', date: '2026-06-18', condition: 'Process 10kg wet organic waste', category: 'Circularity', stamped: true },
  { id: 'st_ewaste', icon: '⚡', title: 'Certified E-Waste Drop', date: '2026-08-22', condition: 'Deposit hazardous lithium/electronics', category: 'Safeguard', stamped: true },
  { id: 'st_plastic', icon: '🌊', title: 'Zero Virgin Plastic', date: '2026-10-14', condition: 'Log 30 days of reusable containers', category: 'Conservation', stamped: false },
  { id: 'st_quiz', icon: '🎓', title: 'Climate Mastermind', date: '2026-11-01', condition: 'Score 100% on Eco Quiz', category: 'Knowledge', stamped: true },
  { id: 'st_city', icon: '🏙️', title: 'Living City Restorer', date: '2026-11-15', condition: 'Engage with 3D Living City districts', category: 'Digital Twin', stamped: true },
  { id: 'st_scan', icon: '📷', title: 'EcoScan Visionary', date: '2026-11-20', condition: 'Analyze material polymers with EcoScan AI', category: 'Innovation', stamped: true }
];

function inspectStamp(id) {
  const s = PASSPORT_STAMPS.find(item => item.id === id);
  if (!s) return;
  if (s.stamped) {
    showToast(`Official Visa: "${s.title}" (${s.category}) • Stamped: ${s.date}`);
  } else {
    showToast(`Locked Visa: ${s.condition}`);
  }
}

function renderPassportScreen() {
  const profile = AegisDB.getProfile() || {};
  const pts = profile.totalPoints || 380;
  const currentRank = getRank(pts);
  const passName = document.getElementById('passCitizenName');
  const passRank = document.getElementById('passRank');
  const passScore = document.getElementById('passScore');

  if (passName) passName.textContent = profile.name || 'Citizen';
  if (passRank) passRank.textContent = currentRank.title;
  if (passScore) passScore.textContent = `${profile.carbonScore || 72} / 100`;

  const grid = document.getElementById('passportStampsGrid');
  if (!grid) return;

  grid.innerHTML = PASSPORT_STAMPS.map(s => `
    <div class="visa-stamp ${s.stamped ? 'stamped' : ''}" onclick="inspectStamp('${s.id}')" title="${s.condition}">
      <div style="font-size:22px; margin-bottom:4px;">${s.stamped ? s.icon : '🔒'}</div>
      <div class="stamp-title">${s.title}</div>
      <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${s.stamped ? s.date : 'Locked'}</div>
    </div>
  `).join('');
}

function exportPassportCard() {
  showToast('Generating official Green Passport Card…');
  setTimeout(() => {
    window.print();
  }, 400);
}

/* ===================================================================
   12. ENVIRONMENTAL ALERTS DRAWER
=================================================================== */
const DEFAULT_ALERTS = [
  { id: 'a1', type: 'urgent', title: 'Severe AQI Advisory: Delhi NCR', text: 'Particulate density exceeding 360 µg/m³. Outdoor physical activities restricted.', time: '10m ago', unread: true },
  { id: 'a2', type: 'advisory', title: 'E-Waste Collection Drive Active', text: 'Municipal e-waste mobile kiosk deployed at Bandra East. Double points on battery drops.', time: '1h ago', unread: true },
  { id: 'a3', type: 'advisory', title: 'Weekly Plant-First Directive', text: 'You are 1 day away from completing your 4-day plant-based meals quest.', time: '3h ago', unread: true }
];

function toggleAlertsDrawer() {
  const drawer = document.getElementById('alertsDrawer');
  if (drawer) drawer.classList.toggle('open');
  renderAlerts();
}

function renderAlerts(filter = 'all') {
  const container = document.getElementById('alertsList');
  if (!container) return;

  const allAlerts = AegisDB.getAlerts() || DEFAULT_ALERTS;
  const unreadTotal = allAlerts.filter(a => a.unread).length;
  const badge = document.getElementById('alertsUnreadBadge');
  if (badge) badge.textContent = unreadTotal;

  let displayAlerts = allAlerts;
  if (filter !== 'all') {
    displayAlerts = allAlerts.filter(a => a.type === filter);
  }

  if (displayAlerts.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px;">No active alerts under this category.</div>`;
    return;
  }

  container.innerHTML = displayAlerts.map(a => `
    <div class="alert-item" style="--alert-color:${a.type === 'urgent' ? 'var(--red)' : a.type === 'advisory' ? 'var(--amber)' : 'var(--cyan)'}">
      <div class="a-title">${a.title}</div>
      <div style="color:var(--text-secondary); margin:3px 0; font-size:12.5px;">${a.text}</div>
      <div class="a-time">${a.time} • ${a.type.toUpperCase()}</div>
    </div>
  `).join('');
}

function filterAlerts(type, btn) {
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  }
  renderAlerts(type);
}

function markAllAlertsRead() {
  const alerts = AegisDB.getAlerts() || DEFAULT_ALERTS;
  alerts.forEach(a => (a.unread = false));
  AegisDB.setAlerts(alerts);
  renderAlerts();
  showToast('All alerts marked as read.');
}

function clearAllAlerts() {
  AegisDB.setAlerts([]);
  renderAlerts();
  showToast('Alerts dismissed.');
}

/* ===================================================================
   13. DASHBOARD VISUALIZATIONS & SVG CHARTS
=================================================================== */
function renderDashboard() {
  const profile = AegisDB.getProfile() || {};
  const score = profile.carbonScore || 72;
  const pts = profile.totalPoints || 380;
  const co2 = profile.co2SavedKg || 18.4;
  const streak = profile.streak?.current || 4;

  const scoreBig = document.getElementById('dashScoreBig');
  if (scoreBig) scoreBig.textContent = score;
  const orbScore = document.getElementById('carbonScoreBig');
  if (orbScore) orbScore.textContent = score;

  const ptsBig = document.getElementById('dashPointsBig');
  if (ptsBig) ptsBig.textContent = pts;

  const co2Big = document.getElementById('dashCo2Saved');
  if (co2Big) co2Big.innerHTML = `${co2.toFixed(1)} <span style="font-size:14px; font-weight:500;">kg</span>`;

  const streakBig = document.getElementById('dashStreakBig');
  if (streakBig) streakBig.innerHTML = `${streak} <span style="font-size:14px; font-weight:500;">Days</span>`;

  renderScoreHistoryChart(activeChartDays);
  renderEcoAssistantAdvice(profile);
}

function switchChartDays(days) {
  activeChartDays = days;
  document.querySelectorAll('#chartFilterGroup button').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.days, 10) === days);
  });
  const lbl = document.getElementById('chartPeriodLabel');
  if (lbl) lbl.textContent = days === 365 ? 'All time performance' : `Past ${days} days performance`;
  renderScoreHistoryChart(days);
}

function renderScoreHistoryChart(days) {
  const container = document.getElementById('dashChartContainer');
  if (!container) return;

  let history = AegisDB.getScoreHistory();
  if (!history || history.length < 2) {
    const profile = AegisDB.getProfile() || {};
    const base = profile.carbonScore || 70;
    history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const jitter = Math.round((Math.sin(i * 1.5) * 4) + (base - 3));
      history.push({ date: label, score: clamp(jitter, 40, 95) });
    }
    history[history.length - 1].score = base;
    AegisDB.setScoreHistory(history);
  }

  const dataSlice = history.slice(-Math.min(days, history.length));
  const w = 480, h = 180, pad = 28;
  const minVal = 40, maxVal = 100;

  const points = dataSlice.map((item, idx) => {
    const x = pad + (idx / Math.max(1, dataSlice.length - 1)) * (w - pad * 2);
    const y = h - pad - ((item.score - minVal) / (maxVal - minVal)) * (h - pad * 2);
    return { x, y, score: item.score, date: item.date };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${h - pad} L ${points[0].x.toFixed(1)} ${h - pad} Z`;

  let svg = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3ddc84" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3ddc84" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="${pad}" y1="${pad}" x2="${w - pad}" y2="${pad}" stroke="var(--line)" stroke-dasharray="3 3"/>
      <line x1="${pad}" y1="${h / 2}" x2="${w - pad}" y2="${h / 2}" stroke="var(--line)" stroke-dasharray="3 3"/>
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="var(--line)"/>
      <path d="${areaD}" fill="url(#chartGrad)"/>
      <path d="${pathD}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"/>
  `;

  points.forEach(p => {
    svg += `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="var(--bg-surface)" stroke="var(--green)" stroke-width="2">
        <title>${p.date}: Score ${p.score}</title>
      </circle>
      <text x="${p.x.toFixed(1)}" y="${h - 8}" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--text-muted)">${p.date}</text>
    `;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

function renderEcoAssistantAdvice(profile) {
  const container = document.getElementById('ecoAssistantList');
  if (!container) return;

  const adviceItems = [
    { icon: '🚇', text: 'Switching 2 commutes this week to the Metro reduces tailpipe emissions by ~3.2 kg CO₂.' },
    { icon: '❄️', text: 'Raising AC thermostat to 24°C saves 6% power per degree while maintaining comfort.' },
    { icon: '♻️', text: 'You have 3 e-waste kiosks nearby. Dropping obsolete chargers banks +30 Green Points.' }
  ];

  container.innerHTML = adviceItems.map(item => `
    <div class="assistant-advice-item">
      <span class="icon">${item.icon}</span>
      <div>${item.text}</div>
    </div>
  `).join('');
}

/* ===================================================================
   14. RECYCLING MAP (FIXED CARTO TILE ENGINE & LEAFLET)
=================================================================== */
let leafletMap = null;
let currentTileLayer = null;
let mapMarkers = [];
let currentCenter = { lat: 19.0760, lng: 72.8777, name: 'Mumbai' };
let currentRadiusKm = 5;

const RECYCLING_FACILITIES = [
  { id: 'f1', type: 'kabadi', cat: 'plastic', icon: '♻️', name: 'Shree Ganesh Scrap & Kabadiwala', addr: 'Plot 14, Dharavi Link Rd', latOff: 0.008, lngOff: 0.006, pts: 15, verified: true, hours: '9 AM - 8 PM' },
  { id: 'f2', type: 'e-waste', cat: 'e-waste', icon: '🖥️', name: 'Municipal E-Waste Deposit Station', addr: 'Near Ward Office, Bandra East', latOff: -0.012, lngOff: 0.014, pts: 30, verified: true, hours: '10 AM - 6 PM' },
  { id: 'f3', type: 'battery', cat: 'battery', icon: '🔋', name: 'EcoVolt Battery Drop-Off Kiosk', addr: 'Metro Station Concourse Level', latOff: 0.006, lngOff: -0.010, pts: 25, verified: true, hours: '6 AM - 10 PM' },
  { id: 'f4', type: 'metal', cat: 'metal', icon: '🔩', name: 'Kurla Iron & Foundry Scrap Dealer', addr: 'LBS Marg, Kurla West', latOff: -0.016, lngOff: -0.008, pts: 20, verified: false, hours: '9:30 AM - 7 PM' },
  { id: 'f5', type: 'plastic', cat: 'plastic', icon: '🥤', name: 'Swachh Plastic Drop-Off Bin', addr: 'Shivaji Park Promenade', latOff: 0.015, lngOff: -0.016, pts: 10, verified: true, hours: '24/7 Accessible' },
  { id: 'f6', type: 'kabadi', cat: 'plastic', icon: '📦', name: 'Ramzan Kabadiwala (Dry Waste)', addr: 'Station Rd, Santacruz East', latOff: 0.018, lngOff: 0.012, pts: 18, verified: false, hours: '8 AM - 8 PM' },
  { id: 'f7', type: 'e-waste', cat: 'e-waste', icon: '📱', name: 'TechRecycle Certified Recycler', addr: 'MIDC Industrial Area, Andheri', latOff: -0.022, lngOff: 0.019, pts: 35, verified: true, hours: '10 AM - 7 PM' },
  { id: 'f8', type: 'battery', cat: 'battery', icon: '⚡', name: 'GreenCell Battery Exchange Kiosk', addr: 'HPCL Fuel Station, Worli', latOff: -0.009, lngOff: -0.015, pts: 22, verified: true, hours: '24/7 Drop Box' }
];

function createBaseMapTileLayer(theme) {
  // Free, high-speed, open-CORS basemaps with zero 'API KEY REQUIRED' watermarks
  // Dark Canvas: Esri World Dark Gray Base
  // Light Canvas: Esri World Light Gray Base
  const isLight = (theme === 'light');
  const tileUrl = isLight
    ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    : 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

  const layer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    maxZoom: 19
  });

  // Graceful fallback to OSM standard tiles if Esri tiles encounter a network error
  layer.on('tileerror', function() {
    console.warn('[Leaflet] Primary tile load error; falling back to OpenStreetMap standard tiles.');
    if (leafletMap && !leafletMap._osmFallbackActive) {
      leafletMap._osmFallbackActive = true;
      const fallbackLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });
      fallbackLayer.addTo(leafletMap);
    }
  });

  return layer;
}

function initLeafletMap() {
  if (typeof L === 'undefined' || document.getElementById('leafletMap') === null) return;
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  leafletMap = L.map('leafletMap', {
    scrollWheelZoom: false,
    zoomControl: true
  }).setView([currentCenter.lat, currentCenter.lng], 13);

  currentTileLayer = createBaseMapTileLayer(theme);
  currentTileLayer.addTo(leafletMap);

  plotFacilitiesOnMap();
}

function onMapScreenEnter() {
  if (!leafletMap) {
    initLeafletMap();
  }
  const profile = AegisDB.getProfile();
  if (profile && profile.city && profile.city !== currentCenter.name) {
    recenterMapTo(profile.city);
  }
  // Multiple timeouts ensure map dimensions calculate properly after DOM un-hides
  setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 80);
  setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 250);
}

function refreshMapTiles() {
  if (leafletMap && currentTileLayer) {
    leafletMap.removeLayer(currentTileLayer);
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    currentTileLayer = createBaseMapTileLayer(theme);
    currentTileLayer.addTo(leafletMap);
    leafletMap.invalidateSize();
    showToast('Map tiles re-synchronized.');
  }
}

function plotFacilitiesOnMap() {
  if (!leafletMap) return;

  mapMarkers.forEach(m => leafletMap.removeLayer(m.marker));
  mapMarkers = [];

  const userIcon = L.divIcon({
    className: '',
    html: '<div style="width:16px;height:16px;border-radius:50%;background:#3ddc84;border:3px solid #fff;box-shadow:0 0 14px #3ddc84;"></div>'
  });
  L.marker([currentCenter.lat, currentCenter.lng], { icon: userIcon })
    .addTo(leafletMap)
    .bindPopup(`<b>${currentCenter.name}</b><br>Your designated location.`);

  const listContainer = document.getElementById('mapFacilityList');
  if (listContainer) listContainer.innerHTML = '';

  let visibleCount = 0;
  RECYCLING_FACILITIES.forEach(f => {
    const mLat = currentCenter.lat + f.latOff;
    const mLng = currentCenter.lng + f.lngOff;
    const distKm = +(calculateDistance(currentCenter.lat, currentCenter.lng, mLat, mLng)).toFixed(1);

    if (distKm <= currentRadiusKm) {
      visibleCount++;
      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:24px; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5));">${f.icon}</div>`,
        iconSize: [28, 28]
      });

      const marker = L.marker([mLat, mLng], { icon }).addTo(leafletMap);
      const popupHtml = `
        <div style="font-family:var(--font-body); font-size:12.5px; line-height:1.4;">
          <b style="font-size:13.5px; color:var(--text-main);">${f.name}</b><br>
          <span style="color:var(--text-muted);">${f.addr}</span><br>
          <div style="margin:4px 0;">⭐ <b>${f.pts} Green Points</b> on Drop</div>
          <div style="font-size:11px; color:var(--text-secondary); margin-bottom:6px;">🕒 ${f.hours}</div>
          <a href="https://www.google.com/maps/search/?api=1&query=${mLat},${mLng}" target="_blank" rel="noopener" style="color:var(--green-soft); font-weight:700; text-decoration:underline;">Get GPS Directions →</a>
        </div>
      `;
      marker.bindPopup(popupHtml);
      mapMarkers.push({ marker, data: f, distKm });

      if (listContainer) {
        const item = document.createElement('div');
        item.className = 'map-facility-item';
        item.onclick = () => {
          leafletMap.setView([mLat, mLng], 15);
          marker.openPopup();
        };
        item.innerHTML = `
          <div class="f-name">
            <span>${f.icon} ${f.name}</span>
            <span class="mono" style="color:var(--green-soft); font-size:11.5px;">${distKm} km</span>
          </div>
          <div class="f-cat">
            <span>${f.addr}</span>
            ${f.verified ? '<span class="badge-verified">Verified</span>' : '<span class="badge-demo">Demo</span>'}
          </div>
        `;
        listContainer.appendChild(item);
      }
    }
  });

  const countBadge = document.getElementById('facilityCount');
  if (countBadge) countBadge.textContent = visibleCount;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function setMapRadius(radiusKm) {
  currentRadiusKm = radiusKm;
  document.querySelectorAll('#mapRadiusPills button').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.r, 10) === radiusKm);
  });
  const lbl = document.getElementById('mapRadiusLabel');
  if (lbl) lbl.textContent = `${currentCenter.name} · ${radiusKm} km radius`;
  plotFacilitiesOnMap();
}

// Map category filters
document.querySelectorAll('#mapFilters button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mapFilters button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const f = btn.dataset.f;

    mapMarkers.forEach(m => {
      const show = (f === 'all' || m.data.cat === f || m.data.type === f);
      const el = m.marker.getElement();
      if (el) el.style.display = show ? '' : 'none';
    });
  });
});

async function geocodeCity(cityName) {
  const fallbacks = {
    'delhi': { lat: 28.6139, lng: 77.2090, name: 'Delhi NCR' },
    'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
    'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
    'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
    'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune' }
  };
  const key = cityName.toLowerCase().trim();
  return fallbacks[key] || { lat: 19.0760, lng: 72.8777, name: cityName };
}

async function recenterMapTo(cityName) {
  if (!cityName) return;
  const coords = await geocodeCity(cityName);
  currentCenter = coords;
  if (!leafletMap) initLeafletMap();
  leafletMap.setView([coords.lat, coords.lng], 13);

  const inline = document.getElementById('mapCityInline');
  if (inline) inline.textContent = coords.name;
  const radLbl = document.getElementById('mapRadiusLabel');
  if (radLbl) radLbl.textContent = `${coords.name} · ${currentRadiusKm} km radius`;

  plotFacilitiesOnMap();
}

function recenterMapToInput() {
  const val = document.getElementById('mapCityInput').value.trim();
  if (val) recenterMapTo(val);
}

function locateUserPosition() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported in browser.');
    return;
  }
  showToast('Detecting location coordinates…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentCenter = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: 'Detected Location'
      };
      if (leafletMap) leafletMap.setView([currentCenter.lat, currentCenter.lng], 14);
      plotFacilitiesOnMap();
      showToast('Centered on your GPS location.');
    },
    () => {
      showToast('Location permission unavailable. Retaining city default.', true);
    }
  );
}

/* ===================================================================
   15. AQI & ATMOSPHERIC STATION TELEMETRY
=================================================================== */
const CITY_AQI_BENCHMARKS = [
  { city: 'Mumbai', aqi: 142, cat: 'Moderate', pm25: 52, color: 'var(--amber)' },
  { city: 'Delhi NCR', aqi: 368, cat: 'Severe', pm25: 184, color: 'var(--red)' },
  { city: 'Bengaluru', aqi: 68, cat: 'Satisfactory', pm25: 22, color: 'var(--green)' },
  { city: 'Kolkata', aqi: 195, cat: 'Poor', pm25: 86, color: 'var(--amber)' },
  { city: 'Chennai', aqi: 74, cat: 'Satisfactory', pm25: 26, color: 'var(--green)' },
  { city: 'Pune', aqi: 110, cat: 'Moderate', pm25: 41, color: 'var(--amber)' }
];

function refreshAqiTelemetry() {
  const profile = AegisDB.getProfile() || {};
  const currentCity = profile.city || 'Mumbai';
  const match = CITY_AQI_BENCHMARKS.find(c => c.city.toLowerCase() === currentCity.toLowerCase()) || CITY_AQI_BENCHMARKS[0];

  const aqiNum = document.getElementById('aqiNumber');
  if (aqiNum) aqiNum.textContent = match.aqi;

  const catBadge = document.getElementById('aqiCategoryBadge');
  if (catBadge) {
    catBadge.textContent = match.cat.toUpperCase();
    catBadge.style.color = match.color;
  }

  const statusCity = document.getElementById('statusBarCity');
  if (statusCity) statusCity.textContent = `${match.city} · Active`;

  const statusAqi = document.getElementById('statusBarAqi');
  if (statusAqi) {
    statusAqi.textContent = `AQI ${match.aqi} · ${match.cat}`;
    statusAqi.style.color = match.color;
  }

  const adviceHeadline = document.getElementById('aqiHealthHeadline');
  const adviceText = document.getElementById('aqiHealthAdvice');
  if (match.aqi > 300) {
    if (adviceHeadline) { adviceHeadline.textContent = 'Critical Alert (Severe AQI):'; adviceHeadline.style.color = 'var(--red)'; }
    if (adviceText) adviceText.textContent = 'Avoid all outdoor exertion. High-efficiency N95 masks are recommended. Air purifiers should be active indoors.';
  } else if (match.aqi > 150) {
    if (adviceHeadline) { adviceHeadline.textContent = 'Poor Air Quality Advisory:'; adviceHeadline.style.color = 'var(--amber)'; }
    if (adviceText) adviceText.textContent = 'Sensitive groups and elderly individuals should restrict prolonged outdoor exercise during evening peak hours.';
  } else {
    if (adviceHeadline) { adviceHeadline.textContent = 'Favorable Ambient Air:'; adviceHeadline.style.color = 'var(--green-soft)'; }
    if (adviceText) adviceText.textContent = 'Air quality is within acceptable safety parameters for outdoor fitness, commutes, and recreation.';
  }

  const benchRow = document.getElementById('cityBenchmarkRow');
  if (benchRow) {
    benchRow.innerHTML = CITY_AQI_BENCHMARKS.map(b => `
      <div style="background:var(--bg-surface-elevated); border:1px solid var(--line); border-radius:var(--radius-xs); padding:8px 10px; cursor:pointer;" onclick="switchAqiCity('${b.city}')">
        <div style="font-size:11px; color:var(--text-muted);">${b.city}</div>
        <div class="mono" style="font-weight:700; color:${b.color}; font-size:14px;">${b.aqi}</div>
      </div>
    `).join('');
  }
}

function switchAqiCity(cityName) {
  let profile = AegisDB.getProfile() || {};
  profile.city = cityName;
  AegisDB.setProfile(profile);
  refreshAqiTelemetry();
  recenterMapTo(cityName);
}

/* ===================================================================
   16. MISSION BOARD 3.0 & GAMIFIED REWARDS
=================================================================== */
const DEFAULT_MISSIONS = [
  { id: 'm_bag', period: 'daily', title: 'Sabzi Mandi Cloth Bag Warrior', desc: 'Carry personal reusable bags for grocery shopping and avoid plastic carry bags.', pts: 35, icon: '🛍️' },
  { id: 'm_metro', period: 'daily', title: 'Public Transit Legend', desc: 'Take a commute leg via Metro, local train, or bus instead of a private vehicle.', pts: 40, icon: '🚆' },
  { id: 'm_vampire', period: 'daily', title: 'Unplug Vampire Electronics', desc: 'Switch off power strips and unplug chargers before leaving the room.', pts: 20, icon: '🔌' },
  { id: 'm_plant', period: 'weekly', title: 'Plant-First Plate Week', desc: 'Consume completely plant-based or vegetarian meals for 4 consecutive days.', pts: 60, icon: '🥗' },
  { id: 'm_ewaste', period: 'weekly', title: 'E-Waste Drop-Off Hero', desc: 'Hand over old cables, batteries, or unused tech to an authorized recycler.', pts: 50, icon: '🔋' },
  { id: 'm_compost', period: 'monthly', title: 'Balcony Composter Maintenance', desc: 'Segregate 100% of wet food peels into kitchen matka composting for 30 days.', pts: 120, icon: '🪴' },
  { id: 'm_sup', period: 'monthly', title: 'Zero Single-Use Plastic Month', desc: 'Refuse all plastic cutlery, disposable straws, and bottled water bottles.', pts: 100, icon: '🧴' },
  { id: 'm_tree', period: 'community', title: 'Community Ward Cleanup Drive', desc: 'Participate in a neighborhood plastic pickup or municipal tree plantation.', pts: 200, icon: '🌳' },
  { id: 'm_solar', period: 'community', title: 'Renewable Advocacy Ambassador', desc: 'Educate 3 neighbors on rooftop solar subsidies or home segregation.', pts: 150, icon: '☀️' }
];

const REWARD_MILESTONES = [
  { id: 'rew_first', targetPts: 150, title: 'Eco Starter Voucher', code: 'AEGIS10', desc: '10% off at partnered organic & zero-waste grocers.', reward: 'Coupon: AEGIS10' },
  { id: 'rew_350', targetPts: 350, title: 'Clean Commuter Pass', code: 'METRO50', desc: '₹50 transit voucher for municipal public transit.', reward: 'Coupon: METRO50' },
  { id: 'rew_750', targetPts: 750, title: 'Sustainable Apparel Credit', code: 'SWACHH250', desc: '₹250 off on Khadi & recycled cotton garments.', reward: 'Coupon: SWACHH250' },
  { id: 'rew_1500', targetPts: 1500, title: 'Planet Protector Trophy Pack', code: 'PLANET1000', desc: 'Exclusive citizen sustainability certificate & merchant kit.', reward: 'Certificate & ₹1,000 Voucher' }
];

function renderMissions(filterPeriod = 'all') {
  const container = document.getElementById('missionGrid');
  if (!container) return;

  const missionStates = AegisDB.getMissions();
  const missions = DEFAULT_MISSIONS.filter(m => filterPeriod === 'all' || m.period === filterPeriod);

  let totalAvailablePts = 0;
  let earnedPts = 0;

  DEFAULT_MISSIONS.forEach(m => {
    totalAvailablePts += m.pts;
    if (missionStates[m.id]?.done) earnedPts += m.pts;
  });

  const bar = document.getElementById('missionOverallBar');
  if (bar) bar.style.width = Math.round((earnedPts / Math.max(1, totalAvailablePts)) * 100) + '%';

  container.innerHTML = missions.map(m => {
    const isDone = !!missionStates[m.id]?.done;
    return `
      <div class="quest ${isDone ? 'done' : ''}" onclick="toggleMissionClaim('${m.id}')">
        <div class="quest-icon">${m.icon}</div>
        <div class="quest-body">
          <div class="k">${m.period} Directive</div>
          <h5>${m.title}</h5>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4;">${m.desc}</p>
          <div class="quest-progress">
            <i style="width:${isDone ? '100%' : '0%'}"></i>
          </div>
          <div style="margin-top:8px;">
            <span class="badge-pts">+${m.pts} PTS</span>
          </div>
        </div>
        <div class="quest-check">${isDone ? '✓' : ''}</div>
      </div>
    `;
  }).join('');

  renderMilestoneRewards();
}

function filterMissions(period) {
  document.querySelectorAll('#periodTabs button').forEach(b => {
    b.classList.toggle('on', b.dataset.period === period);
  });
  renderMissions(period);
}

function toggleMissionClaim(id) {
  const mission = DEFAULT_MISSIONS.find(m => m.id === id);
  if (!mission) return;

  const missionsState = AegisDB.getMissions();
  if (missionsState[id]?.done) {
    showToast('Directive already claimed.', true);
    return;
  }

  missionsState[id] = { done: true, claimedAt: new Date().toISOString() };
  AegisDB.setMissions(missionsState);

  const profile = AegisDB.getProfile() || {};
  profile.totalPoints = (profile.totalPoints || 0) + mission.pts;
  AegisDB.setProfile(profile);

  renderAuthState();
  renderMissions();
  showToast(`Directive Accomplished! +${mission.pts} Green Points.`);
}

function renderMilestoneRewards() {
  const container = document.getElementById('milestoneStrip');
  if (!container) return;

  const profile = AegisDB.getProfile() || {};
  const currentPts = profile.totalPoints || 0;
  const claimedRewards = AegisDB.getRewards();

  container.innerHTML = REWARD_MILESTONES.map(m => {
    const pct = clamp(Math.round((currentPts / m.targetPts) * 100), 0, 100);
    const unlocked = pct >= 100;
    const isClaimed = claimedRewards.some(r => r.id === m.id);

    return `
      <div class="milestone-card ${unlocked ? 'unlocked' : ''}">
        <div class="mt">${m.title}</div>
        <div class="md">${m.desc} (${m.targetPts} pts requirement)</div>
        <div class="mbar"><i style="width:${pct}%"></i></div>
        <div class="reward">
          <span>🎁 ${m.reward}</span>
          <button class="cta sm ${isClaimed ? 'ghost' : ''}" ${(!unlocked || isClaimed) ? 'disabled' : ''} onclick="claimRewardMilestone('${m.id}')">
            ${isClaimed ? 'Claimed' : 'Unlock Code'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  const historyList = document.getElementById('rewardHistoryList');
  if (historyList) {
    if (!claimedRewards.length) {
      historyList.innerHTML = `<span style="color:var(--text-muted); font-size:13px;">Unlocked vouchers and promo codes will appear here once claimed.</span>`;
    } else {
      historyList.innerHTML = claimedRewards.map(r => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-surface-elevated); border:1px solid var(--line); border-radius:var(--radius-xs); font-size:13px;">
          <div><b>${r.title}</b> — <span class="mono" style="color:var(--amber);">${r.code}</span></div>
          <span class="badge-verified">Active Voucher</span>
        </div>
      `).join('');
    }
  }
}

function claimRewardMilestone(id) {
  const milestone = REWARD_MILESTONES.find(m => m.id === id);
  if (!milestone) return;

  const rewards = AegisDB.getRewards();
  if (rewards.some(r => r.id === id)) return;

  rewards.push({
    id: milestone.id,
    title: milestone.title,
    code: milestone.code,
    claimedAt: new Date().toISOString()
  });
  AegisDB.setRewards(rewards);

  renderMilestoneRewards();
  showToast(`Voucher Unlocked! Code: ${milestone.code}`);
}

/* ===================================================================
   17. GAME ZONE (DRAG-AND-DROP SEGREGATION, CATCH, QUIZ & MEMORY)
=================================================================== */

// Game 1: Quick Segregation with Drag and Drop
const SEG_ITEMS = [
  { emoji: '🍎', name: 'Apple Core', type: 'wet' },
  { emoji: '🍌', name: 'Banana Peel', type: 'wet' },
  { emoji: '🥬', name: 'Vegetable Scraps', type: 'wet' },
  { emoji: '🗞️', name: 'Newspaper', type: 'dry' },
  { emoji: '📦', name: 'Cardboard Box', type: 'dry' },
  { emoji: '🥤', name: 'Clean Plastic Cup', type: 'dry' },
  { emoji: '🔋', name: 'Lithium Battery', type: 'toxic' },
  { emoji: '🖥️', name: 'Computer Circuit', type: 'toxic' },
  { emoji: '💡', name: 'CFL Fluorescent Bulb', type: 'toxic' }
];

let curSegItem = SEG_ITEMS[0];
let g1Score = 0;

function nextSegItem() {
  curSegItem = SEG_ITEMS[Math.floor(Math.random() * SEG_ITEMS.length)];
  const el = document.getElementById('segItem');
  const lbl = document.getElementById('segItemLabel');
  if (el) el.textContent = curSegItem.emoji;
  if (lbl) lbl.textContent = curSegItem.name;
}

function onSegItemDragStart(e) {
  e.dataTransfer.setData('text/plain', curSegItem.type);
}

function onSegItemDrop(e, stream) {
  e.preventDefault();
  document.querySelectorAll('.drop-bin').forEach(b => b.classList.remove('drag-over'));
  segGuess(stream);
}

function segGuess(stream) {
  if (stream === curSegItem.type) {
    g1Score += 5;
    showToast('Correct Stream! +5 pts');
  } else {
    g1Score = Math.max(0, g1Score - 2);
    showToast('Wrong Bin! -2 pts', true);
  }
  const scoreEl = document.getElementById('g1ScoreDisplay');
  if (scoreEl) scoreEl.textContent = `Score: ${g1Score}`;
  nextSegItem();
}

function claimGame1Points() {
  const earned = Math.floor(g1Score / 10);
  if (earned > 0) {
    const profile = AegisDB.getProfile() || {};
    profile.totalPoints = (profile.totalPoints || 0) + earned;
    AegisDB.setProfile(profile);
    g1Score = 0;
    const scoreEl = document.getElementById('g1ScoreDisplay');
    if (scoreEl) scoreEl.textContent = 'Score: 0';
    renderAuthState();
    showToast(`Claimed +${earned} Green Points!`);
  } else {
    showToast('Reach at least 10 score to claim points.');
  }
}

// Game 2: Catch the Recyclables
let g2Running = false;
let g2Score = 0;
let catcherPos = 40;
let fallers = [];
let g2Interval = null;

function startCatchGame() {
  if (g2Running) return;
  g2Running = true;
  g2Score = 0;
  fallers = [];
  document.getElementById('g2Score').textContent = 'Score: 0';
  const area = document.getElementById('catchArea');

  g2Interval = setInterval(() => {
    fallers.forEach((f, idx) => {
      f.y += 4;
      f.el.style.top = f.y + 'px';
      if (f.y > 135) {
        if (Math.abs(f.x - catcherPos) < 16) {
          if (f.isToxic) {
            g2Score = Math.max(0, g2Score - 10);
            showToast('Toxic battery caught! -10', true);
          } else {
            g2Score += 15;
          }
          document.getElementById('g2Score').textContent = `Score: ${g2Score}`;
        }
        f.el.remove();
        fallers.splice(idx, 1);
      }
    });

    if (Math.random() < 0.08) {
      const el = document.createElement('div');
      const isToxic = Math.random() > 0.65;
      el.textContent = isToxic ? '🔋' : '♻️';
      el.style.position = 'absolute';
      el.style.fontSize = '22px';
      const x = 10 + Math.random() * 80;
      el.style.left = x + '%';
      el.style.top = '0px';
      area.appendChild(el);
      fallers.push({ el, x, y: 0, isToxic });
    }
  }, 100);
}

function moveCatcher(dir) {
  catcherPos = clamp(catcherPos + dir * 18, 5, 82);
  const el = document.getElementById('catcher');
  if (el) el.style.left = catcherPos + '%';
}

function stopCatchGame() {
  if (!g2Running) return;
  g2Running = false;
  clearInterval(g2Interval);
  fallers.forEach(f => f.el.remove());
  fallers = [];

  const earned = Math.floor(g2Score / 20);
  if (earned > 0) {
    const profile = AegisDB.getProfile() || {};
    profile.totalPoints = (profile.totalPoints || 0) + earned;
    AegisDB.setProfile(profile);
    renderAuthState();
    showToast(`Claimed +${earned} Green Points!`);
  }
  g2Score = 0;
  document.getElementById('g2Score').textContent = 'Score: 0';
}

// Game 3: Eco Trivia Quiz
const QUIZ_QUESTIONS = [
  {
    q: 'Which bin stream is mandated for kitchen wet waste under SWM Rules 2016?',
    options: ['Green Bin', 'Blue Bin', 'Red Bin', 'Yellow Bin'],
    answer: 0,
    explain: 'Green bins are designated for kitchen organic and compostable wet waste.'
  },
  {
    q: 'What is the optimal air conditioner setpoint for power conservation recommended by BEE?',
    options: ['18°C', '21°C', '24°C', '16°C'],
    answer: 2,
    explain: '24°C maximizes thermal comfort while reducing electricity draw.'
  },
  {
    q: 'Why should lithium batteries never be discarded into general municipal garbage?',
    options: ['They dissolve easily', 'Risk of heavy metal groundwater leaching and landfill fires', 'They become plastic', 'They produce methane'],
    answer: 1,
    explain: 'Lithium battery damage causes chemical fires and contaminates soil with cobalt.'
  }
];

let curQuizIdx = 0;
let quizScore = 0;

function loadNextQuizQuestion() {
  curQuizIdx = (curQuizIdx + 1) % QUIZ_QUESTIONS.length;
  renderQuizCard();
}

function renderQuizCard() {
  const item = QUIZ_QUESTIONS[curQuizIdx];
  const qText = document.getElementById('quizQuestionText');
  const optsWrap = document.getElementById('quizOptionsWrap');
  const feedback = document.getElementById('quizFeedback');

  if (qText) qText.textContent = `${curQuizIdx + 1}. ${item.q}`;
  if (feedback) feedback.textContent = 'Select an answer';

  if (optsWrap) {
    optsWrap.innerHTML = item.options.map((opt, i) => `
      <button class="quiz-btn" onclick="checkQuizAnswer(${i})">${opt}</button>
    `).join('');
  }
}

function checkQuizAnswer(chosenIdx) {
  const item = QUIZ_QUESTIONS[curQuizIdx];
  const buttons = document.querySelectorAll('.quiz-options button');
  const feedback = document.getElementById('quizFeedback');

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === item.answer) btn.classList.add('correct');
    else if (i === chosenIdx) btn.classList.add('wrong');
  });

  if (chosenIdx === item.answer) {
    quizScore += 10;
    const scoreEl = document.getElementById('quizScoreDisplay');
    if (scoreEl) scoreEl.textContent = `Quiz Pts: ${quizScore}`;
    if (feedback) feedback.textContent = '✓ Correct! ' + item.explain;
    showToast('Quiz Correct! +10 Green Points');

    const profile = AegisDB.getProfile() || {};
    profile.totalPoints = (profile.totalPoints || 0) + 10;
    AegisDB.setProfile(profile);
    renderAuthState();
  } else {
    if (feedback) feedback.textContent = '✕ Incorrect. ' + item.explain;
  }
}

// Game 4: Green Memory Match
const MEMORY_ICONS = ['🌱', '♻️', '🚲', '💧', '☀️', '🐝'];
let flippedTiles = [];
let matchedCount = 0;

function initMemoryGame() {
  matchedCount = 0;
  flippedTiles = [];
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;

  const pairs = [...MEMORY_ICONS, ...MEMORY_ICONS].sort(() => Math.random() - 0.5);
  grid.innerHTML = '';

  pairs.forEach((icon, idx) => {
    const tile = document.createElement('div');
    tile.className = 'memory-tile';
    tile.dataset.icon = icon;
    tile.dataset.idx = idx;
    tile.textContent = '❓';
    tile.onclick = () => onMemoryTileClick(tile);
    grid.appendChild(tile);
  });

  const matchesEl = document.getElementById('memoryMatches');
  if (matchesEl) matchesEl.textContent = 'Pairs: 0/6';
}

function onMemoryTileClick(tile) {
  if (flippedTiles.length >= 2 || tile.classList.contains('revealed') || tile.classList.contains('matched')) return;

  tile.classList.add('revealed');
  tile.textContent = tile.dataset.icon;
  flippedTiles.push(tile);

  if (flippedTiles.length === 2) {
    const [t1, t2] = flippedTiles;
    if (t1.dataset.icon === t2.dataset.icon) {
      t1.classList.add('matched');
      t2.classList.add('matched');
      matchedCount++;
      const matchesEl = document.getElementById('memoryMatches');
      if (matchesEl) matchesEl.textContent = `Pairs: ${matchedCount}/6`;
      flippedTiles = [];

      if (matchedCount === 6) {
        showToast('Memory Match Complete! +25 Green Points!');
        const profile = AegisDB.getProfile() || {};
        profile.totalPoints = (profile.totalPoints || 0) + 25;
        AegisDB.setProfile(profile);
        renderAuthState();
      }
    } else {
      setTimeout(() => {
        t1.classList.remove('revealed');
        t1.textContent = '❓';
        t2.classList.remove('revealed');
        t2.textContent = '❓';
        flippedTiles = [];
      }, 700);
    }
  }
}

/* ===================================================================
   18. ACTIVITY TRACKER
=================================================================== */
let currentActivityCat = 'transport';

const ACTIVITY_PRESETS = {
  transport: [
    { label: 'Walked / Cycled', metricUnit: 'km', co2PerUnit: 0.16, ptsPerUnit: 3, defaultVal: 4 },
    { label: 'Metro / Rail Ride', metricUnit: 'km', co2PerUnit: 0.11, ptsPerUnit: 2, defaultVal: 12 },
    { label: 'Carpool / Shared Cab', metricUnit: 'km', co2PerUnit: 0.08, ptsPerUnit: 1.5, defaultVal: 10 }
  ],
  energy: [
    { label: 'AC Switched Off (24°C swap)', metricUnit: 'hours', co2PerUnit: 0.28, ptsPerUnit: 5, defaultVal: 2 },
    { label: 'Unplugged Idle Electronics', metricUnit: 'appliances', co2PerUnit: 0.12, ptsPerUnit: 4, defaultVal: 3 },
    { label: 'Solar Rooftop Consumption', metricUnit: 'kWh', co2PerUnit: 0.72, ptsPerUnit: 8, defaultVal: 3 }
  ],
  waste: [
    { label: 'Wet & Dry Waste Segregated', metricUnit: 'days', co2PerUnit: 0.40, ptsPerUnit: 8, defaultVal: 1 },
    { label: 'Balcony Composting Logged', metricUnit: 'kg', co2PerUnit: 0.55, ptsPerUnit: 12, defaultVal: 2 },
    { label: 'E-Waste Disposed at Kiosk', metricUnit: 'items', co2PerUnit: 1.20, ptsPerUnit: 25, defaultVal: 1 }
  ],
  water: [
    { label: 'Bucket Bath Swap', metricUnit: 'buckets', co2PerUnit: 0.18, ptsPerUnit: 4, defaultVal: 1 },
    { label: 'Rainwater Harvesting Utilized', metricUnit: 'liters', co2PerUnit: 0.05, ptsPerUnit: 2, defaultVal: 20 }
  ],
  food: [
    { label: '100% Plant-Based Meals Day', metricUnit: 'meals', co2PerUnit: 0.85, ptsPerUnit: 10, defaultVal: 3 },
    { label: 'Zero Plate Food Waste', metricUnit: 'meals', co2PerUnit: 0.45, ptsPerUnit: 6, defaultVal: 2 }
  ]
};

function selectActivityCategory(cat) {
  currentActivityCat = cat;
  document.querySelectorAll('#activityCategoryTabs button').forEach(b => {
    b.classList.toggle('on', b.dataset.cat === cat);
  });

  const row = document.getElementById('activityPresetsRow');
  if (!row) return;
  row.innerHTML = '';

  const presets = ACTIVITY_PRESETS[cat] || [];
  presets.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = idx === 0 ? 'on' : '';
    btn.textContent = p.label;
    btn.onclick = () => {
      row.querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const metricLbl = document.getElementById('activityMetricLabel');
      if (metricLbl) metricLbl.textContent = `Quantity (${p.metricUnit})`;
      const metricInp = document.getElementById('activityMetricInput');
      if (metricInp) metricInp.value = p.defaultVal;
    };
    row.appendChild(btn);
  });

  if (presets[0]) {
    const metricLbl = document.getElementById('activityMetricLabel');
    if (metricLbl) metricLbl.textContent = `Quantity (${presets[0].metricUnit})`;
    const metricInp = document.getElementById('activityMetricInput');
    if (metricInp) metricInp.value = presets[0].defaultVal;
  }
}

function submitDetailedActivity() {
  const activeBtn = document.querySelector('#activityPresetsRow button.on');
  const presets = ACTIVITY_PRESETS[currentActivityCat] || [];
  const selected = presets.find(p => p.label === activeBtn?.textContent) || presets[0];
  if (!selected) return;

  const metricVal = parseFloat(document.getElementById('activityMetricInput').value) || selected.defaultVal;
  const notes = document.getElementById('activityNotesInput').value.trim();

  const co2AvoidedKg = +(metricVal * selected.co2PerUnit).toFixed(2);
  const pointsEarned = Math.round(metricVal * selected.ptsPerUnit);

  const newActivity = {
    id: 'act_' + Date.now(),
    category: currentActivityCat,
    label: selected.label,
    quantity: metricVal,
    unit: selected.metricUnit,
    co2Kg: co2AvoidedKg,
    points: pointsEarned,
    notes: notes,
    timestamp: new Date().toISOString()
  };

  const activities = AegisDB.getActivities();
  activities.unshift(newActivity);
  AegisDB.setActivities(activities);

  const profile = AegisDB.getProfile() || {};
  profile.totalPoints = (profile.totalPoints || 0) + pointsEarned;
  profile.co2SavedKg = +((profile.co2SavedKg || 0) + co2AvoidedKg).toFixed(2);
  profile.carbonScore = clamp((profile.carbonScore || 70) + 1, 10, 99);
  AegisDB.setProfile(profile);

  renderAuthState();
  renderActivityHistory();
  showToast(`Recorded! +${pointsEarned} Green Points (${co2AvoidedKg} kg CO₂ saved).`);
  document.getElementById('activityNotesInput').value = '';
}

function renderActivityHistory(filter = 'all') {
  const container = document.getElementById('activityHistoryTable');
  if (!container) return;

  const activities = AegisDB.getActivities();
  const filtered = filter === 'all' ? activities : activities.filter(a => a.category === filter);

  if (!filtered.length) {
    container.innerHTML = `<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">No activities recorded under this filter yet.</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const timeFormatted = new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:var(--bg-surface-elevated); border:1px solid var(--line); border-radius:var(--radius-sm); font-size:13px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:20px;">${getActivityIcon(item.category)}</span>
          <div>
            <div style="font-weight:700; color:var(--text-main);">${item.label}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">${item.quantity} ${item.unit} ${item.notes ? `· "${item.notes}"` : ''} · ${timeFormatted}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="text-align:right;">
            <span class="badge-pts">+${item.points} PTS</span>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${item.co2Kg} kg CO₂</div>
          </div>
          <button onclick="deleteActivityRecord('${item.id}')" title="Delete entry" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px;">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function deleteActivityRecord(id) {
  let activities = AegisDB.getActivities();
  const item = activities.find(a => a.id === id);
  if (!item) return;

  activities = activities.filter(a => a.id !== id);
  AegisDB.setActivities(activities);

  const profile = AegisDB.getProfile() || {};
  profile.totalPoints = Math.max(0, (profile.totalPoints || 0) - item.points);
  profile.co2SavedKg = Math.max(0, +((profile.co2SavedKg || 0) - item.co2Kg).toFixed(2));
  AegisDB.setProfile(profile);

  renderAuthState();
  renderActivityHistory();
  showToast('Activity record deleted.');
}

function filterActivityHistory(cat) {
  document.querySelectorAll('#activityHistoryFilter button').forEach(b => {
    b.classList.toggle('on', b.dataset.filter === cat);
  });
  renderActivityHistory(cat);
}

function getActivityIcon(cat) {
  return { transport: '🚶', energy: '⚡', waste: '♻️', water: '💧', food: '🥗' }[cat] || '🌱';
}

/* ===================================================================
   19. DAILY GYAN & CITIZENS NETWORK
=================================================================== */
const GYAN_ARTICLES = [
  { id: 'g1', cat: 'waste', icon: '🪴', title: 'Matka Composting for Balconies', desc: 'Layer dry leaves with wet kitchen scraps in a terracotta pot to convert waste to compost in 21 days.' },
  { id: 'g2', cat: 'water', icon: '💧', title: 'Rooftop Rainwater Harvesting', desc: 'Directing monsoon terrace runoff into a desiltation gravel filter replenishes urban aquifers.' },
  { id: 'g3', cat: 'habits', icon: '🚲', title: 'The 3-Kilometer Mobility Rule', desc: 'Trips under 3km on foot or bicycle save more emissions than switching to an electric vehicle.' },
  { id: 'g4', cat: 'energy', icon: '🔌', title: 'Mitigating Phantom Vampire Draw', desc: 'Microwaves and chargers consume standby power 24/7. Using switched multi-plugs cuts up to 10% from bills.' }
];

function renderGyanFeed(filterCat = 'all', searchQuery = '') {
  const container = document.getElementById('gyanGrid');
  if (!container) return;

  const savedIds = AegisDB.getSavedGyan();
  let list = GYAN_ARTICLES;

  if (filterCat === 'saved') list = list.filter(a => savedIds.includes(a.id));
  else if (filterCat !== 'all') list = list.filter(a => a.cat === filterCat);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
  }

  container.innerHTML = list.map(item => {
    const isSaved = savedIds.includes(item.id);
    return `
      <div class="panel" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="font-size:32px; margin-bottom:10px;">${item.icon}</div>
          <h4 style="margin-bottom:8px;">${item.title}</h4>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">${item.desc}</p>
        </div>
        <div style="display:flex; gap:8px; margin-top:16px;">
          <button class="cta sm ${isSaved ? 'ghost' : 'secondary'}" onclick="toggleSaveGyan('${item.id}')">${isSaved ? '🔖 Saved' : '🔖 Save'}</button>
          <button class="cta sm secondary" onclick="markGyanRead(this, '${item.id}')">✓ Read (+2)</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterGyan(cat) {
  document.querySelectorAll('#gyanCategoryFilters button').forEach(b => {
    b.classList.toggle('on', b.dataset.cat === cat);
  });
  renderGyanFeed(cat);
}

function searchGyanContent() {
  const q = document.getElementById('gyanSearchInput').value.trim();
  renderGyanFeed('all', q);
}

function toggleSaveGyan(id) {
  let saved = AegisDB.getSavedGyan();
  if (saved.includes(id)) {
    saved = saved.filter(x => x !== id);
    showToast('Article removed from saved.');
  } else {
    saved.push(id);
    showToast('Saved to personal library.');
  }
  AegisDB.setSavedGyan(saved);
  renderGyanFeed();
}

function markGyanRead(btn, id) {
  if (btn.classList.contains('read-done')) return;
  btn.classList.add('read-done');
  btn.textContent = '✓ Read';
  const profile = AegisDB.getProfile() || {};
  profile.totalPoints = (profile.totalPoints || 0) + 2;
  AegisDB.setProfile(profile);
  renderAuthState();
  showToast('+2 Green Points earned!');
}

const DEFAULT_POSTS = [
  {
    id: 'p1', author: 'EcoRamesh', avatar: '🌱', badge: 'Compost Master', time: '2 hours ago', category: 'Achievement',
    content: 'Harvested my first batch of terrace vermicompost from kitchen scraps! Zero organic waste to landfill this month!',
    likes: 14, likedByMe: false, comments: []
  },
  {
    id: 'p2', author: 'TransitNeha', avatar: '🚆', badge: 'Metro Legend', time: '5 hours ago', category: 'Commute',
    content: 'Completed an entire work week exclusively on the metro. Saved ~8.4kg vehicle tailpipe emissions! 🚇✨',
    likes: 42, likedByMe: true, comments: []
  }
];

function renderCommunityFeed() {
  const container = document.getElementById('postsFeed');
  if (!container) return;

  let posts = AegisDB.getPosts();
  if (!posts) {
    posts = DEFAULT_POSTS;
    AegisDB.setPosts(posts);
  }

  container.innerHTML = posts.map(post => `
    <div class="panel">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:24px;">${post.avatar || '🧑‍🚀'}</div>
          <div>
            <b>@${post.author}</b> <span class="badge-verified">${post.badge}</span>
            <div style="font-size:11.5px; color:var(--text-muted);">${post.time} · ${post.category}</div>
          </div>
        </div>
      </div>
      <p style="font-size:14px; line-height:1.5; margin-bottom:14px;">${post.content}</p>
      <div style="display:flex; gap:10px;">
        <button class="cta sm secondary" onclick="togglePostLike('${post.id}')">${post.likedByMe ? '❤️' : '🤍'} ${post.likes} Likes</button>
      </div>
    </div>
  `).join('');
}

function toggleNewPostForm() {
  const wrap = document.getElementById('newPostWrap');
  if (wrap) wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
}

function submitCommunityPost() {
  const text = document.getElementById('newPostContent').value.trim();
  const cat = document.getElementById('newPostCategory').value;
  if (!text) return;

  const profile = AegisDB.getProfile() || {};
  const newPost = {
    id: 'p_' + Date.now(),
    author: (profile.name || 'Citizen').replace(/\s+/g, ''),
    avatar: profile.avatar || '🧑‍🚀',
    badge: 'Eco Citizen',
    time: 'Just now',
    category: cat,
    content: text,
    likes: 0,
    likedByMe: false,
    comments: []
  };

  const posts = AegisDB.getPosts() || DEFAULT_POSTS;
  posts.unshift(newPost);
  AegisDB.setPosts(posts);

  document.getElementById('newPostContent').value = '';
  toggleNewPostForm();
  renderCommunityFeed();
  showToast('Shared with Citizens Network!');
}

function togglePostLike(id) {
  const posts = AegisDB.getPosts() || DEFAULT_POSTS;
  const post = posts.find(p => p.id === id);
  if (!post) return;
  post.likedByMe = !post.likedByMe;
  post.likes += post.likedByMe ? 1 : -1;
  AegisDB.setPosts(posts);
  renderCommunityFeed();
}

/* ===================================================================
   20. CITIZEN PROFILE, BADGES & GOALS
=================================================================== */
const BADGES_DEFINITIONS = [
  { id: 'b_solar', name: 'Solar Core', icon: '🌞', col: 1 },
  { id: 'b_metro', name: 'Metro Legend', icon: '🚇', col: 1 },
  { id: 'b_biome', name: 'Clean Biome', icon: '🌱', col: 1 },
  { id: 'b_mandi', name: 'Mandi Warrior', icon: '🎒', col: 1 },
  { id: 'b_recycle', name: 'Recycle Chief', icon: '♻️', col: 2 },
  { id: 'b_water', name: 'Water Saver', icon: '💧', col: 2 },
  { id: 'b_volt', name: 'Volt Guard', icon: '🔋', col: 2 },
  { id: 'b_legend', name: 'Aegis Legend', icon: '✨', col: 2 }
];

function renderProfile() {
  const profile = AegisDB.getProfile() || {};
  const totalPts = profile.totalPoints || 0;

  const av = document.getElementById('profileAvatarFigure');
  if (av) av.textContent = profile.avatar || '🧑‍🚀';

  const col1 = document.getElementById('profileBadgesCol1');
  const col2 = document.getElementById('profileBadgesCol2');

  if (col1 && col2) {
    col1.innerHTML = '';
    col2.innerHTML = '';
    BADGES_DEFINITIONS.forEach((b, idx) => {
      const isUnlocked = totalPts >= (idx * 140);
      const badgeEl = document.createElement('div');
      badgeEl.className = `badge ${isUnlocked ? 'unlocked' : 'locked'}`;
      badgeEl.innerHTML = `<span>${b.icon}</span><span class="lab">${b.name}</span>`;
      if (b.col === 1) col1.appendChild(badgeEl);
      else col2.appendChild(badgeEl);
    });
  }

  const summaryWrap = document.getElementById('profileSummary');
  if (summaryWrap) {
    const rows = [
      ['Citizen Name', profile.name || 'Citizen'],
      ['Location', profile.city || 'Mumbai'],
      ['Bharat Carbon Score', `${profile.carbonScore || 72} / 100`],
      ['Total Green Points', `${totalPts} pts`],
      ['CO₂ Avoided', `${(profile.co2SavedKg || 18.4).toFixed(1)} kg`]
    ];

    summaryWrap.innerHTML = rows.map(([k, v]) => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line); font-size:13px;">
        <span style="color:var(--text-muted);">${k}</span>
        <span style="font-weight:600;">${v}</span>
      </div>
    `).join('');
  }

  renderGoalsList();
}

function toggleEditForm() {
  const form = document.getElementById('editProfileForm');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function toggleAvatarPicker() {
  const form = document.getElementById('avatarPickerForm');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

document.querySelectorAll('.avatar-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('on'));
    opt.classList.add('on');
  });
});

function saveAvatarChoice() {
  const chosen = document.querySelector('.avatar-opt.on');
  if (!chosen) return;
  const profile = AegisDB.getProfile() || {};
  profile.avatar = chosen.dataset.v;
  AegisDB.setProfile(profile);
  renderAuthState();
  renderProfile();
  toggleAvatarPicker();
  showToast('Avatar updated.');
}

function saveEditedProfile() {
  const profile = AegisDB.getProfile() || {};
  profile.name = document.getElementById('editName').value.trim() || profile.name;
  profile.age = document.getElementById('editAge').value;
  profile.city = document.getElementById('editCity').value.trim() || profile.city;
  AegisDB.setProfile(profile);
  renderAuthState();
  renderProfile();
  toggleEditForm();
  showToast('Profile parameters updated.');
}

function openGoalsModal() {
  document.getElementById('goalModal').classList.remove('hide');
}

function closeGoalsModal() {
  document.getElementById('goalModal').classList.add('hide');
}

function saveNewGoal() {
  const title = document.getElementById('goalTitleInput').value.trim();
  const cat = document.getElementById('goalCategoryInput').value;
  const target = parseFloat(document.getElementById('goalTargetInput').value) || 20;

  if (!title) return;

  const newGoal = { id: 'g_' + Date.now(), title, cat, target, progress: 0 };
  const goals = AegisDB.getGoals();
  goals.push(newGoal);
  AegisDB.setGoals(goals);

  closeGoalsModal();
  renderGoalsList();
  showToast('New goal set!');
}

function renderGoalsList() {
  const container = document.getElementById('profileGoalsList');
  if (!container) return;
  const goals = AegisDB.getGoals();
  if (!goals.length) {
    container.innerHTML = `<span style="color:var(--text-muted); font-size:12.5px;">No active goals yet. Add one above.</span>`;
    return;
  }
  container.innerHTML = goals.map(g => `
    <div style="background:var(--bg-surface-elevated); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 14px; font-size:13px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <b>${g.title}</b>
        <span class="mono">${g.progress}/${g.target}</span>
      </div>
      <div class="quest-progress"><i style="width:${Math.round((g.progress / g.target) * 100)}%"></i></div>
    </div>
  `).join('');
}

function openImpactReportModal() {
  const profile = AegisDB.getProfile() || {};
  document.getElementById('repCitizenName').textContent = profile.name || 'Citizen';
  document.getElementById('repCity').textContent = profile.city || 'Mumbai';
  document.getElementById('repScore').textContent = (profile.carbonScore || 72) + ' / 100';
  document.getElementById('repRank').textContent = 'Eco Explorer';
  document.getElementById('repCo2').textContent = (profile.co2SavedKg || 18.4).toFixed(1) + ' kg CO₂ Avoided';
  document.getElementById('repPoints').textContent = (profile.totalPoints || 380) + ' Green Points';
  document.getElementById('impactReportModal').classList.remove('hide');
}

function closeImpactReportModal() {
  document.getElementById('impactReportModal').classList.add('hide');
}

function exportUserData() {
  const data = AegisDB.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aegis3_Citizen_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported to JSON.');
}

function importUserData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (AegisDB.importAll(parsed)) {
        showToast('Backup restored!');
        window.location.reload();
      }
    } catch (err) {
      showToast('Invalid backup file.', true);
    }
  };
  reader.readAsText(file);
}

function confirmResetData() {
  if (confirm('Reset your citizen profile and activity data?')) {
    AegisDB.resetAll();
    window.location.reload();
  }
}

function openAdminModal() {
  const admin = AegisDB.getAdminData();
  document.getElementById('adminReportedCount').textContent = admin.reports.length;
  document.getElementById('adminAuditCount').textContent = admin.audit.length;
  document.getElementById('adminModal').classList.remove('hide');
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.add('hide');
}

function showAdminSection(sec) {
  document.getElementById('adminSectionReports').style.display = sec === 'reports' ? 'block' : 'none';
  document.getElementById('adminSectionCreate').style.display = sec === 'create' ? 'block' : 'none';
  document.getElementById('adminSectionAudit').style.display = sec === 'audit' ? 'block' : 'none';
}

function adminPublishMission() {
  const title = document.getElementById('adminMissionTitle').value.trim();
  const period = document.getElementById('adminMissionPeriod').value;
  const pts = parseInt(document.getElementById('adminMissionPts').value, 10) || 50;
  if (!title) return;

  DEFAULT_MISSIONS.unshift({
    id: 'm_custom_' + Date.now(),
    period: period,
    title: title,
    desc: 'Special Municipal Environmental Campaign Directive.',
    pts: pts,
    icon: '🎯'
  });

  closeAdminModal();
  renderMissions();
  showToast('Directive published!');
}

/* ===================================================================
   21. INITIALIZATION & BOOTSTRAP
=================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = AegisDB.getTheme();
  applyTheme(savedTheme);

  const auth = AegisDB.getAuth();
  if (auth) sessionUser = auth;
  renderAuthState();

  selectActivityCategory('transport');
  refreshAqiTelemetry();

  // Mini-games setup
  nextSegItem();
  renderQuizCard();
  initMemoryGame();

  // Initial renders
  renderDashboard();
  renderMissions();
  renderGyanFeed();
  renderCommunityFeed();
  renderAlerts();

  // Initialize Three.js Hero Canvas on load
  initHeroPlanet3d();
});
