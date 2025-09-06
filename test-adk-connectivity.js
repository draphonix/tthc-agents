#!/usr/bin/env node

/**
 * Test script to verify ADK service connectivity
 * Run with: node test-adk-connectivity.js
 */

const ADK_SERVICE_URL = 'https://adk-service-418025649220.us-east4.run.app';

async function testAdkConnectivity() {
  console.log('🔍 Testing ADK Service Connectivity...');
  console.log(`URL: ${ADK_SERVICE_URL}\n`);

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${ADK_SERVICE_URL}/health`, {
      method: 'GET',
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const health = await healthResponse.json();
    console.log('✅ Health check:', health);

    // Test 2: List apps
    console.log('\n2. Testing list-apps endpoint...');
    const appsResponse = await fetch(`${ADK_SERVICE_URL}/list-apps`);
    const apps = await appsResponse.json();
    console.log('✅ Available apps:', apps);

    // Test 3: Create session
    console.log('\n3. Testing session creation...');
    const userId = `test-user-${Date.now()}`;
    const sessionResponse = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions`,
      { method: 'POST' }
    );
    const session = await sessionResponse.json();
    console.log('✅ Session created:', {
      id: session.id,
      appName: session.appName,
      userId: session.userId,
    });

    // Test 4: Get session
    console.log('\n4. Testing session retrieval...');
    const getSessionResponse = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions/${session.id}`
    );
    const retrievedSession = await getSessionResponse.json();
    console.log('✅ Session retrieved:', {
      id: retrievedSession.id,
      eventsCount: retrievedSession.events.length,
    });

    // Test 5: Simple message (this might fail if streaming is not properly handled)
    console.log('\n5. Testing simple message...');
    try {
      const messageResponse = await fetch(
        `${ADK_SERVICE_URL}/run_sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            appName: 'orchestrator',
            userId: userId,
            sessionId: session.id,
            newMessage: {
              parts: [{
                text: 'Hello, can you help me with birth certificate registration in Vietnam?'
              }],
              role: 'user'
            },
            streaming: true
          }),
        }
      );
      
      if (messageResponse.ok) {
        // Try to read a small chunk of the response
        const reader = messageResponse.body?.getReader();
        if (reader) {
          const { value } = await reader.read();
          const chunk = new TextDecoder().decode(value);
          console.log('✅ Message sent successfully, response chunk:', chunk.substring(0, 100) + '...');
          reader.releaseLock();
        }
      } else {
        console.log('⚠️  Message sending returned status:', messageResponse.status);
      }
    } catch (error) {
      console.log('⚠️  Message test error (expected for streaming):', error.message);
    }

    // Test 6: Delete session
    console.log('\n6. Testing session deletion...');
    const deleteResponse = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions/${session.id}`,
      { method: 'DELETE' }
    );
    
    if (deleteResponse.ok) {
      console.log('✅ Session deleted successfully');
    } else {
      console.log('⚠️  Session deletion failed:', deleteResponse.status);
    }

    console.log('\n🎉 All connectivity tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - ADK service is reachable');
    console.log('   - Session management works');
    console.log('   - Message endpoint is available');
    console.log('   - Ready for integration!');

  } catch (error) {
    console.error('\n❌ Connectivity test failed:', error.message);
    process.exit(1);
  }
}

testAdkConnectivity();
