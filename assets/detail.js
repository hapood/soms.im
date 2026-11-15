// A single active explainer. Hidden chapters have no animation tasks.
const detailChapters = [
  { hash: 'direct', intro: 'Alice sends locally to Bob, across domains to Charlie, then receives a reply.', notes: [
    ['An address, not a platform', 'An address identifies both the person and the server that hosts their account.'],
    ['Local stays local', 'Messages between members of the same server do not need a trip through another domain.'],
    ['Servers connect directly', 'SOMFP carries cross-domain messages between independent servers.']
  ] },
  { hash: 'groups', intro: 'Charlie sends from the mirror. Alice then sends from the authoritative group.', notes: [
    ['Local delivery in parallel', 'The mirror delivers to Daisy while forwarding the conversation to the authoritative realm.'],
    ['One message, multiple copies', 'Watch independent envelopes branch toward local members and the other server.'],
    ['Arrive, then notify', 'Each recipient lights up only after their own copy arrives. The original sender is not shown as a new recipient.']
  ] },
  { hash: 'sync', intro: 'Servers and clients share a sync pattern: notify, pull, catch up.', notes: [
    ['One pattern, two connections', 'Peer servers and clients both pull updates after a wake-up hint. Their transports, authentication and APIs need not be identical.'],
    ['Hints are not message data', 'The receiving server or client requests updates and saves its progress as it processes the returned data.'],
    ['Reconnect and catch up', 'Both can retrieve missed updates from saved positions. The client example illustrates reconnecting; batching and retries are simplified.']
  ] }
];
detailChapters.push({ intro: 'Discover the peer, establish recognition, then exchange signed requests over HTTPS.', notes: [
  ['HTTPS protects the link', 'Hostname-verified HTTPS encrypts transport and authenticates the responding endpoint. This is not user-to-user end-to-end encryption.'],
  ['Recognition establishes trust', 'Servers validate discovery documents, root-authorized signing certificates, and local admission policy. A recognized result confirms acceptance; pending does not.'],
  ['Requests stay authenticated', 'HTTP Message Signatures authenticate requests. Content digests bind the body, and time-window checks limit replay. Each operation still requires authorization.']
] });
let detailPlaying = false;
let detailVisible = false;
let detailAutomatic = true;
const detailReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const detailStatus = document.getElementById('chapter-status');
// Preserve the static HTML introduction; animation status may change independently.
const detailIntro = detailStatus.textContent;
let syncTrail;

function setDetailStatus(text) { detailStatus.textContent = text; }
function setDetailStep(number, title, description) {
  detailStatus.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `0${number} / ${title}`;
  const copy = document.createElement('span');
  copy.textContent = description;
  detailStatus.append(heading, copy);
}
function resetSync() {
  ['syncPacket', 'syncHint'].forEach(id => document.getElementById(id)?.setAttribute('opacity', '0'));
  syncTrail?.clear();
  document.getElementById('securityPacket')?.setAttribute('opacity', '0');
  securityTrail?.clear();
  document.getElementById('securityBridge')?.setAttribute('opacity', '0');
  document.querySelectorAll('.security-flow-copy').forEach(el => el.remove());
}
function stopDetail(text) {
  abortAnimation(activeToken);
  detailPlaying = false;
  resetSlide1Visuals(); resetSlide2Visuals(); resetReceiveEffects(); resetSync();
  if (text) setDetailStatus(text);
}
function selectDetailChapter(index) {
  if (index < 0 || index > 3) return;
  stopDetail();
  currentSlide = index;
  // Each document owns just its own diagram; no hidden chapters to initialize.
  document.querySelectorAll('.detail-explainer .slide').forEach(slide => { slide.hidden = false; });
  document.getElementById('chapter-panel').removeAttribute('role');
  // Chapter explanations are static HTML for crawlers, no-JS readers and resilience.

  setDetailStatus(detailIntro);
  detailAutomatic = !detailReducedMotion.matches;
  if (detailVisible && !document.hidden && detailAutomatic) startDetail();
}
async function startDetail() {
  if (detailPlaying || document.hidden || !detailVisible) return;
  const token = { aborted: false, once: true, cancel: new Set() };
  activeToken = token;
  detailPlaying = true;
  detailAutomatic = false;
  setDetailStatus(detailIntro);
  try {
    do {
      await [runAct1Loop, runAct2Loop, runSyncDemo, runSecurityDemo][currentSlide](token);
      if (token.aborted) return;
      setDetailStatus('Sequence complete. The demonstration repeats shortly.');
      await sleepWithToken(4600, token);
    } while (!token.aborted);

  } catch (error) {
    console.error('Explainer failed', error);
    if (activeToken === token) stopDetail('Animation unavailable. Read the flow below.');
  }
}
async function runSyncDemo(token) {
  for (const serverMode of [true, false]) {
    document.getElementById('syncReceiverTitle').textContent = serverMode ? 'Peer server' : 'Your client';
    document.getElementById('syncMode').textContent = serverMode ? '01 · SERVER TO SERVER' : '02 · SERVER TO CLIENT';
    document.getElementById('syncClientIcon').setAttribute('display', serverMode ? 'none' : 'inline');
    document.getElementById('syncServerIcon').setAttribute('display', serverMode ? 'inline' : 'none');
    await runSyncConnection(token, serverMode);
    if (token.aborted) return;
  }
}

