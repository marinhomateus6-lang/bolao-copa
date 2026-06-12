import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5-CGYyeY9gmSzqCE28NstHlWgKOhK30Q",
  authDomain: "largados-e-pelados.firebaseapp.com",
  projectId: "largados-e-pelados",
  storageBucket: "largados-e-pelados.firebasestorage.app",
  messagingSenderId: "115860864375",
  appId: "1:115860864375:web:f43f736815bbf028953572"
};

const ADMIN_EMAIL = "COLOQUE_SEU_EMAIL_AQUI@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SELECOES = [
  { nome: "Alemanha", codigo: "de", emoji: "🇩🇪" },
  { nome: "Argentina", codigo: "ar", emoji: "🇦🇷" },
  { nome: "Austrália", codigo: "au", emoji: "🇦🇺" },
  { nome: "Bélgica", codigo: "be", emoji: "🇧🇪" },
  { nome: "Brasil", codigo: "br", emoji: "🇧🇷" },
  { nome: "Canadá", codigo: "ca", emoji: "🇨🇦" },
  { nome: "Coreia do Sul", codigo: "kr", emoji: "🇰🇷" },
  { nome: "Croácia", codigo: "hr", emoji: "🇭🇷" },
  { nome: "Dinamarca", codigo: "dk", emoji: "🇩🇰" },
  { nome: "Egito", codigo: "eg", emoji: "🇪🇬" },
  { nome: "Espanha", codigo: "es", emoji: "🇪🇸" },
  { nome: "Estados Unidos", codigo: "us", emoji: "🇺🇸" },
  { nome: "França", codigo: "fr", emoji: "🇫🇷" },
  { nome: "Holanda", codigo: "nl", emoji: "🇳🇱" },
  { nome: "Inglaterra", codigo: "gb-eng", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { nome: "Irã", codigo: "ir", emoji: "🇮🇷" },
  { nome: "Japão", codigo: "jp", emoji: "🇯🇵" },
  { nome: "Marrocos", codigo: "ma", emoji: "🇲🇦" },
  { nome: "México", codigo: "mx", emoji: "🇲🇽" },
  { nome: "Nigéria", codigo: "ng", emoji: "🇳🇬" },
  { nome: "Polônia", codigo: "pl", emoji: "🇵🇱" },
  { nome: "Portugal", codigo: "pt", emoji: "🇵🇹" },
  { nome: "Senegal", codigo: "sn", emoji: "🇸🇳" },
  { nome: "Sérvia", codigo: "rs", emoji: "🇷🇸" },
  { nome: "Suíça", codigo: "ch", emoji: "🇨🇭" },
  { nome: "Turquia", codigo: "tr", emoji: "🇹🇷" },
  { nome: "Uruguai", codigo: "uy", emoji: "🇺🇾" },
];

function flagUrl(codigo) {
  return `https://flagcdn.com/w80/${codigo}.png`;
}

function getSelecao(nome) {
  return SELECOES.find(s => s.nome === nome) || { nome, codigo: "un", emoji: "🏳️" };
}

let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    currentUserData = snap.data();
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("app-screen").style.display = "block";
    document.getElementById("header-user").textContent = currentUserData?.nome || user.email;
    if (user.email === ADMIN_EMAIL) {
      document.getElementById("admin-tab").style.display = "block";
      popularSelectSelecoes();
      carregarJogosAdmin();
    }
    showTab("hoje");
  } else {
    currentUser = null;
    currentUserData = null;
    document.getElementById("auth-screen").style.display = "flex";
    document.getElementById("app-screen").style.display = "none";
  }
});

window.switchAuth = function(tipo) {
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById("login-form").style.display = tipo === "login" ? "block" : "none";
  document.getElementById("register-form").style.display = tipo === "register" ? "block" : "none";
  document.getElementById("auth-error").textContent = "";
};

window.doLogin = async function() {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-pass").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    document.getElementById("auth-error").textContent = "E-mail ou senha incorretos.";
  }
};

