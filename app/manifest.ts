import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scheduler — Đặt phòng họp",
    short_name: "Scheduler",
    description: "Hệ thống đặt phòng họp nội bộ",
    start_url: "/calendar",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#059669",
    lang: "vi",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icon0", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon1", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon0", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Đặt lịch mới",
        short_name: "Đặt lịch",
        description: "Tạo cuộc họp mới",
        url: "/bookings/new",
      },
      {
        name: "Phòng trống",
        short_name: "Phòng",
        description: "Xem phòng đang trống",
        url: "/calendar/resource",
      },
    ],
  };
}
