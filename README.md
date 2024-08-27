# CrosMiint - NFT Platform Backend

This repository contains the backend server for the CrosMiint NFT platform, which provides API services and smart contract interactions for a multi-chain NFT marketplace.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-Chain Support**: Facilitates interaction with various blockchain networks.
- **Smart Contract Integration**: Supports Solidity-based smart contracts for NFT transactions.
- **RESTful API**: Provides RESTful API endpoints for front-end integration.
- **MongoDB Database**: Utilizes MongoDB for storing user data, NFTs, and transaction history.
- **Security**: Implements security best practices including data validation, error handling, and JWT authentication.

## Technologies

This project is built with the following technologies:

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Solidity](https://soliditylang.org/)
- [Hardhat](https://hardhat.org/)
- [JWT (JSON Web Tokens)](https://jwt.io/)
- [Wagmi](https://wagmi.sh/)

## Architecture

The backend is designed with a modular structure to ensure scalability and maintainability:

- **Controllers**: Handle incoming HTTP requests and return responses.
- **Services**: Contain business logic and interact with external APIs and databases.
- **Models**: Define the MongoDB schemas using Mongoose.
- **Routes**: Define application routes and map them to controllers.
- **Middlewares**: Handle authentication, logging, and error handling.
- **Config**: Stores configuration files for environment variables and other settings.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Yarn](https://yarnpkg.com/) (or npm)
- [MongoDB](https://www.mongodb.com/)

### Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/Kisthanny/CrosMiint-Backend.git
    cd crosmiint-backend
    ```

2. **Install dependencies**:

    ```bash
    yarn install
    ```

### Environment Variables

Create a `.env` file in the root directory and configure the following environment variables:

```env
NODE_ENV=development
FRONTEND_HOST=http://localhost:3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
SIGN_MESSAGE=sign in to CrosMiint
PRIVATE_DEMO=your_wallet_private_key
RPC_URL_SEPOLIA=your_alchemy_endpoint_url
RPC_URL_SHIBUYA=https://evm.shibuya.astar.network
RPC_URL_AMOY=your_alchemy_endpoint_url
RPC_URL_SEPOLIA_WS=your_alchemy_endpoint_url
PINATA_API=your_pinata_api
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### API Endpoints

Here are some of the main API endpoints:

- **GET** `/api/collection/getCollections`: Fetch a list of Collections.
- **POST** `/api/users/login`: Authenticate user and return a JWT token.

_For a full list of endpoints, see the [API documentation](docs/API.md)._

## Scripts

- `yarn start:dev`: Runs the app in development mode with hot reloading.
- `yarn typechain`: Generate Typechain for Contracts.
- `yarn start`: Starts the production server.
- `yarn test`: Runs the test suite using a testing framework like Jest.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.