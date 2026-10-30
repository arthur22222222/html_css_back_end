// npm install express cors mysql2 bcrypt jsonwebtoken dotenv
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const db = require("./db");

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());

// Serve o site (pasta front) em http://localhost:3001
app.use(express.static(path.join(__dirname, "front")));

app.get("/ola", (req, res) => {
  res.send("Hello World!");
});

// ---------- CADASTRO (grava no MySQL) ----------
app.post("/Clientes", async (req, res) => {
  try {
    const c = req.body || {};

    const obrigatorios = ["nome", "cpf", "celular", "email", "senha", "cep", "rua",
      "numero_casa", "bairro", "cidade", "estado", "data_nasc"];
    const faltando = obrigatorios.filter((campo) => !c[campo]);
    if (faltando.length > 0) {
      return res.status(400).json({ erro: "Campos obrigatórios faltando: " + faltando.join(", ") });
    }

    const senhaCript = bcrypt.hashSync(c.senha, 10);

    const [resultado] = await db.pool.query(
      `INSERT INTO Clientes
        (nome, cpf, celular, email, senha, cep, rua, numero_casa, bairro, cidade, estado, data_nasc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.nome, c.cpf, c.celular, c.email, senhaCript, c.cep, c.rua,
       c.numero_casa, c.bairro, c.cidade, c.estado, c.data_nasc]
    );

    res.status(201).json({ msg: "Cliente cadastrado, ID = " + resultado.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "Já existe um cliente com este e-mail ou CPF" });
    }
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
});

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ msg: "Informe e-mail e senha" });
    }

    const [linhas] = await db.pool.query(
      "SELECT id, nome, email, senha FROM Clientes WHERE email = ?", [email]
    );
    const usuario = linhas[0];
    if (!usuario) {
      return res.status(401).json({ msg: "E-mail ou senha inválidos" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ msg: "E-mail ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.status(200).json({ nome: usuario.nome, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
});

// ---------- PERFIL (precisa de token) ----------
app.get("/Clientes/perfil", autenticar, async (req, res) => {
  try {
    const [linhas] = await db.pool.query("SELECT * FROM Clientes WHERE id = ?", [req.usuario.id]);
    const perfil = linhas[0];
    if (!perfil) return res.status(404).json({ erro: "Cliente não encontrado" });
    delete perfil.senha;
    res.status(200).json(perfil);
  } catch (error) {
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ---------- PRODUTOS (lidos do front/produtos.json) ----------
// Filtros aceitos em GET /produtos:
//   busca / nome / q  -> busca parcial por nome (sem diferenciar maiúsculas/acentos)
//   categoria         -> exemplo: categoria=processador
//   preco_min         -> exemplo: preco_min=200
//   preco_max         -> exemplo: preco_max=700
//   ordenar           -> preco_asc | preco_desc (também aceita ordem=asc|desc)
//   pagina            -> página da listagem (10 produtos por página)
const arquivoProdutos = path.join(__dirname, "front", "produtos.json");
const PRODUTOS_POR_PAGINA = 10;

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function converterNumero(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

function obterOrdenacao(query) {
  const ordenar = normalizarTexto(query.ordenar || query.sort);
  const ordem = normalizarTexto(query.ordem);
  const campo = normalizarTexto(query.ordenar_por);

  if (["preco_asc", "asc", "menor", "menor_preco"].includes(ordenar)) return "preco_asc";
  if (["preco_desc", "desc", "maior", "maior_preco"].includes(ordenar)) return "preco_desc";
  if ((ordem === "asc" || ordem === "crescente") && (!campo || campo === "preco")) return "preco_asc";
  if ((ordem === "desc" || ordem === "decrescente") && (!campo || campo === "preco")) return "preco_desc";
  return null;
}

function filtrarProdutos(produtos, query) {
  const busca = normalizarTexto(query.busca || query.nome || query.q);
  const categoria = normalizarTexto(query.categoria);
  const precoMin = converterNumero(query.preco_min);
  const precoMax = converterNumero(query.preco_max);
  const ordenacao = obterOrdenacao(query);

  const filtrados = produtos.filter((produto) => {
    const nome = normalizarTexto(produto.nome);
    const categoriaProduto = normalizarTexto(produto.categoria);
    const preco = converterNumero(produto.preco);

    if (busca && !nome.includes(busca)) return false;
    if (categoria && categoriaProduto !== categoria) return false;
    if (precoMin !== null && (preco === null || preco < precoMin)) return false;
    if (precoMax !== null && (preco === null || preco > precoMax)) return false;
    return true;
  });

  if (ordenacao === "preco_asc") {
    filtrados.sort((a, b) => (converterNumero(a.preco) ?? 0) - (converterNumero(b.preco) ?? 0));
  } else if (ordenacao === "preco_desc") {
    filtrados.sort((a, b) => (converterNumero(b.preco) ?? 0) - (converterNumero(a.preco) ?? 0));
  }

  return filtrados;
}

function montarRespostaProdutos(produtos, query) {
  const filtrados = filtrarProdutos(produtos, query);
  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / PRODUTOS_POR_PAGINA));
  const paginaSolicitada = Number.parseInt(query.pagina, 10);
  const pagina = Number.isFinite(paginaSolicitada) && paginaSolicitada > 0
    ? Math.min(paginaSolicitada, totalPaginas)
    : 1;
  const offset = (pagina - 1) * PRODUTOS_POR_PAGINA;

  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));

  return {
    produtos: filtrados.slice(offset, offset + PRODUTOS_POR_PAGINA),
    total,
    pagina,
    limite: PRODUTOS_POR_PAGINA,
    totalPaginas,
    offset,
    categorias,
  };
}

app.get("/produtos", (req, res) => {
  try {
    const produtos = JSON.parse(fs.readFileSync(arquivoProdutos, "utf-8"));
    if (!Array.isArray(produtos)) {
      return res.status(500).json({ erro: "O arquivo produtos.json deve conter uma lista de produtos" });
    }
    res.status(200).json(montarRespostaProdutos(produtos, req.query));
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível ler produtos.json: " + error.message });
  }
});

app.listen(port, () => {
  console.log("API rodando na porta " + port + " -> http://localhost:" + port);
});

function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.status(401).json({ erro: "Token não enviado, usar Authorization Bearer <token>" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ erro: "Token inválido" });
    req.usuario = usuario;
    next();
  });
}
