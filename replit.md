# Overview

IdanBot is a WhatsApp chatbot built using the Baileys library for WhatsApp Web API integration. The bot provides AI-powered conversations, media processing capabilities, utility functions, and anonymous messaging features. It uses OpenRouter API for AI functionality and includes features like sticker creation, media enhancement, QR code generation, prayer times, weather information, and Wikipedia summaries.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Bot Framework
- **WhatsApp Integration**: Uses Baileys library for WhatsApp Web API connectivity with QR code authentication
- **Session Management**: Persistent authentication state stored in `baileys_auth_info` directory
- **Message Routing**: Centralized message handling through `pengelola/pesan.js` with command pattern implementation
- **Web Server**: Express.js server running on port 5000 for health checks and monitoring

## AI System Architecture
- **Multi-Model Strategy**: Three-tier AI model system using OpenRouter API
  - Router Model: `z-ai/glm-4.5-air:free` for intent classification
  - Casual Model: `moonshotai/kimi-k2:free` for general conversations
  - Critical Model: `qwen/qwen3-coder:free` for complex reasoning tasks
- **Context Management**: Per-chat conversation history with 10-message sliding window
- **Prompt Engineering**: System prompt defining bot personality and capabilities

## Media Processing Pipeline
- **Multi-Format Support**: Image and video processing with format conversion
- **External Tools Integration**: FFmpeg for media manipulation and RealESRGAN for image upscaling
- **Temporary File Management**: Dedicated temp directory for processing with automatic cleanup
- **Canvas Integration**: Node.js Canvas API for image generation and manipulation

## Feature Modules
- **Utility Services**: Calculator, QR code generator, prayer times, weather data, Wikipedia integration
- **Anonymous Messaging**: Peer-to-peer anonymous chat system with session management
- **Media Tools**: Sticker creation, audio/video downloading, media enhancement

## Data Storage
- **JSON-based Database**: Simple file-based storage for anonymous messaging sessions (`database/fessagedb.json`)
- **Configuration Management**: Environment-based config with dotenv for API keys and settings

## Security and Error Handling
- **Input Validation**: Command parsing with argument validation
- **Error Recovery**: Automatic reconnection logic for WhatsApp connection failures
- **Rate Limiting**: Built-in message processing controls to prevent spam

# External Dependencies

## Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API client library
- **express**: Web server framework for health monitoring
- **pino**: Logging framework with configurable log levels
- **qrcode-terminal**: QR code generation for authentication

## AI and API Services
- **OpenRouter API**: Multi-model AI service provider requiring API key
- **OpenWeatherMap API**: Weather information service requiring API key
- **Aladhan API**: Islamic prayer times service (no key required)

## Media Processing Tools
- **FFmpeg**: External binary for video/audio processing and conversion
- **RealESRGAN**: AI-powered image upscaling tool
- **canvas**: Node.js Canvas API for image manipulation
- **qrcode**: QR code generation library

## Utility Libraries
- **axios**: HTTP client for API requests
- **mathjs**: Mathematical expression evaluation
- **wikijs**: Wikipedia API client
- **cheerio**: HTML parsing for web scraping
- **dotenv**: Environment variable management

## File System Dependencies
- **fs**: Native file system operations for temp file management
- **path**: Cross-platform path utilities
- **child_process**: External process execution for media tools