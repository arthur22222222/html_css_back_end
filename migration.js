const db = require("./db")

const ESTRUTURA_CLIENTE = `
    DROP TABLE IF EXISTS cliente;
    CREATE TABLE cliente (
        id int(11) NOT NULL AUTO_INCREMENT,
        nome varchar(100) NOT NULL,
        cpf char(14) NOT NULL,
        celular char(14) NOT NULL,
        email varchar(100) NOT NULL,
        senha varchar(512) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY cpf (cpf),
        UNIQUE KEY email (email)
    ) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`

// Usuário padrão do sistema: Arthur.
// Os demais usuários são contas de teste e usam a senha "senha123".
const DADOS_CLIENTE = `
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
`

const ESTRUTURA_PRODUTO = `
    DROP TABLE IF EXISTS produto;
    CREATE TABLE produto (
        id int(11) NOT NULL AUTO_INCREMENT,
        nome varchar(200) NOT NULL,
        descricao text NOT NULL,
        categoria varchar(50) NOT NULL,
        preco decimal(10,2) NOT NULL,
        caminho_img varchar(50) NOT NULL,
        quantidade_img int(11) NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`

// Catálogo de jogos online.
const PRODUTOS = [
    // FPS
    { nome: "Counter-Strike 2", descricao: "Tiro tático 5v5 com economia de rodadas, mapas competitivos e atualizações constantes.", categoria: "FPS", preco: 69.90, estoque: 8 },
    { nome: "Valorant", descricao: "FPS tático com agentes, habilidades especiais e partidas ranqueadas online.", categoria: "FPS", preco: 49.90, estoque: 10 },
    { nome: "Call of Duty: Warzone", descricao: "Battle royale de tiro em primeira pessoa com mapas grandes e combate intenso.", categoria: "FPS", preco: 89.90, estoque: 6 },
    { nome: "Battlefield 2042", descricao: "Guerra online com veículos, armas modernas e batalhas de grande escala.", categoria: "FPS", preco: 129.90, estoque: 4 },
    { nome: "Apex Legends", descricao: "Battle royale em esquadrões com personagens lendários e movimentação rápida.", categoria: "FPS", preco: 59.90, estoque: 7 },
    { nome: "Overwatch 2", descricao: "Ação em equipe com heróis, habilidades únicas e objetivos variados.", categoria: "FPS", preco: 99.90, estoque: 5 },
    { nome: "Rainbow Six Siege", descricao: "Combate tático 5v5 com destruição de cenários e operadores especializados.", categoria: "FPS", preco: 79.90, estoque: 5 },
    { nome: "Halo Infinite", descricao: "Campanha e multiplayer online com armas icônicas e combate em arena.", categoria: "FPS", preco: 119.90, estoque: 3 },

    // RPG
    { nome: "Elden Ring", descricao: "RPG de ação em mundo aberto com chefes desafiadores e exploração livre.", categoria: "RPG", preco: 199.90, estoque: 6 },
    { nome: "Baldur's Gate 3", descricao: "RPG por turnos com escolhas ramificadas, combates táticos e cooperação.", categoria: "RPG", preco: 189.90, estoque: 4 },
    { nome: "The Witcher 3: Wild Hunt", descricao: "RPG de fantasia com missões profundas, monstros e um enorme mundo aberto.", categoria: "RPG", preco: 79.90, estoque: 9 },
    { nome: "Cyberpunk 2077", descricao: "RPG de ação futurista em Night City, com história ramificada e upgrades.", categoria: "RPG", preco: 149.90, estoque: 5 },
    { nome: "Diablo IV", descricao: "RPG de ação sombrio com classes, masmorras e muito loot para coletar.", categoria: "RPG", preco: 179.90, estoque: 4 },
    { nome: "Persona 5 Royal", descricao: "RPG japonês com história envolvente, personagens marcantes e combates por turnos.", categoria: "RPG", preco: 149.90, estoque: 5 },
    { nome: "Starfield", descricao: "RPG espacial com exploração de planetas, naves e construção de bases.", categoria: "RPG", preco: 169.90, estoque: 4 },
    { nome: "The Elder Scrolls V: Skyrim", descricao: "RPG de fantasia com dragões, magia e liberdade total de exploração.", categoria: "RPG", preco: 89.90, estoque: 8 },

    // Aventura
    { nome: "Minecraft", descricao: "Mundo aberto de blocos com construção, sobrevivência e multiplayer online.", categoria: "Aventura", preco: 99.90, estoque: 10 },
    { nome: "Terraria", descricao: "Aventura sandbox 2D com exploração, construção e combates contra chefes.", categoria: "Aventura", preco: 39.90, estoque: 8 },
    { nome: "No Man's Sky", descricao: "Exploração espacial procedural com planetas, naves e bases em multiplayer.", categoria: "Aventura", preco: 129.90, estoque: 5 },
    { nome: "Sea of Thieves", descricao: "Aventura pirata online com navegação, tesouros e batalhas navais.", categoria: "Aventura", preco: 99.90, estoque: 6 },
    { nome: "Genshin Impact", descricao: "Aventura de mundo aberto com personagens elementais e exploração cooperativa.", categoria: "Aventura", preco: 59.90, estoque: 7 },
    { nome: "Red Dead Redemption 2", descricao: "Aventura de faroeste com mundo aberto, história marcante e modo online.", categoria: "Aventura", preco: 149.90, estoque: 5 },
    { nome: "Assassins Creed Valhalla", descricao: "Aventura viking com exploração, combates e construção de assentamento.", categoria: "Aventura", preco: 119.90, estoque: 4 },
    { nome: "Rise of the Tomb Raider", descricao: "Aventura de ação com exploração de tumbas, puzzles e combates.", categoria: "Aventura", preco: 59.90, estoque: 6 },

    // Estratégia
    { nome: "League of Legends", descricao: "MOBA competitivo 5v5 com campeões, runas e partidas ranqueadas.", categoria: "Estratégia", preco: 49.90, estoque: 10 },
    { nome: "Dota 2", descricao: "MOBA estratégico 5v5 com heróis, itens e partidas competitivas online.", categoria: "Estratégia", preco: 39.90, estoque: 8 },
    { nome: "Age of Empires IV", descricao: "Estratégia em tempo real com civilizações históricas e batalhas medievais.", categoria: "Estratégia", preco: 99.90, estoque: 5 },
    { nome: "StarCraft II", descricao: "RTS de ficção científica com três facções, campanhas e multiplayer.", categoria: "Estratégia", preco: 69.90, estoque: 5 },
    { nome: "Civilization VI", descricao: "Estratégia por turnos com construção de impérios e diplomacia.", categoria: "Estratégia", preco: 129.90, estoque: 4 },
    { nome: "Total War: Warhammer III", descricao: "Estratégia por turnos e batalhas em tempo real no universo Warhammer.", categoria: "Estratégia", preco: 149.90, estoque: 3 },
    { nome: "Teamfight Tactics", descricao: "Auto battler estratégico com composições de campeões e itens.", categoria: "Estratégia", preco: 29.90, estoque: 9 },

    // Esporte
    { nome: "EA Sports FC 25", descricao: "Futebol online com clubes, ligas, Ultimate Team e partidas competitivas.", categoria: "Esporte", preco: 249.90, estoque: 6 },
    { nome: "NBA 2K25", descricao: "Basquete online com equipes da NBA, carreira e partidas competitivas.", categoria: "Esporte", preco: 199.90, estoque: 4 },
    { nome: "Rocket League", descricao: "Futebol com carros em partidas online rápidas e competitivas.", categoria: "Esporte", preco: 49.90, estoque: 10 },
    { nome: "F1 24", descricao: "Corrida online com carros oficiais da Fórmula 1 e circuitos realistas.", categoria: "Esporte", preco: 179.90, estoque: 5 },
    { nome: "eFootball 2025", descricao: "Futebol online com times licenciados, eventos e partidas ranqueadas.", categoria: "Esporte", preco: 39.90, estoque: 8 },
    { nome: "Forza Horizon 5", descricao: "Corrida em mundo aberto no México com eventos online e multiplayer.", categoria: "Esporte", preco: 169.90, estoque: 5 },

    // Simulação
    { nome: "The Sims 4", descricao: "Simulação de vida com criação de personagens, casas e histórias.", categoria: "Simulação", preco: 79.90, estoque: 7 },
    { nome: "Cities: Skylines II", descricao: "Simulação de cidade com planejamento urbano, trânsito e economia.", categoria: "Simulação", preco: 149.90, estoque: 4 },
    { nome: "Farming Simulator 25", descricao: "Simulação agrícola com máquinas, plantações e multiplayer.", categoria: "Simulação", preco: 129.90, estoque: 5 },
    { nome: "Microsoft Flight Simulator", descricao: "Simulação de voo realista com aviões e cenários do mundo inteiro.", categoria: "Simulação", preco: 199.90, estoque: 3 },
    { nome: "Euro Truck Simulator 2", descricao: "Simulação de caminhão com entregas, rotas europeias e multiplayer.", categoria: "Simulação", preco: 59.90, estoque: 6 },

    // MMO
    { nome: "World of Warcraft", descricao: "MMORPG de fantasia com raides, masmorras e um mundo vasto.", categoria: "MMO", preco: 89.90, estoque: 6 },
    { nome: "Guild Wars 2", descricao: "MMORPG com história dinâmica, PvP e eventos no mundo aberto.", categoria: "MMO", preco: 69.90, estoque: 5 },
    { nome: "New World", descricao: "MMORPG de mundo aberto com combates, crafting e guerras entre facções.", categoria: "MMO", preco: 99.90, estoque: 4 },
    { nome: "Final Fantasy XIV", descricao: "MMORPG com história épica, classes variadas e raides desafiadoras.", categoria: "MMO", preco: 99.90, estoque: 5 },
    { nome: "Lost Ark", descricao: "MMORPG de ação com combates rápidos, masmorras e progressão.", categoria: "MMO", preco: 49.90, estoque: 6 },

    // Battle Royale
    { nome: "Fortnite", descricao: "Battle royale com construção, eventos e modos online variados.", categoria: "Battle Royale", preco: 39.90, estoque: 10 },
    { nome: "PUBG: Battlegrounds", descricao: "Battle royale realista com mapas grandes e combate tático.", categoria: "Battle Royale", preco: 29.90, estoque: 8 },
]

