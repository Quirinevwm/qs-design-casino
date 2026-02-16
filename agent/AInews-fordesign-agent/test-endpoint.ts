import 'dotenv/config';
import axios from 'axios';

async function testEndpoint() {
  const endpoint = process.env.AZURE_AI_ENDPOINT;
  const apiKey = process.env.AZURE_AI_API_KEY;
  
  console.log('Testing variations...\n');
  
  const tests = [
    `${endpoint}/chat/completions`,
    `${endpoint}/models/claude-sonnet-4-5/chat/completions`,
    `${endpoint}/inference/chat/completions`,
  ];
  
  for (const url of tests) {
    console.log(`Trying: ${url}`);
    try {
      const response = await axios.post(url, {
        messages: [
          { role: 'user', content: 'Test' }
        ],
        max_tokens: 5
      }, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`✅ SUCCESS!`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      break;
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.response?.data?.error || error.message;
      console.log(`❌ ${status}: ${JSON.stringify(message)}\n`);
    }
  }
}

testEndpoint();
