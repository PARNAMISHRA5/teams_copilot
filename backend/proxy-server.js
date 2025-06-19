// proxy-server.js - Complete version for Azure Llama API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const API_TIMEOUT = 90000; // 90 seconds
const SERVER_TIMEOUT = 120000; // 2 minutes

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Parse JSON with larger limit
app.use(express.json({ limit: '5mb' }));

// Add compression if available
try {
  const compression = require('compression');
  app.use(compression());
} catch (e) {
  console.log('📦 Compression not available, continuing without it');
}

// Increase server timeout globally
app.use((req, res, next) => {
  req.setTimeout(SERVER_TIMEOUT);
  res.setTimeout(SERVER_TIMEOUT);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🔵 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.body) {
    console.log('🔵 Request body keys:', Object.keys(req.body));
    if (req.body.messages) {
      console.log('🔵 Messages count:', req.body.messages.length);
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: Date.now(),
    port: PORT,
    timeouts: {
      apiTimeout: API_TIMEOUT,
      serverTimeout: SERVER_TIMEOUT
    },
    env: {
      hasApiEndpoint: !!process.env.LLAMA_API_ENDPOINT,
      hasApiKey: !!process.env.LLAMA_API_KEY,
      hasDeployName: !!process.env.DEPLOY_NAME,
      apiEndpoint: process.env.LLAMA_API_ENDPOINT ? process.env.LLAMA_API_ENDPOINT.substring(0, 50) + '...' : 'NOT_SET',
      deployName: process.env.DEPLOY_NAME || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  };
  
  console.log('🟢 Health check response:', healthData);
  res.json(healthData);
});

// Utility function to create timeout promise
const createTimeoutPromise = (timeout, operation) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timeout after ${timeout}ms`));
    }, timeout);
  });
};

// Utility function for retry with exponential backoff
const fetchWithRetry = async (url, options, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} - Making request to Azure Llama API`);
      
      // Create fetch promise with explicit timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetchPromise,
        createTimeoutPromise(API_TIMEOUT, 'API request')
      ]);

      clearTimeout(timeoutId);
      console.log(`🟢 Request successful on attempt ${attempt}`);
      return response;

    } catch (error) {
      console.log(`🔴 Attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Function to prepare headers for Azure Llama API
const getApiHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`,
    'User-Agent': 'Llama-Proxy/1.0',
    'Connection': 'keep-alive'
  };
};

// Function to prepare request payload for Azure Llama API
const prepareRequestPayload = (messages, max_tokens, temperature, top_p) => {
  const payload = {
    messages,
    max_tokens: Math.min(max_tokens, 8000),
    temperature,
    top_p,
    stream: false
  };

  // Add deployment name if available
  if (process.env.DEPLOY_NAME) {
    payload.model = process.env.DEPLOY_NAME;
  }

  return payload;
};

