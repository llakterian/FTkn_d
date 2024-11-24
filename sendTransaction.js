require('dotenv').config();
const TronWeb = require('tronweb');
require('dotenv').config();
const recipients = JSON.parse(process.env.RECEIVER_ADDRESSES);



const NETWORK = {
    MAINNET: 'https://api.trongrid.io',
    SHASTA: 'https://api.shasta.trongrid.io',
    NILE: 'https://nile.trongrid.io'
};


const CONTRACT_ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Configuration object
const config = {
    network: NETWORK.SHASTA,
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
    mintAmount: process.env.MINT_AMOUNT || '1000000000',
    confirmations: 27
};



function initializeTronWeb() {
    return new TronWeb({
        fullHost: config.network,
        privateKey: config.privateKey,
        headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY }
    });
}

async function verifyTransaction(tronWeb, txId) {
    const tx = await tronWeb.trx.getTransactionInfo(txId);
    return tx && tx.receipt && tx.receipt.result === 'SUCCESS';
}

async function waitForConfirmation(tronWeb, txId, blocks = config.confirmations) {
    console.log('Starting confirmation monitoring...');
    let confirmations = 0;
    let retries = 0;
    const maxRetries = 30;
    
    while (confirmations < blocks && retries < maxRetries) {
        try {
            const txInfo = await tronWeb.trx.getTransactionInfo(txId);
            
            if (txInfo && txInfo.blockNumber) {
                const currentBlock = await tronWeb.trx.getCurrentBlock();
                confirmations = currentBlock.block_header.raw_data.number - txInfo.blockNumber;
                console.log(`Confirmation Progress: ${confirmations}/${blocks} blocks`);
                
                if (txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
                    if (confirmations >= blocks) {
                        return true;
                    }
                }
            }
        } catch (error) {
            console.log('Waiting for block confirmation...');
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (retries >= maxRetries) {
        throw new Error('Transaction confirmation timeout');
    }
    
    return false;
}

async function mintTokens(tronWeb) {
    const contract = await tronWeb.contract(CONTRACT_ABI, config.contractAddress);
        console.log('Contract initialized successfully');
        console.log('Contract address:', config.contractAddress);
        
        if (!contract) {
            throw new Error('Contract initialization failed');
        }
    const results = [];
    for (const recipient of recipients) {
        try {
            console.log(`\nMinting tokens for ${recipient}`);
            console.log('Amount:', config.mintAmount);
            
            const transaction = await contract.mint(
                recipient,
                config.mintAmount
            ).send({
                feeLimit: 150000000,
                callValue: 0
            });

            console.log('Transaction submitted successfully');
            console.log('Transaction ID:', transaction);
            console.log(`TronScan URL: https://shasta.tronscan.org/#/transaction/${transaction}`);

            await waitForConfirmation(tronWeb, transaction);
            
            results.push({
                recipient,
                txId: transaction,
                status: 'SUCCESS'
            });
        } catch (error) {
            console.error(`Failed to mint for ${recipient}:`, error);  // Remove .message
            results.push({
                recipient,
                status: 'FAILED',
                error: error.toString()
            });
        }
        
    }
    
    return results;
}

async function sendTRX(tronWeb, recipient, amount) {
    try {
        const senderAddress = tronWeb.defaultAddress.base58;
        console.log('\nSending TRX:');
        console.log('From:', senderAddress);
        console.log('To:', recipient);
        console.log('Amount:', amount / 1000000, 'TRX');

        const transaction = await tronWeb.trx.sendTransaction(
            recipient,
            amount,
            {
                feeLimit: 150000000,
                shouldPollResponse: true,
                callValue: 0
            }
        );

        console.log('Transaction submitted successfully');
        console.log('Transaction ID:', transaction.txid);
        await waitForConfirmation(tronWeb, transaction.txid);
        
        return {
            success: true,
            txId: transaction.txid
        };
    } catch (error) {
        console.error('TRX Transfer Error:', error.message);
        throw error;
    }
}

async function main() {
    try {
        const tronWeb = initializeTronWeb();
        console.log('TronWeb initialized with network:', config.network);  // Add this line
        
        // Mint tokens for all recipients
        console.log('=== Starting Token Minting Process ===');
        const mintResults = await mintTokens(tronWeb);
        console.log('\nMinting Results:', JSON.stringify(mintResults, null, 2));

        // Perform TRX transfer if needed
        if (process.env.SEND_TRX === 'true') {
            console.log('\n=== Starting TRX Transfer Process ===');
            const trxResult = await sendTRX(
                tronWeb,
                process.env.RECEIVER_ADDRESS,
                process.env.AMOUNT || 1000000
            );
            console.log('TRX Transfer Result:', trxResult);
        }

        console.log('\nAll operations completed successfully');
    } catch (error) {
        console.error('Main Execution Error:', error.message || 'Contract interaction failed');  // Add this line
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    mintTokens,
    sendTRX,
    initializeTronWeb,
    waitForConfirmation,
    verifyTransaction
};
