import urllib.request
from PIL import Image
import os, sys

def smart_remove_bg(img):
    img = img.convert('RGBA')
    w, h = img.size
    pixels = img.load()
    corners = [pixels[0,0], pixels[w-1,0], pixels[0,h-1], pixels[w-1,h-1]]
    avg_b = sum(sum(c[:3])/3 for c in corners) / 4
    if avg_b > 200:
        for y in range(h):
            for x in range(w):
                r,g,b,a = pixels[x,y]
                if r > 235 and g > 235 and b > 235:
                    pixels[x,y] = (r,g,b,0)
    elif avg_b < 30:
        for y in range(h):
            for x in range(w):
                r,g,b,a = pixels[x,y]
                if r < 25 and g < 25 and b < 25:
                    pixels[x,y] = (r,g,b,0)
    else:
        for y in range(h):
            for x in range(w):
                r,g,b,a = pixels[x,y]
                if r > 240 and g > 240 and b > 240:
                    pixels[x,y] = (r,g,b,0)
    return img

def make_strip(boss, anim, urls):
    out_dir = f'img/portraits/foe/_{boss}_frames'
    os.makedirs(out_dir, exist_ok=True)
    frames = []
    for i, url in enumerate(urls):
        raw_path = f'{out_dir}/{anim}_{i+1:02d}_raw.png'
        try:
            urllib.request.urlretrieve(url, raw_path)
        except Exception as e:
            print(f'  ERROR downloading {anim}_{i+1}: {e}')
            continue
        img = Image.open(raw_path)
        img = smart_remove_bg(img)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        w, h = img.size
        new_h = 512
        new_w = int(w * new_h / h)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        img.save(f'{out_dir}/{anim}_{i+1:02d}_transparent.png', 'PNG')
        frames.append(img)
        print(f'  {boss} {anim}_{i+1:02d}: {new_w}x{new_h}')
    if not frames:
        print(f'  {boss} {anim}: NO FRAMES!')
        return
    max_w = max(f.width for f in frames)
    max_h = max(f.height for f in frames)
    strip = Image.new('RGBA', (max_w * len(frames), max_h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        x = i * max_w + (max_w - f.width) // 2
        y = max_h - f.height
        strip.paste(f, (x, y), f)
    strip_path = f'img/portraits/foe/{boss}_combat_{anim}_strip.webp'
    strip.save(strip_path, 'WEBP', quality=85)
    print(f'  {boss} {anim} strip saved: {strip.width}x{strip.height}')

if __name__ == '__main__':
    os.chdir('D:/xiyou/demo')
    # 白骨夫人 cast
    print('=== baigujing cast ===')
    make_strip('baigujing', 'cast', [
        'https://aka.doubaocdn.com/s/RTUagMw92s',
        'https://aka.doubaocdn.com/s/wuVvIl0Vr0',
        'https://aka.doubaocdn.com/s/GQ5Ca3aGg5',
        'https://aka.doubaocdn.com/s/uwugvWFUUG',
        'https://aka.doubaocdn.com/s/DOMggV8M70',
        'https://aka.doubaocdn.com/s/bZHakAQc0X',
    ])
    # 白骨夫人 death
    print('=== baigujing death ===')
    make_strip('baigujing', 'death', [
        'https://aka.doubaocdn.com/s/8zQSGj5NbG',
        'https://aka.doubaocdn.com/s/6CPO6O2LUV',
        'https://aka.doubaocdn.com/s/YHoqVkWV2P',
        'https://aka.doubaocdn.com/s/BZe5YMaXks',
        'https://aka.doubaocdn.com/s/aqMZZYMP0u',
        'https://aka.doubaocdn.com/s/RjYLXFosnJ',
    ])
    print('DONE')
