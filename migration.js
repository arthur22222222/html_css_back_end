const db = require("./db")

 async function criar_estrutura(){
    try{
        await db.pool.query(`
        DROP TABLE IF EXISTS Clientes
        CREATE TABLE Clientes (
            id int NOT NULL AUTO_INCREMENT,
            senha varchar(512) NOT NULL,
            cpf char(14) NOT NULL,
            nome varchar(50) NOT NULL,
            email varchar(50) NOT NULL,
            celular char(14) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY cpf (cpf),
            UNIQUE KEY email (email)
          ) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `)
        console.log("Estrutura de dados e tabela 'clientes' criada com sucesso!!")
    }catch(error){
        console.log(error)
    }
 }
 criar_estrutura()