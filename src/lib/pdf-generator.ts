import jsPDF from "jspdf";
import {
  AnalysisResponse,
  SkillAssessment,
  QuestionAnswer,
  InterviewInsights,
} from "../components/InterviewAnalysis";

interface PDFGenerationOptions {
  includeTranscript?: boolean;
  includeRawData?: boolean;
}

export class InterviewPDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  private checkPageBreak(contentHeight: number = 10) {
    if (this.currentY + contentHeight > this.pageHeight) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  private addTitle(title: string, size: number = 16) {
    this.checkPageBreak(size);
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += size + 5;
  }

  private addSubtitle(subtitle: string, size: number = 12) {
    this.checkPageBreak(size);
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(subtitle, this.margin, this.currentY);
    this.currentY += size + 3;
  }

  private addText(text: string, size: number = 10, maxWidth: number = 170) {
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", "normal");

    const lines = this.doc.splitTextToSize(text, maxWidth);
    const lineHeight = size * 0.4;

    this.checkPageBreak(lines.length * lineHeight + 5);

    lines.forEach((line: string) => {
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += lineHeight;
    });

    this.currentY += 5;
  }

  private addTable(
    headers: string[],
    rows: string[][],
    columnWidths?: number[]
  ) {
    const tableWidth = 170;
    const defaultColumnWidth = tableWidth / headers.length;
    const colWidths = columnWidths || headers.map(() => defaultColumnWidth);

    let currentX = this.margin;

    // Check if table fits on page
    const tableHeight = (rows.length + 1) * 8;
    this.checkPageBreak(tableHeight);

    // Draw headers
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFillColor(240, 240, 240);

    headers.forEach((header, index) => {
      this.doc.rect(currentX, this.currentY - 6, colWidths[index], 8, "F");
      this.doc.text(header, currentX + 2, this.currentY);
      currentX += colWidths[index];
    });

    this.currentY += 8;

    // Draw rows
    this.doc.setFont("helvetica", "normal");
    rows.forEach((row) => {
      currentX = this.margin;
      row.forEach((cell, index) => {
        const cellText = this.doc.splitTextToSize(cell, colWidths[index] - 4);
        this.doc.text(cellText[0] || "", currentX + 2, this.currentY);
        currentX += colWidths[index];
      });
      this.currentY += 8;
    });

    this.currentY += 5;
  }

  private addScoreSection(insights: InterviewInsights) {
    this.addSubtitle("Performance Scores");

    const scores = [
      ["Overall Performance", `${insights.overall_performance_score}/100`],
      ["Communication Clarity", `${insights.communication_clarity}/100`],
      ["Technical Depth", `${insights.technical_depth}/100`],
      ["Problem Solving", `${insights.problem_solving_ability}/100`],
      ["Confidence Level", `${insights.confidence_level}/100`],
    ];

    this.addTable(["Metric", "Score"], scores, [120, 50]);
  }

  private addSkillsSection(skills: SkillAssessment[]) {
    this.addSubtitle("Skills Assessment");

    const skillRows = skills.map((skill) => [
      skill.skill,
      skill.level,
      `${skill.confidence_score}%`,
      skill.evidence.substring(0, 80) +
        (skill.evidence.length > 80 ? "..." : ""),
    ]);

    this.addTable(
      ["Skill", "Level", "Score", "Evidence"],
      skillRows,
      [40, 30, 25, 75]
    );
  }

  private addQASection(qaData: QuestionAnswer[]) {
    this.addSubtitle("Question & Answer Analysis");

    qaData.forEach((qa, index) => {
      this.checkPageBreak(30);

      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(
        `Q${index + 1}: ${qa.question.substring(0, 80)}${
          qa.question.length > 80 ? "..." : ""
        }`,
        this.margin,
        this.currentY
      );
      this.currentY += 6;

      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        `Grade: ${qa.grade} (${qa.score}/100)`,
        this.margin,
        this.currentY
      );
      this.currentY += 6;

      this.addText(
        `Answer: ${qa.answer.substring(0, 200)}${
          qa.answer.length > 200 ? "..." : ""
        }`,
        9
      );
      this.addText(
        `Feedback: ${qa.feedback.substring(0, 200)}${
          qa.feedback.length > 200 ? "..." : ""
        }`,
        9
      );

      this.currentY += 5;
    });
  }

  private addInsightsSection(insights: InterviewInsights) {
    this.addSubtitle("Interview Insights");

    if (insights.strengths.length > 0) {
      this.addText("Strengths:", 10);
      insights.strengths.forEach((strength) => {
        this.addText(`• ${strength}`, 9);
      });
    }

    if (insights.weaknesses.length > 0) {
      this.addText("Areas for Improvement:", 10);
      insights.weaknesses.forEach((weakness) => {
        this.addText(`• ${weakness}`, 9);
      });
    }

    this.addText("Hiring Recommendation:", 10);
    this.addText(insights.hiring_recommendation, 9);

    if (insights.next_steps.length > 0) {
      this.addText("Next Steps:", 10);
      insights.next_steps.forEach((step) => {
        this.addText(`• ${step}`, 9);
      });
    }
  }

  public generatePDF(
    data: AnalysisResponse,
    options: PDFGenerationOptions = {}
  ): void {
    // Header
    this.addTitle("Interview Analysis Report", 18);

    // Basic Info
    this.addText(`File: ${data.filename || "Video Analysis"}`);
    this.addText(`Job Role: Analysis Report`);
    this.addText(`Date: ${new Date().toLocaleDateString()}`);
    this.addText(`AI Provider: ${data.ai_provider}`);

    if (data.file_chunks) {
      this.addText(`Audio Chunks Processed: ${data.file_chunks}`);
    }

    this.currentY += 10;

    // Executive Summary
    this.addSubtitle("Executive Summary");
    this.addText(data.analysis_summary);

    // Performance Scores
    this.addScoreSection(data.interview_insights);

    // Skills Assessment
    if (data.skill_assessments.length > 0) {
      this.addSkillsSection(data.skill_assessments);
    }

    // Q&A Analysis
    if (data.questions_and_answers.length > 0) {
      this.addQASection(data.questions_and_answers);
    }

    // Interview Insights
    this.addInsightsSection(data.interview_insights);

    // Transcript (if requested)
    if (options.includeTranscript) {
      this.doc.addPage();
      this.currentY = 20;
      this.addTitle("Interview Transcript");
      this.addText(data.formatted_transcript, 8);
    }
  }

  public download(filename: string = "interview-analysis.pdf"): void {
    this.doc.save(filename);
  }

  public getBlob(): Blob {
    return this.doc.output("blob");
  }
}

export const generateInterviewPDF = (
  data: AnalysisResponse,
  options: PDFGenerationOptions = {}
): void => {
  const generator = new InterviewPDFGenerator();
  generator.generatePDF(data, options);

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `interview-analysis-${timestamp}.pdf`;

  generator.download(filename);
};
