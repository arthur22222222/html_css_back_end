// ===================== CONFIG =====================
// Ajuste aqui se sua API rodar em outro endereço/porta
const API_BASE = "http://localhost:3000";

// Quando o site é servido pelo index.js da raiz (porta 3001), a API de
// produtos está na mesma origem. Nos demais casos, usa a API da pasta front.
const API_PRODUTOS = window.location.port === "3001" ? "" : API_BASE;

// ===================== ESTADO DOS FILTROS =====================
const estadoProdutos = {
    busca: "",
    categoria: "",
    precoMin: "",
    precoMax: "",
    ordenar: "",
    pagina: 1,
};

// ===================== NAVEGAÇÃO =====================
function mostrarSecao(nome) {
    document.querySelectorAll(".secao").forEach((s) => (s.hidden = true));
    document.getElementById(`secao-${nome}`).hidden = false;

    document.querySelectorAll(".nav-btn[data-secao]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.secao === nome);
    });

    if (nome === "produtos") carregarProdutos(estadoProdutos.pagina);
    if (nome === "carrinho") renderCarrinho();
}

document.querySelectorAll("[data-secao]").forEach((el) => {
    el.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSecao(el.dataset.secao);
    });
});

// ===================== SESSÃO (LOGIN) =====================
function getUsuarioLogado() {
    const raw = localStorage.getItem("usuarioLogado");
    return raw ? JSON.parse(raw) : null;
}

function atualizarNavbarUsuario() {
    const usuario = getUsuarioLogado();
    const navbarUser = document.getElementById("navbarUser");
    const btnLoginNav = document.getElementById("btnLoginNav");

    if (usuario) {
        navbarUser.style.display = "flex";
        btnLoginNav.style.display = "none";
        document.getElementById("usuarioNome").textContent = `Olá, ${usuario.nome}`;
    } else {
        navbarUser.style.display = "none";
        btnLoginNav.style.display = "inline-block";
    }
}

document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    atualizarNavbarUsuario();
    mostrarSecao("produtos");
});

document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;
    const erroEl = document.getElementById("loginErro");
    erroEl.textContent = "";

    try {
        const resposta = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            erroEl.textContent = dados.resposta || "Não foi possível entrar.";
            return;
        }

        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
        atualizarNavbarUsuario();
        document.getElementById("formLogin").reset();
        mostrarSecao("produtos");
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
    }
});

// ===================== CEP (CADASTRO) =====================
function pesquisar(cep) {
    const cepInput = document.getElementById("cep");
    const erroCep = document.getElementById("cepErro");

    cep = cep.replace(/\D/g, "");

    if (cep.length === 8) {
        cepInput.classList.remove("invalid");
        cepInput.setCustomValidity("");
        erroCep.textContent = "";

        const link = "https://viacep.com.br/ws/" + cep + "/json/?callback=preencherEndereco";
        var script = document.createElement("script");
        script.src = link;
        document.body.appendChild(script);
    } else if (cep.length > 0) {
        cepInput.classList.add("invalid");
        cepInput.setCustomValidity("CEP deve conter 8 dígitos.");
        erroCep.textContent = "CEP inválido: informe exatamente 8 números.";
    } else {
        cepInput.classList.remove("invalid");
        cepInput.setCustomValidity("");
        erroCep.textContent = "";
    }
}

function preencherEndereco(conteudo) {
    if (!("erro" in conteudo)) {
        document.getElementById("rua").value = conteudo.logradouro;
        document.getElementById("bairro").value = conteudo.bairro;
        document.getElementById("cidade").value = conteudo.localidade;
        document.getElementById("estado").value = conteudo.uf;
    } else {
        alert("CEP não encontrado!");
    }
}

// ===================== CADASTRO =====================
// Os nomes dos campos abaixo seguem exatamente o que a API espera (bd.json)
function pegarDadosCadastro() {
    return {
        nome: document.getElementById("nome").value,
        cpf: document.getElementById("cpf").value,
        gmail: document.getElementById("email").value,
        telefone: document.getElementById("celular").value,
        senha: document.getElementById("senha").value,
        cep: document.getElementById("cep").value,
        rua: document.getElementById("rua").value,
        "numero casa": document.getElementById("numero_casa").value,
        bairro: document.getElementById("bairro").value,
        cidade: document.getElementById("cidade").value,
        estado: document.getElementById("estado").value,
        data_nasc: document.getElementById("dt_nasc").value,
    };
}

