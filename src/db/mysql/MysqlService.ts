import mysql2 from 'mysql2/promise';
import env from '../../configs/env.js';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;

class MysqlService {
    private dmlQueue: { query: string; params: any[]; resolve: Function; reject: Function }[] = [];
    private queryQueue: { query: string; params: any[]; resolve: Function; reject: Function }[] = [];
    private processingDml = false;
    private processingQuery = false;
    private pool: mysql2.Pool | undefined;
  

  
    public async init() {
      this.pool =  mysql2.createPool({
        host: DB_HOST?.toString(),
        port: Number(DB_PORT),
        user: DB_USER?.toString(),
        password: DB_PASSWORD?.toString(),
        database: DB_NAME?.toString(),
        enableKeepAlive: true,
        queueLimit: 0,
        waitForConnections: true,
      });
      const result = await this.query('select 1');
      console.log("MysqlService Initialized.", result[0]);
    }
  
    private async processQueue(
      queue: typeof this.dmlQueue | typeof this.queryQueue,
      processingFlag: "processingDml" | "processingQuery"
    ) {
      if (this[processingFlag]) return;
      this[processingFlag] = true;
  
      while (queue.length > 0) {
        const { query, params, resolve, reject } = queue.shift()!;
        try {
          const result = await this.pool!.execute(query, params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
  
      this[processingFlag] = false;
    }
  
    async execute(query: string, params: any[] = []): Promise<any> {
      return new Promise((resolve, reject) => {
        this.dmlQueue.push({ query, params, resolve, reject });
        this.processQueue(this.dmlQueue, "processingDml");
      });
    }
  
    async query(query: string, params: any[] = []): Promise<any> {
      return new Promise((resolve, reject) => {
        this.queryQueue.push({ query, params, resolve, reject });
        this.processQueue(this.queryQueue, "processingQuery");
      });
    }
  
    async transaction(querySet: { query: string; params: any[] }[]): Promise<void> {
      const connection = await this.pool!.getConnection();
      try {
        await connection.beginTransaction();
        for (const { query, params } of querySet) {
          await connection.execute(query, params);
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
  }
  
  const mysql = new MysqlService();

  export default mysql;
  