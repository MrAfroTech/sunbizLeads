import React from 'react';
import './TrustedMarquee.css';

const TRUSTED_LOGOS = [
  { src: '/logos/topgolf.png', alt: 'Topgolf' },
  { src: '/logos/denver-broncos.png', alt: 'Denver Broncos' },
  { src: '/logos/starbucks.svg', alt: 'Starbucks' },
  { src: '/logos/marriott.png', alt: 'Marriott' },
  { src: '/logos/live-nation.svg', alt: 'Live Nation' },
  { src: '/logos/aramark.png', alt: 'Aramark' },
  { src: '/logos/compass-group.svg', alt: 'Compass Group' },
  { src: '/logos/sodexo.png', alt: 'Sodexo' },
];

const LogoGroup = ({ decorative = false }) => (
  <div className="home-trusted__group" aria-hidden={decorative || undefined}>
    {TRUSTED_LOGOS.map((logo) => (
      <img
        key={`${decorative ? 'dup-' : ''}${logo.alt}`}
        className="home-trusted__logo"
        src={logo.src}
        alt={decorative ? '' : logo.alt}
        width="120"
        height="32"
        loading="eager"
        decoding="async"
      />
    ))}
  </div>
);

const TrustedMarquee = () => (
  <section className="home-trusted fade-in" id="home-trusted" aria-label="The technology behind">
    <div className="home-trusted__inner">
      <p className="home-trusted__label">The technology behind</p>
      <div className="home-trusted__marquee">
        <div className="home-trusted__scroll">
          <LogoGroup />
          <LogoGroup decorative />
        </div>
      </div>
    </div>
  </section>
);

export default TrustedMarquee;
