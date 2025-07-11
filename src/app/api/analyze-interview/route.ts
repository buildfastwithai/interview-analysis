export const maxDuration = 600;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Get the backend URL from environment variables
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Always use the transcript analysis endpoint
    const endpoint = `${backendUrl}/analyze-transcript`;
    console.log("endpoint", endpoint);

    // Forward the request to FastAPI backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        return Response.json(errorData, { status: response.status });
      }

      const data = await response.json();
      return Response.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return Response.json(
          { detail: "Request timeout - the analysis is taking too long" },
          { status: 524 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("API route error:", error);
    return Response.json({ detail: "Internal server error" }, { status: 500 });
  }
}
