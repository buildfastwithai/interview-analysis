"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Loader2, Upload, Star, TrendingUp, Brain, MessageSquare, Download, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

const ComparePDF = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [aiFile, setAIFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalFile || !aiFile) {
      setError("Please upload both PDF files");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    
    const formData = new FormData();
    formData.append("original_analysis", originalFile);
    formData.append("ai_analysis", aiFile);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);
      
      const response = await fetch("/api/compare", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to compare PDFs");
      }
      
      const result = await response.json();
      setProgress(100);
      setComparisonResult(result);
    } catch (err: any) {
      setError(err.message || "An error occurred while comparing PDFs");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const getAgreementColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-emerald-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Compare Interview Analyses
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
          Upload and compare original analysis with AI-generated analysis to identify similarities, differences, and recommendations.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8 border-2 shadow-lg">
          <CardHeader className="space-y-2 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Upload className="h-6 w-6 text-blue-500" />
              Upload Analysis Documents
            </CardTitle>
            <CardDescription className="text-base">
              Upload the original analysis and AI-generated analysis of the same interview transcript
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="original-file" className="text-lg font-semibold">
                    Original Analysis (PDF)
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/20">
                    <input
                      id="original-file"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setOriginalFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="original-file" 
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="p-4 bg-blue-50 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-blue-500" />
                      </div>
                      <span className="text-lg font-medium mb-2">
                        {originalFile ? originalFile.name : "Click to upload original analysis"}
                      </span>
                      <span className="text-sm text-gray-500">
                        or drag and drop your PDF file here
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="ai-file" className="text-lg font-semibold">
                    AI-Generated Analysis (PDF)
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all duration-200 hover:border-purple-400 hover:bg-purple-50/20">
                    <input
                      id="ai-file"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setAIFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="ai-file" 
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="p-4 bg-purple-50 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-purple-500" />
                      </div>
                      <span className="text-lg font-medium mb-2">
                        {aiFile ? aiFile.name : "Click to upload AI analysis"}
                      </span>
                      <span className="text-sm text-gray-500">
                        or drag and drop your PDF file here
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base ml-2">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 text-base text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Comparing documents... This may take a moment.
                  </div>
                  <Progress value={progress} className="h-2 w-full" />
                  <p className="text-sm text-gray-600 animate-pulse">
                    {progress < 30 && "Processing files..."}
                    {progress >= 30 && progress < 60 && "Analyzing content..."}
                    {progress >= 60 && progress < 90 && "Generating comparison..."}
                    {progress >= 90 && "Finalizing results..."}
                  </p>
                </motion.div>
              )}
              
              <Button 
                type="submit" 
                className={cn(
                  "w-full text-lg py-6 transition-all duration-300",
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                  "shadow-lg hover:shadow-xl",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Comparing...
                  </span>
                ) : (
                  "Compare Analysis Documents"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
      
      {comparisonResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Agreement Score Card */}
          <Card className="border-2 shadow-lg overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Star className="h-6 w-6 text-yellow-500" />
                  Analysis Comparison Results
                </CardTitle>
                <div>
                  <Badge 
                    className={`px-4 py-1 text-sm font-medium ${getAgreementColor(
                      comparisonResult.summary.agreement_score
                    )}`}
                  >
                    Agreement Score: {comparisonResult.summary.agreement_score}%
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-base">
                Detailed comparison between original and AI-generated interview analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid grid-cols-3 p-0 h-16 w-full">
                  <TabsTrigger 
                    value="summary" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300 h-14"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Summary
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="detailed" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300 h-14"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Detailed Comparison
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="recommendations" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300 h-14"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Recommendations
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="p-6 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="font-medium text-xl mb-4 text-blue-800">Overall Comparison</h3>
                    <p className="text-gray-700 leading-relaxed">{comparisonResult.summary.overall_comparison}</p>
                    
                    <div className="mt-6">
                      <h4 className="font-medium text-lg mb-2 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Agreement Score: {comparisonResult.summary.agreement_score}%
                      </h4>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                        <div 
                          className={`${getAgreementColor(comparisonResult.summary.agreement_score)} h-3 rounded-full transition-all duration-1000`} 
                          style={{ width: `${comparisonResult.summary.agreement_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border-2 border-blue-100 shadow-md h-full">
                        <CardHeader className="bg-blue-50 pb-3">
                          <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            Key Similarities
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="space-y-2">
                            {comparisonResult.summary.key_similarities.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="border-2 border-purple-100 shadow-md h-full">
                        <CardHeader className="bg-purple-50 pb-3">
                          <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-purple-500" />
                            Key Differences
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="space-y-2">
                            {comparisonResult.summary.key_differences.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="h-4 w-4 rounded-full bg-purple-400 mt-1 flex-shrink-0"></div>
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </TabsContent>
                
                <TabsContent value="detailed" className="p-6">
                  <ScrollArea className="h-[600px] rounded-md pr-4">
                    <Accordion type="single" collapsible className="w-full">
                      {comparisonResult.detailed_comparison.map((category: any, index: number) => (
                        <AccordionItem 
                          key={index} 
                          value={`item-${index}`}
                          className="border-2 mb-4 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <AccordionTrigger className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:no-underline font-medium text-lg data-[state=open]:bg-blue-100">
                            {category.category}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pt-4 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-medium mb-2 text-blue-700 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Original Analysis
                                </h4>
                                <p className="text-gray-700">{category.original}</p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <h4 className="font-medium mb-2 text-purple-700 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  AI Analysis
                                </h4>
                                <p className="text-gray-700">{category.ai_generated}</p>
                              </div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                              <h4 className="font-medium mb-2 text-amber-700 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Comparison
                              </h4>
                              <p className="text-gray-700">{category.comparison}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="recommendations" className="p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100 shadow-sm mb-6">
                      <h3 className="font-medium text-xl mb-4 text-blue-800">AI Recommendations</h3>
                      <p className="text-gray-700 leading-relaxed">{comparisonResult.recommendations.overall}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="border-2 border-green-100 shadow-md">
                        <CardHeader className="bg-green-50 pb-3">
                          <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Strengths of Original Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="space-y-2">
                            {comparisonResult.recommendations.original_strengths.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2 border-blue-100 shadow-md">
                        <CardHeader className="bg-blue-50 pb-3">
                          <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            Strengths of AI Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="space-y-2">
                            {comparisonResult.recommendations.ai_strengths.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2 border-amber-100 shadow-md">
                        <CardHeader className="bg-amber-50 pb-3">
                          <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-amber-500" />
                            Improvement Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="space-y-2">
                            {comparisonResult.recommendations.improvement_suggestions.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Download Button */}
          {/* <Card className="border-2 shadow-lg mb-6">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Download className="h-6 w-6 text-blue-500" />
                Export Options
              </CardTitle>
              <CardDescription className="text-base">
                Download the analysis comparison report
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <Button
                  className={cn(
                    "flex items-center gap-2 text-base py-5 px-8",
                    "bg-gradient-to-r from-blue-600 to-purple-600",
                    "hover:from-blue-700 hover:to-purple-700",
                    "shadow-lg hover:shadow-xl transition-all duration-300"
                  )}
                >
                  <FileText className="h-5 w-5" />
                  Download PDF Report
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-base py-5 px-8 border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  <Download className="h-5 w-5" />
                  Download Raw Comparison Data
                </Button>
              </div>
            </CardContent>
          </Card> */}
          
          <Button
            onClick={() => {
              setComparisonResult(null);
              setOriginalFile(null);
              setAIFile(null);
              setError(null);
              setProgress(0);
            }}
            variant="outline"
            className={cn(
              "w-full text-lg py-6 border-2",
              "hover:bg-gray-50 transition-all duration-300"
            )}
          >
            Compare Another Set of Documents
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ComparePDF;
