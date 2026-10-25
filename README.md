# Mateus Magalhães | Portfólio

Portfólio profissional com projetos web, backend e Android, trajetória em Ciência da Computação e experiência com pessoas e processos. Os estudos de caso apresentam o problema, as decisões técnicas, a participação no projeto, as evidências e as limitações de cada entrega.

![Página inicial do portfólio](docs/imagens/portfolio-atual-desktop.jpg)

## Projetos

- **Controle Financeiro Android:** aplicativo em Kotlin, Jetpack Compose e Room. Reúne lançamentos, sugestões locais por notificações autorizadas, gráficos, contas reutilizáveis, backup criptografado, orçamentos, recorrências e proteção opcional. O estudo inclui capturas reais com dados fictícios e distingue os testes sintéticos da validação bancária ainda pendente.
- **Barbearia do Semá:** sistema acadêmico de agendamento com Node.js, Express e SQLite. O estudo descreve disponibilidade, reservas e revisão técnica.
- **Fluxo:** demonstração interativa de organização de solicitações, com busca, status, persistência no navegador e exportação CSV. Utiliza dados fictícios.
- **Portfólio profissional:** apresentação estática com navegação acessível, filtros e estudos de caso.

## Apresentação e tecnologias

A interface mantém a paleta neutra com acentos em roxo. Uma narrativa em três momentos — observar, construir e validar — conecta a experiência profissional às decisões dos projetos. A rolagem sincroniza a prévia visual, sem capturar o scroll ou impedir a leitura dos textos.

A base utiliza HTML semântico, CSS responsivo e módulos JavaScript nativos, sem framework ou dependências de execução. Os ícones vetoriais são da biblioteca **Lucide**, hospedados localmente em um sprite SVG. As geometrias originais, a procedência e as licenças ISC e MIT estão preservadas em [assets/icons](dist/assets/icons).

O conteúdo principal, os contatos, o currículo e os estudos continuam disponíveis sem JavaScript. As animações respeitam a preferência por movimento reduzido.

## Qualidade

O modelo da demonstração Fluxo mantém 24 testes automatizados. A checagem do site verifica arquivos, links internos, âncoras HTML, símbolos SVG e sintaxe JavaScript. As conferências de navegador e suas limitações constam no [registro de qualidade](docs/qualidade.md).

Os 178 testes citados no estudo do aplicativo Android pertencem à execução vinculada naquele projeto. Não são testes deste portfólio ou uma garantia de compatibilidade com todos os bancos.

O currículo público conserva as informações profissionais sem divulgar telefone ou endereço completo. As imagens do aplicativo usam somente dados fictícios.

## Estrutura

- `dist/`: site pronto para publicação no GitHub Pages.
- `dist/projetos/`: estudos de caso.
- `dist/demos/solicitacoes/`: demonstração Fluxo.
- `dist/assets/`: estilos, scripts, ícones, imagens e currículo.
- `scripts/` e `test/`: verificações estáticas e testes.
- `docs/`: decisões, desenvolvimento e evidências.

Os procedimentos de manutenção ficam em [desenvolvimento](docs/desenvolvimento.md). A publicação existente pelo GitHub Actions foi preservada.

## Contato

- [LinkedIn](https://www.linkedin.com/in/mateus-william-628350229)
- [GitHub](https://github.com/Mateus1804)
- [E-mail](mailto:mateuswilliam.magalhaes@gmail.com)
