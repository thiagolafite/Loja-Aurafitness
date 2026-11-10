import React from 'react';
import { HeroBannerSlide } from '../types';

export function getImageInlineStyle(
  side: 'left' | 'right',
  slide: Partial<HeroBannerSlide>
): React.CSSProperties {
  const isLeft = side === 'left';
  const scale = (isLeft ? slide.leftImageScale : slide.rightImageScale) ?? 100;
  const posX = (isLeft ? slide.leftImagePositionX : slide.rightImagePositionX) ?? 50;
  const posY = (isLeft ? slide.leftImagePositionY : slide.rightImagePositionY) ?? 20;
  const fit = (isLeft ? slide.leftImageFit : slide.rightImageFit) || 'cover';
  const brightness = (isLeft ? slide.leftImageBrightness : slide.rightImageBrightness) ?? 100;
  const contrast = (isLeft ? slide.leftImageContrast : slide.rightImageContrast) ?? 100;
  const saturate = (isLeft ? slide.leftImageSaturate : slide.rightImageSaturate) ?? 100;
  const blur = (isLeft ? slide.leftImageBlur : slide.rightImageBlur) ?? 0;
  const grayscale = (isLeft ? slide.leftImageGrayscale : slide.rightImageGrayscale) ?? 0;
  const sepia = (isLeft ? slide.leftImageSepia : slide.rightImageSepia) ?? 0;
  const opacity = (isLeft ? slide.leftImageOpacity : slide.rightImageOpacity) ?? 100;
  const flipX = (isLeft ? slide.leftImageFlipX : slide.rightImageFlipX) || false;

  const filters = [
    brightness !== 100 ? `brightness(${brightness}%)` : '',
    contrast !== 100 ? `contrast(${contrast}%)` : '',
    saturate !== 100 ? `saturate(${saturate}%)` : '',
    blur > 0 ? `blur(${blur}px)` : '',
    grayscale > 0 ? `grayscale(${grayscale}%)` : '',
    sepia > 0 ? `sepia(${sepia}%)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const transforms = [
    scale !== 100 ? `scale(${scale / 100})` : '',
    flipX ? 'scaleX(-1)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    objectFit: fit,
    objectPosition: `${posX}% ${posY}%`,
    filter: filters || undefined,
    transform: transforms || undefined,
    opacity: opacity < 100 ? opacity / 100 : undefined,
    transition: 'all 0.2s ease',
  };
}

export function getBannerBackgroundStyle(slide: Partial<HeroBannerSlide>): React.CSSProperties {
  const primary =
    slide.centerBgColor ||
    (slide.bannerStyle === 'editorial-light'
      ? '#f5f5f3'
      : slide.bannerStyle === 'bold-dark'
      ? '#0b1610'
      : '#123922');

  if (slide.backgroundType === 'gradient' && slide.bgGradientEndColor) {
    const dir = slide.gradientDirection || 'to-r';
    const cssDir =
      dir === 'to-r' ? 'to right' : dir === 'to-b' ? 'to bottom' : 'to bottom right';
    return {
      background: `linear-gradient(${cssDir}, ${primary}, ${slide.bgGradientEndColor})`,
    };
  }
  return {
    backgroundColor: primary,
  };
}

export function getBannerHeightClass(height?: 'compact' | 'normal' | 'tall'): string {
  if (height === 'compact') return 'h-[300px] sm:h-[350px] md:h-[420px] lg:h-[460px]';
  if (height === 'tall') return 'h-[380px] sm:h-[440px] md:h-[580px] lg:h-[640px]';
  return 'h-[340px] sm:h-[390px] md:h-[500px] lg:h-[540px]';
}

export function getBannerButtonStyle(slide: Partial<HeroBannerSlide>): React.CSSProperties {
  const bg = slide.buttonBgColor || undefined;
  const color = slide.buttonTextColor || undefined;
  const border = slide.buttonBorderColor ? `1px solid ${slide.buttonBorderColor}` : undefined;
  const shadow = slide.buttonGlow
    ? `0 0 18px ${slide.buttonBgColor || '#E5A93C'}80`
    : undefined;
  return {
    backgroundColor: bg,
    color,
    border,
    boxShadow: shadow,
  };
}

export function getBannerButtonRadiusClass(
  radius?: 'rounded-full' | 'rounded-2xl' | 'rounded-xl' | 'rounded-none'
): string {
  if (radius === 'rounded-2xl') return 'rounded-2xl';
  if (radius === 'rounded-xl') return 'rounded-xl';
  if (radius === 'rounded-none') return 'rounded-none';
  return 'rounded-full';
}

export function resolveTitleFontSize(size?: number | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): string | undefined {
  if (!size) return undefined;
  if (typeof size === 'number') return `${size}px`;
  const map: Record<string, string> = {
    sm: '28px',
    md: '36px',
    lg: '44px',
    xl: '52px',
    '2xl': '60px',
  };
  return map[size] || size;
}

export function resolveMobileTitleFontSize(size?: number | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): string | undefined {
  if (!size) return undefined;
  if (typeof size === 'number') return `${Math.min(size, 20)}px`;
  const map: Record<string, string> = {
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '19px',
    '2xl': '21px',
  };
  return map[size] || '17px';
}
