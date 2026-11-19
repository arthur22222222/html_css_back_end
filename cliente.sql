-- Banco utilizado pelo projeto
USE teste3dsc;

-- Recria a tabela de clientes com os usuários padrão do sistema.
-- As senhas já estão criptografadas com bcrypt.
--
-- Login principal:
--   Arthur -> tui1020kg1@gmail.com / 22102009
--
-- Usuários de teste:
--   Beatriz Lima, Bruno Costa, Carla Mendes, Diego Souza,
--   Eduarda Rocha, Felipe Alves, Gabriela Dias e Henrique Martins
--   Senha de todos: senha123

DROP TABLE IF EXISTS cliente;

CREATE TABLE cliente (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(14) NOT NULL UNIQUE,
    celular CHAR(14) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO cliente (id, nome, cpf, celular, email, senha) VALUES
    (1, 'Arthur', '113.011.609-38', '(43)99966-4654', 'tui1020kg1@gmail.com',
     '$2b$10$rCur/bLnjdlA.rzauaAyae87tzQTj.phKUfTF59nlO5wsomBFhLVm'),
    (2, 'Beatriz Lima', '222.333.444-55', '(42)99888-1111', 'beatriz.lima@email.com',
     '$2b$10$oOX8vP/Hjus1d63ltulPaODUuu.CEeimkV0EWSLY1eQWy7nQqedSC'),
    (3, 'Bruno Costa', '333.444.555-66', '(41)99777-2222', 'bruno.costa@email.com',
     '$2b$10$Utvfnxn0PMVMBz5cv3uLpeBjaa9l29cfs/HWyVREx8UW1ZGBN4CKy'),
    (4, 'Carla Mendes', '444.555.666-77', '(11)99666-3333', 'carla.mendes@email.com',
     '$2b$10$uWHHga2jHNlMRqlBThjEbeJS4rgNh6cnqqZdsh4xyz2fplEuUYOiy'),
    (5, 'Diego Souza', '555.666.777-88', '(21)99555-4444', 'diego.souza@email.com',
     '$2b$10$KZUAbpTbSH8oq/3nIeKG9uMkaDi/c1RIPKensDykoit5gLBI1b3zC'),
    (6, 'Eduarda Rocha', '666.777.888-99', '(31)99444-5555', 'eduarda.rocha@email.com',
     '$2b$10$TWVpkBRGcpbtNtCIARtFFuM2KLuj7JVzamruN3IC8Pfx9RYwGufsi'),
    (7, 'Felipe Alves', '777.888.999-00', '(42)99333-6666', 'felipe.alves@email.com',
     '$2b$10$NJGsk8UHMEeMpvsIDt4GyujOIr3c.YCy6mJxAyMCwsa45K8ilSwDC'),
    (8, 'Gabriela Dias', '888.999.000-11', '(43)99222-7777', 'gabriela.dias@email.com',
     '$2b$10$qjNVnoQv7FfPriKsNcniD.Z2OCU0dVC1jc5vSBvQwGb/NSov4XMJK'),
    (9, 'Henrique Martins', '999.000.111-22', '(41)99111-8888', 'henrique.martins@email.com',
     '$2b$10$Eqeu.LYYTBDbjAqes4JfjemH3yRg7v9Q/g0wom8uH3CQs97HSRMWa');

-- Conferência
SELECT id, nome, cpf, celular, email FROM cliente ORDER BY id;
SELECT COUNT(*) AS total_clientes FROM cliente;
