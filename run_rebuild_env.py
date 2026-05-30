import os, runpy, sys
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
# Ensure quant_pipeline is on path
sys.path.insert(0, 'quant_pipeline')
runpy.run_path('quant_pipeline/scripts/rebuild_and_inspect.py', run_name='__main__')
print('done')
