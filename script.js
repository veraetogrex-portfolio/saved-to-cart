// Saved to Cart — github.com/veraetogrex-portfolio · zero dependencies
// Saved items on the left, the cart is a kraft paper bag with a window and a dashed free-delivery line across it.
// "Move to cart" lifts the thing out of its photo and drops it into the bag: it settles on the pile, the pile
// rises past the line ("$12 to go" becomes "+$12"), the line turns solid, then the bag gets its sticker.
// Undo or the thing's price tag takes it back out.

const ITEMS = {                      // name, price in dollars
  throw:  ['Linen throw', 58],
  pour:   ['Pour-over set', 24],
  board:  ['Oak board', 34],
  mugs:   ['Stoneware mugs', 32],
  towels: ['Bath towels', 36],
};
const ORDER = Object.keys(ITEMS);    // saved items keep this order when they come back
const START = { saved: ['throw', 'pour', 'board'], cart: ['mugs', 'towels'] };   // in the bag, bottom up: $32 + $36 = $68
const FREE_FROM = 80;                // free delivery from this total: $68 is $12 short, $92 is $12 over

// product shots, drawn on a 128×128 studio backdrop
const FLOOR = '<rect y="86" width="128" height="42" fill="#dcd1c2"/>';
const SHADOW = (cx, rx) => `<ellipse cx="${cx}" cy="101" rx="${rx}" ry="5" fill="#5a4632" opacity=".22"/>`;
const ART = {
  throw: FLOOR + SHADOW(64, 48) +
    '<rect x="18" y="70" width="92" height="28" rx="8" fill="#7d987a"/><rect x="23" y="47" width="82" height="26" rx="8" fill="#91ab8d"/>' +
    '<rect x="28" y="26" width="72" height="24" rx="8" fill="#a6bea2"/>' +
    '<path d="M18 84h92M23 60h82M28 38h72" stroke="#efe9de" stroke-width="2.5" opacity=".75"/>',
  pour: FLOOR + SHADOW(64, 30) +
    '<path d="M45 72h38l7 25a8 8 0 0 1-8 9H46a8 8 0 0 1-8-9z" fill="#d6e2e5" stroke="#9fb3b9" stroke-width="2"/>' +
    '<path d="M41.6 88h44.8l2.6 9.4a6 6 0 0 1-5.8 7.6H45a6 6 0 0 1-5.8-7.6z" fill="#6e4129"/>' +
    '<rect x="46" y="64" width="36" height="10" rx="3" fill="#8a5a3a"/>' +
    '<path d="M95 35c11 0 11 17 0 17" stroke="#c8643c" stroke-width="5" fill="none"/>' +
    '<path d="M32 30h64l-14 34H46z" fill="#c8643c"/><rect x="28" y="24" width="72" height="9" rx="4" fill="#da794f"/>' +
    '<path d="M49 37l5 22M64 37v22M79 37l-5 22" stroke="#a9502e" stroke-width="2.5" stroke-linecap="round"/>',
  board: FLOOR + SHADOW(62, 34) +
    '<g transform="rotate(-9 62 68)"><rect x="32" y="40" width="60" height="62" rx="12" fill="#c99a63"/>' +
    '<rect x="52" y="20" width="20" height="26" rx="9" fill="#c99a63"/><circle cx="62" cy="30" r="4.5" fill="#e8dfd3"/>' +
    '<path d="M40 58c8 4 16 4 24 0s16-4 20 0M40 74c9 4 18 4 26 0s12-3 18 0M40 90c10 3 20 3 30 0" stroke="#ad7e4b" stroke-width="2" fill="none"/></g>',
  mugs: FLOOR + SHADOW(64, 46) +
    '<path d="M57 62c11 0 11 22 0 22" stroke="#3e3b39" stroke-width="6" fill="none"/>' +
    '<rect x="20" y="54" width="40" height="46" rx="9" fill="#3e3b39"/><rect x="20" y="54" width="40" height="7" rx="3.5" fill="#2c2a28"/>' +
    '<path d="M101 58c12 0 12 24 0 24" stroke="#e2d8c9" stroke-width="6" fill="none"/>' +
    '<rect x="62" y="46" width="42" height="54" rx="9" fill="#f1eadf" stroke="#cdbfae" stroke-width="1.5"/>' +
    '<g fill="#b9a994"><circle cx="72" cy="64" r="1.3"/><circle cx="88" cy="58" r="1.1"/><circle cx="95" cy="76" r="1.3"/><circle cx="78" cy="86" r="1.1"/><circle cx="70" cy="80" r="1"/></g>',
  towels: FLOOR + SHADOW(64, 46) +
    '<rect x="16" y="70" width="84" height="32" rx="16" fill="#f2ece2"/><circle cx="96" cy="86" r="16" fill="#e7dfd2"/>' +
    '<path d="M96 86m-8 0a8 8 0 1 0 8-8" stroke="#cbbfae" stroke-width="2.5" fill="none"/><path d="M30 70v32" stroke="#d27a45" stroke-width="5"/>' +
    '<rect x="26" y="40" width="80" height="32" rx="16" fill="#d27a45"/><circle cx="102" cy="56" r="16" fill="#df8c58"/>' +
    '<path d="M102 56m-8 0a8 8 0 1 0 8-8" stroke="#b5622f" stroke-width="2.5" fill="none"/><path d="M40 40v32" stroke="#f2ece2" stroke-width="5"/>',
};
const ICON = {
  move: '<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 10V7a3 3 0 0 1 6 0v3M12 12v6M9 15h6"/>',
  later: '<path d="M7 3.5h10v17l-5-3.6-5 3.6z"/>',
};

