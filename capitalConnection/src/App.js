import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InvestorsPage from './pages/InvestorsPage';
import FoundersPage from './pages/FoundersPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/investors" element={<InvestorsPage />} />
        <Route path="/founders" element={<FoundersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
