# Visualizador de captura

Página: `/visualizador-leads.html`. Consulta somente os 50 contatos mais recentes, por data de criação. Sem alterações, exclusões, status, exportação ou funções de CRM.

## Ativação

Cadastrar na Vercel uma variável Secret chamada `LEAD_VIEWER_PASSWORD`, com senha aleatória de 32 a 128 caracteres gerada por gerenciador de senhas. Usar letras e números; não reutilizar nenhuma credencial ou segredo existente. Habilitar no ambiente que receberá esta branch e fazer novo deploy. A função reutiliza `FIREBASE_SERVICE_ACCOUNT_JSON` já configurada. Nenhuma mudança nas regras do Firestore é necessária.

O projeto da LP não estava acessível pela conexão Vercel durante a implementação; a variável não foi cadastrada automaticamente.

Abrir `/visualizador-leads.html` no mesmo domínio do deploy e inserir a senha. Ela é enviada somente por HTTPS no cabeçalho Authorization, mantida em memória durante a tela e apagada ao sair ou recarregar. Não vai para URL, localStorage, analytics ou repositório. Uma senha forte é obrigatória; sem configuração a API retorna 503 e sem autorização retorna 401. O endpoint não permite gravação. A interface estática é pública, mas não contém nenhum lead real.

A senha é compartilhada para esta demonstração pequena. Não há identificação individual ou revogação por usuário; não substituir um painel com autenticação individual se o uso for ampliado. Ao terminar a apresentação, remover a variável e fazer redeploy para desativar a consulta. Não registrar o cabeçalho Authorization em ferramentas externas de monitoramento.

## Demonstração

`Ver exemplo fictício` exibe três registros locais claramente identificados como exemplos; não acessa o banco. Para comprovar a captura real à diretoria, enviar um contato de teste pelo formulário publicado e depois clicar em Atualizar no visualizador autenticado.

Sem atualização automática: a consulta ocorre ao entrar e no botão Atualizar. O limite de 50 evita carregar a base inteira. Dados são renderizados com textContent, inclusive mensagens que contenham HTML. Respostas da API são marcadas como no-store.

## Verificação

`npm test` cobre bloqueio de leitura sem senha, configuração fraca, métodos não permitidos, não cache e seleção de campos. `npm run build` inclui o HTML e mantém código do servidor fora da pasta pública. A leitura real só pode ser confirmada no deploy, após configuração da senha.
