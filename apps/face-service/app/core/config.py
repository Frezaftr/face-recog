from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # InsightFace model name
    # buffalo_l  = best accuracy  (~500 MB)
    # buffalo_sc = smaller/faster (~200 MB)
    model_name: str = "buffalo_l"

    # Detection input size — larger = better recall, slower
    det_size_w: int = 640
    det_size_h: int = 640

    # ONNX execution provider context
    # 0  = first GPU (if CUDA available), falls back to CPU automatically
    # -1 = force CPU
    ctx_id: int = 0

    log_level: str = "info"


settings = Settings()
