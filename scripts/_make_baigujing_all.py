"""白骨精5形态全套帧：下载+抠白底+统一调色板合成GIF"""
import os
import urllib.request
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\monsters"

forms = {
    "baigujing_girl": {
        "idle_01": "https://aka.doubaocdn.com/s/UHgZV4OPtn",
        "idle_02": "https://aka.doubaocdn.com/s/mqDBcGlRfq",
        "idle_03": "https://aka.doubaocdn.com/s/sVPkp8VRNz",
        "idle_04": "https://aka.doubaocdn.com/s/fNKGYrXWDz",
        "attack_01": "https://aka.doubaocdn.com/s/mv47DZoBZR",
        "attack_02": "https://aka.doubaocdn.com/s/10IxCYeVQ9",
        "attack_03": "https://aka.doubaocdn.com/s/oiAxGcQKvP",
        "attack_04": "https://aka.doubaocdn.com/s/9Wv0PzcKub",
        "attack_05": "https://aka.doubaocdn.com/s/XI2kVwfsAz",
        "attack_06": "https://aka.doubaocdn.com/s/FQnKU0WQp0",
        "hit_01": "https://aka.doubaocdn.com/s/ezIJssiDzQ",
        "hit_02": "https://aka.doubaocdn.com/s/aDkJONe8hl",
        "hit_03": "https://aka.doubaocdn.com/s/ywm7vBa0Gd",
        "dead_01": "https://aka.doubaocdn.com/s/D5Tgt9CR7d",
        "dead_02": "https://aka.doubaocdn.com/s/L73PwqldiX",
        "dead_03": "https://aka.doubaocdn.com/s/LMeFV1TWpe",
        "dead_04": "https://aka.doubaocdn.com/s/8pu06VVWVF",
        "dead_05": "https://aka.doubaocdn.com/s/PZ2cItiVjo",
        "dead_06": "https://aka.doubaocdn.com/s/oBUc23LKDU",
    },
    "baigujing_oldwoman": {
        "idle_01": "https://aka.doubaocdn.com/s/omChVz7NVp",
        "idle_02": "https://aka.doubaocdn.com/s/GjOLqtLd12",
        "idle_03": "https://aka.doubaocdn.com/s/zRDQdUTTuU",
        "idle_04": "https://aka.doubaocdn.com/s/SHJ72M8fIK",
        "attack_01": "https://aka.doubaocdn.com/s/1mRsUjXyW2",
        "attack_02": "https://aka.doubaocdn.com/s/rRpOcU0XoB",
        "attack_03": "https://aka.doubaocdn.com/s/eCBpx5Vd8G",
        "attack_04": "https://aka.doubaocdn.com/s/2uJBpttsmg",
        "attack_05": "https://aka.doubaocdn.com/s/RHJuHeNqVE",
        "attack_06": "https://aka.doubaocdn.com/s/UBOuxreJLQ",
        "hit_01": "https://aka.doubaocdn.com/s/wVUKsmVj7r",
        "hit_02": "https://aka.doubaocdn.com/s/sTVSXC7hrx",
        "hit_03": "https://aka.doubaocdn.com/s/GhQFgfviY5",
        "dead_01": "https://aka.doubaocdn.com/s/SoV9GEMFzV",
        "dead_02": "https://aka.doubaocdn.com/s/8MCqCZhpQp",
        "dead_03": "https://aka.doubaocdn.com/s/UDbaJ7d4p5",
        "dead_04": "https://aka.doubaocdn.com/s/1gY8uEVySP",
        "dead_05": "https://aka.doubaocdn.com/s/RDViTuvpX0",
        "dead_06": "https://aka.doubaocdn.com/s/etZfAjVtCP",
    },
    "baigujing_oldman": {
        "idle_01": "https://aka.doubaocdn.com/s/TcNUs0In3h",
        "idle_02": "https://aka.doubaocdn.com/s/pZGEIbgsOn",
        "idle_03": "https://aka.doubaocdn.com/s/IlkC2FHRWW",
        "idle_04": "https://aka.doubaocdn.com/s/lVUVlOvA8O",
        "attack_01": "https://aka.doubaocdn.com/s/vwKCwEEs4X",
        "attack_02": "https://aka.doubaocdn.com/s/JFI7RVVoeV",
        "attack_03": "https://aka.doubaocdn.com/s/wRq6aBFtu8",
        "attack_04": "https://aka.doubaocdn.com/s/a59yXfyJsh",
        "attack_05": "https://aka.doubaocdn.com/s/BXa9EW6aK4",
        "attack_06": "https://aka.doubaocdn.com/s/Ct1lmA9aRK",
        "hit_01": "https://aka.doubaocdn.com/s/fuypCBdeeu",
        "hit_02": "https://aka.doubaocdn.com/s/1cSarPuoO2",
        "hit_03": "https://aka.doubaocdn.com/s/BK1wiV8eKx",
        "dead_01": "https://aka.doubaocdn.com/s/IgRaClBh8e",
        "dead_02": "https://aka.doubaocdn.com/s/sKZbuLLELU",
        "dead_03": "https://aka.doubaocdn.com/s/HXpHbiJTWI",
        "dead_04": "https://aka.doubaocdn.com/s/x1rUqwK73m",
        "dead_05": "https://aka.doubaocdn.com/s/t0rPj2ylny",
        "dead_06": "https://aka.doubaocdn.com/s/TCDgEekCXb",
    },
    "baigujing_human": {
        "idle_01": "https://aka.doubaocdn.com/s/HXo5JKFq5b",
        "idle_02": "https://aka.doubaocdn.com/s/fcSQ2ZNdj2",
        "idle_03": "https://aka.doubaocdn.com/s/i5vE86qvxH",
        "idle_04": "https://aka.doubaocdn.com/s/k1Okc8IIcw",
        "attack_01": "https://aka.doubaocdn.com/s/7Ky1WCnVaL",
        "attack_02": "https://aka.doubaocdn.com/s/s0w0VTR9fx",
        "attack_03": "https://aka.doubaocdn.com/s/DNVbb0qqb3",
        "attack_04": "https://aka.doubaocdn.com/s/nJ2sOaQNGi",
        "attack_05": "https://aka.doubaocdn.com/s/iPm2Wy55Kh",
        "attack_06": "https://aka.doubaocdn.com/s/kn9IPbKLs3",
        "hit_01": "https://aka.doubaocdn.com/s/4LLWisIKrv",
        "hit_02": "https://aka.doubaocdn.com/s/dbHefeEfVh",
        "hit_03": "https://aka.doubaocdn.com/s/UHsnT3E3De",
        "dead_01": "https://aka.doubaocdn.com/s/VTvJTnRPKT",
        "dead_02": "https://aka.doubaocdn.com/s/sarIWBUSUB",
        "dead_03": "https://aka.doubaocdn.com/s/4V0Zlni2DE",
        "dead_04": "https://aka.doubaocdn.com/s/bPFgL4NNCe",
        "dead_05": "https://aka.doubaocdn.com/s/tYIVKBHpan",
        "dead_06": "https://aka.doubaocdn.com/s/DNoaoT2Zbg",
    },
    "baigujing_demon": {
        "idle_01": "https://aka.doubaocdn.com/s/n9Rdueb0TT",
        "idle_02": "https://aka.doubaocdn.com/s/2iYbWBNUqY",
        "idle_03": "https://aka.doubaocdn.com/s/3gMvk9n6od",
        "idle_04": "https://aka.doubaocdn.com/s/quCerAVevw",
        "attack_01": "https://aka.doubaocdn.com/s/OV5LqpUx2r",
        "attack_02": "https://aka.doubaocdn.com/s/xiPoXWBnCe",
        "attack_03": "https://aka.doubaocdn.com/s/xvrCoqh7Ol",
        "attack_04": "https://aka.doubaocdn.com/s/QVUiw9r4Uu",
        "attack_05": "https://aka.doubaocdn.com/s/V9BfLPwLv7",
        "attack_06": "https://aka.doubaocdn.com/s/JavA3dqins",
        "hit_01": "https://aka.doubaocdn.com/s/yLTAMPa64G",
        "hit_02": "https://aka.doubaocdn.com/s/Mdmjh6eOYF",
        "hit_03": "https://aka.doubaocdn.com/s/cBz2sjU8NO",
        "dead_01": "https://aka.doubaocdn.com/s/W5JS4KwEBW",
        "dead_02": "https://aka.doubaocdn.com/s/cIK8wNfOtB",
        "dead_03": "https://aka.doubaocdn.com/s/8SRg6ZiQCZ",
        "dead_04": "https://aka.doubaocdn.com/s/eKVTmEYug8",
        "dead_05": "https://aka.doubaocdn.com/s/aXqguHtJHB",
        "dead_06": "https://aka.doubaocdn.com/s/QWlOBSuiTs",
    },
}

