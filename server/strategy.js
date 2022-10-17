const { getPeriod, getRate, step } = require("./utils");
const { Strategy: config } = require("./config");
const { getCurrentLending, getBalance, getCandles, cancelAllFundingOffers } = require("./bitfinex");

const splitEqually = async (avaliableBalance, ccy) => {
  const CONFIG = config.splitEqually;
  const MIN_TO_LEND = CONFIG.MIN_TO_LEND;
  const NUM_ALL_IN = CONFIG.NUM_ALL_IN;
  const SPLIT_UNIT = CONFIG.SPLIT_UNIT;
  const rate = await getRate(ccy, CONFIG.RATE_EXPECTED_OVER_AMOUNT);

  const amounts = [];
  while (avaliableBalance > NUM_ALL_IN) {
    amounts.push(SPLIT_UNIT);
    avaliableBalance -= SPLIT_UNIT;
  }

  if (avaliableBalance <= NUM_ALL_IN && avaliableBalance >= MIN_TO_LEND) {
    amounts.push(avaliableBalance);
  }

  const period = getPeriod(rate);
  return amounts.map(amount => ({
    rate,
    amount,
    period,
    ccy
  }));
};

function getDerivedRate(l, h, x) {
  x = Math.max(l, Math.min(h, x));
  // console.log('x = ', x * 100 * 365)
  return 1 + (1 - (x - l) / (h - l)) * 0.1;
}

// default stratege
const splitPyramidally = async (avaliableBalance, ccy) => {
  const CONFIG = config.splitPyramidally;
  const MIN_TO_LEND = CONFIG.MIN_TO_LEND;
  const UP_BOUND_RATE = CONFIG.UP_BOUND_RATE;
  const LOW_BOUND_RATE = CONFIG.LOW_BOUND_RATE;
  const lending = await getCurrentLending(ccy);
  const balance = await getBalance(ccy);
  const offers = [];
  const baseRate = await getRate(ccy, CONFIG.RATE_EXPECTED_OVER_AMOUNT);
  const candle = await getCandles(ccy);
  // const can = await cancelAllFundingOffers("USD");


  let amountInit = step(CONFIG.AMOUNT_INIT_MAP, baseRate);
  let amount;
  let rate;
  let i = 0;
  let x = 0;
  let totallend = 0;
  let nowofferamountlowerthen8 = 0;

  for (var co = 0; co < lending.length; co++) {
    if (lending[co].rate < 0.00022) {
      nowofferamountlowerthen8 += (lending[co].amount)
    }
    totallend += lending[co].amount
  }

  let lengingratemaxfor4days = 0;
  let lengingratemaxfor2days = 0;
  for (let cand = 0; cand < candle.length; cand++) {
    if (lengingratemaxfor4days < candle[cand].high)
      lengingratemaxfor4days = candle[cand].high
  }
  for (let cand = 0; cand < 2; cand++) {
    if (lengingratemaxfor2days < candle[cand].high)
      lengingratemaxfor2days = candle[cand].high
  }

  console.log('baseRate = ', baseRate * 100 * 365)
  console.log('lending ', totallend / balance * 100, '%')
  console.log('已成交 : ', totallend, 'u')

  if ((totallend / balance) < 0.75) {
    const can = await cancelAllFundingOffers("USD");
    console.log('Cancle All Funding Offers')

    amount = Math.min(
      avaliableBalance,
      amountInit * Math.pow(CONFIG.AMOUNT_GROW_EXP, i)
    );
    amount = avaliableBalance / 2;

    rate = Math.min((lengingratemaxfor2days - 0.00003), baseRate + 0.00005)

    i++;
    console.log(rate * 100 * 365, amount, getPeriod(rate))
    offers.push({
      amount,
      rate,
      period: getPeriod(rate),
      ccy
    });
    avaliableBalance -= amount;
  } else {
    while (avaliableBalance > MIN_TO_LEND) {
      amount = Math.min(
        avaliableBalance,
        amountInit * Math.pow(CONFIG.AMOUNT_GROW_EXP, i)
      );
      amount = Math.floor(amount);

      rate =
        baseRate *
        Math.pow(getDerivedRate(LOW_BOUND_RATE, UP_BOUND_RATE, baseRate), x);

      if (rate * 365 * 100 < 7 && (totallend / balance) > 0.7) {
        rate = lengingratemaxfor2days - 0.00003
      }
      else if ((nowofferamountlowerthen8 / balance) > 0.25 && rate < 0.00028 && (totallend / balance) > 0.7) {
        console.log('加')
        rate += 0.00015
      }
      console.log(rate * 100 * 365, amount, getPeriod(rate))

      offers.push({
        amount,
        rate,
        period: getPeriod(rate),
        ccy
      });

      avaliableBalance -= amount;
      if (baseRate < 0.00018) { x += 3 }
      else if (baseRate < 0.00025) { x += 1.8 }
      else { x += 1.1; }
      // console.log(x)
      i++;
    }
  }

  return offers;
};

module.exports = {
  splitEqually,
  splitPyramidally
};

// (splitPyramidally(400, 'USD'))
