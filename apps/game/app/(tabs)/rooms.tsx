import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, ArrowRight, Zap, Users, QrCode } from 'lucide-react-native';
import { useRoomsData } from '~/lib/hooks/useRoomsData';
import { palette, font } from '~/lib/theme/tokens';
import { QRScannerModal } from '~/components/shared/QRScannerModal';
import { PatternZigzag } from '~/components/shared/PatternZigzag';
import { GlobalRankCard } from '~/components/shared/GlobalRankCard';
import { QuizOfTheDayCard } from '~/components/shared/QuizOfTheDayCard';
import { AllRoomsModal } from '~/components/shared/AllRoomsModal';
import { Avatar } from '~/components/shared/Avatar';
import { AppTopBar } from '~/components/shared/AppTopBar';

export default function RoomsScreen() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [showAllRoomsModal, setShowAllRoomsModal] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    recentRooms,
    rank,
    activeSessionInfo,
    showJoinModal,
    setShowJoinModal,
    code,
    setCode,
    isJoining,
    joinError,
    handleReconnectSession,
    handleJoinCode,
  } = useRoomsData({
    onNavigate: (path) => {
      router.push(path as any);
    },
  });

  if (isLoading && !data) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14, marginTop: 12, fontWeight: '600' }}>
          Chargement des salons...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 32 }}>😵</Text>
        </View>
        <Text style={{ color: palette.bad, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
          Erreur de chargement
        </Text>
        <Text style={{ color: palette.inkSoft, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
          Impossible de charger les salons
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          activeOpacity={0.8}
          style={{ paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, backgroundColor: palette.primary }}
        >
          <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 15 }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const activeRoom = recentRooms.find((r) => r.hasActiveSession) || null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppTopBar title="Xalaat" tag="SALONS & JEUX" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={palette.primary} />}
      >
        {/* Header Title */}
        <View style={{ marginVertical: 4 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 28,
              lineHeight: 38,
              letterSpacing: -0.5,
              color: palette.txt,
              paddingTop: 6,
              marginBottom: 4,
            }}
          >
            Hub des <Text style={{ color: palette.primary }}>salons</Text>
          </Text>
          <Text style={{ fontSize: 13.5, color: palette.inkSoft, lineHeight: 18 }}>
            Tes buzzers sont prêts. Prêt à tester ta stratégie ?
          </Text>
        </View>

        {/* Active Session Banner */}
        {activeSessionInfo && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: 'rgba(232, 166, 48, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 18 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: palette.gold }}>
                  Session en cours #{activeSessionInfo.code || 'ACTIVE'}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt, marginTop: 2 }} numberOfLines={1}>
                  Une partie est toujours active !
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleReconnectSession}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.primary,
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 9999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ color: palette.primaryInk, fontSize: 12.5, fontWeight: '700' }}>Rejoindre</Text>
              <ArrowRight size={14} color={palette.primaryInk} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Action Cards */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Nouveau salon Card */}
          <TouchableOpacity
            onPress={() => router.push('/room/create' as any)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: palette.primary,
              borderRadius: 24,
              padding: 18,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 120,
              justifyContent: 'space-between',
              shadowColor: palette.primary,
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <PatternZigzag color="#FFFFFF" opacity={0.18} size={18} />
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} color="#FFFFFF" />
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 16,
                letterSpacing: -0.2,
                color: palette.primaryInk,
              }}
            >
              Nouveau salon
            </Text>
          </TouchableOpacity>

          {/* Rejoindre Card */}
          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              minHeight: 120,
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 1.5,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={16} color={palette.primary} />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 16,
                  letterSpacing: -0.2,
                  color: palette.txt,
                }}
              >
                Rejoindre
              </Text>
              <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>
                scan &amp; code
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Global Rank Card */}
        <GlobalRankCard rank={rank || 154} />

        {/* Quiz Of The Day Card */}
        <QuizOfTheDayCard activeRoom={activeRoom} />

        {/* Rooms Section Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 18.5,
                letterSpacing: -0.3,
                color: palette.txt,
              }}
            >
              Mes Salons ({recentRooms.length})
            </Text>
            <Text style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>
              Rejoins et consulte les détails de tes salons
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAllRoomsModal(true)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: 'rgba(232, 166, 48, 0.15)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: palette.primary }}>
              Tous les salons →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rooms List */}
        {recentRooms.length > 0 ? (
          <View style={{ gap: 10 }}>
            {recentRooms.slice(0, 3).map((room) => (
              <TouchableOpacity
                key={room.id}
                onPress={() => router.push(`/room/${room.id}` as any)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
                    <Avatar name={room.ownerName} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 16,
                          color: palette.txt,
                        }}
                        numberOfLines={1}
                      >
                        {room.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>
                        Par {room.ownerName} · {room.memberCount} membres
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 9999,
                      backgroundColor: room.hasActiveSession ? 'rgba(232, 166, 48, 0.15)' : palette.surface2,
                      borderWidth: room.hasActiveSession ? 1 : 0,
                      borderColor: palette.gold,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: room.hasActiveSession ? palette.gold : palette.inkSoft,
                      }}
                    >
                      {room.hasActiveSession ? '⚡ En cours' : `#${room.code}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: palette.inkSoft, fontSize: 13.5, textAlign: 'center' }}>
              Tu n&apos;as pas encore rejoint de salon. Crée un salon ou rejoins-en un avec un code !
            </Text>
          </View>
        )}
      </ScrollView>

      {/* All Rooms Modal */}
      <AllRoomsModal
        visible={showAllRoomsModal}
        onClose={() => setShowAllRoomsModal(false)}
        rooms={recentRooms}
      />

      {/* Join Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade" onRequestClose={() => setShowJoinModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 20, color: palette.txt }}>
                Rejoindre
              </Text>
              <TouchableOpacity
                onPress={() => setShowJoinModal(false)}
                activeOpacity={0.7}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: palette.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={palette.txt} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: palette.bg, borderRadius: 14, padding: 12, marginBottom: 14 }}>
              <Text style={{ color: palette.inkSoft, fontSize: 12.5, textAlign: 'center', lineHeight: 18 }}>
                Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.
              </Text>
            </View>

            <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>
              Code secret
            </Text>

            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              placeholder="Ex : ABC123"
              placeholderTextColor={palette.inkSoft}
              maxLength={20}
              autoCapitalize="characters"
              autoCorrect={false}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: joinError ? palette.bad : palette.line,
                paddingVertical: 14,
                paddingHorizontal: 16,
                fontSize: 20,
                fontFamily: font.nativeFamily.display,
                color: palette.txt,
                textAlign: 'center',
                letterSpacing: 2,
                marginBottom: joinError ? 8 : 16,
              }}
            />

            {joinError ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, paddingHorizontal: 4 }}>
                <X size={14} color={palette.bad} />
                <Text style={{ color: palette.bad, fontSize: 12, fontWeight: '600', flex: 1 }}>
                  {joinError}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => handleJoinCode(code)}
              disabled={isJoining || !code.trim()}
              activeOpacity={0.85}
              style={{
                backgroundColor: isJoining || !code.trim() ? palette.surface2 : palette.primary,
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color={palette.primaryInk} />
              ) : (
                <Text
                  style={{
                    color: isJoining || !code.trim() ? palette.inkSoft : palette.primaryInk,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  Rejoindre
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowJoinModal(false);
                setShowScanner(true);
              }}
              activeOpacity={0.7}
              style={{ alignItems: 'center', paddingVertical: 4 }}
            >
              <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 13 }}>
                ▦ Scanner un QR code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={async (scannedCode) => {
          setShowScanner(false);
          setCode(scannedCode);
          setShowJoinModal(true);
        }}
      />
    </View>
  );
}
