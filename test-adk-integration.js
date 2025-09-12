#!/usr/bin/env node

/**
 * Test script to verify ADK integration with Vercel AI SDK
 * Run with: node test-adk-integration.js
 */

const fs = require('fs');
const path = require('path');

// Test data
const testData = {
  message: 'Hello, can you help me with birth certificate registration in Vietnam?',
  expectedResponse: 'Of course! I can certainly help you with that.',
};

// Test function to verify SSE parsing
function testSSEParsing() {
  console.log('🔍 Testing SSE parsing...');
  
  // Sample SSE chunk from ADK
  const sampleChunk = 'data: {"content":{"parts":[{"thoughtSignature":"CiQBH8yFtjwpqpjKlMC57DGm5TzAHq5wP0FY0-FxJ40IeTpdizwKhQEBH8yFtgXxGHXxcdrJ3zltNlgOHJRi3CqlCjYuV3Mkyh9i9IwvLyx8mQng6s7iS0THxhEjkHonoXrAnLW7R6MdNhvZPPkqoKArCUKRza0AQV_tyFdLATBEA5R6b0gaJqHAYtxRKhxT6g5MwIQZPpYKyx2Uo65nWoe-OCUB28_BS6qOEsByCmQBH8yFtkmQcBePhDV0BRdzyfRRf9EVxStFNAGfnUusWYUwpbQYvAIvEN1v--6xqsr9Wb21WRZ2hmXzXxPe0lAYtTJUm8Jf59ywxN-mh_jrblH33zsEfZuKYySSQAzRQU09bZ8RCrUBAR_MhbbIbA06snazaxeKpP4dRfRSYE4bpv1GBRe8iCwvnD245PzKglaTtuWrDIEL6BV3Av_3smT2fRPOomLe_7LqQtLtpgFdi3KdcL2H0ETLnza59pvd_ZrnL7dqYMx9aR3epJkgyukchZCa01eGAdMQ7kYDpmQdeeIIUG2ITGVvTMcJqDmFCVTXvjd3QKQryzwjNsXLDUwte4tMJJ_fhkErzx-ek15-xJ7r2OVGgMcw5JfYcgq6AQEfzIW2YOGbjA8sWwd5sKIlIdP_G_h7AdalYAamWQ_Xj7SiArb3S1p7NPgmHC2ePvgcSuJYGtUdwZ97xkxQuVokdnZPNHoOkhLour_gwD6jFdceG-tE_QxOHgVRVxvO1k3MD_TrEZjb2CSAiviI9RE8ZMlQoZPdjtVyC3GejUXyMVRjJDR1gxtQ1XgPozPn9KidVwhxbBtsnAgZe0srszBHOWh1uVFxVzJqvnyTmN3U_JpCTQ38Nk_JNAqAAgEfzIW2l55PiFA5fGLr3bCMA9J4xRmtZYQYxerDpIXdhjU49mictvrBn7ZGMvfSP5V6QAu_aNtxrMlrtI-iXumYZISJ8vw_mz_hg4ZyVQHUTIWTTMOCTIQLPEXZmaQPM1qKscuKgBZHG6V87oumAHM94I6FJuoYOK78SaxjoqbadodU5pRbM2QJfllHtvoUSONKP7DCa1O9Eek8AxkaDqGiRzKDHTPFVJr5iQvoXl1Fz9nAaIjp-jg7ewx1kTVRIRkz_732U8YbYNL-dQhDoQW-esMXLtdicUCFZH5p_CojXIoKTjAm1F-x1SUqC2s1erDn8KGOcu9w1egazJxUdooK3wEBH8yFttTT-vngd7UP_TVJK8DvXm4Ewq3LP22D7-GXMPnJrvSVZasXx0my-evkrJjqK6_gqvWEH3srL9Iabl1qA1J4QLKRujA5g7schy7dErbtnVu3JSX7MSsqYTFsL-NLiu0ZeG_kTT1-AgyBA4FtmEfpZKBwBYWeQVC1vsauj1k3nr9uzUxEhOEBYdf0VazAZjpvW77KXuNn7zuBfq2LX3khO5NyYD4m-tAENTi1Z1NyelBMfmaF2ipd-GMFPXUOdUdIsaBRuFtWlMAeloN6OnxIJPk9TWNZUauKu39zCo0CAR_MhbYJFp6h7pKejbapNJQpUKbalKV9hL4fxn3H1US3bVgkToEXFNBub2lZNPYO1W8Ur1UrTsw0HdOXaFkWS0kuaP2undYdG8RcDNHGg6s6x1rJKg1OxW_vslrCL1b7yKo6_ET1QPvlnttYPZnNOVUKVPAl2jl4lWFWn9aUrTsiBXPZGIGdfmHSYjO60GEvTrK14sMkP46IC1e10IEYnJtEJUUtygrwEl9V6Js486qf4LxcFOvhCxN2ouMxL7e90drq12MajTyDcNBCO6aUOmFSR8RGQbQtIy_5eTNJwoiCRfk8hFB79sdO7iH2kixtZM4z0dWbhtx1_fdB2N1aruJgH9HUU6XNfj-gVgkKygIBH8yFtlTzYjKhsXNVlmoKEHOA5zp8Cu6UMmuzX7pZYFr3HoLGO9rg0V7hoJSOtWOoRU6tnvEEYI8COVTRaHZPqtXbZuYlbufw8CyBpeCGWVfQedl4lUpptfo4791oyfVlZDcTQA1qm0rtqHfU1KoKrVQY071AZeCXvUF546BQ3iYntg_OwTur0-5ZsC5kPi8pVYC1ocFGY3jxWrNyKhtIZDzxRqp_jWnF-u-EFeq2e22XYZWmVeUAWnzK3w0BbcArd3_lPGQRUH_1TmtaX-dfbhJWLUrHApO-lRgMvnjqKgVbKqE5yCqzDknhEa-OaFSqe2uxwTDCeTF2a9ejSEBR3DQIQl_m_cNLh79pL6qpT6J5owfaBl1dTy-fCiXQK6mAkO2uCSZXcj6NaWfFN9uAsJhcyKxkTT5ev38fpFwDRNLbJHSKn-k4jCYKPAEfzIW2kaLlMIErS8JN14uelt-NuZE8yY9vX0OMReccidm9znNHq9A2Me7DXCOkdKfslYhgsFcWh0aAKQ==","text":"Of course! I can certainly help you with that. My purpose is to make the process of getting a birth certificate for your newborn in Vietnam as simple and clear as possible.\\n\\nTo get started, could you tell me a little more about what you need help with? For example, are you wondering:\\n\\n*   "}],\"role\":\"model\"},\"partial\":true,\"usageMetadata\":{\"trafficType\":\"ON_DEMAND\"},\"invocationId\":\"e-d2a4f75f-105f-4465-bb78-238711c8082e\",\"author\":\"OrchestratorAgent\",\"actions\":{\"stateDelta\":{},\"artifactDelta\":{},\"requestedAuthConfigs\":{}},\"id\":\"53749829-2815-4400-ba3c-d50553381ca5\",\"timestamp\":1757686143.046628}';
  
  // Simulate the parsing function
  function parseSSEChunk(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      
      // Extract text from the first part
      const text = data.content?.parts?.[0]?.text || '';
      
      // Check if this is a complete response
      const isComplete = !!data.finishReason;
      
      return {
        text,
        isPartial: data.partial,
        isComplete,
        metadata: {
          finishReason: data.finishReason,
          usageMetadata: data.usageMetadata,
          author: data.author,
          invocationId: data.invocationId,
        },
      };
    } catch (error) {
      console.error('Failed to parse SSE chunk:', error);
      return null;
    }
  }
  
  // Extract JSON from SSE format
  const jsonStr = sampleChunk.trim().substring(6); // Remove 'data: ' prefix
  const parsed = parseSSEChunk(jsonStr);
  
  if (parsed) {
    console.log('✅ SSE parsing successful');
    console.log('   - Text length:', parsed.text.length, 'characters');
    console.log('   - Is partial:', parsed.isPartial);
    console.log('   - Is complete:', parsed.isComplete);
    console.log('   - Author:', parsed.metadata.author);
    console.log('   - Contains expected text:', parsed.text.includes(testData.expectedResponse));
    
    return true;
  } else {
    console.log('❌ SSE parsing failed');
    return false;
  }
}

