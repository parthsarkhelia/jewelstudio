import logging
import tempfile

import numpy as np

logger = logging.getLogger(__name__)

try:
    import pyrender
    import trimesh as tm

    PYRENDER_AVAILABLE = True
except ImportError:
    PYRENDER_AVAILABLE = False
    logger.warning("pyrender not available — thumbnail generation disabled")


class ThumbnailService:
    def generate_thumbnail(self, glb_path: str, width: int = 512, height: int = 512) -> str:
        if not PYRENDER_AVAILABLE:
            raise RuntimeError("pyrender not available for thumbnail generation")

        logger.info("Generating thumbnail for %s", glb_path)

        mesh = tm.load(glb_path)
        scene = pyrender.Scene(bg_color=[0.1, 0.1, 0.1, 1.0])

        if isinstance(mesh, tm.Scene):
            for geom in mesh.geometry.values():
                if isinstance(geom, tm.Trimesh):
                    scene.add(pyrender.Mesh.from_trimesh(geom))
        elif isinstance(mesh, tm.Trimesh):
            scene.add(pyrender.Mesh.from_trimesh(mesh))

        bounds = mesh.bounds if hasattr(mesh, "bounds") else np.array([[-1, -1, -1], [1, 1, 1]])
        center = (bounds[0] + bounds[1]) / 2
        size = np.linalg.norm(bounds[1] - bounds[0])

        camera = pyrender.PerspectiveCamera(yfov=np.pi / 4)
        camera_pose = np.eye(4)
        camera_pose[:3, 3] = center + np.array([0, 0, size * 1.5])
        scene.add(camera, pose=camera_pose)

        light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=3.0)
        scene.add(light, pose=camera_pose)

        renderer = pyrender.OffscreenRenderer(width, height)
        color, _ = renderer.render(scene)
        renderer.delete()

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            output_path = tmp.name
        from PIL import Image

        img = Image.fromarray(color)
        img.save(output_path)
        return output_path


thumbnail_service = ThumbnailService()
