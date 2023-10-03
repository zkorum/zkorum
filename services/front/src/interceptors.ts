import axios from "axios";
import * as DID from "./crypto/ucan/did/index";
import * as ucan from "@ucans/ucans";

import {
    httpMethodToAbility,
    httpUrlToResourcePointer,
} from "./shared/ucan/ucan";
import { store, cryptoStore } from "./store/store";

export const noAuthAxios = axios.create({
    baseURL: import.meta.env.VITE_BACK_BASE_URL,
});

export const activeSessionUcanAxios = axios.create({
    baseURL: import.meta.env.VITE_BACK_BASE_URL,
});

export const pendingSessionUcanAxios = axios.create({
    baseURL: import.meta.env.VITE_BACK_BASE_URL,
});

async function buildUcan(
    url: string,
    method: string,
    email: string,
    userId?: string
): Promise<string> {
    let emailOrUserId: string;
    if (userId !== undefined) {
        const keyExists = await cryptoStore.keystore.writeKeyExists(userId);
        if (keyExists) {
            emailOrUserId = userId;
        } else {
            emailOrUserId = email;
        }
    } else {
        emailOrUserId = email;
    }

    const accountDid = await DID.ucan(cryptoStore, emailOrUserId);
    const u = await ucan.Builder.create()
        .issuedBy({
            did: () => accountDid,
            jwtAlg: await cryptoStore.keystore.getUcanAlgorithm(),
            sign: (msg: Uint8Array) =>
                cryptoStore.keystore.sign(msg, emailOrUserId),
        })
        .toAudience(import.meta.env.VITE_BACK_DID)
        .withLifetimeInSeconds(30)
        .claimCapability({
            // with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
            // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
            with: httpUrlToResourcePointer(url),
            can: httpMethodToAbility(method),
        })
        .build();

    // const u = await ucan.build({
    //   audience: import.meta.env.VITE_BACK_DID,
    //   issuer: {
    //     did: () => accountDid,
    //     jwtAlg: await accountCrypto.keystore.getUcanAlgorithm(),
    //     sign: accountCrypto.keystore.sign,
    //   },
    //   lifetimeInSeconds: 60,
    //   capabilities: [
    //     {
    //       // this must match with backend expectation
    //       with: httpUrlToResourcePointer(import.meta.env.VITE_BACK_BASE_URL),
    //       can: { namespace: `http/${method}`, segments: [pathname] },
    //     },
    //   ],
    // });
    return ucan.encode(u);
    // const keyType = await accountCrypto.keystore.getUcanAlgorithm();
    // const u = await ucan.sign(payload, keyType, accountCrypto.keystore.sign);

    // return ucan.encode(u);
}

// Add UCAN to every request - if an active session exists
activeSessionUcanAxios.interceptors.request.use(
    async function (config) {
        const activeSessionEmail = store.getState().sessions.activeSessionEmail;
        if (activeSessionEmail === "") {
            console.log("No active session: not adding UCAN");
            return config;
        }

        if (config.url === undefined || config.method === undefined) {
            // TODO: better error handling
            throw new Error(
                `Cannot add UCAN because url==${config.url} or method==${config.method} is undefined, should not happen!`
            );
        }

        const sessions = store.getState().sessions.sessions;
        const newUcan = await buildUcan(
            config.url,
            config.method,
            sessions !== undefined && activeSessionEmail in sessions
                ? sessions[activeSessionEmail].email
                : activeSessionEmail,
            sessions[activeSessionEmail]?.userId
        );
        config.headers.Authorization = `Bearer ${newUcan}`;
        return config;
    },
    function (error) {
        // Do something with request error
        return Promise.reject(error);
    }
);

// Add UCAN to every request - if an active session exists
pendingSessionUcanAxios.interceptors.request.use(
    async function (config) {
        const pendingSessionEmail =
            store.getState().sessions.pendingSessionEmail;
        if (pendingSessionEmail === "") {
            console.log("No pending session: not adding UCAN");
            return config;
        }

        if (config.url === undefined || config.method === undefined) {
            // TODO: better error handling
            throw new Error(
                `Cannot add UCAN because url==${config.url} or method==${config.method} is undefined, should not happen!`
            );
        }

        const sessions = store.getState().sessions.sessions;
        const newUcan = await buildUcan(
            config.url,
            config.method,
            sessions[pendingSessionEmail]
                ? sessions[pendingSessionEmail].email
                : pendingSessionEmail,
            sessions[pendingSessionEmail]?.userId
        );
        config.headers.Authorization = `Bearer ${newUcan}`;
        return config;
    },
    function (error) {
        // Do something with request error
        return Promise.reject(error);
    }
);
