# Desenvolvimento e manutenção

## Ambiente e comandos

O projeto utiliza Node.js 22 ou superior e Python 3 para a prévia local. Não há dependências npm ou etapa de compilação.

```sh
npm test
npm run check
npm run serve
```

A prévia local utiliza `http://localhost:8080`. O diretório publicável é `dist/`. Os caminhos relativos mantêm a compatibilidade com o subdiretório `/Portfolio/` do GitHub Pages.

## Organização da interface

O HTML mantém o conteúdo e os links completos. O arquivo `dist/assets/js/main.js` habilita menu, filtros, cópia de e-mail e melhorias de movimento. Os estilos ficam em `dist/assets/css/styles.css`; a demonstração Fluxo conserva seus arquivos e regras próprias.

O scrollytelling tem três textos estáticos e uma prévia visual sincronizada. Um IntersectionObserver limita o trabalho à área da narrativa; um único requestAnimationFrame por quadro lê a posição dos três textos. Não há biblioteca de animação ou interceptação da rolagem. Em telas baixas, a prévia deixa de ser fixa. A preferência `prefers-reduced-motion` desativa a sincronização animada e as transições.

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

A suíte de navegador sobe um servidor temporário sob /Portfolio/, com a mesma base de caminhos do GitHub Pages, e recusa requisições externas. Os cenários abrangem as seis páginas em quatro larguras, filtros, teclado, os três capítulos, alteração da preferência de movimento, leitura sem JavaScript e carregamento de SVGs e capturas locais.

Chromium indisponível interrompe a suíte; os testes não são convertidos em skips. A execução de GitHub Pages depende da checagem reutilizável completa, incluindo o navegador. As capturas de evidência ficam no artefato evidencias-interface, com retenção de 14 dias.

A instalação local de dependências e os testes Node foram executados. Os testes de navegador desta etapa são executados pelo CI; os resultados ficam vinculados ao pull request.
