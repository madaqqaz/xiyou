import sys
sys.path.insert(0, 'D:/xiyou/demo/scripts')
from _make_baigujing_cast_death import make_strip
import os
os.chdir('D:/xiyou/demo')

print('=== huli cast ===')
make_strip('huli', 'cast', [
    'https://aka.doubaocdn.com/s/sfgMiuSzGV',
    'https://aka.doubaocdn.com/s/X0KtaXIuky',
    'https://aka.doubaocdn.com/s/oUL5dgoSff',
    'https://aka.doubaocdn.com/s/KFmbeXOadH',
    'https://aka.doubaocdn.com/s/kmuskhMgm8',
    'https://aka.doubaocdn.com/s/jhJiMd5Cq9',
])
print('=== huli death ===')
make_strip('huli', 'death', [
    'https://aka.doubaocdn.com/s/l3F35VSvom',
    'https://aka.doubaocdn.com/s/BqqAzEQf5u',
    'https://aka.doubaocdn.com/s/6zFPmzZnxo',
    'https://aka.doubaocdn.com/s/R12aQ7OiGX',
    'https://aka.doubaocdn.com/s/jIECIromyh',
    'https://aka.doubaocdn.com/s/UHDxyF7bVS',
])
print('DONE huli')
