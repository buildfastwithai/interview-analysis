import { NextRequest, NextResponse } from 'next/server';
import { TranscriptResponse } from '@/lib/types';
import { transcribeFromBuffer, formatWithOpenAI, formatWithGemini } from '@/lib/ai-processing';

export const maxDuration = 299;

// Validate file type
function validateAudioFile(filename: string, fileType: string): { isValid: boolean; error?: string } {
  const allowedExtensions = new Set(['.mp3', '.wav', '.m4a', '.mp4', '.avi', '.mov', '.webm']);
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedExtensions.has(fileExtension)) {
    return {
      isValid: false,
      error: `Unsupported file type. Allowed: ${Array.from(allowedExtensions).join(', ')}`
    };
  }
  
  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const aiProvider = (formData.get('ai_provider') as string) || 'openai';
    const formatPrompt = (formData.get('format_prompt') as string) || 
      'Please format this transcript into a clear, well-structured summary with key points and main topics.';

    if (!file) {
      return NextResponse.json(
        { detail: "No file provided" },
        { status: 400 }
      );
    }

    console.log(`Processing upload: ${file.name} (${file.size} bytes)`);

    // Validate file type
    const validation = validateAudioFile(file.name, file.type);
    if (!validation.isValid) {
      return NextResponse.json(
        { detail: validation.error },
        { status: 400 }
      );
    }

    // Check file size (100MB limit)
    const maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { detail: `File too large. Maximum size allowed is 100MB, but file is ${(file.size / (1024*1024)).toFixed(1)}MB` },
        { status: 413 }
      );
    }

    if (!['openai', 'gemini'].includes(aiProvider)) {
      return NextResponse.json(
        { detail: "Invalid AI provider. Choose 'openai' or 'gemini'" },
        { status: 400 }
      );
    }

    // Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Starting transcription...');

    // Transcribe with the new function that handles chunking
    const { transcript: rawTranscript, chunks } = await transcribeFromBuffer(buffer, file.name);

    console.log(`Transcription completed: ${rawTranscript.length} characters from ${chunks} chunk(s)`);

    // Format with AI
    let formattedResponse: string;
    if (aiProvider === "openai") {
      formattedResponse = await formatWithOpenAI(rawTranscript, formatPrompt);
    } else {
      formattedResponse = await formatWithGemini(rawTranscript, formatPrompt);
    }

    const response: TranscriptResponse = {
      filename: file.name,
      raw_transcript: rawTranscript,
      formatted_response: formattedResponse,
      ai_provider: aiProvider,
      file_chunks: chunks
    };

    console.log('Upload audio processing completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload audio error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API key not configured')) {
        return NextResponse.json(
          { detail: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" },
          { status: 500 }
        );
      } else if (error.message.includes('Network connection error') || error.message.includes('Cannot connect to OpenAI')) {
        return NextResponse.json(
          { 
            detail: `Network Error: ${error.message}\n\nTroubleshooting:\n1. Check your internet connection\n2. Verify OpenAI API key is valid\n3. Check if you have sufficient API credits\n4. Try again in a few moments` 
          },
          { status: 503 }
        );
      } else if (error.message.includes('File too large')) {
        return NextResponse.json(
          { detail: `${error.message}\n\nTips:\n1. Compress the audio file\n2. Convert to MP3 format\n3. Use shorter recordings` },
          { status: 413 }
        );
      } else if (error.message.includes('Invalid OpenAI API key')) {
        return NextResponse.json(
          { detail: `${error.message}\n\nPlease:\n1. Check your .env.local file\n2. Verify the API key is correct\n3. Restart the development server` },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "An unexpected error occurred during transcription" },
      { status: 500 }
    );
  }
} 