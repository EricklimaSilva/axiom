# Erick OS

## Planejamento do Erick Companion

- O calendário de consistência não será alterado visualmente.
- O companion será um módulo independente sobre o calendário existente.
- A integração ocorrerá no fluxo de inicialização do dashboard.
- O módulo deverá identificar células ativas, calcular um caminho cronológico e animar uma entidade digital azul-ciano.

### Arquivos alvo para análise
- frontend/index.html
- frontend/css/variables.css
- frontend/css/dashboard.css
- frontend/css/components.css
- frontend/js/app.js
- frontend/js/dashboard/

### Próximo passo
1. Inspecionar o módulo do calendário e os pontos de inicialização do dashboard.
2. Definir a integração sem mexer no layout aprovado.
3. Implementar o módulo de forma independente e segura.

## Banco de dados

O projeto usa PostgreSQL no desenvolvimento e em produção via a variável `DATABASE_URL`.

Configuração mínima:
- crie o banco `axiom` no PostgreSQL;
- ajuste `.env` com algo como `DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/axiom`;
- inicie o backend com `./run.sh`;
- deixe o PostgreSQL rodando localmente na porta `5432`.

Se `DATABASE_URL` não estiver definido, o backend não sobe.

O script `run.sh` agora cria o banco, aplica as migrations e sobe a API em sequência.
