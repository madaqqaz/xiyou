import urllib.request
from PIL import Image
import os, sys
sys.path.insert(0, 'D:/xiyou/demo/scripts')
from _make_baigujing_cast_death import make_strip

os.chdir('D:/xiyou/demo')

# 红孩儿 cast
print('=== honghaier cast ===')
make_strip('honghaier', 'cast', [
    'https://aka.doubaocdn.com/s/Zi0KdN2wVV',
    'https://aka.doubaocdn.com/s/N09Bn1m6oF',
    'https://aka.doubaocdn.com/s/4Ud02YbeXZ',
    'https://aka.doubaocdn.com/s/KahJRQql2N',
    'https://aka.doubaocdn.com/s/hwkZPSYMan',
    'https://aka.doubaocdn.com/s/WXjzukuvrR',
])
# 红孩儿 death
print('=== honghaier death ===')
make_strip('honghaier', 'death', [
    'https://aka.doubaocdn.com/s/RbZUkM0vRk',
    'https://aka.doubaocdn.com/s/QmJVfyYaAA',
    'https://aka.doubaocdn.com/s/iyokELPdTN',
    'https://aka.doubaocdn.com/s/WMW77lYA3Y',
    'https://aka.doubaocdn.com/s/Luo6UvXwdt',
    'https://aka.doubaocdn.com/s/Azaat9WLWN',
])
print('DONE honghaier')
