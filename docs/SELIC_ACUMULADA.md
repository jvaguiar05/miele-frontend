# Taxa Selic acumulada para pagamento

Acesso: **Relatórios → Selic acumulada** (`/reports/selic`).

## Conteúdo e permissões

- Carga inicial: 380 índices mensais fornecidos, de fevereiro/1995 a setembro/2026.
- Fonte inicial: Sicalc — Sistema de Cálculo de Acréscimos Legais; emissão de referência em 25/09/2026.
- Janeiro/1995 e meses posteriores a setembro/2026 não foram preenchidos e aparecem como indisponíveis, não como zero.
- Administradores e funcionários aprovados podem consultar, calcular, imprimir e exportar CSV.
- Somente administradores podem incluir ou alterar uma taxa. Não existe exclusão pela API.
- Ano e mês são únicos. Taxas negativas, meses inválidos e anos fora de 1995–2100 são rejeitados.
- Alterações entram no Relatório de Atualizações Diárias como auditoria de Taxa Selic acumulada.

## Calculadora

Fórmula informativa: `juros = valor-base × taxa acumulada ÷ 100`. O total atualizado é `valor-base + juros`.

A calculadora não decide automaticamente qual competência deve ser usada e não inclui multa ou outros acréscimos. O usuário deve confirmar o período e as regras aplicáveis antes do uso oficial.

## Atualização manual

Na própria aba, o administrador informa ano, mês, taxa, fonte e data de referência. Clicar em uma célula existente carrega seus dados para edição; informar um mês ainda vazio cria o novo índice.
