# Lista de Compras 🛒

App de lista de compras compartilhada para dois. Funciona no navegador do celular e pode ser adicionado à tela inicial como um app.

---

## Como fazer o deploy (passo a passo)

### 1. Criar o banco de dados no Supabase (grátis)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project** e dê um nome (ex: `lista-compras`)
3. Guarde a senha do banco — você não vai precisar dela agora, mas anote
4. Aguarde o projeto ser criado (~1 min)
5. No menu lateral, vá em **SQL Editor**
6. Cole e execute este SQL para criar a tabela:

```sql
create table rooms (
  code text primary key,
  items jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Permite leitura e escrita sem login (acesso por código de sala)
alter table rooms enable row level security;

create policy "acesso publico por codigo"
  on rooms for all
  using (true)
  with check (true);

-- Ativa atualizações em tempo real
alter publication supabase_realtime add table rooms;
```

7. Vá em **Project Settings → API**
8. Copie a **Project URL** e a **anon public key** — você vai precisar delas no próximo passo

---

### 2. Subir o código no GitHub

1. Crie uma conta no [github.com](https://github.com) se não tiver
2. Clique em **New repository** → dê o nome `lista-compras` → **Create repository**
3. No seu computador, abra o terminal dentro da pasta do projeto e rode:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lista-compras.git
git push -u origin main
```

---

### 3. Deploy no Vercel (grátis)

1. Acesse [vercel.com](https://vercel.com) e entre com sua conta GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório `lista-compras`
4. Antes de clicar em Deploy, vá em **Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `REACT_APP_SUPABASE_URL` | sua Project URL do Supabase |
| `REACT_APP_SUPABASE_ANON_KEY` | sua anon key do Supabase |

5. Clique em **Deploy** — em ~2 minutos seu site estará no ar!
6. Você receberá uma URL tipo `lista-compras-xxx.vercel.app`

---

### 4. Adicionar à tela inicial do iPhone

1. Abra a URL no Safari (não Chrome)
2. Toque no ícone de compartilhar (quadrado com seta pra cima)
3. Toque em **Adicionar à Tela de Início**
4. Toque em **Adicionar** — pronto, vira um ícone na tela igual a um app!

---

### Como usar

- **Criar lista**: a primeira pessoa cria e recebe um código de 6 letras
- **Entrar na lista**: a segunda pessoa entra com o mesmo código
- Alterações aparecem para os dois em tempo real (até ~5 segundos)
- Se fechar e reabrir, reconecta automaticamente na mesma lista

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com seus dados do Supabase

# Rodar localmente
npm start
```