function escaparSql(valor) {
    return String(valor).replace(/'/g, "''")
}

const DADOS_PRODUTO = `
    INSERT INTO produto (id, nome, descricao, categoria, preco, caminho_img, quantidade_img) VALUES
    ${PRODUTOS.map((produto, indice) => {
        const id = indice + 1
        return `(${id}, '${escaparSql(produto.nome)}', '${escaparSql(produto.descricao)}', '${escaparSql(produto.categoria)}', ${Number(produto.preco).toFixed(2)}, 'games/${id}.jpg', ${Number(produto.estoque)})`
    }).join(",\n    ")};
`

const ESTRUTURA_COMPRA = `
    DROP TABLE IF EXISTS compra;
    CREATE TABLE compra (
        ID int(11) NOT NULL AUTO_INCREMENT,
        data datetime NOT NULL,
        forma_pagamento varchar(30) NOT NULL,
        valor_total decimal(10,2) NOT NULL,
        id_cliente int(11) DEFAULT NULL,
        PRIMARY KEY (ID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`

const ESTRUTURA_POSSUI = `
    DROP TABLE IF EXISTS possui;
    CREATE TABLE possui (
        id_compra int(11) NOT NULL,
        id_produto int(11) NOT NULL,
        quantidade int(11) NOT NULL,
        valor_unitario decimal(10,2) NOT NULL,
        PRIMARY KEY (id_compra, id_produto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`

async function criar_tabelas() {
    const connection = await db.pool.getConnection()
    try {
        await connection.beginTransaction()

        console.log("Criando tabela 'cliente'...")
        await connection.query(ESTRUTURA_CLIENTE)
        await connection.query(DADOS_CLIENTE)

        console.log("Criando tabela 'produto'...")
        await connection.query(ESTRUTURA_PRODUTO)
        await connection.query(DADOS_PRODUTO)

        console.log("Criando tabela 'compra'...")
        await connection.query(ESTRUTURA_COMPRA)

        console.log("Criando tabela 'possui'...")
        await connection.query(ESTRUTURA_POSSUI)

        await connection.commit()
        console.log("Migration executada com sucesso!")
        process.exit(0)
    } catch (error) {
        await connection.rollback()
        console.log(error)
        process.exit(1)
    } finally {
        connection.release()
    }
}
criar_tabelas()
