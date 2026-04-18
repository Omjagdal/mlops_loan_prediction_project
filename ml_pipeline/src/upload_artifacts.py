"""
Upload trained model artifacts to Supabase Storage.
Used in CI/CD pipeline after successful training.

Uploads:
  - model.pkl (trained model)
  - scaler.pkl, label_encoders.pkl, target_encoder.pkl, feature_names.pkl (preprocessors)
  - model_metadata.json (metadata)
"""

import os
import sys

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "backend", "models")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

# Supabase config from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "ml-artifacts")


def upload_to_supabase():
    """Upload all model artifacts to Supabase Storage."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("WARNING: SUPABASE_URL and SUPABASE_KEY not set. Skipping upload.")
        print("   Set these environment variables to enable Supabase artifact storage.")
        return False

    try:
        from supabase import create_client
    except ImportError:
        print("ERROR: supabase package not installed. Run: pip install supabase")
        return False

    print("=" * 60)
    print("UPLOADING ML ARTIFACTS TO SUPABASE")
    print("=" * 60)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Files to upload
    artifacts = {
        # From backend/models/
        "model.pkl": os.path.join(MODELS_DIR, "model.pkl"),
        "model_metadata.json": os.path.join(MODELS_DIR, "model_metadata.json"),
        # From ml_pipeline/data/processed/
        "scaler.pkl": os.path.join(PROCESSED_DIR, "scaler.pkl"),
        "label_encoders.pkl": os.path.join(PROCESSED_DIR, "label_encoders.pkl"),
        "target_encoder.pkl": os.path.join(PROCESSED_DIR, "target_encoder.pkl"),
        "feature_names.pkl": os.path.join(PROCESSED_DIR, "feature_names.pkl"),
    }

    # Ensure bucket exists (create if not)
    try:
        buckets = client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if SUPABASE_BUCKET not in bucket_names:
            client.storage.create_bucket(SUPABASE_BUCKET, options={"public": False})
            print(f"Created bucket: {SUPABASE_BUCKET}")
        else:
            print(f"Bucket exists: {SUPABASE_BUCKET}")
    except Exception as e:
        print(f"Bucket check/create note: {e}")

    # Upload each artifact
    success_count = 0
    for remote_name, local_path in artifacts.items():
        if not os.path.exists(local_path):
            print(f"  [SKIP] {remote_name} — file not found at {local_path}")
            continue

        try:
            with open(local_path, "rb") as f:
                file_data = f.read()

            # Upload (upsert — overwrite if exists)
            client.storage.from_(SUPABASE_BUCKET).upload(
                remote_name,
                file_data,
                file_options={"upsert": "true", "content-type": "application/octet-stream"},
            )
            size_kb = len(file_data) / 1024
            print(f"  [OK] {remote_name} ({size_kb:.1f} KB)")
            success_count += 1
        except Exception as e:
            print(f"  [FAIL] {remote_name}: {e}")

    print(f"\nUploaded {success_count}/{len(artifacts)} artifacts to Supabase")
    print(f"Bucket: {SUPABASE_BUCKET}")
    print("=" * 60)

    return success_count == len(artifacts)


if __name__ == "__main__":
    success = upload_to_supabase()
    if not success:
        print("Some artifacts failed to upload.")
        if os.environ.get("CI") == "true":
            sys.exit(1)
