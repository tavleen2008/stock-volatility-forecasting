import os, sys
os.environ.setdefault('DATABASE_URL', 'sqlite:///./temp.db')
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'quant_pipeline'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
print('Starting generate_plots')
from scripts import generate_plots as gp
gp.main()
print('Finished generate_plots')
