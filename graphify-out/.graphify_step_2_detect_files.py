import json
from pathlib import Path
from graphify.detect import detect
result = detect(Path('.'))
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
files = result.get('files', {})
total_files = result.get('total_files', 0)
total_words = result.get('total_words', 0)
parts = [f"Corpus: {total_files} files · ~{total_words} words"]
for key, label in [('code','code'), ('document','docs'), ('paper','papers'), ('image','images'), ('video','video')]:
    n = len(files.get(key, []))
    if n:
        parts.append(f"  {label}:     {n} files")
print('\n'.join(parts))
