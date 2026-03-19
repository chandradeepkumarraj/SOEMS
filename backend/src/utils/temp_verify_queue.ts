
const createLimiter = (concurrency: number) => {
    const queue: any[] = [];
    let activeCount = 0;

    const next = () => {
        if (queue.length > 0 && activeCount < concurrency) {
            activeCount++;
            const { fn, resolve, reject } = queue.shift();
            console.log(`[Queue] Starting task. Active: ${activeCount}`);
            fn().then(resolve).catch(reject).finally(() => {
                activeCount--;
                console.log(`[Queue] Task finished. Active: ${activeCount}`);
                next();
            });
        }
    };

    return <T>(fn: () => Promise<T>): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        next();
    });
};

const limiter = createLimiter(2);

const mockTask = (id: number, delay: number) => async () => {
    console.log(`Task ${id} executing...`);
    await new Promise(r => setTimeout(r, delay));
    return `Result ${id}`;
};

async function runTest() {
    console.log('--- Starting Concurrency Test (Limit: 2) ---');
    const promises = [
        limiter(mockTask(1, 1000)),
        limiter(mockTask(2, 500)),
        limiter(mockTask(3, 300)),
        limiter(mockTask(4, 800)),
        limiter(mockTask(5, 100))
    ];

    const results = await Promise.all(promises);
    console.log('All tasks finished:', results);
}

runTest();
