#!/usr/bin/env python3
"""
Flask Admin Entry Point for Hugging Face Spaces

This file serves as the main entry point for both local development
and Hugging Face Spaces deployment. It creates and configures the
Flask application with environment-specific settings.

Key Features:
- Automatic HF Spaces environment detection
- Dynamic CORS origin resolution for HF Spaces
- Host 0.0.0.0 and port 7860 configuration for HF Spaces
- Environment variable loading with HF Spaces secrets support
"""

import os
import sys

from flask_admin.app import create_app
from flask_admin.config import configure_for_hf_spaces, get_hf_space_url, is_hf_spaces

# Configure for HF Spaces if detected (must be called before app creation)
configure_for_hf_spaces()

# Create Flask application with HF Spaces configuration
app = create_app()


def validate_hf_spaces_config():
    """Validate HF Spaces configuration and log important information"""
    if is_hf_spaces():
        print("🚀 HF Spaces deployment detected")

        # Log HF Space URL resolution
        space_url = get_hf_space_url()
        if space_url:
            print(f"📍 HF Space URL: {space_url}")
        else:
            print("⚠️  Could not resolve HF Space URL")

        # Validate critical configuration
        host = app.config.get("HOST")
        port = app.config.get("PORT")

        if host != "0.0.0.0":
            print(f"⚠️  Warning: HOST is {host}, should be 0.0.0.0 for HF Spaces")

        if port != 7860:
            print(f"⚠️  Warning: PORT is {port}, should be 7860 for HF Spaces")

        # Check environment variables
        api_base_url = os.getenv("API_BASE_URL")
        secret_key = os.getenv("SECRET_KEY")

        if not api_base_url:
            print("❌ API_BASE_URL not configured - please set in HF Spaces secrets")
        else:
            print(f"✅ API_BASE_URL configured: {api_base_url}")

        if not secret_key:
            print("❌ SECRET_KEY not configured - please set in HF Spaces secrets")
        else:
            print("✅ SECRET_KEY configured")

        print(
            "💡 Configure missing variables in HF Spaces Settings > Repository secrets"
        )

    else:
        print("🏠 Local/Docker deployment detected")
        print(f"📍 Running on: http://localhost:{app.config.get('PORT', 5000)}")


if __name__ == "__main__":
    # Validate configuration
    validate_hf_spaces_config()

    # Get configuration from environment with HF Spaces defaults
    host = app.config.get("HOST", "0.0.0.0")
    port = int(app.config.get("PORT", 7860))
    debug = app.config.get("DEBUG", False)

    # Log startup information
    app.logger.info(f"Starting Flask Admin on {host}:{port}")
    app.logger.info(f"Debug mode: {debug}")
    app.logger.info(f"Environment: {app.config.get('FLASK_ENV', 'development')}")
    app.logger.info(f"API Base URL: {app.config.get('API_BASE_URL')}")

    # Log HF Spaces specific information
    if is_hf_spaces():
        app.logger.info("HF Spaces deployment mode active")
        space_url = get_hf_space_url()
        if space_url:
            app.logger.info(f"HF Space URL: {space_url}")
        cors_origins = os.getenv("CORS_ORIGINS", "Not configured")
        app.logger.info(f"CORS Origins: {cors_origins}")
    else:
        app.logger.info("Local/Docker deployment mode active")

    # Run the application
    try:
        app.run(host=host, port=port, debug=debug, threaded=True)
    except Exception as e:
        app.logger.error(f"Failed to start Flask application: {str(e)}")
        sys.exit(1)
