import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

type Props = {
  src: string;
  title?: string;
};

export default function AudioPlayer({ src, title }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        // autoplay blocked or other issue
        console.error('Audio play failed', e);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setProgress(time);
  };

  const formatTime = (t: number) => {
    if (!t || Number.isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          onClick={togglePlay}
          className="flex items-center justify-center w-12 h-12 rounded-md bg-green-600 text-white hover:brightness-95"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">{title ?? 'Audio Lesson'}</div>
            <div className="text-sm text-gray-500">{formatTime(progress)} / {formatTime(duration)}</div>
          </div>

          <input
            aria-label="Audio progress"
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="w-full mt-3 accent-green-600"
          />

          <div className="flex items-center gap-2 mt-3">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-32"
            />
            <audio ref={audioRef} src={src} preload="metadata" />
          </div>
        </div>
      </div>
    </div>
  );
}
