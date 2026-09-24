"""悟空+八戒战斗帧：下载+镜像+抠底+合成GIF"""
import os
import urllib.request
from PIL import Image

# ============ 悟空帧URL ============
wukong_frames = {
    "idle_01": "https://aka.doubaocdn.com/s/y9dt470pxz",
    "idle_02": "https://aka.doubaocdn.com/s/8AyAnum7gY",
    "idle_03": "https://aka.doubaocdn.com/s/fZmPoRfZVd",
    "idle_04": "https://aka.doubaocdn.com/s/jQZs57Y4bO",
    "attack_01": "https://aka.doubaocdn.com/s/PjyUKMXFKA",
    "attack_02": "https://aka.doubaocdn.com/s/oDfwMokn1C",
    "attack_03": "https://aka.doubaocdn.com/s/GLq6CC3ChX",
    "attack_04": "https://aka.doubaocdn.com/s/VDjYvCbNdY",
    "attack_05": "https://aka.doubaocdn.com/s/mU1GVxkQP5",
    "attack_06": "https://aka.doubaocdn.com/s/DD4HMZlL7l",
    "hit_01": "https://aka.doubaocdn.com/s/EuXCbgUSWs",
    "hit_02": "https://aka.doubaocdn.com/s/cu2JFc6rx0",
    "hit_03": "https://aka.doubaocdn.com/s/EEH45mln4w",
    "dead_01": "https://aka.doubaocdn.com/s/TV9w8XTIQB",
    "dead_02": "https://aka.doubaocdn.com/s/ZRfj2WK13q",
    "dead_03": "https://aka.doubaocdn.com/s/MUUksOXUVD",
    "dead_04": "https://aka.doubaocdn.com/s/ASlLSW2xbs",
    "dead_05": "https://aka.doubaocdn.com/s/uRzrRoUO2I",
    "dead_06": "https://aka.doubaocdn.com/s/zc6oIryKpq",
}

# ============ 八戒帧URL ============
bajie_frames = {
    "idle_01": "https://aka.doubaocdn.com/s/XCakwWG9aD",
    "idle_02": "https://aka.doubaocdn.com/s/k4XEBuC3Jc",
    "idle_03": "https://aka.doubaocdn.com/s/PsyzSgMmLq",
    "idle_04": "https://aka.doubaocdn.com/s/cryBIQj4t9",
    "attack_01": "https://aka.doubaocdn.com/s/lryda9ZpfM",
    "attack_02": "https://aka.doubaocdn.com/s/penklZUrQM",
    "attack_03": "https://aka.doubaocdn.com/s/Z58T2EIZyO",
    "attack_04": "https://aka.doubaocdn.com/s/VBzE8tDUXC",
    "attack_05": "https://aka.doubaocdn.com/s/Pwu8Sm0gVs",
    "attack_06": "https://aka.doubaocdn.com/s/vdv8pBRnjS",
    "hit_01": "https://aka.doubaocdn.com/s/RvvJsaAnft",
    "hit_02": "https://aka.doubaocdn.com/s/tYHPZDSVbq",
    "hit_03": "https://aka.doubaocdn.com/s/XQ3u93KtJt",
    "dead_01": "https://aka.doubaocdn.com/s/5MIC2Tr3kW",
    "dead_02": "https://aka.doubaocdn.com/s/WJ6imcBroH",
    "dead_03": "https://aka.doubaocdn.com/s/kXGv9SGiav",
    "dead_04": "https://aka.doubaocdn.com/s/VyiZcV8xVI",
    "dead_05": "https://aka.doubaocdn.com/s/ohrebpGp6M",
    "dead_06": "https://aka.doubaocdn.com/s/bymDKS37J4",
}

BASE = r"D:\xiyou\demo\img\portraits\heroes"

def remove_white_bg(im, fuzz=25):
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        if r > 255 - fuzz and g > 255 - fuzz and b > 255 - fuzz:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, a))
    im.putdata(new_data)
    return im

def process_hero(name, frames_dict):
    out_dir = os.path.join(BASE, f"{name}_frames")
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. 下载
    print(f"\n=== {name}: 下载 ===")
    for fname, url in frames_dict.items():
        out = os.path.join(out_dir, f"{fname}.png")
        if os.path.exists(out) and os.path.getsize(out) > 10000:
            continue
        try:
            urllib.request.urlretrieve(url, out)
        except Exception as e:
            print(f"  失败: {fname} - {e}")
    print(f"  下载完成: {len(os.listdir(out_dir))} 文件")
    
    # 2. 水平镜像翻转
    print(f"=== {name}: 镜像翻转 ===")
    for f in os.listdir(out_dir):
        if f.endswith(".png") and "_transparent" not in f:
            p = os.path.join(out_dir, f)
            im = Image.open(p).convert("RGBA")
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
            im.save(p, "PNG")
    
    # 3. 抠底+合成GIF
    print(f"=== {name}: 抠底+合成GIF ===")
    groups = {
        "idle":   (["idle_01.png","idle_02.png","idle_03.png","idle_04.png"], 500),
        "attack": (["attack_01.png","attack_02.png","attack_03.png","attack_04.png","attack_05.png","attack_06.png"], 150),
        "hit":    (["hit_01.png","hit_02.png","hit_03.png"], 200),
        "dead":   (["dead_01.png","dead_02.png","dead_03.png","dead_04.png","dead_05.png","dead_06.png"], 300),
    }
    TARGET = (512, 512)
    
    for gname, (files, duration) in groups.items():
        imgs = []
        for f in files:
            p = os.path.join(out_dir, f)
            if not os.path.exists(p):
                print(f"  缺: {f}")
                continue
            im = Image.open(p).convert("RGBA")
            im = remove_white_bg(im, fuzz=25)
            im.thumbnail(TARGET, Image.LANCZOS)
            canvas = Image.new("RGBA", TARGET, (0,0,0,0))
            pos = ((TARGET[0]-im.width)//2, (TARGET[1]-im.height)//2)
            canvas.paste(im, pos, im)
            png_out = os.path.join(out_dir, f.replace(".png", "_transparent.png"))
            canvas.save(png_out, "PNG")
            p_im = canvas.convert("P", palette=Image.ADAPTIVE, colors=256)
            imgs.append(p_im)
        
        if imgs:
            gif_path = os.path.join(out_dir, f"{name}_{gname}.gif")
            imgs[0].save(gif_path, save_all=True, append_images=imgs[1:],
                         duration=duration, loop=0, disposal=2, transparency=0)
            sz = os.path.getsize(gif_path) // 1024
            print(f"  {gname}: {len(imgs)}帧, {sz}KB")

process_hero("wukong", wukong_frames)
process_hero("bajie", bajie_frames)
print("\n全部完成")
