# Portfólio de Mateus William

Apresentação profissional de um estudante de Ciência da Computação em busca de estágio em desenvolvimento web ou backend. O site reúne trajetória, conhecimentos aplicados, contato, currículo público e três estudos de caso com decisões e limitações explícitas.

![Página inicial do portfólio](docs/imagens/portfolio-desktop.jpg)

## Projetos apresentados

| Projeto | Escopo | Demonstração |
| --- | --- | --- |
| Barbearia do Semá | Aplicação acadêmica com Node.js, Express e SQLite | Prévia visual e link para o repositório original; não há API pública vinculada |
| Fluxo | Experimento de frontend para organizar solicitações | Demo funcional com dados fictícios e armazenamento neste navegador |
| Este portfólio | Apresentação profissional em HTML, CSS e JavaScript | A própria página e seu estudo de caso |

Os estudos explicam problema, decisões, participação, validação e limitações. Não são atribuídos clientes, impactos mensurados ou uso empresarial aos exemplos demonstrativos.

## Tecnologias e estrutura

HTML semântico, CSS responsivo e módulos JavaScript nativos. Não há dependências de execução, banco de dados, etapa de build ou instalação de pacotes para abrir o site.

| Caminho | Responsabilidade |
| --- | --- |
| `dist/index.html` | Apresentação e navegação principal |
| `dist/projetos/` | Três estudos de caso em páginas próprias |
| `dist/assets/css/styles.css` | Identidade visual e layouts responsivos |
| `dist/assets/js/main.js` | Menu móvel, filtros e cópia de e-mail |
| `dist/assets/images/` | Capturas do projeto e ilustrações em SVG |
| `dist/assets/curriculo-mateus-william.pdf` | Currículo público de uma página |
| `dist/demos/solicitacoes/model.js` | Validação, filtros, contagens e exportação CSV da demo |
| `dist/demos/solicitacoes/app.js` | Eventos, renderização e armazenamento local da demo |
| `test/solicitacoes.test.mjs` | Testes das regras do painel |
| `scripts/check-site.mjs` | Verificação de referências e integridade das páginas |
| `docs/qualidade.md` | Evidências e limites da validação |

## Executar localmente

Com Python 3:

```bash
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080`. Use um servidor HTTP: os módulos JavaScript não devem ser abertos diretamente com `file://`.

Com Node.js 22 ou superior, os atalhos e as verificações são:

```bash
npm run serve
npm test
npm run check
```

`npm run serve` também utiliza Python 3. Os testes e a checagem usam apenas recursos nativos do Node.js. Não é necessário executar `npm install`.

## Funcionalidades e acessibilidade

- Menu móvel com `aria-expanded`, fechamento com Escape e retorno de foco.
- Link para pular a navegação, foco visível e controles nativos por teclado.
- Filtros de projetos com retorno em uma região de status.
- HTML com os conteúdos principais, links e estudos de caso disponíveis sem JavaScript.
- Imagens com descrição; animações reduzidas conforme a preferência do sistema.
- Contato por e-mail, LinkedIn e GitHub. O botão de copiar possui alternativa textual quando a área de transferência é bloqueada.
- Currículo com texto extraível, em uma coluna, sem telefone, endereço completo, CEP ou documentos pessoais.

As conferências realizadas estão em [Qualidade e validação](docs/qualidade.md). Esses recursos não equivalem a uma certificação completa de acessibilidade.

## Regras da demo Fluxo

A demo permite criar solicitações, buscar por título, descrição ou categoria, combinar filtros, alterar status e exportar a seleção atual em CSV. Começa com seis registros fictícios e admite até 500 registros.

O LocalStorage usa a chave `mw:fluxo:v1`. Os dados pertencem a este navegador. Sem ele, o painel funciona apenas na sessão; informações inválidas não são sobrescritas silenciosamente. Ao detectar alterações em outra aba, a gravação é pausada até recarregar ou restaurar os exemplos.

Entradas são renderizadas como texto. O CSV escapa aspas e quebras de linha e neutraliza possíveis fórmulas nos campos de texto. A restauração solicita confirmação antes de substituir a lista local pelos exemplos iniciais.

Não há autenticação, colaboração entre usuários, integração com a Gontijo ou armazenamento no servidor. Use apenas informações fictícias.

## Publicar no GitHub Pages

O conteúdo a publicar é **`dist/`**. Todos os caminhos internos são relativos e funcionam em um site de projeto, como o deste repositório.

A publicação automática está preparada em `.github/workflows/pages.yml`, inicialmente condicionada à variável `PAGES_ENABLED` para evitar tentativas de publicação antes da configuração da hospedagem.

1. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**.
2. Em **Settings → Secrets and variables → Actions → Variables**, crie a variável de repositório **`PAGES_ENABLED`** com o valor **`true`**. Não é um segredo e não requer token pessoal.
3. Em **Actions**, execute **Publicar no GitHub Pages** pelo botão **Run workflow**, ou faça um novo push em `main`.
4. Consulte a URL retornada pelo próprio job de publicação. Depois disso, cada push ou merge em `main` valida e publica `dist/`.

O workflow **Qualidade** executa testes e checagem em pull requests e pushes em `main`, independentemente da publicação. A configuração da hospedagem e as permissões da conta precisam estar disponíveis para ativar o Pages.

Referência: [documentação oficial de workflows do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Manutenção do conteúdo

Edite o HTML da página inicial e o estudo de caso correspondente ao alterar projetos. Atualize imagens, tecnologias e evidências somente após conferência. Para trocar o currículo, substitua o PDF no mesmo caminho e confirme sua extração de texto e os dados destinados à divulgação.

O projeto usa fontes do sistema e não carrega serviços de análise, fontes remotas ou bibliotecas por CDN. A única persistência da demo é local. O comportamento de links de e-mail depende da configuração do aplicativo do visitante.

## Créditos e limites

As capturas da Barbearia do Semá vêm do [repositório do projeto](https://github.com/Mateus1804/barbearia-do-sema). Suas fotografias são ilustrativas; os autores e origens estão registrados em `public/creditos-fotografias.html` e `docs/frontend.md` naquele repositório. As ilustrações do Fluxo e do portfólio foram criadas em SVG para esta apresentação.

Os 104 testes mencionados no estudo da barbearia se referem à revisão técnica registrada em outubro de 2026. Os **24 testes deste repositório** pertencem ao modelo do Fluxo. Não são medidas de cobertura total ou garantia de ausência de falhas.
