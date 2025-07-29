import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveAnalysisResponse } from '@/lib/types';
import { 
  transcribeFromBuffer, 
  formatWithOpenAI, 
  validateTranscriptQuality,
  assessSkillsWithOpenAI,
  extractQAWithOpenAI,
  generateInterviewInsightsWithOpenAI,
  generateAnalysisSummaryWithOpenAI
} from '@/lib/ai-processing';

export const maxDuration = 300; // 5 minutes timeout

// Helper function to validate file type
function validateInterviewFile(filename: string): { isValid: boolean; error?: string } {
  const allowedTypes = ['.mp3', '.wav', '.m4a', '.mp4', '.avi', '.mov', '.webm', '.mkv'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedTypes.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const skillsToAssess = formData.get('skills_to_assess') as string;
    const jobRole = (formData.get('job_role') as string) || 'Software Developer';
    const companyName = (formData.get('company_name') as string) || 'Company';
    const aiProvider = (formData.get('ai_provider') as string) || 'openai';

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { detail: "No file provided" },
        { status: 400 }
      );
    }

    if (!skillsToAssess) {
      return NextResponse.json(
        { detail: "skills_to_assess is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const validation = validateInterviewFile(file.name);
    if (!validation.isValid) {
      return NextResponse.json(
        { detail: validation.error },
        { status: 400 }
      );
    }

    // Parse and validate skills
    const skillsList = skillsToAssess.split(',').map(skill => skill.trim()).filter(skill => skill);
    if (skillsList.length === 0) {
      return NextResponse.json(
        { detail: "At least one skill must be provided" },
        { status: 400 }
      );
    }

    if (skillsList.length > 20) {
      return NextResponse.json(
        { detail: "Maximum 20 skills allowed per analysis" },
        { status: 400 }
      );
    }

    // Check file size (25MB limit for OpenAI API)
    const maxFileSize = 25 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { detail: `File too large. Maximum size allowed is 25MB, but file is ${(file.size / (1024*1024)).toFixed(1)}MB` },
        { status: 413 }
      );
    }

    // Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Transcribe with Whisper
    console.log("Transcribing audio with Whisper...");
    const { transcript: rawTranscript, chunks } = await transcribeFromBuffer(buffer, file.name);

    // Step 2: Validate transcript quality
    const quality = validateTranscriptQuality(rawTranscript);
    if (!quality.isValid) {
      return NextResponse.json(
        { detail: `Transcript validation failed: ${quality.message}` },
        { status: 400 }
      );
    }

    // Step 3: Format transcript
    console.log("Formatting transcript...");
    const formattedTranscript = await formatWithOpenAI(
      rawTranscript,
      `Please format this ${jobRole} interview transcript for ${companyName} into a clear, well-structured format with proper paragraphs and speaker identification where possible. Don't include any other text in the response, just the formatted transcript. Don't use markdown formatting.`
    );

    // Step 4: Parallel analysis
    console.log("Performing comprehensive analysis...");
    
    // Run all analyses in parallel
    const [skillAssessments, questionsAndAnswers, interviewInsights] = await Promise.all([
      assessSkillsWithOpenAI(rawTranscript, skillsList, jobRole),
      extractQAWithOpenAI(rawTranscript, jobRole),
      generateInterviewInsightsWithOpenAI(rawTranscript, jobRole)
    ]);

    // Step 5: Generate executive summary
    console.log("Generating analysis summary...");
    const analysisSummary = await generateAnalysisSummaryWithOpenAI(
      skillAssessments,
      questionsAndAnswers,
      interviewInsights,
      jobRole
    );

    // Step 6: Return comprehensive response
    const response: ComprehensiveAnalysisResponse = {
      filename: file.name,
      raw_transcript: rawTranscript,
      formatted_transcript: formattedTranscript,
      ai_provider: aiProvider,
      file_chunks: chunks,
      skill_assessments: skillAssessments,
      questions_and_answers: questionsAndAnswers,
      interview_insights: interviewInsights,
      analysis_summary: analysisSummary
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Comprehensive analysis error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
