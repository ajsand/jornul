import React from 'react';
import { FileText, Image, Music, Video, FileCode, Link, File } from 'lucide-react-native';
import { MediaType } from '@/lib/storage/types';

interface TypeIconProps {
  type: MediaType;
  size?: number;
  color?: string;
}

export function TypeIcon({ type, size = 24, color = '#666' }: TypeIconProps) {
  switch (type) {
    case 'text':
      return <FileText size={size} color={color} />;
    case 'image':
      return <Image size={size} color={color} />;
    case 'audio':
      return <Music size={size} color={color} />;
    case 'video':
      return <Video size={size} color={color} />;
    case 'pdf':
      return <FileCode size={size} color={color} />;
    case 'url':
      return <Link size={size} color={color} />;
    default:
      return <File size={size} color={color} />;
  }
}

