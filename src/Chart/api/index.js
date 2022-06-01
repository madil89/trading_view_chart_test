import {
  //getSymbols,
  getSymbol,
  getKlines,
  getLastKline,
  checkInterval,
  intervals,
} from "./helpers";

//const _symbols = getSymbols() // Out from searchSymbols func, for economy month limit request

const configurationData = {
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
  supported_resolutions: Object.keys(intervals),
};

// onReady => resolveSymbol => getBars => subscribeBars
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  // get a configuration of your datafeed (e.g. supported resolutions, exchanges and so on)
  onReady: (cb) => {
    // console.log("[onReady]: Method call");
    setTimeout(() => cb(configurationData)); // callback must be called asynchronously
  },

  /**
		// no need if not using search
		searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
			console.log('[searchSymbols]: Method call')

			const symbols = await _symbols // get sync data
			const data = symbols.data.response

			if (data.length > 0) {
				const filteredSymbols = data.filter(i => i.symbol.includes(userInput) || i.name.includes(userInput))  // filter symbols

				const updSymbols = filteredSymbols.map(i => {
					return {
						symbol: i.symbol,
						ticker: i.symbol,
						full_name: i.name,
						description: i.name,
						exchange: 'Exchange',
						//	type: i.market,
						//	locale: i.locale,
					}
				})

				return onResultReadyCallback(updSymbols)
			}

			console.log('[searchSymbols] Not found')
			onResultReadyCallback([])

		},
	 */

  // retrieve information about a specific symbol (exchange, price scale, full symbol etc.)
  resolveSymbol: async (
    symbol,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) => {
    // console.log("[resolveSymbol]: Method call", symbol);

    getSymbol(symbol)
      .then((res) => onSymbolResolvedCallback(res))
      .catch(() => onResolveErrorCallback("[resolveSymbol]: symbol not found"));
  },

  // get historical data for the symbol
  getBars: async (
    symbolInfo,
    interval,
    from,
    to,
    onHistoryCallback,
    onErrorCallback,
    firstDataRequest
  ) => {
    // console.log("[getBars] Method call", symbolInfo, interval);
    // console.log("[getBars] First request", firstDataRequest);

    if (!checkInterval(interval)) {
      return onErrorCallback("[getBars] Invalid interval");
    }

    const klines = await getKlines({
      symbol: symbolInfo.ticker,
      interval,
      from,
      to,
      firstDataRequest,
    });
    klines && klines.length > 0
      ? onHistoryCallback(klines)
      : onErrorCallback("Klines data error");
  },

  // subscription to real-time updates
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback
  ) => {
    // console.log(
    //   "[subscribeBars]: Method call with subscribeUID:",
    //   subscribeUID
    // );

    // Global variable
    window.interval = setInterval(function () {
      getLastKline(symbolInfo.ticker, resolution).then((kline) => {
        // console.log(kline);
        onRealtimeCallback(kline);
      });
    }, 1000 * 60); // 60s update interval
  },
  unsubscribeBars: (subscriberUID) => {
    // console.log(
    //   "[unsubscribeBars]: Method call with subscriberUID:",
    //   subscriberUID
    // );

    clearInterval(window.interval);
    // console.log("[unsubscribeBars]: cleared");
  },
};
