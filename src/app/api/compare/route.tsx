import { NextResponse } from "next/server";

// API endpoint for the backend service
const API_ENDPOINT = process.env.API_ENDPOINT || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const originalAnalysis = formData.get("original_analysis") as File;
    const aiAnalysis = formData.get("ai_analysis") as File;

    if (!originalAnalysis || !aiAnalysis) {
      return NextResponse.json(
        { message: "Both analysis files are required" },
        { status: 400 }
      );
    }

    // Validate file types
    if (!originalAnalysis.name.toLowerCase().endsWith(".pdf") || 
        !aiAnalysis.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { message: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend
    const backendFormData = new FormData();
    backendFormData.append("original_analysis", originalAnalysis);
    backendFormData.append("ai_analysis", aiAnalysis);

    // Send files directly to the backend API for comparison
    const response = await fetch(`${API_ENDPOINT}/compare-analyses`, {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.detail || "Failed to compare documents" },
        { status: response.status }
      );
    }

    const comparisonResult = await response.json();
    return NextResponse.json(comparisonResult);
    
  } catch (error: any) {
    console.error("Error comparing PDF documents:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
