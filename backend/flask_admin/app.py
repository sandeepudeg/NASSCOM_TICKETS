from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_wtf.csrf import CSRFProtect, CSRFError
from flask_compress import Compress
from flask_caching import Cache
from flask_cors import CORS
import os
import logging
from datetime import datetime
from .config import Config, configure_for_hf_spaces
from .utils.api_client import APIClient

def create_app():
    """Flask application factory"""
    # Configure for HF Spaces if detected
    configure_for_hf_spaces()
    
    app = Flask(__name__)
    
    # Create and configure the config object
    config = Config()
    app.config.from_object(config)
    
    # Initialize extensions
    csrf = CSRFProtect(app)
    compress = Compress(app)
    cache = Cache(app)
    
    # Store cache instance for use in routes
    app.cache = cache
    
    # Configure static asset optimizations
    configure_static_assets(app)
    
    # Configure request limiting for performance
    configure_request_limiting(app)
    
    # Configure CORS for multi-environment deployment
    configure_cors(app)
    
    # Configure logging
    configure_logging(app)
    
    # Initialize API client with configuration for optimized connection pooling
    app.api_client = APIClient(app.config['API_BASE_URL'], config=config)
    
    # Register components
    register_routes(app, csrf)
    register_error_handlers(app)
    register_context_processors(app)
    
    app.logger.info(f"Flask Admin started - Environment: {app.config['FLASK_ENV']}")
    app.logger.info(f"API Base URL: {app.config['API_BASE_URL']}")
    app.logger.info(f"Debug Mode: {app.config['DEBUG']}")
    app.logger.info(f"CSRF Protection: {app.config['WTF_CSRF_ENABLED']}")
    
    # Log performance optimization settings
    app.logger.info("=== Performance Optimizations Configured ===")
    app.logger.info(f"Caching: {app.config['CACHE_TYPE']} (timeout: {app.config['CACHE_DEFAULT_TIMEOUT']}s)")
    app.logger.info(f"Compression: Level {app.config['COMPRESS_LEVEL']} (min size: {app.config['COMPRESS_MIN_SIZE']} bytes)")
    app.logger.info(f"Request Limits: Max {app.config['MAX_CONCURRENT_REQUESTS']} concurrent requests")
    app.logger.info(f"Connection Pool: {app.config['CONNECTION_POOL_SIZE']} connections, {app.config['API_REQUEST_RETRIES']} retries")
    app.logger.info(f"Cache Timeouts: Folders={app.config['CACHE_FOLDERS_TIMEOUT']}s, Health={app.config['CACHE_HEALTH_TIMEOUT']}s, Classification={app.config['CACHE_CLASSIFICATION_TIMEOUT']}s")
    app.logger.info(f"Static Assets: Max-Age={app.config['STATIC_ASSET_MAX_AGE']}s, Immutable={app.config['STATIC_ASSET_IMMUTABLE']}")
    
    # Log HF Spaces detection
    from .config import is_hf_spaces, get_hf_space_url
    if is_hf_spaces():
        space_url = get_hf_space_url()
        app.logger.info(f"HF Spaces detected - Space URL: {space_url}")
        app.logger.info(f"Running on port {app.config['PORT']} for HF Spaces")
    else:
        app.logger.info("Running in local/Docker environment")
    
    return app

