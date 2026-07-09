import React, { useState, useMemo } from 'react';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import BookingModal from './BookingModal';

const ABANDON_RATE = 0.45;

const MakingPurchaseVsWatchingGame = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [fansPerGame, setFansPerGame] = useState('');
  const [avgOrderAmount, setAvgOrderAmount] = useState('');
  const [homeGamesPerSeason, setHomeGamesPerSeason] = useState('');

  const results = useMemo(() => {
    const fans = parseFloat(fansPerGame) || 0;
    const order = parseFloat(avgOrderAmount) || 0;
    const games = parseFloat(homeGamesPerSeason) || 0;

    const fansLost = Math.round(fans * ABANDON_RATE);
    const perGame = fansLost * order;
    const perSeason = perGame * games;
    const perFanLost = order * ABANDON_RATE;

    return {
      lostRevenuePerGame: perGame,
      lostRevenuePerSeason: perSeason,
      perFanLost,
      fansLost,
    };
  }, [fansPerGame, avgOrderAmount, homeGamesPerSeason]);

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatMoneyDec = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="content-page watch-vs-order-page">
      <div className="watch-vs-order-container">
        <section className="watch-vs-order-hero">
          <div className="watch-vs-order-eyebrow">Revenue Intelligence</div>
          <h1 className="watch-vs-order-title">
            Your fans want to order.<br /><em>The line is stopping them.</em>
          </h1>
          <p className="watch-vs-order-hero-sub">
            Every timeout. Every halftime. Every pregame rush. Fans choose the game over the line — and your revenue disappears with them.
          </p>

          <div className="watch-vs-order-stat-strip">
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">45%</div>
              <div className="watch-vs-order-stat-label">of fans abandon concession lines when the wait looks too long</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">77%</div>
              <div className="watch-vs-order-stat-label">would spend more if wait times were shorter</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">80%+</div>
              <div className="watch-vs-order-stat-label">of MLB fans have abandoned a purchase mid-line at least once</div>
            </div>
          </div>
        </section>

        <div className="watch-vs-order-calc-wrapper">
          <div className="watch-vs-order-calc-card">
            <div className="watch-vs-order-calc-header">
              <h2>Calculate Your Losses</h2>
              <p>Enter your numbers below — see exactly how much you're leaving on the floor each season.</p>
            </div>

            <div className="watch-vs-order-calc-body">
              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">👥 Fans per game</div>
                <div className="watch-vs-order-field-desc">Average attendance at a typical home game.</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 15000"
                  value={fansPerGame}
                  onChange={(e) => setFansPerGame(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">💵 Average order amount ($)</div>
                <div className="watch-vs-order-field-desc">Typical fan spend per game — food, drinks, merch.</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 18"
                  value={avgOrderAmount}
                  onChange={(e) => setAvgOrderAmount(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">🏟 Home games per season</div>
                <div className="watch-vs-order-field-desc">Regular season + playoffs.</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 41"
                  value={homeGamesPerSeason}
                  onChange={(e) => setHomeGamesPerSeason(e.target.value)}
                />
              </div>

              <hr className="watch-vs-order-divider" />

              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-section-label">Venues</div>
                <div className="watch-vs-order-result-label">💸 Lost revenue per season</div>
                <div className="watch-vs-order-result-amount" aria-live="polite">{formatMoney(results.lostRevenuePerSeason)}</div>
                <div className="watch-vs-order-result-sub">That's real money fans <em>wanted</em> to spend — but walked away from.</div>

                <div className="watch-vs-order-breakdown">
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoney(results.lostRevenuePerGame)}</div>
                    <div className="watch-vs-order-breakdown-label">left on the table per game</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(results.perFanLost)}</div>
                    <div className="watch-vs-order-breakdown-label">lost per fan, per game</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{results.fansLost.toLocaleString()}</div>
                    <div className="watch-vs-order-breakdown-label">fans who never ordered</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="watch-vs-order-cta-block">
              <div className="watch-vs-order-cta-headline">What would you do with an extra {formatMoney(results.lostRevenuePerSeason)} in sales?</div>
              <button type="button" className="watch-vs-order-cta-btn" onClick={() => setBookingOpen(true)}>Schedule a Demo</button>
              <div className="watch-vs-order-cta-proof">Trusted by <strong>Orlando Pirates</strong> and teams across the SPHL, IFL, and beyond.</div>
            </div>
          </div>
        </div>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
};

export default MakingPurchaseVsWatchingGame;
