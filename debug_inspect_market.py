from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.data.data_config import DataConfig

config = DataConfig()

ticker = config.tickers[0]
print('Inspecting', ticker)
market = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
print('Columns:', market.columns.tolist())
print('Index type:', type(market.index))
print('Sample rows:')
print(market.head().to_string())
try:
    rv = compute_realized_variance(market)
    print('Computed rv head:')
    print(rv.head().to_string())
except Exception as e:
    print('compute_realized_variance error:', e)
