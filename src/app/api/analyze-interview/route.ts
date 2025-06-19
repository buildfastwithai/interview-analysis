export const maxDuration = 299;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Get the backend URL from environment variables
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Always use the transcript analysis endpoint
    const endpoint = `${backendUrl}/analyze-transcript`;
    console.log("endpoint", endpoint);

    // Forward the request to FastAPI backend
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return Response.json({ detail: "Internal server error" }, { status: 500 });
  }
}
