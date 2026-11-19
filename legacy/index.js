// npm init
//npm install express cors
// baixar extensao rapid api


const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require("cors");


const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

app.get('/ola', (req, res) => {
  res.send('Hello World!');
});

app.post("/cliente/cadastro", (req, res) => {
  const cliente = req.body;

  if (!cliente || Object.keys(cliente).length === 0) {
    return res.status(400).json({ resposta: "Body não preenchido" });
  }

  try {
    let bd = [];

    if (fs.existsSync('bd.json')) {
      const data = fs.readFileSync('bd.json', 'utf-8');
      bd = JSON.parse(data);
    }

    // impede cadastro de e-mail já existente
    const limpar = (v) => String(v || "").replace(/\D/g, "");
    const jaExiste = bd.some(
      (c) => c.gmail === cliente.gmail || (cliente.cpf && limpar(c.cpf) === limpar(cliente.cpf))
    );
    if (jaExiste) {
      return res.status(409).json({ resposta: "Já existe um cliente com este e-mail ou CPF" });
    }

    bd.push(cliente);

    fs.writeFileSync('bd.json', JSON.stringify(bd, null, 2));

    console.log('✅ Cliente cadastrado:', cliente);

    res.status(201).json({ resposta: "Cliente cadastrado com sucesso!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ resposta: "Erro interno no servidor" });
  }
});

app.get ("/clientes", (req, res )=> {
  try {
    const clientes = JSON.parse (fs.readFileSync('bd.json', 'utf-8'))
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json ({resposta:error.message})

  }
})

app.get("/cliente/:cpf", (req, res) => {
  const { cpf } = req.params;
  try {
    if (!fs.existsSync('bd.json')) {
      return res.status(404).json({ resposta: "Nenhum cliente cadastrado ainda" });
    }
    const data = fs.readFileSync('bd.json', 'utf-8');
    const clientes = JSON.parse(data);
    const cpfBuscado = cpf.replace(/[^\d]/g, '');
    const clienteEncontrado = clientes.find((cliente) => {
      if (!cliente.cpf) return false;
      const cpfDoCliente = String(cliente.cpf).replace(/[^\d]/g, '');
      return cpfDoCliente === cpfBuscado;
    });
    if (!clienteEncontrado) {
      return res.status(404).json({ resposta: "Cliente não encontrado com este CPF" });
    }
    res.status(200).json(clienteEncontrado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ resposta: error.message });
  }
});

app.delete("/cliente/:cpf", (req, res) => {
  const {cpf} = req.params;
  try {
    if (!fs.existsSync('bd.json')) {
      return res.status(404).json({ resposta: "Nenhum cliente cadastrado ainda" });
    }
    const data = fs.readFileSync('bd.json', 'utf-8');
    const clientes = JSON.parse(data);
    const indice = clientes.findIndex(
      (cliente) => {
        if (!cliente.cpf) return false;
        return String(cliente.cpf).replace(/[^\d]/g, '') == cpf.replace(/[^\d]/g, '');
      }
    );
    if(indice !== -1){
      clientes.splice(indice, 1);
      fs.writeFileSync('bd.json', JSON.stringify(clientes, null, 2));
      res.status(200).json({ resposta: "Cliente deletado com sucesso!" });
    } else {
      res.status(404).json({ resposta: "Cliente não encontrado com este CPF" });
    }
  } catch (error) {
    res.status(500).json ({resposta:error.message})
  }
});

app.put("/clientes/:cpf", (req,res)=>{
    const cpf = req.params.cpf
    const dados = req.body
    try {
        const clientes = JSON.parse(fs.readFileSync('bd.json', 'utf8'))
        const indice_cliente = clientes.findIndex(
            (cliente)=> {
              if (!cliente.cpf) return false;
              return String(cliente.cpf).replace(/\D/g, "") == cpf.replace(/\D/g, "");
            })
        if (indice_cliente == -1){
            return res.status(404).json({resposta: "clientes não encontrado!"})
        }
        clientes[indice_cliente] = dados
        fs.writeFileSync('bd.json', JSON.stringify(clientes, null, 2), 'utf8')
        res.status(200).json({resposta: "Cliente alterado com sucesso!"})
    }catch (error) {
        res.status(500).json({resposta: error.message})
    }
  })

// ---------- LOGIN ----------
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ resposta: "Informe e-mail e senha" });
  }
  try {
    if (!fs.existsSync('bd.json')) {
      return res.status(404).json({ resposta: "Nenhum cliente cadastrado ainda" });
    }
    const clientes = JSON.parse(fs.readFileSync('bd.json', 'utf-8'));
    const usuario = clientes.find((c) => c.gmail === email && c.senha === senha);
    if (!usuario) {
      return res.status(401).json({ resposta: "E-mail ou senha inválidos" });
    }
    // não devolve a senha pro front
    const { senha: _senha, ...usuarioSemSenha } = usuario;
    res.status(200).json({ resposta: "Login realizado com sucesso!", usuario: usuarioSemSenha });
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

// ---------- PRODUTOS ----------
// Filtros aceitos em GET /produtos:
//   busca / nome / q  -> busca parcial por nome (sem diferenciar maiúsculas/acentos)
//   categoria         -> exemplo: categoria=processador
//   preco_min         -> exemplo: preco_min=200
//   preco_max         -> exemplo: preco_max=700
//   ordenar           -> preco_asc | preco_desc (também aceita ordem=asc|desc)
//   pagina            -> página da listagem (10 produtos por página)
const PRODUTOS_POR_PAGINA = 10;
const arquivoProdutos = path.join(__dirname, "produtos.json");

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
    if (!fs.existsSync(arquivoProdutos)) {
      return res.status(404).json({ resposta: "Nenhum produto cadastrado ainda" });
    }

    const produtos = JSON.parse(fs.readFileSync(arquivoProdutos, "utf-8"));
    if (!Array.isArray(produtos)) {
      return res.status(500).json({ resposta: "O arquivo produtos.json deve conter uma lista de produtos" });
    }

    res.status(200).json(montarRespostaProdutos(produtos, req.query));
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

app.get("/produtos/:id", (req, res) => {
  const { id } = req.params;
  try {
    const produtos = JSON.parse(fs.readFileSync(arquivoProdutos, "utf-8"));
    const produto = produtos.find((p) => String(p.id) === id);
    if (!produto) return res.status(404).json({ resposta: "Produto não encontrado" });
    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
});