document.getElementById("formCadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById("cadastroErro");
    erroEl.textContent = "";
    const dados = pegarDadosCadastro();

    try {
        const resposta = await fetch(`${API_BASE}/cliente/cadastro`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(dados),
        });
        const corpo = await resposta.json();

        if (!resposta.ok) {
            erroEl.textContent = corpo.resposta || "Erro ao cadastrar!";
            return;
        }

        alert("Cliente cadastrado com sucesso!");
        document.getElementById("formCadastro").reset();
        mostrarSecao("login");
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
    }
});

// ===================== PRODUTOS =====================
const NOMES_CATEGORIAS = {
    processador: "Processadores",
    "placa-mae": "Placas-mãe",
    memoria: "Memórias",
    armazenamento: "Armazenamento",
    "placa-de-video": "Placas de vídeo",
    fonte: "Fontes",
    gabinete: "Gabinetes",
    periferico: "Periféricos",
    monitor: "Monitores",
    vestuario: "Vestuário",
    calcado: "Calçados",
    acessorio: "Acessórios",
    audio: "Áudio",
    utilidade: "Utilidades",
    jogo: "Jogos",
    console: "Consoles",
    "acessorio-gamer": "Acessórios Gamer",
};

let requisicaoProdutos = 0;
let timerBusca = null;

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatarCategoria(categoria) {
    const chave = String(categoria || "").toLowerCase();
    if (NOMES_CATEGORIAS[chave]) return NOMES_CATEGORIAS[chave];
    return chave
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function lerFiltrosDoFormulario() {
    estadoProdutos.busca = document.getElementById("buscaProduto").value.trim();
    estadoProdutos.categoria = document.getElementById("categoriaProduto").value;
    estadoProdutos.precoMin = document.getElementById("precoMin").value.trim();
    estadoProdutos.precoMax = document.getElementById("precoMax").value.trim();
    estadoProdutos.ordenar = document.getElementById("ordenarProdutos").value;
    estadoProdutos.pagina = 1;
}

function aplicarFiltros() {
    lerFiltrosDoFormulario();

    const precoMin = estadoProdutos.precoMin === "" ? null : Number(estadoProdutos.precoMin);
    const precoMax = estadoProdutos.precoMax === "" ? null : Number(estadoProdutos.precoMax);

    if (precoMin !== null && precoMax !== null && precoMin > precoMax) {
        document.getElementById("produtosErro").textContent =
            "O preço mínimo não pode ser maior que o preço máximo.";
        return;
    }

    carregarProdutos(1);
}

function atualizarCategorias(categorias) {
    const select = document.getElementById("categoriaProduto");
    const categoriaSelecionada = estadoProdutos.categoria || select.value;

    select.innerHTML = '<option value="">Todas as categorias</option>';
    (categorias || []).forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = formatarCategoria(categoria);
        select.appendChild(option);
    });

    const existe = [...select.options].some((option) => option.value === categoriaSelecionada);
    select.value = existe ? categoriaSelecionada : "";
    estadoProdutos.categoria = select.value;
}

function renderPaginacao(paginaAtual, totalPaginas) {
    const nav = document.getElementById("paginacaoProdutos");
    nav.innerHTML = "";
    if (totalPaginas <= 1) return;

    function criarBotao(texto, pagina, opcoes = {}) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = texto;
        if (pagina !== null) botao.dataset.pagina = pagina;
        if (opcoes.ativo) {
            botao.classList.add("ativa");
            botao.setAttribute("aria-current", "page");
        }
        if (opcoes.desabilitado) botao.disabled = true;
        if (opcoes.ariaLabel) botao.setAttribute("aria-label", opcoes.ariaLabel);
        return botao;
    }

    nav.appendChild(
        criarBotao("« Anterior", paginaAtual - 1, {
            desabilitado: paginaAtual === 1,
            ariaLabel: "Página anterior",
        })
    );

    for (let i = 1; i <= totalPaginas; i++) {
        nav.appendChild(
            criarBotao(String(i), i, {
                ativo: i === paginaAtual,
                ariaLabel: `Página ${i}`,
            })
        );
    }

    nav.appendChild(
        criarBotao("Próxima »", paginaAtual + 1, {
            desabilitado: paginaAtual === totalPaginas,
            ariaLabel: "Próxima página",
        })
    );
}

