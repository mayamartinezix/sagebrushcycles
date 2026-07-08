/* global React */

function Header() {
  return (
    <header className="sb-header">
      <div className="sb-header__left">
        <a className="sb-brand" href="#">
          <img className="sb-brand__mark" src={`${ASSETS}/emblem.svg`} alt="Sagebrush Cycle emblem" />
          <span className="sb-brand__text">
            Sagebrush Cycles
            <small>BIKE RENTALS · CAMBRIDGE </small>
          </span>
        </a>
        <nav className="sb-header__nav">
          <a href="#trail" className="sb-header__link">The Trail</a>
        </nav>
      </div>
      <a className="sb-header__phone" href="tel:+12085550148">
        <i data-lucide="phone"></i>
        <span>(208) 549 9099</span>
      </a>
    </header>
  );
}

window.Header = Header;
