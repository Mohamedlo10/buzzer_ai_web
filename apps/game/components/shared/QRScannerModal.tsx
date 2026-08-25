import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, QrCode, Camera, AlertCircle } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

function extractCode(raw: string): string {
  try {
    // Check if it's a URL
    if (raw.includes('/join/room/')) {
      const match = raw.match(/\/join\/room\/([A-Z0-9]+)/i);
      if (match) return match[1].toUpperCase();
    }
    if (raw.includes('/join/session/')) {
      const match = raw.match(/\/join\/session\/([A-Z0-9]+)/i);
      if (match) return match[1].toUpperCase();
    }
    if (raw.includes('/session/')) {
      const match = raw.match(/\/session\/([A-Z0-9]+)/i);
      if (match) return match[1].toUpperCase();
    }
  } catch {}
  return raw.trim().toUpperCase();
}

export function QRScannerModal({ visible, onClose, onScan }: QRScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!visible) return null;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const code = extractCode(data);
    onScan(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <QrCode size={22} color={palette.primary} />
            <Text style={styles.headerTitle}>Scanner un QR code</Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Camera or Permission Content */}
        {!permission ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerBox}>
            <Camera size={48} color={palette.inkSoft} />
            <Text style={styles.permTitle}>Accès à l'appareil photo requis</Text>
            <Text style={styles.permDesc}>
              Pour scanner des QR codes et rejoindre des salons ou des parties, autorisez l'appareil photo.
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              activeOpacity={0.8}
              style={styles.permBtn}
            >
              <Text style={styles.permBtnText}>Autoriser la caméra</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Target Reticle Overlay */}
            <View style={styles.overlay}>
              <View style={styles.reticle}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </View>
              <Text style={styles.hintText}>
                Cadrez le QR code à l'intérieur du repère
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permDesc: {
    color: '#A0A0A0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  permBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  permBtnText: {
    color: palette.primaryInk,
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 24,
  },
  reticle: {
    width: 250,
    height: 250,
    borderRadius: 24,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: palette.primary,
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  hintText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
});
