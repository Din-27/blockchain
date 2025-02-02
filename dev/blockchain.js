const sha256 = require('sha256')
const { v4: uuid } = require('uuid')
const transactionId = uuid().split('-').join().replace(/\,/gm, '')

const currentNodeUrl = process.argv[3] || `http://localhost:${process.argv[2]}`

function Blockchain() {
    this.chain = []
    this.pendingTransaction = []

    this.currentNodeUrl = currentNodeUrl
    this.networkNodes = []

    this.createNewBlock(100, '0', '0')
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamps: Date.now(),
        transactions: this.pendingTransaction,
        nonce,
        hash,
        previousBlockHash
    }
    this.pendingTransaction = [];
    this.chain.push(newBlock)
    return newBlock
}
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1]
}
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    const newTransaction = {
        amount,
        sender,
        recipient,
        transactionId
    }

    return newTransaction
}
Blockchain.prototype.addTransactionTopendingTransactions = function (transactionObj) {
    this.pendingTransaction.push(transactionObj)
    return this.getLastBlock()['index'] + 1
}
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData)
    const hash = sha256(dataAsString)
    return hash
}
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
    while (hash.substring(0, 4) !== '0000') {
        nonce++
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
    }
    return nonce
}

module.exports = Blockchain