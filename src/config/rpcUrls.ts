import "dotenv/config";

export const rpcUrls: { [key: number]: string } = {
    5: process.env.RPC_URL_SEPOLIA!,
    7: process.env.RPC_URL_SHIBUYA!,
}

export const wsUrls: { [key: number]: string } = {
    5: process.env.RPC_URL_SEPOLIA_WS!,
}