import os
import re

dir_path = 'src'

replacements = [
    (r'\bbg-black\b(?!\/)', 'bg-slate-50 dark:bg-black'),
    (r'\btext-white\b(?!\/)', 'text-slate-900 dark:text-white'),
    (r'\btext-white/10\b', 'text-slate-300 dark:text-white/10'),
    (r'\btext-white/20\b', 'text-slate-400 dark:text-white/20'),
    (r'\btext-white/25\b', 'text-slate-500 dark:text-white/25'),
    (r'\btext-white/30\b', 'text-slate-500 dark:text-white/30'),
    (r'\btext-white/40\b', 'text-slate-600 dark:text-white/40'),
    (r'\btext-white/50\b', 'text-slate-600 dark:text-white/50'),
    (r'\btext-white/60\b', 'text-slate-700 dark:text-white/60'),
    (r'\btext-white/70\b', 'text-slate-700 dark:text-white/70'),
    (r'\btext-white/80\b', 'text-slate-800 dark:text-white/80'),
    (r'\btext-white/90\b', 'text-slate-900 dark:text-white/90'),
    (r'\bbg-white/5\b', 'bg-slate-100 dark:bg-white/5'),
    (r'\bbg-white/10\b', 'bg-slate-200 dark:bg-white/10'),
    (r'\bbg-white/20\b', 'bg-slate-300 dark:bg-white/20'),
    (r'\bbg-white/\[0\.02\]\b', 'bg-white shadow-sm dark:bg-white/[0.02] dark:shadow-none'),
    (r'\bbg-white/\[0\.04\]\b', 'bg-slate-50 dark:bg-white/[0.04]'),
    (r'\bhover:bg-white/\[0\.04\]\b', 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'),
    (r'\bbg-black/80\b', 'bg-white/80 dark:bg-black/80'),
    (r'\bbg-black/50\b', 'bg-white/50 dark:bg-black/50'),
    (r'\bbg-black/60\b', 'bg-slate-900/40 dark:bg-black/60'),
    (r'\bbg-black/40\b', 'bg-slate-100 dark:bg-black/40'),
    (r'\bbg-black/30\b', 'bg-slate-50 dark:bg-black/30'),
    (r'\bborder-white/5\b', 'border-slate-200 dark:border-white/5'),
    (r'\bborder-white/10\b', 'border-slate-200 dark:border-white/10'),
    (r'\bborder-white/20\b', 'border-slate-300 dark:border-white/20'),
    (r'\bborder-white/30\b', 'border-slate-400 dark:border-white/30'),
    (r'\bhover:bg-white/5\b', 'hover:bg-slate-100 dark:hover:bg-white/5'),
    (r'\bhover:bg-white/10\b', 'hover:bg-slate-200 dark:hover:bg-white/10'),
    (r'\bhover:text-white\b(?!\/)', 'hover:text-slate-900 dark:hover:text-white'),
]

for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            for pattern, rep in replacements:
                content = re.sub(pattern, rep, content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
print('Done')