async function carregarProdutos(pagina = 1) {
    const lista = document.getElementById("listaProdutos");
    const erroEl = document.getElementById("produtosErro");
    const resumoEl = document.getElementById("resumoProdutos");
    const paginacaoEl = document.getElementById("paginacaoProdutos");
    const numeroRequisicao = ++requisicaoProdutos;

    estadoProdutos.pagina = Math.max(1, Number(pagina) || 1);
    erroEl.textContent = "";
    resumoEl.textContent = "";
    paginacaoEl.innerHTML = "";
    lista.innerHTML = '<p class="aviso">Carregando produtos...</p>';

    const params = new URLSearchParams();
    if (estadoProdutos.busca) params.set("busca", estadoProdutos.busca);
    if (estadoProdutos.categoria) params.set("categoria", estadoProdutos.categoria);
    if (estadoProdutos.precoMin !== "") params.set("preco_min", estadoProdutos.precoMin);
    if (estadoProdutos.precoMax !== "") params.set("preco_max", estadoProdutos.precoMax);
    if (estadoProdutos.ordenar) params.set("ordenar", estadoProdutos.ordenar);
    params.set("pagina", estadoProdutos.pagina);

    try {
        const resposta = await fetch(`${API_PRODUTOS}/produtos?${params.toString()}`, {
            cache: "no-store",
        });
        const dados = await resposta.json();

        if (numeroRequisicao !== requisicaoProdutos) return;

        if (!resposta.ok) {
            lista.innerHTML = "";
            erroEl.textContent = dados.resposta || dados.erro || "Não foi possível carregar os produtos.";
            return;
        }

        // Aceita a resposta paginada nova e também um array (API antiga).
        const respostaPaginada = !Array.isArray(dados);
        const produtos = respostaPaginada ? dados.produtos || [] : dados;
        const total = respostaPaginada ? Number(dados.total) || 0 : produtos.length;
        const totalPaginas = respostaPaginada ? Math.max(1, Number(dados.totalPaginas) || 1) : 1;
        const paginaAtual = respostaPaginada ? Math.max(1, Number(dados.pagina) || 1) : 1;
        const limite = respostaPaginada ? Number(dados.limite) || produtos.length : produtos.length;
        const categorias = respostaPaginada
            ? dados.categorias || []
            : [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];

        estadoProdutos.pagina = paginaAtual;
        atualizarCategorias(categorias);

        lista.innerHTML = "";

        if (produtos.length === 0) {
            lista.innerHTML = '<p class="aviso">Nenhum produto encontrado com esses filtros.</p>';
            resumoEl.textContent = "0 produtos encontrados";
            return;
        }

        produtos.forEach((produto) => {
            const card = document.createElement("div");
            card.className = "card-produto";
            const categoria = produto.categoria
                ? `<span class="card-produto-categoria">${escaparHtml(formatarCategoria(produto.categoria))}</span>`
                : "";
            card.innerHTML = `
                <div class="card-produto-emoji">${escaparHtml(produto.emoji || "🛒")}</div>
                ${categoria}
                <h3>${escaparHtml(produto.nome)}</h3>
                <p class="card-produto-desc">${escaparHtml(produto.descricao || "")}</p>
                <p class="card-produto-preco">${formatarPreco(produto.preco)}</p>
                <button class="submit-btn" data-add-id="${escaparHtml(produto.id)}">Adicionar ao carrinho</button>
            `;
            lista.appendChild(card);
        });

        const primeiro = (paginaAtual - 1) * limite + 1;
        const ultimo = primeiro + produtos.length - 1;
        resumoEl.textContent =
            `Mostrando ${primeiro}–${ultimo} de ${total} produto(s) • Página ${paginaAtual} de ${totalPaginas}`;

        renderPaginacao(paginaAtual, totalPaginas);

        lista.querySelectorAll("[data-add-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const produto = produtos.find((p) => String(p.id) === btn.dataset.addId);
                adicionarAoCarrinho(produto);
            });
        });
    } catch (error) {
        if (numeroRequisicao !== requisicaoProdutos) return;
        lista.innerHTML = "";
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
    }
}

// ===================== EVENTOS DOS FILTROS =====================
document.getElementById("formFiltrosProdutos").addEventListener("submit", (e) => {
    e.preventDefault();
    aplicarFiltros();
});

document.getElementById("buscaProduto").addEventListener("input", () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(aplicarFiltros, 450);
});

document.getElementById("categoriaProduto").addEventListener("change", aplicarFiltros);
document.getElementById("ordenarProdutos").addEventListener("change", aplicarFiltros);
document.getElementById("precoMin").addEventListener("change", aplicarFiltros);
document.getElementById("precoMax").addEventListener("change", aplicarFiltros);

