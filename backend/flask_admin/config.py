import os


class Config:
    """
    Flask application configuration

    Note: Streamlit local state migration completed successfully on 2026-04-09.
    No user preferences were found to migrate (expected - default settings used).
    See STREAMLIT_MIGRATION_REPORT.md for complete migration documentation.
    """

    def __init__(self):
        self.update_config()

    def update_config(self):
        """Update configuration based on current environment variables"""
        # Flask Configuration
        self.SECRET_KEY = os.getenv("SECRET_KEY")
        self.FLASK_ENV = os.getenv("FLASK_ENV", "development")

        if not self.SECRET_KEY and self.FLASK_ENV == "production":
            raise ValueError("SECRET_KEY must be set in production")

        # Disable debug mode in production
        if self.FLASK_ENV == "production":
            self.DEBUG = False
        else:
            self.DEBUG = os.getenv("DEBUG", "False").lower() == "true"

        # API Configuration
        self.API_BASE_URL = os.getenv("API_BASE_URL", "http://api:8000")

        # Server Configuration
        self.PORT = int(os.getenv("PORT", "7860"))  # HF Spaces default
        self.HOST = os.getenv("HOST", "0.0.0.0")

        # Security Configuration - CSRF Protection with Flask-WTF
        self.WTF_CSRF_ENABLED = True
        self.WTF_CSRF_TIME_LIMIT = 3600  # 1 hour
        self.WTF_CSRF_SSL_STRICT = os.getenv("HTTPS", "False").lower() == "true"

        # Secure session cookies for production
        self.SESSION_COOKIE_SECURE = os.getenv("HTTPS", "False").lower() == "true"
        self.SESSION_COOKIE_HTTPONLY = True
        self.SESSION_COOKIE_SAMESITE = "Lax"

        # Additional security headers
        self.SEND_FILE_MAX_AGE_DEFAULT = 3600  # 1 hour cache for static files

        # Static asset optimization settings
        self.STATIC_ASSET_MAX_AGE = 3600  # 1 hour cache for static assets
        self.STATIC_ASSET_IMMUTABLE = True  # Mark static assets as immutable
        self.ENABLE_STATIC_ASSET_VERSIONING = (
            True  # Enable asset versioning for cache busting
        )

        # Logging Configuration
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

        # Set JSON logging for production by default
        log_format = os.getenv("LOG_FORMAT", "text")
        if self.FLASK_ENV == "production" and log_format == "text":
            self.LOG_FORMAT = "json"
        else:
            self.LOG_FORMAT = log_format

        # Caching Configuration - In-memory for HF Spaces compatibility
        self.CACHE_TYPE = "SimpleCache"  # In-memory for HF Spaces compatibility
        self.CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
        self.CACHE_KEY_PREFIX = "flask_admin_"
        self.CACHE_THRESHOLD = 500  # Maximum cached items to prevent memory issues

        # Cache configuration for different endpoints with optimized timeouts
        self.CACHE_FOLDERS_TIMEOUT = 300  # 5 minutes for folders (frequently accessed)
        self.CACHE_HEALTH_TIMEOUT = (
            60  # 1 minute for health checks (real-time monitoring)
        )
        self.CACHE_ESCALATIONS_TIMEOUT = (
            180  # 3 minutes for escalations (moderate frequency)
        )
        self.CACHE_CLASSIFICATION_TIMEOUT = (
            600  # 10 minutes for classification results (expensive operations)
        )

        # Request Configuration with limits for performance
        self.MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max request size
        self.REQUEST_TIMEOUT = 120  # 120 seconds request timeout to match ML inference

        # Request rate limiting and connection management
        self.MAX_CONCURRENT_REQUESTS = 10  # Limit concurrent requests for HF Spaces
        self.CONNECTION_POOL_SIZE = 10  # Connection pool size for API client
        self.CONNECTION_POOL_MAXSIZE = 10  # Maximum connections per pool
        self.API_REQUEST_RETRIES = 3  # Number of retries for failed API requests

        # Compression Configuration - Optimized for HF Spaces
        self.COMPRESS_MIMETYPES = [
            "text/html",
            "text/css",
            "text/xml",
            "text/plain",
            "text/javascript",
            "application/json",
            "application/javascript",
            "application/xml",
            "application/rss+xml",
            "application/atom+xml",
            "image/svg+xml",
        ]
        self.COMPRESS_LEVEL = 6  # Balance between compression ratio and CPU usage
        self.COMPRESS_MIN_SIZE = 500  # Only compress responses larger than 500 bytes
        self.COMPRESS_ALGORITHM = "gzip"  # Use gzip compression (widely supported)

        # Additional compression settings for static assets
        self.COMPRESS_REGISTER = True  # Register compression for all responses
        self.COMPRESS_DEBUG = False  # Disable debug mode for compression

        # CORS Configuration
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")

        # Gunicorn Configuration (for production deployment)
        self.GUNICORN_WORKERS = int(os.getenv("GUNICORN_WORKERS", "2"))
        self.GUNICORN_BIND = f"{self.HOST}:{self.PORT}"


