/* ══════════ FAMR • COMPANHIAS.JS ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const powerStars = p => '★'.repeat(Math.max(1, Math.min(5, Math.ceil((p||0)/20)))) + '☆'.repeat(Math.max(0, 5-Math.min(5, Math.ceil((p||0)/20))));

document.addEventListener('DOMContentLoaded', async () => {
  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ location.href = 'index.html'; return; }

  const { data: groups } = await supabase.from('groups').select('*, groups(name)').eq('visible', true).order('power_level',{ascending:false});
  const { data: members } = await supabase.from('user_groups').select('group_id').limit(5000);
  const count = {}; (members||[]).forEach(m => count[m.group_id] = (count[m.group_id]||0)+1);

  // Destaque se veio de #groupId na URL
  const highlightId = location.hash.slice(1);

  document.getElementById('companhias-content').innerHTML = `
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
    ${(groups||[]).map(g => `<div class="card card-hover overflow-hidden ${highlightId===g.id?'ring-2 ring-gold-500':''}">
      <div class="h-2" style="background:linear-gradient(90deg,${g.color},${g.color}88)"></div>
      <div class="p-5">
        <div class="flex items-center justify-between"><h3 class="font-display font-bold" style="color:${g.color}">${esc(g.name)}</h3>
        <span class="text-gold-500 text-xs">${powerStars(g.power_level)}</span></div>
        <p class="text-xs text-muted mt-1">${g.groups ? 'Subgrupo de <b>'+esc(g.groups.name)+'</b>' : 'Companhia principal'}</p>
        <div class="flex items-center justify-between mt-4 text-xs text-muted">
          <span><i class="fas fa-users mr-1 text-famr-600"></i>${count[g.id]||0} membro(s)</span>
          <span class="chip chip-ok">VISÍVEL</span></div>
      </div></div>`).join('') || '<div class="card card-body text-sm text-muted">Nenhuma companhia visível.</div>'}
  </div>`;
});
