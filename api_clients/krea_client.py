import os
import time
import requests
import json
import logging
from PIL import Image
from io import BytesIO
import torch
import numpy as np

logger = logging.getLogger("WOXCinemaStudio")

class KreaClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("KREA_API_KEY", "")
        self.base_url = "https://api.krea.ai/v1"

    def generate_image(self, prompt: str, negative_prompt: str = "", width: int = 1024, height: int = 1024, style: str = "Auto", num_images: int = 1):
        """
        Generates images using Krea 2 API or returns simulated high quality frame if API key is not present.
        """
        if not self.api_key:
            logger.info("KreaClient: KREA_API_KEY non specificata. Generazione placeholder/mock Krea2 per WOX Cinema Studio.")
            return self._generate_fallback_image(prompt, width, height, style)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "krea-2.0",
            "prompt": f"{prompt} (Style: {style})" if style != "Auto" else prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "num_images": num_images
        }

        try:
            resp = requests.post(f"{self.base_url}/generate", json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            images = []
            for item in data.get("images", []):
                img_url = item.get("url")
                if img_url:
                    img_resp = requests.get(img_url, timeout=30)
                    img = Image.open(BytesIO(img_resp.content)).convert("RGB")
                    images.append(img)
            if images:
                return images
        except Exception as e:
            logger.warning(f"KreaClient error: {e}. Fallback to local rendering.")
            
        return self._generate_fallback_image(prompt, width, height, style)

    def _generate_fallback_image(self, prompt: str, width: int, height: int, style: str):
        from PIL import ImageDraw
        img = Image.new("RGB", (width, height), color=(16, 18, 24))
        draw = ImageDraw.Draw(img)
        
        # Grid lines
        for y in range(0, height, 50):
            draw.line([(0, y), (width, y)], fill=(26, 30, 40), width=1)
        for x in range(0, width, 50):
            draw.line([(x, 0), (x, height)], fill=(26, 30, 40), width=1)

        # Draw decorative banner
        draw.rectangle([(30, 30), (width - 30, height - 30)], outline=(212, 255, 50), width=3)
        draw.text((50, 50), "WOX CINEMA STUDIO - KREA 2.0", fill=(212, 255, 50))
        draw.text((50, 90), f"Prompt: {prompt[:70]}", fill=(240, 240, 240))
        draw.text((50, 120), f"Style: {style} | {width}x{height}", fill=(160, 160, 160))
        return [img]
