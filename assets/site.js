
    // ----------------------------------------------------
    // High-Performance SVG Stardust Particle Trail Engine
    // ----------------------------------------------------
    class SvgParticleTrail {
      constructor(containerEl, maxCount = window.innerWidth < 640 ? 12 : 28) {
        this.container = containerEl;
        this.maxCount = maxCount;
        this.particles = [];
        this.elements = [];

        if (!containerEl) return;
        for (let i = 0; i < maxCount; i++) {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('r', '0');
          circle.setAttribute('opacity', '0');
          this.container.appendChild(circle);
          this.elements.push(circle);
          this.particles.push({
            x: 0, y: 0, vx: 0, vy: 0,
            life: 0, decay: 0.04,
            maxRadius: 3,
            color: '#38bdf8',
            alive: false
          });
        }
      }

      emit(x, y, angleDeg, color = '#38bdf8') {
        // Emit 1-2 glowing particles from behind the envelope (angleDeg + 180)
        const rad = (angleDeg + 180) * Math.PI / 180;

        for (let k = 0; k < 2; k++) {
          const p = this.particles.find(item => !item.alive);
          if (!p) break;

          const spread = (Math.random() - 0.5) * 0.9;
          const speed = 0.4 + Math.random() * 1.6;
          const pAngle = rad + spread;

          p.x = x + Math.cos(rad) * 14;
          p.y = y + Math.sin(rad) * 14;
          p.vx = Math.cos(pAngle) * speed;
          p.vy = Math.sin(pAngle) * speed;
          p.life = 1.0;
          p.decay = 0.028 + Math.random() * 0.025;
          p.maxRadius = 2.4 + Math.random() * 2.8;
          p.color = color;
          p.alive = true;
        }
      }

      update() {
        for (let i = 0; i < this.maxCount; i++) {
          const p = this.particles[i];
          const el = this.elements[i];

          if (p.alive) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
              p.alive = false;
              el.setAttribute('opacity', '0');
              el.setAttribute('r', '0');
            } else {
              el.setAttribute('cx', p.x.toFixed(1));
              el.setAttribute('cy', p.y.toFixed(1));
              el.setAttribute('r', (p.maxRadius * p.life).toFixed(1));
              el.setAttribute('fill', p.color);
              el.setAttribute('opacity', (p.life * 0.95).toFixed(2));
            }
          }
        }
      }

      clear() {
        for (let i = 0; i < this.particles.length; i++) {
          this.particles[i].alive = false;
          this.elements[i].setAttribute('opacity', '0');
          this.elements[i].setAttribute('r', '0');
        }
      }
    }

    // ----------------------------------------------------
    // Slide Navigation & Lifecycle Controller
    // ----------------------------------------------------
    let currentSlide = 0;
    const totalSlides = document.body.dataset.page === 'home' ? 1 : 3;
    const slidesWrapper = document.getElementById('slidesWrapper');
    const tabAct1 = document.getElementById('tabAct1');
    const tabAct2 = document.getElementById('tabAct2');

    // DOM Elements for Slide 1
    const comet1 = document.getElementById('flyingComet1');
    const svgToast1 = document.getElementById('svgToast1');
    const toast1Bg = document.getElementById('toast1Bg');
    const toast1Text = document.getElementById('toast1Text');
    const pathAliceToHub1 = document.getElementById('pathAliceToHub1');
    const pathBobToHub1 = document.getElementById('pathBobToHub1');
    const pathS2SBridge1 = document.getElementById('pathS2SBridge1');
    const pathHubToCharlie1 = document.getElementById('pathHubToCharlie1');
    const trail1 = new SvgParticleTrail(document.getElementById('particleContainer1'));

    // DOM Elements for Slide 2
    const comet2 = document.getElementById('flyingComet2');
    const svgToast2 = document.getElementById('svgToast2');
    const toast2Bg = document.getElementById('toast2Bg');
    const toast2Text = document.getElementById('toast2Text');
    const pathAliceToAuth = document.getElementById('pathAliceToAuth');
    const pathBobToAuth = document.getElementById('pathBobToAuth');
    const pathAuthToHub = document.getElementById('pathAuthToHub');
    const pathS2SBridge2 = document.getElementById('pathS2SBridge2');
    const pathHubToReplica = document.getElementById('pathHubToReplica');
    const pathReplicaToCharlie = document.getElementById('pathReplicaToCharlie');
    const pathReplicaToDaisy = document.getElementById('pathReplicaToDaisy');
    const trail2 = new SvgParticleTrail(document.getElementById('particleContainer2'));

    // Execution Context Controller for zero overhead on switch
    let activeToken = { aborted: true };

    function resetReceiveEffects() {
      document.querySelectorAll('.pinging-1, .pinging-2, .received-pop').forEach(el => {
        el.classList.remove('pinging-1', 'pinging-2', 'received-pop');
      });
    }

    function resetSlide1Visuals() {
      if (comet1) comet1.setAttribute('opacity', '0');
      if (svgToast1) svgToast1.setAttribute('opacity', '0');
      if (trail1) trail1.clear();
    }

    function resetSlide2Visuals() {
      document.querySelectorAll('.group-message-copy').forEach(el => el.remove());
      if (comet2) comet2.setAttribute('opacity', '0');
      if (svgToast2) svgToast2.setAttribute('opacity', '0');
      if (trail2.container) trail2.clear();
    }

    function switchSlide(index) {
      if (document.body.dataset.page === 'protocol') return;
      if (index === currentSlide && !activeToken.aborted) return;

      // 1. Immediately abort running tasks of previous slide
      abortAnimation(activeToken);

      // 2. Clear visuals immediately (zero lag, zero residual particles)
      resetSlide1Visuals();
      resetSlide2Visuals();
      resetReceiveEffects();

      // 3. Update slider position & tabs
      currentSlide = index;
      slidesWrapper.style.transform = `translateX(-${currentSlide * 50}%)`;

      if (currentSlide === 0) {
        tabAct1?.classList.add('active');
        tabAct2?.classList.remove('active');
      } else {
        tabAct2?.classList.add('active');
        tabAct1?.classList.remove('active');
      }

      // 4. Create new fresh execution token and start ONLY active slide
      const newToken = { aborted: false };
      activeToken = newToken;

      if (currentSlide === 0) {
        runAct1Loop(newToken);
      } else {
        runAct2Loop(newToken);
      }
    }

    function prevSlide() {
      const nextIndex = (currentSlide - 1 + totalSlides) % totalSlides;
      switchSlide(nextIndex);
    }

    function nextSlide() {
      const nextIndex = (currentSlide + 1) % totalSlides;
      switchSlide(nextIndex);
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (document.body.dataset.page === 'protocol' || totalSlides < 2 || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    // Touch & Swipe gesture support
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselContainer = document.getElementById('carouselContainer');

    carouselContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const delta = touchEndX - touchStartX;
      if (Math.abs(delta) > 50) {
        if (delta > 0) prevSlide();
        else nextSlide();
      }
    }

    // Comprehensive Receive Message Feedback (Dual Waves + Pop Bounce)
    function triggerReceiveEffect(nodeId, pingPrefix) {
      const nodeEl = document.getElementById(nodeId);
      const ring1 = document.getElementById(pingPrefix + '_1');
      const ring2 = document.getElementById(pingPrefix + '_2');

      // 1. Dual wave pulse
      if (ring1) {
        ring1.classList.remove('pinging-1');
        void ring1.getBoundingClientRect();
        ring1.classList.add('pinging-1');
      }
      if (ring2) {
        ring2.classList.remove('pinging-2');
        void ring2.getBoundingClientRect();
        ring2.classList.add('pinging-2');
      }

      // 2. Avatar pop bounce
      if (nodeEl) {
        nodeEl.classList.remove('received-pop');
        void nodeEl.getBoundingClientRect();
        nodeEl.classList.add('received-pop');
      }
    }

    // Helper: Interpolate point along SVG Path
    function getPathPoint(pathElement, progress) {
      const len = pathElement.getTotalLength();
      const p = pathElement.getPointAtLength(progress * len);
      return { x: p.x, y: p.y };
    }

    // Sample the local tangent in travel order, including at either endpoint.
    // Particle direction is independent of the upright envelope artwork.
    function getTravelAngle(pathElement, progress, forward) {
      const len = pathElement.getTotalLength();
      const distance = progress * len;
      const before = pathElement.getPointAtLength(Math.max(0, distance - 1));
      const after = pathElement.getPointAtLength(Math.min(len, distance + 1));
      const direction = forward ? 1 : -1;
      return Math.atan2((after.y - before.y) * direction,
        (after.x - before.x) * direction) * 180 / Math.PI;
    }

    // Keep the pacing consistent across direct and group message routes.
    const MESSAGE_TRAVEL_SCALE = 0.8;
    const MESSAGE_PAUSE_SCALE = 0.65;

    function abortAnimation(token) {
      token.aborted = true;
      token.cancel?.forEach(cancel => cancel());
      token.cancel?.clear();
    }

    function scheduleFrame(frame, token, resolve) {
      if (token.aborted) { resolve(); return; }
      token.cancel ||= new Set();
      const cancel = () => { cancelAnimationFrame(id); resolve(); };
      const id = requestAnimationFrame(now => {
        token.cancel.delete(cancel);
        if (token.aborted) resolve(); else frame(now);
      });
      token.cancel.add(cancel);
    }

    function sleepWithToken(ms, token) {
      return new Promise(resolve => {
        if (token.aborted) { resolve(); return; }
        token.cancel ||= new Set();
        const cancel = () => { clearTimeout(timer); resolve(); };
        const timer = setTimeout(() => {
          token.cancel.delete(cancel);
          resolve();
        }, ms * MESSAGE_PAUSE_SCALE);
        token.cancel.add(cancel);
      });
    }

    // Vector-Accurate Cancellable Path Animation with Real Particle Trail
    function animateAlongPathWithParticles(element, pathElement, durationMs, forward, trailEngine, particleColor, token) {
      return new Promise((resolve) => {
        if (token.aborted) {
          resolve();
          return;
        }

        const startTime = performance.now();
        const start = getPathPoint(pathElement, forward ? 0 : 1);
        element.setAttribute('transform', `translate(${start.x}, ${start.y})`);
        element.setAttribute('opacity', '1');

        function frame(currentTime) {
          if (token.aborted) {
            // Switching already reset visuals; stale frames must not touch a new run.
            resolve();
            return;
          }

          const elapsed = currentTime - startTime;
          let progress = Math.min(elapsed / (durationMs * MESSAGE_TRAVEL_SCALE), 1);

          // Smooth cubic bezier easing
          const eased = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const pProg = forward ? eased : (1 - eased);
          const pt = getPathPoint(pathElement, pProg);

          const angle = getTravelAngle(pathElement, pProg, forward);

          // An envelope is not an arrow: keep it readable in both directions.
          element.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

          // Emit genuine stardust particles behind the envelope
          trailEngine.emit(pt.x, pt.y, angle, particleColor);
          trailEngine.update();

          if (progress < 1) {
            scheduleFrame(frame, token, resolve);
          } else {
            // Envelope arrived at destination
            element.setAttribute('opacity', '0');
            trailEngine.clear();
            resolve();
          }
        }

        scheduleFrame(frame, token, resolve);
      });
    }

    // Native SVG Toast Helper (100% Vector Responsive)
    async function playSenderBadge(svgToastEl, bgEl, textEl, x, y, textStr, token) {
      if (token.aborted) return;

      // Position badge right above sender avatar
      svgToastEl.setAttribute('transform', `translate(${x}, ${y - 52})`);
      textEl.textContent = textStr;

      // Adjust pill width according to text length
      const iconEl = svgToastEl.querySelector('g');
      const textLen = textEl.getComputedTextLength() || textStr.length * 7.5;
      const pillWidth = Math.max(86, textLen + 46);
      bgEl.setAttribute('opacity', '1');
      bgEl.setAttribute('x', (-pillWidth / 2).toFixed(1));
      bgEl.setAttribute('width', pillWidth.toFixed(1));
      iconEl.setAttribute('transform', `translate(${-pillWidth / 2 + 12}, -7)`);
      textEl.setAttribute('x', (-pillWidth / 2 + 34).toFixed(1));
      textEl.setAttribute('opacity', '1');

      // Pop in
      svgToastEl.setAttribute('opacity', '1');
      await sleepWithToken(850, token);
      if (token.aborted) return;

      // Morph the label into its envelope, then bring it to the flight origin.
      // Explicit SVG attribute interpolation avoids browser-dependent CSS geometry.
      await new Promise(resolve => {
        const startedAt = performance.now();
        const duration = 360;
        function frame(now) {
          if (token.aborted) {
            resolve();
            return;
          }
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = progress * progress * (3 - 2 * progress);
          const width = pillWidth + (32 - pillWidth) * eased;
          bgEl.setAttribute('x', -width / 2);
          bgEl.setAttribute('width', width);
          bgEl.setAttribute('opacity', 1 - eased);
          const iconX = (-pillWidth / 2 + 12) * (1 - eased) - 8 * eased;
          iconEl.setAttribute('transform', `translate(${iconX}, -7)`);
          textEl.setAttribute('opacity', Math.max(0, 1 - progress * 2));
          svgToastEl.setAttribute('transform', `translate(${x}, ${y - 52 + 52 * eased})`);
          if (progress < 1) scheduleFrame(frame, token, resolve);
          else resolve();
        }
        scheduleFrame(frame, token, resolve);
      });
      if (token.aborted) return;

      // Hand off identical artwork without briefly drawing two overlapping icons.
      svgToastEl.style.transition = 'none';
      svgToastEl.setAttribute('opacity', '0');
      void svgToastEl.getBoundingClientRect();
      svgToastEl.style.transition = '';
    }

    // ----------------------------------------------------
    // ACT 1 ANIMATION LOOP (Alice -> Bob, Alice -> Charlie, Charlie -> Alice)
    // ----------------------------------------------------
    function explainStep(token, number, title, description) {
      if (!token.aborted && typeof setDetailStep === 'function') setDetailStep(number, title, description);
    }

    async function runAct1Loop(token) {
      while (!token.aborted) {
        explainStep(token, 1, 'Send locally', 'Alice sends to Bob through their own server.');
        // STREAM 1: Alice -> Bob (Internal Domain Stream)
        await playSenderBadge(svgToast1, toast1Bg, toast1Text, 120, 135, 'to bob', token);
        if (token.aborted) break;

        // Envelope takes flight Alice -> Hub
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathAliceToHub1, 750, true, trail1, '#818cf8', token);
        if (token.aborted) break;

        // Hub -> Bob (Traversing pathBobToHub1 backward: Tail is strictly opposite to velocity!)
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathBobToHub1, 750, false, trail1, '#818cf8', token);
        if (token.aborted) break;

        // Bob receives: Dual Waves + Pop Bounce
        triggerReceiveEffect('nodeBob1', 'pingBob1');
        await sleepWithToken(1200, token);
        if (token.aborted) break;

        explainStep(token, 2, 'Cross domains', 'The servers deliver Alice’s message to Charlie across domains.');
        // STREAM 2: Alice -> Charlie (Cross-Domain Forward Stream)
        await playSenderBadge(svgToast1, toast1Bg, toast1Text, 120, 135, 'to charlie', token);
        if (token.aborted) break;

        // Alice -> Hub
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathAliceToHub1, 700, true, trail1, '#38bdf8', token);
        if (token.aborted) break;

        // S2S Bridge: soms.im -> soms.chat
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathS2SBridge1, 950, true, trail1, '#38bdf8', token);
        if (token.aborted) break;

        // Hub -> Charlie
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathHubToCharlie1, 700, true, trail1, '#34d399', token);
        if (token.aborted) break;

        // Charlie receives
        triggerReceiveEffect('nodeCharlie1', 'pingCharlie1');
        await sleepWithToken(1300, token);
        if (token.aborted) break;

        explainStep(token, 3, 'Receive a reply', 'Charlie’s reply travels back to Alice through the two servers.');
        // STREAM 3: Charlie -> Alice (Cross-Domain Return Reply Stream!)
        await playSenderBadge(svgToast1, toast1Bg, toast1Text, 880, 235, 'to alice', token);
        if (token.aborted) break;

        // Charlie -> soms.chat Hub (Backward on pathHubToCharlie1)
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathHubToCharlie1, 700, false, trail1, '#34d399', token);
        if (token.aborted) break;

        // SOMFP S2S Return: soms.chat -> soms.im (Backward on pathS2SBridge1)
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathS2SBridge1, 950, false, trail1, '#38bdf8', token);
        if (token.aborted) break;

        // Hub -> Alice (Backward on pathAliceToHub1)
        comet1.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet1, pathAliceToHub1, 700, false, trail1, '#818cf8', token);
        if (token.aborted) break;

        // Alice receives Charlie's reply!
        triggerReceiveEffect('nodeAlice1', 'pingAlice1');
        await sleepWithToken(1500, token);
        if (token.once) break;
      }
      if (activeToken === token) resetSlide1Visuals();
    }

    // ----------------------------------------------------
    // ACT 2 ANIMATION LOOP (Authoritative & Replica Group Stream)
    // ----------------------------------------------------
    // Each fan-out branch owns its envelope and particles, including nested copies.
    async function fanOutGroup(x, y, branches, token) {
      if (token.aborted) return;
      const copies = branches.map(() => {
        const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.classList.add('group-message-copy');
        const particles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const envelope = comet2.cloneNode(true);
        envelope.removeAttribute('id');
        envelope.setAttribute('opacity', '0');
        layer.appendChild(particles);
        layer.appendChild(envelope);
        comet2.parentNode.appendChild(layer);
        return { layer, envelope, trail: new SvgParticleTrail(particles) };
      });
      try {
        // Ghost copies spread briefly, then converge onto their route origins.
        await new Promise(resolve => {
          const start = performance.now();
          function frame(now) {
            if (token.aborted) { resolve(); return; }
            const p = Math.min((now - start) / 260, 1);
            copies.forEach((copy, i) => {
              const spread = Math.sin(p * Math.PI);
              const offset = (i - (copies.length - 1) / 2) * 24 * spread;
              copy.envelope.setAttribute('transform', `translate(${x + offset}, ${y - 10 * spread})`);
              copy.envelope.setAttribute('opacity', 0.45 + 0.55 * p);
            });
            if (p < 1) scheduleFrame(frame, token, resolve);
            else resolve();
          }
          scheduleFrame(frame, token, resolve);
        });
        if (token.aborted) return;
        await Promise.all(branches.map(async (branch, i) => {
          const copy = copies[i];
          for (const [path, duration, forward, color] of branch.route) {
            await animateAlongPathWithParticles(copy.envelope, path, duration, forward, copy.trail, color, token);
            if (token.aborted) return;
          }
          if (branch.node) triggerReceiveEffect(branch.node, branch.ping);
          if (branch.step) explainStep(token, ...branch.step);
          if (branch.next) await branch.next();
        }));
      } finally {
        copies.forEach(copy => copy.layer.remove());
      }
    }

    function localGroupBranch(path, forward, node, ping, color) {
      return { route: [[path, 650, forward, color]], node, ping };
    }

    function replicaSyncBranch(token, includeCharlie) {
      return {
        route: [
          [pathAuthToHub, 500, true, '#818cf8'],
          [pathS2SBridge2, 950, true, '#38bdf8'],
          [pathHubToReplica, 500, true, '#34d399']
        ],
        node: 'nodeReplicaGroup', ping: 'pingReplicaGroup',
        step: [3, 'Deliver to members', 'The mirror copies the message to Charlie and Daisy.'],
        next: () => fanOutGroup(770, 235, [
          // Do not show a duplicate incoming notification on the original sender.
          ...(includeCharlie ? [localGroupBranch(pathReplicaToCharlie, true, 'nodeCharlie2', 'pingCharlie2', '#34d399')] : []),
          localGroupBranch(pathReplicaToDaisy, true, 'nodeDaisy2', 'pingDaisy2', '#34d399')
        ], token)
      };
    }

    async function runAct2Loop(token) {
      while (!token.aborted) {
        explainStep(token, 1, 'Send to the group', 'Charlie sends to the mirror group on his server.');
        // SCENARIO 1: Charlie sends group message from Replica Realm
        await playSenderBadge(svgToast2, toast2Bg, toast2Text, 900, 135, 'to #core-dev', token);
        if (token.aborted) break;

        // Charlie -> Replica Group
        comet2.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet2, pathReplicaToCharlie, 750, false, trail2, '#34d399', token);
        if (token.aborted) break;
        triggerReceiveEffect('nodeReplicaGroup', 'pingReplicaGroup');

        explainStep(token, 2, 'Copy & forward', 'Deliver to Daisy locally while forwarding to the authoritative group.');
        // Deliver locally immediately, in parallel with the authoritative branch.
        await fanOutGroup(770, 235, [
          localGroupBranch(pathReplicaToDaisy, true, 'nodeDaisy2', 'pingDaisy2', '#34d399'),
          {
            route: [
              [pathHubToReplica, 500, false, '#34d399'],
              [pathS2SBridge2, 950, false, '#38bdf8'],
              [pathAuthToHub, 500, false, '#818cf8']
            ],
            node: 'nodeAuthGroup', ping: 'pingAuthGroup',
            step: [3, 'Deliver to members', 'The authoritative group splits the message for Alice and Bob.'],
            next: () => fanOutGroup(230, 235, [
              localGroupBranch(pathAliceToAuth, false, 'nodeAlice2', 'pingAlice2', '#818cf8'),
              localGroupBranch(pathBobToAuth, false, 'nodeBob2', 'pingBob2', '#818cf8')
            ], token)
          }
        ], token);
        if (token.aborted) break;
        await sleepWithToken(1400, token);
        if (token.aborted) break;

        explainStep(token, 1, 'Send to the group', 'Alice sends to the authoritative group on her server.');
        // SCENARIO 2: Alice sends group message from Authoritative Realm
        await playSenderBadge(svgToast2, toast2Bg, toast2Text, 100, 135, 'to #core-dev', token);
        if (token.aborted) break;

        // Alice -> Authoritative Group
        comet2.setAttribute('opacity', '1');
        await animateAlongPathWithParticles(comet2, pathAliceToAuth, 700, true, trail2, '#818cf8', token);
        if (token.aborted) break;
        triggerReceiveEffect('nodeAuthGroup', 'pingAuthGroup');

        explainStep(token, 2, 'Copy & forward', 'Deliver to Bob while synchronizing the remote mirror in parallel.');
        // Split into Bob's local copy and the remote realm's copy simultaneously.
        await fanOutGroup(230, 235, [
          localGroupBranch(pathBobToAuth, false, 'nodeBob2', 'pingBob2', '#818cf8'),
          replicaSyncBranch(token, true)
        ], token);
        if (token.aborted) break;

        await sleepWithToken(1600, token);
        if (token.once) break;
      }
      if (activeToken === token) resetSlide2Visuals();
    }

    // Initialize: Start ONLY Slide 0
    window.addEventListener('DOMContentLoaded', () => {
      if (document.body.dataset.page !== 'protocol') switchSlide(0);

      // Mobile / Touch navigation dropdown toggle
      document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.nav-dropdown-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', (e) => {
          if (window.matchMedia('(max-width: 640px)').matches || ('ontouchstart' in window)) {
            if (!dropdown.classList.contains('is-open')) {
              e.preventDefault();
              dropdown.classList.add('is-open');
              trigger.setAttribute('aria-expanded', 'true');
            }
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
          document.querySelectorAll('.nav-dropdown.is-open').forEach(dropdown => {
            dropdown.classList.remove('is-open');
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
          });
        }
      });
    });
  