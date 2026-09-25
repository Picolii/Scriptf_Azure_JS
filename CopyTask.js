// @ts-check

(() => {
  const BUTTON_CLASS = 'btn-copiar-task';

  let timeoutInstalacao = 0;

  function iniciar() {
    agendarInstalacao();

    const observer = new MutationObserver(() => {
      agendarInstalacao();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function agendarInstalacao() {
    window.clearTimeout(timeoutInstalacao);

    timeoutInstalacao = window.setTimeout(() => {
      adicionarBotao();
    }, 100);
  }

  function adicionarBotao() {
    const dialog = document.querySelector('[role="dialog"]');

    if (!dialog) return;

    const title = dialog.querySelector('[placeholder="Enter title"]');
    const menubar = dialog.querySelector(
      '[role="menubar"] .work-item-header-command-bar',
    );

    if (!(title instanceof HTMLInputElement) || !menubar) return;

    if (menubar.querySelector(`.${BUTTON_CLASS}`)) return;

    const button = document.createElement('button');

    button.className = [
      'bolt-header-command-item-button',
      'bolt-button',
      'bolt-icon-button',
      'enabled',
      'primary',
      'bolt-focus-treatment',
      BUTTON_CLASS,
    ].join(' ');

    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', 'Copiar task');

    button.innerHTML = `
      <span class="fluent-icons-enabled">
        <span
          aria-hidden="true"
          class="left-icon flex-noshrink fabric-icon ms-Icon--Copy medium"
        ></span>
      </span>
      <span class="bolt-button-text body-m">Copiar task</span>
    `;

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const titulo = title.value.trim();
      const tags = obterTags(dialog);

      if (tags.length === 0) {
        alert(
          '⚠ Erro ao obter tags!\n\n' +
            'Verifique se a tarefa possui tags.\n' +
            '❌ O commit não foi copiado!',
        );

        return;
      }

      const numero = obterNumeroWorkItem();

      if (!numero) {
        alert('❌ Não foi possível identificar o número do work item.');
        return;
      }

      const tipo = obterTipoAzure(titulo, dialog);
      const tagsSanitizadas = tags
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((tag) => sanitizar(tag))
        .join(', ');

      const commit =
        `${tipo}(${tagsSanitizadas}): ` +
        `${sanitizar(titulo)}\n\n#${numero}`;

      try {
        await copiar(commit);
        alert(`Copiado!\n\n${commit}`);
      } catch (error) {
        console.error('Erro ao copiar work item:', error);
        alert('❌ O navegador bloqueou a área de transferência.');
      }
    });

    menubar.prepend(button);
  }

  function obterTipoAzure(titulo, dialog) {
    if (ehPublicar(dialog)) return 'build';

    const tipoElemento = dialog.querySelector(
      '.work-item-type-icon',
    )?.parentElement;

    const ariaLabel = tipoElemento?.getAttribute('aria-label')?.toLowerCase();

    if (ariaLabel) {
      if (ariaLabel.includes('bug') || ariaLabel.includes('hotfix')) {
        return 'fix';
      }

      if (ariaLabel.includes('task') || ariaLabel.includes('user story')) {
        return 'feat';
      }
    }

    const linkTexto = dialog
      .querySelector('a.bolt-link')
      ?.textContent?.toLowerCase();

    if (linkTexto) {
      if (linkTexto.includes('bug') || linkTexto.includes('hotfix')) return 'fix';
      if (linkTexto.includes('task')) return 'feat';
    }

    const tituloLower = titulo.toLowerCase();

    if (
      tituloLower.includes('fix') ||
      tituloLower.includes('hotfix') ||
      tituloLower.includes('bug')
    ) {
      return 'fix';
    }

    return 'feat';
  }

  function ehPublicar(dialog) {
    return Array.from(dialog.querySelectorAll('.artifact-link-link'))
      .map((elemento) => elemento.textContent || '')
      .some((texto) => texto.toLowerCase().includes('publicar'));
  }

  function obterTags(dialog) {
    const elemento = dialog.querySelector('.work-item-tag-picker');

    if (!elemento) return [];

    return (elemento.textContent || '')
      .split('\n')
      .map((tag) => tag.trim())
      .filter((tag) => tag && !/^(add tag|adicionar tag)$/i.test(tag));
  }

  function obterNumeroWorkItem() {
    const url = new URL(location.href);
    const numeroQuery = url.searchParams.get('workitem');

    if (numeroQuery) return numeroQuery;

    return url.pathname.match(/\/_workitems\/edit\/(\d+)/i)?.[1] || null;
  }

  async function copiar(valor) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(valor);
        return;
      } catch (error) {
        console.warn('Clipboard API falhou. Usando alternativa.', error);
      }
    }

    const textarea = document.createElement('textarea');

    textarea.value = valor;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copiado = document.execCommand('copy');

    textarea.remove();

    if (!copiado) {
      throw new Error('Não foi possível copiar o texto.');
    }
  }

  function sanitizar(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
