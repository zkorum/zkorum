import fs from "fs";
import { beforeAll, describe, test } from "@jest/globals";
import {
    BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES as SIGNATURE_PARAMS_LABEL_BYTES,
    initializeWasm,
    BBSPlusSignatureParamsG1 as SignatureParams,
    BBSPlusKeypairG2 as KeyPair,
} from "@docknetwork/crypto-wasm-ts";

const describeOrSkip =
    process.env.GENERATE_DEV_KEYS === "true" ? describe : describe.skip;

describeOrSkip(
    "not really a test: actually generate bbs plus keys in a file for development purpose - usually skipped",
    () => {
        beforeAll(async () => {
            await initializeWasm();
        });
        test("generate-dev-keys", () => {
            const params = SignatureParams.generate(
                100,
                SIGNATURE_PARAMS_LABEL_BYTES
            );
            const keypair = KeyPair.generate(params);
            const sk = keypair.sk;
            const pk = keypair.pk;
            fs.writeFileSync("./private.dev.key", sk.hex);
            fs.writeFileSync("./public.dev.key", pk.hex);
        });
    }
);
