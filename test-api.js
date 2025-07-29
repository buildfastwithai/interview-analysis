// Simple test script to verify API functionality
// Run with: node test-api.js

const API_BASE = 'http://localhost:3000/api';

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

async function testYouTubeTranscript() {
  console.log('🎬 Testing YouTube transcript...');
  try {
    const response = await fetch(`${API_BASE}/extract-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', // First YouTube video (18 seconds)
        ai_provider: 'openai',
        format_prompt: 'Please format this as a summary.'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ YouTube transcript:', {
        video_id: data.video_id,
        transcript_length: data.raw_transcript?.length || 0,
        formatted_length: data.formatted_response?.length || 0,
        chunks: data.file_chunks
      });
    } else {
      const error = await response.json();
      console.log('❌ YouTube transcript failed:', error.detail);
    }
  } catch (error) {
    console.log('❌ YouTube transcript error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  await testHealthCheck();
  console.log('');
  
  await testYouTubeTranscript();
  console.log('');
  
  console.log('📋 Test completed!');
  console.log('\n💡 To test file uploads, use the web interface at http://localhost:3000');
}

runTests(); 