// geometry, in component pixels (1360×800); the bag's own layers use bag pixels (580×528, top-left at 640,176)
const CARD = { y: 188, step: 184, shown: 3, peek: 10 };   // three slots on the shelf; more cards pile up under the third, 10 px edge each
const WIN = { top: 96, h: 374 };                        // the window: bag x 40…500, y 96…470; the bottom of it is $0
const BAG = { mouth: [910, 222], px: 4, fall: 60 };   // where things go in (over the pile, behind the handles); px per dollar at most
const scaleFor = total => Math.min(BAG.px, WIN.h / Math.max(total + 3 + Math.max(0, total - 100) * .15, 94));   // the whole pile always fits, with room for the top tag
const PILE_X = { mugs: 220, towels: 222, pour: 230, throw: 212, board: 226 };   // the centre of each thing across the window: one neat stack
const LEFT = { throw: 18, pour: 28, board: 30, mugs: 20, towels: 16 };              // where each drawing starts, of 128: its tag hangs just left of it
const SPAN = { throw: [26, 98], pour: [24, 106], board: [18, 104], mugs: [46, 100], towels: [40, 102] };   // top and bottom of each drawing, of 128
const OBJ = Object.fromEntries(ORDER.map(id => [id, ART[id].replace(FLOOR, '').replace(/<ellipse[^>]*\/>/, '')]));   // the thing without its studio backdrop

const root = document.querySelector('#shop');
const savedEl = root.querySelector('.sc-saved'), thingsEl = root.querySelector('.sc-bag-items');
const undo = root.querySelector('.sc-undo'), undoWhat = root.querySelector('.sc-undo-what'), undoArt = root.querySelector('.sc-undo-art'), undoBtn = root.querySelector('.sc-undo-btn');
const front = root.querySelector('.sc-bag-front'), lineEl = root.querySelector('.sc-line'), lineSolid = lineEl.querySelector('i');
const gap = root.querySelector('.sc-gap'), mark = root.querySelector('.sc-mark');
gap.innerHTML = '<b class="sc-gap-v"></b><b class="sc-gap-a"></b><b class="sc-gap-b"></b>';
const [gapV, , gapB] = gap.children;
const togo = root.querySelector('.sc-togo'), over = root.querySelector('.sc-over');
const rim = root.querySelector('.sc-rim'), sticker = root.querySelector('.sc-sticker'), totalEl = root.querySelector('.sc-total');
const flyer = root.querySelector('.sc-flyer');
const counts = { saved: root.querySelector('[data-list="saved"]'), cart: root.querySelector('[data-list="cart"]') };
const live = root.querySelector('.sc-live');

