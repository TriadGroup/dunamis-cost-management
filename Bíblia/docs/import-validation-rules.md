# Regras de Validação do Import

## Regras aplicadas hoje

### Cobertura

- diferença entre livros detectados e cânon esperado
- diferença entre capítulos detectados e contagem canônica do livro

### Ordem e consistência

- versos duplicados
- lacunas de versificação
- versos fora de ordem

### Tamanho suspeito

- versos muito curtos
- versos excessivamente longos

### Integridade de notas

- marcador de nota sem conteúdo resolvido
- referência cruzada sem normalização confiável

### Segurança jurídica

- traduções restritas/incertas geram item de revisão de licenciamento

## Filosofia de validação

- avisar em vez de silenciar
- preferir falso positivo revisável a falso negativo oculto
- não inventar verso quando o EPUB não comprova a divisão

## Motivos de `review_queue`

- `unknown_book`
- `unknown_chapter`
- `unclear_verse_split`
- `duplicate_verse`
- `missing_verse_gap`
- `out_of_order_verse`
- `unresolved_note_marker`
- `unresolved_cross_reference`
- `suspicious_fragment`
- `suspicious_length`
- `licensing_review`
- `content_conflict`

## Leitura dos relatórios

- poucos avisos e alta cobertura: import estruturalmente forte
- alta fila de revisão: parser funcional, mas ainda conservador ou com lacunas de perfil
- cobertura baixa + pouca revisão: suspeitar de falha de detecção do perfil