def configure_static_assets(app):
    """
    Configure static asset delivery optimizations for improved performance.
    
    Implements:
    - Cache-control headers with max-age=3600 (1 hour)
    - Asset compression and optimization
    - Efficient request handling for HF Spaces constraints
    - Asset versioning for cache busting
    """
    
    @app.before_request
    def optimize_static_requests():
        """Optimize static asset requests before processing"""
        
        # Skip optimization for non-static requests
        if not request.endpoint or request.endpoint != 'static':
            return
        
        # Add preload hints for critical assets
        if request.path.endswith('.css'):
            # CSS files are critical for rendering
            request._is_critical_asset = True
        elif request.path.endswith('.js'):
            # JavaScript files for interactivity
            request._is_critical_asset = False
        
        # Log static asset requests for monitoring
        app.logger.debug(f"Static asset request: {request.path}")
    
    @app.after_request
    def add_static_asset_headers(response):
        """Add optimized headers for static assets"""
        
        # Only apply to static assets
        if request.endpoint != 'static':
            return response
        
        # Enhanced cache headers for static assets
        response.cache_control.max_age = app.config.get('STATIC_ASSET_MAX_AGE', 3600)
        response.cache_control.public = True
        response.cache_control.must_revalidate = False
        
        # Mark assets as immutable if configured
        if app.config.get('STATIC_ASSET_IMMUTABLE', True):
            response.cache_control.immutable = True
        
        # Add security headers for static assets
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Add performance hints
        if hasattr(request, '_is_critical_asset') and request._is_critical_asset:
            response.headers['X-Critical-Asset'] = 'true'
        
        # Add compression hints
        response.vary.add('Accept-Encoding')
        
        # Set expires header for better browser compatibility
        from datetime import datetime, timedelta
        max_age = app.config.get('STATIC_ASSET_MAX_AGE', 3600)
        response.expires = datetime.utcnow() + timedelta(seconds=max_age)
        
        # Add ETag for conditional requests
        if hasattr(response, 'add_etag'):
            response.add_etag()
        
        return response
    
    # Configure static file serving with optimization
    if app.config.get('ENABLE_STATIC_ASSET_VERSIONING', True):
        # Add asset versioning for cache busting
        app.jinja_env.globals['asset_version'] = get_asset_version()
    
    app.logger.info("Static asset optimizations configured")

def get_asset_version():
    """
    Get asset version for cache busting.
    
    In production, this could be based on file modification time,
    git commit hash, or build timestamp.
    """
    import time
    import os
    
    # Use application start time as version in development
    if os.getenv('FLASK_ENV') == 'development':
        return str(int(time.time()))
    
    # In production, use a more stable version identifier
    # This could be set via environment variable during deployment
    return os.getenv('ASSET_VERSION', '1.0.0')

def configure_cors(app):
    """
    Configure CORS for multi-environment deployment with dynamic origin resolution.
    
    Supports:
    - Local Docker Compose: http://localhost:5001
    - HF Spaces: Dynamic HF Space URL resolution
    - Explicit configuration via CORS_ORIGINS environment variable
    """
    
    def get_cors_origins():
        """Get CORS origins based on deployment environment with enhanced detection"""
        
        # Explicit configuration takes precedence
        explicit_origins = os.getenv('CORS_ORIGINS')
        if explicit_origins:
            origins_list = [origin.strip() for origin in explicit_origins.split(',') if origin.strip()]
            app.logger.info(f"Using explicit CORS origins: {origins_list}")
            return origins_list
        
        # Auto-detect HF Spaces with enhanced detection
        from .config import is_hf_spaces, get_hf_space_url
        if is_hf_spaces():
            space_url = get_hf_space_url()
            if space_url:
                app.logger.info(f"HF Spaces detected - Using CORS origin: {space_url}")
                return [space_url]
            else:
                # Enhanced fallback for specific HF Space deployment
                fallback_url = "https://sandeepudeg-tickets.hf.space"
                app.logger.warning(f"HF Spaces detected but no URL resolved - Using fallback: {fallback_url}")
                return [fallback_url]
        
        # Default for local Docker Compose
        default_origins = ['http://localhost:5001']
        app.logger.info(f"Using default CORS origins for local environment: {default_origins}")
        return default_origins
    
    origins = get_cors_origins()
    
    # Configure CORS with comprehensive settings
    CORS(app, 
         origins=origins,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=[
             'Content-Type', 
             'Authorization', 
             'X-CSRFToken',
             'X-Requested-With',
             'Accept',
             'Origin'
         ],
         supports_credentials=True,
         expose_headers=['Content-Type', 'X-CSRFToken'])
    
    app.logger.info(f"CORS configured successfully for origins: {origins}")
    
    # Log CORS configuration details for debugging
    from .config import is_hf_spaces
    if is_hf_spaces():
        app.logger.info("CORS configured for HF Spaces deployment")
    else:
        app.logger.info("CORS configured for local Docker Compose deployment")

