# 📘 Changelog

## v1.0.0 — Initial Release
- Basic Chime client implemented
- Virtual background support added
- AWS Lambda backend created
- GitHub Pages deployment enabled

## v1.1.0 — Documentation Upgrade
- Added full README
- Added CONTRIBUTING.md
- Added LICENSE
- Added diagrams + logos

## v1.2.0 — SDK v3 Migration
- Migrated backend Lambda to AWS SDK v3 (@aws-sdk/client-chime-sdk-meetings)
- Updated frontend to Amazon Chime SDK JavaScript v3.20.0
- Complete rewrite of app.js for v3 API compatibility
- Added device selection handlers (camera/microphone switching)
- Fixed video tile management using addObserver() pattern
- SDK loaded via esm.sh CDN for browser ES module support
- Updated all documentation with v3 API examples

## v1.3.0 — Background Filters Implementation
- Implemented background blur using BackgroundBlurVideoFrameProcessor
- Implemented background replacement with custom image upload
- Added video transform device pipeline for filter application
- Background processor lifecycle management (create/destroy)
- Preserve background effects when switching cameras
- Proper cleanup on video stop and meeting leave
- User-friendly status messages for filter operations
- Runtime WASM/model loading from AWS CDN

## v1.3.1 — Code Refactoring & Optimization
- Refactored app.js with applyTransform() helper function for DRY code
- Added stopVideoWithCleanup() for centralized lifecycle management
- Cleaned up index.html SDK loading with better comments
- Removed unnecessary global exposures (filter classes accessed via ChimeSDK namespace)
- Updated .gitignore to exclude package files (SDK loaded via CDN)
- Added eu-west-1 region option

## v2.0.0 — Enhanced UI & Screen Sharing
- Modern glassmorphism UI design with improved visual aesthetics
- Circle button controls with emoji icons for better UX
- Screen sharing capability with start/stop controls
- Dedicated screen share tile display section
- Improved video grid layout with dual camera/remote view
- Enhanced device control row with better spacing
- Toolbar with centered control buttons
- Responsive card-based layout system

## v3.0.0 — Participants Roster & Real-time Presence
- Real-time participants list with join/leave tracking
- Live mute/unmute status indicators (🎤/🔇)
- Screen sharing presence indicator (🖥️)
- Attendee name extraction and display
- Volume indicator integration for remote mute detection
- Auto-updating roster UI with clean card design
- Roster observers using Chime SDK v3 realtime subscriptions
- Professional Zoom/Teams-style participant panel

## v3.1.0 — Background Filters with Local WASM Hosting
- Added local WASM files hosted in `public/background-filters/`
- Background blur and image replacement fully functional via GitHub Pages
- Custom Web Worker for background filter processing
- Segmentation models (regular and SIMD-optimized) included
- Eliminated dependency on external CDN for WASM files
- Improved reliability and performance of background filters
- No S3 bucket required for filter assets

## v3.0.0 — 🎯 STABLE RELEASE (November 28, 2025)
**ALL FEATURES WORKING** - Production-ready deployment
- ✅ **Background filters fully working** - Blur and image replacement on GitHub Pages
- ✅ **Fixed logger compatibility** - Resolved "this.logger.info is not a function" errors  
- ✅ **Official WASM assets** - Using Amazon's CDN for reliability
- ✅ **Proper ChimeSDK integration** - Correct API usage and parameter structure
- ✅ **ESM module support** - Modern JavaScript architecture
- ✅ **GitHub Pages deployment** - Live at https://georges034302.github.io/aws-chime-client
- 🔧 Fixed DefaultVideoTransformDevice logger parameter
- 🔧 Fixed background processor creation syntax
- 🔧 Resolved WASM loading in production environment
- ⚠️ Note: Background filters don't work in GitHub Codespaces (use GitHub Pages or local HTTPS)

## v4.0.0 — 🔐 PRODUCTION-READY ENTERPRISE AUTHENTICATION (November 28, 2025)
**COMPLETE AUTHENTICATION & BACKGROUND PROCESSING** - Enterprise-grade security with stable video features
- ✅ **AWS Cognito Integration** - Secure hosted UI authentication with user pool management
- ✅ **JWT Token Authorization** - API Gateway Cognito authorizer with automatic token handling
- ✅ **Professional Login Flow** - Seamless authentication UI with login/logout capabilities
- ✅ **Meeting Access Control** - Authentication required before joining meetings
- ✅ **Background Filters Fixed** - Stable WebAssembly background blur and image replacement
- ✅ **WASM CDN Integration** - Optimized loading from Amazon's official CDN infrastructure
- ✅ **Multi-Environment Support** - Works flawlessly in localhost, GitHub Codespaces, and production
- ✅ **Production Deployment** - Complete AWS SAM CloudFormation infrastructure automation
- ✅ **Enhanced Error Handling** - Graceful fallbacks and detailed error logging
- ✅ **Professional UI** - Polished dark theme with authentication status indicators

### Technical Improvements (v4.0)
- 🔧 **SAM Template Enhancement** - Added Cognito User Pool, App Client, Domain, and proper CORS
- 🔧 **Frontend Authentication** - Complete auth flow with token validation and storage
- 🔧 **API Security** - JWT authorizer protection for all meeting endpoints  
- 🔧 **Background Processing** - Fixed WASM paths using mixed CDN/local worker architecture
- 🔧 **Error Recovery** - Robust error handling for authentication and video processing failures
- 🔧 **Code Quality** - Clean separation of concerns with modular authentication and video handling

### Breaking Changes (v4.0)
- 🚨 **Authentication Required** - All meeting access now requires Cognito authentication
- 🚨 **API Changes** - Authorization header required for backend API calls
- 🚨 **WASM Paths Updated** - Background filters now use optimized CDN + local worker pattern

## v5.0.0 — Planned
- Background image presets gallery
- Connection quality indicators
- Recording capabilities
- Raise hand feature
- Active speaker highlighting
- Mic activity green outline (like Zoom)
- Chat panel
- Breakout room support
- Grid layout for all remote videos
- Host controls (mute participants, lock room, etc.)
