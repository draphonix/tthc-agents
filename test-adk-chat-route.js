#!/usr/bin/env node

/**
 * Test script to send a message to the ADK chat route and capture the response
 * Run with: node test-adk-chat-route.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port
const API_ENDPOINT = '/api/adk/chat';

// Test data
const testData = {
  sessionId: `test-session-${Date.now()}`,
  userId: `test-user-${Date.now()}`,
  message: 'Hello, can you help me with birth certificate registration in Vietnam?',
  metadata: {
    test: true,
    timestamp: new Date().toISOString()
  }
};

async function testAdkChatRoute() {
  console.log('🔍 Testing ADK Chat Route...');
  console.log(`URL: ${SERVER_URL}${API_ENDPOINT}`);
  console.log('Test data:', JSON.stringify(testData, null, 2));
  console.log('');

  try {
    // First, we need to create a session with the ADK service
    console.log('1. Creating session with ADK service...');
    const ADK_SERVICE_URL = 'https://adk-service-418025649220.us-east4.run.app';
    
    const sessionResponse = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${testData.userId}/sessions`,
      { method: 'POST' }
    );
    
    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.status}`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log('✅ Session created:', sessionData.id);
    
    // Update sessionId with the actual session ID
    testData.sessionId = sessionData.id;

    // Send message to our server's ADK chat route
    console.log('\n2. Sending message to ADK chat route...');
    
    const response = await fetch(`${SERVER_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error response:', error);
      throw new Error(`Request failed: ${response.status}`);
    }

    console.log('✅ Request successful, capturing streaming response...');

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let chunks = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        chunks.push(chunk);
        
        // Log each chunk for debugging
        console.log('📦 Received chunk:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
      }
    } finally {
      reader.releaseLock();
    }

    console.log('\n✅ Streaming response complete');
    console.log(`Total chunks received: ${chunks.length}`);
    console.log(`Total response length: ${fullResponse.length} characters`);

    // Create a model from the captured response
    const model = {
      timestamp: new Date().toISOString(),
      request: testData,
      response: {
        fullText: fullResponse,
        chunks: chunks,
        chunkCount: chunks.length
      },
      metadata: {
        serverUrl: SERVER_URL,
        apiEndpoint: API_ENDPOINT,
        adkServiceUrl: ADK_SERVICE_URL
      }
    };

    // Save the model to a file
    const modelPath = path.join(__dirname, 'adk-response-model.json');
    fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
    
    console.log('\n💾 Model saved to:', modelPath);
    console.log('\n📋 Model Summary:');
    console.log('   - Request:', testData.message);
    console.log('   - Session ID:', testData.sessionId);
    console.log('   - User ID:', testData.userId);
    console.log('   - Response chunks:', chunks.length);
    console.log('   - Total response length:', fullResponse.length, 'characters');

    // Clean up - delete the session
    console.log('\n3. Cleaning up session...');
    const deleteResponse = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${testData.userId}/sessions/${testData.sessionId}`,
      { method: 'DELETE' }
    );
    
    if (deleteResponse.ok) {
      console.log('✅ Session deleted successfully');
    } else {
      console.log('⚠️  Session deletion failed:', deleteResponse.status);
    }

    console.log('\n🎉 Test completed successfully!');
    return model;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAdkChatRoute();