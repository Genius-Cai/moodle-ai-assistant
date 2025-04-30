# Moodle AI Assistant

An AI-powered assistant that fetches course content from UNSW's Moodle platform and answers questions using either direct matches or AI-generated responses.

## Features

- Fetch course announcements, Q&A content, and assessment guides from Moodle
- Integrate with additional learning platforms (EdStem, Ally)
- Store and index data in a local SQLite knowledge base
- Answer questions using direct keyword matching or AI-powered summaries
- Support for multiple languages in question answering
- CLI interface for easy interaction

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Copy configuration templates to create your config files:
```bash
cp .env.example .env
cp src/config/auth.json.template src/config/auth.json
```
4. Edit `.env` and add:
   - `MOODLE_TOKEN`: Your Moodle API token
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `COURSE_IDS`: Comma-separated list of course IDs you want to monitor

## How to Get Your Moodle Token

1. Log in to your Moodle account
2. Go to your profile settings
3. Navigate to Security tokens/API keys
4. Generate a new token for external services
5. Copy the token value to your configuration file

## Usage

### Fetch course content:
```bash
npm run fetch -- -c <courseId>
```

### Ask a question:
```bash
npm run ask -- "What is the midterm about?"
```

### Run automatic content updates:
```bash
npm run update
```

## Development

- `npm run build`: Build the TypeScript project
- `npm run dev`: Run in development mode with hot reload
- `npm run lint`: Run ESLint for code quality
- `npm run test`: Run tests
- `npm start`: Run the CLI tool

## Project Structure

- `src/fetchers/`: API integration with Moodle and other learning platforms
  - `moodleApiFetcher.ts`: Main Moodle API integration
  - `allyFetcher.ts`: Integration with Ally for accessibility resources
  - `edstemFetcher.ts`: Integration with EdStem discussion forums
  - `cseFetcher.ts`: Custom fetcher for CSE-specific resources
- `src/knowledge/`: Knowledge base management
  - `db.ts`: Database connection and setup
  - `schema.sql`: Database schema definition
  - `insert.ts`: Data insertion logic
  - `query.ts`: Knowledge retrieval functions
  - `builder.ts`: Knowledge base construction utilities
- `src/ai/`: AI-powered answer generation
  - `openaiClient.ts`: OpenAI API integration
  - `promptTemplates.ts`: Templates for AI prompting
  - `answer.ts`: Answer generation logic
- `src/cli/`: Command-line interface
- `src/config/`: Configuration management
- `src/utils/`: Utility functions

## Development Roadmap

### Phase 1: Core Functionality
- Configuration and database setup
- Moodle API integration
- Knowledge base storage and indexing

### Phase 2: AI Question Answering
- Keyword-based knowledge retrieval
- OpenAI integration
- Answer generation with source citations

### Phase 3: User Interface
- Command line tool development
- Interactive question-answer flow
- Documentation for end users

### Phase 4: Enhanced Features
- Multi-platform integrations (EdStem, Ally)
- Automated content updates
- Multi-language support
- Custom prompt templates

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT

## Acknowledgments

- UNSW Moodle API
- OpenAI for providing the GPT API
- Contributors and testers