// ===================== CONFIG =====================
// Servido pelo backend (porta 3000): usa a mesma origem.
// Aberto via Live Server ou direto pelo arquivo: usa a API local.
const API_BASE = window.location.port === "3000"
    ? window.location.origin
    : "http://localhost:3000";

const CARRINHO_KEY = "carrinho_v2";
const PRODUTOS_POR_PAGINA = 10;

// ===================== NOTIFICAÇÕES ANIMADAS =====================
const NOTIFICACAO_ICONES = {
    sucesso: "✅",
    erro: "❌",
    aviso: "⚠️",
    info: "ℹ️",
};

const NOTIFICACAO_TITULOS = {
    sucesso: "Sucesso",
    erro: "Erro",
    aviso: "Atenção",
    info: "Informação",
};

function mostrarNotificacao(mensagem, tipo = "info", duracao = 4200) {
    const container = document.getElementById("notificacoes");
    if (!container) return;

    const tipoFinal = NOTIFICACAO_ICONES[tipo] ? tipo : "info";
    const duracaoFinal = Math.max(1500, Number(duracao) || 4200);

    // Mantém no máximo 4 notificações na tela.
    while (container.children.length >= 4) {
        container.firstElementChild.remove();
    }

    const notificacao = document.createElement("div");
    notificacao.className = `notificacao notificacao-${tipoFinal}`;
    notificacao.style.setProperty("--notif-duracao", `${duracaoFinal}ms`);
    notificacao.setAttribute("role", tipoFinal === "erro" ? "alert" : "status");

    const icone = document.createElement("div");
    icone.className = "notificacao-icone";
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = NOTIFICACAO_ICONES[tipoFinal];

    const conteudo = document.createElement("div");
    conteudo.className = "notificacao-conteudo";

    const titulo = document.createElement("div");
    titulo.className = "notificacao-titulo";
    titulo.textContent = NOTIFICACAO_TITULOS[tipoFinal];

    const texto = document.createElement("div");
    texto.className = "notificacao-mensagem";
    texto.textContent = mensagem;

    conteudo.append(titulo, texto);

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "notificacao-fechar";
    fechar.setAttribute("aria-label", "Fechar notificação");
    fechar.textContent = "×";

    const progresso = document.createElement("div");
    progresso.className = "notificacao-progresso";
    progresso.setAttribute("aria-hidden", "true");

    notificacao.append(icone, conteudo, fechar, progresso);
    container.appendChild(notificacao);

    let removendo = false;
    let timer = null;

    function remover() {
        if (removendo) return;
        removendo = true;
        clearTimeout(timer);
        notificacao.classList.add("saindo");

        // A animação de saída dura 0.3s; o timeout remove o elemento do DOM.
        setTimeout(() => notificacao.remove(), 320);
    }

    timer = setTimeout(remover, duracaoFinal);
    fechar.addEventListener("click", remover);
}

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
    // O perfil é uma área privada: sem login, abre a tela de login.
    if (nome === "perfil" && !getUsuarioLogado()) {
        mostrarNotificacao("Faça login para acessar seu perfil.", "info");
        nome = "login";
    }

    document.querySelectorAll(".secao").forEach((s) => (s.hidden = true));
    document.getElementById(`secao-${nome}`).hidden = false;

    document.querySelectorAll(".nav-btn[data-secao]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.secao === nome);
    });

    if (nome === "produtos") carregarProdutos(estadoProdutos.pagina);
    if (nome === "carrinho") renderCarrinho();
    if (nome === "perfil") carregarPerfil();
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
    if (!raw) return null;
    try {
        const usuario = JSON.parse(raw);
        return usuario && usuario.token ? usuario : null;
    } catch {
        return null;
    }
}

// ===================== MENU DO USUÁRIO =====================
const btnMenuUsuario = document.getElementById("btnMenuUsuario");
const menuUsuarioLista = document.getElementById("menuUsuarioLista");

function fecharMenuUsuario() {
    menuUsuarioLista.hidden = true;
    btnMenuUsuario.setAttribute("aria-expanded", "false");
}

function alternarMenuUsuario() {
    const abrir = menuUsuarioLista.hidden;
    menuUsuarioLista.hidden = !abrir;
    btnMenuUsuario.setAttribute("aria-expanded", String(abrir));
}

btnMenuUsuario.addEventListener("click", (e) => {
    e.stopPropagation();
    alternarMenuUsuario();
});

