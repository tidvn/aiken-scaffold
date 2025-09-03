/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    applyParamsToScript,
    BlockfrostProvider,
    deserializeDatum,
    IFetcher,
    MeshTxBuilder,
    MeshWallet,
    Network,
    PlutusScript,
    serializeAddressObj,
    serializePlutusScript,
    UTxO,
    YaciProvider,
} from "@meshsdk/core";
import blueprint from "../plutus.json";

export class MeshAdapter {
    protected fetcher: IFetcher;
    protected wallet: MeshWallet;
    protected meshTxBuilder: MeshTxBuilder;
    protected network: Network;
    protected networkId: number;

    public contractAddress: string;
    protected contractScript: PlutusScript;
    protected contractScriptCbor: string;
    protected contractCompileCode: string;

    constructor({
        wallet = null!,
        fetcher = null!,
        provider = null!,
    }: {
        wallet?: MeshWallet;
        fetcher?: IFetcher;
        provider?: BlockfrostProvider | YaciProvider;
    }) {
        this.wallet = wallet;
        this.fetcher = fetcher;
        this.meshTxBuilder = new MeshTxBuilder({
            fetcher: this.fetcher,
            evaluator: provider,
        });
        this.network = (process.env.BLOCKFROST_PROJECT_ID?.slice(0, 7) as Network) || "preprod";
        this.networkId = this.network == "mainnet" ? 1 : 0;
        this.contractCompileCode = this.readValidator(blueprint, "contract.sensor.spend");

        this.contractScriptCbor = applyParamsToScript(this.contractCompileCode, []);

        this.contractScript = {
            code: this.contractScriptCbor,
            version: "V3",
        };

        this.contractAddress = serializePlutusScript(this.contractScript, undefined, 0, false).address;
    }

    protected getWalletForTx = async (): Promise<{
        utxos: UTxO[];
        collateral: UTxO;
        walletAddress: string;
    }> => {
        const utxos = await this.wallet.getUtxos();
        const collaterals = await this.wallet.getCollateral();
        const walletAddress = this.wallet.getChangeAddress();
        if (!utxos || utxos.length === 0) throw new Error("No UTXOs found in getWalletForTx method.");

        if (!collaterals || collaterals.length === 0) throw new Error("No collateral found in getWalletForTx method.");

        if (!walletAddress) throw new Error("No wallet address found in getWalletForTx method.");

        return { utxos, collateral: collaterals[0], walletAddress };
    };

    protected getUtxoForTx = async (address: string, txHash: string) => {
        const utxos: UTxO[] = await this.fetcher.fetchAddressUTxOs(address);
        const utxo = utxos.find(function (utxo: UTxO) {
            return utxo.input.txHash === txHash;
        });

        if (!utxo) throw new Error("No UTXOs found in getUtxoForTx method.");
        return utxo;
    };

    protected readValidator = function (plutus: any, title: string): string {
        const validator = plutus.validators.find(function (validator: any) {
            return validator.title === title;
        });

        if (!validator) {
            throw new Error(`${title} validator not found.`);
        }

        return validator.compiledCode;
    };

    public readPlutusData = (plutusData: string) => {
        try {
            const inputDatum = deserializeDatum(plutusData);
            const seller = serializeAddressObj(deserializeDatum(plutusData).fields[0], this.networkId);
            return {
                owner: seller,
            };
        } catch (e) {
            console.error("Error reading plutus data: ", e);
            return null!;
        }
    };

    protected getAddressUTXOAsset = async (address: string, unit?: string) => {
        const utxos = await this.fetcher.fetchAddressUTxOs(address, unit);
        return utxos[utxos.length - 1];
    };

    protected getAddressUTXOAssets = async (address: string, unit: string) => {
        return await this.fetcher.fetchAddressUTxOs(address, unit);
    };
}