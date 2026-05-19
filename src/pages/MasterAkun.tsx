import { useState, useEffect } from 'react';
import { supabase, Account } from '../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useAuth } from '../context/AuthContext';

export default function MasterAkun() {
  const { role } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');
  
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Use booleans for checklist requirements
  const [reqSlide2, setReqSlide2] = useState<boolean>(true);
  const [reqCaption, setReqCaption] = useState<boolean>(true);
  const [reqStory, setReqStory] = useState<boolean>(false);
  const [reqReels, setReqReels] = useState<boolean>(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_accounts')
        .select('*')
        .order('name');
      
      if (error) {
        console.error(error);
      } else {
        setAccounts(data || []);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      is_active: isActive,
      req_slide_2: reqSlide2,
      req_caption: reqCaption,
      req_story: reqStory,
      req_reels: reqReels
    };

    if (editingId) {
      const { error } = await supabase
        .from('content_accounts')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        alert('Gagal mengubah akun: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchAccounts();
      }
    } else {
      const { error } = await supabase
        .from('content_accounts')
        .insert([payload]);
      if (error) {
        alert('Gagal menambah akun: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchAccounts();
      }
    }
  };

  const openEdit = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setIsActive(acc.is_active);
    setReqSlide2(acc.req_slide_2 ?? false);
    setReqCaption(acc.req_caption ?? false);
    setReqStory(acc.req_story ?? false);
    setReqReels(acc.req_reels ?? false);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setName('');
    setIsActive(true);
    setReqSlide2(true);
    setReqCaption(true);
    setReqStory(false);
    setReqReels(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const { error } = await supabase.from('content_accounts').delete().eq('id', deleteTargetId);
    setDeleteTargetId('');
    if (error) {
      alert('Gagal menghapus akun: ' + error.message);
    } else {
      fetchAccounts();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('content_accounts').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
    } else {
      fetchAccounts();
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Master Akun / Media</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola daftar akun yang akan di-tracking kontennya.</p>
        </div>
        {role === 'admin' && (
          <Button onClick={openNew} className="flex items-center gap-1.5">
            <Plus size={16} /> Tambah Akun
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="text-center text-slate-500 py-12">Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Akun/Media</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jumlah Target Harian</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Belum ada akun</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Klik Tambah Akun untuk membuat data baru.</p>
                    </td>
                  </tr>
                ) : (
                  accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {acc.req_slide_2 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">Slide 2</span>}
                          {acc.req_caption && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Caption</span>}
                          {acc.req_story && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400">Story</span>}
                          {acc.req_reels && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">Reels</span>}
                          {!acc.req_slide_2 && !acc.req_caption && !acc.req_story && !acc.req_reels && (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">Tidak ada</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => role === 'admin' && toggleStatus(acc.id, acc.is_active)}
                          disabled={role === 'viewer'}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${acc.is_active ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'} transition-colors border-none ${role === 'viewer' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${acc.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {acc.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {role === 'admin' ? (
                            <>
                              <button 
                                onClick={() => openEdit(acc)} 
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors" 
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(acc.id)} 
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors" 
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Hanya lihat</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Akun' : 'Tambah Akun'} maxWidthClassName="max-w-[620px]">
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Nama Akun/Media"
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="Contoh: Instagram @omgarage"
          />
          
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">Kebutuhan Checklist Harian (Wajib)</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-750 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={reqSlide2} 
                  onChange={e => setReqSlide2(e.target.checked)} 
                />
                Slide 2
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-750 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={reqCaption} 
                  onChange={e => setReqCaption(e.target.checked)} 
                />
                Caption
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-750 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={reqStory} 
                  onChange={e => setReqStory(e.target.checked)} 
                />
                Story
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-750 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={reqReels} 
                  onChange={e => setReqReels(e.target.checked)} 
                />
                Reels
              </label>
            </div>
          </div>

          <div>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
              />
              Status Aktif
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Hapus Akun / Media"
        description="Apakah Anda yakin ingin menghapus akun ini? Semua data checklist harian dan rekap terkait akun ini akan dihapus permanen."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
