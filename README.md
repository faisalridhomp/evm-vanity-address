# evm-vanity-address

Generate an EVM wallet address with a chosen prefix and/or suffix — a
vanity address like `0xjack...` or `...dead`.

The address is derived from a random private key, so the only way to find
one is brute force: generate keys until the address matches. This tool
does that with all your CPU cores (`worker_threads`), reports speed and
ETA, and prints the matching private key + mnemonic.

## Difficulty

Each hex character (case-insensitive) makes it 16x harder:

| Pattern | Odds | Typical time* |
|---------|------|---------------|
| 2 chars (`ab`) | 1 in 256 | seconds |
| 4 chars (`jack`) | 1 in 65,536 | ~1 minute |
| 5 chars | 1 in 1,048,576 | ~15 minutes |
| 6 chars | 1 in 16,777,216 | ~4 hours |
| 7 chars | 1 in 268,435,456 | ~2–3 days |

*At ~1,000 addresses/sec per core. Case-sensitive matching is much
harder (each character is 1 in 22 for a–f, 1 in 16 for 0–9) — prefer
case-insensitive unless you need the exact case.

## Usage

```bash
npm i
node vanity.js <prefix> [suffix] [--case-sensitive] [--threads N]
```

Examples:

```bash
node vanity.js jack            # 0xjack... (case-insensitive)
node vanity.js 0xdead dead     # starts with dead AND ends with dead
node vanity.js JACK --case-sensitive
node vanity.js cafe --threads 8
```

Output on success:

```
FOUND in 42.3s after 61,204 tries (this worker):
  address:     0xjack4f8a2b1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4
  private key: 0x...
  mnemonic:    ...
```

## Security

- The private key is printed to stdout. Run this on your own machine,
  never on a shared server.
- Move funds only to a key you generated yourself. Never share the
  private key or mnemonic with anyone.
- A vanity address is no less secure than a random one — same 256-bit
  key, just filtered by its public address.
