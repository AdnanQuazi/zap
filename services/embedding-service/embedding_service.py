from typing import List
import os
import sys
import modal
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from starlette.status import HTTP_403_FORBIDDEN
from dotenv import load_dotenv
load_dotenv()  # This will load the environment variables from the .env file
import uvicorn

# Define the image with required dependencies
image = (
    modal.Image.debian_slim()
    .pip_install_from_requirements("requirements.txt")
    .env({"HF_HOME": "/model_cache"})
)

# Define the Modal app
app = modal.App("embedding-service")

# Volume for model cache
volume = modal.Volume.from_name("embedding-model-cache", create_if_missing=True)

# Model name
MODEL_NAME = "all-MiniLM-L6-v2"

# Define Pydantic request schemas
class EmbedRequest(BaseModel):
    text: str

class EmbedBatchRequest(BaseModel):
    texts: List[str]

# API key config
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
ENVIRONMENT = os.environ.get("MODAL_ENVIRONMENT", os.environ.get("ENVIRONMENT", "development"))

# Helper function to create the FastAPI application
def create_fastapi_app():
    from sentence_transformers import SentenceTransformer
    
    # Default local cache location (for non-Modal environments)
    cache_folder = os.environ.get("MODEL_CACHE_DIR", os.path.join(os.path.expanduser("~"), ".cache", "embedding-models"))
    os.makedirs(cache_folder, exist_ok=True)
    
    # Load model
    model = SentenceTransformer(MODEL_NAME, cache_folder=cache_folder)
    model.eval()

    # Get API key from environment with fallback for local development
    EMBEDDING_API_KEY = os.environ.get("EMBEDDING_API_KEY", "dev-key-local-only")

    fastapi_app = FastAPI(title="Embedding Service", 
                          description="API for generating text embeddings with " + MODEL_NAME,
                          version="1.0.0")

    async def get_api_key(api_key_header: str = Security(api_key_header)):
        # In local development mode, we can bypass API key validation if configured
        if ENVIRONMENT == "development" and os.environ.get("DISABLE_API_KEY_AUTH") == "true":
            return "dev-mode"
        
        # Otherwise, properly validate the API key
        if not api_key_header:
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN, detail="API key is missing"
            )
        
        if api_key_header != EMBEDDING_API_KEY:
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN, detail="Invalid API key"
            )
        
        return api_key_header


    @fastapi_app.post("/embed")
    async def post_embed(req: EmbedRequest, api_key: str = Depends(get_api_key)):
        print(f"Received request: {req}")
        embedding = model.encode(req.text, normalize_embeddings=True).tolist()
        return {"embedding": embedding}

    @fastapi_app.post("/embed_batch")
    async def post_embed_batch(req: EmbedBatchRequest, api_key: str = Depends(get_api_key)):
        embeddings = model.encode(req.texts, normalize_embeddings=True).tolist()
        return {"embeddings": embeddings}

    @fastapi_app.get("/health")
    async def get_health():
        return {
            "status": "ok", 
            "model": MODEL_NAME,
            "environment": ENVIRONMENT,
        }

    return fastapi_app

# Modal function definition
@app.function(
    image=image,
    gpu="any",
    volumes={"/model_cache": volume},
    secrets=[modal.Secret.from_name("embedding-api-key")],
)
@modal.asgi_app()
def web():
    return create_fastapi_app()

# Local development server
def run_local_server():
    print("Starting local development server...")
    os.environ["ENVIRONMENT"] = "development"
    
    # Set a default API key for local development if not provided
    if "EMBEDDING_API_KEY" not in os.environ:
        print("Warning: No API key set. Using default development key.")
        print("Set the EMBEDDING_API_KEY environment variable to use a custom key.")
        os.environ["EMBEDDING_API_KEY"] = "dev-key-local-only"
    
    # Create and run the FastAPI app locally
    fastapi_app = create_fastapi_app()
    uvicorn.run(fastapi_app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "local":
        run_local_server()
    else:
        print("Deploy with: modal deploy embedding_service.py")
        print("Run locally with: python embedding_service.py local")