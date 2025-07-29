import { NextResponse } from 'next/server';
import { HealthResponse } from '@/lib/types';

export async function GET(): Promise<NextResponse<HealthResponse>> {
  try {
    // Quick API key check
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    let status = "healthy";
    let message = "API is running normally";
    
    if (!openaiKey && !geminiKey) {
      status = "warning";
      message = "No API keys configured";
    } else if (!openaiKey) {
      status = "warning";
      message = "OpenAI API key not configured";
    } else if (!geminiKey) {
      status = "warning";
      message = "Gemini API key not configured";
    }
        
    return NextResponse.json({
      status,
      message
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
} 