async function runSyncConnection(token, serverMode) {
  const receiver = serverMode ? 'receiving server' : 'client';
  const state = document.getElementById('syncClientState');
  const cursor = document.getElementById('syncCursor');
  const packet = document.getElementById('syncPacket');
  const hint = document.getElementById('syncHint');
  syncTrail ||= new SvgParticleTrail(document.getElementById('syncParticles'));
  const travel = (element, path, forward, color) => animateAlongPathWithParticles(element, document.getElementById(path), 1200, forward, syncTrail, color, token);
  state.textContent = 'Connected'; cursor.textContent = 'saved cursor';
  setDetailStatus(`1 / New messages are stored. An update hint wakes the ${receiver}.`);
  await travel(hint, 'syncHintPath', true, '#f5d67b');
  if (token.aborted) return;
  state.textContent = 'Update hint';
  await sleepWithToken(650, token); if (token.aborted) return;
  setDetailStatus(`2 / The ${receiver} requests updates after its saved position.`);
  await travel(hint, 'syncPullPath', false, '#7fcaf0'); if (token.aborted) return;
  state.textContent = 'Pulling…';
  setDetailStatus(`3 / Message data returns. The ${receiver} processes it and saves its progress.`);
  await travel(packet, 'syncDataPath', true, '#a2e5d5'); if (token.aborted) return;
  state.textContent = 'Up to date'; cursor.textContent = 'cursor advanced';
  await sleepWithToken(1400, token); if (token.aborted) return;
  if (serverMode) return;
  state.textContent = 'Offline';
  setDetailStatus('4 / The connection drops. More messages arrive on the server; the saved cursor stays on the client.');
  await sleepWithToken(2000, token); if (token.aborted) return;
  state.textContent = 'Reconnected';
  setDetailStatus('5 / On reconnect, pull resumes from the saved position to catch up on missed updates.');
  await travel(hint, 'syncPullPath', false, '#7fcaf0'); if (token.aborted) return;
  for (let i = 0; i < 3; i++) {
    await travel(packet, 'syncDataPath', true, '#a2e5d5'); if (token.aborted) return;
    cursor.textContent = `catching up ${i + 1}/3`;
  }
  state.textContent = 'Up to date'; cursor.textContent = 'cursor advanced';
  await sleepWithToken(1400, token);
}