// Main proxy endpoint for Azure Llama API
app.post('/api/llama', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🔵 === NEW AZURE LLAMA API REQUEST ===');
    console.log('🔵 Request timestamp:', new Date().toISOString());
    
    const { messages, max_tokens = 500, temperature = 0.7, top_p = 0.9 } = req.body;
    
    // Validate environment
    if (!process.env.LLAMA_API_ENDPOINT) {
      console.error('🔴 LLAMA_API_ENDPOINT not configured');
      return res.status(500).json({ error: 'LLAMA_API_ENDPOINT not configured' });
    }
    
    if (!process.env.LLAMA_API_KEY) {
      console.error('🔴 LLAMA_API_KEY not configured');
      return res.status(500).json({ error: 'LLAMA_API_KEY not configured' });
    }

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('🔴 Invalid messages array:', messages);
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    // Optimize conversation history to reduce payload size
    const optimizedMessages = messages.slice(-8); // Keep last 8 messages for context
    
    console.log('🔵 Processing request with:', {
      originalMessagesCount: messages.length,
      optimizedMessagesCount: optimizedMessages.length,
      maxTokens: max_tokens,
      temperature,
      topP: top_p,
      deployName: process.env.DEPLOY_NAME
    });

    // Log the last user message for debugging
    const lastMessage = optimizedMessages[optimizedMessages.length - 1];
    console.log('🔵 Last message:', {
      role: lastMessage.role,
      content: lastMessage.content?.substring(0, 100) + '...'
    });

    const requestPayload = prepareRequestPayload(optimizedMessages, max_tokens, temperature, top_p);
    
    console.log('🔵 Making request to Azure Llama API:', process.env.LLAMA_API_ENDPOINT);
    console.log('🔵 Request payload size:', JSON.stringify(requestPayload).length, 'characters');
    console.log('🔵 Using timeout:', API_TIMEOUT, 'ms');
    console.log('🔵 Deploy name:', process.env.DEPLOY_NAME);
    
    const response = await fetchWithRetry(
      process.env.LLAMA_API_ENDPOINT,
      {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(requestPayload)
      }
    );

    const responseTime = Date.now() - startTime;
    console.log('🔵 Response received in', responseTime, 'ms');
    console.log('🔵 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 Azure Llama API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500)
      });
      
      return res.status(response.status).json({ 
        error: `Azure Llama API Error: ${response.status} - ${response.statusText}`,
        details: errorText.substring(0, 200),
        responseTime,
        endpoint: process.env.LLAMA_API_ENDPOINT.substring(0, 50) + '...'
      });
    }

    // Get response text first for debugging
    const responseText = await response.text();
    console.log('🔵 Raw response length:', responseText.length);
    console.log('🔵 Raw response preview:', responseText.substring(0, 200) + '...');

    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('🔵 Parsed JSON successfully');
      console.log('🔵 Response structure:', Object.keys(data));
      
      // Log response content preview
      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log('🔵 AI Response preview:', data.choices[0].message.content?.substring(0, 100) + '...');
      }
      
    } catch (parseError) {
      console.error('🔴 JSON Parse Error:', parseError.message);
      console.error('🔴 Raw response that failed to parse:', responseText.substring(0, 500));
      return res.status(502).json({ 
        error: 'Invalid JSON response from Azure Llama API',
        parseError: parseError.message,
        responseTime
      });
    }
    
    console.log('🟢 Request completed successfully in', responseTime, 'ms');
    console.log('🔵 === END AZURE LLAMA API REQUEST ===\n');
    
    res.json(data);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('🔴 === REQUEST ERROR ===');
    console.error('🔴 Error type:', error.constructor.name);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Response time:', responseTime, 'ms');
    
    let errorResponse = { 
      error: 'Request failed',
      responseTime,
      errorType: error.constructor.name
    };

    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Connection refused - Azure Llama API may be down');
      errorResponse.error = 'Cannot connect to Azure Llama API - server may be down';
      errorResponse.suggestion = 'Check if the API endpoint is correct and accessible';
      return res.status(503).json(errorResponse);
    }
    
    if (error.message.includes('timeout') || error.name === 'AbortError') {
      console.error(`🔴 Request timeout - API took longer than ${API_TIMEOUT}ms to respond`);
      errorResponse.error = `Request timeout - Azure Llama API response took longer than ${API_TIMEOUT/1000} seconds`;
      errorResponse.suggestion = 'The AI model is taking longer than usual. Try again or reduce message complexity.';
      return res.status(504).json(errorResponse);
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('🔴 DNS resolution failed - invalid endpoint');
      errorResponse.error = 'Invalid Azure Llama API endpoint - DNS resolution failed';
      errorResponse.suggestion = 'Verify LLAMA_API_ENDPOINT URL is correct';
      return res.status(503).json(errorResponse);
    }

    if (error.code === 'ECONNRESET') {
      console.error('🔴 Connection reset by Azure Llama API server');
      errorResponse.error = 'Connection reset by Azure Llama API server';
      errorResponse.suggestion = 'API server may be overloaded, try again later';
      return res.status(503).json(errorResponse);
    }

    if (error.message.includes('certificate')) {
      console.error('🔴 SSL/TLS certificate error');
      errorResponse.error = 'SSL certificate error';
      errorResponse.suggestion = 'Check Azure Llama API endpoint SSL configuration';
      return res.status(503).json(errorResponse);
    }
    
    console.error('🔴 Unhandled error - returning generic 500');
    errorResponse.error = error.message;
    errorResponse.suggestion = 'Check server logs for more details';
    res.status(500).json(errorResponse);
  }
});