// Fecha ao clicar fora do menu.
document.addEventListener("click", (e) => {
    if (menuUsuarioLista.hidden) return;
    if (e.target.closest("#menuUsuario")) return;
    fecharMenuUsuario();
});

// Fecha com Esc e devolve o foco para o botão.
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || menuUsuarioLista.hidden) return;
    fecharMenuUsuario();
    btnMenuUsuario.focus();
});

document.getElementById("btnPerfilMenu").addEventListener("click", () => {
    fecharMenuUsuario();
});

function atualizarNavbarUsuario() {
    const usuario = getUsuarioLogado();
    const navbarUser = document.getElementById("navbarUser");
    const btnLoginNav = document.getElementById("btnLoginNav");

    fecharMenuUsuario();

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
    fecharMenuUsuario();
    localStorage.removeItem("usuarioLogado");
    atualizarNavbarUsuario();
    limparPerfil();
    mostrarSecao("produtos");
    mostrarNotificacao("Você saiu da sua conta.", "info");
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
            erroEl.textContent = dados.msg || dados.erro || "Não foi possível entrar.";
            return;
        }

        localStorage.setItem("usuarioLogado", JSON.stringify({
            nome: dados.nome,
            token: dados.token,
        }));
        atualizarNavbarUsuario();
        document.getElementById("formLogin").reset();
        mostrarSecao("produtos");
        mostrarNotificacao(`Bem-vindo, ${dados.nome}!`, "sucesso");
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
    }
});

// ===================== CADASTRO =====================
// Campos que a tabela "cliente" do backend possui.
function pegarDadosCadastro() {
    return {
        nome: document.getElementById("nome").value.trim(),
        cpf: document.getElementById("cpf").value.trim(),
        celular: document.getElementById("celular").value.replace(/\s+/g, ""),
        email: document.getElementById("email").value.trim(),
        senha: document.getElementById("senha").value,
    };
}

document.getElementById("formCadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById("cadastroErro");
    erroEl.textContent = "";
    const dados = pegarDadosCadastro();

    try {
        const resposta = await fetch(`${API_BASE}/cliente`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(dados),
        });
        const corpo = await resposta.json();

        if (!resposta.ok) {
            let mensagem = corpo.erro || corpo.msg || "Erro ao cadastrar!";
            if (String(mensagem).toLowerCase().includes("duplicate")) {
                mensagem = "E-mail ou CPF já cadastrado.";
            }
            erroEl.textContent = mensagem;
            return;
        }

        mostrarNotificacao("Cliente cadastrado com sucesso!", "sucesso");
        document.getElementById("formCadastro").reset();
        mostrarSecao("login");
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
    }
});

// ===================== PERFIL =====================
let carregandoPerfil = false;

function somenteDigitos(valor) {
    return String(valor ?? "").replace(/\D/g, "");
}

function mascaraCpf(valor) {
    const digitos = somenteDigitos(valor).slice(0, 11);
    if (!digitos) return "";
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    if (digitos.length <= 9) {
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    }
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

function mascaraCelular(valor) {
    const digitos = somenteDigitos(valor).slice(0, 11);
    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;

    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);

    if (numero.length <= 5) return `(${ddd})${numero}`;
    // Fixo: (43)9966-4654 | Celular: (43)99966-4654
    if (numero.length === 8) return `(${ddd})${numero.slice(0, 4)}-${numero.slice(4)}`;
    return `(${ddd})${numero.slice(0, 5)}-${numero.slice(5)}`;
}

function limparPerfil() {
    const form = document.getElementById("formPerfil");
    if (form) form.reset();

    const erroEl = document.getElementById("perfilErro");
    if (erroEl) erroEl.textContent = "";

    document.getElementById("perfilNomeExibicao").textContent = "Seu perfil";
    document.getElementById("perfilEmailExibicao").textContent = "";
    document.getElementById("perfilAvatar").textContent = "?";
}

function preencherPerfil(perfil) {
    document.getElementById("perfilNome").value = perfil.nome || "";
    document.getElementById("perfilEmail").value = perfil.email || "";
    document.getElementById("perfilCpf").value = mascaraCpf(perfil.cpf || "");
    document.getElementById("perfilCelular").value = mascaraCelular(perfil.celular || "");
    document.getElementById("perfilSenhaAtual").value = "";
    document.getElementById("perfilNovaSenha").value = "";
    document.getElementById("perfilConfirmarSenha").value = "";
    document.getElementById("perfilErro").textContent = "";

    const nome = String(perfil.nome || "").trim();
    document.getElementById("perfilNomeExibicao").textContent = nome || "Seu perfil";
    document.getElementById("perfilEmailExibicao").textContent = perfil.email || "";
    document.getElementById("perfilAvatar").textContent = (nome.charAt(0) || "?").toUpperCase();
}

