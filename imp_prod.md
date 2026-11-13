1. Windows 10, 
2. não
3. somente rede local

Excelente! Ter a máquina com Windows 10 e o acesso restrito à rede local (intranet) simplifica muito a infraestrutura (não precisamos de certificados SSL públicos complexos nem de domínios na internet).

No entanto, há dois caminhos possíveis para rodar no Windows 10:

Opção 1: Via Docker Desktop (Tudo em Containers)

Você instala o Docker Desktop para Windows
 nessa máquina.


  
Vantagens: O banco MySQL, o Back-end e o Front-end sobem isolados com um único comando (docker compose up -d). Não precisa instalar Node.js nem MySQL diretamente no Windows.

  
Atenção: O Docker Desktop no Windows 10 exige a ativação do WSL2 (subsistema Linux) e costuma consumir entre 2 GB e 4 GB de memória RAM só para a máquina virtual do Docker.

  
Opção 2: Nativo no Windows (Mais leve e direto — Recomendado se o PC for modesto)

Instala-se diretamente no Windows:


  
MySQL Server 8.0 para Windows (instalador oficial leve).

  
Node.js LTS (versão 20 ou 22).

  

  
Vantagens: Consumo mínimo de memória e CPU (não precisa de VM do WSL2 nem Docker Desktop rodando em segundo plano).

  
Como roda: Geramos um script .bat ou configuramos o PM2 / serviço do Windows para iniciar o banco, o back-end e o front-end automaticamente sempre que a máquina ligar.

  
⚠️ Ajuste Importante: Autenticação via Rede Local (HTTP)

Atualmente, o seu back-end foi programado para exigir HTTPS quando configurado como AMBIENTE=production:

typescript
secure: process.env.AMBIENTE === "production"

Como o acesso na rede local será por IP comum (ex: http://192.168.1.50:3000) sem certificado SSL, os navegadores das outras máquinas do escritório rejeitariam o cookie de login se a flag secure estiver ativa.


  

Solução: Vamos adicionar a variável COOKIE_SEGURO=false no .env para que o login funcione perfeitamente via HTTP na rede local.


  
O que os outros computadores da rede precisarão para acessar:

  
IP fixo da máquina servidora:
Definir um IP estático na placa de rede do Windows 10 (exemplo: 192.168.1.100) para que o endereço não mude ao reiniciar o roteador.

  
Liberar a porta no Firewall do Windows:
Criar uma regra de entrada no Firewall do Windows 10 permitindo conexões na porta da aplicação.

  
Acesso pelos navegadores:
Qualquer computador da empresa acessará simplesmente digitando:
http://192.168.1.100:PORTA

  
Qual abordagem você prefere seguir?

  
Instalar o Docker Desktop no Windows 10 e rodar tudo em containers.

  
Instalação nativa (Node.js + MySQL instalados no Windows com script de inicialização automática).

  

Assim que você escolher, já preparo os arquivos de configuração e o roteiro exato para você executar nessa máquina!

2

Para colocar o Uniqprint em produção na sua máquina com Windows 10 para acesso em rede local, já deixei a aplicação preparada para rodar de forma unificada e super leve:

O próprio Back-end (Fastify) agora serve o Front-end compilado (React) e a API na mesma porta (3001). Com isso:


  
Você não precisa instalar Nginx nem Apache.

  
Roda apenas 1 processo Node.js (economiza memória).

  
Zero problemas de CORS e cookies (tudo roda sob o mesmo endereço).

  
Suporta HTTP em rede local (COOKIE_SEGURO=false) para que o login funcione perfeitamente nos outros computadores.

  
O que você precisa fazer na Máquina Windows 10:
1. Instalar os dois programas básicos

  
Node.js LTS (versão 20 ou 22):
  
  

  
Baixe o instalador .msi em nodejs.org
 e instale normalmente avançando pelas telas.

  

  
MySQL Server 8.0:
  
  

  
Baixe o instalador oficial MySQL Community Server
.

  
Durante a instalação, defina uma senha para o usuário root (guarde essa senha).

  
O MySQL será instalado como um Serviço do Windows, ou seja, ele já iniciará sozinho sempre que o computador ligar.

  

  
2. Criar a base de dados no MySQL

Abra o MySQL Workbench ou o MySQL Command Line Client na máquina e execute:

sql
CREATE DATABASE uniqprint_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
3. Copiar o projeto e configurar o .env

  
Copie a pasta do projeto uniqprint para a máquina Windows (por exemplo, em C:\projetos\uniqprint ou C:\uniqprint).

  
Entre na pasta backend e crie o arquivo .env (ou copie de backend/.env.producao.example):
  
env
PORTA=3001
HOST=0.0.0.0
AMBIENTE=production
COOKIE_SEGURO=false
# Coloque aqui a senha do seu MySQL que você configurou no instalador:
BANCO_DE_DADOS_URL="mysql://root:SUA_SENHA_AQUI@localhost:3306/uniqprint_db"
JWT_SEGREDO="uniqprint_jwt_segredo_super_forte_producao_2026"
COOKIE_SEGREDO="uniqprint_cookie_segredo_super_forte_producao_2026"
ORIGEM_FRONTEND="http://localhost:3001"

  

  
4. Compilar e Iniciar a Aplicação (Arquivos prontos)

Criei dois scripts automáticos na raiz do projeto:


  
compilar_sistema.bat:
  
  

  
Dê dois cliques neste arquivo. Ele vai baixar as dependências e compilar tanto o Front-end quanto o Back-end. (Você só precisa rodar este arquivo uma única vez ou quando fizer atualizações de código).

  

  
Carga inicial de usuários (Primeira vez):
  
  

  
No terminal, dentro da pasta backend, execute para criar os usuários iniciais (Admin: admin@uniqprint.com.br / admin123):
  
cmd
npx prisma db seed

  

  

  
iniciar_sistema.bat:
  
  

  
Dê dois cliques neste arquivo. Ele aplica as migrações no banco e inicia o sistema imediatamente.

  

  
5. Liberar a porta no Firewall do Windows 10

Para que os outros computadores do escritório consigam acessar o sistema, precisamos permitir a porta 3001 no Firewall do Windows.

Abra o PowerShell como Administrador nessa máquina e rode:

powershell
New-NetFirewallRule -DisplayName "Uniqprint Sistema" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
6. Descobrir o IP local da máquina

No terminal do Windows (cmd), digite:

cmd
ipconfig

Procure pelo Endereço IPv4 da conexão local (exemplo: 192.168.1.100 ou 192.168.0.50).


  

TIP


  

  Dica recomendada: Configure um IP fixo nas propriedades da placa de rede dessa máquina ou amarre o MAC Address dela no roteador da empresa para o IP nunca mudar.


  
Como os outros computadores vão usar:

Basta qualquer pessoa abrir o navegador (Chrome, Edge, etc.) em qualquer computador ou tablet conectado na mesma rede Wi-Fi/cabo e digitar:

http://192.168.1.100:3001

(Substitua 192.168.1.100 pelo IP real da sua máquina servidora).

Como iniciar o sistema automaticamente quando o Windows ligar:

  
Pressione Windows + R, digite shell:startup e dê Enter.

  
Crie um atalho do arquivo iniciar_sistema.bat dentro dessa pasta.

  
Pronto! Sempre que a máquina for ligada ou reiniciada, o Uniqprint subirá sozinho em segundo plano.

  