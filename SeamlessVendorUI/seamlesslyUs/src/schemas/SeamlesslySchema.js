// ==========================================
// Seamlessly Schema Artifact
// ==========================================

const SeamlesslySchema = {
  guests: {
    painPoints: [
      {
        id: 1,
        title: "Long Wait Times",
        description: "Guests spend excessive time in lines (8+ minutes), leading to frustration, fatigue, and abandoned orders. 75% of customers abandon queues when wait times exceed 10 minutes.",
        revenueLeak: "$700 per day (large venue)",
        abandonmentRate: "75%",
        criticalThreshold: "5-10 minutes"
      },
      {
        id: 2,
        title: "Inconsistent Service Quality",
        description: "Overwhelmed staff often deliver poor service, resulting in complaints and negative experiences. 32% of customers stop doing business after one bad experience.",
        customerLossAfterBadExperience: "32%"
      },
      {
        id: 3,
        title: "Disjointed Technology Experience",
        description: "Multiple apps for tickets, reservations, and orders create confusion, delays, and extra fees. Customers face 15-30% markup on third-party delivery apps.",
        monthlyCost: "$150-300",
        thirdPartyFees: "15-30%",
        additionalMarkup: "15-20%"
      },
      {
        id: 4,
        title: "Delivery Failures",
        description: "Orders arrive late, cold, or are canceled, leaving guests dissatisfied and increasing chargebacks. Third-party delivery has 17% cancellation rate.",
        annualLoss: "$3,600-7,200",
        cancellationRate: "17%",
        noShowRate: "12%"
      },
      {
        id: 5,
        title: "Lack of Personalized Experience",
        description: "Without integrated data, guests receive generic service and miss out on curated experiences. 41% of diners research social media before choosing restaurants."
      }
    ],
    benefits: [
      {
        id: 1,
        title: "Skip the Line",
        description: "QR code and mobile ordering reduce wait times to under 6 minutes (from 8-9 minutes), increasing satisfaction and convenience. Mobile ordering is 1-3 minutes faster than traditional ordering.",
        waitTimeReduction: "25-40%",
        mobileOrderingSpeedIncrease: "1-3 minutes faster"
      },
      {
        id: 2,
        title: "Optimized Customer Journey",
        description: "Seamlessly ensures a smooth experience from entry to exit at events, venues, and nights out. Reduces abandonment and improves throughput by up to 60%.",
        abandonmentReduction: "60%",
        throughputIncrease: "32%"
      },
      {
        id: 3,
        title: "Personalized Experiences",
        description: "Leverages network data to offer tailored recommendations, enhancing engagement and repeat visits. Personalized experiences increase reorder rates by 112%.",
        reorderRateIncrease: "112%",
        repeatCustomerIncrease: "20%"
      }
    ]
  },

  hosts: {
    painPoints: [
      {
        id: 1,
        title: "Staff Overwhelm & Turnover",
        description: "High stress causes average employee tenure of ~59 days, driving recurring recruitment and training costs. Hospitality turnover rate is 73-86% annually, highest of any sector.",
        costImpact: "$4,700-5,864 per employee",
        avgTenureDays: 59,
        annualTurnoverRate: "73-86%",
        monthlyQuitRate: "5.8%"
      },
      {
        id: 2,
        title: "Revenue Leakage",
        description: "Inefficient processes and tech fragmentation lower revenue per order and reduce customer retention. Long queues cause 75% customer abandonment and up to 45% revenue loss.",
        potentialRevenueIncreasePercent: "30-45%",
        queueAbandonmentRate: "75%",
        dailyRevenueLoss: "$700 (per busy location)"
      },
      {
        id: 3,
        title: "Tech Fragmentation",
        description: "Separate systems for POS, scheduling, reservations, ticketing, and delivery increase operational costs. Third-party delivery fees eat 22-43% of order value.",
        monthlyCost: "$500-2,000",
        thirdPartyDeliveryFees: "22-43%",
        additionalProcessingFees: "3-5%"
      },
      {
        id: 4,
        title: "Loss of Customer Data",
        description: "Disconnected systems prevent actionable insights, leading to poor inventory management and lost repeat business. Restaurant industry loses $162B annually to food waste.",
        annualLoss: "$15,000-50,000",
        industryWasteLoss: "$162 billion annually",
        customerDataLoss: "Significant"
      }
    ],
    benefits: [
      {
        id: 1,
        title: "Staff Retention",
        description: "Reduces overwhelm, increases average tenure from 59 days to 180+ days, and decreases recruitment/training expenses by up to 60%. Recognition programs reduce turnover by 40%.",
        avgTenureIncreaseDays: "120-180 days",
        oneYearRetentionBoost: "40-60%",
        multiYearRetentionBoost: "75-85%",
        costSavingsPerEmployee: "$4,700-5,864"
      },
      {
        id: 2,
        title: "Revenue Growth",
        description: "Faster service, reduced wait times (25-40% reduction), and higher order value increase overall revenue. Mobile ordering increases revenue by 15-30%, with 35% upsell rate.",
        revenueIncreasePercent: "15-30%",
        waitTimeReduction: "25-40%",
        upsellRate: "35%",
        mobileOrderSpeedIncrease: "2.4x faster"
      },
      {
        id: 3,
        title: "Unified Platform (Eventbrella)",
        description: "Integrates POS, scheduling, reservations, tickets, and delivery, reducing tech costs by eliminating 3-5 separate platforms and saving 22-43% on delivery fees.",
        monthlySavings: "$500-2,000",
        deliveryFeeSavings: "22-43%",
        platformsConsolidated: "3-5 systems"
      },
      {
        id: 4,
        title: "Data Control & Network Effects",
        description: "Full access to customer data allows better inventory management, reducing food waste and stock-outs. Restaurant operators achieve 16% YoY revenue growth with proper data tools.",
        annualSavings: "$15,000-50,000",
        inventoryWasteReduction: "20-35%",
        yoyRevenueGrowth: "16%",
        customerDataROI: "2.2x"
      }
    ]
  }
};

export default SeamlesslySchema;
