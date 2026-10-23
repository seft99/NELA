import { siteConfig } from "@/config/site";

export function AnnouncementBar() {
  if (!siteConfig.announcement.enabled) return null;
  return (
    <div className="announcement-bar" role="status">
      <div className="announcement-items">
        {siteConfig.announcement.items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
