"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  imageUrl?: string | null;
  colorHex: string;
  alt: string;
  size?: number;
}

export function StoneAvatar({ imageUrl, colorHex, alt, size = 128 }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: `${colorHex}33` }}
    >
      {showImage ? (
        <Image
          src={imageUrl!}
          alt={`${alt} 실버 펜던트 목걸이`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          aria-hidden="true"
          data-testid="stone-color-fallback"
          className="rounded-full"
          style={{
            width: size * 0.625,
            height: size * 0.625,
            backgroundColor: colorHex,
          }}
        />
      )}
    </div>
  );
}
