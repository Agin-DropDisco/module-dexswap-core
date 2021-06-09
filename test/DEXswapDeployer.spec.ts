import chai, { expect } from "chai";
import { Contract, utils } from "ethers";
import { AddressZero } from "ethers/constants";
import { BigNumber, bigNumberify, defaultAbiCoder } from "ethers/utils";
import { solidity, MockProvider, deployContract } from "ethereum-waffle";
import { getCreate2Address, expandTo18Decimals } from "./shared/utilities";
import { factoryFixture } from "./shared/fixtures";

import ERC20 from "../build/ERC20.json";
import WETH9 from "../build/WETH9.json";
import DEXswapDeployer from "../build/DEXswapDeployer.json";
import DEXswapFactory from "../build/DEXswapFactory.json";
import DEXswapPair from "../build/DEXswapPair.json";

chai.use(solidity);

describe("DEXswapDeployer", () => {
    const provider = new MockProvider({
        hardfork: "istanbul",
        mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
        gasLimit: 12000000
    });
    const [
        dexdao,
        tokenOwner,
        protocolFeeReceiver,
        other
    ] = provider.getWallets();
    const overrides = {
        gasLimit: 12000000
    };

    let dexSwapDeployer: Contract;
    let token0: Contract;
    let token1: Contract;
    let token2: Contract;
    const pairBytecode = "0x" + DEXswapPair.bytecode;

    it("Execute migration with intial pairs", async () => {
        // Deploy tokens 4 testing
        token0 = await deployContract(
            tokenOwner,
            ERC20,
            [expandTo18Decimals(20000)],
            overrides
        );
        token1 = await deployContract(
            tokenOwner,
            ERC20,
            [expandTo18Decimals(20000)],
            overrides
        );
        token2 = await deployContract(
            tokenOwner,
            ERC20,
            [expandTo18Decimals(20000)],
            overrides
        );
        const weth = await deployContract(tokenOwner, WETH9);
        // Deploy DEXswapDeployer
        dexSwapDeployer = await deployContract(
            dexdao,
            DEXswapDeployer,
            [
                protocolFeeReceiver.address,
                dexdao.address,
                weth.address,
                [token0.address, token0.address, token1.address],
                [token1.address, token2.address, token2.address],
                [10, 20, 30]
            ],
            overrides
        );
        expect(await dexSwapDeployer.state()).to.eq(0);

        // Dont allow other address to approve deployment by sending eth
        await expect(
            other.sendTransaction({
                to: dexSwapDeployer.address,
                gasPrice: 0,
                value: expandTo18Decimals(10000)
            })
        ).to.be.revertedWith("DEXswapDeployer: CALLER_NOT_FEE_TO_SETTER");

        // Dont allow deploy before being approved by sending ETH
        await expect(
            dexSwapDeployer.connect(other).deploy()
        ).to.be.revertedWith("DEXswapDeployer: WRONG_DEPLOYER_STATE");

        // Send transaction with value from dexdao to approve deployment
        await dexdao.sendTransaction({
            to: dexSwapDeployer.address,
            gasPrice: 0,
            value: expandTo18Decimals(10000)
        });
        expect(await dexSwapDeployer.state()).to.eq(1);

        // Dont allow sending more value
        await expect(
            dexdao.sendTransaction({
                to: dexSwapDeployer.address,
                gasPrice: 0,
                value: expandTo18Decimals(10000)
            })
        ).to.be.revertedWith("DEXswapDeployer: WRONG_DEPLOYER_STATE");
        await expect(
            other.sendTransaction({
                to: dexSwapDeployer.address,
                gasPrice: 0,
                value: expandTo18Decimals(10000)
            })
        ).to.be.revertedWith("DEXswapDeployer: WRONG_DEPLOYER_STATE");

        // Execute deployment transaction
        const deployTx = await dexSwapDeployer.connect(other).deploy();
        expect(await dexSwapDeployer.state()).to.eq(2);
        const deployTxReceipt = await provider.getTransactionReceipt(
            deployTx.hash
        );

        // Dont allow sending more value
        await expect(
            dexdao.sendTransaction({
                to: dexSwapDeployer.address,
                gasPrice: 0,
                value: expandTo18Decimals(10000)
            })
        ).to.be.revertedWith("DEXswapDeployer: WRONG_DEPLOYER_STATE");
        await expect(
            other.sendTransaction({
                to: dexSwapDeployer.address,
                gasPrice: 0,
                value: expandTo18Decimals(10000)
            })
        ).to.be.revertedWith("DEXswapDeployer: WRONG_DEPLOYER_STATE");

        // Dont allow running deployment again
        await expect(
            dexSwapDeployer.connect(other).deploy()
        ).to.be.revertedWith("DEXswapDeployer: WRONG_DEPLOYER_STATE");

        // Get addresses from events
        const pairFactoryAddress =
            deployTxReceipt.logs != undefined
                ? defaultAbiCoder.decode(
                      ["address"],
                      deployTxReceipt.logs[0].data
                  )[0]
                : null;
        const pair01Address =
            deployTxReceipt.logs != undefined
                ? defaultAbiCoder.decode(
                      ["address"],
                      deployTxReceipt.logs[2].data
                  )[0]
                : null;
        const pair02Address =
            deployTxReceipt.logs != undefined
                ? defaultAbiCoder.decode(
                      ["address"],
                      deployTxReceipt.logs[4].data
                  )[0]
                : null;
        const pair12Address =
            deployTxReceipt.logs != undefined
                ? defaultAbiCoder.decode(
                      ["address"],
                      deployTxReceipt.logs[6].data
                  )[0]
                : null;
        const feeReceiverAddress =
            deployTxReceipt.logs != undefined
                ? defaultAbiCoder.decode(
                      ["address"],
                      deployTxReceipt.logs[7].data
                  )[0]
                : null;
        const feeSetterAddress =
            deployTxReceipt.logs != undefined
                ? defaultAbiCoder.decode(
                      ["address"],
                      deployTxReceipt.logs[8].data
                  )[0]
                : null;

        // Instantiate contracts
        const pairFactory = new Contract(
            pairFactoryAddress,
            JSON.stringify(DEXswapFactory.abi),
            provider
        );
        const pair01 = new Contract(
            getCreate2Address(
                pairFactory.address,
                [token0.address, token1.address],
                pairBytecode
            ),
            JSON.stringify(DEXswapPair.abi),
            provider
        );
        const pair02 = new Contract(
            getCreate2Address(
                pairFactory.address,
                [token0.address, token2.address],
                pairBytecode
            ),
            JSON.stringify(DEXswapPair.abi),
            provider
        );
        const pair12 = new Contract(
            getCreate2Address(
                pairFactory.address,
                [token1.address, token2.address],
                pairBytecode
            ),
            JSON.stringify(DEXswapPair.abi),
            provider
        );

        // Conpare onchain information to offchain predicted information
        expect(await pairFactory.feeTo()).to.eq(feeReceiverAddress);
        expect(await pairFactory.feeToSetter()).to.eq(feeSetterAddress);
        expect(await pairFactory.protocolFeeDenominator()).to.eq(9);
        expect(await pairFactory.allPairsLength()).to.eq(3);

        expect(pair01.address).to.eq(pair01Address);
        expect(await pair01.swapFee()).to.eq(10);
        expect(await pair01.token0()).to.eq(token0.address);
        expect(await pair01.token1()).to.eq(token1.address);
        expect(await pair01.totalSupply()).to.eq(0);

        expect(pair02.address).to.eq(pair02Address);
        expect(await pair02.swapFee()).to.eq(20);
        expect(await pair02.token0()).to.eq(token0.address);
        expect(await pair02.token1()).to.eq(token2.address);
        expect(await pair02.totalSupply()).to.eq(0);

        expect(pair12.address).to.eq(pair12Address);
        expect(await pair12.swapFee()).to.eq(30);
        expect(await pair12.token0()).to.eq(token2.address);
        expect(await pair12.token1()).to.eq(token1.address);
        expect(await pair12.totalSupply()).to.eq(0);
    });
});
