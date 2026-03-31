"use client";

import type { VideoEmbed as VideoEmbedType } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractRutubeId(url: string): string | null {
  const match = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
  return match?.[1] ?? null;
}

function getEmbedUrl(video: VideoEmbedType): string | null {
  if (video.platform === "youtube") {
    const id = extractYoutubeId(video.url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (video.platform === "rutube") {
    const id = extractRutubeId(video.url);
    return id ? `https://rutube.ru/play/embed/${id}` : null;
  }
  return null;
}

function VideoEmbedCard({ video }: { video: VideoEmbedType }) {
  const embedUrl = getEmbedUrl(video);
  if (!embedUrl) return null;

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={video.title ?? "Видео"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full rounded-lg"
        />
      </div>
      {video.title && (
        <h3 className="mt-2 text-sm font-medium">{video.title}</h3>
      )}
    </div>
  );
}

interface VideoGalleryProps {
  videos: VideoEmbedType[];
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const validVideos = videos.filter((v) => getEmbedUrl(v) !== null);
  if (validVideos.length === 0) return null;

  if (validVideos.length === 1) {
    return <VideoEmbedCard video={validVideos[0]} />;
  }

  return (
    <div className="mx-auto max-w-[calc(100%-6rem)]">
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent>
          {validVideos.map((video) => (
            <CarouselItem key={video.id} className="md:basis-1/2">
              <VideoEmbedCard video={video} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
