import sys
sys.path.insert(0, 'D:/xiyou/demo/scripts')
from _make_baigujing_cast_death import make_strip
import os
os.chdir('D:/xiyou/demo')

print('=== huangpoguai cast ===')
make_strip('huangpoguai', 'cast', [
    'https://aka.doubaocdn.com/s/j5zhAZV1BI',
    'https://aka.doubaocdn.com/s/hNlDqbPZbP',
    'https://aka.doubaocdn.com/s/IIjLxrXKZc',
    'https://aka.doubaocdn.com/s/rgyfQBx97a',
    'https://aka.doubaocdn.com/s/ZsXdNlGW4H',
    'https://aka.doubaocdn.com/s/K04waW8qvC',
])
print('=== huangpoguai death ===')
make_strip('huangpoguai', 'death', [
    'https://aka.doubaocdn.com/s/LAJ9McTvtx',
    'https://aka.doubaocdn.com/s/mpyTc5f7gU',
    'https://aka.doubaocdn.com/s/lCUlIg4WnS',
    'https://aka.doubaocdn.com/s/6UdaTTxSPJ',
    'https://aka.doubaocdn.com/s/MAi84CPo3b',
    'https://aka.doubaocdn.com/s/Mq1gUSmBak',
])
print('DONE huangpoguai')
