pragma solidity =0.5.16;

interface IDexSwapCallee {
    function DexSwapCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}