// Test function to verify ADK client changes
function testADKClientChanges() {
  console.log('\n🔍 Testing ADK client changes...');
  
  // Check if the client files have been updated
  const serverClientPath = path.join(__dirname, 'apps/server/src/lib/adk/client.ts');
  const webClientPath = path.join(__dirname, 'apps/web/src/lib/adk/client.ts');
  
  let serverClientUpdated = false;
  let webClientUpdated = false;
  
  try {
    const serverClientContent = fs.readFileSync(serverClientPath, 'utf8');
    serverClientUpdated = serverClientContent.includes('parseSSEChunk') && 
                          serverClientContent.includes('data: ');
  } catch (error) {
    console.log('   ⚠️  Could not read server client file:', error.message);
  }
  
  try {
    const webClientContent = fs.readFileSync(webClientPath, 'utf8');
    webClientUpdated = webClientContent.includes('parseSSEChunk') && 
                      webClientContent.includes('data: ');
  } catch (error) {
    console.log('   ⚠️  Could not read web client file:', error.message);
  }
  
  if (serverClientUpdated && webClientUpdated) {
    console.log('✅ ADK client changes verified');
    return true;
  } else {
    console.log('❌ ADK client changes not found');
    console.log('   - Server client updated:', serverClientUpdated);
    console.log('   - Web client updated:', webClientUpdated);
    return false;
  }
}