document.getElementById("btnLimparFiltros").addEventListener("click", () => {
    document.getElementById("formFiltrosProdutos").reset();
    estadoProdutos.busca = "";
    estadoProdutos.categoria = "";
    estadoProdutos.precoMin = "";
    estadoProdutos.precoMax = "";
    estadoProdutos.ordenar = "";
    estadoProdutos.pagina = 1;
    carregarProdutos(1);
});

document.getElementById("paginacaoProdutos").addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-pagina]");
    if (!botao || botao.disabled) return;

    carregarProdutos(Number(botao.dataset.pagina));
    document.getElementById("secao-produtos").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ===================== CARRINHO (localStorage) =====================
// Obs: a API atual não tem endpoints de carrinho, então ele fica salvo no
// navegador. Se quiser persistir no backend, dá pra adicionar rotas depois.
function getCarrinho() {
    return JSON.parse(localStorage.getItem("carrinho") || "[]");
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

function adicionarAoCarrinho(produto) {
    if (!produto) return;
    const carrinho = getCarrinho();
    const item = carrinho.find((i) => i.id === produto.id);
    if (item) {
        item.qtd += 1;
    } else {
        carrinho.push({ id: produto.id, nome: produto.nome, preco: produto.preco, qtd: 1 });
    }
    salvarCarrinho(carrinho);
}

function alterarQtd(id, delta) {
    let carrinho = getCarrinho();
    const item = carrinho.find((i) => i.id === id);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) {
        carrinho = carrinho.filter((i) => i.id !== id);
    }
    salvarCarrinho(carrinho);
    renderCarrinho();
}

function removerDoCarrinho(id) {
    const carrinho = getCarrinho().filter((i) => i.id !== id);
    salvarCarrinho(carrinho);
    renderCarrinho();
}

function atualizarContadorCarrinho() {
    const total = getCarrinho().reduce((soma, i) => soma + i.qtd, 0);
    document.getElementById("carrinhoContador").textContent = total;
}

function renderCarrinho() {
    const carrinho = getCarrinho();
    const lista = document.getElementById("listaCarrinho");
    const vazioEl = document.getElementById("carrinhoVazio");
    const totalEl = document.getElementById("carrinhoTotal");
    const btnFinalizar = document.getElementById("btnFinalizar");

    lista.innerHTML = "";

    if (carrinho.length === 0) {
        vazioEl.hidden = false;
        totalEl.textContent = "";
        btnFinalizar.hidden = true;
        return;
    }

    vazioEl.hidden = true;
    btnFinalizar.hidden = false;

    let total = 0;
    carrinho.forEach((item) => {
        const subtotal = item.preco * item.qtd;
        total += subtotal;
        const linha = document.createElement("div");
        linha.className = "item-carrinho";
        linha.innerHTML = `
            <span class="item-nome">${item.nome}</span>
            <div class="item-qtd">
                <button data-menos="${item.id}">−</button>
                <span>${item.qtd}</span>
                <button data-mais="${item.id}">+</button>
            </div>
            <span class="item-subtotal">R$ ${subtotal.toFixed(2).replace(".", ",")}</span>
            <button class="item-remover" data-remover="${item.id}">Remover</button>
        `;
        lista.appendChild(linha);
    });

    totalEl.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;

    lista.querySelectorAll("[data-mais]").forEach((b) =>
        b.addEventListener("click", () => alterarQtd(Number(b.dataset.mais), 1))
    );
    lista.querySelectorAll("[data-menos]").forEach((b) =>
        b.addEventListener("click", () => alterarQtd(Number(b.dataset.menos), -1))
    );
    lista.querySelectorAll("[data-remover]").forEach((b) =>
        b.addEventListener("click", () => removerDoCarrinho(Number(b.dataset.remover)))
    );
}

document.getElementById("btnFinalizar").addEventListener("click", () => {
    const usuario = getUsuarioLogado();
    if (!usuario) {
        alert("Faça login para finalizar a compra.");
        mostrarSecao("login");
        return;
    }
    alert("Compra finalizada com sucesso! (integrar com endpoint de pedidos quando existir)");
    salvarCarrinho([]);
    renderCarrinho();
});

// ===================== INICIALIZAÇÃO =====================
atualizarNavbarUsuario();
atualizarContadorCarrinho();
mostrarSecao("produtos");
