import { useState, useEffect } from 'react';
import { supabase, Account, DailyChecklist, BATarget, BAProgress } from '../lib/supabase';
import { format, getMonth, getYear, getDaysInMonth } from 'date-fns';
import { Users, CheckSquare, Target, TrendingUp, AlertCircle, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';

export default function Dashboard() {
  const [currentDate] = useState(new Date());
  const month = getMonth(currentDate) + 1;
  const year = getYear(currentDate);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalChecklistWajib: 0,
    totalChecklistSelesai: 0,
    totalChecklistBolong: 0,
    totalTargetKonten: 0,
    totalKontenSelesai: 0,
    totalKekurangan: 0,
    baTercapai: 0,
    baMinus: 0,
    progressPercentage: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const daysInMonth = getDaysInMonth(new Date(year, month - 1));
      const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

      // Run queries concurrently
      const [accResponse, checkResponse, baTargetsResponse, baUpdatesResponse] = await Promise.all([
        supabase.from('content_accounts').select('id, req_slide_2, req_caption, req_story, req_reels, created_at').eq('is_active', true),
        supabase.from('daily_checklists').select('*').gte('checklist_date', startDate).lte('checklist_date', endDate),
        supabase.from('content_ba_targets').select('*'),
        supabase.from('content_ba_daily_updates').select('*').gte('tanggal', startDate).lte('tanggal', endDate)
      ]);

      const accData = accResponse.data;
      const totalAccounts = accData?.length || 0;
      const checkData = checkResponse.data;
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
      const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && (month < today.getMonth() + 1));
      const daysToCount = isCurrentMonth ? today.getDate() : (isPastMonth ? daysInMonth : 0);

      let totalChecklistWajib = 0;
      let totalChecklistSelesai = 0;

      const checkMap = new Map();
      if (checkData) {
        checkData.forEach(c => {
          if (!checkMap.has(c.account_id)) checkMap.set(c.account_id, []);
          checkMap.get(c.account_id).push(c);
        });
      }

      const accMap = new Map();
      if (accData) {
        accData.forEach(a => {
          accMap.set(a.id, a);
          let countReq = 0;
          if (a.req_slide_2) countReq++;
          if (a.req_caption) countReq++;
          if (a.req_story) countReq++;
          if (a.req_reels) countReq++;
          
          let daysToCount = isCurrentMonth ? today.getDate() : (isPastMonth ? daysInMonth : 0);
          if (a.created_at) {
            const createdAt = new Date(a.created_at);
            if (createdAt.getFullYear() === year && (createdAt.getMonth() + 1) === month) {
              const startDay = createdAt.getDate();
              const endDay = isCurrentMonth ? today.getDate() : daysInMonth;
              daysToCount = Math.max(0, endDay - startDay + 1);
            } else if (createdAt.getFullYear() > year || (createdAt.getFullYear() === year && (createdAt.getMonth() + 1) > month)) {
              daysToCount = 0;
            }
          }
          
          const cls = checkMap.get(a.id) || [];
          const totalHariTerisi = cls.length;
          
          daysToCount = Math.max(daysToCount, totalHariTerisi);
          totalChecklistWajib += daysToCount * countReq;
        });
      }

      if (checkData) {
        checkData.forEach(c => {
          const acc = accMap.get(c.account_id);
          if (acc) {
            if (acc.req_slide_2 && c.slide_2) totalChecklistSelesai++;
            if (acc.req_caption && c.caption) totalChecklistSelesai++;
            if (acc.req_story && c.story) totalChecklistSelesai++;
            if (acc.req_reels && c.reels) totalChecklistSelesai++;
          }
        });
      }

      const totalChecklistBolong = Math.max(totalChecklistWajib - totalChecklistSelesai, 0);

      const baTargetsData = baTargetsResponse.data;
      const baUpdatesData = baUpdatesResponse.data;

      let totalTargetKonten = 0;
      let totalKontenSelesai = 0;
      let baTercapai = 0;
      let baMinus = 0;
      let totalKekurangan = 0;

      const completedUpdatesMap: Record<string, number> = {};
      if (baUpdatesData) {
        baUpdatesData.forEach(u => {
          completedUpdatesMap[u.ba_id] = (completedUpdatesMap[u.ba_id] || 0) + u.realisasi;
        });
      }

      if (baTargetsData) {
        baTargetsData.forEach(ba => {
          const target = ba.target_bulanan;
          const completed = completedUpdatesMap[ba.id] || 0;
          totalTargetKonten += target;
          totalKontenSelesai += completed;

          const diff = target - completed;
          if (diff <= 0) {
            baTercapai++;
          } else {
            baMinus++;
            totalKekurangan += diff;
          }
        });
      }

      const progressPercentage = totalTargetKonten > 0 
        ? Math.min(Math.round((totalKontenSelesai / totalTargetKonten) * 100), 100) 
        : 0;

      setStats({
        totalAccounts,
        totalChecklistWajib,
        totalChecklistSelesai,
        totalChecklistBolong,
        totalTargetKonten,
        totalKontenSelesai,
        totalKekurangan,
        baTercapai,
        baMinus,
        progressPercentage
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, subtitle, colorClass }: any) => (
    <Card className="flex items-center gap-4">
      <div className={`p-4 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </Card>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan performa konten bulan {format(currentDate, 'MMMM yyyy')}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-12">Memuat data dashboard...</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Statistik Checklist Harian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Akun Aktif" 
                value={stats.totalAccounts} 
                icon={<Users size={24} className="text-blue-600" />} 
                colorClass="bg-blue-50 dark:bg-blue-950/20"
              />
              <StatCard 
                title="Checklist Selesai" 
                value={stats.totalChecklistSelesai} 
                icon={<CheckSquare size={24} className="text-green-600" />} 
                colorClass="bg-green-50 dark:bg-green-950/20"
                subtitle={`Dari total ${stats.totalChecklistWajib} wajib`}
              />
              <StatCard 
                title="Checklist Bolong" 
                value={stats.totalChecklistBolong} 
                icon={<AlertCircle size={24} className="text-red-600" />} 
                colorClass="bg-red-50 dark:bg-red-950/20"
              />
              <StatCard 
                title="Progress Harian" 
                value={`${stats.totalChecklistWajib > 0 ? Math.round((stats.totalChecklistSelesai / stats.totalChecklistWajib) * 100) : 0}%`} 
                icon={<TrendingUp size={24} className="text-indigo-600" />} 
                colorClass="bg-indigo-50 dark:bg-indigo-950/20"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Statistik Target Bulanan (BA)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Target Konten" 
                value={stats.totalTargetKonten} 
                icon={<Target size={24} className="text-blue-600" />} 
                colorClass="bg-blue-50 dark:bg-blue-950/20"
              />
              <StatCard 
                title="Konten Selesai" 
                value={stats.totalKontenSelesai} 
                icon={<CheckSquare size={24} className="text-green-600" />} 
                colorClass="bg-green-50 dark:bg-green-950/20"
                subtitle={`${stats.progressPercentage}% Tercapai`}
              />
              <StatCard 
                title="Kekurangan Konten" 
                value={stats.totalKekurangan} 
                icon={<AlertCircle size={24} className="text-red-600" />} 
                colorClass="bg-red-50 dark:bg-red-950/20"
              />
              <Card className="flex flex-col justify-center space-y-2">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-green-600" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{stats.baTercapai} BA</span>
                  <span className="text-xs text-slate-500">Capai Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="font-bold text-sm text-slate-750 dark:text-slate-350">{stats.baMinus} BA</span>
                  <span className="text-xs text-slate-500">Minus Target</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
