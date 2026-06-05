import os, runpy, sys
os.environ['DATABASE_URL']='sqlite:///:memory:'
# ensure local package import works
sys.path.insert(0, 'quant_pipeline')
runpy.run_path('quant_pipeline/scripts/run_pipeline_log1p.py', run_name='__main__')
print('done')
