/* Caldas Studio — concept layer.
   Turns every portfolio concept into a working product demo:
   - a real conversion flow per business (reserve / book / order / subscribe / trial) with live totals,
     validation, a booking reference and a remembered last booking;
   - honest handling of links that only go live at launch;
   - a "make it yours" sheet that sells the concept.
   Nothing is sent anywhere: every flow is client-side and says so on the confirmation. */
(function () {
  'use strict';
  if (window.__CONCEPT) return;
  const SCRIPT = document.currentScript && document.currentScript.src;
  const STUDIO = SCRIPT ? new URL('./', SCRIPT).href : '../';
  const seg = location.pathname.split('/').filter(Boolean);
  const SLUG = (seg[seg.length - 1] || '').replace(/\.html$/, '') === 'index' ? seg[seg.length - 2] : seg[seg.length - 1] || '';

  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, cur) => {
    if (n == null || isNaN(n)) return '';
    const s = Math.round(n).toLocaleString('sv-SE').replace(/ /g, ' ');
    return cur === 'kr' ? s + ' kr' : cur + Math.round(n).toLocaleString('en-GB');
  };
  const iso = d => d.toISOString().slice(0, 10);
  const pretty = s => { if (!s) return ''; const d = new Date(s + 'T12:00'); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
  const nights = (a, b) => (a && b) ? Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5)) : 0;

  /* ---------------------------------------------------------------- per-concept flows */
  const SELL_BOOK = ['Online reservations with confirmations & reminders', 'Menu / services editor you update yourself', 'Swedish + English, mobile-first', 'Google Business, SEO & analytics set up'];
  const SELL_SHOP = ['Checkout with Stripe or Shopify', 'Product & stock editor', 'Order emails and delivery slots', 'SEO, analytics and social previews'];
  const C = {
    restaurant: {
      brand: 'Maison Lumen', cur: 'kr', title: 'Reserve a table', sub: 'One seating at 19:00 · Tuesday–Saturday · tables open six weeks ahead',
      cta: /^(reserve|reserve a table|request a table|book)\b/i, ref: 'ML', live: 'your table-booking system (e.g. Bokabord or SevenRooms)',
      fields: [
        { k: 'date', t: 'date', label: 'Date', days: [2, 3, 4, 5, 6], ahead: 42 },
        { k: 'guests', t: 'stepper', label: 'Guests', min: 1, max: 8, def: 2 },
        { k: 'menu', t: 'choice', label: 'Menu', opts: [['Seven courses', 1450], ['With wine pairing', 2350], ['With juice pairing', 1950]] },
        { k: 'notes', t: 'textarea', label: 'Allergies or an occasion we should know about', opt: 1 }
      ],
      total: v => v.menu.price * v.guests,
      done: v => `A table for ${v.guests} on ${pretty(v.date)} at 19:00.`,
      sell: SELL_BOOK
    },
    salon: {
      brand: 'Éden', cur: 'kr', title: 'Book an appointment', sub: 'Tuesday–Saturday · 10:00–19:00', cta: /^(book|book an appointment|book online)\b/i, ref: 'ED', live: 'your salon booking system (e.g. Bokadirekt or Timely)',
      fields: [
        { k: 'service', t: 'choice', label: 'Service', opts: [['Cut & finish', 850, '75 min'], ['Luminous colour', 1900, '150 min'], ['Scalp & repair ritual', 650, '45 min'], ['Bridal trial', 2400, '120 min']] },
        { k: 'stylist', t: 'choice', label: 'Stylist', opts: [['First available', 0], ['Ines · Creative lead', 150], ['Moa · Colour', 0]] },
        { k: 'date', t: 'date', label: 'Day', days: [2, 3, 4, 5, 6], ahead: 35 },
        { k: 'time', t: 'slots', label: 'Time', opts: ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'] }
      ],
      total: v => v.service.price + v.stylist.price,
      done: v => `${v.service.label} with ${v.stylist.label.split(' ·')[0]} — ${pretty(v.date)} at ${v.time}.`,
      sell: SELL_BOOK
    },
    hotel: {
      brand: 'Dunhaven', cur: 'kr', title: 'Check availability', sub: 'Fourteen rooms above the Bohuslän skerries', cta: /^(reserve|reserve a room|check availability)\b/i, ref: 'DH', live: 'your channel manager & payment provider',
      fields: [
        { k: 'in', t: 'date', label: 'Arrive', ahead: 300 },
        { k: 'out', t: 'date', label: 'Depart', ahead: 300, after: 'in' },
        { k: 'guests', t: 'stepper', label: 'Guests', min: 1, max: 4, def: 2 },
        { k: 'room', t: 'choice', label: 'Room', opts: [['Skerry · sea view', 2400], ['Lighthouse corner suite', 3600], ['The Haven · private terrace', 5200]] },
        { k: 'spa', t: 'toggle', label: 'Add the evening sauna & cold plunge', price: 450, per: 'guest' }
      ],
      total: v => { const n = nights(v.in, v.out) || 1; return v.room.price * n + (v.spa ? 450 * v.guests : 0); },
      lines: v => { const n = nights(v.in, v.out) || 1; return [[`${v.room.label} × ${n} night${n > 1 ? 's' : ''}`, v.room.price * n]].concat(v.spa ? [[`Sauna ritual × ${v.guests}`, 450 * v.guests]] : []); },
      done: v => `${v.room.label}, ${pretty(v.in)} → ${pretty(v.out)}, ${v.guests} guest${v.guests > 1 ? 's' : ''}.`,
      sell: ['Live availability & instant booking', 'Deposits and gift cards', 'Swedish, English & German', 'Google Hotel Ads, SEO & analytics']
    },
    cafe: {
      brand: 'Ember & Oak', cur: 'kr', title: 'Start a subscription', sub: 'Fresh beans every month · pause or cancel anytime', cta: /^(subscribe|start a subscription|start subscription|shop)\b/i, ref: 'EO', live: 'Stripe subscriptions + your roasting schedule',
      fields: [
        { k: 'plan', t: 'choice', label: 'Plan', opts: [['Taster · 250 g, one origin', 129], ['Devotee · 500 g, roaster\'s choice', 239], ['Office · 2 kg', 690]] },
        { k: 'grind', t: 'choice', label: 'Grind', opts: [['Whole bean', 0], ['Filter', 0], ['Espresso', 0], ['Moka / Aeropress', 0]] },
        { k: 'freq', t: 'choice', label: 'Every', opts: [['Month', 0], ['Two weeks', 0]] }
      ],
      total: v => v.plan.price * (v.freq.label === 'Two weeks' ? 2 : 1), unit: '/mo',
      done: v => `${v.plan.label.split(' ·')[0]}, ground for ${v.grind.label.toLowerCase()}, every ${v.freq.label.toLowerCase()}. First bag ships Monday.`,
      sell: SELL_SHOP
    },
    gym: {
      brand: 'Pulse', cur: 'kr', title: 'Claim your free week', sub: 'Seven days, every class, no card', cta: /^(free week|claim your free week|claim free week)\b/i, ref: 'PU', live: 'your class-booking app (e.g. Zoezi or Glofox)',
      fields: [
        { k: 'goal', t: 'choice', label: 'I want to', opts: [['Get strong', 0], ['Get fit', 0], ['Come back from a break', 0]] },
        { k: 'class', t: 'choice', label: 'First class', opts: [['Strength · 06:30', 0], ['Conditioning · 12:00', 0], ['Strength · 17:30', 0], ['Mobility · 19:00', 0]] },
        { k: 'date', t: 'date', label: 'Start', ahead: 21 },
        { k: 'after', t: 'choice', label: 'After the week', opts: [['Decide later', 0], ['Unlimited · 1 090 kr/mo', 1090], ['Team of two · 1 690 kr/mo', 1690]] }
      ],
      total: () => 0, zero: 'Free for 7 days',
      done: v => `Your free week starts ${pretty(v.date)} — first class: ${v.class.label}.`,
      sell: ['Class schedule & bookings synced to your app', 'Trial-to-member funnel with reminders', 'Coach profiles & programming pages', 'Local SEO, Meta & Google ads tracking']
    },
    wine: {
      brand: 'Vinöra', cur: 'kr', title: 'Book a table', sub: 'Walk-ins welcome · bookings hold for 15 minutes', cta: /^(tonight's flight|private hire|book)\b/i, ref: 'VI', live: 'your table-booking system',
      fields: [
        { k: 'date', t: 'date', label: 'Date', days: [3, 4, 5, 6], ahead: 28 },
        { k: 'time', t: 'slots', label: 'Time', opts: ['17:00', '18:30', '20:00', '21:30'] },
        { k: 'guests', t: 'stepper', label: 'Guests', min: 1, max: 10, def: 2 },
        { k: 'flight', t: 'toggle', label: 'Pour tonight\'s five-glass flight on arrival', price: 395, per: 'guest' }
      ],
      total: v => v.flight ? 395 * v.guests : 0, zero: 'No deposit',
      done: v => `${v.guests} at ${v.time} on ${pretty(v.date)}${v.flight ? ', flight poured on arrival' : ''}.`,
      extra: { match: /weekly list|the list/i, title: 'The weekly list', sub: 'New bottles, every Thursday', fields: [], done: () => 'You\'re on the list — the next one lands Thursday.' },
      sell: SELL_BOOK
    },
    jewelry: {
      brand: 'Aurelia', cur: 'kr', title: 'Book a private viewing', sub: 'At the atelier in Gamla Stan, or by video from anywhere', cta: /^(private viewing|book a private viewing|book a viewing|book|bespoke commissions)\b/i, ref: 'AU', live: 'your calendar (Cal.com or Calendly) and CRM',
      fields: [
        { k: 'where', t: 'choice', label: 'Viewing', opts: [['At the atelier', 0], ['Video call', 0]] },
        { k: 'piece', t: 'choice', label: 'Interested in', opts: [['Solitaire — Champagne', 0], ['The Ribbon', 0], ['Aurora Drops', 0], ['A bespoke commission', 0]] },
        { k: 'budget', t: 'choice', label: 'Budget', opts: [['Under 30 000 kr', 0], ['30–80 000 kr', 0], ['80 000 kr +', 0]] },
        { k: 'date', t: 'date', label: 'Day', days: [1, 2, 3, 4, 5, 6], ahead: 30 },
        { k: 'time', t: 'slots', label: 'Time', opts: ['11:00', '13:00', '15:00', '17:00'] }
      ],
      total: () => 0, zero: 'Complimentary',
      done: v => `${v.where.label} on ${pretty(v.date)} at ${v.time} — we'll have ${v.piece.label} ready to turn in the light.`,
      sell: ['Appointment booking with reminders', 'Collection editor with made-to-order options', 'Instagram shop & Google Merchant feed', 'SEO, analytics and social previews']
    },
    eclat: {
      brand: 'Éclat', cur: '£', title: 'Request a private viewing', sub: 'Antwerp, London or by video', cta: /^(enquire|private viewing|request this stone|request viewing)\b/i, ref: 'EC', live: 'your CRM and calendar',
      prefill: () => { const g = id => (document.getElementById(id) || {}).textContent || ''; return g('sv') ? `${g('sv')} · ${g('mv')} · ${g('cv')} · from ${g('price')}` : ''; },
      fields: [
        { k: 'stone', t: 'text', label: 'The stone you composed', opt: 1, fromPrefill: 1 },
        { k: 'where', t: 'choice', label: 'Viewing', opts: [['Antwerp bench', 0], ['London salon', 0], ['Video viewing', 0]] },
        { k: 'date', t: 'date', label: 'Preferred day', ahead: 45 }
      ],
      total: () => 0, zero: 'By appointment',
      done: v => `${v.where.label} on ${pretty(v.date)}${v.stone ? ' — ' + v.stone : ''}.`,
      sell: ['Stone configurator wired to your price list', 'Appointment booking & CRM hand-off', 'Multi-currency, multilingual', 'SEO, analytics and social previews']
    },
    florist: {
      brand: 'Wild Stem', cur: 'kr', title: 'Order flowers', sub: 'Order before 13:00 for same-day delivery across Stockholm', cta: /^(order|order for today|order & delivery)\b/i, ref: 'WS', live: 'Shopify or Stripe checkout + delivery routing',
      fields: [
        { k: 'item', t: 'choice', label: 'Arrangement', opts: [['Signature seasonal bouquet', 495], ['Grand seasonal bouquet', 795], ['Single rose, single stem', 95], ['Weekly subscription · 4 weeks', 1590]] },
        { k: 'date', t: 'date', label: 'Deliver on', ahead: 30, today: 1 },
        { k: 'slot', t: 'slots', label: 'Window', opts: ['09–12', '12–15', '15–18'] },
        { k: 'card', t: 'textarea', label: 'Message on the card', opt: 1 },
        { k: 'addr', t: 'text', label: 'Delivery address (Stockholm)' }
      ],
      total: v => v.item.price + (v.item.price < 1590 ? 89 : 0),
      lines: v => [[v.item.label, v.item.price]].concat(v.item.price < 1590 ? [['Hand delivery', 89]] : [['Delivery', 0]]),
      done: v => `${v.item.label}, delivered ${pretty(v.date)} between ${v.slot}.`,
      sell: SELL_SHOP
    },
    flowstate: {
      brand: 'Flowstate', cur: '€', title: 'Create your workspace', sub: '14 days of Team, free · no card', cta: /^(start free|get started|start 14-day trial|talk to sales|sign in)\b/i, ref: 'FS', live: 'your auth provider & Stripe Billing',
      fields: [
        { k: 'plan', t: 'choice', label: 'Plan', opts: [['Solo', 0], ['Team', 9], ['Scale · talk to sales', 0]], def: 1 },
        { k: 'seats', t: 'stepper', label: 'Seats', min: 1, max: 200, def: 5 },
        { k: 'ws', t: 'text', label: 'Workspace name' }
      ],
      total: v => v.plan.price * v.seats, unit: '/mo after trial',
      done: v => `Workspace “${v.ws}” is ready — ${v.plan.label.split(' ·')[0]}, ${v.seats} seat${v.seats > 1 ? 's' : ''}.`,
      sell: ['Marketing site + docs + changelog', 'Pricing wired to Stripe Billing', 'Sign-up flow to your product', 'Analytics, SEO and A/B-ready']
    },
    volt: {
      brand: 'Volt', cur: '€', title: 'Your bag', sub: 'Drop 04 · limited & numbered', cta: /^(bag|get the drop)\b/i, ref: 'VT', live: 'Shopify checkout with drop queue',
      fields: [
        { k: 'cart', t: 'cart', label: 'Drop 04', items: [['Static Hoodie', 140], ['Volt Tee · numbered', 65], ['Concrete Set', 210]] },
        { k: 'size', t: 'choice', label: 'Size', opts: [['XS', 0], ['S', 0], ['M', 0], ['L', 0], ['XL', 0]], def: 2 }
      ],
      total: v => v.cart.total, zero: 'Add a piece',
      done: v => `${v.cart.count} piece${v.cart.count > 1 ? 's' : ''} in size ${v.size.label} reserved for 10 minutes.`,
      sell: SELL_SHOP
    },
    lume: {
      brand: 'Lumé', cur: '€', title: 'Your cart', sub: 'Free returns · carbon-neutral shipping', cta: /^(shop|shop the edit|cart)\b/i, ref: 'LU', live: 'Shopify or Stripe checkout',
      fields: [
        { k: 'cart', t: 'cart', label: 'The edit', items: [['Soft-water cleanse gel · 150 ml', 28], ['Five-ingredient serum · 30 ml', 46], ['Squalane night balm · 50 ml', 38]] },
        { k: 'ritual', t: 'toggle', label: 'Make it a ritual — refill every 8 weeks, 15% off', price: 0 }
      ],
      total: v => v.cart.total * (v.ritual ? .85 : 1), zero: 'Add a product',
      done: v => `${v.cart.count} product${v.cart.count > 1 ? 's' : ''}${v.ritual ? ', refilled every 8 weeks' : ''}.`,
      sell: SELL_SHOP
    },
    wander: {
      brand: 'Wander', cur: '€', title: 'Book a trip', sub: 'Ten seats per departure · carbon-offset', cta: /^(book a trip|find your trip|contact)\b/i, ref: 'WA', live: 'your booking engine & deposits (Stripe)',
      fields: [
        { k: 'trip', t: 'choice', label: 'Route', opts: [['The Ridge Line · Norway · 7 days', 1890], ['Wild Atlantic · Portugal · 9 days', 2150], ['Slow Shore · Scotland · 6 days', 1490]] },
        { k: 'month', t: 'choice', label: 'Departure', opts: [['June', 0], ['July', 0], ['August', 0], ['September', 0]] },
        { k: 'people', t: 'stepper', label: 'Travellers', min: 1, max: 10, def: 2 }
      ],
      total: v => v.trip.price * v.people,
      lines: v => [[`${v.trip.label.split(' ·')[0]} × ${v.people}`, v.trip.price * v.people], ['Deposit today (20%)', Math.round(v.trip.price * v.people * .2)]],
      done: v => `${v.people} seat${v.people > 1 ? 's' : ''} held on ${v.trip.label.split(' ·')[0]}, ${v.month.label}.`,
      sell: ['Departures, seats & deposits', 'Day-by-day itinerary editor', 'Multi-currency checkout', 'SEO, analytics and social previews']
    },
    studionord: {
      brand: 'Studio Nord', cur: '€', title: 'Start a project', sub: 'We reply within two working days', cta: /^(contact|hello@)/i, ref: 'SN', live: 'your inbox & CRM',
      fields: [
        { k: 'type', t: 'choice', label: 'Project', opts: [['A house', 0], ['An interior', 0], ['A cultural building', 0], ['Something else', 0]] },
        { k: 'where', t: 'text', label: 'Site location' },
        { k: 'when', t: 'choice', label: 'Start', opts: [['This year', 0], ['Next year', 0], ['Exploring', 0]] },
        { k: 'brief', t: 'textarea', label: 'The one idea it should be about', opt: 1 }
      ],
      total: () => 0, zero: 'Free first conversation',
      done: v => `${v.type.label} in ${v.where}. We'll be in touch within two working days.`,
      sell: ['Project archive with case studies', 'Enquiry flow into your CRM', 'Press & awards pages', 'SEO, analytics and social previews']
    }
  };
  const CLIENT = { laurie: 'Laurie Hedges', belong: 'Belong', innergroup: 'Inner Group' };
  const cfg = C[SLUG];

  /* ---------------------------------------------------------------- styles */
  const css = `
.cx-root{--cx-a:var(--accent,var(--gold,var(--volt,#c9a45c)));--cx-bg:#111014;--cx-ink:#f4f1ea;--cx-mut:rgba(244,241,234,.62);--cx-line:rgba(244,241,234,.14);
 font:14px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--cx-ink);-webkit-font-smoothing:antialiased}
.cx-root *{box-sizing:border-box}
.cx-pill{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:9000;display:flex;align-items:center;gap:.55rem;
 padding:.55rem .95rem .55rem .7rem;border-radius:40px;background:rgba(14,13,17,.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14);
 color:#f4f1ea;font:500 11px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.35);transition:transform .25s,border-color .25s}
.cx-pill:hover,.cx-pill:focus-visible{transform:translateY(-2px);border-color:var(--cx-a);outline:none}
.cx-pill i{width:8px;height:8px;border-radius:50%;background:var(--cx-a);box-shadow:0 0 10px var(--cx-a)}
.cx-pill.left{right:auto;left:max(16px,env(safe-area-inset-left))}
.cx-veil{position:fixed;inset:0;z-index:9001;background:rgba(6,6,8,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .3s}
.cx-veil.on{opacity:1}
.cx-drawer{position:fixed;top:0;right:0;bottom:0;z-index:9002;width:min(460px,100%);background:var(--cx-bg);border-left:1px solid var(--cx-line);
 display:flex;flex-direction:column;transform:translateX(102%);transition:transform .45s cubic-bezier(.2,.8,.2,1);box-shadow:-30px 0 80px rgba(0,0,0,.45)}
.cx-drawer.on{transform:none}
.cx-hd{padding:26px 26px 18px;border-bottom:1px solid var(--cx-line);position:relative}
.cx-hd small{display:block;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--cx-a);margin-bottom:8px}
.cx-hd h2{margin:0;font:400 26px/1.15 var(--serif,Georgia,serif);letter-spacing:-.005em}
.cx-hd p{margin:6px 0 0;color:var(--cx-mut);font-size:13px}
.cx-x{position:absolute;top:18px;right:18px;width:36px;height:36px;border-radius:50%;border:1px solid var(--cx-line);background:none;color:inherit;font-size:18px;cursor:pointer}
.cx-x:hover,.cx-x:focus-visible{border-color:var(--cx-a);outline:none}
.cx-bd{flex:1;overflow:auto;padding:20px 26px;display:flex;flex-direction:column;gap:18px}
.cx-f>label,.cx-f>.cx-l{display:block;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--cx-mut);margin-bottom:8px}
.cx-chips{display:flex;flex-wrap:wrap;gap:8px}
.cx-chip{border:1px solid var(--cx-line);background:rgba(255,255,255,.03);color:inherit;border-radius:12px;padding:10px 13px;font:inherit;font-size:13px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:2px;transition:border-color .2s,background .2s}
.cx-chip b{font-weight:500}.cx-chip span{font-size:11.5px;color:var(--cx-mut)}
.cx-chip[aria-pressed=true]{border-color:var(--cx-a);background:color-mix(in srgb,var(--cx-a) 14%,transparent)}
.cx-chip:hover,.cx-chip:focus-visible{border-color:var(--cx-a);outline:none}
.cx-in{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--cx-line);background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:14px;color-scheme:dark}
.cx-in:focus{outline:none;border-color:var(--cx-a)}
textarea.cx-in{min-height:74px;resize:vertical}
.cx-in.bad{border-color:#e0605a}
.cx-step{display:flex;align-items:center;gap:14px}
.cx-step button{width:38px;height:38px;border-radius:50%;border:1px solid var(--cx-line);background:none;color:inherit;font-size:18px;cursor:pointer}
.cx-step button:hover,.cx-step button:focus-visible{border-color:var(--cx-a);outline:none}
.cx-step output{min-width:2ch;text-align:center;font-size:18px;font-variant-numeric:tabular-nums}
.cx-tog{display:flex;gap:12px;align-items:flex-start;cursor:pointer;font-size:13.5px}
.cx-tog input{accent-color:var(--cx-a);width:18px;height:18px;margin-top:1px}
.cx-cart{display:flex;flex-direction:column;gap:8px}
.cx-cart .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--cx-line);border-radius:12px}
.cx-cart .row .nm{flex:1}.cx-cart .row .nm span{display:block;font-size:12px;color:var(--cx-mut)}
.cx-ft{padding:18px 26px 24px;border-top:1px solid var(--cx-line);display:flex;flex-direction:column;gap:12px;padding-bottom:max(24px,env(safe-area-inset-bottom))}
.cx-sum{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--cx-mut);font-variant-numeric:tabular-nums}
.cx-sum div{display:flex;justify-content:space-between;gap:12px}
.cx-sum .tot{color:var(--cx-ink);font-size:17px;margin-top:4px}
.cx-go{border:0;border-radius:40px;padding:15px 20px;background:var(--cx-a);color:#111;font:600 12px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:filter .2s,transform .2s}
.cx-go:hover,.cx-go:focus-visible{filter:brightness(1.1);transform:translateY(-1px);outline:none}
.cx-go.ghost{background:none;color:var(--cx-ink);border:1px solid var(--cx-line)}
.cx-note{font-size:11.5px;color:var(--cx-mut);line-height:1.5}
.cx-ok{display:flex;flex-direction:column;gap:14px;align-items:flex-start}
.cx-ok .tick{width:54px;height:54px;border-radius:50%;border:1px solid var(--cx-a);display:grid;place-items:center;color:var(--cx-a);font-size:24px}
.cx-ok .refc{font:500 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;padding:8px 12px;border:1px dashed var(--cx-line);border-radius:8px}
.cx-ok p{margin:0;font-size:15px}
.cx-toast{position:fixed;left:50%;bottom:max(76px,calc(env(safe-area-inset-bottom) + 76px));transform:translate(-50%,20px);z-index:9003;opacity:0;transition:.35s;
 background:rgba(14,13,17,.92);color:#f4f1ea;border:1px solid rgba(255,255,255,.14);border-radius:40px;padding:10px 18px;font:13px/1.3 system-ui,sans-serif;max-width:calc(100% - 32px);text-align:center;pointer-events:none}
.cx-toast.on{opacity:1;transform:translate(-50%,0)}
.cx-sell ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.cx-sell li{display:flex;gap:10px;font-size:14px}.cx-sell li:before{content:'';flex:none;width:6px;height:6px;border-radius:50%;background:var(--cx-a);margin-top:8px}
.cx-sell .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.cx-sell .kpis div{border:1px solid var(--cx-line);border-radius:12px;padding:12px}
.cx-sell .kpis b{display:block;font:400 22px/1 var(--serif,Georgia,serif);color:var(--cx-a)}
.cx-sell .kpis span{font-size:11px;color:var(--cx-mut)}
@media (prefers-reduced-motion:reduce){.cx-drawer,.cx-veil,.cx-toast,.cx-pill{transition:none}}
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const root = document.createElement('div'); root.className = 'cx-root'; document.body.appendChild(root);

  /* ---------------------------------------------------------------- toast */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'cx-toast'; toastEl.setAttribute('role', 'status'); root.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2600);
  }

  /* ---------------------------------------------------------------- drawer shell */
  let veil, drawer, lastFocus;
  function openShell(html) {
    lastFocus = document.activeElement;
    if (!drawer) {
      veil = document.createElement('div'); veil.className = 'cx-veil'; veil.onclick = close;
      drawer = document.createElement('aside'); drawer.className = 'cx-drawer'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
      root.append(veil, drawer);
    }
    drawer.innerHTML = html;
    veil.hidden = false; drawer.hidden = false;
    requestAnimationFrame(() => { veil.classList.add('on'); drawer.classList.add('on'); });
    drawer.querySelector('.cx-x').onclick = close;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => { const f = drawer.querySelector('.cx-chip,.cx-in,.cx-step button,.cx-go'); f && f.focus({ preventScroll: true }); }, 60);
    window.__CONCEPT.open = true;
  }
  function close() {
    if (!drawer || !drawer.classList.contains('on')) return;
    veil.classList.remove('on'); drawer.classList.remove('on');
    document.documentElement.style.overflow = '';
    setTimeout(() => { if (!drawer.classList.contains('on')) { veil.hidden = true; drawer.hidden = true; } }, 450);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    window.__CONCEPT.open = false;
  }
  document.addEventListener('keydown', e => {
    if (!drawer || !drawer.classList.contains('on')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = [...drawer.querySelectorAll('button,input,textarea,select,a[href]')].filter(x => !x.disabled && x.offsetParent);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }, true);

  /* ---------------------------------------------------------------- the flow */
  function nextOpen(f) {
    const d = new Date(); if (!f.today) d.setDate(d.getDate() + 1);
    for (let i = 0; i < 14 && f.days && !f.days.includes(d.getDay()); i++) d.setDate(d.getDate() + 1);
    return iso(d);
  }
  function openFlow(c, prefill) {
    const st = {}; const contact = [{ k: 'name', t: 'text', label: 'Name' }, { k: 'email', t: 'email', label: 'Email' }];
    const fields = c.fields.concat(contact);
    fields.forEach(f => {
      if (f.t === 'choice') st[f.k] = f.def || 0;
      else if (f.t === 'stepper') st[f.k] = f.def || f.min || 1;
      else if (f.t === 'date') st[f.k] = f.after ? (() => { const d = new Date(st[f.after] + 'T12:00'); d.setDate(d.getDate() + 2); return iso(d); })() : nextOpen(f);
      else if (f.t === 'slots') st[f.k] = f.opts[1] || f.opts[0];
      else if (f.t === 'toggle') st[f.k] = false;
      else if (f.t === 'cart') st[f.k] = f.items.map((_, i) => i === 0 ? 1 : 0);
      else st[f.k] = f.fromPrefill && prefill ? prefill : '';
    });
    const remembered = ls.get('cx:contact'); if (remembered) { st.name = remembered.name || ''; st.email = remembered.email || ''; }
    const val = () => {
      const v = {};
      fields.forEach(f => {
        if (f.t === 'choice') { const o = f.opts[st[f.k]]; v[f.k] = { label: o[0], price: o[1] || 0 }; }
        else if (f.t === 'cart') { const q = st[f.k]; v[f.k] = { q, count: q.reduce((a, b) => a + b, 0), total: q.reduce((a, n, i) => a + n * f.items[i][1], 0), lines: f.items.map((it, i) => [q[i] ? `${it[0]} × ${q[i]}` : '', it[1] * q[i]]).filter(l => l[0]) }; }
        else v[f.k] = st[f.k];
      });
      return v;
    };
    const fieldHtml = f => {
      const id = 'cx-' + f.k;
      if (f.t === 'choice') return `<div class="cx-f" role="group" aria-labelledby="${id}"><div class="cx-l" id="${id}">${esc(f.label)}</div><div class="cx-chips">${f.opts.map((o, i) =>
        `<button type="button" class="cx-chip" data-k="${f.k}" data-i="${i}" aria-pressed="${st[f.k] === i}"><b>${esc(o[0])}</b>${o[2] || o[1] ? `<span>${esc([o[2], o[1] ? money(o[1], c.cur) : ''].filter(Boolean).join(' · '))}</span>` : ''}</button>`).join('')}</div></div>`;
      if (f.t === 'slots') return `<div class="cx-f" role="group" aria-labelledby="${id}"><div class="cx-l" id="${id}">${esc(f.label)}</div><div class="cx-chips">${f.opts.map(o =>
        `<button type="button" class="cx-chip" data-slot="${f.k}" data-v="${esc(o)}" aria-pressed="${st[f.k] === o}"><b>${esc(o)}</b></button>`).join('')}</div></div>`;
      if (f.t === 'stepper') return `<div class="cx-f"><div class="cx-l">${esc(f.label)}</div><div class="cx-step"><button type="button" data-step="${f.k}" data-d="-1" aria-label="Fewer ${esc(f.label)}">−</button><output data-out="${f.k}" aria-live="polite">${st[f.k]}</output><button type="button" data-step="${f.k}" data-d="1" aria-label="More ${esc(f.label)}">+</button></div></div>`;
      if (f.t === 'toggle') return `<label class="cx-tog"><input type="checkbox" data-tog="${f.k}"> <span>${esc(f.label)}${f.price ? ` · <b>${money(f.price, c.cur)}</b>${f.per ? ' / ' + f.per : ''}` : ''}</span></label>`;
      if (f.t === 'cart') return `<div class="cx-f"><div class="cx-l">${esc(f.label)}</div><div class="cx-cart">${f.items.map((it, i) =>
        `<div class="row"><div class="nm">${esc(it[0])}<span>${money(it[1], c.cur)}</span></div><div class="cx-step"><button type="button" data-cart="${f.k}" data-i="${i}" data-d="-1" aria-label="Remove ${esc(it[0])}">−</button><output data-cq="${f.k}-${i}">${st[f.k][i]}</output><button type="button" data-cart="${f.k}" data-i="${i}" data-d="1" aria-label="Add ${esc(it[0])}">+</button></div></div>`).join('')}</div></div>`;
      if (f.t === 'date') { const t = new Date(); if (!f.today) t.setDate(t.getDate() + 1); const m = new Date(); m.setDate(m.getDate() + (f.ahead || 60));
        return `<div class="cx-f"><label for="${id}">${esc(f.label)}</label><input class="cx-in" type="date" id="${id}" data-in="${f.k}" min="${iso(t)}" max="${iso(m)}" value="${st[f.k]}" required></div>`; }
      if (f.t === 'textarea') return `<div class="cx-f"><label for="${id}">${esc(f.label)}</label><textarea class="cx-in" id="${id}" data-in="${f.k}" ${f.opt ? '' : 'required'}>${esc(st[f.k])}</textarea></div>`;
      return `<div class="cx-f"><label for="${id}">${esc(f.label)}</label><input class="cx-in" id="${id}" data-in="${f.k}" type="${f.t === 'email' ? 'email' : 'text'}" ${f.t === 'email' ? 'autocomplete="email" inputmode="email"' : f.k === 'name' ? 'autocomplete="name"' : ''} value="${esc(st[f.k])}" ${f.opt ? '' : 'required'}></div>`;
    };
    const last = ls.get('cx:last:' + SLUG);
    openShell(`<div class="cx-hd"><small>${esc(c.brand)}</small><h2>${esc(c.title)}</h2><p>${esc(c.sub)}</p><button class="cx-x" aria-label="Close">×</button></div>
      <form class="cx-bd" novalidate>${last ? `<div class="cx-note">Welcome back — your last request was <b>${esc(last.ref)}</b>: ${esc(last.text)}</div>` : ''}${fields.map(fieldHtml).join('')}</form>
      <div class="cx-ft"><div class="cx-sum" aria-live="polite"></div><button class="cx-go" type="button">${esc(c.go || 'Confirm')}</button><div class="cx-note">Concept demo — nothing is sent or charged. At launch this connects to ${esc(c.live)}.</div></div>`);
    drawer.setAttribute('aria-label', c.title);
    const form = drawer.querySelector('form');
    const renderSum = () => {
      const v = val(); const sum = drawer.querySelector('.cx-sum');
      if (fields.some(f => f.t === 'cart') && !fields.filter(f => f.t === 'cart').every(f => v[f.k].count)) { sum.innerHTML = `<div class="tot"><span>${esc(c.zero || '')}</span><span></span></div>`; return; }
      const tot = c.total ? c.total(v) : 0;
      let lines = c.lines ? c.lines(v) : [];
      fields.filter(f => f.t === 'cart').forEach(f => { lines = lines.concat(v[f.k].lines); });
      sum.innerHTML = lines.map(l => `<div><span>${esc(l[0])}</span><span>${money(l[1], c.cur)}</span></div>`).join('') +
        `<div class="tot"><span>${tot ? 'Total' : esc(c.zero || 'Total')}</span><span>${tot ? money(tot, c.cur) + (c.unit ? ' ' + esc(c.unit) : '') : ''}</span></div>`;
    };
    form.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k) { st[b.dataset.k] = +b.dataset.i; form.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (b.dataset.slot) { st[b.dataset.slot] = b.dataset.v; form.querySelectorAll(`[data-slot="${b.dataset.slot}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (b.dataset.step) { const f = fields.find(x => x.k === b.dataset.step); st[f.k] = Math.max(f.min, Math.min(f.max, st[f.k] + +b.dataset.d)); form.querySelector(`[data-out="${f.k}"]`).textContent = st[f.k]; }
      if (b.dataset.cart) { const q = st[b.dataset.cart]; const i = +b.dataset.i; q[i] = Math.max(0, Math.min(9, q[i] + +b.dataset.d)); form.querySelector(`[data-cq="${b.dataset.cart}-${i}"]`).textContent = q[i]; }
      renderSum();
    });
    form.addEventListener('input', e => {
      const k = e.target.dataset.in, t = e.target.dataset.tog;
      if (k) { st[k] = e.target.value; e.target.classList.remove('bad');
        const dep = fields.find(f => f.after === k); if (dep) { const o = form.querySelector(`[data-in="${dep.k}"]`); o.min = st[k]; if (st[dep.k] <= st[k]) { const d = new Date(st[k] + 'T12:00'); d.setDate(d.getDate() + 1); st[dep.k] = o.value = iso(d); } } }
      if (t) st[t] = e.target.checked;
      renderSum();
    });
    form.addEventListener('submit', e => e.preventDefault());
    const submit = () => {
      let bad = null;
      form.querySelectorAll('.cx-in[required]').forEach(i => {
        const ok = i.type === 'email' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value.trim()) : i.value.trim() !== '';
        const f = fields.find(x => x.k === i.dataset.in);
        const dayOk = !(f && f.days && i.value) || f.days.includes(new Date(i.value + 'T12:00').getDay());
        i.classList.toggle('bad', !ok || !dayOk); if ((!ok || !dayOk) && !bad) bad = [i, !dayOk ? 'We\'re closed that day — pick another.' : 'Please fill this in.'];
      });
      const v = val();
      if (!bad && fields.some(f => f.t === 'cart' && !v[f.k].count)) { toast('Add at least one piece first.'); return; }
      if (bad) { bad[0].focus(); toast(bad[1]); return; }
      const ref = c.ref + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const text = c.done(v);
      ls.set('cx:last:' + SLUG, { ref, text, at: Date.now() }); ls.set('cx:contact', { name: v.name, email: v.email });
      const tot = c.total ? c.total(v) : 0;
      drawer.querySelector('.cx-bd').outerHTML = `<div class="cx-bd"><div class="cx-ok"><div class="tick">✓</div><p>Thank you, ${esc(v.name.split(' ')[0])}.</p><p>${esc(text)}</p>
        ${tot ? `<p class="cx-note">Total ${money(tot, c.cur)}${c.unit ? ' ' + esc(c.unit) : ''}</p>` : ''}<div class="refc">REF ${esc(ref)}</div>
        <p class="cx-note">A confirmation would go to ${esc(v.email)}.</p></div></div>`;
      drawer.querySelector('.cx-ft').innerHTML = `<button class="cx-go" type="button" data-sell>This could be your site →</button><button class="cx-go ghost" type="button" data-close>Back to ${esc(c.brand)}</button>
        <div class="cx-note">Concept demo — nothing was sent or charged.</div>`;
      drawer.querySelector('[data-close]').onclick = close;
      drawer.querySelector('[data-sell]').onclick = () => openSell();
      drawer.querySelector('[data-close]').focus();
    };
    drawer.querySelector('.cx-go').onclick = submit;
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submit(); } });
    renderSum();
  }

  /* ---------------------------------------------------------------- the sale sheet */
  function openSell() {
    const client = CLIENT[SLUG];
    const name = client || (cfg && cfg.brand) || document.title.split(/[—·|]/)[0].trim();
    const bullets = (cfg && cfg.sell) || ['Design, build and launch', 'Content you can edit yourself', 'Mobile-first and fast', 'SEO, analytics and social previews'];
    openShell(`<div class="cx-hd"><small>Caldas Studio</small><h2>${client ? `Built for ${esc(name)}.` : `${esc(name)} is a concept.<br>It could be yours.`}</h2>
      <p>${client ? 'A site made by Caldas Studio. Yours can be next.' : 'A complete, working site design — adapted to your name, your photos and your offer.'}</p><button class="cx-x" aria-label="Close">×</button></div>
      <div class="cx-bd cx-sell">
        <div class="kpis"><div><b>2–4</b><span>weeks to launch</span></div><div><b>1</b><span>fixed quote</span></div><div><b>100%</b><span>yours to own</span></div></div>
        <div class="cx-f"><div class="cx-l">What's included</div><ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}<li>Hosting set-up, domain and handover</li></ul></div>
        ${cfg ? `<div class="cx-note">Try it first: the ${esc(cfg.title.toLowerCase())} flow on this page works end to end.</div>` : ''}
      </div>
      <div class="cx-ft">${cfg ? `<button class="cx-go ghost" type="button" data-try>Try the ${esc(cfg.title.toLowerCase())} flow</button>` : ''}
        <a class="cx-go" style="text-align:center;text-decoration:none" href="${STUDIO}#cta">Commission ${client ? 'your own' : 'this site'} →</a>
        <a class="cx-note" style="color:inherit;text-align:center" href="${STUDIO}">See every concept in the Caldas Museum</a></div>`);
    drawer.setAttribute('aria-label', 'About this concept');
    const t = drawer.querySelector('[data-try]'); if (t) t.onclick = () => openFlow(cfg, cfg.prefill && cfg.prefill());
    ls.set('cx:interest', { slug: SLUG, at: Date.now() });
  }

  /* ---------------------------------------------------------------- wiring */
  const pill = document.createElement('button');
  pill.className = 'cx-pill' + (SLUG === 'belong' ? ' left' : '');
  pill.type = 'button';
  pill.innerHTML = `<i></i>${CLIENT[SLUG] ? 'Built by Caldas Studio' : 'Concept · make it yours'}`;
  pill.onclick = openSell;
  root.appendChild(pill);

  const label = el => (el.innerText || el.textContent || '').replace(/[→↗←↘]/g, '').replace(/\s+/g, ' ').trim();
  document.addEventListener('click', e => {
    const el = e.target.closest('a,button'); if (!el || root.contains(el)) return;
    const href = el.getAttribute('href') || '';
    const txt = label(el);
    if (cfg) {
      if (cfg.extra && cfg.extra.match.test(txt)) { e.preventDefault(); openFlow(Object.assign({}, cfg, cfg.extra, { fields: cfg.extra.fields, total: null })); return; }
      const isCta = cfg.cta.test(txt) || /^mailto:/i.test(href);
      if (isCta && !(el.type === 'submit' && el.form) && !el.closest('.chips')) { e.preventDefault(); openFlow(cfg, cfg.prefill && cfg.prefill()); return; }
    }
    if (href === '#' || href === '') {
      if (el.tagName === 'BUTTON') return;
      e.preventDefault();
      if (el.matches('.brand,.logo') || /^(éclat|volt|wander|lumé)$/i.test(txt)) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (/instagram|tiktok|vimeo|linkedin|facebook|youtube/i.test(txt)) toast(`${txt} profile connects at launch.`);
      else toast(`“${txt}” goes live at launch — this is a concept demo.`);
    }
  }, true);

  document.addEventListener('submit', e => {
    const f = e.target; if (root.contains(f) || !cfg) return;
    e.preventDefault();
    const inputs = [...f.querySelectorAll('input,textarea')];
    const bad = inputs.find(i => i.required && !i.value.trim()) || inputs.find(i => i.type === 'email' && i.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value));
    if (bad) { bad.focus(); toast('Please complete the highlighted field.'); return; }
    const wish = f.querySelector('#wish');
    openFlow(cfg, (wish && wish.value) || (cfg.prefill && cfg.prefill()));
    const nm = inputs.find(i => /name/i.test(i.placeholder)), em = inputs.find(i => i.type === 'email');
    if (nm) { const x = drawer.querySelector('[data-in="name"]'); x.value = nm.value; x.dispatchEvent(new Event('input', { bubbles: true })); }
    if (em) { const x = drawer.querySelector('[data-in="email"]'); x.value = em.value; x.dispatchEvent(new Event('input', { bubbles: true })); }
  }, true);

  window.__CONCEPT = { slug: SLUG, cfg: !!cfg, open: false, openFlow: () => cfg && openFlow(cfg, cfg.prefill && cfg.prefill()), openSell, close };
})();
