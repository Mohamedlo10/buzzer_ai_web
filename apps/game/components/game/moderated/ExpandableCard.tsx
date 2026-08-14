import { useState, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { palette } from '~/lib/theme/tokens';

export interface ExpandableCardProps {
  icon: ReactNode;
  label: string;
  content: string;
  subContent?: string;
  bgColor: string;
  borderColor: string;
  isBold?: boolean;
}

export function ExpandableCard({ icon, label, content, subContent, bgColor, borderColor, isBold = false }: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      style={{ flex: 1, backgroundColor: bgColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          {icon}
        </View>
        <Text style={{ color: palette.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
      </View>

      <Text style={{ color: palette.txt, fontSize: 16, lineHeight: 24, fontWeight: isBold ? '700' : '400' }} numberOfLines={!expanded ? 6 : undefined}>
        {content}
      </Text>

      {subContent && (
        <Text style={{ color: palette.inkSoft, fontSize: 12, marginTop: 8, lineHeight: 18 }} numberOfLines={!expanded ? 4 : undefined}>
          {subContent}
        </Text>
      )}
    </TouchableOpacity>
  );
}
