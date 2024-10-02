const webcrypto = window.crypto;

export function randomNumbers(options: { amount: number }): Uint8Array {
  return webcrypto.getRandomValues(new Uint8Array(options.amount));
}

/*
export function generateFlowId(): string {
  const randomBytes = new Uint8Array(4); // this accounts to pow(2, 8*4) = 429 Billions possibilities
  webcrypto.getRandomValues(randomBytes);
  return base64.encode(randomBytes); // generates a 6 char-long slug
}
*/
