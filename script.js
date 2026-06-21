"use strict";

/* -------- WALLET STATE -------- */
let walletBalance = 0;
let walletTransactions = [];
let selectedTopUpAmount = 0;

function formatJMD(amount) {
  return 'J$' + amount.toLocaleString('en-JM');
}

function updateWalletUI() {
  const balNum = document.getElementById('walletBalanceNum');
  const dashBal = document.getElementById('dashWalletBal');
  if (balNum) balNum.textContent = walletBalance.toLocaleString('en-JM');
  if (dashBal) dashBal.textContent = formatJMD(walletBalance);
}

function openTopUpModal() {
  selectedTopUpAmount = 0;
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  const custom = document.getElementById('customAmount');
  if (custom) custom.value = '';
  document.getElementById('topUpModal').classList.add('open');
}

function closeTopUpModal() {
  document.getElementById('topUpModal').classList.remove('open');
}

function selectAmount(amount, btn) {
  selectedTopUpAmount = amount;
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const custom = document.getElementById('customAmount');
  if (custom) custom.value = '';
}

function confirmTopUp() {
  const customInput = document.getElementById('customAmount');
  let amount = selectedTopUpAmount;
  if (customInput && customInput.value) {
    amount = parseInt(customInput.value) || 0;
  }
  if (!amount || amount < 1000) {
    alert('Please select or enter a valid amount (minimum J$1,000).');
    return;
  }
  walletBalance += amount;
  walletTransactions.unshift({
    type: 'credit',
    desc: 'Wallet Top-Up',
    amount: amount,
    date: new Date().toLocaleDateString('en-JM', { day:'numeric', month:'short', year:'numeric' })
  });
  updateWalletUI();
  renderTransactions();
  closeTopUpModal();

  // Flash success message
  const balEl = document.getElementById('walletBalanceDisplay');
  if (balEl) {
    balEl.style.transform = 'scale(1.08)';
    setTimeout(() => { balEl.style.transform = ''; }, 300);
  }
}

function payFromWallet(desc, amount) {
  if (!currentUser) { showPage('login'); return; }
  if (walletBalance < amount) {
    alert('Insufficient wallet balance. Please top up your wallet first.\n\nRequired: ' + formatJMD(amount) + '\nAvailable: ' + formatJMD(walletBalance));
    portalTab(document.querySelectorAll('.ptab')[4], 'wallet');
    openTopUpModal();
    return;
  }
  if (confirm('Pay ' + formatJMD(amount) + ' from your wallet for: ' + desc + '?\n\nBalance after payment: ' + formatJMD(walletBalance - amount))) {
    walletBalance -= amount;
    walletTransactions.unshift({
      type: 'debit',
      desc: desc,
      amount: amount,
      date: new Date().toLocaleDateString('en-JM', { day:'numeric', month:'short', year:'numeric' })
    });
    updateWalletUI();
    renderTransactions();
    alert('✅ Payment successful! ' + formatJMD(amount) + ' paid for ' + desc + '.');
  }
}

function renderTransactions() {
  const container = document.getElementById('walletTransactions');
  if (!container) return;
  if (walletTransactions.length === 0) {
    container.innerHTML = '<p style="font-size:.875rem;color:var(--muted);text-align:center;padding:28px 0;">No transactions yet. Top up your wallet to get started.</p>';
    return;
  }
  container.innerHTML = walletTransactions.slice(0, 8).map(tx => `
    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-icon ${tx.type}">${tx.type === 'credit' ? '＋' : '−'}</div>
        <div>
          <div class="tx-desc">${tx.desc}</div>
          <div class="tx-date">${tx.date}</div>
        </div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === 'credit' ? '+' : '-'}${formatJMD(tx.amount)}</div>
    </div>`).join('');
}

function showWalletHistory() {
  portalTab(document.querySelectorAll('.ptab')[4], 'wallet');
}

/* -------- PAGE ROUTER -------- */
let currentUser = null;

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.add('active'); window.scrollTo({ top: 0, behavior: 'instant' }); }
  document.querySelectorAll('#mainNav a').forEach(a => a.classList.remove('active-link'));
  const map = { home: 0, about: 4 };
  const idx = map[page];
  if (idx !== undefined) {
    const links = document.querySelectorAll('#mainNav a');
    if (links[idx]) links[idx].classList.add('active-link');
  }
  if (page === 'portal') updatePortalGreeting();
}