def is_hf_spaces():
    """
    Check if running on Hugging Face Spaces environment.

    Uses multiple detection methods to reliably identify HF Spaces:
    1. Primary: SPACE_ID environment variable
    2. Secondary: HF-specific environment variables
    3. Tertiary: Container characteristics and hostname patterns

    Returns:
        bool: True if running on HF Spaces, False otherwise
    """
    # Primary detection via SPACE_ID environment variable
    space_id = os.getenv("SPACE_ID")
    if space_id is not None:
        print(f"🎯 HF Spaces detected via SPACE_ID: {space_id}")
        return True

    # Secondary detection methods for HF Spaces environment
    # Check for HF Spaces specific environment variables
    hf_indicators = [
        "HF_HOME",
        "HUGGINGFACE_HUB_CACHE",
        "SPACE_AUTHOR_NAME",
        "SPACE_REPO_NAME",
        "GRADIO_SERVER_NAME",  # Gradio spaces indicator
        "SYSTEM",  # HF Spaces system indicator
    ]

    detected_indicators = []
    for indicator in hf_indicators:
        if os.getenv(indicator) is not None:
            detected_indicators.append(indicator)

    if detected_indicators:
        print(f"🎯 HF Spaces detected via indicators: {detected_indicators}")
        return True

    # Check if running on port 7860 (HF Spaces default) with specific hostname patterns
    port = os.getenv("PORT", "")
    host = os.getenv("HOST", "")
    hostname = os.getenv("HOSTNAME", "")

    if port == "7860" and host == "0.0.0.0":
        if hostname and (
            "hf.space" in hostname
            or "huggingface" in hostname.lower()
            or "space" in hostname.lower()
        ):
            print(f"🎯 HF Spaces detected via port/hostname: {hostname}")
            return True

    # Additional check for HF Spaces specific paths and container structure
    hf_paths = [
        "/home/user",  # Common HF Spaces user directory
        "/app",  # Common app directory in HF Spaces
        "/tmp",  # Standard temp directory
    ]

    if all(os.path.exists(path) for path in hf_paths):
        # Check for HF Spaces specific environment characteristics
        if hostname and (len(hostname) > 10 or "space" in hostname.lower()):
            print(
                f"🎯 HF Spaces detected via container structure and hostname: {hostname}"
            )
            return True

        # Check for specific HF Spaces process indicators
        if os.getenv("USER") == "user" and port == "7860":
            print("🎯 HF Spaces detected via user and port configuration")
            return True

    # Final check: Look for HF Spaces in environment dump
    env_dump = " ".join([f"{k}={v}" for k, v in os.environ.items()])
    if "huggingface" in env_dump.lower() or "hf.space" in env_dump.lower():
        print("🎯 HF Spaces detected via environment variables scan")
        return True

    print("🏠 Local/Docker environment detected (not HF Spaces)")
    return False


def get_hf_space_url():
    """
    Get HF Space URL for CORS configuration and dynamic origin resolution.

    Resolves the HF Space URL using multiple methods:
    1. SPACE_ID environment variable (format: owner/space-name)
    2. Individual SPACE_AUTHOR_NAME and SPACE_REPO_NAME variables
    3. Fallback to specific known deployment URL

    Returns:
        str: The HF Space URL (e.g., https://owner-space-name.hf.space) or None
    """
    # Method 1: Use SPACE_ID environment variable
    space_id = os.getenv("SPACE_ID")
    if space_id:
        print(f"📍 Found SPACE_ID: {space_id}")

        # Handle different SPACE_ID formats
        if "/" in space_id:
            # Format: "owner/space-name" -> "owner-space-name"
            space_url_part = space_id.replace("/", "-")
        else:
            # Already in correct format
            space_url_part = space_id

        space_url = f"https://{space_url_part}.hf.space"

        # Validate the URL format (should contain at least one dash for owner-space format)
        if space_url_part and ("-" in space_url_part or len(space_url_part) > 5):
            print(f"✅ Resolved HF Space URL from SPACE_ID: {space_url}")
            return space_url

    # Method 2: Use individual SPACE_AUTHOR_NAME and SPACE_REPO_NAME
    space_author = os.getenv("SPACE_AUTHOR_NAME")
    space_repo = os.getenv("SPACE_REPO_NAME")

    if space_author and space_repo:
        space_url = f"https://{space_author}-{space_repo}.hf.space"
        print(f"✅ Resolved HF Space URL from author/repo: {space_url}")
        return space_url

    # Method 3: Fallback to specific known deployment URL for sandeepudeg/tickets
    if is_hf_spaces():
        # This handles the specific deployment mentioned in the task
        fallback_url = "https://sandeepudeg-tickets.hf.space"
        print(f"⚠️  Using fallback HF Space URL: {fallback_url}")
        return fallback_url

    print("❌ Could not resolve HF Space URL")
    return None


