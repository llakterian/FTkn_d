require('dotenv').config();
const TronWeb = require('tronweb');

const NETWORK = {
    MAINNET: 'https://api.trongrid.io',
    SHASTA: 'https://api.shasta.trongrid.io',
    NILE: 'https://nile.trongrid.io'
};

const config = {
    network: NETWORK.SHASTA,
    privateKey: process.env.PRIVATE_KEY,
    receiverAddress: process.env.RECEIVER_ADDRESS,
    amount: process.env.AMOUNT || 1000000,
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
            const tx = await tronWeb.trx.getTransaction(txId);
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

async function sendTransaction(tronWeb) {
    try {
        const senderAddress = tronWeb.defaultAddress.base58;
        const initialBalance = await tronWeb.trx.getBalance(senderAddress);
        
        console.log('Transaction Details:');
        console.log('Sender Address:', senderAddress);
        console.log('Initial Balance:', initialBalance / 1000000, 'TRX');
        console.log('Recipient Address:', config.receiverAddress);
        console.log('Amount:', config.amount / 1000000, 'TRX');

        // Send transaction with updated parameters
        const transaction = await tronWeb.trx.sendTransaction(
            config.receiverAddress,
            config.amount,
            {
                feeLimit: 150000000,
                shouldPollResponse: true,
                callValue: 0
            }
        );

        console.log('\nTransaction submitted successfully');
        console.log('Transaction ID:', transaction.txid);
        console.log('TronScan URL:', `https://shasta.tronscan.org/#/transaction/${transaction.txid}`);

        // Add delay before verification
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Enhanced transaction verification
        const txInfo = await tronWeb.trx.getTransactionInfo(transaction.txid);
        if (!txInfo || !txInfo.id) {
            console.log('Waiting for transaction confirmation...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        await waitForConfirmation(tronWeb, transaction.txid);
        
        const finalSenderBalance = await tronWeb.trx.getBalance(senderAddress);
        const finalRecipientBalance = await tronWeb.trx.getBalance(config.receiverAddress);
        
        return {
            success: true,
            txId: transaction.txid,
            confirmations: config.confirmations,
            finalizedStatus: true
        };
    } catch (error) {
        console.error('Transaction Error:', error.message);
        throw error;
    }
}

async function main() {
    try {
        const tronWeb = initializeTronWeb();
        const result = await sendTransaction(tronWeb);
        console.log('Transaction Execution Complete:', result);
    } catch (error) {
        console.error('Main Execution Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    sendTransaction,
    initializeTronWeb,
    waitForConfirmation,
    verifyTransaction
};
