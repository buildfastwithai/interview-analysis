import ComparePDF from "@/components/compare-pdf";

export const metadata = {
  title: "Compare Interview Analyses",
  description: "Compare original and AI-generated interview analysis reports",
};

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <ComparePDF />
    </main>
  );
} 