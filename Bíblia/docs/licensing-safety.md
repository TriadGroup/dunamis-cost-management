# Segurança de Licenciamento

## Regra operacional

Importar não significa publicar.

O pipeline aceita EPUBs para:

- análise estrutural
- uso interno
- revisão editorial
- preparação de catálogo

Mas não libera exibição pública automaticamente quando:

- o EPUB contém aviso de copyright
- há editora contemporânea identificável
- a permissão de redistribuição não está explícita

## Estados usados

- `public_domain`
- `licensed`
- `restricted`
- `unknown`
- `internal_only`
- `pending_review`

## Defaults conservadores

- `can_display_publicly = false`
- `can_use_for_compare = false`

Exceto quando houver evidência forte de domínio público ou licença adequada.

## Evidências lidas

- `dc:rights`
- editora
- páginas de copyright/prefácio
- frases como:
  - `©`
  - `todos os direitos reservados`
  - `all rights reserved`

## Situação atual dos EPUBs importados

Ver auditoria real em [`docs/epub-source-audit.md`](./epub-source-audit.md).

Na execução atual:

- NVI: restrita
- NAA: restrita
- ARA: restrita
- ACF 1969: restrita com base no arquivo fornecido
- BKJ: `pending_review`, mas com publicação desativada

## Política de produto

- o texto importado serve para normalização interna e alinhamento com comentários
- qualquer exposição pública futura deve passar por validação jurídica explícita e, se necessário, provider licenciado
