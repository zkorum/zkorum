import { z } from "zod";
// test

export class Dto {
  static email = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address");
}
