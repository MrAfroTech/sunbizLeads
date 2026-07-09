/** @typedef {{ label: string, value: string }} CalculatorBucketOption */

/** @param {string} label @param {number} value @returns {CalculatorBucketOption} */
function bucket(label, value) {
  return { label, value: String(value) };
}

/** @type {Record<string, { volume: CalculatorBucketOption[], spend: CalculatorBucketOption[] }>} */
export const CALCULATOR_BUCKETS = {
  sports: {
    volume: [
      bucket('Under 500', 250),
      bucket('500–2,000', 1250),
      bucket('2,000–5,000', 3500),
      bucket('5,000+', 7500),
    ],
    spend: [
      bucket('$5–$25', 15),
      bucket('$26–$75', 50),
      bucket('$76–$125', 100),
      bucket('$125+', 150),
    ],
  },
  hotels: {
    volume: [
      bucket('Under 50 rooms', 25),
      bucket('50–150 rooms', 100),
      bucket('150–300 rooms', 225),
      bucket('300+ rooms', 400),
    ],
    spend: [
      bucket('$100–$200/night', 150),
      bucket('$201–$350/night', 275),
      bucket('$351–$500/night', 425),
      bucket('$500+/night', 600),
    ],
  },
  restaurants: {
    volume: [
      bucket('Under 100 covers', 50),
      bucket('100–250 covers', 175),
      bucket('250–500 covers', 375),
      bucket('500+ covers', 750),
    ],
    spend: [
      bucket('$15–$35/check', 25),
      bucket('$36–$60/check', 48),
      bucket('$61–$100/check', 80),
      bucket('$100+/check', 125),
    ],
  },
  events: {
    volume: [
      bucket('Under 1,000', 500),
      bucket('1,000–5,000', 3000),
      bucket('5,000–15,000', 10000),
      bucket('15,000+', 20000),
    ],
    spend: [
      bucket('$10–$40', 25),
      bucket('$41–$80', 60),
      bucket('$81–$150', 115),
      bucket('$150+', 200),
    ],
  },
  districts: {
    volume: [
      bucket('Under 5,000', 2500),
      bucket('5,000–20,000', 12500),
      bucket('20,000–50,000', 35000),
      bucket('50,000+', 75000),
    ],
    spend: [
      bucket('$10–$30', 20),
      bucket('$31–$60', 45),
      bucket('$61–$100', 80),
      bucket('$100+', 125),
    ],
  },
  'magic-bands': {
    volume: [
      bucket('Under 1,000', 500),
      bucket('1,000–5,000', 3000),
      bucket('5,000–15,000', 10000),
      bucket('15,000+', 20000),
    ],
    spend: [
      bucket('$10–$40', 25),
      bucket('$41–$80', 60),
      bucket('$81–$150', 115),
      bucket('$150+', 200),
    ],
  },
  staffburnout: {
    volume: [
      bucket('Under 10 staff', 5),
      bucket('10–25 staff', 17),
      bucket('25–50 staff', 37),
      bucket('50+ staff', 60),
    ],
    spend: [],
  },
};

export const STAFF_TENURE_BUCKETS = [
  bucket('Under 90 days', 45),
  bucket('90–180 days', 135),
  bucket('180–365 days', 272),
  bucket('365+ days', 500),
];
