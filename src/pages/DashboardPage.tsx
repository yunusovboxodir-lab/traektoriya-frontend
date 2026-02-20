import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { NudgesWidget } from '../components/dashboard/NudgesWidget';
import { LearningRankWidget } from '../components/dashboard/LearningRankWidget';
import { useT, useLangStore } from '../stores/langStore';

interface OverviewStatsRaw {
  users?: { total?: number };
  courses?: { total?: number };
  tasks?: { total?: number };
  products?: { total?: number };
  // fallback flat shape
  total_products?: number;
  total_users?: number;
  total_courses?: number;
  total_tasks?: number;
}

interface OverviewStats {
  total_products: number;
  total_users: number;
  total_courses: number;
  total_tasks: number;
}

function normalizeOverview(raw: OverviewStatsRaw): OverviewStats {
  return {
    total_products: raw.products?.total ?? raw.total_products ?? 0,
    total_users: raw.users?.total ?? raw.total_users ?? 0,
    total_courses: raw.courses?.total ?? raw.total_courses ?? 0,
    total_tasks: raw.tasks?.total ?? raw.total_tasks ?? 0,
  };
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  useEffect(() => {
    const role = user?.role;
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'commercial_dir' || role === 'regional_manager';

    if (isAdmin) {
      // Admin roles can access full analytics
      api
        .get<OverviewStatsRaw>('/api/v1/analytics/overview')
        .then((res) => setStats(normalizeOverview(res.data)))
        .catch(() => {
          setStats({ total_products: 0, total_users: 0, total_courses: 0, total_tasks: 0 });
        });
    } else {
      // Non-admin: fetch counts from public endpoints
      Promise.all([
        api.get('/api/v1/products', { params: { limit: 1 } }).catch(() => ({ data: { total: 0 } })),
        api.get('/api/v1/tasks').catch(() => ({ data: [] })),
        api.get('/api/v1/learning/map').catch(() => ({ data: { sections: [] } })),
      ]).then(([productsRes, tasksRes, learningRes]) => {
        const totalProducts = (productsRes.data as any)?.total ?? (productsRes.data as any)?.length ?? 0;
        const totalTasks = Array.isArray(tasksRes.data) ? tasksRes.data.length : (tasksRes.data as any)?.total ?? 0;
        const sections = (learningRes.data as any)?.sections ?? learningRes.data ?? [];
        const totalCourses = Array.isArray(sections)
          ? sections.reduce((sum: number, s: any) => sum + (s.courses?.length ?? 0), 0)
          : 0;
        setStats({
          total_products: totalProducts,
          total_users: 0,
          total_courses: totalCourses,
          total_tasks: totalTasks,
        });
      });
    }
  }, [user?.role]);

  const today = new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statCards = [
    {
      label: t('dashboard.stats.products'),
      value: stats?.total_products,
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      label: t('dashboard.stats.users'),
      value: stats?.total_users,
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: t('dashboard.stats.courses'),
      value: stats?.total_courses,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
    },
    {
      label: t('dashboard.stats.tasks'),
      value: stats?.total_tasks,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
  ];

  const navCards = [
    {
      title: t('nav.learning'),
      desc: t('dashboard.cards.learningDesc'),
      path: '/learning',
      gradient: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      title: t('nav.products'),
      desc: t('dashboard.cards.productsDesc'),
      path: '/products',
      gradient: 'from-cyan-500 to-cyan-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      title: t('nav.tasks'),
      desc: t('dashboard.cards.tasksDesc'),
      path: '/tasks',
      gradient: 'from-amber-500 to-amber-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      title: t('nav.team'),
      desc: t('dashboard.cards.teamDesc'),
      path: '/team',
      gradient: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      title: t('nav.assessments'),
      desc: t('dashboard.cards.assessmentsDesc'),
      path: '/assessments',
      gradient: 'from-rose-500 to-rose-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
    },
    {
      title: t('nav.generation'),
      desc: t('dashboard.cards.generationDesc'),
      path: '/generation',
      gradient: 'from-indigo-500 to-indigo-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
    },
    {
      title: t('nav.planogram'),
      desc: t('dashboard.cards.planogramDesc'),
      path: '/planogram',
      gradient: 'from-purple-500 to-purple-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      ),
    },
    {
      title: t('nav.analytics'),
      desc: t('dashboard.cards.analyticsDesc'),
      path: '/analytics',
      gradient: 'from-teal-500 to-teal-600',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-5 sm:p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {t('dashboard.welcome')}{user?.full_name ? `, ${user.full_name}` : ''}!
              </h1>
              <p className="mt-1 text-blue-100">{today}</p>
              <p className="mt-3 max-w-lg text-sm text-blue-200">
                {t('dashboard.platformDesc')}
              </p>
            </div>
            {user?.role && (
              <span className="inline-flex h-fit items-center gap-1.5 self-start rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t(`roles.${user.role}`)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-4 rounded-xl ${card.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.text} bg-white shadow-sm`}>
              {card.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${card.text}`}>
                {card.value !== undefined ? card.value : '---'}
              </p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Cards ── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">{t('dashboard.sections')}</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {navCards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:shadow-lg hover:ring-gray-200 group-hover:-translate-y-0.5">
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md transition-transform duration-200 group-hover:scale-110`}
                >
                  {card.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {card.desc}
                </p>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Learning Rank Widget ── */}
      <LearningRankWidget />

      {/* ── Nudges Widget ── */}
      <NudgesWidget />
    </div>
  );
}
