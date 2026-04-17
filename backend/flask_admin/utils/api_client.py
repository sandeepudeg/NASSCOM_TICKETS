import logging
import os
import time

import requests

logger = logging.getLogger(__name__)


class APIClient:
    """HTTP client for FastAPI backend communication with optimized connection pooling"""

    def __init__(self, base_url: str, timeout: int | None = None, config=None):
        self.base_url = base_url.rstrip("/")

        # Use timeout from config if provided, otherwise fallback to argument or default
        if config and hasattr(config, "REQUEST_TIMEOUT"):
            self.timeout = config.REQUEST_TIMEOUT
        else:
            self.timeout = timeout or 10
        self.session = requests.Session()

        # Get configuration values for connection pooling
        if config:
            pool_connections = getattr(config, "CONNECTION_POOL_SIZE", 10)
            pool_maxsize = getattr(config, "CONNECTION_POOL_MAXSIZE", 10)
            max_retries = getattr(config, "API_REQUEST_RETRIES", 3)
        else:
            # Default values if no config provided
            pool_connections = 10
            pool_maxsize = 10
            max_retries = 3

        # Configure session with enhanced connection pooling for performance
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=pool_connections,  # Number of connection pools
            pool_maxsize=pool_maxsize,  # Maximum connections per pool
            max_retries=max_retries,  # Retry failed requests
            pool_block=False,  # Don't block when pool is full
        )
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Set session-level headers for better performance
        self.session.headers.update(
            {
                "User-Agent": "Flask-Admin/1.0.0",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
            }
        )

    def _make_request(self, method: str, endpoint: str, **kwargs) -> dict | None:
        """Make HTTP request with error handling and structured logging"""
        url = f"{self.base_url}{endpoint}"

        try:
            start_time = time.time()
            response = self.session.request(method, url, timeout=self.timeout, **kwargs)
            response_time = time.time() - start_time

            # Log API call with structured logging if available
            if os.getenv("LOG_FORMAT") == "json":
                try:
                    import structlog

                    api_logger = structlog.get_logger()
                    api_logger.info(
                        "api_call",
                        method=method,
                        endpoint=endpoint,
                        url=url,
                        status_code=response.status_code,
                        response_time_seconds=response_time,
                        content_length=len(response.content) if response.content else 0,
                        timestamp=time.time(),
                    )
                except ImportError:
                    logger.info(
                        f"API Call: {method} {url} - {response.status_code} ({response_time:.3f}s)"
                    )
            else:
                logger.info(
                    f"API Call: {method} {url} - {response.status_code} ({response_time:.3f}s)"
                )

            response.raise_for_status()

            # Handle empty responses
            if response.status_code == 204 or not response.content:
                return {}

            return response.json()

        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error {e.response.status_code} for {url}"
            if e.response.text:
                error_msg += f": {e.response.text}"

            if os.getenv("LOG_FORMAT") == "json":
                try:
                    import structlog

                    api_logger = structlog.get_logger()
                    api_logger.error(
                        "api_error",
                        method=method,
                        endpoint=endpoint,
                        url=url,
                        error_type="http_error",
                        status_code=e.response.status_code,
                        error_message=error_msg,
                    )
                except ImportError:
                    logger.error(error_msg)
            else:
                logger.error(error_msg)
            return None

        except requests.exceptions.ConnectionError:
            error_msg = f"Connection error for {url}"
            if os.getenv("LOG_FORMAT") == "json":
                try:
                    import structlog

                    api_logger = structlog.get_logger()
                    api_logger.error(
                        "api_error",
                        method=method,
                        endpoint=endpoint,
                        url=url,
                        error_type="connection_error",
                        error_message=error_msg,
                    )
                except ImportError:
                    logger.error(error_msg)
            else:
                logger.error(error_msg)
            return None

        except requests.exceptions.Timeout:
            error_msg = f"Timeout error for {url} (timeout: {self.timeout}s)"
            if os.getenv("LOG_FORMAT") == "json":
                try:
                    import structlog

                    api_logger = structlog.get_logger()
                    api_logger.error(
                        "api_error",
                        method=method,
                        endpoint=endpoint,
                        url=url,
                        error_type="timeout_error",
                        timeout_seconds=self.timeout,
                        error_message=error_msg,
                    )
                except ImportError:
                    logger.error(error_msg)
            else:
                logger.error(error_msg)
            return None

        except requests.exceptions.JSONDecodeError:
            error_msg = f"JSON decode error for {url}"
            logger.error(error_msg)
            return None

        except Exception as e:
            error_msg = f"Unexpected error for {url}: {str(e)}"
            logger.error(error_msg)
            return None

    def get(self, endpoint: str, params: dict | None = None) -> dict | None:
        """Make GET request"""
        return self._make_request("GET", endpoint, params=params)

    def post(self, endpoint: str, data: dict | None = None) -> dict | None:
        """Make POST request"""
        return self._make_request("POST", endpoint, json=data)

    def put(self, endpoint: str, data: dict | None = None) -> dict | None:
        """Make PUT request"""
        return self._make_request("PUT", endpoint, json=data)

    def delete(self, endpoint: str) -> dict | None:
        """Make DELETE request"""
        return self._make_request("DELETE", endpoint)

    def health_check(self) -> bool:
        """Check if API backend is reachable"""
        try:
            response = self.get("/health/live")
            return response is not None
        except Exception:
            return False

    def close(self):
        """Close the underlying session and release resources"""
        self.session.close()
