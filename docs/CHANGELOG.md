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

## v1.4.0 — Planned
- UI enhancements
- Background image presets gallery
- Connection quality indicators
