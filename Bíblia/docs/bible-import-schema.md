# Schema de Importação Bíblica

## Banco usado hoje

- arquivo: `data/imports/bible-ingestion.sqlite`
- finalidade: staging/normalização/revisão local

## Tabelas centrais

### `translations`

- metadados da tradução
- hash do arquivo fonte
- status jurídico
- flags de publicação/comparação
- perfil de parser usado

### `books`

- cânon normalizado
- ordem canônica
- nomes padrão PT/EN
- slug e OSIS

### `translation_books`

- relação entre tradução e livro detectado
- rótulo original do EPUB
- ordem detectada

### `chapters`

- unidade normalizada por tradução/livro/capítulo
- status do import
- documento fonte

### `verses`

- texto normalizado do verso
- texto bruto extraído
- confiança do parser
- flag `needs_review`
- documento/âncora/hash do fragmento de origem

### `section_headings`

- títulos editoriais ou de perícope
- escopo aproximado no capítulo

### `footnotes`

- marcador da nota
- texto da nota
- tipo detectado
- HTML bruto quando disponível

### `cross_references`

- verso de origem
- referência crua
- referência normalizada quando resolvida

### `book_introductions`

- introduções de livro separadas do texto canônico

### `chapter_introductions`

- introduções de capítulo separadas do texto canônico

### `import_jobs`

- histórico de execução
- modo (`skip`, `replace`, `new_revision`)
- hash, versão e relatórios associados

### `import_job_items`

- granularidade por documento processado
- kind, preview, confiança e status

### `import_warnings`

- avisos pós-validação

### `raw_fragments`

- HTML/texto bruto preservado para revisão

### `review_queue`

- fila de triagem manual
- suspected book/chapter/verse
- motivo, confiança, sugestão e fragmento bruto

## Idempotência

- `translations.short_code` é único
- `verses (translation_id, normalized_reference)` é único
- o hash do arquivo decide `skip`
- `replace` substitui o conteúdo ativo normalizado da tradução
- `import_jobs` preserva histórico da execução
