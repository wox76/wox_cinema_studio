import os
import glob
import json
import logging
import re
import time
import torch
import numpy as np
from PIL import Image
from aiohttp import web
from server import PromptServer
import folder_paths

from .api_clients.z_image_client import ZImageClient
from .api_clients.krea_client import KreaClient
from .api_clients.minimax_client import MinimaxClient

logger = logging.getLogger("WOXCinemaStudio")

# Directory di output per WOX Cinema Studio
WOX_OUTPUT_DIR = os.path.join(folder_paths.get_output_directory(), "wox_cinema")
os.makedirs(WOX_OUTPUT_DIR, exist_ok=True)

class WOXCinemaStudioNode:
    """
    WOX Cinema Studio Node for ComfyUI.
    Emulates the cinematic AI Generation interface with Z-Image Turbo for images and Minimax H3 for videos.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True, "default": "A cinematic shot of a cyberpunk city street with neon lights reflecting in puddles, 8k resolution, ultra detailed"}),
                "mode": (["Video (Minimax H3)", "Image (Z-Image Turbo)", "Image (Krea 2)"], {"default": "Video (Minimax H3)"}),
                "film_setup": (["General", "NOIR", "Comedy", "Horror", "Action", "Epic", "Drama", "Auto", "Cinematic 35mm", "IMAX 70mm", "Vintage Super 8", "Anime Style", "Hyperrealistic 8k", "Noir Classic"], {"default": "General"}),
                "camera": (["Auto", "Static Tripod", "Pan Left to Right", "Tilt Up", "Slow Zoom In", "Drone FPV", "360 Orbit", "Handheld Shake"], {"default": "Auto"}),
                "color_palette": (["Auto", "Neon Rain at Midnight", "Home Is the Next Gas Station", "The Crimson Ballet", "The Morning After Rain", "Turquoise Mirage", "Yellow Room", "Teal & Orange", "Cyberpunk Neon", "B&W Monochrome", "Warm Sunset", "Cool Moonlight", "Pastel Aesthetic"], {"default": "Auto"}),
                "lighting": (["Auto", "Studio Softbox", "Golden Hour", "Dramatic Rim Light", "Volumetric Fog Light", "Cyber Neon Glow", "Low Key Dark"], {"default": "Auto"}),
                "aspect_ratio": (["16:9", "9:16", "1:1", "21:9", "4:3"], {"default": "16:9"}),
                "resolution": (["1080p", "720p", "480p", "4k"], {"default": "1080p"}),
                "duration": ([5, 10], {"default": 5}),
                "audio": (["On", "Off"], {"default": "On"}),
                "variations": ([1, 2, 4], {"default": 1}),
            },
            "optional": {
                "reference_image": ("IMAGE",),
                "z_image_api_key": ("STRING", {"default": ""}),
                "krea_api_key": ("STRING", {"default": ""}),
                "minimax_api_key": ("STRING", {"default": ""}),
                "negative_prompt": ("STRING", {"multiline": True, "default": "low quality, blurry, distorted, watermarks"}),
            }
        }

    OUTPUT_NODE = False
    RETURN_TYPES = ("IMAGE", "VHS_FILENAMES", "STRING")
    RETURN_NAMES = ("IMAGE", "VIDEO_FILENAMES", "PROMPT_OUT")
    FUNCTION = "generate"
    CATEGORY = "WOX Cinema Studio"
    SEARCH_ALIASES = ["wox", "wox cinema", "wox cinema studio", "higgsfield", "z-image", "z_image", "zimage", "krea", "minimax", "cinema studio"]

    def generate(self, prompt, mode, film_setup, camera, color_palette, lighting, aspect_ratio, resolution, duration, audio, variations, reference_image=None, z_image_api_key="", krea_api_key="", minimax_api_key="", negative_prompt=""):
        logger.info(f"WOXCinemaStudio: Avvio generazione mode='{mode}' | prompt='{prompt[:40]}...'")

        # Parsing width and height based on aspect ratio
        w, h = 1280, 720
        if aspect_ratio == "16:9":
            if resolution == "4k": w, h = (3840, 2160)
            elif resolution == "1080p": w, h = (1920, 1080)
            elif resolution == "480p": w, h = (854, 480)
            else: w, h = (1280, 720)
        elif aspect_ratio == "9:16":
            if resolution == "4k": w, h = (2160, 3840)
            elif resolution == "1080p": w, h = (1080, 1920)
            elif resolution == "480p": w, h = (480, 854)
            else: w, h = (720, 1280)
        elif aspect_ratio == "1:1":
            if resolution == "480p": w, h = (512, 512)
            else: w, h = (1024, 1024)
        elif aspect_ratio == "21:9":
            if resolution == "1080p": w, h = (2560, 1080)
            elif resolution == "480p": w, h = (1120, 480)
            else: w, h = (1680, 720)

        # Style compilation
        film_descriptions = {
            "General": "Film look: Cinematic 35mm practical photography, natural balanced lighting, shallow depth of field, realistic live-action film texture, premium studio grading",
            "Cinematic 35mm": "Film look: Kodak 35mm motion picture film stock, shallow depth of field, natural organic halation, authentic celluloid texture",
            "IMAX 70mm": "Film look: Shot on IMAX 70mm cameras, extreme sharpness, breathtaking dynamic range, majestic scale, pristine visual clarity",
            "NOIR": "Film look: Film Noir aesthetic, deep dramatic shadows, high contrast chiaroscuro lighting, moody monochrome tone, vintage detective texture, cinematic grain",
            "Noir Classic": "Film look: Classic 1940s Film Noir, deep Venetian blind shadows, dramatic chiaroscuro contrast, authentic monochrome celluloid texture",
            "Action": "Film look: High-octane blockbuster action movie style, intense dynamic contrast, kinetic visual texture, subtle motion blur, anamorphic lens flare, gritty grading",
            "Horror": "Film look: Dark horror movie aesthetic, eerie desaturated tones, deep unsettling shadows, volumetric mist, creepy suspenseful atmosphere, tense dark grading",
            "Comedy": "Film look: Bright vibrant comedy film aesthetic, warm high-key lighting, crisp framing, vivid colors, playful cinematic atmosphere",
            "Epic": "Film look: Grand cinematic epic scale, IMAX 70mm aesthetic, sweeping majestic lighting, rich volumetric haze, breathtaking wide scope, dramatic heroic contrast",
            "Drama": "Film look: Intimate prestige drama cinema style, soft naturalistic lighting, subtle film grain, emotional shallow focus, realistic nuanced palette, character-focused mood",
            "Vintage Super 8": "Film look: Vintage Super 8mm retro film stock, warm nostalgic tones, charming film grain, subtle light leaks, retro 1970s color palette",
            "Anime Style": "Film look: High-end Makoto Shinkai anime aesthetic, lush vibrant lighting, painterly background textures, beautiful particle effects",
            "Hyperrealistic 8k": "Film look: Hyperrealistic 8k digital cinematography, razor-sharp details, lifelike micro-textures, photorealistic rendering"
        }

        style_elements = []
        if film_setup in film_descriptions:
            style_elements.append(film_descriptions[film_setup])
        elif film_setup != "Auto":
            style_elements.append(f"Film setup: {film_setup}")

        if camera != "Auto": style_elements.append(f"Camera motion: {camera}")
        if color_palette != "Auto": style_elements.append(f"Palette: {color_palette}")
        if lighting != "Auto": style_elements.append(f"Lighting: {lighting}")

        enhanced_prompt = prompt
        if style_elements:
            enhanced_prompt = f"{prompt}\n\n" + ". ".join(style_elements)

        video_path = None
        images_tensor = None

        if "Image" in mode:
            # Z-Image Turbo generation
            api_key = z_image_api_key or krea_api_key
            client = ZImageClient(api_key=api_key)
            pil_images = client.generate_image(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                width=w,
                height=h,
                style=film_setup,
                num_images=variations
            )
            tensor_list = []
            ref_dir = os.path.join(folder_paths.get_input_directory(), "woxcinema")
            os.makedirs(ref_dir, exist_ok=True)
            meta_path = os.path.join(ref_dir, "metadata.json")
            meta = {}
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                except Exception:
                    pass

            for i, img in enumerate(pil_images):
                np_img = np.array(img).astype(np.float32) / 255.0
                tensor_list.append(torch.from_numpy(np_img))
                try:
                    img_fn = f"Z_Image_Turbo_{int(time.time())}_{i+1}.png"
                    img_out_path = os.path.join(WOX_OUTPUT_DIR, img_fn)
                    img.save(img_out_path)
                    
                    # Copia in input/woxcinema per renderla subito disponibile come Reference
                    ref_copy_path = os.path.join(ref_dir, img_fn)
                    img.save(ref_copy_path)
                    
                    clean_tag = f"@zimage_{int(time.time())}_{i+1}"
                    meta[img_fn] = {
                        "tag": clean_tag,
                        "original_name": img_fn,
                        "time": time.time(),
                        "category": "Generations",
                        "prompt": prompt
                    }
                    with open(meta_path, "w", encoding="utf-8") as f:
                        json.dump(meta, f, indent=2, ensure_ascii=False)
                        
                    PromptServer.instance.send_sync("wox_cinema_image_generated", {
                        "image_path": img_out_path,
                        "filename": img_fn,
                        "subfolder": "wox_cinema",
                        "url": f"/view?filename={img_fn}&subfolder=woxcinema&type=input",
                        "tag": clean_tag,
                        "prompt": prompt
                    })
                except Exception as save_err:
                    logger.warning(f"Errore salvataggio immagine generata: {save_err}")

            images_tensor = torch.stack(tensor_list, dim=0) if tensor_list else torch.zeros((1, h, w, 3), dtype=torch.float32)
            video_files = ([],)
        else:
            # Minimax H3 Video generation (Local ComfyUI native pipeline handles generation when offline/local)
            if minimax_api_key and minimax_api_key.strip():
                client = MinimaxClient(api_key=minimax_api_key)
                video_path = client.generate_video(
                    prompt=enhanced_prompt,
                    model="video-01",
                    camera=camera,
                    lighting=lighting,
                    duration=duration,
                    aspect_ratio=aspect_ratio,
                    output_dir=WOX_OUTPUT_DIR
                )
                
                # Read all frames from video into images tensor (N, H, W, 3)
                frames_list = []
                try:
                    import cv2
                    cap = cv2.VideoCapture(video_path)
                    while True:
                        ret, frame = cap.read()
                        if not ret:
                            break
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
                        frames_list.append(torch.from_numpy(frame_rgb))
                    cap.release()
                except Exception as e:
                    logger.warning(f"Failed to read frames from video: {e}")

                if frames_list:
                    images_tensor = torch.stack(frames_list, dim=0)
                else:
                    images_tensor = torch.zeros((1, h, w, 3), dtype=torch.float32)

                video_files = ([video_path],)

                try:
                    PromptServer.instance.send_sync("wox_cinema_video_generated", {
                        "video_path": video_path,
                        "filename": os.path.basename(video_path),
                        "prompt": prompt
                    })
                except Exception:
                    pass
            else:
                images_tensor = torch.zeros((1, h, w, 3), dtype=torch.float32)
                video_files = ([],)

        return (images_tensor, video_files, enhanced_prompt)


# ==============================================================================
# Server API Routes for WOX Cinema Studio
# ==============================================================================
try:
    if hasattr(PromptServer, "instance") and PromptServer.instance is not None:
        routes = PromptServer.instance.routes

        @routes.get("/wox_cinema/recent_videos")
        @routes.get("/api/wox_cinema/recent_videos")
        async def get_recent_videos(request):
            """Restituisce gli ultimi video generati prendendoli direttamente da output/video."""
            out_dir = folder_paths.get_output_directory()
            
            # Apertura cartella se richiesta via query param
            if request.query.get("open_folder") == "1" or request.query.get("action") == "open_folder":
                video_dir = os.path.join(out_dir, "video")
                target = video_dir if os.path.exists(video_dir) else out_dir
                import subprocess
                import sys
                try:
                    if os.name == 'nt':
                        subprocess.Popen(f'explorer "{os.path.normpath(target)}"', shell=True)
                    elif sys.platform == 'darwin':
                        subprocess.Popen(['open', target])
                    else:
                        subprocess.Popen(['xdg-open', target])
                    return web.json_response({"success": True, "path": target})
                except Exception as e:
                    return web.json_response({"success": False, "error": str(e)})

            video_dir = os.path.join(out_dir, "video")
            wox_dir = os.path.join(out_dir, "wox_cinema")
            
            target_dirs = []
            if os.path.exists(video_dir):
                target_dirs.append((video_dir, "video"))
            if os.path.exists(wox_dir):
                target_dirs.append((wox_dir, "wox_cinema"))
            target_dirs.append((out_dir, ""))
            
            vids = []
            seen_files = set()
            valid_exts = (".mp4", ".webm", ".mov", ".mkv", ".gif")
            
            for d_path, subf in target_dirs:
                if not os.path.exists(d_path):
                    continue
                for f in os.listdir(d_path):
                    if f.lower() in seen_files:
                        continue
                    if f.lower().endswith(valid_exts):
                        fp = os.path.join(d_path, f)
                        if os.path.isfile(fp) and os.path.getsize(fp) > 1024:
                            seen_files.add(f.lower())
                            vids.append({
                                "filename": f,
                                "subfolder": subf,
                                "time": os.path.getmtime(fp),
                                "size": os.path.getsize(fp)
                            })

            # Ordina per data decrescente (i più recenti per primi)
            vids.sort(key=lambda x: x["time"], reverse=True)

            recent = []
            for i, v in enumerate(vids[:10]):
                sub = f"&subfolder={v['subfolder']}" if v['subfolder'] else ""
                url = f"/view?filename={v['filename']}{sub}&type=output"
                tag = "MiniMax H3 Video" if "minimax" in v['filename'].lower() else "WOX Video • MP4"
                recent.append({
                    "id": i + 1,
                    "filename": v["filename"],
                    "url": url,
                    "name": v["filename"],
                    "tag": tag,
                    "time": v["time"]
                })

            return web.json_response({
                "recent_videos": recent,
                "total_found": len(recent)
            })

        @routes.get("/wox_cinema/view_video")
        async def view_video(request):
            out_dir = folder_paths.get_output_directory()
            
            # Se richiesta apertura cartella
            if request.query.get("open_folder") == "1" or request.query.get("action") == "open_folder":
                video_dir = os.path.join(out_dir, "video")
                target = video_dir if os.path.exists(video_dir) else out_dir
                import subprocess
                import sys
                try:
                    if os.name == 'nt':
                        subprocess.Popen(['explorer', os.path.normpath(target)])
                    elif sys.platform == 'darwin':
                        subprocess.Popen(['open', target])
                    else:
                        subprocess.Popen(['xdg-open', target])
                    return web.json_response({"success": True, "path": target})
                except Exception as e:
                    return web.json_response({"success": False, "error": str(e)})

            file_param = request.query.get("file", "")
            safe_path = os.path.abspath(os.path.join(out_dir, file_param))
            if not safe_path.startswith(os.path.abspath(out_dir)) or not os.path.exists(safe_path):
                return web.Response(status=404, text="Video non trovato")
            
            return web.FileResponse(safe_path)

        @routes.get("/wox_cinema/open_output_folder")
        @routes.post("/wox_cinema/open_output_folder")
        @routes.get("/api/wox_cinema/open_output_folder")
        @routes.post("/api/wox_cinema/open_output_folder")
        async def open_output_folder(request):
            """Apre la cartella dei video output in Esplora Risorse di Windows."""
            try:
                out_dir = folder_paths.get_output_directory()
                video_dir = os.path.join(out_dir, "video")
                target = video_dir if os.path.exists(video_dir) else out_dir
                
                import subprocess
                import sys
                if os.name == 'nt':
                    subprocess.Popen(f'explorer "{os.path.normpath(target)}"', shell=True)
                elif sys.platform == 'darwin':
                    subprocess.Popen(['open', target])
                else:
                    subprocess.Popen(['xdg-open', target])
                return web.json_response({"success": True, "path": target})
            except Exception as e:
                logger.error(f"Errore apertura cartella output: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        @routes.post("/wox_cinema/export_montage")
        @routes.get("/wox_cinema/export_montage")
        @routes.post("/api/wox_cinema/export_montage")
        @routes.get("/api/wox_cinema/export_montage")
        async def export_montage(request):
            """Unisce / concatena i video della timeline in un unico video finale in output/video."""
            try:
                clips = []
                if request.method == "POST":
                    try:
                        data = await request.json()
                        clips = data.get("clips", [])
                    except:
                        pass
                if not clips:
                    clips_param = request.query.get("clips")
                    if clips_param:
                        import json
                        try:
                            clips = json.loads(clips_param)
                        except:
                            pass

                if not clips or len(clips) == 0:
                    return web.json_response({"success": False, "error": "Nessuna clip presente nella timeline"}, status=400)

                out_dir = folder_paths.get_output_directory()
                video_dir = os.path.join(out_dir, "video")
                os.makedirs(video_dir, exist_ok=True)

                # Trova i percorsi fisici dei file sorgente e parametri di trim (taglio)
                input_files = []
                for c in clips:
                    fn = c.get("filename", "")
                    url = c.get("url", "")
                    found_path = None

                    if fn:
                        p1 = os.path.join(video_dir, fn)
                        p2 = os.path.join(out_dir, fn)
                        if os.path.exists(p1):
                            found_path = p1
                        elif os.path.exists(p2):
                            found_path = p2

                    if not found_path and "filename=" in url:
                        import urllib.parse
                        parsed = urllib.parse.urlparse(url)
                        qs = urllib.parse.parse_qs(parsed.query)
                        if "filename" in qs and len(qs["filename"]) > 0:
                            q_fn = qs["filename"][0]
                            subf = qs.get("subfolder", [""])[0]
                            p3 = os.path.join(out_dir, subf, q_fn)
                            if os.path.exists(p3):
                                found_path = p3

                    if not found_path and fn:
                        ref_dir = os.path.join(folder_paths.get_input_directory(), "woxcinema")
                        p4 = os.path.join(ref_dir, fn)
                        if os.path.exists(p4):
                            found_path = p4

                    if found_path and os.path.exists(found_path):
                        start_offset = float(c.get("startOffset") or c.get("start_offset") or 0.0)
                        dur = float(c.get("duration") or 0.0)
                        input_files.append({
                            "path": found_path,
                            "startOffset": max(0.0, start_offset),
                            "duration": dur if dur > 0 else None
                        })

                if not input_files or len(input_files) == 0:
                    return web.json_response({"success": False, "error": "Nessun file sorgente valido trovato su disco"}, status=404)

                import subprocess
                import datetime
                import shutil

                try:
                    import imageio_ffmpeg
                    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                except Exception:
                    ffmpeg_exe = shutil.which("ffmpeg") or "ffmpeg"
                timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                out_filename = f"WOX_Montage_{timestamp_str}.mp4"
                final_out_path = os.path.join(video_dir, out_filename)

                # Pre-processing dei segmenti tagliati se necessario
                temp_segment_paths = []
                ready_file_paths = []

                for idx, item in enumerate(input_files):
                    fp = item["path"]
                    s_off = item["startOffset"]
                    c_dur = item["duration"]

                    if s_off > 0.02 or (c_dur is not None and c_dur > 0):
                        temp_seg = os.path.join(video_dir, f"seg_{timestamp_str}_{idx}.mp4")
                        cut_cmd = [ffmpeg_exe, "-y", "-ss", f"{s_off:.3f}"]
                        if c_dur is not None and c_dur > 0:
                            cut_cmd.extend(["-t", f"{c_dur:.3f}"])
                        cut_cmd.extend([
                            "-i", fp,
                            "-c:v", "libx264",
                            "-preset", "veryfast",
                            "-pix_fmt", "yuv420p",
                            "-c:a", "aac",
                            temp_seg
                        ])
                        cut_res = subprocess.run(cut_cmd, capture_output=True, text=True)
                        if cut_res.returncode == 0 and os.path.exists(temp_seg) and os.path.getsize(temp_seg) > 50:
                            temp_segment_paths.append(temp_seg)
                            ready_file_paths.append(temp_seg)
                        else:
                            ready_file_paths.append(fp)
                    else:
                        ready_file_paths.append(fp)

                # File temporaneo concat list
                concat_txt_path = os.path.join(video_dir, f"concat_{timestamp_str}.txt")
                with open(concat_txt_path, "w", encoding="utf-8") as txt_f:
                    for fp in ready_file_paths:
                        safe_fp = fp.replace("\\", "/")
                        txt_f.write(f"file '{safe_fp}'\n")

                # Concat demuxer ultra-rapido
                concat_cmd = [
                    ffmpeg_exe, "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_txt_path,
                    "-c", "copy",
                    final_out_path
                ]
                proc = subprocess.run(concat_cmd, capture_output=True, text=True)

                if proc.returncode != 0 or not os.path.exists(final_out_path) or os.path.getsize(final_out_path) < 100:
                    # Fallback re-encode per compatibilità codec
                    v_filter = "".join([f"[{i}:v:0]" for i in range(len(ready_file_paths))])
                    v_only_cmd = [ffmpeg_exe, "-y"]
                    for fp in ready_file_paths:
                        v_only_cmd.extend(["-i", fp])
                    v_only_cmd.extend([
                        "-filter_complex", f"{v_filter}concat=n={len(ready_file_paths)}:v=1:a=0[outv]",
                        "-map", "[outv]",
                        "-c:v", "libx264",
                        "-pix_fmt", "yuv420p",
                        final_out_path
                    ])
                    subprocess.run(v_only_cmd, capture_output=True, text=True)

                if os.path.exists(concat_txt_path):
                    try: os.remove(concat_txt_path)
                    except: pass

                for seg in temp_segment_paths:
                    if os.path.exists(seg):
                        try: os.remove(seg)
                        except: pass

                if os.path.exists(final_out_path) and os.path.getsize(final_out_path) > 0:
                    out_url = f"/view?filename={out_filename}&subfolder=video&type=output"
                    return web.json_response({
                        "success": True,
                        "filename": out_filename,
                        "url": out_url,
                        "path": final_out_path,
                        "size": os.path.getsize(final_out_path)
                    })
                else:
                    return web.json_response({"success": False, "error": "Errore durante il rendering del video montato"}, status=500)

            except Exception as e:
                logger.error(f"Errore export_montage: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        # ======================================================================
        # Reference Management Endpoints
        # ======================================================================
        # Gestione Reference Directory Esclusiva: input/woxcinema
        # ======================================================================
        def get_ref_dir():
            ref_dir = os.path.join(folder_paths.get_input_directory(), "woxcinema")
            os.makedirs(ref_dir, exist_ok=True)
            
            # Migrazione automatica da vecchia directory wox_references se esistente
            old_dir = os.path.join(folder_paths.get_input_directory(), "wox_references")
            if os.path.exists(old_dir):
                try:
                    for item in os.listdir(old_dir):
                        src = os.path.join(old_dir, item)
                        dst = os.path.join(ref_dir, item)
                        if not os.path.exists(dst):
                            import shutil
                            shutil.copy2(src, dst)
                except Exception as e:
                    logger.warning(f"Errore migrazione wox_references -> woxcinema: {e}")
                    
            return ref_dir

        def load_ref_metadata():
            meta_path = os.path.join(get_ref_dir(), "metadata.json")
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
            return {}

        def save_ref_metadata(meta):
            meta_path = os.path.join(get_ref_dir(), "metadata.json")
            try:
                with open(meta_path, "w", encoding="utf-8") as f:
                    json.dump(meta, f, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.warning(f"Failed to save reference metadata: {e}")

        @routes.get("/wox_cinema/references")
        @routes.get("/api/wox_cinema/references")
        async def get_references(request):
            """Restituisce l'elenco delle reference e delle immagini generate (Generations)."""
            ref_dir = get_ref_dir()
            meta = load_ref_metadata()
            
            results = []
            seen_files = set()
            seen_tags = set()
            valid_exts = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".mov", ".wav", ".mp3")
            meta_updated = False
            deleted_files = set(str(f).lower() for f in meta.get("_deleted_files", []))
            
            # 1. Scansiona input/woxcinema (Uploads e Generations già salvate)
            if os.path.exists(ref_dir):
                for f in sorted(os.listdir(ref_dir)):
                    if f.lower() == "metadata.json" or f.lower() in seen_files or f.lower() in deleted_files:
                        continue
                    if f.lower().endswith(valid_exts):
                        filepath = os.path.join(ref_dir, f)
                        if not os.path.isfile(filepath):
                            continue
                        mtime = os.path.getmtime(filepath)
                        size = os.path.getsize(filepath)
                        
                        clean_name = os.path.splitext(f)[0]
                        clean_tag = "@" + re.sub(r"[^a-zA-Z0-9_]", "_", clean_name.lower())
                        
                        item_meta = meta.get(f, {})
                        tag = item_meta.get("tag", clean_tag)
                        if not tag.startswith("@"):
                            tag = f"@{tag}"
                        
                        media_type = "image"
                        if f.lower().endswith((".mp4", ".webm", ".mov")):
                            media_type = "video"
                        elif f.lower().endswith((".wav", ".mp3", ".ogg")):
                            media_type = "audio"
                            
                        seen_files.add(f.lower())
                        seen_tags.add(tag.lower())
                        category = item_meta.get("category")
                        if not category:
                            category = "Generations" if any(k in f.lower() for k in ("z_image", "zimage", "krea", "wox_cinema")) else "Uploads"
                            item_meta["category"] = category
                            meta[f] = item_meta
                            meta_updated = True

                        results.append({
                            "id": f,
                            "filename": f"woxcinema/{f}",
                            "raw_filename": f,
                            "tag": tag,
                            "url": f"/view?filename={f}&subfolder=woxcinema&type=input",
                            "media_type": media_type,
                            "time": mtime,
                            "size": size,
                            "category": category,
                            "prompt": item_meta.get("prompt", "")
                        })

            # 2. Scansiona anche output/ per importare automaticamente generazioni Z-Image Turbo, Krea 2, MiniMax Video e WOX Cinema
            out_dir = folder_paths.get_output_directory()
            target_dirs = [
                (os.path.join(out_dir, "wox_cinema"), "wox_cinema"),
                (os.path.join(out_dir, "video"), "video"),
                (os.path.join(out_dir, "z_image_turbo"), "z_image_turbo"),
                (os.path.join(out_dir, "krea2"), "krea2"),
                (out_dir, "")
            ]
            for d_path, subf in target_dirs:
                if not os.path.exists(d_path):
                    continue
                for f in os.listdir(d_path):
                    f_lower = f.lower()
                    if f_lower in seen_files or f_lower == "metadata.json" or f_lower in deleted_files or not f_lower.endswith(valid_exts):
                        continue
                    if f_lower.startswith(("z_image", "zimage", "krea2", "wox_cinema", "assets", "minimax", "wox_montage", "comfyui_")):
                        filepath = os.path.join(d_path, f)
                        if not os.path.isfile(filepath) or os.path.getsize(filepath) < 1024:
                            continue
                        mtime = os.path.getmtime(filepath)
                        size = os.path.getsize(filepath)
                        
                        # Copia in input/woxcinema così è usabile come Reference nativa da LoadImage
                        dst_path = os.path.join(ref_dir, f)
                        if not os.path.exists(dst_path):
                            try:
                                import shutil
                                shutil.copy2(filepath, dst_path)
                            except Exception:
                                pass
                        
                        clean_name = os.path.splitext(f)[0]
                        clean_tag = "@" + re.sub(r"[^a-zA-Z0-9_]", "_", clean_name.lower())
                        item_meta = meta.get(f, {})
                        tag = item_meta.get("tag", clean_tag)
                        if not tag.startswith("@"):
                            tag = f"@{tag}"
                            
                        item_meta["category"] = "Generations"
                        item_meta["tag"] = tag
                        item_meta["time"] = mtime
                        meta[f] = item_meta
                        meta_updated = True
                        seen_files.add(f_lower)
                        
                        results.append({
                            "id": f,
                            "filename": f"woxcinema/{f}",
                            "raw_filename": f,
                            "tag": tag,
                            "url": f"/view?filename={f}&subfolder=woxcinema&type=input",
                            "media_type": "video" if f_lower.endswith((".mp4", ".webm", ".mov")) else "image",
                            "time": mtime,
                            "size": size,
                            "category": "Generations",
                            "prompt": item_meta.get("prompt", "")
                        })

            if meta_updated:
                save_ref_metadata(meta)
                        
            # Ordina per data decrescente (i più recenti in alto)
            results.sort(key=lambda x: x["time"], reverse=True)
            return web.json_response({"references": results})

        @routes.get("/wox_cinema/recent_images")
        @routes.get("/api/wox_cinema/recent_images")
        async def get_recent_images(request):
            """Restituisce le ultime immagini generate in output/ o woxcinema."""
            out_dir = folder_paths.get_output_directory()
            target_dirs = [
                (os.path.join(out_dir, "wox_cinema"), "wox_cinema"),
                (os.path.join(out_dir, "z_image_turbo"), "z_image_turbo"),
                (os.path.join(out_dir, "krea2"), "krea2"),
                (out_dir, "")
            ]
            imgs = []
            seen_files = set()
            valid_exts = (".png", ".jpg", ".jpeg", ".webp")
            meta = load_ref_metadata()
            deleted_files = set(str(f).lower() for f in meta.get("_deleted_files", []))
            
            for d_path, subf in target_dirs:
                if not os.path.exists(d_path):
                    continue
                for f in os.listdir(d_path):
                    f_lower = f.lower()
                    if f_lower in seen_files or f_lower in deleted_files or not f_lower.endswith(valid_exts):
                        continue
                    if f_lower.startswith(("z_image", "zimage", "krea2", "wox_cinema", "assets", "comfyui")):
                        fp = os.path.join(d_path, f)
                        if os.path.isfile(fp) and os.path.getsize(fp) > 1024:
                            seen_files.add(f_lower)
                            imgs.append({
                                "filename": f,
                                "subfolder": subf,
                                "time": os.path.getmtime(fp),
                                "size": os.path.getsize(fp)
                            })
                            
            imgs.sort(key=lambda x: x["time"], reverse=True)
            
            recent = []
            for i, item in enumerate(imgs[:20]):
                sub = f"&subfolder={item['subfolder']}" if item['subfolder'] else ""
                url = f"/view?filename={item['filename']}{sub}&type=output"
                clean_tag = "@" + re.sub(r"[^a-zA-Z0-9_]", "_", os.path.splitext(item['filename'])[0].lower())
                recent.append({
                    "id": i + 1,
                    "filename": item["filename"],
                    "url": url,
                    "name": item["filename"],
                    "tag": clean_tag,
                    "media_type": "image",
                    "time": item["time"]
                })
                
            return web.json_response({
                "recent_images": recent,
                "total_found": len(recent)
            })

        @routes.post("/wox_cinema/register_generation")
        @routes.post("/api/wox_cinema/register_generation")
        async def register_generation_route(request):
            """Registra un'immagine appena generata come Reference nella categoria Generations."""
            try:
                data = await request.json()
                filename = data.get("filename", "")
                subfolder = data.get("subfolder", "")
                prompt = data.get("prompt", "")
                
                if not filename:
                    return web.json_response({"success": False, "error": "filename required"}, status=400)
                    
                out_dir = folder_paths.get_output_directory()
                src_path = os.path.join(out_dir, subfolder, filename) if subfolder else os.path.join(out_dir, filename)
                if not os.path.exists(src_path):
                    if os.path.exists(os.path.join(out_dir, filename)):
                        src_path = os.path.join(out_dir, filename)
                    elif os.path.exists(os.path.join(out_dir, "wox_cinema", filename)):
                        src_path = os.path.join(out_dir, "wox_cinema", filename)
                        
                ref_dir = get_ref_dir()
                dst_path = os.path.join(ref_dir, filename)
                
                if os.path.exists(src_path):
                    import shutil
                    if not os.path.exists(dst_path):
                        shutil.copy2(src_path, dst_path)
                
                clean_tag = "@" + re.sub(r"[^a-zA-Z0-9_]", "_", os.path.splitext(filename)[0].lower())
                meta = load_ref_metadata()
                # Rimuovi dai file cancellati se era stato segnato come cancellato in precedenza
                if "_deleted_files" in meta and isinstance(meta["_deleted_files"], list):
                    fn_lowers = {filename.lower(), f"woxcinema/{filename.lower()}", os.path.basename(filename).lower()}
                    meta["_deleted_files"] = [x for x in meta["_deleted_files"] if str(x).lower() not in fn_lowers]
                meta[filename] = {
                    "tag": clean_tag,
                    "original_name": filename,
                    "time": time.time(),
                    "category": "Generations",
                    "prompt": prompt
                }
                save_ref_metadata(meta)
                
                return web.json_response({
                    "success": True,
                    "reference": {
                        "id": filename,
                        "filename": f"woxcinema/{filename}",
                        "raw_filename": filename,
                        "tag": clean_tag,
                        "url": f"/view?filename={filename}&subfolder=woxcinema&type=input",
                        "media_type": "video" if filename.lower().endswith((".mp4", ".webm", ".mov", ".mkv")) else "image",
                        "time": time.time(),
                        "size": os.path.getsize(dst_path) if os.path.exists(dst_path) else 0,
                        "category": "Generations",
                        "prompt": prompt
                    }
                })
            except Exception as e:
                logger.error(f"Errore register_generation: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        @routes.post("/wox_cinema/prepare_edit_input")
        @routes.post("/api/wox_cinema/prepare_edit_input")
        async def prepare_edit_input_route(request):
            """Prepara un'immagine per Qwen-Image-Edit copiandola nella cartella input/ di ComfyUI."""
            try:
                data = await request.json()
                filename = data.get("filename", "")
                url = data.get("url", "")
                
                input_dir = folder_paths.get_input_directory()
                out_dir = folder_paths.get_output_directory()
                
                clean_name = os.path.basename(filename) if filename else ""
                if not clean_name and url:
                    import urllib.parse
                    parsed = urllib.parse.urlparse(url)
                    qs = urllib.parse.parse_qs(parsed.query)
                    if "filename" in qs:
                        clean_name = qs["filename"][0]
                    else:
                        clean_name = os.path.basename(parsed.path)
                
                if not clean_name:
                    clean_name = f"edit_input_{int(time.time())}.png"
                
                src_path = None
                candidates = [
                    os.path.join(input_dir, clean_name),
                    os.path.join(input_dir, "woxcinema", clean_name),
                    os.path.join(out_dir, clean_name),
                    os.path.join(out_dir, "wox_cinema", clean_name),
                    os.path.join(out_dir, "z_image_turbo", clean_name),
                ]
                if filename and os.path.isabs(filename) and os.path.exists(filename):
                    src_path = filename
                else:
                    for cand in candidates:
                        if os.path.exists(cand):
                            src_path = cand
                            break
                            
                target_filename = f"qwen_edit_source_{int(time.time())}.png"
                dst_path = os.path.join(input_dir, target_filename)
                
                import shutil
                if src_path and os.path.exists(src_path):
                    shutil.copy2(src_path, dst_path)
                else:
                    if clean_name:
                        for r, d, fs in os.walk(input_dir):
                            if clean_name in fs:
                                src_path = os.path.join(r, clean_name)
                                shutil.copy2(src_path, dst_path)
                                break
                        if not os.path.exists(dst_path):
                            for r, d, fs in os.walk(out_dir):
                                if clean_name in fs:
                                    src_path = os.path.join(r, clean_name)
                                    shutil.copy2(src_path, dst_path)
                                    break
                
                final_name = target_filename if os.path.exists(dst_path) else clean_name
                return web.json_response({
                    "success": True,
                    "input_filename": final_name,
                    "src_path": src_path
                })
            except Exception as e:
                logger.error(f"Errore prepare_edit_input: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        @routes.post("/wox_cinema/references/upload")
        @routes.post("/api/wox_cinema/references/upload")
        async def upload_reference(request):
            """Carica una nuova reference ESCLUSIVAMENTE dentro woxcinema."""
            ref_dir = get_ref_dir()
            meta = load_ref_metadata()
            
            reader = await request.multipart()
            uploaded = []
            
            while True:
                field = await reader.next()
                if field is None:
                    break
                if field.name in ("image", "file", "media"):
                    filename = field.filename
                    if not filename:
                        continue
                    
                    # Nome file sicuro
                    base, ext = os.path.splitext(filename)
                    safe_base = re.sub(r"[^a-zA-Z0-9_\-]", "_", base)
                    safe_filename = f"{safe_base}_{int(time.time())}{ext}"
                    filepath = os.path.join(ref_dir, safe_filename)
                    
                    file_content = bytearray()
                    while True:
                        chunk = await field.read_chunk()
                        if not chunk:
                            break
                        file_content.extend(chunk)
                        
                    with open(filepath, "wb") as f:
                        f.write(file_content)
                            
                    clean_tag = "@" + re.sub(r"[^a-zA-Z0-9_]", "_", safe_base.lower())
                    meta[safe_filename] = {
                        "tag": clean_tag,
                        "original_name": filename,
                        "time": time.time(),
                        "category": "Uploads"
                    }
                    uploaded.append({
                        "filename": f"woxcinema/{safe_filename}",
                        "raw_filename": safe_filename,
                        "tag": clean_tag,
                        "url": f"/view?filename={safe_filename}&subfolder=woxcinema&type=input"
                    })
                    
            save_ref_metadata(meta)
            return web.json_response({"success": True, "uploaded": uploaded})

        @routes.post("/wox_cinema/references/update_tag")
        @routes.post("/api/wox_cinema/references/update_tag")
        async def update_reference_tag(request):
            """Aggiorna il tag associato a una reference."""
            try:
                data = await request.json()
                filename = data.get("filename")
                tag = data.get("tag", "").strip()
                if not tag.startswith("@"):
                    tag = f"@{tag}"
                tag = re.sub(r"[^a-zA-Z0-9_@]", "_", tag)
                
                meta = load_ref_metadata()
                if filename not in meta:
                    meta[filename] = {}
                meta[filename]["tag"] = tag
                save_ref_metadata(meta)
                return web.json_response({"success": True, "tag": tag})
            except Exception as e:
                return web.json_response({"success": False, "error": str(e)}, status=400)

        @routes.post("/wox_cinema/enhance_prompt")
        @routes.post("/api/wox_cinema/enhance_prompt")
        async def enhance_prompt_route(request):
            """Migliora e traduce il prompt in inglese cinematografico via LLM / Ollama."""
            try:
                data = await request.json()
                raw_prompt = data.get("prompt", "").strip()
                film_setup = data.get("film_setup", "Auto")
                
                if not raw_prompt:
                    return web.json_response({"success": True, "enhanced_prompt": ""})
                
                enhanced = None
                system_instruction = (
                    "You are a master Hollywood director and cinematographer. "
                    "Translate the user's prompt to vivid, professional English (if not already in English), "
                    "and enrich it with cinematic visual details, camera perspective, lighting, mood, and atmosphere. "
                    "CRITICAL: Keep any reference tags like @person or <Picture 1> intact and in place. "
                    "Do NOT add conversational fluff, intro, outro, or quotes. Output ONLY the improved cinematic prompt."
                )
                
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    model_to_use = None
                    try:
                        async with session.get("http://127.0.0.1:11434/api/tags", timeout=aiohttp.ClientTimeout(total=3)) as tag_res:
                            if tag_res.status == 200:
                                tags_data = await tag_res.json()
                                models_list = [m.get("name", "") for m in tags_data.get("models", [])]
                                preferred = ["qwen3.8:27b", "bonsai:latest", "qwen2.5:7b", "gemma4:26b", "qwen3-coder:latest"]
                                for p in preferred:
                                    if p in models_list:
                                        model_to_use = p
                                        break
                                if not model_to_use and models_list:
                                    for m in models_list:
                                        if "qwen" in m.lower() or "gemma" in m.lower() or "bonsai" in m.lower():
                                            model_to_use = m
                                            break
                                    if not model_to_use:
                                        model_to_use = models_list[0]
                    except Exception as tag_err:
                        logger.warning(f"Ollama tags lookup failed: {tag_err}")

                    if model_to_use:
                        try:
                            payload = {
                                "model": model_to_use,
                                "prompt": f"{system_instruction}\n\nUser Prompt: {raw_prompt}",
                                "stream": False,
                                "options": {
                                    "temperature": 0.7,
                                    "num_predict": 250
                                }
                            }
                            async with session.post("http://127.0.0.1:11434/api/generate", json=payload, timeout=aiohttp.ClientTimeout(total=20)) as gen_res:
                                if gen_res.status == 200:
                                    gen_data = await gen_res.json()
                                    res_text = gen_data.get("response", "").strip()
                                    if res_text:
                                        res_text = re.sub(r'<think>.*?</think>', '', res_text, flags=re.DOTALL).strip()
                                        res_text = re.sub(r'^["\']|["\']$', '', res_text).strip()
                                        if len(res_text) > 5:
                                            enhanced = res_text
                        except Exception as gen_err:
                            logger.warning(f"Ollama generation with {model_to_use} failed: {gen_err}")

                if not enhanced:
                    enhanced = raw_prompt
                    
                logger.info(f"WOX Cinema Prompt Enhanced: '{raw_prompt}' -> '{enhanced}'")
                return web.json_response({"success": True, "enhanced_prompt": enhanced})
            except Exception as e:
                logger.error(f"Error enhancing prompt: {e}")
                return web.json_response({"success": False, "enhanced_prompt": data.get("prompt", ""), "error": str(e)})

        @routes.post("/wox_cinema/references/delete")
        @routes.post("/api/wox_cinema/references/delete")
        async def delete_reference(request):
            """Elimina una reference o generazione sia da input che da output."""
            try:
                data = await request.json()
                filename = data.get("filename", "")
                raw_filename = data.get("raw_filename") or os.path.basename(filename)
                
                ref_dir = get_ref_dir()
                input_dir = folder_paths.get_input_directory()
                output_dir = folder_paths.get_output_directory()
                
                candidate_paths = [
                    os.path.join(ref_dir, raw_filename),
                    os.path.join(input_dir, raw_filename),
                    os.path.join(input_dir, "woxcinema", raw_filename),
                    os.path.join(output_dir, raw_filename),
                    os.path.join(output_dir, "wox_cinema", raw_filename),
                    os.path.join(output_dir, "z_image_turbo", raw_filename),
                    os.path.join(output_dir, "krea2", raw_filename)
                ]
                
                for p in candidate_paths:
                    if os.path.exists(p) and os.path.isfile(p):
                        try:
                            os.remove(p)
                        except Exception as rem_err:
                            logger.warning(f"Could not remove {p}: {rem_err}")

                # Deep scan to remove any other copy in output or input
                for root in [output_dir, input_dir]:
                    for r, dirs, files in os.walk(root):
                        if raw_filename in files:
                            try:
                                os.remove(os.path.join(r, raw_filename))
                            except Exception:
                                pass
                
                meta = load_ref_metadata()
                if raw_filename in meta:
                    del meta[raw_filename]
                if filename in meta:
                    del meta[filename]
                if f"woxcinema/{raw_filename}" in meta:
                    del meta[f"woxcinema/{raw_filename}"]
                    
                # Blacklist to prevent re-importing by get_references
                if "_deleted_files" not in meta:
                    meta["_deleted_files"] = []
                if raw_filename.lower() not in meta["_deleted_files"]:
                    meta["_deleted_files"].append(raw_filename.lower())
                if filename.lower() not in meta["_deleted_files"]:
                    meta["_deleted_files"].append(filename.lower())
                    
                save_ref_metadata(meta)
                logger.info(f"WOX Cinema: Successfully deleted reference {raw_filename}")
                return web.json_response({"success": True, "filename": raw_filename})
            except Exception as e:
                logger.error(f"Error in delete_reference: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=400)

        @routes.post("/wox_cinema/prepare_edit_input")
        @routes.post("/api/wox_cinema/prepare_edit_input")
        async def prepare_edit_input(request):
            """Prepares an image for editing by ensuring it exists in ComfyUI's input directory for LoadImage."""
            try:
                import shutil
                data = await request.json()
                filename = data.get("filename", "")
                subfolder = data.get("subfolder", "")
                
                input_dir = folder_paths.get_input_directory()
                output_dir = folder_paths.get_output_directory()
                temp_dir = folder_paths.get_temp_directory()
                
                # Check potential candidate locations
                search_paths = []
                if subfolder:
                    search_paths.append(os.path.join(output_dir, subfolder, filename))
                search_paths.append(os.path.join(output_dir, "wox_cinema", filename))
                search_paths.append(os.path.join(output_dir, filename))
                search_paths.append(os.path.join(input_dir, "wox_cinema_refs", filename))
                search_paths.append(os.path.join(input_dir, filename))
                search_paths.append(os.path.join(temp_dir, filename))
                
                found_src = None
                for p in search_paths:
                    if p and os.path.exists(p) and os.path.isfile(p):
                        found_src = p
                        break
                        
                # Deep search if still not found
                if not found_src:
                    base_name = os.path.basename(filename)
                    for root in [output_dir, input_dir]:
                        matches = glob.glob(os.path.join(root, "**", base_name), recursive=True)
                        if matches:
                            found_src = matches[0]
                            break
                            
                if not found_src:
                    return web.json_response({"success": False, "error": f"File non trovato: {filename}"}, status=404)
                    
                ext = os.path.splitext(found_src)[1] or ".png"
                target_filename = f"wox_edit_{int(time.time())}{ext}"
                target_path = os.path.join(input_dir, target_filename)
                shutil.copy2(found_src, target_path)
                
                logger.info(f"WOX Cinema: Prepared image for edit '{found_src}' -> '{target_path}'")
                return web.json_response({"success": True, "input_filename": target_filename})
            except Exception as e:
                logger.error(f"WOX Cinema prepare_edit_input error: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        @routes.get("/wox_cinema/system_status")
        @routes.get("/api/wox_cinema/system_status")
        async def get_system_status(request):
            """Restituisce lo stato di installazione dei nodi custom e dei moduli python necessari."""
            try:
                import sys
                import importlib.util
                
                # Check ComfyUI custom nodes
                custom_nodes_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                required_nodes = [
                    {
                        "id": "ComfyUI-VideoHelperSuite",
                        "name": "ComfyUI-VideoHelperSuite",
                        "description": "Elaborazione e salvataggio video/audio (CreateVideo, SaveVideo, VHS)",
                        "repo": "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite",
                        "folder": "ComfyUI-VideoHelperSuite"
                    },
                    {
                        "id": "ComfyUI-KJNodes",
                        "name": "ComfyUI-KJNodes",
                        "description": "Selettore di risoluzione e utility cinematografiche (ResolutionSelector)",
                        "repo": "https://github.com/kijai/ComfyUI-KJNodes",
                        "folder": "ComfyUI-KJNodes"
                    },
                    {
                        "id": "ComfyUI-Manager",
                        "name": "ComfyUI-Manager",
                        "description": "Gestore globale di estensioni e modelli per ComfyUI",
                        "repo": "https://github.com/ltdrdata/ComfyUI-Manager",
                        "folder": "ComfyUI-Manager"
                    }
                ]
                
                for node_item in required_nodes:
                    node_path = os.path.join(custom_nodes_dir, node_item["folder"])
                    node_item["installed"] = os.path.exists(node_path) and os.path.isdir(node_path)

                # Check Python packages
                required_modules = [
                    {"id": "requests", "name": "requests", "package": "requests", "description": "Comunicazione HTTP e API client REST"},
                    {"id": "aiohttp", "name": "aiohttp", "package": "aiohttp", "description": "Server asincrono e WebSocket integrati"},
                    {"id": "imageio", "name": "imageio", "package": "imageio", "description": "Caricamento e manipolazione frame grafici"},
                    {"id": "imageio-ffmpeg", "name": "imageio-ffmpeg", "package": "imageio-ffmpeg", "description": "Codec e compressione video MP4/H.264"},
                    {"id": "pillow", "name": "Pillow (PIL)", "package": "Pillow", "description": "Elaborazione immagini ad alte prestazioni"}
                ]

                for mod_item in required_modules:
                    mod_pkg = mod_item["package"].lower().replace("-", "_")
                    if mod_pkg == "pillow":
                        mod_pkg = "PIL"
                    mod_item["installed"] = importlib.util.find_spec(mod_pkg) is not None

                # Check Models (diffusion_models, text_encoders, vae)
                base_models_dir = folder_paths.models_dir
                required_models = [
                    # 1. Diffusion Models / UNET
                    {
                        "id": "z-image-turbo",
                        "name": "Z-Image Turbo UNET (FP8)",
                        "filename": "z-image-turbo-fp8-e4m3fn.safetensors",
                        "folder": "diffusion_models",
                        "description": "UNET neurale per la generazione di immagini ad altissima velocità (Z-Image Turbo)",
                        "url": "https://huggingface.co/Andyhere/Z-images_models/resolve/main/z-image-turbo-fp8-e4m3fn.safetensors"
                    },
                    {
                        "id": "qwen_image_edit",
                        "name": "Qwen Image Edit UNET (FP8)",
                        "filename": "qwen_image_edit_fp8_e4m3fn.safetensors",
                        "folder": "diffusion_models",
                        "description": "UNET per l'editing contestuale e modifica selettiva delle immagini",
                        "url": "https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors"
                    },
                    {
                        "id": "minimax_h3_fl2va",
                        "name": "MiniMax H3 First-Last to Video UNET (INT8)",
                        "filename": "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                        "folder": "diffusion_models",
                        "description": "UNET cinematografico MiniMax H3 per generazione video da prompt e frame iniziale (Load Diffusion Model)",
                        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors"
                    },
                    {
                        "id": "minimax_h3_ref2va",
                        "name": "MiniMax H3 Ref to Video UNET (INT8)",
                        "filename": "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
                        "folder": "diffusion_models",
                        "description": "UNET cinematografico MiniMax H3 con supporto reference images (Load Diffusion Model)",
                        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors"
                    },
                    # 2. Text Encoders / CLIP
                    {
                        "id": "qwen_3_4b",
                        "name": "Qwen 3 4B Text Encoder (Lumina 2)",
                        "filename": "qwen_3_4b.safetensors",
                        "folder": "text_encoders",
                        "description": "Text Encoder per Z-Image Turbo per interpretazione cinematografica",
                        "url": "https://huggingface.co/Andyhere/Z-images_models/resolve/main/qwen_3_4b.safetensors"
                    },
                    {
                        "id": "qwen_2_5_vl_7b",
                        "name": "Qwen 2.5 VL 7B Text/Vision Encoder",
                        "filename": "qwen_2.5_vl_7b_fp8_scaled.safetensors",
                        "folder": "text_encoders",
                        "description": "Vision Language Text Encoder per Image Editing con Qwen",
                        "url": "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"
                    },
                    {
                        "id": "qwen3vl_32b_minimax_h3",
                        "name": "MiniMax H3 Text/Vision CLIP (Qwen3-VL 32B NVFP4)",
                        "filename": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                        "folder": "text_encoders",
                        "description": "Text/Vision Encoder avanzato per MiniMax H3 Cinema Video (Load CLIP)",
                        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors"
                    },
                    # 3. VAEs (Image, Video & Audio)
                    {
                        "id": "ae_vae",
                        "name": "AE VAE Decoder (Flux / Z-Image)",
                        "filename": "ae.safetensors",
                        "folder": "vae",
                        "description": "Autoencoder latente a 16 canali per rendering nitido ad alta risoluzione",
                        "url": "https://huggingface.co/camenduru/FLUX.1-dev/resolve/main/ae.safetensors"
                    },
                    {
                        "id": "qwen_image_vae",
                        "name": "Qwen Image VAE Decoder",
                        "filename": "qwen_image_vae.safetensors",
                        "folder": "vae",
                        "description": "Autoencoder latente dedicato al pipeline di Qwen Image Edit",
                        "url": "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors"
                    },
                    {
                        "id": "minimax_h3_video_vae",
                        "name": "MiniMax H3 Video VAE (FP16)",
                        "filename": "minimax_h3_video_vae_fp16.safetensors",
                        "folder": "vae",
                        "description": "Decoder video ad alta definizione spaziotemporale (Video VAE)",
                        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors"
                    },
                    {
                        "id": "minimax_h3_audio_vae",
                        "name": "MiniMax H3 Audio VAE (FP32)",
                        "filename": "minimax_h3_audio_vae_fp32.safetensors",
                        "folder": "vae",
                        "description": "Autoencoder per la sintesi e decodifica dell'audio integrato (Audio VAE)",
                        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors"
                    },
                    # 4. LoRAs & Lightning Accelerators
                    {
                        "id": "qwen_edit_lightning",
                        "name": "Qwen Image Edit Lightning 4-Steps LoRA",
                        "filename": "Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors",
                        "folder": "loras",
                        "description": "Acceleratore a 4 passi di inferenza per generazione istantanea",
                        "url": "https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors"
                    }
                ]

                def is_model_file_valid(file_path):
                    if not os.path.exists(file_path):
                        return False
                    if file_path.endswith(".safetensors"):
                        try:
                            import safetensors
                            with safetensors.safe_open(file_path, framework="pt") as f_chk:
                                _ = f_chk.keys()
                            return True
                        except Exception:
                            return False
                    return os.path.getsize(file_path) > 1024

                for model_item in required_models:
                    model_path = os.path.join(base_models_dir, model_item["folder"], model_item["filename"])
                    is_inst = is_model_file_valid(model_path)
                    if not is_inst:
                        # Controlla solo alias autorizzati specifici, ignorando file rinominati o disabilitati con '_'
                        subfolder_path = os.path.join(base_models_dir, model_item["folder"])
                        if os.path.exists(subfolder_path):
                            for fname in os.listdir(subfolder_path):
                                if fname.startswith("_") or fname.startswith("."):
                                    continue
                                if fname.lower() == model_item["filename"].lower():
                                    alias_path = os.path.join(subfolder_path, fname)
                                    is_inst = is_model_file_valid(alias_path)
                                    break
                    model_item["installed"] = is_inst

                return web.json_response({
                    "success": True,
                    "nodes": required_nodes,
                    "modules": required_modules,
                    "models": required_models
                })
            except Exception as e:
                logger.error(f"WOX Cinema system_status error: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        @routes.post("/wox_cinema/install_items")
        @routes.post("/api/wox_cinema/install_items")
        async def install_system_items(request):
            """Installa i moduli python, custom nodes o scarica i modelli AI richiesti con progresso in tempo reale."""
            def send_progress(item_id, item_name, item_type, percent, log="", speed_str="", eta_str="", step="in_progress"):
                try:
                    if PromptServer.instance:
                        PromptServer.instance.send_sync("wox_cinema_install_progress", {
                            "id": item_id,
                            "name": item_name,
                            "type": item_type,
                            "percent": float(percent),
                            "log": log,
                            "speed_str": speed_str,
                            "eta_str": eta_str,
                            "step": step
                        })
                except Exception as ex:
                    logger.debug(f"Failed to send install progress: {ex}")

            def run_sync_install(item_type, item_id, item_name, target, folder, filename):
                import sys
                import subprocess
                import urllib.request
                import time

                python_exe = sys.executable
                custom_nodes_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

                if item_type == "module":
                    send_progress(item_id, item_name, "module", 10, log=f"Avvio installazione pip di '{target}'...", step="starting")
                    cmd = [python_exe, "-m", "pip", "install", target]
                    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
                    send_progress(item_id, item_name, "module", 35, log=f"Scaricamento e installazione '{target}' in corso...", step="installing")
                    stdout_lines = []
                    if proc.stdout:
                        for line in iter(proc.stdout.readline, ''):
                            if not line:
                                break
                            stdout_lines.append(line)
                            clean = line.strip()
                            if clean:
                                send_progress(item_id, item_name, "module", 65, log=clean[:90], step="installing")
                    proc.wait()
                    if proc.returncode == 0:
                        send_progress(item_id, item_name, "module", 100, log=f"Modulo '{target}' installato con successo.", step="done")
                        return {"success": True, "message": f"Modulo '{target}' installato con successo."}
                    else:
                        send_progress(item_id, item_name, "module", 100, log=f"Errore pip install: {target}", step="error")
                        return {"success": False, "error": f"Errore pip install: {''.join(stdout_lines[-10:])}"}

                elif item_type == "node":
                    target_dir = os.path.join(custom_nodes_dir, folder or os.path.basename(target).replace(".git", ""))
                    if os.path.exists(target_dir):
                        send_progress(item_id, item_name, "node", 100, log=f"Nodo '{folder}' già presente sul disco.", step="done")
                        return {"success": True, "message": f"Nodo già installato in {folder}."}

                    send_progress(item_id, item_name, "node", 15, log=f"Clonazione repository git da '{target}'...", step="cloning")
                    cmd = ["git", "clone", "--depth", "1", target, target_dir]
                    proc = subprocess.run(cmd, capture_output=True, text=True)
                    if proc.returncode == 0:
                        req_file = os.path.join(target_dir, "requirements.txt")
                        if os.path.exists(req_file):
                            send_progress(item_id, item_name, "node", 65, log=f"Installazione requisiti per '{folder}'...", step="requirements")
                            subprocess.run([python_exe, "-m", "pip", "install", "-r", req_file], capture_output=True, text=True)
                        send_progress(item_id, item_name, "node", 100, log=f"Nodo '{folder}' installato e configurato con successo.", step="done")
                        return {"success": True, "message": f"Nodo '{folder}' clonato e configurato con successo."}
                    else:
                        send_progress(item_id, item_name, "node", 100, log=f"Errore git clone per '{folder}'", step="error")
                        return {"success": False, "error": f"Errore git clone: {proc.stderr[-500:] or proc.stdout[-500:]}"}

                elif item_type == "model":
                    base_models_dir = folder_paths.models_dir
                    dest_folder = os.path.join(base_models_dir, folder)
                    os.makedirs(dest_folder, exist_ok=True)
                    dest_file = os.path.join(dest_folder, filename or os.path.basename(target))

                    def is_file_valid(file_path):
                        if not os.path.exists(file_path):
                            return False
                        if file_path.endswith(".safetensors"):
                            try:
                                import safetensors
                                with safetensors.safe_open(file_path, framework="pt") as f_test:
                                    _ = f_test.keys()
                                return True
                            except Exception:
                                return False
                        return os.path.getsize(file_path) > 1024

                    if is_file_valid(dest_file):
                        send_progress(item_id, item_name, "model", 100, log=f"Modello '{filename}' valido e già presente nella cartella {folder}.", step="done")
                        return {"success": True, "message": f"Modello già presente e integro in {dest_file}."}

                    logger.info(f"WOX Cinema: Downloading/resuming model from {target} to {dest_file}...")
                    send_progress(item_id, item_name, "model", 0, log=f"Connessione a {target}...", step="connecting")
                    try:
                        # Supporto HTTP Range per ripresa (resume) del download
                        existing_bytes = os.path.getsize(dest_file) if os.path.exists(dest_file) else 0
                        req_headers = {'User-Agent': 'Mozilla/5.0'}
                        if existing_bytes > 0:
                            req_headers['Range'] = f"bytes={existing_bytes}-"

                        req = urllib.request.Request(target, headers=req_headers)
                        try:
                            resp = urllib.request.urlopen(req)
                        except urllib.error.HTTPError as http_err:
                            if http_err.code == 416: # Range not satisfiable (file già scaricato o riparti da zero)
                                existing_bytes = 0
                                req_headers.pop('Range', None)
                                req = urllib.request.Request(target, headers=req_headers)
                                resp = urllib.request.urlopen(req)
                            else:
                                raise http_err

                        is_range_response = (resp.status == 206)
                        content_len = resp.getheader('Content-Length')
                        remaining_size = int(content_len) if content_len and content_len.isdigit() else 0
                        total_size = (existing_bytes + remaining_size) if is_range_response else remaining_size

                        file_mode = 'ab' if (is_range_response and existing_bytes > 0) else 'wb'
                        downloaded = existing_bytes if (is_range_response and existing_bytes > 0) else 0

                        with open(dest_file, file_mode) as out_f:
                            chunk_size = 1024 * 1024  # 1 MB chunk
                            start_time = time.time()
                            last_emit_time = start_time
                            last_downloaded = downloaded

                            while True:
                                chunk = resp.read(chunk_size)
                                if not chunk:
                                    break
                                out_f.write(chunk)
                                downloaded += len(chunk)
                                now = time.time()

                                if now - last_emit_time >= 0.2:
                                    dt = now - last_emit_time
                                    speed = (downloaded - last_downloaded) / dt if dt > 0 else 0
                                    last_emit_time = now
                                    last_downloaded = downloaded

                                    speed_mb = speed / (1024 * 1024)
                                    speed_str = f"{speed_mb:.1f} MB/s" if speed_mb >= 0.1 else f"{speed / 1024:.0f} KB/s"

                                    if total_size > 0:
                                        pct = (downloaded / total_size) * 100.0
                                        rem = max(0, total_size - downloaded)
                                        eta_sec = int(rem / speed) if speed > 0 else 0
                                        eta_str = f"{eta_sec}s rimanenti" if eta_sec < 60 else f"{eta_sec // 60}m {eta_sec % 60}s"
                                        dl_mb = downloaded / (1024 * 1024)
                                        tot_mb = total_size / (1024 * 1024)
                                        if tot_mb >= 1024:
                                            size_text = f"{dl_mb / 1024:.2f} GB / {tot_mb / 1024:.2f} GB"
                                        else:
                                            size_text = f"{dl_mb:.1f} MB / {tot_mb:.1f} MB"
                                        log_text = f"Download: {size_text} ({pct:.1f}%)"
                                    else:
                                        pct = 50.0
                                        eta_str = ""
                                        dl_mb = downloaded / (1024 * 1024)
                                        log_text = f"Download: {dl_mb:.1f} MB scaricati"

                                    send_progress(item_id, item_name, "model", pct, log=log_text, speed_str=speed_str, eta_str=eta_str, step="downloading")

                        # Verifica finale integrità
                        if not is_file_valid(dest_file):
                            raise Exception("Il file scaricato non ha superato la verifica di integrità safetensors.")

                        send_progress(item_id, item_name, "model", 100, log=f"Modello '{filename}' verificato e scaricato con successo.", step="done")
                        return {"success": True, "message": f"Modello '{filename}' scaricato con successo in {dest_folder}."}
                    except Exception as dl_err:
                        send_progress(item_id, item_name, "model", 100, log=f"Errore download: {dl_err}", step="error")
                        return {"success": False, "error": f"Errore download modello: {dl_err}"}

                else:
                    return {"success": False, "error": f"Tipo sconosciuto: {item_type}"}

            try:
                import asyncio
                data = await request.json()
                item_type = data.get("type", "")  # 'module', 'node' o 'model'
                item_id = data.get("id", "")
                item_name = data.get("name", "") or data.get("filename", "") or item_id
                target = data.get("target", "")    # package name, git repo url, o model download url
                folder = data.get("folder", "")    # cartella di destinazione
                filename = data.get("filename", "")

                res = await asyncio.to_thread(
                    run_sync_install, item_type, item_id, item_name, target, folder, filename
                )
                status_code = 200 if res.get("success") else 400
                return web.json_response(res, status=status_code)
            except Exception as e:
                logger.error(f"WOX Cinema install_items error: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

except Exception as e:
    logger.warning(f"WOXCinemaStudio: Failed to register HTTP routes: {e}")
