# Percentual Contratual por Cliente

Acesso: Clientes → abrir um cliente → aba **Contratos**.

## Regras implementadas

- Um cliente pode possuir vários contratos, cada um com percentual e vigência próprios.
- A data de transmissão da PER/DCOMP define qual contrato se aplica.
- Vigências sobrepostas são bloqueadas para evitar dois percentuais aplicáveis ao mesmo processo.
- O percentual contratual incide sobre a soma `valor compensado + valor recebido`.
- O resultado contratual é destacado, enquanto pedido, compensado e recebido permanecem visíveis com suas simulações isoladas para conferência.
- PER/DCOMPs sem contrato vigente são contadas e destacadas, mas não entram em nenhum cálculo.
- Valores vazios ou inválidos são tratados como zero. Valores em formatos `1000.00` e `1.000,00` são aceitos pelo cálculo.

## Natureza informativa

Os resultados não geram honorários, cobrança, contas a pagar ou obrigação financeira. A opção **Sinalizar futura evolução para honorários devidos** registra apenas uma intenção funcional visível; ativar uma cobrança real exigirá nova especificação, aprovação e implementação.

Administradores podem criar e atualizar contratos. Funcionários autorizados podem consultar. Contratos não são apagados pela interface: para encerrar um, informe o fim da vigência, preservando o histórico.

## Conferência no sandbox

1. Abra um cliente que tenha PER/DCOMPs e entre em Contratos.
2. Cadastre, por exemplo, 10% com início anterior à data de transmissão de uma PER/DCOMP.
3. Confira as três bases e os três valores informativos.
4. Crie uma segunda vigência sem sobrepor a primeira e valide a troca de percentual.
5. Tente sobrepor períodos: o sistema deve recusar.
6. Marque a evolução futura, salve e confira o aviso no cartão.

A migração `clients.0010_clientcontract` deve ser aplicada primeiro. No sandbox, use o script seguro `scripts/migrate_sandbox_contracts.py`, que cria e verifica um backup antes da migração.
