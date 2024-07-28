import "dotenv/config";

export const rpcUrls: { [key: number]: string } = {
    5: process.env.RPC_URL_SEPOLIA!,
    7: process.env.RPC_URL_SHIBUYA!,
    8: process.env.RPC_URL_AMOY!,
}

export const wsUrls: { [key: number]: string } = {
    5: process.env.RPC_URL_SEPOLIA_WS!,
}