def configure_for_hf_spaces():
    """
    Configure environment variables for HF Spaces deployment.

    This function:
    1. Detects HF Spaces environment
    2. Resolves dynamic CORS origins for the specific HF Space
    3. Sets appropriate host (0.0.0.0) and port (7860) for HF Spaces
    4. Configures production settings and logging format
    5. Ensures environment variable loading works with HF Spaces secrets
    """
    if is_hf_spaces():
        print("🚀 HF Spaces environment detected - configuring...")

        # Dynamic CORS origin resolution for the specific HF Space
        space_url = get_hf_space_url()
        if space_url:
            print(f"📍 Resolved HF Space URL: {space_url}")

            # Set CORS origins for the specific HF Space
            existing_origins = os.getenv("CORS_ORIGINS", "")

            # Handle different scenarios for CORS configuration
            if not existing_origins:
                # No existing CORS origins - set to HF Space URL
                os.environ["CORS_ORIGINS"] = space_url
                print(f"🔗 Set CORS origins to: {space_url}")
            elif existing_origins == "http://localhost:5001":
                # Replace localhost with HF Space URL
                os.environ["CORS_ORIGINS"] = space_url
                print(f"🔗 Replaced localhost CORS origins with: {space_url}")
            elif space_url not in existing_origins:
                # Add HF Space URL to existing origins
                os.environ["CORS_ORIGINS"] = f"{existing_origins},{space_url}"
                print(f"🔗 Added to existing CORS origins: {space_url}")
            else:
                print(f"✅ HF Space URL already in CORS origins: {space_url}")
        else:
            print("⚠️  Could not resolve HF Space URL for CORS configuration")

        # Configure Flask to run on host 0.0.0.0 and port 7860 for HF Spaces
        os.environ.setdefault("HOST", "0.0.0.0")
        os.environ.setdefault("PORT", "7860")

        # Set up environment variable loading with HF Spaces secrets
        # HF Spaces provides secrets as environment variables automatically
        print("🔐 Environment variable loading configured for HF Spaces secrets")

        # Ensure production settings for HF Spaces
        os.environ.setdefault("FLASK_ENV", "production")
        os.environ.setdefault("LOG_FORMAT", "json")
        os.environ["DEBUG"] = "false"  # Force disable debug in HF Spaces

        # Validate critical environment variables for HF Spaces
        critical_vars = ["SECRET_KEY", "API_BASE_URL"]
        missing_vars = []

        for var in critical_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        if missing_vars:
            print(f"⚠️  Missing critical environment variables: {missing_vars}")
            print("💡 Please configure these in HF Spaces secrets:")
            for var in missing_vars:
                if var == "SECRET_KEY":
                    print(
                        f"   - {var}: Generate with 'python -c \"import secrets; print(secrets.token_hex(32))\"'"
                    )
                elif var == "API_BASE_URL":
                    print(f"   - {var}: URL of your FastAPI backend service")
        else:
            print("✅ All critical environment variables are configured")

        # Log final configuration
        print("⚙️  HF Spaces configuration complete:")
        print(f"   - HOST: {os.getenv('HOST')}")
        print(f"   - PORT: {os.getenv('PORT')}")
        print(f"   - FLASK_ENV: {os.getenv('FLASK_ENV')}")
        print(f"   - LOG_FORMAT: {os.getenv('LOG_FORMAT')}")
        print(f"   - DEBUG: {os.getenv('DEBUG')}")
        print(f"   - CORS_ORIGINS: {os.getenv('CORS_ORIGINS', 'Not set')}")

    else:
        print("🏠 Local/Docker environment detected - using default configuration")
        print(f"   - Default HOST: {os.getenv('HOST', '0.0.0.0')}")
        print(
            f"   - Default PORT: {os.getenv('PORT', '5000')} (local), 7860 (HF Spaces)"
        )
        print("   - Default CORS: http://localhost:5001")
