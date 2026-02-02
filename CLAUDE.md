# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UPCE (Universal Persona-Driven Content Engine) is an AI-powered content generation system that creates marketing content based on user persona descriptions. The project has both a Node.js CLI backend and a Next.js web frontend.

## Key Files

### Core Scripts
- **upce.js** - Complete version with full API integration
- **upce-quick.js** - Quick test version with DeepSeek API only  
- **upce-demo.js** - Demo version with no API dependencies
- **prompts.js** - Centralized prompt templates (⭐ **IMPORTANT**)

### Configuration Files
- **prompts.js** - All AI prompts and system messages
- **AliyunImageGenerator.js** - Image generation handler
- **FileExporter.js** - Output file management
- **Logger.js** - Logging system

## Architecture

### Core Components
- **CLI Scripts**: `upce.js`, `upce-demo.js`, `upce-quick.js` - Main content generation engines
- **Web Frontend**: Next.js application with static export capability
- **Content Engine**: `/src/utils/ContentEngine.js` - Core content processing logic
- **Image Generation**: `AliyunImageGenerator.js` - Handles AI image generation with retry logic
- **File Export**: `FileExporter.js` - Manages structured output creation and ZIP packaging
- **Logging**: `Logger.js` - Centralized logging with file and console output

### Data Flow
1. User provides persona description via CLI or web interface
2. System analyzes persona using AI (DeepSeek API)
3. Generates titles, articles, and image prompts based on analysis
4. Creates structured output in `upce_output/` with platform-specific adaptations
5. Web interface provides real-time progress feedback via API routes

### Script Variants
- **upce-demo.js**: No API dependencies, uses template data for immediate testing
- **upce-quick.js**: DeepSeek API only, faster execution with reduced features
- **upce.js**: Full API integration including image generation, comprehensive output

## Development Commands

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Export static files
npm run export
```

### CLI Usage
```bash
# Demo version (no API required)
node upce-demo.js "persona description"

# Quick version (DeepSeek API only)
node upce-quick.js "persona description"

# Full version (all APIs)
node upce.js "persona description"

# Test image generation
./test-images.sh
node test-image-api.js --quick
```

### Testing
```bash
# Test image API configuration
node test-image-api.js

# Quick API test with minimal output
node test-image-api.js --quick

# Run comprehensive image generation test
./test-images.sh

# View generated output interactively
node view-output.js
```

## Configuration

### API Keys
- **DeepSeek API**: Set via environment variable `DEEPSEEK_API_KEY` or modify directly in scripts
- **Aliyun DashScope**: Set via environment variable `DASHSCOPE_API_KEY` or modify directly in scripts

## Prompt Management

### Centralized Prompts File: `prompts.js`

This file contains all AI prompts used by the system:

#### Main Prompts
- `roleAnalysis(roleDescription)` - Deep persona analysis
- `titleGeneration(roleDescription, analysis)` - Article title generation  
- `articleGeneration(title, roleDescription, analysis)` - Full article creation
- `roleAnalysisSystem` - System message for persona analysis
- `titleGenerationSystem` - System message for title creation
- `articleGenerationSystem` - System message for article writing

#### Quick Version Prompts
- `prompts.quick.roleAnalysis()` - Simplified persona analysis
- `prompts.quick.titleGeneration()` - Quick title generation
- `prompts.quick.articleGeneration()` - Quick article creation

#### Demo Templates
- `prompts.demo.sampleTitles` - Pre-defined title examples

### Modifying Prompts
To customize content generation:
1. Edit `/prompts.js` directly
2. Modify prompt templates as needed
3. Test with `node upce-demo.js "test description"`
4. No restart required - changes take effect immediately

### DeepSeek API
- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **Model**: `deepseek-chat`
- **Usage**: Text generation for persona analysis, titles, and articles

### Aliyun DashScope API  
- **Endpoint**: `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
- **Model**: `qwen-image-max`
- **Usage**: AI image generation from text prompts
- **Image Size**: `1664*928` (optimized for social media)

### API Error Handling
- Both APIs have retry mechanisms (3 attempts by default)
- Fallback to placeholder content if APIs fail
- Comprehensive error logging and reporting

### Content Generation Settings
Located in script constructors:
```javascript
this.config = {
  titleCount: 100,        // Number of titles to generate
  articleCount: 3,        // Number of articles to generate
  maxRetries: 3,          // API retry attempts
  imageCount: 4           // Images per article
};
```

## File Structure

### Output Structure
```
upce_output/role_xxxxxxxx/
├── README.md                   # Usage instructions
├── analysis_report.md          # Persona analysis
├── complete_report.md          # Full project report
├── titles.txt                  # Generated titles
├── articles/                   # Generated articles
├── images/                     # Image metadata
└── publish_ready/              # Platform-optimized content
    ├── xiaohongshu/           # Xiaohongshu format
    ├── weixin/                # WeChat format
    └── douyin/                # Douyin format
```

### Frontend Structure
- `/pages` - Next.js pages and API routes (`/api/generate.js` for content generation)
- `/styles` - Global CSS and Tailwind configuration with custom design system
- `/public` - Static assets including favicon and index.html for GitHub Pages
- `/src/utils` - Shared utility functions (`ContentEngine.js`, `ImageGenerator.js`)
- `/out` - Generated static build output (created by `npm run export`)

## Deployment

### Vercel Configuration
- Uses minimal `vercel.json` configuration (version 2)
- Static export enabled via `next.config.js` with `output: 'export'`
- Production builds use GitHub Pages compatible `basePath: '/universal-persona-content-engine'`
- Images are unoptimized for static export compatibility

### Build Process
1. `npm run build` creates optimized production build
2. `npm run export` generates static files to `/out` directory  
3. Vercel automatically deploys from repository
4. Static files work without server-side rendering

### Environment-Specific Configuration
- Development: No basePath, standard Next.js dev server
- Production: Uses basePath and assetPrefix for GitHub Pages compatibility
- All images set to `unoptimized: true` for static hosting

## Key Features

### Content Generation
- Persona analysis using AI prompts
- Batch title and article generation
- Multi-platform content adaptation
- Duplicate content detection
- Image prompt generation

### Web Interface
- Real-time progress tracking
- Dark/light theme support
- Responsive design with Tailwind CSS
- Framer Motion animations
- Form validation and error handling

## Development Notes

### Styling Approach
- Uses Tailwind CSS with custom design system
- Apple-inspired aesthetic with glassmorphism effects
- Custom color palette and typography
- Dark mode support via CSS classes

### State Management
- React hooks for local state
- No external state management library
- LocalStorage for theme persistence

### API Integration
- Axios for HTTP requests with comprehensive error handling
- Retry logic with exponential backoff for API failures
- Progress tracking for long operations via WebSocket-like polling
- Mock data for development/demo modes with realistic content templates
- Environment variable support for API keys with fallback to hardcoded values

## Important Development Notes

### Content Generation Pipeline
The system uses a three-stage pipeline:
1. **Analysis Stage**: Deep persona analysis using AI prompts from `prompts.js`
2. **Generation Stage**: Batch creation of titles and articles with duplicate detection
3. **Export Stage**: Multi-platform content adaptation and file packaging

### Error Handling Strategy
- All API calls have 3-retry mechanism with exponential backoff
- Graceful degradation: falls back to template content if APIs fail
- Comprehensive logging to both console and `generation.log` files
- Progress tracking prevents hanging operations

### File Organization
- Each generation creates a unique role directory with 8-character hash
- Complete self-contained packages with README and usage instructions
- Platform-specific adaptations in `publish_ready/` subdirectories
- Image metadata stored as `.info.json` files for batch processing