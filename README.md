# Stories da academia

Site (Next.js) que exibe os stories do Instagram da academia — barra de
progresso segmentada, avança sozinho, funciona igual ao viewer de stories
de verdade. Busca os stories ATIVOS (últimas 24h) via Instagram Graph API.

Sem as credenciais da API configuradas, o site funciona normalmente
mostrando 3 stories de exemplo (mock) — dá pra ver o layout/interação sem
depender da conta do Instagram estar pronta.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Conectando a conta do Instagram

Usa a **Instagram Graph API clássica** (`graph.facebook.com`), via Página
do Facebook vinculada à conta Business/Creator do Instagram.

> **Por que não a API mais nova ("Instagram API with Instagram Login",
> sem precisar de Página)?** Testamos na prática: ela autentica e lê
> perfil/mídia normalmente, mas o endpoint `/stories` sempre volta vazio
> pra conteúdo postado organicamente pelo app do celular — só a clássica
> retorna stories de verdade. Essa outra API ainda existe no projeto
> (`/api/auth/instagram`, `lib/instagram.ts` documenta isso), só não é
> usada pra buscar stories.
>
> Outra pegadinha real: o token que o **Graph API Explorer** (a ferramenta
> web de teste da Meta) gera funciona pra LER dados, mas é rejeitado na
> troca por token de longa duração ("Session key invalid"). Só tokens
> gerados pelo fluxo OAuth de verdade (login real) são aceitos — por isso
> o app tem um fluxo de conexão próprio (`/api/auth/facebook`) em vez de
> pedir pra colar um token do Explorer.

### 1. Confirmar a Página do Facebook

A conta do Instagram precisa ser Business/Creator e estar vinculada a uma
Página do Facebook que você administra (Configurações do Instagram →
Contas vinculadas, ou pelo Meta Business Suite). Sem isso, nenhum dos
passos abaixo funciona — é um requisito da própria Meta.

### 2. Criar o App na Meta

