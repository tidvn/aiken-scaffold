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
        const balance = await appWallet.getBalance()
        console.log(balance)
    });

    test("faucet", async function () {
        return;
        const address = appWallet.getChangeAddress()
        const result = await provider.addressTopup(address, "20000000")
        console.log(result)
    });

    test("lock", async function () {
        // return;
        const marketplaceContract: Contract = new Contract({
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
        const lockUnsignedTx: string = await marketplaceContract.lock({ assets: assets });
        const lockSignedTx = await appWallet.signTx(lockUnsignedTx, true);
        const txHash1 = await provider.submitTx(lockSignedTx);
        console.log("Lock Transaction submitted successfully:", txHash1);
        expect(txHash1).toBeDefined();
        expect(txHash1.length).toBe(64);
    }, 60000); // Set timeout to 60 seconds

});