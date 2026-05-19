import { useState, useEffect } from 'react';
import { supabase, ContentBATarget, ContentBADailyUpdate } from '../lib/supabase';
import { format } from 'date-fns';
import { Edit2, Plus, Calendar, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function TargetKonten() {
  const [baTargets, setBaTargets] = useState<ContentBATarget[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<Record<string, ContentBADailyUpdate>>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBAModalOpen, setIsBAModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditBAModalOpen, setIsEditBAModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [selectedBAId, setSelectedBAId] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState('');
  
  // BA Form
  const [namaBA, setNamaBA] = useState('');
  const [targetBulanan, setTargetBulanan] = useState(30);

  // Update Progress Form
  const [updateTanggal, setUpdateTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [updateRealisasi, setUpdateRealisasi] = useState(0);
  
  // History
  const [historyData, setHistoryData] = useState<ContentBADailyUpdate[]>([]);
  const [selectedBAName, setSelectedBAName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch BA Targets
      const { data: baData } = await supabase
        .from('content_ba_targets')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (baData) {
        setBaTargets(baData);
      }

      // Fetch Latest Updates
      const { data: updateData } = await supabase
        .from('content_ba_daily_updates')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });
      
      const updateMap: Record<string, ContentBADailyUpdate> = {};
      if (updateData) {
        updateData.forEach(u => {
          if (!updateMap[u.ba_id]) {
            updateMap[u.ba_id] = u; // Keep the latest one
          }
        });
      }
      setLatestUpdates(updateMap);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBA = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('content_ba_targets').insert([{
      nama_ba: namaBA,
      target_bulanan: targetBulanan
    }]);
    setIsBAModalOpen(false);
    await fetchData();
  };

  const handleEditBA = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('content_ba_targets').update({
      nama_ba: namaBA,
      target_bulanan: targetBulanan,
      updated_at: new Date().toISOString()
    }).eq('id', selectedBAId);
    setIsEditBAModalOpen(false);
    await fetchData();
  };

  const handleDeleteBA = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteBA = async () => {
    if (!deleteTargetId) return;
    await supabase.from('content_ba_targets').delete().eq('id', deleteTargetId);
    setDeleteTargetId('');
    await fetchData();
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if an update for this date already exists
    const { data: existingUpdate } = await supabase
      .from('content_ba_daily_updates')
      .select('id')
      .eq('ba_id', selectedBAId)
      .eq('tanggal', updateTanggal)
      .single();

    if (existingUpdate) {
      await supabase.from('content_ba_daily_updates').update({ 
        realisasi: updateRealisasi,
        updated_at: new Date().toISOString()
      }).eq('id', existingUpdate.id);
    } else {
      await supabase.from('content_ba_daily_updates').insert([{
        ba_id: selectedBAId,
        tanggal: updateTanggal,
        realisasi: updateRealisasi
      }]);
    }
    setIsUpdateModalOpen(false);
    await fetchData();
  };

  const openHistory = async (baId: string, baName: string) => {
    setSelectedBAId(baId);
    setSelectedBAName(baName);
    const { data } = await supabase
      .from('content_ba_daily_updates')
      .select('*')
      .eq('ba_id', baId)
      .order('tanggal', { ascending: false });
    
    setHistoryData(data || []);
    setIsHistoryModalOpen(true);
  };

  const openEditBA = (ba: ContentBATarget) => {
    setSelectedBAId(ba.id);
    setNamaBA(ba.nama_ba);
    setTargetBulanan(ba.target_bulanan);
    setIsEditBAModalOpen(true);
  };

  const openUpdateModal = (baId: string, currentRealisasi: number) => {
    setSelectedBAId(baId);
    setUpdateTanggal(format(new Date(), 'yyyy-MM-dd'));
    setUpdateRealisasi(currentRealisasi);
    setIsUpdateModalOpen(true);
  };

  const openAddBAModal = () => {
    setNamaBA('');
    setTargetBulanan(30);
    setIsBAModalOpen(true);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Target Konten BA</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tracking target bulanan dan realisasi harian BA / Content Creator.</p>
        </div>
        <Button onClick={openAddBAModal} className="flex items-center gap-1.5">
          <Plus size={18} /> Tambah BA
        </Button>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading ? (
          <p className="text-slate-500 col-span-full py-12 text-center">Memuat data...</p>
        ) : baTargets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Belum ada data BA.</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Silakan klik "Tambah BA" untuk memulai.</p>
          </div>
        ) : (
          baTargets.map(ba => {
            const target = ba.target_bulanan;
            const completed = latestUpdates[ba.id]?.realisasi || 0;
            const minus = Math.max(target - completed, 0);
            const progressPct = Math.min(Math.round((completed / target) * 100), 100) || 0;
            
            return (
              <Card key={ba.id} className="min-h-[260px] flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 pr-2" title={ba.nama_ba}>
                      {ba.nama_ba}
                    </h3>
                    <Badge variant={minus > 0 ? 'danger' : 'success'}>
                      {minus > 0 ? `Minus ${minus} video` : 'Target Tercapai'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <p className="text-slate-400 dark:text-slate-500 font-medium text-xs">Target</p>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-0.5">{target} Konten</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <p className="text-slate-400 dark:text-slate-500 font-medium text-xs">Realisasi</p>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-0.5">{completed} Konten</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-405 dark:text-slate-500 font-semibold">Progress</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{progressPct}%</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 h-2 w-full rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${minus > 0 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="primary" size="sm" onClick={() => openUpdateModal(ba.id, completed)}>
                    Update
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openHistory(ba.id, ba.nama_ba)}>
                    <Calendar size={13} /> History
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openEditBA(ba)}>
                    <Edit size={13} /> Target / Nama
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteBA(ba.id)}>
                    <Trash2 size={13} /> Hapus
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Tambah BA Modal */}
      <Modal isOpen={isBAModalOpen} onClose={() => setIsBAModalOpen(false)} title="Tambah BA Baru" maxWidthClassName="max-w-[520px]">
        <form onSubmit={handleSaveBA} className="space-y-4">
          <Input 
            label="Nama BA / Content Creator" 
            type="text" 
            value={namaBA} 
            onChange={e => setNamaBA(e.target.value)} 
            required 
            placeholder="Contoh: Kekeshabila"
          />
          <Input 
            label="Target Bulanan" 
            type="number" 
            value={targetBulanan} 
            onChange={e => setTargetBulanan(parseInt(e.target.value) || 0)} 
            min={1} 
            required 
          />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-850">
            <Button type="button" variant="secondary" onClick={() => setIsBAModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit BA Modal */}
      <Modal isOpen={isEditBAModalOpen} onClose={() => setIsEditBAModalOpen(false)} title="Edit Target / Nama BA" maxWidthClassName="max-w-[520px]">
        <form onSubmit={handleEditBA} className="space-y-4">
          <Input 
            label="Nama BA" 
            type="text" 
            value={namaBA} 
            onChange={e => setNamaBA(e.target.value)} 
            required 
          />
          <Input 
            label="Target Bulanan" 
            type="number" 
            value={targetBulanan} 
            onChange={e => setTargetBulanan(parseInt(e.target.value) || 0)} 
            min={1} 
            required 
          />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-850">
            <Button type="button" variant="secondary" onClick={() => setIsEditBAModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Update Realisasi" maxWidthClassName="max-w-[520px]">
        <form onSubmit={handleSaveUpdate} className="space-y-4">
          <Input 
            label="Tanggal" 
            type="date" 
            value={updateTanggal} 
            onChange={e => setUpdateTanggal(e.target.value)} 
            required 
          />
          <Input 
            label="Total Kumulatif Realisasi" 
            type="number" 
            value={updateRealisasi} 
            onChange={e => setUpdateRealisasi(parseInt(e.target.value) || 0)} 
            min={0} 
            required 
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Isi dengan total konten yang sudah dibuat sejauh ini (bukan hanya penambahan hari ini).</p>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-850">
            <Button type="button" variant="secondary" onClick={() => setIsUpdateModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`History: ${selectedBAName}`} maxWidthClassName="max-w-[760px]">
        {historyData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Belum ada history pembaruan.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Konten</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {historyData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">{format(new Date(item.tanggal), 'dd MMM yyyy')}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.realisasi} Konten</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end mt-5 border-t border-slate-100 pt-4 dark:border-slate-850">
          <Button variant="secondary" onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDeleteBA}
        title="Hapus Brand Ambassador"
        description="Apakah Anda yakin ingin menghapus BA ini? Semua data target dan riwayat realisasi BA ini akan dihapus permanen."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
