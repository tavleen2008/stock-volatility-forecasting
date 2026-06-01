import os, runpy, sys
os.environ['DATABASE_URL']='sqlite:///:memory:'
sys.path.insert(0,'quant_pipeline')
runpy.run_path('quant_pipeline/scripts/target_experiment.py', run_name='__main__')
print('done')
