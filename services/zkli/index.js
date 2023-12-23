#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs");
const {
  initializeWasm,
  BBSPlusSignatureParamsG1,
  BBSPlusKeypairG2,
} = require("@docknetwork/crypto-wasm-ts");
const crypto = require("crypto");

var argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 -pk [string]")
  .demandOption(["pk"]).argv;

(async () => {
  await initializeWasm();
  const params = BBSPlusSignatureParamsG1.generate(100);
  const randomBytes = new Uint8Array(32);
  crypto.webcrypto.getRandomValues(randomBytes);
  const keypair = BBSPlusKeypairG2.generate(params, randomBytes);
  const sk = keypair.secretKey;
  const pk = keypair.publicKey;
  fs.writeFileSync(argv.pk, pk.hex);
  process.stdout.write(sk.hex);
})();
