#!/usr/bin/env node

/**
 * Test script to verify that the ADK context persistence fix works
 * with multi-turn conversations in the Vercel AI SDK implementation.
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust if needed
const AI_CHAT_ENDPOINT = `${BASE_URL}/api/adk/ai-chat`;

// Test scenario with multi-turn conversation
const testScenario = {
  title: "Birth Certificate Registration - Multi-turn Context Test",
  messages: [
    {
      role: "user",
      content: "I want to register a birth certificate for my newborn child."
    },
    {
      role: "assistant",
      content: "I'd be happy to help you register a birth certificate for your newborn. To get started, I'll need some basic information. What is the child's full name, date of birth, and place of birth?"
    },
    {
      role: "user",
      content: "The child's name is Emma Johnson, born on May 15, 2023, at City General Hospital."
    },
    {
      role: "assistant",
      content: "Thank you for providing that information. Now I'll need details about the parents. What are the full names, dates of birth, and occupations of both parents?"
    },
    {
      role: "user",
      content: "The mother is Sarah Johnson, born March 22, 1990, and she's a teacher. The father is Michael Johnson, born July 10, 1988, and he's an engineer."
    }
  ],
  expectedContextRetention: [
    "The user wants to register a birth certificate",
    "The child's name is Emma Johnson",
    "Born on May 15, 2023",
    "At City General Hospital",
    "Mother is Sarah Johnson, born March 22, 1990, teacher",
    "Father is Michael Johnson, born July 10, 1988, engineer"
  ]
};

/**
 * Send a message to the AI chat endpoint
 */
async function sendChatMessage(messages) {
  try {
    const response = await fetch(AI_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response as a stream
    const stream = response.body;
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
    }

    return fullResponse;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Test multi-turn conversation
 */
async function testMultiTurnConversation() {
  console.log(`\n=== Testing: ${testScenario.title} ===\n`);
  
  const conversationHistory = [];
  let contextRetentionScore = 0;

  // Process each message in sequence
  for (let i = 0; i < testScenario.messages.length; i++) {
    const message = testScenario.messages[i];
    
    console.log(`\n--- Turn ${i + 1} ---`);
    console.log(`${message.role}: ${message.content}`);
    
    // Add message to conversation history
    conversationHistory.push(message);
    
    // If this is a user message, send it and get the response
    if (message.role === 'user') {
      try {
        const response = await sendChatMessage(conversationHistory);
        console.log(`\nAssistant: ${response}`);
        
        // Add assistant response to conversation history
        conversationHistory.push({
          role: "assistant",
          content: response
        });
        
        // Check if the response shows context retention
        const contextCheck = testScenario.expectedContextRetention.filter(item => 
          response.toLowerCase().includes(item.toLowerCase())
        );
        
        if (contextCheck.length > 0) {
          contextRetentionScore += contextCheck.length;
          console.log(`✓ Context retained: ${contextCheck.join(', ')}`);
        }
        
      } catch (error) {
        console.error(`Error processing turn ${i + 1}:`, error.message);
        return false;
      }
    }
  }
  
  // Calculate final score
  const maxPossibleScore = testScenario.expectedContextRetention.length;
  const retentionPercentage = Math.round((contextRetentionScore / maxPossibleScore) * 100);
  
  console.log(`\n=== Test Results ===`);
  console.log(`Context retention score: ${contextRetentionScore}/${maxPossibleScore}`);
  console.log(`Context retention percentage: ${retentionPercentage}%`);
  
  // Consider the test successful if context retention is above 70%
  const isSuccess = retentionPercentage >= 70;
  
  if (isSuccess) {
    console.log(`\n✅ SUCCESS: The ADK context persistence fix is working correctly!`);
    console.log(`   Multi-turn conversations are maintaining context properly.`);
  } else {
    console.log(`\n❌ FAILURE: The ADK context persistence fix needs more work.`);
    console.log(`   Context retention is below the 70% threshold.`);
  }
  
  return isSuccess;
}

/**
 * Run the test
 */
async function runTest() {
  console.log('🧪 Testing ADK Context Persistence Fix');
  console.log('=====================================');
  
  try {
    const success = await testMultiTurnConversation();
    
    if (success) {
      console.log('\n🎉 All tests passed! The fix is working correctly.');
      process.exit(0);
    } else {
      console.log('\n💥 Tests failed! The fix needs more work.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();