def configure_request_limiting(app):
    """
    Configure request limiting and performance optimizations for HF Spaces constraints.
    
    Implements:
    - Concurrent request limiting
    - Request size validation
    - Connection timeout management
    - Performance monitoring
    """
    import threading
    from collections import defaultdict
    import time
    
    # Thread-safe counter for concurrent requests
    app._concurrent_requests = threading.Semaphore(app.config['MAX_CONCURRENT_REQUESTS'])
    app._request_stats = defaultdict(int)
    app._request_times = []
    
    @app.before_request
    def limit_concurrent_requests():
        """Limit concurrent requests to prevent resource exhaustion"""
        
        # Try to acquire semaphore (non-blocking for performance)
        if not app._concurrent_requests.acquire(blocking=False):
            app.logger.warning(f"Request limit exceeded: {request.remote_addr} - {request.path}")
            
            # Return 429 Too Many Requests with retry information
            from flask import jsonify
            return jsonify({
                "error": "Too many concurrent requests",
                "message": "Server is busy, please try again later",
                "retry_after": 5,
                "max_concurrent": app.config['MAX_CONCURRENT_REQUESTS']
            }), 429
        
        # Track request statistics
        app._request_stats['total'] += 1
        app._request_stats[request.endpoint or 'unknown'] += 1
        
        # Store request start time for performance monitoring
        request._start_time = time.time()
        request._semaphore_acquired = True
    
    @app.after_request
    def release_request_limit(response):
        """Release request semaphore and log performance metrics"""
        
        # Release semaphore if it was acquired
        if hasattr(request, '_semaphore_acquired') and request._semaphore_acquired:
            app._concurrent_requests.release()
        
        # Calculate and log request duration
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            app._request_times.append(duration)
            
            # Keep only last 100 request times for memory efficiency
            if len(app._request_times) > 100:
                app._request_times = app._request_times[-100:]
            
            # Log slow requests (>5 seconds) for performance monitoring
            if duration > 5.0:
                app.logger.warning(f"Slow request: {request.method} {request.path} took {duration:.2f}s")
        
        return response
    
    @app.route('/admin/performance')
    def performance_stats():
        """Performance monitoring endpoint for static asset delivery (admin only)"""
        if not app.debug and app.config['FLASK_ENV'] != 'development':
            from flask import abort
            abort(404)  # Hide in production
        
        # Collect performance metrics
        stats = {
            "static_asset_config": {
                "max_age": app.config.get('STATIC_ASSET_MAX_AGE', 3600),
                "immutable": app.config.get('STATIC_ASSET_IMMUTABLE', True),
                "versioning_enabled": app.config.get('ENABLE_STATIC_ASSET_VERSIONING', True),
                "asset_version": get_asset_version()
            },
            "compression_config": {
                "level": app.config.get('COMPRESS_LEVEL', 6),
                "min_size": app.config.get('COMPRESS_MIN_SIZE', 500),
                "algorithm": app.config.get('COMPRESS_ALGORITHM', 'gzip'),
                "mimetypes": len(app.config.get('COMPRESS_MIMETYPES', []))
            },
            "request_limits": {
                "max_concurrent": app.config.get('MAX_CONCURRENT_REQUESTS', 10),
                "current_requests": app.config.get('MAX_CONCURRENT_REQUESTS', 10) - app._concurrent_requests._value if hasattr(app, '_concurrent_requests') else 0,
                "connection_pool_size": app.config.get('CONNECTION_POOL_SIZE', 10)
            },
            "cache_config": {
                "type": app.config.get('CACHE_TYPE', 'SimpleCache'),
                "default_timeout": app.config.get('CACHE_DEFAULT_TIMEOUT', 300),
                "folders_timeout": app.config.get('CACHE_FOLDERS_TIMEOUT', 300),
                "health_timeout": app.config.get('CACHE_HEALTH_TIMEOUT', 60),
                "classification_timeout": app.config.get('CACHE_CLASSIFICATION_TIMEOUT', 600)
            }
        }
        
        return jsonify(stats)
    
    @app.route('/admin/stats')
    def request_stats():
        """Internal endpoint for monitoring request statistics (admin only)"""
        if not app.debug and app.config['FLASK_ENV'] != 'development':
            from flask import abort
            abort(404)  # Hide in production
        
        avg_time = sum(app._request_times) / len(app._request_times) if hasattr(app, '_request_times') and app._request_times else 0
        
        return {
            "concurrent_limit": app.config['MAX_CONCURRENT_REQUESTS'],
            "current_requests": app.config['MAX_CONCURRENT_REQUESTS'] - app._concurrent_requests._value if hasattr(app, '_concurrent_requests') else 0,
            "total_requests": app._request_stats['total'] if hasattr(app, '_request_stats') else 0,
            "endpoint_stats": dict(app._request_stats) if hasattr(app, '_request_stats') else {},
            "avg_response_time": round(avg_time, 3),
            "recent_response_times": app._request_times[-10:] if hasattr(app, '_request_times') and app._request_times else [],
            "static_asset_optimizations": {
                "cache_headers_enabled": True,
                "compression_enabled": True,
                "asset_versioning": app.config.get('ENABLE_STATIC_ASSET_VERSIONING', True)
            }
        }

