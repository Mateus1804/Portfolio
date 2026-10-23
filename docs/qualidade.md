# Qualidade e validação

Registro da primeira versão, conferida em **22 de outubro de 2026**, no fuso `America/Sao_Paulo`.

## Referência e escopo

O repositório de destino continha somente o README inicial. O escopo desta entrega é o portfólio estático e a demonstração Fluxo. O código da Barbearia do Semá pertence a outro repositório e não foi alterado por esta entrega.

## Verificações executadas

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| `npm test` | 24 aprovados, 0 falhas e 0 pulados | `test/solicitacoes.test.mjs` |
| `npm run check` | Aprovado | 5 páginas HTML, 91 referências e 16 arquivos publicados; caminhos, âncoras, descrições de imagens e sintaxe JavaScript |
| Responsividade | Sem rolagem horizontal nas cinco páginas | Chromium, em frames com larguras de viewport de 320, 390, 768 e 1440 px |
| Imagens da página inicial | Carregadas | Captura e inspeção no Chromium |
| Filtros de projetos | Aprovados | Todos: 3; frontend: 2; full stack: 1; ativação por teclado |
| Menu móvel | Aprovado | Abertura por Enter, Escape para fechar e atualização de `aria-expanded` |
| Atalho para conteúdo | Aprovado | Enter em “Pular para o conteúdo” leva o foco a `main`; Tab segue para o primeiro link da apresentação |
| Criação no Fluxo | Aprovada após correção | 6 registros iniciais, criação eleva o total para 7 |
| Status e persistência | Aprovados | Alteração para concluída preservada após navegar/recarregar a demo |
| Busca e combinação de filtros | Aprovadas | Busca sem acento encontra título acentuado; prioridade incompatível apresenta estado vazio |
| Entradas como texto | Aprovadas | Um título com marcação `<b>` é mostrado literalmente, sem criar elemento HTML |
| Restauração da demo | Aprovada | Confirmação restaura os seis exemplos |
| Diálogo por teclado | Aprovado | Escape fecha o diálogo e retorna o foco ao botão de nova solicitação |
| Exportação CSV | Aprovada | Arquivo baixado pelo Chromium e lido como CSV: cabeçalho e seis registros, com seis colunas |
| Currículo público | Aprovado como arquivo | Uma página; texto extraído e renderização inspecionada; links embutidos; sem telefone, endereço completo ou CEP |
| Cópia de e-mail bloqueada | Alternativa aprovada | Retorno textual após indisponibilidade da área de transferência; link de e-mail permanece disponível |

Os frames usam o motor real do Chromium. A barra de rolagem pode reduzir a largura útil do documento em 15 px. Essa conferência de layout não representa execução em aparelhos físicos.

## Correções durante a conferência

- A criação da solicitação dependia de `crypto.randomUUID`, indisponível no contexto HTTP do preview. O identificador passou a usar `crypto.getRandomValues`, sem depender de contexto seguro para esse recurso. A criação e a persistência foram novamente exercitadas.
- Os marcos principais receberam `tabindex="-1"` para tornar verificável o foco do atalho que pula a navegação.
- A tentativa de copiar e-mail passou a informar o andamento e oferecer retorno textual se a permissão não for resolvida. O botão é liberado novamente após a tentativa.

## Cobertura dos testes do modelo

São exercitados os exemplos iniciais, a leitura de dados salvos, listas vazias, JSON inválido, versões incompatíveis, identificadores duplicados, limites de tamanho, valores inesperados, normalização de datas, busca com acentos, combinação de filtros, ordenação, contagens, atualização de status e CSV.

Os cenários de CSV incluem aspas, vírgulas, quebras de linha, BOM UTF-8 e neutralização de possíveis fórmulas. As funções não alteram o estado original ao selecionar ou atualizar listas.

## Verificações limitadas ou não executadas

- O navegador de teste não confirmou o evento de download do PDF: a espera pela transferência expirou. O arquivo presente no site foi inspecionado e sua referência foi validada; o download do currículo deve ser reconferido no endereço público final.
- A escrita bem-sucedida na área de transferência não foi confirmada neste navegador; o tratamento de indisponibilidade foi exercitado.
- Não houve teste em Android físico, iOS, Safari, Firefox ou leitor de tela. Não foi realizada certificação WCAG, auditoria de segurança externa ou medição Lighthouse.
- Os testes de navegador foram conduzidos nesta sessão de revisão. A integração contínua executa os testes do modelo e a checagem estática, sem prometer uma suíte de navegador automatizada no GitHub Actions.
- A disponibilidade externa de LinkedIn, GitHub e aplicativos de e-mail não é coberta pela checagem local. Links para código devem ser conferidos após o envio ao repositório.
- O job de GitHub Pages é condicionado a `PAGES_ENABLED=true`; ativação, URL pública e permissões de publicação dependem da configuração do repositório e não são resultados dos testes locais.
- A demo não tem autenticação ou backend. Não processa operações empresariais reais. O LocalStorage pode ser removido pelo navegador ou ficar indisponível.
- Os 104 testes da barbearia são evidência da revisão técnica registrada naquele projeto, e não testes desta entrega.

## Repetir a conferência

Execute `npm test` e `npm run check`. Inicie `npm run serve`, abra o endereço local e confira as cinco páginas nas larguras citadas. Use Tab, Shift+Tab, Enter e Escape nos links, no menu e nos diálogos. Na demo, crie um registro fictício, altere seu status, recarregue, filtre, exporte o CSV e restaure os exemplos ao terminar.

Ao atualizar o PDF, confira sua extração de texto, renderização, dados de contato e o download no endereço publicado. Atualize este registro somente para verificações efetivamente repetidas.
