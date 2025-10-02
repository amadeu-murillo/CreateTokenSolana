export type Amm = {
    "version": "0.1.0",
    "name": "amm",
    "instructions": [
      {
        "name": "initializePool",
        "accounts": [
          { "name": "pool", "isMut": true, "isSigner": true },
          { "name": "poolAuthority", "isMut": false, "isSigner": false },
          { "name": "mintA", "isMut": false, "isSigner": false },
          { "name": "mintB", "isMut": false, "isSigner": false },
          { "name": "vaultA", "isMut": true, "isSigner": false },
          { "name": "vaultB", "isMut": true, "isSigner": false },
          { "name": "lpMint", "isMut": true, "isSigner": false },
          { "name": "payer", "isMut": true, "isSigner": true },
          { "name": "tokenProgram", "isMut": false, "isSigner": false },
          { "name": "systemProgram", "isMut": false, "isSigner": false },
          { "name": "rent", "isMut": false, "isSigner": false }
        ],
        "args": [
          { "name": "feeBasisPoints", "type": "u16" }
        ]
      },
      {
        "name": "addLiquidity",
        "accounts": [
          { "name": "pool", "isMut": true, "isSigner": false },
          { "name": "lpMint", "isMut": true, "isSigner": false },
          { "name": "vaultA", "isMut": true, "isSigner": false },
          { "name": "vaultB", "isMut": true, "isSigner": false },
          { "name": "userTokenA", "isMut": true, "isSigner": false },
          { "name": "userTokenB", "isMut": true, "isSigner": false },
          { "name": "userLpToken", "isMut": true, "isSigner": false },
          { "name": "poolAuthority", "isMut": false, "isSigner": false },
          { "name": "user", "isMut": true, "isSigner": true },
          { "name": "tokenProgram", "isMut": false, "isSigner": false }
        ],
        "args": [
          { "name": "amountAToDeposit", "type": "u64" },
          { "name": "amountBToDeposit", "type": "u64" }
        ]
      },
      {
        "name": "removeLiquidity",
        "accounts": [
          { "name": "pool", "isMut": true, "isSigner": false },
          { "name": "lpMint", "isMut": true, "isSigner": false },
          { "name": "userLpToken", "isMut": true, "isSigner": false },
          { "name": "vaultA", "isMut": true, "isSigner": false },
          { "name": "vaultB", "isMut": true, "isSigner": false },
          { "name": "userTokenA", "isMut": true, "isSigner": false },
          { "name": "userTokenB", "isMut": true, "isSigner": false },
          { "name": "poolAuthority", "isMut": false, "isSigner": false },
          { "name": "user", "isMut": false, "isSigner": true },
          { "name": "tokenProgram", "isMut": false, "isSigner": false }
        ],
        "args": [
          { "name": "lpAmountToBurn", "type": "u64" }
        ]
      },
      {
        "name": "swap",
        "accounts": [
          { "name": "pool", "isMut": true, "isSigner": false },
          { "name": "vaultIn", "isMut": true, "isSigner": false },
          { "name": "vaultOut", "isMut": true, "isSigner": false },
          { "name": "userTokenIn", "isMut": true, "isSigner": false },
          { "name": "userTokenOut", "isMut": true, "isSigner": false },
          { "name": "poolAuthority", "isMut": false, "isSigner": false },
          { "name": "user", "isMut": false, "isSigner": true },
          { "name": "tokenProgram", "isMut": false, "isSigner": false }
        ],
        "args": [
          { "name": "amountIn", "type": "u64" }
        ]
      }
    ],
    "accounts": [
      {
        "name": "Pool",
        "type": {
          "kind": "struct",
          "fields": [
            { "name": "mintA", "type": "publicKey" },
            { "name": "mintB", "type": "publicKey" },
            { "name": "vaultA", "type": "publicKey" },
            { "name": "vaultB", "type": "publicKey" },
            { "name": "lpMint", "type": "publicKey" },
            { "name": "amountA", "type": "u64" },
            { "name": "amountB", "type": "u64" },
            { "name": "feeBasisPoints", "type": "u16" },
            { "name": "bump", "type": "u8" }
          ]
        }
      }
    ],
    "errors": [
      { "code": 6000, "name": "FeeTooHigh", "msg": "A taxa de negociação não pode ser superior a 10000 basis points (100%)." },
      { "code": 6001, "name": "ZeroAmount", "msg": "A quantidade de depósito ou retirada não pode ser zero." },
      { "code": 6002, "name": "InvalidRatio", "msg": "A proporção dos tokens depositados não corresponde à proporção do pool." },
      { "code": 6003, "name": "CalculationError", "msg": "Ocorreu um erro no cálculo. A quantidade resultante foi zero." }
    ],
    "metadata": {
      "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
    }
  };
  
  export const IDL: Amm = JSON.parse(JSON.stringify({
    "version": "0.1.0",
    "name": "amm",
    "instructions": [
        {
          "name": "initializePool",
          "accounts": [
            { "name": "pool", "isMut": true, "isSigner": true },
            { "name": "poolAuthority", "isMut": false, "isSigner": false },
            { "name": "mintA", "isMut": false, "isSigner": false },
            { "name": "mintB", "isMut": false, "isSigner": false },
            { "name": "vaultA", "isMut": true, "isSigner": false },
            { "name": "vaultB", "isMut": true, "isSigner": false },
            { "name": "lpMint", "isMut": true, "isSigner": false },
            { "name": "payer", "isMut": true, "isSigner": true },
            { "name": "tokenProgram", "isMut": false, "isSigner": false },
            { "name": "systemProgram", "isMut": false, "isSigner": false },
            { "name": "rent", "isMut": false, "isSigner": false }
          ],
          "args": [
            { "name": "feeBasisPoints", "type": "u16" }
          ]
        },
        {
          "name": "addLiquidity",
          "accounts": [
            { "name": "pool", "isMut": true, "isSigner": false },
            { "name": "lpMint", "isMut": true, "isSigner": false },
            { "name": "vaultA", "isMut": true, "isSigner": false },
            { "name": "vaultB", "isMut": true, "isSigner": false },
            { "name": "userTokenA", "isMut": true, "isSigner": false },
            { "name": "userTokenB", "isMut": true, "isSigner": false },
            { "name": "userLpToken", "isMut": true, "isSigner": false },
            { "name": "poolAuthority", "isMut": false, "isSigner": false },
            { "name": "user", "isMut": true, "isSigner": true },
            { "name": "tokenProgram", "isMut": false, "isSigner": false }
          ],
          "args": [
            { "name": "amountAToDeposit", "type": "u64" },
            { "name": "amountBToDeposit", "type": "u64" }
          ]
        },
        {
          "name": "removeLiquidity",
          "accounts": [
            { "name": "pool", "isMut": true, "isSigner": false },
            { "name": "lpMint", "isMut": true, "isSigner": false },
            { "name": "userLpToken", "isMut": true, "isSigner": false },
            { "name": "vaultA", "isMut": true, "isSigner": false },
            { "name": "vaultB", "isMut": true, "isSigner": false },
            { "name": "userTokenA", "isMut": true, "isSigner": false },
            { "name": "userTokenB", "isMut": true, "isSigner": false },
            { "name": "poolAuthority", "isMut": false, "isSigner": false },
            { "name": "user", "isMut": false, "isSigner": true },
            { "name": "tokenProgram", "isMut": false, "isSigner": false }
          ],
          "args": [
            { "name": "lpAmountToBurn", "type": "u64" }
          ]
        },
        {
          "name": "swap",
          "accounts": [
            { "name": "pool", "isMut": true, "isSigner": false },
            { "name": "vaultIn", "isMut": true, "isSigner": false },
            { "name": "vaultOut", "isMut": true, "isSigner": false },
            { "name": "userTokenIn", "isMut": true, "isSigner": false },
            { "name": "userTokenOut", "isMut": true, "isSigner": false },
            { "name": "poolAuthority", "isMut": false, "isSigner": false },
            { "name": "user", "isMut": false, "isSigner": true },
            { "name": "tokenProgram", "isMut": false, "isSigner": false }
          ],
          "args": [
            { "name": "amountIn", "type": "u64" }
          ]
        }
    ],
    "accounts": [
        {
          "name": "Pool",
          "type": {
            "kind": "struct",
            "fields": [
              { "name": "mintA", "type": "publicKey" },
              { "name": "mintB", "type": "publicKey" },
              { "name": "vaultA", "type": "publicKey" },
              { "name": "vaultB", "type": "publicKey" },
              { "name": "lpMint", "type": "publicKey" },
              { "name": "amountA", "type": "u64" },
              { "name": "amountB", "type": "u64" },
              { "name": "feeBasisPoints", "type": "u16" },
              { "name": "bump", "type": "u8" }
            ]
          }
        }
    ],
    "errors": [
        { "code": 6000, "name": "FeeTooHigh", "msg": "A taxa de negociação não pode ser superior a 10000 basis points (100%)." },
        { "code": 6001, "name": "ZeroAmount", "msg": "A quantidade de depósito ou retirada não pode ser zero." },
        { "code": 6002, "name": "InvalidRatio", "msg": "A proporção dos tokens depositados não corresponde à proporção do pool." },
        { "code": 6003, "name": "CalculationError", "msg": "Ocorreu um erro no cálculo. A quantidade resultante foi zero." }
    ],
    "metadata": {
      "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
    }
  }));

