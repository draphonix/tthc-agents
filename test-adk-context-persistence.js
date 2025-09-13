#!/usr/bin/env node

/**
 * Test script to verify ADK chat context persistence across multiple messages
 * 
 * This test sends a sequence of messages to verify that the ADK agent maintains
 * context from previous messages in the conversation.
 * 
 * It now captures stateDelta from the ADK streaming response and sends it back
 * on subsequent turns, and also includes a conversationHistory in stateDelta
 * so the agent can reason over prior turns even if the backend does not persist
 * raw message history.
 * 
 * Test Flow:
 * 1. Create a session
 * 2. Send Message 1: "Hello, my name is ABC" (capture stateDelta + response)
 * 3. Send Message 2: "What is my name?" (send accumulated stateDelta + history)
 * 4. Validate the agent answers using prior context
 * 
 * Run with: node test-adk-context-persistence.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ADK_SERVICE_URL = 'https://adk-service-418025649220.us-east4.run.app';

// Global accumulators shared across a scenario run
function createScenarioAccumulators() {
  return {
    // Accumulate agent-proposed state changes across turns
    aggregatedStateDelta: {},
    // Keep a simple history of user/assistant messages
    history: [] // items: { role: 'user'|'assistant', text: string }
  };
}

// Test configuration
const TEST_SCENARIOS = [
  {
    name: 'Name Memory Test',
    messages: [
      { text: 'Hello, my name is Alice Johnson', expectsResponse: true },
      { text: 'What is my name?', expectsResponse: true, shouldContain: ['Alice', 'Johnson'] }
    ]
  },
  {
    name: 'Number Memory Test',
    messages: [
      { text: 'I have 3 cats and 2 dogs as pets', expectsResponse: true },
      { text: 'How many pets do I have in total?', expectsResponse: true, shouldContain: ['5', 'five'] }
    ]
  },
  {
    name: 'Location Memory Test',
    messages: [
      { text: 'I live in San Francisco, California', expectsResponse: true },
      { text: 'What city do I live in?', expectsResponse: true, shouldContain: ['San Francisco'] }
    ]
  }
];

/**
 * Deep merge helper for stateDelta objects
 */
function deepMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      target[key] = deepMerge(tgtVal && typeof tgtVal === 'object' ? tgtVal : {}, srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

/**
 * Extract meaningful text and stateDelta from streaming response chunks
 */
function extractFromChunks(chunks) {
  const fullText = chunks.join('');
  const lines = fullText.split('\n');
  let extractedText = '';
  let accumulatedStateDelta = {};

  for (const line of lines) {
    if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
      const payload = line.substring(6);
      try {
        const data = JSON.parse(payload);
        // Text components observed in different schemas
        if (data.message && data.message.parts) {
          extractedText += data.message.parts.map(part => part.text).join('');
        } else if (data.content && data.content.parts) {
          extractedText += data.content.parts.map(part => part.text).join('');
        } else if (data.content && typeof data.content === 'string') {
          extractedText += data.content;
        } else if (data.text) {
          extractedText += data.text;
        }
        // Capture any stateDelta the agent proposes
        if (data.actions && data.actions.stateDelta) {
          accumulatedStateDelta = deepMerge(accumulatedStateDelta, data.actions.stateDelta);
        }
      } catch (e) {
        // Non-JSON data: treat it as text fallback
        extractedText += payload;
      }
    }
  }

  return {
    text: (extractedText || fullText).trim(),
    stateDelta: accumulatedStateDelta,
  };
}

/**
 * Send a message and capture the response.
 * - Reuses the same session
 * - Includes conversation history and accumulated stateDelta
 */
