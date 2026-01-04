# Useful NS2 Snippets

Copy these functions into your `lib/utils.js` or directly into your scripts.

## Formatting Money
Make large numbers readable (e.g., $1.500m).

```javascript
/** 
 * @param {number} money 
 */
export function formatMoney(money) {
    if (money >= 1e12) return "$" + (money / 1e12).toFixed(3) + "t";
    if (money >= 1e9) return "$" + (money / 1e9).toFixed(3) + "b";
    if (money >= 1e6) return "$" + (money / 1e6).toFixed(3) + "m";
    if (money >= 1e3) return "$" + (money / 1e3).toFixed(3) + "k";
    return "$" + money.toFixed(2);
}
```

## Root Accesser (Nuke + Ports)
Open all possible ports and run nuke.

```javascript
/** @param {NS} ns @param {string} target */
export function gainRootAccess(ns, target) {
    if (ns.hasRootAccess(target)) return true;

    if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(target);
    if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(target);
    if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(target);
    if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(target);
    if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(target);

    try {
        ns.nuke(target);
        return true;
    } catch (e) {
        return false;
    }
}
```

## Recursive Scan
Find all servers in the network.

```javascript
/** @param {NS} ns */
export function getNetworkNodes(ns) {
    let visited = new Set();
    let queue = ["home"];
    while (queue.length > 0) {
        let node = queue.shift();
        if (!visited.has(node)) {
            visited.add(node);
            let neighbors = ns.scan(node);
            for (let child of neighbors) {
                queue.push(child);
            }
        }
    }
    return Array.from(visited);
}
```
