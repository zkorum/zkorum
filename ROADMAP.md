# Roadmap

THis is a very rough TODO list as we write the software.

## UCAN-base auth

Temporarilly:

- [ ] keep track of logged-in users in the pgsql database directly - backend doesn't send any UCAN to the frontend

In the future:

- [ ] backend sends UCAN when user is logged in with expiration date and included capability (URL that can be accessed).

TODO:

- [x] ucan generation and verification in back and front
- [ ] keep track of already seen ucan in back - to prevent replay attacks
- [ ] delete already seen ucan from database whenever the expiration date expired anyway
- [ ] email validation and corresponding flow
