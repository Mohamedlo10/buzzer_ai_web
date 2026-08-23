import { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Search, Users, Plus, ArrowRight, Sparkles } from 'lucide-react-native';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { Avatar } from './Avatar';
import type { LastRoom } from '~/types/api';

interface AllRoomsModalProps {
  visible: boolean;
  onClose: () => void;
  rooms: LastRoom[];
}

export function AllRoomsModal({ visible, onClose, rooms }: AllRoomsModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active'>('all');

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchActive = selectedFilter === 'all' || r.hasActiveSession;
      return matchSearch && matchActive;
    });
  }, [rooms, search, selectedFilter]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: palette.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 20,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 20, color: palette.txt }}>
              Tous les salons ({rooms.length})
            </Text>
            <TouchableOpacity
              onPress={onClose}
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
              <X size={18} color={palette.txt} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.line,
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Search size={18} color={palette.inkSoft} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un salon ou un hôte..."
              placeholderTextColor={palette.inkSoft}
              style={{ flex: 1, color: palette.txt, fontSize: 14 }}
            />
          </View>

          {/* Filter Pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => setSelectedFilter('all')}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 9999,
                backgroundColor: selectedFilter === 'all' ? palette.primary : palette.surface2,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: selectedFilter === 'all' ? palette.primaryInk : palette.txt,
                }}
              >
                Tous ({rooms.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedFilter('active')}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 9999,
                backgroundColor: selectedFilter === 'active' ? palette.primary : palette.surface2,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: selectedFilter === 'active' ? palette.primaryInk : palette.txt,
                }}
              >
                En cours (⚡)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rooms List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            {filteredRooms.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Aucun salon trouvé</Text>
              </View>
            ) : (
              filteredRooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  onPress={() => {
                    onClose();
                    router.push(`/room/${room.id}` as any);
                  }}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: palette.line,
                    padding: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Avatar name={room.ownerName} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: font.nativeFamily.display,
                            fontSize: 15,
                            color: palette.txt,
                          }}
                          numberOfLines={1}
                        >
                          {room.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: palette.inkSoft }}>
                          Par {room.ownerName} · {room.memberCount} membres
                        </Text>
                      </View>
                    </View>

                    {room.hasActiveSession ? (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 9999,
                          backgroundColor: 'rgba(232, 166, 48, 0.15)',
                          borderWidth: 1,
                          borderColor: palette.gold,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold }}>
                          ⚡ En direct
                        </Text>
                      </View>
                    ) : (
                      <ArrowRight size={16} color={palette.inkSoft} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