const money = v => '$' + Math.round(v).toLocaleString('en-US');
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const span = (p, a, b) => clamp((p - a) / (b - a));
const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const out = t => 1 - Math.pow(1 - t, 4);
const fall = t => t * t;                                                       // dropped: it speeds up until it lands
const linear = t => t;
const svg = (p, box = 24) => `<svg viewBox="0 0 ${box} ${box}" aria-hidden="true">${p}</svg>`;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// the bag, front panel with a window cut out of it, drawn once
front.innerHTML = `
  <path d="M190 62C190 2 390 2 390 62" fill="none" stroke="#8a6440" stroke-width="10" stroke-linecap="round"/>
  <path fill="#c9a271" fill-rule="evenodd" d="M0 60H580V518a10 10 0 0 1-10 10H10a10 10 0 0 1-10-10ZM54 96H486a14 14 0 0 1 14 14V456a14 14 0 0 1-14 14H54a14 14 0 0 1-14-14V110a14 14 0 0 1 14-14Z"/>
  <path fill="#b48b5b" d="M0 60H18V528H10a10 10 0 0 1-10-10ZM562 60H580V518a10 10 0 0 1-10 10H562Z"/>
  <rect y="60" width="580" height="30" fill="#bb9161"/><path d="M0 90H580" stroke="#a07a4c" stroke-width="2"/>
  <rect x="0" y="514" width="580" height="14" rx="6" fill="#b48b5b"/>
  <rect x="40" y="96" width="460" height="374" rx="14" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <path d="M170 68C170 -24 410 -24 410 68" fill="none" stroke="#a97c4c" stroke-width="12" stroke-linecap="round"/>
  <path d="M170 68C170 -24 410 -24 410 68" fill="none" stroke="#8d653d" stroke-width="12" stroke-dasharray="3 7"/>`;

// the free-delivery line goes on over the kraft as a printed dashed mark
front.insertAdjacentHTML('beforeend', '<path class="sc-mark-line" d="M500 0H504" stroke="#2b1d12" stroke-width="3" stroke-dasharray="6 4"/>');
const markLine = front.querySelector('.sc-mark-line');

// one saved card and one thing in the bag per item; which one shows depends on where the item is
savedEl.innerHTML = ORDER.map(id => `<div class="sc-card" data-id="${id}" role="listitem"><span class="sc-art">${svg(ART[id], 128)}</span>
  <p class="sc-name">${ITEMS[id][0]}</p><p class="sc-price">${money(ITEMS[id][1])}</p>
  <button class="sc-move" aria-label="Move ${ITEMS[id][0]} to cart">${svg(ICON.move)}Move to cart</button></div>`).join('');
thingsEl.innerHTML = ORDER.map(id => `<div class="sc-thing" data-id="${id}" role="listitem" aria-label="${ITEMS[id][0]}, ${money(ITEMS[id][1])}">
  <span class="sc-obj">${svg(OBJ[id], 128)}</span>
  <button class="sc-tag" aria-label="Save ${ITEMS[id][0]} for later" title="Save for later">${money(ITEMS[id][1])}${svg(ICON.later)}</button></div>`).join('');
const els = {};
for (const id of ORDER) {
  const card = savedEl.querySelector(`[data-id="${id}"]`), thing = thingsEl.querySelector(`[data-id="${id}"]`);
  els[id] = { card, thing, obj: thing.querySelector('.sc-obj'), tag: thing.querySelector('.sc-tag'), move: card.querySelector('.sc-move'), size: 0 };
  els[id].obj.style.transformOrigin = `50% ${SPAN[id][1] / 1.28}%`;            // it settles on its own bottom
}

let lists, lockUntil = 0, timers = [], undoId = null;
const listOf = id => lists.saved.includes(id) ? 'saved' : 'cart';
const price = id => ITEMS[id][1];
const sumOf = ids => ids.reduce((s, id) => s + price(id), 0);
const cardY = k => CARD.y + CARD.step * Math.min(k, CARD.shown - 1) + CARD.peek * Math.max(0, k - CARD.shown + 1);
const sizeOf = (id, px) => price(id) * px * 128 / (SPAN[id][1] - SPAN[id][0]);   // the drawing is exactly as tall as its price
const thingY = (id, L = lists.cart) => {                                    // its box top, in window px, sitting on what is below it
  const px = scaleFor(sumOf(L)), under = sumOf(L.slice(0, L.indexOf(id)));
  return WIN.h - under * px - SPAN[id][1] / 128 * sizeOf(id, px);
};
const bagY = (v, px) => WIN.top + WIN.h - v * px;                          // a dollar amount as a height on the bag
function insert(name, id) {          // new things go on top of the pile; saved items return to their place
  const L = lists[name];
  if (name === 'cart') L.push(id);
  else L.splice(L.filter(i => ORDER.indexOf(i) < ORDER.indexOf(id)).length, 0, id);
}

