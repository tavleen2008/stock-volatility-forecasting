import os, sys
os.environ['DATABASE_URL'] = 'sqlite:///./temp.db'
project_root = r'C:\Users\Divyansh Lalotra\OneDrive\Desktop\News-Sentiment Based Volatility Forecasting\stock-volatility-forecasting\quant_pipeline'
if project_root not in sys.path:
    sys.path.insert(0, project_root)
from quant_pipeline.scripts import volatility_diagnostics as vd
for t in vd.config.tickers:
    print('\n' + '='*60)
    vd.fit_and_report(t)
print('\nDiagnostics runner finished')
