import sys
sys.path.insert(0, 'D:/xiyou/demo/scripts')
from _make_baigujing_cast_death import make_strip
import os
os.chdir('D:/xiyou/demo')

print('=== mob hit ===')
make_strip('mob', 'hit', [
    'https://aka.doubaocdn.com/s/6RoXaXwa34',
    'https://aka.doubaocdn.com/s/GvHZYfwXLk',
    'https://aka.doubaocdn.com/s/kquH2J3uWu',
    'https://aka.doubaocdn.com/s/QATGW2RG0p',
    'https://aka.doubaocdn.com/s/tIMdLCvyIU',
    'https://aka.doubaocdn.com/s/EVvFVQiXxL',
])
print('DONE mob')