// ── tweens: every moving number is a key; one frame loop draws them all ──
const T = new Map();
const get = k => T.has(k) ? T.get(k).v : 0;
const set = (k, v) => T.set(k, { v, from: v, to: v, t0: 0, ms: 0, e: linear });
function to(k, v, ms, e = inOut, delay = 0) {                                // one tween per key: a later call replaces an earlier one
  T.set(k, { v: get(k), from: get(k), to: v, t0: performance.now() + delay, ms: REDUCED ? 0 : ms, e, wait: delay > 0 });
  kick();
}
function step(now) {
  let busy = false;
  for (const a of T.values()) {
    if (a.v === a.to && now >= a.t0 + a.ms) continue;
    if (a.wait && now >= a.t0) { a.wait = false; a.from = a.v; }          // a delayed tween starts from wherever the value is by then
    const p = a.ms ? clamp((now - a.t0) / a.ms) : now >= a.t0 ? 1 : 0;
    a.v = lerp(a.from, a.to, a.e(p)); busy = busy || p < 1;
  }
  return busy;
}
let raf = 0;
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
function tick() { raf = 0; const busy = step(performance.now()); draw(); if (busy) kick(); }

// ── draw one frame ──
let flight = { from: [0, 0], s: 1 };
function draw() {
  const px = get('px'), t = get('total');
  for (const id of ORDER) {
    const e = els[id], co = get(id + ':co'), to_ = get(id + ':to'), S = sizeOf(id, px), sq = get(id + ':sq');
    e.card.style.transform = `translateY(${get(id + ':cy')}px)`;
    e.card.style.opacity = co; e.card.style.visibility = co < .02 ? 'hidden' : '';
    if (Math.abs(e.size - S) > .5) { e.size = S; e.obj.style.width = e.obj.style.height = `${S}px`; }   // only when the scale changes
    e.obj.style.transform = sq ? `scale(${1 + .06 * sq}, ${1 - .09 * sq})` : '';                         // landing: a short squash
    e.thing.style.transform = `translate(${PILE_X[id] - S / 2}px, ${get(id + ':ty')}px)`;
    e.thing.style.opacity = to_; e.thing.style.visibility = to_ < .02 ? 'hidden' : '';
    e.tag.style.transform = `translate(${LEFT[id] / 128 * S - e.tag.offsetWidth + 6}px, ${(SPAN[id][0] + .35 * (SPAN[id][1] - SPAN[id][0])) / 128 * S - 20}px) rotate(6deg)`;   // the tag hangs off its upper left
  }
  // the bag: the line, and the bracket between it and the top of the pile: what is still missing, then what is over
  const lineY = bagY(FREE_FROM, px), level = bagY(t, px), q = get('cross'), d = lineY - level;   // d > 0: over the line
  lineEl.style.transform = `translateY(${lineY - 2}px)`;
  lineSolid.style.opacity = q; lineSolid.style.transform = `scaleY(${1 + 1.4 * Math.sin(Math.PI * q)})`;   // reached: dashed → solid, with one beat
  markLine.setAttribute('d', `M500 ${lineY}H508`); mark.style.transform = `translateY(${lineY - 15}px)`;
  gap.style.transform = `translateY(${Math.min(lineY, level)}px)`; gap.style.opacity = span(Math.abs(d), 8, 20);   // the bracket and its figure come and go together
  gapV.style.transform = `scaleY(${Math.abs(d) / 100})`; gapB.style.transform = `translateY(${Math.abs(d)}px)`;
  gap.style.color = d > 0 ? 'var(--ember-lit)' : '';                               // short of the line: pale; over it: orange
  togo.textContent = `${money(Math.max(0, FREE_FROM - Math.round(t)))} to go`;
  togo.style.transform = `translateY(${(lineY + level) / 2 - 20}px)`; togo.style.opacity = d < 0 ? span(-d, 30, 40) : 0;
  over.textContent = `+${money(Math.max(1, t - FREE_FROM))}`;                  // counts with the total
  over.style.transform = `translateY(${Math.min(lineY, (lineY + level) / 2) - 20}px)`; over.style.opacity = d > 0 ? span(d, 8, 20) : 0;   // the figure lives with the bracket
  const ro = get('rim'), so = get('stk');                                       // the printed promise goes, then the sticker lands: never both
  rim.style.opacity = ro;
  sticker.style.opacity = so; sticker.style.visibility = so < .02 ? 'hidden' : 'visible';
  sticker.style.transform = `rotate(-2deg) scale(${lerp(1.25, 1, out(so))})`;
  totalEl.textContent = money(t);
  const uo = get('uo');                                                         // the undo bar in the space the card left
  undo.style.opacity = uo; undo.style.visibility = uo < .02 ? 'hidden' : 'visible';
  undo.style.transform = `translateY(${get('uy') + 12 * (1 - uo)}px)`;
  // the thing on its way into the bag (or out of it): low across the saved list, up in the gap between the panels,
  // then behind the handles and down into the bag; it never passes in front of the bag
  const fo = get('fo'), fd = get('fd'), p = get('fp');
  flyer.style.opacity = fo; flyer.style.visibility = fo < .02 ? 'hidden' : '';
  if (fo > .02) {
    const [x0, y0] = flight.from, [mx, my] = BAG.mouth, s = flight.s;
    const x = lerp(x0, mx - 74 * s, inOut(p)), y = lerp(y0, my - 74 * s, inOut(span(x, 430, 560))) + BAG.fall * fd;
    flyer.style.transform = `translate(${x}px, ${y}px) scale(${lerp(1, s, p)})`;
  }
}
// ── state → targets ──
function relayout(ms = 450, delay = 0, skip) {
  lists.saved.forEach((id, k) => id !== skip && to(id + ':cy', cardY(k), ms, inOut, delay));
  lists.cart.forEach(id => id !== skip && to(id + ':ty', thingY(id), ms, inOut, delay));
  to('px', scaleFor(sumOf(lists.cart)), ms, inOut, delay);
}
function paintCounts(only) {
  for (const name of only ? [only] : ['saved', 'cart']) { const n = lists[name].length; counts[name].textContent = `${n} item${n === 1 ? '' : 's'}`; }
}
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const queue = fn => { const w = lockUntil - performance.now(); if (w > 0) later(() => queue(fn), w + 20); else fn(); };   // a press during a move waits its turn
const free = () => sumOf(lists.cart) >= FREE_FROM;
function crossTo(delay) {                    // one thing at a time: the line turns solid, then the printed promise gives way to the sticker
  if (free() && get('cross') < 1) {
    to('cross', 1, 300, out, delay); to('rim', 0, 120, linear, delay + 300); to('stk', 1, 240, out, delay + 420);
  } else if (!free() && get('cross') > 0) {
    to('stk', 0, 120, linear, delay); to('rim', 1, 160, linear, delay + 120); to('cross', 0, 220, out, delay + 60);
  }
}
const say = id => { live.textContent = `${ITEMS[id][0]} ${listOf(id) === 'cart' ? 'moved to cart' : 'saved for later'}. Total ${money(sumOf(lists.cart))}.`; };

