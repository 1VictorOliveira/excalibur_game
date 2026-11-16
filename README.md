<p align="center">
  <img src="src/assets/logo.png" width="320" alt="REFRACT">
</p>

<h1 align="center">REFRACT — Berzerk Excalibur</h1>

<p align="center">
  Shooter arcade top-down em pixel art, com salas procedurais, inimigos com ataques telegrafados e habilidades de luz.
</p>

<p align="center">
  <a href="https://1victoroliveira.github.io/excalibur_game/"><strong>▶ Jogar no GitHub Pages</strong></a>
  ·
  <a href="https://github.com/1VictorOliveira/excalibur_game">Repositório</a>
</p>

---

## Sobre o projeto

**REFRACT** é um jogo de ação 2D inspirado no clássico **Berzerk**, desenvolvido como projeto acadêmico com [Excalibur.js](https://excaliburjs.com/), TypeScript e Vite.

O jogador controla uma entidade de luz que atravessa salas geradas proceduralmente, enfrenta demônios, coleta cristais, escolhe habilidades e tenta sobreviver pelo maior tempo possível. A pontuação aumenta ao derrotar inimigos e o recorde fica salvo no navegador.

O jogo abre diretamente na sala principal. O menu inicial pode ser acessado pela tela de pausa.

## Funcionalidades

- Salas procedurais determinísticas, com cinco tipos de ambiente.
- Dificuldade crescente conforme a distância da sala inicial.
- Três inimigos com atributos, sprites e padrões de ataque próprios.
- Máquina de estados de combate com telegrafia antes de cada ataque.
- Três habilidades de luz: Reflexão, Foco e Prisma.
- Sistema de vida, cristais de recuperação e invencibilidade temporária.
- Inimigos derrotados concedem pontuação; recorde persistido em `localStorage`.
- HUD com vida, habilidade atual, carga, SCORE e HI-SCORE.
- Menu, pausa, tela de opções e Game Over.
- Animações em sprite sheet, efeitos de partículas, iluminação e transições.
- Resolução interna de 320×180 com escala para a janela e renderização pixel art.
- Deploy automático no GitHub Pages.

## Jogar

A versão publicada está disponível em:

**https://1victoroliveira.github.io/excalibur_game/**

## Controles

| Ação | Tecla |
| --- | --- |
| Mover | `W`, `A`, `S`, `D` |
| Mirar e atirar | Setas direcionais |
| Atirar na direção do movimento | `Espaço` |
| Selecionar habilidade | `1`, `2`, `3` |
| Alternar habilidade | `Q` |
| Pausar / continuar | `Esc` |
| Navegar nos menus | `W`/`S`, setas, mouse |
| Confirmar nos menus | `Enter`, `Espaço` ou clique |
| Reiniciar no Game Over | `Enter` |
| Voltar ao menu no Game Over | `Esc` |
| Mostrar caixas de colisão (debug) | `F1` |

> No menu, as opções também podem ser selecionadas e confirmadas com o mouse.

## Como o jogo funciona

### Salas procedurais

Cada posição do mapa é identificada por coordenadas `(x, y)`. Uma função de hash transforma essas coordenadas em uma semente, garantindo que a mesma sala seja sempre reconstruída da mesma forma.

A dificuldade cresce com `|x| + |y|`, aumentando a quantidade e a composição dos inimigos. Existem cinco tipos de sala:

| Tipo | Característica |
| --- | --- |
| `inicio` | Santuário inicial, com labirinto e dificuldade baixa |
| `labirinto` | Labirinto no estilo Berzerk |
| `pilares` | Obstáculos nos cruzamentos e caminhos mais abertos |
| `arena` | Área ampla, com mais inimigos |
| `tesouro` | Contém um cristal que recupera 1 ponto de vida |

Ao sair por uma porta, o jogador mantém a vida e avança para a sala vizinha. Salas limpas permanecem limpas durante a partida atual.

### Inimigos

Todos os inimigos derivam de `BaseEnemy` e seguem o ciclo:

```text
IDLE/CHASE → TELEGRAPH → ATTACK → COOLDOWN
```

O dano só é aplicado durante o estado `ATTACK`. O estado `TELEGRAPH` mostra o aviso visual, dando ao jogador uma janela para reagir.

| Inimigo | Vida | Pontos | Comportamento |
| --- | ---: | ---: | --- |
| Diabrete | 2 | 100 | Patrulha sem visão; ao enxergar o jogador, persegue, acende as mãos e dispara uma bola de fogo |
| Anjo Caído | 4 | 250 | Marca uma área prevendo o movimento do jogador e lança uma lança após a telegrafia |
| Arquidemônio | 8 | 500 | Perto: expansão de um anel de choque. Longe: feixe direcionado |

O Diabrete verifica a linha de visão com um raycast contra as paredes. Sem visão, ele patrulha em direções aleatórias, trocando de direção periodicamente ou ao colidir com uma parede.

O posicionamento e o balanceamento dos inimigos ficam centralizados em `src/enemies/config.ts`.

### Habilidades de luz

| Habilidade | Funcionamento |
| --- | --- |
| Reflexão | Dispara um feixe que ricocheteia nas paredes |
| Foco | Carrega enquanto a mira é mantida e dispara um raio perfurante; o dano cresce com a carga |
| Prisma | Dispara três projéteis coloridos em leque, de curto alcance |

A habilidade equipada e sua carga aparecem no HUD inferior esquerdo.

### Pontuação

- Cada inimigo possui uma pontuação própria.
- O SCORE reinicia ao começar uma nova partida ou ao tentar novamente após o Game Over.
- O HI-SCORE é salvo em `localStorage` com a chave:

```text
berzerk-excalibur.highScore
```

## Como executar

### Requisitos

- Node.js 22 ou superior
- npm

### Desenvolvimento

```bash
git clone https://github.com/1VictorOliveira/excalibur_game.git
cd excalibur_game
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente:

```text
http://localhost:5173/
```

### Build de produção

```bash
npm run build
npm run preview
```

O build gera os arquivos otimizados em `dist/`. Os comandos disponíveis são:

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Executa a checagem TypeScript e gera o build de produção |
| `npm run preview` | Serve localmente o build de produção |

### Sala de teste

A sala de desenvolvimento pode ser aberta com o parâmetro `?test`:

```text
http://localhost:5173/?test
```

Nela, as teclas `1`, `2` e `3` invocam, respectivamente, Diabrete, Anjo Caído e Arquidemônio. A sala de teste não faz parte do fluxo normal da partida.

## Estrutura do projeto

```text
.
├── assets/
│   ├── animations.ts       # Cache de imagens e criação das animações
│   └── sprites.json        # Manifesto das animações dos inimigos
├── public/
│   └── fonts/              # Fonte Press Start 2P
├── src/
│   ├── main.ts             # Inicialização, cenas, carregamento e HUD
│   ├── config.ts           # Resolução interna do jogo
│   ├── estado.ts           # Estado global da partida
│   ├── score.ts            # Pontuação e recorde persistente
│   ├── grupos.ts           # Grupos de colisão
│   ├── colisao.ts          # Colisão varrida e reflexão de projéteis
│   ├── actors/
│   │   ├── jogador.ts
│   │   ├── bala.ts
│   │   ├── parede.ts
│   │   └── cristal.ts
│   ├── enemies/
│   │   ├── BaseEnemy.ts    # Máquina de estados compartilhada
│   │   ├── Diabrete.ts
│   │   ├── AnjoCaido.ts
│   │   ├── Arquidemonio.ts
│   │   └── config.ts       # Atributos e balanceamento
│   ├── salas/
│   │   ├── procedural.ts   # Plano, semente e dificuldade
│   │   ├── labirinto.ts    # Geração e navegação do labirinto
│   │   └── aparencia.ts    # Fundos e estilos dos blocos
│   ├── luz/
│   │   ├── habilidades.ts
│   │   ├── projeteis.ts
│   │   └── visual-tiros.ts
│   ├── scenes/
│   │   ├── menu.ts
│   │   ├── sala.ts
│   │   ├── configuracoes.ts
│   │   ├── game-over.ts
│   │   └── teste-inimigos.ts
│   ├── ui/                 # HUDs, menus, botões e fontes
│   ├── cenario/            # Fundo animado
│   └── assets/             # Sprites, cenários, efeitos e textos
└── .github/workflows/      # Deploy no GitHub Pages
```

## Decisões técnicas

- **Engine:** Excalibur.js 0.32.
- **Linguagem:** TypeScript em modo `strict`, sem emissão de JavaScript pelo `tsc`; o Vite faz o bundle.
- **Build:** Vite 8.
- **Separação por responsabilidade:** cenas, atores, inimigos, salas, habilidades, UI e estado global.
- **Configuração centralizada:** valores de balanceamento dos inimigos ficam em `src/enemies/config.ts`, evitando números mágicos nas classes.
- **Herança e polimorfismo:** `BaseEnemy` concentra estados, dano, morte, animações e pontuação; cada inimigo implementa apenas seus ataques.
- **Colisão contínua:** projéteis testam o deslocamento inteiro do quadro contra as paredes, evitando atravessá-las em quedas de framerate.
- **Geração determinística:** as salas usam hash e seed, mantendo consistência sem depender de estado persistente do servidor.
- **Persistência:** apenas o recorde usa `localStorage`; o restante da partida permanece em memória.

## Deploy

O workflow `.github/workflows/deploy.yml` publica automaticamente o jogo no GitHub Pages a cada push para a branch `main`, ou por execução manual.

O processo:

1. Instala as dependências com `npm ci`.
2. Executa `npm run build`.
3. Define `VITE_BASE` com o nome do repositório.
4. Publica o conteúdo de `dist/` no GitHub Pages.

## Validação

O projeto não possui suíte de testes automatizados no momento. A validação atual é feita por:

```bash
npm run build
```

Esse comando executa a checagem de tipos do TypeScript e o build de produção do Vite. Recomenda-se também testar manualmente o fluxo completo: movimento, tiros, transição entre salas, habilidades, pausa, Game Over e persistência do recorde.

## Equipe

- **Victor Oliveira** — líder
- **João Victor**

## Créditos e licenças

- Engine: [Excalibur.js](https://excaliburjs.com/) — licença MIT.
- Build: [Vite](https://vite.dev/) — licença MIT.
- Linguagem: [TypeScript](https://www.typescriptlang.org/) — licença Apache 2.0.
- Fonte: **Press Start 2P**, de CodeMan38, distribuída sob SIL Open Font License.
- Sprites, cenários, efeitos e identidade visual: produzidos e organizados pela equipe do projeto.

Este repositório não possui um arquivo de licença próprio. Consulte os autores antes de reutilizar os assets ou o código.

## Estado atual e próximos passos

- A tela de opções está marcada como “EM BREVE”.
- O jogo ainda não possui áudio.
- Não há testes automatizados.
- Melhorias futuras possíveis: mais tipos de inimigos e salas, chefes, balanceamento adicional, acessibilidade, áudio e suíte de testes.
