import { siteConfig } from "@/config/site";

export function AnnouncementBar() {
  if (!siteConfig.announcement.enabled) return null;
  return (
    <div className="announcement-bar" role="status">
      <span className="announcement-line" aria-hidden="true" />
      <p>{siteConfig.announcement.text}</p>
      <span className="announcement-line" aria-hidden="true" />
    </div>
  );
}