function validarPerfil(dados) {
    if (dados.nome.length < 2 || dados.nome.length > 100) {
        return "Informe um nome entre 2 e 100 caracteres.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email) || dados.email.length > 100) {
        return "Informe um e-mail válido.";
    }
    if (dados.cpf.length !== 11 || /^(\d)\1{10}$/.test(dados.cpf)) {
        return "Informe um CPF válido com 11 dígitos.";
    }
    if (dados.celular.length < 10 || dados.celular.length > 11) {
        return "Informe um celular com DDD e 10 ou 11 dígitos.";
    }

    const querTrocarSenha = Boolean(dados.senhaAtual || dados.novaSenha || dados.confirmarSenha);
    if (querTrocarSenha) {
        if (!dados.senhaAtual) return "Informe sua senha atual para trocar a senha.";
        if (!dados.novaSenha) return "Informe a nova senha.";
        if (dados.novaSenha.length < 6 || dados.novaSenha.length > 72) {
            return "A nova senha deve ter entre 6 e 72 caracteres.";
        }
        if (dados.novaSenha !== dados.confirmarSenha) {
            return "As senhas novas não coincidem.";
        }
    }

    return "";
}

function encerrarSessao(mensagem) {
    localStorage.removeItem("usuarioLogado");
    atualizarNavbarUsuario();
    limparPerfil();
    mostrarSecao("login");
    if (mensagem) mostrarNotificacao(mensagem, "aviso", 6000);
}

