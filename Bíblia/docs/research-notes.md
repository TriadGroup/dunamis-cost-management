# Research Notes

Pesquisa inicial consolidada em **7 de março de 2026**.

## 1. Produto e UX

Direções adotadas:

- leitor em layout de biblioteca digital, não blog;
- split mental entre leitura, estudo e administração;
- cards densos porém limpos para comentários e proveniência;
- UX que continua útil quando a tradução ainda não está ativa.

Padrões assumidos:

- navegação lateral por cânon;
- toolbar de leitura com troca de tradução;
- painel de comentário agrupado por escopo;
- páginas indexáveis por autor, obra e tema;
- empty states honestos.

## 2. Licenciamento de traduções

### NVI

- A política pública de permissões da Biblica exige atenção contratual e limites explícitos.
- Decisão: modelar como `pending_license`, sem texto bundle.

### NAA

- A SBB mantém página oficial da tradução e EULA própria.
- Decisão: não distribuir texto completo sem canal aprovado.

### BKJ

- A trilha pública encontrada é editorial/comercial, não uma licença aberta para bundle.
- Decisão: tratar como `pending_license`.

## 3. Comentários históricos

Fonte prioritária no seed atual:

- CCEL para obras clássicas em domínio público.

Motivos:

- política pública de copyright;
- obras clássicas amplamente citadas;
- boa estabilidade bibliográfica para seed inicial.

Fonte complementar:

- BibleHub apenas como host secundário para verificação de JFB, sempre marcado como tal.

## 4. Línguas originais

Base escolhida:

- SBLGNT para grego;
- OSHB para hebraico;
- STEPBible Data para enriquecimento lexical.

Motivo:

- trilha clara de licença/atribuição;
- vocação para uso digital;
- utilidade direta para notas de verso.

## 5. Busca

Decisões:

- normalização acento-insensível;
- aliases PT/EN desde a primeira versão;
- resolução de referência antes de qualquer full-text;
- produção planejada sobre PostgreSQL FTS + `pg_trgm`.

## 6. Conteúdo editorial

Regra fechada:

- síntese editorial em PT-BR é permitida, mas nunca se apresenta como fonte primária;
- ausência de comentário permanece explícita;
- cobertura parcial é modelada, não escondida.
