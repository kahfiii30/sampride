import { useState, useEffect } from 'react';
import { supabase, Account, DailyChecklist } from '../lib/supabase';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useAuth } from '../context/AuthContext';

export default function ChecklistHarian() {
  const { role } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [checklists, setChecklists] = useState<Record<string, DailyChecklist>>({});
  const [loading, setLoading] = useState(true);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Run queries concurrently
      const [accResponse, checkResponse] = await Promise.all([
        supabase.from('content_accounts').select('*').eq('is_active', true).order('name'),
        supabase.from('daily_checklists').select('*').eq('checklist_date', date)
      ]);
      
      const accData = accResponse.data;
      const checkData = checkResponse.data;

      if (accData) setAccounts(accData);
      
      const checkMap: Record<string, DailyChecklist> = {};
      if (checkData) {
        checkData.forEach(item => {
          checkMap[item.account_id] = item;
        });
      }
      setChecklists(checkMap);
    } catch (err) {
      console.error('Error fetching checklist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (accountId: string, field: keyof DailyChecklist, value: boolean) => {
    const existing = checklists[accountId];
    
    // Optimistic update
    setChecklists(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        account_id: accountId,
        checklist_date: date,
        [field]: value
      } as DailyChecklist
    }));

    if (existing && existing.id) {
      // Update
      await supabase
        .from('daily_checklists')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Insert
      const { data } = await supabase
        .from('daily_checklists')
        .insert([{ 
          account_id: accountId, 
          checklist_date: date,
          [field]: value 
        }])
        .select()
        .single();
      
      if (data) {
        setChecklists(prev => ({ ...prev, [accountId]: data }));
      }
    }
  };

  const triggerGenerateChecklist = () => {
    setIsGenerateConfirmOpen(true);
  };

  const executeGenerateChecklist = async () => {
    const missingAccounts = accounts.filter(acc => !checklists[acc.id]);
    if (missingAccounts.length === 0) {
      alert('Semua akun sudah memiliki checklist untuk hari ini.');
      return;
    }

    const inserts = missingAccounts.map(acc => ({
      account_id: acc.id,
      checklist_date: date
    }));

    await supabase.from('daily_checklists').insert(inserts);
    fetchData();
  };

  const checklistFields: { key: keyof DailyChecklist, label: string }[] = [
    { key: 'slide_2', label: 'Slide 2' },
    { key: 'caption', label: 'Caption' },
    { key: 'story', label: 'Story' },
    { key: 'reels', label: 'Reels' }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Checklist Harian</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Centang tugas konten harian per akun/media.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            value={date} 
            onChange={e => setDate(e.target.value)} 
          />
          {role === 'admin' && (
            <Button variant="secondary" onClick={triggerGenerateChecklist}>
              Generate Checklist
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="text-center text-slate-500 py-12">Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: '800px' }}>
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Akun/Media</th>
                  {checklistFields.map(f => (
                    <th key={f.key} className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{f.label}</th>
                  ))}
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Total Bolong</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detail Bolong</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {accounts.map(acc => {
                  const cl = checklists[acc.id] || {};
                  const requiredFields = checklistFields.filter(f => acc[`req_${f.key}` as keyof Account] === true);
                  const completed = requiredFields.filter(f => cl[f.key]).length;
                  const total = requiredFields.length;
                  const bolongCount = total - completed;
                  const detailBolong = requiredFields
                    .filter(f => !cl[f.key])
                    .map(f => f.label)
                    .join(', ');
                  const isAman = bolongCount === 0;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                      {checklistFields.map(f => {
                        const isRequired = Number(acc[`req_${f.key}` as keyof Account] ?? 0) > 0;
                        return (
                          <td key={f.key} className="px-6 py-4 whitespace-nowrap text-center">
                            <input 
                              type="checkbox" 
                              checked={!!cl[f.key]} 
                              disabled={!isRequired || role === 'viewer'}
                              onChange={e => handleCheck(acc.id, f.key, e.target.checked)}
                              className={`h-5 w-5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-sm text-red-600">
                        {bolongCount > 0 ? `Bolong ${bolongCount}` : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {detailBolong || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAman ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                          {isAman ? 'Aman' : 'Bolong'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Checklist Confirmation Modal */}
      <ConfirmModal 
        isOpen={isGenerateConfirmOpen}
        onClose={() => setIsGenerateConfirmOpen(false)}
        onConfirm={executeGenerateChecklist}
        title="Generate Checklist Harian"
        description="Apakah Anda yakin ingin men-generate checklist kosong untuk semua akun media yang aktif hari ini?"
        confirmText="Ya, Generate"
        cancelText="Batal"
        variant="info"
      />
    </div>
  );
}
