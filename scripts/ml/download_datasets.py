#!/usr/bin/env python3
"""
Kaggle Dataset Download Script

Downloads all required Kaggle datasets for the Tickets Folder AI classifier training pipeline.
Stores raw files in MinIO under datasets/raw/ for caching and reuse.

Requirements: 20.1, 20.2, 20.3, 20.4

Usage:
    python download_datasets.py [--skip-upload]

Environment Variables:
    MINIO_ENDPOINT: MinIO server endpoint (default: localhost:9000)
    MINIO_ACCESS_KEY: MinIO access key (default: minioadmin)
    MINIO_SECRET_KEY: MinIO secret key (default: minioadmin)
    MINIO_BUCKET: MinIO bucket name (default: ml-datasets)
    MINIO_USE_SSL: Use SSL for MinIO connection (default: false)
"""

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import List, Tuple

try:
    import kagglehub
except ImportError:
    print(
        "ERROR: kagglehub is not installed. Install with: pip install kagglehub",
        file=sys.stderr,
    )
    sys.exit(1)

try:
    from minio import Minio
    from minio.error import S3Error
except ImportError:
    print(
        "ERROR: minio is not installed. Install with: pip install minio",
        file=sys.stderr,
    )
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Dataset definitions (Requirement 20.1)
DATASETS = [
    "adisongoh/it-service-ticket-classification-dataset",
    "tobiasbueck/multilingual-customer-support-tickets",
    "vipulshinde/incident-response-log",
]


def get_minio_client() -> Minio:
    """
    Create and return a MinIO client using environment variables.

    Returns:
        Minio: Configured MinIO client instance
    """
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"

    logger.info(f"Connecting to MinIO at {endpoint} (SSL: {use_ssl})")

    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=use_ssl)


def ensure_bucket_exists(client: Minio, bucket_name: str) -> None:
    """
    Ensure the MinIO bucket exists, create if it doesn't.

    Args:
        client: MinIO client instance
        bucket_name: Name of the bucket to check/create
    """
    try:
        if not client.bucket_exists(bucket_name):
            logger.info(f"Creating bucket: {bucket_name}")
            client.make_bucket(bucket_name)
        else:
            logger.info(f"Bucket already exists: {bucket_name}")
    except S3Error as e:
        logger.error(f"Failed to ensure bucket exists: {e}")
        raise


def download_kaggle_dataset(dataset_id: str) -> Path:
    """
    Download a Kaggle dataset using kagglehub.

    Args:
        dataset_id: Kaggle dataset identifier (owner/dataset-name)

    Returns:
        Path: Local path where the dataset was downloaded

    Raises:
        Exception: If download fails
    """
    logger.info(f"Downloading Kaggle dataset: {dataset_id}")

    try:
        # kagglehub.dataset_download returns the path where files are cached
        download_path = kagglehub.dataset_download(dataset_id)
        logger.info(f"Dataset downloaded to: {download_path}")
        return Path(download_path)
    except Exception as e:
        logger.error(f"Failed to download dataset {dataset_id}: {e}")
        raise


def upload_to_minio(
    client: Minio, bucket_name: str, local_path: Path, dataset_id: str
) -> List[str]:
    """
    Upload all files from a local directory to MinIO under datasets/raw/{dataset_id}/.

    Args:
        client: MinIO client instance
        bucket_name: Target bucket name
        local_path: Local directory containing dataset files
        dataset_id: Dataset identifier for organizing in MinIO

    Returns:
        List[str]: List of uploaded object names

    Raises:
        S3Error: If upload fails
    """
    uploaded_files = []

    # Sanitize dataset_id for use as a path component
    safe_dataset_id = dataset_id.replace("/", "_")
    minio_prefix = f"datasets/raw/{safe_dataset_id}"

    logger.info(f"Uploading files from {local_path} to {bucket_name}/{minio_prefix}/")

    # Walk through all files in the downloaded directory
    for file_path in local_path.rglob("*"):
        if file_path.is_file():
            # Compute relative path from download root
            relative_path = file_path.relative_to(local_path)
            object_name = f"{minio_prefix}/{relative_path}"

            try:
                client.fput_object(bucket_name, object_name, str(file_path))
                logger.info(f"Uploaded: {object_name}")
                uploaded_files.append(object_name)
            except S3Error as e:
                logger.error(f"Failed to upload {file_path}: {e}")
                raise

    return uploaded_files


def download_and_upload_datasets(skip_upload: bool = False) -> Tuple[int, int]:
    """
    Download all Kaggle datasets and upload to MinIO.

    Args:
        skip_upload: If True, skip MinIO upload (download only)

    Returns:
        Tuple[int, int]: (successful_downloads, failed_downloads)
    """
    successful = 0
    failed = 0

    # Initialize MinIO client if upload is enabled
    minio_client = None
    bucket_name = os.getenv("MINIO_BUCKET", "ml-datasets")

    if not skip_upload:
        try:
            minio_client = get_minio_client()
            ensure_bucket_exists(minio_client, bucket_name)
        except Exception as e:
            logger.error(f"Failed to initialize MinIO client: {e}")
            return 0, len(DATASETS)

    # Process each dataset
    for dataset_id in DATASETS:
        try:
            # Download from Kaggle
            local_path = download_kaggle_dataset(dataset_id)

            # Upload to MinIO if enabled
            if not skip_upload and minio_client:
                uploaded_files = upload_to_minio(
                    minio_client, bucket_name, local_path, dataset_id
                )
                logger.info(
                    f"Successfully processed {dataset_id}: "
                    f"{len(uploaded_files)} files uploaded"
                )
            else:
                logger.info(f"Successfully downloaded {dataset_id} (upload skipped)")

            successful += 1

        except Exception as e:
            logger.error(f"Failed to process dataset {dataset_id}: {e}")
            failed += 1

    return successful, failed


def main() -> int:
    """
    Main entry point for the dataset download script.

    Returns:
        int: Exit code (0 for success, 1 for failure)
    """
    parser = argparse.ArgumentParser(
        description="Download Kaggle datasets and upload to MinIO"
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Download datasets but skip MinIO upload",
    )

    args = parser.parse_args()

    logger.info("Starting Kaggle dataset download pipeline")
    logger.info(f"Datasets to download: {len(DATASETS)}")

    successful, failed = download_and_upload_datasets(skip_upload=args.skip_upload)

    logger.info(f"Download pipeline complete: {successful} successful, {failed} failed")

    if failed > 0:
        logger.error("Some datasets failed to download/upload")
        return 1

    logger.info("All datasets downloaded and uploaded successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
