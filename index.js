// npm init
// npm i dotenv
const dotenv = require("dotenv")
dotenv.config()
// npm i express
const express = require("express")
const app = express()
const port = process.env.API_PORT
app.use(express.json())

// npm i mysql2
const db = require("./db")

// npm i bcrypt
const bcrypt = require("bcrypt")

// npm i jsonwebtoken
const jwt = require("jsonwebtoken")

// npm i cors
const cors = require("cors")
app.use(cors())

const path = require("path")
app.use("/img", express.static(path.join(__dirname, 'img')))
// http://localhost:3000/img/1/1.jpg

// serve o front-end (pasta front) em http://localhost:3000
app.use(express.static(path.join(__dirname, "front")))

app.post("/cliente", async (req, res) => {
    try {
        const cliente = req.body
        const senhaCript = bcrypt.hashSync(cliente.senha, 10)
        cliente.senha = senhaCript

        // envio para o BD
        const resultado = await db.pool.query(
            `INSERT INTO cliente (
                nome, cpf, celular, email, senha
            ) VALUES ( ?, ?, ?, ?, ? )`,
            [cliente.nome, cliente.cpf, cliente.celular,
             cliente.email, cliente.senha]
        )
        res.status(201).json({
            msg: "Cliente cadastrado, ID = " + resultado[0].insertId
        })
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})


app.post("/login", async (req,res) => {
    try {
        const user = req.body
        const resultado = await db.pool.query(
            "SELECT id, nome, email, senha FROM cliente WHERE email = ?", [user.email]
        )
        const dados_bd = resultado[0][0]
        if(!dados_bd) {
            return res.status(401).json({msg: "Email não cadastrado!"})
        }

        const senha_valida = await bcrypt.compare(user.senha, dados_bd.senha)

        if(!senha_valida) {
            return res.status(401).json({msg: "Credenciais inválidas!"})
        }

        const payload = {
            id: dados_bd.id,
            email: dados_bd.email
        } 
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' })
        return res.status(200).json({nome: dados_bd.nome, token: token})

    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})



app.get("/cliente/perfil", autenticar, async (req, res)=>{
    try {
        const id = req.usuario.id
        const resultado = await db.pool.query(
            "SELECT id, nome, cpf, celular, email FROM cliente WHERE id = ?",
            [id]
        )
        const perfil = resultado[0][0]
        if (!perfil) {
            return res.status(404).json({ erro: "Cliente não encontrado." })
        }
        res.status(200).json(perfil)
    } catch (error) {
        res.status(500).json({ erro: 'Erro interno' });
    }
})

app.put("/cliente/perfil", autenticar, async (req, res) => {
    const id = req.usuario.id
    const { nome, cpf, celular, email, senha_atual, nova_senha } = req.body || {}

    const nomeLimpo = String(nome ?? "").trim()
    const emailLimpo = String(email ?? "").trim()
    const cpfDigitos = somenteDigitos(cpf)
    const celularDigitos = somenteDigitos(celular)

    if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
        return res.status(400).json({ erro: "Informe um nome entre 2 e 100 caracteres." })
    }
    if (cpfDigitos.length !== 11 || /^(\d)\1{10}$/.test(cpfDigitos)) {
        return res.status(400).json({ erro: "Informe um CPF válido com 11 dígitos." })
    }
    if (celularDigitos.length < 10 || celularDigitos.length > 11) {
        return res.status(400).json({ erro: "Informe um celular com DDD e 10 ou 11 dígitos." })
    }
    if (emailLimpo.length > 100 || !emailValido(emailLimpo)) {
        return res.status(400).json({ erro: "Informe um e-mail válido." })
    }

    try {
        const resultado = await db.pool.query(
            "SELECT id, senha FROM cliente WHERE id = ?",
            [id]
        )
        const atual = resultado[0][0]
        if (!atual) {
            return res.status(404).json({ erro: "Cliente não encontrado." })
        }

        const querTrocarSenha = Boolean(senha_atual || nova_senha)
        let senhaFinal = atual.senha

        if (querTrocarSenha) {
            if (!senha_atual || !nova_senha) {
                return res.status(400).json({ erro: "Informe a senha atual e a nova senha." })
            }

            const senhaConfere = await bcrypt.compare(String(senha_atual), atual.senha)
            if (!senhaConfere) {
                return res.status(401).json({ erro: "Senha atual incorreta." })
            }

            const novaLimpa = String(nova_senha)
            if (novaLimpa.length < 6 || novaLimpa.length > 72) {
                return res.status(400).json({ erro: "A nova senha deve ter entre 6 e 72 caracteres." })
            }

            senhaFinal = await bcrypt.hash(novaLimpa, 10)
        }

        const cpfFormatado = formatarCpf(cpfDigitos)
        const celularFormatado = formatarCelular(celularDigitos)

        const emailExistente = await db.pool.query(
            "SELECT id FROM cliente WHERE email = ? AND id <> ?",
            [emailLimpo, id]
        )
        if (emailExistente[0].length > 0) {
            return res.status(409).json({ erro: "Este e-mail já está cadastrado em outra conta." })
        }

        const cpfExistente = await db.pool.query(
            "SELECT id FROM cliente WHERE cpf = ? AND id <> ?",
            [cpfFormatado, id]
        )
        if (cpfExistente[0].length > 0) {
            return res.status(409).json({ erro: "Este CPF já está cadastrado em outra conta." })
        }

        await db.pool.query(
            `UPDATE cliente
             SET nome = ?, cpf = ?, celular = ?, email = ?, senha = ?
             WHERE id = ?`,
            [nomeLimpo, cpfFormatado, celularFormatado, emailLimpo, senhaFinal, id]
        )

        const token = jwt.sign(
            { id: id, email: emailLimpo },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        )

        return res.status(200).json({
            msg: "Dados atualizados com sucesso!",
            cliente: {
                id: id,
                nome: nomeLimpo,
                cpf: cpfFormatado,
                celular: celularFormatado,
                email: emailLimpo,
            },
            token: token,
        })
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "E-mail ou CPF já cadastrado." })
        }
        console.error("Erro ao atualizar perfil:", error)
        return res.status(500).json({ erro: "Erro interno ao atualizar o perfil." })
    }
})

