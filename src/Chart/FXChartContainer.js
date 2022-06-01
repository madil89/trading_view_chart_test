import React, { useState } from "react";
import "./index.css";
import { widget } from "./charting_library/charting_library.min";
import api from "./api/index";
function FXChartContainer() {

  const [selectedSymbol] = useState("EUR/USD");
  const [chartProps] = useState({
    symbol: "EUR/JPY",
    interval: "1D",
    containerId: "tv_chart_container",
    datafeedUrl: "https://demo_feed.tradingview.com",
    libraryPath: "/charting_library/",
    chartsStorageApiVersion: "1.1",
    clientId: "tradingview.com",
    userId: "user.access",
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
  });
  const [tvWidgetRef, setTvWidgetRef] = useState(null);

  function getLanguageFromURL() {
    const regex = new RegExp("[\\?&]lang=([^&#]*)");
    const results = regex.exec(window.location.search);
    return results === null
      ? null
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  const loadChart = () => {
    const widgetOptions = {
      symbol: selectedSymbol, //this.props.symbol,
      // BEWARE: no trailing slash is expected in feed URL
      datafeed: api, //new window.Datafeeds.UDFCompatibleDatafeed(this.props.datafeedUrl),
      interval: chartProps.interval,
      container_id: chartProps.containerId,
      library_path: chartProps.libraryPath,

      locale: getLanguageFromURL() || "en",
      disabled_features: [
        "header_saveload",
        "header_compare",
        "header_symbol_search",
      ],
      enabled_features: ["study_templates"],
      charts_storage_url: chartProps.chartsStorageUrl,
      // save_load_adapter: save_load_adapter,
      charts_storage_api_version: chartProps.chartsStorageApiVersion,
      client_id: chartProps.clientId,
      user_id: chartProps.userId,
      fullscreen: chartProps.fullscreen,
      autosize: chartProps.autosize,
      studies_overrides: chartProps.studiesOverrides,
    };
    const tvWidget = new widget(widgetOptions);
    setTvWidgetRef(tvWidget);
  };

  React.useEffect(() => {
    loadChart();
    /////////////////////
    return function cleanup() {
      if (tvWidgetRef !== null) {
        tvWidgetRef.remove();
        setTvWidgetRef(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id={chartProps.containerId}
      className={"TVChartContainer"}
      style={{ height: "calc(100vh - 124px)" }}
    />
  );
}

export default FXChartContainer;
