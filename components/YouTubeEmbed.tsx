"use client";

export function YouTubeEmbed() {
    return (
        <div className="mt-12 w-full">
            <div className="relative w-full aspect-video">
                <iframe 
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                    src="https://www.youtube.com/embed/unfvbwYjbSA?si=Ocn9YfysYAwVx6lL" 
                    title="YouTube video player" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            </div>
        </div>
    );
} 