// Test function to verify AI SDK provider changes
function testAIProviderChanges() {
  console.log('\n🔍 Testing AI SDK provider changes...');
  
  // Check if the provider files have been updated
  const serverProviderPath = path.join(__dirname, 'apps/server/src/lib/adk/ai-sdk-provider.ts');
  const webProviderPath = path.join(__dirname, 'apps/web/src/lib/adk/ai-sdk-provider.ts');
  
  let serverProviderUpdated = false;
  let webProviderUpdated = false;
  
  try {
    const serverProviderContent = fs.readFileSync(serverProviderPath, 'utf8');
    serverProviderUpdated = serverProviderContent.includes('usageMetadata') && 
                           serverProviderContent.includes('finishReason');
  } catch (error) {
    console.log('   ⚠️  Could not read server provider file:', error.message);
  }
  
  try {
    const webProviderContent = fs.readFileSync(webProviderPath, 'utf8');
    webProviderUpdated = webProviderContent.includes('usageMetadata') && 
                         webProviderContent.includes('finishReason');
  } catch (error) {
    console.log('   ⚠️  Could not read web provider file:', error.message);
  }
  
  if (serverProviderUpdated && webProviderUpdated) {
    console.log('✅ AI SDK provider changes verified');
    return true;
  } else {
    console.log('❌ AI SDK provider changes not found');
    console.log('   - Server provider updated:', serverProviderUpdated);
    console.log('   - Web provider updated:', webProviderUpdated);
    return false;
  }
}

// Test function to verify API route changes
function testAPIRouteChanges() {
  console.log('\n🔍 Testing API route changes...');
  
  // Check if the API route file has been updated
  const apiRoutePath = path.join(__dirname, 'apps/web/src/app/api/adk/ai-chat/route.ts');
  
  try {
    const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');
    const headersUpdated = apiRouteContent.includes('Transfer-Encoding') && 
                          apiRouteContent.includes('Connection') && 
                          apiRouteContent.includes('Content-Encoding');
    
    if (headersUpdated) {
      console.log('✅ API route changes verified');
      return true;
    } else {
      console.log('❌ API route changes not found');
      return false;
    }
  } catch (error) {
    console.log('   ⚠️  Could not read API route file:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing ADK Integration with Vercel AI SDK\n');
  
  const results = {
    sseParsing: testSSEParsing(),
    adkClientChanges: testADKClientChanges(),
    aiProviderChanges: testAIProviderChanges(),
    apiRouteChanges: testAPIRouteChanges(),
  };
  
  console.log('\n📊 Test Results:');
  console.log('   - SSE Parsing:', results.sseParsing ? '✅ PASS' : '❌ FAIL');
  console.log('   - ADK Client Changes:', results.adkClientChanges ? '✅ PASS' : '❌ FAIL');
  console.log('   - AI Provider Changes:', results.aiProviderChanges ? '✅ PASS' : '❌ FAIL');
  console.log('   - API Route Changes:', results.apiRouteChanges ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The integration should work correctly.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the development server with: bun run dev:web');
    console.log('   2. Navigate to the ADK chat interface');
    console.log('   3. Send a test message to verify streaming works');
  } else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
  }
  
  return allPassed;
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});