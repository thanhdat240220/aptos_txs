import {Aptos, Network, AptosConfig, Account, Ed25519PrivateKey, SimpleTransaction} from '@aptos-labs/ts-sdk';


// edit here
const PRIVATE_KEY = 'xxx';
const TOTAL_TX = 10000;

const GAS_UNIT_PRICE = 100;
const MAX_GAS_LIMIT = 1515; //Max Gas Limit

const APTOS_ADDRESS = '0x1::aptos_coin::AptosCoin';
const L0_USDC_ADDRESS = '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC';
////////////

const aptosConfig = new AptosConfig({network: Network.MAINNET});
const aptos = new Aptos(aptosConfig);

let swapToAptos = false;
const aptAmount = 10 ** 8 * 0.01;
const usdcAmount = 10 ** 8 * 0.0009016;

const usdcAmount2 = 10 ** 8 * 0.0009016;
const aptAmount2 = 10 ** 8 * 0.009678;

function reStoreAccount(_privateKey: string) {
    const privateKey = new Ed25519PrivateKey(_privateKey);
    const account = Account.fromPrivateKey({privateKey});
    return account;
}

async function main() {
    for (let count = 0; count <= TOTAL_TX; count++) {
        const myAccount = reStoreAccount(PRIVATE_KEY);

        const pair = swapToAptos ? [L0_USDC_ADDRESS, APTOS_ADDRESS] : [APTOS_ADDRESS, L0_USDC_ADDRESS];
        const arguments_ = swapToAptos ? [usdcAmount2, Math.floor(aptAmount2),] : [aptAmount, usdcAmount];

        const transaction = count % 2 === 0 ? await getPontemTransaction(myAccount, pair, arguments_) : await getPancakeTransaction(myAccount, pair, arguments_);
        // const transaction = await getPancakeTransaction(myAccount, pair, arguments_) ;

        const sendTx = aptos.transaction.signAndSubmitTransaction({
            signer: myAccount,
            transaction: transaction,
        });

        console.log(`${count}. https://explorer.aptoslabs.com/txn/${(await sendTx).hash}`);
        const response = await aptos.waitForTransaction({
            transactionHash: (await sendTx).hash,
        });

        swapToAptos = !swapToAptos;
        await sleep(200);
    }

}

async function getPontemTransaction(myAccount: Account, pair: Array<string>, arguments_: Array<any>): Promise<SimpleTransaction> {
    const pontemSwapFunc = '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap';

    const transaction = await aptos.transaction.build.simple({
        sender: myAccount.accountAddress,
        data: {
            function: pontemSwapFunc,
            typeArguments: [
                ...pair,
                '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
            ],
            functionArguments: [
                ...arguments_
            ],
        },
        options: {
            maxGasAmount: MAX_GAS_LIMIT,
            gasUnitPrice: GAS_UNIT_PRICE,
        },
    });

    return transaction;
}

async function getPancakeTransaction(myAccount: Account, pair: Array<string>, arguments_: Array<any>): Promise<SimpleTransaction> {
    const pancakeSwapFunc = '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::router::swap_exact_input';

    const transaction = await aptos.transaction.build.simple({
        sender: myAccount.accountAddress,
        data: {
            function: pancakeSwapFunc,
            typeArguments: [
                ...pair
            ],
            functionArguments: [
                ...arguments_
            ],
        },
        options: {
            maxGasAmount: MAX_GAS_LIMIT,
            gasUnitPrice: GAS_UNIT_PRICE,
        },
    });

    return transaction;
}

const sleep = function (time: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {resolve(true);}, time);
    });
}

main();