function scrollToId(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

/* -------- MOBILE MENU -------- */
function openMobileMenu() { document.getElementById('mobileMenu').classList.add('open'); }
function closeMobileMenu(e) {
  if (!e || e.target === document.getElementById('mobileMenu')) {
    document.getElementById('mobileMenu').classList.remove('open');
  }
}

/* -------- AUTH UI -------- */
function updateAuthUI() {
  const authBtns   = document.getElementById('navAuth');
  const portalBtns = document.getElementById('navPortal');
  const nameEl     = document.getElementById('navUsername');
  if (currentUser) {
    authBtns.classList.add('hidden');
    portalBtns.classList.remove('hidden');
    if (nameEl) nameEl.textContent = currentUser.name;
  } else {
    authBtns.classList.remove('hidden');
    portalBtns.classList.add('hidden');
  }
}

function logout() { currentUser = null; walletBalance = 0; walletTransactions = []; updateAuthUI(); showPage('home'); }

/* -------- AUTH LOGIC -------- */
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function showFieldError(f,e,m){const fi=document.getElementById(f),er=document.getElementById(e);if(fi)fi.classList.add('input-error');if(er){er.textContent=m;er.style.display='block';}}
function clearFieldError(f,e){const fi=document.getElementById(f),er=document.getElementById(e);if(fi)fi.classList.remove('input-error');if(er)er.style.display='none';}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  let valid   = true;
  if (!isValidEmail(email)) { showFieldError('loginEmail','loginEmailErr','Please enter a valid email address.'); valid=false; } else clearFieldError('loginEmail','loginEmailErr');
  if (!pass) { showFieldError('loginPass','loginPassErr','Please enter your password.'); valid=false; } else clearFieldError('loginPass','loginPassErr');
  if (!valid) return;
  const namePart = email.split('@')[0].replace(/[._-]/g,' ');
  const name = namePart.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  currentUser = { name, email };
  updateAuthUI();
  showPage('portal');
}

function handleRegister() {
  const first=document.getElementById('regFirst').value.trim(),last=document.getElementById('regLast').value.trim(),email=document.getElementById('regEmail').value.trim(),type=document.getElementById('regType').value,pass=document.getElementById('regPass').value,confirm=document.getElementById('regPassConfirm').value,terms=document.getElementById('regTerms').checked;
  let valid=true;
  if(!isValidEmail(email)){showFieldError('regEmail','regEmailErr','Please enter a valid email address.');valid=false;}else clearFieldError('regEmail','regEmailErr');
  if(!type){showFieldError('regType','regTypeErr','Please select an account type.');valid=false;}else clearFieldError('regType','regTypeErr');
  if(!pass||pass!==confirm){showFieldError('regPassConfirm','regPassErr',!pass?'Please create a password.':'Passwords do not match.');valid=false;}else clearFieldError('regPassConfirm','regPassErr');
  if(!terms){document.getElementById('regTermsErr').style.display='block';valid=false;}else document.getElementById('regTermsErr').style.display='none';
  if(!valid)return;
  const fullName=[first,last].filter(Boolean).join(' ')||email.split('@')[0];
  currentUser={name:fullName,email};
  updateAuthUI();
  showPage('portal');
}

function togglePass(inputId,btn){const inp=document.getElementById(inputId);if(!inp)return;if(inp.type==='password'){inp.type='text';btn.textContent='Hide';}else{inp.type='password';btn.textContent='Show';}}

function checkPassStrength(value){
  const bar=document.getElementById('passStrengthFill'),label=document.getElementById('passStrengthLabel');
  if(!bar||!label)return;
  let score=0;
  if(value.length>=8)score++;if(/[A-Z]/.test(value))score++;if(/[0-9]/.test(value))score++;if(/[^A-Za-z0-9]/.test(value))score++;
  const levels=[{w:'0%',c:'',t:'Enter a password'},{w:'25%',c:'#E53E3E',t:'Weak'},{w:'50%',c:'#F6AD55',t:'Fair'},{w:'75%',c:'#68D391',t:'Good'},{w:'100%',c:'#38A169',t:'Strong ✓'}];
  bar.style.width=levels[score].w;bar.style.background=levels[score].c;label.textContent=levels[score].t;
}

