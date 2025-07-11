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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

  try {
    const response = await fetch(`${API_URL}/extract-transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || "Failed to extract transcript");
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Request timeout - transcript extraction is taking too long"
      );
    }
    throw error;
  }
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

  try {
    const response = await fetch(`${API_URL}/upload-audio`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || "Failed to process audio file");
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - audio processing is taking too long");
    }
    throw error;
  }
}
