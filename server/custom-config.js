module.exports = {
  Strategy: {
    splitEqually: {
      MIN_TO_LEND: 150,
      NUM_ALL_IN: 1100,
      SPLIT_UNIT: 1000,
      RATE_EXPECTED_OVER_AMOUNT: 50000
    },
    splitPyramidally: {
      MIN_TO_LEND: 150,
      UP_BOUND_RATE: 0.001, // around 54% annual rate
      LOW_BOUND_RATE: 0.0003, // around 4% annual rate
      AMOUNT_GROW_EXP: 1.3,
      AMOUNT_INIT_MAP: [
        // [0.0007, 12000],
        // [0.0006, 3000],
        [0.0005, 2000],
        [0.0004, 1000],
        [0.0003, 300]
      ],
      RATE_EXPECTED_OVER_AMOUNT: 750000
    }
  },
  Rate: {
    EXPECTED_AMOUNT: 10000
  },
  Period: {
    PERIOD_MAP: [
      [0.2, 120],
      [0.15, 90],
      [0.12, 30],
      [0.10, 14],
    ]
  }
};
