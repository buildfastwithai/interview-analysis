# AI Interview Analysis Platform

A comprehensive Next.js application for AI-powered interview analysis, transcript generation, and skill assessment with support for multiple input methods and AI providers.

## 🚀 Features

### 🎯 Interview Analysis
- **Comprehensive AI Analysis**: Upload interview recordings for detailed AI-powered analysis
- **Skills Assessment**: Evaluate specific skills with confidence scores and evidence-based recommendations
- **Q&A Extraction**: Automatically extract and grade question-answer pairs with detailed feedback
- **Interview Insights**: Get detailed performance metrics, strengths, weaknesses, and hiring recommendations
- **PDF Reports**: Generate downloadable PDF reports with comprehensive analysis results
- **Multi-tab Results**: View results across Skills, Q&A, Insights, and Summary tabs

### 📝 Transcript Extraction
- **Multiple Input Methods**: Upload audio/video files or provide YouTube URLs
- **AI-Powered Transcription**: Using OpenAI Whisper for accurate audio-to-text conversion
- **YouTube URL Processing**: Real YouTube video download and transcription using ytdl-core
- **Large File Support**: Automatic chunking for files up to 100MB with parallel processing
- **Custom Formatting**: Use OpenAI GPT or Google Gemini to format transcripts with custom prompts
- **Multiple File Formats**: Support for MP3, WAV, M4A, MP4, AVI, MOV, WebM, MKV

### 🎨 Modern UI/UX
- **Responsive Design**: Built with Next.js 15, React 19, and TypeScript
- **Beautiful Components**: Radix UI components with Tailwind CSS styling
- **Real-time Progress**: Upload progress indicators and processing status
- **Toast Notifications**: User-friendly feedback with Sonner toast notifications
- **Tabbed Interface**: Clean separation between Interview Analysis and Transcript Extraction

## 🧪 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom components
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React for consistent iconography

### AI & Processing
- **Transcription**: OpenAI Whisper API for audio-to-text
- **Analysis**: OpenAI GPT-4 for comprehensive interview analysis
- **Alternative AI**: Google Gemini for transcript formatting
- **YouTube Processing**: ytdl-core for video download and extraction
- **File Processing**: FFmpeg for audio/video format conversion

### File Handling & Storage
- **Cloud Storage**: Digital Ocean Spaces integration
- **File Validation**: Comprehensive file type and size validation
- **Chunking**: Automatic file splitting for large uploads
- **Temporary Files**: Secure temporary file handling with cleanup

### Development Tools
- **Type Safety**: Full TypeScript implementation
- **Form Handling**: React Hook Form with Zod validation
- **PDF Generation**: jsPDF for downloadable reports
- **Development**: Turbopack for fast development builds

## 🧪 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root:

```bash
# AI API Keys (Required)
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Digital Ocean Spaces (Optional)
DIGITAL_OCEAN_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DIGITAL_OCEAN_SPACES_BUCKET_NAME=your-bucket-name
DIGITAL_OCEAN_SPACES_KEY=your-access-key
DIGITAL_OCEAN_SPACES_SECRET=your-secret-key

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 API Endpoints

### Core Analysis Endpoints
- `POST /api/analyze-interview` - Comprehensive interview analysis with skills assessment
- `POST /api/upload-audio` - Upload and transcribe audio files
- `POST /api/extract-transcript` - Extract transcript from YouTube URLs
- `GET /api/health` - Health check with API key validation

### File Management
- `POST /api/upload` - Upload files to Digital Ocean Spaces
- `GET /api/test-connection` - Test external service connections

## 📊 Analysis Features

### Skills Assessment
- **Confidence Scoring**: 0-100 confidence scores for each skill
- **Evidence-Based**: Specific examples from the interview
- **Recommendations**: Actionable improvement suggestions
- **Skill Levels**: Beginner, Intermediate, Advanced, Expert, Not Demonstrated

### Q&A Analysis
- **Automatic Extraction**: Identify question-answer pairs
- **Grading System**: Excellent, Good, Average, Below Average, Poor
- **Detailed Feedback**: Key points covered and areas for improvement
- **Score Tracking**: 0-100 numerical scores

### Interview Insights
- **Performance Metrics**: Overall score, communication, technical depth, problem-solving
- **Behavioral Analysis**: Speech patterns, engagement level, cultural fit
- **Hiring Recommendations**: Clear yes/no/maybe with reasoning
- **Next Steps**: Actionable follow-up recommendations

## 📁 File Support

### Audio Formats
- MP3, WAV, M4A, MPEG

### Video Formats  
- MP4, AVI, MOV, WebM, MKV, WMV

### YouTube Support
- Public YouTube videos
- Automatic video ID extraction
- Download and transcription in one step

### Size Limits
- **Maximum Size**: 100MB per file
- **Chunking**: Automatic splitting for large files
- **Processing**: Parallel processing of chunks

## 🎯 Usage Guide

### Interview Analysis
1. Navigate to the "Interview Analysis" tab
2. Upload an audio/video file (up to 100MB)
3. Enter skills to assess (comma-separated, max 20)
4. Set job role and company name
5. Click "Analyze Interview" and wait for processing
6. View results across multiple tabs:
   - **Skills**: Detailed skill assessments with confidence scores
   - **Q&A**: Extracted question-answer pairs with grades
   - **Insights**: Performance metrics and hiring recommendations
   - **Summary**: Executive summary with key findings
7. Download comprehensive PDF reports

### Transcript Extraction
1. Navigate to the "Transcript Extraction" tab
2. Choose AI provider (OpenAI or Gemini)
3. Customize the format prompt (optional)
4. **Option A**: Upload audio/video file
5. **Option B**: Enter YouTube URL
6. View both raw and formatted transcripts
7. Download or copy results

## 🔧 Advanced Features

### Large File Processing
- **Automatic Chunking**: Files >25MB are split into 24MB chunks
- **Parallel Processing**: Multiple chunks processed simultaneously
- **Transcript Combination**: Seamless merging of chunk results
- **Progress Tracking**: Real-time upload and processing status

### Error Handling
- **Comprehensive Validation**: File type, size, and format checking
- **Retry Logic**: Automatic retry with exponential backoff
- **User-Friendly Errors**: Specific error messages with troubleshooting
- **Graceful Degradation**: Fallback options for failed operations

### Performance Optimization
- **Streaming Uploads**: Efficient file upload with progress tracking
- **Caching**: Intelligent caching of processed results
- **Cleanup**: Automatic temporary file cleanup
- **Memory Management**: Efficient memory usage for large files

## 🚨 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Add `OPENAI_API_KEY=your-key` to `.env.local`
   - Restart the development server

2. **"File too large"**
   - Files up to 100MB are supported with automatic chunking
   - Very large files are split and processed in parts

3. **"YouTube URL not working"**
   - Ensure the video is public and not age-restricted
   - Try different YouTube URL formats
   - Use file upload as alternative

4. **"Network connection error"**
   - Check internet connection and API credits
   - Verify API keys are valid
   - Wait a moment and retry

### Performance Tips

- **Chunking**: Large files are automatically split for optimal processing
- **Retry Logic**: Failed requests automatically retry with backoff
- **Parallel Processing**: Multiple AI analysis tasks run simultaneously
- **Cleanup**: Temporary files are automatically cleaned up

## 📈 Development

### Scripts
```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Dependencies
- **Next.js 15**: Latest framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS 4**: Latest styling framework
- **Radix UI**: Accessible component primitives

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js, React, TypeScript, and modern web technologies**
