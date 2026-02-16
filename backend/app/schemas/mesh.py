from pydantic import BaseModel


class MeshPart(BaseModel):
    name: str
    vertex_count: int
    face_count: int


class MeshInfoResponse(BaseModel):
    model_id: str
    total_vertices: int
    total_faces: int
    parts: list[MeshPart]
