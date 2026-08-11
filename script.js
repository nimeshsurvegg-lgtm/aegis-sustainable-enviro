// Tab navigation
  const tabs = document.querySelectorAll('nav.tabs button');
  const screens = document.querySelectorAll('.screen');
  function goTo(id){
    tabs.forEach(b=>b.classList.toggle('active', b.dataset.screen===id));
    screens.forEach(s=>s.classList.toggle('active', s.id===id));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  tabs.forEach(b=>b.addEventListener('click', ()=>goTo(b.dataset.screen)));

  // Floating particles on clean side
  const particles = document.getElementById('particles');
  for(let i=0;i<18;i++){
    const p = document.createElement('i');
    p.style.left = (10+Math.random()*80)+'%';
    p.style.bottom = (Math.random()*40)+'%';
    p.style.animationDuration = (5+Math.random()*6)+'s';
    p.style.animationDelay = (Math.random()*6)+'s';
    particles.appendChild(p);
  }

  // Hero drag slider
  const scene = document.getElementById('heroScene');
  const toxic = scene.querySelector('.side-toxic');
  const rail = document.getElementById('dragRail');
  const line = document.getElementById('dragLine');
  const handle = document.getElementById('dragHandle');
  const heroScore = document.getElementById('heroScore');
  const heroTier = document.getElementById('heroTier');
  let dragging = false;

  function setSplit(pct){
    pct = Math.min(88, Math.max(12, pct));
    toxic.style.width = pct+'%';
    line.style.left = pct+'%';
    handle.style.left = pct+'%';
    const score = Math.round(15 + (100-pct)*0.85);
    heroScore.textContent = score;
    if(score < 45){ heroScore.style.color='var(--red)'; heroTier.textContent='(CRITICAL)'; heroTier.style.color='var(--red)'; }
    else if(score < 70){ heroScore.style.color='var(--amber)'; heroTier.textContent='(IMPROVING)'; heroTier.style.color='var(--amber)'; }
    else { heroScore.style.color='var(--green-soft)'; heroTier.textContent='(RESTORED)'; heroTier.style.color='var(--green-soft)'; }
  }
  setSplit(50);

  function pctFromEvent(e){
    const rect = scene.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return (x/rect.width)*100;
  }
  rail.addEventListener('mousedown', e=>{dragging=true; setSplit(pctFromEvent(e));});
  window.addEventListener('mousemove', e=>{if(dragging) setSplit(pctFromEvent(e));});
  window.addEventListener('mouseup', ()=>dragging=false);
  rail.addEventListener('touchstart', e=>{dragging=true; setSplit(pctFromEvent(e));});
  window.addEventListener('touchmove', e=>{if(dragging) setSplit(pctFromEvent(e));});
  window.addEventListener('touchend', ()=>dragging=false);

  /* ===================================================================
     RECYCLING MAP — Leaflet, auto-centered
  =================================================================== */
  let leafletMap = null;
  let mapMarkers = [];
  const RECYCLE_KINDS = [
    {type:'plastic', icon:'♻️', label:'Plastics · Paper', name:'Kabadiwala – Local Scrap Dealer', pts:15, dx:0.012, dy:0.006},
    {type:'metal', icon:'🔩', label:'Metal', name:'Metal Scrap Yard', pts:20, dx:-0.018, dy:0.010},
    {type:'battery', icon:'🔋', label:'Batteries', name:'Battery Drop Kiosk', pts:25, dx:0.008, dy:-0.014},
    {type:'e-waste', icon:'🖥️', label:'Electronics', name:'Official E-Waste Center', pts:30, dx:0.020, dy:0.016},
    {type:'plastic', icon:'♻️', label:'Plastics', name:'Community Recycling Bin', pts:10, dx:-0.022, dy:-0.010},
    {type:'metal', icon:'🔩', label:'Metal', name:'Foundry Scrap Point', pts:18, dx:0.004, dy:0.020},
    {type:'plastic', icon:'♻️', label:'Plastics', name:'Kiran Kabadi Wala', pts:12, dx:0.015, dy:-0.008},
    {type:'e-waste', icon:'🖥️', label:'Electronics', name:'TechRecycle Hub', pts:28, dx:-0.012, dy:-0.015}
  ];
  const DEFAULT_CITY_COORDS = {name:'Mumbai', lat:19.0760, lng:72.8777};

  function initLeafletMap(){
    if(typeof L === 'undefined' || document.getElementById('leafletMap') === null) return;
    if(leafletMap){ leafletMap.remove(); leafletMap = null; }
    leafletMap = L.map('leafletMap', {scrollWheelZoom:false}).setView([DEFAULT_CITY_COORDS.lat, DEFAULT_CITY_COORDS.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'&copy; OpenStreetMap contributors', maxZoom:19
    }).addTo(leafletMap);
    plotRecyclingPoints(DEFAULT_CITY_COORDS.lat, DEFAULT_CITY_COORDS.lng, DEFAULT_CITY_COORDS.name);
  }

  function plotRecyclingPoints(lat, lng, cityLabel){
    mapMarkers.forEach(m=>leafletMap.removeLayer(m.marker));
    mapMarkers = [];
    const userIcon = L.divIcon({className:'', html:'<div style="width:16px;height:16px;border-radius:50%;background:#3ddc84;border:2px solid #fff;box-shadow:0 0 10px #3ddc84;"></div>'});
    L.marker([lat,lng], {icon:userIcon}).addTo(leafletMap).bindPopup(`<b>${cityLabel}</b><br>Your location`);
    RECYCLE_KINDS.forEach(k=>{
      const mlat = lat + k.dy, mlng = lng + k.dx;
      const icon = L.divIcon({className:'', html:`<div style="font-size:22px; filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));">${k.icon}</div>`, iconSize:[26,26]});
      const marker = L.marker([mlat, mlng], {icon}).addTo(leafletMap);
      marker.bindPopup(`<b>${k.name}</b><br>${k.label}<br>⭐ ${k.pts} Green points<br><a href="https://www.google.com/maps/search/?api=1&query=${mlat},${mlng}" target="_blank" rel="noopener">Get Directions</a>`);
      mapMarkers.push({type:k.type, marker});
    });
    const lbl = document.getElementById('mapRadiusLabel');
    if(lbl) lbl.textContent = `${cityLabel} · 5 km radius`;
    const inline = document.getElementById('mapCityInline');
    if(inline) inline.textContent = cityLabel;
  }

  document.querySelectorAll('#mapFilters button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#mapFilters button').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      const f = btn.dataset.f;
      mapMarkers.forEach(m=>{
        const show = (f==='all' || m.type===f);
        const el = m.marker.getElement();
        if(el) el.style.display = show ? '' : 'none';
      });
    });
  });

  async function geocodeCity(cityName){
    try{
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(cityName)}`);
      const data = await res.json();
      if(data && data[0]) return {lat:parseFloat(data[0].lat), lng:parseFloat(data[0].lon), name:cityName};
    }catch(e){ /* offline fall back */ }
    return null;
  }

  async function recenterMapTo(cityName){
    if(!cityName) return;
    const coords = await geocodeCity(cityName) || DEFAULT_CITY_COORDS;
    if(!leafletMap) initLeafletMap();
    leafletMap.setView([coords.lat, coords.lng], 13);
    plotRecyclingPoints(coords.lat, coords.lng, cityName);
  }
  function recenterMapToInput(){
    const val = document.getElementById('mapCityInput').value.trim();
    if(val) recenterMapTo(val);
  }
  
  let mapInitDone = false;
  document.querySelector('button[data-screen="map"]').addEventListener('click', ()=>{
    if(!mapInitDone){ initLeafletMap(); mapInitDone = true; }
    const profile = AegisDB.getProfile();
    if(profile && profile.city) recenterMapTo(profile.city);
    setTimeout(()=>{ if(leafletMap) leafletMap.invalidateSize(); }, 200);
  });

  // AQI chart bars
  const chart = document.getElementById('aqiChart');
  [62,70,55,80,90,68,85].forEach(v=>{
    const bar = document.createElement('i');
    bar.style.height = v+'%';
    chart.appendChild(bar);
  });

  /* ===================================================================
     CITY-WIDE GREEN SCORE ENGINE & POINTS
  =================================================================== */
  const greenState = { green: 85 };
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function refreshGreenDisplays(){
    const aqiVal = Math.round(clamp(400 - greenState.green*3.6, 35, 400));
    const aqiNum = document.getElementById('aqiNumber');
    const greenNum = document.getElementById('greenScoreNumber');
    const aqiPill = document.getElementById('aqiPillBad');
    if(aqiNum) aqiNum.textContent = aqiVal;
    if(greenNum) greenNum.textContent = Math.round(greenState.green);
    if(aqiPill) aqiPill.classList.toggle('alert-live', aqiVal > 300);
    
    const advice = document.getElementById('aqiHealthAdvice');
    if(advice) {
        if(aqiVal > 300) advice.innerHTML = "Hazardous air quality. Avoid outdoor physical activities. Mask is mandatory.";
        else if(aqiVal > 150) advice.innerHTML = "Poor air quality. Sensitive groups should reduce prolonged outdoor exertion.";
        else if(aqiVal > 50) advice.innerHTML = "Moderate air quality. Acceptable for most individuals.";
        else advice.innerHTML = "Good air quality. Enjoy outdoor activities!";
        advice.style.color = (aqiVal > 150) ? 'var(--red)' : ((aqiVal > 50) ? 'var(--amber)' : 'var(--green-soft)');
    }
  }
  refreshGreenDisplays();

  function showToast(msg){
    const wrap = document.getElementById('toastWrap');
    if(!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(()=>t.remove(), 2800);
  }

  function updateGreenScore(delta, reason){
    greenState.green = clamp(greenState.green + delta, 0, 100);
    const profile = AegisDB.getProfile();
    if(profile) {
        profile.totalPoints = (profile.totalPoints || 0) + delta;
        AegisDB.setProfile(profile);
    }
    refreshGreenDisplays();
    if(reason) showToast(`${delta >= 0 ? '+' : ''}${delta} Points · ${reason}`);
    updateRankUI();
  }

  // Swachh Directives (Mission Board quests)
  function toggleQuest(el){
    const pts = parseInt(el.dataset.pts, 10) || 20;
    const nowDone = !el.classList.contains('done');
    el.classList.toggle('done');
    const check = el.querySelector('.quest-check');
    if(check) check.textContent = nowDone ? '✓' : '';
    const bar = el.querySelector('.quest-progress i');
    if(bar && nowDone) bar.style.width = '100%';
    const delta = Math.max(1, Math.round(pts/8)); // Smaller green score bump, but full points added to total
    updateGreenScore(nowDone ? pts : -pts, nowDone ? 'Mission complete' : null);
    updateMissionBar();
    renderMilestones();
  }
  function updateMissionBar(){
    const quests = document.querySelectorAll('#missionGrid .quest');
    let total = 0, done = 0;
    quests.forEach(q=>{
      const p = parseInt(q.dataset.pts,10) || 0;
      total += p;
      if(q.classList.contains('done')) done += p;
    });
    const bar = document.getElementById('missionOverallBar');
    if(bar && total) bar.style.width = Math.round((done/total)*100)+'%';
  }
  updateMissionBar();

  // Daily Gyan
  function markGyanRead(btn){
    if(btn.classList.contains('read-done')) return;
    btn.classList.add('read-done');
    btn.textContent = '✓ Read';
    updateGreenScore(2, 'Daily Gyan read');
  }

  // Daily log chip selectors
  document.querySelectorAll('.chip-row').forEach(row=>{
    row.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        row.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
        btn.classList.add('on');
      });
    });
  });

  function submitDailyLog(){
    if(!sessionUser || sessionUser.mode === 'guest') {
        showToast("Sign in to track your history.");
    } else {
        const today = new Date().toISOString().split('T')[0];
        const profile = AegisDB.getProfile() || {};
        let logsToday = profile.logsToday || {date: '', count: 0};
        if(logsToday.date !== today) { logsToday = {date: today, count: 0}; }
        
        if(logsToday.count >= 2) {
            showToast("You can only log your parameters twice a day.");
            return;
        }
        logsToday.count++;
        profile.logsToday = logsToday;
        AegisDB.setProfile(profile);
    }

    const commuteBtn = document.querySelector('#logCommute button.on');
    const acBtn = document.querySelector('#logAC button.on');
    const dietBtn = document.querySelector('#logDiet button.on');
    const commute = parseInt(commuteBtn?.dataset.val || '4', 10);
    const ac = parseInt(acBtn?.dataset.val || '0', 10);
    const diet = parseInt(dietBtn?.dataset.val || '400', 10);

    const commuteG = commute * 8;
    const acG = ac * 247;
    const totalG = commuteG + acG + diet;

    const score = Math.round(clamp(97 - (totalG/4527)*82, 10, 97));
    const big = document.getElementById('carbonScoreBig');
    if(big) big.textContent = score;

    const pctCommute = totalG ? Math.round((commuteG/totalG)*1000)/10 : 0;
    const pctDiet = totalG ? Math.round((diet/totalG)*1000)/10 : 0;
    const pctAC = totalG ? Math.round((acG/totalG)*1000)/10 : 0;
    const g = document.getElementById('legPctGreen'); if(g) g.textContent = pctCommute+'%';
    const c = document.getElementById('legPctCyan'); if(c) c.textContent = Math.max(0, 100-pctCommute-pctDiet-pctAC).toFixed(1)+'%';
    const r = document.getElementById('legPctRed'); if(r) r.textContent = (pctDiet+pctAC).toFixed(1)+'%';

    // Environment impact text
    const impText = document.getElementById('envImpactText');
    if(score > 75) impText.textContent = `Excellent! Your daily choices save approx. ${(4500 - totalG)/1000} kg of CO2 compared to average.`;
    else if(score > 50) impText.textContent = `Moderate footprint. Replacing 1 car trip with metro could boost your score and save 2kg CO2.`;
    else impText.textContent = `High footprint. Your choices result in high emissions today. Consider reducing AC usage.`;

    if(sessionUser && sessionUser.mode === 'phone') {
        const profile = AegisDB.getProfile();
        let history = profile.scoreHistory || [];
        history.push({date: new Date().toLocaleDateString('en-GB').slice(0,5), score: score});
        profile.scoreHistory = history;
        AegisDB.setProfile(profile);
    }
    
    renderHistoryChart();
    updateGreenScore(Math.round((score-60)/6), 'Daily log recorded');
  }

  function renderHistoryChart() {
    const profile = AegisDB.getProfile() || {};
    const history = profile.scoreHistory || [];
    const container = document.getElementById('historyChartBars');
    if(!container) return;
    container.innerHTML = '';
    
    if(history.length === 0) {
        container.innerHTML = '<div style="color:var(--muted); font-size:12px; width:100%;">No history yet. Log your day to see trends!</div>';
        return;
    }
    
    const recent = history.slice(-7);
    recent.forEach(h => {
        const bar = document.createElement('div');
        bar.className = 'hist-bar';
        bar.style.height = `${h.score}%`;
        bar.title = `${h.date} - Score: ${h.score}`;
        container.appendChild(bar);
    });
  }

  /* ===================================================================
     AEGIS DB
  =================================================================== */
  const AegisDB = (function(){
    const K_AUTH = 'aegis_auth', K_PROFILE = 'aegis_profile', K_THEME = 'aegis_theme', K_OTP = 'aegis_pending_otp';
    function read(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
    function write(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
    return {
      getAuth(){ return read(K_AUTH); },
      setAuth(v){ write(K_AUTH, v); },
      clearAuth(){ localStorage.removeItem(K_AUTH); },
      getProfile(){ return read(K_PROFILE); },
      setProfile(v){ write(K_PROFILE, v); },
      getTheme(){ return localStorage.getItem(K_THEME); },
      setTheme(v){ localStorage.setItem(K_THEME, v); },
      setPendingOtp(v){ write(K_OTP, v); },
      getPendingOtp(){ return read(K_OTP); }
    };
  })();

  /* ===================================================================
     THEME
  =================================================================== */
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('themeToggle');
    if(btn) btn.textContent = t === 'light' ? '☀️' : '🌙';
    AegisDB.setTheme(t);
  }
  function toggleTheme(){
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(cur);
  }

  /* ===================================================================
     AUTH
  =================================================================== */
  let sessionUser = null; 

  function renderAuthState(){
    const box = document.getElementById('userbox');
    const themeBtn = document.getElementById('themeToggle');
    box.innerHTML = '';
    box.appendChild(themeBtn);
    if(!sessionUser){ return; }
    if(sessionUser.mode === 'guest'){
      const pill = document.createElement('span'); pill.className='guest-pill'; pill.textContent='👤 Guest';
      const signIn = document.createElement('button'); signIn.className='signin-btn'; signIn.textContent='Sign in'; signIn.onclick = ()=>{ document.getElementById('authOverlay').classList.remove('hide'); authGoStep('authStepPhone'); };
      box.appendChild(pill); box.appendChild(signIn);
    } else {
      const profile = AegisDB.getProfile();
      const name = (profile && profile.name) || sessionUser.phone;
      const nameSpan = document.createElement('span'); nameSpan.className='username'; nameSpan.textContent = name;
      const av = document.createElement('div'); av.className='avatar'; av.textContent = (profile && profile.avatar) || (name[0]||'U').toUpperCase();
      const logout = document.createElement('button'); logout.className='logout-btn'; logout.textContent='Logout'; logout.onclick = doLogout;
      box.appendChild(nameSpan); box.appendChild(av); box.appendChild(logout);
    }
  }

  function authGoStep(id){
    document.querySelectorAll('.auth-step').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('authPhoneErr').textContent = '';
    document.getElementById('authOtpErr').textContent = '';
  }

  function authSendOtp(isResend){
    const input = document.getElementById('authPhoneInput');
    const phone = input.value.trim();
    const err = document.getElementById('authPhoneErr');
    if(!/^\d{10}$/.test(phone)){
      err.textContent = 'Enter a valid 10-digit phone number.';
      return;
    }
    err.textContent = '';
    const otp = String(Math.floor(1000 + Math.random()*9000));
    AegisDB.setPendingOtp({phone, otp, ts: Date.now()});
    document.getElementById('authPhoneDisplay').textContent = '+91 ' + phone;
    document.getElementById('authDemoOtpHint').textContent = `(Demo OTP: ${otp})`;
    document.querySelectorAll('.otp-d').forEach(i=>i.value='');
    authGoStep('authStepOtp');
    document.querySelector('.otp-d').focus();
    showToast(isResend ? 'OTP resent' : 'OTP sent');
  }

  function authVerifyOtp(){
    const digits = Array.from(document.querySelectorAll('.otp-d')).map(i=>i.value).join('');
    const pending = AegisDB.getPendingOtp();
    const err = document.getElementById('authOtpErr');
    if(digits.length !== 4){ err.textContent = 'Enter all 4 digits.'; return; }
    if(!pending || digits !== pending.otp){ err.textContent = 'Incorrect OTP.'; return; }
    sessionUser = {mode:'phone', phone: pending.phone};
    AegisDB.setAuth(sessionUser);
    
    // Save preliminary profile
    let profile = AegisDB.getProfile() || {};
    profile.phone = pending.phone;
    profile.name = document.getElementById('authName').value.trim() || 'Citizen';
    profile.age = document.getElementById('authAge').value || '18-24';
    profile.city = document.getElementById('authCity').value.trim() || 'Mumbai';
    if(profile.onboarded === undefined) profile.onboarded = false; // Fix: strictly check if missing
    
    AegisDB.setProfile(profile);
    document.getElementById('authOverlay').classList.add('hide');
    renderAuthState();
    refreshJoinMissionButton();
    showToast('Signed in successfully');
    
    // Pre-populate obState
    obState.name = profile.name;
    obState.age = profile.age;
    obState.city = profile.city;
    
    if(!profile.onboarded) {
        openOnboarding();
    }
  }

  function authContinueGuest(){
    sessionUser = {mode:'guest'};
    document.getElementById('authOverlay').classList.add('hide');
    renderAuthState();
    refreshJoinMissionButton();
    
    obState.name = 'Guest';
    obState.age = '18-24';
    obState.city = 'Mumbai';
    openOnboarding();
  }

  function doLogout(){
    sessionUser = null;
    AegisDB.clearAuth();
    renderAuthState();
    refreshJoinMissionButton();
    showToast('Logged out');
    goTo('hero');
  }

  document.addEventListener('input', (e)=>{
    if(e.target.classList && e.target.classList.contains('otp-d')){
      e.target.value = e.target.value.replace(/\D/g,'').slice(0,1);
      if(e.target.value && e.target.nextElementSibling && e.target.nextElementSibling.classList.contains('otp-d')){
        e.target.nextElementSibling.focus();
      }
    }
  });

  function refreshJoinMissionButton(){
    const btn = document.getElementById('joinMissionBtn');
    if(!btn) return;
    const profile = AegisDB.getProfile();
    const onboarded = sessionUser && sessionUser.mode === 'phone' && profile && profile.onboarded;
    btn.style.display = onboarded ? 'none' : '';
  }

  function handleJoinMission(){
    if(!sessionUser){
      document.getElementById('authOverlay').classList.remove('hide');
      authGoStep('authStepPhone');
      return;
    }
    const profile = AegisDB.getProfile();
    if(sessionUser.mode === 'phone' && profile && profile.onboarded){
      goTo('dashboard');
      return;
    }
    openOnboarding();
  }

  /* ===================================================================
     ONBOARDING
  =================================================================== */
  const obState = { name:'', age:'', city:'', commute:'', dist:0, fuel:'', elec:0, household:1, diet:'', waste:'', recycle:'' };
  
  function openOnboarding(){
    document.getElementById('onboarding').classList.remove('hide');
    document.querySelectorAll('.ob-step').forEach(s=>s.classList.remove('active'));
    document.getElementById('obStepCommute').classList.add('active'); // Directly opens to general questions correctly
  }

  function selectGridSetup(gridId, stateKey, extra){
    const grid = document.getElementById(gridId);
    if(!grid) return;
    grid.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        grid.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
        btn.classList.add('on');
        obState[stateKey] = btn.dataset.v;
        if(extra) extra(btn.dataset.v);
      });
    });
  }
  selectGridSetup('obCommuteGrid','commute', (v)=>{
    const fuelWrap = document.getElementById('obFuelWrap');
    fuelWrap.style.display = (v==='bike'||v==='car'||v==='carpool') ? 'block' : 'none';
  });
  selectGridSetup('obDistGrid','dist');
  selectGridSetup('obFuelGrid','fuel');
  selectGridSetup('obElecGrid','elec');
  selectGridSetup('obHouseholdGrid','household');
  selectGridSetup('obDietGrid','diet');
  selectGridSetup('obWasteGrid','waste');
  selectGridSetup('obRecycleGrid','recycle');

  function obNext(fromStep){
    if(fromStep === 2){
      if(!obState.commute || !obState.dist || !obState.elec){ showToast('Please complete all fields'); return; }
      obGoStep('obStepDiet');
    } else if(fromStep === 3){
      if(!obState.household || !obState.diet || !obState.waste || !obState.recycle){ showToast('Please complete all fields'); return; }
      runOnboardingAssessment();
    }
  }
  function obBack(id){ obGoStep(id); }
  function obGoStep(id){
    document.querySelectorAll('.ob-step').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function calcCarbonScore(s){
    const commuteFactor = {walk_cycle:1, metro:0.85, rickshaw:0.55, bike:0.4, carpool:0.35, car:0.15}[s.commute] ?? 0.5;
    const distFactor = 1 - Math.min(1, (parseInt(s.dist,10)||10) / 55);
    const commuteScore = 25 * clamp01(0.5*commuteFactor + 0.5*distFactor);

    // Fix: Updated logic for Daily AC usage hours instead of general electricity
    const acHours = parseInt(s.elec,10) || 0;
    const perCapitaAc = acHours / (parseInt(s.household,10) || 1);
    const energyScore = 25 * clamp01(1 - perCapitaAc/6);

    const dietFactor = {vegan:1, vegetarian:0.82, omnivore:0.5, heavy_meat:0.2}[s.diet] ?? 0.5;
    const dietScore = 25 * dietFactor;

    const wasteFactor = {rare:1, weekly:0.6, often:0.25}[s.waste] ?? 0.5;
    const recycleFactor = {always:1, sometimes:0.55, never:0.15}[s.recycle] ?? 0.5;
    const wasteScore = 25 * clamp01(0.5*wasteFactor + 0.5*recycleFactor);

    const total = Math.round(commuteScore + energyScore + dietScore + wasteScore);
    return {
      total: clamp(total, 5, 99),
      breakdown: [
        {label:'Commute & travel', value: Math.round(commuteScore/25*100)},
        {label:'Home AC usage', value: Math.round(energyScore/25*100)},
        {label:'Diet & food', value: Math.round(dietScore/25*100)},
        {label:'Waste & recycling', value: Math.round(wasteScore/25*100)}
      ]
    };
  }
  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  function runOnboardingAssessment(){
    obGoStep('obStepLoading');
    document.getElementById('obLoadingLbl').textContent = `Fetching live AQI for ${obState.city}…`;
    setTimeout(()=>{
      const result = calcCarbonScore(obState);
      const aqi = Math.round(clamp(420 - result.total*3.4, 60, 420));
      document.getElementById('obResultCity').textContent = obState.city.toUpperCase();
      document.getElementById('obResultAqi').textContent = aqi;
      document.getElementById('obCarbonScoreResult').textContent = result.total;
      const bd = document.getElementById('obScoreBreakdown');
      bd.innerHTML = '';
      result.breakdown.forEach(row=>{
        const el = document.createElement('div');
        el.className = 'sb-row';
        el.innerHTML = `<span class="lbl">${row.label}</span><span class="sb-bar"><i style="width:${row.value}%"></i></span><span class="val">${row.value}/100</span>`;
        bd.appendChild(el);
      });
      obGoStep('obStepResult');

      if(sessionUser && sessionUser.mode === 'phone'){
        const profile = AegisDB.getProfile() || {};
        Object.assign(profile, obState, {
          onboarded: true,
          carbonScore: result.total,
          scoreBreakdown: result.breakdown,
          avatar: profile.avatar || '🧑‍🚀',
          aqiAtOnboard: aqi
        });
        AegisDB.setProfile(profile);
      }
      
      const big = document.getElementById('carbonScoreBig'); if(big) big.textContent = result.total;
      greenState.green = clamp(result.total, 10, 97);
      refreshGreenDisplays();
      
      // Setup UI text specifically for user
      const aqiHeader = document.getElementById('aqiCityHeader');
      if(aqiHeader) aqiHeader.textContent = `${obState.city} · Updated just now`;
      
    }, 1200);
  }

  function closeOnboarding(){
    const ob = document.getElementById('onboarding');
    if(ob) ob.classList.add('hide');
    refreshJoinMissionButton();
    renderProfile();
    renderHistoryChart();
    if(obState.city){
      mapInitDone = true;
      if(!leafletMap) initLeafletMap();
      recenterMapTo(obState.city);
      document.getElementById('mapCityInput').value = obState.city;
    }
    goTo('dashboard');
  }

  /* ===================================================================
     PROFILE / RANKS
  =================================================================== */
  function updateRankUI() {
    const profile = AegisDB.getProfile() || {};
    let totalPts = profile.totalPoints || 0;
    if(sessionUser && sessionUser.mode === 'guest') totalPts = 0;
    
    const ranks = [
        { name: "Seed of Change", min: 0 },
        { name: "Green Sprout", min: 100 },
        { name: "Earth Defender", min: 250 },
        { name: "Eco Warrior", min: 500 },
        { name: "Sustainability Sage", min: 800 },
        { name: "Planet Protector", min: 1200 },
        { name: "Climate Champion", min: 1800 },
        { name: "Green Legend", min: 2500 },
        { name: "Aegis Master", min: 4000 }
    ];
    let currentRank = ranks[0];
    let nextRank = ranks[1];
    let rankIndex = 1;
    for(let i=0; i<ranks.length; i++) {
        if(totalPts >= ranks[i].min) {
            currentRank = ranks[i];
            nextRank = ranks[i+1] || null;
            rankIndex = i+1;
        }
    }
    
    const banner = document.getElementById('rankBanner');
    if(banner) {
        banner.innerHTML = `<div class="u">Total Green Points: ${totalPts}</div>
                            <div class="r">${currentRank.name}</div>
                            <div style="font-size:11px; color:var(--muted); margin-top:4px;">
                                ${nextRank ? `Next stage at ${nextRank.min} pts` : `Maximum Rank Achieved!`}
                            </div>`;
    }
    
    const sub = document.getElementById('profileRankSubtitle');
    if(sub) sub.textContent = `${currentRank.name} · Level ${rankIndex}`;
  }

  function renderProfile(){
    const summary = document.getElementById('profileSummary');
    if(!summary) return;
    if(!sessionUser){
      summary.innerHTML = '<div class="ps-row"><span class="k">Sign in to see your saved profile.</span></div>';
      return;
    }
    if(sessionUser.mode === 'guest'){
      summary.innerHTML = '<div class="ps-row"><span class="k">Guest mode — nothing is saved. Sign in to track progress.</span></div>';
      document.getElementById('profileAvatarFigure').textContent = '👤';
      updateRankUI();
      return;
    }
    const p = AegisDB.getProfile() || {};
    document.getElementById('profileAvatarFigure').textContent = p.avatar || '🧑‍🚀';
    const rows = [
      ['Name', p.name || '—'],
      ['City', p.city || '—'],
      ['Age', p.age || '—'],
      ['Commute mode', p.commute || '—'],
      ['Diet type', p.diet || '—'],
      ['Household size', p.household || '—'],
      ['Bharat Carbon Score', p.carbonScore != null ? p.carbonScore+'/100' : 'Not yet onboarded']
    ];
    summary.innerHTML = rows.map(r=>`<div class="ps-row"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('');
    
    if(document.getElementById('editName')) document.getElementById('editName').value = p.name || '';
    if(document.getElementById('editAge') && p.age) document.getElementById('editAge').value = p.age;
    if(document.getElementById('editCity')) document.getElementById('editCity').value = p.city || '';
    if(document.getElementById('editCommute') && p.commute) document.getElementById('editCommute').value = p.commute;
    if(document.getElementById('editDiet') && p.diet) document.getElementById('editDiet').value = p.diet;
    document.querySelectorAll('.avatar-opt').forEach(o=>o.classList.toggle('on', o.dataset.v === (p.avatar||'🧑‍🚀')));
    
    updateRankUI();
  }

  function toggleEditForm(){
    if(!sessionUser || sessionUser.mode === 'guest'){ showToast('Sign in to edit your profile'); return; }
    document.getElementById('editProfileForm').classList.toggle('show');
    document.getElementById('avatarPickerForm').classList.remove('show');
  }
  function toggleAvatarPicker(){
    if(!sessionUser || sessionUser.mode === 'guest'){ showToast('Sign in to set an avatar'); return; }
    document.getElementById('avatarPickerForm').classList.toggle('show');
    document.getElementById('editProfileForm').classList.remove('show');
  }
  document.querySelectorAll('.avatar-opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      document.querySelectorAll('.avatar-opt').forEach(o=>o.classList.remove('on'));
      opt.classList.add('on');
    });
  });
  function saveAvatarChoice(){
    const chosen = document.querySelector('.avatar-opt.on');
    if(!chosen) return;
    const p = AegisDB.getProfile() || {};
    p.avatar = chosen.dataset.v;
    AegisDB.setProfile(p);
    renderProfile();
    renderAuthState();
    document.getElementById('avatarPickerForm').classList.remove('show');
    showToast('Avatar updated');
  }
  function saveEditedProfile(){
    const p = AegisDB.getProfile() || {};
    p.name = document.getElementById('editName').value.trim() || p.name;
    p.age = document.getElementById('editAge').value;
    p.city = document.getElementById('editCity').value.trim() || p.city;
    p.commute = document.getElementById('editCommute').value;
    p.diet = document.getElementById('editDiet').value;
    
    const merged = Object.assign({}, obState, p);
    const result = calcCarbonScore(merged);
    p.carbonScore = result.total;
    p.scoreBreakdown = result.breakdown;
    AegisDB.setProfile(p);
    renderProfile();
    renderAuthState();
    document.getElementById('editProfileForm').classList.remove('show');
    showToast('Profile updated');
  }

  /* ===================================================================
     MISSION BOARD / REWARDS
  =================================================================== */
  function applyPeriodFilter(period){
    document.querySelectorAll('#missionGrid .quest').forEach(q=>{
      q.classList.toggle('period-show', q.dataset.period === period);
    });
  }
  document.querySelectorAll('#periodTabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#periodTabs button').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      applyPeriodFilter(btn.dataset.period);
    });
  });
  applyPeriodFilter('daily');

  const MILESTONES = [
    {id:'starter', title:'First Directive', desc:'Complete your first Swachh Directive.', target:1, reward:'Badge: Eco Starter'},
    {id:'streak5', title:'5-Directive Streak', desc:'Complete 5 directives across any period.', target:5, reward:'Coupon: GREEN10 (10% off)'},
    {id:'points300', title:'300 Green Points', desc:'Bank 300 total Green Points.', target:300, reward:'Badge: Rank Master', isPoints:true},
    {id:'points750', title:'750 Green Points', desc:'Bank 750 total Green Points.', target:750, reward:'Coupon: SWACHH250 (₹250 off)', isPoints:true}
  ];
  function getCompletedQuestsInfo(){
    const quests = document.querySelectorAll('#missionGrid .quest');
    let count=0, points=0;
    quests.forEach(q=>{ if(q.classList.contains('done')){ count++; points += parseInt(q.dataset.pts,10)||0; } });
    
    // Add total points from DB
    const profile = AegisDB.getProfile() || {};
    if(profile.totalPoints) points = profile.totalPoints;
    
    return {count, points};
  }
  function renderMilestones(){
    const strip = document.getElementById('milestoneStrip');
    if(!strip) return;
    const info = getCompletedQuestsInfo();
    strip.innerHTML = '';
    MILESTONES.forEach(m=>{
      const progressVal = m.isPoints ? info.points : info.count;
      const pct = Math.min(100, Math.round((progressVal/m.target)*100));
      const unlocked = pct >= 100;
      const claimedKey = 'aegis_claimed_'+m.id;
      const claimed = localStorage.getItem(claimedKey) === '1';
      const card = document.createElement('div');
      card.className = 'milestone-card' + (unlocked ? ' unlocked' : '');
      card.innerHTML = `
        <div class="mt">${m.title}</div>
        <div class="md">${m.desc}</div>
        <div class="mbar"><i style="width:${pct}%"></i></div>
        <div class="reward"><span>🎁 ${m.reward}</span>
          <button class="claim" ${(!unlocked||claimed)?'disabled':''} onclick="claimMilestone('${m.id}')">${claimed?'Claimed':'Claim'}</button>
        </div>`;
      strip.appendChild(card);
    });
    renderCouponHistory();
  }
  
  function renderCouponHistory(){
    const list = document.getElementById('rewardHistoryList');
    if(!list) return;
    list.innerHTML = '';
    let found = false;
    MILESTONES.forEach(m=>{
       if(localStorage.getItem('aegis_claimed_'+m.id) === '1') {
           found = true;
           const d = document.createElement('div');
           d.style = "display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--line);";
           d.innerHTML = `<span>${m.reward}</span><span style="color:var(--green-soft);">Claimed</span>`;
           list.appendChild(d);
       }
    });
    if(!found){
        list.innerHTML = `<div style="color:var(--muted);">Coupons and rewards will appear here once claimed.</div>`;
    }
  }

  function claimMilestone(id){
    const m = MILESTONES.find(x=>x.id===id);
    if(!m) return;
    localStorage.setItem('aegis_claimed_'+id, '1');
    showToast(`Reward unlocked: ${m.reward}`);
    renderMilestones();
  }

  /* ===================================================================
     GAMES
  =================================================================== */
  // Game 1
  const segItems = [
    {emoji: '🍎', type: 'wet'}, {emoji: '🍌', type: 'wet'}, {emoji: '🍂', type: 'wet'},
    {emoji: '🗞️', type: 'dry'}, {emoji: '🥤', type: 'dry'}, {emoji: '📦', type: 'dry'},
    {emoji: '🔋', type: 'toxic'}, {emoji: '🖥️', type: 'toxic'}, {emoji: '🧪', type: 'toxic'}
  ];
  let curSegItem = segItems[0];
  let g1Score = 0;
  
  function nextSegItem() {
    curSegItem = segItems[Math.floor(Math.random()*segItems.length)];
    document.getElementById('segItem').textContent = curSegItem.emoji;
  }
  function segGuess(type) {
    if(type === curSegItem.type) {
        g1Score += 5;
        showToast("Correct! +5 pts");
    } else {
        g1Score -= 2;
        showToast("Wrong bin! -2 pts");
    }
    document.getElementById('game1Score').textContent = g1Score;
    nextSegItem();
  }
  function claimGame1Points() {
    let pts = Math.floor(g1Score / 10);
    if(pts > 0) {
        updateGreenScore(pts, "Game Zone Reward");
        g1Score = 0;
        document.getElementById('game1Score').textContent = g1Score;
    } else {
        showToast("Need at least 10 game points to claim 1 Green Point.");
    }
  }

  // Game 2
  let g2Running = false, g2Score = 0, catcherPos = 40, fallers = [], g2Interval;
  function startCatchGame() {
    if(g2Running) return;
    g2Running = true; g2Score = 0; fallers = [];
    document.getElementById('g2Score').textContent = "Score: 0";
    const area = document.getElementById('catchArea');
    
    g2Interval = setInterval(() => {
        fallers.forEach((f, i) => {
            f.y += 5; // Fix 3: Slower game speed
            f.el.style.top = f.y + 'px';
            if(f.y > 170) {
                if(Math.abs(f.x - catcherPos) < 15) {
                    g2Score += f.isToxic ? -10 : 15;
                    document.getElementById('g2Score').textContent = `Score: ${g2Score}`;
                    if(f.isToxic) showToast("Toxic! -10", true);
                }
                f.el.remove(); fallers.splice(i, 1);
            }
        });
        
        // Slower spawn rate
        if(Math.random() < 0.06) { 
            let el = document.createElement('div');
            let isToxic = Math.random() > 0.6;
            el.textContent = isToxic ? '🔋' : '♻️';
            el.style.position = 'absolute'; el.style.fontSize = '24px';
            let x = 10 + Math.random()*80;
            el.style.left = x + '%'; el.style.top = '0px';
            area.appendChild(el);
            fallers.push({el: el, x: x, y: 0, isToxic: isToxic});
        }
    }, 100);
  }

  function moveCatcher(dir) {
    catcherPos += dir * 20;
    catcherPos = clamp(catcherPos, 0, 85);
    document.getElementById('catcher').style.left = catcherPos + '%';
  }
  
  function stopCatchGame() {
    g2Running = false;
    clearInterval(g2Interval);
    fallers.forEach(f => f.el.remove()); fallers = [];
    let pts = Math.floor(g2Score / 20);
    if(pts > 0) updateGreenScore(pts, "Catch Game Reward");
    else if(g2Score > 0) showToast("Need at least 20 score to claim points.");
    g2Score = 0; document.getElementById('g2Score').textContent = `Score: 0`;
  }
  
  /* ===================================================================
     COMMUNITY POSTS
  =================================================================== */
  function submitCommunityPost() {
      const txt = document.getElementById('newPostContent').value.trim();
      if(!txt) return;
      const feed = document.getElementById('postsFeed');
      const profile = AegisDB.getProfile() || {name: 'Citizen'};
      
      const div = document.createElement('div');
      div.className = 'panel';
      div.innerHTML = `
            <div style="font-size:12px; color:var(--muted); margin-bottom:8px;"><strong>@${profile.name.replace(/\s/g,'')}</strong> · Just now</div>
            <div style="font-size:14.5px; line-height:1.5; margin-bottom:12px;">${txt}</div>
            <div style="display:flex; gap:10px;">
               <button class="guest-btn" style="padding:6px 12px; width:auto;" onclick="this.innerHTML='👍 Liked (1)'">👍 Like (0)</button>
               <button class="guest-btn" style="padding:6px 12px; width:auto;">💬 Comment</button>
               <button class="guest-btn" style="padding:6px 12px; width:auto;" onclick="showToast('Post reported.')">🚨 Report</button>
            </div>
      `;
      feed.insertBefore(div, feed.firstChild);
      document.getElementById('newPostContent').value = '';
      document.getElementById('newPostWrap').style.display = 'none';
      showToast("Post shared with the community!");
  }

  /* ===================================================================
     DAILY GYAN RANDOMIZER
  =================================================================== */
  function setupDailyGyan() {
      const gItems = [
        {emoji:'💧', title:'Rooftop Water Harvesting Basics', desc:'A simple collection setup on your terrace can cut monsoon runoff.'},
        {emoji:'🪴', title:'Matka Composting for Kitchen Waste', desc:'An earthen pot, some soil, and daily scraps — a balcony-sized way to turn peels into compost.'},
        {emoji:'🚲', title:'The 3km Rule', desc:'Trips under 3km on a cycle or on foot save more carbon than any EV swap.'},
        {emoji:'🔌', title:'Vampire Power Mitigation', desc:'Unplugging chargers when not in use saves up to 10% on energy bills.'},
        {emoji:'🛍️', title:'Cloth Bag Habit', desc:'Keep a cloth bag in your vehicle to always avoid plastic bags at shops.'},
        {emoji:'🚿', title:'Bucket Bath Swap', desc:'A standard bucket bath uses 60% less water than a 5-minute shower.'},
        {emoji:'🌱', title:'Plant a Native', desc:'Native plants require less water and support local biodiversity.'}
      ];
      const todayIndex = new Date().getDay();
      document.getElementById('gyanDynamicEmoji').textContent = gItems[todayIndex].emoji;
      document.getElementById('gyanDynamicTitle').textContent = gItems[todayIndex].title;
      document.getElementById('gyanDynamicDesc').textContent = gItems[todayIndex].desc;
      
      const thoughts = [
          "The Earth is what we all have in common. - Wendell Berry",
          "There is no Planet B. - Emmanuel Macron",
          "What you do makes a difference. - Jane Goodall",
          "The environment is where we all meet. - Lady Bird Johnson",
          "He that plants trees loves others besides himself. - Thomas Fuller",
          "Water is the driving force of all nature. - Leonardo da Vinci",
          "We do not inherit the earth from our ancestors, we borrow it from our children."
      ];
      document.getElementById('thoughtOfTheDay').textContent = thoughts[todayIndex];
  }

  /* ===================================================================
     BOOTSTRAP
  =================================================================== */
  (function boot(){
    const savedTheme = AegisDB.getTheme() || 'dark';
    applyTheme(savedTheme);
    setupDailyGyan();

    const auth = AegisDB.getAuth();
    if(auth && auth.mode === 'phone'){ sessionUser = auth; }
    renderAuthState();
    refreshJoinMissionButton();
    renderProfile();
    renderMilestones();
    renderHistoryChart();

    if(!sessionUser){
      // Don't auto open auth modal, let them click Join Mission
    } else {
      document.getElementById('authOverlay').classList.add('hide');
      const profile = AegisDB.getProfile();
      if(profile && profile.carbonScore != null){
        const big = document.getElementById('carbonScoreBig'); if(big) big.textContent = profile.carbonScore;
        greenState.green = clamp(profile.carbonScore, 10, 97);
        refreshGreenDisplays();
      }
      
      const aqiHeader = document.getElementById('aqiCityHeader');
      if(aqiHeader && profile && profile.city) aqiHeader.textContent = `${profile.city} · Updated just now`;
    }
  })();
