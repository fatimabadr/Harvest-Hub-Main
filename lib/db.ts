import { Pool, PoolClient } from "pg";


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in the environment variables.");
}


export const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, 
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, 
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});


export const query = async (text: string, params?: unknown[], retries = 2) => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await pool.query(text, params);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            
            const isConnectionError = 
                lastError.message.includes('Connection terminated') ||
                lastError.message.includes('connection timeout') ||
                lastError.message.includes('Connection terminated unexpectedly');
            
            if (isConnectionError && attempt < retries) {
                const delay = Math.min(100 * Math.pow(2, attempt), 500); 
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            console.error('Database query error:', lastError);
            throw lastError;
        }
    }
    
    throw lastError || new Error('Query failed after retries');
};


export const getClient = async () => {
    const client = await pool.connect();
    return client;
};


export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};


/**
 * Closes the pool and its clients
 */
export const endPool = async () => {
    try {
        await pool.end();
        console.log('Database pool has been closed');
    } catch (error) {
        console.error('Error closing pool:', error);
        throw error;
    }
}


process.on('SIGTERM', () => {
    pool.end().then(() => {
        console.log('Subscription database pool has ended');
    });
}); 