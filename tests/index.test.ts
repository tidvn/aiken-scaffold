/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import {
    Asset,
    BlockfrostProvider,
    deserializeAddress,
    deserializeDatum,
    MeshWallet,
    serializeNativeScript,
    YaciProvider,
} from "@meshsdk/core";
import { Contract } from "../script";
import { decodeFirst } from "cbor";

describe("Test", function () {
    let txHashTemp: string;
    let appWallet: MeshWallet;
    let provider: YaciProvider;

    beforeEach(async function () {
        provider = new YaciProvider(
            process.env.YACI_URL || "",
            process.env.YACI_ADMIN_URL || ""
        );

        appWallet = new MeshWallet({
            networkId: 0,
            fetcher: provider,
            submitter: provider,
            key: {
                type: "mnemonic",
                words: process.env.MNEMONIC?.split(" ") || [],
            },
        });
        const balance = await appWallet.getLovelace()
        console.log(balance)
    });

    test("faucet", async function () {
        return;
        const address = appWallet.getChangeAddress()
        const result = await provider.addressTopup(address, "20000000")
        console.log(result)
    });

    test("check", async function () {
        const contract: Contract = new Contract({
            wallet: appWallet,
            fetcher: provider,
            provider: provider,
        });
        const contractAddress = contract.contractAddress
        const utxos = await provider.fetchAddressUTxOs(contractAddress)

        console.log(utxos)
    });

    test("write", async function () {
        return;
        const contract: Contract = new Contract({
            wallet: appWallet,
            fetcher: provider,
            provider: provider,
        });
        const assets: Asset[] = [
            {
                unit: "lovelace",
                quantity: "1000000",
            },
        ];
        const unsignedTx: string = await contract.write({
            title: "Temperature",
            value: 60,
        });

        const signedTx = await appWallet.signTx(unsignedTx, true);
        const txHash = await appWallet.submitTx(signedTx);
        console.log("https://preprod.cexplorer.io/tx/" + txHash);
        txHashTemp = txHash;

        console.log("Lock Transaction submitted successfully:", txHash);
        expect(txHash).toBeDefined();
        expect(txHash.length).toBe(64);
    }, 60000); // Set timeout to 60 seconds

});