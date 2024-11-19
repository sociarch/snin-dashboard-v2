"use client";

function YouTubeEmbed() {
    return (
        <div className="aspect-video">
            <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/unfvbwYjbSA?si=xOMU_m4-bAqOI2Z4"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        </div>
    );
}

export default YouTubeEmbed; 