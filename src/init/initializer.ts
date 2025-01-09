import mysql from '../db/mysql/MysqlService.js';

const init =  async () => {
    await import('../configs/env.js');
    await mysql.init();
}

export default init;