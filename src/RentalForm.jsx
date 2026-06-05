/* global React */

function RentalForm({ formRef }) {
  const [data, setData] = useState({
    name: '', 
    phone: '', 
    day: '', 
    time: '', 
    plan: 'half',
    shuttleNeeded: 'no',      // 'no' or 'yes'
    shuttleType: 'council',   // 'council' or 'custom'
  });
  const [sent, setSent] = useState(false);
  const set = (k) => (v) => setData((d) => ({ ...d, [k]: v }));

  const canSend = data.name.trim() && data.phone.trim() && data.day && data.time;

  if (sent) {
    return (
      <section className="sb-form-wrap" id="reserve" ref={formRef}>
        <div className="sb-confirm">
          <img className="sb-confirm__art" src={`${ASSETS}/sun.svg`} alt="" />
          <h2 className="sb-confirm__title">You're all set, {data.name.split(' ')[0]}!</h2>
          <p className="sb-confirm__body">
            We've got your request for a <strong>{{half: 'half day', full: 'full day', multi: 'multi day'}[data.plan]}</strong> on{' '}
            <strong>{prettyDay(data.day)}</strong> around <strong>{prettyTime(data.time)}</strong>.
            
            {/* Added dynamic shuttle confirmation summary */}
            {data.shuttleNeeded === 'yes' && (
              <>
                {' '}With <strong>{data.shuttleType === 'council' ? 'Council-Cambridge' : 'Custom'} shuttle service</strong> included.
              </>
            )}

             We'll text you at <strong>{data.phone}</strong> to confirm — usually within the hour.
          </p>
          <p className="sb-confirm__sign">Happy trails — wheel see you soon!</p>
          <Button variant="secondary" onClick={() => { setSent(false); }}>
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

        <form
          className="sb-form"
          onSubmit={(e) => { e.preventDefault(); if (canSend) setSent(true); }}
        >
          <Field label="Your name" name="name" value={data.name}
            onChange={set('name')} placeholder="First and last" />

          <Field label="Phone number" name="phone" type="tel" inputMode="tel"
            value={data.phone} onChange={set('phone')} placeholder="(208) 549-9099"
            hint="We'll text you here to confirm." />

          <div className="sb-form__row">
            <Field label="Day" name="day" type="date" value={data.day} onChange={set('day')} />
            <TimePicker label="Time" value={data.time} onChange={set('time')} />
          </div>

          <div className="sb-form__plan">
            <span className="sb-field__label">How long?</span>
            <Segmented
              value={data.plan}
              onChange={set('plan')}
              options={[
                { value: 'half', label: 'Half day', sub: '$30 · up to 4 hrs' },
                { value: 'full', label: 'Full day', sub: '$45 · all day' },
                { value: 'multi', label: 'Multi day', sub: '$40 · all day, 3+ days' },
              ]}
            />
          </div>

          {/* New Element 1: Shuttle Requirement Toggle */}
          <div className="sb-form__plan">
            <span className="sb-field__label">Need a shuttle?</span>
            <Segmented
              value={data.shuttleNeeded}
              onChange={set('shuttleNeeded')}
              options={[
                { value: 'no', label: 'No shuttle', sub: 'I will pick up / drop off' },
                { value: 'yes', label: 'Yes, please', sub: 'Add shuttle transport' },
              ]}
            />
          </div>

          {/* New Element 2: Shuttle Type Selector (Conditionally shown if they picked 'yes') */}
          {data.shuttleNeeded === 'yes' && (
            <div className="sb-form__plan" style={{ marginTop: '1rem' }}>
              <span className="sb-field__label">Shuttle Option</span>
              <Segmented
                value={data.shuttleType}
                onChange={set('shuttleType')}
                options={[
                  { value: 'council', label: 'Council-Cambridge', sub: 'Standard local routes' },
                  { value: 'custom', label: 'Custom Route', sub: 'Coordinate a custom stop' },
                ]}
              />
            </div>
          )}

          <Button variant="primary" type="submit" full disabled={!canSend}>
            Let's get rolling
          </Button>
          <p className="sb-form__fineprint">
            Helmet & lock included. Must be 18+ to reserve; kids ride with a parent.
          </p>
        </form>
      </div>
    </section>
  );
}

function prettyDay(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00');
  return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function prettyTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`;
}

window.RentalForm = RentalForm;
