import sys
sys.path.insert(0, 'D:/xiyou/demo/scripts')
from _make_baigujing_cast_death import make_strip
import os
os.chdir('D:/xiyou/demo')

print('=== qingniujing cast ===')
make_strip('qingniujing', 'cast', [
    'https://aka.doubaocdn.com/s/tGOzsIYldo',
    'https://aka.doubaocdn.com/s/SWU1ZKNLqp',
    'https://aka.doubaocdn.com/s/EFcrJojNZn',
    'https://aka.doubaocdn.com/s/HBWXeoYbMm',
    'https://aka.doubaocdn.com/s/MyW0T7UjNO',
    'https://aka.doubaocdn.com/s/ijihAEtx6D',
])
print('=== qingniujing death ===')
make_strip('qingniujing', 'death', [
    'https://aka.doubaocdn.com/s/Wc8MElEZGs',
    'https://aka.doubaocdn.com/s/hV8cbyfK52',
    'https://aka.doubaocdn.com/s/xXd0qz8LoI',
    'https://aka.doubaocdn.com/s/TUthmfBVW8',
    'https://aka.doubaocdn.com/s/hjLSeTmADw',
    'https://aka.doubaocdn.com/s/XVQGDN7a1Z',
])
print('DONE qingniujing')
