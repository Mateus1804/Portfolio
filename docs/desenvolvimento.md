# Desenvolvimento e manutenção

## Ambiente e comandos

O projeto utiliza Node.js 22 ou superior e Python 3 para a prévia local. Não há dependências de execução ou etapa de compilação. Playwright e Prettier são dependências de desenvolvimento.

```sh
npm test
npm run check
npm run serve
```

A prévia local utiliza `http://localhost:8080`. O diretório publicável é `dist/`. Os caminhos relativos mantêm a compatibilidade com o subdiretório `/Portfolio/` do GitHub Pages.

## Organização da interface

O HTML mantém o conteúdo e os links completos. O arquivo `dist/assets/js/main.js` habilita menu, filtros, cópia de e-mail e melhorias de movimento. Os estilos ficam em `dist/assets/css/styles.css`; a demonstração Fluxo conserva seus arquivos e regras próprias.

O scrollytelling tem quatro textos estáticos e uma prévia visual sincronizada. Um IntersectionObserver limita o trabalho à área da narrativa; um único requestAnimationFrame por quadro lê a posição dos quatro textos. Não há biblioteca de animação ou interceptação da rolagem. Em telas baixas, a prévia deixa de ser fixa. Em larguras de até 600 px e com `prefers-reduced-motion`, as figuras são movidas para os artigos correspondentes sem duplicação no DOM. A prévia fixa fica oculta e a sincronização animada é desativada. Redimensionar ou trocar a preferência restaura o layout apropriado.

A informação textual permanece com opacidade integral. As animações não são necessárias para acessar os projetos ou entender o conteúdo.

## Ícones e imagens

O sprite `dist/assets/icons/lucide.svg` contém 30 ícones da biblioteca Lucide, com os caminhos vetoriais originais. O arquivo SOURCE.md do mesmo diretório registra o commit de origem, e LICENSE-lucide.txt preserva os avisos exigidos. Não há carregamento de scripts ou vetores por CDN.

As instâncias SVG decorativas usam `aria-hidden` e ficam acompanhadas de rótulos de texto. Botões sem texto visível possuem nome acessível. A checagem estática confere os identificadores referenciados por use.

As quatro capturas Android vieram da revisão documentada do aplicativo, sem edição dos valores fictícios exibidos. O portfólio não oferece uma simulação funcional do aplicativo Android no navegador.

## Conteúdo e identidade

O nome de apresentação é Mateus Magalhães. O endereço profissional é mateuswilliam.magalhaes@gmail.com. Os endereços existentes dos perfis e do PDF foram preservados para evitar quebrar referências externas; o atributo de download apresenta o nome atualizado.

A atualização visual não altera o conteúdo do currículo PDF. O arquivo continua disponível pelo endereço anterior, com as informações profissionais e a formação registradas naquela versão.

As métricas de outros projetos devem permanecer vinculadas à revisão que as comprovou. O estudo Android indica que os exemplos bancários são sintéticos e registra as validações ainda pendentes.

## Publicação

O workflow de GitHub Pages valida o projeto e publica `dist/` em pushes na main, com a configuração existente `PAGES_ENABLED=true`. A atualização não muda as permissões nem recria a configuração de Pages.

Os detalhes dos testes e da inspeção estão em qualidade.md. Uma checagem estática bem-sucedida não comprova a disponibilidade dos destinos externos ou a acessibilidade completa em todos os navegadores.

## Organização dos estilos e da narrativa

O CSS mantém a sequência da cascata e está formatado em blocos legíveis, com seções para bases, navegação, projetos, trajetória, contato e casos. O formatador é ferramenta de desenvolvimento; os visitantes não carregam uma dependência adicional.

    npm run format
    npm run format:check

O módulo dist/assets/js/storytelling.js concentra os observadores, a sincronização das prévias e a preferência de movimento reduzido. main.js conserva menu, filtros, cópia de contato e atualização do ano.

## Testes de interface no CI

    npm ci
    npx playwright install --with-deps chromium
    npm run test:browser

A suíte de navegador sobe um servidor temporário sob /Portfolio/, com a mesma base de caminhos do GitHub Pages, e recusa requisições externas. Os cenários abrangem as seis páginas em quatro larguras, filtros, teclado, os quatro capítulos, alteração da preferência de movimento, leitura sem JavaScript e carregamento de SVGs e capturas locais.

Chromium indisponível interrompe a suíte; os testes não são convertidos em skips. A execução de GitHub Pages depende da checagem reutilizável completa, incluindo o navegador. As capturas de evidência ficam no artefato evidencias-interface, com retenção de 14 dias.

As verificações são executáveis localmente e no CI. Os resultados de cada revisão ficam registrados em qualidade.md.


## Fluxo: modelo e persistência

O módulo `model.js` mantém validação, filtros, regras de prazo, migração, histórico e exportação. O esquema 2 acrescenta `dueDate`, `archived` e `history`, mantendo a chave `mw:fluxo:v1` para encontrar instalações antigas. A leitura aceita esquemas 1 e 2; dados desconhecidos ou corrompidos não são substituídos silenciosamente. Identificadores e criação são imutáveis na edição.

Os prazos são strings AAAA-MM-DD validadas como datas civis. A comparação usa o dia em America/Sao_Paulo; concluir ou arquivar retira uma demanda dos atrasos. Histórico local e desfazer não representam auditoria nem segurança empresarial. O limite é de 100 eventos por registro, 500 registros e 2 MB por conjunto serializado. Uma mudança que ultrapasse o tamanho recuperável é recusada antes de alterar o estado.

O CSV inclui apenas o filtro atual. O backup JSON inclui todos os registros e precisa identificar `fluxo-solicitacoes`. A seleção do arquivo não altera os dados: leitura, validação e prévia antecedem a confirmação explícita. Cancelar ou selecionar um arquivo inválido preserva a sessão. O backup é texto simples e não deve conter dados pessoais ou empresariais.

A persistência confere o conteúdo anterior do LocalStorage antes de gravar e escuta `storage`. Divergências pausam as gravações, preservando o formulário aberto. Os avisos distinguem dados salvos de mudanças apenas em memória. O carregamento da versão externa exige confirmação; a sessão pode ser exportada antes disso. LocalStorage não oferece transações distribuídas nem compare-and-swap atômico: não há garantia de colaboração simultânea entre abas.

A restauração dos exemplos é explícita e pode substituir um armazenamento corrompido. Uma mudança externa ocorrida durante sua confirmação cancela a substituição. Desfazer mantém uma fotografia em memória da alteração anterior e não funciona após recarregar.

## Evidências visuais e mídia

`scripts/capture-demo.mjs` é chamado pela suíte de navegador com seu servidor de teste. O roteiro usa apenas dados fictícios e grava o ciclo criação, andamento, conclusão e histórico. As pausas servem à leitura da gravação, não à sincronização dos testes. Os resultados ficam em `qa/capture/`, ignorado pelo Git e incluído no artefato do CI. A suíte não sobrescreve arquivos públicos versionados.

Para atualizar a mídia publicada, execute a suíte, inspecione os resultados e copie deliberadamente as capturas aprovadas para `docs/imagens/`, o poster para `dist/assets/images/` e o vídeo para `dist/assets/video/`. O vídeo não inicia sozinho, oferece controles e legendas em português, sem faixa de áudio. Não foram produzidas novas gravações dos aplicativos externos nesta revisão.

A imagem de compartilhamento tem fonte vetorial própria em `compartilhamento.svg` e derivado PNG 1200 × 630. Os ícones Lucide existentes e suas licenças foram preservados. A galeria usa `dialog` nativo e conserva os links das imagens como fallback.