// Debug endpoint to test connectivity
app.get('/api/test', async (req, res) => {
  console.log('🔵 Testing Azure Llama API connectivity...');
  
  const testResult = {
    timestamp: new Date().toISOString(),
    timeouts: {
      apiTimeout: API_TIMEOUT,
      serverTimeout: SERVER_TIMEOUT
    },
    environment: {
      hasEndpoint: !!process.env.LLAMA_API_ENDPOINT,
      hasKey: !!process.env.LLAMA_API_KEY,
      hasDeployName: !!process.env.DEPLOY_NAME,
      endpoint: process.env.LLAMA_API_ENDPOINT || 'NOT_SET',
      deployName: process.env.DEPLOY_NAME || 'NOT_SET',
      keyPreview: process.env.LLAMA_API_KEY ? 
        process.env.LLAMA_API_KEY.substring(0, 10) + '...' : 'NOT_SET'
    },
    connectivity: 'testing...'
  };

  // Test basic connectivity
  if (process.env.LLAMA_API_ENDPOINT && process.env.LLAMA_API_KEY) {
    try {
      const testPayload = {
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 10,
        temperature: 0.7
      };

      if (process.env.DEPLOY_NAME) {
        testPayload.model = process.env.DEPLOY_NAME;
      }

      const testResponse = await fetchWithRetry(
        process.env.LLAMA_API_ENDPOINT,
        {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(testPayload)
        }
      );
      
      testResult.connectivity = {
        status: testResponse.status,
        statusText: testResponse.statusText,
        reachable: testResponse.ok,
        headers: {
          contentType: testResponse.headers.get('content-type'),
          contentLength: testResponse.headers.get('content-length')
        }
      };
      
      if (testResponse.ok) {
        const testData = await testResponse.text();
        testResult.connectivity.responsePreview = testData.substring(0, 200);
      }
      
    } catch (error) {
      testResult.connectivity = {
        reachable: false,
        error: error.message,
        code: error.code,
        type: error.constructor.name
      };
    }
  } else {
    testResult.connectivity = 'Configuration incomplete - missing endpoint or API key';
  }

  console.log('🔵 Test result:', testResult);
  res.json(testResult);
});

// 404 handler with debugging
app.use('*', (req, res) => {
  console.log('🟡 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: ['/health', '/api/llama', '/api/test']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🔴 Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

const https = require('https');
const fs = require('fs');

// HTTPS certificate and key
const httpsOptions = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log('🚀 Azure Llama API Proxy Server (HTTPS) Starting...');
  console.log(`🔒 Server running on https://localhost:${PORT}`);
  console.log(`📋 Health check: https://localhost:${PORT}/health`);
  console.log(`🔗 Main API: https://localhost:${PORT}/api/llama`);
  console.log(`🧪 Test endpoint: https://localhost:${PORT}/api/test`);

  // Environment validation on startup
  console.log('\n🔧 Environment Check:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   PORT:', PORT);
  console.log('   API_TIMEOUT:', API_TIMEOUT, 'ms');
  console.log('   SERVER_TIMEOUT:', SERVER_TIMEOUT, 'ms');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000 (default)');

  if (process.env.LLAMA_API_ENDPOINT) {
    console.log('   ✅ LLAMA_API_ENDPOINT:', process.env.LLAMA_API_ENDPOINT);
  } else {
    console.log('   ❌ LLAMA_API_ENDPOINT: NOT SET');
  }

  if (process.env.LLAMA_API_KEY) {
    console.log('   ✅ LLAMA_API_KEY:', process.env.LLAMA_API_KEY.substring(0, 10) + '...');
  } else {
    console.log('   ❌ LLAMA_API_KEY: NOT SET');
  }

  if (process.env.DEPLOY_NAME) {
    console.log('   ✅ DEPLOY_NAME:', process.env.DEPLOY_NAME);
  } else {
    console.log('   ⚠️  DEPLOY_NAME: NOT SET (optional)');
  }

  console.log('\n🎯 Azure Llama API Proxy Server ready on HTTPS!\n');
});