window.doRegister = async function() {
  const nome = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass = document.getElementById("reg-pass").value;
  if (!nome) { document.getElementById("auth-error").textContent = "Digite seu nome."; return; }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "usuarios", cred.user.uid), { nome, email, pontos: 0, criadoEm: serverTimestamp() });
  } catch (e) {
    document.getElementById("auth-error").textContent = e.code === "auth/email-already-in-use" ? "E-mail já cadastrado." : "Erro ao criar conta. Verifique os dados.";
  }
};

window.doLogout = async function() {
  await signOut(auth);
};

window.showTab = function(tab) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  const tabs = ["hoje", "classificacao", "resultados", "admin"];
  const idx = tabs.indexOf(tab);
  document.querySelectorAll(".nav-tab")[idx]?.classList.add("active");
  if (tab === "hoje") carregarJogosHoje();
  if (tab === "classificacao") carregarRanking();
  if (tab === "resultados") carregarResultados();
};

async function carregarJogosHoje() {
  const container = document.getElementById("jogos-hoje");
  const vencedorDiv = document.getElementById("vencedor-rodada");
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
  const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
  document.getElementById("hoje-label").textContent = `Jogos de hoje — ${hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  container.innerHTML = '<div class="loading">Carregando jogos...</div>';

  const snap = await getDocs(collection(db, "jogos"));
  const jogos = [];
  snap.forEach(d => {
    const data = d.data();
    const horario = data.horario?.toDate ? data.horario.toDate() : new Date(data.horario);
    if (horario >= inicioHoje && horario <= fimHoje) jogos.push({ id: d.id, ...data, horario });
  });

  jogos.sort((a, b) => a.horario - b.horario);

  const palpitesSnap = currentUser ? await getDocs(query(collection(db, "palpites"), where("userId", "==", currentUser.uid))) : null;
  const meusPalpites = {};
  palpitesSnap?.forEach(d => { meusPalpites[d.data().jogoId] = d.data(); });

  await renderVencedorRodada(vencedorDiv, jogos);

  if (jogos.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div>Nenhum jogo hoje.</div>';
    document.getElementById("btn-salvar").style.display = "none";
    return;
  }

  container.innerHTML = "";
  let temJogoAberto = false;
  jogos.forEach(jogo => {
    const agora = new Date();
    const travadoEm = new Date(jogo.horario.getTime() - 5 * 60 * 1000);
    const travado = agora >= travadoEm;
    if (!travado) temJogoAberto = true;
    const palpite = meusPalpites[jogo.id];
    const sel1 = getSelecao(jogo.time1);
    const sel2 = getSelecao(jogo.time2);
    const card = document.createElement("div");
    card.className = "jogo-card";
    card.innerHTML = `
      <div class="jogo-meta">
        <span>${jogo.horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        ${jogo.grupo ? `<span class="grupo-badge">${jogo.grupo}</span>` : ""}
      </div>
      <div class="jogo-times">
        <div class="time-bloco">
          <div class="time-flag-bg" style="background-image:url('${flagUrl(sel1.codigo)}')"></div>
          <div class="time-nome">
            <span class="time-flag-emoji">${sel1.emoji}</span>
            ${sel1.nome}
          </div>
        </div>
        <div class="placar-centro">
          <input class="placar-input" type="number" min="0" max="20" id="g1-${jogo.id}" value="${palpite ? palpite.gols1 : ""}" placeholder="?" ${travado ? "disabled" : ""} />
          <span class="placar-x">x</span>
          <input class="placar-input" type="number" min="0" max="20" id="g2-${jogo.id}" value="${palpite ? palpite.gols2 : ""}" placeholder="?" ${travado ? "disabled" : ""} />
        </div>
        <div class="time-bloco">
          <div class="time-flag-bg" style="background-image:url('${flagUrl(sel2.codigo)}')"></div>
          <div class="time-nome">
            <span class="time-flag-emoji">${sel2.emoji}</span>
            ${sel2.nome}
          </div>
        </div>
      </div>
      ${travado ? `<div class="jogo-travado">🔒 Palpites encerrados</div>` : ""}
      ${palpite && !travado ? `<div class="jogo-meu-palpite">✓ Seu palpite: ${palpite.gols1} x ${palpite.gols2}</div>` : ""}
    `;
    container.appendChild(card);
  });

  document.getElementById("btn-salvar").style.display = temJogoAberto ? "block" : "none";
}

async function renderVencedorRodada(div, jogosHoje) {
  div.innerHTML = "";
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 0, 0, 0);
  const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59);

  const snap = await getDocs(collection(db, "jogos"));
  const jogosEncerrados = [];
  snap.forEach(d => {
    const data = d.data();
    const horario = data.horario?.toDate ? data.horario.toDate() : new Date(data.horario);
    if (data.resultado && horario >= inicioOntem && horario <= fimOntem) {
      jogosEncerrados.push({ id: d.id, ...data });
    }
  });

  if (jogosEncerrados.length === 0) return;

  const pSnap = await getDocs(collection(db, "palpites"));
  const pontosPorUser = {};
  pSnap.forEach(d => {
    const p = d.data();
    if (jogosEncerrados.find(j => j.id === p.jogoId)) {
      if (!pontosPorUser[p.userId]) pontosPorUser[p.userId] = { pts: 0, nome: p.nomeUser };
      pontosPorUser[p.userId].pts += (p.pontosGanhos || 0);
    }
  });

  const sorted = Object.entries(pontosPorUser).sort((a, b) => b[1].pts - a[1].pts);
  if (sorted.length === 0) return;

  const [, info] = sorted[0];
  div.innerHTML = `
    <div class="vencedor-card">
      <div class="vencedor-trophy">🏆</div>
      <div>
        <div class="vencedor-label">Vencedor de ontem</div>
        <div class="vencedor-nome">${info.nome}</div>
        <div class="vencedor-pts">${info.pts} ponto${info.pts !== 1 ? "s" : ""} na rodada</div>
      </div>
    </div>
  `;
}

window.salvarPalpites = async function() {
  const snap = await getDocs(collection(db, "jogos"));
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
  const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
  let salvos = 0;

  for (const d of snap.docs) {
    const jogo = d.data();
    const horario = jogo.horario?.toDate ? jogo.horario.toDate() : new Date(jogo.horario);
    if (horario < inicioHoje || horario > fimHoje) continue;
    const travadoEm = new Date(horario.getTime() - 5 * 60 * 1000);
    if (new Date() >= travadoEm) continue;

    const g1 = document.getElementById("g1-" + d.id)?.value;
    const g2 = document.getElementById("g2-" + d.id)?.value;
    if (g1 === "" || g2 === "") continue;

    await setDoc(doc(db, "palpites", `${currentUser.uid}_${d.id}`), {
      userId: currentUser.uid,
      nomeUser: currentUserData?.nome || currentUser.email,
      jogoId: d.id,
      gols1: parseInt(g1),
      gols2: parseInt(g2),
      pontosGanhos: 0,
      criadoEm: serverTimestamp()
    });
    salvos++;
  }

  const msg = document.getElementById("salvar-msg");
  msg.textContent = salvos > 0 ? `✓ ${salvos} palpite${salvos > 1 ? "s" : ""} salvo${salvos > 1 ? "s" : ""}!` : "Nenhum palpite novo para salvar.";
  setTimeout(() => msg.textContent = "", 3000);
  if (salvos > 0) carregarJogosHoje();
};

async function carregarRanking() {
  const container = document.getElementById("ranking-lista");
  container.innerHTML = '<div class="loading">Carregando...</div>';
  const snap = await getDocs(collection(db, "usuarios"));
  const usuarios = [];
  snap.forEach(d => usuarios.push({ id: d.id, ...d.data() }));
  usuarios.sort((a, b) => (b.pontos || 0) - (a.pontos || 0));

  if (usuarios.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div>Nenhum participante ainda.</div>';
    return;
  }

  container.innerHTML = "";
  usuarios.forEach((u, i) => {
    const isUltimo = i === usuarios.length - 1 && usuarios.length > 1;
    const isPrimeiro = i === 0;
    const isSegundo = i === 1;
    const isTerceiro = i === 2;
    const posClass = isPrimeiro ? "gold" : isSegundo ? "silver" : isTerceiro ? "bronze" : isUltimo ? "last" : "";
    const posEmoji = isPrimeiro ? "🥇" : isSegundo ? "🥈" : isTerceiro ? "🥉" : isUltimo ? "💩" : `${i + 1}°`;
    const initials = (u.nome || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const card = document.createElement("div");
    card.className = `rank-card${isUltimo ? " ultimo" : ""}`;
    card.innerHTML = `
      <div class="rank-pos ${posClass}">${posEmoji}</div>
      <div class="rank-avatar ${isUltimo ? "last" : ""}">${isUltimo ? "🤢" : initials}</div>
      <div class="rank-nome ${isUltimo ? "last" : ""}">${u.nome || u.email}</div>
      <div class="rank-pts">
        <div class="rank-pts-num ${isUltimo ? "last" : ""}">${u.pontos || 0}</div>
        <div class="rank-pts-label">pontos</div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function carregarResultados() {
  const container = document.getElementById("resultados-lista");
  container.innerHTML = '<div class="loading">Carregando...</div>';
  const snap = await getDocs(collection(db, "jogos"));
  const jogos = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.resultado) jogos.push({ id: d.id, ...data });
  });
  jogos.sort((a, b) => {
    const ha = a.horario?.toDate ? a.horario.toDate() : new Date(a.horario);
    const hb = b.horario?.toDate ? b.horario.toDate() : new Date(b.horario);
    return hb - ha;
  });

  if (jogos.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div>Nenhum resultado ainda.</div>';
    return;
  }

  const pSnap = await getDocs(query(collection(db, "palpites"), where("userId", "==", currentUser.uid)));
  const meusPalpites = {};
  pSnap.forEach(d => { meusPalpites[d.data().jogoId] = d.data(); });

  container.innerHTML = "";
  for (const jogo of jogos) {
    const sel1 = getSelecao(jogo.time1);
    const sel2 = getSelecao(jogo.time2);
    const horario = jogo.horario?.toDate ? jogo.horario.toDate() : new Date(jogo.horario);
    const palpite = meusPalpites[jogo.id];

    const pSnap2 = await getDocs(query(collection(db, "palpites"), where("jogoId", "==", jogo.id)));
    let exatos = 0, vencedores = 0;
    pSnap2.forEach(d => {
      const p = d.data();
      if (p.pontosGanhos === 3) exatos++;
      else if (p.pontosGanhos === 1) vencedores++;
    });

    let meuAcertoHtml = "";
    if (palpite) {
      const pts = palpite.pontosGanhos || 0;
      if (pts === 3) meuAcertoHtml = `<span class="meu-acerto exato">✓ Placar exato (+3)</span>`;
      else if (pts === 1) meuAcertoHtml = `<span class="meu-acerto vencedor">~ Mais próximo (+1)</span>`;
      else meuAcertoHtml = `<span class="meu-acerto errou">✗ Errou (${palpite.gols1}x${palpite.gols2})</span>`;
    }

    const card = document.createElement("div");
    card.className = "resultado-card";
    card.innerHTML = `
      <div style="font-size:11px;color:var(--texto-muted);margin-bottom:8px">${horario.toLocaleDateString("pt-BR")} · ${jogo.grupo || ""}</div>
      <div class="resultado-times">
        <div class="resultado-time">${sel1.emoji} ${sel1.nome}</div>
        <div class="placar-final">${jogo.resultado.gols1} x ${jogo.resultado.gols2}</div>
        <div class="resultado-time right">${sel2.nome} ${sel2.emoji}</div>
      </div>
      <div style="margin-top:8px">
        ${exatos > 0 ? `<span class="acertos-info">🎯 ${exatos} placar exato${exatos > 1 ? "s" : ""}</span>` : ""}
        ${vencedores > 0 ? `<span class="acertos-info">👍 ${vencedores} mais próximo${vencedores > 1 ? "s" : ""}</span>` : ""}
        ${meuAcertoHtml}
      </div>
    `;
    container.appendChild(card);
  }
}

