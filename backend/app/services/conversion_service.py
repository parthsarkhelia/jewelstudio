import tempfile
from pathlib import Path

import trimesh


SUPPORTED_IMPORT_FORMATS = {".obj", ".stl", ".ply", ".glb", ".gltf", ".3dm", ".fbx", ".off", ".dae"}
SUPPORTED_EXPORT_FORMATS = {".obj", ".stl", ".ply", ".glb", ".gltf", ".off"}


class ConversionService:
    def convert_to_glb(self, input_path: str) -> str:
        ext = Path(input_path).suffix.lower()

        if ext == ".3dm":
            return self._convert_3dm_to_glb(input_path)

        scene = trimesh.load(input_path)
        output_path = tempfile.mktemp(suffix=".glb")

        if isinstance(scene, trimesh.Scene):
            scene.export(output_path, file_type="glb")
        elif isinstance(scene, trimesh.Trimesh):
            scene = trimesh.Scene(geometry={"mesh": scene})
            scene.export(output_path, file_type="glb")
        else:
            raise ValueError(f"Unsupported geometry type: {type(scene)}")

        return output_path

    def _convert_3dm_to_glb(self, input_path: str) -> str:
        import rhino3dm

        model = rhino3dm.File3dm.Read(input_path)
        if model is None:
            raise ValueError("Failed to read .3dm file")

        meshes = []
        for obj in model.Objects:
            geom = obj.Geometry
            mesh = None
            if isinstance(geom, rhino3dm.Mesh):
                mesh = geom
            elif isinstance(geom, rhino3dm.Brep):
                mesh = rhino3dm.Mesh.CreateFromBrep(geom)
            if mesh:
                vertices = [[v.X, v.Y, v.Z] for v in mesh.Vertices]
                faces = [[f[0], f[1], f[2]] for f in mesh.Faces]
                if vertices and faces:
                    tm = trimesh.Trimesh(vertices=vertices, faces=faces)
                    meshes.append(tm)

        if not meshes:
            raise ValueError("No mesh geometry found in .3dm file")

        scene = trimesh.Scene(geometry={f"mesh_{i}": m for i, m in enumerate(meshes)})
        output_path = tempfile.mktemp(suffix=".glb")
        scene.export(output_path, file_type="glb")
        return output_path

    def convert_format(self, input_path: str, target_format: str) -> str:
        target_ext = f".{target_format.lower().lstrip('.')}"
        if target_ext not in SUPPORTED_EXPORT_FORMATS:
            raise ValueError(f"Unsupported export format: {target_format}")

        scene = trimesh.load(input_path)
        output_path = tempfile.mktemp(suffix=target_ext)

        if isinstance(scene, trimesh.Scene):
            if target_ext in {".obj", ".stl", ".ply", ".off"}:
                combined = scene.dump(concatenate=True)
                combined.export(output_path, file_type=target_ext.lstrip("."))
            else:
                scene.export(output_path, file_type=target_ext.lstrip("."))
        elif isinstance(scene, trimesh.Trimesh):
            scene.export(output_path, file_type=target_ext.lstrip("."))
        else:
            raise ValueError(f"Unsupported geometry type: {type(scene)}")

        return output_path

    def get_mesh_info(self, file_path: str) -> dict:
        scene = trimesh.load(file_path)
        parts = []
        total_vertices = 0
        total_faces = 0

        if isinstance(scene, trimesh.Scene):
            for name, geom in scene.geometry.items():
                if isinstance(geom, trimesh.Trimesh):
                    parts.append({
                        "name": name,
                        "vertex_count": len(geom.vertices),
                        "face_count": len(geom.faces),
                    })
                    total_vertices += len(geom.vertices)
                    total_faces += len(geom.faces)
        elif isinstance(scene, trimesh.Trimesh):
            parts.append({
                "name": "mesh",
                "vertex_count": len(scene.vertices),
                "face_count": len(scene.faces),
            })
            total_vertices = len(scene.vertices)
            total_faces = len(scene.faces)

        return {
            "total_vertices": total_vertices,
            "total_faces": total_faces,
            "parts": parts,
        }

    def optimize_mesh(self, file_path: str, max_triangles: int = 500_000) -> str:
        scene = trimesh.load(file_path)

        if isinstance(scene, trimesh.Scene):
            combined = scene.dump(concatenate=True)
        elif isinstance(scene, trimesh.Trimesh):
            combined = scene
        else:
            return file_path

        if len(combined.faces) > max_triangles:
            ratio = max_triangles / len(combined.faces)
            combined = combined.simplify_quadric_decimation(int(len(combined.faces) * ratio))

        output_path = tempfile.mktemp(suffix=".glb")
        trimesh.Scene(geometry={"mesh": combined}).export(output_path, file_type="glb")
        return output_path


conversion_service = ConversionService()
