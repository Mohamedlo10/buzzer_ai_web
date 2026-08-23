import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { X, QrCode, Share2, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import * as qrcodeApi from '~/lib/api/qrcode';
import { palette } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'session' | 'room';
  id: string;
  code?: string;
  title?: string;
}

export function QRCodeModal({ visible, onClose, type, id, code, title }: QRCodeModalProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && id) {
      loadQRCode();
    }
  }, [visible, id, type]);

  const loadQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = type === 'session'
        ? await qrcodeApi.getSessionQR(id)
        : await qrcodeApi.getRoomQR(id);

      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImage(reader.result as string);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('Erreur lors du chargement du QR code');
        setIsLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger le QR code');
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    notify.success('Code copié dans le presse-papier !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const message = type === 'session'
      ? `Rejoins ma partie sur Xalaat ! Code: ${code}\nLien direct: buzzmaster://join/session/${code}`
      : `Rejoins mon salon sur Xalaat ! Code: ${code}\nLien direct: buzzmaster://join/room/${code}`;

    try {
      await Share.share({
        message,
        title: 'Invitation Xalaat',
      });
    } catch {}
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 24,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: palette.primary + '26',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={18} color={palette.primary} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: palette.txt }}>
                  {type === 'session' ? 'QR Code Partie' : 'QR Code Salon'}
                </Text>
                {title && (
                  <Text style={{ fontSize: 12, color: palette.inkSoft }}>{title}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={palette.inkSoft} />
            </TouchableOpacity>
          </View>

          {/* QR Image */}
          {isLoading ? (
            <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={{ color: palette.inkSoft, fontSize: 12 }}>Génération du QR code…</Text>
            </View>
          ) : error ? (
            <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Text style={{ color: palette.bad, fontSize: 13, textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity
                onPress={loadQRCode}
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: palette.surface2, borderRadius: 10 }}
              >
                <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 12 }}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : qrImage ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Image
                source={{ uri: qrImage }}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Code pill & copy action */}
          {code && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 16,
                paddingVertical: 10,
                width: '100%',
              }}
            >
              <View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: palette.inkSoft, textTransform: 'uppercase' }}>
                  Code d'accès
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: palette.txt, letterSpacing: 2 }}>
                  {code}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCopyCode}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: copied ? palette.good + '26' : palette.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: copied ? palette.good : palette.line,
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} color={palette.good} />
                    <Text style={{ color: palette.good, fontSize: 12, fontWeight: '700' }}>Copié !</Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color={palette.txt} />
                    <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>Copier</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Share Action */}
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            style={{
              backgroundColor: palette.primary,
              borderRadius: 14,
              paddingVertical: 12,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Share2 size={16} color={palette.primaryInk} />
            <Text style={{ color: palette.primaryInk, fontSize: 14, fontWeight: '700' }}>
              Partager l'invitation
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
