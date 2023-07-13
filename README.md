# ZKorum

## Development

### Prerequisite

Install:

- make
- [pnpm](https://pnpm.io/)
- [watchman](https://facebook.github.io/watchman/)
- [docker](https://www.docker.com/)

### Run in dev mode

All the components run in watch mode.

Open three terminals in the root directory, then run:

Automatically generate frontend stub from backends and subsequent openapi changes:

```
make dev-generate
```

Frontend tab:

```
make dev-front
```

Backend tab:

```
make dev-back
```

... and start coding!

## Services

### Front

A PWA.

### Back

A Nest JS application.

### Interop

We generate an openapi.json file from the backend, and then use [openapi-generator-cli](https://openapi-generator.tech/) to generate the corresponding front.

## FAQ

### Which off-chain peer-to-peer network are you using?

Many things will be used - all off-chain. It is work-in-progress. But to summarize:

- when you cast your response, you use a classic http request that calls ZKorum from the frontend
- on reception, ZKorum verifies the validity of the reponse, then sends its hash to a TSA server such as https://freetsa.org/index_en.php to timestamp it, and then broadcast the response + the timestamp to a dedicated topic of a custom libp2p node. The broadcasted response is anonymized. Imagine if you responsed to a questionnaire containing an open question, and you wrote "I like cat a lot". The Verifiable Presentation will contain a CID of "I like cat a lot", not the content itself. It helps for GDPR compliance - enabling data to be deleted on request from users if necessary.
- the libp2p node is also run in the frontend. Your "confirmation" for your response is when you see your response being broadcasted in the node.
- anyone can launch the libp2p node, listen to the relevant topic, and keep track of the list of response for a specific proposal - effectively verifying that ZKorum is not censoring responses.

The above is what will be available for the MVP.
It is portrayed in the [protocol](https://github.com/zkorum/poc/blob/main/vc-flow/README.md).

Below is our thoughts on how to further improve the censorship resistance of the system - without introducing a blockchain or a token unnecessarily.

We am considering allowing the users to configure from the frontend the protocols from which the frontend will extract the list of proposals/votes/polls/responses (the users choose who they trust):

- from IPNS with data eventually stored on Filecoin
- from an http server

And we are additionally considering using the libp2p node to:

- allow broadcasting the response to the libp2p node directly, instead of going through the ZKorum http server. That said, this will require writing not just a hash of the response in the Verifiable Presentation but the full response. For example, if you respond to a questionnaire and there is an open question, and you wrote "I like cat a lot", the Verifiable Presentation will contain "I like cat a lot" instead of simply a CID of "I like cat a lot". This is more censorship-resistant but it will also become almost impossible to delete the data afterwards (GDPR considerations) as anyone running the libp2p node may have recorded it. Though another option could be to keep the CID in the Verifiable Presentation - and expect people to fetch its content via IPFS or via an HTTP Gateway that serve this CID.

### For voting use case, what data are you considering to store in the P2P network?

Maybe the answer to the previous question helped.
The p2p network is not a persistent network. It is using libp2p/ipfs - akin to bittorrent.
ZKorum will store data, and others can store data that are broadcasted on this lip2p node, and keep ZKorum in check.

### Is this voting data like Verifiable Presentations?

Almost. The voting/polling data (the "response") is essentially an object containing two fields:

- the Verifiable Presentation
- a trusted timestamp

The Verifiable Presentation contains different attributes such as the CID of vote/poll that the user was responding to, the eligibility to the vote/poll, and the actual response. The Verifiable Presentation contains enough information to self-verify its own eligibility and to tamper-proof the user response.
This Verifiable Presentation is hashed and sent to a TimeStamp Authority, which returns the accompanying trusted timestamp.

### ZKorum solution for censorship-resistance does not use a blockchain, but feels like a permissioned blockchain. Why not using a public blockchain?

It is not permissioned, it is just a public custom libp2p node.

Blockchain is unnecessary, we don't need absolute persistence over time.
Most of the time, survey/polls/votes/discussions will not be particularly critical. Nobody will care _that_ much and users will be OK to trust ZKorum because the chances that ZKorum get corrupted to manipulate data are close to 0. If we use a blockchain, all those unimportant things will be forever publicly persisted in someone else' computer. This is a waste (think shitcoin/shitNFT transaction history). And if users want to delete their data, for whatever reasons, they can't!

With our solution, when users do care about keeping ZKorum in check because this is a high-stake vote/poll, users will naturally have incentive to run this libp2p node or pay someone to do so, and keep persistence of the verifiable data.

Now how to gather these data and achieve consensus? Here comes the idea of "server federation".

It is up to the community to agree on which authorities to trust to gather consensus - not the technology. There can be 1, 2, 100 or a million parties involved in this authority: this is a governance matter.
If the consensus authority refuses some data, at least third-parties can challenge the consensus authority by gathering the censored verifiable data and presenting it to the public, effectively proving that censorship occured!
We don't believe in technology replacing human governance. But we can make the process of achieving consensus from multiple sources easier.

## License

See [COPYING-README](COPYING-README.md)