def configure_logging(app):
    """Configure application logging with structlog for JSON format in production"""
    
    # Set up basic logging configuration
    log_level = getattr(logging, app.config['LOG_LEVEL'])
    
    if app.config['LOG_FORMAT'] == 'json':
        try:
            import structlog
            
            # Configure structlog for JSON logging
            structlog.configure(
                processors=[
                    structlog.stdlib.filter_by_level,
                    structlog.stdlib.add_logger_name,
                    structlog.stdlib.add_log_level,
                    structlog.stdlib.PositionalArgumentsFormatter(),
                    structlog.processors.TimeStamper(fmt="iso"),
                    structlog.processors.StackInfoRenderer(),
                    structlog.processors.format_exc_info,
                    structlog.processors.JSONRenderer()
                ],
                context_class=dict,
                logger_factory=structlog.stdlib.LoggerFactory(),
                wrapper_class=structlog.stdlib.BoundLogger,
                cache_logger_on_first_use=True,
            )
            
            # Configure root logger for JSON output
            logging.basicConfig(
                level=log_level,
                format='%(message)s',  # structlog handles formatting
                handlers=[logging.StreamHandler()]
            )
            
            app.logger.info("Structured logging configured with JSON format")
            
        except ImportError:
            # Fallback to standard logging if structlog not available
            logging.basicConfig(
                level=log_level,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                handlers=[logging.StreamHandler()]
            )
            app.logger.warning("structlog not available, using standard logging")
    else:
        # Standard text logging for development
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler()]
        )
        app.logger.info("Standard text logging configured")

