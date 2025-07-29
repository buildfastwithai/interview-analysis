import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import ytdl from 'ytdl-core';
import { 
  SkillAssessment, 
  QuestionAnswer, 
  InterviewInsights, 
  TranscriptQuality,
  AIProvider 
} from './types';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000, // 3 minutes
  maxRetries: 3,
});

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Constants
export const OPENAI_TIMEOUT = 600000; // 10 minutes
export const WHISPER_TIMEOUT = 600000; // 10 minutes
export const MAX_SKILLS = 20;
export const MIN_TRANSCRIPT_LENGTH = 50;

/**
 * Validate transcript quality for analysis
 */
export function validateTranscriptQuality(transcript: string): TranscriptQuality {
  if (!transcript || transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
    return {
      isValid: false,
      message: "Transcript too short for meaningful analysis"
    };
  }

  // Check for common transcription errors
  const errorIndicators = ["[inaudible]", "[unclear]", "[unintelligible]"];
  let errorCount = 0;
  
  errorIndicators.forEach(indicator => {
    const count = (transcript.toLowerCase().match(new RegExp(escapeRegExp(indicator), 'g')) || []).length;
    errorCount += count;
  });

  const words = transcript.split(/\s+/);
  const errorRate = errorCount / words.length;

  if (errorRate > 0.1) { // More than 10% errors
    return {
      isValid: false,
      message: "Transcript quality too poor for reliable analysis",
      errorCount
    };
  }

  // Check if it looks like an interview (has questions)
  const questionIndicators = ["?", "tell me", "describe", "explain", "what is", "how do", "why"];
  const hasQuestions = questionIndicators.some(indicator => 
    transcript.toLowerCase().includes(indicator)
  );

  if (!hasQuestions) {
    return {
      isValid: false,
      message: "Content does not appear to be an interview format",
      hasQuestions: false
    };
  }

  return {
    isValid: true,
    message: "Transcript quality acceptable",
    errorCount,
    hasQuestions: true
  };
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Save buffer to temporary file
 */
function saveBufferToTempFile(buffer: Buffer, filename: string): string {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  const tempFilename = `interview_${timestamp}_${filename}`;
  const tempPath = join(tempDir, tempFilename);
  
  writeFileSync(tempPath, buffer);
  console.log(`Saved file to temp path: ${tempPath}`);
  
  return tempPath;
}

/**
 * Download audio from YouTube URL using ytdl-core
 */
export async function downloadYouTubeAudio(videoUrl: string): Promise<string> {
  if (!ytdl.validateURL(videoUrl)) {
    throw new Error('Invalid YouTube URL');
  }

  const tempDir = tmpdir();
  const timestamp = Date.now();
  const tempPath = join(tempDir, `youtube_audio_${timestamp}.mp3`);

  try {
    console.log(`Downloading audio from: ${videoUrl}`);
    
    // Get video info first to check if it exists
    const info = await ytdl.getInfo(videoUrl);
    console.log(`Video title: ${info.videoDetails.title}`);
    console.log(`Duration: ${info.videoDetails.lengthSeconds} seconds`);

    // Create a promise to handle the download
    return new Promise((resolve, reject) => {
      const stream = ytdl(videoUrl, { 
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      const chunks: Buffer[] = [];
      
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        writeFileSync(tempPath, buffer);
        console.log(`Audio downloaded to: ${tempPath} (${buffer.length} bytes)`);
        resolve(tempPath);
      });

      stream.on('error', (error) => {
        console.error('YouTube download error:', error);
        reject(new Error(`Failed to download audio: ${error.message}`));
      });

      // Set a timeout
      setTimeout(() => {
        stream.destroy();
        reject(new Error('Download timeout after 10 minutes'));
      }, 600000); // 10 minutes
    });

  } catch (error: any) {
    console.error('YouTube download error:', error);
    throw new Error(`Failed to download YouTube audio: ${error.message}`);
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoIdFromUrl(url: string): string | undefined {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

/**
 * Process buffer for transcription
 */
export async function transcribeFromBuffer(buffer: Buffer, filename: string): Promise<{ transcript: string; chunks: number }> {
  let tempPath = '';
  
  try {
    // Save buffer to temp file
    tempPath = saveBufferToTempFile(buffer, filename);
    
    // Read the file and create a proper File object
    const fileBuffer = readFileSync(tempPath);
    const blob = new Blob([fileBuffer], { 
      type: /\.(mp4|avi|mov|webm|mkv)$/i.test(filename) ? 'video/mp4' : 'audio/mpeg' 
    });
    
    const file = new File([blob], filename, { type: blob.type });

    // Transcribe with retries
    console.log('Transcribing file...');
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
          response_format: 'text',
        });

        if (!response || typeof response !== 'string' || !response.trim()) {
          throw new Error('Empty transcript received');
        }

        return {
          transcript: response,
          chunks: 1,
        };
      } catch (error: any) {
        retries++;
        console.error(`Transcription attempt ${retries} failed:`, error);
        
        if (retries === maxRetries) {
          throw new Error(`Transcription failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }

    throw new Error('Transcription failed after all retries');

  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  } finally {
    // Clean up temporary file
    if (tempPath && existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch (e) {
        console.error(`Failed to delete temp file ${tempPath}:`, e);
      }
    }
  }
}

/**
 * Download and transcribe from YouTube URL
 */
export async function downloadAndTranscribeFromUrl(videoUrl: string): Promise<{ transcript: string; chunks: number }> {
  let audioPath: string | null = null;
  
  try {
    // Extract video ID for validation
    const videoId = extractVideoIdFromUrl(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    console.log(`Processing YouTube video: ${videoId}`);
    
    // Download audio
    audioPath = await downloadYouTubeAudio(videoUrl);
    
    // Transcribe the downloaded audio
    const result = await transcribeFromBuffer(readFileSync(audioPath), audioPath);
    
    return result;
  } finally {
    // Clean up downloaded file
    if (audioPath && existsSync(audioPath)) {
      unlinkSync(audioPath);
      console.log(`Cleaned up downloaded file: ${audioPath}`);
    }
  }
}

/**
 * Format transcript using OpenAI
 */
export async function formatWithOpenAI(transcript: string, prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that formats and summarizes interview transcripts."
        },
        {
          role: "user",
          content: `${prompt}\n\nTranscript:\n${transcript}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Error formatting transcript";
  } catch (error: any) {
    console.error('OpenAI formatting error:', error);
    
    // Better error handling for formatting
    if (error.status === 401) {
      throw new Error("Invalid OpenAI API key for formatting");
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error("Network timeout during formatting - please try again");
    } else {
      throw new Error(`Formatting failed: ${error.message}`);
    }
  }
}

/**
 * Format transcript using Gemini
 */
export async function formatWithGemini(transcript: string, prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const model = genai.getGenerativeModel({ model: 'gemini-pro' });
    const fullPrompt = `${prompt}\n\nTranscript:\n${transcript}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    
    return response.text();
  } catch (error: any) {
    console.error('Gemini formatting error:', error);
    throw new Error(`Gemini formatting failed: ${error.message}`);
  }
}

/**
 * Assess skills from transcript using OpenAI
 */
export async function assessSkillsWithOpenAI(
  transcript: string, 
  skills: string[], 
  jobRole: string = "Software Developer"
): Promise<SkillAssessment[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  if (!skills || skills.length === 0) {
    throw new Error("No skills provided for assessment");
  }

  if (skills.length > MAX_SKILLS) {
    throw new Error(`Too many skills requested. Maximum ${MAX_SKILLS} skills allowed.`);
  }

  const skillsText = skills.join(", ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for better availability
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer analyzing a ${jobRole} interview transcript. 
          Assess each skill based on evidence in the transcript. Be thorough but fair in your assessment.
          If a skill is not mentioned or demonstrated, mark it as 'Not Demonstrated'.
          Provide specific evidence and actionable recommendations.`
        },
        {
          role: "user",
          content: `Please assess the following skills based on this interview transcript: ${skillsText}

For each skill, provide:
1. Skill level (Beginner/Intermediate/Advanced/Expert/Not Demonstrated)
2. Confidence score (0-100)
3. Specific evidence from the transcript
4. Recommendations for improvement

Format your response as a JSON object with an "assessments" array.

Transcript:
${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"assessments": []}');
    return result.assessments || [];
  } catch (error: any) {
    console.error('Skill assessment error:', error);
    throw new Error(`Skill assessment failed: ${error.message}`);
  }
}

/**
 * Extract Q&A pairs from transcript using OpenAI
 */
export async function extractQAWithOpenAI(
  transcript: string,
  jobRole: string = "Software Developer"
): Promise<QuestionAnswer[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for better availability
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer analyzing a ${jobRole} interview transcript.
          Extract all question-answer pairs and grade each answer objectively.
          Focus on technical accuracy, communication clarity, and completeness of answers.`
        },
        {
          role: "user",
          content: `Please extract all interview questions and answers from this transcript and grade each answer.

For each Q&A pair, provide:
1. The exact question asked
2. The candidate's complete answer
3. Grade (Excellent/Good/Average/Below Average/Poor)
4. Numerical score (0-100)
5. Detailed feedback
6. Key points the candidate covered well
7. Areas for improvement

Format your response as a JSON object with a "qa_pairs" array.

Transcript:
${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"qa_pairs": []}');
    return result.qa_pairs || [];
  } catch (error: any) {
    console.error('Q&A extraction error:', error);
    throw new Error(`Q&A extraction failed: ${error.message}`);
  }
}

/**
 * Generate comprehensive interview insights using OpenAI
 */
export async function generateInterviewInsightsWithOpenAI(
  transcript: string,
  jobRole: string = "Software Developer"
): Promise<InterviewInsights> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for better availability
      messages: [
        {
          role: "system",
          content: `You are a senior HR professional and technical interview expert analyzing a ${jobRole} interview.
          Provide comprehensive insights covering all aspects of the candidate's performance.
          Be objective, constructive, and provide actionable feedback.`
        },
        {
          role: "user",
          content: `Please provide a comprehensive analysis of this interview transcript including:

1. Overall performance metrics (0-100 scores)
2. Strengths and weaknesses
3. Communication and technical analysis
4. Cultural fit indicators
5. Red flags or concerns
6. Hiring recommendation
7. Next steps

Format your response as a JSON object with all the required fields.

Transcript:
${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Ensure all required fields are present with defaults
    return {
      overall_performance_score: result.overall_performance_score || 0,
      communication_clarity: result.communication_clarity || 0,
      technical_depth: result.technical_depth || 0,
      problem_solving_ability: result.problem_solving_ability || 0,
      confidence_level: result.confidence_level || 0,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      key_achievements_mentioned: result.key_achievements_mentioned || [],
      red_flags: result.red_flags || [],
      interview_duration_analysis: result.interview_duration_analysis || "",
      speech_patterns: result.speech_patterns || "",
      engagement_level: result.engagement_level || "",
      cultural_fit_indicators: result.cultural_fit_indicators || [],
      hiring_recommendation: result.hiring_recommendation || "",
      next_steps: result.next_steps || []
    };
  } catch (error: any) {
    console.error('Interview insights error:', error);
    throw new Error(`Interview insights generation failed: ${error.message}`);
  }
}

/**
 * Generate analysis summary
 */
export async function generateAnalysisSummaryWithOpenAI(
  skillAssessments: SkillAssessment[],
  qaPairs: QuestionAnswer[],
  insights: InterviewInsights,
  jobRole: string = "Software Developer"
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const avgSkillScore = skillAssessments.length > 0 
    ? skillAssessments.reduce((sum, sa) => sum + sa.confidence_score, 0) / skillAssessments.length 
    : 0;

  const avgQAScore = qaPairs.length > 0 
    ? qaPairs.reduce((sum, qa) => sum + qa.score, 0) / qaPairs.length 
    : 0;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `You are an expert HR analyst creating an executive summary for a ${jobRole} interview analysis.`
        },
        {
          role: "user",
          content: `Create a comprehensive executive summary based on this interview analysis:

Average Skill Assessment Score: ${avgSkillScore.toFixed(1)}/100
Average Q&A Performance Score: ${avgQAScore.toFixed(1)}/100
Overall Performance Score: ${insights.overall_performance_score}/100

Key Strengths: ${insights.strengths.slice(0, 3).join(', ')}
Key Weaknesses: ${insights.weaknesses.slice(0, 3).join(', ')}
Hiring Recommendation: ${insights.hiring_recommendation}

Please provide a 2-3 paragraph executive summary suitable for hiring managers.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Summary generation failed";
  } catch (error: any) {
    console.error('Summary generation error:', error);
    return `Summary generation failed: ${error.message}`;
  }
} 