// ── "Move to cart": the thing lifts out of its photo, drops into the bag and settles on the pile ──
function toCart(id, ms = 1500) {
  if (performance.now() < lockUntil || listOf(id) === 'cart') return false;
  lockUntil = performance.now() + ms;
  const k = lists.saved.indexOf(id); lists.saved.splice(k, 1); insert('cart', id);
  const px = scaleFor(sumOf(lists.cart)), S = sizeOf(id, px), land = 860;
  flight = { from: [68, get(id + ':cy') + 12], s: S / 148 }; flyer.innerHTML = svg(OBJ[id], 128);
  set('fp', 0); set('fd', 0); set('fo', 1);
  to(id + ':co', 0, 200, linear, 40);                                         // 1: the card gives up its thing and goes
  to('fp', 1, 460, linear, 60);                                               // 2: it travels low over the list, rises to the bag's mouth
  to('fd', 1, 160, linear, 520); to('fo', 0, 120, linear, 560);              //    and drops in behind the front panel
  relayout(450, 200, id);                                                     // 3: the saved list closes up
  set(id + ':ty', -SPAN[id][1] / 128 * S); set(id + ':to', 1); set(id + ':sq', 0);   //    just above the window, where the flyer goes out of sight
  to(id + ':ty', thingY(id), land - 600, fall, 600);                          // 4: it falls in and lands on the pile
  later(() => { to(id + ':sq', 1, 70, out); later(() => to(id + ':sq', 0, 170, out), 70); paintCounts(); }, land);   // a short settle
  to('total', sumOf(lists.cart), 260, out, land - 30);                        // 5: as it touches down the level passes the line: "$12 to go" closes, "+$12" opens
  crossTo(land);                                                              // 6: the line turns solid; 7: the sticker
  if ((undoId = lists.saved.length < CARD.shown ? id : null)) { undoWhat.textContent = ITEMS[id][0]; undoArt.innerHTML = svg(ART[id], 128); set('uy', cardY(lists.saved.length)); } to('uo', undoId ? 1 : 0, 260, out, 520);   // the way back sits in the slot the card left, if the shelf has one free
  paintCounts('saved');
  say(id); return true;
}
// ── Undo or the price tag: the thing rises out of the bag and flies back into its card ──
function toSaved(id, ms = 1100) {
  if (performance.now() < lockUntil || listOf(id) === 'saved') return false;
  lockUntil = performance.now() + ms;
  lists.cart.splice(lists.cart.indexOf(id), 1); insert('saved', id);
  const k = lists.saved.indexOf(id), S = sizeOf(id, get('px'));
  crossTo(470);                                                               // 1: when the total drops past the line, the sticker comes off, the line goes back to dashes
  to(id + ':ty', -S - 10, 320, inOut, 80); set(id + ':sq', 0);                // 2: it rises out of the bag, the rest settles
  later(() => set(id + ':to', 0), 400);
  relayout(420, 220, id);
  to('total', sumOf(lists.cart), 700, inOut, 120);                           //    the total goes down while it leaves
  to('uo', 0, 160, linear);
  set(id + ':cy', cardY(k)); set(id + ':co', 0);                            // 3: a slot opens in the saved list
  flight = { from: [68, cardY(k) + 12], s: S / 148 }; flyer.innerHTML = svg(OBJ[id], 128);
  set('fp', 1); set('fd', 1); set('fo', 0);
  to('fo', 1, 80, linear, 300); to('fd', 0, 180, inOut, 300);               //    it comes up out of the bag
  to('fp', 0, 520, linear, 460);                                              //    and travels back into its photo
  to(id + ':co', 1, 140, linear, 900); later(() => to('fo', 0, 100, linear), 960);
  paintCounts('cart'); later(() => paintCounts(), 800);
  if (undoId === id) undoId = null;
  say(id); return true;
}

