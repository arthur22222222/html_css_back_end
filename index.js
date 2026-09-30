// npm init
//npm install express
// baixar extensao rapid api


const express = require('express');
const fs = require('fs');
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
      const cpfDoCliente = cliente.cpf.replace(/[^\d]/g, '');
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
        return cliente.cpf.replace(/[^\d]/g, '') == cpf.replace(/[^\d]/g, '');
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
              return cliente.cpf.replace(/\D/g, "") == cpf.replace(/\D/g, "");
            })
        if (indice_cliente == -1){
            return res.status(404).json({resposta: "clientes não encontrado!"})
        }
        clientes[indice_cliente] = dados
        fs.writeFileSync('bd.json', JSON.stringify(clientes), 'utf8')
        res.status(200).json({resposta: "Cliente alterado com sucesso!"})
    }catch (error) {
        res.status(500).json({resposta: error.message})
    }
  })


app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
});

//==================== NOVAS ROTAS - PERFIL ====================

// GET /cliente/perfil  (precisa de x-nome e x-senha)
app.get("/cliente/perfil", (req, res) => {
  const auth = autenticar(req);
  if (auth.erro) {
    return res.status(auth.status).json({ resposta: auth.erro });
  }

  const { senha, ...perfil } = auth.cliente;
  res.status(200).json(perfil);
});

// DELETE /cliente/perfil  (precisa de x-nome e x-senha)
app.delete("/cliente/perfil", (req, res) => {
  const auth = autenticar(req);
  if (auth.erro) {
    return res.status(auth.status).json({ resposta: auth.erro });
  }

  try {
    const clientes = lerArquivo('bd.json');
    const indice = clientes.findIndex(c => c.nome === auth.cliente.nome && c.senha === auth.cliente.senha);

    if (indice === -1) {
      return res.status(404).json({ resposta: "Cliente não encontrado" });
    }

    clientes.splice(indice, 1);
    salvarArquivo('bd.json', clientes);

    res.status(200).json({ resposta: "Perfil deletado com sucesso!" });
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

// ==================== NOVAS ROTAS - PRODUTOS ====================

// GET /produto  → lista todos os produtos
app.get("/produto", (req, res) => {
  try {
    const produtos = lerArquivo('produtos.json');
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

// GET /produto/:id  → busca produto por id
app.get("/produto/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const produtos = lerArquivo('produtos.json');
    const produto = produtos.find(p => p.id === id);

    if (!produto) {
      return res.status(404).json({ resposta: "Produto não encontrado" });
    }

    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

// ==================== NOVAS ROTAS - COMPRAS ====================

// POST /compra  (precisa de autenticação)
app.post("/compra", (req, res) => {
  const auth = autenticar(req);
  if (auth.erro) {
    return res.status(auth.status).json({ resposta: auth.erro });
  }

  const { produtos: itens } = req.body; // array de { idProduto, quantidade }

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ resposta: "Envie um array de produtos no body" });
  }

  try {
    const listaProdutos = lerArquivo('produtos.json');
    const compras = lerArquivo('compras.json');

    let total = 0;
    const produtosComprados = [];

    for (const item of itens) {
      const produto = listaProdutos.find(p => p.id === item.idProduto);

      if (!produto) {
        return res.status(404).json({ resposta: `Produto com id ${item.idProduto} não encontrado` });
      }

      if (produto.estoque < item.quantidade) {
        return res.status(400).json({ resposta: `Estoque insuficiente do produto ${produto.nome}` });
      }

      // Atualiza estoque
      produto.estoque -= item.quantidade;

      const subtotal = produto.preco * item.quantidade;
      total += subtotal;

      produtosComprados.push({
        idProduto: produto.id,
        nome: produto.nome,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        subtotal
      });
    }

    // Salva o estoque atualizado
    salvarArquivo('produtos.json', listaProdutos);

    // Cria a compra
    const novaCompra = {
      id: compras.length > 0 ? Math.max(...compras.map(c => c.id)) + 1 : 1,
      nomeCliente: auth.cliente.nome,
      produtos: produtosComprados,
      total: Number(total.toFixed(2)),
      data: new Date().toISOString()
    };

    compras.push(novaCompra);
    salvarArquivo('compras.json', compras);

    res.status(201).json({
      resposta: "Compra realizada com sucesso!",
      compra: novaCompra
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ resposta: error.message });
  }
});

// GET /compra  → lista as compras do cliente autenticado
app.get("/compra", (req, res) => {
  const auth = autenticar(req);
  if (auth.erro) {
    return res.status(auth.status).json({ resposta: auth.erro });
  }

  try {
    const compras = lerArquivo('compras.json');
    const minhasCompras = compras.filter(c => c.nomeCliente === auth.cliente.nome);
    res.status(200).json(minhasCompras);
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

// GET /compra/:id  → busca uma compra específica do cliente autenticado
app.get("/compra/:id", (req, res) => {
  const auth = autenticar(req);
  if (auth.erro) {
    return res.status(auth.status).json({ resposta: auth.erro });
  }

  try {
    const id = Number(req.params.id);
    const compras = lerArquivo('compras.json');

    const compra = compras.find(c => c.id === id && c.nomeCliente === auth.cliente.nome);

    if (!compra) {
      return res.status(404).json({ resposta: "Compra não encontrada" });
    }

    res.status(200).json(compra);
  } catch (error) {
    res.status(500).json({ resposta: error.message });
  }
});

// ==================== INICIALIZAÇÃO ====================

app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);

  // Cria os arquivos se não existirem
  lerArquivo('bd.json');
  lerArquivo('produtos.json');
  lerArquivo('compras.json');
});