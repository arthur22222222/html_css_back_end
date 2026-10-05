const db = require("./db")

async function criar_estrutura() {
    try {
        await db.pool.query(`
        DROP TABLE IF EXISTS Clientes;
        CREATE TABLE Clientes (
            id int NOT NULL AUTO_INCREMENT,
            senha varchar(512) NOT NULL,
            cpf varchar(14) NOT NULL,
            nome varchar(50) NOT NULL,
            email varchar(50) NOT NULL,
            celular varchar(20) NOT NULL,
            cep varchar(9) NOT NULL,
            rua varchar(100) NOT NULL,
            numero_casa varchar(10) NOT NULL,
            bairro varchar(60) NOT NULL,
            cidade varchar(60) NOT NULL,
            estado char(2) NOT NULL,
            data_nasc date NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY cpf (cpf),
            UNIQUE KEY email (email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `)
        console.log("Estrutura de dados e tabela 'Clientes' criada com sucesso!!")
    } catch (error) {
        console.log(error)
    }
    process.exit()
}
criar_estrutura()
