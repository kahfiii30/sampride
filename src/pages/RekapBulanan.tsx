import { useState, useEffect } from 'react';
import { supabase, Account, DailyChecklist, ContentBATarget, ContentBADailyUpdate } from '../lib/supabase';
import { format, getMonth, getYear, getDaysInMonth } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function RekapBulanan() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [month, setMonth] = useState(getMonth(currentDate) + 1);
  const [year, setYear] = useState(getYear(currentDate));
  
  const [activeTab, setActiveTab] = useState<'checklist' | 'target'>('checklist');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [baTargets, setBaTargets] = useState<ContentBATarget[]>([]);
  const [baUpdates, setBaUpdates] = useState<ContentBADailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Data
  const [checklistData, setChecklistData] = useState<Record<string, DailyChecklist[]>>({});

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Accounts
      const { data: accData } = await supabase
        .from('content_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (accData) setAccounts(accData);

      // Filter dates
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const daysInMonth = getDaysInMonth(new Date(year, month - 1));
      const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

      // 2. Daily Checklists
      const { data: checkData } = await supabase
        .from('daily_checklists')
        .select('*')
        .gte('checklist_date', startDate)
        .lte('checklist_date', endDate);

      const checkMap: Record<string, DailyChecklist[]> = {};
      if (checkData) {
        checkData.forEach(item => {
          if (!checkMap[item.account_id]) checkMap[item.account_id] = [];
          checkMap[item.account_id].push(item);
        });
      }
      setChecklistData(checkMap);

      // 3. BA Targets (from content_ba_targets)
      const { data: baTargetsData } = await supabase
        .from('content_ba_targets')
        .select('*')
        .order('nama_ba', { ascending: true });
      if (baTargetsData) setBaTargets(baTargetsData);

      // 4. BA Daily Updates (from content_ba_daily_updates for current month)
      const { data: baUpdatesData } = await supabase
        .from('content_ba_daily_updates')
        .select('*')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);
      if (baUpdatesData) setBaUpdates(baUpdatesData);
    } catch (err) {
      console.error('Error fetching rekap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && (month < today.getMonth() + 1));
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const daysToCount = isCurrentMonth ? today.getDate() : (isPastMonth ? daysInMonth : 0);

    if (activeTab === 'checklist') {
      const headers = [
        'Nama Akun/Media', 
        'Bulan', 
        'Tahun', 
        'Hari Terisi',
        'Total Checklist Wajib', 
        'Checklist Selesai', 
        'Checklist Bolong', 
        'Bolong Slide 2',
        'Bolong Caption',
        'Bolong Story',
        'Bolong Reels',
        'Paling Sering Bolong',
        'Status Checklist'
      ];

      const rows = accounts.map(acc => {
        let reqCount = 0;
        if (acc.req_slide_2) reqCount++;
        if (acc.req_caption) reqCount++;
        if (acc.req_story) reqCount++;
        if (acc.req_reels) reqCount++;

        let daysToCount = isCurrentMonth ? today.getDate() : (isPastMonth ? daysInMonth : 0);
        if (acc.created_at) {
          const createdAt = new Date(acc.created_at);
          if (createdAt.getFullYear() === year && (createdAt.getMonth() + 1) === month) {
            const startDay = createdAt.getDate();
            const endDay = isCurrentMonth ? today.getDate() : daysInMonth;
            daysToCount = Math.max(0, endDay - startDay + 1);
          } else if (createdAt.getFullYear() > year || (createdAt.getFullYear() === year && (createdAt.getMonth() + 1) > month)) {
            daysToCount = 0;
          }
        }

        const totalWajib = daysToCount * reqCount;
        const cls = checklistData[acc.id] || [];
        const totalHariTerisi = cls.length;
        const missingDays = Math.max(daysToCount - totalHariTerisi, 0);

        let checked = 0;
        let bolongSlide2 = acc.req_slide_2 ? missingDays : 0;
        let bolongCaption = acc.req_caption ? missingDays : 0;
        let bolongStory = acc.req_story ? missingDays : 0;
        let bolongReels = acc.req_reels ? missingDays : 0;

        cls.forEach(c => {
          if (acc.req_slide_2) {
            if (c.slide_2) { checked++; } else { bolongSlide2++; }
          }
          if (acc.req_caption) {
            if (c.caption) { checked++; } else { bolongCaption++; }
          }
          if (acc.req_story) {
            if (c.story) { checked++; } else { bolongStory++; }
          }
          if (acc.req_reels) {
            if (c.reels) { checked++; } else { bolongReels++; }
          }
        });
        const bolong = totalWajib - checked;

        const activeBolongs: { label: string; count: number }[] = [];
        if (acc.req_slide_2) activeBolongs.push({ label: 'Slide 2', count: bolongSlide2 });
        if (acc.req_caption) activeBolongs.push({ label: 'Caption', count: bolongCaption });
        if (acc.req_story) activeBolongs.push({ label: 'Story', count: bolongStory });
        if (acc.req_reels) activeBolongs.push({ label: 'Reels', count: bolongReels });

        const maxBolong = activeBolongs.length > 0 ? Math.max(...activeBolongs.map(x => x.count)) : 0;
        const bolongList: string[] = [];
        if (maxBolong > 0) {
          activeBolongs.forEach(x => {
            if (x.count === maxBolong) bolongList.push(x.label);
          });
        }
        const palingSering = bolongList.length > 0 ? bolongList.join('; ') : '-';
        const statusChecklist = bolong > 0 ? 'Bolong' : 'Aman';

        return [
          acc.name,
          month,
          year,
          totalHariTerisi,
          totalWajib,
          checked,
          bolong,
          bolongSlide2,
          bolongCaption,
          bolongStory,
          bolongReels,
          `"${palingSering}"`,
          statusChecklist
        ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `rekap_checklist_media_${year}_${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      const headers = [
        'Nama Brand Ambassador',
        'Bulan',
        'Tahun',
        'Target Bulanan',
        'Realisasi Konten',
        'Selisih Target',
        'Progress',
        'Status'
      ];

      const rows = baTargets.map(ba => {
        const target = ba.target_bulanan;
        const updates = baUpdates.filter(u => u.ba_id === ba.id);
        const completed = updates.reduce((sum, u) => sum + u.realisasi, 0);
        const diff = completed - target;
        const progressPct = Math.min(Math.round((completed / target) * 100), 100) || 0;
        const statusTarget = diff < 0 ? `Minus ${Math.abs(diff)}` : diff === 0 ? 'Tercapai' : `Over ${diff}`;

        return [
          ba.nama_ba,
          month,
          year,
          target,
          completed,
          diff,
          `${progressPct}%`,
          statusTarget
        ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `rekap_target_ba_${year}_${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rekap Bulanan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Laporan performa harian dan target bulanan.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
            value={month} 
            onChange={e => setMonth(parseInt(e.target.value))}
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          <input 
            type="number" 
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
            value={year} 
            onChange={e => setYear(parseInt(e.target.value))} 
          />
          <Button variant="secondary" onClick={exportToCSV}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'checklist'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
        >
          Checklist Harian (Media)
        </button>
        <button
          onClick={() => setActiveTab('target')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'target'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
        >
          Target Konten Brand Ambassador
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="text-center text-slate-500 py-12">Memuat data...</p>
        ) : activeTab === 'checklist' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: '1000px' }}>
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Akun/Media</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Hari Terisi</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Wajib</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Selesai</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Bolong</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Bolong Slide 2</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Bolong Caption</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Bolong Story</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Bolong Reels</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Paling Sering</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center text-slate-500 py-12 dark:text-slate-450">Tidak ada data media aktif.</td>
                  </tr>
                ) : (
                  accounts.map(acc => {
                    const today = new Date();
                    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
                    const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && (month < today.getMonth() + 1));
                    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
                    
                    let daysToCount = isCurrentMonth ? today.getDate() : (isPastMonth ? daysInMonth : 0);
                    if (acc.created_at) {
                      const createdAt = new Date(acc.created_at);
                      if (createdAt.getFullYear() === year && (createdAt.getMonth() + 1) === month) {
                        const startDay = createdAt.getDate();
                        const endDay = isCurrentMonth ? today.getDate() : daysInMonth;
                        daysToCount = Math.max(0, endDay - startDay + 1);
                      } else if (createdAt.getFullYear() > year || (createdAt.getFullYear() === year && (createdAt.getMonth() + 1) > month)) {
                        daysToCount = 0;
                      }
                    }

                    let reqCount = 0;
                    if (acc.req_slide_2) reqCount++;
                    if (acc.req_caption) reqCount++;
                    if (acc.req_story) reqCount++;
                    if (acc.req_reels) reqCount++;

                    const totalWajib = daysToCount * reqCount;
                    
                    const cls = checklistData[acc.id] || [];
                    const totalHariTerisi = cls.length;
                    const missingDays = Math.max(daysToCount - totalHariTerisi, 0);

                    let checked = 0;
                    let bolongSlide2 = acc.req_slide_2 ? missingDays : 0;
                    let bolongCaption = acc.req_caption ? missingDays : 0;
                    let bolongStory = acc.req_story ? missingDays : 0;
                    let bolongReels = acc.req_reels ? missingDays : 0;

                    cls.forEach(c => {
                      if (acc.req_slide_2) {
                        if (c.slide_2) { checked++; } else { bolongSlide2++; }
                      }
                      if (acc.req_caption) {
                        if (c.caption) { checked++; } else { bolongCaption++; }
                      }
                      if (acc.req_story) {
                        if (c.story) { checked++; } else { bolongStory++; }
                      }
                      if (acc.req_reels) {
                        if (c.reels) { checked++; } else { bolongReels++; }
                      }
                    });
                    const bolong = totalWajib - checked;

                    const activeBolongs: { label: string; count: number }[] = [];
                    if (acc.req_slide_2) activeBolongs.push({ label: 'Slide 2', count: bolongSlide2 });
                    if (acc.req_caption) activeBolongs.push({ label: 'Caption', count: bolongCaption });
                    if (acc.req_story) activeBolongs.push({ label: 'Story', count: bolongStory });
                    if (acc.req_reels) activeBolongs.push({ label: 'Reels', count: bolongReels });

                    const maxBolong = activeBolongs.length > 0 ? Math.max(...activeBolongs.map(x => x.count)) : 0;
                    const bolongList: string[] = [];
                    if (maxBolong > 0) {
                      activeBolongs.forEach(x => {
                        if (x.count === maxBolong) bolongList.push(x.label);
                      });
                    }
                    const palingSering = bolongList.length > 0 ? bolongList.join(', ') : '-';
                    const statusChecklist = bolong > 0 ? 'Bolong' : 'Aman';

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300">{totalHariTerisi}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300">{totalWajib}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-green-600 font-bold dark:text-green-400">{checked}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-red-600 font-bold dark:text-red-400">{bolong}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400">{bolongSlide2}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400">{bolongCaption}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400">{bolongStory}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400">{bolongReels}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400" style={{ maxWidth: '120px', wordBreak: 'break-word' }}>
                          {palingSering}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusChecklist === 'Aman' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                            {statusChecklist}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: '700px' }}>
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Brand Ambassador</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Target Bulanan</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Realisasi Konten</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Selisih Target</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Progress</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {baTargets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-12 dark:text-slate-450">Tidak ada data target BA.</td>
                  </tr>
                ) : (
                  baTargets.map(ba => {
                    const target = ba.target_bulanan;
                    const updates = baUpdates.filter(u => u.ba_id === ba.id);
                    const completed = updates.reduce((sum, u) => sum + u.realisasi, 0);
                    const diff = completed - target;
                    const progressPct = Math.min(Math.round((completed / target) * 100), 100) || 0;

                    return (
                      <tr key={ba.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{ba.nama_ba}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300">{target}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300 font-semibold">{completed}</td>
                        <td className={`px-4 py-4 whitespace-nowrap text-center text-sm font-bold ${diff < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300 font-semibold">{progressPct}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${diff < 0 ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' : diff === 0 ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'}`}>
                            {diff < 0 ? `Minus ${Math.abs(diff)}` : diff === 0 ? 'Tercapai' : `Over ${diff}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
