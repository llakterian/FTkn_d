require('dotenv').config();
const TronWeb = require('tronweb');

// Network configuration
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
    confirmations: 19 // TRON requires 19 block confirmations for 100% finality
};

function initializeTronWeb() {
    return new TronWeb({
        fullHost: config.network,
        privateKey: config.privateKey
    });
}

async function waitForConfirmation(tronWeb, txId, blocks = config.confirmations) {
    let confirmations = 0;
    while (confirmations < blocks) {
        const tx = await tronWeb.trx.getTransaction(txId);
        if (tx.ret && tx.ret[0].contractRet === 'SUCCESS') {
            const currentBlock = await tronWeb.trx.getCurrentBlock();
            confirmations = currentBlock.block_header.raw_data.number - tx.blockNumber;
            console.log(`Confirmations: ${confirmations}/${blocks}`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3 seconds
    }
    return true;
}

async function sendTransaction(tronWeb) {
    try {
        const senderAddress = tronWeb.defaultAddress.base58;
        const balance = await tronWeb.trx.getBalance(senderAddress);
        
        console.log('Sender Address:', senderAddress);
        console.log('Current Balance:', balance / 1000000, 'TRX');

        // Send transaction with higher fee limit for faster processing
        const transaction = await tronWeb.trx.sendTransaction(
            config.receiverAddress,
            config.amount,
            {
                feeLimit: 100000000,
                shouldPollResponse: true
            }
        );

        console.log('Transaction submitted:', transaction.txid);
        console.log('Waiting for confirmations...');

        // Wait for full confirmation
        await waitForConfirmation(tronWeb, transaction.txid);
        
        console.log('Transaction fully confirmed!');
        console.log('TronScan URL:', `https://tronscan.org/#/transaction/${transaction.txid}`);
        
        // Verify final balance
        const recipientBalance = await tronWeb.trx.getBalance(config.receiverAddress);
        console.log('Recipient final balance:', recipientBalance / 1000000, 'TRX');

        return transaction;
    } catch (error) {
        console.error('Transaction failed:', error.message);
        throw error;
    }
}

async function main() {
    try {
        const tronWeb = initializeTronWeb();
        await sendTransaction(tronWeb);
    } catch (error) {
        console.error('Error in main execution:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    sendTransaction,
    initializeTronWeb,
    waitForConfirmation
};
