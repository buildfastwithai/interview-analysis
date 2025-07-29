import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const results = {
    environment: {
      openai_configured: !!process.env.OPENAI_API_KEY,
      gemini_configured: !!process.env.GEMINI_API_KEY,
    },
    api_tests: {
      openai_connection: false,
      openai_error: null as string | null,
    }
  };

  // Test OpenAI connection if API key is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000, // 30 seconds for test
      });

      // Test with a simple API call
      const models = await openai.models.list();
      if (models && models.data) {
        results.api_tests.openai_connection = true;
      }
    } catch (error: any) {
      results.api_tests.openai_error = error.message;
      console.error('OpenAI connection test failed:', error);
    }
  }

  return NextResponse.json({
    status: 'test_complete',
    message: 'API connectivity test results',
    results,
    suggestions: [
      results.environment.openai_configured ? 
        "✅ OpenAI API key is configured" : 
        "❌ Add OPENAI_API_KEY to .env.local",
      results.api_tests.openai_connection ?
        "✅ OpenAI API connection successful" :
        "❌ OpenAI API connection failed - check network/firewall",
      "💡 If connection fails, try using a VPN or check firewall settings"
    ]
  });
} 