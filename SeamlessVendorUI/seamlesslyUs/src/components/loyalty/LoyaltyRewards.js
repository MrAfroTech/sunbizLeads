/**
 * Coffee & Conversations Collective - Loyalty Rewards Component
 * Displays and manages customer loyalty rewards
 */

import React, { useState, useEffect } from 'react';
import './LoyaltyRewards.css';

const LoyaltyRewards = ({ customerId }) => {
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tierProgress, setTierProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (customerId) {
      loadLoyaltyData();
    }
  }, [customerId]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      
      // Load loyalty account
      const accountResponse = await fetch(`/api/loyalty/${customerId}`);
      const accountData = await accountResponse.json();
      
      if (accountData.success) {
        setLoyaltyAccount(accountData.loyaltyAccount);
        calculateTierProgress(accountData.loyaltyAccount);
      }
      
      // Load available rewards
      const rewardsResponse = await fetch('/api/loyalty/rewards');
      const rewardsData = await rewardsResponse.json();
      
      if (rewardsData.success) {
        setAvailableRewards(rewardsData.rewards);
      }
      
      // Load transaction history
      const historyResponse = await fetch(`/api/loyalty/history/${customerId}`);
      const historyData = await historyResponse.json();
      
      if (historyData.success) {
        setTransactions(historyData.transactions);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTierProgress = (account) => {
    const tiers = [
      { name: 'Bronze', min: 0, max: 999, color: '#CD7F32' },
      { name: 'Silver', min: 1000, max: 2499, color: '#C0C0C0' },
      { name: 'Gold', min: 2500, max: 4999, color: '#FFD700' },
      { name: 'Platinum', min: 5000, max: Infinity, color: '#E5E4E2' }
    ];

    const currentTierIndex = tiers.findIndex(t => 
      account.lifetime_points_earned >= t.min && account.lifetime_points_earned <= t.max
    );

    const currentTier = tiers[currentTierIndex];
    const nextTier = tiers[currentTierIndex + 1] || null;

    let progress = 0;
    if (nextTier) {
      const pointsInCurrentTier = account.lifetime_points_earned - currentTier.min;
      const pointsNeededForNextTier = nextTier.min - currentTier.min;
      progress = (pointsInCurrentTier / pointsNeededForNextTier) * 100;
    } else {
      progress = 100; // Already at highest tier
    }

    setTierProgress({
      currentTier,
      nextTier,
      progress,
      pointsToNext: nextTier ? nextTier.min - account.lifetime_points_earned : 0
    });
  };

  const handleRedeemReward = async (reward) => {
    if (!loyaltyAccount || loyaltyAccount.points_balance < reward.points_cost) {
      alert('Insufficient points to redeem this reward');
      return;
    }

    const confirmRedeem = window.confirm(
      `Redeem ${reward.name} for ${reward.points_cost} points?`
    );

    if (!confirmRedeem) return;

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          reward_id: reward.id,
          points: reward.points_cost
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Reward redeemed successfully!');
        loadLoyaltyData(); // Refresh data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Failed to redeem reward. Please try again.');
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2'
    };
    return colors[tier?.toLowerCase()] || '#CD7F32';
  };

  const getTierBenefits = (tier) => {
    const benefits = {
      bronze: ['5% discount', '1x points', 'Birthday bonus: 100 points'],
      silver: ['10% discount', '1.1x points', 'Priority booking', 'Birthday bonus: 250 points'],
      gold: ['15% discount', '1.25x points', 'Priority booking', 'Free upgrades', 'Early access', 'Birthday bonus: 500 points'],
      platinum: ['20% discount', '1.5x points', 'VIP perks', 'Complimentary services', 'All Gold benefits', 'Birthday bonus: 1000 points']
    };
    return benefits[tier?.toLowerCase()] || benefits.bronze;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderOverview = () => (
    <div className="loyalty-overview">
      <div className="tier-card" style={{ background: `linear-gradient(135deg, ${getTierColor(loyaltyAccount.tier_level)} 0%, ${getTierColor(loyaltyAccount.tier_level)}cc 100%)` }}>
        <div className="tier-badge-large">{loyaltyAccount.tier_level.toUpperCase()}</div>
        <div className="points-display-large">
          <span className="points-number">{loyaltyAccount.points_balance.toLocaleString()}</span>
          <span className="points-label">points available</span>
        </div>
        <div className="lifetime-points">
          {loyaltyAccount.lifetime_points_earned.toLocaleString()} lifetime points earned
        </div>
      </div>

      {tierProgress && tierProgress.nextTier && (
        <div className="tier-progress-card">
          <h3>Progress to {tierProgress.nextTier.name}</h3>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${tierProgress.progress}%`,
                background: getTierColor(tierProgress.nextTier.name)
              }}
            />
          </div>
          <p className="progress-text">
            {tierProgress.pointsToNext.toLocaleString()} more points to reach {tierProgress.nextTier.name} tier
          </p>
        </div>
      )}

      <div className="benefits-card">
        <h3>Your {loyaltyAccount.tier_level} Benefits</h3>
        <ul className="benefits-list">
          {getTierBenefits(loyaltyAccount.tier_level).map((benefit, index) => (
            <li key={index}>✓ {benefit}</li>
          ))}
        </ul>
      </div>

      <div className="referral-card">
        <h3>Refer a Friend</h3>
        <p>Share your unique code and earn 500 points for each friend who books!</p>
        <div className="referral-code">
          <code>{loyaltyAccount.referral_code}</code>
          <button onClick={() => {
            navigator.clipboard.writeText(loyaltyAccount.referral_code);
            alert('Referral code copied!');
          }}>
            Copy
          </button>
        </div>
        <p className="referral-stats">
          You've referred {loyaltyAccount.total_referrals} {loyaltyAccount.total_referrals === 1 ? 'friend' : 'friends'}
        </p>
      </div>
    </div>
  );

  const renderRewards = () => (
    <div className="rewards-catalog">
      <h2>Available Rewards</h2>
      <div className="rewards-grid">
        {availableRewards.map(reward => {
          const canAfford = loyaltyAccount && loyaltyAccount.points_balance >= reward.points_cost;
          const meetsRequirement = !reward.tier_required || loyaltyAccount?.tier_level === reward.tier_required || 
            ['gold', 'platinum'].includes(loyaltyAccount?.tier_level) && reward.tier_required === 'silver';
          
          return (
            <div key={reward.id} className={`reward-card ${!canAfford || !meetsRequirement ? 'disabled' : ''}`}>
              {reward.image_url && (
                <img src={reward.image_url} alt={reward.name} className="reward-image" />
              )}
              <div className="reward-info">
                <h3>{reward.name}</h3>
                <p>{reward.description}</p>
                <div className="reward-cost">
                  <span className="cost-points">{reward.points_cost} points</span>
                  {reward.tier_required && (
                    <span className="tier-required">{reward.tier_required}+ required</span>
                  )}
                </div>
                {reward.terms && <p className="reward-terms">{reward.terms}</p>}
              </div>
              <button
                className="redeem-button"
                onClick={() => handleRedeemReward(reward)}
                disabled={!canAfford || !meetsRequirement}
              >
                {canAfford && meetsRequirement ? 'Redeem' : 
                 !meetsRequirement ? 'Tier Required' : 'Not Enough Points'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="transaction-history">
      <h2>Points History</h2>
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <p className="no-transactions">No transaction history yet</p>
        ) : (
          transactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <span className="transaction-description">{transaction.description}</span>
                <span className="transaction-date">{formatDate(transaction.created_at)}</span>
              </div>
              <div className="transaction-points">
                <span className={`points-change ${transaction.points > 0 ? 'earned' : 'redeemed'}`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points}
                </span>
                <span className="balance-after">Balance: {transaction.balance_after}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="loyalty-loading">Loading loyalty rewards...</div>;
  }

  if (!loyaltyAccount) {
    return <div className="loyalty-error">No loyalty account found</div>;
  }

  return (
    <div className="loyalty-rewards">
      <div className="loyalty-header">
        <h1>Loyalty Rewards</h1>
        <p>Earn points with every booking and redeem for amazing rewards!</p>
      </div>

      <div className="loyalty-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'rewards' ? 'active' : ''}
          onClick={() => setActiveTab('rewards')}
        >
          Rewards Catalog
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Points History
        </button>
      </div>

      <div className="loyalty-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'rewards' && renderRewards()}
        {activeTab === 'history' && renderHistory()}
      </div>
    </div>
  );
};

export default LoyaltyRewards;

