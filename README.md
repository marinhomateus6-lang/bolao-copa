# ⚽ Largados e Pelados — Bolão Copa 2026

## Antes de publicar: 2 coisas para trocar

### 1. Seu e-mail de admin
Em `js/app.js`, linha 13:
```
const ADMIN_EMAIL = "COLOQUE_SEU_EMAIL_AQUI@gmail.com";
```
Troque pelo seu e-mail real.

### 2. Regras do Firestore
Em `firestore.rules`, troque as duas ocorrências de `COLOQUE_SEU_EMAIL_AQUI@gmail.com` pelo seu e-mail.
Depois cole o conteúdo em: Firebase Console → Firestore → Regras → Publicar

---

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex: `bolao-copa`)
2. Faça upload de todos os arquivos
3. Vá em Settings → Pages → Source: `main` / `root`
4. Seu site estará em: `https://SEU_USUARIO.github.io/bolao-copa`

---

## Como usar dia a dia

**Você (admin):**
- Aba Admin → Cadastrar jogo → escolhe as seleções, horário e grupo
- Após o jogo → Inserir resultado → pontos calculados automaticamente

**Participantes:**
- Criam conta com nome + email + senha
- Entram na aba Hoje → chutam o placar → Salvar palpites
- Palpites travam 5 minutos antes do jogo

**Pontuação:**
- 3 pontos → placar exato
- 1 ponto → acertou o vencedor (ou chegou mais próximo do placar)

---

## Bandeiras
As bandeiras são carregadas automaticamente de flagcdn.com — não precisa de configuração.