def register_routes(app, csrf):
    """Register application routes for dashboard, folders, create-ticket, classify-test, health"""
    
    @app.before_request
    def log_request():
        """Log all incoming requests with method, path, and client info"""
        request.start_time = datetime.utcnow()
        
        # Log structured request information
        if app.config['LOG_FORMAT'] == 'json':
            try:
                import structlog
                logger = structlog.get_logger()
                logger.info(
                    "incoming_request",
                    method=request.method,
                    path=request.path,
                    remote_addr=request.remote_addr,
                    user_agent=request.headers.get('User-Agent', ''),
                    content_length=request.content_length,
                    timestamp=request.start_time.isoformat()
                )
            except ImportError:
                app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
        else:
            app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    
    @app.after_request
    def log_response(response):
        """Log all responses with timing and add cache headers for static assets"""
        from datetime import datetime, timedelta
        
        # Calculate response time
        response_time = None
        if hasattr(request, 'start_time'):
            response_time = (datetime.utcnow() - request.start_time).total_seconds()
        
        # Log structured response information
        if app.config['LOG_FORMAT'] == 'json':
            try:
                import structlog
                logger = structlog.get_logger()
                logger.info(
                    "response",
                    method=request.method,
                    path=request.path,
                    status_code=response.status_code,
                    response_time_seconds=response_time,
                    content_length=response.content_length,
                    timestamp=datetime.utcnow().isoformat()
                )
            except ImportError:
                app.logger.info(f"Response: {request.method} {request.path} - {response.status_code} ({response_time:.3f}s)")
        else:
            app.logger.info(f"Response: {request.method} {request.path} - {response.status_code} ({response_time:.3f}s)" if response_time else f"Response: {request.method} {request.path} - {response.status_code}")
        
        # Add cache headers for static assets (max-age=3600 = 1 hour)
        if request.endpoint == 'static':
            response.cache_control.max_age = 3600
            response.cache_control.public = True
            
            # Add additional cache optimization headers
            response.cache_control.must_revalidate = False
            response.cache_control.immutable = True  # Static assets are immutable
            
            # Add ETag for better caching
            if hasattr(response, 'add_etag'):
                response.add_etag()
            
            # Add Vary header for better caching with compression
            response.vary.add('Accept-Encoding')
            
            # Set expires header for older browsers
            response.expires = datetime.utcnow() + timedelta(seconds=3600)
        
        return response
    
    @app.route('/')
    def dashboard():
        """Efficient unified dashboard with all functionality"""
        try:
            # Try to get cached data first
            cache_key_folders = 'dashboard_folders'
            cache_key_escalations = 'dashboard_escalations'
            
            # Get cached folders data
            folders_response = app.cache.get(cache_key_folders)
            if folders_response is None:
                # Cache miss - fetch from API
                folders_response = app.api_client.get('/api/v1/folders')
                if folders_response:
                    app.cache.set(cache_key_folders, folders_response, 
                                timeout=app.config['CACHE_FOLDERS_TIMEOUT'])
                    app.logger.info(f"Cached folders data for {app.config['CACHE_FOLDERS_TIMEOUT']}s")
                else:
                    folders_response = []
            else:
                app.logger.debug("Using cached folders data")
            
            total_folders = folders_response.get('total', 0) if folders_response else 0
            folders_list = folders_response.get('folders', []) if folders_response else []
            
            # Get cached escalations data
            escalations_response = app.cache.get(cache_key_escalations)
            if escalations_response is None:
                # Cache miss - fetch from API
                escalations_response = app.api_client.get('/api/v1/escalations')
                if escalations_response:
                    app.cache.set(cache_key_escalations, escalations_response,
                                timeout=app.config['CACHE_ESCALATIONS_TIMEOUT'])
                    app.logger.info(f"Cached escalations data for {app.config['CACHE_ESCALATIONS_TIMEOUT']}s")
                else:
                    escalations_response = []
            else:
                app.logger.debug("Using cached escalations data")
            
            pending_escalations = escalations_response.get('total', 0) if escalations_response else 0
            escalations_list = escalations_response.get('tickets', []) if escalations_response else []
            
            app.logger.info(f"Dashboard loaded: {total_folders} folders, {pending_escalations} escalations")
            
            return render_template('dashboard.html', 
                                 total_folders=total_folders,
                                 pending_escalations=pending_escalations,
                                 folders=folders_list)
        except Exception as e:
            app.logger.error(f"Dashboard error: {str(e)}", exc_info=True)
            flash("❌ Error loading dashboard data", "danger")
            return render_template('dashboard.html', 
                                 total_folders=0,
                                 pending_escalations=0,
                                 folders=[])
    
    @app.route('/tickets')
    def tickets():
        """Master ticket list page"""
        try:
            tickets_data = app.api_client.get('/api/v1/tickets') or {}
            tickets_list = tickets_data.get('tickets', [])
            app.logger.info(f"Loaded {len(tickets_list)} tickets")
            return render_template('tickets.html', tickets=tickets_list)
        except Exception as e:
            app.logger.error(f"Tickets page error: {str(e)}", exc_info=True)
            flash("❌ Error loading tickets", "danger")
            return render_template('tickets.html', tickets=[])

    @app.route('/folders/<folder_id>')
    def folder_detail(folder_id):
        """View tickets within a specific folder"""
        try:
            # Fetch folder details
            folders_data = app.api_client.get('/api/v1/folders') or {}
            folders_list = folders_data.get('folders', [])
            folder = next((f for f in folders_list if f['id'] == folder_id), None)
            
            if not folder:
                flash("❌ Folder not found", "warning")
                return redirect(url_for('folders'))
            
            # Fetch tickets for this folder
            # Note: Assuming the API supports filtering by folder_id or we filter here
            tickets_data = app.api_client.get('/api/v1/tickets') or {}
            all_tickets = tickets_data.get('tickets', [])
            folder_tickets = [t for t in all_tickets if t.get('folder_id') == folder_id]
            
            app.logger.info(f"Loaded {len(folder_tickets)} tickets for folder {folder['name']}")
            return render_template('folder_detail.html', folder=folder, tickets=folder_tickets)
        except Exception as e:
            app.logger.error(f"Folder detail error: {str(e)}", exc_info=True)
            flash("❌ Error loading folder details", "danger")
            return redirect(url_for('folders'))
            
    # API endpoints for AJAX functionality
    @app.route('/api/tickets')
    def api_tickets():
        """API endpoint for loading tickets via AJAX"""
        try:
            tickets_data = app.api_client.get('/api/v1/tickets') or {}
            return jsonify(tickets_data.get('tickets', []))
        except Exception as e:
            app.logger.error(f"API tickets error: {str(e)}", exc_info=True)
            return jsonify([]), 500
    
    @app.route('/api/folders')
    def api_folders():
        """API endpoint for loading folders via AJAX"""
        try:
            cache_key = 'folders_list'
            folders_data = app.cache.get(cache_key)
            
            if folders_data is None:
                folders_data = app.api_client.get('/api/v1/folders') or []
                if folders_data:
                    app.cache.set(cache_key, folders_data, 
                                timeout=app.config['CACHE_FOLDERS_TIMEOUT'])
            
            return jsonify(folders_data.get('folders', []) if isinstance(folders_data, dict) else folders_data)
        except Exception as e:
            app.logger.error(f"API folders error: {str(e)}", exc_info=True)
            return jsonify([]), 500
    
    @app.route('/api/quick-ticket', methods=['POST'])
    def api_quick_ticket():
        """API endpoint for quick ticket creation"""
        try:
            data = request.get_json()
            ticket_data = {
                'title': data.get('title'),
                'description': data.get('description'),
                'folder_id': data.get('folder_id')
            }
            
            app.logger.info(f"Quick creating ticket: {ticket_data['title']}")
            response = app.api_client.post('/api/v1/tickets', ticket_data)
            
            if response:
                # Invalidate relevant caches
                app.cache.delete('dashboard_folders')
                app.cache.delete('dashboard_escalations')
                
                return jsonify({
                    'success': True,
                    'message': 'Ticket created successfully',
                    'ticket': response
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to create ticket'
                }), 400
                
        except Exception as e:
            app.logger.error(f"Quick ticket creation error: {str(e)}", exc_info=True)
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/quick-folder', methods=['POST'])
    def api_quick_folder():
        """API endpoint for quick folder creation"""
        try:
            data = request.get_json()
            folder_data = {
                'name': data.get('name'),
                'description': data.get('description', '')
            }
            
            app.logger.info(f"Quick creating folder: {folder_data['name']}")
            response = app.api_client.post('/api/v1/folders', folder_data)
            
            if response:
                # Invalidate relevant caches
                app.cache.delete('dashboard_folders')
                app.cache.delete('folders_list')
                
                return jsonify({
                    'success': True,
                    'message': 'Folder created successfully',
                    'folder': response
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to create folder'
                }), 400
                
        except Exception as e:
            app.logger.error(f"Quick folder creation error: {str(e)}", exc_info=True)
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/quick-classify', methods=['POST'])
    def api_quick_classify():
        """API endpoint for quick classification"""
        try:
            data = request.get_json()
            classify_data = {
                'title': data.get('title', ''),
                'description': data.get('text', '')
            }
            
            # Create cache key for classification results
            import hashlib
            content_hash = hashlib.md5(f"{classify_data['title']}{classify_data['description']}".encode()).hexdigest()
            cache_key = f'classification_{content_hash}'
            
            # Try cached result first
            cached_result = app.cache.get(cache_key)
            if cached_result:
                return jsonify({
                    'success': True,
                    'classification': cached_result,
                    'cached': True
                })
            
            app.logger.info(f"Quick classifying text")
            # Point to the correct standalone backend endpoint
            response = app.api_client.post('/api/v1/classification/predict', classify_data)
            
            if response:
                # Cache the result
                app.cache.set(cache_key, response, 
                            timeout=app.config['CACHE_CLASSIFICATION_TIMEOUT'])
                
                return jsonify({
                    'success': True,
                    'classification': response,
                    'cached': False
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Classification failed'
                }), 400
                
        except Exception as e:
            app.logger.error(f"Quick classification error: {str(e)}", exc_info=True)
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500
    
    @app.route('/folders', methods=['GET', 'POST'])
    def folders():
        """Folder management page with caching"""
        if request.method == 'POST':
            # Create new folder
            folder_data = {
                'name': request.form.get('name'),
                'description': request.form.get('description', '')
            }
            
            app.logger.info(f"Creating folder: {folder_data['name']}")
            response = app.api_client.post('/api/v1/folders', folder_data)
            if response:
                flash("✅ Folder created successfully", "success")
                app.logger.info(f"Folder created successfully: {folder_data['name']}")
                
                # Invalidate cache after creating new folder
                app.cache.delete('dashboard_folders')
                app.cache.delete('folders_list')
                app.logger.info("Invalidated folders cache after creation")
            else:
                flash("❌ Failed to create folder", "danger")
                app.logger.error(f"Failed to create folder: {folder_data['name']}")
            
            return redirect(url_for('folders'))
        
        # GET request - display folders with caching
        cache_key = 'folders_list'
        folders_data = app.cache.get(cache_key)
        
        if folders_data is None:
            # Cache miss - fetch from API
            folders_data = app.api_client.get('/api/v1/folders') or []
            if folders_data:
                app.cache.set(cache_key, folders_data, 
                            timeout=app.config['CACHE_FOLDERS_TIMEOUT'])
                app.logger.info(f"Cached folders list for {app.config['CACHE_FOLDERS_TIMEOUT']}s")
        else:
            app.logger.debug("Using cached folders list")
        
        folders_list = folders_data.get('folders', []) if isinstance(folders_data, dict) else (folders_data or [])
        app.logger.info(f"Loaded {len(folders_list)} folders")
        return render_template('folders.html', folders=folders_list)
    
    @app.route('/create-ticket', methods=['GET', 'POST'])
    def create_ticket():
        """Ticket creation page with classification and folder caching"""
        if request.method == 'POST':
            # Create ticket with classification
            ticket_data = {
                'title': request.form.get('title'),
                'description': request.form.get('description'),
                'folder_id': request.form.get('folder_id')
            }
            
            app.logger.info(f"Creating ticket: {ticket_data['title']}")
            response = app.api_client.post('/api/v1/tickets', ticket_data)
            if response:
                flash("✅ Ticket created successfully", "success")
                app.logger.info(f"Ticket created successfully: {ticket_data['title']}")
                
                # Invalidate relevant caches after ticket creation
                app.cache.delete('dashboard_folders')
                app.cache.delete('dashboard_escalations')
                app.logger.info("Invalidated dashboard caches after ticket creation")
                
                # Get cached folders for form display
                cache_key = 'folders_list'
                folders_data = app.cache.get(cache_key)
                if folders_data is None:
                    response_data = app.api_client.get('/api/v1/folders') or {}
                    folders_data = response_data.get('folders', []) if isinstance(response_data, dict) else (response_data or [])
                    if folders_data:
                        app.cache.set(cache_key, folders_data, 
                                    timeout=app.config['CACHE_FOLDERS_TIMEOUT'])
                
                return render_template('create_ticket.html', 
                                     classification_results=response.get('classification'),
                                     folders=folders_data)
            else:
                flash("❌ Failed to create ticket", "danger")
                app.logger.error(f"Failed to create ticket: {ticket_data['title']}")
        
        # GET request - display form with cached folders
        cache_key = 'folders_list'
        folders_data = app.cache.get(cache_key)
        
        if folders_data is None:
            # Cache miss - fetch from API
            response_data = app.api_client.get('/api/v1/folders') or {}
            folders_data = response_data.get('folders', []) if isinstance(response_data, dict) else (response_data or [])
            if folders_data:
                app.cache.set(cache_key, folders_data, 
                            timeout=app.config['CACHE_FOLDERS_TIMEOUT'])
                app.logger.info(f"Cached folders for ticket creation form")
        else:
            app.logger.debug("Using cached folders for ticket creation form")
        
        return render_template('create_ticket.html', folders=folders_data)
    
    @app.route('/classify-test', methods=['GET', 'POST'])
    @csrf.exempt
    def classify_test():
        """Classification testing page without ticket creation with result caching"""
        if request.method == 'POST':
            # Test classification
            test_data = {
                'title': request.form.get('title'),
                'description': request.form.get('description')
            }
            
            # Create cache key based on content for classification results
            import hashlib
            content_hash = hashlib.md5(f"{test_data['title']}{test_data['description']}".encode()).hexdigest()
            cache_key = f'classification_{content_hash}'
            
            app.logger.info(f"Testing classification for: {test_data['title']}")
            
            # Try to get cached classification result first
            cached_result = app.cache.get(cache_key)
            if cached_result:
                app.logger.info(f"Using cached classification result for: {test_data['title']}")
                return render_template('classify_test.html', 
                                     classification_results=cached_result)
            
            # Cache miss - perform classification using the correct backend endpoint
            response = app.api_client.post('/api/v1/classification/predict', test_data)
            if response:
                # Cache the classification result for future requests
                app.cache.set(cache_key, response, 
                            timeout=app.config['CACHE_CLASSIFICATION_TIMEOUT'])
                app.logger.info(f"Classification test completed and cached: {test_data['title']}")
                return render_template('classify_test.html', 
                                     classification_results=response)
            else:
                flash("❌ Classification test failed", "danger")
                app.logger.error(f"Classification test failed: {test_data['title']}")
        
        # GET request - display form
        return render_template('classify_test.html')
    
    @app.route('/system-health')
    def system_health():
        """System health monitoring page with caching"""
        cache_key = 'system_health'
        health_data = app.cache.get(cache_key)
        
        if health_data is None:
            # Cache miss - fetch from API readiness probe
            app.logger.info("Loading system health page from readiness probe")
            health_data = app.api_client.get('/health/ready') or {}
            
            if health_data:
                # Enrich data for the template
                health_data['api'] = 'reachable'
                
                # Normalize component statuses ('ok' -> 'healthy') for template compatibility
                if 'components' in health_data:
                    normalized_components = {}
                    for comp, status in health_data['components'].items():
                        normalized_components[comp] = 'healthy' if status == 'ok' else status
                    health_data['components'] = normalized_components
                
                app.cache.set(cache_key, health_data, 
                            timeout=app.config['CACHE_HEALTH_TIMEOUT'])
                app.logger.info(f"Cached enriched health data for {app.config['CACHE_HEALTH_TIMEOUT']}s")
        else:
            app.logger.debug("Using cached health data")
        
        return render_template('health.html', health=health_data)
    
    @app.route('/health')
    def health_check():
        """Health check endpoint for Docker and HF Spaces"""
        try:
            # Check API backend reachability
            api_health = app.api_client.get('/health/live')
            api_status = "reachable" if api_health else "unreachable"
            
            health_response = {
                "status": "healthy",
                "service": "flask-admin",
                "timestamp": datetime.utcnow().isoformat(),
                "api": api_status,
                "version": "1.0.0"
            }
            
            app.logger.debug(f"Health check: API {api_status}")
            return jsonify(health_response), 200
        except Exception as e:
            app.logger.error(f"Health check error: {str(e)}", exc_info=True)
            return jsonify({
                "status": "unhealthy",
                "service": "flask-admin",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }), 500