/* -------- PORTAL -------- */
function portalTab(btn, tabId) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.portal-tab-content').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
  const content = document.getElementById('ptab-' + tabId);
  if (content) content.classList.add('active');
}

function updatePortalGreeting() {
  const greetEl=document.getElementById('portalGreeting'),greetSubEl=document.getElementById('portalGreetingSub');
  if(!greetEl)return;
  const hour=new Date().getHours();
  const tod=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  const name=currentUser?', '+currentUser.name.split(' ')[0]:'';
  greetEl.textContent=tod+name+'!';
  if(greetSubEl)greetSubEl.textContent="Here's an overview of your IP portfolio.";
  updateWalletUI();
}

/* -------- WIZARD -------- */
const wizState={type:null,publicUse:null,international:null};
let wizCurrentStep=1;
const wizardResults={
  brand:{title:'Trademark Registration Recommended',body:'A trademark gives you exclusive rights to your brand name, logo, or slogan in Jamaica. Since you\'re already trading, file as soon as possible to establish priority. Protection lasts 10 years and is renewable indefinitely.'},
  invention:{title:'Patent Protection Recommended',body:'A patent grants you up to 20 years of exclusive rights to your invention. Consider filing a provisional patent application first — it protects you while you develop the full application and costs less upfront.'},
  creative:{title:'Copyright (+ Optional Registration)',body:'Copyright arises automatically the moment you create an original work — no registration required. However, voluntary registration with JIPO strengthens your legal position and is strongly recommended for commercial music, art, software, or literary works.'},
  design:{title:'Industrial Design Registration Recommended',body:'An industrial design registration protects the unique visual appearance of your product — its shape, pattern, or colour. Protection lasts up to 15 years and prevents counterfeit copies in Jamaica and potentially abroad.'},
};
function wizNext(step,value){
  if(wizCurrentStep===1)wizState.type=value;if(wizCurrentStep===2)wizState.publicUse=value;if(wizCurrentStep===3)wizState.international=value;
  wizCurrentStep=step;
  document.querySelectorAll('.wizard-step').forEach(s=>s.classList.remove('active'));
  const stepEl=document.getElementById('wstep'+step);if(stepEl)stepEl.classList.add('active');
  const progress=document.getElementById('wizardProgress');if(progress)progress.style.width=(((step-1)/3)*100)+'%';
}
function wizResult(){
  document.querySelectorAll('.wizard-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('wstep-result').classList.add('active');
  const progress=document.getElementById('wizardProgress');if(progress)progress.style.width='100%';
  const result=wizardResults[wizState.type]||wizardResults.brand;
  document.getElementById('wizardResultTitle').textContent=result.title;
  document.getElementById('wizardResultText').textContent=result.body;
}
function resetWizard(){
  wizCurrentStep=1;wizState.type=null;wizState.publicUse=null;wizState.international=null;
  document.querySelectorAll('.wizard-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('wstep1').classList.add('active');
  const progress=document.getElementById('wizardProgress');if(progress)progress.style.width='0%';
}

/* -------- APPLICATION TRACKER -------- */
let sampleApplications={
  'TM-2025-04821':{name:'Solar Sip™',type:'Trademark',filed:'14 January 2025',step:2},
  'TM-2024-03210':{name:'Yardie Tech™',type:'Trademark',filed:'3 August 2024',step:4},
  'PT-2024-00581':{name:'EcoFilter Device',type:'Patent',filed:'20 June 2024',step:1},
  'TM-2023-09914':{name:'Kingston Konfidence',type:'Trademark',filed:'11 November 2023',step:4},
};
const timelineSteps=['Received','Formalities','Examination','Publication','Registered'];
function trackApplication(){
  const input=document.getElementById('trackInput'),result=document.getElementById('trackerResult');
  if(!input||!result)return;
  const ref=input.value.trim().toUpperCase();
  const app=sampleApplications[ref];
  if(!app){
    result.style.display='block';
    result.innerHTML='<div style="background:#FEF2F2;border-radius:var(--radius-md);padding:20px;color:#991B1B;font-size:.9rem">⚠️ No application found for reference <strong>'+ref+'</strong>. Please check your filing receipt and try again.</div>';
    return;
  }
  const timelineHtml=timelineSteps.map((label,i)=>{const cls=i<app.step?'done':i===app.step?'active':'';return'<div class="tl-step"><div class="tl-dot '+cls+'"></div><div class="tl-label">'+label+'</div></div>';}).join('');
  result.style.display='block';
  result.innerHTML='<div class="tracker-status"><div class="status-label">'+app.type+' Application</div><div class="status-title">'+app.name+'</div><div style="font-size:.83rem;color:var(--muted);margin-top:4px">Filed: '+app.filed+'</div><div class="status-timeline" style="margin-top:20px">'+timelineHtml+'</div></div>';
}

/* -------- NEW APPLICATION (creates a trackable record) -------- */
const typePrefix={ 'Trademark':'TM', 'Patent':'PT', 'Industrial Design':'ID', 'Copyright':'CR' };
function newApplication(){
  if(!currentUser){ showPage('login'); return; }
  const name=prompt('Enter a name for your new application (e.g. your brand, invention, or work):');
  if(!name||!name.trim())return;
  let type=prompt('Enter the IP type — Trademark, Patent, Industrial Design, or Copyright:','Trademark');
  if(!type)return;
  type=type.trim().toLowerCase();
  const typeMap={ 'trademark':'Trademark', 'patent':'Patent', 'industrial design':'Industrial Design', 'design':'Industrial Design', 'copyright':'Copyright' };
  type=typeMap[type]||'Trademark';

  // Generate a reference number
  const prefix=typePrefix[type]||'TM';
  const year=new Date().getFullYear();
  const seq=String(Math.floor(10000+Math.random()*89999));
  const ref=prefix+'-'+year+'-'+seq;

  // Filed date
  const now=new Date();
  const filedShort=now.toLocaleDateString('en-JM',{day:'numeric',month:'short',year:'numeric'});
  const filedLong=now.toLocaleDateString('en-JM',{day:'numeric',month:'long',year:'numeric'});

  // Register it so it is trackable — step 0 = "Received"
  sampleApplications[ref]={ name:name.trim(), type:type, filed:filedLong, step:0 };

  // Add a row to the portal Applications table
  const tbody=document.querySelector('#ptab-applications tbody');
  if(tbody){
    const tr=document.createElement('tr');
    tr.innerHTML='<td>'+ref+'</td><td>'+name.trim()+'</td><td>'+type+'</td><td>'+filedShort+'</td>'+
      '<td><span class="status-pill status-received">Received</span></td>'+
      '<td><a href="#" class="table-action" onclick="trackFromPortal(\''+ref+'\');return false;">Track</a></td>';
    tbody.insertBefore(tr,tbody.firstChild);
  }

  alert('✅ Application created!\n\nReference: '+ref+'\nName: '+name.trim()+'\nType: '+type+'\nStatus: Received\n\nYou can now track it under "Track Application" using this reference number.');
}

/* Jump to the public tracker and auto-fill a reference */
function trackFromPortal(ref){
  showPage('home');
  setTimeout(()=>{
    scrollToId('tracker-sec');
    const input=document.getElementById('trackInput');
    if(input){ input.value=ref; trackApplication(); }
  },120);
}

/* -------- NEWS -------- */
const newsData=[
  {tag:'Events',title:'Innovation Week 2026',text:'Workshops and IP awareness events across Jamaica. Register to attend.'},
  {tag:'Announcement',title:'New Online Filing System',text:'Submit trademarks and patents entirely online through the upgraded e-JIPO portal.'},
  {tag:'Programme',title:'Young Innovators Fund',text:'JIPO supports students and entrepreneurs with IP education, mentorship and grants.'},
  {tag:'Campaign',title:'Copyright Awareness Drive',text:'Nationwide campaign educating creators about automatic copyright and enforcement.'},
  {tag:'Update',title:'MSMEs: IP Starter Pack',text:'Free templates, guides, and subsidised filing fees for small businesses.'},
  {tag:'Update',title:'Digital Transformation',text:'JIPO is modernising services for faster online processing and certificate delivery.'},
  {tag:'New Feature',title:'Account Wallets Now Live',text:'Load funds to your JIPO account and pay for all services directly from your wallet.'},
];
function loadNews(){
  const track=document.getElementById('newsTrack');if(!track)return;
  const looped=[...newsData,...newsData];
  track.innerHTML=looped.map(n=>'<div class="news-card"><div class="news-tag">'+n.tag+'</div><h3>'+n.title+'</h3><p>'+n.text+'</p></div>').join('');
}

/* -------- NEWSLETTER -------- */
function subscribeNewsletter(){
  const emailInput=document.getElementById('nlEmail'),form=document.querySelector('.nl-form'),success=document.getElementById('nlSuccess');
  if(!emailInput)return;
  const email=emailInput.value.trim();
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){emailInput.style.border='2px solid #E53E3E';emailInput.focus();return;}
  emailInput.style.border='';
  if(form)form.style.display='none';if(success)success.style.display='block';
}

/* -------- CHATBOT -------- */
let chatOpen=false;
function toggleChat(){
  chatOpen=!chatOpen;
  const box=document.getElementById('chatbotBox');
  if(box)box.style.display=chatOpen?'flex':'none';
  if(chatOpen){const input=document.getElementById('userInput');if(input)input.focus();}
}
function sendMessage(){
  const inputEl=document.getElementById('userInput'),msgs=document.getElementById('chatMessages');
  if(!inputEl||!msgs)return;
  const text=inputEl.value.trim();if(!text)return;
  const userDiv=document.createElement('div');userDiv.className='user-message';userDiv.textContent=text;msgs.appendChild(userDiv);
  inputEl.value='';msgs.scrollTop=msgs.scrollHeight;
  const typing=document.createElement('div');typing.className='typing-indicator';typing.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';msgs.appendChild(typing);msgs.scrollTop=msgs.scrollHeight;
  setTimeout(()=>{
    typing.remove();
    const botDiv=document.createElement('div');botDiv.className='bot-message';botDiv.textContent=getBotReply(text);msgs.appendChild(botDiv);msgs.scrollTop=msgs.scrollHeight;
  },900);
}
function getBotReply(input){
  const i=input.toLowerCase();
  if(/hello|hi|hey/.test(i))return"Hello! I'm the JIPO virtual assistant. Ask me about trademarks, patents, copyright, or how to file online.";
  if(/wallet|balance|top.?up|fund|pay/.test(i))return"Your account wallet lets you pre-load funds to pay for any JIPO service instantly. Log in and go to the Wallet tab in your Client Portal to top up.";
  if(/trademark/.test(i))return"Trademark registration protects your brand name, logo, or slogan. Registration starts at J$10,000 and lasts 10 years. Create a free account to start your application.";
  if(/patent/.test(i))return"A patent protects your invention for up to 20 years. Filing fee starts at J$8,000. I recommend searching our database first to check for prior art.";
  if(/copyright/.test(i))return"Copyright arises automatically when you create an original work. Voluntary registration with JIPO strengthens your legal position — especially for music, art, and software.";
  if(/design/.test(i))return"Industrial design registration protects the unique visual appearance of your product. Protection lasts up to 15 years from J$8,000.";
  if(/fee|cost|price|how much/.test(i))return"Fees: Trademark from J$10,000 · Patent from J$15,000 · Design from J$8,000 · Copyright from J$5,000. See the full Fee Schedule on our home page.";
  if(/track|status|application|reference/.test(i))return"Enter your reference number (e.g. TM-2025-04821) in the Track Application section on the home page, or view all your applications in your Client Portal.";
  if(/renew|renewal|expire/.test(i))return"Trademarks renew every 10 years. Log in to your Client Portal to see upcoming renewal dates. You can pay renewal fees directly from your wallet.";
  if(/contact|phone|email|office/.test(i))return"JIPO is located at 18 Trafalgar Road, Kingston 10. Call +1 876-946-1114 or email info@jipo.gov.jm. Office hours: Mon–Fri, 8am–5pm.";
  if(/thank/.test(i))return"You're welcome! Is there anything else I can help you with?";
  return"I can help with trademarks, patents, copyright, industrial designs, fees, your wallet, and general IP questions in Jamaica. What would you like to know?";
}

/* -------- INIT -------- */
document.addEventListener('DOMContentLoaded',()=>{
  showPage('home');
  updateAuthUI();
  loadNews();
  const nlEmail=document.getElementById('nlEmail');if(nlEmail)nlEmail.addEventListener('keypress',e=>{if(e.key==='Enter')subscribeNewsletter();});
  const trackInput=document.getElementById('trackInput');if(trackInput)trackInput.addEventListener('keypress',e=>{if(e.key==='Enter')trackApplication();});
  const regPass=document.getElementById('regPass');if(regPass)regPass.addEventListener('input',()=>checkPassStrength(regPass.value));
  const sendBtn=document.getElementById('sendBtn');if(sendBtn)sendBtn.addEventListener('click',sendMessage);
  const inputEl=document.getElementById('userInput');if(inputEl)inputEl.addEventListener('keypress',e=>{if(e.key==='Enter')sendMessage();});
  const firstContent=document.getElementById('ptab-dashboard');if(firstContent)firstContent.classList.add('active');
  // Close modal on overlay click
  document.getElementById('topUpModal').addEventListener('click',function(e){if(e.target===this)closeTopUpModal();});
});
/* -------- SITE SEARCH -------- */
const searchIndex = [
  {cat:'Service', title:'Trademark Registration', desc:'Protect your brand name, logo, or slogan. Application J$5,000 · Registration J$10,000 · Renewal J$8,500.', go:()=>{showPage('home');scrollToId('services');}},
  {cat:'Service', title:'Patent Protection', desc:'Exclusive rights to your invention for up to 20 years. Application J$8,000 · Registration J$15,000 · Renewal J$12,000.', go:()=>{showPage('home');scrollToId('services');}},
  {cat:'Service', title:'Copyright Services', desc:'Voluntary registration for music, art, and writing. Application J$2,500 · Registration J$5,000.', go:()=>{showPage('home');scrollToId('services');}},
  {cat:'Service', title:'Industrial Designs', desc:'Protect the visual appearance of your product. Application J$4,000 · Registration J$8,000 · Renewal J$6,500.', go:()=>{showPage('home');scrollToId('services');}},
  {cat:'Service', title:'IP Search Database', desc:'Search existing trademarks, patents and designs. Basic search free · Certified report J$3,000.', go:()=>{showPage('home');scrollToId('services');}},
  {cat:'Service', title:'IP Enforcement Guidance', desc:'Options when your rights are infringed. Advisory free · Opposition filing J$7,500.', go:()=>{showPage('home');scrollToId('services');}},
  {cat:'Tool', title:'Should I Register? (IP Wizard)', desc:'Answer three questions to find the right IP protection for you.', go:()=>{showPage('home');scrollToId('wizard-sec');}},
  {cat:'Tool', title:'Track Your Application', desc:'Enter your reference number for real-time application status.', go:()=>{showPage('home');scrollToId('tracker-sec');}},
  {cat:'Account', title:'Account Wallet', desc:'Pre-load funds to pay for filing fees, renewals and services instantly.', go:()=>{currentUser?showPage('portal'):showPage('login');}},
  {cat:'Page', title:'About JIPO', desc:'Our mission, history, leadership team and international affiliations.', go:()=>{showPage('about');}},
  {cat:'Leadership', title:'Dr. Carla Reid — Director General', desc:'IP policy & strategy, international treaties, commercial law.', go:()=>{showPage('about');scrollToId('leadership-sec');}},
  {cat:'Leadership', title:'Marcus Bennett — Patents & Designs', desc:'Patent examination, industrial designs, technical assessment.', go:()=>{showPage('about');scrollToId('leadership-sec');}},
  {cat:'Leadership', title:'Simone Thompson — Trademarks & Copyright', desc:'Trademark law, copyright, creative sector and public outreach.', go:()=>{showPage('about');scrollToId('leadership-sec');}},
  {cat:'FAQ', title:'How long does trademark registration take?', desc:'Examination takes 3–6 months; full process 8–12 months if no objections.', go:()=>{showPage('home');scrollToId('faq-sec');}},
  {cat:'FAQ', title:'Do I need a lawyer to file a patent?', desc:'You can file yourself, but a registered patent attorney is recommended for complex inventions.', go:()=>{showPage('home');scrollToId('faq-sec');}},
  {cat:'FAQ', title:'How do I load funds to my wallet?', desc:'Log in, open the Wallet tab, and top up by card, bank transfer or NCB QuickPay.', go:()=>{showPage('home');scrollToId('faq-sec');}},
  {cat:'FAQ', title:'Can I register IP internationally?', desc:'Yes — Jamaica is part of the Paris Convention and PCT, covering 180+ countries.', go:()=>{showPage('home');scrollToId('faq-sec');}},
  {cat:'Page', title:'Give Feedback / Rate Us', desc:'Rate your experience and share your feedback to help us improve.', go:()=>{showPage('home');scrollToId('feedback-sec');}},
  {cat:'Action', title:'Create a Free Account', desc:'Register on e-JIPO to file and manage your applications online.', go:()=>{showPage('register');}},
  {cat:'Action', title:'Log In to Client Portal', desc:'Access your applications, renewals, documents and wallet.', go:()=>{showPage('login');}},
];

function openSearch(){
  const ov=document.getElementById('searchOverlay');
  if(!ov)return;
  ov.classList.add('open');
  const inp=document.getElementById('siteSearchInput');
  if(inp){inp.value='';inp.focus();}
  renderSearchResults('');
}
function closeSearch(e){
  // If invoked from overlay click, only close when the backdrop itself was clicked
  if(e&&e.type==='click'&&e.target&&e.target.id!=='searchOverlay'&&!e.target.classList.contains('search-close'))return;
  const ov=document.getElementById('searchOverlay');
  if(ov)ov.classList.remove('open');
}
function renderSearchResults(query){
  const box=document.getElementById('searchResults');
  if(!box)return;
  const q=query.trim().toLowerCase();
  if(!q){box.innerHTML='<p class="search-hint">Start typing to search across the JIPO website.</p>';return;}
  const matches=searchIndex.filter(item=>(item.title+' '+item.desc+' '+item.cat).toLowerCase().includes(q));
  if(matches.length===0){box.innerHTML='<p class="search-empty">No results found for "<strong>'+query+'</strong>". Try another keyword.</p>';return;}
  box.innerHTML=matches.map((m,i)=>'<button class="search-result" data-idx="'+searchIndex.indexOf(m)+'"><div class="sr-cat">'+m.cat+'</div><div class="sr-title">'+m.title+'</div><div class="sr-desc">'+m.desc+'</div></button>').join('');
  box.querySelectorAll('.search-result').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const item=searchIndex[parseInt(btn.dataset.idx)];
      document.getElementById('searchOverlay').classList.remove('open');
      if(item&&item.go)item.go();
    });
  });
}