TARGET = (512, 512)

def make_gif(frames_paths, out_path, duration):
    frames_rgba = []
    for p in frames_paths:
        if not os.path.exists(p):
            print(f"    缺: {os.path.basename(p)}")
            continue
        im = Image.open(p).convert("RGBA")
        datas = im.getdata()
        new_data = []
        for r, g, b, a in datas:
            if a < 128:
                new_data.append((255, 0, 255, 255))
            else:
                new_data.append((r, g, b, a))
        im.putdata(new_data)
        frames_rgba.append(im.convert("RGB"))
    if not frames_rgba:
        return
    w, h = frames_rgba[0].size
    strip = Image.new("RGB", (w, h * len(frames_rgba)))
    for i, fr in enumerate(frames_rgba):
        strip.paste(fr, (0, i * h))
    strip_q = strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    palette = strip_q.getpalette()
    trans_idx = 0
    for i in range(256):
        if palette[i*3]==255 and palette[i*3+1]==0 and palette[i*3+2]==255:
            trans_idx = i; break
    frames_p = [fr.quantize(palette=strip_q) for fr in frames_rgba]
    frames_p[0].save(out_path, save_all=True, append_images=frames_p[1:],
                     duration=duration, loop=0, disposal=2, transparency=trans_idx)
    sz = os.path.getsize(out_path) // 1024
    print(f"    -> {os.path.basename(out_path)}: {len(frames_p)}帧, {sz}KB")

