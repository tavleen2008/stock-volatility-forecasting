import os, sys, logging
os.environ['DATABASE_URL'] = 'sqlite:///./temp.db'
project_root = r'C:\Users\Divyansh Lalotra\OneDrive\Desktop\News-Sentiment Based Volatility Forecasting\stock-volatility-forecasting\quant_pipeline'
if project_root not in sys.path:
    sys.path.insert(0, project_root)
logging.basicConfig(level=logging.INFO)
print('Starting training pipeline')
from ml.pipelines import train_pipeline as tp
tp.main()
print('Training pipeline finished')
