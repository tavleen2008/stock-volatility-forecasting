import os, sys, logging
os.environ['DATABASE_URL'] = os.getenv('DATABASE_URL', os.getenv('DATABASE_URL'))
project_root = r'C:\Users\Divyansh Lalotra\OneDrive\Desktop\News-Sentiment Based Volatility Forecasting\stock-volatility-forecasting\quant_pipeline'
if project_root not in sys.path:
    sys.path.insert(0, project_root)
logging.basicConfig(level=logging.INFO)
print('Starting DB news ingestion pipeline')
from scripts import db_news_pipeline as dbp
dbp.run_main()
print('DB news ingestion pipeline finished')
