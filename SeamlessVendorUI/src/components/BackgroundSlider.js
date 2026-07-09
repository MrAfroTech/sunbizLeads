import React, { useState, useEffect } from 'react';
import '../styles/BackgroundSlider.css';

const PEXELS_IMAGES = [
  '/pexels-pixabay-262047.jpg',
  '/pexels-bluerhinomedia-2788792.jpg',
  '/pexels-brett-sayles-2339712.jpg',
  '/pexels-wb2008-2290070.jpg',
  '/pexels-imin-technology-276315592-12935100.jpg',
  '/pexels-pixabay-260922.jpg',
  '/pexels-imin-technology-276315592-12935077.jpg',
];

const INTERVAL_MS = 5000;
const TRANSITION_MS = 1500;

const BackgroundSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (PEXELS_IMAGES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PEXELS_IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="background-slider"
      aria-hidden="true"
      style={{ '--transition-ms': `${TRANSITION_MS}ms` }}
    >
      {PEXELS_IMAGES.map((src, index) => (
        <div
          key={src}
          className={`background-slider__slide ${index === currentIndex ? 'background-slider__slide--active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
};

export default BackgroundSlider;
