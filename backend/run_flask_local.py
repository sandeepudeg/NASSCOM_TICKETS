#!/usr/bin/env python3
"""
Local Flask Admin Runner
Loads local environment and starts Flask admin for development
"""

import os
import sys


def load_env_file(env_file=".env.local"):
    """Load environment variables from file"""
    if not os.path.exists(env_file):
        print(f"Environment file {env_file} not found")
        return

    print(f"Loading environment from {env_file}")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()
                print(f"   {key.strip()}={value.strip()}")


def main():
    """Main function to run Flask admin locally"""
    print("TicketIQ Flask Admin - Local Development")
    print("==========================================")

    # Load local environment
    load_env_file()

    # Set default values for local development
    os.environ.setdefault("SECRET_KEY", "dev-secret-key-for-local-development-only")
    os.environ.setdefault("FLASK_ENV", "development")
    os.environ.setdefault("DEBUG", "true")
    os.environ.setdefault("API_BASE_URL", "http://localhost:8000")
    os.environ.setdefault("HOST", "0.0.0.0")
    os.environ.setdefault("PORT", "5000")

    print(f"Starting Flask Admin on http://{os.environ['HOST']}:{os.environ['PORT']}")
    print(f"API Base URL: {os.environ['API_BASE_URL']}")
    print(f"Environment: {os.environ['FLASK_ENV']}")
    print(f"Debug Mode: {os.environ['DEBUG']}")

    # Import and run the Flask app
    try:
        from flask_admin.app import create_app

        app = create_app()

        # Run the app
        app.run(
            host=os.environ["HOST"],
            port=int(os.environ["PORT"]),
            debug=os.environ["DEBUG"].lower() == "true",
        )
    except ImportError as e:
        print(f"Error importing Flask admin: {e}")
        print(
            "Make sure you're in the correct directory and dependencies are installed"
        )
        sys.exit(1)
    except Exception as e:
        print(f"Error starting Flask admin: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
