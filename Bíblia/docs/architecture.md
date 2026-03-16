# Arquitetura

## Visão geral

O produto foi estruturado como um app Next.js standalone dentro de `Bíblia/`, isolado do restante do workspace. O objetivo é permitir evolução para um portal bíblico sério sem acoplar o domínio a um app existente.

## Camadas

### 1. Interface

- `src/app`: App Router com rotas indexáveis para leitura, comparação, autores, obras, temas, busca, coleções e admin.
- `src/components`: shell, leitor, comentário, admin e UI shared.

### 2. Domínio

- `src/lib/demo/canon.ts`: estrutura dos 66 livros.
- `src/lib/demo/content.ts`: seed editorial, fontes, traduções, autores, obras, temas e comentários.
- `src/lib/reference/*`: normalização de referência e lógica de escopo.
- `src/lib/search/search.ts`: busca híbrida v1 para seed local.

### 3. Dados

- `prisma/schema.prisma`: modelo relacional preparado para PostgreSQL/Supabase.
- Na UI atual, a leitura usa seed local para rodar sem banco externo.
- O contrato já permite trocar o repositório de seed por Prisma sem quebrar rotas ou componentes.

## Decisões centrais

### Escopo de comentário

Cada entrada declara:

- `scopeType`: `verse | pericope | chapter | book`
- `directness`: `direct | indirect | editorial`
- `startRef` e `endRef`

Isso impede que um comentário amplo seja confundido com anotação direta do verso.

### Traduções

As traduções não são tratadas como texto estático obrigatório. O sistema nasce com `TranslationProvider` e status de ativação, porque NVI, NAA e BKJ exigem trilha legal específica.

### Seed local vs produção

O seed local serve para:

- validar IA/UX;
- testar agrupamento por escopo;
- testar busca;
- demonstrar proveniência.

Não substitui o pipeline de ingestão real nem o banco.

## Busca

V1 usa:

- resolução determinística de referência;
- busca textual normalizada por autor, obra, tema e comentário;
- ranking simples com prioridade para referências.

Produção prevista:

- PostgreSQL FTS com `unaccent`;
- `pg_trgm` para fuzzy;
- índices por range/escopo;
- ranking por tipo, match e confiança editorial.

## SEO e discovery

- Rotas semânticas em PT-BR.
- `sitemap.ts` e `robots.ts`.
- Metadados básicos no layout.
- Estrutura preparada para metadados dinâmicos por verso/autor/obra.