app.get("/produto", async (req, res) => {
    try {
        let sql = "SELECT * FROM produto WHERE 1=1"
        const params = []
        // Query Parameter
        const { busca, ordenacao } = req.query
        let resultado
        if (busca) {
            sql += " AND nome LIKE ?"
            params.push(`%${busca}%`)
        } 
        if (ordenacao) {
            if (ordenacao == "maior preco") {
                sql += " ORDER BY preco DESC"
            } else {
                sql += " ORDER BY preco ASC"
            }
        }
        resultado = await db.pool.query(sql, params)
        res.status(200).json(resultado[0])
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

app.get("/produto/:id", async (req, res) => {
    try {
        // Path Parameter
        const id = req.params.id
        const resultado = await db.pool.query("SELECT * FROM produto WHERE id = ?", [id])
        const produto = resultado[0][0]
        res.status(200).json(produto)
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

app.post("/compra", autenticar, async (req,res) => {
    const { forma_pagamento, produtos } = req.body || {}

    if (!forma_pagamento) {
        return res.status(400).json({ erro: "Informe a forma de pagamento" })
    }
    if (!Array.isArray(produtos) || produtos.length === 0) {
        return res.status(400).json({ erro: "Informe ao menos um produto" })
    }

    const connection = await db.pool.getConnection()
    try {
        await connection.beginTransaction()

        let valor_total = 0
        const itens = []

        for (const item of produtos) {
            const id = Number(item.id)
            const quantidade = Number(item.quantidade)

            if (!Number.isInteger(id) || !Number.isInteger(quantidade) || quantidade <= 0) {
                const erro = new Error("Produto ou quantidade inválida")
                erro.status = 400
                throw erro
            }

            const [linhas] = await connection.query(
                "SELECT id, nome, preco, quantidade_img FROM produto WHERE id = ? FOR UPDATE",
                [id]
            )
            const produto = linhas[0]

            if (!produto) {
                const erro = new Error("Produto não encontrado: ID " + id)
                erro.status = 404
                throw erro
            }
            if (produto.quantidade_img < quantidade) {
                const erro = new Error("Estoque insuficiente para o produto: " + produto.nome)
                erro.status = 400
                throw erro
            }

            const valor_unitario = Number(produto.preco)
            valor_total += valor_unitario * quantidade

            await connection.query(
                "UPDATE produto SET quantidade_img = quantidade_img - ? WHERE id = ?",
                [quantidade, id]
            )

            itens.push({ id, quantidade, valor_unitario })
        }

        valor_total = Number(valor_total.toFixed(2))

        const [resultado_compra] = await connection.query(
            `INSERT INTO compra (data, forma_pagamento, valor_total, id_cliente)
             VALUES (NOW(), ?, ?, ?)`,
            [forma_pagamento, valor_total, req.usuario.id]
        )
        const id_compra = resultado_compra.insertId

        for (const item of itens) {
            await connection.query(
                `INSERT INTO possui (id_compra, id_produto, quantidade, valor_unitario)
                 VALUES (?, ?, ?, ?)`,
                [id_compra, item.id, item.quantidade, item.valor_unitario]
            )
        }

        await connection.commit()
        res.status(201).json({
            msg: "Compra realizada com sucesso",
            id_compra: id_compra,
            valor_total: valor_total
        })
    } catch (error) {
        await connection.rollback()
        res.status(error.status || 500).json({ erro: error.message })
    } finally {
        connection.release()
    }
})


app.listen(port, () => {
    console.log("API rodando na porta " + port)
})

function somenteDigitos(valor) {
    return String(valor ?? "").replace(/\D/g, "")
}

function formatarCpf(digitos) {
    const d = String(digitos)
    if (d.length !== 11) return d
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

function formatarCelular(digitos) {
    const d = String(digitos)
    if (d.length === 11) return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`
    return d
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// https://dontpad.com/backendapi
function autenticar(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null){
        return res.status(401).json({erro: "Token não enviado, usar Authorization Bearer <token>"})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({erro: "Token inválido"})
        req.usuario = usuario
        next()
    })   
}

// AULA DE 18/09: TESTAR O LOGIN E A AUTENTICAÇÃO NA ROTA /cliente/perfil