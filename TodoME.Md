Broadcasting transactions to https://api.testnet.hiro.so                                                                           
🟩  Publish STP472NMPYXCMRB4G75EM43PESZT33FZG7GBVK8E.Attendance  

id: 0
name: Testnet deployment
network: testnet
stacks-node: "https://api.testnet.hiro.so"
bitcoin-node: "http://blockstack:blockstacksystem@bitcoind.testnet.stacks.co:18332"
plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: Attendance
            expected-sender: STP472NMPYXCMRB4G75EM43PESZT33FZG7GBVK8E
            cost: 108630
            path: contracts/Attendance.clar
            anchor-block-only: true
            clarity-version: 3
      epoch: "3.2"


Total cost:     0.108630 STX
Duration:       1 blocks