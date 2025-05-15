# ChessAgine

An chess agent + engine that can understand given chess board fen and come up with possible explanations why the move is good/bad/equal

## Tools/Frameworks

- Stockfish API using Stockfish to under the hood for correct bestmove and future moves
- Custom board state logic that provides a bridge between engine and llm (the chessagine)
- Chess.js fen validation for correct I/O
- Mastra AI ts framework

## Setup

- `chessaginelambda` contains backend source code, you would need AWS account, AWS sam CLI, AWS CLI and OpenAI token to set up and deploy the agent 

than 
```
cd chessaginelambda/mastra

npm i

```
set the env variable in `template.yml`

```
Parameters:
  LLMProviderApikey:
    Type: String
    Description: LLM Provider API key
    Default: insert-api-key
```

- `chessagine-frontend` contains simple UI build with Next.js, React, react-chessboard, react-markdown, chess.js

would need to set api endpoint from deployed resources
```
NEXT_PUBLIC_API_URL
```

## Demo

- ![Demo Image](https://github.com/jalpp/chessagineai/blob/main/agineview1.png?raw=true)

