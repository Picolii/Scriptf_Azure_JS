# Copy Task for Azure DevOps

Extensão Manifest V3 para Microsoft Edge e Google Chrome que formata e copia work items do Azure DevOps como mensagens de commit.

[Política de privacidade](PRIVACY.md)

## Recursos

- **Copiar task no Work Item:** gera uma mensagem de commit a partir do título, tipo, tags e número do item.
- **Copiar Work Item no Pull Request:** adiciona um botão de cópia aos itens vinculados a um PR.

O recurso é carregado automaticamente em `https://dev.azure.com/*` e `https://*.visualstudio.com/*`. Não há popup nem execução manual.

## Instalar no Microsoft Edge

1. Abra `edge://extensions`.
2. Ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta raiz deste repositório, a mesma que contém `manifest.json`.
5. Abra ou atualize uma página do Azure DevOps.

## Instalar no Google Chrome

1. Abra `chrome://extensions`.
2. Ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta raiz deste repositório.

## Atualizar durante o desenvolvimento

Depois de alterar algum arquivo, abra a página de extensões, clique em **Recarregar** no cartão da extensão e atualize a página do Azure DevOps.

## Arquivos

```text
Scripty_Azure_JS/
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── store-assets/
│   ├── logo-300.png
│   └── logo-source-1024.png
├── manifest.json
├── CopyTask.js
├── PR_WorkItem_CopyTask.js
├── PRIVACY.md
└── README.md
```

## Capturas de tela

### Copiar task no Work Item

<img width="869" height="202" alt="Botão para copiar uma task no Work Item" src="https://github.com/user-attachments/assets/83e53e68-22d0-431c-b073-e9ea983aac29" />

<img width="815" height="262" alt="Mensagem de commit copiada" src="https://github.com/user-attachments/assets/1de2141a-57f8-4e77-bc37-31af439d6f00" />

### Copiar Work Item no Pull Request

<img width="389" height="316" alt="Botão para copiar Work Item no Pull Request" src="https://github.com/user-attachments/assets/2d9a20a1-7ccf-450c-81a9-9adad6250e78" />
