import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { QrCode, Copy, Share2, Check } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

export interface RoomCodeCardProps {
  code: string;
  qrImage: string | null;
  qrLoading: boolean;
  isCopied: boolean;
  showQrExpanded: boolean;
  membersCount: number;
  onCopy: () => void;
  onShare: () => void;
  onToggleQr: () => void;
}

export function RoomCodeCard({
  code,
  qrImage,
  qrLoading,
  isCopied,
  showQrExpanded,
  membersCount,
  onCopy,
  onShare,
  onToggleQr,
}: RoomCodeCardProps) {
  const shouldShowQr = membersCount <= 1 || showQrExpanded;

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 18,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* QR Code Container */}
      {shouldShowQr && (
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          {qrLoading ? (
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 20,
                backgroundColor: palette.bg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 8 }}>
                Génération du QR code...
              </Text>
            </View>
          ) : qrImage ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                padding: 10,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <Image
                source={{ uri: qrImage }}
                style={{ width: 140, height: 140 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 20,
                backgroundColor: palette.bg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <QrCode size={36} color={palette.inkSoft} />
            </View>
          )}

          {membersCount > 1 && (
            <TouchableOpacity
              onPress={onToggleQr}
              activeOpacity={0.7}
              style={{ marginTop: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: palette.inkSoft, textDecorationLine: 'underline' }}>
                Masquer le QR code
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Code Text with SAFE padding and lineHeight to prevent Boldonse clipping */}
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.inkSoft, textTransform: 'uppercase', marginBottom: 2 }}>
        Code du salon
      </Text>

      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 34,
          lineHeight: 46,
          letterSpacing: 4,
          color: palette.primary,
          paddingTop: 12,
          paddingBottom: 6,
          textAlign: 'center',
        }}
      >
        #{code}
      </Text>

      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          fontSize: 13,
          color: palette.inkSoft,
          marginBottom: 16,
        }}
      >
        Scannez ou partagez ce code pour rejoindre
      </Text>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
        <TouchableOpacity
          onPress={onCopy}
          activeOpacity={0.7}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 14,
            backgroundColor: isCopied ? `${palette.good}18` : palette.bg,
            borderWidth: 1,
            borderColor: isCopied ? palette.good : palette.line,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isCopied ? <Check size={16} color={palette.good} /> : <Copy size={16} color={palette.txt} />}
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: isCopied ? palette.good : palette.txt }}>
            {isCopied ? 'Copié !' : 'Copier'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShare}
          activeOpacity={0.7}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 14,
            backgroundColor: `${palette.primary}14`,
            borderWidth: 1,
            borderColor: `${palette.primary}33`,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Share2 size={16} color={palette.primary} />
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.primary }}>
            Partager
          </Text>
        </TouchableOpacity>

        {!shouldShowQr && (
          <TouchableOpacity
            onPress={onToggleQr}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: `${palette.gold}14`,
              borderWidth: 1,
              borderColor: `${palette.gold}33`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrCode size={18} color={palette.gold} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
