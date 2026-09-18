from .wox_cinema_node import WOXCinemaStudioNode

NODE_CLASS_MAPPINGS = {
    "WOXCinemaStudioNode": WOXCinemaStudioNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WOXCinemaStudioNode": "WOX Cinema Studio (Z-Image Turbo & Minimax H3)"
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
