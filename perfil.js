/* ══════════ FAMR • PERFIL.JS ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
const groupChip = g => g ? `<span class="chip" style="background:${g.color}18;color:${g.color};border:1px solid ${g.color}55">${esc(g.name)}</span>` : '<span class="chip chip-neutral">Geral</span>';

function toast(msg, type='ok'){
  const el = document.createElement('div');
  el.className = 'toast ' + (type==='ok'?'':type);
  el.innerHTML = `<i class="fas ${type==='err'?'fa-circle-exclamation text-red-600':type==='warn'?'fa-triangle-exclamation text-gold-500':'fa-circle-check text-famr-600'} mt-0.5"></i><span>${esc(msg)}</span>`;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

document.addEventListener('DOMContentLoaded', async () => {
  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ location.href = 'index.html'; return; }

  // Pega o ID da URL (?id=xxx) ou usa o próprio usuário
  const params = new URLSearchParams(location.search);
  const targetId = params.get('id') || session.user.id;
  const isMe = targetId === session.user.id;

  const { data: profile, error } = await supabase.from('profiles_view').select('*').eq('id', targetId).single();
  if(error || !profile){
    document.getElementById('perfil-content').innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-user-slash text-3xl text-muted"></i><h2 class="font-display font-bold text-xl mt-3">Perfil não encontrado</h2></div>`;
    return;
  }

  const { data: ug } = await supabase.from('user_groups').select('groups(*)').eq('user_id', targetId);
  const gs = (ug||[]).map(r => r.groups).filter(g => g && (g.visible || isMe));

  document.getElementById('perfil-content').innerHTML = `
  <div class="page-header">
    <a href="index.html#/home" class="ph-back"><i class="fas fa-arrow-left"></i> Voltar ao Índice</a>
    <h1><i class="fas fa-id-badge mr-2"></i>Perfil Militar</h1>
    <p class="ph-sub">${isMe ? 'Seus dados pessoais e hierarquia.' : 'Dados públicos do militar.'}</p>
  </div>

  <div class="card fade-up overflow-hidden">
    <div class="h-24" style="background:linear-gradient(120deg,#0e4433,#14563f 60%,#c9a227)"></div>
    <div class="p-6 -mt-12">
      <div class="flex flex-wrap items-end gap-4">
        <span class="w-20 h-20 rounded-2xl grid place-items-center text-3xl font-extrabold text-white border-4 border-white shadow-lg" style="background:${gs[0]?.color||'#14563f'}">${esc(profile.nickname.charAt(0).toUpperCase())}</span>
        <div class="flex-1"><h1 class="font-display text-2xl font-extrabold">${esc(profile.nickname)}</h1>
        <p class="text-xs text-muted">No sistema desde ${fmtDate(profile.created_at)} ${isMe?`• ${esc(profile.email)}`:''}</p></div>
        <span class="chip ${profile.status==='active'?'chip-ok':profile.status==='pending'?'chip-wait':'chip-no'}">${profile.status.toUpperCase()}</span>
        ${profile.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock mr-1"></i>BLOQUEADA</span>' : ''}
      </div>
      <div class="flex flex-wrap gap-2 mt-4">${gs.map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}</div>
    </div>
  </div>`;
});
