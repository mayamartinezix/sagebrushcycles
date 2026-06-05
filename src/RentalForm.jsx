* global React, Button, Field, Segmented, TimePicker, ASSETS */


const SHOP_OPEN   = 8 * 60;    // shop opens 8:00am
const SHOP_CLOSE  = 18 * 60;   // shop closes 6:00pm
const HALF_LENGTH = 5 * 60;    // a half day is 5 hours
const RETURN_AM   = 10 * 60;   // full & multi-day bikes are due back by 10:00am
const PRICE = { half: 30, full: 45, multiDay: 40 };  // multiDay is per day
const MULTI_MIN_DAYS = 2;
const MULTI_MAX_DAYS = 7;

/* latest a half-day can start and still be back by closing time */
const HALF_LAST_PICKUP = SHOP_CLOSE - HALF_LENGTH;

function RentalForm({ formRef }) {
  const [data, setData] = useState({
    name: '', phone: '', plan: 'half',
    pday: '', ptime: '', dday: '', dtime: '',
    shuttleNeeded: 'no',      // Added track state for toggle
    shuttleType: 'council',   // Added track state for route options
  });
  const [sent, setSent] = useState(false);
  const set = (k) => (v) => setData((d) => ({ ...d, [k]: v }));

  const today = isoToday();

  // switching length: drop a pickup time that no longer fits the new length
  const choosePlan = (plan) => setData((d) => {
    const next = { ...d, plan };
    const pmax = plan === 'half' ? HALF_LAST_PICKUP : SHOP_CLOSE;
    if (d.ptime && toMin(d.ptime) > pmax) next.ptime = '';
    return next;
  });

  // changing pickup day: clear a multi-day drop-off that falls outside the window
  const choosePday = (v) => setData((d) => {
    const next = { ...d, pday: v };
    if (d.plan === 'multi' && d.dday) {
      const lo = addDays(v, MULTI_MIN_DAYS - 1);
      const hi = addDays(v, MULTI_MAX_DAYS - 1);
      if (d.dday < lo || d.dday > hi) next.dday = '';
    }
    return next;
  });

  const pickupMax = data.plan === 'half' ? HALF_LAST_PICKUP : SHOP_CLOSE;

  // ----- derived: days, total, drop-off -----
  const days = (data.plan === 'multi' && data.pday && data.dday)
    ? daysInclusive(data.pday, data.dday) : 0;

  const total =
    data.plan === 'half' ? PRICE.half :
    data.plan === 'full' ? PRICE.full :
    days ? days * PRICE.multiDay : null;

  const totalLabel =
    data.plan === 'half' ? 'Half day · 5 hours' :
    data.plan === 'full' ? 'Full day · All day' :
    days ? `${days} days · $${PRICE.multiDay}/day` : `Multi-day · $${PRICE.multiDay}/day`;

  // static "drop off by" line for half / full
  let dropBy = '';
  if (data.plan === 'half' && data.ptime) {
    const m = toMin(data.ptime) + HALF_LENGTH;
    dropBy = `${fmtMin(m)}${data.pday ? ` · ${dowMonDay(data.pday)}` : ''} (same day)`;
  } else if (data.plan === 'full') {
    dropBy = `Any Time Same Day`;
  }

  const baseOk = data.name.trim() && data.phone.trim() && data.pday && data.ptime;
  const canSend = data.plan === 'multi'
    ? baseOk && data.dday && data.dtime && days >= MULTI_MIN_DAYS && days <= MULTI_MAX_DAYS
    : baseOk;

  if (sent) {
    const planWord = data.plan === 'half' ? 'half-day' : data.plan === 'full' ? 'full-day' : `${days}-day`;
    return (
      <section className="sb-form-wrap" id="reserve" ref={formRef}>
        <div className="sb-confirm">
          <img className="sb-confirm__art" src={`${ASSETS}/sun.svg`} alt="" />
          <h2 className="sb-confirm__title">You're all set, {data.name.split(' ')[0]}!</h2>
          <p className="sb-confirm__body">
            We've got your request for a <strong>{planWord}</strong> rental starting{' '}
            <strong>{prettyDay(data.pday)}</strong> at <strong>{prettyTime(data.ptime)}</strong>
            {data.plan === 'multi'
              ? <React.Fragment>, back by <strong>{prettyTime(data.dtime)}</strong> on <strong>{prettyDay(data.dday)}</strong></React.Fragment>
              : <React.Fragment>, due back <strong>{dropBy.replace(/ \(.*\)$/, '')}</strong></React.Fragment>}.
            
            {/* Contextual verification sentence for text wrap logic */}
            {data.shuttleNeeded === 'yes' && (
              <>
                {' '}With <strong>{data.shuttleType === 'council' ? 'Council-Cambridge' : 'Custom'} shuttle service</strong> added to your request.
              </>
            )}

            {' '}Estimated bike total <strong>${total}</strong>. We'll text you at{' '}
            <strong>{data.phone}</strong> to confirm — usually within the hour.
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
    <section className="sb-form-wrap" id="reserve" ref={formRef}>
      <div className="sb-form-card">
        <h2 className="sb-section__title">Reserve a bike</h2>
        <p className="sb-section__sub">
          Tell us a little about your ride and we'll get you set up. No payment now —
          this is just a request, no strings (or chains) attached.
        </p>

        <form className="sb-form" onSubmit={(e) => { e.preventDefault(); if (canSend) setSent(true); }}>
          <Field label="Your name" name="name" value={data.name}
            onChange={set('name')} placeholder="First and last" />

          <Field label="Phone number" name="phone" type="tel" inputMode="tel"
            value={data.phone} onChange={set('phone')} placeholder="(208) 549-9099"
            hint="We'll text you here to confirm." />

          <div className="sb-form__plan">
            <span className="sb-field__label">How long?</span>
            <Segmented
              value={data.plan}
              onChange={choosePlan}
              options={[
                { value: 'half',  label: 'Half day',  sub: '4 hrs · $30' },
                { value: 'full',  label: 'Full day',  sub: 'all day · $45' },
                { value: 'multi', label: 'Multi-day', sub: '$40 / day' },
              ]}
            />
          </div>

          <div className="sb-form__leg">
            <span className="sb-leg__label">
              {data.plan === 'multi' ? 'Pick up' : 'When would you like it?'}
            </span>
            <div className="sb-form__row">
              <Field label="Day" name="pday" type="date" min={today}
                value={data.pday} onChange={choosePday} />
              <TimePicker label="Time" value={data.ptime} onChange={set('ptime')}
                minMinutes={SHOP_OPEN} maxMinutes={pickupMax} />
            </div>
          </div>

          {data.plan === 'multi' ? (
            <div className="sb-form__leg sb-form__leg--drop">
              <span className="sb-leg__label">Drop off</span>
              <div className="sb-form__row">
                <Field label="Day" name="dday" type="date"
                  min={data.pday ? addDays(data.pday, MULTI_MIN_DAYS - 1) : today}
                  max={data.pday ? addDays(data.pday, MULTI_MAX_DAYS - 1) : undefined}
                  disabled={!data.pday}
                  value={data.dday} onChange={set('dday')} />
                <TimePicker label="Time" value={data.dtime} onChange={set('dtime')}
                  minMinutes={SHOP_OPEN} maxMinutes={SHOP_CLOSE} />
              </div>
              {!data.pday && <span className="sb-field__hint">Pick a pick-up day first.</span>}
            </div>
          ) : (
            <div className="sb-dropby">
              <svg className="sb-dropby__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7.5V12l3 2"></path>
              </svg>
              <span>Drop off by <strong>{dropBy || '—'}</strong></span>
            </div>
          )}

          {/* New Shuttle Toggle Options */}
          <div className="sb-form__plan" style={{ marginTop: '1.5rem' }}>
            <span className="sb-field__label">Need a shuttle transport?</span>
            <Segmented
              value={data.shuttleNeeded}
              onChange={set('shuttleNeeded')}
              options={[
                { value: 'no', label: 'No shuttle', sub: 'Self pick up/drop off' },
                { value: 'yes', label: 'Yes, please', sub: 'Add shuttle service' },
              ]}
            />
          </div>

          {/* Conditional Sub-options for Custom vs Council */}
          {data.shuttleNeeded === 'yes' && (
            <div className="sb-form__plan" style={{ marginTop: '1rem' }}>
              <span className="sb-field__label">Shuttle Option</span>
              <Segmented
                value={data.shuttleType}
                onChange={set('shuttleType')}
                options={[
                  { value: 'council', label: 'Council-Cambridge', sub: 'Standard local routes' },
                  { value: 'custom', label: 'Custom Route', sub: 'Coordinate custom stop' },
                ]}
              />
            </div>
          )}

          <div className="sb-total" style={{ marginTop: '1.5rem' }}>
            <span className="sb-total__label">{totalLabel}</span>
            <span className="sb-total__amount">{total != null ? `$${total}` : 'Pick dates'}</span>
          </div>

          <Button variant="primary" type="submit" full disabled={!canSend}>
            Let's get rolling
          </Button>
          <p className="sb-form__fineprint">
            Helmet &amp; lock included. Must be 18+ to reserve; kids ride with a parent.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */
function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fmtMin(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
}
function isoToday() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00'); d.setDate(d.getDate() + n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function daysInclusive(a, b) {
  const ms = new Date(b + 'T00:00') - new Date(a + 'T00:00');
  return Math.round(ms / 86400000) + 1;
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
