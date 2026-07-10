/* global React, Button, Field, Segmented, DatePicker, TimePicker, ASSETS, __SPLITFORMS_KEY__ */


const SHOP_OPEN   = 8 * 60;    // shop opens 8:00am
const SHOP_CLOSE  = 18 * 60;   // shop closes 6:00pm
const HALF_LENGTH = 5 * 60;    // a half day is 5 hours
const PRICE = { half: 45, full: 65 };

/* splitforms form-to-email backend. The access key is substituted at build
   time (esbuild define in build.mjs) so each deployment — staging, production,
   a developer's own form — can carry its own key: set the SPLITFORMS_KEY env
   var to override the staging default. The key is public by design. */
const SPLITFORMS_ENDPOINT = 'https://splitforms.com/api/submit';
const SPLITFORMS_KEY = __SPLITFORMS_KEY__;

/* latest a half-day can start and still be back by closing time */
const HALF_LAST_PICKUP = SHOP_CLOSE - HALF_LENGTH;

function RentalForm({ formRef }) {
  const [data, setData] = React.useState({
    name: '', phone: '', email: '', plan: 'half',
    pday: '', ptime: '',
    shuttleNeeded: 'no',
    shuttleType: 'council',
    shuttleCustomRoute: '',
  });
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState(false);
  const set = (k) => (v) => setData((d) => ({ ...d, [k]: v }));

  const today = isoToday();

  const choosePlan = (plan) => setData((d) => {
    const next = { ...d, plan };
    const pmax = plan === 'half' ? HALF_LAST_PICKUP : SHOP_CLOSE;
    if (d.ptime && toMin(d.ptime) > pmax) next.ptime = '';
    return next;
  });

  const pickupMax = data.plan === 'half' ? HALF_LAST_PICKUP : SHOP_CLOSE;

  const total = data.plan === 'half' ? PRICE.half : PRICE.full;

  const totalLabel =
    data.plan === 'half' ? 'Half day · 5 hours' : 'Full day · All day';

  let dropBy = '';
  if (data.plan === 'half' && data.ptime) {
    const m = toMin(data.ptime) + HALF_LENGTH;
    dropBy = `${fmtMin(m)}${data.pday ? ` · ${dowMonDay(data.pday)}` : ''} (same day)`;
  } else if (data.plan === 'full') {
    dropBy = `${fmtMin(SHOP_CLOSE)}${data.pday ? ` · ${dowMonDay(data.pday)}` : ''} (same day)`;
  }

  const baseOk = data.name.trim() && data.phone.trim() && data.email.trim() && data.pday && data.ptime;
  const shuttleOk = data.shuttleNeeded !== 'yes' || data.shuttleType !== 'custom' || data.shuttleCustomRoute.trim();
  const canSend = baseOk && shuttleOk;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSend || sending) return;
    setSending(true);
    setSendError(false);

    const body = new FormData();
    body.set('access_key', SPLITFORMS_KEY);
    body.set('subject', `E-bike rental request — ${data.name}`);
    body.set('name', data.name);
    body.set('phone', data.phone);
    body.set('email', data.email);
    body.set('rental', totalLabel);
    body.set('pickup', `${prettyDay(data.pday)} at ${prettyTime(data.ptime)}`);
    body.set('dropoff', `by ${dropBy}`);
    body.set('shuttle', data.shuttleNeeded === 'yes'
      ? (data.shuttleType === 'council'
        ? 'Council-Cambridge shuttle'
        : `Custom route: ${data.shuttleCustomRoute.trim()}`)
      : 'None');
    body.set('estimated_total', `$${total}`);

    try {
      const res = await fetch(SPLITFORMS_ENDPOINT, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (json.success) setSent(true);
      else setSendError(true);
    } catch {
      setSendError(true);
    }
    setSending(false);
  }

  if (sent) {
    const planWord = data.plan === 'half' ? 'half-day' : 'full-day';
    return (
      <section className="sb-form-wrap" ref={formRef}>
        <div className="sb-confirm">
          <img className="sb-confirm__art" src={`${ASSETS}/sun.svg`} alt="" />
          <h2 className="sb-confirm__title">You're all set, {data.name.split(' ')[0]}!</h2>
          <p className="sb-confirm__body">
            We've got your request for a <strong>{planWord}</strong> rental starting{' '}
            <strong>{prettyDay(data.pday)}</strong> at <strong>{prettyTime(data.ptime)}</strong>
            , due back <strong>{dropBy.replace(/ \(.*\)$/, '')}</strong>.
            
            {data.shuttleNeeded === 'yes' && (
              <>
                {' '}With <strong>{data.shuttleType === 'council' ? 'Council-Cambridge' : 'Custom'} shuttle service</strong>
                {data.shuttleType === 'custom' && data.shuttleCustomRoute.trim()
                  ? <> ({data.shuttleCustomRoute.trim()})</>
                  : null}
                {' '}added to your request.
              </>
            )}

            {' '}Estimated e-bike total <strong>${total}</strong>. We'll text you at{' '}
            <strong>{data.phone}</strong> and email <strong>{data.email}</strong> to confirm — usually within the hour.
          </p>
          <p className="sb-confirm__sign">Happy trails — wheel see you soon!</p>
          <Button variant="secondary" onClick={() => setSent(false)}>
            Make another request
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="sb-form-wrap" ref={formRef}>
      <div className="sb-form-card">
        <h2 className="sb-section__title">Reserve an e-bike</h2>
        <p className="sb-section__sub">
          Tell us a little about your ride and we'll get you set up. No payment now —
          this is just a request, no strings (or chains) attached.
        </p>

        <form className="sb-form" onSubmit={handleSubmit}>
          <Field label="Your name" name="name" value={data.name}
            onChange={set('name')} placeholder="First and last" />

          <Field label="Phone number" name="phone" type="tel" inputMode="tel"
            value={data.phone} onChange={set('phone')} placeholder="(208) 549-9099"
            hint="We'll text you here to confirm." />

          <Field label="Email address" name="email" type="email" inputMode="email"
            value={data.email} onChange={set('email')} placeholder="letsride@sagebrushcycles.com"
            hint="We'll send your receipt here." />

          <div className="sb-form__plan">
            <span className="sb-field__label">How long?</span>
            <Segmented
              value={data.plan}
              onChange={choosePlan}
              options={[
                { value: 'half', label: 'Half day', sub: '4 hrs · $45' },
                { value: 'full', label: 'Full day', sub: 'all day · $65' },
              ]}
            />
          </div>

          <div className="sb-form__leg">
            <span className="sb-leg__label">When would you like it?</span>
            <div className="sb-form__row">
              <DatePicker label="Day" min={today}
                value={data.pday} onChange={set('pday')} />
              <TimePicker label="Time" value={data.ptime} onChange={set('ptime')}
                minMinutes={SHOP_OPEN} maxMinutes={pickupMax} />
            </div>
          </div>

          <div className="sb-dropby">
            <svg className="sb-dropby__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7.5V12l3 2"></path>
            </svg>
            <span>Drop off by <strong>{dropBy || '—'}</strong></span>
          </div>

          <div className="sb-form__plan" style={{ marginTop: '1.5rem' }}>
            <span className="sb-field__label">Need a shuttle transport?</span>
            <Segmented
              value={data.shuttleNeeded}
              onChange={set('shuttleNeeded')}
                options={[
                  { value: 'no', label: 'No shuttle', sub: 'Self pickup' },
                  { value: 'yes', label: 'Yes, please', sub: 'Add service' },
                ]}
            />
          </div>

          {data.shuttleNeeded === 'yes' && (
            <div className="sb-form__plan" style={{ marginTop: '1rem' }}>
              <span className="sb-field__label">Shuttle Option</span>
              <Segmented
                value={data.shuttleType}
                onChange={set('shuttleType')}
                options={[
                  { value: 'council', label: 'Local route', sub: 'Council–Cambridge' },
                  { value: 'custom', label: 'Custom route', sub: 'Pick your stop' },
                ]}
              />
            </div>
          )}

          {data.shuttleNeeded === 'yes' && data.shuttleType === 'custom' && (
            <label className="sb-field">
              <span className="sb-field__label">Custom route details</span>
              <textarea
                className="sb-field__input sb-field__textarea"
                name="shuttleCustomRoute"
                value={data.shuttleCustomRoute}
                onChange={(e) => set('shuttleCustomRoute')(e.target.value)}
                placeholder="Where should we pick you up or drop you off?"
                rows={3}
              />
              <span className="sb-field__hint">Tell us your preferred stop or route.</span>
            </label>
          )}

          <Button variant="primary" type="submit" full disabled={!canSend || sending}>
            {sending ? 'Sending…' : "Let's get rolling"}
          </Button>
          {sendError && (
            <p className="sb-form__error">
              Hmm, that didn't go through — please try again, or give us a call.
            </p>
          )}
          <p className="sb-form__fineprint">
            Helmet &amp; lock included. Must be 18+ to reserve; kids ride with a parent.
          </p>
          <p className="sb-form__credit">
            Form powered by <a href="https://splitforms.com" target="_blank" rel="noopener">splitforms</a>
          </p>
        </form>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */
function toMin(t) {
  if (!t || typeof t !== 'string' || !t.includes(':')) return SHOP_OPEN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmtMin(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
}
function isoToday() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function dowMonDay(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function prettyDay(d) {
  if (!d) return '';
  return new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function prettyTime(t) {
  if (!t) return '';
  return fmtMin(toMin(t));
}

window.RentalForm = RentalForm;
