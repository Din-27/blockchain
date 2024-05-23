const Blockchain = require("./blockchain");
const { v4: uuid } = require('uuid')
const express = require('express')
const cors = require('cors');
const { default: axios } = require("axios");
const app = express()

const port = Number(process.argv[2]) || 3000
const nodeAddress = uuid().split('-').join().replace(/\,/gm, '')
const blockchain = new Blockchain()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/blockchain', (req, res) => res.send(blockchain))

app.post('/transaction', (req, res) => {
    const newTransaction = req.body
    const blockIndex = blockchain.addTransactionTopendingTransactions(newTransaction)
    res.send({ note: `Transaction will be added in block ${blockIndex}.` })
})

app.post('/transaction/broadcast', (req, res) => {
    const { amount, sender, recipient } = req.body
    const newTransaction = blockchain.createNewTransaction(amount, sender, recipient)
    blockchain.addTransactionTopendingTransactions(newTransaction)

    const requestPromises = []
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/transaction',
            data: newTransaction
        }
        axios.post(requestOptions.url, requestOptions.data)
            .then((data) => {
                if (data.status === 200) {
                    requestPromises.push(requestOptions)
                }
            })
    })
    res.send({ note: `Transaction created and broadcast successfully.` })
})

app.get('/mine', (req, res) => {
    const lastBlock = blockchain.getLastBlock()
    const previousBlockHash = lastBlock['hash']
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: lastBlock['index'] + 1
    }
    const nonce = blockchain.proofOfWork(previousBlockHash, currentBlockData)
    const blockHash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce)

    blockchain.createNewTransaction(12.5, "00", nodeAddress)

    const newBlock = blockchain.createNewBlock(nonce, previousBlockHash, blockHash)

    const requestPromises = []
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/receive-new-block',
            data: { newBlock }
        }
        axios.post(requestOptions.url, requestOptions.data)
            .then(data => {
                if (data.status === 200) {
                    requestPromises.push(requestOptions)
                }
            })
    })

    const requestOptions = {
        url: blockchain.currentNodeUrl + '/transaction/broadcast',
        data: {
            amount: 12.5,
            sender: '00',
            recipient: nodeAddress
        }
    }

    axios.post(requestOptions.url, requestOptions.data)
        .then(data => {
            res.send({
                note: `New block mined successfully`,
                block: newBlock
            })
        })

})

app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body
    const lastBlock = blockchain.getLastBlock()
    const correctHash = lastBlock.hash === newBlock.previousBlockHash
    const correctIndex = lastBlock['index'] + 1 === newBlock['index']

    if (correctHash && correctIndex) {
        blockchain.chain.push(newBlock)
        blockchain.pendingTransaction = []
        return res.send({
            note: `New block receive and accepted`,
            newBlock
        })
    }
    return res.send({
        note: `New block rejected`,
        newBlock
    })
})

app.post('/register-and-broadcast-node', (req, res) => {
    const { newNodeUrl } = req.body
    if (blockchain.networkNodes.indexOf(newNodeUrl) === -1) {
        blockchain.networkNodes.push(newNodeUrl)
    }
    const regNodesPromises = []
    for (const networkNodeUrl of blockchain.networkNodes) {
        const requestOptions = {
            url: networkNodeUrl + '/register-node',
            data: { newNodeUrl },
        }
        axios.post(requestOptions.url, requestOptions.data)
            .then((data) => {
                if (data.status === 200) {
                    regNodesPromises.push(requestOptions)
                }
            })
    }
    const bulkRegisterOptions = {
        url: newNodeUrl + '/register-nodes-bulk',
        data: { allNetwork: [...blockchain.networkNodes, blockchain.currentNodeUrl] },
    }
    axios.post(bulkRegisterOptions.url, bulkRegisterOptions.data)
        .then((data) => {
            return res.send({ note: `New node registered with network successfully.` })
        })
})

app.post('/register-node', (req, res) => {
    const { newNodeUrl } = req.body
    const nodeNotAlreadyPresent = blockchain.networkNodes.indexOf(newNodeUrl) === -1
    const notCurrentNode = blockchain.currentNodeUrl !== newNodeUrl
    if (nodeNotAlreadyPresent && notCurrentNode) {
        blockchain.networkNodes.push(newNodeUrl)
    }
    res.send({ note: `New node register successfully with node.` })
})

app.post('/register-nodes-bulk', (req, res) => {
    const { allNetwork } = req.body
    allNetwork.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = blockchain.networkNodes.indexOf(networkNodeUrl) === -1
        const notCurrentNode = blockchain.currentNodeUrl !== networkNodeUrl
        console.log(nodeNotAlreadyPresent && notCurrentNode, nodeNotAlreadyPresent, notCurrentNode);
        if (nodeNotAlreadyPresent && notCurrentNode) {
            blockchain.networkNodes.push(networkNodeUrl)
        }
    })
    res.send({ note: `Bulk registration successful.` })
})

app.listen(port, () => console.log(`running on port ${port}`))