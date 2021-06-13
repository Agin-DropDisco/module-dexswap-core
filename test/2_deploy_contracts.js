
const DexSwapDeployer = artifacts.require('DexSwapDeployer');
const DexSwapPair = artifacts.require('DexSwapPair');
const DexSwapFactory = artifacts.require('DexSwapFactory');
const DexSwapFeeReceiver = artifacts.require('DexSwapFeeReceiver');
const DexSwapFeeSetter = artifacts.require('DexSwapFeeSetter');
const DexERC20 = artifacts.require('DexERC20');
const WETH = artifacts.require("WETH");
const USDC = artifacts.require("USDC");
const WETH_RINKEBY = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
const WETH_MOONBASE = "";
const WETH_MUMBAI = "";
const owner = "0xBfBa42de8147de1B20731bD8150531c50cd10803";
const protocolFeeReceiver = "0xD8fd8829136Ffa50FAAf40014B23f5FB809EcD63";
const argValue = (arg, defaultValue) => process.argv.includes(arg) ? process.argv[process.argv.indexOf(arg) + 1] : defaultValue
const network = () => argValue('--network', 'local')

module.exports = async (deployer) => {

    const BN = web3.utils.toBN;
    const bnWithDecimals = (number, decimals) => BN(number).mul(BN(10).pow(BN(decimals)));
    const senderAccount = (await web3.eth.getAccounts())[0];

    let DexSwapFactoryInstance, DexSwapFeeReceiverInstance, DexSwapFeeSetterInstance, WETHInstance;
    // let DEXS_WETH, DALPHA_WETH, USDC_WETH, DEXS_USDC, DEXS_WDEV, TOGETHER;

    if (network() === 'rinkeby') {

        // await deployer.deploy(DexSwapPair);
        // const DexSwapPairInstance = await DexSwapPair.deployed();
        // console.log(`DexSwappair Address:`, DexSwapPairInstance.address);                
        // CONNECT TO  FACTORY AND ROUTER CONTRACTS
        console.log("deploying Factory");
        DexSwapFactoryInstance = await deployer.deploy(DexSwapFactory, senderAccount); //   [dexswap factory in Moonbase]
        console.log(`Address Factory:`, DexSwapFactoryInstance.address);


        console.log("deploying WETH");
        WETHInstance = await WETH.at(WETH_RINKEBY);
        console.log(`WETH RINKEBY`, WETHInstance.address);
        

        console.log("start deploying FeeReceiver");
        DexSwapFeeReceiverInstance = await deployer.deploy(DexSwapFeeReceiver, owner, DexSwapFactoryInstance.address, WETHInstance.address, owner, owner);

        console.log("start deploying FeeSetter");
        DexSwapFeeSetterInstance = await deployer.deploy(DexSwapFeeSetter, owner, DexSwapFactoryInstance.address);

        console.log("Setting correct fee receiver in factory");
        await DexSwapFactoryInstance.setFeeTo(DexSwapFeeReceiverInstance.address);
        console.log(`Fee Receiver Address:`, DexSwapFeeReceiverInstance.address);

        console.log("Setting correct fee setter in factory");
        await DexSwapFactoryInstance.setFeeToSetter(DexSwapFeeSetterInstance.address);
        console.log(`Fee Setter Address:`, DexSwapFeeSetterInstance.address);

        // console.log("Deploying router"); REMIX GO
            // periphery
    // console.log("Deploying router");
    // const routerContract = await new hre.web3.eth.Contract(routerAbi)
    //   .deploy({
    //     data: routerBytecode.toString("hex"),
    //     arguments: [factoryContract.options.address, nativeAssetWrapperAddress],
    //   })
    //   .send({ from: accountAddress });

        const tokensA = await deployer.deploy(DexERC20, bnWithDecimals(1000000, 18));
        const tokensB = await deployer.deploy(DexERC20, bnWithDecimals(1000000, 18));
        // const aTokenInstance = await aToken.deployed();
        // const bTokenInstance = await bToken.deployed();
        // console.log('init WETH');
        // WETHInstance = await WETH.at(WETH_ON_RINKEBY);
        // console.log(`WETH ADDRESS:`, WETHInstance.address);
        // console.log("Init Utility Contracts");
        // DexSwapFactoryInstance = await DexSwapFactory.at(FactoryRec);
        // DexSwapFeeReceiverInstance = await DexSwapFeeReceiver.at(FeereceiverRec);
        // DexSwapFeeSetterInstance = await DexSwapFeeSetter.at(FeesetterRec);

        console.log("init DexSwap Deployer");
        // const dexSwapDeployer = await deployer.deploy(DexSwapDeployer, protocolFeeReceiver, owner, WETH, [tokensA.address], [tokensB.address], [15]);
        const dexSwapDeployer = await deployer.deploy(DexSwapDeployer, protocolFeeReceiver, owner, WETH, [tokensA.address], [tokensB.address], [25]);

        console.log("start Sending 1 WEI ...");
        await dexSwapDeployer.send(1, {from: senderAccount, gas: 5000000});
        // await dexSwapDeployer.send(dexSwapDeployer.address, '0', bnWithDecimals(10000, 18));

        console.log("Sent deployment reimbursement");

        await dexSwapDeployer.deploy({from: senderAccount});
        console.log("Deployed dexSwap", dexSwapDeployer.address);
        console.log("Pair init code hash: ", await DexSwapFactoryInstance.INIT_CODE_PAIR_HASH());

        // // CREATE 3 POOLS - First Pool > Dexswap-Weth
        // DEXS_WETH =   await DexSwapPair.at((await DexSwapFactoryInstance.createPair(DexSwapInstance.address, WETHInstance.address)).logs[0].args.pair);
        // DEXS_WDEV =   await DexSwapPair.at((await DexSwapFactoryInstance.createPair(DexSwapInstance.address, WDEVInstance.address)).logs[0].args.pair);
        // DALPHA_WETH = await DexSwapPair.at((await DexSwapFactoryInstance.createPair(DexsAlphaInstance.address, WETHInstance.address)).logs[0].args.pair);
        // USDC_WETH =   await DexSwapPair.at((await DexSwapFactoryInstance.createPair(WETHInstance.address, USDCInstance.address)).logs[0].args.pair);
        // USDC_WDEV =   await DexSwapPair.at((await DexSwapFactoryInstance.createPair(WDEVInstance.address, USDCInstance.address)).logs[0].args.pair);
        // DEXS_USDC =   await DexSwapPair.at((await DexSwapFactoryInstance.createPair(DexSwapInstance.address, USDCInstance.address)).logs[0].args.pair);
        // TOGETHER =    await DexSwapPair.at((await DexSwapFactoryInstance.createPair(DexSwapInstance.address, DexsAlphaInstance.address)).logs[0].args.pair);
            

    } else if (network() === 'matic') {

        // const hnyToken = await deployer.deploy(DexERC20, bnWithDecimals(1000000, 18))
        // const hsfToken = await deployer.deploy(DexERC20, bnWithDecimals(1000000, 18))

        const dxSwapFactory = await deployer.deploy(DexSwapFactory, WETH_ON_RINKEBY)
        console.log("Pair init code hash: ", await dxSwapFactory.INIT_CODE_PAIR_HASH())
    } 

}