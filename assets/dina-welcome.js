(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const menuLink = $('viewMenuLink');
  const branchCards = $('dcBranchCards');
  let renderedBranchCount = 4;

  if (menuLink) {
    const incoming = new URLSearchParams(window.location.search);
    const destination = new URL('menu.html', window.location.href);
    ['location_id', 'branch_id'].forEach((key) => {
      const value = (incoming.get(key) || '').trim();
      if (value) destination.searchParams.set(key, value);
    });
    menuLink.href = destination.pathname + destination.search;
  }

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function syncBranchLayout(count) {
    const safeCount = Math.max(1, Number(count) || 4);
    if (branchCards) branchCards.style.setProperty('--dc-branch-count', String(safeCount));
    const imageFrame = document.querySelector('.dc-best-sellers--full-frame');
    if (imageFrame) {
      const baseRatio = window.matchMedia && window.matchMedia('(max-width: 360px)').matches ? 0.44 : 0.47;
      const ratio = Math.min(1.3, Math.max(0.28, (baseRatio * 4) / safeCount));
      imageFrame.style.setProperty('--dc-branch-photo-ratio', `${ratio} / 1`);
    }
  }

  async function loadWelcomeBranches() {
    if (!branchCards) return;
    branchCards.setAttribute('aria-busy', 'true');
    branchCards.innerHTML = '<div class="dc-branch-loading">جارٍ تحميل الفروع…</div>';
    try {
      const client = window.sb;
      if (!client || typeof client.from !== 'function') {
        throw new Error('Branch list is unavailable. Check the public locations read permission.');
      }
      const { data, error } = await client.from('locations')
        .select('id,name,city,address,maps_url,is_active,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const branches = (Array.isArray(data) ? data : []).filter((row) => row && String(row.name || '').trim());
      renderedBranchCount = branches.length || 4;
      syncBranchLayout(renderedBranchCount);
      if (!branches.length) {
        branchCards.innerHTML = '<div class="dc-branch-loading">لا توجد فروع متاحة حاليًا.</div>';
        return;
      }

      branchCards.innerHTML = branches.map((branch) => {
        const name = String(branch.name || '').trim();
        const detail = [branch.city, branch.address].map((value) => String(value || '').trim()).filter(Boolean).join(' · ');
        const mapUrl = window.DinaBranchMaps?.resolve(branch) || '';
        const body = `<span class="dc-branch-card__icon" aria-hidden="true">⌖</span><span class="dc-branch-card__body"><strong>${escapeHtml(name)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</span><span class="dc-branch-card__go" aria-hidden="true">${mapUrl ? '↗' : '—'}</span>`;
        return mapUrl
          ? `<a class="dc-branch-card" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" aria-label="افتح موقع ${escapeHtml(name)} على خرائط Google">${body}</a>`
          : `<div class="dc-branch-card dc-branch-card--unlinked" aria-disabled="true" title="لم تتم إضافة رابط خرائط دقيق لهذا الفرع بعد">${body}</div>`;
      }).join('');
    } catch (error) {
      console.error('Dina’s Corner branches could not be loaded:', error);
      renderedBranchCount = 4;
      syncBranchLayout(renderedBranchCount);
      branchCards.innerHTML = '<div class="dc-branch-loading" role="status">تعذر تحميل الفروع الآن. يرجى تحديث الصفحة.</div>';
    } finally {
      branchCards.setAttribute('aria-busy', 'false');
    }
  }

  loadWelcomeBranches();
  window.addEventListener('resize', () => syncBranchLayout(renderedBranchCount), { passive: true });
})();
