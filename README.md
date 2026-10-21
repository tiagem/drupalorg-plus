# Drupal.org Lightbox & Dark Mode

Extensão Chrome (Manifest V3) para drupal.org. Funciona no Dia e em qualquer browser Chromium.

## Instalar

1. Abre `chrome://extensions` no Dia.
2. Liga o **Developer mode**.
3. **Load unpacked** e escolhe esta pasta (`drupalorg-plus`).
4. Fixa o ícone na barra para chegares ao popup.

## O que faz

**Galeria**: clicar numa imagem do conteúdo (projetos, issues, comentários, outras nodes) abre-a em ecrã inteiro, com fundo escuro desfocado, o texto `alt` por baixo, setas, miniaturas e contador. Os links para ficheiros de imagem (por exemplo a tabela de anexos de uma issue) também abrem na galeria, e a mesma imagem não aparece duas vezes. As miniaturas de image styles (`/files/styles/...`) abrem no ficheiro original.

- `←` `→` navegar, `Home` `End` primeira e última, `Z` tamanho real, `Esc` sair do zoom e depois fechar.
- Clicar na imagem faz zoom 1:1 no ponto clicado, e arrastar move a imagem. Clicar fora da imagem fecha.
- Swipe no touch e no trackpad para mudar de imagem.
- Cmd/Ctrl-clique continua a abrir a imagem num separador novo.
- Avatares, ícones e logótipos ficam de fora.

**Tema**: Light, Dark ou System no popup. O modo escuro lê as folhas de estilo do próprio site e gera uma versão escura de cada cor (em OKLab), por isso cobre qualquer página do drupal.org sem regras escritas à mão. A CSS gerada fica em cache para a página seguinte já abrir escura, sem flash.

O popup tem também um interruptor para desligar a galeria.

## Ficheiros

- `src/theme.js`: tema escuro (corre em `document_start`).
- `src/lightbox.js`: galeria, isolada num Shadow DOM.
- `popup/`: definições, guardadas em `chrome.storage.sync`.
