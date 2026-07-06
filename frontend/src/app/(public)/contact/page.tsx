import InfoPage from '@/components/common/InfoPage';
import { FiGithub, FiGlobe, FiMail } from 'react-icons/fi';

export default function ContactPage() {
  return (
    <InfoPage
      badge="ارتباط با ما"
      title="راه‌های ارتباط با تیم شهباز"
      description="برای پیشنهاد، گزارش مشکل یا همکاری، از مسیرهای زیر می‌توانید با سازنده پروژه در ارتباط باشید."
      items={[
        'ایمیل رسمی پروژه برای پیام‌های مستقیم و گزارش‌های مهم فعال است.',
        'صفحه GitHub برای مشاهده تیم و توسعه‌های بعدی در دسترس قرار دارد.',
        'سایت تیم شهباز مرجع معرفی سازنده و پروژه‌های مرتبط است.',
        'گزارش باگ‌های دقیق، شامل مسیر صفحه و توضیح مشکل، روند رفع ایراد را سریع‌تر می‌کند.',
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <a href="mailto:ShahBazTeam@proton.me" className="glass rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
          <FiMail className="mb-4 h-7 w-7 text-rose-400" />
          <h2 className="font-black">ایمیل</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">ShahBazTeam@proton.me</p>
        </a>
        <a href="https://github.com/ShahBazTeam" target="_blank" rel="noopener noreferrer" className="glass rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
          <FiGithub className="mb-4 h-7 w-7 text-rose-400" />
          <h2 className="font-black">GitHub</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">ShahBazTeam</p>
        </a>
        <a href="https://shahbazteam.ir/" target="_blank" rel="noopener noreferrer" className="glass rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
          <FiGlobe className="mb-4 h-7 w-7 text-rose-400" />
          <h2 className="font-black">وب‌سایت</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">shahbazteam.ir</p>
        </a>
      </div>
    </InfoPage>
  );
}
