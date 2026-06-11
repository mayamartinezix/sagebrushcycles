/* global React */

const ASSETS = 'assets';

/* ---------- Button ---------- */
function Button({ variant = 'primary', children, onClick, type = 'button', full, ...rest }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`sb-btn sb-btn--${variant}${full ? ' sb-btn--full' : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Text field ---------- */
function Field({ label, optional, hint, type = 'text', value, onChange, placeholder, name, inputMode, min, max, disabled }) {
  return (
    <label className={`sb-field${disabled ? ' is-disabled' : ''}`}>
      <span className="sb-field__label">
        {label}
        {optional && <span className="sb-field__opt"> (optional)</span>}
      </span>
      <input
        className="sb-field__input"
        type={type}
        name={name}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <span className="sb-field__hint">{hint}</span>}
    </label>
  );
}

/* ---------- Time picker (tap-to-pick, half-hour slots) ---------- */
function fmtMins(mins) {
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(mm).padStart(2, '0')} ${ap}`;
}
function minsToVal(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function TimePicker({ label, value, onChange, startHour = 8, endHour = 18, stepMin = 30, minMinutes, maxMinutes }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open && window.lucide) window.lucide.createIcons();
  }, [open, value]);

  const selected = value
    ? Number(value.split(':')[0]) * 60 + Number(value.split(':')[1])
    : null;

  const groups = [
    { name: 'Morning', slots: [] },
    { name: 'Afternoon', slots: [] },
    { name: 'Evening', slots: [] },
  ];
  for (let m = startHour * 60; m <= endHour * 60; m += stepMin) {
    if (minMinutes != null && m < minMinutes) continue;
    if (maxMinutes != null && m > maxMinutes) continue;
    const h = Math.floor(m / 60);
    const g = h < 12 ? 0 : h < 17 ? 1 : 2;
    groups[g].slots.push(m);
  }
  const noSlots = groups.every((g) => !g.slots.length);

  return (
    <div className="sb-field sb-tp">
      <span className="sb-field__label">{label}</span>
      <button
        type="button"
        className={`sb-field__input sb-tp__trigger${value ? '' : ' is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{value ? fmtMins(selected) : 'Pick a time'}</span>
        <i data-lucide="clock"></i>
      </button>

      {open && (
        <React.Fragment>
          <div className="sb-tp__backdrop" onClick={() => setOpen(false)}></div>
          <div className="sb-tp__pop" role="listbox">
            {noSlots && <p className="sb-tp__empty">No times open — try another day or length.</p>}
            {groups.filter((g) => g.slots.length).map((g) => (
              <div className="sb-tp__group" key={g.name}>
                <span className="sb-tp__glabel">{g.name}</span>
                <div className="sb-tp__grid">
                  {g.slots.map((m) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected === m}
                      key={m}
                      className={`sb-tp__slot${selected === m ? ' is-on' : ''}`}
                      onClick={() => { onChange(minsToVal(m)); setOpen(false); }}
                    >
                      {fmtMins(m)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ---------- Segmented (Half / Full day) ---------- */
function Segmented({ options, value, onChange }) {
  return (
    <div className="sb-seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`sb-seg__btn${value === o.value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          <span className="sb-seg__title">{o.label}</span>
          <span className="sb-seg__sub">{o.sub}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Button, Field, Segmented, TimePicker, ASSETS });