def register_error_handlers(app):
    """Register custom error handlers"""
    
    @app.errorhandler(404)
    def not_found_error(error):
        app.logger.warning(f"404 error: {request.url}")
        return render_template('404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"500 error: {str(error)}", exc_info=True)
        return render_template('500.html'), 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        app.logger.warning(f"403 error: {request.url}")
        return render_template('403.html'), 403
    
        return render_template('500.html'), 500

    @app.errorhandler(CSRFError)
    def handle_csrf_error(e):
        app.logger.warning(f"CSRF Error: {e.description}")
        flash(f"Session expired or security token missing. Please try again.", "warning")
        return redirect(request.url)

def register_context_processors(app):
    """Register template context processors"""
    
    @app.context_processor
    def inject_navigation():
        """Inject navigation items for all templates"""
        return {
            'nav_items': [
                {'endpoint': 'dashboard', 'label': 'Dashboard', 'icon': 'chart-line'},
                {'endpoint': 'tickets', 'label': 'Tickets', 'icon': 'ticket-alt'},
                {'endpoint': 'folders', 'label': 'Folders', 'icon': 'folder'},
                {'endpoint': 'create_ticket', 'label': 'Create Ticket', 'icon': 'plus-circle'},
                {'endpoint': 'classify_test', 'label': 'Classify Test', 'icon': 'robot'},
                {'endpoint': 'system_health', 'label': 'System Health', 'icon': 'heartbeat'}
            ]
        }
    
    @app.context_processor
    def inject_config():
        """Inject configuration values for templates"""
        return {
            'api_base_url': app.config['API_BASE_URL'],
            'current_time': datetime.utcnow(),
            'flask_env': app.config['FLASK_ENV']
        }