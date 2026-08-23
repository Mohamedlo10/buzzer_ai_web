import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, FolderPlus, Sparkles, Plus, Minus, ArrowRight, AlertCircle } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as roomsApi from '~/lib/api/rooms';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { FormInput } from '~/components/shared/FormInput';
import { notify, notifyApiError } from '~/lib/ui/notify';

export default function CreateRoomScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const PLAYER_PRESETS = [10, 25, 50, 100, 250];

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Le nom du salon est requis');
      }
      if (trimmedName.length < 3) {
        throw new Error('Le nom doit contenir au moins 3 caractères');
      }

      return await roomsApi.createRoom({
        name: trimmedName,
        description: description.trim() || undefined,
        maxPlayers,
      });
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      notify.success('Salon créé avec succès !');
      router.replace(`/room/${room.id}` as any);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la création du salon';
      setError(msg);
      notifyApiError(err, 'Impossible de créer le salon');
    },
  });

  const handleCreate = () => {
    setError(null);
    createRoomMutation.mutate();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 20,
              lineHeight: 26,
              color: palette.txt,
              paddingTop: 4,
            }}
          >
            Nouveau salon
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 13,
              color: palette.inkSoft,
            }}
          >
            Crée un espace permanent pour tes parties
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            maxWidth: 500,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Icon */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: `${palette.primary}1A`,
                borderWidth: 1,
                borderColor: `${palette.primary}33`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <FolderPlus size={32} color={palette.primary} />
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 22,
                lineHeight: 30,
                color: palette.txt,
                textAlign: 'center',
                paddingTop: 2,
              }}
            >
              Personnalise ton salon
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
              marginBottom: 20,
            }}
          >
            {/* Room Name Input */}
            <FormInput
              label="Nom du salon *"
              leftIcon={FolderPlus}
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              placeholder="Ex : Soirée Quiz, Champions du Web…"
              maxLength={50}
              autoFocus
            />

            {/* Max Players Selector */}
            <View style={{ marginBottom: 18, marginTop: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  paddingHorizontal: 2,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }}>
                  Nombre max de joueurs
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${palette.primary}18`,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 9999,
                    gap: 4,
                  }}
                >
                  <Users size={13} color={palette.primary} />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: palette.primary }}>
                    {maxPlayers} joueurs
                  </Text>
                </View>
              </View>

              {/* Preset Chips */}
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                {PLAYER_PRESETS.map((preset) => {
                  const isSelected = maxPlayers === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setMaxPlayers(preset)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isSelected ? palette.primary : palette.bg,
                        borderWidth: 1,
                        borderColor: isSelected ? palette.primary : palette.line,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: isSelected ? palette.primaryInk : palette.txt,
                        }}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description Textarea */}
            <View style={{ marginTop: 4, width: '100%', position: 'relative' }}>
              <View
                style={{
                  position: 'absolute',
                  top: -9,
                  left: 14,
                  backgroundColor: palette.surface,
                  paddingHorizontal: 6,
                  zIndex: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.inkSoft }}>
                  Description (optionnel)
                </Text>
              </View>

              <View
                style={{
                  borderRadius: 14,
                  backgroundColor: palette.bg,
                  borderWidth: 1.5,
                  borderColor: palette.line,
                  padding: 12,
                  minHeight: 88,
                }}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Décris les thèmes ou règles de ton salon…"
                  placeholderTextColor={inkAlpha.faint}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  style={{
                    fontSize: 14,
                    color: palette.txt,
                    textAlignVertical: 'top',
                    minHeight: 64,
                    padding: 0,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: `${palette.bad}18`,
                borderWidth: 1,
                borderColor: `${palette.bad}33`,
                borderRadius: 14,
                padding: 12,
                marginBottom: 18,
              }}
            >
              <AlertCircle size={16} color={palette.bad} />
              <Text style={{ color: palette.bad, fontSize: 13, fontWeight: '600', flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createRoomMutation.isPending || !name.trim()}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: createRoomMutation.isPending || !name.trim() ? palette.surface2 : palette.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: palette.primary,
              shadowOpacity: createRoomMutation.isPending || !name.trim() ? 0 : 0.3,
              shadowRadius: 8,
              elevation: createRoomMutation.isPending || !name.trim() ? 0 : 3,
            }}
          >
            {createRoomMutation.isPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={palette.primaryInk} />
                <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                  Création du salon...
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: !name.trim() ? palette.inkSoft : palette.primaryInk, fontWeight: '700', fontSize: 16, marginRight: 8 }}>
                  Créer le salon
                </Text>
                <ArrowRight size={18} color={!name.trim() ? palette.inkSoft : palette.primaryInk} />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