async function sendMessage(userId, sessionId, messageText, acc) {
  console.log(`📤 Sending: "${messageText}"`);

  // Update history with the outgoing user message first
  acc.history.push({ role: 'user', text: messageText });

  // Build conversationHistory in ADK-friendly shape
  const conversationHistory = acc.history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  // Merge accumulated state with conversationHistory
  const outgoingStateDelta = deepMerge({}, acc.aggregatedStateDelta);
  outgoingStateDelta.conversationHistory = conversationHistory;

  const requestData = {
    appName: 'orchestrator',
    userId,
    sessionId,
    newMessage: {
      parts: [{ text: messageText }],
      role: 'user',
    },
    streaming: true,
    stateDelta: outgoingStateDelta,
  };

  const response = await fetch(`${ADK_SERVICE_URL}/run_sse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed (${response.status}): ${error}`);
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }

  const { text, stateDelta } = extractFromChunks(chunks);
  console.log(`📥 Received: "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`);

  // Accumulate any returned stateDelta for future turns
  if (stateDelta && Object.keys(stateDelta).length > 0) {
    acc.aggregatedStateDelta = deepMerge(acc.aggregatedStateDelta, stateDelta);
    console.log('🧠 Accumulated stateDelta keys:', Object.keys(acc.aggregatedStateDelta));
  }

  // Add assistant reply to history for subsequent turns
  acc.history.push({ role: 'assistant', text });

  return {
    request: messageText,
    rawChunks: chunks,
    extractedText: text,
    stateDelta,
    accumulatedStateDelta: acc.aggregatedStateDelta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a session with ADK service
 */
async function createSession(userId) {
  console.log('🔧 Creating ADK session...');

  const sessionResponse = await fetch(
    `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions`,
    { method: 'POST' }
  );

  if (!sessionResponse.ok) {
    throw new Error(`Failed to create session: ${sessionResponse.status}`);
  }

  const sessionData = await sessionResponse.json();
  console.log(`✅ Session created: ${sessionData.id}`);

  return sessionData.id;
}

/**
 * Delete a session
 */
async function deleteSession(userId, sessionId) {
  console.log('🧹 Cleaning up session...');

  const deleteResponse = await fetch(
    `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions/${sessionId}`,
    { method: 'DELETE' }
  );

  if (deleteResponse.ok) {
    console.log('✅ Session deleted successfully');
  } else {
    console.log(`⚠️  Session deletion failed: ${deleteResponse.status}`);
  }
}

/**
 * Check if response contains expected content
 */
function validateResponse(response, expectedContent) {
  if (!expectedContent || expectedContent.length === 0) {
    return { passed: true, details: 'No validation required' };
  }

  const responseText = response.extractedText.toLowerCase();
  const foundItems = [];
  const missingItems = [];

  for (const expected of expectedContent) {
    if (responseText.includes(expected.toLowerCase())) {
      foundItems.push(expected);
    } else {
      missingItems.push(expected);
    }
  }

  return {
    passed: missingItems.length === 0,
    foundItems,
    missingItems,
    details: missingItems.length === 0
      ? `Found all expected content: ${foundItems.join(', ')}`
      : `Missing: ${missingItems.join(', ')}, Found: ${foundItems.join(', ')}`
  };
}

/**
 * Run a single test scenario
 */
async function runScenario(scenario) {
  console.log(`\n🎯 Running scenario: ${scenario.name}`);
  console.log('='.repeat(50));

  const userId = `test-context-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  let sessionId;
  const acc = createScenarioAccumulators();
  const responses = [];
  const results = [];

  try {
    // Create session
    sessionId = await createSession(userId);

    // Send each message in sequence
    for (let i = 0; i < scenario.messages.length; i++) {
      const message = scenario.messages[i];
      console.log(`\n📝 Step ${i + 1}:`);

      // Add delay between messages to ensure proper processing
      if (i > 0) {
        console.log('⏳ Waiting 2 seconds before next message...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const response = await sendMessage(userId, sessionId, message.text, acc);
      responses.push(response);

      // Validate response if expected content is specified
      if (message.shouldContain) {
        const validation = validateResponse(response, message.shouldContain);
        results.push({
          step: i + 1,
          message: message.text,
          validation,
          response: response.extractedText
        });

        if (validation.passed) {
          console.log(`✅ Context validation passed: ${validation.details}`);
        } else {
          console.log(`❌ Context validation failed: ${validation.details}`);
        }
      }
    }

    // Calculate overall scenario result
    const failedValidations = results.filter(r => !r.validation.passed);
    const scenarioResult = {
      scenario: scenario.name,
      passed: failedValidations.length === 0,
      userId,
      sessionId,
      totalSteps: scenario.messages.length,
      validationSteps: results.length,
      failedValidations: failedValidations.length,
      responses,
      results,
      accumulatedStateDelta: acc.aggregatedStateDelta,
      timestamp: new Date().toISOString()
    };

    if (scenarioResult.passed) {
      console.log(`\n🎉 Scenario "${scenario.name}" PASSED`);
    } else {
      console.log(`\n❌ Scenario "${scenario.name}" FAILED (${failedValidations.length} validation failures)`);
    }

    return scenarioResult;

  } catch (error) {
    console.error(`\n💥 Scenario "${scenario.name}" failed with error:`, error.message);
    return {
      scenario: scenario.name,
      passed: false,
      error: error.message,
      userId,
      sessionId,
      responses,
      accumulatedStateDelta: acc.aggregatedStateDelta,
      timestamp: new Date().toISOString()
    };
  } finally {
    // Clean up session
    if (sessionId) {
      await deleteSession(userId, sessionId);
    }
  }
}

/**
 * Main test runner
 */
async function runContextPersistenceTests() {
  console.log('🚀 Starting ADK Context Persistence Tests');
  console.log(`📡 ADK Service URL: ${ADK_SERVICE_URL}`);
  console.log(`🧪 Running ${TEST_SCENARIOS.length} test scenarios`);
  console.log('='.repeat(80));

  const allResults = [];

  for (const scenario of TEST_SCENARIOS) {
    const result = await runScenario(scenario);
    allResults.push(result);

    // Add delay between scenarios
    if (scenario !== TEST_SCENARIOS[TEST_SCENARIOS.length - 1]) {
      console.log('\n⏳ Waiting 3 seconds before next scenario...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Generate summary
  const passedTests = allResults.filter(r => r.passed).length;
  const totalTests = allResults.length;

  console.log('\n');
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total scenarios: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  // List individual results
  console.log('\n📝 Individual Results:');
  allResults.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.scenario}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (!result.passed && result.failedValidations > 0) {
      console.log(`   Failed ${result.failedValidations} validation(s)`);
    }
  });

  // Save detailed results to file
  const reportData = {
    summary: {
      totalScenarios: totalTests,
      passedScenarios: passedTests,
      failedScenarios: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      timestamp: new Date().toISOString()
    },
    scenarios: allResults,
    configuration: {
      adkServiceUrl: ADK_SERVICE_URL,
      testScenarios: TEST_SCENARIOS
    }
  };

  const reportPath = path.join(__dirname, `adk-context-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! ADK context persistence is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Context persistence may have issues.');
    process.exit(1);
  }
}

// Run the tests
runContextPersistenceTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
