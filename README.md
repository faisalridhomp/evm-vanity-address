# evm-vanity-address

Generate an EVM wallet address with a chosen prefix and/or suffix — a
vanity address like `0xdead...` or `...cafe`.

The address is derived from a random private key, so the only way to find
one is brute force: generate keys until the address matches. This tool
does that with all your CPU cores (`worker_threads`), reports speed and
ETA, and prints the matching private key + mnemonic.

## Only hex works

EVM addresses are **hexadecimal**: only the digits `0-9` and the letters
`a-f` (case-insensitive). A word like `jack` can **never** appear in an
address — `j` and `k` are not hex characters, so searching for it would
run forever. The tool rejects non-hex input immediately instead.

Valid vanity words (hex letters only): `dead`, `face`, `beef`, `cafe`,
`c0ffee`, `facade`, `decade`, `defecated`, `beaded`, `efface`...

## Difficulty

Each hex character (case-insensitive) makes it 16x harder:

| Pattern | Odds | Typical time* |
|---------|------|---------------|
| 2 chars (`ab`) | 1 in 256 | seconds |
| 4 chars (`dead`) | 1 in 65,536 | ~1 minute |
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
node vanity.js dead            # 0xdead... (case-insensitive)
node vanity.js 0xdead dead     # starts with dead AND ends with dead
node vanity.js cafe --threads 8
```

Invalid input is rejected at once:

```bash
$ node vanity.js jack
ERROR: "jack" is not a valid EVM address pattern.
EVM addresses use hexadecimal only: digits 0-9 and letters a-f.
```

Output on success:

```
FOUND in 42.3s after 61,204 tries (this worker):
  address:     0xdead4f8a2b1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4
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
