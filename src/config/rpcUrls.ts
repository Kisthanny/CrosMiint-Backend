import "dotenv/config";

const rpcUrls: { [key: number]: string } = {
    5: process.env.RPC_URL_SEPOLIA!,
    7: process.env.RPC_URL_SHIBUYA!,
}

export default rpcUrls;