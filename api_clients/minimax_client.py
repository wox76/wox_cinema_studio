import os
import time
import requests
import json
import logging
from pathlib import Path
import numpy as np
import torch
from PIL import Image

logger = logging.getLogger("WOXCinemaStudio")

class MinimaxClient:
    def __init__(self, api_key: str = None, group_id: str = None):
        self.api_key = api_key or os.environ.get("MINIMAX_API_KEY", "")
        self.group_id = group_id or os.environ.get("MINIMAX_GROUP_ID", "")
        self.base_url = "https://api.minimax.chat/v1"

    def generate_video(self, prompt: str, model: str = "video-01", camera: str = "Auto", lighting: str = "Auto", duration: int = 5, aspect_ratio: str = "16:9", output_dir: str = None) -> str:
        """
        Generates video using Minimax Hailuo / H3 Video API or creates a formatted MP4 fallback.
        Returns the absolute path to the generated MP4 file.
        """
        if not output_dir:
            output_dir = os.path.join(os.getcwd(), "output", "wox_cinema")
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = int(time.time())
        out_filename = f"wox_cinema_minimax_{timestamp}.mp4"
        out_filepath = os.path.join(output_dir, out_filename)

        if not self.api_key:
            logger.info("MinimaxClient: MINIMAX_API_KEY non specificata. Generazione video preview WOX Cinema Studio.")
            return self._generate_fallback_video(prompt, duration, aspect_ratio, out_filepath, camera, lighting)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        full_prompt = prompt
        if camera != "Auto":
            full_prompt += f", camera motion: {camera}"
        if lighting != "Auto":
            full_prompt += f", lighting: {lighting}"

        payload = {
            "model": "video-01", # Minimax Hailuo / H3
            "prompt": full_prompt,
            "prompt_optimizer": True
        }

        try:
            resp = requests.post(f"{self.base_url}/video_generation", json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            task_id = resp.json().get("task_id")
            if not task_id:
                raise ValueError(f"No task_id returned from Minimax: {resp.text}")

            logger.info(f"Minimax task started: {task_id}. Polling for completion...")
            for _ in range(60):
                time.sleep(5)
                status_resp = requests.get(f"{self.base_url}/query/video_generation?task_id={task_id}", headers=headers, timeout=20)
                status_data = status_resp.json()
                status = status_data.get("status")
                if status == "Success":
                    download_url = status_data.get("file_url") or status_data.get("download_url")
                    if download_url:
                        video_content = requests.get(download_url, timeout=120).content
                        with open(out_filepath, "wb") as f:
                            f.write(video_content)
                        return out_filepath
                elif status == "Failed":
                    raise RuntimeError(f"Minimax generation failed: {status_data}")

        except Exception as e:
            logger.warning(f"Minimax API generation error: {e}. Creazione video di test...")

        return self._generate_fallback_video(prompt, duration, aspect_ratio, out_filepath, camera, lighting)

    def _generate_fallback_video(self, prompt: str, duration: int, aspect_ratio: str, out_path: str, camera: str, lighting: str) -> str:
        """
        Creates a high quality animated preview MP4 video for WOX Cinema Studio.
        """
        try:
            import cv2
            
            w, h = 1280, 720
            if aspect_ratio == "9:16":
                w, h = 720, 1280
            elif aspect_ratio == "1:1":
                w, h = 1024, 1024

            fps = 24
            total_frames = fps * duration
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

            for i in range(total_frames):
                frame = np.zeros((h, w, 3), dtype=np.uint8)
                t = i / total_frames
                
                # Dynamic background gradient
                bg_val = int(20 + 20 * np.sin(t * np.pi * 2))
                frame[:, :, 0] = bg_val
                frame[:, :, 1] = int(24 + 10 * np.cos(t * np.pi * 2))
                frame[:, :, 2] = int(32 + 20 * np.sin(t * np.pi))

                # Grid
                for y in range(0, h, 60):
                    cv2.line(frame, (0, y), (w, y), (40, 48, 60), 1)
                for x in range(0, w, 60):
                    cv2.line(frame, (x, 0), (x, h), (40, 48, 60), 1)

                # Glowing center sphere
                center_x = int(w/2 + np.sin(t * np.pi * 2) * (w * 0.15))
                center_y = int(h/2 + np.cos(t * np.pi * 2) * (h * 0.1))
                radius = int(60 + 15 * np.sin(t * 6))
                cv2.circle(frame, (center_x, center_y), radius + 15, (50, 100, 30), 4)
                cv2.circle(frame, (center_x, center_y), radius, (50, 255, 212), -1)

                # Overlay UI text
                cv2.rectangle(frame, (40, 40), (w - 40, 180), (15, 18, 22), -1)
                cv2.rectangle(frame, (40, 40), (w - 40, 180), (212, 255, 50), 2)
                
                cv2.putText(frame, "WOX CINEMA STUDIO - MINIMAX H3", (60, 80), cv2.FONT_HERSHEY_DUPLEX, 1.0, (212, 255, 50), 2)
                cv2.putText(frame, f"Prompt: {prompt[:50]}...", (60, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (230, 230, 230), 1)
                cv2.putText(frame, f"Cam: {camera} | Light: {lighting} | Frame: {i+1}/{total_frames}", (60, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 1)

                out.write(frame)

            out.release()
            return out_path
        except Exception as e:
            logger.error(f"Fallback video creation failed: {e}")
            with open(out_path, "wb") as f:
                f.write(b"")
            return out_path
