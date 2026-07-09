import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CarouselScorer from './carouselScoreCard.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CarouselScorer />
  </StrictMode>,
);
