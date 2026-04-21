export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  author?: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
  adminOnly?: boolean;
}

export const defaultFaq: FaqCategory[] = [
  {
    id: "A",
    title: "Guias de instalação",
    items: [
      {
        id: "1A",
        question: "Instalação Completa do LuaTools",
        answer: `🛠️ Como baixar o Luatools + Dependências\nCréditos do Tutorial @Snox\n\n📥 Método Manual (Super Fácil)\n1. Baixe a Steam (obviamente)\n2. Instale (caso não tenha instalado)\n3. Faça login normalmente\n4. Adicione a pasta da Steam na exclusão do Windows Defender para garantir que não irá apagar nenhum fix: https://youtu.be/el9nLY4ewHI\n5. Baixe o SteamTools e execute o instalador: https://steamtools.net/download\n6. Baixe o Millennium e execute o instalador: https://docs.steambrew.app/users/getting-started/installation\n7. Baixe a pasta do Luatools: https://github.com/madoiscool/ltsteamplugin/releases (Sempre escolha a versão mais recente).\n8. Extraia a pasta do Luatools no local correto: C:\\Program Files (x86)\\Steam\\plugins\n\n⚠️ Certifique-se de colocar TODOS os arquivos do plugin dentro de uma pasta chamada ltsteamplugin ou o nome que preferir. NÃO deixe os arquivos soltos na pasta plugins.\n\n✅ Depois disso, reinicie a Steam e verifique se o plugin está ativado. Pronto, agora vc já pode se divertir com o LuaTools 🎉`
      },
      {
        id: "2A",
        question: "O jogo dá Erro ou Não abre? Aprenda Baixar e Instalar um Fix",
        answer: `🛠️ Meu jogo precisa de um fix, onde eu encontro?\n1. Acesse o site: https://generator.ryuu.lol/fixes\n2. Busque pelo nome do jogo ou pelo appid (sequência de números no link da página do jogo na Steam, ex: appid = 1159690).\n3. O site não abre? Use VPN.\n4. Não tem seu fix? Procura no chat-br. Ainda não achou? Esqueça o LuaTools e baixe o jogo completo de algum site.\n5. Baixe o fix e extraia.\n6. Copie todos os arquivos para a pasta do jogo (Na biblioteca, clique com o direito no jogo > Gerenciar > Explorar Arquivos Locais).\n7. Substitua tudo, caso pergunte.\n8. Inicie o jogo pela Steam. Não funcionou? Inicie pela pasta do jogo executando o "aplicativo"/"executável" que veio com o fix.\nPronto 🎉\n\n🤔 Tira dúvidas:\n- Não tem fix pro meu jogo, e agora? Recomendo procurar no servidor do nosso parceiro https://discord.gg/uutqvZZMsE\n- Como faço para o antivírus não apagar o fix? Coloque a pasta na exclusão do antivírus: https://www.youtube.com/shorts/el9nLY4ewHI\n- Meu navegador disse que é perigoso, devo me preocupar? Não, é normal, o fix só engana o jogo. Pesquise no google/youtube como o seu navegador permite baixar arquivos suspeitos.\n- Coloquei o fix na pasta, mas nada mudou: Confira se vc extraiu o fix... Ou tente iniciar por um executável da pasta do jogo.`
      },
      {
        id: "3A",
        question: "Jogar Online usando 'Correção Online' ou 'Online-Fix'",
        answer: `O meu jogo funciona online❓\nDepende. Os únicos jogos multiplayer que funcionam são Forza 4 e 5. Todo o resto dos jogos 100% online, só comprando mesmo. Por exemplo, Arc Riders é multiplayer, então não dá.\n\nE os jogos coop ou via lan?\nSim, e a maioria precisa de um fix. Continue lendo para saber como procurar um fix.\n\nPosso instalar o online fix pelo menu do Lua?\nNão. No momento, está em manutenção, por isso, recomendo pegar o fix direto da fonte e instalar manual. Olha só:\n\n1. Acesse o site: https://online-fix.me/ (traduza a página se necessário).\n2. Busque o appid ou o nome do jogo.\n3. Leia as informações da página (Precisa de login pra baixar e senha para extrair o fix).\n4. Baixe o fix (escolha o primeiro botão azul com 'generic' no nome).\n5. Extraia todos os arquivos para a pasta do jogo (biblioteca da Steam > gerenciar > explorar arquivos locais).\n6. Substitua tudo que pedir.\n7. Inicie o jogo com a Steam aberta, convide seu amigo e divirtam-se. 🎉\n\n🤔 Dúvidas frequentes:\n- Iniciei o jogo e aparece que estou jogando "spacewar", é normal? Sim, é como o online-fix funciona.\n- Meu amigo tem o jogo original, dá pra jogar com ele? Sim, peça para ele usar o mesmo fix.\n- Não sei qual é a senha. Dá uma olhada na página do fix do jogo.\n- Não vejo os botões de download. Verifique se você está logado no site.`
      },
      {
        id: "4A",
        question: "Jogar Online usando 'Conexão torrent'",
        answer: `🎮 Como Jogar Online\n📋 Passo a Passo\n1. Gerenciador de Downloads: Baixe e instale o Free Download Manager para garantir que os arquivos não corrompam.\n2. Acesse a Fonte: Entre no site Online Fix e faça login na sua conta (obrigatório para ver os links).\n3. Obtendo o Jogo: Procure pelo jogo desejado e selecione a opção t0rrent.\n4. Aplicação do Fix: Após baixar o arquivo, localize a pasta Fix Repair e extraia o fix dela.\n⚠️ Importante: Mova todos os arquivos de dentro dessa pasta para a pasta raiz do seu jogo instalado.\n\n🛠️ Solução de Problemas (Troubleshooting)\nSe o jogo apresentar erro de .dll não encontrada:\n- Antivírus: Desative o antivírus temporariamente ou adicione a pasta do jogo às exclusões.\n- Reinstalação: Extraia o Fix novamente com o antivírus desligado.\n\nAinda não funcionou?\nSe os passos acima falharem, a recomendação é baixar a versão completa do jogo diretamente pelo site do Online Fix, pois ela já vem pré-configurada.\n⚠️ Caso for jogar com o seu amigo, ambos precisam ter o jogo original ou do onlinefix.`
      },
      {
        id: "5A",
        question: "Adicionar Jogos ou DLCs manualmente",
        answer: `📦 Como Adicionar DLCs ao Jogo\n📋 Passo a Passo\n1. Acesse o canal: 🎮・gen-games-here\n2. Gere o arquivo .lua digitando: /dlcgen [appid] [api]\n- appid: ID do jogo (não é o ID da DLC). Você encontra no link da página do jogo na Steam.\n- api: Fonte para gerar o arquivo. Caso não venha a DLC correta, teste outra.\n3. Baixe e extraia: Faça o download, extraia e mantenha apenas o arquivo .lua.\n4. Mova o arquivo: Envie somente o .lua para: C:\\Program Files (x86)\\Steam\\config\\stplug-in\n5. Reinicie a Steam: Feche completamente (inclusive da bandeja) e abra novamente.\n\n⚠️ Certifique-se de que está usando o ID correto do jogo (não da dlc) e que apenas o arquivo .lua foi colocado na pasta.`
      },
      {
        id: "6A",
        question: "Remover jogos da Bibloteca Steam",
        answer: `Essa é a maneira de excluir vários jogos de uma vez. Se vc quiser remover apenas um jogo, basta pesquisar o nome dele na loja e seguir os passos 1 e 2.\n1. Abra a Steam, vá em Loja e entre na página da loja de um jogo que você quer remover\n2. Do lado direito, clique no ícone do LuaTools\n3. Escolha o ícone de Configurações ⚙️\n4. Na tela seguinte, role até chegar no jogo desejado ou digite na busca. Por fim, clique no ícone de Lixeira 🗑️ e pronto!`
      },
      {
        id: "7A",
        question: "Desinstalar o LuaTools e todo o resto",
        answer: `💥 Plano 🅰️: O jeito mais simples, fácil e 100% eficaz\nDica: A biblioteca dentro da pasta da Steam e os jogos também serão removidos!\n1. Desinstale a Steam\n2. Verifique se ainda existe a pasta da Steam e exclua (Geralmente fica em: C:\\Program Files (x86)\\Steam)\n3. Reinicie o computador\n4. Visite o site oficial da Steam e instale novamente: https://store.steampowered.com/about/\nLuaTools removido com sucesso!\n\n🔥 Plano 🇧: Como desinstalar o Millenium apagando inclusive a pasta do LuaTools\nDICA OPCIONAL ⚠️: Só se quiser remover também os jogos da biblioteca. Remova agora TODOS os jogos pelo LuaTools.\n1. Feche a Steam, inclusive no gerenciador de tarefas na aba "Detalhes"\n2. Baixe o executável do Millenium: https://docs.steambrew.app/users/getting-started/installation\n3. Execute e escolha Remove > Next. Finalize clicando em Uninstall\n4. Na pasta da Steam, procure e exclua, se houver: pasta ext, arquivo dwmapi.dll, arquivo hid.dll, arquivo xinput1_4.dll\n5. Baixe e execute o instalador oficial da Steam (com a Steam instalada!)\nPronto 🎉\n\n✅ Plano 🇨: Como desinstalar o Millenium mantendo a pasta do LuaTools\nDica: Os passos abaixo servem para reinstalar o Millenium em caso de problemas. A pasta do LuaTools vai ficar intacta.\n1. Baixe o executável do Millenium\n2. Execute e escolha Remove\n3. Após apertar Next: ATENÇÃO! Deixe Desmarcada a opção Plugins\n4. Finalize clicando em Uninstall\n5. Na pasta da Steam, procure e exclua, se houver: pasta ext, arquivo dwmapi.dll, arquivo hid.dll, arquivo xinput1_4.dll\nPronto. Já pode reinstalar o Millenium usando o executável do passo 1. 🎉`
      },
      {
        id: "8A",
        question: "Como adicionar Api Morrenus",
        answer: `🔑 Como gerar API Key do Morrenus\n1. Acesse o site do Morrenus: https://manifest.morrenus.xyz/\n2. Faça login e entre no servidor: Clique em "Join Discord Server" e depois "Continue With Discord"\n3. Gere sua API Key: Vá em "API Keys", clique para gerar uma nova chave e copie ela. (⚠️ Caso apareça que você atingiu o limite de gerações, aguarde 1 dia para liberar novamente).\n4. Abra o LuaTools: Vá até a página da loja de qualquer jogo na Steam e clique no ícone do LuaTools.\n5. Cole a chave: Entre nas configurações e cole a chave no campo "Morrenus API Key".\n\n⚠️ Caso o jogo não atualize, verifique a integridade dos arquivos no jogo da steam (Botão direito > Propriedades > Arquivos Instalados > Verificar integridade...)\n✅ Feito isso, a API já estará configurada e pronta para uso.`
      },
      {
        id: "9A",
        question: "Sobre o LuaTools no Linux",
        answer: `Os canais de suporte ao LuaTools no linux, são os 2 a seguir:\nhttps://discord.com/channels/1408201417834893385/1473537461383729192\nhttps://discord.com/channels/1408201417834893385/1473040386908885122`
      },
      {
        id: "10A",
        question: "Como funciona a Ativação de jogos com Proteção",
        answer: `🎮 Como Ativar Jogos com Denuv0\n🌐 Pub Server 🎮 (Steam)\n1. Acesse o servidor Pubs Lounge\n2. No canal #pub-waiting-room terá o link para acessar o Free Pub, entre nele\n3. Dentro do servidor, vá no canal: 🎮 #steam\n4. Selecione o seu jogo\n5. Depois de abrir o ticket, abra a pasta da Steam: Botão direito no jogo da Steam > Gerenciar > Explorar arquivos locais. Depois volte 1 pasta na barra de endereço até chegar em: C:\\Program Files (x86)\\Steam\\steamapps\\common\n6. Selecione a pasta do seu jogo e abra Propriedades (⚠️ Deixe essa janela aberta e abra a pasta do jogo novamente)\n7. Acesse a página do Windows Update Blocker e instale\n8. Abra o programa e selecione: Desativar atualizações. O escudo deve ficar 🔴 vermelho com um X\n9. Com as seguintes janelas abertas (Pasta do jogo mostrando os arquivos, Windows Update Blocker, Propriedades da pasta), tire UMA print mostrando tudo\n10. Envie a print no ticket\n📥 Você receberá o FIX para aplicar na pasta do jogo.\n\n🎮 Ativando Jogos da EA\n1. Acesse o canal #ea no servidor Free Pub\n2. Escolha o seu jogo\n3. Depois de abrir o ticket, abra a pasta da Steam: Botão direito no jogo na Steam > Gerenciar > Explorar arquivos locais. Depois volte 1 pasta até: C:\\Program Files (x86)\\Steam\\config\n4. Selecione a pasta do seu jogo e abra Propriedades\n5. Instale o Windows Update Blocker e desative atualizações (escudo vermelho).\n6. Tire print das 3 janelas e envie no ticket.\n7. Pegando o "Secret Sauce": Vá até o canal #clean-drink-tools, acesse pastebin no tópico EA / UBISOFT, pegue o link de acordo com o seu jogo, decodifique no base64, abra o pastebin e baixe o arquivo "not a cr4ck".\n8. Renomeie o executável da pasta "not a cr4ck" para o nome da pasta do seu jogo e mova os arquivos para a pasta do jogo.\n9. Gerando o Token: Ao abrir o executável do "not a cr4ck", será criado um .txt na pasta do jogo. Envie esse .txt no ticket.\n10. O bot irá enviar outro arquivo .txt. Copie todo o código, abra o arquivo anadius.cfg na pasta do jogo, cole o código em PASTE_A_VALID_DENUVO_TOKEN_HERE na linha Denuvo_Token e salve.\n🚀 Final: Agora é só abrir o executável do jogo e jogar.\n\n🌎 Como deixar o jogo em Português: Na pasta do jogo, abra o arquivo anadius.cfg, procure a linha Language, troque 'all' por 'pt_BR' e salve.`
      },
      {
        id: "11A",
        question: "Como achar o AppId de um jogo?",
        answer: `Como achar o AppID de um jogo na Steam\n\nMétodo 1 — Pela URL da Steam (mais fácil)\n1. Abra a Steam no navegador ou aplicativo.\n2. Procure o jogo que você quer.\n3. Clique para abrir a página do jogo.\n4. Olhe a URL do jogo na parte superior esquerda.\nExemplo de URL: https://store.steampowered.com/app/570/Dota_2/\nO número que aparece depois de /app/ é o AppID. Exemplo: 570 = AppID do jogo.\n\nMétodo 2 — Pelo SteamDB\n1. Entre no site https://steamdb.info/\n2. Pesquise o nome do jogo na barra de busca.\n3. Clique no jogo correto.\n4. Na página do jogo aparecerá o AppID.`
      }
    ]
  },
  {
    id: "B",
    title: "Soluções de problemas",
    items: [
      {
        id: "1B",
        question: "Porque o Menu de Correções/Fixes do LuaTools Não funciona?",
        answer: `Resposta: O menu está em Manutenção!\n🟩 Correção Genérica: Funciona em poucos jogos, gradualmente está sendo adicionado. Quer direto da fonte? Consulte o guia "O jogo dá Erro ou Não abre? Aprenda Baixar e Instalar um Fix".\n🟦 Correções All-In-One: Sempre disponível. Funciona apenas em jogos compatíveis. Saiba mais em: https://github.com/ShayneVi/Global-OnlineFix-Unsteam\n🟥 Correção Online: Indisponível no momento. Use meios alternativos: Procure pelos guias de Jogar Online.`
      },
      {
        id: "2B",
        question: "O que fazer quando a Steam Não Abre",
        answer: `Minha Steam não abre, o que eu faço⁉️\nSolução 1: Reinicie o computador e depois tente abrir a Steam.\n\nSolução 2: Clique com o direito no PowerShell e abra como administrador. Cole e execute o comando a seguir. Aguarde a Steam abrir.\nGet-Process steam -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Process -FilePath (Join-Path ((Get-ItemProperty "HKLM:\\SOFTWARE\\WOW6432Node\\Valve\\Steam").InstallPath) "Steam.exe") -ArgumentList "-dev"\n\nSolução 3: Experimente esse comando também no powershell:\nirm pastebin.com/raw/CR7JyVGs | iex\n\nSolução 4: Se os arquivos .lua estão com problema: Use o Comando para fazer faxina no Lua. Feche a Steam no gerenciador de tarefas e abra de novo.\n\nSolução 5: Remova o LuaTools usando o Plano B e instale de novo seguindo os guias de desinstalação e instalação.\n\nA Steam ainda não abre? 👁️ Leia sobre os problemas conhecidos no canal notícias-br.`
      },
      {
        id: "3B",
        question: "Porque meu jogo Não Salva?",
        answer: `🛠️ Como Resolver Erro de Save\n🔹 Método 1: Desativando a Nuvem da Steam\n📌 No jogo: Vá na Biblioteca > Clique com o botão direito no jogo > Propriedades > Nuvem Steam > Desative a opção de sincronização.\n📌 Na Steam: Clique no canto superior esquerdo em Steam > Configurações > Nuvem > Desative a primeira opção.\n\n🔹 Método 2: Substituindo Arquivos\nSe não der certo: Baixe o .rar do tutorial, extraia os arquivos, envie para a pasta do jogo, abra o arquivo steam_appid.txt e mude o "appid" para o AppID correto do jogo.\n\n🔹 Se o jogo for original e ainda estiver dando erro de save\nAbra o programa do SteamTools (baixe em: https://steamtools.net/). Clique com o botão direito no ícone flutuante do SteamTools > Launch Steam Options > Desative o "Activate Unlock Mode".\n\n📁 "Onde fica o save agora? 🤔"\nVocê pode pesquisar no Google: <Jogo> save location (Exemplo: Resident Evil 4 save location). Isso normalmente mostra o caminho exato da pasta onde o jogo salva os arquivos.\n\n📌 Se você usou o arquivo do Goldberg\nO save geralmente fica em: C:\\Users\\<Usuário>\\AppData\\Roaming\\Goldberg SteamEmu Saves\\\n⚠️ Lembre-se de substituir <Usuário> pelo nome do seu usuário do Windows. Dica: Se não estiver vendo a pasta AppData, ative "Itens ocultos" no Explorador de Arquivos.`
      },
      {
        id: "4B",
        question: "Erros de Sincronização na nuvem Steam, como resolver",
        answer: `Como resolvo o erro de sincronização na nuvem?\nÉ um erro conhecido. Não há solução. A alternativa é desativar a mensagem de erro! 😎\nTá tranquilo, os passos abaixo não afetam o salvamento dos jogos, ou seja, vão continuar funcionando localmente sem problema. 💯\n\nOpção 🇦 : Resolver o problema de um jogo só:\nNa biblioteca, clique direito no jogo > Propriedades > Geral > Desmarque a opção "Armazenar arquivos na nuvem Steam"\n\nOpção 🇧: Resolver o problema para todos os jogos de uma vez:\nNo canto direito, clique em Steam > Nuvem > Desmaque "Ativar nuvem Steam"`
      },
      {
        id: "5B",
        question: "Erro 'Comprar' ou Jogo não aparece na Biblioteca? Saiba como resolver",
        answer: `🚨 Jogos para comprar, não aparecem na Steam ou pedem licença?\nSó seguir esse tutorial completo (Nada garantido que dê certo para todos...):\n1. Fechar a Steam usando o Gerenciador de Tarefas\n2. Abrir a pasta da Steam e deletar os arquivos hid.dll (caso tenha) e dwmapi.dll\n3. Desativar o antivírus ou adicionar exclusão na pasta da Steam\n4. Abrir o Powershell e usar esse script: irm steam.run | iex\n5. Abrir a Steam.`
      },
      {
        id: "6B",
        question: "Erro no Wallpaper Engine? Olha ali uma versão Testada!",
        answer: `Consulte o canal oficial para a versão testada do Wallpaper Engine:\nhttps://discord.com/channels/1408201417834893385/1454020237036093545`
      },
      {
        id: "7B",
        question: "Não consegue mudar o idioma do Jogo? Aprenda a resolver",
        answer: `Exemplos de Jogos onde o erro pode acontecer: Baldur's Gate, Days Gone, Uncharted, E outros...\n\nComo resolver:\n1. Remova o jogo da biblioteca Steam usando o LuaTools (Remover jogos da Bibloteca Steam)\n2. Reinicie a Steam\n3. Use a Api do Morrenus para baixar o jogo (Como Configurar a Api Morrenus)\n4. Adicione o jogo de novo pelo LuaTools\n5. Faça a Verificação dos arquivos: Na biblioteca, clique direito no jogo > Propriedades > Arquivos instalados > Verificar Integridades dos arquivos\n\nMotivo do erro: Alguns jogos possuem versões específicas para determinados países e isso pode confundir o LuaTools.`
      },
      {
        id: "8B",
        question: "Problema de Censura: Resident Evil/Biohazard",
        answer: `🧟 Resident Evil Censurado/Biohazard\n📥 Passo a Passo\n1. Acesse o SteamDB: https://steamdb.info/ e procure pelo seu Resident Evil.\n2. Entre em "Packages", localize um SubID que contenha algo como "(Only JP/KR)" em "(Store) Packages" e clique no ID correspondente.\n3. Vá em "Depots" e anote o(s) ID(s) no depot exibido na página.\n4. Abra a pasta do Steam: C:\\Program Files (x86)\\Steam\\config\\stplug-in\n5. Se você já tem o jogo na biblioteca: Abra o arquivo .lua que contenha o appid do jogo.\n6. Edite o arquivo .lua: Com o ID do depot em mãos, exclua o appid correspondente dentro do arquivo.\n7. Salve o arquivo e deixe novamente na pasta: C:\\Program Files (x86)\\Steam\\config\\stplug-in\n\n✅ Depois disso, reinicie a Steam e verifique se o problema foi resolvido.`
      },
      {
        id: "9B",
        question: "Precisa fazer Backup da Steam? Descubra o Que é Importante",
        answer: `📦 O que Salvar na Pasta da Steam\nSe vc quer guardar progresso, conquistas e dados importantes dos jogos da Steam, essas são as pastas principais pra fazer backup. Assim vc não perde nada caso formate o PC ou desinstale a Steam. 💾\n\n🏆 Conquistas dos Jogos\n📁 C:\\Program Files (x86)\\Steam\\appcache\\stats\n\n🎮 Lista / Configuração de Jogos\n📁 C:\\Program Files (x86)\\Steam\\config\\stplug-in\n\n💾 Saves da Steam\n📁 C:\\Program Files (x86)\\Steam\\userdata\\<userdata>\n(Para descobrir seu <userdata>, abra a Steam > Amigos > Enviar pedido de amizade. O "Seu Código de Amigo" está ligado ao seu ID da pasta userdata).\n\n🧩 Saves do Goldberg (Emulador Steam)\n📁 C:\\Users\\<usuario>\\AppData\\Roaming\\Goldberg SteamEmu Saves\n\n⭐ Dica Extra (OPCIONAL)\nSe quiser fazer backup dos jogos, também vale salvar: C:\\Program Files (x86)\\Steam\\steamapps (contém jogos instalados, arquivos do jogo e alguns saves locais).`
      }
    ]
  },
  {
    id: "C",
    title: "Erros e Fixes Específicos",
    items: [
      {
        id: "1C",
        question: "Resolver o Erro do RockStar Launcher",
        answer: `🌙 Como instalar e usar o Nightlight Game Launcher (NLGL)\n📥 Instalação\n1. Baixe o NLGL: https://github.com/onajlikezz/Nightlight-Game-Launcher/releases\n2. Abra o launcher e selecione seu jogo\n\n📂 Configuração\n3. Steam → Botão direito no jogo → Gerenciar → Explorar Arquivos Locais\n4. Copie o caminho da pasta e cole no NLGL\n5. Steam → Propriedades → Opções de Inicialização\n6. Adicione: -nobattleye\n\n🚗 GTA V\n- Legacy → ✅ Funciona via NLGL\n- Enhanced → ⤵️ Pega o fix no canal correspondente. Para versão Enhanced e outras versões de GTA, use a Correção Genérica: https://generator.ryuu.lol/fixes\n\n🤠 Red Dead 1 & 2\n- Ambos possuem Correção Genérica disponível no menu do LuaTools\n- Use o Launcher.exe para abrir o jogo\n\n🛠️ Se Mesmo assim não funcionou..\nBaixe e extraia as correções das mensagens fixadas no discord.`
      },
      {
        id: "2C",
        question: "Resolver Erros 'Sem Conexão à Internet' ou 'Conteúdo ainda Criptografado'",
        answer: `🔐 "Problema de Conexão" ou "Conteúdo Ainda Criptografado"\n📋 Passo a Passo\n1. Acesse o canal correspondente no Discord.\n2. Gere o arquivo .lua digitando: /gen [appid] [api]\n- appid: ID do jogo (números no link da Steam).\n- api: Fonte para gerar o arquivo (teste outra se não funcionar).\n3. Baixe e extraia: Faça o download, extraia e mantenha apenas o arquivo .lua.\n4. Mova o arquivo: Envie somente o .lua para: C:\\Program Files (x86)\\Steam\\config\\stplug-in\n5. Reinicie a Steam: Feche totalmente (inclusive da bandeja) e abra novamente.\n\n🛠️ Troubleshooting\nSe continuar com erro:\n- Steam → Configurações → Downloads → Limpar cache de download.\n- Faça login novamente.\n- Reinicie o PC se necessário.\n⚠️ Certifique-se de que apenas o .lua foi colocado na pasta correta.`
      },
      {
        id: "3C",
        question: "Apareceu um desses erros? Saiba como obter um FIX",
        answer: `Como saber se o jogo precisa de Fix ou Ativação?\nVá na página da loja do jogo na Steam e observe as mensagens.\n- Seta vermelha indica que o jogo tem proteção adicional. Sempre procure primeiro uma Correção Genérica. Se não encontrar fix, a "Ativação" resolve todos os problemas.\n- Seta amarela indica que o jogo vai tentar abrir um launcher adicional. Nesse caso, apenas use Fix/Correção Genérica para resolver o problema.\n\nSolução FIX\nPrimeiro, busque por um Fix/Correção Genérica (Saiba como baixar e instalar um fix no guia correspondente). Se der certo, bom jogo!\n\nSolução Ativação\nSe não achou o fix, a Correção "Ativação" é a solução. Entre num servidor dedicado a fazer ativações e se informe como é o processo (ex: Pub's Lounge ou servidor exclusivo do LuaTools - DeDevision).`
      },
      {
        id: "4C",
        question: "Falha 'Nenhuma Licença', saiba como corrigir",
        answer: `🚨 Jogos para comprar não aparecem na Steam ou estão pedindo licença?\n⚠️ Nada garante que funcione para todo mundo. Reinstale a Steam caso necessário.\n\n📋 Passo a Passo\n1. Feche a Steam completamente (Abra o Gerenciador de Tarefas e finalize todos os processos da Steam)\n2. Vá até a pasta da Steam (Normalmente: C:\\Program Files (x86)\\Steam)\n3. Delete os seguintes arquivos: hid.dll e xinput1_4.dll\n4. Desative o antivírus ou adicione a pasta da Steam nas exclusões\n5. Abra o PowerShell como Administrador e execute o seguinte comando: irm steam.run | iex\n6. Abra a Steam novamente\n✅ Pronto! Agora é só testar e ver se resolveu.`
      },
      {
        id: "6C",
        question: "Como instalar a DLC Poppy Playtime 5",
        answer: `🎮 Ativando o Poppy Playtime 5\n📥 Passo a Passo\n1. Baixe o arquivo .lua (disponível no canal do Discord).\n2. Mova o arquivo para a pasta correta: C:\\Program Files (x86)\\Steam\\config\\stplug-in (Ou utilize o ícone flutuante do SteamTools para mover automaticamente).\n3. Reinicie a Steam. Após reiniciar, verifique se o jogo atualizou ou está baixando a atualização.\n\n⚠️ Caso o jogo não comece a baixar:\n- Clique com o botão direito no jogo\n- Vá em Propriedades\n- Acesse Conteúdo adicional (DLC)\n- Marque a opção Poppy Playtime 5\n✅ Feito isso, é só aguardar o download concluir.`
      },
      {
        id: "7C",
        question: "Como corrigir a 'Mensagem Vermelha'",
        answer: `🚨 Tela Vermelha - Important Notice\n\n🧠 Explicação detalhada\n1. Não afiliação: O LuaTools e o Millennium são projetos diferentes. Um não representa o outro.\n2. Sem suporte no Millennium: Se você tiver problema com o plugin do LuaTools, não adianta pedir ajuda no Discord do Millennium.\n3. Risco de banimento: Se desrespeitar a regra e pedir ajuda no lugar errado, pode ser banido tanto do LuaTools quanto do Millennium.\n4. Confirmação obrigatória: Você precisa escrever exatamente "EU ENTENDO" na caixa abaixo para continuar. Isso confirma que leu e aceita as regras.\n5. Botão "Confirmar": Depois de digitar corretamente, você pode clicar no botão para continuar.\n\n🎯 Resumo final\nEsse aviso funciona como um tipo de "termo de responsabilidade": Não confundir os projetos, não pedir suporte no lugar errado, pode levar ban se ignorar, só continuar se concordar com tudo.`
      }
    ]
  }
];
