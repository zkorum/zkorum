#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs");
const {
  BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES,
  initializeWasm,
  BBSPlusSignatureParamsG1,
  BBSPlusKeypairG2,
} = require("@docknetwork/crypto-wasm-ts");

var argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 -pk [string]")
  .demandOption(["pk"]).argv;

(async () => {
  await initializeWasm();
  const params = BBSPlusSignatureParamsG1.generate(
    100,
    BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES
  );
  const keypair = BBSPlusKeypairG2.generate(params);
  const sk = keypair.sk;
  const pk = keypair.pk;
  fs.writeFileSync(argv.pk, pk.hex);
  process.stdout.write(sk.hex);
})();
