# TRON Transaction System

A robust implementation for executing and monitoring TRON blockchain transactions with full confirmation tracking.

**IMPORTANT: This project is designed for educational content purposes only. It serves as a learning resource for understanding TRON blockchain transactions.**

## Features

- Automated transaction processing
- 100% confirmation tracking
- Balance verification
- Multi-network support (Mainnet, Shasta, Nile)
- TronScan transaction monitoring
- Secure key management

## Prerequisites

- Node.js v18.0.0 or higher
- npm package manager
- TRON wallet with private key
- Test TRX for transactions (on testnet)

## Installation

1. Clone the repository

```bash
git clone https://github.com/llakterian/Tron_Tx_System-.git
cd tron-transaction
```

2. Install dependencies

```bash
npm install tronweb dotenv
```

3. Configure environment variables Create a .env file in the project root:

```bash
PRIVATE_KEY=your_tron_wallet_private_key
FROM_ADDRESS=origin_tron_address
RECIPIENT_ADDRESSES=recipient_tron_address1, recipient_tron_address2, recipient_tron_address3, 
TRX_AMOUNT=100
USDT_AMOUNT=10
NETWORK_URL=https://api.shasta.trongrid.io
TRON_API_KEY=your_tron_api_key
```

## Usage

4. Run the transaction script:

```bash
node sendTransaction.js
```

## Available networks in the system:

- MAINNET: https://api.trongrid.io
- SHASTA: https://api.shasta.trongrid.io (Testnet)
- NILE: https://nile.trongrid.io (Testnet)

## Features

- Transaction Monitoring
- Track transaction status in console output
- View transaction details on TronScan
- Monitor wallet balances through TronLink

## Security Notes

- Store private keys securely
- Use .env file for sensitive data
- Never commit private keys or .env files

## Development

- Get test TRON:

- Visit https://www.trongrid.io/faucet
- Connect wallet
- Request test TRX

## Monitor transactions:

- Use TronScan explorer
- Check wallet balances
- Verify confirmations

## License

MIT

## Author

llakterian

## Project Link

https://github.com/llakterian/FTkn_d

<javascript>
This README provides clear instructions for deployment, usage, and security considerations. Users can follow these steps to successfully implement the TRON transaction system.
</javascript>
