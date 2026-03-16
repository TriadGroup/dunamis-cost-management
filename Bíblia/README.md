# Bíblia Comentada

Portal bíblico em português brasileiro para leitura, estudo e curadoria editorial com foco em:

- navegação por livro, capítulo e verso;
- comentário histórico por escopo;
- exegese e hermenêutica editorial separadas de fontes primárias;
- proveniência, bibliografia e status de licenciamento;
- busca por referência, autor, obra e tema;
- base administrativa para ingestão e revisão.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma schema para PostgreSQL/Supabase
- pipeline EPUB dedicado em Node.js + SQLite (`better-sqlite3`)
- Zustand para bookmarks e notas locais
- Vitest + Testing Library

## Como rodar

1. `npm install`
2. `cp .env.example .env.local`
3. `npm run typecheck`
4. `npm test`
5. `npm run dev`

## Ingestão de EPUB bíblico

O projeto agora inclui um pipeline de ingestão específico para Bíblias em EPUB, com:

- descoberta automática em `data/epub`
- hash SHA-256 por arquivo
- parser defensivo por perfil estrutural (`naa`, `nvi`, `ara`, `acf1969`, `bkj`)
- separação entre texto bíblico, notas, referências cruzadas e introduções
- fila de revisão para trechos incertos
- persistência relacional em `data/imports/bible-ingestion.sqlite`
- relatório JSON + Markdown por import
- auditoria consolidada em [`docs/epub-source-audit.md`](./docs/epub-source-audit.md)

### Onde colocar os EPUBs

- diretório padrão: `data/epub`
- o importador procura todos os arquivos `.epub` recursivamente dentro dessa pasta

### Comandos

- `npm run import:bibles`
  - importa em modo `skip`; se o mesmo hash já tiver sido importado com sucesso, o job é pulado
- `npm run import:bibles:replace`
  - reprocessa o arquivo e substitui o conteúdo normalizado atual da tradução
- `npm run import:bibles:new-revision`
  - reserva o modo de revisão nova; a trilha de jobs é preservada, mas o catálogo ativo continua apontando para a revisão atual

### O que entra em cada camada

- `verses.verse_text`
  - apenas texto bíblico normalizado do verso
- `verses.verse_text_raw`
  - extração textual bruta do segmento que originou o verso
- `footnotes`
  - notas, marcadores e HTML bruto de nota quando disponível
- `cross_references`
  - referências cruzadas detectadas a partir das notas
- `section_headings`
  - cabeçalhos editoriais/perícopes
- `book_introductions` e `chapter_introductions`
  - introduções separadas do texto do verso
- `review_queue`
  - segmentos com incerteza estrutural ou jurídica

### Segurança de licenciamento

- o importador **não habilita exibição pública automaticamente** para arquivos com direitos restritos ou incertos
- `can_display_publicly = false` e `can_use_for_compare = false` são o default conservador para arquivos protegidos/duvidosos
- NVI, NAA, BKJ e ARA importadas por EPUB entram em modo interno/revisão até validação jurídica explícita

Mais detalhes:

- [`docs/epub-ingestion-architecture.md`](./docs/epub-ingestion-architecture.md)
- [`docs/bible-import-schema.md`](./docs/bible-import-schema.md)
- [`docs/import-validation-rules.md`](./docs/import-validation-rules.md)
- [`docs/licensing-safety.md`](./docs/licensing-safety.md)
- [`docs/epub-source-audit.md`](./docs/epub-source-audit.md)

## Estratégia de traduções

As traduções `NVI`, `NAA` e `BKJ` já existem no modelo, mas o seed atual **não embute** texto protegido. Cada tradução entra pela camada de provider com estados como:

- `active`
- `pending_license`
- `demo_only`
- `unavailable`

Isso permite evoluir para API licenciada, import aprovado ou provider customizado sem reescrever o produto.

## Modelo de conteúdo

- Estrutura canônica completa dos 66 livros.
- Seed editorial em trechos selecionados: `João 1`, `João 3`, `Romanos 8`, `Efésios 2`, `Tiago 2`, `Salmo 23`, `Isaías 53`, `Gênesis 1`.
- Autores e obras históricas com metadados, cobertura e fonte.
- Comentários com separação entre `verse`, `pericope`, `chapter` e `book`.
- Exegese/hermenêutica editorial e notas de língua original.

## Proveniência e legalidade

- Fontes usadas e classificadas em [`docs/source-register.md`](./docs/source-register.md)
- Pesquisa e decisões em [`docs/research-notes.md`](./docs/research-notes.md)
- Restrições de tradução em [`docs/licensing-notes.md`](./docs/licensing-notes.md)
- Auditoria de EPUBs importados em [`docs/epub-source-audit.md`](./docs/epub-source-audit.md)

## Limitações atuais

- O seed local não publica texto integral de NVI, NAA ou BKJ.
- A persistência editorial ainda está em modo demo/local de sessão; o schema Prisma já está preparado para PostgreSQL/Supabase.
- A cobertura de comentários é inicial e explicitamente parcial.
- Alguns EPUBs importados ainda exigem revisão estrutural manual; o estado atual está documentado com honestidade em [`docs/epub-source-audit.md`](./docs/epub-source-audit.md).

## Próximos passos

- Ativar banco e migrations reais.
- Conectar providers licenciados para NVI/NAA/BKJ.
- Expandir ingestão de corpus em domínio público.
- Adicionar autenticação/RLS e workflow editorial persistente.
- Refinar os parsers perfil-a-perfil até cobrir 66/1043 capítulos com revisão residual mínima.
