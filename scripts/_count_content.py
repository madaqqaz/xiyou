# -*- coding: utf-8 -*-
import re, io, os
B = "D:/xiyou/demo/js/"
files = []
for root, dirs, fs in os.walk(B):
    for f in fs:
        if f.endswith('.js'):
            files.append(os.path.join(root, f).replace(os.sep, '/'))

def find_file(sub):
    return [f for f in files if f.lower().endswith(sub.lower())]

pats = {
    'end_ 结局': "id: 'end_",
    'ENDINGS 定义': r"ENDINGS\s*=",
    'computeEnding': r"computeEnding\s*=",
    'ENDINGS_CG': r"ENDINGS_CG\s*=",
    'hidden: true 职业': "hidden: true",
    'ach_ 成就': "id: 'ach_",
    'ni_ 逆兽宠物': "id: 'ni_",
    'eq_ 装备': "id: 'eq_",
    'fa_ 法宝': "id: 'fa_",
    'tr_ 法宝': "id: 'tr_",
    '敌人 id': r"^\s{2}id:\s*'",
    'TRIAL_LIB 数字难': r"^\s*\d+:\s*\{",
    'tiers: 劫印词条': "tiers:",
    'su_ 渡经': "id: 'su_full_",
    'ni_sutra 逆经': "id: 'ni_sutra_",
    'hero 定义': r"^\s{2}(wukong|tangseng|bajie|shaseng|xiaobailong):",
}
for name, pat in pats.items():
    hits = {}
    for f in files:
        try:
            t = io.open(f, encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        n = len(re.findall(pat, t, re.M))
        if n:
            hits[os.path.basename(f)] = n
    tot = sum(hits.values())
    top = sorted(hits.items(), key=lambda x: -x[1])[:4]
    print("%-20s 总=%-6s %s" % (name, tot, top))
