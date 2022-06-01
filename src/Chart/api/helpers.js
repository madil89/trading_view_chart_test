// https://fcsapi.com/document/forex-api

import axios from "axios";
import timestring from "timestring";

const url = "https://fcsapi.com/api-v3/forex/";
const KEY = process.env.REACT_APP_API_KEY;
console.log("key is ", process.env.REACT_APP_API_KEY);

let lastCandleTime = 0;

/*
or to solve this issue, when you send second request
set From={any old time, from time doesn't matter}
set TO={first candle time from 1st request}
*/

export const intervals = {
  1: "1m",
  5: "5m",
  15: "15m",
  30: "30m",
  60: "1h",
  120: "2h",
  240: "4h",
  300: "5h",
  "1D": "1d",
  "1W": "1w",
  W: "1w",
  "1M": "1mon",
};

// top_symbol: 1 - only popular pairs
export const getSymbols = () => {
  return Promise.all([
    request(`list`, { type: "forex", top_symbol: 1 }),
    request(`list`, { type: "crypto", top_symbol: 1 }),
  ]).then((res) => res.flat());
};

// [{ "id": 1, "name": "Euro US Dollar", "symbol": "EUR/USD", "decimal": 4 }]
export const getSymbol = (symbol) => {
  // symbol = "EUR/USD";
  return getSymbols()
    .then((res) => {
      // console.log("symbol is ", symbol);
      // console.log('response is ', res);
      const responseSymbol = res.find((i) => i.symbol === symbol);
      // console.log(responseSymbol);
      const pair = symbol.split("/");
      // console.log("pair is ", pair);
      const obj = {
        symbol,
        baseAssetName: pair[0],
        quoteAssetName: pair[1],
        pricescale: parseFloat(
          "1" + Array(parseFloat(responseSymbol.decimal)).fill(0).join("")
        ),
      };

      // console.log(obj);
      return symbolInfo(obj);
    })
    .catch((error) => console.log(error));
};
// (symbol, interval, from, to)
export const getKlines = ({ symbol, interval, firstDataRequest }) => {
  const period = intervals[interval];
  // console.log("period is ", period, "timestring is ", timestring(period));

  // fixes: Data Provider response limited lenth of data "level=3" => 900 ticks
  // need request manually, otherwise will gaps
  if (firstDataRequest) lastCandleTime = 0;

  const to =
    lastCandleTime === 0 ? Math.round(Date.now() / 1000) : lastCandleTime;
  const from = to - timestring(period) * 900;

  // console.log(to, from, Date.now(), "period is ", timestring(period));

  return request(`history`, { symbol, period, from, to, level: 3 })
    .then((data) => {
      const klines = Object.values(data).map((i) => formatingKline(i));
      lastCandleTime = klines.slice(0, 1)[0].time / 1000;

      return klines || [];
    })
    .catch((error) => console.log("error is ", error));
};

export const getLastKline = (symbol, interval) => {
  const period = intervals[interval];

  // Without cache because will return old data for last candle
  // console.log("getting last kline period == ", period, "symobol is = ", symbol);
  return request(`history`, { symbol, period, level: 1 }).then((res) => {
    try {
      const kline = Object.values(res).slice(-1)[0];
      // const kline = res[res.length - 1];
      // console.log("kline is ", res);
      return formatingKline(kline);
    } catch (error) {
      console.log("error gettingLaskKline ", error);
    }
  });
};

// helpers ---------------------------------

export const checkInterval = (interval) => !!intervals[interval];

const formatingKline = (i) => {
  return {
    time: i.t * 1000,
    open: i.o,
    high: i.h,
    low: i.l,
    close: i.c,
    volume: i.v,
  };
};

const request = (link, params) => {
  return axios({
    url: url + link,
    method: "GET",
    params: {
      access_key: KEY,
      output: "JSON",
      timestamp: Date.now(),
      ...params,
    },
  })
    .then((res) => res.data)
    .then((res) => res.response)
    .catch((error) => console.log("error is ", error));
};

const symbolInfo = ({ symbol, pricescale, quoteAsset }) => ({
  name: symbol,
  description: symbol,
  ticker: symbol,
  //exchange: 'Forex',
  //listed_exchange: 'Binance',
  //type: 'crypto',
  session: "24x7",
  minmov: 1,
  pricescale: pricescale || 10000, // https://github.com/tradingview/charting_library/wiki/Symbology#common-prices
  has_intraday: true,
  has_daily: true,
  has_weekly_and_monthly: true,
  has_no_volume: true, // if no volume in response kline data, disable indicator
  currency_code: quoteAsset,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});
