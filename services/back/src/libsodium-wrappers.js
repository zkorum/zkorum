// 2023 07 13 15:00 CEST
!(function (e) {
  function r(e, r) {
    'use strict';
    var t,
      a = 'uint8array',
      _ = r.ready.then(function () {
        function a() {
          if (0 !== t._sodium_init())
            throw new Error('libsodium was not correctly initialized.');
          for (
            var r = [
                'crypto_aead_chacha20poly1305_decrypt',
                'crypto_aead_chacha20poly1305_decrypt_detached',
                'crypto_aead_chacha20poly1305_encrypt',
                'crypto_aead_chacha20poly1305_encrypt_detached',
                'crypto_aead_chacha20poly1305_ietf_decrypt',
                'crypto_aead_chacha20poly1305_ietf_decrypt_detached',
                'crypto_aead_chacha20poly1305_ietf_encrypt',
                'crypto_aead_chacha20poly1305_ietf_encrypt_detached',
                'crypto_aead_chacha20poly1305_ietf_keygen',
                'crypto_aead_chacha20poly1305_keygen',
                'crypto_aead_xchacha20poly1305_ietf_decrypt',
                'crypto_aead_xchacha20poly1305_ietf_decrypt_detached',
                'crypto_aead_xchacha20poly1305_ietf_encrypt',
                'crypto_aead_xchacha20poly1305_ietf_encrypt_detached',
                'crypto_aead_xchacha20poly1305_ietf_keygen',
                'crypto_auth',
                'crypto_auth_hmacsha256',
                'crypto_auth_hmacsha256_final',
                'crypto_auth_hmacsha256_init',
                'crypto_auth_hmacsha256_keygen',
                'crypto_auth_hmacsha256_update',
                'crypto_auth_hmacsha256_verify',
                'crypto_auth_hmacsha512',
                'crypto_auth_hmacsha512_final',
                'crypto_auth_hmacsha512_init',
                'crypto_auth_hmacsha512_keygen',
                'crypto_auth_hmacsha512_update',
                'crypto_auth_hmacsha512_verify',
                'crypto_auth_keygen',
                'crypto_auth_verify',
                'crypto_box_beforenm',
                'crypto_box_curve25519xchacha20poly1305_beforenm',
                'crypto_box_curve25519xchacha20poly1305_detached',
                'crypto_box_curve25519xchacha20poly1305_detached_afternm',
                'crypto_box_curve25519xchacha20poly1305_easy',
                'crypto_box_curve25519xchacha20poly1305_easy_afternm',
                'crypto_box_curve25519xchacha20poly1305_keypair',
                'crypto_box_curve25519xchacha20poly1305_open_detached',
                'crypto_box_curve25519xchacha20poly1305_open_detached_afternm',
                'crypto_box_curve25519xchacha20poly1305_open_easy',
                'crypto_box_curve25519xchacha20poly1305_open_easy_afternm',
                'crypto_box_curve25519xchacha20poly1305_seal',
                'crypto_box_curve25519xchacha20poly1305_seal_open',
                'crypto_box_curve25519xchacha20poly1305_seed_keypair',
                'crypto_box_detached',
                'crypto_box_easy',
                'crypto_box_easy_afternm',
                'crypto_box_keypair',
                'crypto_box_open_detached',
                'crypto_box_open_easy',
                'crypto_box_open_easy_afternm',
                'crypto_box_seal',
                'crypto_box_seal_open',
                'crypto_box_seed_keypair',
                'crypto_core_ed25519_add',
                'crypto_core_ed25519_from_hash',
                'crypto_core_ed25519_from_uniform',
                'crypto_core_ed25519_is_valid_point',
                'crypto_core_ed25519_random',
                'crypto_core_ed25519_scalar_add',
                'crypto_core_ed25519_scalar_complement',
                'crypto_core_ed25519_scalar_invert',
                'crypto_core_ed25519_scalar_mul',
                'crypto_core_ed25519_scalar_negate',
                'crypto_core_ed25519_scalar_random',
                'crypto_core_ed25519_scalar_reduce',
                'crypto_core_ed25519_scalar_sub',
                'crypto_core_ed25519_sub',
                'crypto_core_hchacha20',
                'crypto_core_hsalsa20',
                'crypto_core_ristretto255_add',
                'crypto_core_ristretto255_from_hash',
                'crypto_core_ristretto255_is_valid_point',
                'crypto_core_ristretto255_random',
                'crypto_core_ristretto255_scalar_add',
                'crypto_core_ristretto255_scalar_complement',
                'crypto_core_ristretto255_scalar_invert',
                'crypto_core_ristretto255_scalar_mul',
                'crypto_core_ristretto255_scalar_negate',
                'crypto_core_ristretto255_scalar_random',
                'crypto_core_ristretto255_scalar_reduce',
                'crypto_core_ristretto255_scalar_sub',
                'crypto_core_ristretto255_sub',
                'crypto_generichash',
                'crypto_generichash_blake2b_salt_personal',
                'crypto_generichash_final',
                'crypto_generichash_init',
                'crypto_generichash_keygen',
                'crypto_generichash_update',
                'crypto_hash',
                'crypto_hash_sha256',
                'crypto_hash_sha256_final',
                'crypto_hash_sha256_init',
                'crypto_hash_sha256_update',
                'crypto_hash_sha512',
                'crypto_hash_sha512_final',
                'crypto_hash_sha512_init',
                'crypto_hash_sha512_update',
                'crypto_kdf_derive_from_key',
                'crypto_kdf_keygen',
                'crypto_kx_client_session_keys',
                'crypto_kx_keypair',
                'crypto_kx_seed_keypair',
                'crypto_kx_server_session_keys',
                'crypto_onetimeauth',
                'crypto_onetimeauth_final',
                'crypto_onetimeauth_init',
                'crypto_onetimeauth_keygen',
                'crypto_onetimeauth_update',
                'crypto_onetimeauth_verify',
                'crypto_pwhash',
                'crypto_pwhash_scryptsalsa208sha256',
                'crypto_pwhash_scryptsalsa208sha256_ll',
                'crypto_pwhash_scryptsalsa208sha256_str',
                'crypto_pwhash_scryptsalsa208sha256_str_verify',
                'crypto_pwhash_str',
                'crypto_pwhash_str_needs_rehash',
                'crypto_pwhash_str_verify',
                'crypto_scalarmult',
                'crypto_scalarmult_base',
                'crypto_scalarmult_ed25519',
                'crypto_scalarmult_ed25519_base',
                'crypto_scalarmult_ed25519_base_noclamp',
                'crypto_scalarmult_ed25519_noclamp',
                'crypto_scalarmult_ristretto255',
                'crypto_scalarmult_ristretto255_base',
                'crypto_secretbox_detached',
                'crypto_secretbox_easy',
                'crypto_secretbox_keygen',
                'crypto_secretbox_open_detached',
                'crypto_secretbox_open_easy',
                'crypto_secretstream_xchacha20poly1305_init_pull',
                'crypto_secretstream_xchacha20poly1305_init_push',
                'crypto_secretstream_xchacha20poly1305_keygen',
                'crypto_secretstream_xchacha20poly1305_pull',
                'crypto_secretstream_xchacha20poly1305_push',
                'crypto_secretstream_xchacha20poly1305_rekey',
                'crypto_shorthash',
                'crypto_shorthash_keygen',
                'crypto_shorthash_siphashx24',
                'crypto_sign',
                'crypto_sign_detached',
                'crypto_sign_ed25519_pk_to_curve25519',
                'crypto_sign_ed25519_sk_to_curve25519',
                'crypto_sign_ed25519_sk_to_pk',
                'crypto_sign_ed25519_sk_to_seed',
                'crypto_sign_final_create',
                'crypto_sign_final_verify',
                'crypto_sign_init',
                'crypto_sign_keypair',
                'crypto_sign_open',
                'crypto_sign_seed_keypair',
                'crypto_sign_update',
                'crypto_sign_verify_detached',
                'crypto_stream_chacha20',
                'crypto_stream_chacha20_ietf_xor',
                'crypto_stream_chacha20_ietf_xor_ic',
                'crypto_stream_chacha20_keygen',
                'crypto_stream_chacha20_xor',
                'crypto_stream_chacha20_xor_ic',
                'crypto_stream_keygen',
                'crypto_stream_xchacha20_keygen',
                'crypto_stream_xchacha20_xor',
                'crypto_stream_xchacha20_xor_ic',
                'randombytes_buf',
                'randombytes_buf_deterministic',
                'randombytes_close',
                'randombytes_random',
                'randombytes_set_implementation',
                'randombytes_stir',
                'randombytes_uniform',
                'sodium_version_string',
              ],
              a = [
                E,
                k,
                S,
                T,
                w,
                Y,
                B,
                A,
                K,
                M,
                I,
                N,
                L,
                U,
                O,
                C,
                R,
                P,
                G,
                X,
                D,
                F,
                V,
                H,
                q,
                j,
                z,
                W,
                J,
                Q,
                Z,
                $,
                ee,
                re,
                te,
                ae,
                _e,
                ne,
                se,
                ce,
                oe,
                he,
                pe,
                ye,
                ie,
                le,
                ue,
                ve,
                de,
                ge,
                be,
                fe,
                me,
                xe,
                Ee,
                ke,
                Se,
                Te,
                we,
                Ye,
                Be,
                Ae,
                Ke,
                Me,
                Ie,
                Ne,
                Le,
                Ue,
                Oe,
                Ce,
                Re,
                Pe,
                Ge,
                Xe,
                De,
                Fe,
                Ve,
                He,
                qe,
                je,
                ze,
                We,
                Je,
                Qe,
                Ze,
                $e,
                er,
                rr,
                tr,
                ar,
                _r,
                nr,
                sr,
                cr,
                or,
                hr,
                pr,
                yr,
                ir,
                lr,
                ur,
                vr,
                dr,
                gr,
                br,
                fr,
                mr,
                xr,
                Er,
                kr,
                Sr,
                Tr,
                wr,
                Yr,
                Br,
                Ar,
                Kr,
                Mr,
                Ir,
                Nr,
                Lr,
                Ur,
                Or,
                Cr,
                Rr,
                Pr,
                Gr,
                Xr,
                Dr,
                Fr,
                Vr,
                Hr,
                qr,
                jr,
                zr,
                Wr,
                Jr,
                Qr,
                Zr,
                $r,
                et,
                rt,
                tt,
                at,
                _t,
                nt,
                st,
                ct,
                ot,
                ht,
                pt,
                yt,
                it,
                lt,
                ut,
                vt,
                dt,
                gt,
                bt,
                ft,
                mt,
                xt,
                Et,
                kt,
                St,
                Tt,
                wt,
                Yt,
                Bt,
                At,
                Kt,
                Mt,
              ],
              _ = 0;
            _ < a.length;
            _++
          )
            'function' == typeof t['_' + r[_]] && (e[r[_]] = a[_]);
          var n = [
            'SODIUM_LIBRARY_VERSION_MAJOR',
            'SODIUM_LIBRARY_VERSION_MINOR',
            'crypto_aead_chacha20poly1305_ABYTES',
            'crypto_aead_chacha20poly1305_IETF_ABYTES',
            'crypto_aead_chacha20poly1305_IETF_KEYBYTES',
            'crypto_aead_chacha20poly1305_IETF_MESSAGEBYTES_MAX',
            'crypto_aead_chacha20poly1305_IETF_NPUBBYTES',
            'crypto_aead_chacha20poly1305_IETF_NSECBYTES',
            'crypto_aead_chacha20poly1305_KEYBYTES',
            'crypto_aead_chacha20poly1305_MESSAGEBYTES_MAX',
            'crypto_aead_chacha20poly1305_NPUBBYTES',
            'crypto_aead_chacha20poly1305_NSECBYTES',
            'crypto_aead_chacha20poly1305_ietf_ABYTES',
            'crypto_aead_chacha20poly1305_ietf_KEYBYTES',
            'crypto_aead_chacha20poly1305_ietf_MESSAGEBYTES_MAX',
            'crypto_aead_chacha20poly1305_ietf_NPUBBYTES',
            'crypto_aead_chacha20poly1305_ietf_NSECBYTES',
            'crypto_aead_xchacha20poly1305_IETF_ABYTES',
            'crypto_aead_xchacha20poly1305_IETF_KEYBYTES',
            'crypto_aead_xchacha20poly1305_IETF_MESSAGEBYTES_MAX',
            'crypto_aead_xchacha20poly1305_IETF_NPUBBYTES',
            'crypto_aead_xchacha20poly1305_IETF_NSECBYTES',
            'crypto_aead_xchacha20poly1305_ietf_ABYTES',
            'crypto_aead_xchacha20poly1305_ietf_KEYBYTES',
            'crypto_aead_xchacha20poly1305_ietf_MESSAGEBYTES_MAX',
            'crypto_aead_xchacha20poly1305_ietf_NPUBBYTES',
            'crypto_aead_xchacha20poly1305_ietf_NSECBYTES',
            'crypto_auth_BYTES',
            'crypto_auth_KEYBYTES',
            'crypto_auth_hmacsha256_BYTES',
            'crypto_auth_hmacsha256_KEYBYTES',
            'crypto_auth_hmacsha512256_BYTES',
            'crypto_auth_hmacsha512256_KEYBYTES',
            'crypto_auth_hmacsha512_BYTES',
            'crypto_auth_hmacsha512_KEYBYTES',
            'crypto_box_BEFORENMBYTES',
            'crypto_box_MACBYTES',
            'crypto_box_MESSAGEBYTES_MAX',
            'crypto_box_NONCEBYTES',
            'crypto_box_PUBLICKEYBYTES',
            'crypto_box_SEALBYTES',
            'crypto_box_SECRETKEYBYTES',
            'crypto_box_SEEDBYTES',
            'crypto_box_curve25519xchacha20poly1305_BEFORENMBYTES',
            'crypto_box_curve25519xchacha20poly1305_MACBYTES',
            'crypto_box_curve25519xchacha20poly1305_MESSAGEBYTES_MAX',
            'crypto_box_curve25519xchacha20poly1305_NONCEBYTES',
            'crypto_box_curve25519xchacha20poly1305_PUBLICKEYBYTES',
            'crypto_box_curve25519xchacha20poly1305_SEALBYTES',
            'crypto_box_curve25519xchacha20poly1305_SECRETKEYBYTES',
            'crypto_box_curve25519xchacha20poly1305_SEEDBYTES',
            'crypto_box_curve25519xsalsa20poly1305_BEFORENMBYTES',
            'crypto_box_curve25519xsalsa20poly1305_MACBYTES',
            'crypto_box_curve25519xsalsa20poly1305_MESSAGEBYTES_MAX',
            'crypto_box_curve25519xsalsa20poly1305_NONCEBYTES',
            'crypto_box_curve25519xsalsa20poly1305_PUBLICKEYBYTES',
            'crypto_box_curve25519xsalsa20poly1305_SECRETKEYBYTES',
            'crypto_box_curve25519xsalsa20poly1305_SEEDBYTES',
            'crypto_core_ed25519_BYTES',
            'crypto_core_ed25519_HASHBYTES',
            'crypto_core_ed25519_NONREDUCEDSCALARBYTES',
            'crypto_core_ed25519_SCALARBYTES',
            'crypto_core_ed25519_UNIFORMBYTES',
            'crypto_core_hchacha20_CONSTBYTES',
            'crypto_core_hchacha20_INPUTBYTES',
            'crypto_core_hchacha20_KEYBYTES',
            'crypto_core_hchacha20_OUTPUTBYTES',
            'crypto_core_hsalsa20_CONSTBYTES',
            'crypto_core_hsalsa20_INPUTBYTES',
            'crypto_core_hsalsa20_KEYBYTES',
            'crypto_core_hsalsa20_OUTPUTBYTES',
            'crypto_core_ristretto255_BYTES',
            'crypto_core_ristretto255_HASHBYTES',
            'crypto_core_ristretto255_NONREDUCEDSCALARBYTES',
            'crypto_core_ristretto255_SCALARBYTES',
            'crypto_core_salsa2012_CONSTBYTES',
            'crypto_core_salsa2012_INPUTBYTES',
            'crypto_core_salsa2012_KEYBYTES',
            'crypto_core_salsa2012_OUTPUTBYTES',
            'crypto_core_salsa20_CONSTBYTES',
            'crypto_core_salsa20_INPUTBYTES',
            'crypto_core_salsa20_KEYBYTES',
            'crypto_core_salsa20_OUTPUTBYTES',
            'crypto_generichash_BYTES',
            'crypto_generichash_BYTES_MAX',
            'crypto_generichash_BYTES_MIN',
            'crypto_generichash_KEYBYTES',
            'crypto_generichash_KEYBYTES_MAX',
            'crypto_generichash_KEYBYTES_MIN',
            'crypto_generichash_blake2b_BYTES',
            'crypto_generichash_blake2b_BYTES_MAX',
            'crypto_generichash_blake2b_BYTES_MIN',
            'crypto_generichash_blake2b_KEYBYTES',
            'crypto_generichash_blake2b_KEYBYTES_MAX',
            'crypto_generichash_blake2b_KEYBYTES_MIN',
            'crypto_generichash_blake2b_PERSONALBYTES',
            'crypto_generichash_blake2b_SALTBYTES',
            'crypto_hash_BYTES',
            'crypto_hash_sha256_BYTES',
            'crypto_hash_sha512_BYTES',
            'crypto_kdf_BYTES_MAX',
            'crypto_kdf_BYTES_MIN',
            'crypto_kdf_CONTEXTBYTES',
            'crypto_kdf_KEYBYTES',
            'crypto_kdf_blake2b_BYTES_MAX',
            'crypto_kdf_blake2b_BYTES_MIN',
            'crypto_kdf_blake2b_CONTEXTBYTES',
            'crypto_kdf_blake2b_KEYBYTES',
            'crypto_kx_PUBLICKEYBYTES',
            'crypto_kx_SECRETKEYBYTES',
            'crypto_kx_SEEDBYTES',
            'crypto_kx_SESSIONKEYBYTES',
            'crypto_onetimeauth_BYTES',
            'crypto_onetimeauth_KEYBYTES',
            'crypto_onetimeauth_poly1305_BYTES',
            'crypto_onetimeauth_poly1305_KEYBYTES',
            'crypto_pwhash_ALG_ARGON2I13',
            'crypto_pwhash_ALG_ARGON2ID13',
            'crypto_pwhash_ALG_DEFAULT',
            'crypto_pwhash_BYTES_MAX',
            'crypto_pwhash_BYTES_MIN',
            'crypto_pwhash_MEMLIMIT_INTERACTIVE',
            'crypto_pwhash_MEMLIMIT_MAX',
            'crypto_pwhash_MEMLIMIT_MIN',
            'crypto_pwhash_MEMLIMIT_MODERATE',
            'crypto_pwhash_MEMLIMIT_SENSITIVE',
            'crypto_pwhash_OPSLIMIT_INTERACTIVE',
            'crypto_pwhash_OPSLIMIT_MAX',
            'crypto_pwhash_OPSLIMIT_MIN',
            'crypto_pwhash_OPSLIMIT_MODERATE',
            'crypto_pwhash_OPSLIMIT_SENSITIVE',
            'crypto_pwhash_PASSWD_MAX',
            'crypto_pwhash_PASSWD_MIN',
            'crypto_pwhash_SALTBYTES',
            'crypto_pwhash_STRBYTES',
            'crypto_pwhash_argon2i_BYTES_MAX',
            'crypto_pwhash_argon2i_BYTES_MIN',
            'crypto_pwhash_argon2i_SALTBYTES',
            'crypto_pwhash_argon2i_STRBYTES',
            'crypto_pwhash_argon2id_BYTES_MAX',
            'crypto_pwhash_argon2id_BYTES_MIN',
            'crypto_pwhash_argon2id_SALTBYTES',
            'crypto_pwhash_argon2id_STRBYTES',
            'crypto_pwhash_scryptsalsa208sha256_BYTES_MAX',
            'crypto_pwhash_scryptsalsa208sha256_BYTES_MIN',
            'crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE',
            'crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MAX',
            'crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MIN',
            'crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_SENSITIVE',
            'crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE',
            'crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MAX',
            'crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MIN',
            'crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_SENSITIVE',
            'crypto_pwhash_scryptsalsa208sha256_SALTBYTES',
            'crypto_pwhash_scryptsalsa208sha256_STRBYTES',
            'crypto_scalarmult_BYTES',
            'crypto_scalarmult_SCALARBYTES',
            'crypto_scalarmult_curve25519_BYTES',
            'crypto_scalarmult_curve25519_SCALARBYTES',
            'crypto_scalarmult_ed25519_BYTES',
            'crypto_scalarmult_ed25519_SCALARBYTES',
            'crypto_scalarmult_ristretto255_BYTES',
            'crypto_scalarmult_ristretto255_SCALARBYTES',
            'crypto_secretbox_KEYBYTES',
            'crypto_secretbox_MACBYTES',
            'crypto_secretbox_MESSAGEBYTES_MAX',
            'crypto_secretbox_NONCEBYTES',
            'crypto_secretbox_xchacha20poly1305_KEYBYTES',
            'crypto_secretbox_xchacha20poly1305_MACBYTES',
            'crypto_secretbox_xchacha20poly1305_MESSAGEBYTES_MAX',
            'crypto_secretbox_xchacha20poly1305_NONCEBYTES',
            'crypto_secretbox_xsalsa20poly1305_KEYBYTES',
            'crypto_secretbox_xsalsa20poly1305_MACBYTES',
            'crypto_secretbox_xsalsa20poly1305_MESSAGEBYTES_MAX',
            'crypto_secretbox_xsalsa20poly1305_NONCEBYTES',
            'crypto_secretstream_xchacha20poly1305_ABYTES',
            'crypto_secretstream_xchacha20poly1305_HEADERBYTES',
            'crypto_secretstream_xchacha20poly1305_KEYBYTES',
            'crypto_secretstream_xchacha20poly1305_MESSAGEBYTES_MAX',
            'crypto_secretstream_xchacha20poly1305_TAG_FINAL',
            'crypto_secretstream_xchacha20poly1305_TAG_MESSAGE',
            'crypto_secretstream_xchacha20poly1305_TAG_PUSH',
            'crypto_secretstream_xchacha20poly1305_TAG_REKEY',
            'crypto_shorthash_BYTES',
            'crypto_shorthash_KEYBYTES',
            'crypto_shorthash_siphash24_BYTES',
            'crypto_shorthash_siphash24_KEYBYTES',
            'crypto_shorthash_siphashx24_BYTES',
            'crypto_shorthash_siphashx24_KEYBYTES',
            'crypto_sign_BYTES',
            'crypto_sign_MESSAGEBYTES_MAX',
            'crypto_sign_PUBLICKEYBYTES',
            'crypto_sign_SECRETKEYBYTES',
            'crypto_sign_SEEDBYTES',
            'crypto_sign_ed25519_BYTES',
            'crypto_sign_ed25519_MESSAGEBYTES_MAX',
            'crypto_sign_ed25519_PUBLICKEYBYTES',
            'crypto_sign_ed25519_SECRETKEYBYTES',
            'crypto_sign_ed25519_SEEDBYTES',
            'crypto_stream_KEYBYTES',
            'crypto_stream_MESSAGEBYTES_MAX',
            'crypto_stream_NONCEBYTES',
            'crypto_stream_chacha20_IETF_KEYBYTES',
            'crypto_stream_chacha20_IETF_MESSAGEBYTES_MAX',
            'crypto_stream_chacha20_IETF_NONCEBYTES',
            'crypto_stream_chacha20_KEYBYTES',
            'crypto_stream_chacha20_MESSAGEBYTES_MAX',
            'crypto_stream_chacha20_NONCEBYTES',
            'crypto_stream_chacha20_ietf_KEYBYTES',
            'crypto_stream_chacha20_ietf_MESSAGEBYTES_MAX',
            'crypto_stream_chacha20_ietf_NONCEBYTES',
            'crypto_stream_salsa2012_KEYBYTES',
            'crypto_stream_salsa2012_MESSAGEBYTES_MAX',
            'crypto_stream_salsa2012_NONCEBYTES',
            'crypto_stream_salsa208_KEYBYTES',
            'crypto_stream_salsa208_MESSAGEBYTES_MAX',
            'crypto_stream_salsa208_NONCEBYTES',
            'crypto_stream_salsa20_KEYBYTES',
            'crypto_stream_salsa20_MESSAGEBYTES_MAX',
            'crypto_stream_salsa20_NONCEBYTES',
            'crypto_stream_xchacha20_KEYBYTES',
            'crypto_stream_xchacha20_MESSAGEBYTES_MAX',
            'crypto_stream_xchacha20_NONCEBYTES',
            'crypto_stream_xsalsa20_KEYBYTES',
            'crypto_stream_xsalsa20_MESSAGEBYTES_MAX',
            'crypto_stream_xsalsa20_NONCEBYTES',
            'crypto_verify_16_BYTES',
            'crypto_verify_32_BYTES',
            'crypto_verify_64_BYTES',
          ];
          for (_ = 0; _ < n.length; _++)
            'function' == typeof (c = t['_' + n[_].toLowerCase()]) &&
              (e[n[_]] = c());
          var s = [
            'SODIUM_VERSION_STRING',
            'crypto_pwhash_STRPREFIX',
            'crypto_pwhash_scryptsalsa208sha256_STRPREFIX',
          ];
          for (_ = 0; _ < s.length; _++) {
            var c;
            'function' == typeof (c = t['_' + s[_].toLowerCase()]) &&
              (e[s[_]] = t.UTF8ToString(c()));
          }
        }
        t = r;
        try {
          a();
          var _ = new Uint8Array([98, 97, 108, 108, 115]),
            n = e.randombytes_buf(e.crypto_secretbox_NONCEBYTES),
            s = e.randombytes_buf(e.crypto_secretbox_KEYBYTES),
            c = e.crypto_secretbox_easy(_, n, s),
            o = e.crypto_secretbox_open_easy(c, n, s);
          if (e.memcmp(_, o)) return;
        } catch (e) {
          if (null == t.useBackupModule)
            throw new Error('Both wasm and asm failed to load' + e);
        }
        t.useBackupModule(), a();
      });
    function n(e) {
      if ('function' == typeof TextEncoder) return new TextEncoder().encode(e);
      e = unescape(encodeURIComponent(e));
      for (var r = new Uint8Array(e.length), t = 0, a = e.length; t < a; t++)
        r[t] = e.charCodeAt(t);
      return r;
    }
    function s(e) {
      if ('function' == typeof TextDecoder)
        return new TextDecoder('utf-8', { fatal: !0 }).decode(e);
      var r = 8192,
        t = Math.ceil(e.length / r);
      if (t <= 1)
        try {
          return decodeURIComponent(escape(String.fromCharCode.apply(null, e)));
        } catch (e) {
          throw new TypeError('The encoded data was not valid.');
        }
      for (var a = '', _ = 0, n = 0; n < t; n++) {
        var c = Array.prototype.slice.call(e, n * r + _, (n + 1) * r + _);
        if (0 != c.length) {
          var o,
            h = c.length,
            p = 0;
          do {
            var y = c[--h];
            y >= 240
              ? ((p = 4), (o = !0))
              : y >= 224
              ? ((p = 3), (o = !0))
              : y >= 192
              ? ((p = 2), (o = !0))
              : y < 128 && ((p = 1), (o = !0));
          } while (!o);
          for (var i = p - (c.length - h), l = 0; l < i; l++) _--, c.pop();
          a += s(c);
        }
      }
      return a;
    }
    function c(e) {
      e = x(null, e, 'input');
      for (var r, t, a, _ = '', n = 0; n < e.length; n++)
        (a =
          ((87 + (t = 15 & e[n]) + (((t - 10) >> 8) & -39)) << 8) |
          (87 + (r = e[n] >>> 4) + (((r - 10) >> 8) & -39))),
          (_ += String.fromCharCode(255 & a) + String.fromCharCode(a >>> 8));
      return _;
    }
    var o = {
      ORIGINAL: 1,
      ORIGINAL_NO_PADDING: 3,
      URLSAFE: 5,
      URLSAFE_NO_PADDING: 7,
    };
    function h(e) {
      if (null == e) return o.URLSAFE_NO_PADDING;
      if (
        e !== o.ORIGINAL &&
        e !== o.ORIGINAL_NO_PADDING &&
        e !== o.URLSAFE &&
        e != o.URLSAFE_NO_PADDING
      )
        throw new Error('unsupported base64 variant');
      return e;
    }
    function p(e, r) {
      (r = h(r)), (e = x(_, e, 'input'));
      var a,
        _ = [],
        n = 0 | Math.floor(e.length / 3),
        c = e.length - 3 * n,
        o = 4 * n + (0 !== c ? (0 == (2 & r) ? 4 : 2 + (c >>> 1)) : 0),
        p = new u(o + 1),
        y = v(e);
      return (
        _.push(y),
        _.push(p.address),
        0 === t._sodium_bin2base64(p.address, p.length, y, e.length, r) &&
          b(_, 'conversion failed'),
        (p.length = o),
        (a = s(p.to_Uint8Array())),
        g(_),
        a
      );
    }
    function y(e, r) {
      var t = r || a;
      if (!i(t)) throw new Error(t + ' output format is not available');
      if (e instanceof u) {
        if ('uint8array' === t) return e.to_Uint8Array();
        if ('text' === t) return s(e.to_Uint8Array());
        if ('hex' === t) return c(e.to_Uint8Array());
        if ('base64' === t) return p(e.to_Uint8Array(), o.URLSAFE_NO_PADDING);
        throw new Error('What is output format "' + t + '"?');
      }
      if ('object' == typeof e) {
        for (var _ = Object.keys(e), n = {}, h = 0; h < _.length; h++)
          n[_[h]] = y(e[_[h]], t);
        return n;
      }
      if ('string' == typeof e) return e;
      throw new TypeError('Cannot format output');
    }
    function i(e) {
      for (
        var r = ['uint8array', 'text', 'hex', 'base64'], t = 0;
        t < r.length;
        t++
      )
        if (r[t] === e) return !0;
      return !1;
    }
    function l(e) {
      if (e) {
        if ('string' != typeof e)
          throw new TypeError(
            'When defined, the output format must be a string',
          );
        if (!i(e)) throw new Error(e + ' is not a supported output format');
      }
    }
    function u(e) {
      (this.length = e), (this.address = d(e));
    }
    function v(e) {
      var r = d(e.length);
      return t.HEAPU8.set(e, r), r;
    }
    function d(e) {
      var r = t._malloc(e);
      if (0 === r) throw { message: '_malloc() failed', length: e };
      return r;
    }
    function g(e) {
      if (e) for (var r = 0; r < e.length; r++) (a = e[r]), t._free(a);
      var a;
    }
    function b(e, r) {
      throw (g(e), new Error(r));
    }
    function f(e, r) {
      throw (g(e), new TypeError(r));
    }
    function m(e, r, t) {
      null == r && f(e, t + ' cannot be null or undefined');
    }
    function x(e, r, t) {
      return (
        m(e, r, t),
        r instanceof Uint8Array
          ? r
          : 'string' == typeof r
          ? n(r)
          : void f(e, 'unsupported input type for ' + t)
      );
    }
    function E(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = null;
      null != e &&
        ((o = v((e = x(c, e, 'secret_nonce')))), e.length, c.push(o)),
        (r = x(c, r, 'ciphertext'));
      var h,
        p = t._crypto_aead_chacha20poly1305_abytes(),
        i = r.length;
      i < p && f(c, 'ciphertext is too short'), (h = v(r)), c.push(h);
      var d = null,
        m = 0;
      null != a &&
        ((d = v((a = x(c, a, 'additional_data')))), (m = a.length), c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var E,
        k = 0 | t._crypto_aead_chacha20poly1305_npubbytes();
      _.length !== k && f(c, 'invalid public_nonce length'),
        (E = v(_)),
        c.push(E),
        (n = x(c, n, 'key'));
      var S,
        T = 0 | t._crypto_aead_chacha20poly1305_keybytes();
      n.length !== T && f(c, 'invalid key length'), (S = v(n)), c.push(S);
      var w = new u((i - t._crypto_aead_chacha20poly1305_abytes()) | 0),
        Y = w.address;
      if (
        (c.push(Y),
        0 ===
          t._crypto_aead_chacha20poly1305_decrypt(
            Y,
            null,
            o,
            h,
            i,
            0,
            d,
            m,
            0,
            E,
            S,
          ))
      ) {
        var B = y(w, s);
        return g(c), B;
      }
      b(c, 'ciphertext cannot be decrypted using that key');
    }
    function k(e, r, a, _, n, s, c) {
      var o = [];
      l(c);
      var h = null;
      null != e &&
        ((h = v((e = x(o, e, 'secret_nonce')))), e.length, o.push(h));
      var p = v((r = x(o, r, 'ciphertext'))),
        i = r.length;
      o.push(p), (a = x(o, a, 'mac'));
      var d,
        m = 0 | t._crypto_box_macbytes();
      a.length !== m && f(o, 'invalid mac length'), (d = v(a)), o.push(d);
      var E = null,
        k = 0;
      null != _ &&
        ((E = v((_ = x(o, _, 'additional_data')))), (k = _.length), o.push(E)),
        (n = x(o, n, 'public_nonce'));
      var S,
        T = 0 | t._crypto_aead_chacha20poly1305_npubbytes();
      n.length !== T && f(o, 'invalid public_nonce length'),
        (S = v(n)),
        o.push(S),
        (s = x(o, s, 'key'));
      var w,
        Y = 0 | t._crypto_aead_chacha20poly1305_keybytes();
      s.length !== Y && f(o, 'invalid key length'), (w = v(s)), o.push(w);
      var B = new u(0 | i),
        A = B.address;
      if (
        (o.push(A),
        0 ===
          t._crypto_aead_chacha20poly1305_decrypt_detached(
            A,
            h,
            p,
            i,
            0,
            d,
            E,
            k,
            0,
            S,
            w,
          ))
      ) {
        var K = y(B, c);
        return g(o), K;
      }
      b(o, 'ciphertext cannot be decrypted using that key');
    }
    function S(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'message'))),
        h = e.length;
      c.push(o);
      var p = null,
        i = 0;
      null != r &&
        ((p = v((r = x(c, r, 'additional_data')))), (i = r.length), c.push(p));
      var d = null;
      null != a &&
        ((d = v((a = x(c, a, 'secret_nonce')))), a.length, c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var m,
        E = 0 | t._crypto_aead_chacha20poly1305_npubbytes();
      _.length !== E && f(c, 'invalid public_nonce length'),
        (m = v(_)),
        c.push(m),
        (n = x(c, n, 'key'));
      var k,
        S = 0 | t._crypto_aead_chacha20poly1305_keybytes();
      n.length !== S && f(c, 'invalid key length'), (k = v(n)), c.push(k);
      var T = new u((h + t._crypto_aead_chacha20poly1305_abytes()) | 0),
        w = T.address;
      if (
        (c.push(w),
        0 ===
          t._crypto_aead_chacha20poly1305_encrypt(
            w,
            null,
            o,
            h,
            0,
            p,
            i,
            0,
            d,
            m,
            k,
          ))
      ) {
        var Y = y(T, s);
        return g(c), Y;
      }
      b(c, 'invalid usage');
    }
    function T(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'message'))),
        h = e.length;
      c.push(o);
      var p = null,
        i = 0;
      null != r &&
        ((p = v((r = x(c, r, 'additional_data')))), (i = r.length), c.push(p));
      var d = null;
      null != a &&
        ((d = v((a = x(c, a, 'secret_nonce')))), a.length, c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var m,
        E = 0 | t._crypto_aead_chacha20poly1305_npubbytes();
      _.length !== E && f(c, 'invalid public_nonce length'),
        (m = v(_)),
        c.push(m),
        (n = x(c, n, 'key'));
      var k,
        S = 0 | t._crypto_aead_chacha20poly1305_keybytes();
      n.length !== S && f(c, 'invalid key length'), (k = v(n)), c.push(k);
      var T = new u(0 | h),
        w = T.address;
      c.push(w);
      var Y = new u(0 | t._crypto_aead_chacha20poly1305_abytes()),
        B = Y.address;
      if (
        (c.push(B),
        0 ===
          t._crypto_aead_chacha20poly1305_encrypt_detached(
            w,
            B,
            null,
            o,
            h,
            0,
            p,
            i,
            0,
            d,
            m,
            k,
          ))
      ) {
        var A = y({ ciphertext: T, mac: Y }, s);
        return g(c), A;
      }
      b(c, 'invalid usage');
    }
    function w(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = null;
      null != e &&
        ((o = v((e = x(c, e, 'secret_nonce')))), e.length, c.push(o)),
        (r = x(c, r, 'ciphertext'));
      var h,
        p = t._crypto_aead_chacha20poly1305_ietf_abytes(),
        i = r.length;
      i < p && f(c, 'ciphertext is too short'), (h = v(r)), c.push(h);
      var d = null,
        m = 0;
      null != a &&
        ((d = v((a = x(c, a, 'additional_data')))), (m = a.length), c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var E,
        k = 0 | t._crypto_aead_chacha20poly1305_ietf_npubbytes();
      _.length !== k && f(c, 'invalid public_nonce length'),
        (E = v(_)),
        c.push(E),
        (n = x(c, n, 'key'));
      var S,
        T = 0 | t._crypto_aead_chacha20poly1305_ietf_keybytes();
      n.length !== T && f(c, 'invalid key length'), (S = v(n)), c.push(S);
      var w = new u((i - t._crypto_aead_chacha20poly1305_ietf_abytes()) | 0),
        Y = w.address;
      if (
        (c.push(Y),
        0 ===
          t._crypto_aead_chacha20poly1305_ietf_decrypt(
            Y,
            null,
            o,
            h,
            i,
            0,
            d,
            m,
            0,
            E,
            S,
          ))
      ) {
        var B = y(w, s);
        return g(c), B;
      }
      b(c, 'ciphertext cannot be decrypted using that key');
    }
    function Y(e, r, a, _, n, s, c) {
      var o = [];
      l(c);
      var h = null;
      null != e &&
        ((h = v((e = x(o, e, 'secret_nonce')))), e.length, o.push(h));
      var p = v((r = x(o, r, 'ciphertext'))),
        i = r.length;
      o.push(p), (a = x(o, a, 'mac'));
      var d,
        m = 0 | t._crypto_box_macbytes();
      a.length !== m && f(o, 'invalid mac length'), (d = v(a)), o.push(d);
      var E = null,
        k = 0;
      null != _ &&
        ((E = v((_ = x(o, _, 'additional_data')))), (k = _.length), o.push(E)),
        (n = x(o, n, 'public_nonce'));
      var S,
        T = 0 | t._crypto_aead_chacha20poly1305_ietf_npubbytes();
      n.length !== T && f(o, 'invalid public_nonce length'),
        (S = v(n)),
        o.push(S),
        (s = x(o, s, 'key'));
      var w,
        Y = 0 | t._crypto_aead_chacha20poly1305_ietf_keybytes();
      s.length !== Y && f(o, 'invalid key length'), (w = v(s)), o.push(w);
      var B = new u(0 | i),
        A = B.address;
      if (
        (o.push(A),
        0 ===
          t._crypto_aead_chacha20poly1305_ietf_decrypt_detached(
            A,
            h,
            p,
            i,
            0,
            d,
            E,
            k,
            0,
            S,
            w,
          ))
      ) {
        var K = y(B, c);
        return g(o), K;
      }
      b(o, 'ciphertext cannot be decrypted using that key');
    }
    function B(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'message'))),
        h = e.length;
      c.push(o);
      var p = null,
        i = 0;
      null != r &&
        ((p = v((r = x(c, r, 'additional_data')))), (i = r.length), c.push(p));
      var d = null;
      null != a &&
        ((d = v((a = x(c, a, 'secret_nonce')))), a.length, c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var m,
        E = 0 | t._crypto_aead_chacha20poly1305_ietf_npubbytes();
      _.length !== E && f(c, 'invalid public_nonce length'),
        (m = v(_)),
        c.push(m),
        (n = x(c, n, 'key'));
      var k,
        S = 0 | t._crypto_aead_chacha20poly1305_ietf_keybytes();
      n.length !== S && f(c, 'invalid key length'), (k = v(n)), c.push(k);
      var T = new u((h + t._crypto_aead_chacha20poly1305_ietf_abytes()) | 0),
        w = T.address;
      if (
        (c.push(w),
        0 ===
          t._crypto_aead_chacha20poly1305_ietf_encrypt(
            w,
            null,
            o,
            h,
            0,
            p,
            i,
            0,
            d,
            m,
            k,
          ))
      ) {
        var Y = y(T, s);
        return g(c), Y;
      }
      b(c, 'invalid usage');
    }
    function A(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'message'))),
        h = e.length;
      c.push(o);
      var p = null,
        i = 0;
      null != r &&
        ((p = v((r = x(c, r, 'additional_data')))), (i = r.length), c.push(p));
      var d = null;
      null != a &&
        ((d = v((a = x(c, a, 'secret_nonce')))), a.length, c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var m,
        E = 0 | t._crypto_aead_chacha20poly1305_ietf_npubbytes();
      _.length !== E && f(c, 'invalid public_nonce length'),
        (m = v(_)),
        c.push(m),
        (n = x(c, n, 'key'));
      var k,
        S = 0 | t._crypto_aead_chacha20poly1305_ietf_keybytes();
      n.length !== S && f(c, 'invalid key length'), (k = v(n)), c.push(k);
      var T = new u(0 | h),
        w = T.address;
      c.push(w);
      var Y = new u(0 | t._crypto_aead_chacha20poly1305_ietf_abytes()),
        B = Y.address;
      if (
        (c.push(B),
        0 ===
          t._crypto_aead_chacha20poly1305_ietf_encrypt_detached(
            w,
            B,
            null,
            o,
            h,
            0,
            p,
            i,
            0,
            d,
            m,
            k,
          ))
      ) {
        var A = y({ ciphertext: T, mac: Y }, s);
        return g(c), A;
      }
      b(c, 'invalid usage');
    }
    function K(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_aead_chacha20poly1305_ietf_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_aead_chacha20poly1305_ietf_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function M(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_aead_chacha20poly1305_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_aead_chacha20poly1305_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function I(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = null;
      null != e &&
        ((o = v((e = x(c, e, 'secret_nonce')))), e.length, c.push(o)),
        (r = x(c, r, 'ciphertext'));
      var h,
        p = t._crypto_aead_xchacha20poly1305_ietf_abytes(),
        i = r.length;
      i < p && f(c, 'ciphertext is too short'), (h = v(r)), c.push(h);
      var d = null,
        m = 0;
      null != a &&
        ((d = v((a = x(c, a, 'additional_data')))), (m = a.length), c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var E,
        k = 0 | t._crypto_aead_xchacha20poly1305_ietf_npubbytes();
      _.length !== k && f(c, 'invalid public_nonce length'),
        (E = v(_)),
        c.push(E),
        (n = x(c, n, 'key'));
      var S,
        T = 0 | t._crypto_aead_xchacha20poly1305_ietf_keybytes();
      n.length !== T && f(c, 'invalid key length'), (S = v(n)), c.push(S);
      var w = new u((i - t._crypto_aead_xchacha20poly1305_ietf_abytes()) | 0),
        Y = w.address;
      if (
        (c.push(Y),
        0 ===
          t._crypto_aead_xchacha20poly1305_ietf_decrypt(
            Y,
            null,
            o,
            h,
            i,
            0,
            d,
            m,
            0,
            E,
            S,
          ))
      ) {
        var B = y(w, s);
        return g(c), B;
      }
      b(c, 'ciphertext cannot be decrypted using that key');
    }
    function N(e, r, a, _, n, s, c) {
      var o = [];
      l(c);
      var h = null;
      null != e &&
        ((h = v((e = x(o, e, 'secret_nonce')))), e.length, o.push(h));
      var p = v((r = x(o, r, 'ciphertext'))),
        i = r.length;
      o.push(p), (a = x(o, a, 'mac'));
      var d,
        m = 0 | t._crypto_box_macbytes();
      a.length !== m && f(o, 'invalid mac length'), (d = v(a)), o.push(d);
      var E = null,
        k = 0;
      null != _ &&
        ((E = v((_ = x(o, _, 'additional_data')))), (k = _.length), o.push(E)),
        (n = x(o, n, 'public_nonce'));
      var S,
        T = 0 | t._crypto_aead_xchacha20poly1305_ietf_npubbytes();
      n.length !== T && f(o, 'invalid public_nonce length'),
        (S = v(n)),
        o.push(S),
        (s = x(o, s, 'key'));
      var w,
        Y = 0 | t._crypto_aead_xchacha20poly1305_ietf_keybytes();
      s.length !== Y && f(o, 'invalid key length'), (w = v(s)), o.push(w);
      var B = new u(0 | i),
        A = B.address;
      if (
        (o.push(A),
        0 ===
          t._crypto_aead_xchacha20poly1305_ietf_decrypt_detached(
            A,
            h,
            p,
            i,
            0,
            d,
            E,
            k,
            0,
            S,
            w,
          ))
      ) {
        var K = y(B, c);
        return g(o), K;
      }
      b(o, 'ciphertext cannot be decrypted using that key');
    }
    function L(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'message'))),
        h = e.length;
      c.push(o);
      var p = null,
        i = 0;
      null != r &&
        ((p = v((r = x(c, r, 'additional_data')))), (i = r.length), c.push(p));
      var d = null;
      null != a &&
        ((d = v((a = x(c, a, 'secret_nonce')))), a.length, c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var m,
        E = 0 | t._crypto_aead_xchacha20poly1305_ietf_npubbytes();
      _.length !== E && f(c, 'invalid public_nonce length'),
        (m = v(_)),
        c.push(m),
        (n = x(c, n, 'key'));
      var k,
        S = 0 | t._crypto_aead_xchacha20poly1305_ietf_keybytes();
      n.length !== S && f(c, 'invalid key length'), (k = v(n)), c.push(k);
      var T = new u((h + t._crypto_aead_xchacha20poly1305_ietf_abytes()) | 0),
        w = T.address;
      if (
        (c.push(w),
        0 ===
          t._crypto_aead_xchacha20poly1305_ietf_encrypt(
            w,
            null,
            o,
            h,
            0,
            p,
            i,
            0,
            d,
            m,
            k,
          ))
      ) {
        var Y = y(T, s);
        return g(c), Y;
      }
      b(c, 'invalid usage');
    }
    function U(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'message'))),
        h = e.length;
      c.push(o);
      var p = null,
        i = 0;
      null != r &&
        ((p = v((r = x(c, r, 'additional_data')))), (i = r.length), c.push(p));
      var d = null;
      null != a &&
        ((d = v((a = x(c, a, 'secret_nonce')))), a.length, c.push(d)),
        (_ = x(c, _, 'public_nonce'));
      var m,
        E = 0 | t._crypto_aead_xchacha20poly1305_ietf_npubbytes();
      _.length !== E && f(c, 'invalid public_nonce length'),
        (m = v(_)),
        c.push(m),
        (n = x(c, n, 'key'));
      var k,
        S = 0 | t._crypto_aead_xchacha20poly1305_ietf_keybytes();
      n.length !== S && f(c, 'invalid key length'), (k = v(n)), c.push(k);
      var T = new u(0 | h),
        w = T.address;
      c.push(w);
      var Y = new u(0 | t._crypto_aead_xchacha20poly1305_ietf_abytes()),
        B = Y.address;
      if (
        (c.push(B),
        0 ===
          t._crypto_aead_xchacha20poly1305_ietf_encrypt_detached(
            w,
            B,
            null,
            o,
            h,
            0,
            p,
            i,
            0,
            d,
            m,
            k,
          ))
      ) {
        var A = y({ ciphertext: T, mac: Y }, s);
        return g(c), A;
      }
      b(c, 'invalid usage');
    }
    function O(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_aead_xchacha20poly1305_ietf_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_aead_xchacha20poly1305_ietf_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function C(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_auth_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_auth_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_auth(p, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function R(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_auth_hmacsha256_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_auth_hmacsha256_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_auth_hmacsha256(p, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function P(e, r) {
      var a = [];
      l(r), m(a, e, 'state_address');
      var _ = new u(0 | t._crypto_auth_hmacsha256_bytes()),
        n = _.address;
      if ((a.push(n), 0 == (0 | t._crypto_auth_hmacsha256_final(e, n)))) {
        var s = (t._free(e), y(_, r));
        return g(a), s;
      }
      b(a, 'invalid usage');
    }
    function G(e, r) {
      var a = [];
      l(r);
      var _ = null,
        n = 0;
      null != e && ((_ = v((e = x(a, e, 'key')))), (n = e.length), a.push(_));
      var s = new u(208).address;
      if (0 == (0 | t._crypto_auth_hmacsha256_init(s, _, n))) {
        var c = s;
        return g(a), c;
      }
      b(a, 'invalid usage');
    }
    function X(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_auth_hmacsha256_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_auth_hmacsha256_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function D(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_auth_hmacsha256_update(e, n, s)) &&
          b(_, 'invalid usage'),
        g(_);
    }
    function F(e, r, a) {
      var _ = [];
      e = x(_, e, 'tag');
      var n,
        s = 0 | t._crypto_auth_hmacsha256_bytes();
      e.length !== s && f(_, 'invalid tag length'), (n = v(e)), _.push(n);
      var c = v((r = x(_, r, 'message'))),
        o = r.length;
      _.push(c), (a = x(_, a, 'key'));
      var h,
        p = 0 | t._crypto_auth_hmacsha256_keybytes();
      a.length !== p && f(_, 'invalid key length'), (h = v(a)), _.push(h);
      var y = 0 == (0 | t._crypto_auth_hmacsha256_verify(n, c, o, 0, h));
      return g(_), y;
    }
    function V(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_auth_hmacsha512_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_auth_hmacsha512_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_auth_hmacsha512(p, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function H(e, r) {
      var a = [];
      l(r), m(a, e, 'state_address');
      var _ = new u(0 | t._crypto_auth_hmacsha512_bytes()),
        n = _.address;
      if ((a.push(n), 0 == (0 | t._crypto_auth_hmacsha512_final(e, n)))) {
        var s = (t._free(e), y(_, r));
        return g(a), s;
      }
      b(a, 'invalid usage');
    }
    function q(e, r) {
      var a = [];
      l(r);
      var _ = null,
        n = 0;
      null != e && ((_ = v((e = x(a, e, 'key')))), (n = e.length), a.push(_));
      var s = new u(416).address;
      if (0 == (0 | t._crypto_auth_hmacsha512_init(s, _, n))) {
        var c = s;
        return g(a), c;
      }
      b(a, 'invalid usage');
    }
    function j(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_auth_hmacsha512_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_auth_hmacsha512_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function z(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_auth_hmacsha512_update(e, n, s)) &&
          b(_, 'invalid usage'),
        g(_);
    }
    function W(e, r, a) {
      var _ = [];
      e = x(_, e, 'tag');
      var n,
        s = 0 | t._crypto_auth_hmacsha512_bytes();
      e.length !== s && f(_, 'invalid tag length'), (n = v(e)), _.push(n);
      var c = v((r = x(_, r, 'message'))),
        o = r.length;
      _.push(c), (a = x(_, a, 'key'));
      var h,
        p = 0 | t._crypto_auth_hmacsha512_keybytes();
      a.length !== p && f(_, 'invalid key length'), (h = v(a)), _.push(h);
      var y = 0 == (0 | t._crypto_auth_hmacsha512_verify(n, c, o, 0, h));
      return g(_), y;
    }
    function J(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_auth_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_auth_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function Q(e, r, a) {
      var _ = [];
      e = x(_, e, 'tag');
      var n,
        s = 0 | t._crypto_auth_bytes();
      e.length !== s && f(_, 'invalid tag length'), (n = v(e)), _.push(n);
      var c = v((r = x(_, r, 'message'))),
        o = r.length;
      _.push(c), (a = x(_, a, 'key'));
      var h,
        p = 0 | t._crypto_auth_keybytes();
      a.length !== p && f(_, 'invalid key length'), (h = v(a)), _.push(h);
      var y = 0 == (0 | t._crypto_auth_verify(n, c, o, 0, h));
      return g(_), y;
    }
    function Z(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'publicKey'));
      var n,
        s = 0 | t._crypto_box_publickeybytes();
      e.length !== s && f(_, 'invalid publicKey length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'privateKey'));
      var c,
        o = 0 | t._crypto_box_secretkeybytes();
      r.length !== o && f(_, 'invalid privateKey length'),
        (c = v(r)),
        _.push(c);
      var h = new u(0 | t._crypto_box_beforenmbytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_box_beforenm(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function $(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'publicKey'));
      var n,
        s = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      e.length !== s && f(_, 'invalid publicKey length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'privateKey'));
      var c,
        o = 0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes();
      r.length !== o && f(_, 'invalid privateKey length'),
        (c = v(r)),
        _.push(c);
      var h = new u(
          0 | t._crypto_box_curve25519xchacha20poly1305_beforenmbytes(),
        ),
        p = h.address;
      if (
        (_.push(p),
        0 == (0 | t._crypto_box_curve25519xchacha20poly1305_beforenm(p, n, c)))
      ) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function ee(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        (a = x(s, a, 'publicKey'));
      var i,
        d = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      a.length !== d && f(s, 'invalid publicKey length'),
        (i = v(a)),
        s.push(i),
        (_ = x(s, _, 'privateKey'));
      var m,
        E = 0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes();
      _.length !== E && f(s, 'invalid privateKey length'),
        (m = v(_)),
        s.push(m);
      var k = new u(0 | o),
        S = k.address;
      s.push(S);
      var T = new u(0 | t._crypto_box_curve25519xchacha20poly1305_macbytes()),
        w = T.address;
      if (
        (s.push(w),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_detached(
              S,
              w,
              c,
              o,
              0,
              h,
              i,
              m,
            )))
      ) {
        var Y = y({ ciphertext: k, mac: T }, n);
        return g(s), Y;
      }
      b(s, 'invalid usage');
    }
    function re(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'sharedKey'));
      var p,
        i = 0 | t._crypto_box_curve25519xchacha20poly1305_beforenmbytes();
      a.length !== i && f(n, 'invalid sharedKey length'), (p = v(a)), n.push(p);
      var d = new u(0 | c),
        m = d.address;
      n.push(m);
      var E = new u(0 | t._crypto_box_curve25519xchacha20poly1305_macbytes()),
        k = E.address;
      if (
        (n.push(k),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_detached_afternm(
              m,
              k,
              s,
              c,
              0,
              o,
              p,
            )))
      ) {
        var S = y({ ciphertext: d, mac: E }, _);
        return g(n), S;
      }
      b(n, 'invalid usage');
    }
    function te(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        (a = x(s, a, 'publicKey'));
      var i,
        d = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      a.length !== d && f(s, 'invalid publicKey length'),
        (i = v(a)),
        s.push(i),
        (_ = x(s, _, 'privateKey'));
      var m,
        E = 0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes();
      _.length !== E && f(s, 'invalid privateKey length'),
        (m = v(_)),
        s.push(m);
      var k = new u(
          (o + t._crypto_box_curve25519xchacha20poly1305_macbytes()) | 0,
        ),
        S = k.address;
      if (
        (s.push(S),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_easy(
              S,
              c,
              o,
              0,
              h,
              i,
              m,
            )))
      ) {
        var T = y(k, n);
        return g(s), T;
      }
      b(s, 'invalid usage');
    }
    function ae(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'sharedKey'));
      var p,
        i = 0 | t._crypto_box_curve25519xchacha20poly1305_beforenmbytes();
      a.length !== i && f(n, 'invalid sharedKey length'), (p = v(a)), n.push(p);
      var d = new u(
          (c + t._crypto_box_curve25519xchacha20poly1305_macbytes()) | 0,
        ),
        m = d.address;
      if (
        (n.push(m),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_easy_afternm(
              m,
              s,
              c,
              0,
              o,
              p,
            )))
      ) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'invalid usage');
    }
    function _e(e) {
      var r = [];
      l(e);
      var a = new u(
          0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes(),
        ),
        _ = a.address;
      r.push(_);
      var n = new u(
          0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes(),
        ),
        s = n.address;
      r.push(s), t._crypto_box_curve25519xchacha20poly1305_keypair(_, s);
      var c = y({ publicKey: a, privateKey: n, keyType: 'curve25519' }, e);
      return g(r), c;
    }
    function ne(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'ciphertext'))),
        h = e.length;
      c.push(o), (r = x(c, r, 'mac'));
      var p,
        i = 0 | t._crypto_box_curve25519xchacha20poly1305_macbytes();
      r.length !== i && f(c, 'invalid mac length'),
        (p = v(r)),
        c.push(p),
        (a = x(c, a, 'nonce'));
      var d,
        m = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      a.length !== m && f(c, 'invalid nonce length'),
        (d = v(a)),
        c.push(d),
        (_ = x(c, _, 'publicKey'));
      var E,
        k = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      _.length !== k && f(c, 'invalid publicKey length'),
        (E = v(_)),
        c.push(E),
        (n = x(c, n, 'privateKey'));
      var S,
        T = 0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes();
      n.length !== T && f(c, 'invalid privateKey length'),
        (S = v(n)),
        c.push(S);
      var w = new u(0 | h),
        Y = w.address;
      if (
        (c.push(Y),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_open_detached(
              Y,
              o,
              p,
              h,
              0,
              d,
              E,
              S,
            )))
      ) {
        var B = y(w, s);
        return g(c), B;
      }
      b(c, 'incorrect key pair for the given ciphertext');
    }
    function se(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'ciphertext'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'mac'));
      var h,
        p = 0 | t._crypto_box_curve25519xchacha20poly1305_macbytes();
      r.length !== p && f(s, 'invalid mac length'),
        (h = v(r)),
        s.push(h),
        (a = x(s, a, 'nonce'));
      var i,
        d = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      a.length !== d && f(s, 'invalid nonce length'),
        (i = v(a)),
        s.push(i),
        (_ = x(s, _, 'sharedKey'));
      var m,
        E = 0 | t._crypto_box_curve25519xchacha20poly1305_beforenmbytes();
      _.length !== E && f(s, 'invalid sharedKey length'), (m = v(_)), s.push(m);
      var k = new u(0 | o),
        S = k.address;
      if (
        (s.push(S),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_open_detached_afternm(
              S,
              c,
              h,
              o,
              0,
              i,
              m,
            )))
      ) {
        var T = y(k, n);
        return g(s), T;
      }
      b(s, 'incorrect secret key for the given ciphertext');
    }
    function ce(e, r, a, _, n) {
      var s = [];
      l(n), (e = x(s, e, 'ciphertext'));
      var c,
        o = t._crypto_box_curve25519xchacha20poly1305_macbytes(),
        h = e.length;
      h < o && f(s, 'ciphertext is too short'),
        (c = v(e)),
        s.push(c),
        (r = x(s, r, 'nonce'));
      var p,
        i = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      r.length !== i && f(s, 'invalid nonce length'),
        (p = v(r)),
        s.push(p),
        (a = x(s, a, 'publicKey'));
      var d,
        m = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      a.length !== m && f(s, 'invalid publicKey length'),
        (d = v(a)),
        s.push(d),
        (_ = x(s, _, 'privateKey'));
      var E,
        k = 0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes();
      _.length !== k && f(s, 'invalid privateKey length'),
        (E = v(_)),
        s.push(E);
      var S = new u(
          (h - t._crypto_box_curve25519xchacha20poly1305_macbytes()) | 0,
        ),
        T = S.address;
      if (
        (s.push(T),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_open_easy(
              T,
              c,
              h,
              0,
              p,
              d,
              E,
            )))
      ) {
        var w = y(S, n);
        return g(s), w;
      }
      b(s, 'incorrect key pair for the given ciphertext');
    }
    function oe(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'ciphertext'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_box_curve25519xchacha20poly1305_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'sharedKey'));
      var p,
        i = 0 | t._crypto_box_curve25519xchacha20poly1305_beforenmbytes();
      a.length !== i && f(n, 'invalid sharedKey length'), (p = v(a)), n.push(p);
      var d = new u(
          (c - t._crypto_box_curve25519xchacha20poly1305_macbytes()) | 0,
        ),
        m = d.address;
      if (
        (n.push(m),
        0 ==
          (0 |
            t._crypto_box_curve25519xchacha20poly1305_open_easy_afternm(
              m,
              s,
              c,
              0,
              o,
              p,
            )))
      ) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'incorrect secret key for the given ciphertext');
    }
    function he(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'publicKey'));
      var c,
        o = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      r.length !== o && f(_, 'invalid publicKey length'), (c = v(r)), _.push(c);
      var h = new u(
          (s + t._crypto_box_curve25519xchacha20poly1305_sealbytes()) | 0,
        ),
        p = h.address;
      _.push(p), t._crypto_box_curve25519xchacha20poly1305_seal(p, n, s, 0, c);
      var i = y(h, a);
      return g(_), i;
    }
    function pe(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'ciphertext'));
      var s,
        c = t._crypto_box_curve25519xchacha20poly1305_sealbytes(),
        o = e.length;
      o < c && f(n, 'ciphertext is too short'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'publicKey'));
      var h,
        p = 0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes();
      r.length !== p && f(n, 'invalid publicKey length'),
        (h = v(r)),
        n.push(h),
        (a = x(n, a, 'secretKey'));
      var i,
        d = 0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes();
      a.length !== d && f(n, 'invalid secretKey length'), (i = v(a)), n.push(i);
      var b = new u(
          (o - t._crypto_box_curve25519xchacha20poly1305_sealbytes()) | 0,
        ),
        m = b.address;
      n.push(m),
        t._crypto_box_curve25519xchacha20poly1305_seal_open(m, s, o, 0, h, i);
      var E = y(b, _);
      return g(n), E;
    }
    function ye(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'seed'));
      var _,
        n = 0 | t._crypto_box_curve25519xchacha20poly1305_seedbytes();
      e.length !== n && f(a, 'invalid seed length'), (_ = v(e)), a.push(_);
      var s = new u(
          0 | t._crypto_box_curve25519xchacha20poly1305_publickeybytes(),
        ),
        c = s.address;
      a.push(c);
      var o = new u(
          0 | t._crypto_box_curve25519xchacha20poly1305_secretkeybytes(),
        ),
        h = o.address;
      if (
        (a.push(h),
        0 ==
          (0 | t._crypto_box_curve25519xchacha20poly1305_seed_keypair(c, h, _)))
      ) {
        var p = { publicKey: y(s, r), privateKey: y(o, r), keyType: 'x25519' };
        return g(a), p;
      }
      b(a, 'invalid usage');
    }
    function ie(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_box_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        (a = x(s, a, 'publicKey'));
      var i,
        d = 0 | t._crypto_box_publickeybytes();
      a.length !== d && f(s, 'invalid publicKey length'),
        (i = v(a)),
        s.push(i),
        (_ = x(s, _, 'privateKey'));
      var m,
        E = 0 | t._crypto_box_secretkeybytes();
      _.length !== E && f(s, 'invalid privateKey length'),
        (m = v(_)),
        s.push(m);
      var k = new u(0 | o),
        S = k.address;
      s.push(S);
      var T = new u(0 | t._crypto_box_macbytes()),
        w = T.address;
      if (
        (s.push(w), 0 == (0 | t._crypto_box_detached(S, w, c, o, 0, h, i, m)))
      ) {
        var Y = y({ ciphertext: k, mac: T }, n);
        return g(s), Y;
      }
      b(s, 'invalid usage');
    }
    function le(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_box_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        (a = x(s, a, 'publicKey'));
      var i,
        d = 0 | t._crypto_box_publickeybytes();
      a.length !== d && f(s, 'invalid publicKey length'),
        (i = v(a)),
        s.push(i),
        (_ = x(s, _, 'privateKey'));
      var m,
        E = 0 | t._crypto_box_secretkeybytes();
      _.length !== E && f(s, 'invalid privateKey length'),
        (m = v(_)),
        s.push(m);
      var k = new u((o + t._crypto_box_macbytes()) | 0),
        S = k.address;
      if ((s.push(S), 0 == (0 | t._crypto_box_easy(S, c, o, 0, h, i, m)))) {
        var T = y(k, n);
        return g(s), T;
      }
      b(s, 'invalid usage');
    }
    function ue(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_box_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'sharedKey'));
      var p,
        i = 0 | t._crypto_box_beforenmbytes();
      a.length !== i && f(n, 'invalid sharedKey length'), (p = v(a)), n.push(p);
      var d = new u((c + t._crypto_box_macbytes()) | 0),
        m = d.address;
      if (
        (n.push(m), 0 == (0 | t._crypto_box_easy_afternm(m, s, c, 0, o, p)))
      ) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'invalid usage');
    }
    function ve(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_box_publickeybytes()),
        _ = a.address;
      r.push(_);
      var n = new u(0 | t._crypto_box_secretkeybytes()),
        s = n.address;
      if ((r.push(s), 0 == (0 | t._crypto_box_keypair(_, s)))) {
        var c = { publicKey: y(a, e), privateKey: y(n, e), keyType: 'x25519' };
        return g(r), c;
      }
      b(r, 'internal error');
    }
    function de(e, r, a, _, n, s) {
      var c = [];
      l(s);
      var o = v((e = x(c, e, 'ciphertext'))),
        h = e.length;
      c.push(o), (r = x(c, r, 'mac'));
      var p,
        i = 0 | t._crypto_box_macbytes();
      r.length !== i && f(c, 'invalid mac length'),
        (p = v(r)),
        c.push(p),
        (a = x(c, a, 'nonce'));
      var d,
        m = 0 | t._crypto_box_noncebytes();
      a.length !== m && f(c, 'invalid nonce length'),
        (d = v(a)),
        c.push(d),
        (_ = x(c, _, 'publicKey'));
      var E,
        k = 0 | t._crypto_box_publickeybytes();
      _.length !== k && f(c, 'invalid publicKey length'),
        (E = v(_)),
        c.push(E),
        (n = x(c, n, 'privateKey'));
      var S,
        T = 0 | t._crypto_box_secretkeybytes();
      n.length !== T && f(c, 'invalid privateKey length'),
        (S = v(n)),
        c.push(S);
      var w = new u(0 | h),
        Y = w.address;
      if (
        (c.push(Y),
        0 == (0 | t._crypto_box_open_detached(Y, o, p, h, 0, d, E, S)))
      ) {
        var B = y(w, s);
        return g(c), B;
      }
      b(c, 'incorrect key pair for the given ciphertext');
    }
    function ge(e, r, a, _, n) {
      var s = [];
      l(n), (e = x(s, e, 'ciphertext'));
      var c,
        o = t._crypto_box_macbytes(),
        h = e.length;
      h < o && f(s, 'ciphertext is too short'),
        (c = v(e)),
        s.push(c),
        (r = x(s, r, 'nonce'));
      var p,
        i = 0 | t._crypto_box_noncebytes();
      r.length !== i && f(s, 'invalid nonce length'),
        (p = v(r)),
        s.push(p),
        (a = x(s, a, 'publicKey'));
      var d,
        m = 0 | t._crypto_box_publickeybytes();
      a.length !== m && f(s, 'invalid publicKey length'),
        (d = v(a)),
        s.push(d),
        (_ = x(s, _, 'privateKey'));
      var E,
        k = 0 | t._crypto_box_secretkeybytes();
      _.length !== k && f(s, 'invalid privateKey length'),
        (E = v(_)),
        s.push(E);
      var S = new u((h - t._crypto_box_macbytes()) | 0),
        T = S.address;
      if (
        (s.push(T), 0 == (0 | t._crypto_box_open_easy(T, c, h, 0, p, d, E)))
      ) {
        var w = y(S, n);
        return g(s), w;
      }
      b(s, 'incorrect key pair for the given ciphertext');
    }
    function be(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'ciphertext'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_box_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'sharedKey'));
      var p,
        i = 0 | t._crypto_box_beforenmbytes();
      a.length !== i && f(n, 'invalid sharedKey length'), (p = v(a)), n.push(p);
      var d = new u((c - t._crypto_box_macbytes()) | 0),
        m = d.address;
      if (
        (n.push(m),
        0 == (0 | t._crypto_box_open_easy_afternm(m, s, c, 0, o, p)))
      ) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'incorrect secret key for the given ciphertext');
    }
    function fe(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'publicKey'));
      var c,
        o = 0 | t._crypto_box_publickeybytes();
      r.length !== o && f(_, 'invalid publicKey length'), (c = v(r)), _.push(c);
      var h = new u((s + t._crypto_box_sealbytes()) | 0),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_box_seal(p, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function me(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'ciphertext'));
      var s,
        c = t._crypto_box_sealbytes(),
        o = e.length;
      o < c && f(n, 'ciphertext is too short'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'publicKey'));
      var h,
        p = 0 | t._crypto_box_publickeybytes();
      r.length !== p && f(n, 'invalid publicKey length'),
        (h = v(r)),
        n.push(h),
        (a = x(n, a, 'privateKey'));
      var i,
        d = 0 | t._crypto_box_secretkeybytes();
      a.length !== d && f(n, 'invalid privateKey length'),
        (i = v(a)),
        n.push(i);
      var m = new u((o - t._crypto_box_sealbytes()) | 0),
        E = m.address;
      if ((n.push(E), 0 == (0 | t._crypto_box_seal_open(E, s, o, 0, h, i)))) {
        var k = y(m, _);
        return g(n), k;
      }
      b(n, 'incorrect key pair for the given ciphertext');
    }
    function xe(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'seed'));
      var _,
        n = 0 | t._crypto_box_seedbytes();
      e.length !== n && f(a, 'invalid seed length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_box_publickeybytes()),
        c = s.address;
      a.push(c);
      var o = new u(0 | t._crypto_box_secretkeybytes()),
        h = o.address;
      if ((a.push(h), 0 == (0 | t._crypto_box_seed_keypair(c, h, _)))) {
        var p = { publicKey: y(s, r), privateKey: y(o, r), keyType: 'x25519' };
        return g(a), p;
      }
      b(a, 'invalid usage');
    }
    function Ee(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'p'));
      var n,
        s = 0 | t._crypto_core_ed25519_bytes();
      e.length !== s && f(_, 'invalid p length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'q'));
      var c,
        o = 0 | t._crypto_core_ed25519_bytes();
      r.length !== o && f(_, 'invalid q length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ed25519_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_core_ed25519_add(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'input is an invalid element');
    }
    function ke(e, r) {
      var a = [];
      l(r);
      var _ = v((e = x(a, e, 'r')));
      e.length, a.push(_);
      var n = new u(0 | t._crypto_core_ed25519_bytes()),
        s = n.address;
      if ((a.push(s), 0 == (0 | t._crypto_core_ed25519_from_hash(s, _)))) {
        var c = y(n, r);
        return g(a), c;
      }
      b(a, 'invalid usage');
    }
    function Se(e, r) {
      var a = [];
      l(r);
      var _ = v((e = x(a, e, 'r')));
      e.length, a.push(_);
      var n = new u(0 | t._crypto_core_ed25519_bytes()),
        s = n.address;
      if ((a.push(s), 0 == (0 | t._crypto_core_ed25519_from_uniform(s, _)))) {
        var c = y(n, r);
        return g(a), c;
      }
      b(a, 'invalid usage');
    }
    function Te(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'repr'));
      var _,
        n = 0 | t._crypto_core_ed25519_bytes();
      e.length !== n && f(a, 'invalid repr length'), (_ = v(e)), a.push(_);
      var s = 1 == (0 | t._crypto_core_ed25519_is_valid_point(_));
      return g(a), s;
    }
    function we(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_core_ed25519_bytes()),
        _ = a.address;
      r.push(_), t._crypto_core_ed25519_random(_);
      var n = y(a, e);
      return g(r), n;
    }
    function Ye(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'x'));
      var n,
        s = 0 | t._crypto_core_ed25519_scalarbytes();
      e.length !== s && f(_, 'invalid x length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'y'));
      var c,
        o = 0 | t._crypto_core_ed25519_scalarbytes();
      r.length !== o && f(_, 'invalid y length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        p = h.address;
      _.push(p), t._crypto_core_ed25519_scalar_add(p, n, c);
      var i = y(h, a);
      return g(_), i;
    }
    function Be(e, r) {
      var a = [];
      l(r), (e = x(a, e, 's'));
      var _,
        n = 0 | t._crypto_core_ed25519_scalarbytes();
      e.length !== n && f(a, 'invalid s length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        c = s.address;
      a.push(c), t._crypto_core_ed25519_scalar_complement(c, _);
      var o = y(s, r);
      return g(a), o;
    }
    function Ae(e, r) {
      var a = [];
      l(r), (e = x(a, e, 's'));
      var _,
        n = 0 | t._crypto_core_ed25519_scalarbytes();
      e.length !== n && f(a, 'invalid s length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_core_ed25519_scalar_invert(c, _)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid reciprocate');
    }
    function Ke(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'x'));
      var n,
        s = 0 | t._crypto_core_ed25519_scalarbytes();
      e.length !== s && f(_, 'invalid x length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'y'));
      var c,
        o = 0 | t._crypto_core_ed25519_scalarbytes();
      r.length !== o && f(_, 'invalid y length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        p = h.address;
      _.push(p), t._crypto_core_ed25519_scalar_mul(p, n, c);
      var i = y(h, a);
      return g(_), i;
    }
    function Me(e, r) {
      var a = [];
      l(r), (e = x(a, e, 's'));
      var _,
        n = 0 | t._crypto_core_ed25519_scalarbytes();
      e.length !== n && f(a, 'invalid s length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        c = s.address;
      a.push(c), t._crypto_core_ed25519_scalar_negate(c, _);
      var o = y(s, r);
      return g(a), o;
    }
    function Ie(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        _ = a.address;
      r.push(_), t._crypto_core_ed25519_scalar_random(_);
      var n = y(a, e);
      return g(r), n;
    }
    function Ne(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'sample'));
      var _,
        n = 0 | t._crypto_core_ed25519_nonreducedscalarbytes();
      e.length !== n && f(a, 'invalid sample length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        c = s.address;
      a.push(c), t._crypto_core_ed25519_scalar_reduce(c, _);
      var o = y(s, r);
      return g(a), o;
    }
    function Le(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'x'));
      var n,
        s = 0 | t._crypto_core_ed25519_scalarbytes();
      e.length !== s && f(_, 'invalid x length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'y'));
      var c,
        o = 0 | t._crypto_core_ed25519_scalarbytes();
      r.length !== o && f(_, 'invalid y length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ed25519_scalarbytes()),
        p = h.address;
      _.push(p), t._crypto_core_ed25519_scalar_sub(p, n, c);
      var i = y(h, a);
      return g(_), i;
    }
    function Ue(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'p'));
      var n,
        s = 0 | t._crypto_core_ed25519_bytes();
      e.length !== s && f(_, 'invalid p length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'q'));
      var c,
        o = 0 | t._crypto_core_ed25519_bytes();
      r.length !== o && f(_, 'invalid q length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ed25519_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_core_ed25519_sub(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'input is an invalid element');
    }
    function Oe(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'input'));
      var s,
        c = 0 | t._crypto_core_hchacha20_inputbytes();
      e.length !== c && f(n, 'invalid input length'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'privateKey'));
      var o,
        h = 0 | t._crypto_core_hchacha20_keybytes();
      r.length !== h && f(n, 'invalid privateKey length'),
        (o = v(r)),
        n.push(o);
      var p = null;
      null != a && ((p = v((a = x(n, a, 'constant')))), a.length, n.push(p));
      var i = new u(0 | t._crypto_core_hchacha20_outputbytes()),
        d = i.address;
      if ((n.push(d), 0 == (0 | t._crypto_core_hchacha20(d, s, o, p)))) {
        var m = y(i, _);
        return g(n), m;
      }
      b(n, 'invalid usage');
    }
    function Ce(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'input'));
      var s,
        c = 0 | t._crypto_core_hsalsa20_inputbytes();
      e.length !== c && f(n, 'invalid input length'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'privateKey'));
      var o,
        h = 0 | t._crypto_core_hsalsa20_keybytes();
      r.length !== h && f(n, 'invalid privateKey length'),
        (o = v(r)),
        n.push(o);
      var p = null;
      null != a && ((p = v((a = x(n, a, 'constant')))), a.length, n.push(p));
      var i = new u(0 | t._crypto_core_hsalsa20_outputbytes()),
        d = i.address;
      if ((n.push(d), 0 == (0 | t._crypto_core_hsalsa20(d, s, o, p)))) {
        var m = y(i, _);
        return g(n), m;
      }
      b(n, 'invalid usage');
    }
    function Re(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'p'));
      var n,
        s = 0 | t._crypto_core_ristretto255_bytes();
      e.length !== s && f(_, 'invalid p length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'q'));
      var c,
        o = 0 | t._crypto_core_ristretto255_bytes();
      r.length !== o && f(_, 'invalid q length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ristretto255_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_core_ristretto255_add(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'input is an invalid element');
    }
    function Pe(e, r) {
      var a = [];
      l(r);
      var _ = v((e = x(a, e, 'r')));
      e.length, a.push(_);
      var n = new u(0 | t._crypto_core_ristretto255_bytes()),
        s = n.address;
      if ((a.push(s), 0 == (0 | t._crypto_core_ristretto255_from_hash(s, _)))) {
        var c = y(n, r);
        return g(a), c;
      }
      b(a, 'invalid usage');
    }
    function Ge(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'repr'));
      var _,
        n = 0 | t._crypto_core_ristretto255_bytes();
      e.length !== n && f(a, 'invalid repr length'), (_ = v(e)), a.push(_);
      var s = 1 == (0 | t._crypto_core_ristretto255_is_valid_point(_));
      return g(a), s;
    }
    function Xe(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_core_ristretto255_bytes()),
        _ = a.address;
      r.push(_), t._crypto_core_ristretto255_random(_);
      var n = y(a, e);
      return g(r), n;
    }
    function De(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'x'));
      var n,
        s = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== s && f(_, 'invalid x length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'y'));
      var c,
        o = 0 | t._crypto_core_ristretto255_scalarbytes();
      r.length !== o && f(_, 'invalid y length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        p = h.address;
      _.push(p), t._crypto_core_ristretto255_scalar_add(p, n, c);
      var i = y(h, a);
      return g(_), i;
    }
    function Fe(e, r) {
      var a = [];
      l(r), (e = x(a, e, 's'));
      var _,
        n = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== n && f(a, 'invalid s length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        c = s.address;
      a.push(c), t._crypto_core_ristretto255_scalar_complement(c, _);
      var o = y(s, r);
      return g(a), o;
    }
    function Ve(e, r) {
      var a = [];
      l(r), (e = x(a, e, 's'));
      var _,
        n = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== n && f(a, 'invalid s length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        c = s.address;
      if (
        (a.push(c), 0 == (0 | t._crypto_core_ristretto255_scalar_invert(c, _)))
      ) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid reciprocate');
    }
    function He(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'x'));
      var n,
        s = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== s && f(_, 'invalid x length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'y'));
      var c,
        o = 0 | t._crypto_core_ristretto255_scalarbytes();
      r.length !== o && f(_, 'invalid y length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        p = h.address;
      _.push(p), t._crypto_core_ristretto255_scalar_mul(p, n, c);
      var i = y(h, a);
      return g(_), i;
    }
    function qe(e, r) {
      var a = [];
      l(r), (e = x(a, e, 's'));
      var _,
        n = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== n && f(a, 'invalid s length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        c = s.address;
      a.push(c), t._crypto_core_ristretto255_scalar_negate(c, _);
      var o = y(s, r);
      return g(a), o;
    }
    function je(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        _ = a.address;
      r.push(_), t._crypto_core_ristretto255_scalar_random(_);
      var n = y(a, e);
      return g(r), n;
    }
    function ze(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'sample'));
      var _,
        n = 0 | t._crypto_core_ristretto255_nonreducedscalarbytes();
      e.length !== n && f(a, 'invalid sample length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        c = s.address;
      a.push(c), t._crypto_core_ristretto255_scalar_reduce(c, _);
      var o = y(s, r);
      return g(a), o;
    }
    function We(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'x'));
      var n,
        s = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== s && f(_, 'invalid x length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'y'));
      var c,
        o = 0 | t._crypto_core_ristretto255_scalarbytes();
      r.length !== o && f(_, 'invalid y length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ristretto255_scalarbytes()),
        p = h.address;
      _.push(p), t._crypto_core_ristretto255_scalar_sub(p, n, c);
      var i = y(h, a);
      return g(_), i;
    }
    function Je(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'p'));
      var n,
        s = 0 | t._crypto_core_ristretto255_bytes();
      e.length !== s && f(_, 'invalid p length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'q'));
      var c,
        o = 0 | t._crypto_core_ristretto255_bytes();
      r.length !== o && f(_, 'invalid q length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_core_ristretto255_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_core_ristretto255_sub(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'input is an invalid element');
    }
    function Qe(e, r, a, _) {
      var n = [];
      l(_),
        m(n, e, 'hash_length'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(n, 'hash_length must be an unsigned integer');
      var s = v((r = x(n, r, 'message'))),
        c = r.length;
      n.push(s);
      var o = null,
        h = 0;
      null != a && ((o = v((a = x(n, a, 'key')))), (h = a.length), n.push(o));
      var p = new u((e |= 0)),
        i = p.address;
      if ((n.push(i), 0 == (0 | t._crypto_generichash(i, e, s, c, 0, o, h)))) {
        var d = y(p, _);
        return g(n), d;
      }
      b(n, 'invalid usage');
    }
    function Ze(e, r, a, _, n) {
      var s = [];
      l(n),
        m(s, e, 'subkey_len'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(s, 'subkey_len must be an unsigned integer');
      var c = null,
        o = 0;
      null != r && ((c = v((r = x(s, r, 'key')))), (o = r.length), s.push(c));
      var h = null,
        p = 0;
      null != a &&
        ((a = x(s, a, 'id')),
        (p = 0 | t._crypto_generichash_blake2b_saltbytes()),
        a.length !== p && f(s, 'invalid id length'),
        (h = v(a)),
        s.push(h));
      var i = null,
        d = 0;
      null != _ &&
        ((_ = x(s, _, 'ctx')),
        (d = 0 | t._crypto_generichash_blake2b_personalbytes()),
        _.length !== d && f(s, 'invalid ctx length'),
        (i = v(_)),
        s.push(i));
      var E = new u(0 | e),
        k = E.address;
      if (
        (s.push(k),
        0 ==
          (0 |
            t._crypto_generichash_blake2b_salt_personal(
              k,
              e,
              null,
              0,
              0,
              c,
              o,
              h,
              i,
            )))
      ) {
        var S = y(E, n);
        return g(s), S;
      }
      b(s, 'invalid usage');
    }
    function $e(e, r, a) {
      var _ = [];
      l(a),
        m(_, e, 'state_address'),
        m(_, r, 'hash_length'),
        ('number' != typeof r || (0 | r) !== r || r < 0) &&
          f(_, 'hash_length must be an unsigned integer');
      var n = new u((r |= 0)),
        s = n.address;
      if ((_.push(s), 0 == (0 | t._crypto_generichash_final(e, s, r)))) {
        var c = (t._free(e), y(n, a));
        return g(_), c;
      }
      b(_, 'invalid usage');
    }
    function er(e, r, a) {
      var _ = [];
      l(a);
      var n = null,
        s = 0;
      null != e && ((n = v((e = x(_, e, 'key')))), (s = e.length), _.push(n)),
        m(_, r, 'hash_length'),
        ('number' != typeof r || (0 | r) !== r || r < 0) &&
          f(_, 'hash_length must be an unsigned integer');
      var c = new u(357).address;
      if (0 == (0 | t._crypto_generichash_init(c, n, s, r))) {
        var o = c;
        return g(_), o;
      }
      b(_, 'invalid usage');
    }
    function rr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_generichash_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_generichash_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function tr(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_generichash_update(e, n, s)) &&
          b(_, 'invalid usage'),
        g(_);
    }
    function ar(e, r) {
      var a = [];
      l(r);
      var _ = v((e = x(a, e, 'message'))),
        n = e.length;
      a.push(_);
      var s = new u(0 | t._crypto_hash_bytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_hash(c, _, n, 0)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid usage');
    }
    function _r(e, r) {
      var a = [];
      l(r);
      var _ = v((e = x(a, e, 'message'))),
        n = e.length;
      a.push(_);
      var s = new u(0 | t._crypto_hash_sha256_bytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_hash_sha256(c, _, n, 0)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid usage');
    }
    function nr(e, r) {
      var a = [];
      l(r), m(a, e, 'state_address');
      var _ = new u(0 | t._crypto_hash_sha256_bytes()),
        n = _.address;
      if ((a.push(n), 0 == (0 | t._crypto_hash_sha256_final(e, n)))) {
        var s = (t._free(e), y(_, r));
        return g(a), s;
      }
      b(a, 'invalid usage');
    }
    function sr(e) {
      var r = [];
      l(e);
      var a = new u(104).address;
      if (0 == (0 | t._crypto_hash_sha256_init(a))) {
        var _ = a;
        return g(r), _;
      }
      b(r, 'invalid usage');
    }
    function cr(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_hash_sha256_update(e, n, s)) &&
          b(_, 'invalid usage'),
        g(_);
    }
    function or(e, r) {
      var a = [];
      l(r);
      var _ = v((e = x(a, e, 'message'))),
        n = e.length;
      a.push(_);
      var s = new u(0 | t._crypto_hash_sha512_bytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_hash_sha512(c, _, n, 0)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid usage');
    }
    function hr(e, r) {
      var a = [];
      l(r), m(a, e, 'state_address');
      var _ = new u(0 | t._crypto_hash_sha512_bytes()),
        n = _.address;
      if ((a.push(n), 0 == (0 | t._crypto_hash_sha512_final(e, n)))) {
        var s = (t._free(e), y(_, r));
        return g(a), s;
      }
      b(a, 'invalid usage');
    }
    function pr(e) {
      var r = [];
      l(e);
      var a = new u(208).address;
      if (0 == (0 | t._crypto_hash_sha512_init(a))) {
        var _ = a;
        return g(r), _;
      }
      b(r, 'invalid usage');
    }
    function yr(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_hash_sha512_update(e, n, s)) &&
          b(_, 'invalid usage'),
        g(_);
    }
    function ir(e, r, a, _, s) {
      var c = [];
      l(s),
        m(c, e, 'subkey_len'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(c, 'subkey_len must be an unsigned integer'),
        m(c, r, 'subkey_id'),
        ('number' != typeof r || (0 | r) !== r || r < 0) &&
          f(c, 'subkey_id must be an unsigned integer'),
        'string' != typeof a && f(c, 'ctx must be a string'),
        (a = n(a + '\0')),
        null != h && a.length - 1 !== h && f(c, 'invalid ctx length');
      var o = v(a),
        h = a.length - 1;
      c.push(o), (_ = x(c, _, 'key'));
      var p,
        i = 0 | t._crypto_kdf_keybytes();
      _.length !== i && f(c, 'invalid key length'), (p = v(_)), c.push(p);
      var d = new u(0 | e),
        b = d.address;
      c.push(b), t._crypto_kdf_derive_from_key(b, e, r, (r >>> 24) >>> 8, o, p);
      var E = y(d, s);
      return g(c), E;
    }
    function lr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_kdf_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_kdf_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function ur(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'clientPublicKey'));
      var s,
        c = 0 | t._crypto_kx_publickeybytes();
      e.length !== c && f(n, 'invalid clientPublicKey length'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'clientSecretKey'));
      var o,
        h = 0 | t._crypto_kx_secretkeybytes();
      r.length !== h && f(n, 'invalid clientSecretKey length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'serverPublicKey'));
      var p,
        i = 0 | t._crypto_kx_publickeybytes();
      a.length !== i && f(n, 'invalid serverPublicKey length'),
        (p = v(a)),
        n.push(p);
      var d = new u(0 | t._crypto_kx_sessionkeybytes()),
        m = d.address;
      n.push(m);
      var E = new u(0 | t._crypto_kx_sessionkeybytes()),
        k = E.address;
      if (
        (n.push(k), 0 == (0 | t._crypto_kx_client_session_keys(m, k, s, o, p)))
      ) {
        var S = y({ sharedRx: d, sharedTx: E }, _);
        return g(n), S;
      }
      b(n, 'invalid usage');
    }
    function vr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_kx_publickeybytes()),
        _ = a.address;
      r.push(_);
      var n = new u(0 | t._crypto_kx_secretkeybytes()),
        s = n.address;
      if ((r.push(s), 0 == (0 | t._crypto_kx_keypair(_, s)))) {
        var c = { publicKey: y(a, e), privateKey: y(n, e), keyType: 'x25519' };
        return g(r), c;
      }
      b(r, 'internal error');
    }
    function dr(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'seed'));
      var _,
        n = 0 | t._crypto_kx_seedbytes();
      e.length !== n && f(a, 'invalid seed length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_kx_publickeybytes()),
        c = s.address;
      a.push(c);
      var o = new u(0 | t._crypto_kx_secretkeybytes()),
        h = o.address;
      if ((a.push(h), 0 == (0 | t._crypto_kx_seed_keypair(c, h, _)))) {
        var p = { publicKey: y(s, r), privateKey: y(o, r), keyType: 'x25519' };
        return g(a), p;
      }
      b(a, 'internal error');
    }
    function gr(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'serverPublicKey'));
      var s,
        c = 0 | t._crypto_kx_publickeybytes();
      e.length !== c && f(n, 'invalid serverPublicKey length'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'serverSecretKey'));
      var o,
        h = 0 | t._crypto_kx_secretkeybytes();
      r.length !== h && f(n, 'invalid serverSecretKey length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'clientPublicKey'));
      var p,
        i = 0 | t._crypto_kx_publickeybytes();
      a.length !== i && f(n, 'invalid clientPublicKey length'),
        (p = v(a)),
        n.push(p);
      var d = new u(0 | t._crypto_kx_sessionkeybytes()),
        m = d.address;
      n.push(m);
      var E = new u(0 | t._crypto_kx_sessionkeybytes()),
        k = E.address;
      if (
        (n.push(k), 0 == (0 | t._crypto_kx_server_session_keys(m, k, s, o, p)))
      ) {
        var S = y({ sharedRx: d, sharedTx: E }, _);
        return g(n), S;
      }
      b(n, 'invalid usage');
    }
    function br(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_onetimeauth_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_onetimeauth_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_onetimeauth(p, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function fr(e, r) {
      var a = [];
      l(r), m(a, e, 'state_address');
      var _ = new u(0 | t._crypto_onetimeauth_bytes()),
        n = _.address;
      if ((a.push(n), 0 == (0 | t._crypto_onetimeauth_final(e, n)))) {
        var s = (t._free(e), y(_, r));
        return g(a), s;
      }
      b(a, 'invalid usage');
    }
    function mr(e, r) {
      var a = [];
      l(r);
      var _ = null;
      null != e && ((_ = v((e = x(a, e, 'key')))), e.length, a.push(_));
      var n = new u(144).address;
      if (0 == (0 | t._crypto_onetimeauth_init(n, _))) {
        var s = n;
        return g(a), s;
      }
      b(a, 'invalid usage');
    }
    function xr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_onetimeauth_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_onetimeauth_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function Er(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_onetimeauth_update(e, n, s)) &&
          b(_, 'invalid usage'),
        g(_);
    }
    function kr(e, r, a) {
      var _ = [];
      e = x(_, e, 'hash');
      var n,
        s = 0 | t._crypto_onetimeauth_bytes();
      e.length !== s && f(_, 'invalid hash length'), (n = v(e)), _.push(n);
      var c = v((r = x(_, r, 'message'))),
        o = r.length;
      _.push(c), (a = x(_, a, 'key'));
      var h,
        p = 0 | t._crypto_onetimeauth_keybytes();
      a.length !== p && f(_, 'invalid key length'), (h = v(a)), _.push(h);
      var y = 0 == (0 | t._crypto_onetimeauth_verify(n, c, o, 0, h));
      return g(_), y;
    }
    function Sr(e, r, a, _, n, s, c) {
      var o = [];
      l(c),
        m(o, e, 'keyLength'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(o, 'keyLength must be an unsigned integer');
      var h = v((r = x(o, r, 'password'))),
        p = r.length;
      o.push(h), (a = x(o, a, 'salt'));
      var i,
        d = 0 | t._crypto_pwhash_saltbytes();
      a.length !== d && f(o, 'invalid salt length'),
        (i = v(a)),
        o.push(i),
        m(o, _, 'opsLimit'),
        ('number' != typeof _ || (0 | _) !== _ || _ < 0) &&
          f(o, 'opsLimit must be an unsigned integer'),
        m(o, n, 'memLimit'),
        ('number' != typeof n || (0 | n) !== n || n < 0) &&
          f(o, 'memLimit must be an unsigned integer'),
        m(o, s, 'algorithm'),
        ('number' != typeof s || (0 | s) !== s || s < 0) &&
          f(o, 'algorithm must be an unsigned integer');
      var E = new u(0 | e),
        k = E.address;
      if (
        (o.push(k),
        0 == (0 | t._crypto_pwhash(k, e, 0, h, p, 0, i, _, 0, n, s)))
      ) {
        var S = y(E, c);
        return g(o), S;
      }
      b(o, 'invalid usage');
    }
    function Tr(e, r, a, _, n, s) {
      var c = [];
      l(s),
        m(c, e, 'keyLength'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(c, 'keyLength must be an unsigned integer');
      var o = v((r = x(c, r, 'password'))),
        h = r.length;
      c.push(o), (a = x(c, a, 'salt'));
      var p,
        i = 0 | t._crypto_pwhash_scryptsalsa208sha256_saltbytes();
      a.length !== i && f(c, 'invalid salt length'),
        (p = v(a)),
        c.push(p),
        m(c, _, 'opsLimit'),
        ('number' != typeof _ || (0 | _) !== _ || _ < 0) &&
          f(c, 'opsLimit must be an unsigned integer'),
        m(c, n, 'memLimit'),
        ('number' != typeof n || (0 | n) !== n || n < 0) &&
          f(c, 'memLimit must be an unsigned integer');
      var d = new u(0 | e),
        E = d.address;
      if (
        (c.push(E),
        0 ==
          (0 |
            t._crypto_pwhash_scryptsalsa208sha256(
              E,
              e,
              0,
              o,
              h,
              0,
              p,
              _,
              0,
              n,
            )))
      ) {
        var k = y(d, s);
        return g(c), k;
      }
      b(c, 'invalid usage');
    }
    function wr(e, r, a, _, n, s, c) {
      var o = [];
      l(c);
      var h = v((e = x(o, e, 'password'))),
        p = e.length;
      o.push(h);
      var i = v((r = x(o, r, 'salt'))),
        d = r.length;
      o.push(i),
        m(o, a, 'opsLimit'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(o, 'opsLimit must be an unsigned integer'),
        m(o, _, 'r'),
        ('number' != typeof _ || (0 | _) !== _ || _ < 0) &&
          f(o, 'r must be an unsigned integer'),
        m(o, n, 'p'),
        ('number' != typeof n || (0 | n) !== n || n < 0) &&
          f(o, 'p must be an unsigned integer'),
        m(o, s, 'keyLength'),
        ('number' != typeof s || (0 | s) !== s || s < 0) &&
          f(o, 'keyLength must be an unsigned integer');
      var E = new u(0 | s),
        k = E.address;
      if (
        (o.push(k),
        0 ==
          (0 |
            t._crypto_pwhash_scryptsalsa208sha256_ll(
              h,
              p,
              i,
              d,
              a,
              0,
              _,
              n,
              k,
              s,
            )))
      ) {
        var S = y(E, c);
        return g(o), S;
      }
      b(o, 'invalid usage');
    }
    function Yr(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'password'))),
        c = e.length;
      n.push(s),
        m(n, r, 'opsLimit'),
        ('number' != typeof r || (0 | r) !== r || r < 0) &&
          f(n, 'opsLimit must be an unsigned integer'),
        m(n, a, 'memLimit'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(n, 'memLimit must be an unsigned integer');
      var o = new u(0 | t._crypto_pwhash_scryptsalsa208sha256_strbytes())
        .address;
      if (
        (n.push(o),
        0 ==
          (0 | t._crypto_pwhash_scryptsalsa208sha256_str(o, s, c, 0, r, 0, a)))
      ) {
        var h = t.UTF8ToString(o);
        return g(n), h;
      }
      b(n, 'invalid usage');
    }
    function Br(e, r, a) {
      var _ = [];
      l(a),
        'string' != typeof e && f(_, 'hashed_password must be a string'),
        (e = n(e + '\0')),
        null != c &&
          e.length - 1 !== c &&
          f(_, 'invalid hashed_password length');
      var s = v(e),
        c = e.length - 1;
      _.push(s);
      var o = v((r = x(_, r, 'password'))),
        h = r.length;
      _.push(o);
      var p =
        0 == (0 | t._crypto_pwhash_scryptsalsa208sha256_str_verify(s, o, h, 0));
      return g(_), p;
    }
    function Ar(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'password'))),
        c = e.length;
      n.push(s),
        m(n, r, 'opsLimit'),
        ('number' != typeof r || (0 | r) !== r || r < 0) &&
          f(n, 'opsLimit must be an unsigned integer'),
        m(n, a, 'memLimit'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(n, 'memLimit must be an unsigned integer');
      var o = new u(0 | t._crypto_pwhash_strbytes()).address;
      if ((n.push(o), 0 == (0 | t._crypto_pwhash_str(o, s, c, 0, r, 0, a)))) {
        var h = t.UTF8ToString(o);
        return g(n), h;
      }
      b(n, 'invalid usage');
    }
    function Kr(e, r, a, _) {
      var s = [];
      l(_),
        'string' != typeof e && f(s, 'hashed_password must be a string'),
        (e = n(e + '\0')),
        null != o &&
          e.length - 1 !== o &&
          f(s, 'invalid hashed_password length');
      var c = v(e),
        o = e.length - 1;
      s.push(c),
        m(s, r, 'opsLimit'),
        ('number' != typeof r || (0 | r) !== r || r < 0) &&
          f(s, 'opsLimit must be an unsigned integer'),
        m(s, a, 'memLimit'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(s, 'memLimit must be an unsigned integer');
      var h = 0 != (0 | t._crypto_pwhash_str_needs_rehash(c, r, 0, a));
      return g(s), h;
    }
    function Mr(e, r, a) {
      var _ = [];
      l(a),
        'string' != typeof e && f(_, 'hashed_password must be a string'),
        (e = n(e + '\0')),
        null != c &&
          e.length - 1 !== c &&
          f(_, 'invalid hashed_password length');
      var s = v(e),
        c = e.length - 1;
      _.push(s);
      var o = v((r = x(_, r, 'password'))),
        h = r.length;
      _.push(o);
      var p = 0 == (0 | t._crypto_pwhash_str_verify(s, o, h, 0));
      return g(_), p;
    }
    function Ir(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'privateKey'));
      var n,
        s = 0 | t._crypto_scalarmult_scalarbytes();
      e.length !== s && f(_, 'invalid privateKey length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'publicKey'));
      var c,
        o = 0 | t._crypto_scalarmult_bytes();
      r.length !== o && f(_, 'invalid publicKey length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_scalarmult_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_scalarmult(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'weak public key');
    }
    function Nr(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'privateKey'));
      var _,
        n = 0 | t._crypto_scalarmult_scalarbytes();
      e.length !== n && f(a, 'invalid privateKey length'),
        (_ = v(e)),
        a.push(_);
      var s = new u(0 | t._crypto_scalarmult_bytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_scalarmult_base(c, _)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'unknown error');
    }
    function Lr(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'n'));
      var n,
        s = 0 | t._crypto_scalarmult_ed25519_scalarbytes();
      e.length !== s && f(_, 'invalid n length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'p'));
      var c,
        o = 0 | t._crypto_scalarmult_ed25519_bytes();
      r.length !== o && f(_, 'invalid p length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_scalarmult_ed25519_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_scalarmult_ed25519(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid point or scalar is 0');
    }
    function Ur(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'scalar'));
      var _,
        n = 0 | t._crypto_scalarmult_ed25519_scalarbytes();
      e.length !== n && f(a, 'invalid scalar length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_scalarmult_ed25519_bytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_scalarmult_ed25519_base(c, _)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'scalar is 0');
    }
    function Or(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'scalar'));
      var _,
        n = 0 | t._crypto_scalarmult_ed25519_scalarbytes();
      e.length !== n && f(a, 'invalid scalar length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_scalarmult_ed25519_bytes()),
        c = s.address;
      if (
        (a.push(c), 0 == (0 | t._crypto_scalarmult_ed25519_base_noclamp(c, _)))
      ) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'scalar is 0');
    }
    function Cr(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'n'));
      var n,
        s = 0 | t._crypto_scalarmult_ed25519_scalarbytes();
      e.length !== s && f(_, 'invalid n length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'p'));
      var c,
        o = 0 | t._crypto_scalarmult_ed25519_bytes();
      r.length !== o && f(_, 'invalid p length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_scalarmult_ed25519_bytes()),
        p = h.address;
      if (
        (_.push(p), 0 == (0 | t._crypto_scalarmult_ed25519_noclamp(p, n, c)))
      ) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid point or scalar is 0');
    }
    function Rr(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'scalar'));
      var n,
        s = 0 | t._crypto_scalarmult_ristretto255_scalarbytes();
      e.length !== s && f(_, 'invalid scalar length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'element'));
      var c,
        o = 0 | t._crypto_scalarmult_ristretto255_bytes();
      r.length !== o && f(_, 'invalid element length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_scalarmult_ristretto255_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_scalarmult_ristretto255(p, n, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'result is identity element');
    }
    function Pr(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'scalar'));
      var _,
        n = 0 | t._crypto_core_ristretto255_scalarbytes();
      e.length !== n && f(a, 'invalid scalar length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_core_ristretto255_bytes()),
        c = s.address;
      if (
        (a.push(c), 0 == (0 | t._crypto_scalarmult_ristretto255_base(c, _)))
      ) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'scalar is 0');
    }
    function Gr(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_secretbox_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'key'));
      var p,
        i = 0 | t._crypto_secretbox_keybytes();
      a.length !== i && f(n, 'invalid key length'), (p = v(a)), n.push(p);
      var d = new u(0 | c),
        m = d.address;
      n.push(m);
      var E = new u(0 | t._crypto_secretbox_macbytes()),
        k = E.address;
      if (
        (n.push(k),
        0 == (0 | t._crypto_secretbox_detached(m, k, s, c, 0, o, p)))
      ) {
        var S = y({ mac: E, cipher: d }, _);
        return g(n), S;
      }
      b(n, 'invalid usage');
    }
    function Xr(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_secretbox_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'key'));
      var p,
        i = 0 | t._crypto_secretbox_keybytes();
      a.length !== i && f(n, 'invalid key length'), (p = v(a)), n.push(p);
      var d = new u((c + t._crypto_secretbox_macbytes()) | 0),
        m = d.address;
      if ((n.push(m), 0 == (0 | t._crypto_secretbox_easy(m, s, c, 0, o, p)))) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'invalid usage');
    }
    function Dr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_secretbox_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_secretbox_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function Fr(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'ciphertext'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'mac'));
      var h,
        p = 0 | t._crypto_secretbox_macbytes();
      r.length !== p && f(s, 'invalid mac length'),
        (h = v(r)),
        s.push(h),
        (a = x(s, a, 'nonce'));
      var i,
        d = 0 | t._crypto_secretbox_noncebytes();
      a.length !== d && f(s, 'invalid nonce length'),
        (i = v(a)),
        s.push(i),
        (_ = x(s, _, 'key'));
      var m,
        E = 0 | t._crypto_secretbox_keybytes();
      _.length !== E && f(s, 'invalid key length'), (m = v(_)), s.push(m);
      var k = new u(0 | o),
        S = k.address;
      if (
        (s.push(S),
        0 == (0 | t._crypto_secretbox_open_detached(S, c, h, o, 0, i, m)))
      ) {
        var T = y(k, n);
        return g(s), T;
      }
      b(s, 'wrong secret key for the given ciphertext');
    }
    function Vr(e, r, a, _) {
      var n = [];
      l(_), (e = x(n, e, 'ciphertext'));
      var s,
        c = t._crypto_secretbox_macbytes(),
        o = e.length;
      o < c && f(n, 'ciphertext is too short'),
        (s = v(e)),
        n.push(s),
        (r = x(n, r, 'nonce'));
      var h,
        p = 0 | t._crypto_secretbox_noncebytes();
      r.length !== p && f(n, 'invalid nonce length'),
        (h = v(r)),
        n.push(h),
        (a = x(n, a, 'key'));
      var i,
        d = 0 | t._crypto_secretbox_keybytes();
      a.length !== d && f(n, 'invalid key length'), (i = v(a)), n.push(i);
      var m = new u((o - t._crypto_secretbox_macbytes()) | 0),
        E = m.address;
      if (
        (n.push(E), 0 == (0 | t._crypto_secretbox_open_easy(E, s, o, 0, h, i)))
      ) {
        var k = y(m, _);
        return g(n), k;
      }
      b(n, 'wrong secret key for the given ciphertext');
    }
    function Hr(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'header'));
      var n,
        s = 0 | t._crypto_secretstream_xchacha20poly1305_headerbytes();
      e.length !== s && f(_, 'invalid header length'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_secretstream_xchacha20poly1305_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(52).address;
      if (
        0 ==
        (0 | t._crypto_secretstream_xchacha20poly1305_init_pull(h, n, c))
      ) {
        var p = h;
        return g(_), p;
      }
      b(_, 'invalid usage');
    }
    function qr(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'key'));
      var _,
        n = 0 | t._crypto_secretstream_xchacha20poly1305_keybytes();
      e.length !== n && f(a, 'invalid key length'), (_ = v(e)), a.push(_);
      var s = new u(52).address,
        c = new u(0 | t._crypto_secretstream_xchacha20poly1305_headerbytes()),
        o = c.address;
      if (
        (a.push(o),
        0 == (0 | t._crypto_secretstream_xchacha20poly1305_init_push(s, o, _)))
      ) {
        var h = { state: s, header: y(c, r) };
        return g(a), h;
      }
      b(a, 'invalid usage');
    }
    function jr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_secretstream_xchacha20poly1305_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_secretstream_xchacha20poly1305_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function zr(e, r, a, _) {
      var n = [];
      l(_), m(n, e, 'state_address'), (r = x(n, r, 'cipher'));
      var s,
        c = t._crypto_secretstream_xchacha20poly1305_abytes(),
        o = r.length;
      o < c && f(n, 'cipher is too short'), (s = v(r)), n.push(s);
      var h = null,
        p = 0;
      null != a && ((h = v((a = x(n, a, 'ad')))), (p = a.length), n.push(h));
      var i = new u(
          (o - t._crypto_secretstream_xchacha20poly1305_abytes()) | 0,
        ),
        b = i.address;
      n.push(b);
      var E,
        k =
          ((E = d(1)),
          n.push(E),
          (k = 0 ===
            t._crypto_secretstream_xchacha20poly1305_pull(
              e,
              b,
              0,
              E,
              s,
              o,
              0,
              h,
              p,
            ) && { tag: t.HEAPU8[E], message: i }) && {
            message: y(k.message, _),
            tag: k.tag,
          });
      return g(n), k;
    }
    function Wr(e, r, a, _, n) {
      var s = [];
      l(n), m(s, e, 'state_address');
      var c = v((r = x(s, r, 'message_chunk'))),
        o = r.length;
      s.push(c);
      var h = null,
        p = 0;
      null != a && ((h = v((a = x(s, a, 'ad')))), (p = a.length), s.push(h)),
        m(s, _, 'tag'),
        ('number' != typeof _ || (0 | _) !== _ || _ < 0) &&
          f(s, 'tag must be an unsigned integer');
      var i = new u(
          (o + t._crypto_secretstream_xchacha20poly1305_abytes()) | 0,
        ),
        d = i.address;
      if (
        (s.push(d),
        0 ==
          (0 |
            t._crypto_secretstream_xchacha20poly1305_push(
              e,
              d,
              0,
              c,
              o,
              0,
              h,
              p,
              0,
              _,
            )))
      ) {
        var E = y(i, n);
        return g(s), E;
      }
      b(s, 'invalid usage');
    }
    function Jr(e, r) {
      var a = [];
      return (
        l(r),
        m(a, e, 'state_address'),
        t._crypto_secretstream_xchacha20poly1305_rekey(e),
        g(a),
        !0
      );
    }
    function Qr(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_shorthash_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_shorthash_bytes()),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_shorthash(p, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function Zr(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_shorthash_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_shorthash_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function $r(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'key'));
      var c,
        o = 0 | t._crypto_shorthash_siphashx24_keybytes();
      r.length !== o && f(_, 'invalid key length'), (c = v(r)), _.push(c);
      var h = new u(0 | t._crypto_shorthash_siphashx24_bytes()),
        p = h.address;
      if (
        (_.push(p), 0 == (0 | t._crypto_shorthash_siphashx24(p, n, s, 0, c)))
      ) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function et(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'privateKey'));
      var c,
        o = 0 | t._crypto_sign_secretkeybytes();
      r.length !== o && f(_, 'invalid privateKey length'),
        (c = v(r)),
        _.push(c);
      var h = new u((e.length + t._crypto_sign_bytes()) | 0),
        p = h.address;
      if ((_.push(p), 0 == (0 | t._crypto_sign(p, null, n, s, 0, c)))) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function rt(e, r, a) {
      var _ = [];
      l(a);
      var n = v((e = x(_, e, 'message'))),
        s = e.length;
      _.push(n), (r = x(_, r, 'privateKey'));
      var c,
        o = 0 | t._crypto_sign_secretkeybytes();
      r.length !== o && f(_, 'invalid privateKey length'),
        (c = v(r)),
        _.push(c);
      var h = new u(0 | t._crypto_sign_bytes()),
        p = h.address;
      if (
        (_.push(p), 0 == (0 | t._crypto_sign_detached(p, null, n, s, 0, c)))
      ) {
        var i = y(h, a);
        return g(_), i;
      }
      b(_, 'invalid usage');
    }
    function tt(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'edPk'));
      var _,
        n = 0 | t._crypto_sign_publickeybytes();
      e.length !== n && f(a, 'invalid edPk length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_scalarmult_scalarbytes()),
        c = s.address;
      if (
        (a.push(c), 0 == (0 | t._crypto_sign_ed25519_pk_to_curve25519(c, _)))
      ) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid key');
    }
    function at(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'edSk'));
      var _,
        n = 0 | t._crypto_sign_secretkeybytes();
      e.length !== n && f(a, 'invalid edSk length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_scalarmult_scalarbytes()),
        c = s.address;
      if (
        (a.push(c), 0 == (0 | t._crypto_sign_ed25519_sk_to_curve25519(c, _)))
      ) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid key');
    }
    function _t(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'privateKey'));
      var _,
        n = 0 | t._crypto_sign_secretkeybytes();
      e.length !== n && f(a, 'invalid privateKey length'),
        (_ = v(e)),
        a.push(_);
      var s = new u(0 | t._crypto_sign_publickeybytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_sign_ed25519_sk_to_pk(c, _)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid key');
    }
    function nt(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'privateKey'));
      var _,
        n = 0 | t._crypto_sign_secretkeybytes();
      e.length !== n && f(a, 'invalid privateKey length'),
        (_ = v(e)),
        a.push(_);
      var s = new u(0 | t._crypto_sign_seedbytes()),
        c = s.address;
      if ((a.push(c), 0 == (0 | t._crypto_sign_ed25519_sk_to_seed(c, _)))) {
        var o = y(s, r);
        return g(a), o;
      }
      b(a, 'invalid key');
    }
    function st(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address'), (r = x(_, r, 'privateKey'));
      var n,
        s = 0 | t._crypto_sign_secretkeybytes();
      r.length !== s && f(_, 'invalid privateKey length'),
        (n = v(r)),
        _.push(n);
      var c = new u(0 | t._crypto_sign_bytes()),
        o = c.address;
      if ((_.push(o), 0 == (0 | t._crypto_sign_final_create(e, o, null, n)))) {
        var h = (t._free(e), y(c, a));
        return g(_), h;
      }
      b(_, 'invalid usage');
    }
    function ct(e, r, a, _) {
      var n = [];
      l(_), m(n, e, 'state_address'), (r = x(n, r, 'signature'));
      var s,
        c = 0 | t._crypto_sign_bytes();
      r.length !== c && f(n, 'invalid signature length'),
        (s = v(r)),
        n.push(s),
        (a = x(n, a, 'publicKey'));
      var o,
        h = 0 | t._crypto_sign_publickeybytes();
      a.length !== h && f(n, 'invalid publicKey length'), (o = v(a)), n.push(o);
      var p = 0 == (0 | t._crypto_sign_final_verify(e, s, o));
      return g(n), p;
    }
    function ot(e) {
      var r = [];
      l(e);
      var a = new u(208).address;
      if (0 == (0 | t._crypto_sign_init(a))) {
        var _ = a;
        return g(r), _;
      }
      b(r, 'internal error');
    }
    function ht(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_sign_publickeybytes()),
        _ = a.address;
      r.push(_);
      var n = new u(0 | t._crypto_sign_secretkeybytes()),
        s = n.address;
      if ((r.push(s), 0 == (0 | t._crypto_sign_keypair(_, s)))) {
        var c = { publicKey: y(a, e), privateKey: y(n, e), keyType: 'ed25519' };
        return g(r), c;
      }
      b(r, 'internal error');
    }
    function pt(e, r, a) {
      var _ = [];
      l(a), (e = x(_, e, 'signedMessage'));
      var n,
        s = t._crypto_sign_bytes(),
        c = e.length;
      c < s && f(_, 'signedMessage is too short'),
        (n = v(e)),
        _.push(n),
        (r = x(_, r, 'publicKey'));
      var o,
        h = 0 | t._crypto_sign_publickeybytes();
      r.length !== h && f(_, 'invalid publicKey length'), (o = v(r)), _.push(o);
      var p = new u((c - t._crypto_sign_bytes()) | 0),
        i = p.address;
      if ((_.push(i), 0 == (0 | t._crypto_sign_open(i, null, n, c, 0, o)))) {
        var d = y(p, a);
        return g(_), d;
      }
      b(_, 'incorrect signature for the given public key');
    }
    function yt(e, r) {
      var a = [];
      l(r), (e = x(a, e, 'seed'));
      var _,
        n = 0 | t._crypto_sign_seedbytes();
      e.length !== n && f(a, 'invalid seed length'), (_ = v(e)), a.push(_);
      var s = new u(0 | t._crypto_sign_publickeybytes()),
        c = s.address;
      a.push(c);
      var o = new u(0 | t._crypto_sign_secretkeybytes()),
        h = o.address;
      if ((a.push(h), 0 == (0 | t._crypto_sign_seed_keypair(c, h, _)))) {
        var p = { publicKey: y(s, r), privateKey: y(o, r), keyType: 'ed25519' };
        return g(a), p;
      }
      b(a, 'invalid usage');
    }
    function it(e, r, a) {
      var _ = [];
      l(a), m(_, e, 'state_address');
      var n = v((r = x(_, r, 'message_chunk'))),
        s = r.length;
      _.push(n),
        0 != (0 | t._crypto_sign_update(e, n, s, 0)) && b(_, 'invalid usage'),
        g(_);
    }
    function lt(e, r, a) {
      var _ = [];
      e = x(_, e, 'signature');
      var n,
        s = 0 | t._crypto_sign_bytes();
      e.length !== s && f(_, 'invalid signature length'), (n = v(e)), _.push(n);
      var c = v((r = x(_, r, 'message'))),
        o = r.length;
      _.push(c), (a = x(_, a, 'publicKey'));
      var h,
        p = 0 | t._crypto_sign_publickeybytes();
      a.length !== p && f(_, 'invalid publicKey length'), (h = v(a)), _.push(h);
      var y = 0 == (0 | t._crypto_sign_verify_detached(n, c, o, 0, h));
      return g(_), y;
    }
    function ut(e, r, a, _) {
      var n = [];
      l(_),
        m(n, e, 'outLength'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(n, 'outLength must be an unsigned integer'),
        (r = x(n, r, 'key'));
      var s,
        c = 0 | t._crypto_stream_chacha20_keybytes();
      r.length !== c && f(n, 'invalid key length'),
        (s = v(r)),
        n.push(s),
        (a = x(n, a, 'nonce'));
      var o,
        h = 0 | t._crypto_stream_chacha20_noncebytes();
      a.length !== h && f(n, 'invalid nonce length'), (o = v(a)), n.push(o);
      var p = new u(0 | e),
        i = p.address;
      n.push(i), t._crypto_stream_chacha20(i, e, 0, o, s);
      var d = y(p, _);
      return g(n), d;
    }
    function vt(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'input_message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_stream_chacha20_ietf_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'key'));
      var p,
        i = 0 | t._crypto_stream_chacha20_ietf_keybytes();
      a.length !== i && f(n, 'invalid key length'), (p = v(a)), n.push(p);
      var d = new u(0 | c),
        m = d.address;
      if (
        (n.push(m), 0 === t._crypto_stream_chacha20_ietf_xor(m, s, c, 0, o, p))
      ) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'invalid usage');
    }
    function dt(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'input_message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_stream_chacha20_ietf_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        m(s, a, 'nonce_increment'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(s, 'nonce_increment must be an unsigned integer'),
        (_ = x(s, _, 'key'));
      var i,
        d = 0 | t._crypto_stream_chacha20_ietf_keybytes();
      _.length !== d && f(s, 'invalid key length'), (i = v(_)), s.push(i);
      var E = new u(0 | o),
        k = E.address;
      if (
        (s.push(k),
        0 === t._crypto_stream_chacha20_ietf_xor_ic(k, c, o, 0, h, a, i))
      ) {
        var S = y(E, n);
        return g(s), S;
      }
      b(s, 'invalid usage');
    }
    function gt(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_stream_chacha20_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_stream_chacha20_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function bt(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'input_message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_stream_chacha20_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'key'));
      var p,
        i = 0 | t._crypto_stream_chacha20_keybytes();
      a.length !== i && f(n, 'invalid key length'), (p = v(a)), n.push(p);
      var d = new u(0 | c),
        m = d.address;
      if ((n.push(m), 0 === t._crypto_stream_chacha20_xor(m, s, c, 0, o, p))) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'invalid usage');
    }
    function ft(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'input_message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_stream_chacha20_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        m(s, a, 'nonce_increment'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(s, 'nonce_increment must be an unsigned integer'),
        (_ = x(s, _, 'key'));
      var i,
        d = 0 | t._crypto_stream_chacha20_keybytes();
      _.length !== d && f(s, 'invalid key length'), (i = v(_)), s.push(i);
      var E = new u(0 | o),
        k = E.address;
      if (
        (s.push(k),
        0 === t._crypto_stream_chacha20_xor_ic(k, c, o, 0, h, a, 0, i))
      ) {
        var S = y(E, n);
        return g(s), S;
      }
      b(s, 'invalid usage');
    }
    function mt(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_stream_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_stream_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function xt(e) {
      var r = [];
      l(e);
      var a = new u(0 | t._crypto_stream_xchacha20_keybytes()),
        _ = a.address;
      r.push(_), t._crypto_stream_xchacha20_keygen(_);
      var n = y(a, e);
      return g(r), n;
    }
    function Et(e, r, a, _) {
      var n = [];
      l(_);
      var s = v((e = x(n, e, 'input_message'))),
        c = e.length;
      n.push(s), (r = x(n, r, 'nonce'));
      var o,
        h = 0 | t._crypto_stream_xchacha20_noncebytes();
      r.length !== h && f(n, 'invalid nonce length'),
        (o = v(r)),
        n.push(o),
        (a = x(n, a, 'key'));
      var p,
        i = 0 | t._crypto_stream_xchacha20_keybytes();
      a.length !== i && f(n, 'invalid key length'), (p = v(a)), n.push(p);
      var d = new u(0 | c),
        m = d.address;
      if ((n.push(m), 0 === t._crypto_stream_xchacha20_xor(m, s, c, 0, o, p))) {
        var E = y(d, _);
        return g(n), E;
      }
      b(n, 'invalid usage');
    }
    function kt(e, r, a, _, n) {
      var s = [];
      l(n);
      var c = v((e = x(s, e, 'input_message'))),
        o = e.length;
      s.push(c), (r = x(s, r, 'nonce'));
      var h,
        p = 0 | t._crypto_stream_xchacha20_noncebytes();
      r.length !== p && f(s, 'invalid nonce length'),
        (h = v(r)),
        s.push(h),
        m(s, a, 'nonce_increment'),
        ('number' != typeof a || (0 | a) !== a || a < 0) &&
          f(s, 'nonce_increment must be an unsigned integer'),
        (_ = x(s, _, 'key'));
      var i,
        d = 0 | t._crypto_stream_xchacha20_keybytes();
      _.length !== d && f(s, 'invalid key length'), (i = v(_)), s.push(i);
      var E = new u(0 | o),
        k = E.address;
      if (
        (s.push(k),
        0 === t._crypto_stream_xchacha20_xor_ic(k, c, o, 0, h, a, 0, i))
      ) {
        var S = y(E, n);
        return g(s), S;
      }
      b(s, 'invalid usage');
    }
    function St(e, r) {
      var a = [];
      l(r),
        m(a, e, 'length'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(a, 'length must be an unsigned integer');
      var _ = new u(0 | e),
        n = _.address;
      a.push(n), t._randombytes_buf(n, e);
      var s = y(_, r);
      return g(a), s;
    }
    function Tt(e, r, a) {
      var _ = [];
      l(a),
        m(_, e, 'length'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(_, 'length must be an unsigned integer'),
        (r = x(_, r, 'seed'));
      var n,
        s = 0 | t._randombytes_seedbytes();
      r.length !== s && f(_, 'invalid seed length'), (n = v(r)), _.push(n);
      var c = new u(0 | e),
        o = c.address;
      _.push(o), t._randombytes_buf_deterministic(o, e, n);
      var h = y(c, a);
      return g(_), h;
    }
    function wt(e) {
      l(e), t._randombytes_close();
    }
    function Yt(e) {
      l(e);
      var r = t._randombytes_random() >>> 0;
      return g([]), r;
    }
    function Bt(e, r) {
      var a = [];
      l(r);
      for (var _ = t._malloc(24), n = 0; n < 6; n++)
        t.setValue(
          _ + 4 * n,
          t.Runtime.addFunction(
            e[
              [
                'implementation_name',
                'random',
                'stir',
                'uniform',
                'buf',
                'close',
              ][n]
            ],
          ),
          'i32',
        );
      0 != (0 | t._randombytes_set_implementation(_)) &&
        b(a, 'unsupported implementation'),
        g(a);
    }
    function At(e) {
      l(e), t._randombytes_stir();
    }
    function Kt(e, r) {
      var a = [];
      l(r),
        m(a, e, 'upper_bound'),
        ('number' != typeof e || (0 | e) !== e || e < 0) &&
          f(a, 'upper_bound must be an unsigned integer');
      var _ = t._randombytes_uniform(e) >>> 0;
      return g(a), _;
    }
    function Mt() {
      var e = t._sodium_version_string(),
        r = t.UTF8ToString(e);
      return g([]), r;
    }
    return (
      (u.prototype.to_Uint8Array = function () {
        var e = new Uint8Array(this.length);
        return (
          e.set(t.HEAPU8.subarray(this.address, this.address + this.length)), e
        );
      }),
      (e.add = function (e, r) {
        if (!(e instanceof Uint8Array && r instanceof Uint8Array))
          throw new TypeError('Only Uint8Array instances can added');
        var t = e.length,
          a = 0,
          _ = 0;
        if (r.length != e.length)
          throw new TypeError('Arguments must have the same length');
        for (_ = 0; _ < t; _++) (a >>= 8), (a += e[_] + r[_]), (e[_] = 255 & a);
      }),
      (e.base64_variants = o),
      (e.compare = function (e, r) {
        if (!(e instanceof Uint8Array && r instanceof Uint8Array))
          throw new TypeError('Only Uint8Array instances can be compared');
        if (e.length !== r.length)
          throw new TypeError(
            'Only instances of identical length can be compared',
          );
        for (var t = 0, a = 1, _ = e.length; _-- > 0; )
          (t |= ((r[_] - e[_]) >> 8) & a), (a &= ((r[_] ^ e[_]) - 1) >> 8);
        return t + t + a - 1;
      }),
      (e.from_base64 = function (e, r) {
        r = h(r);
        var a,
          _ = [],
          n = new u((3 * (e = x(_, e, 'input')).length) / 4),
          s = v(e),
          c = d(4),
          o = d(4);
        return (
          _.push(s),
          _.push(n.address),
          _.push(n.result_bin_len_p),
          _.push(n.b64_end_p),
          0 !==
            t._sodium_base642bin(
              n.address,
              n.length,
              s,
              e.length,
              0,
              c,
              o,
              r,
            ) && b(_, 'invalid input'),
          t.getValue(o, 'i32') - s !== e.length && b(_, 'incomplete input'),
          (n.length = t.getValue(c, 'i32')),
          (a = n.to_Uint8Array()),
          g(_),
          a
        );
      }),
      (e.from_hex = function (e) {
        var r,
          a = [],
          _ = new u((e = x(a, e, 'input')).length / 2),
          n = v(e),
          s = d(4);
        return (
          a.push(n),
          a.push(_.address),
          a.push(_.hex_end_p),
          0 !== t._sodium_hex2bin(_.address, _.length, n, e.length, 0, 0, s) &&
            b(a, 'invalid input'),
          t.getValue(s, 'i32') - n !== e.length && b(a, 'incomplete input'),
          (r = _.to_Uint8Array()),
          g(a),
          r
        );
      }),
      (e.from_string = n),
      (e.increment = function (e) {
        if (!(e instanceof Uint8Array))
          throw new TypeError('Only Uint8Array instances can be incremented');
        for (var r = 256, t = 0, a = e.length; t < a; t++)
          (r >>= 8), (r += e[t]), (e[t] = 255 & r);
      }),
      (e.is_zero = function (e) {
        if (!(e instanceof Uint8Array))
          throw new TypeError('Only Uint8Array instances can be checked');
        for (var r = 0, t = 0, a = e.length; t < a; t++) r |= e[t];
        return 0 === r;
      }),
      (e.libsodium = r),
      (e.memcmp = function (e, r) {
        if (!(e instanceof Uint8Array && r instanceof Uint8Array))
          throw new TypeError('Only Uint8Array instances can be compared');
        if (e.length !== r.length)
          throw new TypeError(
            'Only instances of identical length can be compared',
          );
        for (var t = 0, a = 0, _ = e.length; a < _; a++) t |= e[a] ^ r[a];
        return 0 === t;
      }),
      (e.memzero = function (e) {
        if (!(e instanceof Uint8Array))
          throw new TypeError('Only Uint8Array instances can be wiped');
        for (var r = 0, t = e.length; r < t; r++) e[r] = 0;
      }),
      (e.output_formats = function () {
        return ['uint8array', 'text', 'hex', 'base64'];
      }),
      (e.pad = function (e, r) {
        if (!(e instanceof Uint8Array))
          throw new TypeError('buffer must be a Uint8Array');
        if ((r |= 0) <= 0) throw new Error('block size must be > 0');
        var a,
          _ = [],
          n = d(4),
          s = 1,
          c = 0,
          o = 0 | e.length,
          h = new u(o + r);
        _.push(n), _.push(h.address);
        for (var p = h.address, y = h.address + o + r; p < y; p++)
          (t.HEAPU8[p] = e[c]),
            (c += s =
              1 &
              ~(
                ((65535 & (((o -= s) >>> 48) | (o >>> 32) | (o >>> 16) | o)) -
                  1) >>
                16
              ));
        return (
          0 !== t._sodium_pad(n, h.address, e.length, r, h.length) &&
            b(_, 'internal error'),
          (h.length = t.getValue(n, 'i32')),
          (a = h.to_Uint8Array()),
          g(_),
          a
        );
      }),
      (e.unpad = function (e, r) {
        if (!(e instanceof Uint8Array))
          throw new TypeError('buffer must be a Uint8Array');
        if ((r |= 0) <= 0) throw new Error('block size must be > 0');
        var a = [],
          _ = v(e),
          n = d(4);
        return (
          a.push(_),
          a.push(n),
          0 !== t._sodium_unpad(n, _, e.length, r) &&
            b(a, 'unsupported/invalid padding'),
          (e = (e = new Uint8Array(e)).subarray(0, t.getValue(n, 'i32'))),
          g(a),
          e
        );
      }),
      (e.ready = _),
      (e.symbols = function () {
        return Object.keys(e).sort();
      }),
      (e.to_base64 = p),
      (e.to_hex = c),
      (e.to_string = s),
      e
    );
  }
  var t =
    'object' == typeof e.sodium && 'function' == typeof e.sodium.onload
      ? e.sodium.onload
      : null;
  'function' == typeof define && define.amd
    ? define(['exports', 'libsodium'], r)
    : 'object' == typeof exports && 'string' != typeof exports.nodeName
    ? r(exports, require('libsodium'))
    : (e.sodium = r((e.commonJsStrict = {}), e.libsodium)),
    t &&
      e.sodium.ready.then(function () {
        t(e.sodium);
      });
})(this);
