// @ts-check

(() => {
  const CLASSE_BOTAO = 'btn-copiar-work-item-pr';
  const ATRIBUTO_INSTALADO = 'data-botao-copiar-commit';

  let timeoutInstalacao = 0;
  let timeoutTooltip = 0;
  let tooltipAtual = null;

  const SELETOR_LINK = [
    'a[href*="/_workitems/edit/"]',
    'a[href*="?workitem="]',
    'a[href*="&workitem="]',
  ].join(',');

  function iniciar() {
    if (!/\/pullrequest\/\d+/i.test(location.pathname)) {
      return;
    }

    agendarInstalacao();

    const observer = new MutationObserver(() => {
      agendarInstalacao();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('scroll', ocultarTooltip, true);

    window.addEventListener('resize', ocultarTooltip);
  }

  function agendarInstalacao() {
    window.clearTimeout(timeoutInstalacao);

    timeoutInstalacao = window.setTimeout(() => {
      instalarBotoes();
    }, 150);
  }

  function instalarBotoes() {
    const links = Array.from(document.querySelectorAll(SELETOR_LINK));

    for (const link of links) {
      if (!(link instanceof HTMLAnchorElement)) continue;

      if (link.getAttribute(ATRIBUTO_INSTALADO) === 'true') {
        continue;
      }

      const numero = obterNumeroWorkItem(link);

      if (!numero) continue;

      const botaoRemover = localizarBotaoRemover(link);

      if (!botaoRemover) continue;

      const containerItem = localizarContainerItem(link, botaoRemover);

      if (!containerItem) continue;

      const button = criarBotao(link, numero, botaoRemover, containerItem);

      containerItem.appendChild(button);

      link.setAttribute(ATRIBUTO_INSTALADO, 'true');
    }
  }

  function localizarBotaoRemover(link) {
    let elemento = link.parentElement;

    for (let nivel = 0; nivel < 8 && elemento; nivel++) {
      const botoes = Array.from(
        elemento.querySelectorAll('button, [role="button"]'),
      );

      const botaoRemover = botoes.find((botao) => {
        if (!(botao instanceof HTMLElement)) {
          return false;
        }

        if (botao.classList.contains(CLASSE_BOTAO)) {
          return false;
        }

        const descricao = [
          botao.getAttribute('aria-label'),
          botao.getAttribute('title'),
          botao.getAttribute('data-tooltip-text'),
          botao.textContent,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const possuiDescricaoRemover =
          descricao.includes('remove') ||
          descricao.includes('unlink') ||
          descricao.includes('remover') ||
          descricao.includes('desvincular');

        const possuiIconeDeRemover = Boolean(
          botao.querySelector(
            [
              '.ms-Icon--Cancel',
              '.ms-Icon--Clear',
              '.ms-Icon--ChromeClose',
              '.ms-Icon--Delete',
            ].join(','),
          ),
        );

        return possuiDescricaoRemover || possuiIconeDeRemover;
      });

      if (botaoRemover instanceof HTMLElement) {
        return botaoRemover;
      }

      elemento = elemento.parentElement;
    }

    return null;
  }

  function localizarContainerItem(link, botaoRemover) {
    let elemento = link.parentElement;

    while (elemento && elemento !== document.body) {
      if (elemento.contains(botaoRemover)) {
        return elemento;
      }

      elemento = elemento.parentElement;
    }

    return null;
  }

  function criarBotao(link, numero, botaoRemover, containerItem) {
    const button = document.createElement('button');

    button.className = botaoRemover.className;

    button.classList.add(CLASSE_BOTAO);

    button.type = 'button';

    button.setAttribute('data-tooltip-text', 'Copiar task');

    button.setAttribute('aria-label', `Copiar task ${numero}`);

    const estiloRemover = window.getComputedStyle(botaoRemover);

    const estiloContainer = window.getComputedStyle(containerItem);

    if (estiloContainer.position === 'static') {
      containerItem.style.position = 'relative';
    }

    const rectContainer = containerItem.getBoundingClientRect();

    const rectRemover = botaoRemover.getBoundingClientRect();

    const rectLink = link.getBoundingClientRect();

    /*
     * Limita o título até antes do botão
     * de copiar.
     */
    const larguraTitulo = Math.max(
      60,
      rectRemover.left - rectRemover.width - 8 - rectLink.left,
    );

    link.style.display = 'inline-block';
    link.style.maxWidth = `${larguraTitulo}px`;

    link.style.overflow = 'hidden';
    link.style.textOverflow = 'ellipsis';
    link.style.whiteSpace = 'nowrap';
    link.style.verticalAlign = 'middle';

    /*
     * Coloca o copiar à esquerda do X
     * sem empurrar o botão de remover.
     */
    const distanciaDireita = rectContainer.right - rectRemover.left + 2;

    const distanciaTopo = rectRemover.top - rectContainer.top;

    button.style.position = 'absolute';
    button.style.right = `${distanciaDireita}px`;

    button.style.top = `${distanciaTopo}px`;

    button.style.width = estiloRemover.width;

    button.style.height = estiloRemover.height;

    button.style.minWidth = estiloRemover.minWidth;

    button.style.minHeight = estiloRemover.minHeight;

    button.style.padding = estiloRemover.padding;

    button.style.margin = '0';
    button.style.zIndex = '2';

    button.innerHTML = `
      <span class="fluent-icons-enabled">
        <span
          aria-hidden="true"
          class="left-icon flex-noshrink fabric-icon ms-Icon--Copy medium"
        ></span>
      </span>
    `;

    button.addEventListener('mousedown', (event) => {
      ocultarTooltip();

      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener('mouseenter', () => {
      agendarTooltip(button);
    });

    button.addEventListener('mouseleave', () => {
      ocultarTooltip();
    });

    button.addEventListener('focus', () => {
      agendarTooltip(button);
    });

    button.addEventListener('blur', () => {
      ocultarTooltip();
    });

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      await copiarWorkItem(link, numero, button);
    });

    return button;
  }

  function agendarTooltip(button) {
    ocultarTooltip();

    timeoutTooltip = window.setTimeout(() => {
      mostrarTooltip(button);
    }, 500);
  }

  function mostrarTooltip(button) {
    if (!button.isConnected) return;

    const tooltip = document.createElement('div');

    tooltip.textContent =
      button.getAttribute('data-tooltip-text') || 'Copiar task';

    tooltip.setAttribute('role', 'tooltip');

    tooltip.style.position = 'fixed';
    tooltip.style.padding = '8px 12px';

    tooltip.style.background = 'rgb(243, 242, 241)';

    tooltip.style.color = 'rgb(50, 49, 48)';

    tooltip.style.borderRadius = '2px';

    tooltip.style.boxShadow =
      '0 3.2px 7.2px rgba(0, 0, 0, 0.13), ' +
      '0 0.6px 1.8px rgba(0, 0, 0, 0.11)';

    tooltip.style.fontFamily = '"Segoe UI", sans-serif';

    tooltip.style.fontSize = '14px';
    tooltip.style.fontWeight = '400';
    tooltip.style.lineHeight = '20px';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '99999';

    document.body.appendChild(tooltip);

    const rectButton = button.getBoundingClientRect();

    const rectTooltip = tooltip.getBoundingClientRect();

    let esquerda =
      rectButton.left + rectButton.width / 2 - rectTooltip.width / 2;

    let topo = rectButton.bottom + 8;

    esquerda = Math.max(
      8,
      Math.min(esquerda, window.innerWidth - rectTooltip.width - 8),
    );

    if (topo + rectTooltip.height > window.innerHeight - 8) {
      topo = rectButton.top - rectTooltip.height - 8;
    }

    tooltip.style.left = `${esquerda}px`;

    tooltip.style.top = `${topo}px`;

    tooltipAtual = tooltip;
  }

  function ocultarTooltip() {
    window.clearTimeout(timeoutTooltip);
    timeoutTooltip = 0;

    if (tooltipAtual) {
      tooltipAtual.remove();
      tooltipAtual = null;
    }
  }

  async function copiarWorkItem(link, numero, button) {
    try {
      definirCarregando(button, true);

      const workItem = await buscarWorkItem(link, numero);

      const campos = workItem.fields || {};

      const titulo = String(campos['System.Title'] || '').trim();

      const tipoWorkItem = String(campos['System.WorkItemType'] || '').trim();

      const tags = obterTags(campos['System.Tags']);

      if (!titulo) {
        throw new Error('Não foi possível obter o título.');
      }

      if (tags.length === 0) {
        alert(
          '⚠ Erro ao obter tags!\n\n' +
            'Verifique se o work item possui tags.\n' +
            '❌ O commit não foi copiado!',
        );

        return;
      }

      const tipoCommit = obterTipoCommit(
        tipoWorkItem,
        titulo,
        workItem.relations,
      );

      const tagsSanitizadas = tags
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((tag) => sanitizar(tag))
        .join(', ');

      const commit =
        `${tipoCommit}(${tagsSanitizadas}): ` +
        `${sanitizar(titulo)}\n\n#${numero}`;

      await copiar(commit);

      alert(`Copiado!\n\n${commit}`);
    } catch (error) {
      console.error(`Erro ao copiar work item ${numero}:`, error);

      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido.';

      alert('❌ Não foi possível copiar o work item.\n\n' + mensagem);
    } finally {
      definirCarregando(button, false);
    }
  }

  async function buscarWorkItem(link, numero) {
    const url = montarUrlApi(link, numero);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let detalhe = '';

      try {
        const respostaErro = await response.json();

        detalhe = respostaErro?.message || '';
      } catch {
        // Azure não retornou um JSON.
      }

      throw new Error(
        `A API do Azure retornou ${response.status}.` +
          (detalhe ? `\n${detalhe}` : ''),
      );
    }

    return response.json();
  }

  function montarUrlApi(link, numero) {
    const urlLink = new URL(link.href, location.href);

    const resultadoLink = urlLink.pathname.match(
      /^(.*?)\/_workitems\/edit\/\d+/i,
    );

    const resultadoPagina = location.pathname.match(/^(.*?)\/_git\//i);

    const prefixo = resultadoLink?.[1] || resultadoPagina?.[1];

    if (!prefixo) {
      throw new Error('Não foi possível identificar o projeto pela URL.');
    }

    const urlApi = new URL(location.origin);

    urlApi.pathname = `${prefixo}/_apis/wit/workitems/${numero}`;

    urlApi.searchParams.set('$expand', 'Relations');

    urlApi.searchParams.set('api-version', '7.1');

    return urlApi.toString();
  }

  function obterNumeroWorkItem(link) {
    try {
      const url = new URL(link.href, location.href);

      const numeroQuery = url.searchParams.get('workitem');

      if (numeroQuery) {
        return numeroQuery;
      }

      const resultadoPath = url.pathname.match(/\/_workitems\/edit\/(\d+)/i);

      if (resultadoPath) {
        return resultadoPath[1];
      }
    } catch (error) {
      console.warn('Não foi possível interpretar a URL.', error);
    }

    const texto = link.textContent || '';

    const resultadoTexto = texto.match(
      /\b(?:bug|task|user story|issue)\s+(\d+)\b/i,
    );

    return resultadoTexto?.[1] || null;
  }

  function obterTags(valor) {
    if (!valor) return [];

    const tags = String(valor)
      .split(';')
      .map((tag) => tag.trim())
      .filter(Boolean);

    return [...new Set(tags)];
  }

  function obterTipoCommit(tipoWorkItem, titulo, relations) {
    if (ehPublicar(titulo, relations)) {
      return 'build';
    }

    const tipo = tipoWorkItem.toLowerCase();

    const tituloLower = titulo.toLowerCase();

    if (
      tipo.includes('bug') ||
      tipo.includes('hotfix') ||
      tipo.includes('issue') ||
      tituloLower.includes('hotfix') ||
      tituloLower.includes('fix') ||
      tituloLower.includes('bug')
    ) {
      return 'fix';
    }

    return 'feat';
  }

  function ehPublicar(titulo, relations) {
    if (titulo.toLowerCase().includes('publicar')) {
      return true;
    }

    if (!Array.isArray(relations)) {
      return false;
    }

    return relations.some((relation) => {
      const texto = [
        relation?.attributes?.name,
        relation?.attributes?.comment,
        relation?.url,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return texto.includes('publicar');
    });
  }

  function definirCarregando(button, carregando) {
    button.disabled = carregando;

    button.style.opacity = carregando ? '0.55' : '';

    button.style.cursor = carregando ? 'wait' : '';

    button.setAttribute(
      'data-tooltip-text',
      carregando ? 'Copiando task...' : 'Copiar task',
    );
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
      throw new Error('O navegador bloqueou a área de transferência.');
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
