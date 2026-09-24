import sys
sys.path.insert(0, 'D:/xiyou/demo/scripts')
from _make_baigujing_cast_death import make_strip
import os
os.chdir('D:/xiyou/demo')

print('=== huangshijing cast ===')
make_strip('huangshijing', 'cast', [
    'https://aka.doubaocdn.com/s/enkkK15fB1',
    'https://aka.doubaocdn.com/s/zuBvibX5ng',
    'https://aka.doubaocdn.com/s/WaDLfIhqPO',
    'https://aka.doubaocdn.com/s/KibtCvV4i1',
    'https://aka.doubaocdn.com/s/PhojyM6ZgA',
    'https://aka.doubaocdn.com/s/UnL5nhmkDf',
])
print('=== huangshijing death ===')
make_strip('huangshijing', 'death', [
    'https://aka.doubaocdn.com/s/PMYyvSmUEa',
    'https://aka.doubaocdn.com/s/KdGym2nJGy',
    'https://aka.doubaocdn.com/s/FXjl2V5LQ0',
    'https://aka.doubaocdn.com/s/zeqZ5XGDQK',
    'https://aka.doubaocdn.com/s/Wn0NpC7Lys',
    'https://aka.doubaocdn.com/s/Nk4N2MXxEH',
])
print('DONE huangshijing')
