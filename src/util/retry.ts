export const sleep = (timeout: number) => {
    console.log(`sleep for ${timeout}`)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("wake up")
            resolve(null);
        }, timeout)
    })
}

export async function retry<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        const name = (error as Error).name;
        const message = (error as Error).message;
        const stack = (error as Error).stack;
        console.log({ name, message, stack });
        await sleep(1000);
        return await retry(fn);
    }
}