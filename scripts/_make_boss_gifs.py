#!/usr/bin/env python3
"""合成 Boss 动作 GIF 动画"""
import os
from PIL import Image

BOSS_DIR = r"D:\xiyou\demo\img\portraits\bosses"

# 每个 Boss 的帧序列定义
BOSS_SEQUENCES = {
    "liuhong": {
        "idle": ["boss_liuhong_idle.webp", "boss_liuhong_idle2.webp", "boss_liuhong_idle3.webp", "boss_liuhong_idle4.webp"],
        "attack": ["boss_liuhong_atk1.webp", "boss_liuhong_atk2.webp", "boss_liuhong_atk3.webp", "boss_liuhong_atk4.webp", "boss_liuhong_atk5.webp"],
        "hit": ["boss_liuhong_hit.webp", "boss_liuhong_hit2.webp", "boss_liuhong_hit3.webp"],
        "dead": ["boss_liuhong_dead1.webp", "boss_liuhong_dead2.webp", "boss_liuhong_dead3.webp", "boss_liuhong_dead4.webp", "boss_liuhong_dead5.webp", "boss_liuhong_dead6.webp"],
    },
    "yinjiangjun": {
        "idle": ["boss_yinjiangjun_idle.webp", "boss_yinjiangjun_idle2.webp", "boss_yinjiangjun_idle3.webp", "boss_yinjiangjun_idle4.webp"],
        "attack": ["boss_yinjiangjun_atk1.webp", "boss_yinjiangjun_atk2.webp", "boss_yinjiangjun_atk3.webp", "boss_yinjiangjun_atk4.webp", "boss_yinjiangjun_atk5.webp"],
        "hit": ["boss_yinjiangjun_hit.webp", "boss_yinjiangjun_hit2.webp", "boss_yinjiangjun_hit3.webp"],
        "dead": ["boss_yinjiangjun_dead.webp", "boss_yinjiangjun_dead2.webp", "boss_yinjiangjun_dead3.webp", "boss_yinjiangjun_dead4.webp", "boss_yinjiangjun_dead5.webp"],
    },
    "bailongma": {
        "idle": ["boss_bailongma_idle.webp", "boss_bailongma_idle2.webp", "boss_bailongma_idle3.webp", "boss_bailongma_idle4.webp"],
        "attack": ["boss_bailongma_atk.webp", "boss_bailongma_atk2.webp", "boss_bailongma_atk3.webp", "boss_bailongma_atk4.webp"],
        "hit": ["boss_bailongma_hit.webp", "boss_bailongma_hit2.webp", "boss_bailongma_hit3.webp"],
        "dead": ["boss_bailongma_dead.webp", "boss_bailongma_dead2.webp", "boss_bailongma_dead3.webp", "boss_bailongma_dead4.webp", "boss_bailongma_dead5.webp"],
    },
    "huxianfeng": {
        "idle": ["boss_huxianfeng_idle.webp", "boss_huxianfeng_idle2.webp", "boss_huxianfeng_idle3.webp", "boss_huxianfeng_idle4.webp"],
        "attack": ["boss_huxianfeng_atk1.webp", "boss_huxianfeng_atk2.webp", "boss_huxianfeng_atk3.webp", "boss_huxianfeng_atk4.webp", "boss_huxianfeng_atk5.webp"],
        "hit": ["boss_huxianfeng_hit.webp", "boss_huxianfeng_hit2.webp", "boss_huxianfeng_hit3.webp"],
        "dead": ["boss_huxianfeng_dead.webp", "boss_huxianfeng_dead2.webp", "boss_huxianfeng_dead3.webp", "boss_huxianfeng_dead4.webp", "boss_huxianfeng_dead5.webp"],
    },
    "huangfeng": {
        "idle": ["boss_huangfeng_phase1_idle.webp"],  # 已有序列帧，跳过
        "attack": ["boss_huangfeng_phase1_atk_new1.webp", "boss_huangfeng_phase1_atk_new2.webp", "boss_huangfeng_phase1_atk3.webp", "boss_huangfeng_phase1_atk4.webp", "boss_huangfeng_phase1_atk5.webp"],
        "hit": ["boss_huangfeng_phase1_hit_new.webp", "boss_huangfeng_phase1_hit2.webp", "boss_huangfeng_phase1_hit3.webp"],
        "dead": ["boss_huangfeng_phase1_dead.webp", "boss_huangfeng_phase1_dead2.webp", "boss_huangfeng_phase1_dead3.webp", "boss_huangfeng_phase1_dead4.webp", "boss_huangfeng_phase1_dead5.webp", "boss_huangfeng_phase1_dead6.webp"],
    },
}

# 动画帧间隔（毫秒）
FRAME_DURATION = {
    "idle": 500,      # 待机慢
    "attack": 150,    # 攻击快
    "hit": 200,       # 受击中速
    "dead": 300,      # 死亡中慢
}

def make_gif(boss_name, action, frames):
    """合成单个动作 GIF"""
    images = []
    for fname in frames:
        fpath = os.path.join(BOSS_DIR, fname)
        if not os.path.exists(fpath):
            print(f"  [跳过] 找不到: {fname}")
            continue
        img = Image.open(fpath).convert("RGBA")
        # 统一尺寸到 512x512
        img = img.resize((512, 512), Image.LANCZOS)
        images.append(img)

    if len(images) < 2:
        print(f"  [跳过] {boss_name}/{action}: 帧数不足 ({len(images)})")
        return

    # 合成 GIF（白底，RGBA -> RGB）
    gif_frames = []
    for img in images:
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        gif_frames.append(bg)

    out_path = os.path.join(BOSS_DIR, f"boss_{boss_name}_{action}.gif")
    duration = FRAME_DURATION.get(action, 300)
    gif_frames[0].save(
        out_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=duration,
        loop=0,
        disposal=2,
    )
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  [完成] {boss_name}/{action}.gif ({len(images)}帧, {size_kb:.0f}KB)")

# 主流程
print("=== 开始合成 Boss 动作 GIF ===\n")
for boss_name, actions in BOSS_SEQUENCES.items():
    print(f"\n[{boss_name}]")
    for action, frames in actions.items():
        if action == "idle" and len(frames) == 1:
            print(f"  [跳过] {boss_name}/idle: 已有序列帧")
            continue
        make_gif(boss_name, action, frames)

print("\n=== 全部完成 ===")
