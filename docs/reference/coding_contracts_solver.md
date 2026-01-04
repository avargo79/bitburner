# Coding Contracts Solutions

Coding Contracts are `.cct` files found on servers. Solving them gives money or faction rep. Failing destroys the contract.

## Common Problems & Algorithms

### 1. Find Largest Prime Factor
**Problem**: Given `n`, find largest prime factor.
**Algorithm**:
```javascript
let factor = 2;
while (n > 1) {
    if (n % factor === 0) {
        n /= factor;
    } else {
        factor++;
    }
}
return factor;
```

### 2. Subarray with Maximum Sum
**Problem**: Find contiguous subarray with largest sum.
**Algorithm**: **Kadane's Algorithm**.
```javascript
let maxSoFar = nums[0];
let maxEndingHere = nums[0];
for (let i = 1; i < nums.length; i++) {
    maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
}
return maxSoFar;
```

### 3. Spiralize Matrix
**Problem**: Return elements of a matrix in spiral order.
**Algorithm**: Simulation. Maintain `top`, `bottom`, `left`, `right` boundaries. Loop while boundaries don't cross.

### 4. Algorithmic Stock Trader (I, II, III, IV)
**Problem**: Max profit with `k` transactions.
**Algorithm**: Dynamic Programming.
- **Level II** (Unlimited transactions): Simply sum every positive difference (`price[i+1] - price[i] > 0`).
- **Level IV** (k transactions): `dp[k][day]`.

### 5. Minimum Path Sum in a Triangle
**Problem**: Find min path from top to bottom.
**Algorithm**: Bottom-up DP.
```javascript
for (let row = n-2; row >= 0; row--) {
    for (let col = 0; col <= row; col++) {
        triangle[row][col] += Math.min(triangle[row+1][col], triangle[row+1][col+1]);
    }
}
return triangle[0][0];
```

### 6. Unique Paths in a Grid (I & II)
**Problem**: Paths from top-left to bottom-right (maybe with obstacles).
**Algorithm**: `dp[i][j] = dp[i-1][j] + dp[i][j-1]`.
- If `grid[i][j]` is an obstacle, `dp[i][j] = 0`.

## Automation
Write a script that:
1. Scans all servers (`recursiveScan`).
2. Checks for `.cct` files (`ls(server, ".cct")`).
3. Gets the contract type (`codingcontract.getContractType`).
4. Solves it using a switch-case library of functions.
5. Submits (`codingcontract.attempt`).

> [!WARNING]
> Always verify your solution locally (or use specific "dummy" attempts) before submitting, as contracts are destroyed on limited failures.