/* -------- FEEDBACK & RATINGS -------- */
let selectedRating=0;
const ratingTexts=['Tap a star to rate','Poor','Fair','Good','Very Good','Excellent'];
function initFeedback(){
  const stars=document.querySelectorAll('#starRating .star');
  const label=document.getElementById('ratingLabel');
  stars.forEach(star=>{
    star.addEventListener('mouseenter',()=>paintStars(stars,parseInt(star.dataset.value)));
    star.addEventListener('mouseleave',()=>paintStars(stars,selectedRating));
    star.addEventListener('click',()=>{
      selectedRating=parseInt(star.dataset.value);
      paintStars(stars,selectedRating);
      if(label)label.textContent=ratingTexts[selectedRating];
    });
  });
}
function paintStars(stars,n){stars.forEach(s=>{s.classList.toggle('active',parseInt(s.dataset.value)<=n);});}
function submitFeedback(){
  const msg=document.getElementById('fbMessage');
  const label=document.getElementById('ratingLabel');
  if(selectedRating===0){if(label){label.textContent='Please select a rating first.';label.style.color='#E53E3E';}return;}
  if(label)label.style.color='';
  const form=document.getElementById('feedbackForm');
  const success=document.getElementById('feedbackSuccess');
  if(success)success.style.display='block';
  // Reset inputs
  const name=document.getElementById('fbName');
  if(name)name.value='';
  if(msg)msg.value='';
  const stars=document.querySelectorAll('#starRating .star');
  setTimeout(()=>{
    selectedRating=0;paintStars(stars,0);
    if(label)label.textContent=ratingTexts[0];
  },400);
}

/* -------- SEARCH & FEEDBACK INIT (runs after DOM ready) -------- */
document.addEventListener('DOMContentLoaded',()=>{
  const ssi=document.getElementById('siteSearchInput');
  if(ssi)ssi.addEventListener('input',e=>renderSearchResults(e.target.value));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const ov=document.getElementById('searchOverlay');if(ov)ov.classList.remove('open');}});
  initFeedback();
});
