import {
    conStr0,
    deserializeAddress,
    integer,
    mConStr0,
    policyId as toPolicyId,
    assetName as toAssetName,
    pubKeyAddress,
    deserializeDatum,
    serializeAddressObj,
    parseAssetUnit,
    mConStr1,
    Asset,
    stringToHex,
} from "@meshsdk/core";
import { MeshAdapter } from "./mesh";

export class Contract extends MeshAdapter {
    /**
     * @method Lock
     *
     */
    lock = async ({
        assets,
    }: {
        assets: Asset[];
    }): Promise<string> => {
        const { utxos, walletAddress, collateral } = await this.getWalletForTx();
        const { pubKeyHash, stakeCredentialHash } =
            deserializeAddress(walletAddress);
        const unsignedTx = this.meshTxBuilder
            .txOut(this.contractAddress, assets)
            .txOutDatumHashValue(mConStr0([pubKeyHash]))
            .changeAddress(walletAddress)
            .selectUtxosFrom(utxos)
        return await unsignedTx.complete();
    };
    /**
     * @method Lock
     *
     */
    unlock = async ({
        txHash,
    }: {
        txHash: string;
    }): Promise<string> => {
        const { utxos, walletAddress, collateral } = await this.getWalletForTx();
        const scriptUtxo = await this.getUtxoForTx(this.contractAddress, txHash)
        const { pubKeyHash, stakeCredentialHash } =
            deserializeAddress(walletAddress);


        const unsignedTx = this.meshTxBuilder
            .spendingPlutusScript("V3") // we used plutus v3
            .txIn( // spend the utxo from the script address
                scriptUtxo.input.txHash,
                scriptUtxo.input.outputIndex,
                scriptUtxo.output.amount,
                scriptUtxo.output.address
            )
            .txInScript(this.contractScriptCbor)
            .txInRedeemerValue(mConStr0([stringToHex("Hello, World!")]))
            .txInDatumValue(mConStr0([pubKeyHash]))
            .requiredSignerHash(pubKeyHash)
            .changeAddress(walletAddress)
            .txInCollateral(
                collateral.input.txHash,
                collateral.input.outputIndex,
                collateral.output.amount,
                collateral.output.address
            )
            .selectUtxosFrom(utxos)
        return await unsignedTx.complete();
    };

}