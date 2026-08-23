import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, AlertCircle, LogOut, Trash2, PenLine } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import type { SessionResponse } from '~/types/api';

export interface ManagerPanelProps {
  session: SessionResponse;
  code: string;
  isStarting: boolean;
  canStart: boolean;
  isDeletingSession: boolean;
  onNavigateToQuestions: () => void;
  onManagerStartClick: () => void;
  onLeave: () => void;
  onDeleteSession: () => void;
}

export function ManagerPanel({
  session,
  code,
  isStarting,
  canStart,
  isDeletingSession,
  onNavigateToQuestions,
  onManagerStartClick,
  onLeave,
  onDeleteSession,
}: ManagerPanelProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      {/* Manual questions configuration button */}
      {session.questionMode === 'MANUAL' && (
        <TouchableOpacity
          onPress={onNavigateToQuestions}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: palette.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.gold,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 10,
          }}
        >
          <PenLine size={16} color={palette.gold} />
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.txt }}>
            Configurer les questions manuelles
          </Text>
        </TouchableOpacity>
      )}

      {/* Primary Launch Game Button */}
      <TouchableOpacity
        onPress={onManagerStartClick}
        disabled={isStarting || !canStart}
        activeOpacity={0.85}
        style={{
          height: 56,
          borderRadius: 18,
          backgroundColor: canStart && !isStarting ? palette.primary : palette.surface2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          shadowColor: palette.primary,
          shadowOpacity: canStart && !isStarting ? 0.35 : 0,
          shadowRadius: 10,
          elevation: canStart && !isStarting ? 4 : 0,
          marginBottom: 8,
        }}
      >
        {isStarting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={palette.primaryInk} />
            <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 16 }}>
              Démarrage en cours...
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Play size={20} color={canStart ? palette.primaryInk : palette.inkSoft} fill="currentColor" />
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 16,
                lineHeight: 22,
                color: canStart ? palette.primaryInk : palette.inkSoft,
                paddingTop: 2,
              }}
            >
              LANCER LA PARTIE
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Minimum players notice */}
      {!canStart && !isStarting && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <AlertCircle size={13} color={palette.bad} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: palette.bad }}>
            Minimum 2 joueurs requis pour lancer
          </Text>
        </View>
      )}

      {/* Leave and Delete buttons */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity
          onPress={onLeave}
          activeOpacity={0.7}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 14,
            backgroundColor: `${palette.bad}14`,
            borderWidth: 1,
            borderColor: `${palette.bad}33`,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <LogOut size={15} color={palette.bad} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: palette.bad }}>
            Quitter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDeleteSession}
          disabled={isDeletingSession}
          activeOpacity={0.7}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 14,
            backgroundColor: `${palette.bad}14`,
            borderWidth: 1,
            borderColor: `${palette.bad}33`,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isDeletingSession ? (
            <ActivityIndicator size="small" color={palette.bad} />
          ) : (
            <Trash2 size={15} color={palette.bad} />
          )}
          <Text style={{ fontSize: 13, fontWeight: '700', color: palette.bad }}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