Em [developers.facebook.com](https://developers.facebook.com) → "Meus
Apps" → "Criar App" → tipo **"Negócios"**. Adicionar o produto **"Facebook
Login"** (não "Instagram" — esse é o do outro fluxo).

No painel do App → Configurações → Básico, tem:
- **ID do aplicativo** → `INSTAGRAM_APP_ID`
- **Chave secreta do aplicativo** → `INSTAGRAM_APP_SECRET` (clicar em
  "Mostrar", pode pedir a senha da Meta de novo)

No produto **Facebook Login** → Configurações, tem um campo **"URIs de
redirecionamento OAuth válidos"** — cadastre aqui a URL do seu ambiente +
`/api/auth/facebook/callback`. Em dev local (via túnel HTTPS, ver nota
abaixo):
```
https://SEU-TUNEL/api/auth/facebook/callback
```

> **Nota sobre HTTPS em dev local**: o login do Facebook/Instagram não
> aceita `http://localhost` como redirect_uri. Pra testar localmente,
> exponha o `npm run dev` via um túnel HTTPS (ex.: `cloudflared tunnel
> --url http://localhost:3000`) e use a URL do túnel em vez de localhost
> — tanto no cadastro acima quanto pra acessar `/api/auth/facebook/start`
> no navegador. Em produção (domínio real com HTTPS) isso não é necessário.

### 3. Configurar o `.env.local`

```bash
cp .env.example .env.local
```

Preenche `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET` por enquanto (os
outros dois campos vêm do próximo passo).

### 4. Conectar

Com o servidor rodando, abra no navegador, **logado na conta que
administra a Página da academia**:

```
http://localhost:3000/api/auth/facebook/start
```
(ou a URL do túnel, se estiver testando local)

Isso redireciona pro login oficial do Facebook, pede autorização, lista
suas Páginas e mostra os valores prontos pra cada uma que tiver Instagram
vinculado:
- `INSTAGRAM_ACCESS_TOKEN` (token da Página — não expira sozinho, só se a
  permissão for revogada ou a senha do Facebook mudar)
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`

Cola os dois no `.env.local` (usa os da Página certa, se aparecer mais de
uma) e reinicia o `npm run dev`.

**Limitação importante**: o endpoint de stories só retorna os ainda
ativos (postados nas últimas 24h) da conta vinculada à Página — não dá
pra puxar stories de qualquer conta pública, só da que autorizou o login.

## Estrutura

- `lib/instagram.ts` — busca os stories na Graph API (`getStories()`), com
  fallback pra stories de exemplo se as credenciais não estiverem
  configuradas ou a chamada falhar.
- `components/StoryViewer.tsx` — o viewer em si: barra de progresso
  segmentada, avanço automático (5s por imagem, duração real por vídeo),
  toque esquerda/direita pra voltar/avançar (segurar pausa), setas do
  teclado.
- `app/page.tsx` — busca os stories no servidor (`revalidate: 300`, 5min de
  cache) e renderiza o viewer (com título e legenda de modo demonstração —
  pra conferir em um navegador normal).
- `app/tv/page.tsx` + `components/TvKiosk.tsx` — versão pra rodar numa TV,
  sem nenhum texto/moldura, preenchendo a tela toda, em loop contínuo (volta
  pro primeiro story depois do último) e recarregando sozinha a cada 10min
  (pega stories novos/expirados, já que ninguém vai estar clicando "atualizar").
- `app/api/auth/facebook/start` + `.../callback` — fluxo de login usado de
  verdade (ver "Conectando a conta do Instagram" acima): troca `code` →
  token de usuário → token de longa duração → lista de Páginas → token da
  Página + id do Instagram vinculado, prontos pra colar no `.env.local`.
- `app/api/auth/instagram/start` + `.../callback` — fluxo alternativo
  (API mais nova, sem Página do Facebook) mantido só de referência — não
  retorna stories orgânicos, ver nota em "Conectando a conta do Instagram".
- `lib/instagram-oauth.ts` — helper compartilhado pelos dois fluxos pra
  descobrir o redirect_uri certo mesmo atrás de um túnel/proxy.

## Rodando numa TV (`/tv`)

A tela é 100% responsiva (CSS em unidades de viewport, nada de pixel fixo)
— então "Full HD" não exige nenhuma configuração aqui, se adapta sozinha à
resolução real do dispositivo.

**Orientação vertical**: a grande maioria das TVs é um painel landscape que
não gira de verdade — mesmo montada de lado (fisicamente virada 90°), o
sistema/navegador continua reportando resolução landscape (ex.: 1920×1080,
não 1080×1920). Por isso `/tv` desenha o conteúdo já compensando: ele
nasce com largura/altura trocadas e é girado de volta na direção oposta à
virada física, pra aparecer em pé certinho pra quem olha a TV já montada.

- Por padrão assume que a TV foi virada **90° no sentido horário** (é como
  a sua está montada hoje).
- Se virar pro outro lado, usa `?tvRotation=ccw` na URL
  (`http://SEU-HOST:3000/tv?tvRotation=ccw`).
- Se o dispositivo já gira a tela de verdade no sistema operacional (ex.:
  um Android TV com rotação nativa ligada), usa `?tvRotation=none` pra
  desligar a compensação por CSS — senão giraria duas vezes.

O que falta é ter *algum dispositivo* rodando um navegador em modo
"kiosk" (tela cheia, sem barra de endereço, sem sair sozinho) apontando
pra `http://<host>:3000/tv` — a TV em si normalmente não faz isso sem
ajuda. Opções comuns:

- **Mini PC / Raspberry Pi ligado na TV via HDMI**: instala Chrome/Chromium
  e roda `chromium --kiosk --incognito http://SEU-HOST/tv` (ajustar o
  binário conforme o SO). É o caminho mais confiável.
- **Fire TV Stick / Chromecast com Google TV**: instalar um navegador com
  suporte a kiosk mode (ex.: "Kiosk Browser Lockdown" ou similar na loja de
  apps) e configurar a URL.
- **Smart TV com navegador embutido**: abrir a URL e usar o modo tela cheia
  do próprio navegador — menos confiável (alguns saem do fullscreen sozinhos
  depois de um tempo).

A página tenta entrar em tela cheia sozinha ao carregar (Fullscreen API) e,
como reforço, também na primeira vez que alguém tocar/clicar na tela — a
maioria dos navegadores só permite tela cheia automática depois de alguma
interação do usuário, então num kiosk de verdade normalmente é o próprio
app de kiosk (ex.: `--kiosk`) que garante isso, não a página.

## Deploy

Funciona em qualquer host de Next.js (Vercel, etc.) — só configurar as
mesmas variáveis de ambiente do `.env.example` no painel do provedor. O
dispositivo ligado na TV precisa alcançar essa URL na rede (local ou
pública, dependendo de onde for hospedado).
