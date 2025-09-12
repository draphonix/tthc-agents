#!/usr/bin/env node

/**
 * Test script to send a message to the ADK chat route and capture the raw response
 * Run with: node test-adk-chat-route.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ADK_SERVICE_URL = 'https://adk-service-418025649220.us-east4.run.app';

// Test data
const testData = {
  appName: 'orchestrator',
  userId: `test-user-${Date.now()}`,
  sessionId: '', // Will be set after session creation
  newMessage: {
    parts: [{ text: 'Hello, can you help me with birth certificate registration in Vietnam?' }],
    role: 'user',
  },
  streaming: true,
};

async function testAdkDirect() {
  console.log('🔍 Testing ADK Direct API...');
  console.log(`URL: ${ADK_SERVICE_URL}/run_sse`);
  console.log('');

  try {
    // First, we need to create a session with the ADK service
    console.log('1. Creating session with ADK service...');
    
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

    // Send message directly to ADK service
    console.log('\n2. Sending message directly to ADK service...');
    
    const response = await fetch(`${ADK_SERVICE_URL}/run_sse`, {
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

    console.log('✅ Request successful, capturing raw streaming response...');

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let rawChunks = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        rawChunks.push(chunk);
        
        // Log each chunk for debugging
        console.log('📦 Received raw chunk:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
      }
    } finally {
      reader.releaseLock();
    }

    console.log('\n✅ Streaming response complete');
    console.log(`Total chunks received: ${rawChunks.length}`);
    console.log(`Total response length: ${fullResponse.length} characters`);

    // Create a model with only the raw data
    const model = {
      timestamp: new Date().toISOString(),
      request: testData,
      rawResponse: {
        fullText: fullResponse,
        chunks: rawChunks,
        chunkCount: rawChunks.length
      },
      metadata: {
        adkServiceUrl: ADK_SERVICE_URL,
        endpoint: '/run_sse'
      }
    };

    // Save the model to a file
    const modelPath = path.join(__dirname, 'adk-raw-response-model.json');
    fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
    
    console.log('\n💾 Raw model saved to:', modelPath);
    console.log('\n📋 Model Summary:');
    console.log('   - Request:', testData.newMessage.parts[0].text);
    console.log('   - Session ID:', testData.sessionId);
    console.log('   - User ID:', testData.userId);
    console.log('   - Raw response chunks:', rawChunks.length);
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
testAdkDirect();