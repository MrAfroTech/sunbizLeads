import React, { useState, useEffect } from 'react';
import '../styles/BackgroundSlider.css';
import { CALCULATOR_SLIDER_IMAGES } from '../lib/calculatorHeroImages';

const INTERVAL_MS = 5000;
const TRANSITION_MS = 1500;

const BackgroundSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (CALCULATOR_SLIDER_IMAGES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CALCULATOR_SLIDER_IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="background-slider"
      aria-hidden="true"
      style={{ '--transition-ms': `${TRANSITION_MS}ms` }}
    >
      {CALCULATOR_SLIDER_IMAGES.map((src, index) => (
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
