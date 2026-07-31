// @ts-check

(() => {
  const ID = 'checklist-publicacao-flutuante';
  const BUTTON_CLASS = 'btn-checklist-publicacao';
  const STORAGE_KEY = 'checklist-publicacao-safe';

  const servicos = ['FrontEnd', 'BackEnd', 'ServicoTecnico', 'Signal', 'Correios', 'GatewayRisco', 'KitePlatformReader', 'BackgroundTasks', 'RadiusReader', 'Webservice'];

  document.getElementById(ID)?.remove();
  document.querySelector(`.${BUTTON_CLASS}`)?.remove();

  let estado = {};

  try {
    estado = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    estado = {};
  }

  function salvarEstado() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  function obterOuCriarChecklist() {
    const checklistExistente = document.getElementById(ID);

    if (checklistExistente) {
      return checklistExistente;
    }

    const container = document.createElement('div');

    container.id = ID;
    container.style.display = 'none';

    container.innerHTML = `
      <style>
        #${ID} {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 390px;
          z-index: 2147483647;
          color: #f9fafb;
          background: #1f2937;
          border: 1px solid #4b5563;
          border-radius: 12px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.45);
          font-family: Arial, sans-serif;
          font-size: 14px;
          overflow: hidden;
        }

        #${ID} * {
          box-sizing: border-box;
        }

        #${ID} .cabecalho {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #111827;
          cursor: move;
          user-select: none;
          touch-action: none;
        }

        #${ID} .titulo {
          font-weight: bold;
        }

        #${ID} .acoes {
          display: flex;
          gap: 6px;
        }

        #${ID} button {
          padding: 4px 8px;
          color: #f9fafb;
          background: #374151;
          border: 0;
          border-radius: 5px;
          cursor: pointer;
        }

        #${ID} button:hover {
          background: #4b5563;
        }

        #${ID} .conteudo {
          max-height: 430px;
          padding: 10px;
          overflow-y: auto;
        }

        #${ID} .linha {
          display: grid;
          grid-template-columns: 1fr 55px 55px;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 5px 7px;
          border-bottom: 1px solid #374151;
        }

        #${ID} .linha-cabecalho {
          color: #9ca3af;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        #${ID} .ambiente {
          text-align: center;
        }

        #${ID} input[type="checkbox"] {
          width: 17px;
          height: 17px;
          margin: 0;
          accent-color: #22c55e;
          cursor: pointer;
        }

        #${ID} .rodape {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          color: #9ca3af;
          background: #111827;
          font-size: 11px;
        }
      </style>

      <div class="cabecalho">
        <span class="titulo">
          🚀 Serviços a publicar
        </span>

        <div class="acoes">
          <button
            type="button"
            class="minimizar"
            title="Minimizar"
          >
            —
          </button>

          <button
            type="button"
            class="fechar"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="conteudo">
        <div class="linha linha-cabecalho">
          <span>Serviço</span>
          <span class="ambiente">Homo</span>
          <span class="ambiente">Prod</span>
        </div>

        ${servicos
          .map(
            (servico, indice) => `
          <div class="linha">
            <span>${servico}</span>

            <span class="ambiente">
              <input
                type="checkbox"
                data-servico="${indice}"
                data-ambiente="homo"
                ${estado[servico]?.homo ? 'checked' : ''}
              >
            </span>

            <span class="ambiente">
              <input
                type="checkbox"
                data-servico="${indice}"
                data-ambiente="prod"
                ${estado[servico]?.prod ? 'checked' : ''}
              >
            </span>
          </div>
        `,
          )
          .join('')}
      </div>

      <div class="rodape">
        <button type="button" class="limpar">
          Limpar checklist
        </button>

        <span>
          As marcações duram enquanto a aba estiver aberta.
        </span>
      </div>
    `;

    document.body.appendChild(container);

    configurarEventosChecklist(container);

    return container;
  }

  function configurarEventosChecklist(container) {
    const conteudo = container.querySelector('.conteudo');
    const rodape = container.querySelector('.rodape');
    const cabecalho = container.querySelector('.cabecalho');
    const minimizar = container.querySelector('.minimizar');
    const fechar = container.querySelector('.fechar');
    const limpar = container.querySelector('.limpar');

    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', event => {
        const input = event.currentTarget;

        const indice = Number(input.dataset.servico);
        const ambiente = input.dataset.ambiente;
        const servico = servicos[indice];

        if (!ambiente || !servico) return;

        estado[servico] ??= {
          homo: false,
          prod: false,
        };

        estado[servico][ambiente] = input.checked;

        salvarEstado();
      });
    });

    limpar?.addEventListener('click', () => {
      estado = {};

      sessionStorage.removeItem(STORAGE_KEY);

      container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });
    });

    minimizar?.addEventListener('click', event => {
      const minimizado = conteudo.style.display === 'none';

      conteudo.style.display = minimizado ? '' : 'none';
      rodape.style.display = minimizado ? '' : 'none';

      event.currentTarget.textContent = minimizado ? '—' : '+';
    });

    fechar?.addEventListener('click', () => {
      container.style.display = 'none';
    });

    configurarArraste(container, cabecalho);
  }

  function configurarArraste(container, cabecalho) {
    let arrastando = false;
    let distanciaX = 0;
    let distanciaY = 0;

    cabecalho.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;

      const posicao = container.getBoundingClientRect();

      container.style.left = `${posicao.left}px`;
      container.style.top = `${posicao.top}px`;
      container.style.right = 'auto';
      container.style.bottom = 'auto';

      distanciaX = event.clientX - posicao.left;
      distanciaY = event.clientY - posicao.top;

      arrastando = true;

      cabecalho.setPointerCapture(event.pointerId);
    });

    cabecalho.addEventListener('pointermove', event => {
      if (!arrastando) return;

      const limiteX = window.innerWidth - container.offsetWidth;

      const limiteY = window.innerHeight - container.offsetHeight;

      const x = Math.max(0, Math.min(event.clientX - distanciaX, limiteX));

      const y = Math.max(0, Math.min(event.clientY - distanciaY, limiteY));

      container.style.left = `${x}px`;
      container.style.top = `${y}px`;
    });

    const finalizarArraste = () => {
      arrastando = false;
    };

    cabecalho.addEventListener('pointerup', finalizarArraste);

    cabecalho.addEventListener('pointercancel', finalizarArraste);
  }

  function alternarChecklist() {
    const container = obterOuCriarChecklist();
    const estaAberto = container.style.display !== 'none';

    container.style.display = estaAberto ? 'none' : 'block';
  }

  /**
   * Sobe na árvore do DOM até encontrar o elemento
   * que é filho direto da barra de comandos.
   *
   * Isso garante que Save + Chevron sejam tratados
   * como um único grupo.
   */
  function obterGrupoDoComando(menubar, elemento) {
    let grupo = elemento;

    while (grupo.parentElement && grupo.parentElement !== menubar) {
      grupo = grupo.parentElement;
    }

    return grupo;
  }

  function adicionarBotaoChecklist() {
    const dialog = document.querySelector('[role="dialog"]');

    if (!dialog) return;

    const menubar = dialog.querySelector('[role="menubar"] .work-item-header-command-bar');

    if (!menubar) return;

    if (menubar.querySelector(`.${BUTTON_CLASS}`)) {
      return;
    }

    const button = document.createElement('button');

    button.className = ['bolt-header-command-item-button', 'bolt-button', 'bolt-icon-button', 'enabled', 'primary', 'bolt-focus-treatment', BUTTON_CLASS].join(' ');

    button.setAttribute('type', 'button');
    button.setAttribute('role', 'menuitem');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', 'Abrir checklist de publicação');

    button.innerHTML = `
      <span class="fluent-icons-enabled">
        <span
          aria-hidden="true"
          class="left-icon flex-noshrink fabric-icon ms-Icon--CheckList medium"
        ></span>
      </span>

      <span class="bolt-button-text body-m">
        Checklist
      </span>
    `;

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      alternarChecklist();
    });

    const botoesMenu = Array.from(menubar.querySelectorAll('button'));

    const botaoSave = botoesMenu.find(botao => {
      const texto = (botao.innerText || botao.textContent || '').trim();

      return /^(save|salvar)\b/i.test(texto);
    });

    if (botaoSave) {
      /*
       * O Save e o Chevron ficam dentro de um mesmo
       * contêiner. Aqui encontramos esse contêiner
       * e inserimos o Checklist depois dele.
       */
      const grupoSave = obterGrupoDoComando(menubar, botaoSave);

      grupoSave.insertAdjacentElement('afterend', button);
    } else {
      menubar.prepend(button);
    }
  }

  function locator(selector, callback) {
    if (typeof selector !== 'string' || typeof callback !== 'function') {
      console.warn('locator: parâmetros inválidos');
      return;
    }

    let lastElement = null;

    function check() {
      const element = document.querySelector(selector);

      if (element) {
        lastElement = element;

        callback({
          element,
          founded: true,
        });
      }

      if (!element && lastElement) {
        callback({
          element: lastElement,
          founded: false,
        });

        lastElement = null;
      }
    }

    const observer = new MutationObserver(() => {
      check();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    check();
  }

  setTimeout(() => {
    locator('[role="dialog"] [placeholder="Enter title"]', ({ founded }) => {
      if (!founded) {
        const container = document.getElementById(ID);

        if (container) {
          container.style.display = 'none';
        }

        return;
      }

      adicionarBotaoChecklist();
    });
  }, 5000);
})();