async function carregarPerfil() {
    const usuario = getUsuarioLogado();
    const erroEl = document.getElementById("perfilErro");

    if (!usuario) {
        mostrarNotificacao("Faça login para acessar seu perfil.", "info");
        return false;
    }
    if (carregandoPerfil) return false;

    carregandoPerfil = true;
    erroEl.textContent = "";

    const btn = document.getElementById("btnSalvarPerfil");
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Carregando...";

    try {
        const resposta = await fetch(`${API_BASE}/cliente/perfil`, {
            headers: { authorization: `Bearer ${usuario.token}` },
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            if (resposta.status === 401 || resposta.status === 403) {
                encerrarSessao("Sua sessão expirou. Faça login novamente.");
                return false;
            }
            erroEl.textContent = dados.erro || dados.msg || "Não foi possível carregar seu perfil.";
            return false;
        }

        preencherPerfil(dados);
        return true;
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
        return false;
    } finally {
        carregandoPerfil = false;
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
}

document.getElementById("formPerfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById("perfilErro");
    erroEl.textContent = "";

    const usuario = getUsuarioLogado();
    if (!usuario) {
        mostrarNotificacao("Faça login para acessar seu perfil.", "info");
        mostrarSecao("login");
        return;
    }

    const dados = {
        nome: document.getElementById("perfilNome").value.trim(),
        email: document.getElementById("perfilEmail").value.trim(),
        cpf: somenteDigitos(document.getElementById("perfilCpf").value),
        celular: somenteDigitos(document.getElementById("perfilCelular").value),
        senhaAtual: document.getElementById("perfilSenhaAtual").value,
        novaSenha: document.getElementById("perfilNovaSenha").value,
        confirmarSenha: document.getElementById("perfilConfirmarSenha").value,
    };

    const erroValidacao = validarPerfil(dados);
    if (erroValidacao) {
        erroEl.textContent = erroValidacao;
        mostrarNotificacao(erroValidacao, "aviso");
        return;
    }

    const btn = document.getElementById("btnSalvarPerfil");
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Salvando...";

    try {
        const resposta = await fetch(`${API_BASE}/cliente/perfil`, {
            method: "PUT",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${usuario.token}`,
            },
            body: JSON.stringify({
                nome: dados.nome,
                cpf: dados.cpf,
                celular: dados.celular,
                email: dados.email,
                senha_atual: dados.senhaAtual,
                nova_senha: dados.novaSenha,
            }),
        });
        const corpo = await resposta.json().catch(() => ({}));
        const mensagem = corpo.erro || corpo.msg || "Não foi possível salvar seu perfil.";

        if (!resposta.ok) {
            // 401 também é usado quando a senha atual está errada; nesse caso
            // não encerramos a sessão, apenas mostramos o aviso.
            const senhaIncorreta = resposta.status === 401 && /senha atual/i.test(mensagem);

            if ((resposta.status === 401 || resposta.status === 403) && !senhaIncorreta) {
                encerrarSessao("Sua sessão expirou. Faça login novamente.");
                return;
            }

            erroEl.textContent = mensagem;
            mostrarNotificacao(mensagem, resposta.status === 409 ? "aviso" : "erro");
            return;
        }

        const cliente = corpo.cliente || {};
        localStorage.setItem("usuarioLogado", JSON.stringify({
            nome: cliente.nome || dados.nome,
            token: corpo.token || usuario.token,
        }));

        atualizarNavbarUsuario();
        preencherPerfil(cliente);
        mostrarNotificacao(corpo.msg || "Dados atualizados com sucesso!", "sucesso");
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
        mostrarNotificacao("Erro ao conectar com o servidor.", "erro");
    } finally {
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
});

document.getElementById("btnCancelarPerfil").addEventListener("click", async () => {
    const recarregou = await carregarPerfil();
    if (recarregou) mostrarNotificacao("Alterações descartadas.", "info");
});

document.getElementById("perfilCpf").addEventListener("input", (e) => {
    e.target.value = mascaraCpf(e.target.value);
});

document.getElementById("perfilCelular").addEventListener("input", (e) => {
    e.target.value = mascaraCelular(e.target.value);
});

// ===================== PRODUTOS =====================
const NOMES_CATEGORIAS = {
    fps: "FPS",
    rpg: "RPG",
    aventura: "Aventura",
    estrategia: "Estratégia",
    esporte: "Esporte",
    simulacao: "Simulação",
    mmo: "MMO",
    "battle royale": "Battle Royale",
};

const EMOJIS_CATEGORIAS = {
    fps: "🎯",
    rpg: "⚔️",
    aventura: "🗺️",
    estrategia: "🧠",
    esporte: "⚽",
    simulacao: "🛠️",
    mmo: "🌐",
    "battle royale": "🪂",
};

let requisicaoProdutos = 0;
let timerBusca = null;

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

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
    const chave = normalizar(categoria);
    if (NOMES_CATEGORIAS[chave]) return NOMES_CATEGORIAS[chave];

    const texto = String(categoria || "").replace(/[-_]/g, " ").trim();
    return texto.replace(/\b\w/g, (letra) => letra.toUpperCase());
}

// Usa a capa cadastrada em caminho_img. O emoji da categoria fica como
// fallback caso a imagem não exista ou não carregue.
function emojiProduto(produto) {
    return EMOJIS_CATEGORIAS[normalizar(produto.categoria)] || "🎮";
}

function urlImagemProduto(produto) {
    const caminho = String(produto?.caminho_img || "").trim().replace(/^\/+/, "");
    if (!caminho) return "";
    return `${API_BASE}/img/${caminho}`;
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

    try {
        const resposta = await fetch(`${API_BASE}/produto`, { cache: "no-store" });
        const dados = await resposta.json();

        if (numeroRequisicao !== requisicaoProdutos) return;

        if (!resposta.ok) {
            lista.innerHTML = "";
            erroEl.textContent =
                dados.erro || dados.resposta || "Não foi possível carregar os produtos.";
            return;
        }

        const produtos = Array.isArray(dados) ? dados : dados.produtos || [];
        const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))]
            .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
        atualizarCategorias(categorias);

        const busca = normalizar(estadoProdutos.busca);
        const categoria = normalizar(estadoProdutos.categoria);
        const precoMin = estadoProdutos.precoMin === "" ? null : Number(estadoProdutos.precoMin);
        const precoMax = estadoProdutos.precoMax === "" ? null : Number(estadoProdutos.precoMax);

        const filtrados = produtos.filter((produto) => {
            const nome = normalizar(produto.nome);
            const categoriaProduto = normalizar(produto.categoria);
            const preco = Number(produto.preco);

            if (busca && !nome.includes(busca)) return false;
            if (categoria && categoriaProduto !== categoria) return false;
            if (precoMin !== null && (Number.isNaN(preco) || preco < precoMin)) return false;
            if (precoMax !== null && (Number.isNaN(preco) || preco > precoMax)) return false;
            return true;
        });

        if (estadoProdutos.ordenar === "preco_asc") {
            filtrados.sort((a, b) => Number(a.preco) - Number(b.preco));
        } else if (estadoProdutos.ordenar === "preco_desc") {
            filtrados.sort((a, b) => Number(b.preco) - Number(a.preco));
        }

        const total = filtrados.length;
        const totalPaginas = Math.max(1, Math.ceil(total / PRODUTOS_POR_PAGINA));
        const paginaAtual = Math.min(estadoProdutos.pagina, totalPaginas);
        estadoProdutos.pagina = paginaAtual;

        const inicio = (paginaAtual - 1) * PRODUTOS_POR_PAGINA;
        const produtosDaPagina = filtrados.slice(inicio, inicio + PRODUTOS_POR_PAGINA);

        lista.innerHTML = "";

        if (total === 0) {
            lista.innerHTML = '<p class="aviso">Nenhum produto encontrado com esses filtros.</p>';
            resumoEl.textContent = "0 produtos encontrados";
            return;
        }

        produtosDaPagina.forEach((produto) => {
            const estoque = Number(produto.quantidade_img);
            const semEstoque = Number.isFinite(estoque) && estoque <= 0;
            const categoriaHtml = produto.categoria
                ? `<span class="card-produto-categoria">${escaparHtml(formatarCategoria(produto.categoria))}</span>`
                : "";

            const imagemUrl = urlImagemProduto(produto);
            const imagemHtml = imagemUrl
                ? `<img class="card-produto-img" alt="Capa de ${escaparHtml(produto.nome)}" loading="lazy" data-src="${escaparHtml(imagemUrl)}">`
                : "";

            const card = document.createElement("div");
            card.className = "card-produto";
            card.innerHTML = `
                <div class="card-produto-imagem" data-emoji="${escaparHtml(emojiProduto(produto))}">${imagemHtml}</div>
                ${categoriaHtml}
                <h3>${escaparHtml(produto.nome)}</h3>
                <p class="card-produto-desc">${escaparHtml(produto.descricao || "")}</p>
                <p class="card-produto-preco">${formatarPreco(produto.preco)}</p>
                <p class="card-produto-estoque">${
                    semEstoque
                        ? "Sem estoque"
                        : `Em estoque: ${Number.isFinite(estoque) ? estoque : "—"}`
                }</p>
                <button class="submit-btn" data-add-id="${escaparHtml(produto.id)}" ${
                    semEstoque ? "disabled" : ""
                }>${semEstoque ? "Sem estoque" : "Adicionar ao carrinho"}</button>
            `;
            lista.appendChild(card);

            const imagem = card.querySelector(".card-produto-img");
            if (imagem) {
                imagem.addEventListener("error", () => imagem.remove(), { once: true });
                imagem.src = imagem.dataset.src;
                imagem.removeAttribute("data-src");
            }
        });

        const primeiro = inicio + 1;
        const ultimo = inicio + produtosDaPagina.length;
        resumoEl.textContent =
            `Mostrando ${primeiro}–${ultimo} de ${total} produto(s) • Página ${paginaAtual} de ${totalPaginas}`;

        renderPaginacao(paginaAtual, totalPaginas);

        lista.querySelectorAll("[data-add-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const produto = produtosDaPagina.find((p) => String(p.id) === btn.dataset.addId);
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
// Chave nova para não misturar com o carrinho antigo (catálogo antigo).
function getCarrinho() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CARRINHO_KEY) || "[]");
        if (!Array.isArray(bruto)) return [];

        return bruto
            .map((item) => ({
                id: Number(item.id),
                nome: String(item.nome || ""),
                preco: Number(item.preco) || 0,
                qtd: Math.max(1, Number(item.qtd) || 1),
                estoque: item.estoque === null || item.estoque === undefined
                    ? null
                    : Number(item.estoque),
            }))
            .filter((item) => Number.isInteger(item.id));
    } catch {
        return [];
    }
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CARRINHO_KEY, JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

function adicionarAoCarrinho(produto) {
    if (!produto) return;

    const estoque = Number(produto.quantidade_img);
    const estoqueValido = Number.isFinite(estoque) ? estoque : null;
    if (estoqueValido !== null && estoqueValido <= 0) {
        mostrarNotificacao("Produto sem estoque.", "aviso");
        return;
    }

    const carrinho = getCarrinho();
    const item = carrinho.find((i) => String(i.id) === String(produto.id));

    if (item) {
        const novaQtd = item.qtd + 1;
        if (estoqueValido !== null && novaQtd > estoqueValido) {
            mostrarNotificacao("Quantidade máxima em estoque atingida.", "aviso");
            return;
        }
        item.qtd = novaQtd;
    } else {
        carrinho.push({
            id: Number(produto.id),
            nome: produto.nome,
            preco: Number(produto.preco),
            qtd: 1,
            estoque: estoqueValido,
        });
    }

    salvarCarrinho(carrinho);
}

function alterarQtd(id, delta) {
    let carrinho = getCarrinho();
    const item = carrinho.find((i) => String(i.id) === String(id));
    if (!item) return;

    const novaQtd = item.qtd + delta;
    if (
        delta > 0 &&
        item.estoque !== null &&
        Number.isFinite(item.estoque) &&
        novaQtd > item.estoque
    ) {
        mostrarNotificacao("Quantidade máxima em estoque atingida.", "aviso");
        return;
    }

    item.qtd = novaQtd;
    if (item.qtd <= 0) {
        carrinho = carrinho.filter((i) => String(i.id) !== String(id));
    }
    salvarCarrinho(carrinho);
    renderCarrinho();
}

function removerDoCarrinho(id) {
    const carrinho = getCarrinho().filter((i) => String(i.id) !== String(id));
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
    const pagamentoEl = document.getElementById("carrinhoPagamento");
    const erroEl = document.getElementById("carrinhoErro");

    lista.innerHTML = "";
    erroEl.textContent = "";

    if (carrinho.length === 0) {
        vazioEl.hidden = false;
        totalEl.textContent = "";
        btnFinalizar.hidden = true;
        pagamentoEl.hidden = true;
        return;
    }

    vazioEl.hidden = true;
    btnFinalizar.hidden = false;
    pagamentoEl.hidden = false;

    let total = 0;
    carrinho.forEach((item) => {
        const subtotal = item.preco * item.qtd;
        total += subtotal;
        const linha = document.createElement("div");
        linha.className = "item-carrinho";
        linha.innerHTML = `
            <span class="item-nome">${escaparHtml(item.nome)}</span>
            <div class="item-qtd">
                <button data-menos="${escaparHtml(item.id)}">−</button>
                <span>${item.qtd}</span>
                <button data-mais="${escaparHtml(item.id)}">+</button>
            </div>
            <span class="item-subtotal">${formatarPreco(subtotal)}</span>
            <button class="item-remover" data-remover="${escaparHtml(item.id)}">Remover</button>
        `;
        lista.appendChild(linha);
    });

    totalEl.textContent = `Total: ${formatarPreco(total)}`;

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

document.getElementById("btnFinalizar").addEventListener("click", async () => {
    const usuario = getUsuarioLogado();
    const erroEl = document.getElementById("carrinhoErro");
    erroEl.textContent = "";

    if (!usuario) {
        mostrarNotificacao("Faça login para finalizar a compra.", "info");
        mostrarSecao("login");
        return;
    }

    const carrinho = getCarrinho();
    if (carrinho.length === 0) return;

    const formaPagamento = document.getElementById("formaPagamento").value;
    if (!formaPagamento) {
        erroEl.textContent = "Selecione uma forma de pagamento.";
        return;
    }

    const btn = document.getElementById("btnFinalizar");
    btn.disabled = true;
    btn.textContent = "Finalizando...";

    try {
        const resposta = await fetch(`${API_BASE}/compra`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${usuario.token}`,
            },
            body: JSON.stringify({
                forma_pagamento: formaPagamento,
                produtos: carrinho.map((item) => ({
                    id: Number(item.id),
                    quantidade: item.qtd,
                })),
            }),
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            if (resposta.status === 401 || resposta.status === 403) {
                localStorage.removeItem("usuarioLogado");
                atualizarNavbarUsuario();
                erroEl.textContent = "Sessão expirada. Faça login novamente.";
                mostrarNotificacao(
                    "Sua sessão expirou. Faça login novamente para finalizar a compra.",
                    "erro",
                    6000
                );
                mostrarSecao("login");
                return;
            }

            erroEl.textContent =
                dados.erro || dados.msg || "Não foi possível finalizar a compra.";
            return;
        }

        mostrarNotificacao(
            `Compra realizada com sucesso!\nTotal: ${formatarPreco(dados.valor_total)}`,
            "sucesso",
            6000
        );
        salvarCarrinho([]);
        document.getElementById("formaPagamento").value = "";
        renderCarrinho();
        mostrarSecao("produtos");
    } catch (error) {
        erroEl.textContent = "Erro ao conectar com o servidor: " + error.message;
    } finally {
        btn.disabled = false;
        btn.textContent = "Finalizar Compra";
    }
});

// ===================== INICIALIZAÇÃO =====================
atualizarNavbarUsuario();
atualizarContadorCarrinho();
mostrarSecao("produtos");
