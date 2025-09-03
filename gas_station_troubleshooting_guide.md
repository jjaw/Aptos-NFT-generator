# Gas Station Troubleshooting Guide

This guide documents the systematic approach to debugging gas station integration issues in Aptos dApps, based on real troubleshooting experience.

## 🚨 Common Symptoms

### Primary Issue: Users Still Seeing Network Fees
- Gas station configured but users see fees like `0.000774 APT` instead of `$0.00`
- Wallet popup shows network fees before transaction submission
- Aptos Explorer shows user wallet as transaction sender (fee payer)
- Gas station dashboard shows "hits" but no actual sponsorship

## 🔍 Systematic Debugging Approach

### Step 1: Always Use Aptos MCP Tools First
**❌ Don't:** Try generic blockchain debugging or random fixes
**✅ Do:** Consult Aptos MCP resources immediately

```bash
# Get specific guidance
mcp__aptos-mcp__get_specific_aptos_resource "how_to_config_a_gas_station_in_a_dapp"

# Get current API keys
mcp__aptos-mcp__get_aptos_build_applications
```

### Step 2: Verify API Key Accuracy
**Root Cause #1: Incorrect API Key Characters**

Check character-by-character:
```bash
# Our case: Wrong key had extra 'f'
WRONG: AG-GFSRDEKBCWXKDWHQYZKSFMZBJWAV3EAHf
RIGHT: AG-GFSRDEKBCWXKDWHQYZKSFMZBJWAV3EAH
```

**How to verify:**
1. Use MCP to get exact API key from dashboard
2. Compare with .env file character by character
3. Look for extra characters, typos, or truncation

### Step 3: Check Package Version Compatibility
**Root Cause #2: SDK Version Mismatches**

Common version conflicts:
```json
// Gas station client expects ts-sdk v3.x but project uses v1.x
"@aptos-labs/ts-sdk": "^1.39.0" // ❌ Too old
"@aptos-labs/gas-station-client": "^2.0.2" // Requires v3.x

// Fix: Upgrade ts-sdk to compatible version  
"@aptos-labs/ts-sdk": "^3.1.3" // ✅ Compatible
```

### Step 4: Follow MCP Configuration Exactly
**Root Cause #3: Implementation Deviates from MCP Guidance**

#### Correct AptosConfig Setup:
```typescript
// utils/aptosClient.ts
const gasStationSubmitter = GAS_STATION_API_KEY
  ? new GasStationTransactionSubmitter({
      network: NETWORK,
      apiKey: GAS_STATION_API_KEY,
    })
  : undefined;

const config = new AptosConfig({
  network: NETWORK,
  clientConfig: { API_KEY: APTOS_API_KEY },
  pluginSettings: gasStationSubmitter
    ? { TRANSACTION_SUBMITTER: gasStationSubmitter }
    : undefined,
});
```

#### Correct Wallet Provider Setup:
```typescript
// components/WalletProvider.tsx
<AptosWalletAdapterProvider
  autoConnect
  dappConfig={{
    network: NETWORK,
    aptosApiKeys: { [NETWORK]: APTOS_API_KEY },
    aptosClient: aptosClient(),
    // CRITICAL: Add transaction submitter per MCP guidance
    transactionSubmitter: aptosClient().config.getTransactionSubmitter(),
  }}
>
```

#### Correct Transaction Submission:
```typescript
// Add withFeePayer: true for gas station sponsorship
const transactionWithFeePayer = {
  ...transaction,
  withFeePayer: true,
};
const response = await signAndSubmitTransaction(transactionWithFeePayer);
```

## 🧪 Testing & Verification

### Verify Configuration is Working:
1. **Console logs should show:**
   ```
   Gas Station configured with API key: AG-GFSRDE...
   🎉 Gas Station enabled - contracts configured for zero-fee transactions!
   🎯 Transaction with fee payer: {data: {...}, withFeePayer: true}
   ```

2. **Wallet popup should show:** `$0.00` instead of fee amount

3. **Transaction analysis:**
   - Check Aptos Explorer transaction
   - Verify sender is still your wallet but fees are sponsored
   - Your wallet balance should remain unchanged

### Debug Transaction Results:
```typescript
// Add logging for transaction analysis
console.log("🔍 TRANSACTION ANALYSIS:");
console.log("Hash:", response.hash);
console.log("Explorer:", `https://explorer.aptoslabs.com/txn/${response.hash}?network=${NETWORK}`);
```

## 🎯 Key Success Indicators

### Before Fix:
- ❌ Wallet shows network fees (e.g., 0.000774 APT)
- ❌ User pays gas fees from their wallet
- ❌ Gas station dashboard shows hits but no sponsorship

### After Fix:
- ✅ Wallet shows $0.00 for network fees
- ✅ Transaction completes without deducting from user wallet
- ✅ Gas station successfully sponsors transaction fees

## 📚 Lessons Learned

1. **Always use Aptos MCP tools first** - Don't attempt manual debugging without consulting MCP resources
2. **Character-level precision matters** - API keys must be exactly correct, even one wrong character breaks authentication
3. **Package version compatibility is critical** - Gas station clients have strict SDK version requirements
4. **Follow MCP guidance exactly** - Don't improvise or use generic blockchain patterns
5. **Test systematically** - Use console logs and transaction analysis to verify each step

## 🔧 Quick Fix Checklist

- [ ] Consulted `how_to_config_a_gas_station_in_a_dapp` MCP resource
- [ ] Verified API key matches dashboard exactly (character-by-character)
- [ ] Confirmed package versions are compatible
- [ ] Added `transactionSubmitter` to wallet provider config
- [ ] Added `withFeePayer: true` to transactions
- [ ] Tested and verified $0.00 fees in wallet popup
- [ ] Confirmed transaction sponsorship via Explorer analysis

## 🚀 Expected Final Result

When properly configured:
1. User clicks "CLAIM NFT"
2. Wallet popup shows **$0.00** network fee
3. Transaction executes successfully
4. User's wallet balance unchanged
5. NFT minted and transferred to user
6. Gas station pays all network fees

This configuration enables a seamless, gasless user experience for your Aptos dApp.