function popularSelectSelecoes() {
  ["adm-time1", "adm-time2"].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">Selecione a seleção</option>';
    SELECOES.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.nome;
      opt.textContent = `${s.emoji} ${s.nome}`;
      sel.appendChild(opt);
    });
  });
}

window.cadastrarJogo = async function() {
  const time1 = document.getElementById("adm-time1").value;
  const time2 = document.getElementById("adm-time2").value;
  const horario = document.getElementById("adm-horario").value;
  const grupo = document.getElementById("adm-grupo").value.trim();
  const msg = document.getElementById("adm-msg");

  if (!time1 || !time2 || !horario) { msg.textContent = "Preencha todos os campos."; msg.style.color = "var(--vermelho)"; return; }
  if (time1 === time2) { msg.textContent = "As seleções precisam ser diferentes."; msg.style.color = "var(--vermelho)"; return; }

  await setDoc(doc(collection(db, "jogos")), {
    time1, time2, grupo,
    horario: new Date(horario),
    resultado: null,
    criadoEm: serverTimestamp()
  });

  msg.style.color = "var(--verde)";
  msg.textContent = `✓ Jogo ${time1} x ${time2} cadastrado!`;
  document.getElementById("adm-horario").value = "";
  document.getElementById("adm-grupo").value = "";
  setTimeout(() => msg.textContent = "", 4000);
  carregarJogosAdmin();
};

