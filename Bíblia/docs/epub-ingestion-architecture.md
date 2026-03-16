# Arquitetura de Ingestão EPUB

## Objetivo

O pipeline trata EPUBs bíblicos como fontes estruturadas, não como ebooks genéricos. O foco é:

- preservar capítulo e verso
- manter notas e referências fora do texto do verso
- rastrear proveniência por arquivo, documento e fragmento
- sinalizar incerteza em vez de inventar segmentação

## Fluxo

1. Descoberta em `data/epub`
2. Hash SHA-256 e criação do job
3. Leitura do EPUB:
   - `META-INF/container.xml`
   - OPF / manifest / spine
   - NCX quando disponível
4. Coleta de documentos XHTML/HTML
5. Inferência de perfil estrutural
6. Parsing por perfil
7. Normalização canônica:
   - livro
   - capítulo
   - verso
   - referência cruzada
8. Validação estrutural
9. Persistência em SQLite
10. Geração de relatórios JSON/Markdown
11. Atualização da auditoria consolidada

## Perfis implementados

### `naa`

- usa índices de capítulos `Capítulos de ...`
- cada arquivo de capítulo é mapeado via links do índice
- versos são extraídos de blocos `div.class77`
- cabeçalhos são detectados em `div.class79`

### `nvi`

- livro concentrado por arquivo
- capítulos identificados por blocos `heading_*`
- versos em `span.class_s1HSD`
- notas no mesmo documento em `aside/div.class_s2HG-0`

### `ara`

- capítulos em páginas próprias com `h2.c`
- versos em âncoras `a.v`
- notas em arquivos `notas*.xhtml`
- referências cruzadas vêm das notas `span.xt`

### `acf1969`

- capítulos em arquivos regulares e arquivos `*_split_*`
- versos em âncoras `id="vC.V"`
- notas de rodapé em `p.pnota`
- notas inline também são capturadas quando aparecem dentro do mesmo parágrafo

### `bkj`

- livros grandes por arquivo
- capítulos marcados por `span.dcap` / `span.dcap1`
- versos detectados por marcador numérico no início do parágrafo
- continuação sem marcador é anexada ao verso anterior

## Módulos

- `src/lib/ingestion/discovery.ts`
  - descoberta e hashing de arquivos
- `src/lib/ingestion/archive.ts`
  - container OPF/NCX, manifest e spine
- `src/lib/ingestion/canon.ts`
  - mapeamento PT/EN/abreviações
- `src/lib/ingestion/parser.ts`
  - perfis e extração Bible-aware
- `src/lib/ingestion/license.ts`
  - detecção conservadora de status jurídico
- `src/lib/ingestion/validation.ts`
  - gaps, duplicatas, ordem, tamanho suspeito, cobertura
- `src/lib/ingestion/database.ts`
  - persistência relacional idempotente em SQLite
- `src/lib/ingestion/report.ts`
  - relatórios por import e auditoria consolidada
- `src/lib/ingestion/runner.ts`
  - orquestração do batch
- `scripts/import-bibles.ts`
  - CLI local

## Decisões de confiabilidade

- sem segmentação agressiva quando o EPUB não prova a fronteira do verso
- `verse_text` nunca recebe marcador de nota
- notas e cross refs são sempre armazenadas fora do verso
- conflitos e lacunas viram `review_queue`
- licenciamento restrito/incerto nunca habilita publicação automática