let securityTrail;
async function runSecurityDemo(token) {
  const packet = document.getElementById('securityPacket');
  document.getElementById('securityBridge').setAttribute('opacity', '0');
  document.getElementById('securityBridgeLabel').setAttribute('opacity', '0');
  document.getElementById('securityHandshakeLines').setAttribute('opacity', '1');
  securityTrail ||= new SvgParticleTrail(document.getElementById('securityParticles'));
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const travel = (pathId, forward) => animateAlongPathWithParticles(packet, document.getElementById(pathId), 1500, forward, securityTrail, '#a2e5d5', token);
  const phases = [
    ['HTTPS discovery →', '← Roots & signing certificates', 'Verify hostname & identity', 'Publish authorized keys', '1 / Locate the peer and fetch discovery over hostname-verified HTTPS. Validate root-authorized signing certificates.'],
    ['Signed Recognize →', '← recognized', 'Pin peer identity; prepare receive path', 'Verify sender, signature & policy', 'Send a signed Recognize request. The receiver validates identity, signature and admission policy before confirming acceptance.']
  ];
  for (const [index, phase] of phases.entries()) {
    text('securityLeftState', phase[2]); text('securityRightState', phase[3]);
    setDetailStep(1, 'Verify identities', phase[4].replace(/^1 \/ /, ''));
    const prefix = index === 0 ? 'securityDiscovery' : 'securityRecognize';
    await travel(prefix + 'Request', true); if (token.aborted) return;
    await sleepWithToken(1100, token); if (token.aborted) return;
    await travel(prefix + 'Response', false); if (token.aborted) return;
    await sleepWithToken(1600, token); if (token.aborted) return;
  }
  setDetailStep(2, 'Recognition confirmed', 'The bridge represents recognized peers. HTTPS has protected the exchange from the beginning.');
  document.getElementById('securityBridgeLabel').setAttribute('opacity', '1');
  // Preserve all four handshake exchanges as context behind the live bridge.
  document.getElementById('securityHandshakeLines').setAttribute('opacity', '.25');
  text('securityLeftState', 'Peer recognized'); text('securityRightState', 'Peer recognized');
  const bridge = document.getElementById('securityBridge');
  await new Promise(resolve => {
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / 650, 1);
      bridge.setAttribute('opacity', progress);
      if (progress < 1) scheduleFrame(frame, token, resolve); else resolve();
    }
    scheduleFrame(frame, token, resolve);
  });
  if (token.aborted) return;
  await sleepWithToken(1400, token); if (token.aborted) return;
  setDetailStep(3, 'Exchange securely', 'Requests flow in both directions over encrypted transport. Each request is signed and authorized; this is not user-to-user end-to-end encryption.');
  await Promise.all([securityFlow(true, token), securityFlow(false, token)]);
}

async function securityFlow(forward, token) {
  const original = document.getElementById('securityPacket');
  const copy = original.cloneNode(true);
  copy.removeAttribute('id'); copy.classList.add('security-flow-copy');
  const blocks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  blocks.setAttribute('fill', '#a2e5d5');
  for (let i = 0; i < 3; i++) {
    const block = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    block.setAttribute('x', i * 8 - 10); block.setAttribute('y', '-4');
    block.setAttribute('width', '5'); block.setAttribute('height', '8'); blocks.appendChild(block);
  }
  copy.appendChild(blocks); original.parentNode.appendChild(copy);
  const artwork = Array.from(copy.children).filter(el => el !== blocks);
  try {
    if (!forward) await sleepWithToken(650, token);
    for (let i = 0; i < 4 && !token.aborted; i++) {
      await new Promise(resolve => {
        const start = performance.now();
        function frame(now) {
          const p = Math.min((now - start) / 1700, 1);
          const encrypted = Math.min(1, p / 0.18, (1 - p) / 0.18);
          artwork.forEach(el => el.setAttribute('opacity', 1 - encrypted));
          blocks.setAttribute('opacity', encrypted);
          copy.setAttribute('opacity', '1');
          copy.setAttribute('transform', `translate(${forward ? 300 + 400 * p : 700 - 400 * p}, ${forward ? 235 : 275})`);
          if (p < 1) scheduleFrame(frame, token, resolve); else { copy.setAttribute('opacity', '0'); resolve(); }
        }
        scheduleFrame(frame, token, resolve);
      });
      await sleepWithToken(350, token);
    }
  } finally { copy.remove(); }
}

const detailObserver = new IntersectionObserver(entries => {
  detailVisible = entries[0].isIntersecting;
  if (!detailVisible && detailPlaying) { detailAutomatic = true; stopDetail('Out of view. Playback restarts when you return.'); }
  else if (detailVisible && detailAutomatic && !document.hidden) startDetail();
}, { threshold: 0.15 });
detailObserver.observe(document.querySelector('.detail-explainer'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && detailPlaying) { detailAutomatic = true; stopDetail('Playback stopped while this tab is hidden.'); }
  else if (!document.hidden && detailVisible && detailAutomatic) startDetail();
});
detailReducedMotion.addEventListener('change', () => {
  if (detailReducedMotion.matches) { detailAutomatic = false; stopDetail('Reduced motion enabled. The diagram and notes describe the sequence.'); }
});
selectDetailChapter(Number(document.body.dataset.chapter || 0));
