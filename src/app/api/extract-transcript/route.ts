import { NextRequest, NextResponse } from 'next/server';
import { TranscriptRequest, TranscriptResponse } from '@/lib/types';
import { 
  formatWithOpenAI, 
  formatWithGemini, 
  extractVideoIdFromUrl, 
  downloadAndTranscribeFromUrl 
} from '@/lib/ai-processing';

export const maxDuration = 299;

export async function POST(request: NextRequest) {
  try {
    const body: TranscriptRequest = await request.json();
    
    if (!body.video_url) {
      return NextResponse.json(
        { detail: "video_url is required" },
        { status: 400 }
      );
    }

    if (!body.ai_provider || !['openai', 'gemini'].includes(body.ai_provider)) {
      return NextResponse.json(
        { detail: "Invalid AI provider. Choose 'openai' or 'gemini'" },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    const videoId = extractVideoIdFromUrl(body.video_url);
    if (!videoId) {
      return NextResponse.json(
        { 
          detail: "Invalid YouTube URL format. Please provide a valid YouTube URL.\n\nSupported formats:\n• https://www.youtube.com/watch?v=VIDEO_ID\n• https://youtu.be/VIDEO_ID\n• https://www.youtube.com/embed/VIDEO_ID" 
        },
        { status: 400 }
      );
    }

    console.log(`Processing YouTube video: ${body.video_url} (ID: ${videoId})`);
    
    try {
      // Download and transcribe the YouTube video
      console.log('Starting YouTube download and transcription...');
      const { transcript: rawTranscript, chunks } = await downloadAndTranscribeFromUrl(body.video_url);
      
      console.log(`YouTube transcription completed: ${rawTranscript.length} characters from ${chunks} chunk(s)`);
      
      // Format with AI
      const formatPrompt = body.format_prompt || 
        "Please format this transcript into a clear, well-structured summary with key points and main topics.";
      
      let formattedResponse: string;
      if (body.ai_provider === "openai") {
        formattedResponse = await formatWithOpenAI(rawTranscript, formatPrompt);
      } else {
        formattedResponse = await formatWithGemini(rawTranscript, formatPrompt);
      }
      
      const response: TranscriptResponse = {
        video_id: videoId,
        raw_transcript: rawTranscript,
        formatted_response: formattedResponse,
        ai_provider: body.ai_provider,
        file_chunks: chunks
      };
      
      console.log('YouTube transcript extraction completed successfully');
      return NextResponse.json(response);
      
    } catch (downloadError: any) {
      console.error('YouTube processing error:', downloadError);
      
      // Handle specific YouTube/download errors
      if (downloadError.message.includes('Invalid YouTube URL')) {
        return NextResponse.json(
          { 
            detail: "Invalid YouTube URL or video not accessible.\n\nPlease check:\n1. The URL is correct and public\n2. The video is not age-restricted\n3. The video is not private or deleted",
            video_id: videoId
          },
          { status: 400 }
        );
      } else if (downloadError.message.includes('Failed to download')) {
        return NextResponse.json(
          { 
            detail: `YouTube Download Error: ${downloadError.message}\n\nPossible solutions:\n1. Try the URL again\n2. Check if the video is available in your region\n3. Use the file upload method instead`,
            video_id: videoId,
            alternative_method: "You can download the video manually using youtube-dl or online converters, then upload the audio file"
          },
          { status: 503 }
        );
      } else if (downloadError.message.includes('Download timeout')) {
        return NextResponse.json(
          { 
            detail: "YouTube download timed out. The video might be too long or the connection is slow.\n\nSuggestions:\n1. Try a shorter video\n2. Check your internet connection\n3. Use the file upload method for long videos",
            video_id: videoId
          },
          { status: 408 }
        );
      }
      
      // Re-throw for general error handling
      throw downloadError;
    }
    
  } catch (error) {
    console.error('Extract transcript error:', error);
    
    // Handle general errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { detail: "Invalid JSON in request body. Please check your request format." },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API key not configured')) {
        return NextResponse.json(
          { detail: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" },
          { status: 500 }
        );
      } else if (error.message.includes('Network connection error')) {
        return NextResponse.json(
          { 
            detail: `Network Error: ${error.message}\n\nTroubleshooting:\n1. Check your internet connection\n2. Verify OpenAI API key\n3. Try again in a few moments` 
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "An unexpected error occurred during YouTube processing" },
      { status: 500 }
    );
  }
} 