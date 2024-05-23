const Blockchain = require("./blockchain");

const bitcoin = new Blockchain();
const previousBlockHash = '09IASDJAOS9JD9JO9J021I3912OJEOJX'
const currentBlockData = [
    {
        amount: 10,
        sender: '0I9OAJSDKP0I',
        recipient: '0P0KP0JPJDC0J0'
    },
    {
        amount: 20,
        sender: '0I9OAJSDKP0I',
        recipient: '0P0KP0JPJDC0J0'
    },
    {
        amount: 30,
        sender: '0I9OAJSDKP0I',
        recipient: '0P0KP0JPJDC0J0'
    },
    {
        amount: 40,
        sender: '0I9OAJSDKP0I',
        recipient: '0P0KP0JPJDC0J0'
    },
]
console.log(Number(process.argv[2]));