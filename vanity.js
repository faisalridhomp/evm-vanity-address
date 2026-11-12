// evm-vanity-address — generate an EVM wallet address with a chosen prefix/suffix.
//
// A "vanity" address starts or ends with characters you pick, e.g. 0xjack...
// or ...dead. The address is derived from a random private key, so the only
// way to find one is brute force: generate keys until the address matches.
// Difficulty grows 16x per hex character (case-insensitive) — a 4-char
// prefix takes seconds, a 7-char prefix can take hours.
//
// Usage:
//   npm i ethers
//   node vanity.js <prefix> [suffix] [--case-sensitive] [--threads N]
// Examples:
//   node vanity.js jack            -> 0xjack... (case-insensitive)
//   node vanity.js 0xdead dead     -> starts with dead AND ends with dead
//   node vanity.js JACK --case-sensitive
//
// SECURITY: the private key is printed to stdout. Run this on your own
// machine, never on a shared server, and move funds only to a key you
// generated yourself. Never share the private key.

const { ethers } = require("ethers");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const os = require("os");

function matches(address, prefix, suffix, caseSensitive) {
    const a = caseSensitive ? address : address.toLowerCase();
    const p = caseSensitive ? prefix : prefix.toLowerCase();
    const s = caseSensitive ? suffix : suffix.toLowerCase();
    const body = a.slice(2);
    if (p && !body.startsWith(p)) return false;
    if (s && !body.endsWith(s)) return false;
    return true;
}

function mine(prefix, suffix, caseSensitive) {
    let tries = 0;
    for (;;) {
        const wallet = ethers.Wallet.createRandom();
        tries++;
        if (matches(wallet.address, prefix, suffix, caseSensitive)) {
            return { wallet, tries };
        }
        if (tries % 50000 === 0) parentPort?.postMessage({ tries });
    }
}

if (!isMainThread) {
    const { prefix, suffix, caseSensitive } = workerData;
    const { wallet, tries } = mine(prefix, suffix, caseSensitive);
    parentPort.postMessage({
        found: true,
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        tries,
    });
    process.exit(0);
}

function main() {
    const args = process.argv.slice(2);
    let prefix = "", suffix = "", caseSensitive = false;
    let threads = Math.max(1, os.cpus().length - 1);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--case-sensitive") caseSensitive = true;
        else if (args[i] === "--threads") threads = parseInt(args[++i], 10) || threads;
        else if (!prefix) prefix = args[i].replace(/^0x/i, "");
        else if (!suffix) suffix = args[i].replace(/^0x/i, "");
    }
    if (!prefix && !suffix) {
        console.log("Usage: node vanity.js <prefix> [suffix] [--case-sensitive] [--threads N]");
        console.log("Example: node vanity.js jack");
        process.exit(1);
    }
    const chars = (prefix + suffix).length;
    const difficulty = Math.pow(16, chars);
    console.log(`target: 0x${prefix || "*"}...${suffix || "*"} (${caseSensitive ? "case-sensitive" : "case-insensitive"})`);
    console.log(`difficulty: ~1 in ${difficulty.toLocaleString()} addresses`);
    console.log(`threads: ${threads} (started ${new Date().toLocaleTimeString()})`);

    const start = Date.now();
    let totalTries = 0;
    const workers = [];
    for (let i = 0; i < threads; i++) {
        const w = new Worker(__filename, { workerData: { prefix, suffix, caseSensitive } });
        workers.push(w);
        w.on("message", (m) => {
            if (m.found) {
                const secs = (Date.now() - start) / 1000;
                console.log(`\nFOUND in ${secs.toFixed(1)}s after ${m.tries.toLocaleString()} tries (this worker):`);
                console.log(`  address:     ${m.address}`);
                console.log(`  private key: ${m.privateKey}`);
                console.log(`  mnemonic:    ${m.mnemonic}`);
                console.log("\nKeep the private key secret. It controls this address.");
                for (const x of workers) x.terminate();
                process.exit(0);
            } else if (m.tries) {
                totalTries += m.tries;
                const rate = totalTries / ((Date.now() - start) / 1000);
                const eta = difficulty / Math.max(rate, 1);
                process.stdout.write(`\r${totalTries.toLocaleString()} tried, ~${Math.round(rate).toLocaleString()}/s, ETA ~${eta < 60 ? eta.toFixed(0) + "s" : (eta / 60).toFixed(1) + "m"}   `);
            }
        });
    }
}

main();