for form_name, frames in forms.items():
    out_dir = os.path.join(BASE, form_name)
    os.makedirs(out_dir, exist_ok=True)
    print(f"\n=== {form_name} ===")

    # 下载
    print("  下载:")
    for fname, url in frames.items():
        out = os.path.join(out_dir, f"{fname}.png")
        if not os.path.exists(out):
            try:
                urllib.request.urlretrieve(url, out)
                print(f"    {fname}")
            except Exception as e:
                print(f"    失败 {fname}: {e}")

    # 抠白底+缩放
    print("  抠底:")
    for f in os.listdir(out_dir):
        if f.endswith(".png") and "_transparent" not in f:
            p = os.path.join(out_dir, f)
            im = Image.open(p).convert("RGBA")
            datas = im.getdata()
            new_data = []
            for r, g, b, a in datas:
                if r > 230 and g > 230 and b > 230:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append((r, g, b, a))
            im.putdata(new_data)
            im.thumbnail(TARGET, Image.LANCZOS)
            canvas = Image.new("RGBA", TARGET, (0,0,0,0))
            pos = ((TARGET[0]-im.width)//2, (TARGET[1]-im.height)//2)
            canvas.paste(im, pos, im)
            out_p = os.path.join(out_dir, f.replace(".png", "_transparent.png"))
            canvas.save(out_p, "PNG")

    # 合成GIF
    print("  GIF:")
    groups = {
        "idle":   ([f"idle_0{i}_transparent.png" for i in range(1,5)], 500),
        "attack": ([f"attack_0{i}_transparent.png" for i in range(1,7)], 150),
        "hit":    ([f"hit_0{i}_transparent.png" for i in range(1,4)], 200),
        "dead":   ([f"dead_0{i}_transparent.png" for i in range(1,7)], 300),
    }
    for gname, (files, dur) in groups.items():
        paths = [os.path.join(out_dir, f) for f in files]
        make_gif(paths, os.path.join(out_dir, f"{form_name}_{gname}.gif"), dur)

print("\n全部完成")
