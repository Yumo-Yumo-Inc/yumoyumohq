import Image from "next/image";

interface AvatarImageProps {
  src: string;
  className?: string;
}

export function AvatarImage({ src, className }: AvatarImageProps) {
  return (
    <Image
      src={src}
      alt=""
      width={96}
      height={96}
      className={className}
      unoptimized
    />
  );
}
