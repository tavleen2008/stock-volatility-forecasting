import sys, runpy
sys.path.insert(0, 'quant_pipeline')
runpy.run_path('quant_pipeline/scripts/rebuild_and_inspect.py', run_name='__main__')
print('done')
