import TransactionHash from "../models/transactionHashModel";

class TransactionHashCache {
    private cache: Set<string>;
    private maxSize: number;

    constructor(maxSize: number) {
        this.cache = new Set();
        this.maxSize = maxSize;
    }

    async loadFromDatabase(contractAddress: string): Promise<void> {
        const hashes = await TransactionHash.find({ contractAddress }).select('hash -_id').lean();
        hashes.forEach((entry) => {
            this.cache.add(entry.hash);
        });
    }

    async has(hash: string): Promise<boolean> {
        return this.cache.has(hash) || !!(await TransactionHash.findOne({ hash }));
    }

    async add(contractAddress: string, hash: string): Promise<void> {
        if (this.cache.size >= this.maxSize) {
            const firstHash = this.cache.values().next().value;
            this.cache.delete(firstHash);
            await TransactionHash.deleteOne({ hash: firstHash });
        }

        this.cache.add(hash);
        const transactionHash = new TransactionHash({ hash, contractAddress });
        await transactionHash.save();
    }
}

export default TransactionHashCache;
