import {
  Users,
  Activity,
  UserPlus,
  UserMinus,
  Globe,
  FileText,
  Image as ImageIcon,
  MessagesSquare,
  Tag,
  ClipboardList,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminStats } from '../../api/useAdminStats';
import { StatCard } from './StatCard';
import s from './OverviewTab.module.css';

/**
 * 12.1 — admin dashboard. 4 sekce stat-karet (Uživatelé / Světy / Obsah /
 * Fronta) + rozcestník na hloubkové nástroje. Snapshot z `GET /admin/stats/overview`.
 */
export function OverviewTab() {
  const { data, isLoading, isError } = useAdminStats();
  const loading = isLoading;
  const u = data?.users;
  const c = data?.content;

  let idx = 0;
  const next = () => idx++;

  return (
    <div className={s.wrap}>
      {isError && (
        <p className={s.error} role="alert">
          Statistiky se nepodařilo načíst. Zkus obnovit stránku.
        </p>
      )}

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Uživatelé</h2>
        <div className={s.grid}>
          <StatCard
            label="Celkem"
            value={u?.total ?? 0}
            icon={<Users />}
            index={next()}
            loading={loading}
          />
          <StatCard
            label="Aktivní (24 h)"
            value={u?.online ?? 0}
            icon={<Activity />}
            index={next()}
            loading={loading}
          />
          <StatCard
            label="Noví (7 dní)"
            value={u?.newLast7Days ?? 0}
            icon={<UserPlus />}
            index={next()}
            loading={loading}
          />
          <StatCard
            label="Čeká na smazání"
            value={u?.pendingDeletion ?? 0}
            icon={<UserMinus />}
            tone={(u?.pendingDeletion ?? 0) > 0 ? 'accent' : 'default'}
            index={next()}
            loading={loading}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Světy</h2>
        <div className={s.grid}>
          <StatCard
            label="Celkem světů"
            value={data?.worlds.total ?? 0}
            icon={<Globe />}
            index={next()}
            loading={loading}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Obsah</h2>
        <div className={s.grid}>
          <StatCard
            label="Články"
            value={c?.articles ?? 0}
            icon={<FileText />}
            index={next()}
            loading={loading}
          />
          <StatCard
            label="Obrázky v galerii"
            value={c?.galleryImages ?? 0}
            icon={<ImageIcon />}
            index={next()}
            loading={loading}
          />
          <StatCard
            label="Diskuze"
            value={c?.discussions ?? 0}
            icon={<MessagesSquare />}
            index={next()}
            loading={loading}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Fronta</h2>
        <div className={s.grid}>
          <StatCard
            label="Žádosti o username"
            value={data?.queue.pendingUsernameRequests ?? 0}
            icon={<Tag />}
            to="/ikaros/uzivatele?tab=zpracovat"
            tone={
              (data?.queue.pendingUsernameRequests ?? 0) > 0
                ? 'accent'
                : 'default'
            }
            index={next()}
            loading={loading}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Rychlé odkazy</h2>
        <div className={s.links}>
          <Link to="/admin?tab=uzivatele" className={s.linkCard}>
            <ShieldCheck className={s.linkIcon} aria-hidden />
            <span>Správa uživatelů</span>
          </Link>
          <Link to="/admin?tab=audit" className={s.linkCard}>
            <ClipboardList className={s.linkIcon} aria-hidden />
            <span>Audit log</span>
          </Link>
          <Link to="/ikaros/uzivatele?tab=zpracovat" className={s.linkCard}>
            <Tag className={s.linkIcon} aria-hidden />
            <span>Zpracovat frontu</span>
          </Link>
          <Link to="/admin?tab=search-index" className={s.linkCard}>
            <Search className={s.linkIcon} aria-hidden />
            <span>Index vyhledávání</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
