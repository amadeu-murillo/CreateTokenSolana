export const IDL = {
  version: "1.7.5",
  name: "lb_clmm",
  instructions: [
    {
      name: "initializeLbPair",
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "reserveX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeDistributor",
          isMut: false,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "activeId",
          type: "i32",
        },
        {
          name: "binStep",
          type: "u16",
        },
      ],
    },
    {
      name: "initializePermissionlessLbPair",
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "reserveX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "activeId",
          type: "i32",
        },
        {
          name: "binStep",
          type: "u16",
        },
      ],
    },
    {
      name: "initializeCustomizablePermissionlessLbPair",
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "reserveX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "creator",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "activeId",
          type: "i32",
        },
        {
          name: "binStep",
          type: "u16",
        },
        {
          name: "baseFactor",
          type: "u16",
        },
        {
          name: "filterPeriod",
          type: "u16",
        },
        {
          name: "decayPeriod",
          type: "u16",
        },
        {
          name: "reductionFactor",
          type: "u16",
        },
        {
          name: "variableFeeControl",
          type: "u32",
        },
        {
          name: "maxVolatilityAccumulator",
          type: "u32",
        },
        {
          name: "minBinId",
          type: "i32",
        },
        {
          name: "maxBinId",
          type: "i32",
        },
        {
          name: "protocolFeePercentage",
          type: "u16",
        },
      ],
    },
    {
      name: "initializePosition",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "lowerBinId",
          type: "i32",
        },
        {
          name: "width",
          type: "i32",
        },
      ],
    },
    {
      name: "initializePositionAndAddLiquidity",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userTokenX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "binArrayBitmap",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "lowerBinId",
          type: "i32",
        },
        {
          name: "width",
          type: "i32",
        },
        {
          name: "amountX",
          type: "u64",
        },
        {
          name: "amountY",
          type: "u64",
        },
        {
          name: "amountXMax",
          type: "u64",
        },
        {
          name: "amountYMax",
          type: "u64",
        },
        {
          name: "withBonus",
          type: "bool",
        },
      ],
    },
    {
      name: "addLiquidity",
      accounts: [
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "binArrayBitmap",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amountX",
          type: "u64",
        },
        {
          name: "amountY",
          type: "u64",
        },
        {
          name: "amountXMax",
          type: "u64",
        },
        {
          name: "amountYMax",
          type: "u64",
        },
        {
          name: "withBonus",
          type: "bool",
        },
      ],
    },
    {
      name: "removeLiquidity",
      accounts: [
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "binIds",
          type: {
            vec: "i32",
          },
        },
        {
          name: "amountsToRemove",
          type: {
            vec: "u64",
          },
        },
        {
          name: "shouldClaimAndClose",
          type: "bool",
        },
      ],
    },
    {
      name: "swap",
      accounts: [
        {
          name: "lbPair",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenIn",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenOut",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenMintIn",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMintOut",
          isMut: false,
          isSigner: false,
        },
        {
          name: "reserveIn",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reserveOut",
          isMut: true,
          isSigner: false,
        },
        {
          name: "oracle",
          isMut: false,
          isSigner: false,
        },
        {
          name: "hostFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "binArrayBitmap",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amountIn",
          type: "u64",
        },
        {
          name: "minAmountOut",
          type: "u64",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "lbPair",
      type: {
        kind: "struct",
        fields: [],
      },
    },
    {
      name: "position",
      type: {
        kind: "struct",
        fields: [],
      },
    },
  ],
  errors: [],
};
