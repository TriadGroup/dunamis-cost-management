# Ingestion Pipeline

## Objetivo

Preparar a base para importar grandes coleções de comentários históricos sem presumir formatação perfeita.

## Etapas

1. **Cadastro da fonte**
   - registrar URL, direitos, confiança e política de uso.
2. **Entrada bruta**
   - HTML, TXT, PDF derivado, manual ou provider.
3. **Normalização**
   - limpar ruído;
   - unificar encoding;
   - separar headings, locators e blocos.
4. **Parser de referências**
   - aliases PT/EN;
   - ranges;
   - fallback para revisão.
5. **Sugestões de mapeamento**
   - gerar `startRef`, `endRef`, `scopeType`, confiança.
6. **Revisão humana**
   - aprovar, editar, rejeitar ou marcar como duplicado.
7. **Publicação**
   - material entra no catálogo público.
8. **Reindex**
   - atualizar busca e cobertura.

## Regras

- confiança baixa não publica automaticamente;
- host secundário exige checagem adicional;
- tradução protegida não entra no bundle local;
- resumo editorial não substitui a citação primária.
