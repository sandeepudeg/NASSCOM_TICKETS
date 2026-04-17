import pytest
import requests
from unittest.mock import Mock, patch, MagicMock
from flask_admin.utils.api_client import APIClient
import time
import json


class TestAPIClient:
    """Test suite for API client functionality"""
    
    @pytest.fixture
    def api_client(self):
        """Create API client instance for testing"""
        return APIClient("http://test-api:8000", timeout=5)
    
    @pytest.fixture
    def mock_config(self):
        """Mock configuration object"""
        config = Mock()
        config.CONNECTION_POOL_SIZE = 5
        config.CONNECTION_POOL_MAXSIZE = 5
        config.API_REQUEST_RETRIES = 2
        return config
    
    def test_api_client_initialization(self):
        """Test API client initialization with default values"""
        client = APIClient("http://test-api:8000")
        assert client.base_url == "http://test-api:8000"
        assert client.timeout == 10
        assert client.session is not None
    
    def test_api_client_initialization_with_config(self, mock_config):
        """Test API client initialization with custom config"""
        client = APIClient("http://test-api:8000", timeout=15, config=mock_config)
        assert client.base_url == "http://test-api:8000"
        assert client.timeout == 15
        assert client.session is not None
    
    def test_base_url_normalization(self):
        """Test that trailing slashes are removed from base URL"""
        client = APIClient("http://test-api:8000/")
        assert client.base_url == "http://test-api:8000"
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_successful_get_request(self, mock_request, api_client):
        """Test successful GET request"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "test"}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"data": "test"}'
        mock_request.return_value = mock_response
        
        result = api_client.get("/test-endpoint")
        
        assert result == {"data": "test"}
        mock_request.assert_called_once_with(
            'GET', 
            'http://test-api:8000/test-endpoint', 
            timeout=5, 
            params=None
        )
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_successful_post_request(self, mock_request, api_client):
        """Test successful POST request"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"id": "123", "created": True}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"id": "123", "created": True}'
        mock_request.return_value = mock_response
        
        test_data = {"name": "test", "description": "test desc"}
        result = api_client.post("/test-endpoint", test_data)
        
        assert result == {"id": "123", "created": True}
        mock_request.assert_called_once_with(
            'POST', 
            'http://test-api:8000/test-endpoint', 
            timeout=5, 
            json=test_data
        )
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_successful_put_request(self, mock_request, api_client):
        """Test successful PUT request"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": "123", "updated": True}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"id": "123", "updated": True}'
        mock_request.return_value = mock_response
        
        test_data = {"name": "updated", "description": "updated desc"}
        result = api_client.put("/test-endpoint", test_data)
        
        assert result == {"id": "123", "updated": True}
        mock_request.assert_called_once_with(
            'PUT', 
            'http://test-api:8000/test-endpoint', 
            timeout=5, 
            json=test_data
        )
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_successful_delete_request(self, mock_request, api_client):
        """Test successful DELETE request"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 204
        mock_response.json.return_value = {}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b''
        mock_request.return_value = mock_response
        
        result = api_client.delete("/test-endpoint")
        
        assert result == {}
        mock_request.assert_called_once_with(
            'DELETE', 
            'http://test-api:8000/test-endpoint', 
            timeout=5
        )
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_http_error_handling(self, mock_request, api_client):
        """Test HTTP error handling (4xx, 5xx)"""
        # Mock HTTP error response
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
        mock_request.return_value = mock_response
        
        result = api_client.get("/nonexistent-endpoint")
        
        assert result is None
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_connection_error_handling(self, mock_request, api_client):
        """Test connection error handling"""
        # Mock connection error
        mock_request.side_effect = requests.exceptions.ConnectionError("Connection failed")
        
        result = api_client.get("/test-endpoint")
        
        assert result is None
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_timeout_error_handling(self, mock_request, api_client):
        """Test timeout error handling"""
        # Mock timeout error
        mock_request.side_effect = requests.exceptions.Timeout("Request timed out")
        
        result = api_client.get("/test-endpoint")
        
        assert result is None
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_json_decode_error_handling(self, mock_request, api_client):
        """Test JSON decode error handling"""
        # Mock response with invalid JSON
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.side_effect = requests.exceptions.JSONDecodeError("Invalid JSON", "", 0)
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'invalid json'
        mock_request.return_value = mock_response
        
        result = api_client.get("/test-endpoint")
        
        assert result is None
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_unexpected_error_handling(self, mock_request, api_client):
        """Test unexpected error handling"""
        # Mock unexpected error
        mock_request.side_effect = Exception("Unexpected error")
        
        result = api_client.get("/test-endpoint")
        
        assert result is None
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_empty_response_handling(self, mock_request, api_client):
        """Test handling of empty responses (204 No Content)"""
        # Mock empty response
        mock_response = Mock()
        mock_response.status_code = 204
        mock_response.content = b''
        mock_response.raise_for_status.return_value = None
        mock_request.return_value = mock_response
        
        result = api_client.get("/test-endpoint")
        
        assert result == {}
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_request_logging(self, mock_request, api_client, caplog):
        """Test that API requests are logged"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "test"}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"data": "test"}'
        mock_request.return_value = mock_response
        
        with caplog.at_level('INFO'):
            api_client.get("/test-endpoint")
        
        # Check that request was logged
        assert any("API Call:" in record.message for record in caplog.records)
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_error_logging(self, mock_request, api_client, caplog):
        """Test that API errors are logged"""
        # Mock HTTP error response
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
        mock_request.return_value = mock_response
        
        with caplog.at_level('ERROR'):
            api_client.get("/test-endpoint")
        
        # Check that error was logged
        assert any("HTTP error 500" in record.message for record in caplog.records)
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_health_check_success(self, mock_request, api_client):
        """Test successful health check"""
        # Mock successful health response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "healthy"}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"status": "healthy"}'
        mock_request.return_value = mock_response
        
        result = api_client.health_check()
        
        assert result is True
        mock_request.assert_called_once_with(
            'GET', 
            'http://test-api:8000/health/live', 
            timeout=5, 
            params=None
        )
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_health_check_failure(self, mock_request, api_client):
        """Test failed health check"""
        # Mock failed health response
        mock_request.side_effect = requests.exceptions.ConnectionError("Connection failed")
        
        result = api_client.health_check()
        
        assert result is False
        mock_request.assert_called_once()
    
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_get_with_params(self, mock_request, api_client):
        """Test GET request with query parameters"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "filtered"}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"data": "filtered"}'
        mock_request.return_value = mock_response
        
        params = {"filter": "active", "limit": 10}
        result = api_client.get("/test-endpoint", params=params)
        
        assert result == {"data": "filtered"}
        mock_request.assert_called_once_with(
            'GET', 
            'http://test-api:8000/test-endpoint', 
            timeout=5, 
            params=params
        )
    
    @patch('flask_admin.utils.api_client.time.time')
    @patch('flask_admin.utils.api_client.requests.Session.request')
    def test_response_time_logging(self, mock_request, mock_time, api_client, caplog):
        """Test that response times are logged"""
        # Mock time progression - need more values since logging also calls time.time()
        mock_time.side_effect = [1000.0, 1000.5, 1000.6, 1000.7, 1000.8]  # 0.5 second response time
        
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "test"}
        mock_response.raise_for_status.return_value = None
        mock_response.content = b'{"data": "test"}'
        mock_request.return_value = mock_response
        
        with caplog.at_level('INFO'):
            api_client.get("/test-endpoint")
        
        # Check that response time was logged
        assert any("0.500s" in record.message for record in caplog.records)
    
    def test_session_headers_configuration(self, api_client):
        """Test that session headers are properly configured"""
        headers = api_client.session.headers
        
        assert 'User-Agent' in headers
        assert headers['User-Agent'] == 'Flask-Admin/1.0.0'
        assert headers['Accept'] == 'application/json'
        assert headers['Accept-Encoding'] == 'gzip, deflate'
        assert headers['Connection'] == 'keep-alive'
    
    def test_session_adapter_configuration(self, mock_config):
        """Test that session adapters are properly configured"""
        client = APIClient("http://test-api:8000", config=mock_config)
        
        # Check that adapters are mounted
        assert 'http://' in client.session.adapters
        assert 'https://' in client.session.adapters
        
        # Verify adapter configuration
        adapter = client.session.adapters['http://']
        assert hasattr(adapter, 'config')