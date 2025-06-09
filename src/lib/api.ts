const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TranscriptRequest {
  video_url: string;
  ai_provider: "openai" | "gemini";
  format_prompt?: string;
}

export interface TranscriptResponse {
  video_id?: string;
  filename?: string;
  raw_transcript: string;
  formatted_response: string;
  ai_provider: string;
  file_chunks?: number;
}

export async function extractTranscript(
  request: TranscriptRequest
): Promise<TranscriptResponse> {
  const response = await fetch(`${API_URL}/extract-transcript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to extract transcript");
  }

  return response.json();
}

export async function uploadAudioForTranscript(
  file: File,
  aiProvider: "openai" | "gemini" = "openai",
  formatPrompt?: string
): Promise<TranscriptResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ai_provider", aiProvider);
  if (formatPrompt) {
    formData.append("format_prompt", formatPrompt);
  }

  const response = await fetch(`${API_URL}/upload-audio`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to process audio file");
  }

  return response.json();
}
