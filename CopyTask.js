// @ts-check
setTimeout(() => {
  locator('[role="dialog"] [placeholder="Enter title"]', ({ _, founded }) => {
    if (!founded) return;

    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;

    const title = dialog.querySelector('[placeholder="Enter title"]');
    const menubar = dialog.querySelector('[role="menubar"] .work-item-header-command-bar');

    if (!title || !menubar) return;

    // evita duplicar botão
    if (menubar.querySelector('.btn-copiar-task')) return;

    // 🔥 botão estilo Azure (igual ao nativo)
    const button = document.createElement('button');
    button.className = 'bolt-header-command-item-button bolt-button bolt-icon-button enabled primary bolt-focus-treatment btn-copiar-task';

    button.setAttribute('type', 'button');
    button.setAttribute('role', 'menuitem');
    button.setAttribute('tabindex', '0');

    button.innerHTML = `
      <span class="fluent-icons-enabled">
        <span aria-hidden="true" class="left-icon flex-noshrink fabric-icon ms-Icon--Copy medium"></span>
      </span>
      <span class="bolt-button-text body-m">Copiar task</span>
    `;

    menubar.prepend(button);

    button.onclick = () => {
      const titulo = title.value;
      const tipo = obterTipoAzure(titulo);
      const tags = obterTags();

      if (tags.length === 0) {
        alert('⚠ Erro ao obter tags! Verifique se a tarefa possui tags. ❌ O commit não foi copiado!');
        return;
      }

      const numero = new URL(location.href).searchParams.get('workitem');

      const commit = tipo + '(' + sanitizar(tags.sort().join(', ')) + '): ' + sanitizar(titulo) + '\n\n#' + numero;

      copiar(commit);
      alert(`Copiado! (${commit})`);
    };
  });
}, 5000);

// 🔥 DETECÇÃO PELO AZURE
function obterTipoAzure(titulo) {
  if (ehPublicar()) return 'build';

  const tipoElemento = document.querySelector('[role="dialog"] .work-item-type-icon')?.parentElement;

  const ariaLabel = tipoElemento?.getAttribute('aria-label')?.toLowerCase();

  if (ariaLabel) {
    if (ariaLabel.includes('bug') || ariaLabel.includes('hotfix')) return 'fix';
    if (ariaLabel.includes('task') || ariaLabel.includes('user story')) return 'feat';
  }

  const linkTexto = document.querySelector('[role="dialog"] a.bolt-link')?.innerText?.toLowerCase();

  if (linkTexto) {
    if (linkTexto.includes('bug') || linkTexto.includes('hotfix')) return 'fix';
    if (linkTexto.includes('task')) return 'feat';
  }

  const tituloLower = (titulo || '').toLowerCase();

  if (tituloLower.includes('fix') || tituloLower.includes('hotfix') || tituloLower.includes('bug')) return 'fix';

  return 'feat';
}

function ehPublicar() {
  return Array.from(document.querySelectorAll('.artifact-link-link'))
    .map(p => p.innerText)
    .some(p => p.includes('Publicar'));
}

function obterTags() {
  const el = document.querySelector('.work-item-tag-picker');
  if (!el) return [];

  return el.innerText.split('\n').filter(p => p && !p.includes('Add Tag'));
}

function copiar(valor) {
  navigator.clipboard.writeText(valor);
}

function sanitizar(valor) {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function locator(selector, callback) {
  if (typeof selector !== 'string' || typeof callback !== 'function') {
    console.warn('locator: parâmetros inválidos');
    return;
  }

  let lastElement = null;

  function check() {
    const element = document.querySelector(selector);

    if (element && lastElement !== element) {
      lastElement = element;
      callback({ element, founded: true });
    }

    if (!element && lastElement) {
      callback({ element: lastElement, founded: false });
      lastElement = null;
    }
  }

  const observer = new MutationObserver(() => check());

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  check();
}