// presses you can see: the button fills and gives a little
const pressable = (btn, fire) => {
  btn.addEventListener('pointerdown', () => btn.classList.add('is-pressed'));
  const release = () => later(() => btn.classList.remove('is-pressed'), 140);
  btn.addEventListener('pointerup', release); btn.addEventListener('pointerleave', release);
  btn.addEventListener('click', fire);
};
for (const id of ORDER) {
  const { move, tag } = els[id];
  pressable(move, () => queue(() => { if (toCart(id)) later(() => (undoId === id ? undoBtn : tag).focus({ preventScroll: true }), 1510); }));
  tag.addEventListener('click', () => queue(() => { if (toSaved(id)) later(() => move.focus({ preventScroll: true }), 1110); }));
}
pressable(undoBtn, () => queue(() => { const id = undoId; if (id && toSaved(id)) later(() => els[id].move.focus({ preventScroll: true }), 1110); }));

function reset() {
  timers.forEach(clearTimeout); timers = []; lockUntil = 0; undoId = null;
  lists = { saved: [...START.saved], cart: [...START.cart] };
  T.clear();
  const px = scaleFor(sumOf(lists.cart));
  for (const id of ORDER) {
    const inSaved = lists.saved.includes(id);
    set(id + ':cy', inSaved ? cardY(lists.saved.indexOf(id)) : CARD.y); set(id + ':co', inSaved ? 1 : 0);
    set(id + ':ty', inSaved ? -200 : thingY(id)); set(id + ':to', inSaved ? 0 : 1); set(id + ':sq', 0);
    els[id].move.classList.remove('is-pressed');
  }
  undoBtn.classList.remove('is-pressed');
  set('px', px); set('total', sumOf(lists.cart)); set('cross', free() ? 1 : 0); set('rim', free() ? 0 : 1); set('stk', free() ? 1 : 0);
  set('uo', 0); set('uy', 0);
  set('fp', 0); set('fd', 0); set('fo', 0);
  paintCounts(); live.textContent = ''; draw();
}

reset();
root.shop = { reset, moveButton: id => els[id].move, tag: id => els[id].tag, undo: undoBtn, lists: () => lists };   // for scripted demos
root.querySelector('.sc-checkout').addEventListener('click', () => root.dispatchEvent(new CustomEvent('cart:checkout', { bubbles: true,   // hand the order to your checkout
  detail: { items: lists.cart.map(id => ({ id, name: ITEMS[id][0], price: price(id) })), total: sumOf(lists.cart), freeDelivery: free() } })));
