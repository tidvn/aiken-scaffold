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
    ForgeScript,
    resolveScriptHash,
} from "@meshsdk/core";
import { MeshAdapter } from "./mesh";

export class Contract extends MeshAdapter {
    /**
     * @method write
     *
     */
    write = async ({ unit, title, value }: { unit?: string, title: string, value: number }) => {
        const { utxos, collateral, walletAddress } = await this.getWalletForTx();
        const ownerPaymentKeyHash = deserializeAddress(walletAddress).pubKeyHash;
        const forgingScript = ForgeScript.withOneSignature(walletAddress);
        const policyId = resolveScriptHash(forgingScript);
        const utxo = await this.getAddressUTXOAsset(this.contractAddress, policyId + stringToHex(title));
        const unsignedTx = this.meshTxBuilder
        if (!utxo) {
            unsignedTx
                .mint("1", policyId, stringToHex(title))
                .mintingScript(forgingScript)
                .txOut(this.contractAddress, [{
                    unit: policyId + stringToHex(title),
                    quantity: String(1),
                }])
                .txOutInlineDatumValue(mConStr0([ownerPaymentKeyHash, value]));
        } else {
            unsignedTx
                .spendingPlutusScriptV3()
                .txIn(utxo.input.txHash, utxo.input.outputIndex)
                .txInInlineDatumPresent()
                .txInRedeemerValue(mConStr0([]))
                .txInScript(this.contractScriptCbor)
                .txOut(this.contractAddress, [{
                    unit: policyId + stringToHex(title),
                    quantity: String(1),
                }])
                .txOutInlineDatumValue(mConStr0([ownerPaymentKeyHash, value]))
        }

        unsignedTx
            .changeAddress(walletAddress)
            .requiredSignerHash(deserializeAddress(walletAddress).pubKeyHash)
            .selectUtxosFrom(utxos)
            .txInCollateral(
                collateral.input.txHash,
                collateral.input.outputIndex,
                collateral.output.amount,
                collateral.output.address,
            )
            .setNetwork("preprod");
        return await unsignedTx.complete();
    }

}