async function carregarJogosAdmin() {
  const sel = document.getElementById("res-jogo");
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione o jogo</option>';
  const snap = await getDocs(collection(db, "jogos"));
  const jogos = [];
  snap.forEach(d => { if (!d.data().resultado) jogos.push({ id: d.id, ...d.data() }); });
  jogos.sort((a, b) => {
    const ha = a.horario?.toDate ? a.horario.toDate() : new Date(a.horario);
    const hb = b.horario?.toDate ? b.horario.toDate() : new Date(b.horario);
    return ha - hb;
  });
  jogos.forEach(j => {
    const opt = document.createElement("option");
    const h = j.horario?.toDate ? j.horario.toDate() : new Date(j.horario);
    opt.value = j.id;
    opt.textContent = `${j.time1} x ${j.time2} — ${h.toLocaleDateString("pt-BR")} ${h.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    sel.appendChild(opt);
  });
}

window.inserirResultado = async function() {
  const jogoId = document.getElementById("res-jogo").value;
  const g1 = document.getElementById("res-gols1").value;
  const g2 = document.getElementById("res-gols2").value;
  const msg = document.getElementById("res-msg");

  if (!jogoId || g1 === "" || g2 === "") { msg.textContent = "Preencha todos os campos."; msg.style.color = "var(--vermelho)"; return; }

  const r1 = parseInt(g1), r2 = parseInt(g2);
  await updateDoc(doc(db, "jogos", jogoId), { resultado: { gols1: r1, gols2: r2 } });

  const palpitesSnap = await getDocs(query(collection(db, "palpites"), where("jogoId", "==", jogoId)));
  const updates = [];
  palpitesSnap.forEach(d => {
    const p = d.data();
    let pontos = 0;
    if (p.gols1 === r1 && p.gols2 === r2) {
      pontos = 3;
    } else {
      const diffReal = Math.abs(r1 - r2);
      const diffPalpite = Math.abs(p.gols1 - p.gols2);
      const acertouVencedor = (r1 > r2 && p.gols1 > p.gols2) || (r1 < r2 && p.gols1 < p.gols2) || (r1 === r2 && p.gols1 === p.gols2);
      if (acertouVencedor) pontos = 1;
    }
    updates.push({ palpiteId: d.id, userId: p.userId, pontos });
  });

  const allUsersSnap = await getDocs(collection(db, "usuarios"));
  const userPontos = {};
  allUsersSnap.forEach(d => { userPontos[d.id] = d.data().pontos || 0; });

  for (const u of updates) {
    await updateDoc(doc(db, "palpites", u.palpiteId), { pontosGanhos: u.pontos });
    if (u.pontos > 0 && userPontos[u.userId] !== undefined) {
      await updateDoc(doc(db, "usuarios", u.userId), { pontos: userPontos[u.userId] + u.pontos });
    }
  }

  msg.style.color = "var(--verde)";
  msg.textContent = `✓ Resultado salvo! ${updates.filter(u => u.pontos > 0).length} participante(s) pontuaram.`;
  document.getElementById("res-gols1").value = "";
  document.getElementById("res-gols2").value = "";
  setTimeout(() => msg.textContent = "", 5000);
  carregarJogosAdmin();
};
